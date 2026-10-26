// licenseMobile.test.ts — APK lisans sistemi codec + verifier testleri.
// Bilinen-vektör yaklaşımı: test içinde tweetnacl ile bir keypair üretilir,
// license-core.js'in createKey/generateRootCode mantığı birebir taklit edilip
// imzalı anahtar + root code üretilir; mobil verifier'ın kararları doğrulanır.
import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest';
import nacl from 'tweetnacl';
import { Preferences } from '@capacitor/preferences';
import {
  appendCRC,
  base32Decode,
  base32Encode,
  buildPayload,
  checkCRC,
  concatBytes,
  decodeAccountId,
  formatAccountId,
  normalizeInput,
  unpackPayload,
  utf8Bytes,
} from '../../src/utils/licenseMobileCodec';
import {
  STATUS,
  deriveMobileLicenseKey,
  activateMobileLicense,
  createMobileLicenseId,
  getMobileDeviceAnchor,
  getMobileLicenseInfo,
  getMobileRequestCode,
  setMobilePublicKeyForTests,
  setMobileRootCode,
} from '../../src/utils/licenseMobile';

// jsdom'da crypto.subtle eksik olabilir — Node webcrypto ile tamamla.
beforeAll(async () => {
  if (!globalThis.crypto?.subtle) {
    const { webcrypto } = await import('node:crypto');
    Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });
  }
});

// ── Admin tarafı taklidi (license-core.js createKey / generateRootCode) ─────
const kp = nacl.sign.keyPair();

interface KeyParams {
  accountId: Uint8Array;
  deviceAnchor: Uint8Array;
  plan: number;
  seq: number;
  flags?: number;
  features?: number;
  maxRegisters?: number;
  issuedAt?: number;
  activateBy?: number;
  durationDays?: number;
}

function makeKey(p: KeyParams, secretKey: Uint8Array = kp.secretKey): string {
  const now = Math.floor(Date.now() / 1000);
  const payload = buildPayload({
    keyId: 0,
    accountId: p.accountId,
    deviceAnchor: p.deviceAnchor,
    plan: p.plan,
    flags: p.flags ?? 0x01,
    features: p.features ?? 0x3F,
    maxRegisters: p.maxRegisters ?? 0,
    seq: p.seq,
    issuedAt: p.issuedAt ?? now,
    activateBy: p.activateBy ?? now + 14 * 86400,
    durationDays: p.durationDays ?? 0,
  });
  const sig = nacl.sign.detached(payload, secretKey);
  return appendCRC(base32Encode(concatBytes(payload, sig)));
}

function makeRootCode(accountId: Uint8Array, secretKey: Uint8Array = kp.secretKey): string {
  const sig = nacl.sign.detached(concatBytes(utf8Bytes('root-v1'), accountId), secretKey);
  return appendCRC(base32Encode(sig));
}

function freshAccount(): { licenseId: string; accountId: Uint8Array } {
  const licenseId = createMobileLicenseId();
  const accountId = decodeAccountId(licenseId)!;
  return { licenseId, accountId };
}

beforeEach(async () => {
  await Preferences.clear();
  setMobilePublicKeyForTests(kp.publicKey);
});

afterAll(() => {
  setMobilePublicKeyForTests(null);
});

// ── Codec roundtrip ──────────────────────────────────────────────────────────

describe('licenseMobileCodec — roundtrip', () => {
  it('base32 encode/decode roundtrip', () => {
    const bytes = new Uint8Array([0, 1, 127, 128, 255, 66]);
    const decoded = base32Decode(base32Encode(bytes));
    expect(decoded).not.toBeNull();
    expect(Array.from(decoded!)).toEqual(Array.from(bytes));
  });

  it('base32Decode geçersiz karakterde null döner', () => {
    expect(base32Decode('AB*C')).toBeNull();
  });

  it('appendCRC/checkCRC tutarlı, bozuk kod reddedilir', () => {
    const code = appendCRC('0123ABCD');
    expect(checkCRC(code)).toBe(true);
    expect(checkCRC(code.slice(0, -1) + 'Z')).toBe(false);
    expect(checkCRC('ABC')).toBe(false);
  });

  it('normalizeInput: boşluk/tire atılır, O→0, I/L→1', () => {
    expect(normalizeInput('abcd-efgh ijkl')).toBe('ABCDEFGH1JK1');
    expect(normalizeInput('OIL')).toBe('011');
    // Referans codec.js ile birebir: alfanumerik olmayan (Kiril dahil) karakterler atılır
    expect(normalizeInput('АВС xOIL')).toBe('X011');
  });

  it('accountId format/decode roundtrip', () => {
    const raw = new Uint8Array(8);
    crypto.getRandomValues(raw);
    const formatted = formatAccountId(raw);
    expect(formatted).toMatch(/^[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{2}$/);
    const decoded = decodeAccountId(formatted);
    expect(decoded).not.toBeNull();
    expect(Array.from(decoded!)).toEqual(Array.from(raw));
  });

  it('decodeAccountId bozuk kontrol simgesini reddeder', () => {
    const raw = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
    const formatted = formatAccountId(raw);
    const clean = formatted.replace(/-/g, '');
    // Son karakteri değiştir
    const last = clean[13] === '0' ? '1' : '0';
    expect(decodeAccountId(clean.slice(0, 13) + last)).toBeNull();
    expect(decodeAccountId('KISA')).toBeNull();
  });

  it('payload pack/unpack roundtrip (offset tablosu)', () => {
    const accountId = new Uint8Array([10, 20, 30, 40, 50, 60, 70, 80]);
    const anchor = new Uint8Array([1, 2, 3, 4]);
    const payload = buildPayload({
      keyId: 0,
      accountId,
      deviceAnchor: anchor,
      plan: 2,
      flags: 1,
      features: 0x3F,
      maxRegisters: 3,
      seq: 12345,
      issuedAt: 1700000000,
      activateBy: 1701000000,
      durationDays: 0,
    });
    expect(payload.length).toBe(33);
    const p = unpackPayload(payload);
    expect(p.version).toBe(1);
    expect(p.keyId).toBe(0);
    expect(Array.from(p.accountId)).toEqual(Array.from(accountId));
    expect(Array.from(p.deviceAnchor)).toEqual(Array.from(anchor));
    expect(p.plan).toBe(2);
    expect(p.flags).toBe(1);
    expect(p.features).toBe(0x3F);
    expect(p.maxRegisters).toBe(3);
    expect(p.sequence).toBe(12345);
    expect(p.issuedAt).toBe(1700000000);
    expect(p.activateBy).toBe(1701000000);
    expect(p.durationDays).toBe(0);
  });
});

// ── Referans codec ile çapraz doğrulama (license-native/admin/core/codec.js) ─

describe('codec çapraz doğrulama (Node referans implementasyonu)', () => {
  it('formatAccountId/base32/appendCRC referansla birebir aynı', async () => {
    const ref = (await import('../../license-native/admin/core/codec.js')) as any;
    const raw = new Uint8Array([200, 100, 50, 25, 12, 6, 3, 1]);
    expect(formatAccountId(raw)).toBe(ref.formatAccountId(Buffer.from(raw)));
    expect(base32Encode(raw)).toBe(ref.base32Encode(Buffer.from(raw)));
    expect(appendCRC('0123ABCD')).toBe(ref.appendCRC('0123ABCD'));
    const payload = buildPayload({
      accountId: raw,
      deviceAnchor: new Uint8Array([9, 8, 7, 6]),
      plan: 4,
      seq: 7,
      issuedAt: 1700000000,
      activateBy: 1701000000,
    });
    expect(ref.unpackPayload(Buffer.from(payload)).sequence).toBe(7);
  });
});

// ── Mobil verifier (bilinen vektörler) ───────────────────────────────────────

describe('licenseMobile — aktivasyon akışı', () => {
  it('talep kodu 24 karakter, CRC geçerli, hesap+cihaz içerir', async () => {
    const { licenseId, accountId } = freshAccount();
    const code = await getMobileRequestCode(licenseId);
    expect(code).not.toBeNull();
    expect(code!.length).toBe(24);
    expect(checkCRC(code!)).toBe(true);
    const decoded = base32Decode(code!.slice(0, 20))!;
    expect(Array.from(decoded.slice(0, 8))).toEqual(Array.from(accountId));
    const anchor = await getMobileDeviceAnchor();
    expect(Array.from(decoded.slice(8, 12))).toEqual(Array.from(anchor));
  });

  it('root code olmadan ilk aktivasyon NEED_ROOT döner', async () => {
    const { licenseId, accountId } = freshAccount();
    const anchor = await getMobileDeviceAnchor();
    const key = makeKey({ accountId, deviceAnchor: anchor, plan: 1, seq: 1 });
    expect(await activateMobileLicense(licenseId, key)).toBe(STATUS.NEED_ROOT);
  });

  it('geçerli root code kabul, bozuk root code INVALID', async () => {
    const { licenseId, accountId } = freshAccount();
    expect(await setMobileRootCode(licenseId, makeRootCode(accountId))).toBe(STATUS.OK);
    // Başka hesap için üretilmiş root code → imza uymaz
    const other = freshAccount();
    expect(await setMobileRootCode(licenseId, makeRootCode(other.accountId))).toBe(STATUS.INVALID);
    expect(await setMobileRootCode(licenseId, 'KISA-KOD')).toBe(STATUS.BAD_INPUT);
  });

  it('root + geçerli anahtar → OK, info OK ve daysLeft döner', async () => {
    const { licenseId, accountId } = freshAccount();
    const anchor = await getMobileDeviceAnchor();
    expect(await setMobileRootCode(licenseId, makeRootCode(accountId))).toBe(STATUS.OK);
    const key = makeKey({ accountId, deviceAnchor: anchor, plan: 1, seq: 1 });
    expect(await activateMobileLicense(licenseId, key)).toBe(STATUS.OK);

    const info = await getMobileLicenseInfo(licenseId);
    expect(info.status).toBe(STATUS.OK);
    expect(info.plan).toBe(1);
    expect(info.features).toBe(0x3F);
    expect(info.daysLeft).toBeGreaterThanOrEqual(29);
    expect(info.daysLeft).toBeLessThanOrEqual(30);
    expect(info.accountId).toBe(licenseId);
  });

  it('aynı anahtar ikinci kez → REPLAYED', async () => {
    const { licenseId, accountId } = freshAccount();
    const anchor = await getMobileDeviceAnchor();
    await setMobileRootCode(licenseId, makeRootCode(accountId));
    const key = makeKey({ accountId, deviceAnchor: anchor, plan: 1, seq: 1 });
    expect(await activateMobileLicense(licenseId, key)).toBe(STATUS.OK);
    expect(await activateMobileLicense(licenseId, key)).toBe(STATUS.REPLAYED);
  });

  it('yanlış hesap → ACCOUNT_MISMATCH', async () => {
    const { licenseId, accountId } = freshAccount();
    const anchor = await getMobileDeviceAnchor();
    await setMobileRootCode(licenseId, makeRootCode(accountId));
    const other = freshAccount();
    const key = makeKey({ accountId: other.accountId, deviceAnchor: anchor, plan: 1, seq: 1 });
    expect(await activateMobileLicense(licenseId, key)).toBe(STATUS.ACCOUNT_MISMATCH);
  });

  it('yanlış cihaz anchorı → DEVICE_MISMATCH', async () => {
    const { licenseId, accountId } = freshAccount();
    await setMobileRootCode(licenseId, makeRootCode(accountId));
    const wrongAnchor = new Uint8Array([0xDE, 0xAD, 0xBE, 0xEF]);
    const key = makeKey({ accountId, deviceAnchor: wrongAnchor, plan: 1, seq: 1 });
    expect(await activateMobileLicense(licenseId, key)).toBe(STATUS.DEVICE_MISMATCH);
  });

  it('imzası bozuk anahtar → INVALID', async () => {
    const { licenseId, accountId } = freshAccount();
    const anchor = await getMobileDeviceAnchor();
    await setMobileRootCode(licenseId, makeRootCode(accountId));
    // Başka keypair ile imzala
    const evil = nacl.sign.keyPair();
    const key = makeKey({ accountId, deviceAnchor: anchor, plan: 1, seq: 1 }, evil.secretKey);
    expect(await activateMobileLicense(licenseId, key)).toBe(STATUS.INVALID);
    // CRC bozuk
    expect(await activateMobileLicense(licenseId, key.slice(0, -1) + 'Z')).toBe(STATUS.INVALID);
    // Uzunluk yanlış
    expect(await activateMobileLicense(licenseId, 'ABC')).toBe(STATUS.BAD_INPUT);
  });

  it('activateBy geçmiş anahtar → KEY_EXPIRED', async () => {
    const { licenseId, accountId } = freshAccount();
    const anchor = await getMobileDeviceAnchor();
    await setMobileRootCode(licenseId, makeRootCode(accountId));
    const now = Math.floor(Date.now() / 1000);
    const key = makeKey({
      accountId,
      deviceAnchor: anchor,
      plan: 1,
      seq: 1,
      issuedAt: now - 20 * 86400,
      activateBy: now - 86400,
    });
    expect(await activateMobileLicense(licenseId, key)).toBe(STATUS.KEY_EXPIRED);
  });

  it('süre + grace dolunca info EXPIRED döner', async () => {
    vi.useFakeTimers();
    try {
      const { licenseId, accountId } = freshAccount();
      const anchor = await getMobileDeviceAnchor();
      await setMobileRootCode(licenseId, makeRootCode(accountId));
      // 1 günlük custom plan
      const key = makeKey({ accountId, deviceAnchor: anchor, plan: 255, seq: 1, durationDays: 1 });
      expect(await activateMobileLicense(licenseId, key)).toBe(STATUS.OK);
      expect((await getMobileLicenseInfo(licenseId)).status).toBe(STATUS.OK);

      // 1 gün sonra: süre doldu ama grace (3 gün) içinde → hâlâ OK
      vi.setSystemTime(Date.now() + 2 * 86400 * 1000);
      const grace = await getMobileLicenseInfo(licenseId);
      expect(grace.status).toBe(STATUS.OK);
      expect(grace.daysLeft).toBe(0);

      // Grace de doldu → EXPIRED
      vi.setSystemTime(Date.now() + 3 * 86400 * 1000);
      expect((await getMobileLicenseInfo(licenseId)).status).toBe(STATUS.EXPIRED);
    } finally {
      vi.useRealTimers();
    }
  });

  it('extend bayrağı mevcut sürenin üstüne ekler', async () => {
    vi.useFakeTimers();
    try {
      const { licenseId, accountId } = freshAccount();
      const anchor = await getMobileDeviceAnchor();
      await setMobileRootCode(licenseId, makeRootCode(accountId));
      expect(await activateMobileLicense(licenseId, makeKey({ accountId, deviceAnchor: anchor, plan: 1, seq: 1 }))).toBe(STATUS.OK);
      const first = await getMobileLicenseInfo(licenseId);
      // 30 gün + 30 gün (extend) ≈ 60 gün
      expect(await activateMobileLicense(licenseId, makeKey({ accountId, deviceAnchor: anchor, plan: 1, seq: 2 }))).toBe(STATUS.OK);
      const second = await getMobileLicenseInfo(licenseId);
      expect(second.expiry!).toBeGreaterThan(first.expiry!);
      expect(second.daysLeft!).toBeGreaterThanOrEqual(59);
    } finally {
      vi.useRealTimers();
    }
  });

  it('kayıt yoksa NOT_ACTIVATED, geçersiz ID BAD_INPUT', async () => {
    const { licenseId } = freshAccount();
    expect((await getMobileLicenseInfo(licenseId)).status).toBe(STATUS.NOT_ACTIVATED);
    expect((await getMobileLicenseInfo('BOZUK-ID')).status).toBe(STATUS.BAD_INPUT);
    expect((await getMobileLicenseInfo(undefined)).status).toBe(STATUS.BAD_INPUT);
    expect(await getMobileRequestCode('BOZUK-ID')).toBeNull();
    expect(await getMobileRequestCode(undefined)).toBeNull();
  });

  it('cihaz anchorı aynı kurulumda kararlıdır', async () => {
    const a1 = await getMobileDeviceAnchor();
    const a2 = await getMobileDeviceAnchor();
    expect(Array.from(a1)).toEqual(Array.from(a2));
    expect(a1.length).toBe(4);
  });
});


describe('mobil anahtar türetme — PC algoritma uyumu', () => {
  it('lisanstan önce anahtar vermez', async () => {
    expect(await deriveMobileLicenseKey(createMobileLicenseId(), 'db')).toBeNull();
  });
  it('native SHA-512 girdisi ile aynı anahtarı üretir ve amaçları ayırır', async () => {
    const id = createMobileLicenseId(); const accountId = decodeAccountId(id)!;
    await setMobileRootCode(id, makeRootCode(accountId));
    const deviceAnchor = await getMobileDeviceAnchor();
    expect(await activateMobileLicense(id, makeKey({ accountId, deviceAnchor, plan: 1, seq: 1 }))).toBe(STATUS.OK);
    const root = nacl.sign.detached(concatBytes(utf8Bytes('root-v1'), accountId), kp.secretKey);
    const expected = new Uint8Array(await crypto.subtle.digest('SHA-512', concatBytes(utf8Bytes('lic-key-v1'), utf8Bytes('backup'), root, accountId))).slice(0,32);
    expect(await deriveMobileLicenseKey(id, 'backup')).toEqual(expected);
    expect(await deriveMobileLicenseKey(id, 'db')).not.toEqual(expected);
    expect(await deriveMobileLicenseKey(id, 'a'.repeat(65))).toBeNull();
  });
  it('bozuk root imzasıyla anahtar türetmez', async () => {
    const id = createMobileLicenseId(); const accountId = decodeAccountId(id)!;
    await setMobileRootCode(id, makeRootCode(accountId));
    expect(await activateMobileLicense(id, makeKey({ accountId, deviceAnchor: await getMobileDeviceAnchor(), plan: 1, seq: 1 }))).toBe(STATUS.OK);
    const { value } = await Preferences.get({ key: 'bh.license.' + id });
    const rec = JSON.parse(value!); rec.rootSigHex = '00'.repeat(64);
    await Preferences.set({ key: 'bh.license.' + id, value: JSON.stringify(rec) });
    expect(await deriveMobileLicenseKey(id, 'db')).toBeNull();
  });
});

const hardwareIdentity = vi.hoisted(() => ({ getId: vi.fn().mockResolvedValue({ identifier: 'abcdef0123456789' }) }));
vi.mock('@capacitor/device', () => ({ Device: hardwareIdentity }));
import { compareMobileVersions, findMobileUpdate } from '../../src/utils/mobileUpdates';

describe('kalıcı mobil kimlik ve güncelleme seçimi', () => {
  it('yeni Android kimliği sil-kur simülasyonunda aynı anchorı verir', async () => {
    const old = (window as any).Capacitor;
    (window as any).Capacitor = { isNativePlatform: () => true };
    try {
      const first = await getMobileDeviceAnchor();
      await Preferences.clear();
      const second = await getMobileDeviceAnchor();
      expect(second).toEqual(first);
      expect((await Preferences.get({ key: 'bh.device.uuid' })).value).toBe('hardware-v1:abcdef0123456789');
    } finally { (window as any).Capacitor = old; }
  });
  it('var olan UUID eski lisansı geçersiz kılmadan korunur', async () => {
    const old = (window as any).Capacitor; (window as any).Capacitor = { isNativePlatform: () => true };
    try {
      await Preferences.set({ key: 'bh.device.uuid', value: 'old-license-uuid' });
      const expected = new Uint8Array(await crypto.subtle.digest('SHA-256', utf8Bytes('old-license-uuid'))).slice(0,4);
      expect(await getMobileDeviceAnchor()).toEqual(expected);
    } finally { (window as any).Capacitor = old; }
  });
  it('ilk kimlik istekleri yarışsa da aynı anchorı alır', async () => {
    const anchors = await Promise.all(Array.from({length:10},()=>getMobileDeviceAnchor()));
    for (const anchor of anchors) expect(anchor).toEqual(anchors[0]);
  });
  it('sürüm karşılaştırması sayısaldır ve keyfi tag kabul etmez', () => {
    expect(compareMobileVersions('1.4.10','1.4.9')).toBe(1);
    expect(compareMobileVersions('1.4.1','1.4.1')).toBe(0);
    expect(()=>compareMobileVersions('latest','1.4.1')).toThrow('INVALID_VERSION');
  });
  it('Windows tagi yerine APK asset sürümünü karşılaştırır; yabancı URL ve prerelease reddedilir', () => {
    const release = { tag_name:'v1.150.0', html_url:'https://github.com/pespaloglan-droid/bizneshasapdev/releases/tag/v1.150.0', assets:[{name:'BiznesHasap-v1.4.2.apk',browser_download_url:'https://github.com/pespaloglan-droid/bizneshasapdev/releases/download/v1.150.0/BiznesHasap-v1.4.2.apk'}] };
    expect(findMobileUpdate([release],'1.4.1')?.version).toBe('1.4.2');
    expect(findMobileUpdate([release],'1.4.2')).toBeNull();
    expect(findMobileUpdate([{...release,prerelease:true}],'1.4.1')).toBeNull();
    expect(findMobileUpdate([{...release,assets:[{...release.assets[0],browser_download_url:'https://evil.example/a.apk'}]}],'1.4.1')).toBeNull();
  });
});
