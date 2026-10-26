# Uygulama ve doğrulama raporu — 27 Ekim 2026

## Sonuç

Kaynak değişiklikleri `fix/backup-startup-20261027` dalına gönderildi. Baz: `faz-c-d/altyapi-hazirlik` / `08dd3dd` (398 testli geliştirme dalı). `main` ile birleştirilmedi; GitHub Release yayımlanmadı; canlı sunucuya müdahale edilmedi.

**Listedeki her şey bitmedi.** Aşağıda doğrulanan kapsam ve gerçek engeller ayrı belirtilmiştir. Tüm A–H maddelerinin tek tek durumu `YAPILACAKLAR.md` dosyasının ikinci etap bölümündedir.

## Uygulanan kaynak değişiklikleri

- Büyük `.bhbak` dosyalarında gzip backpressure kilidi ve dosya başlık/uzunluk denetimleri.
- Atiyaclik sekmesi: varsayılan seçili 10 kapsam; zorunlu şifreli export; import önizlemesi/seçim/onay; hesap/mağaza uyumu; belge hataları ve kapsam bazlı kısmi başarı. Geri yüklemede sync duraklatılır, kullanıcı sonuçları gördükten sonra yeniden açar.
- Satış geçmişi, fatura satırlarından stok hareketi, borç/tahsilat ve kassa Excel çıktıları; tarih/müşteri filtresi ve sabit Türkmençe kolonlar.
- 30 günlük yedek hatırlatması; otomatik yedek yok. Sağlık ekranı: sync/pending mirror/son yedek/lisans günü/depolama ve veri boyutu tahmini.
- Mobil güncelleme bildirimi: PC ile aynı GitHub kaynağındaki APK dosya sürümü karşılaştırılır. Windows sürüm etiketi APK sürümü sayılmaz; sessiz indirme/kurulum yok.
- Mobil yedek/DB/rapor anahtarı: doğrulanmış root signature ile PC uyumlu türetme; hesap değişiminde DB key cache ayrımı. Yeni cihaz kimliğinde Device.getId; mevcut UUID lisansı bozulmaz.
- PC admin kimliği: main-process safeStorage kasası, geri okuma/doğrulama sonrası plaintext kaynağı silme. Otomatik CouchDB DB oluşturma korundu.
- Lazy modüller, ExcelJS'nin gerektiğinde yüklenmesi ve vendor ayrımı. Büyük chunk uyarısı hâlâ açık; Windows açılış hızı ölçülmedi.
- Android kaynak adayı 1.4.2 / versionCode 32; mevcut JKS'yi kullanan dış/env imzalama yapılandırması. Yeni release anahtarı üretilmedi.

## Doğrulama

| Kontrol | Sonuç |
|---|---|
| `npx vitest run` | **35 dosya, 433/433 test geçti.** Bazdaki 398 teste göre 35 ek test. |
| `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=$(command -v chromium) npm run test:e2e` | **30/30 geçti.** Mevcut 27 senaryo + yedek import/onay/hesap kontrolü, sağlık paneli ve gerçek yeni Excel dosyası kontrolü. |
| `npm run build` | **TypeScript + Vite başarılı.** İlk giriş chunk'ı 786.55 kB, ExcelJS 940.16 kB (minified); >500 kB uyarısı sürer. |
| `npx cap sync android` | **Başarılı**, 8 native plugin. |
| `node --check electron/main.cjs` ve `electron/admin-vault.cjs` | **Başarılı.** |
| `git diff --check` | **Başarılı.** |
| Android Gradle `assembleDebug` | **Başarılı.** JDK 17, Gradle 8.2.1, Android SDK 34/build-tools 34.0.0. İlk tam derleme 297 görev. |
| Son cap sync sonrası `:app:assembleDebug --offline` | **Başarılı**; son frontend yeniden paketlendi. |
| APK `aapt dump badging` | `com.bizneshasap.pos`, **versionName 1.4.2, versionCode 32**. |
| APK içi frontend byte karşılaştırması | `dist` içindeki **54 dosyanın tamamı birebir**, fark yok. |
| Parolasız `:app:assembleRelease --offline` | **Beklenen güvenli red:** `Release signing is required`. İmzasız release sessiz üretilmiyor. Bu başarılı release testi değildir. |
| GitHub kaynak geri okuma | `babca10b` üzerindeki 34 kod/test/yapılandırma dosyası yerelle byte düzeyinde eşleşti. |

Debug APK SHA-256: `bb525ac9f099e6df81d8160583dbe753559c6f3aa28b2be3dda5c3d238149626`.

Bu dosya yalnız derleme doğrulaması içindir; release JKS ile imzalanmadı, dağıtılmadı ve mevcut release APK üzerine kurulum için önerilmez. Son bilinen imzalı dağıtım APK'sı v1.4.0 olarak kalır. Fiziksel telefon veya Windows lisans DLL testi yapılmadı.

İlk ek Excel E2E senaryosu, satış sonrası fiş penceresi açıkken Ayarlar'a tıkladığı için takıldı; test, kullanıcının yaptığı gibi fişi kapatacak şekilde düzeltildi. Son tam 30 senaryo geçti. İlk Android denemesinde Windows'a özel properties yolunun Linux'ta URI sayılması düzeltildi; son tam ve artımlı Android derlemeleri başarılıdır.

## Önemli sınırlar

- Yedek, atomik disk imajı değildir. Allowlist dışındaki lisans/cihaz/credential/journal belgeleri aktarılmaz. Seçilen kayıtlar birleştirilir; diğer kayıtlar silinmez; finansal yan etkiler yeniden uygulanmaz. İlişkili kayıt kapsamları beraber seçilmelidir.
- B2'nin stok çıktısı fatura satırlarını/iptallerini gösterir; manuel stok değişiklikleri, geçmiş ikinci birim katsayısı ve bileşen tüketiminden tam stok ledger'ı uydurmaz. Borç çıktısı tarih sonu hesap bakiyesi değil, güncel kalan borç + seçili tarih kayıtlarıdır. Para birimleri karıştırılmaz.
- Sağlık ekranındaki DB boyutu JSON tahminidir; SQLite/IndexedDB fiziksel boyutu değildir. Depolama tahmini platform desteklemiyorsa bilinmiyor gösterilir.
- Eski UUID ile bağlanmış lisanslar mevcut kurulumda korunur. O kurulum kaldırılırsa bir defalık rebind hâlâ gerekebilir. Android_ID temelli yeni anchor'ın gerçek cihazda sil-kur kabulü bekliyor.
- E2 tam credential vault değildir: server-admin tamamlandı, diğer bağlantı kimlikleri/Android Keystore bekliyor. safeStorage testleri taklit sağlayıcıyla yapıldı; gerçek DPAPI kabulü yapılmadı.

## Devam etmek için gerekenler

1. **İmzalı APK:** mevcut JKS'nin alias'ı, store parolası ve key parolası. Bunlar normal sohbet veya Git'e yazılmamalı. Release build dış properties/env ile mevcut anahtarı kullanır: `BIZNES_ANDROID_SIGNING_PROPERTIES` veya `BIZNES_ANDROID_KEYSTORE`, `BIZNES_ANDROID_STORE_PASSWORD`, `BIZNES_ANDROID_KEY_ALIAS`, `BIZNES_ANDROID_KEY_PASSWORD`. Varsayılan yerel properties `android/app/release.properties` (ignore edilir); Windows eski konumu da korunur.
2. **D2/G4:** kantar marka/model/protokolü ve fiziksel Windows/telefon/yazıcı test ortamı. Önce yedek alınarak Documents, lisans, sync, kamera, BT/yazıcı ve updater test edilmeli.
3. **D4:** güvenli tek kullanımlık QR eşleştirmeyi doğrulayan uç nokta/anahtar teslim protokolü. Parola QR içine konulmamalı.
4. **D5:** kampanya kimliği ve satış anındaki maliyet/indirim snapshot'ı veri sözleşmesi. Eski satışlar güncel promosyonla geriye dönük ilişkilendirilmemeli.
5. **E1/E3:** ortak kabul otoritesi ve offline-finalize politikası. Önce iki bağımsız cihaz/DB ile aynı taslak yarışı testi, sonra CAS ve idempotent journal; çökme noktalarının her biri test edilmeli. Yalnız yerel lock çift-cihaz çözümü değildir.
6. **F/G2:** Sentry/PostHog hesap anahtarları + açık izin; Windows imzalama sertifikası. Telemetri varsayılan kapalı.
7. **H:** yetkili uzak sunucu erişimi; sızan eski parolayı kontrollü rotasyon, replikator hedef kimlikleri ve DB `_security` üyeliğini koordineli güncelleme.
8. **G3:** test ve sürüm onayından sonra main merge/release; bu çalışma o onayın yerine geçmez.

## Kod commit'leri

- `d93d189` — büyük yedek gzip düzeltmesi (ilk etap).
- `1ad7dcf` — lazy modüller/Excel yükleme ve ilk kaynak adayı (ilk etap).
- `c5fee31` — seçimli yedek ve mobil lisans anahtarı güvenliği.
- `f5856c1` — Atiyaclik/sağlık/hatırlatma/Excel/güncelleme arayüzü.
- `bee64d2` — doğrulamalı safeStorage admin kasası.
- `babca10b` — Android 1.4.2 ve dış imzalama yapılandırması.
