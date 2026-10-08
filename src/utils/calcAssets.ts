import type {
  Customer,
  CurrencyRate,
  InvoiceRecord,
  Ledger,
  MoneyTransaction,
  Product,
} from '../types';
import { convertToTmt, rateForCode } from '../db/currencyService';
import { computeLedgerBalance } from '../db/ledgerService';
import { isCountedInvoice } from '../db/targowService';
import { inWindow, type DateWindow } from './calcPeriods';

/** Faktura tutary — TMT karşılygy bar bolsa şony ulanýarys. */
export function invoiceTmt(invoice: InvoiceRecord): number {
  return invoice.amountTmt ?? invoice.amountDue;
}

export function invoiceRevenue(
  invoices: readonly InvoiceRecord[],
  window: DateWindow
): number {
  return invoices
    .filter((invoice) => isCountedInvoice(invoice) && inWindow(invoice.createdAt, window))
    .reduce((sum, invoice) => sum + invoiceTmt(invoice), 0);
}

export interface ReceivableRow {
  readonly id: string;
  readonly name: string;
  readonly balance: number;
  readonly lastPayment: string | null;
}

export function receivables(
  customers: readonly Customer[],
  transactions: readonly MoneyTransaction[]
): ReceivableRow[] {
  return customers
    .filter((customer) => customer.type !== 'supplier' && customer.balance > 0)
    .map((customer) => {
      const payments = transactions
        .filter(
          (transaction) =>
            transaction.customerId === customer.id &&
            transaction.category === 'weresiye_yygnamak'
        )
        .sort((a, b) => b.date.localeCompare(a.date));
      const latest = payments[0];
      return {
        id: customer.id,
        name: customer.name,
        balance: customer.balance,
        lastPayment: latest ? latest.date : null,
      };
    })
    .sort((a, b) => b.balance - a.balance);
}

export function totalReceivables(rows: readonly ReceivableRow[]): number {
  return rows.reduce((sum, row) => sum + row.balance, 0);
}

/** Üpjün edijilere bergimiz — tersine balans (minus) bilen saklanýar. */
export function supplierDebts(customers: readonly Customer[]): number {
  return customers
    .filter((customer) => customer.type === 'supplier' && customer.balance < 0)
    .reduce((sum, customer) => sum + Math.abs(customer.balance), 0);
}

export interface StockValuation {
  readonly skuCount: number;
  readonly totalQty: number;
  readonly purchaseValue: number;
  readonly saleValue: number;
  readonly critical: Product[];
}

export function stockValuation(products: readonly Product[]): StockValuation {
  let totalQty = 0;
  let purchaseValue = 0;
  let saleValue = 0;
  const critical: Product[] = [];

  for (const product of products) {
    totalQty += product.stock;
    purchaseValue += product.stock * (product.purchasePrice ?? 0);
    saleValue += product.stock * product.price;
    if (product.criticalStock !== undefined && product.stock <= product.criticalStock) {
      critical.push(product);
    }
  }

  return {
    skuCount: products.length,
    totalQty,
    purchaseValue,
    saleValue,
    critical: critical.sort((a, b) => a.stock - b.stock),
  };
}

export interface LedgerRow {
  readonly id: string;
  readonly name: string;
  readonly currency: string;
  readonly balance: number;
  readonly balanceTmt: number;
}

export function ledgerRows(
  ledgers: readonly Ledger[],
  transactions: readonly MoneyTransaction[],
  currencies: readonly CurrencyRate[]
): LedgerRow[] {
  return ledgers.map((ledger) => {
    const balance = computeLedgerBalance(ledger, transactions);
    return {
      id: ledger.id,
      name: ledger.name,
      currency: ledger.currency,
      balance,
      balanceTmt: convertToTmt(balance, rateForCode(currencies, ledger.currency)),
    };
  });
}

export function totalLedgerTmt(rows: readonly LedgerRow[]): number {
  return rows.reduce((sum, row) => sum + row.balanceTmt, 0);
}

export interface ProductSalesRow {
  readonly productId: string;
  readonly name: string;
  readonly qty: number;
  readonly amount: number;
}

export function productSales(
  invoices: readonly InvoiceRecord[],
  window: DateWindow,
  limit: number,
  direction: 'top' | 'bottom'
): ProductSalesRow[] {
  const map = new Map<string, ProductSalesRow>();

  for (const invoice of invoices) {
    if (!isCountedInvoice(invoice)) continue;
    if (!inWindow(invoice.createdAt, window)) continue;
    for (const item of invoice.items) {
      const current = map.get(item.productId) ?? {
        productId: item.productId,
        name: item.name,
        qty: 0,
        amount: 0,
      };
      map.set(item.productId, {
        ...current,
        qty: current.qty + item.qty,
        amount: current.amount + item.price * item.qty,
      });
    }
  }

  const rows = Array.from(map.values()).sort((a, b) =>
    direction === 'top' ? b.amount - a.amount : a.amount - b.amount
  );
  return rows.slice(0, limit);
}