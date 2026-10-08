// src/integrity.cc
#include "integrity.h"
#include "state.h"
#include "fingerprint.h"
#include "app_sig_hash.h"
#include "utils.h"
#include <cstring>
#include <ctime>
#include <vector>

extern "C" {
#include "../third_party/tweetnacl.h"
}

static std::string g_appSigHash;

// Ed25519 detached signature verification
bool VerifyDetached(const uint8_t* msg, size_t n, const uint8_t sig[64], const uint8_t pk[32]) {
  if (!msg || n == 0 || n > 1024) return false;
  
  std::vector<uint8_t> sm(64 + n);
  memcpy(sm.data(), sig, 64);
  memcpy(sm.data() + 64, msg, n);
  
  std::vector<uint8_t> m(64 + n);
  unsigned long long mlen = 0;
  
  int r = crypto_sign_open(m.data(), &mlen, sm.data(), sm.size(), pk);
  
  secure_zero(m.data(), m.size());
  
  return r == 0 && mlen == n;
}

// APK imza hash yönetimi
void SetAppSignatureHash(const std::string& hex) {
  g_appSigHash = hex;
}

bool AppSignatureOk() {
#ifdef __ANDROID__
  if (g_appSigHash.empty()) return false;
  // app_sig_hash.h'den beklenen hash ile karşılaştır
  return g_appSigHash == EXPECTED_APP_SIG_HASH;
#else
  // PC'de bu kontrol yok
  return true;
#endif
}

// Anti-debug tespiti
bool IsDebuggerAttached() {
#ifdef _WIN32
  if (::IsDebuggerPresent()) return true;
  
  BOOL remoteDebugger = FALSE;
  CheckRemoteDebuggerPresent(GetCurrentProcess(), &remoteDebugger);
  return remoteDebugger != FALSE;
  
#elif defined(__APPLE__)
  // macOS: sysctl P_TRACED flag
  int mib[4] = { CTL_KERN, KERN_PROC, KERN_PROC_PID, getpid() };
  struct kinfo_proc info;
  size_t size = sizeof(info);
  
  if (sysctl(mib, 4, &info, &size, nullptr, 0) == 0) {
    return (info.kp_proc.p_flag & P_TRACED) != 0;
  }
  return false;
  
#elif defined(__linux__) && !defined(__ANDROID__)
  // Linux: TracerPid in /proc/self/status
  FILE* f = fopen("/proc/self/status", "r");
  if (!f) return false;
  
  char line[256];
  while (fgets(line, sizeof line, f)) {
    if (strncmp(line, "TracerPid:", 10) == 0) {
      int pid = atoi(line + 10);
      fclose(f);
      return pid != 0;
    }
  }
  fclose(f);
  return false;
  
#elif defined(__ANDROID__)
  // Android: frida/xposed tespiti
  // TODO: /proc/self/maps kontrolleri, frida port taraması
  return false;
  
#else
  return false;
#endif
}

// Full license check - tüm kontrol noktalarından çağrılır
Status InternalFullLicenseCheck(const uint8_t accountId[8]) {
  // Anti-debug kontrolü (sessiz ret)
  if (IsDebuggerAttached()) {
    return STORAGE_ERROR; // Saldırgana ipucu vermemek için
  }
  
  // APK imza kontrolü
  if (!AppSignatureOk()) {
    return STATE_TAMPERED;
  }
  
  // Kayıt yükle
  AccountRecord rec;
  if (!LoadAccountRecord(accountId, rec)) {
    return NOT_ACTIVATED;
  }
  
  // Cihaz eşleşmesi
  uint8_t currentTags[5][6];
  int nonEmpty;
  CollectFingerprint(currentTags, nonEmpty);
  
  if (!FingerprintMatch(rec.deviceTags, currentTags, rec.minMatch)) {
    return DEVICE_MISMATCH;
  }
  
  // Saat kontrolü
  uint32_t now = (uint32_t)time(nullptr);
  
  if (now + CLOCK_BACK_TOL < rec.lastSeen) {
    return CLOCK_ROLLBACK;
  }
  
  // Süre kontrolü (grace period dahil)
  uint32_t graceUntil = rec.expiry + GRACE_DAYS * 86400;
  if (now > graceUntil) {
    return EXPIRED;
  }
  
  return OK;
}
