# Faz C / D çalışma kaydı

Başlangıç `main / a229c6f`. PC 1.150.0 ve Android 1.3.8 / versionCode 25 ayrı sürümlerdir.
Bu kayıt kaynak uygulamasını ve doğrulama sınırlarını belirtir; yapılmamış cihaz veya
imzalı Windows dağıtım testlerini tamamlanmış saymaz.

## Kaynak uygulaması

- **C1–C3:** ortak ExcelJS stilli faktura/rapor export'u ve import okuyucu;
  legacy bağımlılıklar kaldırıldı. Sayısal hücreler, kesirli miktarlar, fatura
  genel toplamı, sıfırlı barkod/SKU, dosya/satır limitleri ve formula escape korunur.
- **C4:** TR/TM/EN/RU import alias'ları, başlık tespiti ve manuel kolon eşleme.
  Belirsiz veya yinelenen eşleşme otomatik kabul edilmez. Export başlıkları
  tüm UI dillerinde canonical Türkmençe kalır.
- **D1:** sertifika zorunlu Windows imzalı build ve SHA256 zaman damgalama;
  sertifika/parola git'e girmez. Workflow çıktı imzasını doğrular.
- **D2:** yalnızca paketli ve imzalı Windows uygulamasında updater;
  indirme ve kurulum ayrı kullanıcı onayı ister. Dev/portable otomatik güncellenmez.
- **D3:** Zod son-belge doğrulaması, güvenli kısmi merge, batch kısmi başarı,
  409 tekrar denemesi ve değer sızdırmayan hata kodları. Eski veriler dönüştürülmez.
- **D4:** workspace veri, sepet, fiyat, katalog, taslak ve faktura işlemleri ayrı
  hook'lara; reset modalı ve toast ayrı bileşenlere alındı. Root 9 prop korunur.
  Kalan kullanıcı toast'ları dört dilde interpolasyonla üretilir.
- **D5:** cihaz+hesap bazlı isteğe bağlı manuel conflict inceleme; varsayılan LWW.
  Seçim stale revision kontrolüyle yazılır, başarılı yazım öncesi dal silinmez.
  Bekleyen review varken PC köprüsü aktarımı tutulur; gizli alanlar gösterilmez.
- **D6:** gerçek POS ve PouchDB/IndexedDB kullanan Playwright fixture + CI.
  Test giriş noktası üretim bundle'ına dahil edilmez; lisans stub'ı yalnızca fixture'dadır.
- **D7:** PostHog ve Sentry ayrı, varsayılan kapalı cihaz izinleri.
  Analytics yalnızca allowlist özellik seçimini, Electron hataları sabit teknik
  kodu taşır. Kullanıcı/veri değerleri, URL, breadcrumb veya minidump gönderilmez.
- **D8:** 3/12 aylık seçenek yalnızca tarihli, completed native mobile faturaların
  eski olanlarını pull'dan dışlar. Push ve stok/bakiye/master/taslak/iptal/tombstone
  tam kalır. PC, şifreli ve tanınmayan belgeler güvenlik için tam alınır.
  Önceden indirilmiş yerel tarihçe silinmez; kesin boyut sınırı değildir.
- **D9:** typed error sınıfları, >1000 ms operasyon ölçümü, sahipli sync cleanup,
  yeni hesaplarda ilk-kurulum sihirbazı ve açık onaylı idempotent demo.
  Demo finansal belge oluşturmaz; mevcut veya düzenlenmiş kayıtları ezmez.

## Küçük kalıntılar

Ayar önbellek anahtarı tek kaynağa alındı. Android Documents otomatik export'unda
zaman damgası + rastgele son ek eski dosyayı ezmeyi önler; PC save diyaloğu değişmez.
1.3.2–1.3.5 sürüm tablosu mevcut ISLEM-LOG kanıtından tamamlandı.
Büyük Vite chunk uyarısı hâlâ vardır; modülleri gelişigüzel bölerek davranış
riski yaratılmadı. PostHog izin sonrası dinamik yüklenir.

## Doğrulama sınırları

Birim testleri, TypeScript/web build ve gerçek Chromium E2E sonuçları son dağıtım
kaydıyla birlikte tutulur. E2E: satış/fiyat/stok, ürün/müşteri CRUD, selective pull,
conflict branch/stale guard, izin kapalı telemetri, demo atlama/idempotence,
karma batch doğrulama, Excel roundtrip/alias ve F10 reset.

Aşağıdakiler ayrıca gerçek ortam gerektirir ve kaynak testleriyle doğrulanmış sayılmaz:
- güvenilir Windows sertifikasıyla EXE / Authenticode / timestamp;
- yayımlanmış imzalı release üzerinden canlı updater testi;
- fiziksel Android cihazda Documents yazma, import ve mevcut APK üzerine kurulum;
- gerçek CouchDB HTTP sunucusunda selective live sync;
- kullanıcıya ait Sentry/PostHog projelerinde açık izinli canlı teslimat.

## Son kaynak kontrolü — 2026-10-12

- TypeScript: başarılı; birim testleri 17 dosya / 308 başarılı.
- Playwright: 11 / 11 başarılı (gerçek Chromium + IndexedDB).
- Web build ve `build:mobile` / Capacitor sync: başarılı.
- `npm run electron:build`: Linux AppImage ve snap oluşturuldu; paket ASAR'ında
  electron-updater, js-yaml ve auto-update.cjs bulundu. Bu Windows imza testi değildir.
- Windows `electron-builder --win --dir`: Wine eksikliği nedeniyle tamamlanamadı.
  Güvenilir sertifikalı dağıtım ve canlı updater kontrolü Windows workflow'unda bekliyor.
- Android SDK lisansı kullanıcı onayıyla kabul edildi. Java 17 / Android 34 ile
  assembleDebug başarılı: v1.3.8 / code 25; apksigner v1/v2 doğrulaması başarılı.
  APK repodaki dosyaya kopyalandı; üretim paketinde E2E fixture yok.
  Yeni debug imzası eski v1.3.7 ile eşleşmediğinden yerinde güncelleme için eski
  keystore gerekir. Fiziksel cihaz testi hâlâ yapılmadı.
- İlk remote kontrolde Windows workflow job-env içindeki `runner.temp` context'i
  GitHub doğrulayıcısı tarafından reddedildi. Yol step içinde GITHUB_ENV üzerinden
  hazırlanacak şekilde düzeltildi; tüm workflow'lar actionlint ile hatasız doğrulandı.
  E2E workflow çalışma branch'inin push'larında da çalışacak şekilde tetiklendi.
