import type React from 'react';
import { useT } from '../locales/LanguageContext';
import { CartItem, InvoiceType, InvoiceRecord, Customer, Product } from '../types';
import { expandCompositionStock } from '../utils/compositionStock';
import { saveProductToDb } from '../db/productService';
import { saveCustomerToDb } from '../db/customerService';

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

const applyStockChanges = (items: CartItem[], type: InvoiceType, direction: 1 | -1 = 1) => {
    // Düzüm böleklerine goşmaça stok üýtgemeleri (setler çykanda).
    const compositionDeltas = expandCompositionStock(compositionMapRef.current, items, type, direction);

    const nextProducts = products.map((prod) => {
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
      const nextStock = prod.stock + delta;
      return { ...prod, stock: prod.allowNegativeStock ? nextStock : Math.max(0, nextStock) };
    });
    setProducts(nextProducts);
    // Ähli üýtgen harytlar (esasy + düzüm bölekleri) ýazylýar.
    const touched = new Set<string>([
      ...items.map((item) => item.productId),
      ...compositionDeltas.keys(),
    ]);
    touched.forEach((productId) => {
      const prod = nextProducts.find((p) => p.id === productId);
      if (prod) saveProductToDb(prod, storeDb).catch(() => {});
    });
  };

const applyCustomerBalance = (invoice: InvoiceRecord, direction: 1 | -1 = 1) => {
    if (!invoice.customerId) return;
    const customer = customers.find((c) => c.id === invoice.customerId);
    if (!customer) return;

    let delta = 0;
    if (invoice.paymentMethod === 'credit') {
      // Diňe galan bergi müşderiniň hasabyna goşulýar (öňünden berlen pul aýrylýar).
      const debt = invoice.remainingDebt ?? invoice.amountDue;
      if (invoice.invoiceType === 'sales' || invoice.invoiceType === 'other_out') delta = debt;
      if (invoice.invoiceType === 'sales_return') delta = -debt;
    }
    // Pozmak üçin ters amal: -1 berilende bergi tersine öwrülýär.
    delta *= direction;
    if (delta === 0) return;

    const updated: Customer = { ...customer, balance: customer.balance + delta };
    setCustomers((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setSelectedCustomer((prev) => (prev?.id === updated.id ? updated : prev));
    saveCustomerToDb(updated, storeDb).catch(() => {});
  };

  return { applyStockChanges, applyCustomerBalance };
}
