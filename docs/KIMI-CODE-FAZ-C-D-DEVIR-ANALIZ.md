# BİZNES HASAP — Kimi Code için Faz C / D devir ve bağımsız analiz talimatı

> Güncel düzeltme sonucu: [KIMI-DUZELTME-SONUC-FAZ-CD.md](KIMI-DUZELTME-SONUC-FAZ-CD.md). Aşağıdaki APK/kaynak bilgileri önceki v1.3.8 snapshot'ını anlatır; yeni düzeltmeler APK içine girmiş sayılmaz.

**Hazırlanma tarihi:** 2026-10-12  
**Amaç:** mevcut kaynak çalışmasını bağımsız incelemek, güvenlik/veri bütünlüğü risklerini bulmak ve sonraki işleri doğru sıraya koymak. Bu belge yeni özelliklerin her platformda üretime hazır olduğu iddiası değildir.

## 1. Kimi Code’a görev

Bu belgeyi ve aşağıdaki GitHub branch'ini okuyarak bağımsız kod analizi yap.
Önce bulguları ve kanıtlarını raporla; canlı sunucuda parola değiştirme, veri silme,
main'e merge, release yayınlama veya uygulama kaldırma işlemini ayrıca insan onayı olmadan yapma.
Bu belgedeki başarı ifadelerini kaynak kodu ve testlerle doğrula; doğru varsayarak geçme.

Beklenen çıktı:
1. P0/P1/P2/P3 öncelikli bulgular: dosya + fonksiyon/satır + yeniden üretim + etki.
2. Her bulgu için en küçük güvenli düzeltme ve doğrulama yöntemi.
3. Özellikle stok, bakiye, fatura, kısmi yazım, tombstone, conflict ve PC/APK köprüsünde veri kaybı analizi.
4. Güvenlik incelemesi: gömülü parolalar, yerel credential saklama, HTTP/HTTPS,
   updater/imzalama, IPC, telemetri ve release secrets.
5. Geçen testlerin kapsamadığı durumlar ve gerçek cihaz/sunucu/Windows için kontrol listesi.
6. Ayrı sonuçlar: kaynak uygulaması, test doğrulaması, dağıtım ve üretim uygunluğu.
7. Özet hüküm: main'e merge için engeller; mevcut APK üzerine güvenli güncelleme için engeller;
   imzalı Windows release için engeller. Kanıt olmadan “hepsi tamam / risksiz” deme.

## 2. GitHub — en önemli bilgi: çalışma MAIN'DE DEĞİL

- **Repository:** https://github.com/pespaloglan-droid/bizneshasapdev
- **Çalışma branch'i:** `faz-c-d/altyapi-hazirlik`
- **İncelenecek branch:** https://github.com/pespaloglan-droid/bizneshasapdev/tree/faz-c-d/altyapi-hazirlik
- **Main → çalışma branch'i karşılaştırması:** https://github.com/pespaloglan-droid/bizneshasapdev/compare/main...faz-c-d/altyapi-hazirlik
- **Bu devir belgesinden önceki son kaynak/dağıtım commit'i:**
  `2699f8180e06051dd265a59db4efbb0ffd7b5b73`
- **Sabit inceleme snapshot'ı:** https://github.com/pespaloglan-droid/bizneshasapdev/tree/2699f8180e06051dd265a59db4efbb0ffd7b5b73
- **Çalışmanın başladığı main commit'i:** `a229c6f507ada4a088839df1d76807d0723c02db`
- **Kaynak snapshot'ının sabit diff'i:** https://github.com/pespaloglan-droid/bizneshasapdev/compare/a229c6f507ada4a088839df1d76807d0723c02db...2699f8180e06051dd265a59db4efbb0ffd7b5b73

**Main'e merge/push yapılmadı.** Push yalnızca yukarıdaki çalışma branch'ine yapıldı.
Doğrulama sırasında uzak HEAD yerel HEAD ile eşleşti ve çalışma ağacı temizdi.
Snapshot: 14 commit; başlangıca göre 92 dosya, 5789 ekleme, 1735 silme.
Bu MD daha sonra branch'e eklenirse HEAD ve dosya sayısı ilerleyebilir;
yukarıdaki commit, kaynak/APK/test durumunu sabitleyen referanstır.

İlk checkout:

```bash
git clone https://github.com/pespaloglan-droid/bizneshasapdev.git
cd bizneshasapdev
git fetch origin
git switch --track origin/faz-c-d/altyapi-hazirlik
git status --short
git log --oneline -15
```

İncelemeyi birebir sabitlemek istersen ayrı worktree kullan:

```bash
git worktree add ../bizneshasap-review 2699f8180e06051dd265a59db4efbb0ffd7b5b73
```

Main'i çalışma branch'i sanma; eski main kaynaklarından Faz C/D eksik diye sonuç çıkarma.

## 3. Proje ve korunacak sözleşmeler

Biznes Hasap, offline mağaza/POS ve ön muhasebe uygulamasıdır.
React + TypeScript + Vite renderer; Electron PC; Capacitor Android;
PouchDB yerel veri ve CouchDB replikasyonu; PC/APK ortak veri için köprü belgeleri kullanır.

- PC kaynak sürümü: `package.json` → **1.150.0**.
- Android sürümü: `android/app/build.gradle` → **1.3.8 / versionCode 25**.
- Bu sürümler bilinçli olarak ayrıdır; kullanıcı kararı olmadan birleştirme.
- Paket: `com.bizneshasap.pos`; compile/target SDK 34.
- UI: TR/TM/EN/RU; `LanguageContext`, `useT()` ve sözlük/interpolasyon korunur.
- Excel export kolon başlıkları canonical **Türkmençe** kalır. UI diline çevirme.
- Barkod ve SKU metindir; `00001` gibi baştaki sıfırlar kaybolmamalı.
- DB biçimini, finansal enum'ları, eski kayıt uyumluluğunu ve bilinmeyen alanları koru.
- PC `urun:` / `kagent:` / `fatura:` ve mobil `product_` / `customer_` / `invoice_`
  belgeleri arasındaki köprü davranışını incele.
- Uygulama/mobile DB koduna Node `Buffer` bağımlılığı getirme.
- `graphify/` ve `graphify-out/` bu çalışmada değiştirilmedi; ilgisiz değişiklik yapma.
- PosWorkspace sorunu “40 prop drilling” değildi: root interface 9 prop içerir.
  Zustand eklenmedi; mevcut store/context yaklaşımı korunmuştur.
- Yeni test gerektiğinde önce kapsamı belirt; D6 Playwright dosyaları kullanıcının açık talimatıyla eklendi.
- Küçük, doğrulanabilir ve Türkçe açıklamalı commit'ler tercih edilir.

## 4. Önce okunacak dosyalar

1. `FAZ-D-DEVIR.md` — orijinal görev/kurallar; eski durum açıklamaları tarihsel olabilir.
2. `docs/FAZ-C-D-ILERLEME.md` — en güncel çalışma ve doğrulama sınırları.
3. `docs/VERI-DOGRULAMA.md` — Zod/merge/batch kapsamı.
4. `docs/TELEMETRI-VE-SYNC.md` — izinler, sync sınırları, ilk kurulum.
5. `docs/WINDOWS-IMZALAMA.md` ve `docs/WINDOWS-GUNCELLEME.md`.
6. `bizneshasap-apk/VERSION.md` ve `bizneshasap-apk/ISLEM-LOG.md`.
7. `package.json`, `package-lock.json`, `.github/workflows/`, `playwright.config.ts`.

Eski belgelerde “henüz APK/push yapılmadı” gibi tarihsel notlar kalabilir.
Bunları güncel VERSION/ilerleme/commit/CI kanıtıyla karşılaştır; çelişkileri raporla.

## 5. Faz C — yapılan kaynak değişiklikleri

### C1 — ortak stilli Excel export

- Faktura ve hasaplama export'u ortak ExcelJS motoruna taşındı.
- `src/utils/documentExports.ts`, `excelWriter.ts`, `excelStyle.ts`, `styledExports.ts`.
- Numeric kolonlar numeric Excel hücresi; SKU/barkod text.
- Kesirli miktar formatı korunur; genel indirim vb. sebeple satır toplamlarından
  farklı olabilen fatura genel toplamı, çağıranın verdiği gerçek toplamdan alınır.
- Stil, A4/print, frozen header, filtre ve gizli `_meta` sayfası korunur.
- Formula injection için metin kaçışı korunur; formüller çalıştırılmaz.

### C2 — ExcelJS import okuyucusu

- `src/utils/excelIO.ts`: tarih, rich text, hyperlink metni ve mevcut cached formula result normalizasyonu.
- 10 MB / 50.000 fiziksel satır limiti; boş ara satırların gerçek satır numarası korunur.
- Okuma hataları dört dilde; ürün/müşteri parse mantığı canonical sözleşmeye bağlı kalır.

### C3 — legacy temizlik

- Kullanılmayan eski export/template yolları kaldırıldı.
- `read-excel-file` ve `write-excel-file` dependency/lockfile'dan kaldırıldı.
- Yedekleme sıkıştırma akışındaki TypedArray uyumluluğu düzeltildi.

### C4 — alias ve manuel kolon eşleme

- `excelColumnMapping.ts`, `useExcelColumnMapping.ts`, `ExcelColumnMappingPanel.tsx`.
- TR/TM/EN/RU import alias'ları; ilk 12 satırda header aday skoru.
- Required/distinct kolonlar, duplicate ve ambiguous eşleşmeler manuel seçim gerektirir.
- Stale dosya-okuma sonucu yanlış dosyaya uygulanmasın diye request token guard.
- Export başlıkları tüm dillerde aynı Türkmençe başlıklardır.

Ek küçük işler: `SETTINGS_KEY` → `src/utils/storageKeys.ts` tek kaynağı;
Android Documents otomatik export dosya adına zaman damgası + rastgele son ek;
1.3.2–1.3.5 VERSION satırları mevcut ISLEM-LOG kanıtından tamamlandı.
PC save diyaloğu değişmedi. Büyük Vite chunk uyarısı hâlâ var; giderildi iddiası yok.

## 6. Faz D — yapılanlar ve sınırlar

### D1 — Windows kod imzalama

- `electron-builder.signing.cjs`: PFX/parola zorunlu, `forceCodeSigning`, SHA256,
  RFC3161 timestamp ve DLL imzalama hazırlığı.
- `.gitignore`: sertifika dosyaları; `.github/workflows/windows-signed.yml`.
- `CERT_PFX_BASE64` ve `CERT_PASSWORD` yalnızca Actions Secrets üzerinden.
- Geçici PFX step içinde `GITHUB_ENV` ile hazırlanır; `always()` cleanup.
- Gerçek OV/EV/HSM/cloud sertifikası sağlanmadı. PFX dışa aktarımı her sağlayıcıda mümkün değildir.
- Gerçek Windows Authenticode/timestamp sonucu yok; SmartScreen'in kesin kalkacağı iddia edilmez.

### D2 — onaylı auto-update / kontrollü release

- `electron/auto-update.cjs`; `electron/main.cjs`; `electron-updater` runtime dependency.
- Paketli, imzalı yapılandırılmış Windows kurulumunda; dev/imzasız/portable kapalı.
- Açılıştan 10 saniye sonra ve 5 dakikada bir kontrol; otomatik indirme kapalı.
- İndirme ve kurulum ayrı onay; normal çıkışta otomatik kurulum yok.
- Downgrade/prerelease/web installer kapalı; beklenen repo/publisher ve imza kontrolü.
- `scripts/prepare-desktop-release.cjs`, `check-desktop-update-package.cjs`;
  `.github/workflows/windows-release.yml`: yeni draft, doğrulama, sonra publish.
- Normal build komutları `--publish never`; bu çalışma GitHub Release/tag yayınlamadı.
- ASAR bağımlılıklarını dışlayan eski filtre kaldırıldı; Linux paketinde updater,
  js-yaml ve auto-update dosyaları görüldü.
- Canlı imzalı Windows güncelleme testi hâlâ bekliyor.

### D3 — Zod doğrulama / güvenli merge ve batch

- `src/db/validation.ts`: Product/Customer/Invoice/Transaction ve uyumlu PC belge şemaları.
- `pouch.ts`: `upsertDoc` / `upsertDocsBatch` yazılacak son belgeyi doğrular.
- Unknown alanlar korunur; sessiz coerce/default/strip yok.
- Top-level + bilinen nested nesnelerde kontrollü merge; array replace.
- ID eşleşmesi; caller revision'a güvenmeme; yalnızca 409 için retry.
- Batch geçerli kayıtları yazabilir, geçersiz kayıtları doğru failed ID ile raporlar;
  audit gerçek yazılan farkı izler. Hata metni hassas değer içermez.
- Tombstone ve eski metadata uyumluluğu; servisler validation hatasını yutmadan iletir.
- Bu bir genel PouchDB middleware değildir: raw `db.put`, restore/replikasyon yolları
  ayrıca incelenmelidir. Eski kayıtlar topluca dönüştürülmedi/silinmedi.
- UI optimistic/fire-and-forget yollarında DB reddi sonrası geri alma tutarlılığını özellikle denetle.

### D4 — POS refactor

`PosWorkspace.tsx` büyük tek dosyası kademeli ayrıldı; son snapshot yaklaşık **1641 satır**.
Root 9 prop ve mevcut davranış korunur; Zustand eklenmedi.

Hook'lar:
- `useCartActions.ts`
- `useCustomerPriceActions.ts`
- `useWorkspaceData.ts`
- `useInvoiceActions.ts`
- `useInvoiceEffects.ts`
- `useDraftActions.ts`
- `useCatalogActions.ts`

Bileşenler: `src/components/pos/ResetCheckoutModal.tsx`, `WorkspaceToast.tsx`.
Kalan toast/reminder mesajları dört dilde, para/tarih formatı ve interpolasyonla üretildi.
F5 satış, F7 özel fiyat, F8 toptan, F10 reset; stok/bakiye/taslak/restore etkilerini
eski davranışla karşılaştır. “Dosya kısaldı” tek başına doğruluk kanıtı değildir.

### D5 — conflict inceleme UI ve veri kaybı guard'ları

- `src/components/ConflictResolverModal.tsx`; hesap bağlantı panelinden erişim.
- Cihaz + hesap/DB bazlı opt-in; varsayılan otomatik LWW.
- UI “mevcut yerel winner / diğer replike revision” der; revision'u hatalı biçimde
  kesin local-device / remote-device kaynağı diye etiketlemez.
- Preview sadece allowlist iş alanları; parola/license/unknown raw içerik gösterilmez.
- Tekli/toplu seçim; stale revision-set kontrolü.
- Seçilen veri başarıyla yazılmadan losing branch silinmez; okunamayan dalda abort.
- Eski LWW'de başarısız copy sonrası dal silme riski düzeltildi.
- Manuel inceleme bekleyen iş conflict'leri varken PC köprüsü aktarımı tutulur.
- Çoklu cihaz / şifreli DB / eşzamanlı yeni revision senaryolarını ayrıca incele.

### D6 — gerçek web E2E + CI

- `@playwright/test`, `playwright.config.ts`, `tests/e2e/harness.html`, `harness.tsx`, `workspace.spec.ts`.
- Gerçek PosWorkspace + domain servisleri + PouchDB/IndexedDB; her test izole hesap.
- Lisans IPC stub yalnızca test fixture'da; üretim index/APK fixture içermez.
- `.github/workflows/e2e.yml`: PR/manual ve çalışma branch'i push'larında test.
- `npm run test:e2e`; Vitest E2E klasörünü kendi unit test discovery'sinden dışlar.
- Bu testler native Windows/Android lisans, donanım, Documents veya gerçek HTTP CouchDB testi değildir.

### D7 — açık izinli ve dar kapsamlı telemetri

- `src/utils/telemetry.ts`, `src/hooks/useTelemetry.ts`, `TelemetrySettingsPanel.tsx`;
  Electron main: `electron/telemetry.cjs`, kontrollü preload/IPC.
- Analytics ve crashes ayrı cihaz izinleri; ikisi de varsayılan kapalı.
- PostHog sadece allowlist özellik seçimi; memory anonymous ID.
- Autocapture, recording, survey, feature flags, default exceptions kapalı;
  before-send otomatik URL/referrer/device/private alanları atar.
- Sentry main exception / renderer gone için sabit genel teknik kod;
  müşteri/fatura/parola/license/stack içeriği/breadcrumb/minidump yok.
- Renderer crash SDK / mobil native crash SDK eklenmedi; kapsamı geniş varsayma.
- Konfigürasyon: `VITE_POSTHOG_KEY`, isteğe bağlı HTTPS `VITE_POSTHOG_HOST`;
  Electron `BIZNES_SENTRY_DSN` veya güvenilir build `package.sentryDsn`.
- Kullanıcıya ait canlı projeler verilmedi, canlı teslimat test edilmedi.
- Consent yarışları/opt-out/late dynamic import/private field sızıntısını denetle.

### D8 — güvenli fakat sınırlı selective sync

- `src/db/syncSelection.ts`, `selectiveSync.ts`, `pouch.ts`, `connectionStore.ts`, bağlantı UI'ı.
- 0/tam, 3 ay, 12 ay seçenekleri; **yalnızca pull** tarih sınırı alır. Push tamdır.
- Sadece tarihli, `completed`, `draftStatus` olmayan native `invoice_` belgelerinin
  eski olanları pull'dan dışlanır.
- Master ürün/müşteri, bakiye/finansal hareket, draft/void, tombstone, PC mirror,
  şifreli, tarihsiz/invalid/unknown belgeler tam taşınır.
- Önceden yerelde duran eski kayıtlar silinmez. PC köprüsü eski faturaları geri
  getirebilir; “DB kesin 3 ay / boyut kesin küçüldü” garantisi yoktur.
- Raporlar henüz alınmayan native geçmiş yüzünden eksik olabilir; UI uyarır.
- PouchDB 9 nested selector hatası nedeniyle flat `$not` + implicit AND yaklaşımı;
  gerçek local adapter replikasyonuyla doğrulandı.
- Gerçek CouchDB HTTP/live selector uyumu hâlâ doğrulanmalıdır.

### D9 — yardımcı altyapı ve ilk kurulum

- `src/utils/errors.ts`: BiznesHasapError, DatabaseError, LicenseError, SyncError, ValidationError.
- `src/utils/performance.ts`: async measure; >1000 ms teknik ad/süre uyarısı;
  mark/measure cleanup; hassas iş ID/değerleri loglanmaz.
- `src/hooks/useCleanup.ts`; `useAutoConnection.ts`: debounce/listener cleanup,
  owned-handler cancel, yanlış eski component'in yeni sync'i iptal etmesini önleme.
- `SYNC_DOCS_CHANGED_EVENT`: settings'te yeni açılan sync'ten workspace refresh.
- `FirstRunWizard.tsx`, `utils/onboarding.ts`, `demoData.ts`.
- Marker yalnızca yeni oluşturulan hesap için; mevcut hesaplara otomatik demo uygulanmaz.
- Boş DB + admin guard, fail-closed eligibility; demo checkbox varsayılan kapalı.
- Açık onayla 2 ürün + sıfır bakiyeli 1 müşteri; finansal belge/fatura yok.
- Stable ID + create-only/revision-less put; existing/edited/deleted veriyi ezmeme,
  partial failure / retry idempotence; başarıdan önce marker silinmez.

## 7. Doğrulama kanıtı — ne geçti, ne geçmedi

**Son kaynak snapshot CI:**
https://github.com/pespaloglan-droid/bizneshasapdev/actions/runs/38299750982

Başarılı:
- 17 dosya / **308 birim testi**.
- **11 / 11 Playwright E2E**; yerelde ve yukarıdaki GitHub CI'da başarılı.
- TypeScript ve `npm run build`.
- `npm run build:mobile` / Capacitor sync.
- Android SDK 34 + Java 17: `gradlew assembleDebug`, BUILD SUCCESSFUL, 2m30s.
- APK aapt metadata, apksigner v1/v2; üretim index'i var, E2E fixture yok.
- `npm run electron:build`: Linux AppImage/snap; ilgili ASAR runtime dosyaları mevcut.
- Tüm GitHub workflow'ları actionlint ile hatasız doğrulandı.
- Remote branch HEAD, APK Git blob SHA ve dosya boyutu yerel dosyayla eşleşti.

11 E2E senaryosu:
1. F7 özel fiyat → F8 toptan → F5 satış; fatura ve stok.
2. Ürün add/edit/delete, leading-zero barkod ve DB kalıcılığı.
3. Müşteri add/edit/delete; general customer koruması.
4. Selective pull; bakiye/draft/void/legacy/master/tombstone.
5. Gerçek conflict revision dalları; stale seçim reddi; private alan gizleme.
6. Varsayılan telemetri kapalı; kendiliğinden PostHog/Sentry isteği yok.
7. Wizard demo varsayılan kapalı; skip finansal kayıt oluşturmaz.
8. Açık onaylı demo; retry idempotent; düzenlenmiş stok ezilmez.
9. Karma batch; geçerli yazım / hatalı reddi; secret hata mesajına sızmaz.
10. Gerçek xlsx roundtrip; TM header, leading-zero IDs, alias belirsizliği.
11. F10 iptal/onay; satış yazmadan checkout reset.

Bulunan ve düzeltilen workflow sorunu: job-env'de `runner.temp` GitHub context
hatası; sertifika yolu step/GITHUB_ENV'e taşındı. İlk push'taki eski Windows
workflow failure kayıtları bu syntax hatasına aittir; son snapshot actionlint temizdir.
Bu düzeltme gerçek sertifikalı Windows job'unun çalıştırıldığı anlamına gelmez.

Bekleyen gerçek ortam doğrulamaları:
- Güvenilir Windows sertifikası + EXE Authenticode/timestamp; native lisans modülü.
- İmzalı iki PC sürümü arasında updater indirme/erteleme/install/hatalı imza/offline.
- Fiziksel Android'de Documents export/import, mevcut kurulum üzerine update,
  barkod kamera/Bluetooth yazıcı ve gerçek mobil lisans.
- Canlı CouchDB HTTP/live selective sync; farklı cihaz conflict, encrypted DB.
- Açık izinli gerçek Sentry/PostHog projelerinde teslimat ve PII network denetimi.

Linux'ta Windows paket denemesi **Wine olmadığı için tamamlanmadı**.
Büyük Vite chunk / dependency annotation / GitHub runner deprecation uyarıları
build başarılarına eşlik etti; uyarıların hiç olmadığı iddia edilmez.

## 8. APK — indirme, bütünlük ve kritik imza uyarısı

- Dosya: `bizneshasap-apk/BiznesHasap-v1.3.8.apk`
- GitHub dosya:
  https://github.com/pespaloglan-droid/bizneshasapdev/blob/faz-c-d/altyapi-hazirlik/bizneshasap-apk/BiznesHasap-v1.3.8.apk
- Doğrudan indirme:
  https://raw.githubusercontent.com/pespaloglan-droid/bizneshasapdev/faz-c-d/altyapi-hazirlik/bizneshasap-apk/BiznesHasap-v1.3.8.apk
- VersionName **1.3.8**, versionCode **25**, package **com.bizneshasap.pos**.
- Boyut: **18.303.789 byte** (~18,3 MB).
- SHA-256: `67ac8d3eb8f44db9bcade2113ef2dc7a994d14c87609024ffa9653c01e5e816f`
- Git blob SHA: `49ce2cfc887d78fb2837810159bb75b0ca0e6067` (SHA-256 ile aynı kavram değildir).
- **Debug/test build**, Android Debug sertifikası; mağaza/release APK'sı değildir.

**KRİTİK:** Yeni ortamın debug imzası, repodaki v1.3.7 APK imzasından farklıdır.
Bu APK, aynı package ID'li eski v1.3.7 üzerine veri korunarak normal güncelleme
olarak kurulamaz. VersionCode artırmak imza uyuşmazlığını çözmez.

Güvenli seçenekler:
- Eski APK'yı imzalayan keystore + alias + ilgili gizli parolalar güvenli biçimde
  sahibinden temin edilip aynı anahtarla yeniden build yapılır. Önce cert digest eşleşmesi doğrulanır.
- Anahtar yoksa önce tam, geri yüklemesi doğrulanmış veri yedeği ve kontrollü
  migration planı hazırlanır. Kullanıcının açık onayı olmadan uninstall/data clear yapılmaz.
- Keystore, parola, PFX veya GitHub token asla bu MD'ye, repo'ya, loga veya chat'e yazılmaz.
- Debug build'i kendi kendine release-signing'e çevirmek eski imzayı geri kazandırmaz.

## 9. COUCHDB PAROLA DEĞİŞİMİ — ayrıntılı güvenlik deviri

### 9.1 Gerçekte ne yapıldı / ne yapılmadı?

**Yapıldı:** `src/db/syncService.ts` legacy `DEFAULT_SYNC_CONFIG.password`
sabit değeri boş string yapıldı. Yeni kaynak bu legacy parolayı otomatik sunmaz.

**YAPILMADI:** canlı CouchDB sunucusunun parolası değiştirilmedi; sunucu kullanıcıları,
admin'ler, `_security`, DB belgeleri, proxy/TLS veya cihaz credential'ları değiştirilmedi.
Bu işler için canlı sunucu erişimi/onayı verilmedi. “Parola kaldırıldı” ile
“sunucu parolası rotate edildi” aynı şey değildir.

Eski parola public Git geçmişinde / eski kaynak veya dağıtımlarda bulunabildiği
sürece **ifşa edilmiş kabul edilmeli**, tekrar kullanılmamalıdır.

### 9.2 Bu MD hazırlanırken ayrıca bulunan açık işler

Parola değerleri ekrana veya bu dosyaya yazılmadan, başlangıç commit'indeki eski
legacy literal ile mevcut izlenen küçük metin dosyaları karşılaştırıldı:

- **`bizneshasap-apk/ISLEM-LOG.md` içinde eski legacy literal ile eşleşen 2 kayıt var.**
  Güncel logdaki bu değerler de redakte edilmeli. Yalnızca syncService temizliği
  tüm repo'nun secret-clean olduğu anlamına gelmez.
- **`Yeni-HesapVeritabani.ps1` içinde boş olmayan sabit `$adminUser` / `$adminPass`
  tanımları görüldü.** Bunların gerçek çalışan credential mı yoksa örnek/default mu
  olduğu canlı sunucuda doğrulanmadı. Gerçekte kullanılan admin parolasıysa ayrıca
  ifşa kabul edilip rotate edilmeli; script güvenli runtime input'a geçirilmelidir.
- Mevcut bağlantı verisi `src/db/connectionStore.ts` üzerinden
  **`bh_couch_conn_<accountId>`** localStorage kaydında local/online URL olarak saklanıyor.
  URL kullanıcı/parola taşıyabiliyor. Görsel maskelenmesi şifreli saklama demek değildir.
- Legacy ayar `bh_sync_config` de eski credential taşıyabilir.
- `capacitor.config.ts` cleartext/mixed content'e izin veriyor; LAN uyumluluğu için
  eski davranış korunmuş. Bu izin internet üzerinden HTTP Basic Auth'ı güvenli yapmaz.
- Bu tarama tüm Git geçmişi, APK/binary, özel deploy dosyaları veya sunucu için
  kapsamlı secret audit değildi. Kimi Code bunları ayrıca denetlemeli.

**Öncelik:** önce uygulama/admin credential envanteri + gerçek sunucuda rotation;
sonra güncel kaynak/log/script cleanup ve credential storage tasarımı.
Dokümandan eski değeri silmek tek başına credential'ı geçersiz kılmaz.

### 9.3 Parola değiştirmeden önce

1. Sunucu sahibi ve kısa bakım penceresini belirle. Pending local satışları,
   stok/bakiyeleri ve başarısız sync kuyruğunu gözden geçir.
2. Server data/config/security ve her cihazın yerel verisi için doğrulanabilir yedek al.
   Finansal veri yedeğini public GitHub'a veya bu MD'ye koyma.
3. Gerçek CouchDB sürümünü, deployment biçimini (Windows service/Docker/Linux),
   node/cluster sayısını ve hangi host'ların aynı sunucuya yöneldiğini teyit et.
4. Uygulama kullanıcısı ile **server admin**'i ayır:
   normal kullanıcı varsayılan `_users` DB'sinde; server admin node config/[admins] tarafında.
   Projede legacy uygulama kullanıcı adı `biznes_app` görünüyor, fakat canlı kullanıcının
   aynı olduğunu varsayma. Uygulamanın server-admin credential ile çalışmaması gerekir.
5. Kullanıcıların `roles`, her mağaza DB'sinin `_security`, offline cihazlar, PC config,
   Android local/online bağlantıları, scheduled sync/backup/provisioning araçları için envanter çıkar.
6. Yönetim erişimini HTTPS üzerinden yap; alternatif local loopback / onaylı güvenli tunnel.
   Public internetten cleartext HTTP üzerinden yeni parola gönderme.
7. Uzun/rastgele/benzersiz yeni parola password manager'da üretilip güvenli saklansın.
   CLI argümanı, URL, shell history, screenshot, repo veya loga gerçek parola konmasın.

### 9.4 Normal uygulama kullanıcısı için rotation

Tercih: yetkili admin'in kendi güvenilir tarayıcısında Fauxton veya kurulumun desteklediği yönetim yöntemi.

- Normal kullanıcı dokümanı: `_users/org.couchdb.user:<KULLANICI_ADI>`.
- Mevcut doküman ve güncel `_rev` okunur; `name`, `type`, `roles` ve gerekli özel alanlar korunur.
- Yeni `password` güvenli biçimde eklenip doküman güncel revision ile güncellenir.
  CouchDB saklamadan önce parolayı hash alanlarına dönüştürür; hash'i elle üretme.
- `409` varsa yeni revision okunup yeniden değerlendirilir; kör force overwrite yapma.
- Hash alanları veya tüm user doc'u loga/chat'e dökme.
- Kullanıcıyı silip yeniden yaratmak, roller/yetkiler ve erişim boşluğu açısından
  farklı risk taşır; sırf parola değişimi için otomatik bunu yapma.
- Farklı kullanıcıya geçilecekse tüm ilgili DB `_security` kayıtları kontrollü planla
  güncellenir; yeni kullanıcıya `_admin` vererek işi kolaylaştırma.

Resmi CouchDB referansı: kullanıcı/password-changing davranışı ve admin/normal
kullanıcı ayrımı için https://docs.couchdb.org/en/stable/intro/security.html
özellikle `#password-changing`, `#authentication-database` ve `#authorization` bölümleri.
Canlı kurulumun CouchDB sürümüne uygun API ayrıca kontrol edilmeli.

### 9.5 Server admin parolası da ifşa ise

- Admin değişimi normal `_users` dokümanı güncellemesinden farklıdır.
- Yetkili yönetici node configuration admin ayarları veya deployment'ın desteklediği
  secret/config mekanizmasını kullanır; CouchDB sürümü ve cluster topolojisi doğrulanır.
- Cluster varsa ilgili node'lar ve Docker/env/secret/provisioning yeniden başlatma
  kaynağı kontrol edilir; eski environment ayarı restart'ta geri dönmemeli.
- Yeni admin erişimi test edilmeden eldeki tek yönetici erişimini kaybetme.
- Uygulamalara yeni admin credential dağıtma; uygulama normal/least-privilege kullanıcı kullanır.
- Admin password rotation DB şifreleme anahtarı rotation'ı değildir.
  CryptoPouch/license key'lerini yanlışlıkla değiştirme.

### 9.6 PC ve APK istemcilerini yeni parolaya geçirme

1. Her hesap için sync'i durdur. Bekleyen yerel kayıtları silme.
2. Hesap bağlantı panelindeki **local ve online** adreslerini yeni credential ile güvenli güncelle.
   İkisi aynı kullanıcıya/sunucuya gidiyorsa ikisi de etkilenir.
3. Parola URL'de encode edilmesi gereken karakter içeriyorsa percent-encode uygulanır;
   uygulamadaki `parseCouchDbAddress` decode eder ve Basic Auth header'ına taşır.
   Örnek adresleri gerçek parola ile dokümana/screenshot'a yazma.
4. `bh_couch_conn_<accountId>` / legacy `bh_sync_config` ve PC/provisioning config'lerinde
   eski credential kalmadığını güvenli denetle; tüm localStorage/IndexedDB'yi toptan temizleme.
5. Önce tek test cihazında bağlantıyı sına; sonra diğer hesap/cihazlar.
6. Windows / Android farklı kurulumu veya eski sürümü credential saklamada başka yol
   kullanabilir; yalnızca bu branch'in UI'ını kontrol etmek bütün cihazların geçişi değildir.
7. Yeni bağlantıda “sadece sunucudakini al” seçeneğini otomatik uygulama; local-only veri
   varsa bu yol veri kaybına sebep olabilir. Rotation amacıyla merge/restore/reset gerekmez.
8. Yeni parola tekrar kaynak koduna, sabit default'a veya yeni APK içine gömülmez.

### 9.7 Rotation kabul testleri

- Yeni credential ile **gerçek korunan mağaza DB'sine** yetkili read ve izinli write çalışır.
  Yalnızca root veya `/_up` 200 dönmesi parola doğrulaması değildir; bunlar public olabilir.
- Eski credential ile yeniden kurulan Basic Auth isteği / yeni oturum başarısız olur.
  Mevcut cookie/session sürelerini ayrıca denetle; anında tüm session'ların iptalini varsayma.
- Unauthorized ve forbidden ayrımı yapılır; doğru parola fakat yanlış DB yetkisi olabilir.
- Her mağaza DB'sinde ilgili kullanıcı/role read-write, ilgisiz mağazada erişim reddi doğrulanır.
- Ürün güncelleme + küçük test satış/iptal ile stok/bakiye/fatura tutarlılığı kontrol edilir;
  test finansal verisi gerçek kayıtlara karıştırılmaz.
- PC ↔ APK iki yönlü sync, offline cihazın sonra bağlanması, retry ve conflict akışı kontrol edilir.
- Sync “yeşil” olsa bile push/pull doc sayıları ve bekleyen local kayıtlar kontrol edilir.
- Yeni/eski parolalar network/error/telemetry/debug loglarında görünmez.
- Backup/cron/provisioner credential'ları güncel; servis restart'ı yeni ayarı korur.
- Başarısızlıkta ifşa edilmiş eski parolaya kalıcı geri dönüş yerine yeni güvenli credential ile
  recovery planı kullanılır; veri yedeklerine dokunulmaz.

### 9.8 Public repo ve eski dağıtım temizliği

- `ISLEM-LOG.md` içindeki 2 eşleşme gerçek değer yeniden yazılmadan redakte edilmeli.
- PS1 sabit admin credential'ları güvenli runtime input/secret store'a geçirilmeli.
- `git grep`, history-aware secret scanner ve eski APK/EXE/zip/CI artifact taraması yapılmalı;
  bulgular secret değerlerini içermeyen dosya/commit referanslarıyla raporlanmalı.
- Rotation önce gelir. Public clone/fork/cache/eski indirme kopyaları geri alınamaz.
- Git history rewrite/force push/tag/release/artifact silme ayrı, açık kullanıcı onayı gerektirir;
  hiçbir history rewrite bu çalışmada yapılmadı. Repo sahibi GitHub secret-removal akışını planlayabilir.
- HTTPS reverse proxy, daraltılmış CORS/firewall, ayrı uygulama kullanıcıları, DB `_security`,
  audit ve credential-storage tasarımı ayrı güvenlik kontrolüdür; rotasyonun kendisi bunları çözmez.
- Mobil için güvenli credential storage, Electron için OS-backed secret store ihtiyacı değerlendirilir;
  masking/base64 ve localStorage “şifreleme” olarak kabul edilmez.

## 10. Bağımsız inceleme için özellikle aranacak edge case'ler

- Invoice yazımı başarılı ama stok/bakiye yan etkisi başarısız; duplicate/retry satış.
- Batch partial success ve optimistic UI rollback; aynı ID'ye eşzamanlı update.
- Legacy, unknown alan, negatif finansal değer, sparse PC patch ve tombstone/recreate.
- Çoklu conflict dalı + unreadable leaf + stale UI + encrypted raw doc + bridge sıralaması.
- Hesap değişimi / component unmount sırasında sync timer/owned handler ve yeni connection.
- Selective sync cutoff takvim ayları, tarihsiz/bozuk tarihler, draft/void, PC mirror ve rapor eksikliği.
- Demo retry / yarım seed / tombstone / edited stock; mevcut hesapta yanlış eligibility.
- Excel numeric/text ayırımı, `= + - @` formül prefix'leri, büyük dosya/satır limitleri,
  duplicate header, manuel mapping, cached formula, birim/expiryDate ve invoice exact total.
- Consent opt-out/import race; Sentry/PostHog default SDK alanları/endpoint/IPC validation.
- Updater publisher/repo/manifest/checksum, downgrade, imzasız artifact ve release cleanup.
- Credentials in current text, Git history, artifacts, localStorage, Basic Auth HTTP ve logs.

## 11. Yeniden doğrulama komutları

Node **24** önerilir; Vitest 5 ve workflow ortamıyla eşleşir.

```bash
npm ci --ignore-scripts
npm test -- --run
npm run build
npx playwright install chromium
npm run test:e2e
```

Linux'ta mevcut sistem Chromium kullanılacaksa:

```bash
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/tam/yol/chromium npm run test:e2e
```

`--ignore-scripts` test/renderer yolu içindir; gerçek Electron/native lisans build'inde
uygun postinstall/native build adımları ayrıca gerekir. Windows için imzalama belgesini izle.

Android (Java 17, SDK 34 ve onaylı SDK lisansı):

```bash
npm run build:mobile
cd android
./gradlew assembleDebug
```

Windows Gradle komutu `gradlew.bat assembleDebug` olabilir.
`android/local.properties` makineye özel SDK yoludur; repoya ekleme.
Yeni APK üretildiğinde aapt/apksigner, certificate digest, SHA-256 ve gerçek cihaz testleri
tekrar yapılır; aynı isimli eski doğrulanmış APK'yı sessizce overwrite etme.

## 12. Commit haritası

| Commit | İçerik |
|---|---|
| `db848da` | Kesinti sonrası Faz C ve D1–D4 kaynak kurtarma |
| `b47c971` | D4 stok/müşteri bakiyesi effects |
| `4b57f27` | D4 taslak ve fatura yaşam döngüsü |
| `fb911fa` | D4 ürün/müşteri/import actions |
| `8da9911` | D1 imzalı build config'in kurtarma commitine eklenmesi |
| `e4dadb2` | D5 conflict UI ve write-failure veri koruması |
| `f6eef49` | D6 gerçek POS Playwright testleri |
| `6ab567a` | D7 açık izinli anonim telemetri |
| `e09f81f` | D8 güvenli selective pull |
| `88493b2` | D9 errors/performance/cleanup/wizard |
| `70cb730` | D4 reset/toast ayrımı ve dört dil mesajlar |
| `c6ba258` | Excel/reset E2E, güvenli export adı, legacy parola kaldırma, belgeler |
| `556760e` | v1.3.8 APK, VERSION/log, imza uyuşmazlığı uyarısı |
| `2699f81` | Workflow context düzeltmesi ve branch push E2E tetikleme |

## 13. Sonraki işlerin önerilen sırası

1. Bu branch/snapshot'ı bağımsız incele; P0/P1 güvenlik/veri kaybı risklerini raporla.
2. **CouchDB uygulama ve gerekiyorsa admin parolasını canlı ortamda rotate et;
   log/script açık değerlerini temizle; istemcileri doğrula.** Bu işler henüz yapılmadı.
3. Eski Android signing key durumunu çöz; mevcut veri korunarak upgrade planını test et.
4. Finansal yazım/conflict/bridge/selective sync edge case'lerini gerçek CouchDB + iki cihazda doğrula.
5. Fiziksel Android Documents/import/hardware/license testleri.
6. Windows gerçek sertifika/native build/installer/timestamp + canlı updater testi.
7. Telemetri canlı izinli/izinsiz network ve PII denetimi.
8. Gerekli düzeltmeler, testler, merge önerisi; **insan onayı sonrası** main'e merge ve üretim dağıtımı.

**Son hatırlatma:** kaynak kodu ve test APK push edildi, main değişmedi.
Canlı CouchDB parolası değiştirilmedi; eski APK ile signing key eşleşmiyor.
Birim/E2E/CI başarısı tek başına bu iki operasyonel engeli veya üretim uygunluğunu çözmez.
