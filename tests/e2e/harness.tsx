import { markFirstRunPending, isFirstRunPending } from '../../src/utils/onboarding';
import { seedDemoData } from '../../src/utils/demoData';
import PouchDB from 'pouchdb-browser';
import { buildSelectivePullSelector } from '../../src/db/syncSelection';
import { listDocumentConflicts, resolveReviewedConflict } from '../../src/db/conflictResolver';
// Yalnızca E2E giriş noktası. Üretim index.html/build bu modülü içermez.
import React from 'react';
import { createRoot } from 'react-dom/client';
import '../../src/index.css';
import { PosWorkspace } from '../../src/components/pos/PosWorkspace';
import { LanguageProvider } from '../../src/locales/LanguageContext';
import { translate } from '../../src/locales/i18n';
import * as products from '../../src/db/productService';
import * as customers from '../../src/db/customerService';
import * as sales from '../../src/db/salesService';
import * as pouch from '../../src/db/pouch';
import { saveCustomerPrices } from '../../src/db/customerPriceService';
import { defaultSettings, saveAppSettings } from '../../src/db/settingsService';

async function start() {
  // Web hedefindeki test lisans servisi; gerçek lisans güvenlik testi değildir.
  (window as any).electronAPI = {
    deriveLicenseKey: async () => new Uint8Array(32).fill(9),
    guardLicense: async () => ({ allowed: true, status: 1, reason: 'E2E fixture' }),
  };
  window.print = () => {};
  const user = { id: 'e2e-admin', name: 'E2E admin', role: 'admin' as const, hasPassword: false };
  const account = { id: `e2e_${crypto.randomUUID()}`, name: 'E2E isolated', couchDbUrl: '',
    databaseName: 'e2e', users: [user], createdAt: new Date().toISOString(), transactionCount: 0 };
  const storeDb = pouch.getAccountStoreKey(account);
  const firstRun = new URLSearchParams(window.location.search).has('firstRun');
  if (!firstRun) await products.saveProductToDb({ id: 'e2e-product', sku: '00001', barcode: '00002', name: 'E2E Tea',
    category: 'E2E', price: 10, wholesalePrice: 8, stock: 5, imageType: 'default' }, storeDb);
  if (!firstRun) await saveCustomerPrices(storeDb, 'c-general', [{ productId: 'e2e-product', price: 7.5 }]);
  const settings = defaultSettings('en', account.name); settings.receipt.autoPrint = false;
  await saveAppSettings(settings, storeDb);
  if (firstRun) markFirstRunPending(storeDb);
  (window as any).e2e = {
    pendingFirstRun: () => isFirstRunPending(storeDb),
    async retryDemo() { const p = (await products.getProductsForAccount(storeDb))[0]; await products.saveProductToDb({ ...p, stock: 77 }, storeDb); return seedDemoData(storeDb); },
    async validationQa() {
      const result = await pouch.upsertDocsBatch(storeDb, [
        { id: 'product_bad', fields: { docType: 'product', product: { id: 'bad', price: 'SECRET_DO_NOT_LEAK' } } },
        { id: 'product_e2e-product', fields: { product: { stock: 6 } } },
      ]);
      return { result, products: await products.getProductsForAccount(storeDb) };
    },
    storeDb, t: (key: string) => translate('en', key),
    async selectiveQa() {
      const source = new PouchDB(`e2e-source-${crypto.randomUUID()}`);
      const target = new PouchDB(`e2e-target-${crypto.randomUUID()}`);
      try {
        await source.bulkDocs([
          { _id: 'invoice_old', invoice: { status: 'completed', paymentMethod: 'cash', createdAt: '2025-01-01' } },
          { _id: 'invoice_recent', invoice: { status: 'completed', createdAt: '2026-09-01' } },
          { _id: 'invoice_draft', invoice: { status: 'completed', draftStatus: 'pending', createdAt: '2025-01-01' } },
          { _id: 'invoice_void', invoice: { status: 'voided', createdAt: '2025-01-01' } },
          { _id: 'invoice_legacy', invoice: { status: 'completed' } },
          { _id: 'fatura:legacy', durum: 'onayli', tarih: '2025-01-01' },
          { _id: 'product_old', product: { stock: 4 } },
          { _id: 'customer_old', customer: { balance: 30 } },
          { _id: 'money_old', transaction: { amount: 20, date: '2025-01-01' } },
          { _id: 'invoice_deleted', _deleted: true },
        ]);
        await source.replicate.to(target, { selector: buildSelectivePullSelector(3, new Date('2026-10-12T12:00:00Z')) });
        const rows = (await target.allDocs()).rows.map(row => row.id);
        const deleted = (await target.allDocs({ keys: ['invoice_deleted'] })).rows[0];
        return { rows, tombstone: 'value' in deleted && deleted.value.deleted === true };
      } catch (error: any) { throw new Error(JSON.stringify({ name: error.name, status: error.status, message: error.message, reason: error.reason })); }
      finally { await source.destroy(); await target.destroy(); }
    },
    async conflictQa() {
      const dbName = `e2e-conflicts-${crypto.randomUUID()}`;
      const db = pouch.getLocalDatabase(dbName);
      try {
        await db.bulkDocs([
          { _id: 'urun:1', _rev: '1-aaa', _revisions: { start: 1, ids: ['aaa'] }, ad: 'Newer', updatedAt: '2026-10-01', password: 'must-not-display' },
          { _id: 'urun:1', _rev: '1-bbb', _revisions: { start: 1, ids: ['bbb'] }, ad: 'Older', updatedAt: '2026-01-01' },
        ], { new_edits: false });
        const records = await listDocumentConflicts(dbName);
        const hidden = !JSON.stringify(records).includes('must-not-display');
        await resolveReviewedConflict(dbName, records[0], '1-aaa');
        const saved = await db.get('urun:1', { conflicts: true });
        let staleRejected = false;
        try { await resolveReviewedConflict(dbName, records[0], '1-bbb'); } catch { staleRejected = true; }
        return { hidden, name: saved.ad, conflicts: saved._conflicts?.length ?? 0, staleRejected };
      } finally { await db.destroy(); }
    },

    state: async () => ({ products: await products.getProductsForAccount(storeDb),
      customers: await customers.getCustomersForAccount(storeDb), invoices: await sales.getInvoicesForAccount(storeDb) }),
  };
  createRoot(document.getElementById('root')!).render(<LanguageProvider language="en">
    <PosWorkspace activeAccount={account} currentUser={user} language="en" printerMode="receipt"
      onLogout={() => {}} onSelectLanguage={() => {}} onSelectPrinterMode={() => {}} />
  </LanguageProvider>);
}
void start().catch(error => { document.body.textContent = `E2E setup failed: ${error.message}`; throw error; });
