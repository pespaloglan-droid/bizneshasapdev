import { SyncError } from '../utils/errors';
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
  if (!Number.isSafeInteger(batchSize) || batchSize <= 0) throw new RangeError('INVALID_BATCH_SIZE');
  const db = getLocalDatabase(dbName);
  const stats: ConflictStats = { resolved: 0, removed: 0, noTimestamp: 0 };

  const result = await db.allDocs({ include_docs: true, conflicts: true });
  const review = isConflictReviewEnabled(dbName);
  if (review) notifyConflictReview(dbName);
  const conflicted = result.rows.filter((r) => {
    const doc = r.doc as { _id?: string; _conflicts?: string[] } | undefined;
    if (review && doc?._id && isReviewableId(doc._id)) return false;
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

      // Okunamayan bir yaprak varsa karar vermek güvenli değildir.
      if (leaves.length !== current._conflicts.length + 1) return;
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
          // Yazım başarılı olmadan hiçbir yaprak silinmez (veri kaybını önle).
          return;
        }
      }

      // Kazanan dışındaki TÜM yaprakları sil (conflict kalmasın)
      for (const leaf of leaves) {
        // Kopya yazıldıysa mevcut parent tüketildi; seçilen eski dal da silinir.
        if (leaf._rev === (best._rev === current._rev ? best._rev : current._rev)) continue;
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

export const CONFLICT_REVIEW_EVENT = 'bh:conflict-review';
const REVIEW_KEY = 'bh_conflict_review:';
export function isConflictReviewEnabled(dbName: string): boolean {
  try { return localStorage.getItem(REVIEW_KEY + dbName) === 'true'; } catch { return false; }
}
export function setConflictReviewEnabled(dbName: string, enabled: boolean): void {
  localStorage.setItem(REVIEW_KEY + dbName, String(enabled));
  notifyConflictReview(dbName);
}
function notifyConflictReview(dbName: string): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(CONFLICT_REVIEW_EVENT, { detail: dbName }));
}
export interface ConflictVersion { rev: string; timestamp: number; fields: Record<string, unknown> }
export interface DocumentConflict { id: string; currentRev: string; versions: ConflictVersion[] }
const SAFE_FIELDS = new Set(['id', 'ad', 'name', 'sku', 'barkod', 'barcode', 'price', 'fiyat',
  'stock', 'stok', 'balance', 'bakiye', 'invoiceNo', 'faturaNo', 'amountDue', 'toplam', 'amount',
  'status', 'durum', 'invoiceType', 'faturaTipi', 'createdAt', 'updatedAt', 'syncedAt', '_deleted']);
function previewFields(doc: Record<string, unknown>): Record<string, unknown> {
  const body = [doc.product, doc.customer, doc.invoice, doc.transaction].find(isRecord);
  return Object.fromEntries(Object.entries({ ...doc, ...(body ?? {}) }).filter(([key, value]) =>
    SAFE_FIELDS.has(key) && (value === null || ['string', 'number', 'boolean'].includes(typeof value))));
}
/** Yalnızca iş belgeleri; lisans/kimlik/ayar ve bilinmeyen gizli alanlar gösterilmez. */
export async function listDocumentConflicts(dbName: string): Promise<DocumentConflict[]> {
  const db = getLocalDatabase(dbName);
  const result = await db.allDocs({ include_docs: true, conflicts: true });
  const records: DocumentConflict[] = [];
  for (const row of result.rows) {
    const current = row.doc as Record<string, unknown> & { _id: string; _rev: string; _conflicts?: string[] };
    if (!current?._conflicts?.length || !isReviewableId(current._id)) continue;
    const docs = [current];
    for (const rev of current._conflicts) docs.push(await db.get(current._id, { rev }) as typeof current);
    records.push({ id: current._id, currentRev: current._rev, versions: docs.map(doc => ({
      rev: doc._rev, timestamp: docTimestamp(doc), fields: previewFields(doc),
    })) });
  }
  return records;
}
/** İncelenen revision seti değişirse işlemi durdur; sessizce başka sürüm silme. */
export async function resolveReviewedConflict(dbName: string, snapshot: DocumentConflict, selectedRev: string): Promise<void> {
  const db = getLocalDatabase(dbName);
  const current = await db.get(snapshot.id, { conflicts: true }) as Record<string, unknown> & { _rev: string; _conflicts?: string[] };
  const revisions = [current._rev, ...(current._conflicts ?? [])].sort();
  const expected = snapshot.versions.map(v => v.rev).sort();
  if (current._rev !== snapshot.currentRev || JSON.stringify(revisions) !== JSON.stringify(expected) || !revisions.includes(selectedRev)) {
    throw new SyncError();
  }
  const selected = await db.get(snapshot.id, { rev: selectedRev }) as Record<string, unknown>;
  const { _rev, _conflicts, _revisions, _deleted_conflicts, ...fields } = selected;
  void _rev; void _conflicts; void _revisions; void _deleted_conflicts;
  // Başarılı yeni revision bariyeri oluşmadan hiçbir dal silinmez.
  await db.put({ ...fields, _id: snapshot.id, _rev: current._rev } as never);
  for (const rev of current._conflicts ?? []) await db.remove(snapshot.id, rev);
  notifyConflictReview(dbName);
}

function isReviewableId(id: string): boolean { return /^(product_|customer_|invoice_|money_|urun:|kagent:|fatura:)/.test(id); }
export async function hasReviewableConflicts(dbName: string): Promise<boolean> {
  const result = await getLocalDatabase(dbName).allDocs({ include_docs: true, conflicts: true });
  return result.rows.some(row => {
    const doc = row.doc as { _id: string; _conflicts?: string[] } | undefined;
    return doc && isReviewableId(doc._id) && Boolean(doc._conflicts?.length);
  });
}
