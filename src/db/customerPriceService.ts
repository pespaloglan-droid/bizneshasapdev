import { listDocsByPrefix, removeDoc, upsertDoc } from './pouch';

/**
 * Müşteriye özel haryt bahasy (F6 bilen saklanan, F7 bilen ulanylýan).
 * Bir müşderi üçin haryt ID → baha kartasy saklanýar.
 */
export interface CustomerPriceEntry {
  productId: string;
  price: number;
}

export interface CustomerPriceList {
  customerId: string;
  /** productId -> ozel baha (manysyna özel). */
  prices: Record<string, number>;
  updatedAt: string;
}

const PREFIX = 'customerprice_';

const docId = (customerId: string): string => `${PREFIX}${customerId}`;

export async function getCustomerPrices(
  storeDb: string,
  customerId: string
): Promise<CustomerPriceList | null> {
  if (!customerId) return null;
  const docs = await listDocsByPrefix(storeDb, PREFIX);
  const found = docs.find((doc) => {
    const list = (doc as { customerPrices?: CustomerPriceList }).customerPrices;
    return list?.customerId === customerId;
  });
  if (!found) return null;
  return (found as { customerPrices?: CustomerPriceList }).customerPrices ?? null;
}

/**
 * Elsatda girizilen ozel bahalary sakla — diňe haryt başyna bir baha.
 * Bir haryt birnäçe gezek girizilse, iň soňky baha ýeňilýär.
 * @returns ýazylan haryt sany.
 */
export async function saveCustomerPrices(
  storeDb: string,
  customerId: string,
  entries: readonly CustomerPriceEntry[]
): Promise<number> {
  if (!customerId || entries.length === 0) return 0;
  const existing = await getCustomerPrices(storeDb, customerId);
  const prices = { ...(existing?.prices ?? {}) };
  let written = 0;
  for (const entry of entries) {
    if (!entry.productId) continue;
    prices[entry.productId] = entry.price;
    written += 1;
  }
  if (written === 0) return 0;
  const list: CustomerPriceList = {
    customerId,
    prices,
    updatedAt: new Date().toISOString(),
  };
  await upsertDoc(storeDb, docId(customerId), { docType: 'customerPrices', customerPrices: list });
  return written;
}

export async function deleteCustomerPrices(storeDb: string, customerId: string): Promise<boolean> {
  if (!customerId) return false;
  return removeDoc(storeDb, docId(customerId));
}
