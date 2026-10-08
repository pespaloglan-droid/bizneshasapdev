// gate.js — LİSANS KAPISI — TÜM İŞLEMLER KİLİTLİ
'use strict';
const native = require('./native');

// İşlem modülleri (uygulamadaki her ana fonksiyonel alan)
const MOD = {
  SATIS:      1 << 0,   // satış ekranı, satış kaydı, iade, fiş yazdırma
  ALIS:       1 << 1,   // alış faturası, tedarikçiden giriş
  STOK:       1 << 2,   // stok sayım, giriş/çıkış, ürün ekle/düzenle
  KASA:       1 << 3,   // kasa hareketi, açılış/kapanış, para transferi
  MUSTERI:    1 << 4,   // cari müşteri işlemleri, borç/alacak
  TEDARIKCI:  1 << 5,   // cari tedarikçi işlemleri
  RAPOR:      1 << 6,   // tüm raporlar (satış, kâr, stok, cari...)
  FIYAT:      1 << 7,   // fiyat değiştirme, barkod etiket
  AYARLAR:    1 << 8,   // yazıcı, vergi, kullanıcı ayarları
  YEDEK:      1 << 9,   // yedekleme ve geri yükleme
  KULLANICI:  1 << 10,  // kullanıcı yönetimi
};

let currentAccountId = null;

function selectAccount(accountId) {
  currentAccountId = accountId;
}

// TEK KAPI: tüm işlemler buradan geçer
// Dönüş: { allowed, status, reason, info }
function guard(moduleBit) {
  if (!currentAccountId) {
    return {
      allowed: false,
      status: native.NOT_ACTIVATED,
      reason: 'NO_ACCOUNT',
      info: null
    };
  }

  const info = native.checkLicense(currentAccountId);
  const now = Math.floor(Date.now() / 1000);

  if (info.status === native.EXPIRED || now > info.graceUntil) {
    return {
      allowed: false,
      status: -1,
      reason: 'EXPIRED',
      info
    };
  }

  if (info.status !== native.OK) {
    return {
      allowed: false,
      status: info.status,
      reason: 'NO_LICENSE',
      info
    };
  }

  // Süre dolmasına 3 gün kala uyarı (izin ver ama uyar)
  if (info.daysLeft <= 3) {
    info.warnRenew = true;
  }

  // Features gating: bazı modüller features bit'i ister
  const FEATURE_FOR = {
    [MOD.STOK]:  1 << 1,  // FEAT_STOCK
    [MOD.RAPOR]: 1 << 2,  // FEAT_ADV_REPORTS
    [MOD.KASA]:  1 << 0,  // FEAT_MULTI_REGISTER (çoklu kasa için)
  };

  const fb = FEATURE_FOR[moduleBit];
  if (fb && !(info.features & fb)) {
    return {
      allowed: false,
      status: 0,
      reason: 'FEATURE_LOCKED',
      info
    };
  }

  return {
    allowed: true,
    status: 1,
    reason: 'OK',
    info
  };
}

// Kısayollar — uygulama kodu SADECE bunları çağırır
const gate = {
  MOD,
  selectAccount,
  guard,
  sale:      () => guard(MOD.SATIS),
  purchase:  () => guard(MOD.ALIS),
  stock:     () => guard(MOD.STOK),
  register:  () => guard(MOD.KASA),
  customer:  () => guard(MOD.MUSTERI),
  supplier:  () => guard(MOD.TEDARIKCI),
  report:    () => guard(MOD.RAPOR),
  price:     () => guard(MOD.FIYAT),
  settings:  () => guard(MOD.AYARLAR),
  backup:    () => guard(MOD.YEDEK),
  users:     () => guard(MOD.KULLANICI),
};

module.exports = gate;
