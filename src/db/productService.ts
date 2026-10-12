import { Product, ProductCategory } from '../types';
import { listDocsByPrefix, removeDoc, upsertDoc, upsertDocsBatch, type BatchWriteResult } from './pouch';
import { sanitizeProduct } from './sanitize';
import { mirrorToPc } from './schemaBridge';

function productDocId(productId: string): string {
  return `product_${productId}`;
}

/**
 * Harytlary BIR toplu ýazmada saklaýar (Excel importy üçin).
 *
 * `upsertDocsBatch` arkaly ýeke DB hereketi hökmünde ýazylýar; ýalňyşlyklar
 * ýutulmaýar — şowsuz harytlar aýratynlykda dolandyrylýar. PC aynasyna
 * diňe hakykatdan ýazylan harytlar aýnalýar (şowsuzlary aýnalanok).
 *
 * @returns ýazylan sany we şowsuzlar (haryt ID-leri bilen).
 */
export async function saveProductsBatchDb(
  products: readonly Product[],
  dbName: string = 'default_store'
): Promise<BatchWriteResult> {
  const syncedAt = new Date().toISOString();
  const entries = products.map((p) => ({
    id: productDocId(p.id),
    fields: {
      docType: 'product',
      product: p,
      syncedAt,
    },
  }));
  const result = await upsertDocsBatch(dbName, entries);

  // PC'nin okuyabilmesi için ayna kayıt (urun:<id>) — diňe ýazylanlar üçin.
  const failedIds = new Set(result.failed.map((f) => f.id));
  const mirrored = products.filter((p) => !failedIds.has(productDocId(p.id)));
  await Promise.allSettled(mirrored.map((p) => mirrorToPc(dbName, 'product', p)));

  // Ýalňyşlyk raporty haryt ID-si bilen işlänligi üçin docId → harytId.
  return {
    written: result.written,
    failed: result.failed.map((f) => ({
      id: f.id.startsWith('product_') ? f.id.slice('product_'.length) : f.id,
      error: f.error,
    })),
  };
}

export async function saveProductToDb(product: Product, dbName: string = 'default_store'): Promise<Product> {
  try {
    const syncedAt = new Date().toISOString();
    await upsertDoc(dbName, productDocId(product.id), {
      docType: 'product',
      product,
      syncedAt,
    });
    // PC'nin okuyabilmesi için ayna kayıt (urun:<id>)
    await mirrorToPc(dbName, 'product', product);
  } catch (error) {
    console.error('Failed to save product to PouchDB', error);
  }
  return product;
}

export async function deleteProductFromDb(productId: string, dbName: string = 'default_store'): Promise<boolean> {
  return removeDoc(dbName, productDocId(productId));
}

export async function getProductsForAccount(dbName: string = 'default_store'): Promise<Product[]> {
  try {
    const docs = await listDocsByPrefix(dbName, 'product_');
    return docs
      .filter((doc) => doc.docType === 'product' && doc.product)
      .map((doc) => sanitizeProduct(doc.product))
      .filter((p): p is Product => p !== null);
  } catch (error) {
    console.warn('Failed to load products from PouchDB:', error);
    return [];
  }
}

/** Ähli harytlary görkezýän ýörite kategoriýa. */
export const ALL_CATEGORIES = 'All';

/**
 * Haryt modulyndaky harytlaryň `category` meýdançasyndan tegelekleri aýryp,
 * tertipli kategoriýa sanawyny döredýär. Boş kategoriýalar aýrylýar —
 * Faktura ekranynda boş sekme peýda bolmasyn.
 */
export function productCategories(products: readonly Product[]): string[] {
  const unique = new Set<string>();
  for (const product of products) {
    const name = (product.category ?? '').trim();
    if (name) unique.add(name);
  }
  return Array.from(unique).sort((a, b) => a.localeCompare(b, 'tr'));
}

export function filterProducts(
  products: Product[],
  category: ProductCategory,
  searchQuery: string
): Product[] {
  const q = searchQuery.trim().toLowerCase();
  return products.filter((p) => {
    const matchesCategory = category === ALL_CATEGORIES || p.category === category;
    const extra = (p.extraBarcodes ?? []).some(
      (code) => typeof code === 'string' && code.toLowerCase().includes(q)
    );
    const name = typeof p.name === 'string' ? p.name : '';
    const sku = typeof p.sku === 'string' ? p.sku : '';
    const barcode = typeof p.barcode === 'string' ? p.barcode : '';
    const matchesQuery =
      !q ||
      name.toLowerCase().includes(q) ||
      sku.toLowerCase().includes(q) ||
      barcode.toLowerCase().includes(q) ||
      extra;
    return matchesCategory && matchesQuery;
  });
}
