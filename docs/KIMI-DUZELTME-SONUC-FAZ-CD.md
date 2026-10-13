# Kimi Code düzeltmeleri — Faz C / D sonuç ve yeniden inceleme

## Repo, dal, kaynak ve teslim

- Repo: https://github.com/pespaloglan-droid/bizneshasapdev
- **Çalışma dalı: `faz-c-d/altyapi-hazirlik`; main değil.**
- Dal: https://github.com/pespaloglan-droid/bizneshasapdev/tree/faz-c-d/altyapi-hazirlik
- Başlangıç commit'i: `3005378bfb1c3f15e7910890f895b02cdaa3c609`.
- Test edilen ve GitHub'a gönderildiği uzak ref üzerinden doğrulanan düzeltme kaynağı: `c722aedfcd907ad9578f0c00c36ce2331b3e4066`.
- Bu raporun belge commit'i yukarıdaki kaynak commit'inden sonra gelir.
- `main`: `a229c6f507ada4a088839df1d76807d0723c02db`; değişmedi.
- Çalışma ortamı yenilendiğinde gönderilmemiş dosyalar oturum kayıtlarından geri yüklendi. 21 küçük düzeltme commiti yeniden oluşturuldu; **eski yerel commit ID'leri yerine aşağıdaki gerçek yeni ID'ler kullanılmalı**. Tüm testler yeniden çalıştırıldı.
- İlk GitHub MCP tokenı yazmada 403 verdi. Kullanıcının GitHub CLI cihaz onayından sonra normal fast-forward push yapıldı. Force-push, release, main merge ve canlı CouchDB işlemi yapılmadı.
- **Yeni APK üretilmedi.** Repodaki v1.3.8 önceki kaynak snapshot'ına aittir; bu düzeltmeleri içeren APK olarak değerlendirilmemeli.

## Yeniden çalıştırılmış doğrulama

| Kontrol | Sonuç |
| --- | --- |
| `npx tsc --noEmit` | Başarılı |
| `npm test -- --run` | **31 dosya / 346 test geçti**; başlangıç 308 |
| `npm run build` | Başarılı; >500 kB Vite chunk uyarısı hata değil |
| Chromium ile `npm run test:e2e` | **23 test geçti**, 50.6 saniye |
| Electron main/preload `node --check` | Başarılı |
| PowerShell parser + çalışma zamanı test | Başarılı; ağ fonksiyonları mock edildi, canlı sunucu kullanılmadı |
| Bilinen eski credential değerleriyle güncel takipli küçük metin dosyası taraması | **0 eşleşme**; geçmiş/binary/canlı parola kapsam dışı |

Son kaynak yeniden TypeScript/unit/build/E2E kontrolünden geçti. Önceki oturumda her düzeltme adımında da tür kontrolü, test ve build yapılmıştı. Loglar yerel çalışma ortamında `kimi-fixes/recovery-final-*` altında tutuldu. Dört dil (TR/TM/EN/RU) eklendi; sabit TM Excel başlıkları korunuyor. Geçen testler Windows cihaz/DLL/gerçek CouchDB dağıtımı veya finansal ACID garantisi değildir.

## Maddeler ve uygulanan çözüm

### P0 — zorunlu düzeltmeler

- **P0-1 / serverOnly:** sync durdurulup etkin yerel PouchDB destroy/recreate edilir; sunucuya toplu silme tombstone'u gitmez. Cihaza özel `license` korunur. Diğer şifreli/plain fiziksel kova rastgele silinmez. Gerçek PouchDB testinde uzak ürün/müşteri ve yerel lisans korunur.
- **P0-2 / birincil yazım:** satış/ürün/müşteri asıl yazımı reddedilirse hata çağırana iletilir. Fatura olmadan stok/bakiye/başarı/sepette temizleme çalışmaz. Kart onayı alınmış ama fatura kaydedilmemiş durum ayrıca bildirilir: ödeme kontrol edilmeden tekrar çekim yapılmamalı.
- **P0-3 / çift çağrı:** buton/F5/kart ortak in-flight guard; taslak ID bazlı onay koruması; deterministik taslak ledger ID ve UUID'li fatura ID. Testlerde çift çağrı tek fatura/tek stok etkisi verir.
- **P0-4 / provisioning:** sabit admin credential kaldırıldı. AdminUser parametresi, SecureString veya `Read-Host -AsSecureString` çalışma zamanı parola girişi, UTF-8 Basic ve JSON ile `_security`. App kullanıcı DB üyesidir, admin değildir. Gerçek parser ve mock HEAD çalışma testi canlı CouchDB olmadan geçti.
- **P0-5 / credential temizliği:** güncel kaynak/belge/test örnekleri redakte edildi. Uyumluluk anahtarı `bh_sync_config` sır sanılıp değiştirilmedi. Eski gerçek credential değerleri yeni raporlara kopyalanmadı. Git geçmişi ve dağıtılmış APK temizlenmiş sayılmaz.

### P1 — veri bütünlüğü ve güvenlik

- **P1-1 / tahsilatlı fatura iptali:** güncel fatura/tahsilat DB snapshot'ı ham gövde doğrulamasıyla okunur. Tahsilat formunda açık fatura bağlantısı vardır. 100 borç → 40 faturaya bağlı tahsilat → iptal, yalnız kalan 60'ı tersler ve bakiye 0 olur. Gerçek tahsilat silinmez; otomatik nakit iadesi yapılmaz. Aynı müşterinin bağlantısız legacy tahsilatı, yanlış müşteri bağlantısı, fazla/uyumsuz net tahsilat veya bozuk snapshot varsa **iptal durur**. Müşterinin toplam bakiyesinden fatura borcu tahmin edilmez. Bozuk tutar sayıya/sıfıra dönüştürülmez.
- **P1-2 / selective bridge:** selector ve bridge ortak takvim cutoff'ı kullanır. Yeni PC aynasında `bhInvoiceState.version=1` taslak/borç alanlarını korur. Eski, kesin tamamlanmış nakit/kart aynası native fatura olarak yeniden doğmaz. Taslak/iptal/credit ve niteliği belirsiz eski PC aynaları korunur. **Legacy PC formatı için katı üç aylık sınır iddia edilmez**: taslak kaybetmemek için güvenli istisna vardır. Yerel geçmiş silinmez; push tamdır. ID lookup exact yapılarak `p1`/`p10` prefix-collision engellendi.
- **P1-3 / conflict:** LWW/manual gövde doğrulanmadan yazılmaz ve kaybeden dallar silinmez. Bozuk kazanan incelemeye bırakılır; bridge doğrulama reddinde/inceleme bekleyen conflict'te rastgele kazananı import etmez.
- **P1-4 / yan etkiler:** stok/bakiye en güncel revision'dan delta ile hesaplanır. UI yalnız başarıyla yazılan entity'yi günceller. Fatura kaydı sonrası başarısız stok/bakiye kalemleri sayılır ve görünür uyarılır; taslak da birincil yazımı bekler. Aynı ürünün farklı birimlerdeki tüm sepet satırları baz stoğa toplanır. **Çok belgeli işlem ACID değildir; kalıcı journal/otomatik repair yoktur.** `bulkDocs` da atomik değildir.
- **P1-5 / PC aynası:** birincil başarı ile mirror başarısızlığı ayrı raporlanır. `_local/pc-mirror-pending` cihaz-yerel ID kuyruğu replike olmaz ve sır/gövde taşımaz. Kalıcı workspace uyarısı vardır; sonraki başarılı açık mirror ilgili işareti temizler. Kuyruk yazımı da başarısızsa session uyarısı sessizce yeşile dönmez. Bridge kısmi batch hatasını başarı gibi saymaz. **Otomatik reconciliation yapılmadı; listede izin verilen uyarı alternatifi uygulandı.**
- **P1-6 / saklama ve HTTP:** bağlantı anahtarları, legacy sync config ve eski hesap URL'leri yeni biçime migre edilir. Adres alanları userinfo içermez; credential/orijinal girdi ayrı kodlanmış alan/anahtarda tutulur. Unicode, percent-encoding ve düzenlenmekte olan eksik URL korunur; yan panel kimliksiz adres gösterir. Online HTTP ve cihazda saklama için dört dilde görünür uyarı vardır. **Base64/obfuscation şifreleme değildir; XSS/cihaz erişimi sahibi geri çözebilir.** Electron safeStorage / Android Keystore ayrı görevdir. Eski disk/backup/Git kopyaları güvenli silinmiş sayılmaz.

### P2 — orta öncelik

- **P2-1 / tombstone recreation:** başlangıç kaynakta mevcut son-rev davranışı gerçek PouchDB tekil/batch testleriyle doğrulandı. Silinen ürün aynı ID/barkod/sıfırlı SKU ve tüm alanlarıyla yeniden yaratılır; gereksiz üretim değişikliği yapılmadı.
- **P2-2 / PC silme:** eşleşen PC ID'leri `allDocs({keys})` ile kontrol edilir. Yalnız `value.deleted === true` kanıtı native tombstone üretir. **Aynanın yokluğu silme değildir**, selective cihazda indirilmemiş kaydı silmez. Silme/yazım hatası bridge'e iletilir.
- **P2-3 / hesap yarışı:** generation token, sahip hesap cleanup'ı, stale callback kontrolü, unmount bekleyen girişimi iptali ve store bazlı bridge promise. Geç tamamlanan eski hesap yeni sync'i öldüremez.
- **P2-4 / para ve legacy kategori:** enum dışı string aynen korunur; `other` dönüşümü yapılmaz. Para save/delete/transfer asıl sonuç bekler; birincil hata UI/bakiye başarısı gibi davranmaz. Form async submit guard vardır. Birincil tahsilat yazılmış ama bakiye etkisi başarısızsa yeni ID ile tekrar tahsilat oluşturulmaz; uyarı verilir. Transfer kısmi başarıyı bildirir, atomik değildir.
- **P2-5 / IPC-lisans:** yalnız beklenen ana frame/webContents IPC kullanır. Seçili lisans pencere sahibine bağlanır; başka hesap/pencereden derive-key/guard engellenir, meşru hesap seçimi kapanmaz. Clipboard temel lisans guard, scale stock guard altında. URL credential ve Basic header dev/prod loglarından redakte edilir. Helper ve gerçek main handler kodu mock Electron/native ortamında test edildi.

### P3 — küçük maddeler

- Başarısız kalıcı fatura silme UI'dan kaldırılmaz; yalnız başarılı ID çağırana bildirilir. False/throw kayıtlar seçili kalır; görünür hata ve busy temizliği vardır.
- Tek okunamayan conflict rev diğer kayıtları gizlemez. Eksik rev placeholder'ı korunur; o kaydın destructive çözümü durur.
- Tombstone `deletedAt` dikkate alınır.
- Ana renderer açıkça `sandbox: true`; preload yalnız Electron API kullanır. Gerçek Windows DLL/cihaz smoke testi hâlâ gerekli.
- VERSION.md'de 1.3.2–1.3.5 satırları mevcut olarak teyit edildi; tarih/özellik uydurulmadı.

## 21 kaynak commiti

Bu tablodaki ID'ler kurtarma sonrası GitHub'a gönderilen gerçek commitlerdir:

| Commit | İş |
| --- | --- |
| [`347c2e6`](https://github.com/pespaloglan-droid/bizneshasapdev/commit/347c2e6) | P0-1: serverOnly yerel resetinde uzak tombstone ve veri kaybını önle |
| [`1b1ab69`](https://github.com/pespaloglan-droid/bizneshasapdev/commit/1b1ab69) | P0-2: birincil yazım reddinde satış stok ve bakiye etkilerini durdur |
| [`7c3a8f2`](https://github.com/pespaloglan-droid/bizneshasapdev/commit/7c3a8f2) | P0-3: buton F5 ve taslak onayında ortak in-flight koruması ekle |
| [`47eaab6`](https://github.com/pespaloglan-droid/bizneshasapdev/commit/47eaab6) | P0-4: sabit admin bilgilerini kaldır SecureString runtime girdisi kullan |
| [`2370fbd`](https://github.com/pespaloglan-droid/bizneshasapdev/commit/2370fbd) | P0-5: güncel kaynak belge ve testlerde eski credential değerlerini redakte et |
| [`caa719f`](https://github.com/pespaloglan-droid/bizneshasapdev/commit/caa719f) | P1-3: conflict yazımlarını doğrula bozuk kazananın dallarını koru |
| [`a383ed2`](https://github.com/pespaloglan-droid/bizneshasapdev/commit/a383ed2) | P1-4: stok bakiye ve taslak yazımlarını DB-first yap kısmi hataları bildir |
| [`06c705a`](https://github.com/pespaloglan-droid/bizneshasapdev/commit/06c705a) | P1-5: PC ayna hatalarını ayrı say ve yerel kalıcı durumla görünür bildir |
| [`0b78716`](https://github.com/pespaloglan-droid/bizneshasapdev/commit/0b78716) | P2-3: hesap değişiminde stale bağlantı girişimini ve çapraz köprü yarışını durdur |
| [`e0c5b2e`](https://github.com/pespaloglan-droid/bizneshasapdev/commit/e0c5b2e) | P2-4: para yazımlarını bekle legacy kategorileri koru ve hataları bildir |
| [`a9976de`](https://github.com/pespaloglan-droid/bizneshasapdev/commit/a9976de) | P1-1: tahsilatı faturaya bağla iptalde yalnız kalan borcu tersle |
| [`9c59098`](https://github.com/pespaloglan-droid/bizneshasapdev/commit/9c59098) | P1-2: PC köprüsünde kesin geçmişi filtrele taslak legacy ve borcu koru |
| [`b8f18d5`](https://github.com/pespaloglan-droid/bizneshasapdev/commit/b8f18d5) | P2-1: mevcut tombstone yeniden yaratmayı tekil ve batch regresyonla doğrula |
| [`2979a9e`](https://github.com/pespaloglan-droid/bizneshasapdev/commit/2979a9e) | P2-2: PC tombstone kanıtını aktar eksik aynadan silme çıkarma |
| [`f458c2a`](https://github.com/pespaloglan-droid/bizneshasapdev/commit/f458c2a) | P1-6: credential kaydını migre et kısa vadeli kodlama ve HTTP uyarısı ekle |
| [`9c527e3`](https://github.com/pespaloglan-droid/bizneshasapdev/commit/9c527e3) | P2-5: IPC lisans bağlamını güvenilir pencereye bağla Basic loglarını maskele |
| [`010a984`](https://github.com/pespaloglan-droid/bizneshasapdev/commit/010a984) | P3: okunamayan conflict kaydını izole et eksik dallarda çözümü durdur |
| [`9eef21b`](https://github.com/pespaloglan-droid/bizneshasapdev/commit/9eef21b) | P3: başarısız fatura silmelerini listede ve seçili tut görünür bildir |
| [`899b331`](https://github.com/pespaloglan-droid/bizneshasapdev/commit/899b331) | P1-6: eski hesap URL saklamasını da kodla ve panelde kimliksiz göster |
| [`e28b454`](https://github.com/pespaloglan-droid/bizneshasapdev/commit/e28b454) | P1-4: aynı ürünün çok birimli sepet satırlarını stok etkisinde topla |
| [`c722aed`](https://github.com/pespaloglan-droid/bizneshasapdev/commit/c722aed) | P1-1: iptal öncesi ham mali snapshotı doğrula bozuk tutarı sıfıra çevirme |

## Canlı CouchDB parola değişimi — yapılmadı

Bu çalışma kaynak kodu/provisioning girdisini düzeltti; canlı admin/app parolasını değiştirmedi ve `_security`'yi gerçek sunucuda düzenlemedi.

İnsan/ops bakım planı: güvenli kanal üzerinden yeni güçlü parolaları üret; admin ve uygulama üyeliğini ayrı doğrula; yeni credential ile DB okuma/yazma testini bakım planında yap; kayıtlı cihaz bağlantılarını güncelle; eski credential erişiminin iptalini doğrula. Cihazların offline/senkron/backup durumunu yönet. Parolaları **sohbete, MD'ye, commit mesajına, koda veya loga yazma**. Tarihçe temizliği/binary inceleme gerekiyorsa ayrı kontrollü plan ve ekip onayı kullan. Burada history rewrite/force-push uygulanmadı.

## Kalan sınırlar / ops / APK

1. Çok-belgeli satış/tahsilat/iptal crash sonrası otomatik repair sağlamaz. Farklı cihazların aynı müşteriye eşzamanlı/offline tahsilat/iptali ve LWW bakiye kaybı için dağıtık idempotency/append-only hareket tasarımı ayrıca incelenmeli.
2. Legacy receipt association/borç durumu kesin değilse otomatik iptal ve tarih filtresi yapılmaz. Bağlantısız tahsilat elle ilgili faturaya bağlanmalı; gerçek para iadesi ayrıca kaydedilmeli.
3. Otomatik PC mirror reconciliation yoktur; yalnız tespit edilmiş başarısız aynalar izlenir. Eski uyumsuzluğu kendiliğinden tarama garantisi yoktur. Gerçek iki cihazdaki delete/recreate ve zaman damgasız silme yarışları ayrıca denenmeli.
4. Kodlanmış credential OS secure vault değildir. Electron safeStorage/Android Keystore ve mevcut kayıtların native kasaya taşınması ayrı güvenlik görevidir. Yerel kullanıcı parolaları gibi diğer legacy güvenlik alanları bu CouchDB obfuscation değişikliğinden şifrelenmiş sayılmaz.
5. Gerçek Windows uygulaması + lisans DLL + sandbox/preload + yazıcı/terazi/updater smoke testi bekliyor. Unit/mock/build bunu kanıtlamaz; Windows sertifika ve canlı telemetri anahtarları eklenmedi.
6. Mevcut v1.3.8 test APK önceki snapshot'tır; yeni kaynak düzeltmelerini içermez. Eski v1.3.7 ile imza farklılığı vardır. Eski geçerli keystore olmadan mevcut kurulum üzerine veri kaybetmeden güncelleme garantisi verilemez. Uygulama kaldırma/veri temizleme yapılmadı/önerilmedi. Yeni APK için imza/yükseltme ve test cihazı planı gerekir.
7. Güncel metin taraması eski commit, disk yedeği ve dağıtılmış APK credential kopyalarını temizlemez. Canlı rotation ve eski erişimi iptal etme insan/ops görevidir.
8. Main merge, yeni release, force-push, canlı provisioning veya finansal kullanıcı verisi silme yapılmadı.

## Kimi Code'a yeniden inceleme

Güncel dal HEAD'ini, bu sonuç raporunu ve testleri birlikte incele. Eski devir belgesinin APK snapshot'ını yeni dağıtım gibi değerlendirme. Çoklu faturaya tahsilat dağılımı, tahsilat edit/delete etkileri, crash arasındaki yarım delta, cihazlar arası idempotency, PC metadata kaybı, tombstone-recreate yarışları, obfuscation'ın secure vault sanılmaması ve gerçek Windows sandbox başlangıcını yeniden üret. Geçen testlerden hareketle açık sınırları kapanmış sayma.
