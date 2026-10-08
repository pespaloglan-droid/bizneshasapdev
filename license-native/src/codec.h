// src/codec.h
#pragma once
#include <string>
#include <vector>
#include <cstdint>
#include "constants.h"

// Crockford Base32 encode/decode
std::string Base32Encode(const uint8_t* data, size_t len);
bool Base32Decode(const std::string& s, uint8_t* out, size_t outLen);

// CRC-16/CCITT-FALSE
uint16_t CRC16(const uint8_t* data, size_t len);
std::string AppendCRC(const std::string& b32);
bool CheckCRC(const std::string& full);

// Hesap ID formatı
std::string FormatAccountId(const uint8_t raw[8]);
bool DecodeAccountId(const std::string& formatted, uint8_t out[8]);

// Input normalizasyon
std::string NormalizeInput(const std::string& raw, size_t expectedLen, Status& err);
