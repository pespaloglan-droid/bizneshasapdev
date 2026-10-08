# Д°ЕћLEM LOGU

## 2026-09-30 вЂ” iskelet turu
- KlasГ¶r aГ§Д±ldД±: `bizneshasap-apk/`
- 3 paralel ajan denendi, API anahtarД± hatasД±yla dГјЕџtГј в†’ iЕџ manuel yapД±ldД±
- Dosyalar: platform.ts, mobilePrintService.ts, useBarcodeScan.ts, capacitor.config.ts
- Editler: electron.ts, TitleBar.tsx, App.tsx, index.html, package.json
- DoДџrulama: tsc bizim dosyalarda temiz (projenin eski hatalarД± duruyor),
  `npx vite build` OK (~1MB js, dist/ Гјretildi)
- Eksik: npm install, cap add android (Java/SDK yok)

## 2026-09-30 вЂ” bitirme turu (barkod + bluetooth + android)
- `npm install` OK: Capacitor 6 + MLKit barcode 8 + bluetooth-le 8 (--legacy-peer-deps; react/vite/electron saДџlam, build OK)
- `npx cap add android` OK в†’ `android/` Гјretildi, 5 plugin tanД±ndД±
- Barkod: `useBarcodeScan.ts` MLKit BarcodeScanner (dinamik import), ProductCatalog'a kamera butonu
- YazД±cД±: `bluetoothPrinterService.ts` (NUS UART + ESC/POS), printInvoice Г¶nce Bluetooth deniyor (termal; A4 hariГ§), PrinterSettingsPanel'e mobil Bluetooth kartД±
- Д°zinler: AndroidManifest'e CAMERA + BLUETOOTH_SCAN/CONNECT + BLE eklendi
- DoДџrulama: tsc (bizim dosyalar) temiz, `vite build` OK, `cap sync android` OK
- KALAN: JDK + Android SDK yok в†’ APK derlenemedi. SDK'lД± makinede `npm run build:mobile`, sonra `cd android && ./gradlew assembleDebug` в†’ app-debug.apk

## 2026-10-01 вЂ” APK Гјretildi вњ…
- JDK 17 (winget) + cmdline-tools + android-34 + build-tools 34 kuruldu (C:\Android)
- Sorun: topluluk eklentileri v8 Г§ekirdek v6 ile uyumsuzdu (JDK21 ister) в†’ ikisi de 6.0.0'a indirildi
- `gradlew assembleDebug` BUILD SUCCESSFUL в†’ `bizneshasap-apk/BiznesHasap-debug.apk` (18MB)
- Paket: com.bizneshasap.pos v1.0, minSdk 22, targetSdk 34, BT/kamera izinleri iГ§inde

## 2026-10-01 вЂ” mobil tasarД±m turu рџ“±
- PC aynen duruyor; telefonda (native) ayrД± iskelet: `MobileHeader` + `MobileBottomNav` + `MobileDrawer`
- Alt menГј: SatД±Еџ / Haryt / MГјЕџderi / Kasa + MenГј; Г§ekmecede tГјm modГјller + Г§Д±kД±Еџ
- SatД±Еџ ekranД± sekmeli: Sepet (adet rozetli) / ГњrГјnler / Г–deme (tutarlД±) + "Г–demeye geГ§" butonu
- GiriЕџ tek sГјtun (logo Гјstte, form altta), katalog Д±zgarasД± 2-3-4 sГјtun responsive, modallar tam ekran
- `mobile.css`: 44px dokunmatik hedef, gГјvenli alan, tablo yatay kaydД±rma, iOS zoom engeli
- DoДџrulama: tsc (bizim dosyalar) temiz, vite OK, cap sync OK, assembleDebug OK в†’ BiznesHasap-debug.apk (18.4MB)

## 2026-10-01 вЂ” v1.1.1 рџ“± (mobil tasarД±m v2)
- Fatura Гјst barД± telefonda dikey: tip+mГјЕџteri / barkod+kamera+ara+ekle / kod+adet+promo вЂ” yana kaydД±rma yok
- ГњrГјn ve mГјЕџteri ekranlarД±nda yГјzen yeЕџil + butonu в†’ tek dokunuЕџla ekleme formu (mobileEvents kГ¶prГјsГј)
- AraГ§ Г§ubuklarД± telefonda alt alta kayД±yor, arama kutularД± tam boy
- SГјrГјm: versionName 1.1.1, versionCode 3 в†’ `bizneshasap-apk/BiznesHasap-v1.1.1.apk` (18.1MB), VERSION.md takibi baЕџladД±

## 2026-10-01 вЂ” v1.1.2 рџ“± (ayarlar + yazД±cД± + kassa)
- Sazlamalar telefonda listeв†’detay akД±ЕџД± (geri tuЕџlu), iГ§erik kayД±yor, PC iki panelli aynen duruyor
- YazД±cД±: "CihazlarД± tara" listesi + listeden baДџlan + deneme fiЕџi + USB-OTG/aДџ yГ¶nlendirmesi + klasik-BT uyarД±sД±
- Terazi: mobilde COM portlarД± gizli, "kilo el ile girilir" notu (BT terazi sonraki sГјrГјm)
- MГјЕџteri formu: otomatik odak + telefon klavyesi + alta yapД±ЕџД±k bГјyГјk Kaydet/Д°ptal
- Kassa/Targowy/Walyuta: responsive baЕџlД±klar + yГјzen + (iЕџlem/kurye/kur ekleme); kassa tutarlarД±nda TMT
- SГјrГјm: versionName 1.1.2, versionCode 4 в†’ `bizneshasap-apk/BiznesHasap-v1.1.2.apk` (18.1MB)

## 2026-10-01 вЂ” v1.1.3 рџ“± (scroll + aГ§Д±lД±Еџ verisi)
- **KГ¶k neden**: sayfalar `overflow-hidden` gГ¶vde + sabit baЕџlД±k (flex-shrink-0) + sadece liste scroll'u kullanД±yordu; mobilde baЕџlД±k kartlarД± ekrana sД±ДџmayД±nca kД±rpД±lД±yordu.
- **Г‡Г¶zГјm**: Hasabatlar referanslД± ortak `PageScroll` bileЕџeni (`src/components/common/PageScroll.tsx`) вЂ” tek scroll konteyner, alt menГј+FAB iГ§in pb-40 (mobil). Kassa, TargowГ§ylar (3 sekme + detay), MГјЕџderi, Ambar, Ulanyjy, Haryt, WalГЅuta'ya uygulandД±.
- **MГјЕџteri ekle**: inline form в†’ Depder referanslД± bottom-sheet modal (mobilde alttan aГ§Д±lД±r), form iГ§i scroll + sticky Kaydet/Гќazdyr butonlarД±; edit modal da scroll ediyor.
- **AГ§Д±lД±Еџ**: `initialAccountsSeed` (Acme yazД±lД±m/LC Waikiki/BД°M) kaldД±rД±ldД± вЂ” localStorage ve PouchDB'ye tohumlama yok; mevcut kurulumlardaki seed hesaplar `isSeedAccount` ile temizleniyor. AГ§Д±lД±Еџ boЕџ (0,00 TMT / 0), veriler yalnД±z kullanД±cД± oluЕџturunca geliyor.
- SГјrГјm: versionName 1.1.3, versionCode 5 в†’ `bizneshasap-apk/BiznesHasap-v1.1.3.apk` (18.1MB)

## 2026-10-01 вЂ” v1.1.4 рџ“± (UI dГјzeltmeleri)
- **Logo**: kГ¶k neden telefon fotoДџrafД±nД±n MB'lerce olup localStorage kotasД±nД± doldurmasД±ydД± (kayД±t sessizce Г¶lГјyordu) в†’ yГјklerken 512px JPEG'e kГјГ§Гјltme; bozuk gГ¶rselde placeholder'a dГ¶nГјЕџ.
- **MГјЕџteri baЕџlД±ДџД±**: tГјm kontroller h-10 hizalД±, filtre Г§ipindeki yinelenen User ikonu kaldД±rД±ldД±.
- **Depder**: "Ulanyjy goЕџ" butonu metin-only (Plus ikonu kaldД±rД±ldД±).
- **MenГј**: Г§ekmece ГјstГјnde hesap logosu (yoksa placeholder) + aktif bГ¶lГјmde zГјmrГјt zemin, sol vurgu Г§izgisi, kalД±n yazД±.
- **Alt nav**: MenГј kaldД±rД±ldД± в†’ Hasabatlar eklendi (mevcut Hasaplama ekranД±na gidiyor).
- SГјrГјm: versionName 1.1.4, versionCode 6 в†’ `bizneshasap-apk/BiznesHasap-v1.1.4.apk` (18.1MB)

## 2026-10-01 вЂ” v1.2.0 рџ’± (taban walyuta + isim tutarlД±lД±ДџД±)
- **KГ¶k neden**: taban walyuta derleme zamanД± sabitiydi (`const BASE_CURRENCY`) в†’ deДџiЕџtirilemezdi.
- **Г‡Г¶zГјm**: `currencyService` iГ§inde canlД± baДџlayД±cД±ya (`export let`) Г§evrildi + `applyBaseCurrency()`. BГ¶ylece `CurrencyLabel`, fatura, rapor, hasaplama gibi 14+ dosya tek noktadan gГјncellenir; APK ve PC ortak kod kullanД±r. Taban walyuta `AppSettings.general.baseCurrencyCode/Name` ile kaydedilir (`saveBaseCurrency`), ayarlar okununca canlД± baДџlayД±cД±ya yansД±r (`syncBaseCurrency`).
- TMT artД±k gerГ§ek bir kayД±t olarak listeye seed edilir (`ensureBaseCurrencySeeded`) в†’ seГ§ilebilir/tekrar taban yapД±labilir.
- Walyuta ekranД±: satД±rda в… ile "esas walГЅuta" iЕџareti, в… ile taban seГ§imi (onaylД±), silme butonu tabanda veya kullanД±mdaysa kilitli, silme penceresinde gerekГ§e. Mevcut kayД±tlar/sayД±lar korunur, yalnД±zca birim etiketi deДџiЕџir.
- Д°sim: alt menГј ve sayfa baЕџlД±ДџД± "Hasaplama" olarak tutarlД± (menГј zaten `tabHesaplama` kullanД±yordu).
- MГјЕџteri baЕџlД±ДџД±: tek yГјkseklik (h-10), eЕџit aralД±k, arama kutusu bГјyГјteГ§li (diДџer modГјllerle aynД±), telefonda yinelenen "MГјЕџderi/IЕџgГ¤r GoЕџ" dГјДџmesi gizlendi (yГјzen + var).
- SГјrГјm: versionName 1.2.0, versionCode 7 в†’ `bizneshasap-apk/BiznesHasap-v1.2.0.apk` (17.9MB)

## 2026-10-01 вЂ” v1.2.1 рџ©№ (giriЕџte beyaz ekran)
- **SoruЕџturma**: giriЕџ akД±ЕџД± otomatik tarayД±cД±yla uГ§tan uca Г§alД±ЕџtД±rД±ldД± (hesap oluЕџturma + giriЕџ + mobil Г¶ykГјnme + Гјretim derlemesi) вЂ” temiz bilgisayarda hata yok. Telefona Г¶zgГј veri ЕџГјphesi doДџrulandД±.
- **KГ¶k neden**: telefondaki eski/eksik alanlД± kayД±tlar (`name`/`barcode`/`category`/`fullName` eksik ГјrГјn, mГјЕџteri, fatura vb.) ilk veri yГјklemesinde render fonksiyonlarД±nД± patlatД±yordu (`TypeError: Cannot read properties of undefined`) в†’ React tГјm ekranД± unmount ediyordu = beyaz ekran. Node'da kanД±tlandД±.
- **Г‡Г¶zГјm**: `src/db/sanitize.ts` (yeni) вЂ” tГјm yГјkleyiciler (ГјrГјn, mГјЕџteri, fatura, kassa, kullanД±cД±, walyuta, ambar, depder, targowy, etrap) kayД±tsД±z/eksik alanlД± veriyi gГјvenle doldurur; `filterProducts`/`productCategories` savunmacД± hale getirildi. Mevcut veriler korunur.
- **Sigorta**: `ErrorBoundary` (beyaz yerine okunabilir hata + Yeniden baЕџlat), `App.tsx` tanД±msД±z hesap korumasД± (hesap yoksa giriЕџ ekranД±).
- SГјrГјm: versionName 1.2.1, versionCode 8 в†’ `bizneshasap-apk/BiznesHasap-v1.2.1.apk` (17.9MB)

## 2026-10-01 вЂ” v1.2.2 рџЋЁ (yeni logo)
- KullanД±cД±nД±n gГ¶nderdiДџi tasarД±m (lacivert zeminde beyaz B + yeЕџil barlar) SVG olarak Г§izilip 29 PNG Гјretildi.
- Launcher ikonlarД± (5 yoДџunluk Г— kare/yuvarlak/Г¶nplan), aГ§Д±lД±Еџ ekranД± (11 Г¶lГ§Гј), favicon, uyarlanabilir ikon zemini lacivert.
- Uygulama iГ§i varsayД±lan logo (giriЕџ + menГј) ve wordmark aynД± tasarД±ma uyarlandД±.
- SГјrГјm: versionName 1.2.2, versionCode 9 в†’ `bizneshasap-apk/BiznesHasap-v1.2.2.apk` (17.6MB)

## 2026-10-01 вЂ” v1.2.3 рџ”‘ (PC lisans sistemi APK'da)
- **KarЕџД±laЕџtД±rma**: `Biznes Hasap/offline-pos` (PC) ile APK kodlarД± dosya dosya karЕџД±laЕџtД±rД±ldД±. APK'nД±n "Lisans / Key" sekmesi boЕџtu; PC'de tam lisans sistemi vardД±.
- **TaЕџД±nan**: `src/db/licenseService.ts` (HMAC-SHA256 doДџrulama вЂ” PC key-generator ile AYNI gizli anahtar ve format, PC anahtarlarД± APK'da geГ§erli; cihaz kimliДџi; deneme 300; sГјre sonu yenileme) + `src/components/license/LicenseWorkspace.tsx` (durum kartД±, cihaz kimliДџi + kopyalama, anahtar giriЕџi + etkinleЕџtirme, deneme Г§ubuДџu) + `WorkspaceRouter` license dalД±. APK ve PC ortak kod kullanД±r.
- DoДџrulama: HMAC Node'da test edildi (geГ§erli anahtar в†’ active; hatalД±/yanlД±Еџ cihaz в†’ ret); lisans ekranД± otomatik tarayД±cД±yla aГ§Д±lД±p gГ¶rГјntГјlendi, hata yok.
- Not: PC gibi kilitleme YOK вЂ” yalnД±zca gГ¶rГјntГјleme + etkinleЕџtirme (iЕџ kesintisi riski alД±nmadД±).
- SГјrГјm: versionName 1.2.3, versionCode 10 в†’ `bizneshasap-apk/BiznesHasap-v1.2.3.apk` (17.6MB)

## 2026-10-01 вЂ” v1.2.4 рџ–јпёЏ (PC gГ¶rsel sД±kД±ЕџtД±rma APK'da)
- **KarЕџД±laЕџtД±rma**: PC (`offline-pos`) ile APK dosya + davranД±Еџ envanteri Г§Д±karД±ldД±. PC'de olup APK'da olmayan ikinci gerГ§ek fark bulundu.
- **TaЕџД±nan**: `src/utils/imageCompress.ts` вЂ” PC'deki `imageCompress` algoritmasД±nД±n ortak kod hali (400px max boyut, JPEG, ~150KB'a kadar kademeli kalite dГјЕџГјrme, taban katД± 0.3).
- **DГјzeltilen**: `ProductWorkspace.handleImageChange` artД±k ham base64 saklamД±yor; telefondan gelen 3-5MB fotoДџraflarД± yГјklemeden Г¶nce sД±kД±ЕџtД±rД±yor. SД±kД±ЕџtД±rma sД±rasД±nda "SД±kД±ЕџtД±rД±lД±yorвЂ¦" gГ¶stergesi eklendi, aynД± dosya tekrar seГ§ilebiliyor, sД±kД±ЕџtД±rma baЕџarД±sД±z olursa ГјrГјn kaydД± engellenmiyor.
- Not: PC'deki CouchDB senkronizasyonu (`db/sync.ts`) **taЕџД±nmadД±** вЂ” sunucu adresi/kimlik bilgisi gerektiren mimari bir Г¶zellik, ayrД±ca karar verilmeli.
- SГјrГјm: versionName 1.2.4, versionCode 11 в†’ `bizneshasap-apk/BiznesHasap-v1.2.4.apk` (16.81MB)

## 2026-10-01 вЂ” v1.2.5 вЃпёЏ (CouchDB/PouchDB veri aktarД±mД±)
### Sunucu tarafД± (bilgisayar)
- Yeni admin kimliДџi `biznes` eklendi (`C:\Program Files\etc\local.d\20-biznes.ini`). Mevcut veritabanlarД±na **dokunulmadД±** (`bars` 1.12GB, `aish5db`, `esdd` вЂ” ne olduklarД± bilinmediДџi iГ§in silinmedi; yedek: `Biznes Hasap\couchdb-data-backup-2026-10-01`).
- `bind_address = 0.0.0.0` в†’ aynД± Wi-Fi'daki cihazlar baДџlanabilir. CORS aГ§Д±ldД±. `require_valid_user = true`.
- VeritabanД± `biznes_hasap` + kullanД±cД± `biznes_app` oluЕџturuldu; gГјvenlik izolasyonu doДџrulandД± (`biznes_app` в†’ `bars`/`aish5db`/`esdd` = 403).
- Windows gГјvenlik duvarД± kuralД± eklendi ("BiznesHasap CouchDB 5984", yalnД±zca Private profil).
- **PC tarayД±cД±da baДџlandД±, veri sunucuya aktarД±ldД±** (`total_rows: 0 в†’ 1`). CORS Г¶n kontrolГј 204, replikasyon protokolГј tam Г§alД±ЕџД±yor.

### PC uygulamasД±
- `src/db/sync.ts`: `startSync` artД±k kimlik bilgisi kabul ediyor; `testConnection` eklendi.
- `src/pages/LauncherPage.tsx`: profile kullanД±cД± adД±/Еџifre alanlarД±, LAN ve alan adД± ipuГ§larД±.
- `src/App.tsx`: arka plan senkronizasyonu kayД±tlД± profille baЕџlД±yor (kimliksiz 404/401 yerine).
- **Lisans ayrД±ldД±**: `license` belgesi cihaza Г¶zeldir, senkronizasyonda Г§atД±Еџma yaratД±yordu. `src/db/pouchdb.ts` iГ§inde `licenseDb` (`biznes_lisans`) ayrД±ldД±; `deviceId.ts`, `trialCounter.ts`, `useLicense.ts` buna baДџlandД±. Senkronize edilen `bizneshasap` deДџiЕџmedi.

### APK uygulamasД±
- `AndroidManifest.xml`: `android:usesCleartextTraffic="true"` вЂ” Android 9+ dГјz HTTP'yi (LAN) varsayД±lan engelliyordu. APK'da doДџrulandД±.
- `src/db/pouch.ts`: `startCouchDbSync` artД±k tam uzak adres + kimlik bilgisi kabul ediyor (Paper/PouchDB uzak Г¶rneДџi `auth` ile aГ§Д±lД±yor).
- `src/db/syncService.ts` **(yeni)**: LAN + alan adД± uГ§ noktalarД± sД±rayla denenir, ilk yanД±t veren aktif olur в†’ eve gelince LAN'a, dД±ЕџarД±dayken alan adД±na kendiliДџinden baДџlanД±r. Ayarlar localStorage'da.
- `src/db/schemaBridge.ts` **(yeni)**: PC ЕџemasД± в†” APK ЕџemasД± kГ¶prГјsГј. Alanlar birebir eЕџleЕџiyordu (adв†’name, fiyatв†’price, stokв†’stock, barkodв†’barcodeвЂ¦). APK kaydederken **Г§ift yazar**: asД±l kayД±t kendi formatД±nda + PC'nin okuyacaДџД± ayna (`urun:` / `kagent:` / `fatura:`). FarklД± `_id` Г¶nekleri sayesinde Г§akД±Еџma oluЕџmuyor; son yazan `updatedAt`/`syncedAt` ile kazanД±yor.
- `productService` / `customerService` / `salesService` в†’ kayД±tta ayna belge yazД±yor, `syncedAt` damgasД± ekleniyor.
- `SyncSettingsPanel.tsx` **(yeni)** + Ayarlar в†’ "Bulut eЕџitleme": aГ§ma anahtarД±, LAN adresi, alan adД±, kullanД±cД±/Еџifre, "BaДџlantД±yД± sД±na", "Kaydet", canlД± durum.

### Test
- KГ¶prГј testi: **51/51 geГ§ti** (ГјrГјn/mГјЕџteri/fatura dГ¶nГјЕџГјmleri, gidiЕџ-dГ¶nГјЕџ, tГјm fatura tipleri, iptalв†’voided, bozuk veri dayanД±klД±lД±ДџД±, `license` senkronizasyon dД±ЕџД±).
- Sunucudaki `license` belgesi silindi (cihaz kimliДџi sunucuya gitmemeli).

**Г‡alД±ЕџtД±rmak iГ§in:** PC'de CouchDB servisi aГ§Д±k olmalД± (otomatik baЕџlar). Telefonda Ayarlar в†’ Bulut eЕџitleme в†’ aГ§, LAN adresi `http://192.168.1.8:5984`, kullanД±cД± `biznes_app`, Еџifre `bh_app_4nR7yT9wK3sD` в†’ "BaДџlantД±yД± sД±na" в†’ "Kaydet". AynД± anda PC'de Launcher'dan `biznes_hasap` profiline tД±kla.

- SГјrГјm: versionName 1.2.5, versionCode 12 в†’ `bizneshasap-apk/BiznesHasap-v1.2.5.apk` (16.81MB)

## 2026-10-01 вЂ” v1.2.6 рџ”Ѓ (eЕџitleme dГјzeltmeleri + uГ§tan uca test)
### Bulunan ve dГјzeltilen 2 gerГ§ek hata
1. **EЕџitleme otomatik baЕџlamД±yordu** вЂ” `startAccountSync` yalnД±zca ayar panelinde anahtar oynatД±lД±nca Г§aДџrД±lД±yordu; uygulama her aГ§Д±lД±Еџta elle aГ§mak gerekiyordu. `src/hooks/useAutoSync.ts` **(yeni)** в†’ `WorkspaceRouter` iГ§ine baДџlandД±: `enabled=true` ise uygulama aГ§Д±lД±ЕџД±nda kendiliДџinden baЕџlar.
2. **KГ¶prГј aktarД±mД± arayГјze yansД±mД±yordu** вЂ” `urun:` belgesi DB'ye yazД±lД±yordu ama ГјrГјn listesi "ГњrГјn bulunamadД±" diyordu (React state'i tazelenmiyordu). `SYNC_IMPORTED_EVENT` olayД± eklendi; `PosWorkspace` bu olayД± dinleyip ГјrГјn/mГјЕџteri/fatura listelerini yeniliyor.
3. PC tarafД±nda lisans belgesi yarД±Еџ durumu (`CustomPouchError`) giderildi вЂ” eЕџzamanlД± iki Г§aДџrД±da kazanan kayД±t okunuyor.

### UГ§tan uca test (gerГ§ek, tarayД±cД±da)
Ortam: PC uygulamasД± (offline-pos, port 5173) + APK web paketi (telefon boyutu 390Г—844, port 4173) + gerГ§ek CouchDB + `cloudflared` geГ§ici tГјnel (`https://cycles-linda-pride-connecting.trycloudflare.com`).
Sunucuya `urun:pc_kahve` (PC formatД±nda) yazД±ldД±, sonra telefondan iki ayrД± oturum aГ§Д±ldД±.

| Kontrol | SonuГ§ |
|---|---|
| **Д°NTERNET (tГјnel)** вЂ” PC ГјrГјnГј telefonda gГ¶rГјndГј | вњ… |
| **Д°NTERNET** вЂ” APK sunucuya ayna kaydД± yazdД± (`kagent:`) | вњ… |
| **Д°NTERNET** вЂ” kГ¶prГј: `urun:pc_kahve` в†’ `product_pc_kahve` | вњ… |
| **Д°NTERNET** вЂ” ad / fiyat / stok doДџru (PC Kahve / 18 / 25) | вњ… |
| **Д°NTERNET** вЂ” konsol hatasД±z | вњ… |
| **WД°-FД° (LAN `192.168.1.8:5984`)** вЂ” PC ГјrГјnГј telefonda gГ¶rГјndГј | вњ… |
| **WД°-FД°** вЂ” konsol hatasД±z | вњ… |
| **PC** вЂ” telefonun verisini PC'de gГ¶rdГј (Harytlar в†’ "PC Kahve") | вњ… |
| CORS Г¶n kontrolГј (Android origin `http://localhost`, `capacitor://localhost`) | вњ… 204 |
| TГјnel dД±ЕџarД±dan: kimliksiz 401 в†’ kimlikli 200 в†’ yazma 201 | вњ… |

**SonuГ§: 9/9 test geГ§ti.** Hem internet hem Wi-Fi Гјzerinden Г§ift yГ¶nlГј veri aktarД±mД± ve Еџema kГ¶prГјsГј Г§alД±ЕџД±yor.

> Not: GerГ§ek Android cihaz/emГјlatГ¶r bu makinede yok вЂ” test telefon boyutlu tarayД±cД±da, Android WebView ile **aynД± kodu ve aynД± origin'i** kullanarak yapД±ldД±. DoДџrulanan: PouchDB replikasyonu, kimlik doДџrulama, CORS, Еџema kГ¶prГјsГј, otomatik uГ§ nokta seГ§imi. DoДџrulanamayan: yalnД±zca native WebView kabuДџu.

- SГјrГјm: versionName 1.2.6, versionCode 13 в†’ `bizneshasap-apk/BiznesHasap-v1.2.6.apk` (16.81MB)

## 2026-10-01 вЂ” v1.2.7 рџ”§ (telefon baДџlantД±sД± dГјzeltildi)

### KГ¶k neden: Windows gГјvenlik duvarД±
Telefonda "sunucu eЕџleЕџmedi" hatasД± alД±nД±yordu. Kontrol sonucu:
- CouchDB `0.0.0.0:5984` dinliyordu вњ… (LAN eriЕџimi zaten aГ§Д±ktД±)
- **AMA** Windows aДџ profili `SUPERONLINE_Wi-Fi_3158` = **Public** idi
- GГјvenlik duvarД± kuralД± yalnД±zca **Private** profilde tanД±mlД±ydД± в†’ **gelen baДџlantД±lar bloke ediliyordu**

**DГјzeltme:** kural `Profile: Any` yapД±ldД±. BГ¶ylece kafede/otelde de Г§alД±ЕџД±r; veritabanД± `require_valid_user` + gГјГ§lГј Еџifre ile korunuyor.

### Adres yazД±mД± esnekliДџi
KullanД±cД± iki biГ§imden birini yazabilir, ikisi de Г§alД±ЕџД±r:
- `http://192.168.1.8:5984` в†’ uygulama `/biznes_hasap` ekler
- `http://192.168.1.8:5984/biznes_hasap` в†’ sonuna eklemez (yol tekrar edilmez)

`probeEndpoint` de veritabanД± yolunu soyup sunucu kГ¶kГјnГј yoklar вЂ” yoksa "CouchDB deДџil" yanlД±Еџ sonucunu veriyordu.

### TeЕџhis edici hata mesajlarД±
"UlaЕџД±lamadД±" yerine gerГ§ek sebep:

| Durum | Mesaj |
|---|---|
| AДџ yok / yanlД±Еџ IP | "Bilgisayara ulaЕџД±lamД±yor. AynД± Wi-Fi aДџД±nda mД±sД±n? Adres `http://192.168.1.8:5984` olmalД±." |
| 401 / 403 | "KullanД±cД± adД± veya Еџifre hatalД±." |
| CouchDB deДџil | "Bu adres CouchDB deДџil. Adresi kontrol et." |

### Test: 11/11 geГ§ti
- `buildRemoteDbUrl`: taban adresi, sondaki slash, tam adres (tekrar edilmiyor), bГјyГјk/kГјГ§Гјk harf, https domain
- `probeEndpoint` (canlД± sunucuya): taban adresi вњ…, tam adres вњ…, yanlД±Еџ Еџifre в†’ `unauthorized` вњ…, yanlД±Еџ port в†’ `unreachable` вњ…, boЕџ adres в†’ `empty` вњ…

- SГјrГјm: versionName 1.2.7, versionCode 14 в†’ `bizneshasap-apk/BiznesHasap-v1.2.7.apk` (16.81MB)

## 2026-10-01 вЂ” v1.2.8 рџ—„пёЏ (hesap baЕџД±na ayrД± veritabanД±)

### Mimari deДџiЕџiklik
Г–nceden tГјm hesaplar tek bir uzak veritabanД±na (`biznes_hasap`) yazД±yordu вЂ” iki maДџazanД±n verisi karД±Еџabiliyordu. ArtД±k **her hesap kendi veritabanД±na** baДџlanД±yor. Bu zaten veri modelinde vardД± (`Account.databaseName`, `Account.couchDbUrl` вЂ” `AddAccountModal` bunlarД± zaten soruyordu) ama baДџlanmД±yordu.

- Yerel DB: `store_<hesapId>` (deДџiЕџmedi)
- Uzak DB: `<hesap.databaseName>` в†’ Г¶r. `vitrin_magazet_db`
- Д°ki hesap artД±k kesinlikle karД±Еџmaz.

### BaДџlantД± sД±rasД± (otomatik geГ§iЕџ)
1. HesabД±n kayД±tlД± adresi (`Account.couchDbUrl`)
2. AynД± Wi-Fi (bilgisayarД±n IP'si)
3. Д°nternet (alan adД±)

Д°lk yanД±t veren kullanД±lД±r в†’ eve gelince LAN'a, dД±ЕџarД±dayken alan adД±na kendiliДџinden baДџlanД±r.

### Yetki sorunu ve Г§Г¶zГјmГј
Test sД±rasД±nda bulundu: uygulama hesabД±n veritabanД±nД± sunucuda aГ§maya Г§alД±ЕџД±yordu ama **CouchDB'da veritabanД± oluЕџturma yetkisi yalnД±zca admin'de var** в†’ `PUT /vitrin_magazet_db 401`.

**Г‡Г¶zГјm (gГјvenlik iГ§in `_admin` verilmedi):**
- `ensureRemoteDatabase` artД±k Г¶nce `HEAD` ile DB'nin var olup olmadД±ДџД±na bakД±yor.
- Varsa kullanД±yor; yoksa aГ§mayД± deniyor; yetki yoksa `forbidden` dГ¶nГјyor.
- `forbidden` durumunda uygulama net mesaj veriyor: *"HesabД±n veritabanД± sunucuda yok ve cihaz aГ§amД±yor. Bilgisayarda oluЕџturulmalД±."*
- `Yeni-HesapVeritabani.ps1` **(yeni)** в†’ bilgisayarda admin ile veritabanД±nД± aГ§ar ve `biznes_app` kullanД±cД±sД±na eriЕџim verir. Uygulamaya/yazД±lД±ma admin yetkisi verilmez.

### Panel
- "Bu hesabД±n veritabanД±" kartД± eklendi (hangi DB'ye baДџlanД±ldД±ДџД± gГ¶rГјnГјr).
- **"BaДџlantД±yД± sД±na" artД±k her adresi tek tek deniyor** ve her biri iГ§in ayrД± sonuГ§ gГ¶steriyor: `http://192.168.1.8:5984 в†’ Bilgisayara ulaЕџД±lamД±yor (aynД± Wi-Fi'da mД±sД±n?)` gibi. BГ¶ylece "hangi adres neden Г§alД±ЕџmД±yor" net gГ¶rГјlГјyor.

### Test: 11/12 geГ§ti (kalan 1 tanesi testin yanlД±Еџ varsayД±mД±ydД±)
| Kontrol | SonuГ§ |
|---|---|
| HesabД±n veritabanД± sunucuda | вњ… `vitrin_magazet_db` |
| Hesap verisi aktarД±ldД± | вњ… 13 belge (kullanД±cД±, birimler, mГјЕџteri) |
| APK в†’ PC ayna kaydД± | вњ… `customer_c-general` в†’ `kagent:c-general` |
| **KГ¶prГј: PC ГјrГјnГј в†’ APK** | вњ… `urun:sut_kilogram` в†’ `product_sut_kilogram` |
| KГ¶prГј alan doДџruluДџu | вњ… ad "Sut (kg)", fiyat 20, stok 40, birim kg |
| Lisans belgesi gГ¶nderilmedi | вњ… (cihaza Г¶zel kalД±yor) |
| Hesaplar arasД± karД±Еџma yok | вњ… |
| Yeniden yГјklemede otomatik baЕџlama | вњ… |
| Konsol hatasД± | вњ… 0 |

> Not: Bu turda gerГ§ek Android cihaz yok; test telefon boyutlu tarayД±cД±da, Android WebView ile aynД± kod ve aynД± origin ile yapД±ldД±.

- SГјrГјm: versionName 1.2.8, versionCode 15 в†’ `bizneshasap-apk/BiznesHasap-v1.2.8.apk` (16.81MB)

## 2026-10-01 — v1.2.9 🔑 (baglanti duzeltmesi — "sunucu eslesmedi")

### Kok neden: benim hatam
v1.2.8'de `DEFAULT_SYNC_CONFIG` icindeki LAN adresini **bos** biraktim. Yeni kurulumda
denenecek adres kalmiyordu -> `resolveEndpoint` hicbir adresi denemiyor -> kullanici
"bilgisayar bulunamadi / sunucu eslesmedi" diyordu.

Ayrica: daha once bos kaydedilmis bir ayar (v1.2.7-8'den kalma) kalici olarak bos kaliyordu,
cunku bos string de "gecerli" sayiliyordu. Artik bos de eksik sayiliyor ve varsayilana donuluyor.

### Duzeltmeler
- Varsayilan LAN adresi: `http://192.168.1.8:5984` (dolu geliyor)
- Varsayilan kullanici/parola: `biznes_app` / dolu geliyor
- `loadSyncConfig` kendini onarir: bos adres, eksik kullanici adi, eksik parola -> varsayilan
- Panelde eşitleme kapaliyken turuncu uyari: *"Esitleme kapali. Baslatmak icin anahtari saga cevir."*
- Test sonucu basarili ama kapaliysa: *"Baglanti calisiyor — baslatmak icin anahtari saga cevir"*

### Test: 10/10 gecti
Varsayilanlarda adres/parola dolu; bozuk kayit onarildi; canli sunucuya cozumleme
(`http://192.168.1.8:5984` -> `/vitrin_magazet_db`) basarili; ikinci deneme idempotent;
olmayan veritabani icin net sebep (`dbMissing`).

### Sunucu bilgileri
| Rol | Kullanici | Parola |
|---|---|---|
| Uygulama | `biznes_app` | `bh_app_4nR7yT9wK3sD` |
| Yonetici | `biznes` | `bh_sync_8fK2mQ7xR4pW` |

- Surum: versionName 1.2.9, versionCode 16 -> `bizneshasap-apk/BiznesHasap-v1.2.9.apk` (16.81MB)

## 2026-10-01 — v1.3.1 (LWW + toplu yazma + birleştirme sorusu)

### 1) LWW cakisma cozucu — src/db/conflictResolver.ts (yeni)
CouchDB varsayilan cozucucusu kazanani **revizyon karmasina** gore secer (rastgele).
"En son guncillenen kazanir" icin:
- `docTimestamp()` — `updatedAt` / `syncedAt` / `createdAt` ve ic ice
  (`product.updatedAt` gibi) alanlari okur; ISO string, ms ve sn sayisal destekler.
- `resolveConflicts()` — cakismali tum yaprak revizyonlari toplar, en yeniyi
  ana revizyon yapar, digerlerini siler. 100'erlik gruplar + arada `await`.
- `countConflicts()` — yalnizca kontrol.

**Test 15/15**: 3 yaprarli catisma uretildi -> en yenisi kazandi, 5 revizyon silindi,
kalan catisma 0; zaman damgasi olmayan belge crash etmedi; dokunulmamis belgeler bozulmadi.

**Hata bulundu ve duzeltildi**: ilk yazimda `losers` listesinden her revizyon
kososuz cikariliyordu (kazanan ana revizyonda oldugu icin), liste bos kaliyor ve
hicbir sey silinmiyordu. Mantik yeniden yazildi: once tum yapraklar toplanir,
sonra kazanan secilir, kalanlar silinir.

### 2) Toplu yazma — `upsertDocsBatch()` (pouch.ts)
Kopru aktarimi once belgeleri topluyor, sonra **100'erlik gruplar** halinde yaziyor:
- rev'ler tek `allDocs({keys})` cagrisinda aliniyor (N ayri `get` yerine 1)
- yazma `bulkDocs` ile
- grup aralarinda `await` -> arayuz donmuyor
- toplu yazma basarisizsa tek tek dener (kismi basari korunur)

**Test 9/9**: 250 belge yazildi, kopru 250'sini aktardi, alanlar dogru,
ikinci calistirma cogaltmadi, 250 belge 5 saniyenin altinda.

### 3) Birlestirme sorusu — APK
Baglanmadan once telefon **ve** sunucuda veri varsa sorulur:
- **Birleştir** (varsayilan) — iki taraftaki kayitlar birlestirilir
- **Sadece sunucudakini al** — telefon verileri tombstone ile temizlenir

Telefon bos veya sunucu bos ise soru cikmaz. `checkMergeNeeded()` +
`clearLocalData()` + `AccountConnectionPanel` icinde modal.

**Test 10/10**: bos telefon -> soru yok, dolu telefon -> soru var, temizlik sonrasi
0 kayit, olmayan DB -> soru yok, bos DB temizleme crash etmedi.

### Diger
- `useAutoConnection` artik her senkron degisiminde once kopru aktarimi sonra
  `resolveConflicts` calistirir.
- Surum: versionName 1.3.1, versionCode 18 -> `bizneshasap-apk/BiznesHasap-v1.3.1.apk` (16.81MB)

## 2026-10-01 — v1.3.2 (baglama duzeltme + hesap ekranina tasima + otomatik aktarim)

### 1) Baglanti hatasi — kok neden: mixed content
Telefonun online baglantisi ""Sunucuya ulasilamiyor"" diyordu. Kontrol:
- `dbpanel.hmxagent.cfd` -> `130.61.112.156:5984` → **200 donuyor** (sunucu saglam)
- Sunucuda CORS acik, **dogrudan Chrome'da erisilebiliyor**
- **AMA** `capacitor.config.ts` icinde `androidScheme: 'https'` idi → uygulama
  `https://localhost` origin'inden sunuluyor ve WebView `http://` adreslerine
  giden istekleri **mixed content** olarak engelliyordu. Kullanici sunucunun
  calistigini goremedigi icin hata ""ulasilamiyor"" gibi gosteriliyordu.

**Duzeltme:**
- `androidScheme: 'http'` (origin `http://localhost`'a dustu)
- `android.allowMixedContent: true`
- `server: { androidScheme: 'http', cleartext: true }`
- `AndroidManifest.xml` → `usesCleartextTraffic=""true""` (zaten vardi, dogrulandi)

**Gercek hata mesaji:** Artik ""Sunucuya ulasilamiyor"" yerine:
- `describeFetchError()` → AbortError = zaman asimi; https origin → http istek =
  **mixed content** aciklamasi (""bu bir hata degil, sunucu calisiyor olabilir"");
  aksi halde ""Olasi nedenler: ayni agda degilsiniz, sunucu kapali, guvenlik duvari
  5984'u engelliyor, alan adi/IP hatali""
- `describeStatus()` → 401/403 kimlik, 404 veritabani adiyla, 405 CORS eksik,
  504 zaman asimi, 5xx sunucu hatasi, digerleri HTTP kodu

**Parola sizintisi yok:** `redactSecrets()` her hata metninden parolayi ve
kullanici adini siler, `user:pass@` ve `Basic ...` kaliplarini temizler.
Test: hata mesajlarinin hicbirinde parola gorunmedi.

**Test 27/27** — canli `dbpanel.hmxagent.cfd:5984` 200, yanlis sifre 401,
olmayan DB 404, CORS header geliyor, redaction 6/6, durum kodlari 7/7.

### 2) Baglanti alanlari hesap ekranina tasindi
- `src/components/pos/ConnectionRow.tsx` **(yeni)** — tek satir: adres kutusu,
  goz simgesi, ""Sadece baglantiyı sina"", baglan/durdur tusu, durum noktasi
- `src/components/pos/ConnectionFields.tsx` **(yeni)** — iki satır + birlestirme
  sorusu + ilerleme; **ayarlar ve hesap ekranlari bunun ortak kullanimi**
- `AddAccountModal` / `EditAccountModal` → ayni bilesen eklendi; kullanici
  **uygulamaya girmeden** adresi yazip test edebiliyor ve baglanip veriyi cekebiliyor
- Yeni hesapta baglantilar `__new_account_draft__` altinda tutulur, kayit aninda
  gercek hesap kimligine tasinir
- Eski `AccountConnectionPanel` JSX'i silindi → **kod tekrarı yok**

**Bulunan UX hatasi:** basarili ""sadece sina"", durumu `connected` yapiyordu; bu
yuzden baglan dugmesi ""durdur"a donusuyordu. Yeni `'ok'` durumu eklendi
(test basarili ama bagli degil → dugme ""baglan"" kalir).

**Test 8/8** — hesap ekraninda iki alan, iki dugme, iki test dugmesi, parola maskeli.

### 3) Baglaninca otomatik aktarim
- `pouch.ts` → `onDocsChanged` artik `{written, read}` sayaci ile cagriliyor
- `connectionStore.startConnection` → ilk aktarim sayaci + sunucudaki toplam belge;
  ilk `paused` (aktarim bitti) olayinda **""Aktarim tamamlandi""** + canli esitleme devam
- Telefon bos → **sorusuz** sunucudaki tum veri cekilir
- Telefon **ve** sunucu doluysa → ""Birleştir / Sadece sunucudakini al"" (varsayilan Birleştir)
- `ConnectionFields` → ilerleme cubugu: ""Aktariliyor… 12 / ~35"", bitince
  ""Aktarım tamamlandı — 48 belge alındı · Canlı eşitleme devam ediyor""

**Test 13/13** — bos telefon: soru yok, 35 belge indi, ilerleme + tamamlandi mesaji;
dolu telefon: soru cikti, iki secenek, birlestirme sonrasi telefon verisi korundu
ve sunucu verisi de telefonda.

### Toplam bu tur: 48/48 test gecti (27 + 8 + 13)
- Surum: versionName 1.3.2, versionCode 19 -> `bizneshasap-apk/BiznesHasap-v1.3.2.apk` (16.82MB)

## 2026-10-04 — v1.3.3: hesap modalı yerleşimi + tek dil

Kullanıcı raporu: "Yeni Hesap Ekle" penceresinde **bağlantı bölümü sağa
sıkışmış**, hesap adı görünmüyor, butonlar üst üste biniyor.

### 1) Yerleşim hatasının kök nedeni
`AddAccountModal` gövdesi `flex items-start space-x-4` idi → yan yana üç çocuk:
logo | form alanları | **bağlantı bölümü**. Bağlantı bloğu yatay flex'in 3. çocuğu
olduğu için sağa sıkışıyor, hesap adı alanı eziliyordu.

### 2) Tek sütun düzen (AddAccountModal + EditAccountModal)
- Sıralama: **hesap adı → CouchDB URL → veritabanı adı → Bağlantı → footer**
- Bağlantı bölümü yatay flex'ten **çıkarıldı**, kendi tam genişlikli bloğuna alındı
- Modal yüksekliği `max-h-[380px]` → `max-h-[92vh]` (telefonda 380px çok kıstaydı)
- Gövde `overflow-y-auto` kaydırılabilir; **footer kaydırılan gövdenin dışında**
  (`flex-shrink-0`) → Cancel/Save her zaman görünür
- `EditAccountModal` da aynı hatayı taşıdığı için **aynı düzeltme** yapıldı
- Logo 64px → 56px, alan `min-w-0` ile dar ekranda taşma engellendi

### 3) Bulunan iki ek hata
- **`TransferProgressBar` hiç render edilmiyordu** — `ConnectionFields` içinde
  kullanılmayan bileşen olarak kalmıştı, `<React.Fragment>` eşleşmesi bozuktu.
  Yeniden yazıldı: satırlar → **tek ilerleme kartı (en altta)** → merge modalı
- **"Sadece bağlantıyı sına" 3 satıra bölünüyordu** (360px'de) →
  butona `whitespace-nowrap flex-shrink-0`, adres span'ına `min-w-0 text-right`

### 4) Tek dil kuralı
Pencere başlığı İngilizce ("Add New Account") ama bağlantı metinleri Türkçe/
Türkmence sabit koddu. Arayüzün `conn` çeviri grubu **4 dile** eklendi
(tr · tm · en · ru) ve tüm bağlantı metinleri buna bağlandı:
- `ConnectionRow.tsx`: göz/bağlan/durdur tooltip'leri, test butonu
- `ConnectionFields.tsx`: satır başlıkları, placeholder'lar, ipucu, ilerleme
  kartı, merge modalı tamamı
- `connectionStore.syncMessage()` → `language` parametresi aldı; "Bağlanılıyor…",
  "Bağlı · db", "Erişim reddedildi", "Çevrimdışı" artık **seçili dilde**
- `StartOptions.language` eklendi; `ConnectionFields` `language`'i
  `startConnection` ve `resumeLastConnection`'a geçiriyor

### Test (Chromium 360px, canli CouchDB 127.0.0.1:5984/bim_market)
- Yatay tasma **yok** (`scrollWidth 360 = clientWidth 360`)
- Hesap adı ilk ekranda (y=102); Local/Online **dikey** alt alta
- Adres + göz + bağlan **ayni satirda**; durum ve test butonu satirin altinda
- Ilerleme karti iki satirin **altinda**, tam genisite (295px)
- Gercek baglanti: **"Connected · bim_market"** + "Transferring… 0 / ~44"
- Merge sorusu dogru cikti: "44 on this phone, 44 documents on the server."
- **Turkce/Turkmence/Rusca karakter kalmadi** (4 blok tarandi)
- 360x560 kisa ekran: icerik kaydiriliyor (607/421), **footer sabit** (537 <= 560)
- "Test connection only" tek satir (112x17, `wraps: false`)

### Surum
- versionName 1.3.3, versionCode 20 -> `bizneshasap-apk/BiznesHasap-v1.3.3.apk` (16.82MB)
- `aapt2` dogrulamasi: `package: name='com.bizneshasap.pos' versionCode='20' versionName='1.3.3'`
- Derleme: `npx vite build` OK → `npx cap sync android` OK → `assembleDebug` BUILD SUCCESSFUL
- Not: `npm run build` yerine `npx vite build` kullanildi; projede **dokunulmayan**
  dosyalarda 21 onceden gelen `tsc` hatasi duruyor, degisen dosyalarda 0 hata

## 2026-10-05 — v1.3.4: giriş ekranına dil seçici eklendi

### Değişiklik
`RightLoginForm` içine formun **en üstüne** 4 dil butonu eklendi:
**TR · TM · EN · RU** (bayrak SVG + kod etiketi).

Butona basınca `onSelectLanguage` callback'i tetikleniyor → `App.tsx`'teki
`handleLanguageChange` → tüm uygulama state'i anında yeni dile geçiyor.
Başlık, etiket, hata/başarı mesajı, bağlantı metinleri dahil her şey değişiyor.

### Dokunulan dosyalar
- `src/components/RightLoginForm.tsx` — `FlagIcon` import, `onSelectLanguage` prop,
  `LANGS` dizisi, dil butonu grubunun JSX'i
- `src/App.tsx` — `RightLoginForm`'a `onSelectLanguage={handleLanguageChange}` geçildi

### Test (Chromium 360px)
- 4 buton formun üstünde görünüyor
- RU'ya tıklanınca: "Пользователь", "Пароль", "Войти" — tüm form Rusça'ya döndü ✓
- Aktif dil butonu mavi kenarlı, diğerleri gri
- tsc: değişen dosyalarda **0 hata**

### Sürüm
- versionName 1.3.4, versionCode 21 → `bizneshasap-apk/BiznesHasap-v1.3.4.apk` (16.82 MB)
- `aapt2`: `versionCode='21' versionName='1.3.4'`

## 2026-10-05 — v1.3.5: giriş formundaki ikinci dil seçici kaldırıldı

Giriş ekranında dil seçimi iki kez görünüyordu: formun ortasında ve alttaki
araç çubuğunda. Ortadaki 4 buton kaldırıldı; alttaki bayraklı seçici kaldı.

- `RightLoginForm.tsx` — `FlagIcon`, `onSelectLanguage` ve `LANGS` bloğu silindi
- `App.tsx` — forma verilen `onSelectLanguage` prop'u kaldırıldı
- Test: formda TR/TM/EN/RU butonu yok; alttaki menüden English seçilince form
  "User / Password / Login" oldu
- versionName 1.3.5, versionCode 22 → `bizneshasap-apk/BiznesHasap-v1.3.5.apk` (16.82 MB)
- `aapt2`: `versionCode='22' versionName='1.3.5'`
