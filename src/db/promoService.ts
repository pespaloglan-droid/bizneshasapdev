// ── PROMO moduly: model, hasaplama we saklama ───────────────────────────────
// Satuw/promo önümleri Haryt modulynyň HAKYKY önümlerine salgylanýar.

import type { Product } from '../types';
import { formatMoney } from '../utils/money';

export type PromoDiscountMode = 'free' | 'percent' | 'fixed';

export interface PromoRecord {
  id: string;
  /** Haryt modulynyň önüm ID-si (satuw tarapy). */
  saleProductId: string;
  saleQty: number;
  /** Haryt modulynyň önüm ID-si (promo tarapy). */
  promoProductId: string;
  promoQty: number;
  discountMode: PromoDiscountMode;
  percent: number;
  fixed: number;
  createdAt: string;
}

const PROMOS_KEY = 'bh_promos';

/** Aktiw walýuta kody bilen pul görnüşi (TMT ýaly). */
export function formatPromoMoney(value: number, currencyCode: string): string {
  return `${formatMoney(value)} ${currencyCode}`;
}

export function productById(products: readonly Product[], id: string): Product | undefined {
  return products.find((product) => product.id === id);
}

export function newPromoId(): string {
  return `promo-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;
}

/** Boş promo — deslapky önüm saýlanmaýar, ulanyjy özi saýlar. */
export function emptyPromo(): PromoRecord {
  return {
    id: '',
    saleProductId: '',
    saleQty: 1,
    promoProductId: '',
    promoQty: 1,
    discountMode: 'free',
    percent: 50,
    fixed: 500,
    createdAt: '',
  };
}

export function loadPromos(): PromoRecord[] {
  try {
    const raw = localStorage.getItem(PROMOS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PromoRecord[]) : [];
  } catch {
    // no-excuse-ok: catch — zaýalanan localStorage bolsa, boş sanaw
    return [];
  }
}

export function savePromos(promos: readonly PromoRecord[]): void {
  try {
    localStorage.setItem(PROMOS_KEY, JSON.stringify(promos));
  } catch {
    // no-excuse-ok: catch — saklap bolmasa ähmiýetsiz
  }
}

export interface PromoCalc {
  readonly saleTotal: number;
  readonly promoBase: number;
  readonly discount: number;
  readonly total: number;
  readonly kasaIncome: number;
}

/** Promo hasaplamasy: satuw + promo bazasy − indirim = kasa girdejisi. */
export function calcPromo(promo: PromoRecord, products: readonly Product[]): PromoCalc {
  const salePrice = productById(products, promo.saleProductId)?.price ?? 0;
  const promoPrice = productById(products, promo.promoProductId)?.price ?? 0;
  const saleTotal = salePrice * Math.max(0, promo.saleQty);
  const promoBase = promoPrice * Math.max(0, promo.promoQty);

  let discount = 0;
  if (promo.discountMode === 'free') discount = promoBase;
  else if (promo.discountMode === 'percent') discount = (promoBase * Math.max(0, promo.percent)) / 100;
  else discount = Math.min(Math.max(0, promo.fixed), promoBase);

  const total = saleTotal + promoBase;
  return { saleTotal, promoBase, discount, total, kasaIncome: total - discount };
}

export function promoDiscountLabel(promo: PromoRecord, currencyCode: string): string {
  if (promo.discountMode === 'free') return 'Mugt';
  if (promo.discountMode === 'percent') return `Göterim %${promo.percent || 0}`;
  return `Sabit ${formatPromoMoney(promo.fixed || 0, currencyCode)}`;
}

/** Promolarda ulanylan önümler (Stok durumu üçin). */
export function productsInPromos(
  promos: readonly PromoRecord[],
  products: readonly Product[]
): Product[] {
  const ids = new Set<string>();
  for (const promo of promos) {
    ids.add(promo.saleProductId);
    ids.add(promo.promoProductId);
  }
  return products.filter((product) => ids.has(product.id));
}