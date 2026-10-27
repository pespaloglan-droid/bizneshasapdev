import { HistoryExportsPanel } from './HistoryExportsPanel';
import React, { useEffect, useState } from 'react';
import { useT, useLanguage } from '../../locales/LanguageContext';
import { BACKUP_SCOPES, assertBackupAccount, backupScope, emptyScopeCounts, exportSelectedBackup, inspectBackup, lastBackupAt, recordBackupSaved, restoreSelectedBackup, type BackupFile, type BackupScope, type RestoreResult } from '../../db/backupService';
import { bytesToBase64, decodeBhbak, encodeBhbak } from '../../utils/bhbak';
import { saveFileAs } from '../../utils/electron';
import { localeFor } from '../../utils/locale';
import { SYNC_IMPORTED_EVENT } from '../../db/schemaBridge';

export const BackupPanel: React.FC<{ storeDb: string; accountId: string; canRestore: boolean; initialFile?: File; accountName?: string; licenseId?: string; databaseName?: string; showHistoryExports?: boolean }> = ({ storeDb, accountId, canRestore, initialFile, accountName = accountId, licenseId, databaseName, showHistoryExports = true }) => {
  const t = useT(); const { language } = useLanguage();
  const [selected, setSelected] = useState<BackupScope[]>([...BACKUP_SCOPES]);
  const [backup, setBackup] = useState<BackupFile | null>(null);
  const [restoreScopes, setRestoreScopes] = useState<BackupScope[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<RestoreResult | null>(null);
  const [last, setLast] = useState(() => lastBackupAt(storeDb));
  const select = (scope: BackupScope, list: BackupScope[], setter: (v: BackupScope[]) => void) => setter(list.includes(scope) ? list.filter(s => s !== scope) : [...list, scope]);
  const exportFile = async () => {
    if (busy || !selected.length) return;
    setBusy(true); setMessage('');
    try {
      const json = await exportSelectedBackup(storeDb, accountId, selected, { licenseId, databaseName });
      const bytes = await encodeBhbak(json, true);
      const saved = await saveFileAs({ defaultName: `biznes-hasap-${new Date().toISOString().slice(0, 10)}.bhbak`, title: t('backup.export'), filters: [{ name: 'BHBK', extensions: ['bhbak'] }], data: bytesToBase64(bytes) });
      if (saved) { recordBackupSaved(storeDb); setLast(lastBackupAt(storeDb)); }
      setMessage(t(saved ? 'backup.saved' : 'backup.cancelled'));
    } catch { setMessage(t('backup.failed')); }
    finally { setBusy(false); }
  };
  const pickFile = async (file: File) => {
    setBusy(true); setBackup(null); setConfirmed(false); setResult(null); setMessage('');
    try {
      const parsed = inspectBackup(await decodeBhbak(new Uint8Array(await file.arrayBuffer())));
      assertBackupAccount(parsed, accountId, storeDb, { licenseId, databaseName });
      setBackup(parsed); setRestoreScopes([...parsed.scopes]);
    } catch (error) { setMessage(t(error instanceof Error && error.message === 'ACCOUNT_MISMATCH' ? 'backup.mismatch' : 'backup.failed')); }
    finally { setBusy(false); }
  };
  useEffect(() => {
    if (initialFile) void pickFile(initialFile);
  }, [initialFile]);
  const restore = async () => {
    if (!backup || !confirmed || busy || !canRestore || !restoreScopes.length) return;
    setBusy(true); setMessage('');
    try {
      setResult(await restoreSelectedBackup(storeDb, accountId, backup, restoreScopes, confirmed, { licenseId, databaseName }));
      window.dispatchEvent(new CustomEvent(SYNC_IMPORTED_EVENT));
      setMessage(t('backup.syncPaused'));
      setConfirmed(false);
    } catch (error) { setMessage(t(error instanceof Error && error.message === 'ACCOUNT_MISMATCH' ? 'backup.mismatch' : 'backup.failed')); }
    finally { setBusy(false); }
  };
  const counts = emptyScopeCounts();
  backup?.docs.forEach(d => { const scope = backupScope(String(d._id)); if (scope) counts[scope]++; });
  const issues = result?.failed ?? backup?.issues ?? [];
  return <section className="space-y-4 max-w-3xl" aria-busy={busy}>
    <h2 className="text-lg font-bold">{t('backup.title')}</h2>
    <p className="text-sm text-gray-600">{t('backup.hint')}</p>
    <p className="text-xs text-gray-500">{t('backup.last')}: {last ? new Date(last).toLocaleString(localeFor(language)) : t('backup.never')}</p>
    <fieldset disabled={busy} className="grid grid-cols-1 sm:grid-cols-2 gap-3 border rounded-xl p-4">
      {BACKUP_SCOPES.map(scope => <label key={scope} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={selected.includes(scope)} onChange={() => select(scope, selected, setSelected)} />{t(`backup.${scope}`)}</label>)}
    </fieldset>
    <button disabled={busy || !selected.length} onClick={() => void exportFile()} className="px-4 py-3 rounded-xl bg-emerald-600 text-white disabled:opacity-50">{busy ? t('backup.busy') : t('backup.export')}</button>
    {canRestore && <label className="block border rounded-xl p-4 text-sm font-bold">{t('backup.pick')}<input type="file" accept=".bhbak,.json,application/octet-stream" disabled={busy} className="block mt-2 w-full" onChange={e => { const file = e.target.files?.[0]; if (file) void pickFile(file); e.currentTarget.value = ''; }} /></label>}
    {backup && <div className="border rounded-xl p-4 space-y-3">
      {backup.account && <p className="text-xs break-all">{backup.account.licenseId ?? backup.account.id} · {backup.account.databaseName ?? backup.account.storeDb}</p>}
      {!backup.account && <p role="alert" className="text-amber-800">{t('backup.legacy')}</p>}
      <p className="text-sm text-amber-900">{t('backup.confirm')}</p>
      <fieldset disabled={busy} className="grid grid-cols-1 sm:grid-cols-2 gap-3">{backup.scopes.map(scope => <label key={scope} className="flex gap-2 text-sm"><input type="checkbox" checked={restoreScopes.includes(scope)} onChange={() => { select(scope, restoreScopes, setRestoreScopes); setConfirmed(false); }} />{t(`backup.${scope}`)} ({counts[scope]})</label>)}</fieldset>
      <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={confirmed} disabled={busy} onChange={e => setConfirmed(e.target.checked)} />{t('backup.agree')}</label>
      <button disabled={busy || !confirmed || !restoreScopes.length || !canRestore} onClick={() => void restore()} className="px-4 py-3 rounded-xl bg-amber-700 text-white disabled:opacity-50">{t('backup.restore')}</button>
    </div>}
    {message && <p role="status" className="p-3 rounded-xl border text-sm">{message}</p>}
    {result && <p role="status" className="text-sm font-bold">{t('backup.summary', { written: Object.values(result.written).reduce((a,b) => a+b,0), failed: result.failed.length, skipped: result.skipped })}</p>}
    {result && <ul className="text-sm">{BACKUP_SCOPES.filter(s => restoreScopes.includes(s)).map(s => <li key={s}>{t(`backup.${s}`)}: {result.written[s]}</li>)}</ul>}
    {showHistoryExports && <HistoryExportsPanel storeDb={storeDb} accountName={accountName} />}
    {!!issues.length && <div className="border rounded-xl p-3 overflow-auto"><h3 className="font-bold mb-2">{t('backup.issues')}</h3><table className="text-xs w-full"><thead><tr><th>{t('backup.row')}</th><th>ID</th><th>{t('backup.code')}</th></tr></thead><tbody>{issues.map((issue,i) => <tr key={i}><td>{issue.row}</td><td className="break-all">{issue.id}</td><td>{issue.code}</td></tr>)}</tbody></table></div>}
  </section>;
};
