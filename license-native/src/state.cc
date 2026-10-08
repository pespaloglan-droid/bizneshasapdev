// src/state.cc
#include "state.h"
#include "utils.h"
#include "random.h"
#include <cstring>
#include <fstream>
#include <filesystem>

extern "C" {
#include "../third_party/tweetnacl.h"
}

namespace fs = std::filesystem;

static const uint8_t MAGIC[4] = {'L','I','C','S'};
static const uint8_t STATE_VERSION = 1;

static std::string g_dataDir;
static uint8_t g_stateKey[32];
static bool g_initialized = false;

// State şifreleme (XSalsa20-Poly1305)
static bool EncryptState(const uint8_t* stateKey, const std::vector<uint8_t>& plaintext,
                         std::vector<uint8_t>& out) {
  std::vector<uint8_t> msg(crypto_secretbox_ZEROBYTES + plaintext.size(), 0);
  memcpy(msg.data() + crypto_secretbox_ZEROBYTES, plaintext.data(), plaintext.size());
  
  uint8_t nonce[24];
  randombytes(nonce, sizeof nonce);
  
  std::vector<uint8_t> cipher(msg.size());
  crypto_secretbox(cipher.data(), msg.data(), msg.size(), nonce, stateKey);
  
  out.clear();
  out.insert(out.end(), MAGIC, MAGIC + 4);
  out.push_back(STATE_VERSION);
  out.insert(out.end(), nonce, nonce + 24);
  out.insert(out.end(), cipher.begin() + crypto_secretbox_BOXZEROBYTES, cipher.end());
  
  secure_zero(msg.data(), msg.size());
  secure_zero(nonce, sizeof nonce);
  
  return true;
}

// State çözme
static bool DecryptState(const uint8_t* stateKey, const std::vector<uint8_t>& fileData,
                         std::vector<uint8_t>& plaintext) {
  if (fileData.size() < 4 + 1 + 24 + crypto_secretbox_BOXZEROBYTES) return false;
  if (memcmp(fileData.data(), MAGIC, 4) != 0) return false;
  
  const uint8_t* nonce  = fileData.data() + 5;
  const uint8_t* ctBody = fileData.data() + 5 + 24;
  size_t ctBodyLen      = fileData.size() - 5 - 24;
  
  std::vector<uint8_t> sm(crypto_secretbox_BOXZEROBYTES + ctBodyLen, 0);
  memcpy(sm.data() + crypto_secretbox_BOXZEROBYTES, ctBody, ctBodyLen);
  
  std::vector<uint8_t> m(sm.size());
  if (crypto_secretbox_open(m.data(), sm.data(), sm.size(), nonce, stateKey) != 0)
    return false;
  
  plaintext.assign(m.begin() + crypto_secretbox_ZEROBYTES, m.end());
  secure_zero(m.data(), m.size());
  
  return true;
}

// Atomik yazma - en az 2 konum
bool AtomicWrite(const std::string& path, const std::vector<uint8_t>& data) {
  std::string tmpPath = path + ".tmp";
  std::string bakPath = path + ".bak";
  
  std::ofstream f(tmpPath, std::ios::binary);
  if (!f.is_open()) return false;
  
  f.write((const char*)data.data(), data.size());
  f.flush();
  
#ifndef _WIN32
  // fsync on POSIX
  int fd = fileno(fdopen(tmpPath.c_str(), "r"));
  if (fd >= 0) {
    fsync(fd);
    close(fd);
  }
#endif
  
  f.close();
  
  std::error_code ec;
  if (fs::exists(path)) fs::rename(path, bakPath, ec);
  fs::rename(tmpPath, path, ec);
  
  return !ec;
}

// Init - dataDir ayarla, install secret yükle/oluştur
bool InitState(const std::string& dataDir) {
  g_dataDir = dataDir;
  
  // Klasör yoksa oluştur
  std::error_code ec;
  fs::create_directories(dataDir, ec);
  fs::create_directories(dataDir + "/mirror", ec);
  
  // Install secret yükle veya oluştur
  if (!LoadInstallSecret(g_stateKey)) {
    randombytes(g_stateKey, 32);
    if (!SaveInstallSecret(g_stateKey)) {
      secure_zero(g_stateKey, 32);
      return false;
    }
  }
  
  g_initialized = true;
  return true;
}

// Install secret yönetimi - platform-specific
#ifdef _WIN32
#include <windows.h>
#include <wincrypt.h>

bool SaveInstallSecret(const uint8_t secret[32]) {
  DATA_BLOB in, out;
  in.pbData = (BYTE*)secret;
  in.cbData = 32;
  
  if (!CryptProtectData(&in, L"PosLicense", nullptr, nullptr, nullptr,
                        CRYPTPROTECT_LOCAL_MACHINE, &out))
    return false;
  
  HKEY hKey;
  if (RegCreateKeyExA(HKEY_LOCAL_MACHINE,
      "SOFTWARE\\BiznesHasap\\License", 0, nullptr, 0, KEY_WRITE, nullptr,
      &hKey, nullptr) != ERROR_SUCCESS) {
    LocalFree(out.pbData);
    return false;
  }
  
  RegSetValueExA(hKey, "InstallSecret", 0, REG_BINARY, out.pbData, out.cbData);
  RegCloseKey(hKey);
  LocalFree(out.pbData);
  
  return true;
}

bool LoadInstallSecret(uint8_t secret[32]) {
  HKEY hKey;
  if (RegOpenKeyExA(HKEY_LOCAL_MACHINE,
      "SOFTWARE\\BiznesHasap\\License", 0, KEY_READ, &hKey) != ERROR_SUCCESS)
    return false;
  
  BYTE buf[256];
  DWORD sz = sizeof buf;
  DWORD type;
  
  if (RegQueryValueExA(hKey, "InstallSecret", nullptr, &type, buf, &sz) != ERROR_SUCCESS ||
      type != REG_BINARY) {
    RegCloseKey(hKey);
    return false;
  }
  
  RegCloseKey(hKey);
  
  DATA_BLOB in, out;
  in.pbData = buf;
  in.cbData = sz;
  
  if (!CryptUnprotectData(&in, nullptr, nullptr, nullptr, nullptr, 0, &out))
    return false;
  
  if (out.cbData != 32) {
    LocalFree(out.pbData);
    return false;
  }
  
  memcpy(secret, out.pbData, 32);
  LocalFree(out.pbData);
  
  return true;
}

#else
// Linux/macOS/Android - 0600 dosya
bool SaveInstallSecret(const uint8_t secret[32]) {
  std::string path = g_dataDir + "/.install_secret";
  
  int fd = open(path.c_str(), O_WRONLY | O_CREAT | O_TRUNC, 0600);
  if (fd < 0) return false;
  
  write(fd, secret, 32);
  fsync(fd);
  close(fd);
  
  return true;
}

bool LoadInstallSecret(uint8_t secret[32]) {
  std::string path = g_dataDir + "/.install_secret";
  
  std::ifstream f(path, std::ios::binary);
  if (!f.is_open()) return false;
  
  f.read((char*)secret, 32);
  bool ok = f.gcount() == 32;
  f.close();
  
  return ok;
}
#endif

// Hesap kaydı serialize
static std::vector<uint8_t> SerializeRecord(const AccountRecord& rec) {
  std::vector<uint8_t> data;
  data.reserve(256);
  
  // accountId: 8
  data.insert(data.end(), rec.accountId, rec.accountId + 8);
  
  // deviceTags: 5x6 = 30
  for (int i = 0; i < 5; i++)
    data.insert(data.end(), rec.deviceTags[i], rec.deviceTags[i] + 6);
  
  // minMatch: 1
  data.push_back((uint8_t)rec.minMatch);
  
  // expiry: 4
  data.push_back((uint8_t)(rec.expiry >> 0));
  data.push_back((uint8_t)(rec.expiry >> 8));
  data.push_back((uint8_t)(rec.expiry >> 16));
  data.push_back((uint8_t)(rec.expiry >> 24));
  
  // lastSeen: 4
  data.push_back((uint8_t)(rec.lastSeen >> 0));
  data.push_back((uint8_t)(rec.lastSeen >> 8));
  data.push_back((uint8_t)(rec.lastSeen >> 16));
  data.push_back((uint8_t)(rec.lastSeen >> 24));
  
  // lastSequence: 4
  data.push_back((uint8_t)(rec.lastSequence >> 0));
  data.push_back((uint8_t)(rec.lastSequence >> 8));
  data.push_back((uint8_t)(rec.lastSequence >> 16));
  data.push_back((uint8_t)(rec.lastSequence >> 24));
  
  // plan: 1
  data.push_back(rec.plan);
  
  // features: 2
  data.push_back((uint8_t)(rec.features >> 0));
  data.push_back((uint8_t)(rec.features >> 8));
  
  // maxRegisters: 1
  data.push_back(rec.maxRegisters);
  
  // hasRootSig: 1
  data.push_back(rec.hasRootSig ? 1 : 0);
  
  // rootSig: 64 (varsa)
  if (rec.hasRootSig)
    data.insert(data.end(), rec.rootSig, rec.rootSig + 64);
  
  // lastElapsed: 4
  data.push_back((uint8_t)(rec.lastElapsed >> 0));
  data.push_back((uint8_t)(rec.lastElapsed >> 8));
  data.push_back((uint8_t)(rec.lastElapsed >> 16));
  data.push_back((uint8_t)(rec.lastElapsed >> 24));
  
  return data;
}

// Hesap kaydı deserialize
static bool DeserializeRecord(const std::vector<uint8_t>& data, AccountRecord& rec) {
  if (data.size() < 59) return false;
  
  size_t pos = 0;
  
  memcpy(rec.accountId, data.data() + pos, 8); pos += 8;
  
  for (int i = 0; i < 5; i++) {
    memcpy(rec.deviceTags[i], data.data() + pos, 6);
    pos += 6;
  }
  
  rec.minMatch = data[pos++];
  
  rec.expiry = data[pos] | (data[pos+1] << 8) | (data[pos+2] << 16) | (data[pos+3] << 24);
  pos += 4;
  
  rec.lastSeen = data[pos] | (data[pos+1] << 8) | (data[pos+2] << 16) | (data[pos+3] << 24);
  pos += 4;
  
  rec.lastSequence = data[pos] | (data[pos+1] << 8) | (data[pos+2] << 16) | (data[pos+3] << 24);
  pos += 4;
  
  rec.plan = data[pos++];
  
  rec.features = data[pos] | (data[pos+1] << 8);
  pos += 2;
  
  rec.maxRegisters = data[pos++];
  
  rec.hasRootSig = data[pos++] != 0;
  
  if (rec.hasRootSig) {
    if (data.size() < pos + 64) return false;
    memcpy(rec.rootSig, data.data() + pos, 64);
    pos += 64;
  }
  
  if (data.size() >= pos + 4) {
    rec.lastElapsed = data[pos] | (data[pos+1] << 8) | (data[pos+2] << 16) | (data[pos+3] << 24);
  } else {
    rec.lastElapsed = 0;
  }
  
  return true;
}

// State dosya yolları
static std::string StatePath(const uint8_t accountId[8]) {
  char hex[17];
  for (int i = 0; i < 8; i++)
    sprintf(hex + i*2, "%02x", accountId[i]);
  return g_dataDir + "/acc_" + std::string(hex) + ".state";
}

static std::string MirrorPath(const uint8_t accountId[8]) {
  char hex[17];
  for (int i = 0; i < 8; i++)
    sprintf(hex + i*2, "%02x", accountId[i]);
  return g_dataDir + "/mirror/acc_" + std::string(hex) + ".state";
}

// Load account record
bool LoadAccountRecord(const uint8_t accountId[8], AccountRecord& rec) {
  if (!g_initialized) return false;
  
  std::string primary = StatePath(accountId);
  std::string mirror = MirrorPath(accountId);
  
  // Birincil dene
  if (fs::exists(primary)) {
    std::ifstream f(primary, std::ios::binary);
    if (f.is_open()) {
      std::vector<uint8_t> encrypted((std::istreambuf_iterator<char>(f)),
                                     std::istreambuf_iterator<char>());
      f.close();
      
      std::vector<uint8_t> plain;
      if (DecryptState(g_stateKey, encrypted, plain)) {
        if (DeserializeRecord(plain, rec)) {
          secure_zero(plain.data(), plain.size());
          return true;
        }
      }
    }
  }
  
  // Birincil başarısız, ikincil dene
  if (fs::exists(mirror)) {
    std::ifstream f(mirror, std::ios::binary);
    if (f.is_open()) {
      std::vector<uint8_t> encrypted((std::istreambuf_iterator<char>(f)),
                                     std::istreambuf_iterator<char>());
      f.close();
      
      std::vector<uint8_t> plain;
      if (DecryptState(g_stateKey, encrypted, plain)) {
        if (DeserializeRecord(plain, rec)) {
          // Birincili onar
          std::vector<uint8_t> serialized = SerializeRecord(rec);
          std::vector<uint8_t> encrypted2;
          EncryptState(g_stateKey, serialized, encrypted2);
          AtomicWrite(primary, encrypted2);
          
          secure_zero(plain.data(), plain.size());
          secure_zero(serialized.data(), serialized.size());
          return true;
        }
      }
    }
  }
  
  return false;
}

// Save account record
bool SaveAccountRecord(const uint8_t accountId[8], const AccountRecord& rec) {
  if (!g_initialized) return false;
  
  std::vector<uint8_t> plain = SerializeRecord(rec);
  std::vector<uint8_t> encrypted;
  
  if (!EncryptState(g_stateKey, plain, encrypted)) {
    secure_zero(plain.data(), plain.size());
    return false;
  }
  
  secure_zero(plain.data(), plain.size());
  
  std::string primary = StatePath(accountId);
  std::string mirror = MirrorPath(accountId);
  
  bool ok1 = AtomicWrite(primary, encrypted);
  bool ok2 = AtomicWrite(mirror, encrypted);
  
  return ok1 && ok2;
}

// Has root sig check
bool HasRootSig(const uint8_t accountId[8]) {
  AccountRecord rec;
  if (!LoadAccountRecord(accountId, rec)) return false;
  return rec.hasRootSig;
}
