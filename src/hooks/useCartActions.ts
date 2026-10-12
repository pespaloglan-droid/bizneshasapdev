import { useEffect, type Dispatch, type SetStateAction } from 'react';
import type { CartItem, OperationSettings, Product, UnitType } from '../types';
import { useT } from '../locales/LanguageContext';

export interface WorkspaceToast { type: 'success' | 'info'; text: string }

interface CartActionsOptions {
  products: readonly Product[];
  cartItems: readonly CartItem[];
  setCartItems: Dispatch<SetStateAction<CartItem[]>>;
  priceMode: 'retail' | 'wholesale';
  globalPercent: number;
  setGlobalPercent: Dispatch<SetStateAction<number>>;
  ops: OperationSettings | null | undefined;
  fakturaExtras: { editPrice: boolean; allowDiscount: boolean };
  setToastMessage: Dispatch<SetStateAction<WorkspaceToast | null>>;
}

/** Sepet davranışı; ödeme, fatura yazımı ve katalog state'i workspace'te kalır. */
export function useCartActions({
  products, cartItems, setCartItems, priceMode, globalPercent, setGlobalPercent,
  ops, fakturaExtras, setToastMessage,
}: CartActionsOptions) {
  const t = useT();

  const canSellBeyondStock = (product: Product, nextQty: number) => {
    if (product.allowNegativeStock) return true;
    return nextQty <= product.stock;
  };

  const showNoStockToast = () => {
    setToastMessage({
      type: 'info',
      text: t('pos.noStock')
    });
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Add Product to Cart (passiw haryt düzgüni bilen)
  const handleAddToCart = (product: Product) => {
    if (product.isActive === false && !(ops?.allowInactiveProduct)) {
      setToastMessage({
        type: 'info',
        text: t('pos.inactiveProduct'),
      });
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    setCartItems((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      const nextQty = (existing?.qty || 0) + 1;
      if (!canSellBeyondStock(product, nextQty)) {
        showNoStockToast();
        return prev;
      }
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [
        ...prev,
        {
          id: `cart-${Date.now()}-${Math.random()}`,
          productId: product.id,
          sku: product.sku,
          name: product.name,
          // F8: toptan režimde lomoy (wholesale) baha, beýle perakende.
          price:
            priceMode === 'wholesale'
              ? (product.wholesalePrice ?? product.price)
              : product.price,
          qty: 1,
          percent: globalPercent || 0,
          unit: product.unit,
          imageType: product.imageType,
          imageUrl: product.imageUrl
        }
      ];
    });
  };

  // ── F8: baha görnüşi üýtgese, sepetdäki fiyatlar täzelenýär ───────────────
  useEffect(() => {
    if (cartItems.length === 0) return;
    setCartItems((prev) =>
      prev.map((item) => {
        const product = products.find((p) => p.id === item.productId);
        if (!product) return item;
        const base =
          priceMode === 'wholesale'
            ? (product.wholesalePrice ?? product.price)
            : product.price;
        // İkinji birlik (karopka) saýlanan bolsa çarpan ulanylýar.
        const unit2Price =
          product.unit2 && product.unit2Qty && item.unit === product.unit2
            ? base * product.unit2Qty
            : base;
        return { ...item, price: unit2Price };
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priceMode]);

  const handleUpdateQty = (productId: string, delta: number) => {
    const product = products.find((p) => p.id === productId);
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.productId === productId) {
            const newQty = item.qty + delta;
            if (newQty <= 0) return null;
            if (product && delta > 0 && !canSellBeyondStock(product, newQty)) {
              showNoStockToast();
              return item;
            }
            return { ...item, qty: newQty };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  // Set Item Qty directly
  const handleSetQty = (productId: string, qty: number) => {
    const validQty = Math.max(1, qty || 1);
    const product = products.find((p) => p.id === productId);
    if (product && !canSellBeyondStock(product, validQty)) {
      showNoStockToast();
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, qty: validQty } : item
      )
    );
  };

  // Update Item Price directly (inçe rugsat: "Bahany üýtget" + alş bahasy düzgüni)
  const handleUpdatePrice = (productId: string, newPrice: number) => {
    if (!fakturaExtras.editPrice) {
      setToastMessage({ type: 'info', text: t('pos.noPermission') });
      setTimeout(() => setToastMessage(null), 2500);
      return;
    }
    const validPrice = Math.max(0, newPrice || 0);
    // "Alş bahasynyň aşagyna sat" kapalysa — alş bahasyndan aşak baha goýulmaýar.
    if (!(ops?.allowBelowCostSale ?? true)) {
      const product = products.find((p) => p.id === productId);
      const cost = product?.purchasePrice ?? 0;
      if (cost > 0 && validPrice < cost) {
        setToastMessage({
          type: 'info',
          text: t('pos.belowCost', { cost: cost.toFixed(2) }),
        });
        setTimeout(() => setToastMessage(null), 3000);
        return;
      }
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, price: validPrice } : item
      )
    );
  };

  // ── F6/F7: müşteriýe özel baha — sakla / ulan ────────────────────────────
  /** Kartoňdaky harydyň esas bahasy (F8 režimi + ikinji birim hasaba alynýar). */
  const cartBasePriceOf = (item: CartItem): number | null => {
    const product = products.find((p) => p.id === item.productId);
    if (!product) return null;
    const base =
      priceMode === 'wholesale' ? (product.wholesalePrice ?? product.price) : product.price;
    return product.unit2 && product.unit2Qty && item.unit === product.unit2
      ? base * Number(product.unit2Qty)
      : base;
  };

  // Update Individual Item +/- % (inçe rugsat: "Arzanladyş ber")
  const handleUpdatePercent = (productId: string, percent: number) => {
    if (!fakturaExtras.allowDiscount) {
      setToastMessage({ type: 'info', text: t('pos.noPermission') });
      setTimeout(() => setToastMessage(null), 2500);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, percent: isNaN(percent) ? 0 : percent } : item
      )
    );
  };

  const handleUpdateUnit = (productId: string, unit: UnitType) => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          const prod = products.find((p) => p.id === productId);
          let newPrice = item.price;
          if (prod) {
            // Eğer seçilen birim ürünün 2. birimi ise fiyatı çarp
            if (prod.unit2 && prod.unit2Qty && unit === prod.unit2) {
              newPrice = Number(prod.price) * Number(prod.unit2Qty);
            } 
            // Eğer seçilen birim ana birim ise normal fiyatı kullan
            else if (unit === (prod.unit || 'adet')) {
              newPrice = Number(prod.price);
            }
          }
          return { ...item, unit, price: newPrice };
        }
        return item;
      })
    );
  };

  // Apply Global Toptan % to All Cart Items (inçe rugsat: "Arzanladyş ber")
  const handleApplyGlobalPercent = (percent: number) => {
    if (!fakturaExtras.allowDiscount) {
      setToastMessage({ type: 'info', text: t('pos.noPermission') });
      setTimeout(() => setToastMessage(null), 2500);
      return;
    }
    const validPct = isNaN(percent) ? 0 : percent;
    setGlobalPercent(validPct);
    setCartItems((prev) =>
      prev.map((item) => ({ ...item, percent: validPct }))
    );
  };

  // Remove Item
  const handleRemoveItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  return {
    handleAddToCart, handleUpdateQty, handleSetQty, handleUpdatePrice,
    handleUpdatePercent, handleUpdateUnit, handleApplyGlobalPercent,
    handleRemoveItem, cartBasePriceOf,
  };
}
