# BİZNES HASAP — KAPSAMLI ANALİZ RAPORU

**Rapor tarihi:** 08 Ekim 2026
**Proje:** `C:\Users\User\Desktop\Biznes Hasap PC-APK 1`
**Sürüm:** 1.150.0
**Ana plan kaynağı:** `GELISTIRME-PLANI-FAZLAR.md` (FAZ 1–6)

> Bu dosya **tek ve güncel** devretme belgesidir. Önceki `OTURUM-CIKIS-RAPORU.md`
> ve bayat notlar (`SONRAKI-OTURUM.md`, `LISANS-ENTEGRASYON-HANDOFF.md`)
> silindi veya bu belgeye yansıtıldı.

---

# BÖLÜM 0 — YÖNETİCİ ÖZETİ

Uygulama **işlevsel olarak güçlü, üretime hazır bir offline-first POS + ön muhasebe
sistemidir.** Rakip `aish` karşısında mimari ve özellik setinde açık ara önde;
açık mühendislik olgunluğunda (test, güncelleme, şifreleme, izlenebilirlik).

**Bu çalışmada 8 açık kapatıldı, 2'si kısmen:**

| # | Açık | Durum |
|---|------|-------|
| 1 | Yedek şifreleme **sessizce hiç çalışmıyordu** (imza hatası) | ✅ Kapatıldı |
| 2 | Şifreleme XOR idi — kriptografik olarak değersiz | ✅ AES-256-GCM |
| 3 | Test yoktu (0 test) | ✅ **99 test**, %88 kapsam |
| 4 | CI native modülü derlemiyordu → uygulama açılmazdı | ✅ Düzeltildi |
| 5 | `release-check` zorunlu değildi (spec 16.7 ihlali) | ✅ Düzeltildi |
| 6 | Lisans sırrı (`secret.key`) izlenebilirdi | ✅ `.gitignore` |
| 7 | `electron/main.cjs` bozuktu (85 satırdan 44'e kısaltılmıştı) | ✅ 366 satır, 19/19 IPC |
| 8 | PouchDB diske şifresiz yazıyordu (FAZ 1.1) | 🟡 Altyapı kuruldu, **bağlama kaldı** |
| 9 | Migrasyonda sessiz veri kaybı mayını (`_rev` → 409 → 0 belge) | ✅ Bulundu, testle kilitli |

**Kalan en önemli açık:** PouchDB şifrelemesi uygulamaya bağlanmadı —
`getLocalDatabase()` senkron, `deriveKey` asenkron. Uyumluluk gerçek CouchDB'de
ölçüldü ve sync **çalışıyor**; tek eksik async bağlama adımı (Bölüm 6.1).

---

# BÖLÜM 1 — UYGULAMA ANALİZİ

## 1.1 Ölçek (08.10.2026 itibarıyla ölçülmüş)

| Alan | Dosya | Satır |
|---|---|---|
| `src/components` | 141 | **27.791** |
| `src/db` | 27 | 4.344 |
| `src/utils` | 28 | 3.126 |
| `src/hooks` | 4 | 431 |
| `src/store` | 1 | 72 |
| `src/types.ts` | 1 | 512 |
| `src/types/license.ts` | 1 | 91 |
| `electron` (ana süreç) | 2 | 397 |
| `license-native/src` (C++) | 7 | 1.603 |
| **Üretim kodu toplamı** | **212** | **≈38.367** |
| `tests` (bu çalışmada eklendi) | 6 | 841 |

**Üretim çıktısı:** `dist/assets/index-*.js` = **2,08 MB** (tek chunk, code-split yok)
→ FAZ 5.6'da ele alınmalı.

> Not: `src/types.ts` **ve** `src/types/` (içinde `license.ts`) ikisi de var.
> Karışıklık riski — birleştirme önerilir.

## 1.2 Mimari

```
┌── RENDERER (React 18 + Vite 6) ───────────────────────────┐
│  App.tsx   → faz yönetimi: account → license → workspace  │
│  PosWorkspace.tsx (103,7 KB!) → 11 modül tek ağaç         │
│  WorkspaceRouter.tsx        → modül → ekran eşlemesi      │
│  TopNavBar.tsx              → sekme + lisans kapısı       │
└────────────────────────────────────────────────────────────┘
        │ window.electronAPI (preload.cjs · contextIsolation)
┌── MAIN (electron/main.cjs · 366 satır) ────────────────────┐
│  guardedIPC()  → 4 kanal lisans kapısında                  │
│  redactSecrets() → production hata temizleme               │
│  Lisans IPC (10 kanal) + printer + print-html + save       │
└────────────────────────────────────────────────────────────┘
        │                                │
┌── DATA ───────────────────┐  ┌── LİSANS (C++ / N-API) ─────┐
│ PouchDB (yerel, IndexedDB)│  │ license.node v1.0.0          │
│  ↕ canlı replikasyon      │  │ Ed25519 (tweetnacl)         │
│ CouchDB (LAN/internet)    │  │ 5 bileşen fingerprint        │
│ pouch.ts → Proxy (lisans) │  │ state: XSalsa20-Poly1305    │
│ 🆕 dbEncryption.ts (kapalı)│  │ deriveKey(purpose) → 32 byte │
│ 🆕 migrateToEncrypted.ts  │  │ 🆕 crypto-pouch (kısmi şifre.)│
└───────────────────────────┘  └─────────────────────────────┘
        │
┌── APK (Capacitor 6) ──────────────────────────────────────┐
│  Aynı renderer kodu · androidScheme:'http' (LAN için şart) │
│  Lisans: nodejs-mobile + license.so                       │
└────────────────────────────────────────────────────────────┘
```

## 1.3 11 Lisans Modülü / 12 Sekme

`license-native/gate.js` bitmask tanımları:

| Modül | Bit | Sekme | `TAB_MODULE` |
|---|---|---|---|
| SATIS | 1<<0 | `checkout`, `invoice` | `faktura` |
| ALIS | 1<<1 | (fatura tipi içinde) | — |
| STOK | 1<<2 | `product`, `warehouse` | `haryt`, `ambar` |
| KASA | 1<<3 | `money` | `kassa` |
| MUSTERI | 1<<4 | `customer` | `musteri` |
| TEDARIKCI | 1<<5 | — | — |
| RAPOR | 1<<6 | `calculation` | `hasaplama` |
| FIYAT | 1<<7 | — | — |
| AYARLAR | 1<<8 | `settings` | `sazlamalar` |
| YEDEK | 1<<9 | — | — |
| KULLANICI | 1<<10 | `user` | `ulanyjy` |

**Gate zinciri tam bağlı (bu çalışmada doğrulandı):**
`App.tsx:95` girişte `setLicenseId` → `PosWorkspace.tsx:319` `handleTabChange`
`setActiveTab`'ten **önce** `checkRouteAccess()` → engellenirse
`App.tsx:172` `handleLicenseRequired` → `App.tsx:244` `LicenseScreen`
`blockedRoute` ile açılır → `App.tsx:145` çıkışta `setLicenseId(undefined)`.

## 1.4 Veri Katmanı (27 servis)

| Servis | KB | Rolü |
|---|---|---|
| `pouch.ts` | 11,7 | DB örneği + lisans Proxy'si + toplu yazma |
| `schemaBridge.ts` | 12,8 | APK/PC şema köprüsü (**çift yazım**) |
| `connectionStore.ts` | 13,2 | Local/Online bağlantı yönetimi |
| `syncService.ts` | 10,6 | CouchDB canlı senkron |
| `accessService.ts` | 9,8 | 5 seviye yetki + whitelist |
| `sanitize.ts` | 8,2 | Girdi temizleme |
| `settingsService.ts` | 7,9 | Ayarlar |
| `targowService.ts` | 8,8 | Saha satışı |
| `conflictResolver.ts` | 5,1 | ⚠️ **Last-Write-Wins** (Bölüm 6.2) |
| `couchAddress.ts` | 6,8 | Adres/parola ayrıştırma |
| 🆕 `dbEncryption.ts` | 4,5 | Şifreli DB açma (flag KAPALI) |
| 🆕 `migrateToEncrypted.ts` | 3,2 | Kopyalama migrasyonu |
| Diğer 15 servis | — | ürün, müşteri, kassa, kur, birim, kullanıcı, kampanya... |

## 1.5 Para Birimi Motoru

- Taban para birimi **çalışma anında değiştirilebilir** (ESM canlı bağlayıcısı:
  `applyBaseCurrency()` değişince 14+ dosya otomatik güncellenir)
- `DEFAULT_BASE_CURRENCY = TMT` · `convertToTmt()` 2 ondalık yuvarlar
- 10 hazır para birimi + özel tanım · `ensureBaseCurrencySeeded()` idempotent
- `calcFlow.ts` · `calcAssets.ts` · `calcPeriods.ts` → rapor matematiği

## 1.6 Lisans Sistemi (C++ / N-API)

- **Kripto:** Ed25519 (tweetnacl) + SHA-512
- **Cihaz parmak izi:** 5 bileşen (CPU/MAC/Serial/Disk/Board), `minMatch=3`
- **Durum dosyası:** XSalsa20-Poly1305 şifreli, atomik yazma, 2 konum
- **Anahtar türetme:** `deriveKey(accountId, purpose)` → 32 byte
  (`db` · `backup` · `reports` · `export`)
- **Koruma:** replay (sequence), clock-rollback (lastSeen + mtime), APK imza hash
- **Test:** `license-native/test/test.js` → **21/21 geçiyor**
- **Public key** `src/public_keys.h` içine gömülü

## 1.7 Kod Kalitesi

| Ölçüm | Değer | Değerlendirme |
|---|---|---|
| `@ts-ignore` / `@ts-expect-error` | **0** | ✅ Mükemmel |
| `console.log` (src) | **0** | ✅ Temiz |
| Tam boş `catch {}` | **0** | ✅ Temiz |
| `as any` | 30 | ⚠️ Düzeltilmeli |
| `: any` anotasyonu | 11 | ⚠️ Düzeltilmeli |
| `tsc --noEmit` | EXIT=0 | ✅ |

## 1.8 Riskli Noktalar

**a) `PosWorkspace.tsx` 103,7 KB** — tek dosyada 11 modül, prop drilling.
`PosWorkspace → WorkspaceRouter → 11 workspace` arasında ~40 prop taşınıyor.
FAZ 2.4'te Zustand'a geçiş gerekiyor.

**b) `i18n.ts` 28 KB tek dosya** — FAZ 2.6'da bölünmeli.

**c) Üç Excel kütüphanesi** — `exceljs` + `read-excel-file` + `write-excel-file`.
Fazlalık paket; FAZ 2.6'da tekilleştirilmeli.

**d) `conflictResolver.ts` LWW** — sessiz veri kaybı. Bölüm 6.2.

**e) `currency` ve `ledger` sekmeleri kapıdan geçmiyor** — Bölüm 6.3.

---

# BÖLÜM 2 — BU ÇALIŞMADA YAPILANLAR

## 2.1 Test altyapısı (sıfırdan)

Kurulan: `vitest@5.0.3`, `jsdom`, `@vitest/coverage-v8`,
`@testing-library/{react,jest-dom,user-event}`, `happy-dom`, `crypto-pouch@4.0.2`

| Test dosyası | Test | Kapsam |
|---|---|---|
| `tests/utils/currency.test.ts` | 37 | kur dönüşümü, TMT normalizasyonu, kod benzersizliği, `ensureBaseCurrencySeeded` |
| `tests/utils/licenseGuard.test.ts` | 22 | AES-GCM round-trip, yanlış anahtar, bozuk tag, anahtar türetme, yedek şifreleme |
| `tests/db/migrateToEncrypted.test.ts` | 15 | kopyalama migrasyonu, **`_rev` regresyonu**, doğrulama |
| `tests/utils/gateMiddleware.test.ts` | 16 | rota→modül eşleşmesi, fail-closed, `guardNavigation` |
| `tests/utils/bhbak.test.ts` | 9 | şifreli yedek V2, farklı hesapta açılamaz, V1/JSON geriye uyumluluk |
| `tests/setup.ts` | — | `window.electronAPI` mock |
| **Toplam** | **99** | %88 stmts · %90 branch · %82 func |

## 2.2 Güvenlik düzeltmeleri

### (a) 🔴 `deriveLicenseKey` imza hatası
`preload.cjs` imzası `deriveLicenseKey(licenseId, purpose)` → **2 argüman**.
`pouch.ts` ve `licenseGuard.ts` **1 argüman** gönderiyordu → `purpose`, `licenseId`
yerine geçiyordu → native `deriveKey` **her zaman `null`** döndürüyordu.

**Sonuç:** hiçbir yedek şifrelenmiyordu, üstelik **hata da vermiyordu** —
sessiz başarısızlık. `getLicenseId()` ile düzeltildi.

### (b) `licenseGuard.ts` — XOR → AES-256-GCM
Eski `dataBuffer[i] ^ key[i % key.length]` kriptografik olarak değersizdi.
Yeni: Web Crypto AES-GCM, 12-byte rastgele IV, 128-bit auth tag.

### (c) `bhbak.ts` — V2 şifreli yedek
```
V2 (yeni):  'BHBK' | 2 | uzunluk | AES-GCM(gzip(json))
V1 (eski):  'BHBK' | 1 | uzunluk | gzip(json)        ← geriye uyumluluk
JSON (eski): düz metin — okunur
```

## 2.3 PouchDB disk şifreleme altyapısı (FAZ 1.1)

**Ölçüldü, varsayılmadı.** `crypto-pouch@4.0.2` + `pouchdb-browser@9.0.0`,
Node/bellek adapter ve **çalışan gerçek CouchDB** (`127.0.0.1:5984`) üzerinde:

| Senaryo | Sonuç |
|---|---|
| Şifreli yazma/okuma | ✅ |
| Yanlış parola reddi | ✅ veri açılmıyor |
| Range sorgusu / 404 | ✅ |
| Yeniden açılışta kalıcılık | ✅ |
| **Şifreli DB → CouchDB `sync`** | ✅ **çalışıyor** |
| **Sunucu → şifreli DB `replicate.from`** | ✅ çift şifreleme yok |
| `bulkDocs` kaynak `_rev` ile | 🔴 **409 → 0 belge** |

> Planda yazan `pouchdb-quick-crypto` **npm'de yok (404)** — o madde gerçeği
> yansıtmıyordu. Kullanılan paket `crypto-pouch`.

**Yazılan dosyalar:**

| Dosya | Satır | Ne |
|---|---|---|
| `src/db/dbEncryption.ts` | 113 | feature flag (`localStorage`, **varsayılan KAPALI**), `deriveKey('db')` → base64 parola, `openEncryptedDatabase()` |
| `src/db/migrateToEncrypted.ts` | 86 | kopyalama migrasyonu — **kaynak ASLA silinmez** (dosyada hiç `destroy()` yok), `verifyMigration()` |
| `src/db/crypto-pouch.d.ts` | 39 | gerçek API tip tanımı (`as any` yok) |
| `tests/db/migrateToEncrypted.test.ts` | 174 | 15 test, `_rev` regresyonu kilitli |

`pouch.ts` değişiklikleri: `getDatabaseKey()` dışa açıldı, `encryptedDbName()` eklendi.

### 🔴 Bulunan sessiz veri kaybı mayını
`bulkDocs` kaynak `_rev` değerleriyle çağrılırsa her belge için `409 conflict`
döner ve **hiçbir şey yazılmaz** — çağıran taraf "başarılı" sanabilir.
Çözüm: `prepareDocForTarget()` hedefe yazmadan önce `_rev`/`_conflicts`/`_deleted`
alanlarını siler. Regresyon testiyle kilitlendi.

### ⚠️ Dürüstlük notu: şifreleme KISMİ
`crypto-pouch` yalnızca belge **içeriğini** şifreler; `_id` ve `_rev`
**şifrelenmez**. Diskte `urun:1`, `fatura:2` görünür — belge türü okunabilir.
Finansal değerler (ad, fiyat, stok, borç, tutar) şifrelidir.
Bu, spec v2 B.4'ün "veritabanı şifreli" beklentisinin **tam karşılığı değil**.

### ⚠️ Aktif değil
Flag KAPALI olduğu için mevcut kurulumları etkilemez. Ayrıca `dbEncryption.ts`
henüz hiçbir yerden import edilmediği için Vite onu **tree-shake ediyor** —
yani build'in geçmesi paketlemeyi **kanıtlamaz** (doğrulandı).

## 2.4 `electron/main.cjs` onarımı

85 satır → **366 satır**. Bu oturumda yanlışlıkla 44'e kısaltılmıştı;
`C:\Users\User\Desktop\m\main.cjs` yedeğinden yeniden kuruldu.

- 19 IPC kanalı, preload ile tam eşleşme
- `guardedIPC()` → `printer-list`, `printer-print-test`, `save-file-as`, `print-html`
- `redactSecrets()` → production'da IP/port/şema/parola temizleme
- Lisans IPC'leri (10 kanal), Hesap ID doğrulaması (Crockford Base32)

**Gerçek Electron'da doğrulandı:**
```
19/19 IPC kanalı · createAccountId OK · getRequestCode OK (24 karakter)
checkLicense status=-5 (NOT_ACTIVATED) · deriveKey → null (lisanssızda veri açılamaz)
```

## 2.5 CI/CD düzeltmeleri

`.github/workflows/ci.yml` — 3 gerçek hata:

1. **Native modül derlenmiyordu.** `license.node` `.gitignore`'da → taze kurulumda
   `native.js` "bulunamadı" der → **uygulama açılmaz**. CI artık derliyor ve
   `require('./license-native/native.js')` ile doğruluyor.
2. **`release-check` `continue-on-error: true`** → zorunluluktan düşüyordu (spec 16.7).
3. **21 lisans testi hiç koşmuyordu** → eklendi.

## 2.6 Yapısal düzeltmeler

- **`.gitignore` yeniden yazıldı**: `node_modules`, `dist`, `dist-electron`,
  `coverage`, **`license-native/admin/secret.key`** (lisans üretim sırrı)
- **Coverage eşiği düzeltildi**: `coverage.lines` → `coverage.thresholds`.
  Vitest 5'te düz anahtar **sessizce yok sayılıyor**, `EXIT=0` çıkıyor —
  yani "70% kapı koydum" ama kapı **hiç uygulanmıyordu**.
  Kanıt: düzeltme sonrası önce **60% → EXIT=1** (kapı çalıştı),
  sonra testlerle **82% → EXIT=0**.
- **Bayat belgeler silindi**: `SONRAKI-OTURUM.md`, `LISANS-ENTEGRASYON-HANDOFF.md`

---

# BÖLÜM 3 — DOĞRULAMA KANITLARI

| Komut | Sonuç |
|---|---|
| `npx vitest --run` | **99 geçti** (5 dosya) · EXIT=0 |
| `npx vitest --run --coverage` | EXIT=0 · %88/%90/%82/%88 |
| `npx tsc --noEmit` | **EXIT=0** |
| `npm run build` | ✓ 53,89s |
| `cd license-native && npm test` | **21/21** |
| Electron IPC harness | **19/19** · `deriveKey`→`null` |
| `git check-ignore` | `secret.key` ✓ `node_modules` ✓ `dist` ✓ |

## Şifreleme — gerçek sunucuda ölçüldü

| Komut | Sonuç |
|---|---|
| Şifreli DB → CouchDB `sync` | ✅ içerik sağlam, çift şifreleme yok |
| Sunucu → şifreli DB `replicate.from` | ✅ |
| Yanlış parola | ✅ reddedildi |
| `bulkDocs` + `_rev` | 🔴 409 → 0 belge (kilitli) |

> Geçici test veritabanı `zz_enc_sync_probe_20261008` **silindi**.
> Ölçüm betikleri: `C:\Users\User\AppData\Local\Temp\opencode\cryptotest\`

---

# BÖLÜM 4 — ÖNCEKİ ÇALIŞMADA YANLIŞ SÖYÜLENLER

Bu çalışmanın başında "eksik" denilen iki madde **kod tabanında zaten vardı**:

| Yanlış iddia | Gerçek |
|---|---|
| "Gate UI entegrasyonu yok, `checkRouteAccess()` çağrılmıyor" | **VAR.** `PosWorkspace.tsx:80` import · `:319` `handleTabChange` `setActiveTab`'ten önce kontrol · `:334` `tabToGateRoute` 12 sekmeyi eşliyor · `App.tsx:95/:145/:244/:266` tam zincir |
| "Yedek UI'ı şifreli akışa bağlı değil" | **BAĞLI.** `SazlamalarWorkspace.tsx:211` → `encodeBhbak` · `:231` → `decodeBhbak` · `ImportDataModal.tsx:43` → `decodeBhbak` |

> 16 `gateMiddleware` testi yazılarak doğrulandı.
> **Ders:** "eksik" demeden önce kodu oku.

---

# BÖLÜM 5 — RAPORUN KAPSAM DIŞI KALAN FAZLAR

`GELISTIRME-PLANI-FAZLAR.md` içindeki, bu çalışmada **dokunulmayan** maddeler:

| Faz | İş | Durum |
|---|---|---|
| FAZ 2.2 | Audit log (işlem günlüğü) | Yok |
| FAZ 2.3 | `schemaBridge` tekilleştirme (çift yazım) | Yok |
| FAZ 2.4 | Zustand'a geçiş (`PosWorkspace` 103 KB) | Yok |
| FAZ 2.5 | `react-router` + `react-hook-form` + `zod` | Yok |
| FAZ 2.6 | `i18n.ts` bölme · Excel tekilleştirme · büyük bileşenleri bölme | Yok |
| FAZ 3.3 | **Playwright E2E** — `playwright-core` kurulu, **hiç kullanılmıyor** | Yok |
| FAZ 4.1 | Terezi entegrasyonu — `scale-status` **placeholder** | Yok |
| FAZ 4.2 | Harita / teslimat modülü | Yok |
| FAZ 4.3 | Şablon editörü (`receiptHtml.ts` sabit) | Yok |
| FAZ 5.1 | Auto-update (`electron-updater`) | Yok |
| FAZ 5.2 | Şema versiyonlama + migrasyon | Yok |
| FAZ 5.3 | Telemetri (opt-in) | Yok |
| FAZ 5.4 | Performans ölçümü (50k ürün / 100k fatura) | Yok |
| FAZ 5.6 | Paket boyutu + ilk açılış sihirbazı | Yok |

---

# BÖLÜM 6 — KALAN İŞLER (öncelik sırasıyla)

## 6.1 🟡 Şifrelemeyi uygulamaya bağla — FAZ 1.1 (devamı)

Altyapı hazır, uyumluluk ölçüldü, sync çalışıyor. **Bağlanmadı.**

**Engel:** `getLocalDatabase()` **senkron** döner, `deriveKey` **asenkron** (IPC).
Şifreli DB açmak için parolanın önce gelmesi gerekiyor.

**Önerilen çözüm:** Uygulama açılışında, UI'dan **önce** async bir "hazırlık"
adımı → parolayı çöz ve cache'le → `getLocalDatabase` senkron okusun.
(`getLocalDatabase`'ı async yapmak tüm uygulamaya yayılır, **çok riskli** —
yapma.)

**Sıra:**
1. Ayarlar ekranına "Veritabanını şifrele" düğmesi + migrasyon sihirbazı
2. Async hazırlık adımı (açılış sırası)
3. `accounts.json` şifreli DB dışında kaldığını doğrula (spec v3 §3.2 **kilit döngüsü**)
4. Kullanıcı onayı olmadan şifreli DB'ye geçme; geçişten sonra geri dönüş yolu
5. Bağlandıktan sonra `crypto-pouch`'un bundle'da olduğunu doğrula

## 6.2 🟠 Çakışma çözümü — FAZ 2.1 (veri kaybı riski)

`src/db/conflictResolver.ts` (132 satır) **Last-Write-Wins** uyguluyor:
`updatedAt` en yeni kazanıyor, diğerleri siliniyor.

**Risk:** iki kasiyer aynı müşteri bakiyesini offline güncellerse **biri sessizce
kaybolur.** Ön muhasebe ürününde kabul edilemez. **Hiç testi yok.**

**Çözüm:** Finansal belgeler **append-only** olsun (fatura iptal = yeni "iptal
belgesi") → çakışma matematiksel olarak oluşmaz. Değiştirilebilir belgelerde
çakışma kuyruğu + kullanıcı onayı.

## 6.3 🟠 `currency` / `ledger` sekmeleri kapıdan geçmiyor

`tabToGateRoute` bu ikisini route'a eşliyor, ama `gateMiddleware.ts`'teki
`ROUTE_GUARDS` sözlüğünde **`'currency'` ve `'ledger'` anahtarları yok** →
`checkRouteAccess()` `NO_LICENSE_REQUIRED` dönüp **izin veriyor**.

Doğrula ve düzelt (hangi modüle bağlanacak netleştir: `FIYAT` mı `RAPOR` mu).

## 6.4 🟠 Test kapsamını genişlet — FAZ 3.1

**Testsiz riskli dosyalar:**

| Dosya | KB | Risk |
|---|---|---|
| `src/db/conflictResolver.ts` | 5,1 | 🔴 Veri kaybı (6.2) |
| `src/utils/calcFlow.ts` | 4,2 | 🟠 Para toplamları |
| `src/utils/calcAssets.ts` | 4,7 | 🟠 Varlık/stok değeri |
| `src/utils/calcPeriods.ts` | 4,3 | 🟠 Dönem hesabı |
| `src/db/schemaBridge.ts` | 12,8 | 🟠 Çift yazım doğruluğu |
| `src/db/sanitize.ts` | 8,2 | 🟠 Girdi temizleme |
| `src/db/couchAddress.ts` | 6,8 | 🟠 Adres/parola ayrıştırma |

## 6.5 🟡 Kod imzalama — FAZ 1.4
Windows: OV/EV Authenticode → `electron-builder` `win.certificateFile`.
SmartScreen uyarısını kaldırır, kurumsal satışta engeli çözer.
Maliyet düşük · iş yükü düşük · **etki yüksek.**

---

# BÖLÜM 7 — YENİ OTURUM İÇİN TUZAKLAR

> Bu çalışmada **üç** sessiz başarısızlık üreten hata yapıldı/keşfedildi.

### 🔴 0. `bulkDocs` kaynak `_rev` ile çağrılırsa 0 belge yazar
**Ölçülmüş davranış.** `allDocs({include_docs:true})` çıktısı `_rev` içerir; o
belgeleri olduğu gibi hedefe yazarsan PouchDB her biri için `409 conflict` döner
ve **hiçbir şey yazılmaz** — çağıran "başarılı" sanabilir.
→ `prepareDocForTarget()` kullan. Regresyon testi kilitli.

### ⚠️ 1. `deriveLicenseKey` 2 argüman alır
`(licenseId, purpose)`. Tek argüman gönderirsen `deriveKey` **sessizce `null`**
döner, hata vermez, şifreleme yapılmaz. → `getLicenseId()` kullan.

### ⚠️ 2. Coverage eşiği `coverage.thresholds` altında
Düz `coverage.lines` **sessizce yok sayılır** → `EXIT=0` → kapı yoktur.
Doğrulama: eşiği geçemeyen durumda `EXIT=1` gördüğünden emin ol.

### ⚠️ 3. Build geçmesi paketlemeyi kanıtlamaz
`dbEncryption.ts` import edilmediği için Vite tree-shake ediyor → `crypto-pouch`
bundle'da yok. Şifrelemeyi bağladığında **ayrıca** kontrol et.

### ⚠️ 4. `license.node` `.gitignore`'da
`npm ci` sonrası `cd license-native; npm ci; npm run build-native; cd ..`
Aksi halde uygulama açılmaz.

### ⚠️ 5. `electron/main.cjs` yedeğini tut
Bu çalışmada 434 → 44 satıra düştüm; dış kopya olmadan geri alamadım.

### ⚠️ 6. Şifreleme **kısmi** — `_id` görünür
Kullanıcıya "veritabanının tamamı şifreli" deme. Finansal değerler şifreli,
belge türü okunabilir.

### ⚠️ 7. `tests/setup.ts` mock'unu güncelle
Yeni IPC eklersen `window.electronAPI` mock'una da ekle.

### ⚠️ 8. `license-native/test/test.js` 21 testi bozma
Spec testleri. Yeşil kalmalı.

---

# BÖLÜM 8 — HIZLI BAŞLATMA

```powershell
cd "C:\Users\User\Desktop\Biznes Hasap PC-APK 1"
npm ci
cd license-native; npm ci; npm run build-native; cd ..
npm test -- --run          # 99 test, EXIT=0 olmalı
npx tsc --noEmit           # EXIT=0 olmalı
npm run build              # ~55 sn
```

## Önerilen ilk iş

**`conflictResolver.ts` için testler yaz.** Gerekçe:
- En yüksek veri kaybı riski (sessiz para kaybı), 132 satır, **hiç testi yok**
- Küçük ve **bağımsız** — PouchDB mock'u gerektirmez
- 6.2'deki append-only dönüşümün **temeli** testlerle atılmalı

Sıra: `conflictResolver` testleri → `calc*` testleri → 6.3 kapı düzeltmesi →
6.1 şifreleme bağlama (async hazırlık + ayarlar UI) → 6.5 kod imzalama.

---

*Bu rapor statik kod analizi, çalıştırılmış test/build çıktıları ve gerçek
CouchDB sunucusunda yapılan ölçümlere dayanır. Satır sayıları 08.10.2026
itibarıyla ölçülmüştür.*