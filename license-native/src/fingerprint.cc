// src/fingerprint.cc
#include "fingerprint.h"
#include "fingerprint_salt.h"
#include "utils.h"
#include <cstring>
#include <vector>

extern "C" {
#include "../third_party/tweetnacl.h"
}

#ifdef _WIN32
  #include <windows.h>
  #include <iphlpapi.h>
  #pragma comment(lib, "iphlpapi.lib")
#elif defined(__APPLE__)
  #include <sys/sysctl.h>
  #include <IOKit/IOKitLib.h>
  #include <CoreFoundation/CoreFoundation.h>
#elif defined(__linux__) && !defined(__ANDROID__)
  #include <fstream>
  #include <net/if.h>
  #include <ifaddrs.h>
#elif defined(__ANDROID__)
  #include <fstream>
  #include <net/if.h>
  #include <ifaddrs.h>
  // Android köprü global değişkenleri
  std::string g_androidId;
  std::string g_buildSerial;
  std::string g_cpuInfo;
  std::string g_macAddr;
  uint32_t g_bootElapsed = 0;
#endif

// Bileşen -> 6 bayt etiket (SHA-512'nin ilk 6 baytı)
static void ComponentTag(const std::string& component, uint8_t tag[6]) {
  if (component.empty()) {
    memset(tag, 0, 6);
    return;
  }
  
  std::vector<uint8_t> input;
  input.insert(input.end(), FINGERPRINT_SALT, FINGERPRINT_SALT + 16);
  input.insert(input.end(), component.begin(), component.end());
  
  uint8_t hash[64];
  crypto_hash(hash, input.data(), input.size());
  memcpy(tag, hash, 6);
  
  secure_zero(hash, sizeof hash);
  secure_zero(input.data(), input.size());
}

// Platform-specific bileşen toplama
#ifdef _WIN32
static std::string GetMachineGuid() {
  HKEY hKey;
  if (RegOpenKeyExA(HKEY_LOCAL_MACHINE,
      "SOFTWARE\\Microsoft\\Cryptography", 0, KEY_READ, &hKey) != ERROR_SUCCESS)
    return "";
  
  char buf[64] = {};
  DWORD sz = sizeof buf;
  RegQueryValueExA(hKey, "MachineGuid", nullptr, nullptr, (LPBYTE)buf, &sz);
  RegCloseKey(hKey);
  
  return std::string(buf);
}

static std::string GetSMBIOSUUID() {
  // TODO: SMBIOS UUID okuma (WMI veya raw SMBIOS)
  return "";
}

static std::string GetDiskSerial() {
  // TODO: C: sürücüsünün seri numarası
  return "";
}

static std::string GetCPUBrand() {
  // TODO: CPU brand string (CPUID)
  return "";
}

static std::string GetFirstPhysicalMAC() {
  PIP_ADAPTER_INFO pAdapterInfo = nullptr;
  ULONG bufLen = 0;
  
  GetAdaptersInfo(nullptr, &bufLen);
  pAdapterInfo = (IP_ADAPTER_INFO*)malloc(bufLen);
  
  if (GetAdaptersInfo(pAdapterInfo, &bufLen) == NO_ERROR) {
    PIP_ADAPTER_INFO pAdapter = pAdapterInfo;
    while (pAdapter) {
      if (pAdapter->Type == MIB_IF_TYPE_ETHERNET && pAdapter->AddressLength == 6) {
        char mac[18];
        sprintf(mac, "%02X:%02X:%02X:%02X:%02X:%02X",
          pAdapter->Address[0], pAdapter->Address[1], pAdapter->Address[2],
          pAdapter->Address[3], pAdapter->Address[4], pAdapter->Address[5]);
        free(pAdapterInfo);
        return std::string(mac);
      }
      pAdapter = pAdapter->Next;
    }
  }
  
  if (pAdapterInfo) free(pAdapterInfo);
  return "";
}

std::string GetStableComponent() {
  std::string mg = GetMachineGuid();
  if (!mg.empty()) return mg;
  
  std::string uuid = GetSMBIOSUUID();
  if (!uuid.empty()) return uuid;
  
  return GetFirstPhysicalMAC();
}

#elif defined(__ANDROID__)
// Android: Java'dan gelen global değişkenleri kullan
std::string GetStableComponent() {
  if (!g_androidId.empty() && g_androidId != "9774d56d682e549c") 
    return g_androidId;
  if (!g_buildSerial.empty() && g_buildSerial != "unknown") 
    return g_buildSerial;
  if (!g_cpuInfo.empty()) 
    return g_cpuInfo;
  return g_macAddr;
}

#elif defined(__linux__)
static std::string ReadFile(const char* path) {
  std::ifstream f(path);
  if (!f.is_open()) return "";
  std::string content((std::istreambuf_iterator<char>(f)),
                      std::istreambuf_iterator<char>());
  return content;
}

std::string GetStableComponent() {
  std::string mid = ReadFile("/etc/machine-id");
  if (!mid.empty()) return mid;
  
  std::string uuid = ReadFile("/sys/class/dmi/id/product_uuid");
  if (!uuid.empty()) return uuid;
  
  // TODO: İlk fiziksel MAC
  return "";
}

#elif defined(__APPLE__)
std::string GetStableComponent() {
  // TODO: IOPlatformUUID
  return "";
}

#else
std::string GetStableComponent() {
  return "";
}
#endif

// Device anchor hesaplama (istek kodu için)
bool ComputeDeviceAnchor(uint8_t anchor[4]) {
  std::string stable = GetStableComponent();
  if (stable.empty()) return false;
  
  std::vector<uint8_t> input;
  input.insert(input.end(), FINGERPRINT_SALT, FINGERPRINT_SALT + 16);
  const char* tag = "anchor-v1";
  input.insert(input.end(), tag, tag + strlen(tag));
  input.insert(input.end(), stable.begin(), stable.end());
  
  uint8_t hash[64];
  crypto_hash(hash, input.data(), input.size());
  memcpy(anchor, hash, 4);
  
  secure_zero(hash, sizeof hash);
  secure_zero(input.data(), input.size());
  
  return true;
}

// 5 bileşen toplama
void CollectFingerprint(uint8_t tags[5][6], int& nonEmptyCount) {
  nonEmptyCount = 0;
  std::string components[5];
  
#ifdef _WIN32
  components[0] = GetMachineGuid();
  components[1] = GetSMBIOSUUID();
  components[2] = GetDiskSerial();
  components[3] = GetCPUBrand();
  components[4] = GetFirstPhysicalMAC();
#elif defined(__ANDROID__)
  components[0] = g_androidId;
  components[1] = g_buildSerial;
  components[2] = g_cpuInfo;
  components[3] = ""; // CPU abi/board kombinasyonu - TODO
  components[4] = g_macAddr;
#elif defined(__linux__)
  components[0] = ReadFile("/etc/machine-id");
  components[1] = ReadFile("/sys/class/dmi/id/product_uuid");
  components[2] = ""; // root disk serial - TODO
  components[3] = ReadFile("/proc/cpuinfo"); // model name satırı
  components[4] = ""; // İlk fiziksel MAC - TODO
#elif defined(__APPLE__)
  // TODO: macOS bileşenleri
#endif
  
  for (int i = 0; i < 5; i++) {
    ComponentTag(components[i], tags[i]);
    if (!components[i].empty()) nonEmptyCount++;
    
    // String'i temizle
    secure_zero(&components[i][0], components[i].size());
  }
}

// Toleranslı eşleşme
bool FingerprintMatch(const uint8_t stored[5][6], const uint8_t current[5][6], int minMatch) {
  int matched = 0;
  
  for (int i = 0; i < 5; i++) {
    bool storedEmpty = true, currentEmpty = true;
    
    for (int j = 0; j < 6; j++) {
      if (stored[i][j]) storedEmpty = false;
      if (current[i][j]) currentEmpty = false;
    }
    
    if (storedEmpty || currentEmpty) continue;
    
    if (memcmp(stored[i], current[i], 6) == 0) matched++;
  }
  
  return matched >= minMatch;
}
