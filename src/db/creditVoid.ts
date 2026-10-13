import type { InvoiceRecord, MoneyTransaction } from '../types';
import { prepareDocumentForWrite } from './validation';
import { getLocalDatabase } from './pouch';
import { sanitizeInvoice, sanitizeMoneyTx } from './sanitize';
import { moneyCustomerBalanceDelta } from './moneyService';

/** Tahsilat nakit hareketidir: iptal onu silmez ve otomatik para iadesi yapmaz. */
export function creditVoidRemainingDebt(invoice: InvoiceRecord, transactions: readonly MoneyTransaction[]): number {
  const original = invoice.remainingDebt ?? invoice.amountDue;
  if (invoice.paymentMethod !== 'credit' || !invoice.customerId ||
      !['sales', 'other_out'].includes(invoice.invoiceType)) return original;
  const receipts = transactions.filter(tx => tx.category === 'weresiye_yygnamak' && tx.customerId === invoice.customerId);
  if (receipts.some(tx => !tx.invoiceId)) throw new Error('CREDIT_VOID_ALLOCATION_REQUIRED');
  const linked = transactions.filter(tx => tx.category === 'weresiye_yygnamak' && tx.invoiceId === invoice.id);
  if (linked.some(tx => tx.customerId !== invoice.customerId || typeof tx.amount !== 'number' || !Number.isFinite(tx.amount) || tx.amount < 0 || !['income', 'expense'].includes(tx.type))) throw new Error('CREDIT_VOID_ALLOCATION_REQUIRED');
  const collected = -linked.reduce((sum, tx) => sum + moneyCustomerBalanceDelta(tx), 0);
  const remaining = original - collected;
  if (!Number.isFinite(remaining) || collected < -0.005 || remaining < -0.005) throw new Error('CREDIT_VOID_ALLOCATION_REQUIRED');
  return Math.max(0, Math.round(remaining * 100) / 100);
}

/** Boş listeye düşmek veya UI snapshot'ıyla mali karar vermek yerine okuma hatasını yay. */
export async function readVoidSnapshot(storeDb: string, invoiceId: string) {
  const db = getLocalDatabase(storeDb);
  const doc = await db.get(`invoice_${invoiceId}`) as any;
  prepareDocumentForWrite(`invoice_${invoiceId}`, doc);
  const invoice = sanitizeInvoice(doc.invoice);
  if (!invoice || invoice.id !== invoiceId) throw new Error('VOID_SNAPSHOT_INVALID');
  const rows = await db.allDocs({ startkey: 'money_', endkey: 'money_\uffff', include_docs: true });
  const transactions: MoneyTransaction[] = [];
  for (const row of rows.rows) {
    if (!row.doc) throw new Error('VOID_SNAPSHOT_INVALID');
    prepareDocumentForWrite(row.id, row.doc as any);
    const transaction = sanitizeMoneyTx((row.doc as any)?.transaction);
    if (!transaction) throw new Error('VOID_SNAPSHOT_INVALID');
    transactions.push(transaction);
  }
  return { invoice, transactions };
}
