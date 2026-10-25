// licenseMobile.ts — APK (Capacitor) için hesap+cihaz bağlı lisans sistemi.
// license-native/src/license.cc'deki native mantığın saf-JS portu:
// anahtar hesaba (payload[2..10]) ve cihaza (payload[10..14]) bağlı,
// ilk aktivasyonda root code zorunlu, seq replay korumalı.
// Durum kodları constants.h ile birebir aynı sayılardır (UI aynı mesajları gösterir).

import nacl from 'tweetnacl';
import { Preferences } from '@capacitor/preferences';
import type { LicenseInfo, LicenseStatus } from '../types/license';
import {
  appendCRC,
  base32Decode,
  base32Encode,
  buildPayload,
  bytesEqual,
  bytesToHex,
  checkCRC,
  concatBytes,
  decodeAccountId,
  formatAccountId,
  hexToBytes,
  normalizeInput,
  unpackPayload,
  utf8Bytes,
} from './licenseMobileCodec';

// ── Durum kodları (license-native/src/constants.h ile aynı) ─────────────────
export const STATUS = {
  OK: 1,
  INVALID: 0,
  EXPIRED: -1,
  DEVICE_MISMATCH: -2,
  CLOCK_ROLLBACK: -3,
  REPLAYED: -4,
  NOT_ACTIVATED: -5,
  BAD_INPUT: -6,
  KEY_EXPIRED: -7,
  ACCOUNT_MISMATCH: -8,
  STORAGE_ERROR: -9,
  NEED_ROOT: -10,
  STATE_TAMPERED: -11,
} as const;

// ── Sabitler (constants.h) ───────────────────────────────────────────────────
const PLAN_CUSTOM = 255;
const PLAN_CLOCK_RESET = 0;
const PLAN_DAYS: Record<number, number> = { 0: 0, 1: 30, 2: 90, 3: 180, 4: 365 };
const FLAG_EXTEND = 1 << 0;
const FLAG_CLOCK_RESET = 1 << 2;
const GRACE_DAYS = 3;
const CLOCK_TOLERANCE = 86400; // 1 gün
const CLOCK_BACK_TOL = 6 * 3600;

// Admin public key (license-native/src/public_keys.h, keyId 0) — sabit gömülü
const MOBILE_PUBLIC_KEY = new Uint8Array([
  0x33, 0x97, 0x24, 0x79, 0x1e, 0xcf, 0xfc, 0x19, 0xdf, 0xc5, 0x50, 0x95, 0x3a, 0xfb, 0x24, 0xac,
  0x3f, 0x93, 0x5b, 0xdd, 0x24, 0x14, 0x7a, 0x07, 0x61, 0x51, 0x30, 0x76, 0xff, 0xc0, 0xf2, 0x79,
]);

let activePublicKey: Uint8Array = MOBILE_PUBLIC_KEY;

/** YALNIZCA testler için: bilinen vektör üretmek amacıyla public key değiştirilebilir. */
export function setMobilePublicKeyForTests(key: Uint8Array | null): void {
  activePublicKey = key ?? MOBILE_PUBLIC_KEY;
}

// ── Saklama ─────────────────────────────────────────────────────────────────
// Kayıtlar @capacitor/preferences'ta tutulur (cihaza özel, sync'e KATILMAZ).
// PouchDB 'license' belgesi yaklaşımı seçilmedi: hesap DB'si şifreli ve parola
// lisanstan türetiliyor (dbEncryption) — lisansı o DB'de saklamak döngüsel
// bağımlılık yaratırdı. Preferences cihaz-lokal ve şifreleme yolundan bağımsız.
//
// Cihaz anchor'ı: ilk çalıştırmada üretilen kalıcı UUID'nin SHA-256 ilk 4 byte'ı.
// Uygulama kaldırılırsa UUID silinir → yeni kurulum YENİ CİHAZ sayılır
// (rebind anahtarı gerekir). Bu bilinçli bir tercih; @capacitor/device kurulu değil.

const DEVICE_UUID_KEY = 'bh.device.uuid';
const RECORD_KEY_PREFIX = 'bh.license.';

interface MobileLicenseRecord {
  accountIdHex: string;
  hasRootSig: boolean;
  rootSigHex?: string;
  activated: boolean;
  expiry: number;
  lastSequence: number;
  plan: number;
  features: number;
  maxRegisters: number;
  lastSeen: number;
}

async function loadRecord(licenseId: string): Promise<MobileLicenseRecord | null> {
  try {
    const { value } = await Preferences.get({ key: RECORD_KEY_PREFIX + licenseId });
    if (!value) return null;
    const rec = JSON.parse(value) as MobileLicenseRecord;
    return typeof rec.accountIdHex === 'string' ? rec : null;
  } catch {
    return null;
  }
}

async function saveRecord(licenseId: string, rec: MobileLicenseRecord): Promise<boolean> {
  try {
    await Preferences.set({ key: RECORD_KEY_PREFIX + licenseId, value: JSON.stringify(rec) });
    return true;
  } catch {
    return false;
  }
}

// ── Cihaz anchor'ı ───────────────────────────────────────────────────────────

function randomUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Eski WebView yedeği
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  b[6] = (b[6] & 0x0F) | 0x40;
  b[8] = (b[8] & 0x3F) | 0x80;
  const h = bytesToHex(b);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

async function getDeviceUuid(): Promise<string> {
  const { value } = await Preferences.get({ key: DEVICE_UUID_KEY });
  if (value) return value;
  const uuid = randomUuid();
  await Preferences.set({ key: DEVICE_UUID_KEY, value: uuid });
  return uuid;
}

/** SHA-256(UUID) ilk 4 byte — native ComputeDeviceAnchor'ın mobil karşılığı. */
export async function getMobileDeviceAnchor(): Promise<Uint8Array> {
  const uuid = await getDeviceUuid();
  const digest = await crypto.subtle.digest('SHA-256', utf8Bytes(uuid));
  return new Uint8Array(digest).slice(0, 4);
}

// ── Hesap kimliği ────────────────────────────────────────────────────────────

/** Yeni Hesap ID üret (native createAccountId'nin mobil karşılığı). */
export function createMobileLicenseId(): string {
  const raw = new Uint8Array(8);
  crypto.getRandomValues(raw);
  return formatAccountId(raw);
}

// ── Talep kodu ───────────────────────────────────────────────────────────────

/** accountId(8) || deviceAnchor(4) → 20 Base32 + 4 CRC = 24 karakter. */
export async function getMobileRequestCode(licenseId: string | undefined): Promise<string | null> {
  if (!licenseId) return null;
  const accountId = decodeAccountId(licenseId);
  if (!accountId) return null;
  const anchor = await getMobileDeviceAnchor();
  return appendCRC(base32Encode(concatBytes(accountId, anchor)));
}

// ── Root code ────────────────────────────────────────────────────────────────

/** sign("root-v1" || accountId) doğrula ve hesaba kaydet. Durum kodu döner. */
export async function setMobileRootCode(
  licenseId: string | undefined,
  rootCode: string
): Promise<number> {
  if (!licenseId) return STATUS.BAD_INPUT;
  const accountId = decodeAccountId(licenseId);
  if (!accountId) return STATUS.BAD_INPUT;

  const normalized = normalizeInput(rootCode);
  if (normalized.length !== 107) return STATUS.BAD_INPUT;
  if (!checkCRC(normalized)) return STATUS.INVALID;

  const sig = base32Decode(normalized.slice(0, 103));
  if (!sig || sig.length !== 64) return STATUS.INVALID;

  const msg = concatBytes(utf8Bytes('root-v1'), accountId);
  if (!nacl.sign.detached.verify(msg, sig, activePublicKey)) return STATUS.INVALID;

  const existing = await loadRecord(licenseId);
  const rec: MobileLicenseRecord = existing ?? {
    accountIdHex: bytesToHex(accountId),
    hasRootSig: false,
    activated: false,
    expiry: 0,
    lastSequence: 0,
    plan: 0,
    features: 0,
    maxRegisters: 0,
    lastSeen: 0,
  };
  rec.hasRootSig = true;
  rec.rootSigHex = bytesToHex(sig);

  if (!(await saveRecord(licenseId, rec))) return STATUS.STORAGE_ERROR;
  return STATUS.OK;
}

// ── Aktivasyon ───────────────────────────────────────────────────────────────

/** Lisans anahtarını aktive et. Durum kodu döner (constants.h ile aynı). */
export async function activateMobileLicense(
  licenseId: string | undefined,
  key: string
): Promise<number> {
  if (!licenseId) return STATUS.BAD_INPUT;
  const accountId = decodeAccountId(licenseId);
  if (!accountId) return STATUS.BAD_INPUT;

  const normalized = normalizeInput(key);
  if (normalized.length !== 160) return STATUS.BAD_INPUT;
  if (!checkCRC(normalized)) return STATUS.INVALID;

  const raw = base32Decode(normalized.slice(0, 156));
  if (!raw || raw.length !== 97) return STATUS.INVALID;

  const payload = raw.slice(0, 33);
  const sig = raw.slice(33, 97);
  const p = unpackPayload(payload);

  if (p.version !== 1) return STATUS.INVALID;
  if (p.keyId !== 0) return STATUS.INVALID; // mobilde tek gömülü anahtar (keyId 0)
  if (!nacl.sign.detached.verify(payload, sig, activePublicKey)) return STATUS.INVALID;

  // Hesap eşleşmesi
  if (!bytesEqual(p.accountId, accountId)) return STATUS.ACCOUNT_MISMATCH;

  // Cihaz eşleşmesi
  const myAnchor = await getMobileDeviceAnchor();
  if (!bytesEqual(p.deviceAnchor, myAnchor)) return STATUS.DEVICE_MISMATCH;

  // Zaman kontrolleri
  const now = Math.floor(Date.now() / 1000);
  if (now > p.activateBy) return STATUS.KEY_EXPIRED;
  if (now < p.issuedAt && p.issuedAt - now > CLOCK_TOLERANCE) return STATUS.CLOCK_ROLLBACK;

  const rec = await loadRecord(licenseId);
  const hasActivated = !!rec?.activated;

  // İlk aktivasyonda root sig zorunlu
  if (!hasActivated && !rec?.hasRootSig) return STATUS.NEED_ROOT;

  // Replay koruması
  if (hasActivated && p.sequence <= rec.lastSequence) return STATUS.REPLAYED;

  // Clock-reset özel işlem
  if (p.plan === PLAN_CLOCK_RESET && (p.flags & FLAG_CLOCK_RESET)) {
    if (hasActivated && rec) {
      rec.lastSeen = now;
      rec.lastSequence = p.sequence;
      if (!(await saveRecord(licenseId, rec))) return STATUS.STORAGE_ERROR;
    }
    return STATUS.OK;
  }

  // Saat geri alma kontrolü
  if (hasActivated && rec && now + CLOCK_BACK_TOL < rec.lastSeen) return STATUS.CLOCK_ROLLBACK;

  // Süre hesaplama (extend: mevcut sürenin üstüne ekler)
  const days = p.plan === PLAN_CUSTOM ? p.durationDays : (PLAN_DAYS[p.plan] ?? 0);
  const start = (p.flags & FLAG_EXTEND) && hasActivated && rec && rec.expiry > now ? rec.expiry : now;
  const expiry = start + days * 86400;

  const next: MobileLicenseRecord = {
    accountIdHex: bytesToHex(accountId),
    hasRootSig: true,
    rootSigHex: rec?.rootSigHex,
    activated: true,
    expiry,
    lastSequence: p.sequence,
    plan: p.plan,
    features: p.features,
    maxRegisters: p.maxRegisters,
    lastSeen: now,
  };

  if (!(await saveRecord(licenseId, next))) return STATUS.STORAGE_ERROR;
  return STATUS.OK;
}

// ── Lisans bilgisi ───────────────────────────────────────────────────────────

/** Kayıttan LicenseInfo döndürür (native checkLicense'in mobil karşılığı). */
export async function getMobileLicenseInfo(licenseId: string | undefined): Promise<LicenseInfo> {
  if (!licenseId || !decodeAccountId(licenseId)) {
    return { accountId: licenseId ?? '', status: STATUS.BAD_INPUT as LicenseStatus };
  }

  const rec = await loadRecord(licenseId);
  if (!rec || !rec.activated) {
    return { accountId: licenseId, status: STATUS.NOT_ACTIVATED as LicenseStatus };
  }

  const now = Math.floor(Date.now() / 1000);
  const graceUntil = rec.expiry + GRACE_DAYS * 86400;
  const daysLeft = rec.expiry > now ? Math.floor((rec.expiry - now) / 86400) : 0;

  let status: number = STATUS.OK;
  if (now + CLOCK_BACK_TOL < rec.lastSeen) {
    status = STATUS.CLOCK_ROLLBACK;
  } else if (now > graceUntil) {
    // Grace (3 gün) dahil süre tamamen doldu (native InternalFullLicenseCheck ile aynı)
    status = STATUS.EXPIRED;
  }

  return {
    accountId: licenseId,
    status: status as LicenseStatus,
    expiry: rec.expiry,
    daysLeft,
    plan: rec.plan,
    features: rec.features,
    maxRegisters: rec.maxRegisters,
    graceUntil,
  };
}

// Testlerin admin tarafını (createKey) taklit edebilmesi için codec parçalarını
// buradan da dışa açıyoruz — üretim kodu bunları doğrudan codec modülünden alır.
export { buildPayload };
