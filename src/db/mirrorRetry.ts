import { pendingMirrorIds } from './mirrorStatus';
import { reconcilePcMirror } from './schemaBridge';
export const MIRROR_RETRY_DELAYS = [1000, 5000, 30000] as const;
export interface MirrorRetryResult { attempted: number; failed: number; remaining: number }
const runs = new Map<string, Promise<MirrorRetryResult>>();
/** A single bounded batch per store; errors stay queued. No logging of record/credential payloads. */
export function retryPendingMirrors(dbName: string): Promise<MirrorRetryResult> {
  const active = runs.get(dbName); if (active) return active;
  const task = (async () => {
    const queued = await pendingMirrorIds(dbName);
    let failed = 0;
    for (const id of queued) {
      try { await reconcilePcMirror(dbName, id); } catch { failed++; }
    }
    return { attempted: queued.length, failed, remaining: (await pendingMirrorIds(dbName)).length };
  })();
  runs.set(dbName, task);
  void task.finally(() => { if (runs.get(dbName) === task) runs.delete(dbName); }).catch(() => undefined);
  return task;
}
/** Three automatic rounds per mount/online recovery; failures cannot reset their own budget. */
export function startMirrorRetry(dbName: string, onBusy: (busy: boolean) => void): { request: () => void; retryNow: () => Promise<void>; stop: () => void } {
  let stopped = false; let rounds = 0; let timer: ReturnType<typeof setTimeout> | undefined; let busy = false;
  const clear = () => { if (timer !== undefined) clearTimeout(timer); timer = undefined; };
  const request = () => {
    if (stopped || busy || timer !== undefined || rounds >= MIRROR_RETRY_DELAYS.length) return;
    timer = setTimeout(() => { timer=undefined; rounds++; void run(); }, MIRROR_RETRY_DELAYS[rounds]);
  };
  const run = async () => {
    if (stopped || busy) return;
    busy=true; onBusy(true); let remains=true;
    try { const result=await retryPendingMirrors(dbName); remains=result.remaining>0; if (!remains) rounds=0; }
    catch { /* Queue read failure remains visible; no unsafe assumption of empty queue. */ }
    finally { busy=false; if (!stopped) { onBusy(false); if(remains)request(); } }
  };
  const online = () => { rounds=0; clear(); request(); };
  window.addEventListener('online', online);
  return {
    request,
    retryNow: async () => { clear(); rounds=0; await run(); },
    stop: () => { stopped=true; clear(); window.removeEventListener('online', online); },
  };
}
