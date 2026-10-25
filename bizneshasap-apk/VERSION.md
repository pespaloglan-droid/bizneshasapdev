# SÜRÜM TAKİBİ (mobil APK)

Kural: her kullanıcıya dokunan iyileştirmede yama numarası +1.
Dosya adı: `BiznesHasap-vX.Y.Z.apk` — klasörde saklanır.

| Sürüm | Tarih | İçerik |
|---|---|---|
| 1.1.0 | 2026-09-30 | İlk mobil iskelet: platform ayrımı, alt menü, barkod kamera, Bluetooth yazıcı |
| 1.1.1 | 2026-10-01 | Mobil tasarım v2: dikey fatura barı (kaydırma yok), yüzen + ile hızlı ürün/müşteri ekleme, responsive araç çubukları |
| 1.1.2 | 2026-10-01 | Ayarlar telefonda liste→detay (geri tuşlu); yazıcıda cihaz tarama listesi + deneme fişi + USB/ağ yönlendirmesi; terazi mobil notu; müşteri formu parmak dostu; kassa/targowy/walyuta responsive + yüzen ekle; kassa tutarlarında TMT |
| 1.1.3 | 2026-10-01 | Scroll düzeltmeleri: Kassa, Targowçylar, Müşderi, Ambar, Ulanyjy, Haryt, Walýuta sayfaları tek scroll'a geçti (Hasabatlar referansı); müşteri ekleme bottom-sheet modal (Depder referansı) + sticky butonlar; açılışta seed/mock hesap yok — boş başlar |
| 1.1.4 | 2026-10-01 | Logo kalıcı (yüklerken 512px küçültme + bozuk görsel yedeği); müşteri başlığı hizalı + yinelenen ikon kaldırıldı; Depder "Ulanyjy goş" ikonsuz; menüde logo + aktif bölüm göstergesi; alt nav: Menü yerine Hasabatlar |
| 1.2.0 | 2026-10-01 | Taban walyuta artık değiştirilebilir (TMT ⇄ eklenen her walyuta), onaylı seçim + silme koruması, TMT listeye seed edilir; "Hasabatlar" → "Hasaplama" olarak tutarlı; müşteri başlığı hizalı, arama büyüteçli, telefonda yinelenen ekleme düğmesi kaldırıldı |
| 1.2.1 | 2026-10-01 | Girişte beyaz ekran düzeltmesi: eski/eksik kayıtlar yüklenirken temizleniyor, hata sınırı ile kurtarma ekranı, tanımsız hesap koruması |
| 1.2.2 | 2026-10-01 | Yeni logo (lacivert B + yeşil barlar): launcher ikonları, splash, favicon, giriş/menü varsayılan logosu, wordmark uyumu |
| 1.2.3 | 2026-10-01 | PC lisans sistemi APK'ya taşındı: HMAC anahtar doğrulama (PC anahtarlarıyla uyumlu), cihaz kimliği, deneme çubuğu, Lisans ekranı (önceden boştu) |
| 1.2.4 | 2026-10-01 | PC'deki görsel sıkıştırma algoritması ortak kod yapıldı: ürün fotoğrafları yüklenmeden önce 400px/~150KB JPEG'e küçültülüyor (telefon kamerası 3-5MB görseli PouchDB'yi şişiriyordu) |
| 1.2.5 | 2026-10-01 | **CouchDB/PouchDB veri aktarımı**: Ayarlar → "Bulut eşitleme" paneli. Aynı Wi-Fi (bilgisayar IP) ve internet (alan adı) adresleri sırayla denenir, ilk çalışan otomatik seçilir. PC ile ortak veri için şema köprüsü (urun:/kagent:/fatura: ↔ product_/customer_/invoice_). Lisans belgesi cihaza özel kalır, senkronize edilmez |
| 1.2.6 | 2026-10-01 | Eşitleme düzeltmeleri: senkronizasyon artık uygulama açılışında otomatik başlıyor (anahtarı her oturumda oynatmaya gerek yok); PC'den gelen kayıtlar arayüzde otomatik yenileniyor. PC tarafında lisans yarış durumu giderildi |
| 1.2.7 | 2026-10-01 | **Düzeltme: telefon sunucuya bağlanamıyordu.** Windows ağ profili "Public" olduğu için güvenlik duvarı 5984 portunu engelliyordu → kural tüm profillere açıldı. Adres yazımı esnek: hem `http://192.168.1.8:5984` hem `http://192.168.1.8:5984/biznes_hasap` kabul edilir. Bağlantı hatası artık sebebini söyler (erişilemiyor / şifre hatalı / CouchDB değil) |
| 1.2.8 | 2026-10-01 | **Hesap başına ayrı veritabanı.** Her hesap kendi veritabanına bağlanır (hesabın `databaseName` alanı) — mağazaların verisi karışmaz. Bağlantı sırası: hesabın kayıtlı adresi → aynı Wi-Fi → alan adı (ilk çalışan kullanılır). Panelde "Bağlantıyı sına" her adresi tek tek deneyip sonucunu ayrı gösterir. Veritabanı sunucuda yoksa `Yeni-HesapVeritabani.ps1` ile bilgisayarda açılır (uygulamaya admin yetkisi verilmez) |
| 1.2.9 | 2026-10-01 | **Düzeltme: telefon "sunucu eşleşmedi" diyordu.** v1.2.8'de LAN adresi boş geliyordu — denenecek adres kalmadığı için hiçbir sunucuya bağlanılamıyordu. Adres ve kullanıcı bilgileri artık hazır geliyor; daha önce boş kaydedilmiş ayarlar kendiliğinden onarılır. Eşitleme kapalıyken panelde uyarı görünür |
| 1.3.0 | 2026-10-01 | **CouchDB senkronizasyonu (spec).** PC: `couchdb.config.json` + tam otomatik senkron (domain/uzak sunucu/QR ekranı tamamen kaldırıldı), 5 durumlu rozet, `businessName` → `db_name` (TR sadeleştirme). APK: adres ayrıştırıcı, hesap başına local+online bağlantı, 4 renkli durum ikonu, 3 kademeli test, Türkçe hatalar, otomatik yeniden bağlanma |
| 1.3.1 | 2026-10-01 | **LWW çakışma çözümü** (en güncel `updatedAt` kazanır), **toplu yazma** (100'erlik gruplar — arayüz donmaz), **birleştirme sorusu** (telefonda veri varsa "Birleştir" / "Sadece sunucudakini al") |
| 1.3.2 | 2026-10-01 | Mixed content bağlantı düzeltmesi; bağlantı alanlarının hesap ekranına taşınması ve otomatik aktarım (ISLEM-LOG kaydı) |
| 1.3.3 | 2026-10-04 | Hesap modalı yerleşimi ve tek dil (ISLEM-LOG kaydı) |
| 1.3.4 | 2026-10-05 | Giriş ekranına dil seçici (ISLEM-LOG kaydı) |
| 1.3.5 | 2026-10-05 | Giriş formundaki ikinci dil seçicinin kaldırılması (ISLEM-LOG kaydı) |
| 1.3.6 | 2026-10-09 | **Kritik Excel düzeltmeleri (FAZ A):** APK'da Excel export artık çalışıyor (Documents klasörüne kayıt, hata mesajı gösterimi); export→import veri kaybı giderildi (alış fiyatı, kritik stok, SKT, 2. birim korunuyor; şablon uyumlu); toplu import hata raporlama (satır no + sebep + indirilebilir .xlsx rapor); formula injection koruması + dosya/satır limitleri. **Çeviri düzeltmeleri:** en "Faktura"→"Register", tr Türkmen kalıntıları, tm Türkçe kırması ifadeler, dinamik versiyon (package.json'dan), "Test versiyon" başlığı kaldırıldı |
| 1.3.7 | 2026-10-12 | **Dil sistemi konsolidasyonu (FAZ B):** tüm uygulama 4 dile (tr/tm/en/ru) geçti — ~770 yeni çeviri anahtarı, 60+ dosyadaki `tm?tr` ternary'leri ve hardcoded modüller (hasaplama, lisans, ayarlar, fiş/çek) sözlüğe taşındı. `useT()` hook'u + LanguageContext, tek dil kaynağı (localStorage↔PouchDB senkron), ilk açılışta otomatik dil algılama (`navigator.language`), dile göre tarih/para formatı (`tr-TR`/`tk-TM`/`en-US`/`ru-RU`), interpolasyon desteği. Artık en/ru kullanıcısı her yerde kendi dilini görüyor (önceden Türkçe'ye düşüyordu) |
| 1.3.8 | 2026-10-12 | FAZ C1–C4 ve D1–D9 kaynak uygulaması; ExcelJS/manuel kolon eşleme, Zod, POS refactor, conflict inceleme, E2E, açık izinli telemetri, güvenli seçici sync ve ilk kurulum. Android debug APK başarıyla derlendi; imzalı Windows/canlı servis ve fiziksel cihaz testleri ayrı bekliyor. |
| 1.3.9 | 2026-10-13 | **21 güvenlik/veri kaybı düzeltmesi (P0-P3):** "Sadece sunucudakini al" artık sunucuyu silmiyor (destroy+recreate); satış yazımı başarısızsa stok/bakiye etkilenmiyor; çift tık duplicate satış/taslak onayı kapandı; kısmi tahsilatlı void bakiyeyi doğru düşürüyor; selective sync köprü sızıntısı kapandı; conflict çözümü validation'dan geçiyor; PC silmeleri APK'ya yansıyor; parolalar repodan temizlendi; credential'lar obfuske saklanıyor. Kaynak: `c722aed` |
| 1.3.10 | 2026-10-13 | **Ek düzeltmeler (katalog + mirror retry):** ürün/müşteri yazımları DB sonucunu bekliyor (hata bildirimi, form koruma, çift gönderim engeli); PC mirror otomatik retry kuyruğu (1s/5s/30s × 3 tur, güncel belge okuma, PC-newer/tombstone guard); silmeler PC'ye tombstone olarak aktarılıyor. Kaynak: `57cdbc0` (+belge commit'leri) |
| 1.3.11 | 2026-10-25 | **Lisans depolama düzeltmesi + tam otomatik CouchDB kurulumu:** lisans aktivasyonundaki -9 STORAGE_ERROR giderildi (DPAPI tampon boyutu + HKCU fallback — adminsiz PC'lerde de aktivasyon çalışır); PC'de yeni hesap açınca CouchDB veritabanı otomatik oluşur ve bağlanır (kullanıcı adres yazmaz); bağlantı adresinde DB adı eksikse hesaptan tamamlanır; alt bilgide gerçek sürüm gösterilir. Kaynak: `ff46402` |

Kaynak `versionCode`: 28. Son üretilmiş test APK: v1.3.11 / versionCode 28.
Dosya: `BiznesHasap-v1.3.11.apk`; paket: `com.bizneshasap.pos`.

**İmza notu:** v1.3.8 APK başka ortamın debug anahtarıyla imzalanmıştı (v1.3.7 ile
uyumsuz). v1.3.9 ve v1.3.10, v1.3.7'nin imza anahtarının bulunduğu makinede
derlendi — sertifika digest'i v1.3.7 ile birebir aynı (`448b851b…`), yani v1.3.7
üzerine veri korunarak güncelleme yapılabilir. Bu dosyalar mağaza/release imzalı
sürüm değildir.
