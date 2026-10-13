# BİZNES HASAP — `faz-c-d/altyapi-hazirlik` BRANCH'İ DÜZELTME LİSTESİ

**Hazırlayan:** bağımsız kod analizi (Kimi Code), snapshot `2699f81`
**Tarih:** 2026-10-12
**Repo:** https://github.com/pespaloglan-droid/bizneshasapdev · Branch: `faz-c-d/altyapi-hazirlik`

Bu liste, branch üzerindeki bağımsız analizde bulunan güvenlik ve veri kaybı
sorunlarını içerir. Her maddede: kanıt (dosya:satır), senaryo, istenen en küçük
güvenli düzeltme ve kabul kriteri var.

## Çalışma kuralları (bunlara uy)

- Yalnızca `faz-c-d/altyapi-hazirlik` branch'inde çalış; **main'e dokunma.**
- Her madde ayrı, küçük, Türkçe açıklamalı commit olsun.
- Her commit sonrası: `npm test -- --run` (308 test geçmeli) + `npm run build` + `npx tsc --noEmit`.
- UI metni eklersen `useT()`/`translate()` ile **4 dilde** (tr/tm/en/ru) `i18n.ts`'e ekle.
- Excel kolon başlıkları Türkmençe kalır; export↔import roundtrip sözleşmesini bozma.
- DB belge formatını, finansal enum'ları ve eski kayıt uyumluluğunu koru.
- Parola DEĞERLERİNİ commit mesajına, koda, loga, MD'ye yazma.
- **Yapma listesi:** canlı CouchDB parola rotasyonu (insan işi, ayrı plan), git history rewrite, force push, release yayınlama, main merge, telemetri canlı anahtarları ekleme.
- Yeni test dosyası eklemek serbest (bu branch'te test altyapısı zaten genişletildi); varsa mevcut testleri genişletmeyi tercih et.

---

## P0 — merge öncesi zorunlu

### P0-1 · "Sadece sunucudakini al" sunucudaki veriyi de siliyor
- **Kanıt:** `src/db/connectionStore.ts:344-346` → `clearLocalData` (`:261-272`) tüm yerel belgelere `_deleted:true` tombstone'u yazıyor; ardından başlayan sync'te **push filtrelenmiyor** (`src/db/pouch.ts:479-487`). Tombstone'lar sunucuya replike oluyor → uzak belgeler siliniyor, diğer cihazlar silmeyi çekiyor.
- **Senaryo:** Telefonda "Sadece sunucudakini al" seç → PC'deki tüm ürün/müşteri/fatura silinir.
- **Düzeltme (birini seç):**
  a) serverOnly akışında tombstone yazmak yerine yerel PouchDB'yi `destroy()` edip yeniden aç (tercih edilen), veya
  b) ilk çekim (pull) tamamlanana kadar push'u devre dışı bırak.
- **Kabul:** serverOnly sonrası sunucudaki belge sayısı değişmez; `_deleted` tombstone'u sunucuya gitmez; mevcut "Birleştir" akışı etkilenmez. Regresyon testi ekle (testlerde PouchDB adapter mevcut).

### P0-2 · Satış yazılamasa bile satış "başarılı" sayılıyor
- **Kanıt:** `src/db/salesService.ts:17-20` — birincil `upsertDoc` dahil validation-dışı tüm hatalar yutuluyor ve fatura nesnesi dönüyor. `src/hooks/useInvoiceActions.ts:228-232` bunun üzerine stok düşüyor, bakiye işliyor, başarı toast'ı gösteriyor. Aynı yutma deseni: `src/db/productService.ts:60-63`, `src/db/customerService.ts:59-62`.
- **Senaryo:** LICENSE_REQUIRED / 409-retry tükenmesi / kota hatası → DB'de fatura yok ama stok düşmüş, bakiye işlemiş, kullanıcı "satış tamam" görüyor. Yeniden yüklemede fatura kayboluyor.
- **Düzeltme:** Birincil belge yazımı başarısızsa hatayı **rethrow** et (yalnızca PC ayna/mirror hatası yutulmaya devam edebilir — o P1-5 kapsamında raporlanacak). `handleCompleteSale`'de try/catch: birincil yazım başarısızsa stok/bakiye yan etkilerini ÇALIŞTIRMA, kullanıcıya hata göster (4 dilde).
- **Kabul:** Yazım reddi simülasyonunda (mock upsertDoc hata fırlatır) stok/bakiye DEĞİŞMEZ, hata mesajı görünür, sepet korunur. Birim/E2E testi ekle.

### P0-3 · Çift tık duplicate satış + duplicate taslak onayı
- **Kanıt:** F5 `saleBusyRef` korumalı (`PosWorkspace.tsx:795-799`) ama `onCompleteSale={handleCompleteSale}` butonları korumasız (`PosWorkspace.tsx:1178,1318`). Taslak onayı da korumasız: `PosWorkspace.tsx:1607` → `useDraftActions.ts:200-207` (çift tık → çift stok düşümü + çift kassa kaydı, `mtx-${Date.now()}` id'leriyle).
- **Düzeltme:** `useInvoiceActions` ve `useDraftActions` içine in-flight guard (busy ref) ekle; F5 ile buton yolu aynı guard'ı paylaşsın. Fatura/transaction id üretimine zaman damgasına ek rastgele/UUID son ek koy.
- **Kabul:** Hızlı çift çağrıda tek fatura/tek stok düşümü/tek kassa kaydı. E2E: butona çift tık senaryosu.

### P0-4 · `Yeni-HesapVeritabani.ps1` içinde sabit admin credential
- **Kanıt:** satır 22-23 — boş olmayan sabit `$adminUser`/`$adminPass` literal.
- **Düzeltme:** Sabitleri kaldır; `param([Parameter(Mandatory=$true)][string]$AdminUser, [Parameter(Mandatory=$true)][string]$AdminPass)` veya `Read-Host -AsSecureString` ile runtime input'a geçir. Kullanım örneğini dosya başına yorum olarak ekle (gerçek değer YAZMA).
- **Kabul:** Dosyada credential literal'i kalmaz; script parametreli çalışır.
- **Not:** Canlı sunucuda parola rotasyonu ayrı insan işidir — bu görev SADECE dosya temizliği.

### P0-5 · Repo içinde kalan parola literalleri
- **Kanıt (değerleri yazmadan):**
  - `bizneshasap-apk/ISLEM-LOG.md` satır **126** (uygulama parolası), **262** (uygulama), **263** (admin)
  - `README.md:21, 75-76, 247` (eski `HMX2004` — örnek adreslerde ve user-doc JSON'unda)
  - `src/db/couchAddress.ts:5-6` (JSDoc örneği — kaynak koda gömülü)
  - `tests/db/couchAddress.test.ts:89-90` (test sabiti)
- **Düzeltme:** Tüm literalleri placeholder'a çevir (`http://kullanici:SIFRE@host:5984/db`, `<ROTATE-EDILDI>`). Testte rastgele anlamsız string kullan (`test-sifresi-123` gibi).
- **Kabul:** `git grep -in "HMX2004\|bh_sync_\|bh_app_" -- ':!node_modules'` boş döner.
- **Not:** Rotasyon yapılmadan bu temizlik güvenliği sağlamaz; ama yapılacak ilk kod işi budur.

---

## P1 — yüksek öncelik

### P1-1 · Kısmi tahsilatlı veresiye faturanın void'i bakiyeyi fazla düşürüyor
- **Kanıt:** `src/hooks/useInvoiceEffects.ts:73-80` (ve `useDraftActions.ts:72-73`) void'de `invoice.remainingDebt`'in (satış anındaki ORİJİNAL borç) tamamını tersine çeviriyor. Tahsilat hareketleri (`weresiye_yygnamak`) `invoiceId` taşımadığı için temizlik kapsamına girmiyor.
- **Senaryo:** 100 borç → 40 tahsilat (cari borç 60) → void → bakiye 40 daha düşer (doğrusu: 60).
- **Düzeltme:** Void'de cari borcu (müşteri bakiyesi/fatura kalanı bazlı) veya `remainingDebt − bu faturaya ait tahsilatlar` kadar ters çevir. Tahsilat hareketlerine `invoiceId` eklemek daha temiz çözüm — eski kayıtlar için fallback bırak.
- **Kabul:** Senaryo birim/E2E testi: 100→40→void sonrası bakiye 0.

### P1-2 · Selective sync sınırı PC köprüsünden deliniyor
- **Kanıt:** Selector sadece `invoice_` prefix'ini dışlıyor (`src/db/syncSelection.ts:13`); eski `fatura:` aynaları pull ediliyor → `importPcMirrorsIntoStore` tarih kontrolü yapmadan bunları `invoice_` olarak yeniden doğuruyor (`src/db/schemaBridge.ts:329-347`).
- **Etki:** "3 aylık geçmiş" seçen cihaz eski faturaları köprüden geri alıyor; push tam olduğu için sunucuya da geri gidiyor.
- **Düzeltme:** Bridge import'a selective cutoff'ın aynısını uygula (completed + tarihli + cutoff öncesi ayna → atla).
- **Kabul:** 3 ay seçili cihazda 6 aylık `fatura:` aynası `invoice_` olarak doğmaz; test ekle.

### P1-3 · Conflict çözümü validation'ı bypass ediyor
- **Kanıt:** `src/db/conflictResolver.ts:119` ve `:209` — kazanan dal ham `db.put` ile ana revizyona kopyalanıyor (Zod'dan geçmiyor).
- **Etki:** Bozuk/legacy dal kazanırsa validation'suz gövde kalıcı olur; sonraki `upsertDoc` merge'i bu belgede validation patlatabilir → belge bir daha güncellenemez (hata servis katmanında yutulduğu için sessiz).
- **Düzeltme:** Kazanan gövdeyi kopyalamadan önce `validation.ts`'teki şema ile doğrula; geçemezse o dalı atla + kullanıcıya raporla (UI akışını bozmadan).
- **Kabul:** Bozuk dal kazandırılmaz; geçerli dal davranışı değişmez; test ekle.

### P1-4 · Satış yan etkileri atomik değil + hatalar yutuluyor
- **Kanıt:** `src/hooks/useInvoiceEffects.ts:61-64,86` — her ürün/müşteri tekil `save*ToDb(...).catch(() => {})`.
- **Düzeltme:** Hataları yutma; toplayıp kullanıcıya raporla ("3 stok güncellenemedi" gibi, 4 dilde). Mümkünse fatura+stok+bakiye yazımını tek `bulkDocs` ile grupla; değilse en azından başarısız kalemleri sonuç nesnesinde döndür.
- **Kabul:** Stok yazımı reddedildiğinde kullanıcı görünür uyarı alır; UI state'i DB gerçeğiyle tutarlı kalır.

### P1-5 · PC ayna yazımı hatası sessiz
- **Kanıt:** `mirrorToPc` hatası `save*ToDb` içinde yutuluyor (`salesService.ts:17-19` vb.); `saveProductsBatchDb`'de `Promise.allSettled` (`productService.ts:38`).
- **Etki:** Ayna eksik kalır; PC ürünü/faturayı hiç görmez; import raporu "written" dese bile PC'ye gitmemiş olabilir.
- **Düzeltme:** Ayna hatalarını ayrı kalem olarak raporla/logla (parola sızmadan, `redactSecrets` ile). Sonraki bridge çalışmasında eksik aynaları tamamlayan reconciliation ekle (veya en azından sayım uyumsuzluğunda uyarı).
- **Kabul:** Ayna hatası kullanıcı/log katmanında görünür; sync raporu doğruyu söyler.

### P1-6 · Credential saklama düz metin + internet HTTP uyarısı yok
- **Kanıt:** `src/db/connectionStore.ts:100-106` `bh_couch_conn_<accountId>` ham `user:pass@host` URL saklıyor; `src/db/syncService.ts:87` `bh_sync_config.password` düz. `src/db/couchAddress.ts:60` `http:` şemasını koşulsuz kabul ediyor.
- **Düzeltme (iki parça):**
  a) Kısa vade: adresi kimliksiz sakla + parolayı ayrı anahtarda obfuske tut; UI'da "bağlantı bilgisi cihazda saklanır" notu. (Uzun vade Electron safeStorage / Android Keystore — ayrı görev olarak MD'ye not düş.)
  b) `kind === 'domain' && protocol === 'http:'` iken bağlantı panelinde belirgin uyarı göster (4 dilde): "İnternet üzerinden şifresiz HTTP — parola yolda görülebilir."
- **Kabul:** localStorage'da düz `user:pass@` kalıbı kalmaz (migration: eski kayıt okunup yeni formata taşınır); domain+http uyarısı görünür; mevcut bağlanma akışı çalışır.

---

## P2 — orta öncelik

### P2-1 · Tombstone üzerine yeniden yaratma sessizce başarısız
- **Kanıt:** `src/db/pouch.ts:258-263` — `allDocs` silinmiş belgeyi döndürmez → `existing` undefined → rev'siz put 409 → 3 deneme sonrası hata → servis katmanı yutuyor → sessiz kayıp.
- **Düzeltme:** 409'da belgeyi `{ revs_info: true }` veya `allDocs({ keys, include_docs: true, deleted: 'ok' })` ile bulup son rev ile put et.
- **Kabul:** Silinmiş ürün aynı ID/barkodla yeniden eklenebilir; test ekle.

### P2-2 · PC'de silme APK'ya yansımıyor
- **Kanıt:** `src/db/schemaBridge.ts` `listDocsByPrefix` tombstone'ları görmez → PC'de silinen ürün APK'da satılabilir kalıyor.
- **Düzeltme:** Bridge çalışmasında PC tarafında olmayan (veya tombstone'lu) belgeler için native tarafta karşılık gelen kaydı tombstone'la (dikkat: selective-sync cihazında "yokluk" ≠ "silindi" — yalnızca PC tarafında `_deleted` kanıtı varsa sil).
- **Kabul:** PC'de silinen ürün sync sonrası APK'da da silinir; selective-sync cihazında yanlış silme olmaz; test ekle.

### P2-3 · Cross-account sync yarışı
- **Kanıt:** `src/db/connectionStore.ts:336` — `startConnection`'ın `testAddress` await'i sırasında başka hesap bağlanırsa geç kalan `stopCurrent()` yeni bağlantıyı öldürüyor. Ayrıca yeni hesabın kayıtlı bağlantısı yoksa eski hesabın canlı sync'i açık kalıyor (`src/hooks/useAutoConnection.ts` unmount'ta durdurmuyor).
- **Düzeltme:** Bağlantı başlatmaya generation/token guard ekle (useExcelColumnMapping'deki request-token pattern'i örnek); hesap değişiminde eski sync'i kesin durdur.
- **Kabul:** Hızlı hesap değişiminde yalnızca son hesabın sync'i yaşar.

### P2-4 · Legacy `money_` kategorisi validation'a takılıp yutuluyor
- **Kanıt:** `src/db/validation.ts:60-64` category enum'u dar; `src/hooks/useMoneyStore.ts:59` `.catch(() => {})` → eski kategorili işlemin düzenlemesi sessizce kayboluyor.
- **Düzeltme:** Bilinmeyen kategoriyi reddetme — enum dışı değerleri `other`/`digər`'e normalize ETME (veri değişir); bunun yerine şemada unknown string'e izin ver (passthrough) veya legacy kategorileri enum'a ekle. Hata yutmayı kaldır.
- **Kabul:** Eski kategorili işlem düzenlenebilir; değer değişmez; test ekle.

### P2-5 · IPC/lisans sıkılaştırmaları
- `electron/main.cjs:368-372` `license-select-account`: renderer'ın gönderdiği licenseId ile seçili ID'nin eşleşmesini zorunlu tut (veya seçimi webContents'e bağla).
- `clipboard-write` (`:296`), `scale-status` (`:236`) gibi lisanssız IPC'leri `guardedIPC`'ye al (düşük etki ama tutarlılık).
- `main.cjs:13-35` `redactSecrets`'a renderer'daki (`couchAddress.ts:138`) Basic-header regex'ini taşı — auto-update logger'ı bunun üzerinden geçiyor.

---

## P3 — düşük / fırsat

- `src/components/pos/DeletedInvoicesModal.tsx:73-79` — `ok==0` kontrolü boş; başarısız silme UI'dan kaldırılmasın.
- `src/db/conflictResolver.ts:189` — tek okunamaz conflict rev tüm listeyi patlatıyor; per-rev try/catch.
- `src/db/conflictResolver.ts:19-29` — `docTimestamp` `deletedAt` alanını okumuyor; tombstone dallarında yanlış "eski" kararı.
- `electron/main.cjs:70-74` — renderer `sandbox: true` açılabilir (preload minimal, kırılma riski düşük; yine de build sonrası manuel kontrol).
- `bizneshasap-apk/VERSION.md` 1.3.2–1.3.5 satırları bu branch'te tamamlanmış görünüyor — teyit et, eksikse ISLEM-LOG'dan doldur.

---

## Kapsam dışı (bu listede İŞ YOK — insan/ops görevi)

1. **Canlı CouchDB parola rotasyonu** (admin + uygulama kullanıcısı) — rotasyon önce gelir, dosya temizliği yetmez. Adımlar `docs/KIMI-CODE-FAZ-C-D-DEVIR-ANALIZ.md` §9'da.
2. **APK imza sorunu** — çözüm kodda değil: v1.3.7'nin debug keystore'u kullanıcının makinesinde; yeni APK orada build edilecek (veya keystore güvenli kopyalanacak). Keystore/parola repoya GİRMEZ.
3. Gerçek sertifika ile Windows imzalama + canlı updater testi.
4. Telemetri canlı anahtarları (VITE_POSTHOG_KEY / Sentry DSN) — kullanıcı vermeden ekleme.
5. Main'e merge — tüm P0/P1 düzeltilip kullanıcı onayı alınana kadar YOK.

## Teslim formatı

- Her madde ayrı commit; mesaj `P0-1: ...` önekiyle başlasın.
- Tüm maddeler bitince tek özet yorum/PR açıklaması: madde → commit eşleşmesi, çalıştırılan test/build kanıtı, kalan risk.
- Yapılamayan madde varsa: sebep + önerilen alternatif, sessizce atlama YOK.
