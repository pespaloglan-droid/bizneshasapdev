/**
 * `crypto-pouch` için tip tanımı.
 *
 * Paket CJS ve tip tanımıyla gelmiyor (`@types/crypto-pouch` yalnızca
 * `declare module` takma adı). Gerçek yüzey küçük; kendimiz belgeliyoruz:
 *   - `transform`  → transform-pouch entegrasyonu (burada kullanılmıyor)
 *   - `crypto`     → `db.crypto(password)` ile şifrelemeyi başlatır
 *   - `removeCrypto` → şeffaf şifrelemeyi kapatır (belgeler şifreli kalır)
 *
 * `crypto` ve `removeCrypto` DB'ye `this` ile bağlanır — bu yüzden `this`
 * parametresi PouchDB örneğini işaret eder.
 */
declare module 'crypto-pouch' {
  import type PouchDB from 'pouchdb-browser';

  interface CryptoOptions {
    /** Şifrelenmeyecek ek alanlar (varsayılan: `_id`, `_rev`, `_deleted`, `_conflicts`). */
    ignore?: string[];
  }

  interface CryptoCapableDatabase {
    /**
     * Şifrelemeyi başlatır ve `_local/crypto` içine anahtar doğrulayıcısını yazar.
     * Yanlış parolada hata fırlatır — bu, şifreli DB'nin açılamadığı an.
     *
     * @throws Parola doğrulayıcısıyla eşleşmezse.
     */
    crypto(password: string | (CryptoOptions & { password: string })): Promise<void>;

    /** Şeffaf şifrelemeyi kapatır; diskteki belgeler şifreli kalır. */
    removeCrypto(): void;
  }

  type CryptoDatabase = PouchDB.Database & CryptoCapableDatabase;

  export function transform(options?: CryptoOptions): unknown;

  export function crypto(
    this: CryptoDatabase,
    password: string | (CryptoOptions & { password: string })
  ): Promise<void>;

  export function removeCrypto(this: CryptoDatabase): void;

  const plugin: PouchDB.Plugin;
  export default plugin;
}