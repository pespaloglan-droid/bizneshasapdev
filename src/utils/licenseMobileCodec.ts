// licenseMobileCodec.ts — license-native/admin/core/codec.js'in Uint8Array portu.
// WebView'de Buffer YOK — tüm byte işlemleri Uint8Array üzerinde yapılır.
// Anahtar/talep kodu biçimleri PC native modülüyle birebir aynıdır.

const BASE32_ALPHA = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

// Base32 encode (MSB first, padding yok)
export function base32Encode(buffer: Uint8Array): string {
  let result = '';
  let bits = 0;
  let bitsAcc = 0;

  for (let i = 0; i < buffer.length; i++) {
    bits = (bits << 8) | buffer[i];
    bitsAcc += 8;

    while (bitsAcc >= 5) {
      bitsAcc -= 5;
      result += BASE32_ALPHA[(bits >> bitsAcc) & 0x1F];
    }
  }

  if (bitsAcc > 0) {
    result += BASE32_ALPHA[(bits << (5 - bitsAcc)) & 0x1F];
  }

  return result;
}

// Base32 karakter değeri (O→0, I/L→1 düzeltmeli)
function base32CharValue(ch: string): number {
  let c = ch.toUpperCase();
  if (c === 'O') c = '0';
  if (c === 'I' || c === 'L') c = '1';
  return BASE32_ALPHA.indexOf(c);
}

// Base32 decode — geçersiz karakterde null
export function base32Decode(str: string): Uint8Array | null {
  let bits = 0;
  let bitsAcc = 0;
  const result: number[] = [];

  for (let i = 0; i < str.length; i++) {
    const val = base32CharValue(str[i]);
    if (val < 0) return null;

    bits = (bits << 5) | val;
    bitsAcc += 5;

    if (bitsAcc >= 8) {
      bitsAcc -= 8;
      result.push((bits >> bitsAcc) & 0xFF);
    }
  }

  return new Uint8Array(result);
}

// CRC-16/CCITT-FALSE
export function crc16(str: string): number {
  let crc = 0xFFFF;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) ? (crc << 1) ^ 0x1021 : crc << 1;
    }
    crc &= 0xFFFF;
  }
  return crc;
}

// CRC ekle (sona 4 Base32 karakter)
export function appendCRC(b32: string): string {
  let crcBits = crc16(b32);
  let crcB32 = '';
  for (let i = 0; i < 4; i++) {
    crcB32 = BASE32_ALPHA[crcBits & 0x1F] + crcB32;
    crcBits >>= 5;
  }
  return b32 + crcB32;
}

// CRC doğrula
export function checkCRC(full: string): boolean {
  if (full.length < 5) return false;
  return full === appendCRC(full.slice(0, -4));
}

// Girdi normalize: boşluk/tire sil, büyük harf, O→0, I/L→1, Kiril→Latin
export function normalizeInput(raw: string): string {
  const cyrillic: Record<string, string> = {
    'А': 'A', 'В': 'B', 'С': 'C', 'Е': 'E', 'Н': 'H',
    'К': 'K', 'М': 'M', 'О': 'O', 'Р': 'P', 'Т': 'T', 'Х': 'X',
  };

  let out = '';
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (/[a-zA-Z0-9]/.test(ch)) {
      let c = ch.toUpperCase();
      c = cyrillic[c] || c;
      if (c === 'O') c = '0';
      if (c === 'I' || c === 'L') c = '1';
      out += c;
    }
  }
  return out;
}

// Hesap ID decode: 'XXXX-XXXX-XXXX-XX' → 8 byte (kontrol simgeli)
export function decodeAccountId(formatted: string): Uint8Array | null {
  const clean = normalizeInput(formatted);
  if (clean.length !== 14) return null;

  const b32 = clean.slice(0, 13);
  const checkGot = clean[13];

  let sum = 0;
  for (let i = 0; i < b32.length; i++) {
    const val = base32CharValue(b32[i]);
    if (val < 0) return null;
    sum += val * (i + 1);
  }
  if (checkGot !== BASE32_ALPHA[sum % 32]) return null;

  return base32Decode(b32);
}

// Hesap ID format: 8 byte → 'XXXX-XXXX-XXXX-XX'
export function formatAccountId(raw8: Uint8Array): string {
  const b32 = base32Encode(raw8); // 13 karakter

  let sum = 0;
  for (let i = 0; i < b32.length; i++) {
    sum += BASE32_ALPHA.indexOf(b32[i]) * (i + 1);
  }
  const full = b32 + BASE32_ALPHA[sum % 32]; // 14 karakter
  return `${full.slice(0, 4)}-${full.slice(4, 8)}-${full.slice(8, 12)}-${full.slice(12, 14)}`;
}

export interface LicensePayloadFields {
  keyId?: number;
  accountId: Uint8Array;      // 8 byte
  deviceAnchor: Uint8Array;   // 4 byte
  plan: number;
  flags?: number;
  features?: number;
  maxRegisters?: number;
  seq: number;
  issuedAt: number;
  activateBy: number;
  durationDays?: number;
}

// Payload pack (33 byte) — offset'ler codec.js buildPayload ile aynı:
// version(0) keyId(1) accountId(2-9) deviceAnchor(10-13) plan(14) flags(15)
// features(16-17 LE) maxRegisters(18) seq(19-22 LE) issuedAt(23-26 LE)
// activateBy(27-30 LE) durationDays(31-32 LE)
export function buildPayload(f: LicensePayloadFields): Uint8Array {
  const b = new Uint8Array(33);
  b[0] = 1; // version
  b[1] = f.keyId ?? 0;
  b.set(f.accountId, 2);
  b.set(f.deviceAnchor, 10);
  b[14] = f.plan;
  b[15] = f.flags ?? 0;
  const features = f.features ?? 0x3F;
  b[16] = features & 0xFF;
  b[17] = (features >>> 8) & 0xFF;
  b[18] = f.maxRegisters ?? 0;
  writeU32LE(b, 19, f.seq);
  writeU32LE(b, 23, f.issuedAt);
  writeU32LE(b, 27, f.activateBy);
  const duration = f.durationDays ?? 0;
  b[31] = duration & 0xFF;
  b[32] = (duration >>> 8) & 0xFF;
  return b;
}

export interface UnpackedPayload {
  version: number;
  keyId: number;
  accountId: Uint8Array;
  deviceAnchor: Uint8Array;
  plan: number;
  flags: number;
  features: number;
  maxRegisters: number;
  sequence: number;
  issuedAt: number;
  activateBy: number;
  durationDays: number;
}

// Payload unpack
export function unpackPayload(payload: Uint8Array): UnpackedPayload {
  return {
    version: payload[0],
    keyId: payload[1],
    accountId: payload.slice(2, 10),
    deviceAnchor: payload.slice(10, 14),
    plan: payload[14],
    flags: payload[15],
    features: payload[16] | (payload[17] << 8),
    maxRegisters: payload[18],
    sequence: readU32LE(payload, 19),
    issuedAt: readU32LE(payload, 23),
    activateBy: readU32LE(payload, 27),
    durationDays: payload[31] | (payload[32] << 8),
  };
}

// ── Byte yardımcıları (Buffer yerine) ────────────────────────────────────────

function readU32LE(b: Uint8Array, o: number): number {
  return (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0;
}

function writeU32LE(b: Uint8Array, o: number, v: number): void {
  b[o] = v & 0xFF;
  b[o + 1] = (v >>> 8) & 0xFF;
  b[o + 2] = (v >>> 16) & 0xFF;
  b[o + 3] = (v >>> 24) & 0xFF;
}

export function concatBytes(...parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

export function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export function bytesToHex(b: Uint8Array): string {
  let s = '';
  for (let i = 0; i < b.length; i++) s += b[i].toString(16).padStart(2, '0');
  return s;
}

export function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

export function utf8Bytes(str: string): Uint8Array<ArrayBuffer> {
  return new TextEncoder().encode(str) as Uint8Array<ArrayBuffer>;
}
