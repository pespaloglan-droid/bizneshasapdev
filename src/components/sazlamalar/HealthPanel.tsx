import { CONNECTION_STATUS_EVENT, getConnectionHealth } from '../../db/connectionStore';
import React, { useEffect, useState } from 'react';
import { getLocalDatabase } from '../../db/pouch';
import { pendingMirrorCount } from '../../db/mirrorStatus';
import { lastBackupAt } from '../../db/backupService';
import { useT, useLanguage } from '../../locales/LanguageContext';
import { localeFor } from '../../utils/locale';
interface Snapshot { bytes?: number; pending?: number; usage?: number; quota?: number; partial: boolean }
export const HealthPanel: React.FC<{ storeDb: string; syncStates?: readonly string[]; licenseDays?: number }> = ({ storeDb, syncStates, licenseDays }) => {
  const t = useT(); const { language } = useLanguage();
  const [liveStates, setLiveStates] = useState<readonly string[] | undefined>(syncStates);
  useEffect(() => {
    const update = () => { const status = getConnectionHealth(storeDb); setLiveStates(status ? [status.local.state, status.online.state] : syncStates); };
    update();
    const changed = (event: Event) => { if ((event as CustomEvent).detail?.storeDb === storeDb) update(); };
    window.addEventListener(CONNECTION_STATUS_EVENT, changed);
    return () => window.removeEventListener(CONNECTION_STATUS_EVENT, changed);
  }, [storeDb, syncStates]);
  const [snapshot, setSnapshot] = useState<Snapshot>({ partial: false });
  const [generation, setGeneration] = useState(0); const [busy, setBusy] = useState(false);
  useEffect(() => {
    let cancelled = false; setBusy(true);
    void (async () => {
      const values = await Promise.allSettled([
        getLocalDatabase(storeDb).allDocs({ include_docs: true }), pendingMirrorCount(storeDb),
        navigator.storage?.estimate?.() ?? Promise.resolve(undefined),
      ]);
      if (cancelled) return;
      const docs = values[0].status === 'fulfilled' ? values[0].value : undefined;
      const storage = values[2].status === 'fulfilled' ? values[2].value : undefined;
      setSnapshot({ bytes: docs ? new TextEncoder().encode(JSON.stringify(docs.rows.map(r => r.doc))).byteLength : undefined,
        pending: values[1].status === 'fulfilled' ? values[1].value : undefined,
        usage: storage?.usage, quota: storage?.quota, partial: values.some(v => v.status === 'rejected') });
      setBusy(false);
    })();
    return () => { cancelled = true; };
  }, [storeDb, generation]);
  const number = (n: number | undefined) => n === undefined ? t('backup.unknown') : n.toLocaleString(localeFor(language));
  const bytes = (n: number | undefined) => n === undefined ? t('backup.unknown') : `${(n / (1024 * 1024)).toLocaleString(localeFor(language), { maximumFractionDigits: 2 })} MB`;
  const last = lastBackupAt(storeDb);
  return <section className="space-y-4 max-w-3xl" aria-busy={busy}>
    <h2 className="text-lg font-bold">{t('backup.health')}</h2>
    <button disabled={busy} className="border rounded-xl px-4 py-2" onClick={() => setGeneration(v => v + 1)}>{t(busy ? 'backup.busy' : 'backup.refresh')}</button>
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 border rounded-xl p-4 text-sm">
      <dt>{t('backup.sync')}</dt><dd>{liveStates?.length ? liveStates.map(s => t(s === 'connected' ? 'conn.statusConnected' : s === 'connecting' ? 'conn.connecting' : s === 'error' ? 'conn.statusError' : 'conn.statusOffline')).join(' / ') : t('backup.unknown')}</dd>
      <dt>{t('backup.pending')}</dt><dd>{number(snapshot.pending)}</dd>
      <dt>{t('backup.dbSize')}</dt><dd>{bytes(snapshot.bytes)}</dd>
      <dt>{t('backup.storage')}</dt><dd>{bytes(snapshot.usage)} / {bytes(snapshot.quota)}</dd>
      <dt>{t('backup.last')}</dt><dd>{last ? new Date(last).toLocaleString(localeFor(language)) : t('backup.never')}</dd>
      <dt>{t('backup.licenseDays')}</dt><dd>{number(licenseDays)}</dd>
    </dl>
    {snapshot.partial && <p role="alert">{t('backup.partial')}</p>}
    {snapshot.usage !== undefined && snapshot.quota !== undefined && snapshot.quota > 0 && snapshot.usage / snapshot.quota > .9 && <p role="alert" className="text-red-700">{t('backup.lowStorage')}</p>}
  </section>;
};
