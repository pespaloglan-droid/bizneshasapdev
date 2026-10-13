import { useEffect, useState } from 'react';
import { useT } from '../../locales/LanguageContext';
import { MIRROR_STATUS_EVENT, pendingMirrorCount } from '../../db/mirrorStatus';
export function MirrorSyncWarning({ dbName }: { dbName: string }) {
  const t=useT(); const [pending,setPending]=useState(false);
  useEffect(()=>{
    let cancelled=false; let untracked=false; setPending(false);
    const refresh=async(failed=false)=>{
      try {const count=await pendingMirrorCount(dbName);if(failed&&count===0)untracked=true;if(!cancelled)setPending(count>0||untracked);}
      catch {if(!cancelled&&failed)setPending(true);}
    };
    const changed=(event:Event)=>{const d=(event as CustomEvent).detail;if(d?.dbName===dbName)void refresh(d.pending);};
    window.addEventListener(MIRROR_STATUS_EVENT,changed);void refresh();
    return()=>{cancelled=true;window.removeEventListener(MIRROR_STATUS_EVENT,changed);};
  },[dbName]);
  return pending ? <div role="alert" className="fixed bottom-2 left-2 right-2 z-40 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">{t('pos.pcMirrorPending')}</div> : null;
}
