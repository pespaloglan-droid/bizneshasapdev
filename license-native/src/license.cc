// src/license.cc - Ana N-API modülü
#include <napi.h>
#include <cstring>
#include <ctime>
#include "constants.h"
#include "codec.h"
#include "fingerprint.h"
#include "state.h"
#include "integrity.h"
#include "business.h"
#include "utils.h"
#include "public_keys.h"
#include "random.h"

extern "C" {
#include "../third_party/tweetnacl.h"
}

// Helper: uint32 little-endian read
static uint32_t ReadU32LE(const uint8_t* p) {
  return p[0] | (p[1] << 8) | (p[2] << 16) | (p[3] << 24);
}

static uint16_t ReadU16LE(const uint8_t* p) {
  return p[0] | (p[1] << 8);
}

// createAccountId() -> string
Napi::Value CreateAccountId(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  uint8_t raw[8];
  randombytes(raw, sizeof raw);
  
  std::string formatted = FormatAccountId(raw);
  
  secure_zero(raw, sizeof raw);
  
  return Napi::String::New(env, formatted);
}

// getRequestCode(accountId) -> string
Napi::Value GetRequestCode(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 1 || !info[0].IsString()) {
    return env.Null();
  }
  
  std::string accountIdStr = info[0].As<Napi::String>();
  uint8_t accountId[8];
  
  if (!DecodeAccountId(accountIdStr, accountId)) {
    return env.Null();
  }
  
  uint8_t anchor[4];
  if (!ComputeDeviceAnchor(anchor)) {
    return env.Null();
  }
  
  // accountId(8) || anchor(4) = 12 bytes -> 20 Base32 + 4 CRC = 24
  uint8_t payload[12];
  memcpy(payload, accountId, 8);
  memcpy(payload + 8, anchor, 4);
  
  std::string b32 = Base32Encode(payload, 12);
  std::string withCRC = AppendCRC(b32);
  
  secure_zero(payload, sizeof payload);
  secure_zero(anchor, sizeof anchor);
  
  return Napi::String::New(env, withCRC);
}

// setRootCode(accountId, rootCode) -> Status
Napi::Value SetRootCode(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 2 || !info[0].IsString() || !info[1].IsString()) {
    return Napi::Number::New(env, BAD_INPUT);
  }
  
  std::string accountIdStr = info[0].As<Napi::String>();
  std::string rootCodeRaw = info[1].As<Napi::String>();
  
  uint8_t accountId[8];
  if (!DecodeAccountId(accountIdStr, accountId)) {
    return Napi::Number::New(env, BAD_INPUT);
  }
  
  Status err;
  std::string rootCodeN = NormalizeInput(rootCodeRaw, 107, err);
  if (err != OK) {
    return Napi::Number::New(env, BAD_INPUT);
  }
  
  if (!CheckCRC(rootCodeN)) {
    return Napi::Number::New(env, INVALID);
  }
  
  // Decode: 103 Base32 -> 64 bytes signature
  uint8_t rootSig[64];
  if (!Base32Decode(rootCodeN.substr(0, 103), rootSig, 64)) {
    return Napi::Number::New(env, INVALID);
  }
  
  // Verify signature: sign("root-v1" || accountId)
  std::vector<uint8_t> msg;
  const char* tag = "root-v1";
  msg.insert(msg.end(), tag, tag + strlen(tag));
  msg.insert(msg.end(), accountId, accountId + 8);
  
  // Root sig her zaman keyId=0 ile imzalanır
  const uint8_t* pk = GetPublicKey(0);
  if (!pk || !VerifyDetached(msg.data(), msg.size(), rootSig, pk)) {
    return Napi::Number::New(env, INVALID);
  }
  
  // Kayda yaz
  AccountRecord rec;
  bool hasRecord = LoadAccountRecord(accountId, rec);
  
  if (!hasRecord) {
    memset(&rec, 0, sizeof rec);
    memcpy(rec.accountId, accountId, 8);
  }
  
  rec.hasRootSig = true;
  memcpy(rec.rootSig, rootSig, 64);
  
  if (!SaveAccountRecord(accountId, rec)) {
    return Napi::Number::New(env, STORAGE_ERROR);
  }
  
  return Napi::Number::New(env, OK);
}

// activate(accountId, key) -> Status
Napi::Value Activate(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 2 || !info[0].IsString() || !info[1].IsString()) {
    return Napi::Number::New(env, BAD_INPUT);
  }
  
  Status err;
  std::string accountIdRaw = info[0].As<Napi::String>();
  std::string keyRaw = info[1].As<Napi::String>();
  
  uint8_t accountId[8];
  if (!DecodeAccountId(accountIdRaw, accountId)) {
    return Napi::Number::New(env, BAD_INPUT);
  }
  
  std::string keyN = NormalizeInput(keyRaw, 160, err);
  if (err != OK) {
    return Napi::Number::New(env, BAD_INPUT);
  }
  
  if (!CheckCRC(keyN)) {
    return Napi::Number::New(env, INVALID);
  }
  
  // Decode: 156 Base32 -> 97 bytes (33 payload + 64 sig)
  uint8_t raw[97];
  if (!Base32Decode(keyN.substr(0, 156), raw, 97)) {
    return Napi::Number::New(env, INVALID);
  }
  
  uint8_t* payload = raw;
  uint8_t* sig = raw + 33;
  
  // Payload parse (2.6 tablosu - DÜZELTİLMİŞ OFFSET'LER)
  uint8_t version = payload[0];
  uint8_t keyId = payload[1];
  // accountId: payload+2 (8)
  // deviceAnchor: payload+10 (4)
  uint8_t plan = payload[14];
  uint8_t flags = payload[15];
  uint16_t features = ReadU16LE(payload + 16);
  uint8_t maxRegisters = payload[18];
  uint32_t seq = ReadU32LE(payload + 19);
  uint32_t issuedAt = ReadU32LE(payload + 23);
  uint32_t activateBy = ReadU32LE(payload + 27);
  uint16_t durationDays = ReadU16LE(payload + 31);
  
  if (version != 1) {
    secure_zero(raw, sizeof raw);
    return Napi::Number::New(env, INVALID);
  }
  
  // İmza doğrulama
  const uint8_t* pk = GetPublicKey(keyId);
  if (!pk) {
    secure_zero(raw, sizeof raw);
    return Napi::Number::New(env, INVALID);
  }
  
  if (!VerifyDetached(payload, 33, sig, pk)) {
    secure_zero(raw, sizeof raw);
    return Napi::Number::New(env, INVALID);
  }
  
  // Account ID eşleşmesi
  if (memcmp(payload + 2, accountId, 8) != 0) {
    secure_zero(raw, sizeof raw);
    return Napi::Number::New(env, ACCOUNT_MISMATCH);
  }
  
  // Device anchor eşleşmesi
  uint8_t myAnchor[4];
  if (!ComputeDeviceAnchor(myAnchor)) {
    secure_zero(raw, sizeof raw);
    return Napi::Number::New(env, DEVICE_MISMATCH);
  }
  
  if (memcmp(payload + 10, myAnchor, 4) != 0) {
    secure_zero(raw, sizeof raw);
    secure_zero(myAnchor, sizeof myAnchor);
    return Napi::Number::New(env, DEVICE_MISMATCH);
  }
  
  secure_zero(myAnchor, sizeof myAnchor);
  
  // Zaman kontrolleri
  uint32_t now = (uint32_t)time(nullptr);
  
  if (now > activateBy) {
    secure_zero(raw, sizeof raw);
    return Napi::Number::New(env, KEY_EXPIRED);
  }
  
  if (now < issuedAt && (issuedAt - now) > CLOCK_TOLERANCE) {
    secure_zero(raw, sizeof raw);
    return Napi::Number::New(env, CLOCK_ROLLBACK);
  }
  
  // Kayıt yükle
  AccountRecord rec;
  bool hasRecord = LoadAccountRecord(accountId, rec);
  
  // İlk aktivasyonda root sig gerekli
  if (!hasRecord && !HasRootSig(accountId)) {
    secure_zero(raw, sizeof raw);
    return Napi::Number::New(env, NEED_ROOT);
  }
  
  // Sequence kontrolü
  if (hasRecord && seq <= rec.lastSequence) {
    secure_zero(raw, sizeof raw);
    return Napi::Number::New(env, REPLAYED);
  }
  
  // Clock-reset özel işlem
  if (plan == PLAN_CLOCK_RESET && (flags & FLAG_CLOCK_RESET)) {
    if (hasRecord) {
      rec.lastSeen = now;
      rec.lastSequence = seq;
      SaveAccountRecord(accountId, rec);
    }
    secure_zero(raw, sizeof raw);
    return Napi::Number::New(env, OK);
  }
  
  // Cihaz eşleşmesi (kayıt varsa)
  if (hasRecord) {
    uint8_t currentTags[5][6];
    int nonEmpty;
    CollectFingerprint(currentTags, nonEmpty);
    
    if (!FingerprintMatch(rec.deviceTags, currentTags, rec.minMatch)) {
      secure_zero(raw, sizeof raw);
      return Napi::Number::New(env, DEVICE_MISMATCH);
    }
    
    // Saat geri alma kontrolü
    if (now + CLOCK_BACK_TOL < rec.lastSeen) {
      secure_zero(raw, sizeof raw);
      return Napi::Number::New(env, CLOCK_ROLLBACK);
    }
  }
  
  // Süre hesaplama
  uint32_t days = (plan == PLAN_CUSTOM) ? durationDays : PLAN_DAYS[plan];
  uint32_t start = (flags & FLAG_EXTEND) && hasRecord && rec.expiry > now 
                   ? rec.expiry : now;
  uint32_t expiry = start + days * 86400;
  
  // Kayıt güncelle
  rec.expiry = expiry;
  rec.lastSequence = seq;
  rec.plan = plan;
  rec.features = features;
  rec.maxRegisters = maxRegisters;
  rec.lastSeen = now;
  
  if (!hasRecord) {
    memcpy(rec.accountId, accountId, 8);
    int ne;
    CollectFingerprint(rec.deviceTags, ne);
    rec.minMatch = ne >= MIN_COMPONENTS ? std::min(3, ne) : MIN_COMPONENTS;
    
    if (ne < MIN_COMPONENTS) {
      secure_zero(raw, sizeof raw);
      return Napi::Number::New(env, DEVICE_MISMATCH);
    }
    
    // Root sig'i kopyala
    AccountRecord tempRec;
    if (LoadAccountRecord(accountId, tempRec) && tempRec.hasRootSig) {
      rec.hasRootSig = true;
      memcpy(rec.rootSig, tempRec.rootSig, 64);
    }
  }
  
  if (!SaveAccountRecord(accountId, rec)) {
    secure_zero(raw, sizeof raw);
    return Napi::Number::New(env, STORAGE_ERROR);
  }
  
  secure_zero(raw, sizeof raw);
  return Napi::Number::New(env, OK);
}

// checkLicense(accountId) -> { status, expiry, daysLeft, plan, features, maxRegisters, graceUntil }
Napi::Value CheckLicense(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 1 || !info[0].IsString()) {
    Napi::Object err = Napi::Object::New(env);
    err.Set("status", Napi::Number::New(env, BAD_INPUT));
    return err;
  }
  
  std::string accountIdStr = info[0].As<Napi::String>();
  uint8_t accountId[8];
  
  if (!DecodeAccountId(accountIdStr, accountId)) {
    Napi::Object err = Napi::Object::New(env);
    err.Set("status", Napi::Number::New(env, BAD_INPUT));
    return err;
  }
  
  // Full license check
  Status status = InternalFullLicenseCheck(accountId);
  
  Napi::Object result = Napi::Object::New(env);
  result.Set("status", Napi::Number::New(env, status));
  
  // Kayıt varsa detayları döndür
  AccountRecord rec;
  if (LoadAccountRecord(accountId, rec)) {
    uint32_t now = (uint32_t)time(nullptr);
    
    int32_t daysLeft = 0;
    if (rec.expiry > now) {
      daysLeft = (int32_t)((rec.expiry - now) / 86400);
    }
    
    result.Set("expiry", Napi::Number::New(env, rec.expiry));
    result.Set("daysLeft", Napi::Number::New(env, daysLeft));
    result.Set("plan", Napi::Number::New(env, rec.plan));
    result.Set("features", Napi::Number::New(env, rec.features));
    result.Set("maxRegisters", Napi::Number::New(env, rec.maxRegisters));
    result.Set("graceUntil", Napi::Number::New(env, rec.expiry + GRACE_DAYS * 86400));
  }
  
  return result;
}

// deriveKey(accountId, purpose) -> Buffer | null
Napi::Value DeriveKey(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 2 || !info[0].IsString() || !info[1].IsString()) {
    return env.Null();
  }
  
  std::string accountIdStr = info[0].As<Napi::String>();
  std::string purposeStr = info[1].As<Napi::String>();
  
  if (purposeStr.size() > 64) {
    return env.Null();
  }
  
  uint8_t accountId[8];
  if (!DecodeAccountId(accountIdStr, accountId)) {
    return env.Null();
  }
  
  // Full license check
  Status st = InternalFullLicenseCheck(accountId);
  if (st != OK) {
    return env.Null();
  }
  
  // Root sig yükle
  AccountRecord rec;
  if (!LoadAccountRecord(accountId, rec) || !rec.hasRootSig) {
    return env.Null();
  }
  
  // Derive: SHA-512("lic-key-v1" || purpose || rootSig || accountId)[0..32]
  std::vector<uint8_t> input;
  const char* tag = "lic-key-v1";
  input.insert(input.end(), tag, tag + strlen(tag));
  input.insert(input.end(), purposeStr.begin(), purposeStr.end());
  input.insert(input.end(), rec.rootSig, rec.rootSig + 64);
  input.insert(input.end(), accountId, accountId + 8);
  
  uint8_t hash[64];
  crypto_hash(hash, input.data(), input.size());
  
  auto buf = Napi::Buffer<uint8_t>::Copy(env, hash, 32);
  
  secure_zero(hash, sizeof hash);
  secure_zero(input.data(), input.size());
  
  return buf;
}

// setDataDir(path) -> void
Napi::Value SetDataDir(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 1 || !info[0].IsString()) {
    return Napi::Boolean::New(env, false);
  }
  
  std::string path = info[0].As<Napi::String>();
  bool ok = InitState(path);
  
  return Napi::Boolean::New(env, ok);
}

// getVersion() -> string
Napi::Value GetVersion(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return Napi::String::New(env, "1.0.0");
}

// setDeviceComponents(obj) -> void (Android köprüsü)
Napi::Value SetDeviceComponents(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
#ifdef __ANDROID__
  if (info.Length() < 1 || !info[0].IsObject()) {
    return env.Undefined();
  }
  
  Napi::Object obj = info[0].As<Napi::Object>();
  
  if (obj.Has("androidId"))
    g_androidId = obj.Get("androidId").ToString().Utf8Value();
  if (obj.Has("serial"))
    g_buildSerial = obj.Get("serial").ToString().Utf8Value();
  if (obj.Has("cpuInfo"))
    g_cpuInfo = obj.Get("cpuInfo").ToString().Utf8Value();
  if (obj.Has("mac"))
    g_macAddr = obj.Get("mac").ToString().Utf8Value();
#endif
  
  return env.Undefined();
}

// setBootElapsed(seconds) -> void (Android köprüsü)
Napi::Value SetBootElapsed(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
#ifdef __ANDROID__
  if (info.Length() < 1 || !info[0].IsNumber()) {
    return env.Undefined();
  }
  
  g_bootElapsed = info[0].As<Napi::Number>().Uint32Value();
#endif
  
  return env.Undefined();
}

// N-API modül init
Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports.Set("createAccountId", Napi::Function::New<CreateAccountId>(env));
  exports.Set("getRequestCode", Napi::Function::New<GetRequestCode>(env));
  exports.Set("setRootCode", Napi::Function::New<SetRootCode>(env));
  exports.Set("activate", Napi::Function::New<Activate>(env));
  exports.Set("checkLicense", Napi::Function::New<CheckLicense>(env));
  exports.Set("deriveKey", Napi::Function::New<DeriveKey>(env));
  exports.Set("setDataDir", Napi::Function::New<SetDataDir>(env));
  exports.Set("getVersion", Napi::Function::New<GetVersion>(env));
  exports.Set("setDeviceComponents", Napi::Function::New<SetDeviceComponents>(env));
  exports.Set("setBootElapsed", Napi::Function::New<SetBootElapsed>(env));
  
  // İş mantığı fonksiyonları
  exports.Set("calcReceiptTotals", Napi::Function::New<CalcReceiptTotals>(env));
  exports.Set("calcProfitReport", Napi::Function::New<CalcProfitReport>(env));
  exports.Set("calcStockValue", Napi::Function::New<CalcStockValue>(env));
  
  return exports;
}

NODE_API_MODULE(license, Init)
