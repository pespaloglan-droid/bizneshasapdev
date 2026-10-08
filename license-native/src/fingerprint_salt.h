// src/fingerprint_salt.h
// Bu dosya ilk build'de rastgele üretilir ve GİT'e EKLENMEMELİDİR
#pragma once
#include <cstdint>

// 16 baytlık gömülü sabit salt (ilk build'de üretilir)
static const uint8_t FINGERPRINT_SALT[16] = {
  0x4a, 0x7f, 0x83, 0x2e, 0xb5, 0xc9, 0x16, 0xd4,
  0x91, 0x3a, 0x6e, 0xf2, 0x58, 0xba, 0x0c, 0x47
};
