import { loadConnection, saveConnection, stopCurrent } from './connectionStore';
import { getLocalDatabase, upsertDoc } from './pouch';
import { prepareDocumentForWrite } from './validation';

export const BACKUP_SCOPES = ['products', 'customers', 'users', 'invoices', 'money', 'ledgers', 'currencies', 'targow', 'warehouses', 'settings'] as const;
export type BackupScope = typeof BACKUP_SCOPES[number];
export interface BackupIdentity { licenseId?: string; databaseName?: string }
export interface BackupIssue { row: number; id: string; code: string }
export interface BackupFile {
  app: 'biznes-hasap'; version: number; exportedAt?: string;
  account?: { id: string; storeDb: string; licenseId?: string; databaseName?: string }; scopes: BackupScope[];
  docs: Record<string, unknown>[]; issues: BackupIssue[]; sourceRows?: number[];
}
export interface RestoreResult { written: Record<BackupScope, number>; failed: BackupIssue[]; skipped: number }
const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
export function emptyScopeCounts(): Record<BackupScope, number> {
  return Object.fromEntries(BACKUP_SCOPES.map(s => [s, 0])) as Record<BackupScope, number>;
}
/** Deliberate allowlist: device licenses, crypto metadata, credentials, journals,
 * replication state and design docs must never move to another device/store. */
export function backupScope(id: string): BackupScope | null {
  if (id === 'settings_roles' || id.startsWith('appuser_')) return 'users';
  if (id.startsWith('product_') || id.startsWith('urun:') || id.startsWith('composition_')) return 'products';
  if (id.startsWith('customer_') || id.startsWith('kagent:') || id.startsWith('customerprice_')) return 'customers';
  if (id.startsWith('invoice_') || id.startsWith('fatura:')) return 'invoices';
  if (id.startsWith('money_')) return 'money';
  if (id.startsWith('ledger_')) return 'ledgers';
  if (id.startsWith('currency_')) return 'currencies';
  if (id.startsWith('targow_') || id.startsWith('region_')) return 'targow';
  if (id.startsWith('warehouse_')) return 'warehouses';
  if (id === 'settings_app' || id.startsWith('unit_')) return 'settings';
  return null;
}
function cleanDoc(doc: Record<string, unknown>): Record<string, unknown> {
  const { _rev, _revisions, _conflicts, _deleted, ...fields } = doc;
  void _rev; void _revisions; void _conflicts; void _deleted;
  return fields;
}
/** Additional backup-boundary checks for domains not covered by Zod writes. */
function validateBackupDocument(doc: Record<string, unknown>): void {
  const id = String(doc._id);
  const fail = () => { throw new Error('INVALID_DOCUMENT'); };
  if (id === 'settings_app' && !record(doc.settings)) fail();
  if (id === 'settings_roles' && !record(doc.templates)) fail();
  if (id.startsWith('appuser_')) {
    const user = record(doc.user) ? doc.user : doc;
    if (user.id !== id.slice(8) || typeof user.username !== 'string' || typeof user.role !== 'string') fail();
  }
  const definitions = [
    ['unit_', 'unit', 'labelTm'], ['warehouse_', 'warehouse', 'name'],
    ['ledger_', 'ledger', 'name'], ['targow_', 'targow', 'fullName'],
    ['region_', 'region', 'name'], ['currency_', 'currency', 'code'],
  ];
  for (const [prefix, payload, name] of definitions) {
    if (!id.startsWith(prefix)) continue;
    const body = doc[payload];
    if (!record(body) || body.id !== id.slice(prefix.length) || typeof body[name] !== 'string') fail();
    if (prefix === 'currency_' && (!record(body) || typeof body.rate !== 'number' || !Number.isFinite(body.rate))) fail();
  }
  if (id.startsWith('composition_')) {
    const body = doc.composition;
    if (!record(body) || body.productId !== id.slice(12) || !Array.isArray(body.components) || body.components.some(p => !record(p) || typeof p.productId !== 'string' || typeof p.qty !== 'number' || !Number.isFinite(p.qty))) fail();
  }
  if (id.startsWith('customerprice_')) {
    const body = doc.customerPrices;
    if (!record(body) || body.customerId !== id.slice(14) || !record(body.prices) || Object.values(body.prices).some(v => typeof v !== 'number' || !Number.isFinite(v))) fail();
  }
  prepareDocumentForWrite(id, doc);
}
/** Invalid rows are reported, not treated as a successful empty backup. */
export function inspectBackup(json: string): BackupFile {
  const value: unknown = JSON.parse(json);
  if (!record(value) || value.app !== 'biznes-hasap' || ![1, 2].includes(Number(value.version)) || !Array.isArray(value.docs)) throw new Error('INVALID_BACKUP');
  if (value.account !== undefined && (!record(value.account) || typeof value.account.id !== 'string' || typeof value.account.storeDb !== 'string' || (value.account.licenseId !== undefined && typeof value.account.licenseId !== 'string') || (value.account.databaseName !== undefined && typeof value.account.databaseName !== 'string'))) throw new Error('INVALID_BACKUP');
  if (value.scopes !== undefined && (!Array.isArray(value.scopes) || value.scopes.some(s => !BACKUP_SCOPES.includes(s as BackupScope)))) throw new Error('INVALID_BACKUP');
  const declared = value.scopes as BackupScope[] | undefined;
  const docs: Record<string, unknown>[] = []; const sourceRows: number[] = []; const issues: BackupIssue[] = []; const seen = new Set<string>();
  value.docs.forEach((raw: unknown, index: number) => {
    const id = record(raw) && typeof raw._id === 'string' ? raw._id : '';
    const scope = backupScope(id);
    let code = '';
    if (!record(raw) || !id) code = 'INVALID_DOCUMENT';
    else if (!scope || (declared && !declared.includes(scope))) code = 'UNSUPPORTED_DOCUMENT';
    else if (seen.has(id)) code = 'DUPLICATE_ID';
    else if (raw._deleted === true) code = 'DELETED_DOCUMENT';
    else {
      try {
        const fields = cleanDoc(raw);
        validateBackupDocument(fields);
        if (record(fields._attachments) && Object.values(fields._attachments).some(a => !record(a) || typeof a.data !== 'string')) throw new Error('ATTACHMENT_DATA_MISSING');
        docs.push(fields); sourceRows.push(index + 1); seen.add(id);
      } catch { code = 'INVALID_DOCUMENT'; }
    }
    if (code) issues.push({ row: index + 1, id, code });
  });
  const scopes = declared ?? BACKUP_SCOPES.filter(s => docs.some(d => backupScope(String(d._id)) === s));
  return { app: 'biznes-hasap', version: Number(value.version), exportedAt: typeof value.exportedAt === 'string' ? value.exportedAt : undefined,
    account: value.account as BackupFile['account'], scopes, docs, issues, sourceRows };
}
export function assertBackupAccount(backup: BackupFile, accountId: string, storeDb: string, identity?: BackupIdentity): void {
  if (!backup.account) return;
  // Local account UUIDs/store keys differ between PC and phone. A shared,
  // license-bound business identity permits the same business on both devices.
  if (backup.account.licenseId) {
    if (backup.account.licenseId !== identity?.licenseId || (backup.account.databaseName && identity.databaseName && backup.account.databaseName !== identity.databaseName)) throw new Error('ACCOUNT_MISMATCH');
  } else if (backup.account.id !== accountId || backup.account.storeDb !== storeDb) throw new Error('ACCOUNT_MISMATCH');
}
export async function exportSelectedBackup(storeDb: string, accountId: string, scopes: readonly BackupScope[], identity?: BackupIdentity): Promise<string> {
  if (!scopes.length || scopes.some(s => !BACKUP_SCOPES.includes(s))) throw new Error('NO_SCOPES');
  const rows = await getLocalDatabase(storeDb).allDocs({ include_docs: true, attachments: true });
  const docs = rows.rows.flatMap(row => {
    const doc = row.doc as Record<string, unknown> | undefined;
    const scope = doc && backupScope(String(doc._id));
    return doc && scope && scopes.includes(scope) ? [cleanDoc(doc)] : [];
  });
  return JSON.stringify({ app: 'biznes-hasap', version: 2, exportedAt: new Date().toISOString(), account: { id: accountId, storeDb, ...identity }, scopes, docs });
}
export async function restoreSelectedBackup(storeDb: string, accountId: string, backup: BackupFile, scopes: readonly BackupScope[], allowLegacy = false, identity?: BackupIdentity): Promise<RestoreResult> {
  assertBackupAccount(backup, accountId, storeDb, identity);
  if (!backup.account && !allowLegacy) throw new Error('LEGACY_CONFIRMATION_REQUIRED');
  if (!scopes.length || scopes.some(s => !backup.scopes.includes(s))) throw new Error('NO_SCOPES');
  const connection = loadConnection(accountId);
  if (connection.active) {
    // Imported snapshots must not race with a live PC mirror/replication pass.
    saveConnection(accountId, { ...connection, active: null });
    if (loadConnection(accountId).active !== null) throw new Error('SYNC_PAUSE_FAILED');
  }
  stopCurrent(accountId);
  const result: RestoreResult = { written: emptyScopeCounts(), failed: [...backup.issues], skipped: 0 };
  // Sequential, validated upserts use the existing per-document write lock and
  // conflict retry. No source revisions or destructive database reset is used.
  for (let i = 0; i < backup.docs.length; i++) {
    const doc = backup.docs[i]; const id = String(doc._id); const scope = backupScope(id);
    if (!scope || !scopes.includes(scope)) { result.skipped++; continue; }
    try {
      const fields = cleanDoc(doc);
      validateBackupDocument(fields);
      await upsertDoc(storeDb, id, fields);
      result.written[scope]++;
    } catch { result.failed.push({ row: backup.sourceRows?.[i] ?? i + 1, id, code: 'WRITE_FAILED' }); }
  }
  return result;
}
export const BACKUP_CHANGED_EVENT = 'bh:backup-changed';
const backupKey = (storeDb: string) => `bh.backup.last.${storeDb}`;
export function lastBackupAt(storeDb: string): string | null {
  try { const v = localStorage.getItem(backupKey(storeDb)); return v && Number.isFinite(Date.parse(v)) ? v : null; } catch { return null; }
}
export function recordBackupSaved(storeDb: string): void {
  localStorage.setItem(backupKey(storeDb), new Date().toISOString());
  window.dispatchEvent(new CustomEvent(BACKUP_CHANGED_EVENT));
}
export function backupReminderDue(last: string | null, created: string, now = Date.now()): boolean {
  const time = Date.parse(last ?? created);
  return Number.isFinite(time) && now - time >= 30 * 24 * 60 * 60 * 1000;
}
