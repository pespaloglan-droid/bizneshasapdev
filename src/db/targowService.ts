import { InvoiceDraftStatus, InvoiceRecord, Targow, TargowRegion } from '../types';
import { listDocsByPrefix, removeDoc, upsertDoc } from './pouch';
import { sanitizeRegion, sanitizeTargow } from './sanitize';

const TARGOW_PREFIX = 'targow_';
const REGION_PREFIX = 'region_';

export const DRAFT_STATUS_LABELS: Record<InvoiceDraftStatus, string> = {
  pending: 'Garaşylýar',
  accepted: 'Kabul edildi',
  rejected: 'Ret edildi',
};

export const DRAFT_STATUS_STYLES: Record<InvoiceDraftStatus, string> = {
  pending: 'bg-amber-50 text-amber-700',
  accepted: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-rose-50 text-rose-700',
};

/**
 * Targowy istatistiklerine diňe POS-dan göni ýazylan ýa-da
 * merkez tarapyndan KABUL EDILEN fakturalar girýär.
 * Garalama (pending) we ret edilen (rejected) sargytlar hasaba alynmaýar.
 */
export function isCountedInvoice(invoice: InvoiceRecord): boolean {
  if (invoice.status === 'voided') return false;
  return invoice.draftStatus !== 'pending' && invoice.draftStatus !== 'rejected';
}

// ── CRUD: Targowçylar ───────────────────────────────────────────────────────

export async function getTargowsForAccount(storeDb: string): Promise<Targow[]> {
  const docs = await listDocsByPrefix(storeDb, TARGOW_PREFIX);
  return docs
    .filter((doc) => doc.docType === 'targow' && doc.targow)
    .map((doc) => sanitizeTargow(doc.targow))
    .filter((t): t is Targow => t !== null)
    .sort((a, b) => a.fullName.localeCompare(b.fullName, 'tr'));
}

export async function saveTargowToDb(targow: Targow, storeDb: string): Promise<void> {
  await upsertDoc(storeDb, `${TARGOW_PREFIX}${targow.id}`, { docType: 'targow', targow });
}

export async function deleteTargowFromDb(targowId: string, storeDb: string): Promise<boolean> {
  return removeDoc(storeDb, `${TARGOW_PREFIX}${targowId}`);
}

export function generateTargowId(): string {
  return `tgw-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;
}

// ── CRUD: Etraplar ──────────────────────────────────────────────────────────

export async function getRegionsForAccount(storeDb: string): Promise<TargowRegion[]> {
  const docs = await listDocsByPrefix(storeDb, REGION_PREFIX);
  return docs
    .filter((doc) => doc.docType === 'region' && doc.region)
    .map((doc) => sanitizeRegion(doc.region))
    .filter((r): r is TargowRegion => r !== null)
    .sort((a, b) => a.name.localeCompare(b.name, 'tr'));
}

export async function saveRegionToDb(region: TargowRegion, storeDb: string): Promise<void> {
  await upsertDoc(storeDb, `${REGION_PREFIX}${region.id}`, { docType: 'region', region });
}

export async function deleteRegionFromDb(regionId: string, storeDb: string): Promise<boolean> {
  return removeDoc(storeDb, `${REGION_PREFIX}${regionId}`);
}

export function generateRegionId(): string {
  return `rgn-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;
}

export function regionName(
  regions: readonly TargowRegion[],
  regionId: string | undefined
): string {
  if (!regionId) return '—';
  return regions.find((region) => region.id === regionId)?.name ?? '—';
}

export function targowsOnRegion(targows: readonly Targow[], regionId: string): number {
  return targows.filter((targow) => targow.regionIds.includes(regionId)).length;
}

export function countOrdersForTargow(
  invoices: readonly InvoiceRecord[],
  targowId: string
): number {
  return invoices.filter(
    (invoice) => invoice.targowId === targowId && isCountedInvoice(invoice)
  ).length;
}

// ── Döwür we statistika ─────────────────────────────────────────────────────

export type TargowPeriod = 'today' | 'week' | 'month' | 'all';

export interface DateWindow {
  readonly from: Date;
  readonly to: Date;
}

export const PERIOD_LABELS: Record<TargowPeriod, string> = {
  today: 'Şu gün',
  week: 'Şu hepde',
  month: 'Şu aý',
  all: 'Ähli wagt',
};

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function currentWindow(period: TargowPeriod): DateWindow {
  const now = new Date();
  const to = new Date(now.getTime() + 1);
  const dayStart = startOfToday();

  if (period === 'today') return { from: dayStart, to };
  if (period === 'week') {
    const from = new Date(dayStart);
    from.setDate(from.getDate() - 6);
    return { from, to };
  }
  if (period === 'month') return { from: new Date(now.getFullYear(), now.getMonth(), 1), to };
  return { from: new Date(2000, 0, 1), to };
}

export function previousWindow(period: TargowPeriod): DateWindow | null {
  if (period === 'all') return null;
  const current = currentWindow(period);
  const span = current.to.getTime() - current.from.getTime();
  return { from: new Date(current.from.getTime() - span), to: new Date(current.from.getTime()) };
}

function orderDate(invoice: InvoiceRecord): Date {
  return new Date(invoice.createdAt);
}

export function ordersFor(
  invoices: readonly InvoiceRecord[],
  targowId: string,
  window: DateWindow
): InvoiceRecord[] {
  return invoices.filter((invoice) => {
    if (invoice.targowId !== targowId) return false;
    if (!isCountedInvoice(invoice)) return false;
    const date = orderDate(invoice);
    return date >= window.from && date <= window.to;
  });
}

export interface TargowStats {
  orderCount: number;
  totalAmount: number;
  averageAmount: number;
  newCustomerCount: number;
}

export function statsFor(
  invoices: readonly InvoiceRecord[],
  targowId: string,
  window: DateWindow
): TargowStats {
  const orders = ordersFor(invoices, targowId, window);
  const totalAmount = orders.reduce((sum, invoice) => sum + invoice.amountDue, 0);
  const customerIds = new Set(orders.map((invoice) => invoice.customerId).filter(Boolean));

  let newCustomerCount = 0;
  for (const customerId of customerIds) {
    const firstOrder = invoices
      .filter((invoice) => invoice.customerId === customerId && isCountedInvoice(invoice))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];
    if (firstOrder && orderDate(firstOrder) >= window.from && orderDate(firstOrder) <= window.to) {
      newCustomerCount += 1;
    }
  }

  return {
    orderCount: orders.length,
    totalAmount,
    averageAmount: orders.length > 0 ? totalAmount / orders.length : 0,
    newCustomerCount,
  };
}

export type LeaderboardCriterion = 'orders' | 'amount' | 'newCustomers';

export const CRITERION_LABELS: Record<LeaderboardCriterion, string> = {
  orders: 'Iň köp sargyt sany',
  amount: 'Iň köp TMT',
  newCustomers: 'Iň köp täze müşderi',
};

export interface LeaderboardRow {
  readonly targow: Targow;
  readonly rank: number;
  readonly current: TargowStats;
  readonly trendPercent: number | null;
}

export function buildLeaderboard(
  targows: readonly Targow[],
  invoices: readonly InvoiceRecord[],
  period: TargowPeriod,
  criterion: LeaderboardCriterion
): LeaderboardRow[] {
  const window = currentWindow(period);
  const previous = previousWindow(period);

  const rows = targows.map((targow) => {
    const current = statsFor(invoices, targow.id, window);
    let trendPercent: number | null = null;
    if (previous) {
      const before = statsFor(invoices, targow.id, previous);
      if (before.totalAmount > 0) {
        trendPercent = Math.round(((current.totalAmount - before.totalAmount) / before.totalAmount) * 100);
      }
    }
    return { targow, rank: 0, current, trendPercent };
  });

  const metric = (row: LeaderboardRow): number => {
    if (criterion === 'orders') return row.current.orderCount;
    if (criterion === 'newCustomers') return row.current.newCustomerCount;
    return row.current.totalAmount;
  };

  return rows
    .sort((a, b) => metric(b) - metric(a))
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

/** Soňky N günüň gündelik jemi — kiçi grafik (sparkline) üçin. */
export function dailyTotals(
  invoices: readonly InvoiceRecord[],
  targowId: string,
  days: number
): number[] {
  const totals: number[] = [];
  const start = startOfToday();
  start.setDate(start.getDate() - (days - 1));

  for (let index = 0; index < days; index += 1) {
    const dayStart = new Date(start);
    dayStart.setDate(start.getDate() + index);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayStart.getDate() + 1);

    const total = invoices
      .filter((invoice) => invoice.targowId === targowId && isCountedInvoice(invoice))
      .filter((invoice) => {
        const date = orderDate(invoice);
        return date >= dayStart && date < dayEnd;
      })
      .reduce((sum, invoice) => sum + invoice.amountDue, 0);

    totals.push(total);
  }
  return totals;
}
