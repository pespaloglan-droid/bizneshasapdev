# BİZNES HASAP — OTURUM DURUMU (CANLI HANDOVER)

> Bu dosya oturum boyunca **her büyük adımda güncellenir.** Yeni oturumda kaldığın
> yerden devam etmek için önce bu dosyayı, sonra `C:\Users\User\Desktop\BIZNESHASAP-GELISTIRME.md`
> (asıl görev listesi) ve `PROJE-ANALIZI-VE-OTURUM-CIKISI.md` (tuzaklar) dosyasını oku.
>
> **Son güncelleme: 2026-10-08 · 2.3 tamamlandı, 3.x sürüyor**

---

## ANA GÖREV

`C:\Users\User\Desktop\BIZNESHASAP-GELISTIRME.md` içindeki TÜM maddeleri adım adım uygula.
Kullanıcı talimatı: "bu md dosyasinda gelistirmen ve duzeltmen gereken seyler tamamen analiz
edilip yazilmistir. sende adim adim hepsini uygula".

## TAMAMLANAN İŞLER

### ✅ 2.1 conflictResolver testleri — `tests/db/conflictResolver.test.ts` (26 test)

### ✅ 2.2 currency/ledger lisans kapısı
- `src/utils/gateMiddleware.ts` ROUTE_GUARDS'a `'currency': 'FIYAT'` ve `'ledger': 'RAPOR'` eklendi.
- `tests/utils/gateMiddleware.test.ts` → 4 regresyon testi (20/20 yeşil).
- ⚠️ **KULLANICIYA BİLDİRİLECEK:** `PosWorkspace.tsx:346` tabToGateRoute'ta `'courier'` rotası
  da korumasız çıktı — MD kapsamında yok, hangi lisans modülüne (SATIS?) bağlanacağına
  kullanıcı karar vermeli.

### ✅ 2.4 Hesaplama modülleri testleri (62+ test)
- `tests/utils/calcPeriods.test.ts` (24), `calcFlow.test.ts` (16), `calcAssets.test.ts` (22)
- Ek: `tests/db/schemaBridge.test.ts` (19), `sanitize.test.ts` (~25), `couchAddress.test.ts` (~29)

### ✅ 2.3 PouchDB şifreleme bağlama (FAZ 1.1) — TAMAMLANDI
**Yeni dosyalar:**
- `src/db/cryptoPlugin.ts` — crypto-pouch plugin kaydı TEK kaynakta (PouchDB.plugin idempotent değil).
- `src/db/encryptionState.ts` — flag (`bh.db.encrypted.v1` localStorage, varsayılan KAPALI) +
  parola önbelleği + prepared bayrağı. pouch.ts ↔ dbEncryption.ts döngüsünü kırmak için
  hiçbir proje dosyasını import etmez.
- `src/init/prepareEncryption.ts` — `prepareEncryption()`: flag kapalı→null cache; açık→
  `getDbPassword()`; hata→null (fırlatmaz, loglar, fail-closed).
- `src/db/runEncryptionMigration.ts` — `migrateAccountStoreToEncrypted(storeKey)` +
  `migrateAllStoresToEncrypted(keys, onProgress)`. Kaynak ASLA silinmez; başarısız belgeler
  `failed` listesinde açıkça raporlanır.
- `src/components/sazlamalar/EncryptionSettingsCard.tsx` — Ayarlar→Umumy kartı: uyarılar,
  iki aşamalı onay, ilerleme, hata listesi (hata varsa flag AÇILMAZ), "Täzeden başlat",
  geri dönüş = flag kapat (kaynak duruyor, veri kaybı yok).

**Değişen dosyalar:**
- `src/db/pouch.ts`:
  - `NEVER_ENCRYPTED_DBS = {'system_accounts'}` (kilit döngüsü, spec v3 §3.2)
  - `shouldUseEncryptedDb()` = flag açık + prepared + NEVER'da değil
  - `deriveDbPassword()` (getDatabaseKey→base64; tek türetme kaynağı — dbEncryption.getDbPassword burayı çağırır)
  - `getLocalDatabase()` şifreli dalı: `biznes_<ad>_enc` açar, `crypto()` hazırlık parolasıyla
    hemen başlar; parola null ise op anında lisanstan tekrar türetilir (lazy — restart gerekmez).
    Proxy op'ları lisans kontrolüne ek `cryptoReady`'yi await eder. Reddedilen crypto op'a taşınır (sessizlik yok).
  - `destroyLocalDatabase()` artık hem düz hem `_enc` fiziksel kovayı siler (hesap silme kalıntı bırakmaz)
  - `resetDatabaseKeyCacheForTests()` export (60sn key cache'ini sıfırlar)
- `src/db/dbEncryption.ts`: flag fonksiyonları encryptionState'e taşındı (re-export korunur),
  `getDbPassword()` → `deriveDbPassword()` çağrısı, plugin kaydı cryptoPlugin'den.
- `src/App.tsx`: `encryptionReady` state + mount'ta `prepareEncryption()`; bitmeden
  "Hazırlanıyor..." ekranı (UI'dan önce async hazırlık, MD Adım 2).
- `src/components/sazlamalar/SazlamalarWorkspace.tsx`: 'general' bölümüne EncryptionSettingsCard.

**Testler (+19, toplam 285):**
- `tests/db/encryptionState.test.ts` (7), `tests/init/prepareEncryption.test.ts` (5),
  `tests/db/pouchEncrypted.test.ts` (7 — sahte PouchDB ile; system_accounts asla şifrelenmez,
  lazy crypto, WRONG_KEY yüzeye çıkar, lisanssız op LICENSE_REQUIRED)

**Doğrulama kanıtları (2026-10-08):**
- `npx vitest run` → **285/285, EXIT=0**
- `npx tsc --noEmit` → **EXIT=0**
- `npm run build` → **EXIT=0** (dist/assets/index-C9ettxHY.js)
- `grep -r "crypto-pouch" dist/assets/` → **BULUNDU** (+ `removeCrypto`, `_local/crypto` izleri)
- `license-native: npm test` → **21/21**
- accounts.json/system_accounts şifreleme dışı ✓ (`accountService.ts:1` → masterAccountsDb →
  NEVER_ENCRYPTED_DBS; hesaplar ayrıca localStorage'da)

**ÖLÇÜLMEDİ (yalan söyleme):**
- Şifreli DB üzerinden CouchDB live sync — gerçek CouchDB gerekir, ölçülmedi.
- UI üzerinden uçtan uca migrasyon (Electron'da elle tıklama) — ölçülmedi; mantık unit testlerle kilitli.

---

## KALAN İŞLER (MD sırasıyla)

### 3.x Orta öncelikli (ŞU AN BURADAYIZ)
- **3.1 Kod imzalama** — sertifika bilgisi kullanıcıdan istenecek; ASLA repoya konmayacak.
  electron-builder config. YAPILMADI — kullanıcıya sorulacak.
- **3.2 Audit log (FAZ 2.2)** — MD satır ~410-455: `src/db/auditLog.ts` (getLocalDatabase('audit')),
  kim/ne zaman/ne yaptı; PermissionsPanel'de `auditLogEnabled` bayrağı ZATEN VAR
  (SazlamalarWorkspace'te draft.general.auditLogEnabled). MD'deki taslağa bak.
- **3.3 schemaBridge tekilleştirme (FAZ 2.3)** — MD satır ~455+: çift format yazımı yerine
  tek şema + dönüştürücü katmanı. Mevcut: `src/db/schemaBridge.ts` (PC: urun:/kagent:/fatura: ↔
  APK: product_/customer_/invoice_). MD taslağını oku.
- **3.4 PosWorkspace refactor + Zustand** — ÖNCE PLAN SUNULACAK (orijinal brief kuralı:
  kullanıcı onayı olmadan refactor YOK). PosWorkspace.tsx ~3200+ satır.

### 5.x Excel (task #8)
- read-excel-file & write-excel-file kaldır → exceljs tek kütüphane
- Stil standardı: başlık #4472C4, zebra çizgileri, `#,##0.00 ₼`, DD.MM.YYYY HH:mm
- COLUMN_MAPPING içe aktarım + sanitizeExcelImport + ImportResult hata yönetimi + UI

### 6.x CouchDB senkron (task #9)
- 6.2 seçici sync (filtreli replication), 6.3 ConflictResolverModal UI,
  6.4 SyncProgress (hız/ETA), 6.5 FirstRunWizard OOBE, 6.6 bağlantı testi (gecikme/bant/kalite)

### 4.x + 7.x (task #10)
- 4.x: electron-updater auto-update, Playwright E2E, opt-in telemetri
- 7.x: zod şemaları, measureOperation perf util, useCleanup/usePouchSync hookları,
  BiznesHasapError/DatabaseError/LicenseError hata sınıfları

### Oturum sonu
- `PROJE-ANALIZI-VE-OTURUM-CIKISI.md` güncelle
- Tam doğrulama turu: vitest EXIT=0, tsc EXIT=0, build, license-native 21/21, bundle grepleri
- Kullanıcıya: 'courier' rotası kararı + kod imzalama sertifikası sorulacak

## KURALLAR (önceki brief'ten — hâlâ geçerli)
1. "Eksik" demeden önce kodu oku; iddia = satır no ile kanıt.
2. `electron/main.cjs`'ye dokunmadan önce DIŞ KOPYA: `C:\Users\User\Desktop\maincjs-yedek\`
3. license-native/test/test.js 21 testi bozma.
4. Yeni IPC → `tests/setup.ts` electronAPI mock'unu da güncelle.
5. npm ci sonrası: `cd license-native; npm ci; npm run build-native; cd ..`
6. Coverage eşiği `coverage.thresholds` altında.
7. Sessiz başarısızlık YASAK (hata yutan kod, "başarılı" sanılan başarısız yazma).
8. bulkDocs'a kaynak `_rev` GÖNDERME → `prepareDocForTarget()` (migrateToEncrypted.ts'de).
9. deriveLicenseKey 2 argüman: (licenseId, purpose) — getLicenseId() kullan.
10. crypto-pouch KISMİ şifreler (_id/_rev düz kalır) — "tamamen şifreli" DEME.
11. getLocalDatabase'i ASLA async yapma; feature flag varsayılanı KAPALI; kullanıcı onayı
    olmadan şifrelemeye geçiş yok; migrasyonda kaynak DB'yi ASLA silme.
12. Ölçemediğin iddiayı "ölçülmedi" diye işaretle. Komutların EXIT kodunu raporla.
