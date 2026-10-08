// admin/core/license-core.js - PAYLAŞILAN ÇEKİRDEK
// CLI ve GUI'nin ortak kullandığı TEK admin mantığı
'use strict';

const fs = require('fs');
const path = require('path');
const nacl = require('tweetnacl');
const { scryptSync, randomBytes, createCipheriv, createDecipheriv } = require('crypto');
const codec = require('./codec');

// State
let g_secretKey = null;
let g_publicKey = null;
let g_isUnlocked = false;

// Veri dizini: LICDATA_DIR ile geçilebilir (GUI portable build'i kalıcı
// userData klasörünü kullanır; aksi halde temp'e yazıp kayıtlar kaybolur).
const DATA_DIR = process.env.LICDATA_DIR || path.join(__dirname, '..');
const SECRET_KEY_PATH = path.join(DATA_DIR, 'secret.key');
const ISSUED_JSON_PATH = path.join(DATA_DIR, 'issued.json');

// Plan tablosu
const PLANS = {
  'monthly': { code: 1, days: 30 },
  'quarterly': { code: 2, days: 90 },
  'semiannual': { code: 3, days: 180 },
  'yearly': { code: 4, days: 365 }
};

// Unlock - secret.key'i çöz, bellekte tut
function unlock(password) {
  if (!fs.existsSync(SECRET_KEY_PATH)) {
    return false;
  }

  try {
    const encrypted = fs.readFileSync(SECRET_KEY_PATH);
    
    // Format: salt(32) || nonce(24) || ciphertext
    const salt = encrypted.slice(0, 32);
    const nonce = encrypted.slice(32, 56);
    const ciphertext = encrypted.slice(56);

    // Derive key: scrypt(password, salt, N=2^14, r=8, p=1, keylen=32)
    // NOTE: Reduced from 2^17 due to Node.js memory limits in some environments
    const key = scryptSync(password, salt, 32, { N: 16384, r: 8, p: 1 });

    // Decrypt: XSalsa20-Poly1305 (modern tweetnacl API)
    const plaintext = nacl.secretbox.open(new Uint8Array(ciphertext), new Uint8Array(nonce), new Uint8Array(key));

    if (!plaintext) {
      return false;
    }

    // secret key = 64 bytes (Ed25519)
    g_secretKey = Buffer.from(plaintext);
    g_publicKey = Buffer.from(nacl.sign.keyPair.fromSecretKey(new Uint8Array(g_secretKey)).publicKey);
    g_isUnlocked = true;

    return true;
  } catch (err) {
    return false;
  }
}

// Lock - bellekteki secretKey'i sil
function lock() {
  if (g_secretKey) {
    g_secretKey.fill(0);
    g_secretKey = null;
  }
  if (g_publicKey) {
    g_publicKey.fill(0);
    g_publicKey = null;
  }
  g_isUnlocked = false;
}

function isUnlocked() {
  return g_isUnlocked;
}

// Keygen - yeni keypair + public_keys.h oluştur
function keygen(password, options = {}) {
  const force = options.force || false;

  if (!force && fs.existsSync(SECRET_KEY_PATH)) {
    return { error: 'secret.key zaten var. --force kullanın.' };
  }

  // Yeni keypair
  const kp = nacl.sign.keyPair();
  const secretKey = Buffer.from(kp.secretKey);
  const publicKey = Buffer.from(kp.publicKey);

  // Encrypt secret key (modern tweetnacl API)
  const salt = randomBytes(32);
  const key = scryptSync(password, salt, 32, { N: 16384, r: 8, p: 1 });
  const nonce = randomBytes(24);

  // secretKey is 64 bytes for Ed25519, encrypt directly
  const ciphertext = nacl.secretbox(new Uint8Array(secretKey), new Uint8Array(nonce), new Uint8Array(key));

  // File format: salt(32) || nonce(24) || ciphertext(64+16=80)
  const encrypted = Buffer.concat([salt, nonce, Buffer.from(ciphertext)]);
  fs.writeFileSync(SECRET_KEY_PATH, encrypted, { mode: 0o600 });

  // Generate public_keys.h
  const pubKeyHex = publicKey.toString('hex').match(/.{1,2}/g).map(b => '0x' + b).join(', ');
  const headerContent = `// src/public_keys.h
// Bu dosya admin keygen tarafından üretilir
#pragma once
#include <cstdint>

static const uint8_t PUBLIC_KEYS[][32] = {
  // keyId 0
  {
    ${pubKeyHex}
  }
};

static const int PUBLIC_KEY_COUNT = sizeof(PUBLIC_KEYS) / sizeof(PUBLIC_KEYS[0]);

inline const uint8_t* GetPublicKey(uint8_t keyId) {
  return (keyId < PUBLIC_KEY_COUNT) ? PUBLIC_KEYS[keyId] : nullptr;
}
`;

  const pubKeyPath = path.join(__dirname, '../../src/public_keys.h');
  fs.writeFileSync(pubKeyPath, headerContent);

  // issued.json başlat
  if (!fs.existsSync(ISSUED_JSON_PATH)) {
    fs.writeFileSync(ISSUED_JSON_PATH, JSON.stringify({ keys: [] }, null, 2));
  }

  secretKey.fill(0);

  return {
    publicKey: publicKey.toString('hex'),
    message: 'Keypair oluşturuldu. src/public_keys.h üretildi. Uygulamayı yeniden derleyin.'
  };
}

// Rotate key - yeni key ekle
function rotateKey(password) {
  // TODO: keyId 1, 2, 3... için yeni key ekle
  return { error: 'Key rotation henüz implement edilmedi' };
}

// Decode request code
function decodeRequest(code) {
  const normalized = codec.normalizeInput(code);
  if (normalized.length !== 24) {
    return { valid: false, error: 'Kod 24 karakter olmalı' };
  }

  if (!codec.checkCRC(normalized)) {
    return { valid: false, error: 'CRC hatası' };
  }

  const payload = codec.base32Decode(normalized.slice(0, 20));
  if (!payload || payload.length !== 12) {
    return { valid: false, error: 'Decode hatası' };
  }

  const accountId = payload.slice(0, 8);
  const deviceAnchor = payload.slice(8, 12);

  return {
    valid: true,
    accountId,
    deviceAnchor,
    accountIdFormatted: codec.formatAccountId(accountId)
  };
}

// Create key - ana anahtar üretim fonksiyonu
function createKey(params) {
  if (!g_isUnlocked) {
    return { error: 'Kilitli. Önce unlock() çağırın.' };
  }

  const {
    requestCode,
    plan,
    days,
    features = 0x3F,
    maxRegisters = 0,
    activateByDays = 14,
    extend = true,
    note = '',
    platform = 'cli'
  } = params;

  // Request code decode
  const req = decodeRequest(requestCode);
  if (!req.valid) {
    return { error: 'Geçersiz istek kodu: ' + req.error };
  }

  // Plan veya days
  let planCode, durationDays;
  if (plan) {
    const p = PLANS[plan];
    if (!p) {
      return { error: 'Geçersiz plan: ' + plan };
    }
    planCode = p.code;
    durationDays = 0;
  } else if (days) {
    if (days < 1 || days > 730) {
      return { error: 'Gün sayısı 1-730 arasında olmalı' };
    }
    planCode = 255; // PLAN_CUSTOM
    durationDays = days;
  } else {
    return { error: 'plan veya days gerekli' };
  }

  // Sequence - issued.json'dan son seq + 1
  const issued = loadIssued();
  const accountIdHex = req.accountId.toString('hex');
  const accountKeys = issued.keys.filter(k => k.accountIdHex === accountIdHex);
  const lastSeq = accountKeys.length > 0 ? Math.max(...accountKeys.map(k => k.seq)) : 0;
  const seq = lastSeq + 1;

  // Timestamps
  const now = Math.floor(Date.now() / 1000);
  const issuedAt = now;
  const activateBy = now + activateByDays * 86400;

  // Flags
  let flags = 0;
  if (extend) flags |= 0x01; // FLAG_EXTEND

  // Payload build
  const payload = codec.buildPayload({
    keyId: 0,
    accountId: req.accountId,
    deviceAnchor: req.deviceAnchor,
    plan: planCode,
    flags,
    features,
    maxRegisters,
    seq,
    issuedAt,
    activateBy,
    durationDays
  });

  // Sign
  const signature = nacl.sign.detached(new Uint8Array(payload), new Uint8Array(g_secretKey));
  const raw97 = Buffer.concat([payload, Buffer.from(signature)]);

  // Encode
  const b32 = codec.base32Encode(raw97);
  const key = codec.appendCRC(b32);

  // Root code check
  let rootCode = null;
  const isFirstActivation = accountKeys.length === 0;
  if (isFirstActivation) {
    rootCode = generateRootCode(req.accountId);
  }

  // Save to issued.json
  const record = {
    seq,
    accountIdHex,
    accountIdFormatted: req.accountIdFormatted,
    platform,
    plan: plan || 'custom',
    days: plan ? PLANS[plan].days : days,
    issuedAt: new Date(issuedAt * 1000).toISOString(),
    activateBy: new Date(activateBy * 1000).toISOString(),
    note,
    key
  };
  issued.keys.push(record);
  saveIssued(issued);

  // Expiry preview
  const effectiveDays = plan ? PLANS[plan].days : days;
  const expiryPreview = new Date((now + effectiveDays * 86400) * 1000).toISOString();

  return {
    key,
    rootCode,
    seq,
    expiryPreview,
    record
  };
}

// Generate root code
//
// Kabul edilen girdi:
//   - 'XXXX-XXXX-XXXX-XX' biçimli Hesap ID string'i (kullanıcının ekranda
//     gördüğü / admin'e gönderdiği biçim), veya
//   - 8 baytlık ham hesap ID (Buffer).
// Kök kod deterministiktir: aynı hesap ID için her zaman aynı sonucu üretir
// (spec §2.5) — bu yüzden ilk dağıtımdan sonra da yeniden üretilebilir.
function generateRootCode(accountId) {
  if (!g_isUnlocked) {
    return null;
  }

  let bytes;
  if (typeof accountId === 'string') {
    const normalized = codec.normalizeInput(accountId);
    bytes = codec.decodeAccountId(normalized);
    if (!bytes) return null;
  } else if (Buffer.isBuffer(accountId) || accountId instanceof Uint8Array) {
    bytes = Buffer.from(accountId);
  } else {
    return null;
  }

  if (bytes.length !== 8) return null;

  const msg = Buffer.concat([Buffer.from('root-v1'), bytes]);
  const sig = nacl.sign.detached(new Uint8Array(msg), new Uint8Array(g_secretKey));
  const b32 = codec.base32Encode(Buffer.from(sig));
  return codec.appendCRC(b32);
}

// Inspect key
function inspectKey(keyStr) {
  const normalized = codec.normalizeInput(keyStr);
  if (normalized.length !== 160) {
    return { error: 'Anahtar 160 karakter olmalı' };
  }

  if (!codec.checkCRC(normalized)) {
    return { error: 'CRC hatası' };
  }

  const raw = codec.base32Decode(normalized.slice(0, 156));
  if (!raw || raw.length !== 97) {
    return { error: 'Decode hatası' };
  }

  const payload = raw.slice(0, 33);
  const sig = raw.slice(33, 97);

  const p = codec.unpackPayload(payload);

  const PLAN_NAMES = { 0: 'clock-reset', 1: 'monthly', 2: 'quarterly', 3: 'semiannual', 4: 'yearly', 255: 'custom' };

  return {
    version: p.version,
    keyId: p.keyId,
    accountId: codec.formatAccountId(p.accountId),
    deviceAnchor: p.deviceAnchor.toString('hex'),
    plan: PLAN_NAMES[p.plan] || '?',
    flags: '0x' + p.flags.toString(16),
    features: '0x' + p.features.toString(16),
    maxRegisters: p.maxRegisters,
    sequence: p.sequence,
    issuedAt: new Date(p.issuedAt * 1000).toISOString(),
    activateBy: new Date(p.activateBy * 1000).toISOString(),
    durationDays: p.durationDays,
    signature: sig.toString('hex').slice(0, 32) + '...'
  };
}

// Make rebind code
function makeRebindCode(requestCode) {
  if (!g_isUnlocked) {
    return { error: 'Kilitli' };
  }

  const req = decodeRequest(requestCode);
  if (!req.valid) {
    return { error: 'Geçersiz istek kodu' };
  }

  // REBIND anahtarı: plan=1 (geçici), FLAG_REBIND=0x02
  const issued = loadIssued();
  const accountIdHex = req.accountId.toString('hex');
  const accountKeys = issued.keys.filter(k => k.accountIdHex === accountIdHex);
  const lastSeq = accountKeys.length > 0 ? Math.max(...accountKeys.map(k => k.seq)) : 0;
  const seq = lastSeq + 1;

  const now = Math.floor(Date.now() / 1000);
  const payload = codec.buildPayload({
    keyId: 0,
    accountId: req.accountId,
    deviceAnchor: req.deviceAnchor,
    plan: 1, // monthly geçici
    flags: 0x02, // FLAG_REBIND
    features: 0x3F,
    maxRegisters: 0,
    seq,
    issuedAt: now,
    activateBy: now + 14 * 86400,
    durationDays: 0
  });

  const signature = nacl.sign.detached(new Uint8Array(payload), new Uint8Array(g_secretKey));
  const raw97 = Buffer.concat([payload, Buffer.from(signature)]);
  const b32 = codec.base32Encode(raw97);
  const key = codec.appendCRC(b32);

  // Rebind kayıt
  const record = {
    seq,
    accountIdHex,
    accountIdFormatted: req.accountIdFormatted,
    platform: 'rebind',
    plan: 'rebind',
    days: 0,
    issuedAt: new Date(now * 1000).toISOString(),
    note: 'REBIND - cihaz değişimi',
    key
  };
  issued.keys.push(record);
  saveIssued(issued);

  // Rebind count
  const rebindCount = accountKeys.filter(k => k.platform === 'rebind').length + 1;
  if (rebindCount >= 2) {
    console.warn(`⚠️  UYARI: ${req.accountIdFormatted} hesabı için ${rebindCount}. rebind!`);
  }

  return { key, rootCode: generateRootCode(req.accountId), rebindCount };
}

// Make clock-reset code
function makeClockResetCode(requestCode) {
  if (!g_isUnlocked) {
    return { error: 'Kilitli' };
  }

  const req = decodeRequest(requestCode);
  if (!req.valid) {
    return { error: 'Geçersiz istek kodu' };
  }

  const issued = loadIssued();
  const accountIdHex = req.accountId.toString('hex');
  const accountKeys = issued.keys.filter(k => k.accountIdHex === accountIdHex);
  const lastSeq = accountKeys.length > 0 ? Math.max(...accountKeys.map(k => k.seq)) : 0;
  const seq = lastSeq + 1;

  const now = Math.floor(Date.now() / 1000);
  const payload = codec.buildPayload({
    keyId: 0,
    accountId: req.accountId,
    deviceAnchor: req.deviceAnchor,
    plan: 0, // PLAN_CLOCK_RESET
    flags: 0x04, // FLAG_CLOCK_RESET
    features: 0,
    maxRegisters: 0,
    seq,
    issuedAt: now,
    activateBy: now + 7 * 86400,
    durationDays: 0
  });

  const signature = nacl.sign.detached(new Uint8Array(payload), new Uint8Array(g_secretKey));
  const raw97 = Buffer.concat([payload, Buffer.from(signature)]);
  const b32 = codec.base32Encode(raw97);
  const key = codec.appendCRC(b32);

  const record = {
    seq,
    accountIdHex,
    accountIdFormatted: req.accountIdFormatted,
    platform: 'clock-reset',
    plan: 'clock-reset',
    days: 0,
    issuedAt: new Date(now * 1000).toISOString(),
    note: 'CLOCK-RESET - saat kurtarma',
    key
  };
  issued.keys.push(record);
  saveIssued(issued);

  return { key };
}

// List keys
function listKeys(filter = {}) {
  const issued = loadIssued();
  let keys = issued.keys;

  if (filter.accountId) {
    keys = keys.filter(k => k.accountIdFormatted === filter.accountId);
  }

  // Rebind count ekle
  const result = keys.map(k => {
    const accountKeys = issued.keys.filter(x => x.accountIdHex === k.accountIdHex);
    const rebindCount = accountKeys.filter(x => x.platform === 'rebind').length;
    return { ...k, rebindCount };
  });

  return result;
}

// Helper: issued.json load/save
function loadIssued() {
  if (!fs.existsSync(ISSUED_JSON_PATH)) {
    return { keys: [] };
  }
  const raw = fs.readFileSync(ISSUED_JSON_PATH, 'utf8');
  // UTF-8 BOM ve baştaki boşlukları temizle
  const cleaned = raw.replace(/^﻿/, '').trim();
  if (!cleaned) return { keys: [] };
  return JSON.parse(cleaned);
}

function saveIssued(data) {
  fs.writeFileSync(ISSUED_JSON_PATH, JSON.stringify(data, null, 2), 'utf8');
}

// Tüm key kayıtlarını sil (secret.key ETKİLENMEZ — admin anahtarı korunur)
function clearKeys() {
  if (!g_isUnlocked) {
    return { error: 'Çekirdek kilitli' };
  }
  try {
    saveIssued({ keys: [] });
    return { ok: true };
  } catch (err) {
    return { error: String(err.message || err) };
  }
}

// Shamir secret sharing - split key
function splitKey(threshold = 2, shares = 3) {
  // TODO: Shamir 2-of-3 implementation
  return { error: 'Shamir split henüz implement edilmedi' };
}

// Shamir join
function joinKey(shares) {
  // TODO: Shamir join implementation
  return { error: 'Shamir join henüz implement edilmedi' };
}

module.exports = {
  unlock,
  lock,
  isUnlocked,
  keygen,
  rotateKey,
  decodeRequest,
  createKey,
  inspectKey,
  generateRootCode,
  makeRebindCode,
  makeClockResetCode,
  listKeys,
  clearKeys,
  splitKey,
  joinKey
};
