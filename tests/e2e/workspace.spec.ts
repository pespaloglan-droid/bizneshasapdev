import { test, expect, type Page } from '@playwright/test';
const text = (page: Page, key: string): Promise<string> => page.evaluate(key => (window as any).e2e.t(key), key);
const state = (page: Page) => page.evaluate(() => (window as any).e2e.state());
async function fillField(page: Page, key: string, value: string) {
  await page.locator('label').filter({ hasText: await text(page, key) }).locator('..').locator('input').fill(value);
}
test.beforeEach(async ({ page }, testInfo) => {
  if (testInfo.title.startsWith('sihirbaz:')) {
    await page.goto('/tests/e2e/harness.html?firstRun=1');
    await expect(page.getByRole('dialog', { name: 'First-run setup' })).toBeVisible(); return;
  }
  await page.goto('/tests/e2e/harness.html');
  await expect(page.getByText('E2E Tea', { exact: true })).toBeVisible();
});
test('checkout: F7 özel fiyat, F8 toptan fiyat, F5 satış ve kalıcı stok', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.getByText('E2E Tea', { exact: true }).click();
  await page.keyboard.press('F7');
  await expect.poll(() => page.locator('input[type=number]').evaluateAll(inputs => inputs.some(input => (input as HTMLInputElement).value === '7.5'))).toBe(true);
  await page.keyboard.press('F8');
  await expect.poll(() => page.locator('input[type=number]').evaluateAll(inputs => inputs.some(input => (input as HTMLInputElement).value === '8'))).toBe(true);
  await page.keyboard.press('F5');
  await expect.poll(async () => (await state(page)).invoices.length).toBe(1);
  await expect.poll(async () => (await state(page)).products[0].stock).toBe(4);
  const saved = await state(page);
  expect(saved.invoices[0]).toMatchObject({ amountDue: 8, customerId: 'c-general', status: 'completed' });
  expect(saved.invoices[0].items[0]).toMatchObject({ sku: '00001', price: 8, qty: 1 });
  expect(errors).toEqual([]);
});
test('ürün: ekle, düzenle, sil ve DB kalıcılığı', async ({ page }) => {
  await page.getByRole('button', { name: await text(page, 'tabHaryt'), exact: true }).click();
  await page.getByRole('button', { name: await text(page, 'products.newProduct'), exact: true }).click();
  await page.getByPlaceholder(await text(page, 'products.namePlaceholder'), { exact: true }).fill('E2E New Product');
  await page.getByPlaceholder('8690000000000', { exact: true }).fill('001234567890');
  await fillField(page, 'products.priceLabel', '12.5');
  await page.getByRole('button', { name: await text(page, 'products.saveBtn'), exact: true }).click();
  await expect.poll(async () => (await state(page)).products.some((p: any) => p.name === 'E2E New Product' && p.barcode === '001234567890')).toBe(true);
  let row = page.getByRole('row').filter({ hasText: 'E2E New Product' });
  await row.getByTitle(await text(page, 'products.editAction'), { exact: true }).click();
  await page.getByPlaceholder(await text(page, 'products.namePlaceholder'), { exact: true }).fill('E2E Updated Product');
  await fillField(page, 'products.priceLabel', '13.75');
  await page.getByRole('button', { name: await text(page, 'products.saveBtn'), exact: true }).click();
  await expect.poll(async () => (await state(page)).products.some((p: any) => p.name === 'E2E Updated Product' && p.price === 13.75)).toBe(true);
  row = page.getByRole('row').filter({ hasText: 'E2E Updated Product' });
  await row.getByTitle(await text(page, 'delete'), { exact: true }).click();
  await page.getByText(await text(page, 'delete'), { exact: true }).click();
  await expect.poll(async () => (await state(page)).products.some((p: any) => p.barcode === '001234567890')).toBe(false);
});
test('müşteri: kart ekle, düzenle, sil; genel müşteri korunur', async ({ page }) => {
  await page.getByRole('button', { name: await text(page, 'tabMusteri'), exact: true }).click();
  await page.getByRole('button', { name: await text(page, 'customers.addCustomer'), exact: true }).click();
  await page.getByPlaceholder(await text(page, 'customers.namePlaceholder'), { exact: true }).fill('E2E New Customer');
  await page.getByPlaceholder('+993 65...', { exact: true }).fill('+99365000001');
  await page.getByRole('button', { name: await text(page, 'customers.saveCreateBtn'), exact: true }).click();
  await expect.poll(async () => (await state(page)).customers.some((c: any) => c.name === 'E2E New Customer')).toBe(true);
  const row = page.getByRole('row').filter({ hasText: 'E2E New Customer' });
  await row.getByTitle(await text(page, 'customers.editAction'), { exact: true }).click();
  await page.getByPlaceholder('+993 65...', { exact: true }).fill('+99365000002');
  await page.getByRole('button', { name: await text(page, 'save'), exact: true }).click();
  await expect.poll(async () => (await state(page)).customers.some((c: any) => c.name === 'E2E New Customer' && c.phone === '+99365000002')).toBe(true);
  await row.getByTitle(await text(page, 'delete'), { exact: true }).click();
  await expect.poll(async () => (await state(page)).customers.some((c: any) => c.name === 'E2E New Customer')).toBe(false);
  expect((await state(page)).customers.some((c: any) => c.id === 'c-general')).toBe(true);
});


test('seçici indirme: bakiye taslak iptal eski format ve tombstone korunur', async ({ page }) => {
  const result = await page.evaluate(() => (window as any).e2e.selectiveQa());
  expect(result.rows).not.toContain('invoice_old');
  for (const id of ['invoice_recent', 'invoice_draft', 'invoice_void', 'invoice_legacy',
    'fatura:legacy', 'product_old', 'customer_old', 'money_old']) expect(result.rows).toContain(id);
  expect(result.tombstone).toBe(true);
});
test('çakışma seçimi: gerçek revision dalları temizlenir eski seçim reddedilir', async ({ page }) => {
  expect(await page.evaluate(() => (window as any).e2e.conflictQa())).toEqual({
    hidden: true, name: 'Newer', conflicts: 0, staleRejected: true,
  });
});
test('telemetri: varsayılan izinler kapalı, kendiliğinden servis isteği yok', async ({ page }) => {
  const telemetryRequests: string[] = [];
  page.on('request', request => { if (/posthog\.com|sentry\.io/.test(request.url())) telemetryRequests.push(request.url()); });
  await page.reload(); await expect(page.getByText('E2E Tea', { exact: true })).toBeVisible();
  const consent = await page.evaluate(async () => (await import('/src/utils/telemetry.ts')).readTelemetryConsent());
  expect(consent).toEqual({ analytics: false, crashes: false }); expect(telemetryRequests).toEqual([]);
});


test('sihirbaz: demo varsayılan kapalı ve atlama finansal kayıt oluşturmaz', async ({ page }) => {
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByRole('checkbox', { name: 'Add sample products and customer' })).not.toBeChecked();
  await page.getByRole('button', { name: 'Finish without demo', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'First-run setup' })).not.toBeVisible();
  const saved = await state(page); expect(saved.products).toEqual([]); expect(saved.invoices).toEqual([]);
  expect(await page.evaluate(() => (window as any).e2e.pendingFirstRun())).toBe(false);
});
test('sihirbaz: açık rızalı demo idempotent ve mevcut stok ezilmez', async ({ page }) => {
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Add sample products and customer' }).check();
  await page.getByRole('button', { name: 'Finish', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'First-run setup' })).not.toBeVisible();
  await expect.poll(async () => (await state(page)).products.length).toBe(2);
  expect((await state(page)).invoices).toEqual([]);
  expect((await state(page)).customers.filter((c: any) => c.id === 'demo-customer-v1')).toHaveLength(1);
  expect(await page.evaluate(() => (window as any).e2e.retryDemo())).toEqual({ products: 0, customers: 0 });
  expect((await state(page)).products.some((p: any) => p.stock === 77)).toBe(true);
});
test('doğrulama: karışık batch geçerliyi yazar hatalı değeri ve sıfırlı SKUyu değiştirmez', async ({ page }) => {
  const { result, products } = await page.evaluate(() => (window as any).e2e.validationQa());
  expect(result.written).toBe(1); expect(result.failed).toHaveLength(1);
  expect(JSON.stringify(result.failed)).not.toContain('SECRET_DO_NOT_LEAK');
  expect(products).toHaveLength(1); expect(products[0]).toMatchObject({ stock: 6, sku: '00001', price: 10 });
});
test('Excel: gerçek xlsx roundtrip, sabit TM başlıkları, sıfırlı kimlikler ve alias belirsizliği', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const ExcelJS = (await import('/node_modules/.vite/deps/exceljs.js')).default;
    const { buildStyledSheet, buildMetaSheet, writeWorkbook } = await import('/src/utils/excelWriter.ts');
    const { buildProductColumns } = await import('/src/utils/styledExports.ts');
    const { readProductFile, parseRows, PRODUCT_EXCEL_COLUMNS } = await import('/src/utils/productExcel.ts');
    const { detectExcelColumns, validExcelSelection } = await import('/src/utils/excelColumnMapping.ts');
    const { uniqueNativeExportName } = await import('/src/utils/electron.ts');
    const { DEFAULT_UNITS: units } = await import('/src/db/unitService.ts');
    const opts = { includeStock: true, includeCost: true, accountName: 'QA', language: 'tm' };
    const headers = ['tr','tm','en','ru'].map(language => buildProductColumns(units, { ...opts, language }).map(c => c.header));
    const product = { id: 'qa', name: '=1+1', category: 'Tea', barcode: '00002', sku: '00001', unit: 'adet',
      price: 12.5, purchasePrice: 4.5, stock: 1.25, criticalStock: 2, expiryDate: '2027-01-31', unit2: 'box', unit2Qty: 12 };
    const meta = { kind: 'urun', accountName: 'QA', template: 'product', templateVersion: 1, options: {} };
    const workbook = new ExcelJS.Workbook();
    buildStyledSheet(workbook, { sheetName: 'Haryt', title: 'QA', accountName: 'QA', columns: buildProductColumns(units, opts), rows: [product], meta });
    buildMetaSheet(workbook, meta);
    const buffer = await writeWorkbook(workbook);
    const data = await readProductFile(new File([buffer], 'qa.xlsx'));
    const parsed = parseRows(data, units);
    const aliases = [['Ürün Adı','Barkod','Satış Fiyatı'], [], ['QA','00003',9]];
    const selection = detectExcelColumns(aliases, PRODUCT_EXCEL_COLUMNS);
    const ambiguous = [['Ürün Adı','Ürün Adı','Barkod','Satış Fiyatı'], ['A','B','00003',9]];
    const duplicate = detectExcelColumns(ambiguous, PRODUCT_EXCEL_COLUMNS);
    return { headers, parsed, format: workbook.getWorksheet('Haryt').getColumn(4).numFmt,
      hidden: workbook.getWorksheet('_meta').state, paperSize: workbook.getWorksheet('Haryt').pageSetup.paperSize,
      aliasValid: validExcelSelection(aliases, PRODUCT_EXCEL_COLUMNS, selection), aliasRow: parseRows(aliases, units)[0].rowNumber,
      ambiguous: validExcelSelection(ambiguous, PRODUCT_EXCEL_COLUMNS, duplicate),
      names: [uniqueNativeExportName('invoice.xlsx'), uniqueNativeExportName('invoice.xlsx')] };
  });
  for (const headers of result.headers) expect(headers).toEqual(result.headers[0]);
  expect(result.parsed).toHaveLength(1); expect(result.parsed[0].errors).toEqual([]);
  expect(result.parsed[0].draft).toMatchObject({ name: "'=1+1", barcode: '00002', sku: '00001', price: 12.5,
    purchasePrice: 4.5, stock: 1.25, criticalStock: 2, unit2Qty: 12, expiryDate: '2027-01-31' });
  expect(result.hidden).toBe('hidden'); expect(result.paperSize).toBe(9);
  expect(result.aliasValid).toBe(true); expect(result.aliasRow).toBe(3); expect(result.ambiguous).toBe(false);
  expect(result.names[0]).not.toBe(result.names[1]); expect(result.names.every(n => n.endsWith('.xlsx'))).toBe(true);
});
test('checkout: F10 iptal sepeti korur, onay temizler ve satış yazmaz', async ({ page }) => {
  await page.getByText('E2E Tea', { exact: true }).click();
  await page.keyboard.press('F10');
  await expect(page.getByRole('dialog', { name: await text(page, 'pos.resetTitle') })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: await text(page, 'pos.resetTitle') })).not.toBeVisible();
  await page.keyboard.press('F10'); await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog', { name: await text(page, 'pos.resetTitle') })).not.toBeVisible();
  await page.keyboard.press('F5');
  expect((await state(page)).invoices).toEqual([]); expect((await state(page)).products[0].stock).toBe(5);
});

test('P0-1 serverOnly: yerel reset uzak belgeleri silmez ve cihaz lisansını korur', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const PouchDB = (await import('/node_modules/.vite/deps/pouchdb-browser.js')).default;
    const { getLocalDatabase, resetLocalDatabaseForReplacement } = await import('/src/db/pouch.ts');
    const { clearLocalData } = await import('/src/db/connectionStore.ts');
    const name = `replacement-${crypto.randomUUID()}`;
    const remote = new PouchDB(`remote-${name}`);
    try {
      await remote.bulkDocs([{ _id: 'product_shared', value: 'remote' }, { _id: 'customer_shared', value: 'remote' }]);
      let local = getLocalDatabase(name);
      await remote.replicate.to(local);
      await local.put({ _id: 'product_only_local', value: 'discarded by explicit choice' });
      await local.put({ _id: 'license', device: 'local-device' });
      await clearLocalData(name);
      local = getLocalDatabase(name);
      await remote.replicate.to(local);
      await local.replicate.to(remote, { filter: (doc: any) => doc._id !== 'license' });
      return { remote: (await remote.allDocs()).rows.map((r: any) => r.id),
        local: (await local.allDocs()).rows.map((r: any) => r.id), license: (await local.get('license')).device };
    } finally { await remote.destroy(); await resetLocalDatabaseForReplacement(name); }
  });
  expect(result.remote).toEqual(['customer_shared', 'product_shared']);
  expect(result.local).toEqual(['customer_shared', 'license', 'product_shared']);
  expect(result.license).toBe('local-device');
});
test('P0-2 reddedilen satış: fatura stok ve bakiye değişmez; sepet korunur', async ({ page }) => {
  const before = await state(page);
  await page.evaluate(async () => {
    const { getLocalDatabase } = await import('/src/db/pouch.ts');
    const db = getLocalDatabase((window as any).e2e.storeDb); const put = db.put.bind(db);
    db.put = async (doc: any, ...args: any[]) => {
      if (doc._id.startsWith('invoice_')) throw Object.assign(new Error('fixture-rejection'), { status: 403 });
      return put(doc, ...args);
    };
  });
  await page.getByText('E2E Tea', { exact: true }).click(); await page.keyboard.press('F5');
  await expect(page.getByText(await text(page, 'pos.saleSaveFailed'), { exact: true })).toBeVisible();
  const after = await state(page); expect(after.invoices).toEqual([]); expect(after.products).toEqual(before.products);
  expect(after.customers).toEqual(before.customers);
  await expect(page.locator('input[type=number]')).not.toHaveCount(0);
});
test('P0-3 satış butonuna çift tık tek fatura ve tek stok düşümü üretir', async ({ page }) => {
  await page.getByText('E2E Tea', { exact: true }).click();
  await page.getByRole('button', { name: await text(page, 'completeSaleBtn'), exact: true }).first().dblclick();
  await expect.poll(async () => (await state(page)).invoices.length).toBe(1);
  await expect.poll(async () => (await state(page)).products[0].stock).toBe(4);
});
test('P1-3 bozuk conflict kazananı kopyalanmaz ve geçerli seçim çalışır', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const { getLocalDatabase, resetLocalDatabaseForReplacement } = await import('/src/db/pouch.ts');
    const { resolveConflicts, listDocumentConflicts, resolveReviewedConflict } = await import('/src/db/conflictResolver.ts');
    const name=`validate-conflict-${crypto.randomUUID()}`, db=getLocalDatabase(name);
    try {
      await db.bulkDocs([
        { _id:'urun:qa',_rev:'1-aaa',_revisions:{start:1,ids:['aaa']},ad:42,updatedAt:'2026-10-12' },
        { _id:'urun:qa',_rev:'1-bbb',_revisions:{start:1,ids:['bbb']},ad:'Valid',updatedAt:'2026-01-01' },
      ],{new_edits:false});
      const stats=await resolveConflicts(name);
      const snapshot=(await listDocumentConflicts(name))[0];let rejected=false;
      try { await resolveReviewedConflict(name,snapshot,'1-aaa'); } catch { rejected=true; }
      const remaining=(await db.get('urun:qa',{conflicts:true}))._conflicts.length;
      await resolveReviewedConflict(name,snapshot,'1-bbb');
      const doc=await db.get('urun:qa',{conflicts:true});
      return { stats, rejected, remaining, name:doc.ad, conflicts:doc._conflicts?.length??0 };
    } finally {await resetLocalDatabaseForReplacement(name);}
  });
  expect(result.stats.validationRejected).toBe(1);expect(result.rejected).toBe(true);
  expect(result.remaining).toBe(1);expect(result.name).toBe('Valid');expect(result.conflicts).toBe(0);
});
test('P1-4 stok yazımı reddedilince kayıtlı fatura korunur UI stok değişmez ve uyarı görünür', async ({ page }) => {
  await page.evaluate(async () => {
    const { getLocalDatabase } = await import('/src/db/pouch.ts');
    const db=getLocalDatabase((window as any).e2e.storeDb),put=db.put.bind(db);
    db.put=async (doc:any,...args:any[])=>{if(doc._id==='product_e2e-product')throw Object.assign(new Error('quota'),{status:507});return put(doc,...args);};
  });
  await page.getByText('E2E Tea',{exact:true}).click();await page.keyboard.press('F5');
  await expect(page.getByText('Invoice saved, but 1 stock/balance writes failed. Check the record; do not repeat this sale.',{exact:true})).toBeVisible();
  const saved=await state(page);expect(saved.invoices).toHaveLength(1);expect(saved.products[0].stock).toBe(5);
});
test('P1-4 eşzamanlı deltalar güncel revision üzerinde birleşir ve SKU korunur', async ({ page }) => {
  const saved=await page.evaluate(async()=>{
    const {adjustProductStock,getProductsForAccount}=await import('/src/db/productService.ts');
    const {adjustCustomerBalance,saveCustomerToDb,getCustomersForAccount}=await import('/src/db/customerService.ts');
    const name=(window as any).e2e.storeDb;
    await Promise.all([adjustProductStock('e2e-product',-1,name),adjustProductStock('e2e-product',-1,name)]);
    await saveCustomerToDb({id:'delta-customer',name:'Delta',balance:100,type:'customer'},name);
    await Promise.all([adjustCustomerBalance('delta-customer',-40,name),adjustCustomerBalance('delta-customer',-60,name)]);
    return {product:(await getProductsForAccount(name))[0],customer:(await getCustomersForAccount(name)).find((c:any)=>c.id==='delta-customer')};
  });
  expect(saved.product).toMatchObject({stock:3,sku:'00001'});expect(saved.customer.balance).toBe(0);
});
test('P1-5 PC mirror hatası kalıcı uyarı üretir, native başarı korunur ve başarılı mirror uyarıyı temizler', async ({ page }) => {
  const before=await page.evaluate(async()=>{
    const {getLocalDatabase}=await import('/src/db/pouch.ts');const {saveProductToDb,getProductsForAccount}=await import('/src/db/productService.ts');
    const {pendingMirrorCount}=await import('/src/db/mirrorStatus.ts');
    const name=(window as any).e2e.storeDb, db=getLocalDatabase(name),put=db.put.bind(db);
    (window as any).e2e.restorePut=()=>{db.put=put;};
    db.put=async(doc:any,...args:any[])=>{if(doc._id==='urun:e2e-product')throw Object.assign(new Error('fixture'),{status:507});return put(doc,...args);};
    const product=(await getProductsForAccount(name))[0];await saveProductToDb({...product,price:20},name);
    return {price:(await getProductsForAccount(name))[0].price,pending:await pendingMirrorCount(name)};
  });
  expect(before).toEqual({price:20,pending:1});
  await expect(page.getByRole('alert').filter({hasText:await text(page,'pos.pcMirrorPending')})).toBeVisible();
  await page.evaluate(async()=>{
    (window as any).e2e.restorePut();
    const {saveProductToDb,getProductsForAccount}=await import('/src/db/productService.ts');
    const name=(window as any).e2e.storeDb;await saveProductToDb((await getProductsForAccount(name))[0],name);
  });
  await expect(page.getByRole('alert').filter({hasText:await text(page,'pos.pcMirrorPending')})).not.toBeVisible();
});
test('P2-4 legacy para kategorisi düzenlenirken aynı değer korunur', async ({ page }) => {
  const category=await page.evaluate(async()=>{
    const {saveMoneyTransactionToDb,getMoneyTransactions}=await import('/src/db/moneyService.ts');
    const name=(window as any).e2e.storeDb;
    const tx={id:'legacy-category',type:'income',date:'2026-10-12',amount:40,paymentMethod:'cash',category:'legacy-custom-category',createdAt:'2026-10-12'};
    await saveMoneyTransactionToDb(tx,name);await saveMoneyTransactionToDb({...tx,amount:45},name);
    return (await getMoneyTransactions(name)).find((t:any)=>t.id===tx.id).category;
  });expect(category).toBe('legacy-custom-category');
});
test('P1-1 kalıcı 100 borç 40 tahsilat ve iptal hesabı sıfır bakiye verir; tahsilat korunur', async ({page})=>{
  const result=await page.evaluate(async()=>{
    const {saveInvoiceToDb,getInvoicesForAccount}=await import('/src/db/salesService.ts');
    const {saveCustomerToDb,adjustCustomerBalance}=await import('/src/db/customerService.ts');
    const {saveMoneyTransactionToDb,getMoneyTransactions}=await import('/src/db/moneyService.ts');
    const {creditVoidRemainingDebt,readVoidSnapshot}=await import('/src/db/creditVoid.ts');
    const name=(window as any).e2e.storeDb;
    await saveCustomerToDb({id:'void-c',name:'Void QA',balance:100,type:'customer'},name);
    const invoice={id:'void-credit',invoiceNo:'VOID-QA',invoiceType:'sales',customerId:'void-c',customerName:'Void QA',items:[],itemCount:0,subtotal:100,discountTotal:0,taxTotal:0,amountDue:100,paymentMethod:'credit',remainingDebt:100,status:'completed',createdAt:'2026-10-12',cashierName:'QA',cashReceived:0,changeDue:0};
    await saveInvoiceToDb(invoice,name);
    await saveMoneyTransactionToDb({id:'receipt40',invoiceId:invoice.id,customerId:'void-c',type:'income',date:'2026-10-12',amount:40,paymentMethod:'cash',category:'weresiye_yygnamak',createdAt:'2026-10-12'},name);
    await adjustCustomerBalance('void-c',-40,name);
    const snapshot=await readVoidSnapshot(name,invoice.id);const unpaid=creditVoidRemainingDebt(snapshot.invoice,snapshot.transactions);
    await saveInvoiceToDb({...snapshot.invoice,status:'voided'},name);
    const customer=await adjustCustomerBalance('void-c',-unpaid,name);
    return {unpaid,balance:customer.balance,receipts:(await getMoneyTransactions(name)).filter((tx:any)=>tx.id==='receipt40').length,status:(await getInvoicesForAccount(name)).find((inv:any)=>inv.id===invoice.id).status};
  });expect(result).toEqual({unpaid:60,balance:0,receipts:1,status:'voided'});
});
test('P1-2 üç aylık köprü altı aylık kesin faturayı doğurmaz; taslak ve legacy kalır',async({page})=>{
  const result=await page.evaluate(async()=>{
    const {getLocalDatabase}=await import('/src/db/pouch.ts');
    const {apkInvoiceToPcDoc,importPcMirrorsIntoStore}=await import('/src/db/schemaBridge.ts');
    const name=(window as any).e2e.storeDb,db=getLocalDatabase(name);
    const inv={invoiceNo:'HISTORY',createdAt:'2026-04-12',paymentMethod:'cash',status:'completed',invoiceType:'sales',items:[],amountDue:10};
    const old=apkInvoiceToPcDoc({...inv,id:'old-mirror'});
    const draft=apkInvoiceToPcDoc({...inv,id:'draft-mirror',draftStatus:'pending'});
    const legacy=apkInvoiceToPcDoc({...inv,id:'legacy-mirror'});delete legacy.bhInvoiceState;
    await db.bulkDocs([old,draft,legacy]);await importPcMirrorsIntoStore(name,3,new Date('2026-10-12T12:00:00Z'));
    return (await db.allDocs()).rows.map((row:any)=>row.id);
  });expect(result).not.toContain('invoice_old-mirror');expect(result).toContain('invoice_draft-mirror');expect(result).toContain('invoice_legacy-mirror');
});
test('P2-1 silinmiş ürün tekil ve batch aynı ID ile tam alanlarıyla yeniden yaratılır',async({page})=>{
  const result=await page.evaluate(async()=>{
    const {getLocalDatabase,upsertDocsBatch,upsertDoc,removeDoc}=await import('/src/db/pouch.ts');
    const name=(window as any).e2e.storeDb,db=getLocalDatabase(name);
    const fields={docType:'product',product:{id:'recreate',name:'Recreated',sku:'000012',barcode:'000345',price:10,stock:3,category:'QA',imageType:'default'}};
    await upsertDoc(name,'product_recreate',fields);await removeDoc(name,'product_recreate');
    await upsertDoc(name,'product_recreate',{...fields,product:{...fields.product,stock:4}});
    const single=(await db.get('product_recreate')).product;
    await removeDoc(name,'product_recreate');
    const batch=await upsertDocsBatch(name,[{id:'product_recreate',fields}]);
    return {single,batch,after:(await db.get('product_recreate')).product};
  });expect(result.single).toMatchObject({stock:4,sku:'000012',barcode:'000345'});
  expect(result.batch.written).toBe(1);expect(result.batch.failed).toHaveLength(0);
  expect(result.after).toMatchObject({stock:3,name:'Recreated',sku:'000012',barcode:'000345'});
});
test('P2-2 PC tombstone native ürünü siler; eksik ayna selective cihazda silme sayılmaz',async({page})=>{
  const result=await page.evaluate(async()=>{
    const {getLocalDatabase,removeDoc}=await import('/src/db/pouch.ts');
    const {saveProductToDb,getProductsForAccount}=await import('/src/db/productService.ts');
    const {importPcMirrorsIntoStore}=await import('/src/db/schemaBridge.ts');
    const name=(window as any).e2e.storeDb,db=getLocalDatabase(name),product=(await getProductsForAccount(name))[0];
    await saveProductToDb({...product,id:'pc-delete'},name);
    await db.put({_id:'product_no-mirror',docType:'product',product:{...product,id:'no-mirror'}});
    await removeDoc(name,'urun:pc-delete');await importPcMirrorsIntoStore(name,3);
    const rows=await db.allDocs({keys:['product_pc-delete','product_no-mirror']});
    return {deleted:rows.rows[0].value?.deleted===true,kept:rows.rows[1].value?.deleted!==true && !rows.rows[1].error};
  });expect(result).toEqual({deleted:true,kept:true});
});

test('katalog: reddedilen primary kayıt formu ve girdileri korur, düzeltince tek kayıt oluşur', async ({ page }) => {
  await page.getByRole('button',{name:await text(page,'tabHaryt'),exact:true}).click();
  await page.getByRole('button',{name:await text(page,'products.newProduct'),exact:true}).click();
  await page.getByPlaceholder(await text(page,'products.namePlaceholder'),{exact:true}).fill('Kept on failure');
  await page.getByPlaceholder('8690000000000',{exact:true}).fill('000999');
  await page.evaluate(async()=>{const {getLocalDatabase}=await import('/src/db/pouch.ts');const db=getLocalDatabase((window as any).e2e.storeDb),put=db.put.bind(db);(window as any).restoreCatalog=()=>db.put=put;db.put=async(doc:any,...args:any[])=>{if(doc._id.startsWith('product_'))throw Object.assign(new Error('fixture'),{status:507});return put(doc,...args);};});
  await page.getByRole('button',{name:await text(page,'products.saveBtn'),exact:true}).click();
  await expect(page.getByPlaceholder(await text(page,'products.namePlaceholder'),{exact:true})).toHaveValue('Kept on failure');
  await expect(page.getByRole('alert').filter({hasText:await text(page,'pos.catalogWriteFailed')}).first()).toBeVisible();
  expect((await state(page)).products.some((p:any)=>p.name==='Kept on failure')).toBe(false);
  await page.evaluate(()=>(window as any).restoreCatalog());
  await page.getByRole('button',{name:await text(page,'products.saveBtn'),exact:true}).click();
  await expect.poll(async()=>(await state(page)).products.filter((p:any)=>p.name==='Kept on failure').length).toBe(1);
});

test('mirror retry: otomatik iyileşme güncel native değeri gönderir ve uyarıyı temizler', async ({ page }) => {
  await page.evaluate(async()=>{
    const {getLocalDatabase}=await import('/src/db/pouch.ts');const {saveProductToDb,getProductsForAccount}=await import('/src/db/productService.ts');
    const name=(window as any).e2e.storeDb,db=getLocalDatabase(name),put=db.put.bind(db);
    (window as any).restoreRetry=()=>db.put=put;db.put=async(doc:any,...args:any[])=>{if(doc._id==='urun:e2e-product')throw Object.assign(new Error('fixture'),{status:507});return put(doc,...args);};
    const product=(await getProductsForAccount(name))[0];await saveProductToDb({...product,price:11},name);await saveProductToDb({...product,price:23},name);
  });
  await expect(page.getByRole('button',{name:await text(page,'pos.pcMirrorRetry'),exact:true})).toBeVisible();
  await page.evaluate(()=>(window as any).restoreRetry());
  await expect.poll(()=>page.evaluate(async()=>{const {getLocalDatabase}=await import('/src/db/pouch.ts');return (await getLocalDatabase((window as any).e2e.storeDb).get('urun:e2e-product') as any).fiyat;})).toBe(23);
  await expect(page.getByRole('button',{name:await text(page,'pos.pcMirrorRetry'),exact:true})).not.toBeVisible();
});

test('mirror retry: silme başarısızsa kuyrukta kalır, manuel retry tombstone aktarır, eksik native silinmez',async({page})=>{
  const result=await page.evaluate(async()=>{
    const {getLocalDatabase}=await import('/src/db/pouch.ts');const {saveProductToDb,deleteProductFromDb,getProductsForAccount}=await import('/src/db/productService.ts');
    const {retryPendingMirrors}=await import('/src/db/mirrorRetry.ts');const {setMirrorPending,pendingMirrorIds}=await import('/src/db/mirrorStatus.ts');
    const name=(window as any).e2e.storeDb,db=getLocalDatabase(name),put=db.put.bind(db),product=(await getProductsForAccount(name))[0];
    await saveProductToDb({...product,id:'retry-delete'},name);
    db.put=async(doc:any,...args:any[])=>{if(doc._id==='urun:retry-delete')throw Object.assign(new Error('fixture'),{status:507});return put(doc,...args);};
    const removed=await deleteProductFromDb('retry-delete',name);const pendingBefore=await pendingMirrorIds(name);db.put=put;
    await db.put({_id:'urun:unpulled',type:'urun',ad:'Unpulled',updatedAt:'2020-01-01T00:00:00Z'});
    await setMirrorPending(name,'urun:unpulled',true);await retryPendingMirrors(name);
    const rows=await db.allDocs({keys:['urun:retry-delete','urun:unpulled']});
    return {removed,pendingBefore,deleted:(rows.rows[0] as any).value.deleted,kept:!(rows.rows[1] as any).value.deleted,pendingAfter:await pendingMirrorIds(name)};
  });
  expect(result).toEqual({removed:true,pendingBefore:['urun:retry-delete'],deleted:true,kept:true,pendingAfter:['urun:unpulled']});
});

test('mirror retry: bekleyen yerel kayıt eski PC köprüsü tarafından ezilmez',async({page})=>{
  const result=await page.evaluate(async()=>{
    const {getLocalDatabase}=await import('/src/db/pouch.ts');const {setMirrorPending}=await import('/src/db/mirrorStatus.ts');
    const {importPcMirrorsIntoStore}=await import('/src/db/schemaBridge.ts');const name=(window as any).e2e.storeDb,db=getLocalDatabase(name);
    const native=await db.get('product_e2e-product') as any;await db.put({...native,product:{...native.product,price:77},syncedAt:'2020-01-01T00:00:00Z'});
    let mirror:any;try{mirror=await db.get('urun:e2e-product');}catch{mirror={_id:'urun:e2e-product'};}
    await db.put({...mirror,type:'urun',ad:'Older PC payload',fiyat:2,updatedAt:'2020-01-03T00:00:00Z'});
    await setMirrorPending(name,'urun:e2e-product',true);await importPcMirrorsIntoStore(name);
    return (await db.get('product_e2e-product') as any).product.price;
  });expect(result).toBe(77);
});

test('yedek: on kapsam, hesap uyumsuzluğu, önizleme onayı ve gerçek geri yükleme', async ({ page }) => {
  await page.getByRole('button', { name: await text(page, 'tabAyarlar'), exact: true }).click();
  await page.getByRole('button', { name: await text(page, 'backup.title'), exact: true }).click();
  await expect(page.getByRole('heading', { name: await text(page, 'backup.title') })).toBeVisible();
  await expect(page.locator('fieldset').first().getByRole('checkbox')).toHaveCount(10);
  for (const checkbox of await page.locator('fieldset').first().getByRole('checkbox').all()) await expect(checkbox).toBeChecked();
  const account = await page.evaluate(() => ({ storeDb: (window as any).e2e.storeDb }));
  const product = { _id: 'product_backup-test', docType: 'product', product: { id: 'backup-test', sku: '00099', barcode: '00999', name: 'Backup Tea', category: 'E2E', price: 12, stock: 2, imageType: 'default' } };
  const foreign = JSON.stringify({ app: 'biznes-hasap', version: 2, account: { id: 'foreign', storeDb: 'foreign' }, scopes: ['products'], docs: [product] });
  await page.locator('input[type=file]').setInputFiles({ name: 'foreign.json', mimeType: 'application/json', buffer: Buffer.from(foreign) });
  await expect(page.getByText(await text(page, 'backup.mismatch'), { exact: true })).toBeVisible();
  expect((await state(page)).products.some((p: any) => p.id === 'backup-test')).toBe(false);
  const legacy = JSON.stringify({ app: 'biznes-hasap', version: 1, docs: [product] });
  await page.locator('input[type=file]').setInputFiles({ name: 'legacy.json', mimeType: 'application/json', buffer: Buffer.from(legacy) });
  await expect(page.getByText(await text(page, 'backup.legacy'), { exact: true })).toBeVisible();
  const restore = page.getByRole('button', { name: await text(page, 'backup.restore'), exact: true });
  await expect(restore).toBeDisabled();
  await page.getByRole('checkbox', { name: await text(page, 'backup.agree'), exact: true }).check();
  await restore.click();
  await expect.poll(async () => (await state(page)).products.some((p: any) => p.id === 'backup-test' && p.sku === '00099')).toBe(true);
  await expect(restore).toBeDisabled();
  expect(account.storeDb).toBeTruthy();
});

test('sağlık: on-demand veri ve son yedek alanı görünür', async ({ page }) => {
  await page.getByRole('button', { name: await text(page, 'tabAyarlar'), exact: true }).click();
  await page.getByRole('button', { name: await text(page, 'backup.health'), exact: true }).click();
  await expect(page.getByRole('heading', { name: await text(page, 'backup.health') })).toBeVisible();
  await expect(page.getByText(await text(page, 'backup.pending'), { exact: true })).toBeVisible();
  await expect(page.getByText(await text(page, 'backup.last'), { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: await text(page, 'backup.refresh'), exact: true })).toBeEnabled();
});

test('yedek Excel: gerçek workbook oluşturulur ve Türkmençe başlıklar korunur', async ({ page }) => {
  await page.evaluate(() => {
    (window as any).e2e.savedWorkbook = null;
    (window as any).electronAPI.saveFileAs = async (options: any) => { (window as any).e2e.savedWorkbook = options; return { saved: true }; };
  });
  await page.getByText('E2E Tea', { exact: true }).click(); await page.keyboard.press('F5');
  await expect.poll(async () => (await state(page)).invoices.length).toBe(1);
  await page.getByRole('button', { name: await text(page, 'closeBtn'), exact: true }).click();
  await page.getByRole('button', { name: await text(page, 'tabAyarlar'), exact: true }).click();
  await page.getByRole('button', { name: await text(page, 'backup.title'), exact: true }).click();
  await page.getByRole('button', { name: await text(page, 'backup.excelStock'), exact: true }).click();
  await expect.poll(() => page.evaluate(() => Boolean((window as any).e2e.savedWorkbook?.data))).toBe(true);
  const workbookData = await page.evaluate(() => (window as any).e2e.savedWorkbook.data);
  const { default: ExcelJS } = await import('exceljs'); const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(Buffer.from(workbookData, 'base64'));
  const values: unknown[] = []; workbook.worksheets[0].eachRow(row => row.eachCell(cell => values.push(cell.value)));
  expect(values).toContain('Haryt'); expect(values).toContain('00001'); expect(values).toContain(-1);
});
