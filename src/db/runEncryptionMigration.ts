/**
 * Şifresiz → şifreli geçişin uygulama seviyesi sürücüsü (FAZ 1.1 · MD §2.3 Adım 5).
 *
 * GÜVENLİK İLKELERİ:
 *  - Kaynak DB ASLA silinmez (migrateToEncrypted içinde destroy yok — geri dönüş
 *    "flag'i kapat" kadar basit kalır).
 *  - `system_accounts` bu listeye GİRMEZ (kilit döngüsü, spec v3 §3.2) —
 *    çağırıcı hesap store anahtarları (`store_<id>`) üretir.
 *  - Başarısız belge varsa sonuç `failed` listesinde AÇIKÇA raporlanır;
 *    sessiz veri kaybı yasak.
 */

import PouchDB from 'pouchdb-browser';
import { sanitizeDbName } from './pouch';
import { openEncryptedDatabase } from './dbEncryption';
import { migrateToEncrypted, verifyMigration, type MigrationTarget } from './migrateToEncrypted';

export interface AccountMigrationResult {
  storeKey: string;
  copied: number;
  failed: Array<{ id: string; reason: string }>;
  /** Kaynak belge sayısı == hedefe yazılan sayısı mı? */
  verified: boolean;
}

/**
 * Tek bir hesap store'unu (`store_<hesapId>`) şifreli kovaya kopyalar.
 * Kaynak açık kalır; hiçbir şey silinmez.
 */
export async function migrateAccountStoreToEncrypted(
  storeKey: string
): Promise<AccountMigrationResult> {
  const source = new PouchDB(`biznes_${sanitizeDbName(storeKey)}`);
  const target = await openEncryptedDatabase(storeKey);
  try {
    const res = await migrateToEncrypted(source, target as unknown as MigrationTarget);
    const verify = await verifyMigration(source, res.copied);
    return {
      storeKey,
      copied: res.copied,
      failed: res.failed,
      verified: verify.ok && res.failed.length === 0,
    };
  } finally {
    try {
      await source.close();
      await target.close();
    } catch {
      // close hatası migrasyon sonucunu değiştirmez
    }
  }
}

/**
 * Birden fazla store'u sırayla göçürür. Her store bitince `onProgress` çağrılır.
 * Bir store patlasa bile diğerleri denenir — hata sonuçta işaretlenir.
 */
export async function migrateAllStoresToEncrypted(
  storeKeys: readonly string[],
  onProgress?: (done: number, total: number, last: AccountMigrationResult) => void
): Promise<AccountMigrationResult[]> {
  const results: AccountMigrationResult[] = [];
  for (let i = 0; i < storeKeys.length; i += 1) {
    const storeKey = storeKeys[i];
    try {
      const res = await migrateAccountStoreToEncrypted(storeKey);
      results.push(res);
      onProgress?.(i + 1, storeKeys.length, res);
    } catch (error) {
      const res: AccountMigrationResult = {
        storeKey,
        copied: 0,
        failed: [
          {
            id: storeKey,
            reason: error instanceof Error ? error.message : String(error),
          },
        ],
        verified: false,
      };
      results.push(res);
      onProgress?.(i + 1, storeKeys.length, res);
    }
  }
  return results;
}
