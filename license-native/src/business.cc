// src/business.cc - İş mantığı native implementasyonu
#include "business.h"
#include "integrity.h"
#include "constants.h"
#include "codec.h"

// Fiş/fatura toplamı + KDV hesabı
Napi::Value CalcReceiptTotals(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  // Lisans kontrolü - ZORUNLU
  if (info.Length() < 2 || !info[0].IsString()) {
    return Napi::Number::New(env, BAD_INPUT);
  }
  
  std::string accountIdStr = info[0].As<Napi::String>();
  uint8_t accountId[8];
  if (!DecodeAccountId(accountIdStr, accountId)) {
    return Napi::Number::New(env, BAD_INPUT);
  }
  
  Status st = InternalFullLicenseCheck(accountId);
  if (st != OK) {
    return Napi::Number::New(env, st);
  }
  
  // İş mantığı - items array beklenir
  if (!info[1].IsArray()) {
    return Napi::Number::New(env, BAD_INPUT);
  }
  
  Napi::Array items = info[1].As<Napi::Array>();
  
  double subtotal = 0.0;
  double taxTotal = 0.0;
  
  for (uint32_t i = 0; i < items.Length(); i++) {
    Napi::Value itemVal = items[i];
    if (!itemVal.IsObject()) continue;
    
    Napi::Object item = itemVal.As<Napi::Object>();
    
    double price = item.Get("price").ToNumber().DoubleValue();
    double qty = item.Get("qty").ToNumber().DoubleValue();
    double taxRate = item.Has("taxRate") ? 
                     item.Get("taxRate").ToNumber().DoubleValue() : 0.18;
    
    double lineTotal = price * qty;
    double lineTax = lineTotal * taxRate;
    
    subtotal += lineTotal;
    taxTotal += lineTax;
  }
  
  Napi::Object result = Napi::Object::New(env);
  result.Set("subtotal", Napi::Number::New(env, subtotal));
  result.Set("taxTotal", Napi::Number::New(env, taxTotal));
  result.Set("total", Napi::Number::New(env, subtotal + taxTotal));
  
  return result;
}

// Kâr raporu hesaplaması
Napi::Value CalcProfitReport(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  // Lisans kontrolü
  if (info.Length() < 2 || !info[0].IsString()) {
    return Napi::Number::New(env, BAD_INPUT);
  }
  
  std::string accountIdStr = info[0].As<Napi::String>();
  uint8_t accountId[8];
  if (!DecodeAccountId(accountIdStr, accountId)) {
    return Napi::Number::New(env, BAD_INPUT);
  }
  
  Status st = InternalFullLicenseCheck(accountId);
  if (st != OK) {
    return Napi::Number::New(env, st);
  }
  
  // İş mantığı - sales array beklenir
  if (!info[1].IsArray()) {
    return Napi::Number::New(env, BAD_INPUT);
  }
  
  Napi::Array sales = info[1].As<Napi::Array>();
  
  double revenue = 0.0;
  double cost = 0.0;
  
  for (uint32_t i = 0; i < sales.Length(); i++) {
    Napi::Value saleVal = sales[i];
    if (!saleVal.IsObject()) continue;
    
    Napi::Object sale = saleVal.As<Napi::Object>();
    
    double salePrice = sale.Get("salePrice").ToNumber().DoubleValue();
    double costPrice = sale.Get("costPrice").ToNumber().DoubleValue();
    double qty = sale.Get("qty").ToNumber().DoubleValue();
    
    revenue += salePrice * qty;
    cost += costPrice * qty;
  }
  
  double profit = revenue - cost;
  double margin = revenue > 0 ? (profit / revenue) * 100.0 : 0.0;
  
  Napi::Object result = Napi::Object::New(env);
  result.Set("revenue", Napi::Number::New(env, revenue));
  result.Set("cost", Napi::Number::New(env, cost));
  result.Set("profit", Napi::Number::New(env, profit));
  result.Set("margin", Napi::Number::New(env, margin));
  
  return result;
}

// Stok değerleme (FIFO ortalama)
Napi::Value CalcStockValue(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  // Lisans kontrolü
  if (info.Length() < 2 || !info[0].IsString()) {
    return Napi::Number::New(env, BAD_INPUT);
  }
  
  std::string accountIdStr = info[0].As<Napi::String>();
  uint8_t accountId[8];
  if (!DecodeAccountId(accountIdStr, accountId)) {
    return Napi::Number::New(env, BAD_INPUT);
  }
  
  Status st = InternalFullLicenseCheck(accountId);
  if (st != OK) {
    return Napi::Number::New(env, st);
  }
  
  // İş mantığı - stock array beklenir
  if (!info[1].IsArray()) {
    return Napi::Number::New(env, BAD_INPUT);
  }
  
  Napi::Array stock = info[1].As<Napi::Array>();
  
  double totalValue = 0.0;
  uint32_t totalQty = 0;
  
  for (uint32_t i = 0; i < stock.Length(); i++) {
    Napi::Value itemVal = stock[i];
    if (!itemVal.IsObject()) continue;
    
    Napi::Object item = itemVal.As<Napi::Object>();
    
    double costPrice = item.Get("costPrice").ToNumber().DoubleValue();
    uint32_t qty = item.Get("qty").ToNumber().Uint32Value();
    
    totalValue += costPrice * qty;
    totalQty += qty;
  }
  
  double avgCost = totalQty > 0 ? totalValue / totalQty : 0.0;
  
  Napi::Object result = Napi::Object::New(env);
  result.Set("totalValue", Napi::Number::New(env, totalValue));
  result.Set("totalQty", Napi::Number::New(env, totalQty));
  result.Set("avgCost", Napi::Number::New(env, avgCost));
  
  return result;
}
