import { getLocalDatabase, upsertDoc } from './pouch';
export const MIRROR_STATUS_EVENT = 'bh:mirror-status';
const ID = '_local/pc-mirror-pending';
function ids(value: unknown): string[] { return Array.isArray(value) ? value.filter((v): v is string => typeof v==='string') : []; }
/** Yerel durum belgesi replikasyona katılmaz; kayıt içeriği/log credential'ı içermez. */
export async function setMirrorPending(dbName: string, mirrorId: string, pending: boolean, deletedAt?: string): Promise<void> {
  let tracked=true;
  try {
    await upsertDoc(dbName, ID, current => {
      const next=new Set(ids(current?.ids));
      if (pending) next.add(mirrorId); else next.delete(mirrorId);
      const deletionTimes = { ...(current?.deletionTimes as Record<string, string> | undefined) };
      if (pending && deletedAt) deletionTimes[mirrorId]=deletedAt;
      if (!pending) delete deletionTimes[mirrorId];
      return { ids:[...next], deletionTimes };
    });
  } catch { tracked=false; console.warn('MIRROR_STATUS_WRITE_FAILED'); }
  if (typeof window!=='undefined') window.dispatchEvent(new CustomEvent(MIRROR_STATUS_EVENT,{detail:{dbName,pending,tracked}}));
}
export async function pendingMirrorIds(dbName: string): Promise<string[]> {
  try { return ids((await getLocalDatabase(dbName).get(ID) as any).ids); }
  catch(error) { if ((error as {status?:number})?.status===404) return []; throw error; }
}
export async function pendingMirrorCount(dbName: string): Promise<number> {
  return (await pendingMirrorIds(dbName)).length;
}

export async function mirrorDeletionTime(dbName: string, mirrorId: string): Promise<string | undefined> {
  try { return ((await getLocalDatabase(dbName).get(ID) as any).deletionTimes ?? {})[mirrorId]; }
  catch(error) { if ((error as {status?:number})?.status===404) return undefined; throw error; }
}
