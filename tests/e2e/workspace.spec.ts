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
