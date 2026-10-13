# CouchDB Senkronizasyonu — Biznes Hasap (PC + APK)

PC ile Android arasında veri aktarımı PouchDB replikasyonu ile yapılır.
PC verileri bilgisayardaki CouchDB'ye, telefon verileri de aynı sunucuya akar.

**Kodda hiçbir sabit IP veya domain yoktur.** Tüm adresler kullanıcı tarafından
yapılandırılır (PC: config dosyası · APK: hesap ayarında yapıştırılan adres).

---

## 1. PC tarafı

### Yapılandırma (TEK dosya)

`public/couchdb.config.json`

```json
{
  "url": "http://127.0.0.1:5984",
  "username": "bizneshasap",
  "password": "[REDACTED-ROTATION-REQUIRED]",
  "businessName": "BIM MARKET"
}
```

| Alan | Açıklama |
|---|---|
| `url` | CouchDB adresi |
| `username` / `password` | Sunucu kullanıcısı |
| `businessName` | İşletme adı → veritabanı adı bundan türetilir |

`businessName` değişince veritabanı adı otomatik değişir:

```
"BIM MARKET"      → bim_market
"Şeker Market"    → seker_market
"Çiğdem Ürünler"  → cigdem_urunler
"2024 Mağaza"     → b_2024_magaza     (rakamla başlıyorsa b_ eklenir)
```

Dönüşüm kuralları: Türkçe harfler ASCII'ye (ı→i, ş→s, ğ→g, ü→u, ö→o, ç→c),
küçük harf, boşluk/özel karakter → `_`, harfle başlar, en fazla 60 karakter.

### Otomatik çalışma

PC'de **hiçbir ayar ekranı yoktur.** Uygulama açılır açılmaz:

1. `couchdb.config.json` okunur
2. Veritabanı adı türetilir
3. Veritabanı sunucuda yoksa **otomatik oluşturulur**
4. İki yönlü canlı senkron başlar (`live: true, retry: true`)
5. Sunucu erişilemezse uygulama **çalışmaya devam eder**, 10 saniyede bir yeniden dener

Sağ üstteki küçük rozet durumu gösterir: **Bağlı · Eşitleniyor · Bağlanıyor · Çevrimdışı · Hata**

Domain / `_replicator` / uzak sunucu ile ilgili hiçbir ekran, buton veya kod
PC uygulamasında **bulunmaz**.

---

## 2. APK tarafı

### Hesap başına iki bağlantı

**Ayarlar → Bulut eşitleme** (her hesap için ayrı kaydedilir):

| Bağlantı | Açıklama |
|---|---|
| **Local** | Aynı Wi-Fi — bilgisayarın adresi |
| **Online** | Alan adı |

Kullanıcı adresi bu biçimde yapıştırır:

```
http://bizneshasap:[REDACTED-ROTATION-REQUIRED]@192.168.1.8:5984/bim_market
http://bizneshasap:[REDACTED-ROTATION-REQUIRED]@dbpanel.hmxagent.cfd:5984/bim_market
```

- Parola URL-kodlü olabilir (`%40` = `@`) — otomatik çözülür
- Kullanıcı/parola adresten **çıkarılır**, Basic Auth header'ı olarak gönderilir
- Şema yazılmamışsa `http://` varsayılır
- Parola alanı maskeli gösterilir (göz ikonu ile açılır/kapanır)

### Nereden bağlanılır?

Bağlantı alanları **iki yerde** aynı bileşenle bulunur:

| Ekran | Ne zaman |
|---|---|
| **Yeni Hesap** / **Hesabı Düzenle** | Hesabı açarken, **uygulamaya girmeden** test edip bağlanabilirsiniz |
| **Ayarlar → Bulut eşitleme** | Hesabın ayarlarından sonradan değiştirebilirsiniz |

İkisinde de adres kutusu, göz simgesi (parola maskeli), "Sadece bağlantıyı sına",
bağlan/durdur düğmesi ve durum noktası vardır. Yeni hesapta girilen bağlantılar
kaydetme anında gerçek hesap kimliğine taşınır.

### Davranış

- **Başlat ikonu** → önce 3 kademeli test, sonra otomatik canlı senkron:
  1. `GET /` → sunucuya ulaşılabiliyor mi
  2. Kimlik doğrulama → kullanıcı/şifre doğru mu
  3. `GET /db` → veritabanı var mı
- **İkon renkleri:**
  gri = bağlı değil · sarı = bağlanıyor · **mavi = test edildi (bağlı değil)** ·
  yeşil = bağlı · kırmızı = hata
- Yeşil ikona tekrar basılırsa bağlantı **durur**
- Aynı anda **tek bağlantı** açık olur; diğeri otomatik kapanır
- Uygulama yeniden açıldığında **son kullanılan bağlantı otomatik başlar**
- Bağlantı koparsa PouchDB `retry` ile kendiliğinden yeniden dener
- Local ↔ Online geçişinde veri kaybolmaz (aynı veritabanı, farklı yol)

### Düz HTTP sunucular (mixed content)

Uygulama `androidScheme: 'http'` ile derlenir; bu **şarttır**. Varsayılan `https`
kalsaydı WebView, `http://` adreslerine giden istekleri engeller ve kullanıcı yanlış
şekilde "Sunucuya ulaşılamıyor" görürdü.

### Gerçek hata mesajları

"Ulaşılamıyor" yerine sebep yazılır:

| Durum | Mesaj |
|---|---|
| Zaman aşımı | "Zaman aşımı — sunucu yanıt vermedi (süre doldu)" |
| Mixed content | "Engellendi: uygulama https origin'inden http://… bağlanamıyor (mixed content). Bu bir hata değil — sunucu çalışıyor olabilir." |
| Ağ hatası | "Olası nedenler: aynı ağda değilsiniz, sunucu kapalı, güvenlik duvarı 5984'ü engelliyor veya alan adı/IP hatalı." |
| 401 / 403 | "Kullanıcı adı veya şifre hatalı" |
| 404 | "Veritabanı bulunamadı: &lt;ad&gt;" |
| 405 | "Sunucu bu isteği kabul etmiyor (CORS ayarı eksik olabilir)" |

**Parola hiçbir mesajda veya logda görünmez** — `redactSecrets()` her hata metnini temizler.

### Veri birleştirme ve ilerleme

Bağlanınca aktarım **kendiliğinden** başlar:

| Durum | Davranış |
|---|---|
| Telefon boş | Soru **sorulmaz**, sunucudaki tüm veri çekilir |
| Telefon **ve** sunucu dolu | "Birleştir" (varsayılan) / "Sadece sunucudakini al" sorulur |

İlk aktarımda ilerleme gösterilir:

```
Aktarılıyor…            12 / ~35
Aktarım tamamlandı      48 belge alındı · Canlı eşitleme devam ediyor
```

Aktarım bitince canlı senkron kesintisiz devam eder.

### Hata mesajları

| Durum | Mesaj |
|---|---|
| Sunucuya ulaşılamıyor | "Sunucuya ulaşılamıyor" |
| Kimlik hatalı | "Kullanıcı adı veya şifre hatalı" |
| DB yok | "Veritabanı bulunamadı: &lt;ad&gt;" |
| Zaman aşımı | "Zaman aşımı — sunucu yanıt vermedi" |
| Adres bozuk | "Adres okunamadı. Biçim: http://kullanıcı:şifre@sunucu:5984/veritabanı" |

### Android düz HTTP izni

`AndroidManifest.xml` → `android:usesCleartextTraffic="true"`

Android 9+ düz HTTP'yi varsayılan olarak engeller. Kullanıcının girdiği
LAN adresleri çalışsın diye açıktır.

---

## 3. Veri biçimi (şema köprüsü)

İki uygulama farklı belge şeması kullanır:

| | PC | APK |
|---|---|---|
| Ürün | `urun:<id>` · `ad`, `fiyat`, `stok`, `barkod` | `product_<id>` · `name`, `price`, `stock`, `barcode` |
| Müşteri | `kagent:<id>` · `ad`, `telefon` | `customer_<id>` · `name`, `phone` |
| Fatura | `fatura:<id>` · `faturaNo`, `toplam` | `invoice_<id>` · `invoiceNo`, `amountDue` |

Ortak alanlar birebir eşleşir. APK kaydederken **çift yazar**:
asıl kayıt kendi formatında + PC'nin okuyacağı ayna (`urun:` / `kagent:` / `fatura:`).

Farklı `_id` önekleri sayesinde iki uygulama aynı belgeyi eşzamanlı düzenlerse
çoğu durumda çakışma oluşmaz. Oluşan çakışmalarda **son güncellenen kayıt kazanır**
(Last-Write-Wins): `conflictResolver.ts` çakışmalı belgeleri toplar, `updatedAt`
zaman damgalarını karşılaştırır, en yeniyi ana revizyon yapar ve diğerlerini siler.

**Lisans belgesi senkronize edilmez** — cihaz kimliğidir, telefona PC'nin kimliğini
aktarmamak için `license` dışarıda tutulur.

### Büyük veri

Köprü aktarımı belgeleri önce toplar, sonra **100'erlik gruplar** halinde
`bulkDocs` ile yazar (`upsertDocsBatch`) ve gruplar arasında arayüze nefes alma
payı bırakır — büyük veride arayüz donmaz.

---

## 4. Sunucu kurulumu (README)

### bind_address — LAN erişimi

`CouchDB\etc\local.ini` veya `etc\local.d\20-cors.ini`:

```ini
[chttpd]
bind_address = 0.0.0.0
enable_cors = true

[cors]
origins = http://localhost:5173, http://localhost:4173, http://localhost, capacitor://localhost, https://localhost
credentials = true
methods = GET, PUT, POST, HEAD, DELETE
headers = accept, authorization, content-type, origin, referer

[chttpd_auth]
require_valid_user = true
```

Sonrasında servisi yeniden başlatın: `Restart-Service 'Apache CouchDB'`

Aynı ayarlar CouchDB'nin config API'si ile de yazılabilir (yeniden başlatmaya
gerek yok, CORS için):

```powershell
$auth = 'Basic ' + [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes('KULLANICI:SIFRE'))
Invoke-WebRequest -Uri 'http://127.0.0.1:5984/_node/_local/_config/chttpd/enable_cors' `
  -Method PUT -Headers @{Authorization=$auth} -ContentType 'application/json' -Body '"true"'
# cors/origins, cors/credentials, cors/methods, cors/headers için aynı yol
```

### Windows güvenlik duvarı — port 5984

```powershell
New-NetFirewallRule -DisplayName 'BiznesHasap CouchDB 5984' `
  -Direction Inbound -Action Allow -Protocol TCP -LocalPort 5984 `
  -Profile Any -Description 'Biznes Hasap senkronizasyon'
```

> Ağ profili "Public" ise kural **mutlaka** `Private` yerine `Any` olmalıdır,
> aksi halde telefon bağlanamaz.

### Yönetici kullanıcısı oluşturma

```powershell
$auth = 'Basic ' + [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes('BIZNES:HASH'))
$doc = '{"_id":"org.couchdb.user:bizneshasap","name":"bizneshasap","type":"user","roles":[],"password":"[REDACTED-ROTATION-REQUIRED]"}'
Invoke-WebRequest -Uri 'http://127.0.0.1:5984/_users/org.couchdb.user:bizneshasap' `
  -Method PUT -Headers @{Authorization=$auth} -ContentType 'application/json' -Body $doc
```

### Domain tarafı (elle yönetilir)

> **Kapsam dışı.** Domain yönlendirme ve `_replicator` işi bu uygulamanın
> sorumluluğunda **değildir** — CouchDB panelinden (Fauxton → `_replicator`)
> elle yönetilir. Uygulama yalnızca kullanıcının yapıştırdığı **online adresine**
> bağlanır.

---

## 5. Sorun giderme

| Belirti | Sebep / Çözüm |
|---|---|
| "Sunucuya ulaşılamıyor" | Güvenlik duvarı (profil `Private` ise `Any` yap), farklı Wi-Fi, ya da bilgisayar IP'si değişmiş |
| "Kullanıcı adı veya şifre hatalı" | `couchdb.config.json` / yapıştırılan adres bilgileri |
| "Veritabanı bulunamadı" | Sunucuda o hesabın veritabanı yok; `Yeni-HesapVeritabani.ps1` ile açılır |
| CORS hatası (konsol) | `cors/origins` içinde uygulamanın origin'i yok |
| Telefonda veri gelmiyor | Adres `127.0.0.1` ise telefonda kendini gösterir; bilgisayarın **Wi-Fi IP'si** yazılmalı |

### Hesap veritabanı açma

```powershell
.\Yeni-HesapVeritabani.ps1 -Ad "BIM MARKET"
```