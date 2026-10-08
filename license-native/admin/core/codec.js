// admin/core/codec.js - CLI ve GUI ortak Base32 + CRC16
'use strict';

const BASE32_ALPHA = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

// Base32 encode (MSB first, no padding)
function base32Encode(buffer) {
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

// Base32 decode helper
function base32CharValue(c) {
  c = c.toUpperCase();
  if (c === 'O') c = '0';
  if (c === 'I' || c === 'L') c = '1';
  const idx = BASE32_ALPHA.indexOf(c);
  return idx >= 0 ? idx : -1;
}

// Base32 decode
function base32Decode(str) {
  let bits = 0;
  let bitsAcc = 0;
  const result = [];

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

  return Buffer.from(result);
}

// CRC-16/CCITT-FALSE
function crc16(str) {
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

// CRC append (4 Base32 characters)
function appendCRC(b32) {
  const crc = crc16(b32);
  let crcBits = crc;
  let crcB32 = '';

  for (let i = 0; i < 4; i++) {
    crcB32 = BASE32_ALPHA[crcBits & 0x1F] + crcB32;
    crcBits >>= 5;
  }

  return b32 + crcB32;
}

// CRC check
function checkCRC(full) {
  if (full.length < 5) return false;
  const payload = full.slice(0, -4);
  const expected = appendCRC(payload);
  return full === expected;
}

// Normalize input (boşluk/tire sil, büyük harf, O->0, I/L->1, Kiril->Latin)
function normalizeInput(raw) {
  const cyrillic = {
    'А': 'A', 'В': 'B', 'С': 'C', 'Е': 'E', 'Н': 'H',
    'К': 'K', 'М': 'M', 'О': 'O', 'Р': 'P', 'Т': 'T', 'Х': 'X',
    'а': 'A', 'в': 'B', 'с': 'C', 'е': 'E', 'н': 'H',
    'к': 'K', 'м': 'M', 'о': 'O', 'р': 'P', 'т': 'T', 'х': 'X'
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

// Account ID decode
function decodeAccountId(formatted) {
  const clean = normalizeInput(formatted);
  if (clean.length !== 14) return null;

  const b32 = clean.slice(0, 13);
  const checkGot = clean[13];

  // Check symbol verification
  let sum = 0;
  for (let i = 0; i < b32.length; i++) {
    const val = base32CharValue(b32[i]);
    if (val < 0) return null;
    sum += val * (i + 1);
  }
  const checkExp = BASE32_ALPHA[sum % 32];

  if (checkGot !== checkExp) return null;

  return base32Decode(b32);
}

// Account ID format
function formatAccountId(raw8) {
  const b32 = base32Encode(raw8); // 13 chars
  
  // Check symbol
  let sum = 0;
  for (let i = 0; i < b32.length; i++) {
    const val = BASE32_ALPHA.indexOf(b32[i]);
    sum += val * (i + 1);
  }
  const check = BASE32_ALPHA[sum % 32];
  
  const full = b32 + check; // 14 chars
  return full.slice(0,4) + '-' + full.slice(4,8) + '-' + full.slice(8,12) + '-' + full.slice(12,14);
}

// Payload pack (33 bytes) - 2.6 tablosu
function buildPayload({
  keyId = 0,
  accountId,
  deviceAnchor,
  plan,
  flags = 0,
  features = 0x3F,
  maxRegisters = 0,
  seq,
  issuedAt,
  activateBy,
  durationDays = 0
}) {
  const b = Buffer.alloc(33);
  let o = 0;

  b.writeUInt8(1, o); o += 1;              // version (offset 0)
  b.writeUInt8(keyId, o); o += 1;          // keyId (offset 1)
  accountId.copy(b, o); o += 8;            // accountId (offset 2)
  deviceAnchor.copy(b, o); o += 4;         // deviceAnchor (offset 10)
  b.writeUInt8(plan, o); o += 1;           // plan (offset 14)
  b.writeUInt8(flags, o); o += 1;          // flags (offset 15)
  b.writeUInt16LE(features, o); o += 2;    // features (offset 16)
  b.writeUInt8(maxRegisters, o); o += 1;   // maxRegisters (offset 18)
  b.writeUInt32LE(seq, o); o += 4;         // sequence (offset 19)
  b.writeUInt32LE(issuedAt, o); o += 4;    // issuedAt (offset 23)
  b.writeUInt32LE(activateBy, o); o += 4;  // activateBy (offset 27)
  b.writeUInt16LE(durationDays, o);        // durationDays (offset 31)

  return b;
}

// Payload unpack
function unpackPayload(payload) {
  return {
    version: payload.readUInt8(0),
    keyId: payload.readUInt8(1),
    accountId: payload.slice(2, 10),
    deviceAnchor: payload.slice(10, 14),
    plan: payload.readUInt8(14),
    flags: payload.readUInt8(15),
    features: payload.readUInt16LE(16),
    maxRegisters: payload.readUInt8(18),
    sequence: payload.readUInt32LE(19),
    issuedAt: payload.readUInt32LE(23),
    activateBy: payload.readUInt32LE(27),
    durationDays: payload.readUInt16LE(31)
  };
}

module.exports = {
  base32Encode,
  base32Decode,
  crc16,
  appendCRC,
  checkCRC,
  normalizeInput,
  decodeAccountId,
  formatAccountId,
  buildPayload,
  unpackPayload
};
