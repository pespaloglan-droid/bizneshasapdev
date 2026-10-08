# Fatura / Kassa (Checkout) Modülü — Teknik Spesifikasyon

> **Ekran Modu Kuralı:** Giriş ekranından başarılı bir şekilde oturum açıldıktan sonra, uygulama otomatik olarak **Tam Ekran (Full Screen / Maximize)** moduna geçecek ve aşağıdaki Kassa/Checkout ekranı açılacaktır.

---

## 1. Referans Arayüz Tasarımı

![Kassa / Checkout Referans Arayüzü](file:///C:/Users/User/.gemini/antigravity/brain/fe65ed32-f1d9-47fc-9e5f-7e7aabed0b1c/.user_uploaded/media_1787432167028.png)

---

## 2. Genel Yerleşim (Layout Mimarisi)

Ekran 3 ana bölgeden oluşur:

1. **Üst Navigasyon Çubuğu (Top Nav Bar):** Sabit, koyu lacivert (`#0B1F3A` tonlarında) modül geçiş sekmeleri.
2. **Ana Çalışma Alanı (Main Workspace):** 3 sütunlu düzen:
   - **Sol / Orta:** Sepet ve Fatura Tablosu (Cart Table)
   - **Sağ Üst:** Ürün Kataloğu / Kategori Grid Alanı
   - **Sağ Alt:** Ödeme Paneli (Payment Panel)
3. **Alt Bilgi Çubuğu (Footer / Status Bar):** Marka, yazdırma, kısayollar, versiyon ve dil seçici.

---

## 3. Üst Navigasyon Çubuğu (Top Nav Bar)

Sekmeler (soldan sağa), her biri ikon + etiket:

| # | Sekme | İkon | Durum |
|---|-------|------|-------|
| 1 | **Kassa/Checkout** | 🛒 Sepet | Varsayılan aktif (Canlı yeşil arka plan `#1DB954`) |
| 2 | **Invoice (Fatura)** | 📄 Belge | Menü sekmesi |
| 3 | **Money/Cash** | 💰 Kasa | Menü sekmesi |
| 4 | **Customer (Müşteri)** | 👤 Kişi | Menü sekmesi |
| 5 | **User (Kullanıcı)** | 🔒👤 Kilit + Kişi | Menü sekmesi |
| 6 | **Product (Ürün)** | 📦 Kutu | Menü sekmesi |
| 7 | **Calculation (Hesaplama)** | 🧮 Hesap Makinesi | Menü sekmesi |
| 8 | **Currency Exchange (Döviz)** | ⇄ Çift Ok | Menü sekmesi |
| 9 | **Courier/Delivery (Kurye)** | 🚚 Kamyon | Menü sekmesi |
| 10 | **Settings (Ayarlar)** | ⚙️ Dişli | Sağ blok |
| 11 | **License Key (Lisans)** | 🔑 Anahtar | Sağ blok |

**Davranış Kuralları:**
- Aktif sekme yeşil arka plan + beyaz yazı ile vurgulanır.
- Sekmeler arası geçiş sayfa yenilemeden (Single Page Application - SPA) anında gerçekleşir.
- `Settings` ve `License Key` sağ tarafta bağımsız sistem araçları olarak konumlandırılır.

---

## 4. Fatura Üst Kontrol Satırı

Sepet tablosunun hemen üstünde, tek satırda 4 kontrol bileşeni yer alır:

### 4.1. Fatura Tipi Seçici (Sales Invoice Dropdown)
- **Varsayılan Değer:** `Sales Invoice` (Satış Faturası)
- **Alternatifler:** `Purchase Invoice`, `Return Invoice`, `Proforma Invoice`, `Quotation`
- Seçim değiştiğinde sepet kuralları ve stok yönü (giriş/çıkış) dinamik güncellenir.

### 4.2. Müşteri Seçici (Customer Dropdown)
- **Varsayılan:** `General Customer (Cash)`
- İkon: 👤 Kişi
- Tıklandığında: Hızlı müşteri arama ve "Yeni Müşteri Ekle" kısayol penceresi açılır.
- Seçilen müşteriye göre özel fiyat listesi, borç bakiyesi ve iskonto oranı otomatik uygulanır.

### 4.3. Barkod / Ürün Arama Kutusu
- **Placeholder:** `Scan or type barcode`
- **İkon:** Barkod çizgileri
- **Davranış:**
  - Barkod okuyucudan gelen veri `Enter` ile tetiklenir → Ürün anında sepete eklenir.
  - Elle yazılan metin: Ürün adı/SKU içinde canlı otomatik tamamlama (autocomplete).
  - Ürün bulunamazsa: *"Ürün bulunamadı, yeni ürün oluşturmak ister misiniz?"* uyarısı ve hızlı ekleme modalı.

### 4.4. "Add +" Butonu
- Yeşil, belirgin buton (`bg-[#10b981]` / `#1DB954`).
- Arama kutusunda seçili/yazılı ürünü sepete ekler (Kısayol: `Enter` veya `+`).

---

## 5. Sepet ve Fatura Tablosu (Cart Table)

### 5.1. Tablo Sütunları

| Sütun | İçerik | Açıklama / Davranış |
| :--- | :--- | :--- |
| **#** | Sıra No | 1, 2, 3... otomatik artan |
| **Product Name** | Ürün Görseli (~48x48px) + Ürün Adı + SKU Kodu | SKU küçük gri yazı ile ürün adının altında |
| **Qty** | Adet Kontrolü | `−` butonu / sayısal input / `+` butonu |
| **Price** | Birim Fiyat | Salt okunur (yetkili kullanıcı çift tıkla düzenleyebilir) |
| **Total** | Satır Toplamı (Qty × Price) | Yeşil, kalın ve belirgin yazı |
| **(Aksiyon)** | 🗑️ Çöp Kutusu İkonu | Kırmızı renkli, tek tıkla satırı sepetten siler |

### 5.2. Satır Etkileşimleri
- `−` / `+` butonları: Miktarı 1 azaltır/artırır (Minimum: 1).
- Aynı ürün barkodu tekrar okutulduğunda yeni satır açmak yerine mevcut satırın adedi (`Qty`) artırılır.
- Fiyat alanı çift tıklamayla yetki dahilinde override edilebilir.

### 5.3. Tablo Alt Özeti (Subtotal Bar)
- **Sol Taraf:** `🛒 5 Items` — Sepetteki toplam kalem/adet sayısı.
- **Sağ Taraf:** `Subtotal: 7.95` — Ara toplam tutarı (Yeşil, kalın font).

---

## 6. Ürün Kataloğu Paneli (Sağ Üst)

### 6.1. Kategori Sekmeleri
`All | Beverages | Snacks | Dairy | Bakery | Household | Other`
- Aktif kategori canlı yeşil renkle vurgulanır.
- Kategori sayısı arttığında yatay kaydırılabilir (scrollable).

### 6.2. Arama ve Görünüm Değiştirici
- Arama kutusu: `Search products...`
- Sağında: 🔲 Grid (Izgara) Görünümü ve ☰ Liste Görünümü geçiş butonları.

### 6.3. Ürün Kartı (Grid Item)
Her kart şunları içerir:
- Ürün görseli (kare, ortalanmış, temiz arka plan)
- Ürün adı (kalın metin)
- `Stock: N` (Stok adedi - gri küçük yazı)
- Fiyat (Yeşil, kalın alt satır)
- **Tıklama Davranışı:** Karta tıklandığı an sepete 1 adet eklenir. Stok 0 ise soluklaşır ve *"Out of Stock"* etiketi alır.

---

## 7. Ödeme Paneli (Sağ Alt)

### 7.1. Tutar Kutusu (AMOUNT DUE)
- Büyük yeşil kutu (`#1DB954` / `#16a34a`).
- `AMOUNT DUE` başlığı ve devasa okunabilir genel toplam rakamı (örn. `7.95`).

### 7.2. Ödeme Yöntemi Seçim Butonları
4 ana ödeme seçeneği:

| Buton | Kısayol | İkon | Açıklama |
| :--- | :--- | :--- | :--- |
| **Cash** | F2 | 💵 Nakit | Nakit ödeme akışı (Varsayılan seçili) |
| **Card** | F3 | 💳 Kart | Banka / Kredi Kartı POS çekimi |
| **Credit** | F4 | 📋 Veresiye | Cari hesaba borç kaydı |
| **Split** | F5 | ↔️ Parçalı | Birden fazla ödeme yöntemini birleştirme (örn. 50 Nakit + 50 Kart) |

### 7.3. Alınan Nakit ve Hızlı Para Butonları (Cash Received)
- **Alınan Tutar Inputu:** `0.00`
- **Hızlı Banknot Butonları:** `5` | `10` | `20` | `50` | `100` | `200` | `500` | `Exact`
  - `Exact` butonu: Ödenmesi gereken tam tutarı (`Amount Due`) doğrudan kutuya yazar.
- **Para Üstü Hesabı (Change Due):** `Change Due = Cash Received − Amount Due` anlık hesaplanıp gösterilir.

### 7.4. Satış Onay ve Taslak Butonları
- **`Hold as Draft` (📝 İkonlu, Çerçeveli):** Satışı askıya alır/taslak kaydeder, sepeti yeni müşteri için temizler.
- **`Complete Sale (F2 / Enter)` (Yeşil, Geniş, Dolu Buton):** Satışı tamamlar: PouchDB/CouchDB stoklarını düşer, fiş/fatura yazdırmayı tetikler.

---

## 8. Alt Bilgi Çubuğu (Footer Toolbar)

- **Sol:** `Biznes Hesap` marka logosu (Yeşil-lacivert bar ikonu).
- **Orta İkonlar:** 🖨️ Yazdır, ⚠️ Uyarı/Bildirimler, 🔍 Genel Arama.
- **Sağ Bilgi:** `Biznes Hesap` / `v2.1.0` / `22 May 2025`
- **En Sağ:** Çoklu dil seçici `🇬🇧 ENG` (TR, TM, RU, ENG bayraklı).

---

## 9. JSON Veri Modeli (Fatura & Satış Belgesi)

```json
{
  "_id": "invoice_20250522_0014",
  "docType": "invoice",
  "invoiceNo": "INV-20250522-0014",
  "invoiceType": "sales",
  "customerId": null,
  "customerName": "General Customer (Cash)",
  "items": [
    {
      "productId": "prod_wtr500",
      "sku": "WTR500",
      "name": "Mineral Water 500ml",
      "qty": 2,
      "price": 0.50,
      "total": 1.00
    },
    {
      "productId": "prod_chp040",
      "sku": "CHP040",
      "name": "Potato Chips 40g",
      "qty": 3,
      "price": 0.75,
      "total": 2.25
    },
    {
      "productId": "prod_coc330",
      "sku": "COC330",
      "name": "Coca Cola 330ml",
      "qty": 2,
      "price": 1.00,
      "total": 2.00
    },
    {
      "productId": "prod_mlk1l",
      "sku": "MLK1L",
      "name": "Fresh Milk 1L",
      "qty": 1,
      "price": 1.50,
      "total": 1.50
    },
    {
      "productId": "prod_brd001",
      "sku": "BRD001",
      "name": "White Bread",
      "qty": 1,
      "price": 1.20,
      "total": 1.20
    }
  ],
  "itemCount": 5,
  "subtotal": 7.95,
  "discountTotal": 0.00,
  "taxTotal": 0.00,
  "amountDue": 7.95,
  "paymentMethod": "cash",
  "cashReceived": 10.00,
  "changeDue": 2.05,
  "status": "completed",
  "createdAt": "2025-05-22T14:35:00.000Z"
}
```

---

## 10. Klavye Kısayolları Özeti

| Tuş | Eylem |
| :--- | :--- |
| **F2** | Nakit (Cash) Ödeme Seçimi |
| **F3** | Kredi Kartı (Card) Ödeme Seçimi |
| **F4** | Veresiye (Credit) Ödeme Seçimi |
| **F5** | Parçalı Ödeme (Split) Ekranı |
| **Enter (Arama Kutusunda)** | Barkodu/Seçili Ürünü Sepete Ekle |
| **Ctrl + Enter** | Satışı Tamamla ve Fiş Kes (Complete Sale) |
| **F8** | Fişi Askıya Al (Hold as Draft) |
