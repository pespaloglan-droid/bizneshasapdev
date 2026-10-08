// src/state.h
#pragma once
#include <string>
#include <vector>
#include <cstdint>
#include "constants.h"

// Hesap kaydı yapısı
struct AccountRecord {
  uint8_t  accountId[8];
  uint8_t  deviceTags[5][6];
  int      minMatch;
  uint32_t expiry;
  uint32_t lastSeen;
  uint32_t lastSequence;
  uint8_t  plan;
  uint16_t features;
  uint8_t  maxRegisters;
  bool     hasRootSig;
  uint8_t  rootSig[64];
  uint32_t lastElapsed;  // Android için
};

// State yönetimi
bool InitState(const std::string& dataDir);
bool LoadAccountRecord(const uint8_t accountId[8], AccountRecord& rec);
bool SaveAccountRecord(const uint8_t accountId[8], const AccountRecord& rec);
bool HasRootSig(const uint8_t accountId[8]);

// Install secret yönetimi (platform-specific)
bool SaveInstallSecret(const uint8_t secret[32]);
bool LoadInstallSecret(uint8_t secret[32]);

// Atomik yazma
bool AtomicWrite(const std::string& path, const std::vector<uint8_t>& data);
