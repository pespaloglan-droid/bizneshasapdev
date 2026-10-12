# BİZNES HASAP — PROJE TANITIMI + FAZ D GÖREV DOSYASI

**Amaç:** Bu dosya, projeyi hiç bilmeyen bir yapay zekaya (veya geliştiriciye) FAZ D işlerini yaptırmak için hazırlandı. Proje bağlamı, mevcut durum, kurallar ve görev detayları burada.

**Hazırlanma tarihi:** 2026-10-12
**Proje kökü:** `C:\Users\User\Desktop\Biznes Hasap PC-APK 1`

---

## 1. PROJE NEDİR?

**Biznes Hasap** — Türkmenistan pazarı için POS (satış noktası) + muhasebe uygulaması. İki platformda çalışır:

- **PC:** Electron (Windows, NSIS + portable installer)
- **Mobil:** Capacitor ile Android APK (aynı React kod tabanı)

**Teknoloji yığını:**
- React 18 + TypeScript + Vite
- PouchDB (yerel veritabanı) + CouchDB (senkronizasyon, aynı Wi-Fi veya internet üzerinden)
- Electron + `license-native/` (C++ N-API offline lisans modülü)
- Capacitor 6 (Android: bluetooth-le, mlkit-barcode-scanning, camera, filesystem, preferences)
- Vitest (305 test, 17 dosya — `npm test -- --run`)
- ExcelJS (Excel export/import)

**Sürüm durumu:**
- `package.json` version: `1.150.0` (PC)
- APK: `v1.3.7` / versionCode `24` (`android/app/build.gradle`)
- Git: son commit `50768c0` (FAZ A + FAZ B)

## 2. KLASÖR YAPISI (önemli olanlar)

```
src/
  locales/i18n.ts            # 4 dilli sözlük (tr/tm/en/ru), strict Record tipi, ad alanları
  locales/LanguageContext.tsx # LanguageProvider, useT(), useTranslation(), useLanguage()
  utils/locale.ts            # LOCALE_MAP, formatMoney/formatDate, getActiveLanguage()
  utils/languageDetect.ts    # navigator.language → tr/tk/ru/en
  utils/electron.ts          # saveFileAs (Electron IPC / Capacitor Filesystem / web blob)
  utils/excelWriter.ts       # exceljs stilli export motoru (formula escape dahil)
  utils/excelIO.ts           # import okuma + sanitize + limitler (10MB / 50k satır)
  utils/styledExports.ts     # ürün/müşteri export kolonları (başlıklar import ile tek kaynak)
  utils/productExcel.ts      # ürün kolon tanımları + parse/validasyon
  utils/customerExcel.ts     # müşteri muadili
  utils/importErrorReport.ts # import hata raporu (.xlsx) üretici
  utils/bhbak.ts             # şifreli yedekleme
  utils/licenseGuard.ts      # lisans anahtarı + şifreleme (Uint8Array tabanlı — Buffer YOK)
  db/pouch.ts                # PouchDB katmanı; upsertDocsBatch → BatchWriteResult
  db/schemaBridge.ts         # PC↔APK şema köprüsü (urun: ↔ product_ vs.)
  db/schema/fieldMap.ts      # alan eşleme
  store/accountStore.ts      # hesap + dil state (localStorage)
  components/pos/PosWorkspace.tsx  # ⚠️ 2615 satır / ~104 KB dev dosya (D4 görevi)
electron/main.cjs            # 411 satır: lisans IPC, yazıcı, pencere; autoUpdater YOK
android/                     # Capacitor Android projesi (gradlew)
bizneshasap-apk/             # APK arşivi + VERSION.md + ISLEM-LOG.md (sürüm kayıtları)
license-native/              # C++ lisans modülü (ayrı alt proje)
admin-gui/                   # lisans anahtarı üreteci (ayrı Electron app)
graphify/                    # ⚠️ üçüncü taraf analiz aracı — ÜRÜN KODU DEĞİL, dokunma
```

## 3. ÇALIŞMA KURALLARI (bunlara uy)

### Komutlar
```bash
npm test -- --run      # 305 test / 17 dosya geçmeli (vitest)
npm run build          # tsc && vite build — tip hatası olmamalı
npm run electron:build # PC installer (electron-builder)
npm run build:mobile   # vite build && cap sync (APK web tarafı)
cd android && ./gradlew assembleDebug   # APK derleme
```

### Dil sistemi (FAZ B'de kuruldu — KORU)
- UI metni asla hardcoded yazma; `useT()` hook'u veya hooksuz `translate(language, key, params?)` kullan.
- Yeni metin → `src/locales/i18n.ts`'te ilgili ad alanına (`pos`, `kassa`, `hasaplama`, `sazlamalar`, `receipt`, `excel`, `errors`, `products`, `customers`, `invoices`, `users`, `payment`, `targowy`, `walyuta`, `faktura`, `depder`, `warehouses`, `modals`, `mobile`, `license`, `promo`).
- **4 dilde de anahtar zorunlu** — TypeScript strict Record tipi denetliyor; eksik dil = derleme hatası.
- İnterpolasyon: `{placeholder}` — string birleştirme YAPMA.
- Tarih/para: `localeFor(lang)` / `formatMoney` / `formatDate` kullan; asla sabit `'tr-TR'` yazma.
- **Veri etiketi seçimleri (`labelTm/labelTr` tabloları) sözlüğe TAŞINMAZ** — onlar DB verisidir.

### Excel kuralları (FAZ A'da düzeltildi — BOZMA)
- **Excel kolon başlıkları Türkmençe kalır ve dile ÇEVRİLMEZ** — export↔import roundtrip tek kaynağa bağlı (`styledExports.ts` başlıkları `productExcel.ts`/`customerExcel.ts` tanımlarından üretir). Başlıkları dile bağlarsan import uyumluluğu kırılır.
- DB'ye yazılan değerlerde `Buffer` KULLANMA (WebView'de yok) — `Uint8Array`/`TextEncoder` kullan.
- Export'ta `= + - @` başlangıçlı stringler `'` ile escape ediliyor (`excelWriter.ts`) — koru.
- Import: `upsertDocsBatch` ile toplu yazım + `ImportSummary` (added/updated/skipped/failed) + `.xlsx` hata raporu. Tekil fire-and-forget yazım YAPMA.

### Diğer
- Yeni test dosyası EKLEME (kullanıcı istemedikçe); mevcut 305 testi kırma.
- APK sürüm kuralı (`bizneshasap-apk/VERSION.md`): her kullanıcıya dokunan işte yama +1, `versionCode` +1, APK `bizneshasap-apk/BiznesHasap-vX.Y.Z.apk` olarak kopyalanır, VERSION.md + ISLEM-LOG.md güncellenir.
- Commit mesajları Türkçe; araç klasörleri (`.omo/`, `.opencode/`, `.aider*`) commit'e dahil edilmez.
- Android SDK: `%LOCALAPPDATA%\Android\Sdk` (PATH: `C:/Users/User/AppData/Local/Android/Sdk`); `android/local.properties` bunu gösteriyor (git'e girmez).

## 4. TAMAMLANAN İŞLER (tekrar yapma)

### FAZ A (commit `50768c0`, APK v1.3.6) — kritik bug'lar
- APK'da Excel export çalışmıyordu (`Buffer` tanımsız) → düzeltildi, native'de Documents'a kayıt.
- Export→import veri kaybı (alış fiyatı/kritik stok/SKT/2. birim) → tek kaynak başlıklar.
- Toplu import hata yutma → `upsertDocsBatch` + hata raporlama UI.
- Formula injection + dosya/satır limitleri.
- Sözlük çeviri hataları (en "Faktura"→"Register" vb.), dinamik versiyon.

### FAZ B (commit `50768c0`, APK v1.3.7) — dil sistemi
- ~770 yeni çeviri anahtarı × 4 dil; 60+ dosya sözlüğe bağlandı; ternary'ler bitti.
- LanguageContext/useT altyapısı, tek dil kaynağı (localStorage↔PouchDB), otomatik dil algılama, locale-aware tarih/para.

### Önceki fazlar (kullanıcının eski analizi, doğrulandı)
- 305 test (conflictResolver, calc*, auditLog, schemaBridge, encryption vb.) ✅
- currency/ledger lisans kapısı, PouchDB şifreleme, audit log ✅

---

## 5. FAZ C — YAPILMADI (D'den önce veya birlikte düşün)

Excel mimari temizliği. Detay: iki paralel export motoru var:

1. **Faktura + hasaplama raporları hâlâ `write-excel-file` ile düz export** (`src/components/pos/PosWorkspace.tsx` ~satır 759, `src/components/hasaplama/charts.tsx` ~satır 142) — bunları `excelWriter.ts`'in stilli motoruna (exceljs) taşı.
2. **Ölü kod:** `src/utils/productExcel.ts` ve `customerExcel.ts` içindeki `writeProductExcel`, `writeCustomerExcel`, `downloadTemplate`, `downloadCustomerTemplate`, `buildExportRows`, `buildTemplateRows` hiç çağrılmıyor — sil.
3. Sonra kütüphaneleri kaldır: `npm uninstall read-excel-file write-excel-file` — AMA ÖNCE import okumasını `excelIO.ts`'te exceljs'e taşı (şu an read-excel-file kullanıyor). Adım 1-2 bitmeden KALDIRMA, uygulama kırılır.
4. Akıllı sütun eşleme: alias haritası (örn. `barcode`: ['barkod','barcode','штрих-код'...]) + başlık bulunamazsa manuel eşleme UI'ı. Mevcut `findHeaderRowIndex` skor mekanizması iyi temel.

---

## 6. FAZ D — GÖREVLER (bu dosyanın asıl konusu)

Öncelik sırası kullanıcının analizi + doğrulamalarla güncellendi. Her görev bağımsız; bittiğinde test+build+commit.

### D1 — Kod İmzalama (Windows Authenticode) 🔴
**Sorun:** İmzasız installer → SmartScreen uyarısı, kurumsal satışta engel.
**Durum:** `package.json`'da `win.certificateFile` yok, sertifika yok.
**Yapılacak:**
1. Kullanıcı OV/EV sertifika satın alacak (~$200-400/yıl; Sectigo/DigiCert/GlobalSign) — bu insan işi, sen sadece yapılandırmayı hazırla.
2. `package.json` build.win'e ekle:
```json
"certificateFile": "certs/bizneshasap.pfx",
"certificatePassword": "${CERT_PASSWORD}",
"signingHashAlgorithms": ["sha256"],
"signDlls": true,
"rfc3161TimeStampServer": "http://timestamp.digicert.com"
```
3. `.gitignore`'a `certs/`, `*.pfx`, `*.p12` ekle.
4. GitHub Actions için secrets dokümantasyonu: `CERT_PFX_BASE64`, `CERT_PASSWORD`; workflow'da sertifikayı base64'ten geri yaz, build sonrası sil.
5. Doğrulama: `Get-AuthenticodeSignature "dist-electron\Biznes Hasap Setup *.exe"`.

### D2 — Auto-Update (electron-updater) 🟠
**Durum:** paket yok, `electron/main.cjs`'te autoUpdater kodu yok.
**Yapılacak:**
1. `npm install electron-updater`
2. `electron/main.cjs`: `autoUpdater.checkForUpdatesAndNotify()` (açılıştan 10sn sonra + 5 dakikada bir), `autoDownload=false` (kullanıcı onayı), update-available/update-downloaded diyalogları. Diyalog metinleri Türkçe olabilir (main process, sözlük yok) — mevcut main.cjs stili Türkçe.
3. `package.json` build.publish: `{ provider: "github", owner: ..., repo: ... }` — kullanıcıdan repo adını sor.
4. Release workflow: `npm run electron:build -- --publish always` + `GH_TOKEN`.
5. Not: D1 (imzalama) önerilir; imzasız auto-update SmartScreen'de takılır.

### D3 — Veri Doğrulama Katmanı (Zod) 🟠
**Durum:** zod yok, `src/db/validation.ts` yok. En yakın şey `src/db/sanitize.ts`.
**Yapılacak:**
1. `npm install zod`
2. `src/db/validation.ts`: `ProductSchema`, `CustomerSchema`, `InvoiceSchema`, `TransactionSchema` — alanlar için `src/types/` ve `src/db/schema/fieldMap.ts`'e bak.
3. `src/db/pouch.ts` `upsertDoc`/`upsertDocsBatch` içinde validate et; hata → `BatchWriteResult.failed`'a düşsün (mevcut yapıyla uyumlu).
4. UI metni gerekiyorsa `errors.*` ad alanını kullan (4 dil zorunlu).

### D4 — PosWorkspace.tsx Refactor 🟠
**DÜZELTİLMİŞ BİLGİ (eski analizdeki "~40 prop drilling" iddiası YANLIŞ):**
- Dosya: `src/components/pos/PosWorkspace.tsx` — **2615 satır / ~104 KB**, ama interface **sadece 9 prop** (`PosWorkspaceProps`, satır ~84-96). Sorun prop drilling DEĞİL, dev tek dosya.
- `zustand` kurulu DEĞİL; `src/store/` altında sadece `accountStore.ts` var (özel store, zustand değil).
- FAZ B'den beri `LanguageContext` var — dil zaten context'ten geliyor.
**Yapılacak (dikkatli, kademeli):**
1. İsteğe bağlı: `npm install zustand` → `src/store/workspaceStore.ts` (sepet, aktif sekme, arama state'i).
2. PosWorkspace'i böl: her alt panel/modal kendi dosyasına; handler'ları custom hook'lara (`useInvoiceActions` vb.) taşı.
3. **Her adımda `npm test -- --run` + `npm run build` çalıştır** — bu dosya uygulamanın kalbi, tek seferde büyük refactor yapma. Küçük, doğrulanabilir commit'ler.
4. FAZ A notu: bu dosyada import batch akışı (`handleImportProducts`) ve faktura Excel export'u (write-excel-file, FAZ C'de taşınacak) var — davranışı koru.

### D5 — Conflict Resolution UI 🟡
**Durum:** çakışmalar otomatik LWW (en güncel `updatedAt` kazanır, `src/db/conflictResolver.ts` + testleri var). Kullanıcı onayı yok, UI yok.
**Yapılacak:**
1. `src/components/ConflictResolverModal.tsx` (YENİ): çakışan belgeleri local vs remote yan yana göster, kullanıcı seçsin; toplu çözüm.
2. `conflictResolver.ts`'e UI'a çakışma bildirme kancası ekle (otomatik LWW davranışını kırma — UI kapalıyken/sessiz modda eski davranış kalsın).
3. UI metinleri `errors.*` veya yeni `conflicts.*` ad alanına (4 dil).

### D6 — Playwright E2E Testleri 🟡
**Durum:** `playwright-core@1.63.0` kurulu ama `@playwright/test` ve `tests/e2e/` yok.
**Yapılacak:**
1. `npm install --save-dev @playwright/test` + `npx playwright install chromium`
2. `tests/e2e/`: checkout (satış), ürün ekleme/düzenleme/silme, müşteri kartı senaryoları.
3. Electron için `playwright.config.ts`'te `_electron.launch` veya web build üzerinden; en basit: `vite preview` + web hedefi.

### D7 — Telemetri (Sentry + PostHog) 🟡
**Durum:** ikisi de yok.
**Yapılacak:** `npm install @sentry/electron posthog-js`; crash raporu (Sentry), özellik kullanımı (PostHog). **Opt-in zorunlu** — ayarlar paneline (`sazlamalar.*` ad alanına) izin anahtarı ekle, varsayılan kapalı.

### D8 — Selective Sync 🟡
**Durum:** tam replikasyon; `startSelectiveSync()` yok.
**Yapılacak:** `src/db/` senkron servisinde filtreli replikasyon (örn. son 3 ay), kullanıcı filtre seçimi (ayarlar paneli). PouchDB `replicate` selector/mango kullan.

### D9 — Yardımcı altyapılar (kullanıcının analizinden, düşük öncelik) 🟡
- `src/utils/errors.ts`: `BiznesHasapError` base + `DatabaseError`/`LicenseError`/`SyncError`/`ValidationError`.
- `src/utils/performance.ts`: `measureOperation()` wrapper, >1000ms uyarısı, `performance.mark()`.
- `src/hooks/useCleanup.ts`: PouchDB sync listener cleanup.
- `src/components/FirstRunWizard.tsx` + `src/utils/demoData.ts`: ilk açılış sihirbazı (hoş geldiniz → opsiyonel sync → demo veri).

---

## 7. BİLİNEN KÜÇÜK KALINTILAR (fırsat olursa)

- `bizneshasap-apk/VERSION.md` tablosunda 1.3.2–1.3.5 satırları eksik (ISLEM-LOG.md'de detayları var).
- `getActiveLanguage()` localStorage key'i (`biznes_hasap_settings_v1`) iki yerde sabit tanımlı — tek sabite indirilebilir.
- Ana bundle ~2.4 MB (vite chunk-size uyarısı) — code splitting fırsatı.
- Excel export'ta aynı isimli dosya APK'da Documents'ta üzerine yazılır — timestamp eklenebilir.
- `package.json` PC sürümü (1.150.0) ile APK sürümü (1.3.7) ayrı ilerliyor — birleştirme kararı kullanıcıya ait.

## 8. DOĞRULAMA KONTROL LİSTESİ (her görev sonunda)

```bash
npm test -- --run    # 305/305 (veya daha fazla) geçmeli
npm run build        # tsc + vite — hatasız
# Electron tarafına dokunduysan: npm run electron:build
# Mobil tarafa dokunduysan: npm run build:mobile && cd android && ./gradlew assembleDebug
# APK ürettiysen: bizneshasap-apk/ kuralına göre sürüm + VERSION.md + ISLEM-LOG.md
```

**Altın kurallar:**
1. Test/build kırmızıysa "bitti" deme.
2. Excel başlıklarını dile çevirme (roundtrip kırılır).
3. DB'ye yazılan değerlerin formatını değiştirme (senkronizasyon kırılır).
4. UI metinleri 4 dilde; `useT()`/`translate()` kullan.
5. Küçük, doğrulanabilir adımlar + Türkçe commit mesajları.
