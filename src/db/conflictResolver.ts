import { getLocalDatabase } from './pouch';

/**
 * Çakışma çözümü — "en son güncellenen kayıt kazansın" (Last-Write-Wins).
 *
 * CouchDB replikasyonu aynı `_id` için birden fazla revizyon (yaprak) bırakabilir.
 * Varsayılan çözümleyici kazananan revizyonu **revizyon karmasına** göre seçer —
 * yani kazanan "rastgele"dir, zamanla ilgisi yoktur. Biz istiyoruz ki en yeni
 * `updatedAt` kazansın.
 *
 * Çözüm: çakışmalı belgeler toplanır, hepsinin zaman damgası karşılaştırılır,
 * en yenisi asıl revizyon yapılır ve diğerleri silinir.
 */

/** Belgenin zaman damgası (ISO string veya sayısal ms). */
export function docTimestamp(doc: Record<string, unknown> | null | undefined): number {
  if (!doc) return 0;
  const candidates = [
    doc.updatedAt,
    doc.syncedAt,
    doc.createdAt,
    // İç içe kayıtlarda (ürün/fatura/müşteri gövdesi) ara
    isRecord(doc.product) ? doc.product.updatedAt : undefined,
    isRecord(doc.customer) ? doc.customer.updatedAt : undefined,
    isRecord(doc.invoice) ? doc.invoice.updatedAt : undefined,
    isRecord(doc.transaction) ? doc.transaction.updatedAt : undefined,
    doc.lastEditedAt,
  ];
  for (const c of candidates) {
    const n = toMillis(c);
    if (n > 0) return n;
  }
  return 0;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function toMillis(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    // saniyeyi ms'ye çevir (çok küçük sayılar saniye olabilir)
    return value < 1e11 ? value * 1000 : value;
  }
  if (typeof value === 'string' && value) {
    const t = Date.parse(value);
    if (!Number.isNaN(t)) return t;
  }
  return 0;
}

export interface ConflictStats {
  /** Çakışmalı belge sayısı (çözülen). */
  resolved: number;
  /** Silinen fazladan revizyon sayısı. */
  removed: number;
  /** Zaman damgası olmayıp ilk revizyonun seçildiği belgeler. */
  noTimestamp: number;
}

/**
 * Verilen veritabanındaki tüm çakışmaları LWW kuralıyla çözer.
 * @param batchSize kaç belge işleneceğini belirler (arayüz donmasın)
 */
export async function resolveConflicts(
  dbName: string,
  batchSize = 100,
  onProgress?: (done: number) => void
): Promise<ConflictStats> {
  const db = getLocalDatabase(dbName);
  const stats: ConflictStats = { resolved: 0, removed: 0, noTimestamp: 0 };

  const result = await db.allDocs({ include_docs: true, conflicts: true });
  const conflicted = result.rows.filter((r) => {
    const doc = r.doc as { _conflicts?: string[] } | undefined;
    return Array.isArray(doc?._conflicts) && doc._conflicts.length > 0;
  });

  for (let i = 0; i < conflicted.length; i += batchSize) {
    const chunk = conflicted.slice(i, i + batchSize);
    await Promise.all(chunk.map(async (row) => {
      const current = row.doc as Record<string, unknown> & { _id: string; _rev: string; _conflicts: string[] };
      const id = current._id;

      // Tüm yaprak (leaf) revizyonları topla: mevcut kazanan + çakışanlar
      const leaves: (Record<string, unknown> & { _id: string; _rev: string })[] = [current];
      for (const rev of current._conflicts ?? []) {
        const doc = (await db.get(id, { rev }).catch(() => null)) as
          | (Record<string, unknown> & { _id: string; _rev: string })
          | null;
        if (doc) leaves.push(doc);
      }

      // En yeni kazananı seç
      let best = leaves[0];
      let bestTime = docTimestamp(best);
      if (bestTime === 0) stats.noTimestamp += 1;
      for (const leaf of leaves.slice(1)) {
        const t = docTimestamp(leaf);
        if (t > bestTime) {
          bestTime = t;
          best = leaf;
        }
      }

      // Kazanan yaprak ana revizyon değilse, içeriğini ana revizyona taşı
      if (best._rev !== current._rev) {
        const { _rev: _dropRev, _conflicts: _dropConflicts, ...fields } = best;
        void _dropRev;
        void _dropConflicts;
        try {
          await db.put({ ...fields, _id: id, _rev: current._rev });
        } catch {
          // ana revizyon değişmiş olabilir — sonraki turda tekrar çözülür
        }
      }

      // Kazanan dışındaki TÜM yaprakları sil (conflict kalmasın)
      for (const leaf of leaves) {
        if (leaf._rev === best._rev) continue;
        try {
          await db.remove(id, leaf._rev);
          stats.removed += 1;
        } catch {
          // zaten silinmiş / rev değişmiş
        }
      }
      stats.resolved += 1;
    }));

    onProgress?.(Math.min(i + batchSize, conflicted.length));
    // Arayüze nefes alma payı
    await new Promise((r) => setTimeout(r, 0));
  }

  return stats;
}

/** Yalnızca kontrol: çakışma var mı? */
export async function countConflicts(dbName: string): Promise<number> {
  const db = getLocalDatabase(dbName);
  const result = await db.allDocs({ include_docs: true, conflicts: true });
  return result.rows.filter((r) => {
    const doc = r.doc as { _conflicts?: string[] } | undefined;
    return Array.isArray(doc?._conflicts) && doc._conflicts.length > 0;
  }).length;
}