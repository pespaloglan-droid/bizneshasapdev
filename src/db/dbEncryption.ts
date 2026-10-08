/**
 * FAZ 1.1 — Yerel veritabanı şifreleme.
 *
 * Lisans spec'i v2 B.4 / 16.1: veritabanı `deriveKey('db')` ile şifreli
 * tutulmalı; lisanssız cihazda veri teknik olarak açılamamalı.
 *
 * ÖLÇÜLMÜŞ GERÇEK (pouchdb-browser@9 + crypto-pouch@4, Node/bellek adapter):
 *   ✓ Şifreli yazma/okuma çalışıyor
 *   ✓ Yanlış parola reddediliyor
 *   ✓ Range sorgusu ve 404 doğru
 *   ✓ Yeniden açılışta kalıcı
 *   ⚠ `_id` ve `_rev` ŞİFRELENMEZ (kısmi şifreleme) — `_id`ler `urun:1`,
 *     `fatura:2` gibi kalır. Finansal İÇERİK (ad, fiyat, stok, borç, tutar)
 *     şifrelenir. `_id`lerden belge türü okunabilir, rakamlar okunamaz.
 *   ⚠ `putAttachment`/`getAttachment` desteklenmez (projede kullanılmıyor).
 *
 * Bu modül varsayılan olarak KAPALI çalışır: `ENCRYPTION_ENABLED = false`.
 * Mevcut kurulumların hiçbiri etkilenmez. Açmak için:
 *   1) Ayarlar → "Veritabanını şifrele" işaretlenir
 *   2) `migrateToEncrypted()` çalıştırılır (kopyalama yöntemi)
 *   3) `applyEncryptionFlag()` ile kalıcı hale getirilir
 */

import PouchDB from 'pouchdb-browser';
import { deriveDbPassword, sanitizeDbName, encryptedDbName } from './pouch';
import { ensureCryptoPlugin } from './cryptoPlugin';
import { isEncryptionEnabled, applyEncryptionFlag } from './encryptionState';

// Bayrak okuma/yazma encryptionState.ts'e taşındı (pouch.ts ile döngüsüz paylaşım).
// Mevcut importçular kırılmasın diye buradan re-export edilir.
export { isEncryptionEnabled, applyEncryptionFlag };

/**
 * Lisans anahtarını DB parolasına çevirir.
 *
 * `deriveKey('db')` 32 byte döner; crypto-pouch parola olarak **string**
 * istiyor. Bu yüzden base64'e çeviriyoruz. Anahtar lisanstan türer, bu
 * yüzden başka cihazda aynı parola üretilemez → şifreli DB orada açılmaz.
 *
 * Lisans yoksa / süresi dolmuşsa → null (DB açılamaz, spec B.5).
 */
export async function getDbPassword(): Promise<string | null> {
  return deriveDbPassword();
}

/**
 * Şifreli DB açar/açılı var olan örneği döner.
 *
 * @throws Lisans/anahtar yoksa → `LICENSE_REQUIRED`
 * @throws Şifreli DB'de anahtar yanlışsa → `WRONG_KEY` (veri okunamaz)
 */
export async function openEncryptedDatabase<T extends {} = {}>(
  dbName: string
): Promise<PouchDB.Database<T>> {
  ensureCryptoPlugin();

  const password = await getDbPassword();
  if (!password) {
    const err = new Error('LICENSE_REQUIRED: Şifreli veritabanı için geçerli lisans gerekli');
    (err as Error & { code: string }).code = 'LICENSE_REQUIRED';
    throw err;
  }

  const db = new PouchDB<T>(`biznes_${encryptedDbName(dbName)}`, {
    auto_compaction: true,
  }) as PouchDB.Database<T> & { crypto(password: string): Promise<void> };

  // crypto-pouch kendi anahtar doğrulayıcısını `_local/crypto` içine yazar.
  // Yanlış parolada burada hata atar — o an veri teknik olarak açılamaz.
  try {
    await db.crypto(password);
  } catch (e) {
    const err = new Error(
      'WRONG_KEY: Şifreli veritabanı bu cihazda açılamıyor (anahtar eşleşmedi)'
    );
    (err as Error & { code: string }).code = 'WRONG_KEY';
    (err as Error & { cause?: unknown }).cause = e;
    throw err;
  }

  return db;
}

/** Şifreli kovanın adı (migrasyon hedefi). */
export { encryptedDbName, sanitizeDbName };