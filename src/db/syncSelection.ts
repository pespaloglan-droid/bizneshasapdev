export type SyncHistoryMonths = 0 | 3 | 12;
/** Yalnızca tarihi ve tamamlanma durumu kesin mobil faturalar filtrelenir.
 * Eski/şifreli/PC kayıtlar, taslaklar, iptaller ve tüm bakiye/master kayıtları korunur.
 * Yerel geçmiş silinmez; push filtrelenmez. */
export function historyCutoffDay(months: 3 | 12, now = new Date()): string {
  if (![3, 12].includes(months) || !Number.isFinite(now.getTime())) throw new RangeError('INVALID_SYNC_WINDOW');
  const cutoff = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - months, 1));
  const lastDay = new Date(Date.UTC(cutoff.getUTCFullYear(), cutoff.getUTCMonth() + 1, 0)).getUTCDate();
  cutoff.setUTCDate(Math.min(now.getUTCDate(), lastDay));
  return cutoff.toISOString().slice(0, 10);
}
export function buildSelectivePullSelector(months: 3 | 12, now = new Date()): Record<string, unknown> {
  const day = historyCutoffDay(months, now);
  // Düz $not + implicit AND, PouchDB 9'un iç içe $or/$and hatasından kaçınır.
  return { $not: {
    _id: { $regex: '^invoice_' },
    _deleted: { $ne: true },
    'invoice.paymentMethod': { $in: ['cash', 'card'] },
    'invoice.status': { $eq: 'completed' },
    'invoice.draftStatus': { $exists: false },
    'invoice.createdAt': { $type: 'string', $regex: '^\\d{4}-\\d{2}-\\d{2}(?:T|$)', $lt: day },
  } };
}
