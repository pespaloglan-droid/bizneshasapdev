import type React from 'react';
import { useT } from '../locales/LanguageContext';
import { CartItem, InvoiceType, InvoiceRecord, Customer, Product } from '../types';
import { expandCompositionStock } from '../utils/compositionStock';
import { adjustProductStock } from '../db/productService';
import { adjustCustomerBalance } from '../db/customerService';

export interface InvoiceEffectResult { failed: string[] }
interface Options {
  compositionMapRef: React.MutableRefObject<Map<string, { productId: string; qty: number; }[]>>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  storeDb: string;
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  setSelectedCustomer: React.Dispatch<React.SetStateAction<Customer | null>>;
}

export function useInvoiceEffects({ compositionMapRef, products, setProducts, storeDb, customers, setCustomers, setSelectedCustomer }: Options) {
  const t = useT();

const applyStockChanges = async (items: CartItem[], type: InvoiceType, direction: 1 | -1 = 1): Promise<InvoiceEffectResult> => {
    // Düzüm böleklerine goşmaça stok üýtgemeleri (setler çykanda).
    const compositionDeltas = expandCompositionStock(compositionMapRef.current, items, type, direction);

    const deltas = new Map<string, number>();
    products.forEach((prod) => {
      const cartItem = items.find(ci => ci.productId === prod.id);

      // Düzmäni azaldylan haryt (esasy set ýa-da onuň bölegi).
      const compositionDelta = compositionDeltas.get(prod.id);
      if (compositionDelta === undefined && !cartItem) return prod;

      let delta = 0;
      if (cartItem) {
        // Eğer sepetteki birim, ürünün 2. birimiyse (ör: Karopka) ve ürünün çarpanı varsa
        // stoğu o çarpana göre düşüreceğiz (ör: 1 Karopka = 10 Sany ise, 1 Karopka satışında stok 10 düşer)
        let baseQty = cartItem.qty;
        if (cartItem.unit === prod.unit2 && prod.unit2Qty) {
          baseQty = cartItem.qty * prod.unit2Qty;
        }

        if (type === 'sales' || type === 'other_out')         delta = -baseQty;
        if (type === 'purchase' || type === 'other_in')        delta = +baseQty;
        if (type === 'sales_return')                           delta = +baseQty;
        if (type === 'purchase_return')                        delta = -baseQty;
        // Pozmak üçin ters amal: -1 berilende hereket tersine öwrülýär.
        delta *= direction;
      }
      // Düzüm böleklerinin üýtgemesi.
      if (compositionDelta !== undefined) delta += compositionDelta;

      if (delta === 0) return prod;
      deltas.set(prod.id, delta);
    });
    const saved = new Map<string, Product>(); const failed: string[] = [];
    await Promise.all([...deltas].map(async ([id, delta]) => {
      try { saved.set(id, await adjustProductStock(id, delta, storeDb)); }
      catch { failed.push(id); }
    }));
    setProducts(prev => prev.map(prod => saved.get(prod.id) ?? prod));
    return { failed };

  };

const applyCustomerBalance = async (invoice: InvoiceRecord, direction: 1 | -1 = 1): Promise<InvoiceEffectResult> => {
    if (!invoice.customerId) return { failed: [] };
    const customer = customers.find((c) => c.id === invoice.customerId);
    if (!customer) return { failed: [invoice.customerId] };

    let delta = 0;
    if (invoice.paymentMethod === 'credit') {
      // Diňe galan bergi müşderiniň hasabyna goşulýar (öňünden berlen pul aýrylýar).
      const debt = invoice.remainingDebt ?? invoice.amountDue;
      if (invoice.invoiceType === 'sales' || invoice.invoiceType === 'other_out') delta = debt;
      if (invoice.invoiceType === 'sales_return') delta = -debt;
    }
    // Pozmak üçin ters amal: -1 berilende bergi tersine öwrülýär.
    delta *= direction;
    if (delta === 0) return { failed: [] };

    try {
      const updated = await adjustCustomerBalance(invoice.customerId, delta, storeDb);
      setCustomers(prev => prev.map(c => c.id === updated.id ? updated : c));
      setSelectedCustomer(prev => prev?.id === updated.id ? updated : prev);
      return { failed: [] };
    } catch { return { failed: [invoice.customerId] }; }

  };

  return { applyStockChanges, applyCustomerBalance };
}
