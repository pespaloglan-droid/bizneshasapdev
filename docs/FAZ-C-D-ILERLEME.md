# Faz C / D çalışma kaydı

Başlangıç: `main`, `a229c6f`. Bu kayıt kaynak değişikliklerini takip eder;
üretilmemiş APK veya imzalı EXE için tamamlanmış dağıtım iddiası değildir.

## Faz C — D4 öncesi Excel mimari temizliği

- C1: Faktura ve hasaplama export'u `excelWriter.ts` üzerinden ExcelJS kullanır.
  Fakturadaki satır hesaplaması ve mevcut genel toplam korunur. Raporların sayısal
  kolonları sayısal hücre olarak yazılır; SKU gibi kimlikler metin kalır.
  Kesirli miktarlar tam sayıya yuvarlanmış görünmez.
- C2: `excelIO.ts` ExcelJS ile ilk worksheet'i okur; tarih, rich text, hyperlink
  metni ve formüllerin mevcut sonuçlarını normalleştirir. Formül çalıştırmaz.
  Boş ara satırların fiziksel satır numaraları korunur. 10 MB / 50.000 satır
  limitleri devam eder. Okuma hataları 4 dilde sözlüğe bağlandı.
- Ürün/müşteri dosyalarındaki kullanılmayan legacy export/template fonksiyonları
  kaldırıldı. Aktif stilli export/template fonksiyonları korunur.
- C3: `read-excel-file` ve `write-excel-file` dependency + lockfile'dan kaldırıldı.
- C4 (alias haritası + manuel kolon eşleme UI'ı): **henüz uygulanmadı**.
  C1–C3 temizliğinden bağımsız, ayrı bir sonraki adımdır.

Excel kolon başlıkları Türkmençe ve ürün/müşteri başlıkları mevcut tek kaynaktan
üretilmeye devam eder. Veri etiketi tabloları ve DB belge formatı değiştirilmedi.
Yeni repo test dosyası eklenmedi.

## Faz D1 — hazırlık

İmzalı build komutu, sertifika gitignore kuralları, Windows workflow'u ve
`WINDOWS-IMZALAMA.md` eklendi. Sertifika eksikse imzalı yol hata verir.
Gerçek sertifika ile Windows EXE/imza/zaman damgası doğrulaması **bekliyor**.
Linux'ta Windows paketleme denemesi Wine olmadığı için tamamlanamadı.

## Mobil dağıtım

Kaynak sürümü v1.3.8 / versionCode 25 için ayrıldı.
Bu ortamda Android SDK kurulu değil. APK üretimi, çıktı dosyasının
`bizneshasap-apk/BiznesHasap-v1.3.8.apk` konumuna kopyalanması ve Android cihazda
Documents kayıt/import kontrolü yapılmadan mobil iş dağıtıma hazır sayılmaz.
