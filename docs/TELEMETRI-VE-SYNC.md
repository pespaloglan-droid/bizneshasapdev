# Telemetri ve seçici eşitleme

## Telemetri

Ayarlar → genel telemetri seçenekleri cihaz bazlıdır ve iki izin de varsayılan kapalıdır.
Çalışan bir proje yapılandırılmadan etkin servis varmış gibi gösterilmez.

- PostHog: build ortamında `VITE_POSTHOG_KEY`; isteğe bağlı HTTPS
  `VITE_POSTHOG_HOST` (varsayılan EU). Değişiklik yeni web/APK build gerektirir.
- Sentry: Electron main için `BIZNES_SENTRY_DSN` veya güvenilir build'de
  `package.json` içindeki `sentryDsn`. Mobil native crash SDK'sı kurulmadı.
- Analytics event: `bh.feature_selected`, yalnızca allowlist `feature` ve
  bellekte anonim `distinct_id`. Autocapture/recording/survey/feature flags kapalı.
- Crash event: sabit genel kodlar; hata içeriği, stack değerleri, müşteri,
  fatura, parola, license, URL, breadcrumb ve minidump dahil edilmez.
- İzin geri alınması client'ı durdurur; daha önce uzak servise ulaşan olayları
  geriye dönük silmez. Veri saklama/erişim politikası proje sahibinin sorumluluğudur.

## Seçici sync

Bağlantıyı durdurup hesap bağlantı panelinden tam / 3 ay / 12 ay seçilir.
Yalnızca pull sınırlıdır; push hiçbir iş kaydını tarih sebebiyle dışlamaz.
Sınırlama native `invoice_` completed, draftsız ve ISO tarihli faturalar içindir.
Stok, müşteri, bakiyeler, finansal hareketler, taslak/iptal/legacy/tombstone,
PC köprü belgeleri ve şifreli kayıtlar tam taşınır. Eski yerel kayıtlar silinmez.
PC köprüsü eski faturaları geri taşıyabileceğinden kesin tarih veya boyut garantisi yoktur.
Raporlar henüz indirilmeyen native geçmiş yüzünden eksik olabilir; tam sync'e
geçerek geçmiş alınır. Gerçek CouchDB ve farklı cihaz testleri dağıtım öncesi gerekir.

## İlk kurulum ve test

Sihirbaz yalnızca uygulamada yeni oluşturulmuş boş admin hesabında açılır.
Mevcut hesaplara otomatik demo veya yeniden onboarding uygulanmaz.
Demo açık checkbox onayıyla iki ürün ve sıfır bakiyeli bir müşteri ekler;
satış/finansal hareket oluşturmaz. Sabit ID'li create-only yazımlar retry'da ezmez.

`npm run test:e2e`: izole gerçek PouchDB kullanır. Linux sistem Chromium için
`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` kullanılabilir. Test fixture'ındaki
lisans IPC stub'ı gerçek Windows/Android lisans doğrulaması değildir.

## Eski varsayılan bağlantı

Kullanılmayan legacy syncService içindeki sabit parola kaldırıldı. Daha önce
public Git geçmişinde veya dağıtılmış APK'da bulunmuş bir parola bu değişiklikle
geri alınmış olmaz: sunucu sahibi eski parolayı değiştirmelidir. Kayıtlı kullanıcı
bağlantı ayarları değiştirilmez; yeni bağlantıda kullanıcı kendi bilgilerini girer.
