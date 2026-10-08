import type { CartItem, InvoiceType } from '../types';

/** Düzüm (kompozisyon) bölekleri: productId + miktar. */
export interface CompositionPart {
  productId: string;
  qty: number;
}

/** productId -> düzüm bölekleri. */
export type CompositionLookup = ReadonlyMap<string, readonly CompositionPart[]>;

/**
 * Düşýän fatura görnüşleri — düzüm bölekleriniň stogy hem azalýar.
 * Alışda (purchase/other_in) düzüm ulanylmaýar: set aýratyn satyn alynýar,
 * onuň bölekleri bolsa ýörite harytlar.
 */
const OUTFLOW_TYPES: readonly InvoiceType[] = ['sales', 'other_out'];

/**
 * Satylan set harytlarynyň düzüm böleklerine goşmaça stok üýtgemelerini hasaplaýar.
 *
 * @param sign 1 = çykyş (azalýar), -1 = iade/pozma (artýar)
 * @returns productId -> toplam delta (çokylyly düzümler birleşdirilýär)
 */
export function expandCompositionStock(
  compositions: CompositionLookup,
  items: readonly CartItem[],
  type: InvoiceType,
  sign: 1 | -1
): Map<string, number> {
  const deltas = new Map<string, number>();
  if (!OUTFLOW_TYPES.includes(type)) return deltas;

  for (const item of items) {
    const parts = compositions.get(item.productId);
    if (!parts || parts.length === 0) continue;

    // Set miktarı — 2. birim (karopka) çarpanı uygulanmaz, bileşenler
    // kendi ana biriminde sayılır.
    const setQty = item.qty;

    for (const part of parts) {
      if (part.productId === item.productId) continue; // öz-özüne düzüm ýok
      const qty = part.qty * setQty;
      if (!Number.isFinite(qty) || qty === 0) continue;
      deltas.set(part.productId, (deltas.get(part.productId) ?? 0) + -qty * sign);
    }
  }
  return deltas;
}

/**
 * Düzüm stogy ýeterlikli barlagy — satyş öňünden xabar bermek üçin.
 * @returns ýetmän harytlar: [{ productId, name, required, available }]
 */
export function insufficientCompositionStock(
  compositions: CompositionLookup,
  items: readonly CartItem[],
  products: readonly { id: string; name: string; stock: number; unit2?: string; unit2Qty?: number }[]
): { productId: string; name: string; required: number; available: number }[] {
  const short: { productId: string; name: string; required: number; available: number }[] = [];

  for (const item of items) {
    const parts = compositions.get(item.productId);
    if (!parts || parts.length === 0) continue;

    let setQty = item.qty;
    const product = products.find((p) => p.id === item.productId);
    if (product && item.unit && item.unit === product.unit2 && product.unit2Qty) {
      setQty = item.qty * product.unit2Qty;
    }

    for (const part of parts) {
      if (part.productId === item.productId) continue;
      const component = products.find((p) => p.id === part.productId);
      if (!component) continue;
      const required = part.qty * setQty;
      if (component.stock < required) {
        short.push({
          productId: part.productId,
          name: component.name,
          required,
          available: component.stock,
        });
      }
    }
  }
  return short;
}
