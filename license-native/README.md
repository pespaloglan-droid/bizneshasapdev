# Offline Lisans Sistemi - Biznes Hasap POS (PC + Android APK)

Hesaba ve cihaza bağlı, imzalı, offline lisans sistemi. **Tek C++ kaynak kodu, iki platform:** PC (Electron) ve Android (React Native + nodejs-mobile).

## İçindekiler

- [Özellikler](#özellikler)
- [Mimari](#mimari)
- [Kurulum ve Build](#kurulum-ve-build)
- [Kullanım](#kullanım)
- [Admin Aracı](#admin-aracı)
- [Güvenlik](#güvenlik)
- [Tehdit Modeli](#tehdit-modeli)
- [Test](#test)
- [Sorun Giderme](#sorun-giderme)

---

## Özellikler

### Lisans Mekanizması
- ✅ **Hesap + Cihaz bağlı**: Her anahtar tek hesap ve tek cihaza özel
- ✅ **5 plan**: 1 ay / 3 ay / 6 ay / 1 yıl / özel gün sayısı (1-730)
- ✅ **Offline doğrulama**: Internet gerektirmez, Ed25519 imza doğrulaması
- ✅ **Saat manipülasyonu koruması**: lastSeen + elapsed realtime (Android) + mtime (PC)
- ✅ **Replay koruması**: Her anahtar sadece bir kez kullanılabilir
- ✅ **Özellik bitleri**: 6 modül (stok, rapor, barkod, fiş, kasa, kullanıcı) granüler kontrol
- ✅ **Cihaz değişimi**: REBIND kodu ile yeni cihaza taşıma
- ✅ **Saat kurtarma**: clock-reset kodu ile saat geri alma durumu çözümü

### Platform Desteği
- **PC**: Windows (x64), macOS (x64/arm64), Linux (x64/arm64)
- **Android**: arm64-v8a, armeabi-v7a, x86_64 (API 23+)
- **Tek native modül**: N-API ile her iki platformda çalışır

### Güvenlik Katmanları
- ✅ Ed25519 imza doğrulaması (tweetnacl)
- ✅ Hardware-backed key storage (Android Keystore / Windows DPAPI / TPM)
- ✅ Multi-point license checking (her modül/IPC/DB native'den geçer)
- ✅ Data encryption (`deriveKey` ile db/backup/reports/export anahtarları)
- ✅ APK repack detection (imza hash doğrulaması)
- ✅ State file integrity (atomic write, dual location, checksum)
- ✅ Anti-debug / root detection (pasif, sessiz)

---

## Mimari

```
┌──────────────────────────────────────────────────────────────────┐
│                        UYGULAMA (JS)                              │
├──────────────────────────────────────────────────────────────────┤
│  gate.js (Lisans Kapısı)                                         │
│  ├─ sale() → SATIS modülü                                        │
│  ├─ stock() → STOK modülü                                        │
│  ├─ report() → RAPOR modülü                                      │
│  └─ ... (11 modül, hepsi lisans kontrolünden geçer)             │
├──────────────────────────────────────────────────────────────────┤
│  native.js (N-API Wrapper)                                       │
│  ├─ createAccountId()                                            │
│  ├─ getRequestCode(accountId)                                    │
│  ├─ setRootCode(accountId, rootCode)                            │
│  ├─ activate(accountId, key)                                     │
│  ├─ checkLicense(accountId)                                      │
│  └─ deriveKey(accountId, purpose) → 32-byte key                 │
├──────────────────────────────────────────────────────────────────┤
│            license.node / license.so (C++)                        │
│  ├─ Fingerprint (5 bileşen: CPU/MAC/serial/disk/board)          │
│  ├─ Codec (Crockford Base32 + CRC16)                            │
│  ├─ State (şifreli durum dosyası, atomic write)                 │
│  ├─ Business (KDV/kâr/stok hesaplamaları - native)              │
│  └─ Integrity (imza hash check, multi-point)                    │
├──────────────────────────────────────────────────────────────────┤
│            tweetnacl.c (Ed25519 + SHA-512)                       │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                    ADMIN (Key Generator)                          │
├──────────────────────────────────────────────────────────────────┤
│  LisansYonetici.exe (Electron GUI - portable)                    │
│  ├─ Kilit ekranı (parola)                                        │
│  ├─ Platform seçimi (PC / APK)                                   │
│  └─ Key oluştur (istek kodu → KEY OLUŞTUR)                      │
├──────────────────────────────────────────────────────────────────┤
│  admin/core/license-core.js (Paylaşılan çekirdek)               │
│  ├─ keygen / sign / decode / inspect                            │
│  ├─ rebind / clock-reset / root                                 │
│  └─ sequence tracking (issued.json)                             │
├──────────────────────────────────────────────────────────────────┤
│  admin/license-admin.js (CLI alternatifi)                        │
└──────────────────────────────────────────────────────────────────┘
```

---

## Kurulum ve Build

### Gereksinimler

**PC:**
- Node.js 18+
- Python 3.x
- Windows: Visual Studio 2019+ (C++ build tools)
- macOS: Xcode Command Line Tools
- Linux: g++ 7+, make

**Android:**
- Node.js 18+
- Android NDK r21+
- nodejs-mobile (React Native bridge)

### PC Build

```bash
cd license-native

# Bağımlılıkları yükle
npm install

# Native modülü derle
npm run build-native

# Test
npm test

# Release check (production öncesi)
npm run release-check
```

### Android Build

```bash
cd license-native

# Android için derle (nodejs-mobile ile)
npm run build-android

# Çıktı: build/lib/{arm64-v8a,armeabi-v7a,x86_64}/license.so
```

### Admin GUI Build

```bash
cd admin-gui

# Bağımlılıkları yükle
npm install

# Windows portable .exe
npm run build

# Tüm platformlar
npm run build-all

# Çıktı: dist/LisansYonetici-1.0.0.exe
```

---

## Kullanım

### 1. İlk Kurulum (Admin)

#### GUI Yöntemi (Önerilen)

1. `LisansYonetici.exe`'yi çift tıkla
2. İlk açılışta "Yeni admin anahtarı oluştur" → Parola belirle (min 12 karakter)
3. `src/public_keys.h` oluşturulur
4. Uygulamayı yeniden derle (public key gömülür)

#### CLI Yöntemi

```bash
node admin/license-admin.js keygen
# Çıktı: secret.key + public_keys.h
```

### 2. Kullanıcıya Lisans Verme

#### Kullanıcı Tarafı (1. Adım)

Uygulamada:
1. Yeni hesap oluştur → **Hesap ID** otomatik üretilir (bir kez, değişmez)
2. Lisans ekranına git
3. **İstek Kodu**'nu kopyala
4. WhatsApp/Telegram ile bize gönder

#### Admin Tarafı (2. Adım)

**GUI:**
1. LisansYonetici.exe → Parola gir
2. Platform seç (PC / APK)
3. İstek kodunu yapıştır → Otomatik decode edilir
4. Süre seç (1 ay / 3 ay / 6 ay / 1 yıl / özel)
5. **KEY OLUŞTUR** → Kök kod (ilk kullanımda) + Lisans anahtarı
6. Kopyala/Kaydet → Kullanıcıya gönder

**CLI:**
```bash
node admin/license-admin.js decode-request <İSTEK_KODU>
node admin/license-admin.js sign --request <İSTEK_KODU> --plan quarterly --note "Müşteri X"
```

#### Kullanıcı Tarafı (3. Adım)

1. **Kök Kod**'u gir (sadece ilk kullanımda)
2. **Lisans Anahtarı**'nı gir
3. **Aktifleştir** → Tüm modüller açılır

### 3. Lisans Yenileme

Aynı akış tekrarlanır:
- Kullanıcı yeni istek kodu gönderir (Hesap ID aynı, deviceAnchor aynı)
- Admin yeni anahtar üretir (sequence artırılır, flags=0x01 extend biti)
- Kullanıcı yeni anahtarı girer → Süre uzar

### 4. Cihaz Değişimi (REBIND)

**Admin:**
```bash
# CLI
node admin/license-admin.js rebind --request <YENİ_CİHAZ_İSTEK_KODU>
node admin/license-admin.js root --account <HESAP_ID>

# GUI: Kayıtlar → Rebind Kodu Üret
```

**Kullanıcı:**
1. Yeni cihazda aynı hesabı aç (Hesap ID aynı)
2. Kök kodu tekrar gir
3. Rebind anahtarını gir → Yeni cihazda lisans aktif

### 5. Saat Kurtarma (Clock Reset)

Saat geri alınmış / yedek geri yüklenmiş / cihaz yeniden başlatılmış:

**Admin:**
```bash
node admin/license-admin.js clock-reset --request <İSTEK_KODU>
# GUI: Kayıtlar → Clock-Reset Kodu Üret
```

**Kullanıcı:**
Clock-reset anahtarını gir → Saat kontrolü resetlenir

---

## Admin Aracı

### LisansYonetici.exe (GUI)

**Ekran 1: Kilit**
- Parola gir → Kilidi aç
- İlk kulanımda: Yeni kök anahtar oluştur

**Ekran 2: Platform**
- PC veya APK seç

**Ekran 3: Key Oluştur**
- İstek kodu yapıştır → Otomatik decode
- Süre seç (1-12 ay / özel gün)
- Gelişmiş (optional): Özellikler, max kasa, aktivasyon süresi
- **KEY OLUŞTUR** → Kök kod + Lisans anahtarı
- Kopyala / .txt kaydet / WhatsApp mesajı

**Sekme: Kayıtlar**
- Son üretilen anahtarlar
- Anahtar incele
- Clock-reset / Rebind üret

**Güvenlik:**
- Otomatik kilit: 10 dakika
- Ağ erişimi: YOK
- contextIsolation: true

### CLI Alternatifleri

```bash
# Anahtar üret
node admin/license-admin.js sign --request <KOD> --plan monthly

# İstek kodu decode
node admin/license-admin.js decode-request <KOD>

# Anahtar incele
node admin/license-admin.js inspect <ANAHTAR>

# Kayıtları listele
node admin/license-admin.js list

# Rebind
node admin/license-admin.js rebind --request <YENİ_CİHAZ_KODU>

# Clock-reset
node admin/license-admin.js clock-reset --request <KOD>

# Root code
node admin/license-admin.js root --account <HESAP_ID>
```

---

## Güvenlik

### Kapsam ve Sınırlar

Bu sistem **pratikte kırılmaz** hedefine yöneliktir, ancak şu sınırları vardır:

✅ **KORUR:**
- Normal kullanıcıların kopyalama/paylaşma girişimlerini
- Saat manipülasyonunu (geri alma, ileri alma)
- Basit yamalama (boolean değişkenleri değiştirme)
- Lisanssız veritabanı erişimini (şifreli)
- APK yeniden paketlemeyi (imza kontrolü)
- State dosyası manipülasyonunu

❌ **ENGELLEYEMEZ (teorik sınır):**
- Gelişmiş reverse engineering (kararlı saldırgan)
- Native binary'nin detaylı analizi ve yaması
- Bellek dump ile key çıkarma
- Root/jailbreak'li cihazda state kopyalama
- Hardware debugger ile kod analizi

**Amaç:** Kırma maliyetini yasal lisans fiyatının **çok üzerine** çıkarmak.

### Güvenlik Katmanları

#### 1. Kriptografi (Temel)
- Ed25519 imza (tweetnacl)
- Public key gömülü (src/public_keys.h)
- 64-byte detached signature
- SHA-512 hash

#### 2. Cihaz Bağlama
- 5 bileşen fingerprint: CPU ID, MAC address, Serial, Disk ID, Board ID
- minMatch = 3 (2 bileşen değişse de çalışır)
- deviceAnchor (4-byte hash) istek kodunda taşınır

#### 3. Saat Manipülasyonu Koruması
- `lastSeen` (wall clock) kaydedilir
- **Android:** `elapsedRealtime` (boot saniyesi) çapraz kontrol
- **PC:** State dosyası mtime kontrolü
- Geri alma → `CLOCK_ROLLBACK` (-3)
- clock-reset kodu ile kurtarma

#### 4. Replay Koruması
- Her anahtar sadece bir kez kullanılır
- Sequence numarası state'te saklanır
- İkinci kullanım → `REPLAYED` (-4)

#### 5. Veri Şifreleme (`deriveKey`)
- Lisanstan türetilen anahtarlar:
  - `db`: Ana veritabanı
  - `backup`: Yedek dosyaları
  - `reports`: Rapor çıktıları
  - `export`: Dışa aktarım dosyaları
- Lisanssız cihazda `deriveKey` → `null`
- Şifreli veri açılamaz → uygulama çalışmaz

#### 6. Native İş Mantığı (Sertleştirme)
- KDV/Kâr/Stok hesaplamaları C++'ta
- Her fonksiyon içten lisans kontrolü yapar
- JS yamalanabilir, ama native hesaplamalar olmadan sonuç üretilmez

#### 7. APK Repack Tespiti
- Uygulama imzası SHA-256 hash'i native'e gömülür
- Runtime'da imza karşılaştırılır
- Farklı imza → `STATE_TAMPERED` (-11)

#### 8. Multi-Point Checking
- 8+ farklı noktadan lisans kontrolü
- 2+ nokta gecikmeli/rastgele tetiklenir
- Native kod checksum kontrolü

#### 9. Anti-Debug (Pasif)
- Debugger/Frida/root tespiti
- Uygulama çökmez (sinyal vermez)
- Sessizce `deriveKey` → `null`

#### 10. Hardware-Backed Storage
- **Android:** Keystore (StrongBox öncelikli)
- **Windows:** TPM (varsa) / DPAPI
- **macOS/Linux:** 0600 izinli dosya

### Admin Anahtar Güvenliği

⚠️ **TEK HATA NOKTASI:** `secret.key` çalınırsa sistem çöker.

**Koruma:**
1. **Offline makine**: Internet'e hiç bağlanmaz
2. **Parola koruması**: scrypt N=2^17 + secretbox
3. **Shamir 2-of-3**: Anahtar 3 paya bölünür, 2'si yeterli
4. **Şifreli yedek**: `issued.json` şifreli saklanır
5. **Rebind takibi**: Aynı hesaba 2+ rebind → kırmızı rozet

---

## Tehdit Modeli

| Tehdit | Mekanizma | Etkinlik | Sınır |
|--------|-----------|----------|-------|
| **Anahtar paylaşımı** | accountId + deviceAnchor | 🟢 Yüksek | Aynı anahtar farklı cihazda çalışmaz |
| **Saat geri alma** | lastSeen + elapsedRealtime + mtime | 🟡 Orta | Tam yedek geri yükleme atlatır; clock-reset gerekir |
| **Lisanssız kullanım** | Gate + deriveKey + native iş mantığı | 🟢 Yüksek | JS yaması veriye erişemez |
| **Boolean yamalama** | deriveKey ile veri şifreleme | 🟢 Yüksek | `allowed=true` yaması veri açmaz |
| **Cihaz değişimi** | 5 bileşen + minMatch=3 | 🟢 Yüksek | 3+ bileşen değişirse rebind gerekir |
| **State kopyalama** | installSecret (hardware-backed) | 🟡 Orta | Root'lu cihazda taşınabilir |
| **APK repack** | İmza hash doğrulaması | 🟡 Orta | Hash'i de patch'leyen atlatır |
| **Reverse engineering** | Native C++ | 🔴 Düşük | Kararlı saldırgan aşabilir (maliyet artar) |
| **Admin secret.key çalınması** | Offline + Shamir 2-of-3 + şifreli | 🟢 Yüksek | İçeriden kötü niyet dışında |

**Renk Kodu:**
- 🟢 Yüksek: Sıradan kullanıcı ve hatta teknik kullanıcı için pratikte aşılamaz
- 🟡 Orta: Gelişmiş teknik bilgi + özel araçlar gerektirir
- 🔴 Düşük: Kararlı, deneyimli saldırgan aşabilir (ancak maliyet yüksek)

---

## Test

### Unit Test

```bash
npm test
# 13 test: planlar, replay, yenileme, deriveKey, gate, navigasyon, vectors
```

### Test Kapsamı

- ✅ Geçerli planlar (1-4, 255)
- ✅ Hesap uyumsuzluğu
- ✅ Replay attack
- ✅ Yenileme (extend)
- ✅ deriveKey (lisanslı/lisanssız)
- ✅ Çapraz vektörler (CRC16, Base32, imza)
- ✅ Gate: 11 modül kilidi
- ✅ Aktivasyon sonrası modüller açık
- ✅ Özellik kilidi (features bitleri)
- ✅ Navigasyon koruması
- ✅ GUI/CLI parity (tek çekirdek)
- ✅ Bozuk istek kodu normalize
- ✅ Kilitli çekirdek imza üretmez

### Release Check

```bash
npm run release-check
```

Kontroller:
- Binary strip (debug symbol yok)
- Log çıktısı yok (console.log, printf)
- Ağ erişimi yok (http, socket)
- Public key tanımlı
- Hardcoded secret yok

---

## Sorun Giderme

### "İstek kodu oluşturulamadı"

**Sebep:** Native modül yüklenmedi
**Çözüm:**
```bash
npm run build-native
# Veya Android:
npm run build-android
```

### "Kök kodu hatalı"

**Sebep:** Hesap ID uyumsuz veya kök kod başka hesaba ait
**Çözüm:** Doğru hesabın istek kodunu admin'e gönder

### "Bu anahtar başka bir cihaza ait" (DEVICE_MISMATCH)

**Sebep:** Cihaz değişti (3+ bileşen)
**Çözüm:** Admin'den REBIND kodu iste

### "Cihaz saati geri alınmış" (CLOCK_ROLLBACK)

**Sebep:** Saat değiştirilmiş veya eski yedek geri yüklenmiş
**Çözüm:** Admin'den clock-reset kodu iste

### "Durum dosyası hasarlı" (STATE_TAMPERED)

**Sebep:** State dosyası bozuk veya manuel değiştirilmiş
**Çözüm:**
1. İkincil kopya otomatik devreye girer
2. Yoksa yeni hesap aç + yeni lisans al

### APK: "Yeniden paketlenmiş APK tespit edildi"

**Sebep:** Orijinal olmayan APK (imza farklı)
**Çözüm:** Orijinal APK'yı kullan

---

## Lisans

Bu proje özel kullanım içindir. Kaynak kod sahibi tarafından izin verilmedikçe kopyalanamaz, değiştirilemez veya dağıtılamaz.

---

## Sürüm

- **v1.0.0** - İlk sürüm
- Platform: PC (win/mac/linux) + Android (arm64/armv7/x86_64)
- Kripto: Ed25519 (tweetnacl)
- UI: Electron (PC) + React Native (Android)
- Admin: LisansYonetici.exe (portable)

---

## İletişim

Lisans sorunları ve destek için:
- Telegram/WhatsApp: [BİLGİ EKLENECEK]
- İstek kodu formatı: 24 karakter (XXXX-XXXX-XXXX-XXXX-XXXX-XXXX)

---

**NOT:** Bu sistem internet gerektirmez, tüm doğrulama offline yapılır. Kullanıcılarınız Türkmenistan'da güvenle kullanabilir.
