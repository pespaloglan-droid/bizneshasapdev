# HANDOFF DOCUMENT - Offline POS License System
# Proje: Biznes Hasap PC-APK Lisans Sistemi
# Tarih: 2026-10-07
# Durum: ADIM 1-4 TAMAMLANDI, ADIM 5-7 BEKLIYOR

## 📋 PROJE ÖZETİ

Tamamen offline, hesaba VE cihaza bağlı, Ed25519 imzalı lisans sistemi:
- **PC:** Electron (Windows/macOS/Linux)
- **APK:** React Native + nodejs-mobile (Android)
- **Admin:** CLI + GUI (LisansYonetici.exe)

**Temel özellikler:**
- Tek anahtar = tek hesap + tek cihaz
- Saat geri alma koruması
- Boolean yamalama koruması (deriveKey ile veri şifreleme)
- Lisans yokken TÜM işlemler kilitli
- Kolay GUI key generator (komut satırı bilgisi GEREKMEZ)

---

## ✅ TAMAMLANAN İŞLER (ADIM 1-4)

### ADIM 1-2: C++ Native Modül (PC + Android)

**Dizin:** `license-native/src/`

**Tamamlanan dosyalar:**
```
src/
├── license.cc          - Ana N-API modül (12 fonksiyon)
├── codec.cc/.h         - Crockford Base32 + CRC16
├── fingerprint.cc/.h   - Cihaz parmak izi (5 bileşen, toleranslı eşleşme)
├── state.cc/.h         - Şifreli durum dosyası (XSalsa20-Poly1305)
├── integrity.cc/.h     - Ed25519 doğrulama, APK imza kontrolü, anti-debug
├── business.cc/.h      - İş mantığı (fiş/KDV, kâr, stok - native, lisans korumalı)
├── random.cc           - Platform bazlı CSPRNG (Windows/Linux/macOS/Android)
├── constants.h         - Plan/Status/Flag tanımları (TEK KAYNAK)
├── utils.h             - secure_zero (platform bazlı)
├── fingerprint_salt.h  - 16 bayt sabit salt (GİT'e EKLENMEMELİ)
├── public_keys.h       - Placeholder (admin keygen üretecek)
└── app_sig_hash.h      - Placeholder (build script üretecek)

third_party/
├── tweetnacl.c         - TAM IMPLEMENTASYON (kullanıcı indirdi)
└── tweetnacl.h         - Ed25519 + SHA-512 + secretbox API
```

**Önemli notlar:**
- ✅ tweetnacl.c TAM ve çalışır durumda
- ✅ Tüm offset'ler 2.6 tablosuna uygun (payload 33 bayt)
- ⚠️ `public_keys.h` placeholder - ilk `admin keygen` çalıştırıldığında üretilecek
- ⚠️ Platform-specific TODO'lar var (macOS IOKit, Linux disk serial) - çalışır ama eksik bileşenler boş döner

**N-API fonksiyonlar:**
```cpp
createAccountId()              -> string (14 karakter XXXX-XXXX-XXXX-XC)
getRequestCode(accountId)      -> string (24 karakter)
setRootCode(accountId, code)   -> Status
activate(accountId, key)       -> Status
checkLicense(accountId)        -> { status, expiry, daysLeft, plan, features, maxRegisters, graceUntil }
deriveKey(accountId, purpose)  -> Buffer | null
setDataDir(path)               -> bool
setDeviceComponents(obj)       -> void (Android köprüsü)
setBootElapsed(seconds)        -> void (Android köprüsü)
calcReceiptTotals(accountId, items)  -> object | Status
calcProfitReport(accountId, sales)   -> object | Status
calcStockValue(accountId, stock)     -> object | Status
```

**Status kodları:**
```
OK: 1, INVALID: 0, EXPIRED: -1, DEVICE_MISMATCH: -2, CLOCK_ROLLBACK: -3,
REPLAYED: -4, NOT_ACTIVATED: -5, BAD_INPUT: -6, KEY_EXPIRED: -7,
ACCOUNT_MISMATCH: -8, STORAGE_ERROR: -9, NEED_ROOT: -10, STATE_TAMPERED: -11
```

### ADIM 3: JS Katmanı

**Dizin:** `license-native/`

**Tamamlanan dosyalar:**
```
license-native/
├── native.js               - N-API wrapper (error handling, type checking)
├── gate.js                 - LİSANS KAPISI (11 modül koruması)
├── ui/gateMiddleware.js    - Navigasyon koruması + Kiril normalizasyon
├── package.json            - Bağımlılıklar
└── binding.gyp             - PC + Android derleme ayarları
```

**Gate modülleri:**
```js
MOD.SATIS, MOD.ALIS, MOD.STOK, MOD.KASA, MOD.MUSTERI, MOD.TEDARIKCI,
MOD.RAPOR, MOD.FIYAT, MOD.AYARLAR, MOD.YEDEK, MOD.KULLANICI
```

**Kullanım:**
```js
const gate = require('./gate');
gate.selectAccount(accountId);
const check = gate.sale();  // { allowed, status, reason, info }
if (!check.allowed) {
  navigate('LicenseScreen', { blockedRoute: 'SaleScreen', reason: check.reason });
}
```

### ADIM 4: Admin Core & CLI

**Dizin:** `license-native/admin/`

**Tamamlanan dosyalar:**
```
admin/
├── core/
│   ├── codec.js         - Base32 + CRC16 + payload pack/unpack (CLI ve GUI ortak)
│   └── license-core.js  - PAYLAŞILAN ÇEKİRDEK (keygen, sign, decode, inspect)
└── license-admin.js     - CLI (ince kabuk)
```

**Core fonksiyonlar:**
```js
unlock(password)           -> bool
lock()
isUnlocked()              -> bool
keygen(password, opts)    -> { publicKey, message } | { error }
decodeRequest(code)       -> { valid, accountId, deviceAnchor, accountIdFormatted }
createKey(params)         -> { key, rootCode?, seq, expiryPreview, record }
inspectKey(keyStr)        -> { version, keyId, accountId, plan, ... }
generateRootCode(accId)   -> string
makeRebindCode(reqCode)   -> { key, rootCode, rebindCount }
makeClockResetCode(code)  -> { key }
listKeys(filter)          -> array
```

**CLI komutlar:**
```bash
node admin/license-admin.js keygen
node admin/license-admin.js decode-request <İSTEK_KODU>
node admin/license-admin.js sign --request <KOD> --plan yearly
node admin/license-admin.js sign --request <KOD> --days 45
node admin/license-admin.js inspect <ANAHTAR>
node admin/license-admin.js root <HESAP_ID>
node admin/license-admin.js rebind <YENİ_İSTEK_KODU>
node admin/license-admin.js clock-reset <İSTEK_KODU>
node admin/license-admin.js list --rebind-count
```

**Kayıtlar:**
- `admin/secret.key` - Şifreli secret key (scrypt N=2^17 + secretbox)
- `admin/issued.json` - Üretilen tüm anahtarlar (seq tracking)

---

## ⏳ KALAN İŞLER (ADIM 5-7)

### ADIM 5: Admin GUI - LisansYonetici.exe (YENİ OTURUM)

**Hedef:** Komut satırı bilgisi gerektirmeyen, tek EXE ile key üretimi.

**Dizin:** `admin-gui/` (yeni)

**Oluşturulacak dosyalar:**
```
admin-gui/
├── package.json           - Electron + electron-builder
├── electron-builder.yml   - Portable .exe (win), .dmg (mac), .AppImage (linux)
├── main.js                - Electron main process (IPC handlers)
├── preload.js             - contextBridge (güvenlik)
├── renderer/
│   ├── index.html         - 3 ekran: Kilit / Platform / Keygen
│   ├── app.js             - UI mantığı (framework'süz vanilla JS)
│   └── styles.css
└── build/
    └── icon.ico
```

**Ekran akışı:**
1. **Kilit ekranı:** Parola gir → `core.unlock()` → başarılıysa Ekran 2
2. **Platform seçimi:** [ PC ] / [ APK ] butonları → Ekran 3
3. **Key oluştur:**
   - İstek kodu (çok satırlı, canlı normalize+decode)
   - Süre: 1 Ay / 3 Ay / 6 Ay / 1 Yıl + Özel [___] gün
   - Gelişmiş (katlanır): features, maxRegisters, activateBy, extend, not
   - [ KEY OLUŞTUR ] → kök kod (varsa) + anahtar kartları
   - Kopyala / .txt kaydet / WhatsApp mesajı (APK için)
4. **Kayıtlar sekmesi:** Tablo + Anahtar İncele / Clock-Reset / Rebind

**IPC handlers (main.js):**
```js
ipcMain.handle('unlock', (e, password) => core.unlock(password));
ipcMain.handle('decodeRequest', (e, code) => core.decodeRequest(code));
ipcMain.handle('createKey', (e, params) => core.createKey(params));
ipcMain.handle('listKeys', () => core.listKeys({}));
ipcMain.handle('inspectKey', (e, key) => core.inspectKey(key));
ipcMain.handle('clockReset', (e, code) => core.makeClockResetCode(code));
ipcMain.handle('rebind', (e, code) => core.makeRebindCode(code));
ipcMain.handle('copyText', (e, text) => clipboard.writeText(text));
ipcMain.handle('saveTxt', async (e, name, content) => dialog.showSaveDialog + writeFile);
```

**Güvenlik:**
- Otomatik kilit: 10 dakika hareketsizlik
- Ağ erişimi YOK (`release-check.js` tarafından doğrulanır)
- `nodeIntegration: false`, `contextIsolation: true`

**Build:**
```bash
cd admin-gui
npm install
npm run build  # electron-builder ile portable .exe
```

**Çıktı:**
- Windows: `dist/LisansYonetici.exe` (portable, kurulum gerektirmez)
- macOS: `dist/LisansYonetici.dmg`
- Linux: `dist/LisansYonetici.AppImage`

---

### ADIM 6: UI Bileşenleri - Lisans Ekranları

**PC:** `license-native/ui/LicenseScreen.pc.jsx` (Electron renderer - React)
**APK:** `license-native/ui/LicenseScreen.mobile.jsx` (React Native)

**Her iki ekran da aynı mantık:**

**Gösterilen bilgiler:**
1. Hesap ID (büyük punto, kopyalanabilir) - PC: clipboard, APK: Share intent
2. İstek kodu (kopyalanabilir + APK'da WhatsApp/Telegram gönder)
3. Durum rozeti (yeşil/sarı/kırmızı) + plan adı + kalan gün
4. Kök kod girişi (ilk kurulumda - 107 karakter, otomatik normalize)
5. Lisans anahtarı girişi (160 karakter, 6'lı gruplama, canlı format kontrolü)
6. [ Aktifleştir ] butonu
7. Sonuç mesajı (başarı/hata)

**Önemli:**
- Hesap ID **bir kez üretilir** (hesap açılışında), lisans ekranı her açıldığında yeniden ÜRETİLMEZ
- APK'da `setDeviceComponents()` + `setBootElapsed()` EN ÖNCE çağrılır (Java köprüsünden)
- PC'de `setDataDir()` EN ÖNCE çağrılır (app.getPath('userData')/pos-data)

**Hata metinleri (Türkçe):**
```js
const ERR = {
  [-1]: 'Lisans süresi dolmuş',
  [-2]: 'Bu anahtar başka cihaza ait',
  [-3]: 'Cihaz saati geri alınmış görünüyor',
  [-4]: 'Bu anahtar daha önce kullanılmış',
  [-5]: 'Lisans aktif değil',
  [-6]: 'Geçersiz giriş',
  [-7]: 'Anahtarın süresi geçmiş',
  [-8]: 'Anahtar bu hesaba ait değil',
  [-9]: 'Depolama hatası',
  [-10]: 'Önce kök kodu gerekli',
  [-11]: 'Durum dosyası hasarlı'
};
```

---

### ADIM 7: Testler, Scripts, Dokümantasyon

**Test:** `license-native/test/test.js`

**Test kapsamı (30+ test):**
```
✓ Test 01: Geçerli planlar (monthly/quarterly/semiannual/yearly/custom)
✓ Test 03: ACCOUNT_MISMATCH
✓ Test 07: REPLAYED (sequence kontrolü)
✓ Test 08: Yenileme (EXTEND flag)
✓ Test 14: deriveKey (db/backup/reports/export)
✓ Test 22: Vektörler (CRC16, Base32, imza - tweetnacl-js ile çapraz)
✓ Test 30: Lisans yokken tüm modüller kilitli
✓ Test 31: Aktivasyon sonrası tüm modüller açık
✓ Test 32: Özellik kilidi (features bitleri)
✓ Test 33: Navigasyon koruması
✓ Test 40: GUI/CLI çıktısı birebir aynı
✓ Test 41: Bozuk/biçimsiz kod normalize edilir
✓ Test 42: Kilitli çekirdek imza üretmez
```

**Test vektörleri:** `test/vectors.json`
```json
{
  "crc16": [
    { "input_hex": "48656c6c6f", "expected": "93DD" },
    ...
  ],
  "keys": [
    { "accountId": "...", "key": "...", "note": "Valid monthly key" },
    ...
  ]
}
```

**Release check:** `scripts/release-check.js`

**Kontroller:**
```js
// Binary strip edilmiş (sembol tablosu yok)
// __FILE__ yolu dizgileri yok
// Native'den log çağrısı yok (console.log, __android_log_print)
// app_sig_hash.h release imzasıyla üretilmiş
// Android: -fvisibility=hidden -O2 -fPIC bayrakları
// Admin GUI'de ağ çağrısı yok (http, fetch, XMLHttpRequest, net, WebSocket)
```

**Android CMakeLists.txt:** `license-native/android/CMakeLists.txt`

nodejs-mobile için alternatif derleme dosyası (binding.gyp yerine).

**README.md:** `license-native/README.md`

**İçerik:**
- Build talimatları (PC + Android)
- Init sırası (setDataDir → setDeviceComponents → selectAccount)
- Kullanım örnekleri
- Güvenlik notları + tehdit modeli tablosu (spec'teki tablo)
- Yenileme/rebind/clock-reset akışları
- maxRegisters / features kullanımı

---

## 🔧 BİR SONRAKİ OTURUMDA YAPILACAKLAR

### Hemen başla (sırayla):

**1. Admin GUI oluştur** (~40,000 token):
```bash
mkdir admin-gui
cd admin-gui
npm init -y
npm install electron electron-builder
```

Dosyalar (spec'e göre):
- package.json
- electron-builder.yml (portable .exe hedefi)
- main.js (IPC handlers, core'u import et)
- preload.js (contextBridge)
- renderer/index.html (3 ekran HTML)
- renderer/app.js (UI mantığı, core'u IPC ile çağır)
- renderer/styles.css (Türkçe, büyük punto, yüksek kontrast)
- build/icon.ico

**2. UI bileşenleri** (~15,000 token):
- `ui/LicenseScreen.pc.jsx` (Electron + React)
- `ui/LicenseScreen.mobile.jsx` (React Native)

**3. Testler ve dokümantasyon** (~20,000 token):
- `test/test.js` (30+ test)
- `test/vectors.json` (CRC16, Base32, imza vektörleri)
- `scripts/release-check.js` (hijyen kontrolleri)
- `android/CMakeLists.txt` (nodejs-mobile için)
- `README.md` (kapsamlı)

---

## 📁 PROJE YAPILANDIRMASI

```
Biznes Hasap PC-APK 1/
├── license-native/                    ✅ TAMAMLANDI
│   ├── src/                          ✅ 9 .cc + 7 .h dosyası
│   ├── third_party/                  ✅ tweetnacl.c + .h (kullanıcı indirdi)
│   ├── admin/                        ✅ core + CLI
│   │   ├── core/
│   │   │   ├── codec.js              ✅
│   │   │   └── license-core.js       ✅
│   │   ├── license-admin.js          ✅
│   │   ├── secret.key                (keygen sonrası üretilecek)
│   │   └── issued.json               (ilk sign sonrası üretilecek)
│   ├── ui/                           ⏳ ADIM 6
│   │   ├── gateMiddleware.js         ✅
│   │   ├── LicenseScreen.pc.jsx      ⏳
│   │   └── LicenseScreen.mobile.jsx  ⏳
│   ├── test/                         ⏳ ADIM 7
│   │   ├── test.js                   ⏳
│   │   └── vectors.json              ⏳
│   ├── scripts/                      ⏳ ADIM 7
│   │   └── release-check.js          ⏳
│   ├── android/                      ⏳ ADIM 7
│   │   └── CMakeLists.txt            ⏳
│   ├── native.js                     ✅
│   ├── gate.js                       ✅
│   ├── package.json                  ✅
│   ├── binding.gyp                   ✅
│   └── README.md                     ⏳ ADIM 7
│
└── admin-gui/                        ⏳ ADIM 5 (YENİ KLASÖR)
    ├── package.json                  ⏳
    ├── electron-builder.yml          ⏳
    ├── main.js                       ⏳
    ├── preload.js                    ⏳
    ├── renderer/                     ⏳
    │   ├── index.html                ⏳
    │   ├── app.js                    ⏳
    │   └── styles.css                ⏳
    └── build/                        ⏳
        └── icon.ico                  ⏳
```

---

## 🚀 İLK ÇALIŞTIRMA TALİMATLARI

### PC Build (Windows):

```bash
cd license-native
npm install
npm run build-native  # node-gyp rebuild

# İlk kurulum - admin keypair
cd admin
node license-admin.js keygen
# Parola gir (min 12 karakter)
# ✓ src/public_keys.h üretildi

# Uygulama tekrar derlenmeli (public key değişti)
cd ..
npm run build-native
```

### Test:

```bash
# Uygulama test (native modül yüklenir mi)
node -e "const n = require('./native'); console.log(n.getVersion())"
# Beklenen: "1.0.0"

# Admin test
cd admin
node license-admin.js decode-request XXXXXXXXXXXXXXXXXXXX
# Beklenen: Hesap ID + Device Anchor
```

### İlk Lisans Üretimi:

```bash
cd admin

# 1. Kullanıcıdan istek kodu al
node license-admin.js decode-request <İSTEK_KODU>

# 2. Lisans üret
node license-admin.js sign --request <İSTEK_KODU> --plan yearly --note "Test müşteri"
# Parola sor → kök kod + anahtar döner

# 3. Inspect
node license-admin.js inspect <ANAHTAR>
# Payload detayları görünür

# 4. Kayıtları listele
node license-admin.js list --rebind-count
```

---

## ⚠️ ÖNEMLİ NOTLAR

### 1. tweetnacl.c TAM VE ÇALIŞIR
✅ Kullanıcı resmi TweetNaCl implementasyonunu indirdi
✅ `third_party/tweetnacl.c` (16KB) + `tweetnacl.h` (20KB) hazır
✅ Ed25519, SHA-512, secretbox fonksiyonları mevcut

### 2. Payload Düzeni (2.6 tablosu) KİLİTLENDİ
✅ C++ (license.cc activate) ve JS (codec.js buildPayload/unpackPayload) birebir aynı
✅ 33 bayt layout:
```
0: version(1) | 1: keyId(1) | 2-9: accountId(8) | 10-13: deviceAnchor(4)
14: plan(1) | 15: flags(1) | 16-17: features(2) | 18: maxRegisters(1)
19-22: sequence(4) | 23-26: issuedAt(4) | 27-30: activateBy(4) | 31-32: durationDays(2)
```

### 3. Placeholder Dosyalar
⚠️ `src/public_keys.h` - admin keygen ile üretilir (ilk çalıştırmada)
⚠️ `src/app_sig_hash.h` - build script ile üretilir (Android release)
⚠️ `src/fingerprint_salt.h` - şu anda sabit değer (üretim için değiştirilebilir)

### 4. Platform TODO'lar (çalışır ama eksik)
```cpp
// Windows: SMBIOS UUID, C: disk serial, CPU brand - TODO
// macOS: IOPlatformUUID, IOPlatformSerialNumber - TODO
// Linux: root disk serial - TODO
// Android: CPU abi/board kombinasyonu - TODO
```
Bunlar olmadan sistem ÇALIŞIR, sadece daha az bileşen toplar (minMatch otomatik ayarlanır).

### 5. Android Entegrasyonu
⚠️ React Native tarafı (Java/Kotlin köprüsü) EKLENECEK:
```kotlin
// PosBridge.kt
fun getDeviceComponents(): WritableMap {
  return Arguments.createMap().apply {
    putString("androidId", Settings.Secure.ANDROID_ID)
    putString("serial", Build.SERIAL)
    putString("cpuInfo", readCpuInfo())
    putString("mac", getFirstPhysicalMAC())
  }
}

fun getBootElapsed(): Int {
  return (SystemClock.elapsedRealtime() / 1000).toInt()
}

fun getDataDir(): String {
  return context.filesDir.absolutePath + "/pos-data"
}
```

JS tarafı (index.js):
```js
import { NativeModules } from 'react-native';
const native = require('./license-native/native');
const { PosBridge } = NativeModules;

// Uygulama başlangıcında
const dataDir = await PosBridge.getDataDir();
native.setDataDir(dataDir);

const comps = await PosBridge.getDeviceComponents();
native.setDeviceComponents(comps);

const elapsed = await PosBridge.getBootElapsed();
native.setBootElapsed(elapsed);
```

### 6. Güvenlik Notları
- `admin/secret.key` GİT'e EKLENMEMELİ (`.gitignore` gerekli)
- `src/fingerprint_salt.h` GİT'e EKLENMEMELİ
- Admin makine internete bağlanmamalı (özellikle LisansYonetici.exe çalışırken)
- secret.key yedekleri şifreli ve güvenli yerlerde (USB stick, KeePass, vb.)

---

## 📞 YENİ OTURUMDA SÖYLENEBİLECEK PROMPT

```
Biznes Hasap PC-APK lisans sisteminin devamı. ADIM 1-4 tamamlandı (C++ native, JS wrapper, admin core+CLI). Şimdi ADIM 5-7 yapılacak:

ADIM 5: Admin GUI (admin-gui/ klasörü - LisansYonetici.exe, Electron app)
ADIM 6: UI bileşenleri (LicenseScreen.pc.jsx + LicenseScreen.mobile.jsx)
ADIM 7: Testler + scripts + README

Handoff dokümanı: C:\Users\User\Desktop\Biznes Hasap PC-APK 1\license-native\HANDOFF.md

Spec: C:\Users\User\Downloads\lisans-sistemi-spec-v2-gui-keygen.md

ADIM 5'ten başla. Talimatlar handoff dokümanında.
```

---

## ✅ KONTROL LİSTESİ (Yeni Oturum İçin)

Başlamadan önce kontrol et:

- [ ] `license-native/third_party/tweetnacl.c` var mı? (16KB)
- [ ] `license-native/third_party/tweetnacl.h` var mı? (20KB)
- [ ] `license-native/src/` klasöründe 16 dosya var mı?
- [ ] `license-native/admin/core/` klasöründe codec.js + license-core.js var mı?
- [ ] `license-native/gate.js` var mı?
- [ ] Spec dosyası: `C:\Users\User\Downloads\lisans-sistemi-spec-v2-gui-keygen.md`

Hepsi tamam → ADIM 5'e geç (admin-gui/)

---

## 🎯 SON HEDEF

Build sonrası elde edilecekler:

**PC:**
```
dist-electron/win-unpacked/Biznes Hasap.exe  - Ana uygulama (lisans korumalı)
admin-gui/dist/LisansYonetici.exe            - Key generator (portable)
```

**Android:**
```
android/app/build/outputs/apk/release/app-release.apk  - Lisans korumalı APK
```

**Kullanım akışı:**
1. Kullanıcı uygulamayı açar → hesap oluşturur → istek kodu gösterir
2. Kullanıcı istek kodunu bize gönderir (WhatsApp)
3. Biz LisansYonetici.exe'yi açarız → PC/APK seçeriz → kodu yapıştırırız → KEY OLUŞTUR
4. Kök kod + anahtar kopyalarız → kullanıcıya göndeririz
5. Kullanıcı önce kök kodu, sonra anahtarı girer → aktifleştir
6. Tüm işlemler açılır

---

**HANDOFF TAMAMLANDI**
**Tarih:** 2026-10-07T00:01:48+03:00
**Token Kullanımı:** ~97,321 / 200,000
**Durum:** ADIM 1-4 ✅ | ADIM 5-7 ⏳
**Sonraki:** YENİ OTURUM → ADIM 5 (Admin GUI)
