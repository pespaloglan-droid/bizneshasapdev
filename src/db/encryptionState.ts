/**
 * Şifreleme durumu — flag + parola önbelleği (pouch.ts ile dbEncryption.ts
 * arasında DÖNGÜSÜZ paylaşım için).
 *
 * Neden ayrı modül: `dbEncryption.ts` → `pouch.ts` import eder (getDatabaseKey).
 * `pouch.ts` de şifreli dal için flag + parolaya ihtiyaç duyar. pouch.ts bunları
 * dbEncryption.ts'ten alsa döngü oluşur (pouch modül seviyesinde
 * `masterAccountsDb` açar). Bu modül hiçbir proje dosyasını import ETMEZ —
 * iki taraf da buradan okur.
 *
 * Varsayılan: şifreleme KAPALI. Mevcut kurulumlar hiç etkilenmez.
 */

/** localStorage anahtarı — '1' ise şifreleme etkin. */
const FLAG_KEY = 'bh.db.encrypted.v1';

/**
 * Parola önbelleği:
 *   undefined → prepareEncryption() henüz çağrılmadı
 *   null      → hazırlık yapıldı ama parola yok (flag kapalı veya lisans yok)
 *   string    → kullanıma hazır DB parolası
 */
let cachedDbPassword: string | null | undefined = undefined;

export function isEncryptionEnabled(): boolean {
  try {
    return localStorage.getItem(FLAG_KEY) === '1';
  } catch {
    return false;
  }
}

export function applyEncryptionFlag(enabled: boolean): void {
  try {
    if (enabled) localStorage.setItem(FLAG_KEY, '1');
    else localStorage.removeItem(FLAG_KEY);
  } catch {
    // localStorage yoksa (private mode) varsayılan kapalı kalır.
  }
}

/** prepareEncryption() çağrıldı mı? (parola olsun ya da olmasın) */
export function isEncryptionPrepared(): boolean {
  return cachedDbPassword !== undefined;
}

export function setCachedDbPassword(password: string | null): void {
  cachedDbPassword = password;
}

/**
 * Hazırlanmış parolayı döner.
 * @throws prepareEncryption() henüz çağrılmadıysa (programatik hata — App.tsx kapısı bunu garanti eder)
 */
export function getCachedPassword(): string | null {
  if (cachedDbPassword === undefined) {
    throw new Error('prepareEncryption() henüz çağrılmadı');
  }
  return cachedDbPassword;
}

/** Testler için durumu sıfırlar. Üretim kodunda çağırma. */
export function resetEncryptionStateForTests(): void {
  cachedDbPassword = undefined;
}
