# DAĞITIM REHBERİ — Kim Nereye Hangi Dosya

> Bu dosya, uygulamanın **müşteriye** ve **senin bilgisayarına** giden dosyaları
> net ayırır. Kritik kural: **LisansYonetici (key üretici) ASLA müşteriye gitmez.**

---

## 1. SANA (admin bilgisayarı) — ASLA MÜŞTERİYE GÖNDERME

| Dosya | Konum | Ne işe yarar |
|-------|-------|--------------|
| **LisansYonetici.exe** | `admin-gui\dist\win-unpacked\LisansYonetici.exe` | Key ve kök kod üretir |
| `secret.key` | `license-native\admin\secret.key` | **Tüm lisansların ana anahtarı** |
| `issued.json` | `%APPDATA%\lisans-yonetici\issued.json` | Key kayıtların |

> ⚠️ **`secret.key` kaybolursa tüm mevcut lisanslar geçersiz olur.**
> Yedekle: `admin-gui\dist\win-unpacked\resources\license-native\admin\secret.key`
> Bu dosyayı USB/bulut dışında güvenli bir yere kopyala.

---

## 2. MÜŞTERİYE — sadece kurulum dosyası

| Dosya | Konum |
|-------|-------|
| **Biznes Hasap Setup 1.150.0.exe** | `dist-v2\Biznes Hasap Setup 1.150.0.exe` |

Bu tek dosya müşteride kurulur. İçinde **admin anahtarı yoktur** —
`release-check` bunu her build'de otomatik doğrular.

---

## 3. LİSANS SATIŞ AKIŞI (uygulama adımı)

```
1. Müşteriye kurulum dosyasını gönder (WhatsApp/Telegram ile olur)
2. Müşteri kurar ve açar → HESAP EKRANI gelir
3. Müşteri "Yeni Hesap Oluştur" → hesap adı yazar
4. Giriş yapar → LİSANS EKRANI açılır
5. Müşteri iki kodu sana gönderir:
      • Hesap ID   : XXXX-XXXX-XXXX-XX
      • İstek Kodu : XXXXXXXXXXXXXXXXXXXXXXXX (24 karakter)
6. SEN: LisansYonetici.exe'yi aç
      • Parola ile kilidi aç
      • PC veya APK seç
      • İstek kodunu yapıştır (hesap adı/not alanına müşteri adını yaz)
      • Süreyi seç (1/3/6/12 ay veya özel gün)
      • [KEY OLUŞTUR]
7. Çıkan sonuç:
      • İLK KEY ise → KÖK KOD + LİSANS ANAHTARI (ikisini de gönder)
      • Sonraki key  → sadece LİSANS ANAHTARI
8. Müşteri: Lisans ekranına yapıştırır → Aktifleştirir → uygulama açılır
```

### Yenileme (aynı hesap, yeni süre)
Müşteri key ister → aynı hesabın **yeni istek kodu** ekranda görünür →
sen tekrar key üretirsin → **kök kod gerekmez**, sadece anahtar verirsin.

### Cihaz değişimi / kök kod kayboldu
`LisansYonetici` → **Kök Kod Üret** aracı → hesap ID'yi gir →
kök kod yeniden üretilir (her zaman aynı kod çıkar).

---

## 4. HERHANGİ BİR ŞEY VERMEDEN ÖNCE KENDİNİ KONTROL ET

```bash
npm run release:check
```
Sonuç `0 hata, 0 uyarı` olmalı. Bu komut:
- Müşteri paketinde `secret.key` / `issued.json` / `license-core.js` sızmadığını doğrular
- Admin aracında `secret.key` **olduğunu** doğrular (yoksa key üretemezsin)
- Native kodda log/ağ çıktısı olmadığını doğrular

> Sıfır hata değilse **o dosyayı müşteriye gönderme.**

---

## 5. KISA YOL (masaüstü)

```bash
npm run shortcuts
```
Her iki exe için masaüstü kısayolu oluşturur/günceller.

---

## 6. GÜVENLİK NOTLARI

- `secret.key` = tüm lisansların anahtarı. Kaybolursa/yayınlanırsa tüm mevcut
  lisansları yeniden üretmen gerekir.
- `LisansYonetici.exe` müşteride olursa müşteri **kendine key üretebilir**.
  Bu yüzden sadece sende kalır.
- Anahtar üretimi **internetsiz** bir makinede yapılmalıdır (Türkmenistan
  koşulları zaten buna uygun).