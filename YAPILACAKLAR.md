# BİZNES HASAP — YAPILACAKLAR (27 Ekim 2026)

Bu liste kullanıcının istekleri + analizde çıkan eksiklerin birleşimidir.
Henüz uygulama yapılmadı; onaylanan maddeler sırayla yapılacak.

Kurallar (her işte): 398+ test yeşil kalmalı · tsc+build geçmeli · 4 dil (tr/tm/en/ru) ·
Excel başlıkları Türkmençe kalır · renderer'da Buffer yok · parolalar repoya girmez ·
küçük Türkçe commit'ler · APK sürüm kuralı (yama+1, versionCode+1).

---

## A. ACİL DÜZELTMELER (kullanıcı bildirdi)

### A1. PC EXE açılışta kasıyor / hemen açılmıyor
- Önce ölç: açılış profili (vite bundle, şifreleme init, sync, native modül).
- Muhtemel işler: bundle parçalama (C4 ile bağlantılı), ağır işleri açılış sonrasına erteleme,
  sync başlangıcını arka plana alma, gereksiz ilk yüklemeleri azaltma.
- Sonuç: gözle görülür hızlı açılış. Olmazsa Setup (kurulum) yolu da hazırlanır.
- Doğrulama: aynı makinede önce/sonra açılış süresi.

### A2. Ayarlar'daki .bhbak export/import ÇALIŞMIYOR
- Mevcut "Maglumatar" paneli (.bhbak zip/json) bozuk — önce hatasını bul ve düzelt
  (muhtemel: Buffer/Uint8Array, saveFileAs, lisans anahtarı türetme, büyük veri).
- Sonra kapsamı büyüt (B1 ile birleşir).

---

## B. YENİ "ATİYACLIK" (YEDEKLEME) BÖLÜMÜ + TAM YEDEK

### B1. Ayrı Atiyaclik bölümü (Sazlamalar'a yeni sekme)
- Export/import sadece buradan değil, ayrı bölümden de yapılabilsin.
- **İçerik seçimi kullanıcıda (checkbox'lar):**
  - [ ] Ürünler
  - [ ] Müşteriler
  - [ ] Kullanıcılar (hesap kullanıcıları + yetkiler)
  - [ ] Fatura geçmişi (satış/iptal/taslak)
  - [ ] Kassa geçmişi (gelir/gider, tahsilatlar)
  - [ ] Depder/borç defteri
  - [ ] Walýuta (döviz kurları)
  - [ ] Targow (satışçılar/bölgeler)
  - [ ] Ambar (depolar)
  - [ ] Ayarlar (firma/çek/yazıcı/genel ayarlar)
- Hepsi varsayılan işaretli; kullanıcı isterse azaltır.
- Export: seçilen kapsamlarla tek `.bhbak` dosyası (şifreli mevcut format korunur/genişletilir).
- Import: dosyadaki kapsamları göster → kullanıcı yine seçer → onay ekranı
  ("mevcut verilerin üzerine yazılacak / birleştirilecek" açıkça yazılır).
- Import'ta: validasyon, satır/belge hata raporu, kısmi başarı özeti (hangi kapsam kaç belge).
- PC + APK'da çalışmalı (Capacitor Filesystem ile Documents'a kayıt; Buffer YOK).
- APK'da import dosya seçici çalışır (input type=file).
- Lisans anahtarıyla şifreleme mevcut davranışı korunur; farklı hesaba import'ta
  hesap uyumsuzluğu açıkça uyarılır (yanlış mağazaya veri yazılmasın).

### B2. Satış / stok / borç Excel export'ları
- Mevcut exceljs motoruyla yeni export'lar:
  - Satış geçmişi (faturalar, tarih aralığı seçimli)
  - Stok hareketleri
  - Borç defteri / cari ekstre (müşteri bazlı)
  - Kassa hareketleri
- Türkmençe başlık sözleşmesi korunur; import roundtrip bozulmaz.

### B3. Aylık yedekleme hatırlatması
- Ayda bir kez "Yedekleyin" bildirimi (otomatik yedekleme YOK).
- Ayar: son yedek tarihi saklanır; 30 günü geçince açılışta tek bildirim
  (Atiyaclik bölümüne yönlendirir). 4 dilde.

---

## C. PERFORMANS

### C4. Bundle parçalama (code splitting)
- ~2.4 MB tek chunk'ı böl: modül bazlı lazy import (hasaplama, sazlamalar, lisans, exceljs, charts).
- Hedef: ilk açılışta yalnızca login+POS çekirdeği yüklensin; gerisi gerektiğinde.
- Vite manualChunks + React.lazy. Build chunk uyarısı kalkmalı.

---

## D. YENİ ÖZELLİKLER (kullanıcının onayladıkları)

### D1. APK içi güncelleme bildirimi
- Yeni sürüm çıkınca APK içinde bildirim + indirme bağlantısı (GitHub Release).
- PC auto-update altyapısıyla aynı release kaynağı.

### D2. Terezi (kantar) entegrasyonu
- `scale-status` şu an placeholder. Gerçek cihaz: seri port/USB kantar okuma,
  satış ekranında ağırlık alanına otomatik yazma. Önce cihaz modeli netleşir.

### D3. Sağlık raporu ekranı
- Tek panel: sync durumu, mirror pending sayısı, DB boyutu, son yedek tarihi,
  lisans gün sayısı, depolama uyarıları.

### D4. QR ile telefon eşleştirme
- PC'de hesap için QR (adres + db adı gömülü, parola QR'da maskeli/alternatif
  tek seferlik eşleştirme) → telefon kamerayla okutup otomatik bağlanır.
- Adres yazma derdini bitirir.

### D5. Promo performans raporları
- Kampanya bazında satış/kâr analizi (hasaplama'ya sekme).

---

## E. TASARIM / GÜVENLİK İŞLERİ

### E1. Görev A — iki cihaz aynı taslağı kabulü (CAS protokolü)
- Kabul kararı ortak otoritede compare-and-set; deterministik acceptance ID;
  yan etkiler (stok/bakiye/ledger) idempotent journal ile uygulanır.
- Önce çift-cihaz testi (aynı taslak iki cihazda), sonra çözüm.
- PC ve APK aynı protokolü kullanır. Offline-finalize politikasına karar verilir.

### E2. Görev B — credential vault
- Electron safeStorage (DPAPI) + Android Keystore'a taşıma; obfuscation kalır sadece geçicide.
- `server-admin.json` da buna dahil (şu an PC'de düz metin — taşınacak).
- Migration: eski kodlanmış veriyi oku → vault'a yaz → doğrula → eskisini sil.

### E3. Journal (yarım kalan işlem onarımı)
- Satış/iptal/tahsilat çok-belgeli yazımlarında journal kaydı:
  crash sonrası açılışta yarım kalan işlem tespit + güvenli onarım/tekrar.
- E1 ile aynı journal altyapısı kullanılabilir.

### E4. Mobil lisans cihaz kimliği iyileştirmesi
- Uninstall/reinstall'da kimlik değişmesin: `@capacitor/device` getId (ANDROID_ID)
  veya kalıcı hardware anchor ekle; Preferences UUID fallback kalsın.
- Böylece sil-kur sonrası rebind gerekmez.

### E5. Otomatik DB açma — admin'siz alternatif
- **Not: otomatik CouchDB hesap oluşturma ÖZELLİĞİ KALDIRILMAYACAK** (kullanıcı
  kararı). Bu madde yalnızca admin kimliğinin nasıl saklanacağıyla ilgilidir.
- CouchDB kuralı: yeni DB sadece admin açar (değişmez).
- Seçenekler: (a) mevcut PC-dosya yaklaşımı (E2 ile vault'a taşınır),
  (b) mağaza DB'lerini önceden adminle toplu açma → admin dosyasına gerek kalmaz.
- Kullanıcı hangisini isterse ona göre.

---

## F. TELEMETRİ (Sentry + PostHog canlı)
- Altyapı hazır; **kullanıcının ücretsiz hesap açması gerekir** (Sentry + PostHog).
- Anahtarlar gelince: `BIZNES_SENTRY_DSN` ve `VITE_POSTHOG_KEY` bağlanır.
- Varsayılan kapalı kalır; açık izinle çalışır; PII sızıntı denetimi yapılır.

---

## G. DAĞITIM / RELEASE

### G1. Release keystore + assembleRelease (açıklaması aşağıda, Sözlük §2)
- Yeni release keystore üret (kullanıcıya özel, güvenli saklanır, repoya GİRMEZ).
- `assembleRelease` ile imzalı APK; artık tüm dağıtımlar bu anahtarla.
- Mevcut debug-imzalı kurulumlara geçiş planı: veri yedeği + imza değişimi notu
  (debug→release imza farklı, üzerine kurulamaz; kullanıcıya önceden haber).

### G2. Windows kod imzalama
- OV/EV sertifika satın alınır (kullanıcı) → `electron:build:signed` → SmartScreen kalkar.
- İlk imzalı build + canlı updater testi.

### G3. Main'e merge + ilk GitHub Release
- Son kontroller tamamlanınca kullanıcı onayıyla.

### G4. Gerçek cihaz/donanım testleri
- Telefonda: lisans aktivasyonu, Documents export/import, sync, barkod kamera, BT yazıcı.
- PC'de: sandbox + lisans DLL + yazıcı + updater smoke testi.

---

## H. ÖNCEKİ KRİTİKLER (hâlâ açık)
1. Replikator belgeleri (`bim_market_pull/push`) yeni parolayla güncellenecek — şu an bozuk.
2. Uzak sunucu (`dbpanel.hmxagent.cfd`) parolası rotate edilecek (eski ifşa olmuş parola).
3. Uzak DB _security'ye biznes_app üyeliği (telefon online bağlanabilsin).

---

## SÖZLÜK (kullanıcının sorduğu kavramlar)

### 1. Selective sync sınırlılığı
"Son 3 ay" seçimi yalnız tamamlanmış faturaları filtreler; ürün/müşteri/kasa/borç
hepsi gelir; eski faturalar PC köprüsünden geri sızabilir. DB kesin küçülmez,
raporlar eksik dönemle yanlış olabilir. Tam filtreleme istersen ayrı iş gerekir.

### 2. Release keystore + assembleRelease
Debug imza her bilgisayarda farklıdır (o yüzden imza uyuşmazlığı yaşadık).
Release keystore = sana ait sabit imza dosyası; dağıtım APK'ları hep onunla imzalanır
ki sonraki sürümler üzerine kurulabilsin. Kaybolursa kullanıcılar güncelleyemez.
assembleRelease = Gradle'ın dağıtım derlemesi.

### 3. Mobil lisans uninstall
Telefondaki lisans cihaz kimliğine bağlı. Kimlik şu an uygulama deposunda UUID;
uygulama silinince kimlik de gider → yeniden kurulum "yeni cihaz" demek →
eski anahtar çalışmaz → Lisans Yönetici'den rebind gerekir. E4 bunu çözer.

### 4. Admin'siz otomatik DB açma olur mu?
CouchDB kuralı: yeni veritabanı yalnızca sunucu admini açar. biznes_app açamaz.
Seçenekler E5'te.

### 5. Telemetri neden anahtar bekliyor?
Sentry/PostHog harici servisler; ücretsiz hesap açıp DSN/API key almak gerekir.
Kod hazır, sadece anahtar bağlanacak.

### 6. Bundle (code splitting) ne demek?
Uygulamanın web kodu şu an tek büyük dosya (~2.4 MB) halinde paketleniyor;
açılışta hepsi yükleniyor → yavaş açılış/kasma. Code splitting = kodu modüllere
ayırıp yalnızca gerekenin gerektiğinde yüklenmesi. Açılış hızını artırır.

---

## VPS / DOMAIN DEĞİŞİKLİĞİ REHBERİ (özet — ayrı PDF: UZAK-SUNUCU-TASIMA.pdf)
1. Yeni VPS'e CouchDB kur (bind_address, admin, CORS, firewall 5984, HTTPS reverse proxy önerilir).
2. Eski sunucudan yedek al (`/_all_docs?include_docs=true` veya replikator push).
3. Yeni sunucuda: aynı kullanıcıları aç (biznes_app + admin), DB'leri oluştur,
   _security'leri ayarla, veriyi aktar.
4. Eski→yeni arasında geçici replikatorla son farkları eşitle.
5. PC uygulamasında: Bulut eşitleme → Online adresine yeni domain'i yaz.
   APK'da da aynı güncelleme. Replikator belgelerindeki hedef URL'leri değiştir.
6. Doğrula: yeni adreste okuma/yazma + sync yeşil + eski sunucuyu kapatmadan önce
   tüm cihazların geçtiğinden emin ol.

---

## UYGULAMA DURUMU — 27 Ekim 2026, ilk etap

**Baz:** `faz-c-d/altyapi-hazirlik`, `08dd3dd`. Main değil: bu dal belgedeki 398 testi ve APK v1.4.0 kaynaklarını içerir.

### Bu etapta uygulananlar
- **A2 (kod düzeltmesi):** gzip çıktısı okunmadan `writer.write/close` beklenmesi büyük yedeklerde backpressure kilidi üretiyordu. Önce kırılan büyük veri regresyon testiyle doğrulandı, sonra eşzamanlı akışla düzeltildi. V1, V2 ve eski JSON okuma korunur. Eksik başlık ve uzunluk uyuşmazlığı reddedilir. Gerçek PC/APK export/import kabul testi henüz yapılmadı; A2'nin tüm olası sorunları çözülmüş sayılmaz.
- **A1/C4 (kısmi):** POS, lisans ve tüm opsiyonel çalışma modülleri lazy yüklenir; yükleme görünümü 4 dilde mevcut çeviriyi kullanır. ExcelJS okuma/yazma motoru yalnızca işlem sırasında yüklenir. React/PouchDB vendor paketleri ayrılır. Büyük chunk uyarısı hâlâ var; C4 bitmedi. Windows açılış süresi ölçülmedi; A1 tamamlanmadı.
- **G1:** Mevcut release anahtarı kullanıcı tarafından sağlandı. Yeni anahtar üretilmedi. `.jks`, `.keystore` ve yerel imzalama properties dosyaları `.gitignore` kapsamına alındı.
- **APK kaynak adayı:** v1.4.1 / versionCode 31. APK henüz derlenmedi veya imzalanmadı; son üretilmiş APK v1.4.0 olarak kalır. Bu Linux ortamında Android SDK bulunamadı; imzalama parolası alınmadı.

### Doğrulama
- Başlangıç: 398/398 birim testi, TypeScript + Vite build başarılı.
- Sonuç: 402/402 birim testi (4 yeni regresyon), TypeScript + Vite build başarılı.
- Mevcut Playwright E2E: 27/27 geçti; Excel gerçek roundtrip ve Türkmençe başlık testi dahil.
- Windows native lisans/DLL testleri, fiziksel telefon/Documents testleri ve PC açılış ölçümü yapılmadı.
- Üretim derlemesi dört tarayıcı dilinde (tr/tk/en/ru) hatasız açıldı; girişte POS/ayarlar/raporlar/ExcelJS paketleri yüklenmedi. Bu kontrol Windows EXE/Android cihaz açılış ölçümü değildir.
- Yeni kullanıcı arayüzü veya tam yedek kapsamları bu etapta eklenmedi.

### Açık kalanlar
- **B1, B2, B3, D1–D5, E1–E5, F ve H:** Bu etapta uygulanmadı. B1 sıradaki öncelik.
- Donanım modeli, offline finalize politikası, E5 tercihi, servis anahtarları, sertifika ve sunucu erişimi gereken işler ayrıca netleştirilecek.
- G2/G3/G4 tamamlanmadı; main'e merge, release ve sunucu değişikliği yapılmadı.
- İlk GitHub gönderimi eski token ile `403 Resource not accessible by personal access token` verdi; bu nedenle önce yerel yama hazırlandı. Yeni token ile `fix/backup-startup-20261027` dalı oluşturuldu; bu kayıt ilk etap gönderiminin parçasıdır. Main'e merge ve release yapılmadı.


## UYGULAMA DURUMU — 27 Ekim 2026, ikinci etap

Bu bölüm önceki etap kaydını günceller; eski kayıt tarihçe olarak korunur. Çalışma dalı: `fix/backup-startup-20261027`. Main ve canlı sunucu değiştirilmedi.

| Madde | Durum | Uygulama / kalan kabul koşulu |
|---|---|---|
| A1 | Kısmi | Lazy ekranlar, ExcelJS'nin gecikmeli yüklenmesi ve vendor ayrımı var. Aynı Windows PC'de EXE açılış profili/önce-sonra ölçümü yapılmadı. |
| A2 | Kod düzeltildi, cihaz testi bekliyor | Büyük gzip yedek kilidi, eksik başlık/uzunluk denetimi, APK lisans anahtarı türetme ve hesaplar arası anahtar önbelleği ayrımı düzeltildi. |
| B1 | Uygulandı, fiziksel kabul bekliyor | Ayrı Atiyaclik sekmesi, varsayılan seçili 10 kapsam, zorunlu şifreli `.bhbak`, önizleme/tekrar seçim/açık onay, hesap kontrolü ve belge bazlı kısmi hata özeti. Hesap ekranındaki import da aynı yolu kullanır. |
| B2 | Kısmi | Satış, fatura satırlarından stok, borç/tahsilat ve kassa Excel'leri; tarih/müşteri filtreleri ve sabit Türkmençe başlıklar var. Tam tarihsel stok ledger'ı ve tarih-sonu cari bakiye üretilmez. |
| B3 | Uygulandı | Hesap başına son başarılı yedek tarihi, 30 gün eşiği, oturumda tek hatırlatma, Atiyaclik'e yönlendirme; otomatik yedek yok. |
| C4 | Kısmi | Modüller ayrıldı; ExcelJS ve giriş chunk'ında 500 kB uyarısı hâlâ var. Uyarı eşiği yükseltilerek gizlenmedi. |
| D1 | Uygulandı, canlı APK testi bekliyor | PC ile aynı GitHub release kaynağı, APK dosya sürümü üzerinden karşılaştırma, bildirim ve kullanıcının bastığı indirme bağlantısı. Sessiz indirme/kurma yok. |
| D2 | Bekliyor | Kantar marka/modeli, seri protokolü ve fiziksel cihaz yok; placeholder gerçek entegrasyon diye sunulmadı. |
| D3 | Uygulandı, cihaz testi bekliyor | Canlı sync durumları, pending mirror, son yedek, lisans günü, depolama kotası/uyarısı ve açıkça etiketli JSON veri boyutu tahmini. Bu tahmin fiziksel PouchDB dosya boyutu değildir. |
| D4 | Uygulanmadı | Güvenli tek kullanımlık eşleştirme için doğrulayan uç nokta/anahtar teslim protokolü gerekli. Parola QR'a konulmadı; maskeli parola çalışan eşleştirme diye sunulmadı. |
| D5 | Uygulanmadı | Mevcut faturada güvenilir kampanya kimliği/maliyet anlık görüntüsü yok. Eski satışları bugünkü kampanyaya bağlayan uydurma kâr raporu eklenmedi. |
| E1 | Uygulanmadı | Ortak kabul otoritesi ve offline-finalize kararı gerekli; yalnız yerel lock, çift cihaz CAS çözümü sayılmadı. |
| E2 | Kısmi | PC `server-admin.json` → main-process safeStorage kasası, geri okuyup doğruladıktan sonra kaynak silme. Diğer bağlantı kimlikleri ve Android Keystore geçişi henüz yok. |
| E3 | Uygulanmadı | Satış/iptal/tahsilat crash-recovery journal'ı E1 ile birlikte tasarlanmalı. Mevcut çok-belgeli finansal akışlar yeni, doğrulanmamış journal ile değiştirilmedi. |
| E4 | Yeni kurulum kodu uygulandı | Yeni APK kimliği `Device.getId()` anchor'ı; UUID fallback ve mevcut lisansı bozmamak için eski UUID korunur. Eski UUID lisansının sil-kur sonrası bir defalık rebind gereksinimi tamamen giderilmiş değildir. |
| E5 | Özellik korundu / kısmi | Otomatik CouchDB oluşturma kaldırılmadı. Mevcut PC admin dosyası güvenli kasaya taşınır; önceden toplu DB açma tercih edilmedi. |
| F | Bekliyor | Sentry/PostHog hesap/anahtarları ve açık kullanıcı izni olmadan canlıya bağlanmadı; varsayılan kapalı. |
| G1 | İmzalama hazırlığı var, release APK yok | Mevcut JKS kullanılacak; yeni release anahtarı üretilmedi. Dış properties/env ile Linux/Windows imzalama yolu hazır. Alias ve iki parola olmadan imzalı release üretilemez. |
| G2 | Bekliyor | Kullanıcının Windows OV/EV sertifikası gerekli. Sertifika SmartScreen itibarını tek başına garanti etmez. |
| G3 | Onay bekliyor | Feature dalına kod gönderilir; main merge ve GitHub Release yapılmaz. |
| G4 | Bekliyor | Fiziksel PC/telefon, lisans DLL, Documents, kamera, yazıcı, updater kabul testi yapılmadı. |
| H1–H3 | Bekliyor | Replikator, uzak sunucu parola rotasyonu ve `_security` için yetkili sunucu erişimi gerekir. Canlı sunucuya müdahale edilmedi. |

### Yedek geri yükleme sözleşmesi
- Yalnızca açık allowlist'teki iş belgeleri taşınır. Lisans, cihaz anchor'ı, bağlantı parolası, crypto metadata, journal ve tasarım belgeleri aktarılmaz.
- Kaynak revizyonlar/tombstone'lar uygulanmaz. Seçilen geçerli kayıtlar ID bazında birleştirilir; diğer kayıtlar silinmez, fatura yan etkileri yeniden oynatılmaz.
- Güncel yedeklerde ortak lisans/mağaza bağı kontrol edilir. Yerel PC/telefon UUID'sinin farklı olması tek başına aynı mağazanın geri yüklenmesini engellemez. Eski hesapsız JSON açık risk onayı ister.
- Başka lisansın şifreli yedeği önce şifre çözmede reddedilebilir; JSON içi hesap kontrolü şifre çözme yerine geçmez.
- Geri yükleme sırasında aktif sync kalıcı olarak duraklatılır. Sonuç incelendikten sonra Bulut Eşitleme'den kullanıcı yeniden açmalıdır; yarım import otomatik olarak sunucuya yayılmaz.
- Kapsamlar arası referansları korumak için ilişkili ürün/müşteri/fatura belgeleri birlikte seçilmelidir. Bu, veritabanının atomik disk imajı veya çok-belgeli transaction değildir.
- Fatura stok Excel'i manuel stok ayarlarını, geçmiş ikinci birim katsayısını veya bileşen tüketimini geriye dönük uydurmaz. Borç çıktısındaki kalan tutar günceldir; tarih aralığı sonundaki bakiye değildir. Para birimleri birleştirilmez.

### Doğrulama ve dağıtım
Ayrıntılı komutlar, sonuçlar ve kalan gereksinimler: `UYGULAMA-RAPORU-2026-10-27.md`.
Android kaynak adayı: **v1.4.2 / versionCode 32**. Bu değişiklikler imzalı release veya fiziksel cihaz onayı anlamına gelmez.
