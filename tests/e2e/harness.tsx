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
  await products.saveProductToDb({ id: 'e2e-product', sku: '00001', barcode: '00002', name: 'E2E Tea',
    category: 'E2E', price: 10, wholesalePrice: 8, stock: 5, imageType: 'default' }, storeDb);
  await saveCustomerPrices(storeDb, 'c-general', [{ productId: 'e2e-product', price: 7.5 }]);
  const settings = defaultSettings('en', account.name); settings.receipt.autoPrint = false;
  await saveAppSettings(settings, storeDb);
  (window as any).e2e = {
    storeDb, t: (key: string) => translate('en', key),
    state: async () => ({ products: await products.getProductsForAccount(storeDb),
      customers: await customers.getCustomersForAccount(storeDb), invoices: await sales.getInvoicesForAccount(storeDb) }),
  };
  createRoot(document.getElementById('root')!).render(<LanguageProvider language="en">
    <PosWorkspace activeAccount={account} currentUser={user} language="en" printerMode="receipt"
      onLogout={() => {}} onSelectLanguage={() => {}} onSelectPrinterMode={() => {}} />
  </LanguageProvider>);
}
void start().catch(error => { document.body.textContent = `E2E setup failed: ${error.message}`; throw error; });
