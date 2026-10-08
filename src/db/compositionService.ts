import { listDocsByPrefix, removeDoc, upsertDoc } from './pouch';

/** Haryt düzümi — esasy harydyň düzüm bölekleri. */
export interface ProductComposition {
  productId: string;
  /** Düzüm bölekleri: haryt ID + mukdar. */
  components: { productId: string; qty: number }[];
  updatedAt: string;
}

const PREFIX = 'composition_';

export async function getComposition(
  storeDb: string,
  productId: string
): Promise<ProductComposition | null> {
  const docs = await listDocsByPrefix(storeDb, PREFIX);
  const found = docs.find((doc) => {
    const composition = (doc as { composition?: ProductComposition }).composition;
    return composition?.productId === productId;
  });
  return found ? ((found as { composition?: ProductComposition }).composition ?? null) : null;
}

export async function saveComposition(
  storeDb: string,
  composition: ProductComposition
): Promise<void> {
  await upsertDoc(storeDb, `${PREFIX}${composition.productId}`, {
    docType: 'composition',
    composition,
  });
}

export async function deleteComposition(storeDb: string, productId: string): Promise<boolean> {
  return removeDoc(storeDb, `${PREFIX}${productId}`);
}

/** Düzümi bolan harytlaryň ID-leri (sanawda rozet/indikator göstermek üçin). */
export async function getComposedProductIds(storeDb: string): Promise<Set<string>> {
  const ids = new Set<string>();
  for (const composition of await getAllCompositions(storeDb)) {
    ids.add(composition.productId);
  }
  return ids;
}

/** Ähli düzümler — satuwda stok tüketimi üçin (productId -> bölekler). */
export async function getAllCompositions(storeDb: string): Promise<ProductComposition[]> {
  const docs = await listDocsByPrefix(storeDb, PREFIX);
  const out: ProductComposition[] = [];
  for (const doc of docs) {
    const composition = (doc as { composition?: ProductComposition }).composition;
    if (composition?.productId && composition.components?.length > 0) {
      out.push(composition);
    }
  }
  return out;
}

/** Önerilen baha: düzüm bölekleriniň jemi alş/satyş bahasy (mukdar görä). */
export function suggestedPrices(
  components: { product: { purchasePrice?: number; price: number; name: string }; qty: number }[]
): { purchase: number; sale: number; margin: number } {
  let purchase = 0;
  let sale = 0;
  for (const part of components) {
    purchase += (part.product.purchasePrice ?? 0) * part.qty;
    sale += part.product.price * part.qty;
  }
  return { purchase, sale, margin: sale - purchase };
}