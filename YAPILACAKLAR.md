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
