// src/integrity.h
#pragma once
#include <cstdint>
#include <string>
#include "constants.h"

// Ed25519 detached signature verification
bool VerifyDetached(const uint8_t* msg, size_t n, const uint8_t sig[64], const uint8_t pk[32]);

// APK imza hash doğrulaması (Android için)
void SetAppSignatureHash(const std::string& hex);
bool AppSignatureOk();

// Anti-debug / ortam tespiti
bool IsDebuggerAttached();

// Full license check (tüm kontrol noktalarından çağrılır)
Status InternalFullLicenseCheck(const uint8_t accountId[8]);
