// src/fingerprint.h
#pragma once
#include <string>
#include <cstdint>

// 5 bileşen, her biri 6 bayt etiket
void CollectFingerprint(uint8_t tags[5][6], int& nonEmptyCount);

// Toleranslı eşleşme
bool FingerprintMatch(const uint8_t stored[5][6], const uint8_t current[5][6], int minMatch);

// Device anchor - 4 bayt (istek kodunda kullanılır)
bool ComputeDeviceAnchor(uint8_t anchor[4]);

// Platform-specific helpers
std::string GetStableComponent();

// Android köprüsü için global değişkenler (Java'dan set edilir)
#if defined(__ANDROID__)
extern std::string g_androidId;
extern std::string g_buildSerial;
extern std::string g_cpuInfo;
extern std::string g_macAddr;
extern uint32_t g_bootElapsed;
#endif
