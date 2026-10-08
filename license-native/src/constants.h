// src/constants.h — TEK KAYNAK
#pragma once
#include <cstdint>

enum Plan : uint8_t {
  PLAN_CLOCK_RESET = 0,
  PLAN_MONTHLY     = 1,  // 30 gün
  PLAN_QUARTERLY   = 2,  // 90 gün
  PLAN_SEMIANNUAL  = 3,  // 180 gün
  PLAN_YEARLY      = 4,  // 365 gün
  PLAN_CUSTOM      = 255 // durationDays alanını kullan
};

static const uint16_t PLAN_DAYS[] = { 0, 30, 90, 180, 365 };

static const uint8_t FLAG_EXTEND      = (1 << 0);
static const uint8_t FLAG_REBIND      = (1 << 1);
static const uint8_t FLAG_CLOCK_RESET = (1 << 2);

// Features bitleri
static const uint16_t FEAT_MULTI_REGISTER = (1 << 0);
static const uint16_t FEAT_STOCK          = (1 << 1);
static const uint16_t FEAT_ADV_REPORTS    = (1 << 2);
static const uint16_t FEAT_BARCODE        = (1 << 3);
static const uint16_t FEAT_RECEIPT        = (1 << 4);
static const uint16_t FEAT_MULTI_USER     = (1 << 5);

enum Status : int {
  OK               =  1,
  INVALID          =  0,
  EXPIRED          = -1,
  DEVICE_MISMATCH  = -2,
  CLOCK_ROLLBACK   = -3,
  REPLAYED         = -4,
  NOT_ACTIVATED    = -5,
  BAD_INPUT        = -6,
  KEY_EXPIRED      = -7,
  ACCOUNT_MISMATCH = -8,
  STORAGE_ERROR    = -9,
  NEED_ROOT        = -10,
  STATE_TAMPERED   = -11
};

static const int    MAX_ACCOUNTS    = 64;
static const int    GRACE_DAYS      = 3;
static const int    CLOCK_TOLERANCE = 86400;   // 1 gün
static const int    CLOCK_BACK_TOL  = 6 * 3600;
static const size_t MAX_INPUT_LEN   = 1024;
static const int    MIN_COMPONENTS  = 2;
