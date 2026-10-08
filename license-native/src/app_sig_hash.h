// src/app_sig_hash.h
// Bu dosya build script tarafından üretilir (release imzasının SHA-256 hash'i)
#pragma once

#ifdef __ANDROID__
// Release APK imzasının SHA-256 hash'i (hex string)
// Build script ile üretilecek
static const char* EXPECTED_APP_SIG_HASH = "0000000000000000000000000000000000000000000000000000000000000000";
#else
// PC'de bu kontrol yok
static const char* EXPECTED_APP_SIG_HASH = "";
#endif
