import { useEffect, useRef, useState } from 'react';
import { useT } from '../../locales/LanguageContext';
import { MIRROR_STATUS_EVENT, pendingMirrorCount } from '../../db/mirrorStatus';
import { startMirrorRetry } from '../../db/mirrorRetry';
export function MirrorSyncWarning({ dbName }: { dbName: string }) {
  const t=useT(); const [pending,setPending]=useState(false); const [busy,setBusy]=useState(false);
  const retry = useRef<ReturnType<typeof startMirrorRetry> | null>(null);
  useEffect(()=>{
    let cancelled=false; let untracked=false; let version=0; setPending(false); setBusy(false);
    const worker=startMirrorRetry(dbName,b=>{if(!cancelled)setBusy(b);}); retry.current=worker;
    const refresh=async(failed=false)=>{
      const current=++version;
      try {const count=await pendingMirrorCount(dbName);if(!cancelled&&current===version&&failed&&count===0)untracked=true;
        if(!cancelled&&current===version){setPending(count>0||untracked);if(count>0)worker.request();}}
      catch {if(!cancelled&&current===version)setPending(true);}
    };
    const changed=(event:Event)=>{const d=(event as CustomEvent).detail;if(d?.dbName===dbName)void refresh(d.pending && d.tracked === false);};
    window.addEventListener(MIRROR_STATUS_EVENT,changed);void refresh();
    return()=>{cancelled=true;worker.stop();retry.current=null;window.removeEventListener(MIRROR_STATUS_EVENT,changed);};
  },[dbName]);
  return pending ? <div role="alert" className="fixed bottom-2 left-2 right-2 z-40 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
    {t('pos.pcMirrorPending')} <button type="button" disabled={busy} onClick={()=>void retry.current?.retryNow()} className="ml-2 underline disabled:opacity-50">{t(busy?'pos.pcMirrorRetrying':'pos.pcMirrorRetry')}</button>
  </div> : null;
}
