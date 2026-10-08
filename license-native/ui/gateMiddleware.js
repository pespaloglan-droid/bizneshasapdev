// ui/gateMiddleware.js — router/navigasyon koruması
// PC (Electron renderer) ve APK (React Navigation) için aynı mantık
'use strict';
const gate = require('../gate');

// Route -> gerekli modül eşleşmesi (uygulamanın tüm ekranları burada)
const ROUTE_GUARD = {
  'SaleScreen':      gate.MOD.SATIS,
  'PurchaseScreen':  gate.MOD.ALIS,
  'StockScreen':     gate.MOD.STOK,
  'RegisterScreen':  gate.MOD.KASA,
  'CustomerScreen':  gate.MOD.MUSTERI,
  'SupplierScreen':  gate.MOD.TEDARIKCI,
  'ReportScreen':    gate.MOD.RAPOR,
  'PriceScreen':     gate.MOD.FIYAT,
  'SettingsScreen':  gate.MOD.AYARLAR,
  'BackupScreen':    gate.MOD.YEDEK,
  'UserScreen':      gate.MOD.KULLANICI,
};

// Navigasyon middleware'i: geçiş yapılmadan ÖNCE çağrılır
function navigationGuard(routeName, navigate) {
  const mod = ROUTE_GUARD[routeName];
  if (!mod) {
    // lisanssız ekranlar (lisans ekranı, hakkında)
    return navigate(routeName);
  }

  const g = gate.guard(mod);
  if (g.allowed) {
    return navigate(routeName);
  }

  // İZİN YOK → lisans ekranına yönlendir
  return navigate('LicenseScreen', {
    blockedRoute: routeName,
    reason: g.reason,
    info: g.info
  });
}

// Kiril -> Latin normalizasyon (APK için)
function normalizeLicenseInput(input) {
  const cyrillic = {
    'А': 'A', 'В': 'B', 'С': 'C', 'Е': 'E', 'Н': 'H',
    'К': 'K', 'М': 'M', 'О': 'O', 'Р': 'P', 'Т': 'T', 'Х': 'X',
    'а': 'A', 'в': 'B', 'с': 'C', 'е': 'E', 'н': 'H',
    'к': 'K', 'м': 'M', 'о': 'O', 'р': 'P', 'т': 'T', 'х': 'X'
  };

  let output = '';
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    output += cyrillic[ch] || ch;
  }

  return output;
}

module.exports = {
  navigationGuard,
  normalizeLicenseInput,
  ROUTE_GUARD
};
