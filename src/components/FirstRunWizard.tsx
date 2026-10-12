import { useEffect, useState } from 'react';
import type { Account, LanguageCode } from '../types';
import { useT } from '../locales/LanguageContext';
import { getLocalDatabase } from '../db/pouch';
import { SYNC_IMPORTED_EVENT } from '../db/schemaBridge';
import { ConnectionFields } from './pos/ConnectionFields';
import { completeFirstRun, isFirstRunPending } from '../utils/onboarding';
import { seedDemoData } from '../utils/demoData';

/** Sadece bu sürümle yeni açılan hesaplarda; mevcut hesaplara otomatik demo eklemez. */
export function FirstRunWizard({ account, dbName, language, isAdmin }: {
  account: Account; dbName: string; language: LanguageCode; isAdmin: boolean;
}) {
  const t = useT(); const [open, setOpen] = useState(false); const [step, setStep] = useState(0);
  const [demo, setDemo] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState(false);
  useEffect(() => {
    let cancelled = false; setOpen(false); setStep(0); setDemo(false);
    if (!isAdmin || !isFirstRunPending(dbName)) return;
    void (async () => { const db = getLocalDatabase(dbName); await db.info(); return db.allDocs(); })().then(result => {
      if (cancelled) return;
      const hasBusinessData = result.rows.some(row => /^(product_|urun:|invoice_|fatura:|money_)/.test(row.id) ||
        (/^(customer_|kagent:)/.test(row.id) && !['customer_c-general', 'kagent:c-general'].includes(row.id)));
      if (hasBusinessData || account.transactionCount > 0) { completeFirstRun(dbName); return; }
      setOpen(true);
    }).catch(() => { /* DB/lisans okunamazsa yeni/boş hesap varsayılmaz. */ });
    return () => { cancelled = true; };
  }, [dbName, isAdmin, account.transactionCount]);
  async function finish(withDemo: boolean) {
    setBusy(true); setError(false);
    try {
      if (withDemo) await seedDemoData(dbName);
      completeFirstRun(dbName); window.dispatchEvent(new CustomEvent(SYNC_IMPORTED_EVENT)); setOpen(false);
    } catch { setError(true); }
    finally { setBusy(false); }
  }
  if (!open) return null;
  return <div className="fixed inset-0 z-[80] bg-black/50 flex justify-center items-center p-3" role="dialog" aria-modal="true" aria-label={t('wizard.title')}>
    <section className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-5 space-y-4">
      <h2 className="font-bold text-lg">{t('wizard.title')}</h2>
      {step === 0 && <p className="text-sm text-gray-600">{t('wizard.welcome')}</p>}
      {step === 1 && <><p className="text-sm text-gray-600">{t('wizard.syncHint')}</p>
        <ConnectionFields accountId={account.id} storeDb={dbName} language={language} />
      </>}
      {step === 2 && <><p className="text-sm text-gray-600">{t('wizard.demoHint')}</p>
        <label className="flex gap-2 text-sm"><input type="checkbox" disabled={busy} checked={demo} onChange={e => setDemo(e.target.checked)} />{t('wizard.demoOptIn')}</label>
      </>}
      {error && <p role="alert" className="text-sm text-red-600">{t('wizard.failed')}</p>}
      <footer className="flex justify-between gap-3">
        <button disabled={busy} onClick={() => void finish(false)} className="border rounded-xl px-3 py-2">{t('wizard.skip')}</button>
        <div className="flex gap-2">
          {step > 0 && <button disabled={busy} onClick={() => setStep(step - 1)} className="border rounded-xl px-3 py-2">{t('wizard.back')}</button>}
          <button disabled={busy} onClick={() => step < 2 ? setStep(step + 1) : void finish(demo)} className="bg-emerald-600 text-white rounded-xl px-4 py-2">
            {t(step === 2 ? 'wizard.finish' : 'wizard.next')}
          </button>
        </div>
      </footer>
    </section>
  </div>;
}
