# Katalog ve PC mirror ek düzeltmeleri

## Kapsam ve dal

- Repo: https://github.com/pespaloglan-droid/bizneshasapdev
- Hedef dal: `faz-c-d/altyapi-hazirlik`; `main` değiştirilmez.
- Başlangıç: `60c653566203ff13b924dd65356868b1ebee6ca3`.
- Yerel çalışma dalı: `fixes/catalog-mirror-retry`; push hedefi yukarıdaki Faz C/D dalıdır.
- Bu çalışma yeni APK, release, canlı CouchDB parola değişimi veya geçmiş temizliği yapmaz.

## 1. Katalog primary yazımları

Ürün ve müşteri ekleme/düzenleme/silme artık DB sonucu beklenmeden UI listesini değiştirmez. Hata ve silme işleminin `false` sonucu kullanıcıya bildirilir; başarısız işlem başarı sayılmaz. Aynı kayıt için aynı cihazda eşzamanlı katalog işlemi korunur.

Ürün ve müşteri formları başarısızlıkta kapanmaz; girilen değerler korunur. Bekleyen form kayıtlarında çift gönderim engellenir. Toplu düzenlemede tüm sonuçlar beklenir; kısmi hata formu açık tutar ve başarılı kayıtlar yeniden denemede mevcut props ile karşılaştırılır. Excel fallback yolu da bekler ve başarısız satırları sayar; TM Excel başlıkları değiştirilmedi.

Hızlı müşteri ekleme asenkron oldu: primary kayıt başarısızsa müşteri seçilmez. Müşteri oluşturma sürerken para formunun gönderimi engellenir. Kompozisyon fiyat değişimi de ürün primary sonucunu bekler; fiyat hatasında başarı bildirimi ve kapanış yapılmaz. Kompozisyon belgesi ve fiyat güncellemesi çok-belgeli atomik işlem değildir; kompozisyon kaydedilip fiyat kaydedilemeyebilir.

Mirror hatası, başarıyla kaydedilmiş primary kaydı başarısız saymaz; ayrıca görünür mirror uyarısı kullanılır. Katalog/yeniden deneme mesajları TR/TM/EN/RU dillerinde mevcuttur.

## 2. Kontrollü yerel PC mirror retry

- `_local/pc-mirror-pending` replikasyona katılmaz. Kuyrukta belge ID'leri ve silme için zaman kanıtı vardır; entity gövdesi/parola yoktur.
- Otomatik retry 1, 5, 30 saniye beklemelerle en çok üç tur yapar. Başarısızlık eventleri kendi bütçesini sıfırlamaz. Online geri dönüş ve manuel retry yeni sınırlı döngü başlatır.
- İşlem yerel PC-format belgesini yazar; çevrimdışıyken de çalışabilir. Bu, uzaktaki PC/CouchDB'ye teslimat garantisi değildir; ağ replikasyonu ayrı süreçtir.
- Hesap/store başına tek retry batch'i ve belge başına normal mirror/retry ortak yazım kuyruğu vardır.
- Retry entity snapshotını oynatmaz; ID ile güncel native belgeyi tekrar okur ve doğrular. Yazım sırasında native revision değişirse ID kuyrukta kalır.
- Native `syncedAt` mirror `updatedAt` olarak korunur; retry zamanı sahte bir yeni kullanıcı düzenlemesi sayılmaz.
- Daha yeni PC timestamp'i, native/PC revision conflict'i veya PC tombstone'u varsa otomatik ezme/diriltme yapılmaz. Kayıt inceleme için kuyrukta ve uyarıda kalır. Manuel retry bu korumaları bypass etmez.
- Pending native kayıtlar PC→native köprüsü ve PC tombstone importu tarafından ezilmez/silinmez.
- Ürün, müşteri ve kalıcı fatura silme işlemi primary başarıdan sonra PC mirror tombstone aktarımını dener. Hata primary silmeyi geri almaz; retry kuyruğu görünür kalır.
- Native yokluğu silme kanıtı değildir. Gerçek native tombstone, yerel silme zamanı ve güncel revision doğrulanmadan PC mirror silinmez. Daha yeni/çakışmalı/bilinmeyen zamanlı PC kaydı silinmez.
- Eski kuyruktaki tombstone için silme zamanı yoksa güvenli varsayım yapılmaz; inceleme gerekir.
- Queue okuma hatası boş kuyruk kabul edilmez. Queue yazılamıyorsa görünür uyarı korunur; disk/şifreleme hatası retry ile sihirli şekilde giderilmiş sayılmaz.
- Unmount/hesap değişimi bekleyen zamanlayıcıyı durdurur. Başlamış DB işlemi geri alınmaz; kendi sabit store anahtarında çalışır.

### Bilinçli sınırlar

Bu kod dağıtık kilit veya tam transactional outbox değildir. Native yazımı ve `_local` marker farklı işlemlerdir; aralarında süreç kapanırsa marker eksik kalabilir. İki cihaz veya iki farklı uygulama süreci için tam ACID/idempotency garantisi verilmez. PC/native çapraz şema veri incelemesi otomatik retry tarafından zorla çözülmez; uyarı kaybolmadan operatör incelemesi gerekir. Yerel silme zamanları cihaz saatine bağlıdır; revision kontrolü ve fail-closed inceleme tercih edilir.

## Test ve inceleme

- Yeni unit testleri: `tests/hooks/catalogPersistence.test.tsx`, `tests/db/mirrorRetry.test.ts`.
- Yeni gerçek PouchDB/Chromium testleri: primary form hatası ve başarılı tekrar, otomatik retry ile güncel fiyat, silme retry/tombstone, eksik native'nin korunması, pending native'nin PC köprüsünden korunması.
- Var olan satış, çift tık, kredi iptali, seçici history, conflict, tombstone recreate ve Excel roundtrip testleri korunur.
- Test edilen son source commit'i: `57cdbc05acb554206b4b9c517f45dd3158eb75b3`.
- `npx vitest run`: **34 dosya, 376 test geçti** (önceki 346 + 30 yeni regresyon).
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=... npm run test:e2e`: **27 test geçti** (önceki 23 + 4 yeni senaryo).
- `npx tsc --noEmit`: geçti. `npm run build`: geçti; mevcut büyük bundle uyarısı sürüyor.
- `git diff --check`: geçti. Main uzak ref'i değişmedi: `a229c6f507ada4a088839df1d76807d0723c02db`.
- Yerel commitler: `c008a3c` katalog; `e5051db` retry/tombstone; `57cdbc0` takip hatası uyarısı ve dört UI regresyonu.
- Çalışma ortamı yenilendiği için dört commit oturumdaki ZIP yedeğinden geri yüklendi. Her patch için stable patch-id birebir eşleşti; yukarıdaki source ID geri yüklenen gerçek committir. Önceki yerel test kanıtı aynı kaynak içeriğine aittir. Yeni GitHub CI sonucu ayrıca doğrulanacaktır; yerel test başarısı GitHub CI başarısı olarak sunulmaz.

## Ayrı görev A: iki cihazın aynı taslağı kabulü

**Durum: tasarım/backlog; bu ek düzeltmede uygulanmadı.**

Mevcut `useDraftActions.ts` pending/completed `useRef` kümeleri aynı hook/cihazı korur. İki ayrı cihazdaki stok/bakiye etkileri LWW sonucu tek accepted faturaya dönüşse bile iki kere uygulanabilir. Deterministik ledger ID tek başına stok/bakiye tekrarını önlemez.

Önerilen yaklaşım:

1. İki bağımsız PouchDB store'u aynı pending taslağı alır; ikisi kabul eder; sonra replikasyon yapılır. Stok, bakiye ve ledger tek etkili olmalıdır. Mevcut açığı gösteren test sonrasında çözüm regresyonuna çevrilir; test sonuçları varmış gibi yazılmaz.
2. Kabulü ortak otoritede tek draft/version için compare-and-set ile karara bağla. Kazanan acceptance ID değişmez; diğer cihaz sonucu okur. Yetki/account/tenant kontrolü sunucuda yapılır.
3. Stok/bakiye/ledger etkileri için acceptance ID tabanlı deterministik journal ve idempotent uygulama tasarla. Tek belge CAS, ayrı belgelerdeki yan etkileri atomik yapmaz; crash recovery ve eksik/yarım uygulama senaryoları şarttır.
4. Eski PC istemcisi de aynı protokolü kullanmalı; yalnız APK'yı düzeltmek toplam sistem garantisi vermez.
5. Offline-finalize politikası ürün kararıdır: öneri, çevrimdışı hazırlama serbest ama ortak otoriteye erişmeden nihai kabulü pending tutmak. Tam çevrimdışı çok-cihaz kabul zorunluysa tek yetkili cihaz veya çatışma uzlaştırma modeli gerekir; çevrimdışıyken sıradan LWW ile global exactly-once vaat edilmez.

Kabul testleri: iki cihaz aynı anda/online, network partition, iki defa gelen istek, kabul sonrası süreç kapanması, her yan etki noktasında crash, cihaz saati farkı, role/account izolasyonu, eski PC uyumu. Bu politika kararı verilmeden üretim finans akışı değiştirilmemelidir.

## Ayrı görev B: credential vault

**Durum: tasarım/backlog; mevcut Base64 obfuscation kaldırılmadı.**

İlgili yollar: `src/db/credentialStorage.ts`, `connectionStore.ts`, `syncService.ts`, `accountService.ts`, `src/store/accountStore.ts`, Electron main/preload ve Android native katmanı.

- Ortak asenkron vault arayüzü: account-scoped get/set/delete. Renderer kalıcı saklamada yalnız referans ve userinfo-free URL tutar.
- Electron: `safeStorage` main process'te; mevcut `ipc-trust.cjs` sender/main-frame/URL kontrolleri her vault handler'ında. Keyring/OS koruması yoksa düz metin veya Linux `basic_text` fallback'i sessizce kullanılmaz. Windows gerçek DPAPI/sandbox smoke testi gerekir.
- Android: Keystore içinde export edilemeyen anahtar, AES-GCM rastgele nonce ve account/provider bağlayan authenticated data. Ciphertext uygulama-private alanda; backup/export credential kapsamına alınmaz. Anahtar kaybı/cihaz taşıma durumunda yeniden giriş istenir.
- Migration: eski kodlanmış veriyi oku, native vault'a yaz, okuyup doğrula, referansı kaydet; ancak bundan sonra eski kopyayı sil. Hata olursa eski veriyi kaybetme ve açık uyarı göster. Önce localStorage sonra `system_accounts` Pouch yolları birlikte ele alınır.
- Yeni format credential alanları replikasyon/backuplara sızmamalıdır. Silinen hesap vault kaydını da kaldırır; hesap değiştirme yanlış hesaba credential döndürmez.
- Tarayıcı sürümü OS vault varmış gibi davranmaz: güvenli oturumluk saklama veya açık kullanıcı tercihi gerekir. Fallback ayrıca tasarlanır.
- Vault, çalışan renderer'ın kullanması gereken sırları bellekte tamamen yok etmez; XSS/ele geçirilmiş işlem için tam koruma iddiası yapılmaz. URL/Basic/token log redaksiyonu ve HTTP uyarısı korunur.

Kabul testleri: Unicode ve percent-encoding roundtrip, migration kesilmesi, vault erişim reddi, ciphertext bozma/account substitution, kilitli/eksik keyring, Android anahtar kaybı, hesap silme, backup/export ve loglarda sır olmaması. Gerçek Windows/Android cihaz testleri olmadan vault tamamlandı sayılmaz.
