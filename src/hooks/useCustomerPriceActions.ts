import type { Dispatch, SetStateAction } from 'react';
import type { CartItem, Customer } from '../types';
import { getCustomerPrices, saveCustomerPrices } from '../db/customerPriceService';
import { useT } from '../locales/LanguageContext';
import type { WorkspaceToast } from './useCartActions';

interface CustomerPriceActionsOptions {
  storeDb: string;
  selectedCustomer: Customer | null;
  cartItems: readonly CartItem[];
  setCartItems: Dispatch<SetStateAction<CartItem[]>>;
  cartBasePriceOf: (item: CartItem) => number | null;
  setToastMessage: Dispatch<SetStateAction<WorkspaceToast | null>>;
}

/** F6/F7 müşteri fiyat listesi; satış kaydı veya seçilen müşteri state'ini yönetmez. */
export function useCustomerPriceActions({
  storeDb, selectedCustomer, cartItems, setCartItems, cartBasePriceOf, setToastMessage,
}: CustomerPriceActionsOptions) {
  const t = useT();

  /** F6 — sepetdäki ELLE girizilen bahalary saýlanan müşdere sakla. */
  const handleSaveCustomerPrices = async () => {
    const customer = selectedCustomer;
    if (!customer) {
      setToastMessage({
        type: 'info',
        text: t('pos.selectCustomer'),
      });
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    if (cartItems.length === 0) {
      setToastMessage({
        type: 'info',
        text: t('pos.cartEmpty'),
      });
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    // Diňe esasy bahadan gyşgaýan (elle girizilen) bahalar saklanýar.
    const entries: { productId: string; price: number }[] = [];
    for (const item of cartItems) {
      const base = cartBasePriceOf(item);
      if (base === null) continue;
      if (Math.abs(item.price - base) > 0.001) {
        entries.push({ productId: item.productId, price: item.price });
      }
    }
    if (entries.length === 0) {
      setToastMessage({
        type: 'info',
        text: t('pos.specialPriceMissing'),
      });
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    try {
      const written = await saveCustomerPrices(storeDb, customer.id, entries);
      setToastMessage({
        type: 'success',
        text: t('pos.specialPriceSaved', { count: written, customer: customer.name }),
      });
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      console.error('[F6] ozel baha saklamak', err);
      setToastMessage({
        type: 'info',
        text: t('pos.priceSaveFailed'),
      });
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  /** F7 — saýlanan müşderiniň saklanan ozel bahalaryny sepete ulan. */
  const handleApplyCustomerPrices = async () => {
    const customer = selectedCustomer;
    if (!customer) {
      setToastMessage({
        type: 'info',
        text: t('pos.selectCustomer'),
      });
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    if (cartItems.length === 0) {
      setToastMessage({
        type: 'info',
        text: t('pos.cartEmpty'),
      });
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    const saved = await getCustomerPrices(storeDb, customer.id);
    const prices = saved?.prices ?? {};
    // Diňe bu müşderä saklanan harytlaryň bahasy üýtgedilýär — galyndary öz bahasynda galýar.
    // (Sanawy setState-den ÖŇ ýygnalýar: updater render aşamasynda işleýär, hemişe şerti däl.)
    const updates: Record<string, number> = {};
    let applied = 0;
    for (const item of cartItems) {
      const custom = prices[item.productId];
      if (custom === undefined || custom === null) continue;
      if (Math.abs(item.price - custom) > 0.001) applied += 1;
      updates[item.productId] = custom;
    }
    if (applied === 0) {
      setToastMessage({
        type: 'info',
        text: t('pos.specialPriceNotFound'),
      });
      setTimeout(() => setToastMessage(null), 4000);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        updates[item.productId] !== undefined
          ? { ...item, price: updates[item.productId] }
          : item
      )
    );
    setToastMessage({
      type: 'success',
      text: t('pos.pricesApplied', { count: applied }),
    });
    setTimeout(() => setToastMessage(null), 4000);
  };

  return { handleSaveCustomerPrices, handleApplyCustomerPrices };
}
