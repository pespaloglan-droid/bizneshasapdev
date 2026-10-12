import { test, expect, type Page } from '@playwright/test';
const text = (page: Page, key: string): Promise<string> => page.evaluate(key => (window as any).e2e.t(key), key);
const state = (page: Page) => page.evaluate(() => (window as any).e2e.state());
async function fillField(page: Page, key: string, value: string) {
  await page.locator('label').filter({ hasText: await text(page, key) }).locator('..').locator('input').fill(value);
}
test.beforeEach(async ({ page }) => {
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
