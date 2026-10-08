import { InvoiceRecord } from '../types';
import { listDocsByPrefix, removeDoc, upsertDoc } from './pouch';
import { sanitizeInvoice } from './sanitize';
import { mirrorToPc } from './schemaBridge';

export async function saveInvoiceToDb(invoice: InvoiceRecord, dbName: string = 'default_store'): Promise<InvoiceRecord> {
  try {
    const syncedAt = new Date().toISOString();
    await upsertDoc(dbName, `invoice_${invoice.id}`, {
      docType: 'invoice',
      invoice,
      syncedAt,
    });
    // PC'nin okuyabilmesi için ayna kayıt (fatura:<id>)
    await mirrorToPc(dbName, 'invoice', invoice);
  } catch (error) {
    console.error('Failed to save invoice to PouchDB', error);
  }
  return invoice;
}

/**
 * Fakturany DYNWLY POZÝAR (diňe administrator — "Silinen fakturalar" ekrany).
 * Soft-delete (status:'voided') däl, hakyky ýazgyny pozýar.
 */
export async function deleteInvoicePermanently(
  invoiceId: string,
  dbName: string = 'default_store'
): Promise<boolean> {
  return removeDoc(dbName, `invoice_${invoiceId}`);
}

export async function getInvoicesForAccount(dbName: string = 'default_store'): Promise<InvoiceRecord[]> {
  try {
    const docs = await listDocsByPrefix(dbName, 'invoice_');
    return docs
      .filter((doc) => doc.docType === 'invoice' && doc.invoice)
      .map((doc) => sanitizeInvoice(doc.invoice))
      .filter((inv): inv is InvoiceRecord => inv !== null)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  } catch (error) {
    console.warn('Failed to load invoices from PouchDB:', error);
    return [];
  }
}

export function generateInvoiceNo(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `INV-${dateStr}-${randomSuffix}`;
}
