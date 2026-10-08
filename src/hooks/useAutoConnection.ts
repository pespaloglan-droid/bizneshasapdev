import { useCallback, useEffect, useRef } from 'react';
import { loadConnection, resumeLastConnection, type LinkStatusMap } from '../db/connectionStore';
import { importPcMirrorsIntoStore, SYNC_IMPORTED_EVENT } from '../db/schemaBridge';
import { resolveConflicts } from '../db/conflictResolver';

/**
 * Uygulama açılışında son aktif CouchDB bağlantısını otomatik başlatır.
 *
 * Ayarlar ekranı açılmasa da çalışır (PosWorkspace her zaman mount olur).
 * Bağlantı canlı senkron olduğu için, uzak sunucudan gelen
 * `urun:` / `kagent:` / `fatura:` belgeleri APK kayıtlarına aktarılır.
 */
export function useAutoConnection(
  accountId: string,
  storeDb: string,
  onStatus?: (s: LinkStatusMap) => void
): void {
  const startedFor = useRef<string | null>(null);

  // PC formatındaki ayna belgeleri içeri al + çakışmaları çöz + arayüzü tazele
  const pullIn = useCallback(() => {
    let timer: number | undefined;
    const run = () => {
      if (timer !== undefined) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        void importPcMirrorsIntoStore(storeDb)
          .then(() => resolveConflicts(storeDb))
          .then(() => {
            window.dispatchEvent(new CustomEvent(SYNC_IMPORTED_EVENT));
          });
      }, 1500);
    };
    run();
    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [storeDb]);

  useEffect(() => {
    if (!accountId || !storeDb) return;
    if (!loadConnection(accountId).active) return;
    if (startedFor.current === `${accountId}::${storeDb}`) return;
    startedFor.current = `${accountId}::${storeDb}`;

    const cancelImport = pullIn();
    void resumeLastConnection(accountId, storeDb, onStatus ?? (() => {}), pullIn);

    return () => {
      cancelImport();
      startedFor.current = null;
    };
  }, [accountId, storeDb, onStatus, pullIn]);
}