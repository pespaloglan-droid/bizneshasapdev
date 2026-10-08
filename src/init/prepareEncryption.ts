/**
 * Async açılış hazırlığı (FAZ 1.1 · MD §2.3 Adım 1).
 *
 * Engel: `getLocalDatabase()` SENKRON, `deriveKey` ASENKRON (IPC).
 * Çözüm: UI render edilmeden ÖNCE parola türetilip önbelleğe alınır;
 * sonrasında senkron `getCachedPassword()` ile okunur.
 *
 * App.tsx bu fonksiyon bitmeden arayüzü göstermez ("Hazırlanıyor..." ekranı).
 * Hazırlık başarısız olursa uygulama kilitlenmez — parola null kalır,
 * şifreli dal op anında lisans kontrolüyle tekrar dener (fail-closed).
 */

import { getDbPassword } from '../db/dbEncryption';
import { isEncryptionEnabled, setCachedDbPassword } from '../db/encryptionState';

export async function prepareEncryption(): Promise<void> {
  if (!isEncryptionEnabled()) {
    setCachedDbPassword(null);
    return;
  }

  try {
    setCachedDbPassword(await getDbPassword());
  } catch (error) {
    console.error('Şifreleme hazırlığı başarısız:', error);
    // Sessiz başarısızlık değil: hata loglanır, parola null kalır.
    // Şifreli DB op'ları null parolayla LICENSE_REQUIRED fırlatır (fail-closed).
    setCachedDbPassword(null);
  }
}
