/**
 * Audit log (FAZ 2.2 · MD §3.2) — kim, ne zaman, neyi değiştirdi.
 *
 * Tasarım kararları:
 *  - 'audit' ayrı bir yerel DB'dir; hesap store'larından bağımsızdır ama şifreleme
 *    açıksa o da şifrelenir (NEVER_ENCRYPTED_DBS'te DEĞİL — günlük de veridir).
 *  - upsertDoc('audit', ...) ASLA loglanmaz (sonsuz döngü olurdu).
 *  - Yazma hatası ana akışı BOZMAZ ama sessiz de kalmaz: console.error +
 *    `getAuditHealth()` ile UI'dan görülebilen sayaç.
 *  - Bayrak (`auditLogEnabled`) ve kullanıcı modül durumunda tutulur;
 *    PosWorkspace settings yükleyince besler. upsertDoc her yazmada settings
 *    okumak zorunda kalmaz.
 */

import { getLocalDatabase, listDocsByPrefix } from './pouch';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW';

export interface AuditEntry {
  _id: string; // 'audit:<epochMs>:<uuid>' — kronolojik sıralanabilir
  timestamp: string; // ISO
  userId: string;
  action: AuditAction;
  docType: string; // 'urun' | 'kagent' | 'fatura' | 'product' | ... (id önekinden)
  docId: string;
  /** Hangi hesap store'unda oldu (filtreleme için). */
  storeDb?: string;
  changes?: Record<string, { old: unknown; new: unknown }>;
}

const AUDIT_DB = 'audit';
const AUDIT_PREFIX = 'audit:';

let auditEnabled = false;
let currentUserId = '';
let errorCount = 0;
let lastError: string | null = null;

export function setAuditEnabled(enabled: boolean): void {
  auditEnabled = enabled;
}

export function isAuditEnabled(): boolean {
  return auditEnabled;
}

export function setAuditUser(userId: string | undefined | null): void {
  currentUserId = userId ?? '';
}

export function getAuditUser(): string {
  return currentUserId;
}

/** Yazma sağlığı — UI "günlük yazılamıyor" uyarısı gösterebilir. */
export function getAuditHealth(): { errorCount: number; lastError: string | null } {
  return { errorCount, lastError };
}

/** Testler için durumu sıfırlar. Üretim kodunda çağırma. */
export function resetAuditStateForTests(): void {
  auditEnabled = false;
  currentUserId = '';
  errorCount = 0;
  lastError = null;
}

function uuid(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {
    // fallback'e düş
  }
  return `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

/** `'urun:abc-1'` → `'urun'` · `'product_abc'` → `'product'` · önek yoksa `'other'` */
export function docTypeFromId(id: string): string {
  const colon = id.indexOf(':');
  if (colon > 0) return id.slice(0, colon);
  const underscore = id.indexOf('_');
  if (underscore > 0) return id.slice(0, underscore);
  return 'other';
}

const DIFF_SKIP = new Set(['_rev']);

/**
 * Sığ diff: iki dokümanın üst seviye alanlarını karşılaştırır.
 * Değişmeyen alanlar yazılmaz; `_rev` atlanır. Derin değerler JSON ile kıyaslanır.
 * Fark yoksa undefined döner.
 */
export function calculateDiff(
  oldDoc: Record<string, unknown>,
  newDoc: Record<string, unknown>
): Record<string, { old: unknown; new: unknown }> | undefined {
  const changes: Record<string, { old: unknown; new: unknown }> = {};
  const keys = new Set([...Object.keys(oldDoc), ...Object.keys(newDoc)]);
  for (const key of keys) {
    if (DIFF_SKIP.has(key)) continue;
    const oldVal = oldDoc[key];
    const newVal = newDoc[key];
    const same =
      oldVal === newVal ||
      (typeof oldVal === 'object' &&
        typeof newVal === 'object' &&
        JSON.stringify(oldVal) === JSON.stringify(newVal));
    if (!same) {
      changes[key] = { old: oldVal, new: newVal };
    }
  }
  return Object.keys(changes).length > 0 ? changes : undefined;
}

/**
 * Günlüğe yazar. Bayrak kapalıysa no-op (false döner).
 * Hata olursa ana akışı bozmaz: false döner, console.error + sayaç işlenir.
 */
export async function logAudit(
  entry: Omit<AuditEntry, '_id' | 'timestamp' | 'userId'> & { userId?: string }
): Promise<boolean> {
  if (!auditEnabled) return false;
  try {
    const db = getLocalDatabase(AUDIT_DB);
    await db.put({
      _id: `${AUDIT_PREFIX}${Date.now()}:${uuid()}`,
      timestamp: new Date().toISOString(),
      userId: entry.userId ?? currentUserId,
      action: entry.action,
      docType: entry.docType,
      docId: entry.docId,
      storeDb: entry.storeDb,
      changes: entry.changes,
    });
    return true;
  } catch (error) {
    errorCount += 1;
    lastError = error instanceof Error ? error.message : String(error);
    console.error('Audit log yazılamadı:', error);
    return false;
  }
}

export interface AuditFilter {
  userId?: string;
  docType?: string;
  storeDb?: string;
  /** ISO alt sınır (dahil). */
  from?: string;
  /** ISO üst sınır (dahil). */
  to?: string;
}

/** En yeni kayıtlar önce gelir. */
export async function listAuditEntries(limit = 200, filter?: AuditFilter): Promise<AuditEntry[]> {
  const docs = await listDocsByPrefix(AUDIT_DB, AUDIT_PREFIX);
  let entries = docs as unknown as AuditEntry[];
  if (filter?.userId) entries = entries.filter((e) => e.userId === filter.userId);
  if (filter?.docType) entries = entries.filter((e) => e.docType === filter.docType);
  if (filter?.storeDb) entries = entries.filter((e) => e.storeDb === filter.storeDb);
  if (filter?.from) entries = entries.filter((e) => e.timestamp >= filter.from!);
  if (filter?.to) entries = entries.filter((e) => e.timestamp <= filter.to!);
  entries.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
  return entries.slice(0, Math.max(1, limit));
}

/** Dışa aktarım için tüm günlüğü JSON string olarak döner. */
export async function exportAuditLogJson(): Promise<string> {
  const entries = await listAuditEntries(Number.MAX_SAFE_INTEGER);
  return JSON.stringify(entries, null, 2);
}
