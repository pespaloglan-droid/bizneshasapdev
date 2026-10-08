import type { MoneyCategoryId, MoneyPaymentMethod, MoneyTransaction } from '../types';
import { PAYMENT_METHOD_LABELS, categoryLabel } from '../db/moneyService';
import { inWindow, trendBuckets, type DateWindow } from './calcPeriods';

/** Beýleki walýutadaky ýazgylar üçin hem TMT karşılygyny ulanýarys. */
export function moneyTmt(transaction: MoneyTransaction): number {
  return transaction.amountTmt ?? transaction.amount;
}

export interface FlowTotals {
  readonly income: number;
  readonly expense: number;
  readonly net: number;
}

export function flowTotals(
  transactions: readonly MoneyTransaction[],
  window: DateWindow
): FlowTotals {
  let income = 0;
  let expense = 0;
  for (const transaction of transactions) {
    if (!inWindow(transaction.date, window)) continue;
    if (transaction.type === 'income') income += moneyTmt(transaction);
    else expense += moneyTmt(transaction);
  }
  return { income, expense, net: income - expense };
}

export interface CategoryRow {
  readonly id: MoneyCategoryId;
  readonly label: string;
  readonly total: number;
  readonly count: number;
}

export function categoryRows(
  transactions: readonly MoneyTransaction[],
  window: DateWindow,
  type: 'income' | 'expense'
): CategoryRow[] {
  const map = new Map<MoneyCategoryId, { total: number; count: number }>();
  for (const transaction of transactions) {
    if (transaction.type !== type) continue;
    if (!inWindow(transaction.date, window)) continue;
    const entry = map.get(transaction.category) ?? { total: 0, count: 0 };
    entry.total += moneyTmt(transaction);
    entry.count += 1;
    map.set(transaction.category, entry);
  }
  return Array.from(map.entries())
    .map(([id, value]) => ({ id, label: categoryLabel(id), total: value.total, count: value.count }))
    .sort((a, b) => b.total - a.total);
}

export interface TrendPoint {
  readonly label: string;
  readonly income: number;
  readonly expense: number;
}

export function flowTrend(
  transactions: readonly MoneyTransaction[],
  window: DateWindow
): TrendPoint[] {
  return trendBuckets(window).map((bucket) => {
    let income = 0;
    let expense = 0;
    for (const transaction of transactions) {
      const date = new Date(transaction.date);
      if (Number.isNaN(date.getTime())) continue;
      if (date < bucket.from || date >= bucket.to) continue;
      if (transaction.type === 'income') income += moneyTmt(transaction);
      else expense += moneyTmt(transaction);
    }
    return { label: bucket.label, income, expense };
  });
}

export interface PaymentMixRow {
  readonly method: MoneyPaymentMethod;
  readonly label: string;
  readonly total: number;
}

export function paymentMix(
  transactions: readonly MoneyTransaction[],
  window: DateWindow
): PaymentMixRow[] {
  const map = new Map<MoneyPaymentMethod, number>();
  for (const transaction of transactions) {
    if (!inWindow(transaction.date, window)) continue;
    if (transaction.type !== 'income') continue;
    map.set(transaction.paymentMethod, (map.get(transaction.paymentMethod) ?? 0) + moneyTmt(transaction));
  }
  return Array.from(map.entries())
    .map(([method, total]) => ({ method, label: PAYMENT_METHOD_LABELS[method], total }))
    .sort((a, b) => b.total - a.total);
}

function categoryTotal(
  transactions: readonly MoneyTransaction[],
  window: DateWindow,
  category: MoneyCategoryId
): number {
  return transactions
    .filter((transaction) => transaction.category === category && inWindow(transaction.date, window))
    .reduce((sum, transaction) => sum + moneyTmt(transaction), 0);
}

/** Kassa modulyndaky "Karz almak" — biziň bergimiz. */
export function borrowedTotal(
  transactions: readonly MoneyTransaction[],
  window: DateWindow
): number {
  return categoryTotal(transactions, window, 'karz_almak');
}

/** Kassa modulyndaky "Karz bermek" — başgalara beren karzyny. */
export function lentTotal(
  transactions: readonly MoneyTransaction[],
  window: DateWindow
): number {
  return categoryTotal(transactions, window, 'karz_bermek');
}

/** Müşderi balansyndan gelýän umumy alacak (diňe müşderiler). */
export function paymentMixTotal(rows: readonly PaymentMixRow[]): number {
  return rows.reduce((sum, row) => sum + row.total, 0);
}