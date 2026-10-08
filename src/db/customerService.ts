import { Customer } from '../types';
import { listDocsByPrefix, removeDoc, upsertDoc, upsertDocsBatch } from './pouch';
import { sanitizeCustomer } from './sanitize';
import { mirrorToPc } from './schemaBridge';

function customerDocId(customerId: string): string {
  return `customer_${customerId}`;
}

export async function saveCustomersBatchDb(customers: readonly Customer[], dbName: string = 'default_store'): Promise<void> {
  const syncedAt = new Date().toISOString();
  const entries = customers.map((c) => ({
    id: customerDocId(c.id),
    fields: {
      docType: 'customer',
      customer: c,
      syncedAt,
    },
  }));
  await upsertDocsBatch(dbName, entries);

  const mirrorPromises = customers.map((c) => mirrorToPc(dbName, 'customer', c));
  await Promise.allSettled(mirrorPromises);
}

export async function saveCustomerToDb(customer: Customer, dbName: string = 'default_store'): Promise<Customer> {
  try {
    const syncedAt = new Date().toISOString();
    await upsertDoc(dbName, customerDocId(customer.id), {
      docType: 'customer',
      customer,
      syncedAt,
    });
    // PC'nin okuyabilmesi için ayna kayıt (kagent:<id>)
    await mirrorToPc(dbName, 'customer', customer);
  } catch (error) {
    console.error('Failed to save customer to PouchDB', error);
  }
  return customer;
}

export async function deleteCustomerFromDb(customerId: string, dbName: string = 'default_store'): Promise<boolean> {
  return removeDoc(dbName, customerDocId(customerId));
}

export async function getCustomersForAccount(dbName: string = 'default_store'): Promise<Customer[]> {
  try {
    const docs = await listDocsByPrefix(dbName, 'customer_');
    return docs
      .filter((doc) => doc.docType === 'customer' && doc.customer)
      .map((doc) => sanitizeCustomer(doc.customer))
      .filter((c): c is Customer => c !== null);
  } catch (error) {
    console.warn('Failed to load customers from PouchDB:', error);
    return [];
  }
}

// ── Umumy (Varsayylan) Müşderi ──────────────────────────────────────────────

/** Umumy müşderiniň durnukly ID-si — ähli ýerde şu ID ulanylýar. */
export const GENERAL_CUSTOMER_ID = 'c-general';

/** Umumy müşderiniň ady. */
export const GENERAL_CUSTOMER_NAME = 'Umumy Müşderi';

/**
 * "Umumy Müşderi" hakyky müşderi ýazgysy hökmünde bardygyny üpjün edýär.
 *
 * Öň bu diňe Faktura ekranyndaky wagtlaýyn saýlawdy (`customerId = null`),
 * şonuň üçin nesiýe bergisi hiç ýerde ýazylmaýardy. Indi ol hakyky ýazgy —
 * nesiýe satuwlary beýleki müşderiler ýaly şu hasaba düşýär.
 *
 * Idempotent: eýýäm bar bolsa täzeden döredilmeýär.
 */
export async function ensureGeneralCustomerSeeded(
  dbName: string = 'default_store'
): Promise<Customer[]> {
  const customers = await getCustomersForAccount(dbName);
  if (customers.some((customer) => customer.id === GENERAL_CUSTOMER_ID)) {
    return customers;
  }
  const general: Customer = {
    id: GENERAL_CUSTOMER_ID,
    name: GENERAL_CUSTOMER_NAME,
    type: 'customer',
    balance: 0,
  };
  await saveCustomerToDb(general, dbName);
  return [general, ...customers];
}
