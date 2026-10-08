/**
 * Şifresiz PouchDB → şifreli PouchDB migrasyonu (FAZ 1.1).
 *
 * GÜVENLİK İLKESİ: **Kaynak asla silinmez.** Kopyalama yapılır, doğrulanır,
 * ancak `migrateToEncrypted` içinde hiçbir `destroy()`/silme çağrısı yoktur.
 * Kullanıcı verisi ancak kendisi, ayarlar ekranından açıkça onaylarsa düşer.
 *
 * ÖLÇÜLMÜŞ GERÇEK: `bulkDocs` kaynak `_rev` değerleriyle çağrılırsa her belge
 * için `409 conflict` döner ve **0 belge yazılır**. Bu yüzden `_rev` ve
 * `_conflicts` hedefe yazılmadan önce silinir; hedef kendi rev'ini üretir.
 * Testler bu davranışı kilitler (regresyon).
 */

import type PouchDB from 'pouchdb-browser';

/** Migrasyonda kullanılan en küçük DB yüzeyi (testte sahte nesneyle değiştirilir). */
export interface MigrationSource {
  allDocs(opts: { include_docs?: boolean; startkey?: string; endkey?: string }): Promise<{
    rows: Array<{ doc?: Record<string, unknown> | null }>;
  }>;
}

export interface MigrationTarget {
  bulkDocs(docs: Array<Record<string, unknown>>): Promise<Array<Record<string, unknown>>>;
}

export interface MigrationResult {
  /** Kopyalanan belge sayısı. */
  copied: number;
  /** Yazılamayan belgeler (kimlik listesi) — sessiz veri kaybı olmasın. */
  failed: Array<{ id: string; reason: string }>;
  /** Kaynak dokunulmadan kaldı mı? (her zaman true — bu kod silmez) */
  sourcePreserved: true;
}

/** PouchDB'nin hedefte yeniden üretmesi gereken, kaynaktan taşınmaması gereken alanlar. */
const STRIP_FIELDS = ['_rev', '_conflicts', '_deleted'] as const;

/**
 * Kaynak belgeyi hedefe yazmaya hazırlar.
 * `_rev` taşınırsa hedefte 409 conflict → belge kaybolur.
 */
export function prepareDocForTarget<T extends Record<string, unknown>>(doc: T): T {
  const copy: Record<string, unknown> = { ...doc };
  for (const field of STRIP_FIELDS) {
    delete copy[field];
  }
  return copy as T;
}

/**
 * Tüm belgeleri kaynaktan hedefe kopyalar. Kaynağa hiç dokunmaz.
 *
 * @throws Hedef `bulkDocs` hata fırlatırsa (dizin dolu, kota, vb.)
 */
export async function migrateToEncrypted(
  source: MigrationSource,
  target: MigrationTarget,
  batchSize = 100
): Promise<MigrationResult> {
  const all = await source.allDocs({ include_docs: true });
  const docs = all.rows.map((r) => r.doc).filter((d): d is Record<string, unknown> => !!d);

  const result: MigrationResult = { copied: 0, failed: [], sourcePreserved: true };

  for (let i = 0; i < docs.length; i += batchSize) {
    const batch = docs.slice(i, i + batchSize).map(prepareDocForTarget);
    const responses = await target.bulkDocs(batch);

    responses.forEach((res, idx) => {
      const id = String(batch[idx]._id ?? '?');
      if (res && typeof res.ok === 'boolean' && res.ok) {
        result.copied += 1;
      } else {
        result.failed.push({
          id,
          reason: String((res as { error?: string; message?: string })?.error ?? 'Bilinmeyen hata'),
        });
      }
    });
  }

  return result;
}

/**
 * Migrasyon sonrası doğrulama: kaynak ve hedefin belge sayısı eşit mi?
 * Eşit değilse kullanıcıya "veri eksik" demeden önce bir daha bakılır.
 */
export async function verifyMigration(
  source: MigrationSource,
  targetCount: number
): Promise<{ ok: boolean; expected: number; actual: number }> {
  const all = await source.allDocs({});
  const expected = all.rows.length;
  return { ok: expected === targetCount, expected, actual: targetCount };
}

export type { PouchDB };