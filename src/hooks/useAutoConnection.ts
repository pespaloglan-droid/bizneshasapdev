import { useCallback, useEffect, useRef } from 'react';
import { loadConnection, resumeLastConnection, SYNC_DOCS_CHANGED_EVENT, type LinkStatusMap } from '../db/connectionStore';
import { importPcMirrorsIntoStore, SYNC_IMPORTED_EVENT } from '../db/schemaBridge';
import { resolveConflicts, isConflictReviewEnabled, hasReviewableConflicts } from '../db/conflictResolver';
import { useCleanup } from './useCleanup';
/** Çakışma seçilmeden köprü random CouchDB kazananını APK'ya kopyalayamaz. */
export function useAutoConnection(accountId: string, storeDb: string, onStatus?: (s: LinkStatusMap) => void): void {
  const timer = useRef<number>(); const active = useRef(false); const currentDb = useRef(storeDb);
  currentDb.current = storeDb;
  const pullIn = useCallback(() => {
    if (!active.current || currentDb.current !== storeDb) return;
    if (timer.current !== undefined) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      const run = async () => {
        if (!active.current || currentDb.current !== storeDb) return;
        const conflicts = await resolveConflicts(storeDb);
        if (conflicts.validationRejected) return;
        if (!active.current || currentDb.current !== storeDb) return;
        if (isConflictReviewEnabled(storeDb) && await hasReviewableConflicts(storeDb)) return;
        await importPcMirrorsIntoStore(storeDb);
        if (active.current && currentDb.current === storeDb) window.dispatchEvent(new CustomEvent(SYNC_IMPORTED_EVENT));
      };
      void run().catch(() => console.warn('[Sync]', 'bridge_failed'));
    }, 1500);
  }, [storeDb]);
  useCleanup(() => { active.current = false; if (timer.current !== undefined) window.clearTimeout(timer.current); }, [storeDb]);
  useEffect(() => {
    active.current = true;
    const changed = (event: Event) => { if ((event as CustomEvent).detail === storeDb) pullIn(); };
    window.addEventListener(SYNC_DOCS_CHANGED_EVENT, changed);
    if (accountId && storeDb && loadConnection(accountId).active) {
      pullIn(); void resumeLastConnection(accountId, storeDb, onStatus ?? (() => {}), pullIn)
        .catch(() => console.warn('[Sync]', 'resume_failed'));
    }
    return () => window.removeEventListener(SYNC_DOCS_CHANGED_EVENT, changed);
  }, [accountId, storeDb, onStatus, pullIn]);
}
