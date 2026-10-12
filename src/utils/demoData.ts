import { getLocalDatabase } from '../db/pouch';
import { prepareDocumentForWrite } from '../db/validation';
import { apkProductToPcDoc, apkCustomerToPcDoc } from '../db/schemaBridge';
import { DatabaseError } from './errors';
import type { Customer, Product } from '../types';
const PRODUCTS: readonly Product[] = [
  { id: 'demo-tea-v1', name: 'Demo çaý', sku: 'DEMO-0001', barcode: 'DEMO-0001', category: 'Demo', price: 10, purchasePrice: 7, stock: 20, unit: 'adet', imageType: 'default' },
  { id: 'demo-water-v1', name: 'Demo suw', sku: 'DEMO-0002', barcode: 'DEMO-0002', category: 'Demo', price: 5, purchasePrice: 3, stock: 30, unit: 'adet', imageType: 'water' },
];
const CUSTOMERS: readonly Customer[] = [{ id: 'demo-customer-v1', name: 'Demo müşderi', balance: 0, type: 'customer', isActive: true }];
/** Finansal belge yok. Revision'sız atomik yaratma mevcut kayıtları asla ezmez.
 * Kısmi hata bildirilir; tekrar deneme aynı ID'lerle idempotenttir. */
export async function seedDemoData(dbName: string): Promise<{ products: number; customers: number }> {
  const db = getLocalDatabase(dbName); let products = 0; let customers = 0;
  const definitions = [
    ...PRODUCTS.map(product => ({ id: `product_${product.id}`, fields: { docType: 'product', product }, kind: 'product' as const })),
    ...CUSTOMERS.map(customer => ({ id: `customer_${customer.id}`, fields: { docType: 'customer', customer }, kind: 'customer' as const })),
  ];
  for (const definition of definitions) {
    const doc = prepareDocumentForWrite(definition.id, { ...definition.fields, syncedAt: new Date().toISOString() });
    let created = false;
    try { const result = await db.put(doc as never); if (!result.ok || !result.rev) throw new DatabaseError(); created = true; }
    catch (error) { if ((error as { status?: number })?.status !== 409) throw new DatabaseError(undefined, error); }
    // Mevcut domain gövdesi varsa onu aynala; sabit örnekle üzerine yazma.
    const actual = await db.get(definition.id).catch(error => {
      if (error.status === 404) return null; // Kullanıcının sildiği demo kayıtları yeniden yaratılmaz.
      throw new DatabaseError(undefined, error);
    }) as Record<string, unknown> | null;
    if (actual) {
      const mirror = definition.kind === 'product' ? apkProductToPcDoc(actual.product as Product) : apkCustomerToPcDoc(actual.customer as Customer);
      const id = String(mirror._id);
      try { const result = await db.put(prepareDocumentForWrite(id, mirror) as never); if (!result.ok || !result.rev) throw new DatabaseError(); }
      catch (error) { if ((error as { status?: number })?.status !== 409) throw new DatabaseError(undefined, error); }
    }
    if (created) { if (definition.kind === 'product') products++; else customers++; }
  }
  return { products, customers };
}
