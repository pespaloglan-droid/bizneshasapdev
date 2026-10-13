import { getLocalDatabase, upsertDoc } from './pouch';
export const MIRROR_STATUS_EVENT = 'bh:mirror-status';
const ID = '_local/pc-mirror-pending';
function ids(value: unknown): string[] { return Array.isArray(value) ? value.filter((v): v is string => typeof v==='string') : []; }
/** Yerel durum belgesi replikasyona katılmaz; kayıt içeriği/log credential'ı içermez. */
export async function setMirrorPending(dbName: string, mirrorId: string, pending: boolean): Promise<void> {
  try {
    await upsertDoc(dbName, ID, current => {
      const next=new Set(ids(current?.ids));
      if (pending) next.add(mirrorId); else next.delete(mirrorId);
      return { ids:[...next] };
    });
  } catch { console.warn('MIRROR_STATUS_WRITE_FAILED'); }
  if (typeof window!=='undefined') window.dispatchEvent(new CustomEvent(MIRROR_STATUS_EVENT,{detail:{dbName,pending}}));
}
export async function pendingMirrorCount(dbName: string): Promise<number> {
  try { return ids((await getLocalDatabase(dbName).get(ID) as any).ids).length; }
  catch(error) { if ((error as {status?:number})?.status===404) return 0; throw error; }
}
