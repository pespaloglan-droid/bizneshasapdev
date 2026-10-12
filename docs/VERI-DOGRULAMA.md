# D3 — veritabanı yazım doğrulaması

## Kapsam

`src/db/validation.ts` Zod ile `ProductSchema`, `CustomerSchema`,
`InvoiceSchema` ve `TransactionSchema` tanımlar. APK belgeleri sırasıyla
`product_`, `customer_`, `invoice_` ve `money_` önekleri ve mevcut nested
`product` / `customer` / `invoice` / `transaction` gövdeleriyle doğrulanır.
Gövde ID'si belge önekinden sonraki ID ile eşleşmelidir; `docType` da ilgili
domain ile eşleşir.

PC'nin düz `urun:`, `kagent:` ve `fatura:` belgeleri ayrı şemalar kullanır.
Bilinen PC alanları `schema/fieldMap.ts` haritasından türetilir; fatura kalemleri
ayrıca doğrulanır. Eski, seyrek PC belgelerine APK'nın zorunlu alanları eklenmez.
Ürün/müşteri `ad` alanı string olmalıdır; PC'nin serbest/gelecekte genişleyebilir
tip/durum kodlarına APK enum'ları dayatılmaz.

Audit, ayarlar, lisans, hesap, birimler ve diğer modül belgeleri bu dört
domain şemasına sokulmaz. PouchDB tombstone yazımları domain gövdesi olmadan
yapılabilir; mevcut temizleme/silme akışları korunur.

## Veri değişmezleri

- Sayılar gerçekten sayı ve sonlu olmalıdır. `"12.5"`, `NaN` veya `Infinity`
  otomatik olarak sayıya/0'a çevrilmez.
- Kod/barkod/SKU string kalır; baştaki sıfırlar korunur.
- Serbest kategori ve ölçü birimleri sabit enum'a çevrilmez.
- Negatif stok/bakiye ve artı/eksi iskonto yüzdesi mevcut davranışla uyumludur.
- APK enum'ları `types.ts` seçeneklerini, para işlem kategorileri ise
  eski/otomatik `haryt_satuw` ve `haryt_satyn_almak` kayıtlarını da kapsar.
- Bilinmeyen alanlar düşürülmez. Zod parse çıktısı DB'ye yazılmaz; doğrulanmış
  orijinal değerler kullanılır. `coerce`, varsayılan değer ekleme ve şema
  dönüşümü yapılmaz.
- Model içindeki tarih/zaman alanları mevcut string tipiyle kontrol edilir.
  Üst seviye `createdAt` / `updatedAt` / `syncedAt` için LWW'nin desteklediği
  eski sonlu saniye/ms sayıları da değiştirilmeden kabul edilir. Tarih geçerliliği,
  muhasebe dengesi, toplamların yeniden hesaplanması, fiyat alt sınırı veya
  stok politikası bu tip katmanının yaptığı işler değildir.

## Tekil ve toplu yazım

`upsertDoc` yazmadan önce mevcut belgeyle alanları birleştirip son belgeyi
doğrular. Üst alanlar ve tanınan nested domain gövdeleri bir seviye birleştirilir;
diziler tamamen değiştirilir. Genel/derin merge yoktur. Zorunlu bir alanı
`undefined` yaparak kaldırmak doğrulamayı geçmez; opsiyonel alanlar kaldırılabilir.

Çağıranın `_id` değeri farklıysa yazım reddedilir; `_rev` kaynaktan alınmaz,
DB'nin güncel revision'ı kullanılır. Okuma/yetki/şifreleme hatası yeni belge gibi
yorumlanmaz. Yalnızca 409 çakışma, en fazla üç denemede tekrar okunup
birleştirilir/doğrulanır. Silinmiş belgenin yeniden yaratılmasında tombstone
revision'ı alınır ve yeni domain gövdesi tekrar doğrulanır.

Audit diff'i, başarılı denemenin önceki snapshot'ı ile gerçekten yazılan
birleşik belge arasında hesaplanır. Korunan alanlar yanlışlıkla silinmiş
gösterilmez; reddedilmiş doğrulama için başarılı yazım kaydı üretilmez.

`upsertDocsBatch` mevcut revision ve gövdeleri `include_docs: true` ile toplar.
Hatalı kayıtlar ayrı `failed` girdileridir; yalnızca doğrulanmış belgeler
`bulkDocs`'a gider. Batch veya snapshot okuması hata verirse tekil güvenli yol
denenir. Hatalı kayıt diğer geçerli kayıtların yazılmasını engellemez.
Sıfır/negatif/kesirli/geçersiz batch boyutu reddedilir; sonsuz döngü oluşmaz.

Ürün/müşteri batch servisleri mevcut kayıt ID'si dönüşümünü ve yalnızca
başarılı kayıtları PC'ye aynalama davranışını korur. Ürün/müşteri/fatura
tekil servisleri `DocumentValidationError` hatasını başarı gibi dönmek
yerine çağırana iletir. Diğer eski DB hatalarının servislerdeki davranışı
bu adımda değiştirilmedi.

## Hata ve sınırlar

`DocumentValidationError.code` değeri `VALIDATION_ERROR`dır. `issues` içinde
alan yolu ve hata kodu bulunur; mesaj `errors.documentValidation` üzerinden
TR/TM/EN/RU olarak üretilir. Hata metnine reddedilen isim/telefon/fatura değerleri
eklenmez. Toplu importun mevcut hata raporu `failed[].error` metnini kullanabilir.

Bu kapı `upsertDoc` / `upsertDocsBatch` yardımcılarına uygulanır; doğrudan
PouchDB yazımları, restore ve sunucu replikasyonu için genel DB middleware'i
değildir. Eski kayıtlar topluca dönüştürülmez veya silinmez; okuma tarafındaki
`sanitize.ts` koruması yerinde kalır. Eksik/yanlış tipli APK domain gövdesini
son belge hâlinde hâlâ geçersiz bırakan patch reddedilir; bu katman eski veriyi
sessizce onarmaya çalışmaz. UI'nın mevcut iyimser/fire-and-forget kayıt
handler'ları bu adımda kapsamlı olarak yeniden tasarlanmadı.

## Doğrulama

- Mevcut 17 dosya / 305 birim testi ve TypeScript/web build.
- Repo dışında, gerçek Chromium + IndexedDB PouchDB ile tip/enum/ID,
  PC köprü belgeleri, bilinmeyen alanlar, kısmi yazımlar, karma batch ve
  servis aynalama/hata iletimi.
- Okuma/bulk hataları, güncel revision ile 409 denemesi, lisans kapısı,
  tombstone/yeniden yaratma ve audit davranışı.
- Gerçek şifreli PouchDB üzerinde kısmi yazım ve hatalı değer reddi.

Yeni repo test dosyası eklenmedi. Bu kontroller Android cihaz veya gerçek
Windows dağıtım testi yerine geçmez. APK build/push, tüm kaynak düzeltmelerinden
sonraki ayrı dağıtım adımıdır.
