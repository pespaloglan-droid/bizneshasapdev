import { startCouchDbSync, type CouchAuth, type SyncStatus } from './pouch';
export function startSelectiveSync(localDbName: string, remoteUrl: string, options: {
  historyMonths: 3 | 12; auth?: CouchAuth;
  onStatusChange?: (status: SyncStatus) => void;
  onDocsChanged?: (info: { written: number; read: number }) => void;
}): () => void {
  return startCouchDbSync(localDbName, remoteUrl, options.auth, options.onStatusChange, options.onDocsChanged, options.historyMonths);
}
