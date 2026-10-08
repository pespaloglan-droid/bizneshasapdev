# Biznes Hasap - CouchDB & PouchDB Veritabanı Mimari ve Yol Haritası Dokümanı

Bu doküman, **Biznes Hasap (PC & APK & iOS)** projesinin çevrimdışı (offline-first) veritabanı altyapısını, şu ana kadar kurulan PouchDB sistemini, ileride yapılacak veritabanı modüllerini ve **Apache CouchDB** kurulum/yapılandırma adımlarını içerir.

---

## 1. Mimari Karar: Neden PouchDB + Apache CouchDB Hibrit Modeli?

Biznes Hasap, farklı sektörlerdeki (perakende, market, toptan, servis) mağazalarda **PC**, **Android (APK)** ve ileride **iOS** cihazlarda çalışacaktır. Bu ekosistem için en kararlı çözüm **PouchDB + CouchDB** hibrit mimarisidir:

1. **Sıfır Gecikme ve Kesintisiz Çevrimdışı Çalışma (Offline-First):**
   - Kasiyer satış yaparken veya depocu telefondan barkod okuturken veriler anında cihazın yerel PouchDB veritabanına (IndexedDB/LevelDB) yazılır.
   - İnternet veya mağaza içi WiFi kopsa dahi satış veya stok işlemleri 1 milisaniye bile aksamaz.
2. **Çift Yönlü Canlı Eşitleme (Two-Way Live Replication):**
   - Cihaz ağa bağlandığı anda PouchDB, merkezdeki **Apache CouchDB** sunucusuna (`http://127.0.0.1:5984`) verileri otomatik olarak eşitler.
3. **Tek Kod Tabanı (Cross-Platform):**
   - Yazdığımız PouchDB servisleri hem Windows (.exe), hem Android (APK), hem de iOS'ta sıfır değişiklikle birebir çalışır.
4. **Çoklu Şirket/Hesap İzolasyonu (Multi-Tenant):**
   - Her işletme hesabı (örn. *Acme Yazılım*, *LC Waikiki*, *BİM Market*) CouchDB üzerinde ayrı bir bağımsız veritabanı (`acme_db`, `lcwaikiki_db`) olarak tutulur.

---

## 2. Şu Ana Kadar Yapılanlar (Tamamlanan Veritabanı Katmanı)

✅ **1. Paket Kurulumları:**
- `pouchdb-browser` (Hafif ve optimize edilmiş yerel veritabanı motoru).
- `pouchdb-find` (MongoDB tarzı esnek JSON sorgulama - Mango Query desteği).
- TypeScript tip tanımlamaları (`@types/pouchdb-browser`, `@types/pouchdb-find`).

✅ **2. Veritabanı ve Canlı Senkronizasyon Servisi (`src/db/pouch.ts`):**
- `getLocalDatabase(dbName)`: İstenen her hesap için yerel PouchDB havuzu oluşturan/çağıran fonksiyon.
- `startCouchDbSync(localDb, couchDbUrl, callback)`: Yerel veritabanı ile CouchDB URL'si arasında çift yönlü (`live: true, retry: true`) senkronizasyonu başlatan ve bağlantı durumunu (online/offline/syncing) takip eden motor.

✅ **3. Hesap ve Kullanıcı Yönetim Servisi (`src/db/accountService.ts`):**
- Hesapların PouchDB'ye kaydedilmesi, silinmesi ve listelenmesi.
- `Administrator` kullanıcısı için şifresiz giriş kuralı ve personel şifre doğrulama fonksiyonu.

✅ **4. Durum Yönetimi Entegrasyonu (`src/store/accountStore.ts`):**
- Arayüz ile PouchDB arasında çift yönlü veri akışı kuruldu; her yeni hesap ve güncelleme yerel veritabanına işleniyor.

---

## 3. İleride Yapılacaklar (Veritabanı Yol Haritası)

Bir sonraki modüllere geçildiğinde PouchDB & CouchDB tarafında şu tablolar ve şemalar hayata geçirilecektir:

### 3.1. Stok ve Ürünler Koleksiyonu (`products`)
```json
{
  "_id": "product_8690123456789",
  "type": "product",
  "barcode": "8690123456789",
  "name": "Çaykur Rize Çayı 1000g",
  "category": "Gıda",
  "unit": "Adet",
  "buyPrice": 120.00,
  "sellPrice": 165.00,
  "stock": 48,
  "minStockAlert": 10,
  "vatRate": 1,
  "updatedAt": "2026-06-20T10:30:00Z"
}
```

### 3.2. Satış ve POS Fişleri Koleksiyonu (`sales`)
```json
{
  "_id": "sale_20260620_0014",
  "type": "sale",
  "receiptNo": "F-0014",
  "cashierId": "u-1",
  "cashierName": "ADMINISTRATOR",
  "date": "2026-06-20T14:22:10Z",
  "items": [
    { "barcode": "8690123456789", "name": "Çaykur Rize Çayı", "qty": 2, "price": 165.00, "total": 330.00 }
  ],
  "grandTotal": 330.00,
  "paymentMethod": "cash",
  "paidAmount": 350.00,
  "changeAmount": 20.00
}
```

### 3.3. Cari Hesaplar (Müşteri & Tedarikçi) Koleksiyonu (`customers`)
```json
{
  "_id": "customer_c001",
  "type": "customer",
  "name": "Ahmet Yılmaz",
  "phone": "+90 555 123 4567",
  "balance": -450.00,
  "balanceType": "debt"
}
```

### 3.4. Kasa ve Masraf Hareketleri Koleksiyonu (`cash_flow`)
- Günlük nakit kasa, banka POS girişleri, kira/masraf çıkışları ve Z Raporu özetleri.

---

## 4. Apache CouchDB Kurulum ve Yapılandırma Kılavuzu (Adım Adım)

Canlı veritabanı eşitlemesini test etmek istediğinizde bilgisayarınıza CouchDB kurmak için şu adımları izleyin:

### Adım 1: CouchDB'yi İndirme
1. Resmi web sitesine gidin: **[https://couchdb.apache.org/](https://couchdb.apache.org/)**
2. **"Download"** butonuna basarak **Windows (x64) MSI Installer** dosyasını indirin.

### Adım 2: Kurulum (Windows MSI)
1. İndirdiğiniz `.msi` dosyasını çalıştırın.
2. Kurulum sırasında sizden **Admin Kullanıcı Adı** ve **Şifre** belirlemeniz istenecektir:
   - **Kullanıcı Adı:** `admin` (önerilen)
   - **Şifre:** `admin123` (veya kendi belirleyeceğiniz bir şifre)
3. Kurulumu tamamlayın. CouchDB otomatik olarak Windows Servisi olarak arka planda başlayacaktır.

### Adım 3: Çalıştığını Doğrulama
1. Tarayıcınızda şu adresi açın: **`http://127.0.0.1:5984`**
2. Ekranda şu JSON yanıtını görüyorsanız CouchDB başarıyla çalışmaktadır:
   ```json
   {"couchdb":"Welcome","version":"3.x.x"}
   ```

### Adım 4: Fauxton Yönetim Paneli ve CORS Etkinleştirme
1. Tarayıcıdan yönetim paneline girin: **`http://127.0.0.1:5984/_utils`**
2. Sol menüden **"Settings" (⚙️)** sekmesine tıklayın.
3. **"CORS"** (Cross-Origin Resource Sharing) başlığına tıklayın.
4. **"Enable CORS"** butonuna basarak yeşil aktif hale getirin ve **"All domains (*)"** seçeneğini seçin. *(Bu ayar, masaüstü uygulamamızın ve mobil APK'nın CouchDB'ye engelsiz bağlanmasını sağlar).*

---

## 5. Özet

Artık projemiz **PouchDB yerel veritabanı** üzerinde çalışmakta olup, girilen `http://127.0.0.1:5984` CouchDB adresine otomatik olarak canlı bağlanacak ve verileri arka planda çift yönlü eşitleyecek durumdadır.
