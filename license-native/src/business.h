// src/business.h
#pragma once
#include <napi.h>

// İş mantığı fonksiyonları - hepsi lisans kontrolü ile korunur
Napi::Value CalcReceiptTotals(const Napi::CallbackInfo& info);
Napi::Value CalcProfitReport(const Napi::CallbackInfo& info);
Napi::Value CalcStockValue(const Napi::CallbackInfo& info);
