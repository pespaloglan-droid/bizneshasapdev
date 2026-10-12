const PREFIX = 'bh_first_run_pending:';
export function markFirstRunPending(dbName: string): void { localStorage.setItem(PREFIX + dbName, 'true'); }
export function isFirstRunPending(dbName: string): boolean {
  try { return localStorage.getItem(PREFIX + dbName) === 'true'; } catch { return false; }
}
export function completeFirstRun(dbName: string): void { localStorage.removeItem(PREFIX + dbName); }
