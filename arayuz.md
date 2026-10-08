# Biznes Hasap (PC & APK) - Arayüz ve Kullanıcı Deneyimi (UI/UX) Dokümanı

> **Geliştirme Planı - Faz 1 (Öncelikli):** İlk aşamada **PC (Masaüstü)** sürümü geliştirilecektir. Dokümanın bu bölümü, geliştirilmesine başlanacak olan **PC Giriş Ekranı (Login Ekranı)** ve devamındaki PC modüllerinin arayüz ve etkileşim standartlarını kapsar.

---

# BÖLÜM 1: PC GİRİŞ EKRANI (LOGIN SCREEN)

## 1. Giriş Ekranı Tasarım Görseli

![Giriş Ekranı Referans Tasarımı](file:///C:/Users/User/.gemini/antigravity/brain/fe65ed32-f1d9-47fc-9e5f-7e7aabed0b1c/.user_uploaded/media_1787423249667.png)

Ekran görüntüsündeki pencere düzeni ve tasarım dili birebir referans alınacaktır.

---

## 2. Pencere Yapısı ve Bölümleri

Pencere 4 ana bölgeye ayrılmıştır:

```
+---------------------------------------------------------------------------------+
| [1] ÜST BAŞLIK ÇUBUĞU: "Test versiyon"                               [_] [口] [X] |
+------------------------------------+--------------------------------------------+
| [2] SOL PANEL                      | [3] SAĞ PANEL (GİRİŞ FORMU)                |
|                                    |                                            |
|  [Diğer hesaplar v] [Hesap ekle +] |  (👤) Kullanıcı                            |
|  --------------------------------- |  +---------------------------------------+ |
|                                    |  | ADMINISTRATOR                         | |
|            ( LOGO )                |  +---------------------------------------+ |
|        [Bina İkonu / +]            |                                            |
|                                    |  (🔒) Şifre                                |
|  --------------------------------- |  +---------------------------------------+ |
|  [☰] Acme yazılım                  |  | Şifrenizi girin                       | |
|      http://127.0.0.1:5984         |  +---------------------------------------+ |
|                                    |                                            |
|                                    |  +---------------------------------------+ |
|                                    |  |                 GİRİŞ                 | |
|                                    |  +---------------------------------------+ |
+------------------------------------+--------------------------------------------+
| [4] ALT BİLGİ ÇUBUĞU                                                            |
|  [BH/Logo]  [🖨️ Yazıcı] [▲ Üçgen] [🔍 Ara]    Biznes hesap v1.150 20.06.2026   [🇬🇧 ENG]|
+---------------------------------------------------------------------------------+
```

---

## 3. Bölüm Detayları

### 3.1. Üst Başlık Çubuğu (Window Title Bar)
- **Ortada:** Pencere başlığı (örn. `"Test versiyon"` - dinamik uygulama adı veya sürüm tipi).
- **Sağda:** Standart pencere kontrol butonları:
  - Simge durumuna küçült (Minimize `_`)
  - Ekranı kapla / Büyüt (Maximize `□`)
  - Kapat (Close `✕`)

### 3.2. Sol Panel (Hesap Yönetimi & Bağlantı)
- **Üst Kısım Butonları:**
  - **"Diğer hesaplar"** (Açılır ok / dropdown ile kayıtlı şirket/hesap listesi)
  - **"Hesap ekle"** (`+` ikonu ile yeni şirket/hesap oluşturma butonu)
- **Orta Kısım (Logo Alanı):**
  - Dairesel açık gri arka planlı logo alanı.
  - Henüz logo yüklenmemişse varsayılan bina/şirket placeholder ikonu veya `+` ikonu gösterilir.
- **Alt Kısım (Hesap Bilgisi & Menü):**
  - **`☰` (3 Yatay Çizgi) Menü Butonu:** Hesap yönetim seçenekleri.
  - **Hesap Adı:** Seçili hesabın ticari unvanı (örn. `"Acme yazılım"`).
  - **Veritabanı URL:** Hesabın bağlı olduğu yerel/uzak CouchDB adresi (örn. `http://127.0.0.1:5984`).

### 3.3. Sağ Panel (Giriş Formu)
- **Kullanıcı Seçim Alanı:**
  - Kullanıcı ikonu (👤) + "Kullanıcı" etiket başlığı.
  - Seçili kullanıcı adını gösteren metin kutusu (örn. `"ADMINISTRATOR"`). Üzerine tıklandığında hesap altındaki diğer kullanıcıları seçme listesi açılır.
- **Şifre Alanı:**
  - Kilit ikonu (🔒) + "Şifre" etiket başlığı.
  - Şifre giriş kutusu (Maskelenmiş metin, placeholder: `"Şifrenizi girin"`).
- **Giriş Butonu:**
  - Koyu lacivert (`#0F3B66` / `#1E3A8A`), yuvarlatılmış köşeli, geniş ve belirgin onay butonu.

### 3.4. Alt Bilgi Çubuğu (Footer Toolbar)
- **Sol Taraf:**
  - **Uygulama Logosu:** Biznes Hasap uygulamasının kendi resmi marka ikonu.
  - **Yazıcı İkonu (🖨️):** Hızlı yazıcı yapılandırması.
  - **Üçgen İkonu (▲):** Özel fonksiyon/bildirim butonu (Kısayol destekli).
  - **Büyüteç / Arama İkonu (🔍):** Hızlı arama / sorgulama butonu (Kısayol destekli).
- **Orta Taraf:**
  - Uygulama adı, versiyonu ve derleme tarihi (örn. `"Biznes hesap v1.150 20.06.2026"`).
- **Sağ Taraf:**
  - **Dil Seçim Butonu:** Aktif dilin bayrağı ve dil kodu (örn. Bayrak + `"ENG"`).

---

## 4. Fonksiyonel İşleyiş ve Etkileşim Kuralları

### 4.1. "Hesap Ekle" (`+`) Butonu
1. Tıklanınca yeni hesap oluşturma modal penceresi açılır.
2. Kullanıcıdan **Hesap Adı** (örn. *"LC Waikiki"*, *"Acme Yazılım"*), **CouchDB Adresi** ve **Veritabanı Adı** istenir.
3. Yeni hesap oluşturulduğunda logo alanı başlangıçta boştur ve ortasında `+` işareti belirir.
4. `+` işaretine tıklanarak bilgisayardan resim (PNG, JPG, SVG) seçilerek logo atanabilir.

### 4.2. "Diğer Hesaplar" Açılır Menüsü
1. Tıklanınca sistemde kayıtlı tüm şirket ve şube hesapları numaralı liste olarak açılır (örn. *1. LC Waikiki*, *2. Acme Yazılım*).
2. Kullanıcı listeden bir şirkete tıkladığında:
   - Sol paneldeki logo, şirket adı ve CouchDB bağlantı adresi anında seçilen hesaba göre güncellenir.
   - Sağ paneldeki kullanıcı listesi o şirketin veritabanına bağlanarak varsayılan kullanıcıyı (`ADMINISTRATOR`) yükler.
   - Şifre alanı temizlenir ve imleç şifre kutusuna odaklanır.

### 4.3. Kullanıcı Seçimi (Administrator Alanı)
- `"ADMINISTRATOR"` kutusuna tıklandığında ilgili hesaba kayıtlı kullanıcılar açılır menüde listelenir (örn. *Kasiyer 1*, *Müdür*, *Depo*).
- Seçilen kullanıcı kutuya yerleşir.

### 4.4. Logonun Altındaki `☰` (3 Çizgi) Menüsü
Tıklanınca 3 seçenekli açılır menü görüntülenir:
1. **Sil:** İlgili hesabı ve yerel yapılandırmasını onay kutusu ile sistemden kaldırır.
2. **Düzenle:** Hesap adını, logosunu veya sunucu bağlantı adresini güncelleme ekranını açar.
3. **İçindekileri içeri aktar (Import et):** Hesaba ait yedek/veri dosyasını dışarıdan içe aktarma sihirbazını başlatır.

### 4.5. Yazıcı (Printer) İkonu Menüsü
Tıklanınca 3 seçenekli bir açılır menü sunulur:
1. **Otomatik seç (Avto sec):** Sistem varsayılan yazıcısını otomatik algılar.
2. **Çek yazıcı:** Fiş / makbuz (Termal POS ESC/POS 58mm / 80mm) yazıcısını hedefler.
3. **Standart yazıcı:** A4 / A5 fatura ve rapor yazıcılarını hedefler.

### 4.6. Arama ve Üçgen İkonları (F1 – F12 Kısayol Mimarisi)
- Klavye fonksiyon tuşları (**F1 – F12**) 6'şar tuş olarak iki ana butona dağıtılacaktır:
  - **Grup A (F1 – F6):** Arama (🔍) ile ilişkili hızlı sorgulama ve bulma işlevleri.
  - **Grup B (F7 – F12):** Üçgen (▲) ikonu ile ilişkili hızlı işlem ve menü işlevleri.

### 4.7. Dil Seçim Butonu
- Tıklanınca açılan dil menüsünden desteklenen diller seçilebilir:
  - 🇹🇷 **Türkçe (TR)**
  - 🇹🇲 **Türkmence (TM)**
  - 🇬🇧 **İngilizce (ENG)**
  - 🇷🇺 **Rusça (RU)**
- Dil seçildiğinde tüm arayüz metinleri (placeholder'lar, butonlar, başlıklar) anında seçilen dile çevrilir.

---

## 5. Açık Noktalar ve Netleştirilecek Konular

1. **Üçgen (▲) İkonunun Tam Kapsamı:** Üçgen butonunun varsayılan açılış penceresi (Hızlı bildirim paneli, sistem durumu mu yoksa özel menü mü?) netleştirilecek.
2. **F1–F12 Fonksiyon Eşleme Tablosu:** 12 tuşun her birinin tetikleyeceği fonksiyonlar (Fiyat Gör, Ürün Bul, Hızlı Satış vb.) netleştirilecek.
3. **Yazıcı Şablon Parametreleri:** Çek yazıcı için karakter genişliği (40/42/48 karakter) ve kesme/çekmece açma komutları tanımlanacak.

---

# BÖLÜM 2: GENEL UYGULAMA VE SİSTEM MİMARİSİ

*(Genel sistem ve sonraki aşamalara dair arka plan bilgileri)*

### Veritabanı ve Senkronizasyon
- **Yerel ve Uzak Veritabanı:** CouchDB / PouchDB mimarisi ile çevrimdışı çalışabilme ve çevrimiçi olduğunda iki yönlü senkronizasyon desteği.
- **Güvenlik:** Şifreler yerel olarak güvenli hashleme ile saklanır; oturum açıldığında yetki seviyesine göre ana menü dinamik yüklenir.
