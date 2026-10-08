# Uygulama Bilgilendirme Dokümanı
## Offline Mağaza Hesap Yönetim Uygulaması — Genel Yapı

> **Not:** Geliştirmeye önce arayüzden başlanacaktır (bkz. `arayuz.md`). Bu doküman, uygulamanın genel mimarisini ve **ileride hayata geçirilecek** lisanslama sistemini bilgilendirme amaçlı içerir; şu an geliştirme kapsamında değildir.

---

## 1. Genel Bakış

Bu uygulama, mağazalarda (örn. LC Waikiki, BİM, Acme Yazılım gibi işletmeler) kullanılacak, **tamamen çevrimdışı (offline)** çalışan bir masaüstü hesap/POS yönetim uygulamasıdır.

- Uygulama **.exe** formatında, internet bağlantısı gerektirmeden bilgisayarda çalışacak.
- Tüm veriler bilgisayara kurulacak **Apache CouchDB** üzerinde saklanacak.
- Uygulama açıldığında **tam ekran değil**, ekranın ortasında küçük/orta boy bir pencere olarak açılacak.

---

## 2. Teknik Altyapı

| Bileşen | Açıklama |
| :--- | :--- |
| **Uygulama Tipi** | Masaüstü, offline (.exe) |
| **Veritabanı** | Apache CouchDB (yerel kurulum, örnek adres: `http://127.0.0.1:5984`) |
| **Çalışma Modu** | İnternetsiz, tamamen yerel |
| **Pencere Modu** | Ortalanmış, sabit/küçük boyutlu pencere (tam ekran değil) |

---

## 3. Hesap (Account) ve Kullanıcı Yapısı

- Uygulama içinde **birden fazla "hesap" (mağaza/işletme)** oluşturulabilir. Örnek: "LC Waikiki", "Acme Yazılım".
- Her hesap, CouchDB içinde ayrı bir veri kümesi / veritabanı olarak açılır.
- Her hesabın altında **birden fazla kullanıcı** tanımlanabilir:
  - **Administrator** — hesap oluşturulduğunda otomatik olarak tanımlanan, ana / tam yetkili kullanıcı.
  - **Personel / Mağaza Çalışanı (Personal Mecer benzeri roller)** — sonradan eklenebilecek diğer kullanıcı rolleri.
- **Yeni açılan bir hesapta ilk giriş her zaman Administrator ile yapılır.**
- **Administrator kullanıcısının şifresi yoktur** — şifre alanı boş bırakılarak "Giriş" butonuna basıldığında giriş sağlanır.
- Diğer kullanıcılar için şifre belirlenip belirlenmeyeceği (personel kullanıcılarının şifreli olup olmayacağı) netleştirilmesi gereken bir noktadır (bkz. Bölüm 5 - Açık Noktalar).

---

## 4. İleride Yapılacaklar: Lisanslama / Key Sistemi

> Bu bölüm **ilerideki bir aşamada** hayata geçirilecektir; arayüz ve temel işlevler tamamlandıktan sonra ele alınacaktır. Şimdilik bilgi amaçlı not edilmiştir.

- Her hesabın kendine ait benzersiz bir **hesap ID**'si olacak.
- Bu hesap ID'sine bağlı olarak, hesap sahibine verilecek **lisans key**'leri üretilecek. Key süre planları:
  - **Aylık**
  - **3 Aylık**
  - **6 Aylık**
  - **1 Yıllık**
  - **Süresiz (Herzamanlık)**
- Kullanıcı, kendisine verilen key'i uygulamaya girerek hesabını aktif hale getirecek; uygulama bu key ile çalışacak.
- **Deneme (Test) Planı:** Uygulama ilk kullanıma başladığında, **300 satış hareketi** ile sınırlı, **ücretsiz** bir test planı sunulacak. Bu limit dolduğunda kullanıcıdan ücretli bir key (aylık/3 aylık/6 aylık/1 yıllık/süresiz) girmesi istenecek.

---

## 5. Açık Noktalar / Netleştirilmesi Gerekenler

Aşağıdaki konular geliştirme ilerledikçe netleştirilmelidir:

1. Personel / diğer kullanıcı rollerinde şifre zorunlu mu, yoksa Administrator gibi şifresiz mi olacak?
2. Hesap silindiğinde CouchDB'deki ilgili veritabanı da tamamen silinecek mi, yoksa arşivlenecek mi?
3. "İçe aktar" (Import) işlevinde hangi formatta veri (CSV, JSON, başka bir POS sisteminden export) desteklenecek?
4. Çoklu dil desteği hangi metinleri kapsayacak — sadece arayüz mü, raporlar/fişler de dahil mi?
5. **(İleride)** Key üretimi ve doğrulaması nasıl yapılacak? Uygulama offline çalıştığı için key'in yerel olarak (internete bağlanmadan) doğrulanabilmesi gerekiyor.
6. **(İleride)** 300 satış hareketlik test limiti dolduğunda uygulama ne yapacak — sadece uyarı mı verecek, yoksa satış işlemini tamamen kilitleyecek mi?
7. **(İleride)** Key süresi dolduğunda mevcut veriler erişilebilir kalacak mı, yoksa uygulama tamamen kilitlenecek mi?

---

## 6. Kapsam Dışı (Bu Aşamada Değerlendirilmeyecek)

- İnternet üzerinden senkronizasyon / bulut yedekleme (bu aşamada yok)
- Mobil uygulama desteği (bu aşamada yok, öncelik PC .exe)
- Ödeme sistemleri entegrasyonu (bu doküman kapsamında belirtilmemiştir)
