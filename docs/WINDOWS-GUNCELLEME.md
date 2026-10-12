# Windows güncelleme ve release akışı

## Kapsam ve durum

D2 kaynak uygulaması `electron/auto-update.cjs` içindedir. Android APK
güncellemesi değildir; PC ve APK sürümleri birbirinden bağımsız kalır.
Kaynak/test doğrulaması, gerçek imzalı Windows paketinin ve canlı güncellemenin
doğrulanması anlamına gelmez. Sertifika ile Windows build ve iki farklı PC
sürümü arasında kurulum testi henüz yapılmadı.

## Kullanıcı akışı

- Yalnızca paketlenmiş, imzalı yapılandırma ile hazırlanmış Windows kurulumu
  güncelleme kontrolü başlatır. Geliştirme, imzasız ve portable çalıştırmalarda
  güncelleme kapalıdır.
- İlk kontrol açılıştan 10 saniye sonra, sonraki kontroller 5 dakikada bir yapılır.
  Çevrimdışı olma veya henüz release bulunmaması satış ekranını engellemez.
- Yeni sürüm için önce indirme onayı istenir. Varsayılan seçim “Daha sonra”dır.
  Reddedilen sürüm aynı oturumda tekrar sorulmaz.
- İndirme ve doğrulama bittikten sonra ayrı bir yeniden başlatma/kurulum onayı
  istenir. Açık işlemlerin kaydedilmesi gerektiği belirtilir.
- Kurulum ertelenirse normal çıkışta otomatik kurulum yapılmaz. Bu oturumda
  ayrıca bir “şimdi kur” düğmesi yoktur; sonraki açılışta güncelleme yeniden
  teklif edilir ve indirme onayı sonrası önbellekteki paket kullanılabilir.
- İndirme veya doğrulama hatası kurulumu başlatmaz; mevcut sürümle çalışılır.
  Ön sürüm, sürüm düşürme ve web installer kapalıdır.

Main process'in yerel diyalogları Türkçedir. Renderer'a güncelleme başlatabilen
yeni bir IPC yetkisi verilmez.

## İmza ve paket güvenliği

`package.json` içindeki `desktopUpdatesEnabled` paket metaverisi normal
build'de `false` olur. Sertifika/parola zorunluluğu ve `forceCodeSigning`
kullanan `electron-builder.signing.cjs` bunu `true` yapar.

`app-update.yml` içinde beklenen GitHub deposu ve boş olmayan `publisherName`
zorunludur. NSIS güncelleme imza doğrulaması
`win.verifyUpdateCodeSignature: true` ile korunur; doğrulama kapatılmaz.
Bu kontroller, gerçek sertifika veya imza testi yerine geçmez.

Runtime bağımlılıklarını dışlayan eski `!node_modules/**/*` build filtresi
kaldırıldı. Electron Builder üretim bağımlılıklarını paketler; bunun paket
boyutuna etkisi olabilir. `check-desktop-update-package.cjs` gerçek paket
arşivinde updater'ın giriş dosyasını, gerekli bağımlılık manifestlerini,
güncelleme iznini, feed sürümünü ve installer SHA-512 değerlerini kontrol eder.
Windows workflow'u ayrıca EXE Authenticode imzasını ve zaman damgasını doğrular.

## GitHub sağlayıcısı

Sağlayıcı `pespaloglan-droid/bizneshasapdev` deposundaki kararlı GitHub
release'lerini kullanır. İstemciye `GH_TOKEN` veya başka bir yayınlama sırrı
gömülmez. Depo public kalmalıdır; private depoya geçilecekse kullanıcı cihazına
token koymak yerine ayrı bir erişilebilir dağıtım sağlayıcısı tasarlanmalıdır.

Normal `electron:build`, `electron:build:signed`, `electron:dir` ve
`electron:deploy` komutları `--publish never` kullanır. CI ve manuel imzalı
paketleme workflow'ları release yayınlamaz. Yalnızca açıkça seçilen
`electron:release` komutu draft yayına yükleme yapar.

## Kontrollü yayınlama

1. Tüm kaynak düzeltmeleri ve dağıtım kontrolleri bittikten sonra yeni PC
   sürümünü `package.json` içinde belirleyin. Mevcut PC kaynak sürümü
   `1.150.0`dır; Android `1.3.8` ile eşitlenmez.
2. İlgili commit için `vX.Y.Z` tag'ini oluşturup GitHub'a gönderin.
   Tag, checkout edilen `package.json` sürümüyle tam eşleşmelidir.
3. `WINDOWS-IMZALAMA.md` gerekliliklerini karşılayan
   `CERT_PFX_BASE64` ve `CERT_PASSWORD` secrets değerlerini hazırlayın.
   HSM/cloud gerektiren sertifikalar mevcut PFX yoluyla kendiliğinden çalışmaz.
4. `Windows doğrulanmış release` workflow'unu mevcut tag ile manuel başlatın.
   GitHub Actions'ın `GITHUB_TOKEN` değeri yalnızca yayınlama işinde kullanılır;
   workflow `contents: write` iznine ihtiyaç duyar.
5. Repo/tag/sürüm ve mevcut release kontrolünden sonra native lisans modülü,
   birim testleri ve renderer derlenir. Vitest 5 gerekliliği nedeniyle
   workflow'lar Node 24 kullanır.
6. Yeni draft release açılır; imzalı installer, portable ve update metadata
   bu taslağa yüklenir. Mevcut release değiştirilmez.
7. İmza/zaman damgası, ASAR runtime ve `latest.yml` checksum doğrulamaları
   geçtikten sonra taslak yayınlanır. Başarısızlıkta yalnızca bu işin oluşturduğu
   ve hâlâ draft olan release temizlenir; yayınlanmış release silinmez.
8. Geçici PFX başarı veya hata durumunda silinir. Workflow artifact'i yalnızca
   EXE, blockmap ve `latest.yml` çıktılarıdır.

Güncelleyici içermeyen eski PC sürümü ilk yeni imzalı installer ile **manuel**
güncellenmelidir. Otomatik güncelleme testi için updater içeren eski sürümden
daha yüksek sürümlü, aynı güvenilir imza sahibiyle imzalanmış yeni sürüm gerekir.
Kurulu Windows ortamında indir/onay/ertele/yeniden başlat, çevrimdışı çalışma
ve imza hatası senaryoları doğrulanmadan canlı dağıtım hazır kabul edilmez.

Bu çalışma sırasında workflow çalıştırılmadı; release, APK veya push yapılmadı.
