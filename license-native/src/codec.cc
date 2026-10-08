// src/codec.cc
#include "codec.h"
#include <cstring>
#include <cctype>
#include <algorithm>

static const char BASE32_ALPHA[] = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

// Base32 encode - MSB first, no padding
std::string Base32Encode(const uint8_t* data, size_t len) {
  std::string result;
  result.reserve((len * 8 + 4) / 5);
  
  uint64_t bits = 0;
  int bitsAcc = 0;
  
  for (size_t i = 0; i < len; i++) {
    bits = (bits << 8) | data[i];
    bitsAcc += 8;
    
    while (bitsAcc >= 5) {
      bitsAcc -= 5;
      result += BASE32_ALPHA[(bits >> bitsAcc) & 0x1F];
    }
  }
  
  if (bitsAcc > 0) {
    result += BASE32_ALPHA[(bits << (5 - bitsAcc)) & 0x1F];
  }
  
  return result;
}

// Base32 decode helper - char to value
static int Base32CharValue(char c) {
  if (c >= 'a' && c <= 'z') c = c - 'a' + 'A';
  if (c == 'O') c = '0';
  if (c == 'I' || c == 'L') c = '1';
  const char* pos = strchr(BASE32_ALPHA, c);
  return pos ? (int)(pos - BASE32_ALPHA) : -1;
}

// Base32 decode
bool Base32Decode(const std::string& s, uint8_t* out, size_t outLen) {
  uint64_t bits = 0;
  int bitsAcc = 0;
  size_t byteIdx = 0;
  
  for (char c : s) {
    int val = Base32CharValue(c);
    if (val < 0) return false;
    
    bits = (bits << 5) | val;
    bitsAcc += 5;
    
    if (bitsAcc >= 8) {
      bitsAcc -= 8;
      if (byteIdx >= outLen) return false;
      out[byteIdx++] = (uint8_t)((bits >> bitsAcc) & 0xFF);
    }
  }
  
  return byteIdx == outLen;
}

// CRC-16/CCITT-FALSE (poly 0x1021, init 0xFFFF)
uint16_t CRC16(const uint8_t* data, size_t len) {
  uint16_t crc = 0xFFFF;
  for (size_t i = 0; i < len; i++) {
    crc ^= ((uint16_t)data[i]) << 8;
    for (int j = 0; j < 8; j++)
      crc = (crc & 0x8000) ? (crc << 1) ^ 0x1021 : crc << 1;
  }
  return crc;
}

// CRC append - 4 Base32 characters
std::string AppendCRC(const std::string& b32) {
  uint16_t crc = CRC16((const uint8_t*)b32.data(), b32.size());
  uint32_t crcBits = (uint32_t)crc;
  
  char crcB32[5];
  for (int i = 3; i >= 0; i--) {
    crcB32[i] = BASE32_ALPHA[crcBits & 0x1F];
    crcBits >>= 5;
  }
  crcB32[4] = '\0';
  
  return b32 + std::string(crcB32, 4);
}

// CRC check
bool CheckCRC(const std::string& full) {
  if (full.length() < 5) return false;
  
  std::string payload = full.substr(0, full.length() - 4);
  std::string expected = AppendCRC(payload);
  
  return full == expected;
}

// Weighted mod-32 check symbol
static char CheckSymbol(const std::string& s) {
  uint32_t sum = 0;
  for (size_t i = 0; i < s.size(); i++) {
    const char* pos = strchr(BASE32_ALPHA, s[i]);
    if (!pos) return '0';
    sum += (uint32_t)(pos - BASE32_ALPHA) * (uint32_t)(i + 1);
  }
  return BASE32_ALPHA[sum % 32];
}

// Format Account ID - 8 bytes -> XXXX-XXXX-XXXX-XC (14 chars)
std::string FormatAccountId(const uint8_t raw[8]) {
  std::string b32 = Base32Encode(raw, 8); // 13 characters
  char check = CheckSymbol(b32);
  std::string full = b32 + check; // 14 characters
  
  // Format: XXXX-XXXX-XXXX-XC
  return full.substr(0,4) + "-" + full.substr(4,4) + "-" + 
         full.substr(8,4) + "-" + full.substr(12,2);
}

// Decode Account ID
bool DecodeAccountId(const std::string& formatted, uint8_t out[8]) {
  // Remove dashes
  std::string clean;
  for (char c : formatted) {
    if (c != '-' && c != ' ') clean += c;
  }
  
  if (clean.length() != 14) return false;
  
  // Check symbol verification
  std::string b32 = clean.substr(0, 13);
  char checkGot = clean[13];
  char checkExp = CheckSymbol(b32);
  
  if (checkGot != checkExp) return false;
  
  // Decode 13 characters -> 8 bytes
  return Base32Decode(b32, out, 8);
}

// Input normalizasyon - boşluk/tire sil, büyük harf, O->0, I/L->1
std::string NormalizeInput(const std::string& raw, size_t expectedLen, Status& err) {
  if (raw.size() > MAX_INPUT_LEN) {
    err = BAD_INPUT;
    return "";
  }
  
  std::string out;
  out.reserve(raw.size());
  
  for (unsigned char c : raw) {
    if (isalnum(c)) {
      char ch = toupper(c);
      if (ch == 'O') ch = '0';
      if (ch == 'I' || ch == 'L') ch = '1';
      out += ch;
    }
    // tire, boşluk, satır sonu vb. silinir
  }
  
  if (out.size() != expectedLen) {
    err = BAD_INPUT;
    return "";
  }
  
  err = OK;
  return out;
}
