import { useEffect, useState } from 'react';
import { useT } from '../locales/LanguageContext';
import { CONFLICT_REVIEW_EVENT, isConflictReviewEnabled, setConflictReviewEnabled,
  listDocumentConflicts, resolveReviewedConflict, type DocumentConflict } from '../db/conflictResolver';
import { SYNC_IMPORTED_EVENT } from '../db/schemaBridge';

/** Tercih bu hesap/veritabanı ve cihaz içindir; varsayılan sessiz LWW değişmez. */
export function ConflictResolverModal({ dbName }: { dbName: string }) {
  const t = useT();
  const [review, setReview] = useState(() => isConflictReviewEnabled(dbName));
  const [open, setOpen] = useState(false);
  const [records, setRecords] = useState<DocumentConflict[]>([]);
  const [choices, setChoices] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    setReview(isConflictReviewEnabled(dbName)); setOpen(false); setRecords([]); setChoices({});
    const update = () => setReview(isConflictReviewEnabled(dbName));
    window.addEventListener(CONFLICT_REVIEW_EVENT, update);
    return () => window.removeEventListener(CONFLICT_REVIEW_EVENT, update);
  }, [dbName]);
  async function refresh() {
    setBusy(true); setError(''); setChoices({});
    try { setRecords(await listDocumentConflicts(dbName)); }
    catch { setRecords([]); setError(t('conflicts.readFailed')); }
    finally { setBusy(false); }
  }
  async function apply() {
    setBusy(true); setError(''); let failed = false;
    for (const record of records) {
      if (!choices[record.id]) continue;
      try { await resolveReviewedConflict(dbName, record, choices[record.id]); }
      catch { failed = true; }
    }
    window.dispatchEvent(new CustomEvent(SYNC_IMPORTED_EVENT));
    await refresh();
    if (failed) setError(t('conflicts.changed'));
  }
  return <section className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
    <label className="flex gap-2 items-center text-xs font-semibold">
      <input type="checkbox" checked={review} onChange={event => {
        try { setConflictReviewEnabled(dbName, event.target.checked); setReview(event.target.checked); }
        catch { setError(t('conflicts.changed')); }
      }} />{t('conflicts.review')}
    </label>
    <p className="text-xs text-gray-500">{t('conflicts.hint')}</p>
    <button type="button" className="px-3 py-2 border rounded-lg text-xs" onClick={() => { setOpen(true); void refresh(); }}>{t('conflicts.title')}</button>
    {open && <div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-3" role="dialog" aria-modal="true" aria-label={t('conflicts.title')}>
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-4 space-y-4">
        <header className="flex justify-between gap-3"><h2 className="font-bold">{t('conflicts.title')}</h2>
          <button disabled={busy} onClick={() => setOpen(false)}>{t('conflicts.close')}</button></header>
        <p className="text-xs text-gray-500">{t('conflicts.originHint')}</p>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        {busy && <p>{t('conflicts.loading')}</p>}
        {!busy && !records.length && !error && <p>{t('conflicts.empty')}</p>}
        <div className="flex gap-2 flex-wrap">
          <button disabled={busy} onClick={() => void refresh()} className="border rounded-lg px-3 py-2">{t('conflicts.refresh')}</button>
          <button disabled={busy || !records.length} className="border rounded-lg px-3 py-2" onClick={() => setChoices(Object.fromEntries(records.map(record => [record.id,
            record.versions.reduce((best, version) => version.timestamp > best.timestamp ? version : best).rev])))}>{t('conflicts.newest')}</button>
          <button disabled={busy || !Object.keys(choices).length} onClick={() => void apply()} className="bg-emerald-600 text-white disabled:opacity-40 rounded-lg px-3 py-2">{t('conflicts.apply', { count: Object.keys(choices).length })}</button>
        </div>
        {records.map(record => <section key={record.id} className="border rounded-lg p-3 space-y-2">
          <h3 className="text-xs font-mono break-all">{record.id}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{record.versions.map(version => <label key={version.rev} className={`border rounded-lg p-3 ${choices[record.id] === version.rev ? 'border-emerald-500 bg-emerald-50' : ''}`}>
            <span className="text-sm font-bold">{t(version.rev === record.currentRev ? 'conflicts.current' : 'conflicts.other')}</span>
            <span className="block text-xs font-mono break-all">{version.rev}</span>
            <pre className="text-xs whitespace-pre-wrap break-all max-h-56 overflow-y-auto my-2">{JSON.stringify(version.fields, null, 2)}</pre>
            <span className="flex gap-2 items-center"><input type="radio" name={record.id} disabled={busy} checked={choices[record.id] === version.rev} onChange={() => setChoices(previous => ({ ...previous, [record.id]: version.rev }))} />{t('conflicts.choose')}</span>
          </label>)}</div>
        </section>)}
      </div>
    </div>}
  </section>;
}
