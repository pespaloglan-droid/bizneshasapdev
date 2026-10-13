import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import type { LanguageCode, Product } from '../../types';
import { useT } from '../../locales/LanguageContext';
import {
  deleteComposition,
  getComposition,
  saveComposition,
  suggestedPrices,
  type ProductComposition,
} from '../../db/compositionService';
import { ProductImage } from '../pos/ProductImage';
import { unitLabel, type MeasurementUnit } from '../../db/unitService';

interface CompositionModalProps {
  language: LanguageCode;
  storeDb: string;
  /** Düzümi düzülýän esasy haryt. */
  mainProduct: Product;
  products: readonly Product[];
  /** Birim atlary (özel birimler hem). */
  units: readonly MeasurementUnit[];
  onClose: () => void;
  /** Esasy harydyň bahasyny täzelemek (önerilen baha boýunça). */
  onUpdatePrice: (productId: string, newPrice: number) => Promise<boolean>;
}

const INPUT =
  'w-full h-9 px-3 border border-gray-200 rounded-xl text-sm bg-[#F8FAFC] focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none';

export const CompositionModal: React.FC<CompositionModalProps> = ({
  language,
  storeDb,
  mainProduct,
  products,
  units,
  onClose,
  onUpdatePrice,
}) => {
  const t = useT();
  const [query, setQuery] = useState('');
  const [parts, setParts] = useState<{ productId: string; qty: number }[]>([]);
  const [newPrice, setNewPrice] = useState<number>(mainProduct.price);
  const [notice, setNotice] = useState('');

    // Bar bolan düzümi ýükle.
  useEffect(() => {
    let cancelled = false;
    void getComposition(storeDb, mainProduct.id).then((composition) => {
      if (cancelled || !composition) return;
      setParts(composition.components);
      setNewPrice(mainProduct.price);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeDb, mainProduct.id]);

  const available = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter(
      (product) =>
        product.id !== mainProduct.id &&
        (!q ||
          product.name.toLowerCase().includes(q) ||
          (product.barcode || '').includes(q) ||
          (product.sku || '').toLowerCase().includes(q))
    );
  }, [products, query, mainProduct.id]);

  const selectedParts = useMemo(
    () =>
      parts
        .map((part) => {
          const product = products.find((p) => p.id === part.productId);
          return product ? { product, qty: part.qty } : null;
        })
        .filter((part) => part !== null),
    [parts, products]
  );

  const suggestion = suggestedPrices(selectedParts as { product: Product; qty: number }[]);

  const addPart = (productId: string) => {
    setParts((prev) => {
      if (prev.some((part) => part.productId === productId)) return prev;
      return [...prev, { productId, qty: 1 }];
    });
  };

  const setQty = (productId: string, qty: number) => {
    const next = Math.max(0, Math.round(qty) || 0);
    setParts((prev) =>
      next === 0
        ? prev.filter((part) => part.productId !== productId)
        : prev.map((part) => (part.productId === productId ? { ...part, qty: next } : part))
    );
  };

  const savingRef = useRef(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const handleSave = async () => {
    if (savingRef.current) return;
    savingRef.current=true; setSaving(true); setError('');
    try {
    const clean = parts.filter((part) => part.qty > 0);
    if (clean.length === 0) {
      if (await getComposition(storeDb, mainProduct.id) && !await deleteComposition(storeDb, mainProduct.id)) throw new Error('CATALOG_WRITE_FAILED');
    } else {
      const composition: ProductComposition = {
        productId: mainProduct.id,
        components: clean,
        updatedAt: new Date().toISOString(),
      };
      await saveComposition(storeDb, composition);
    }
    // Esasy harydyň bahasyny täzele.
    if (newPrice !== mainProduct.price && newPrice > 0) {
      if (!await onUpdatePrice(mainProduct.id, newPrice)) throw new Error('CATALOG_WRITE_FAILED');
    }
    setNotice(t('products.compSaved'));
    setTimeout(onClose, 700);
    } catch { setError(t('pos.catalogWriteFailed')); }
    finally { savingRef.current=false; setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        <div className="px-5 py-4 bg-gradient-to-r from-[#0B1F3A] to-[#163864] text-white flex items-center justify-between flex-shrink-0">
          <span className="font-bold text-sm tracking-wide">
            {t('products.compositionTitle', { name: mainProduct.name })}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
          {/* Haryt arama */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('products.compositionSearchPlaceholder')}
              className="w-full pl-9 pr-4 h-10 bg-[#F8FAFC] border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-3 py-1.5 bg-gray-50/80 text-[10.5px] font-bold text-gray-500 flex items-center justify-between">
              <span>{t('products.selectProduct')}</span>
              <span className="font-semibold text-gray-400">{available.length}</span>
            </div>
            <div className="max-h-56 overflow-y-auto divide-y divide-gray-50">
              {available.slice(0, 60).map((product) => {
                const added = parts.some((part) => part.productId === product.id);
                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => addPart(product.id)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 text-left transition-colors ${
                      added ? 'bg-emerald-50/70' : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className="w-9 h-9 rounded-lg overflow-hidden border border-gray-100 flex-shrink-0 bg-white">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ProductImage type={product.imageType} className="w-full h-full" />
                      )}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-[11.5px] font-bold text-gray-800 truncate">
                        {product.name}
                      </span>
                      <span className="block text-[9.5px] text-gray-400 font-mono truncate">
                        {product.sku}
                        {product.barcode ? ` · ${product.barcode}` : ''}
                      </span>
                    </span>
                    <span
                      className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-md flex-shrink-0 ${
                        product.stock > 0
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-rose-50 text-rose-600'
                      }`}
                      title={t('products.stockAmount')}
                    >
                      {t('products.stockPrefix')} {product.stock}
                    </span>
                    <span className="text-right flex-shrink-0 w-[74px]">
                      <span className="block text-[9.5px] text-gray-400 leading-none">
                        {t('products.purchaseShort')}
                      </span>
                      <span className="block text-[10.5px] font-mono font-bold text-sky-700 leading-tight">
                        {(product.purchasePrice ?? 0).toFixed(2)}
                      </span>
                    </span>
                    <span className="text-right flex-shrink-0 w-[74px]">
                      <span className="block text-[9.5px] text-gray-400 leading-none">
                        {t('products.saleShort')}
                      </span>
                      <span className="block text-[10.5px] font-mono font-bold text-emerald-700 leading-tight">
                        {product.price.toFixed(2)}
                      </span>
                    </span>
                    <span
                      className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-black flex-shrink-0 ${
                        added
                          ? 'bg-emerald-500 text-white'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {added ? '✓' : '+'}
                    </span>
                  </button>
                );
              })}
              {available.length === 0 && (
                <div className="px-3 py-4 text-center text-[10.5px] text-gray-400 italic">
                  {t('products.notFound')}
                </div>
              )}
            </div>
          </div>

          {/* Saýlanan bölekler + mukdar */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-3 py-2 bg-gray-50/80 text-[11px] font-bold text-gray-600">
              {t('products.components')}
            </div>
            {selectedParts.length === 0 ? (
              <div className="py-6 text-center text-[11px] text-gray-400">
                {t('products.noComponents')}
              </div>
            ) : (
              <div className="divide-y divide-gray-50 max-h-60 overflow-y-auto">
                {selectedParts.map((part) => {
                  const product = part!.product;
                  const linePurchase = (product.purchasePrice ?? 0) * part!.qty;
                  const lineSale = product.price * part!.qty;
                  const notEnough = product.stock < part!.qty;
                  return (
                    <div key={product.id} className="flex items-center gap-2.5 px-2.5 py-2">
                      <span className="w-9 h-9 rounded-lg overflow-hidden border border-gray-100 flex-shrink-0 bg-white">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ProductImage type={product.imageType} className="w-full h-full" />
                        )}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-[11.5px] font-bold text-gray-800 truncate">
                          {product.name}
                        </span>
                        <span className="block text-[9.5px] text-gray-400 font-mono">
                          {product.sku} · {unitLabel(units, product.unit, language) || product.unit}
                        </span>
                      </span>
                      <span
                        className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-md flex-shrink-0 ${
                          notEnough ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-700'
                        }`}
                        title={
                          notEnough
                            ? t('products.stockInsufficient')
                            : t('products.stockAmount')
                        }
                      >
                        {t('products.stockPrefix')} {product.stock}
                      </span>
                      <span className="text-right flex-shrink-0 w-[72px]">
                        <span className="block text-[9.5px] text-gray-400 leading-none">
                          {t('products.unitShort')}
                        </span>
                        <span className="block text-[10.5px] font-mono font-bold text-gray-700 leading-tight">
                          {(product.purchasePrice ?? 0).toFixed(2)}
                          {product.price.toFixed(2) !== (product.purchasePrice ?? 0).toFixed(2) && (
                            <span className="text-emerald-600"> / {product.price.toFixed(2)}</span>
                          )}
                        </span>
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={part!.qty}
                        onChange={(e) => setQty(product.id, parseInt(e.target.value) || 0)}
                        className="w-14 h-8 px-1.5 text-center border border-gray-200 rounded-lg text-xs font-mono font-bold text-gray-800 bg-[#F8FAFC] focus:ring-2 focus:ring-emerald-500 outline-none flex-shrink-0"
                      />
                      <span className="text-right flex-shrink-0 w-[92px]">
                        <span className="block text-[9.5px] text-gray-400 leading-none">
                          {t('products.totalShort')}
                        </span>
                        <span className="block text-[10.5px] font-mono font-bold text-emerald-700 leading-tight">
                          {lineSale.toFixed(2)}
                        </span>
                        <span className="block text-[9px] font-mono text-sky-600 leading-tight">
                          {t('products.purchaseShort')} {linePurchase.toFixed(2)}
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setQty(product.id, 0)}
                        className="w-6 h-6 rounded-lg bg-gray-100 hover:bg-rose-500 hover:text-white text-gray-500 flex items-center justify-center flex-shrink-0 transition-colors"
                        title={t('products.removeTooltip')}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Önerilen fiyatlar */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-sky-50 border border-sky-100 rounded-xl p-2.5 text-center">
              <div className="text-[9px] font-bold text-sky-600 uppercase tracking-wider">
                {t('products.totalPurchase')}
              </div>
              <div className="text-sm font-black font-mono text-sky-700">{suggestion.purchase.toFixed(2)}</div>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-2.5 text-center">
              <div className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">
                {t('products.totalSale')}
              </div>
              <div className="text-sm font-black font-mono text-emerald-700">{suggestion.sale.toFixed(2)}</div>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-2.5 text-center">
              <div className="text-[9px] font-bold text-amber-600 uppercase tracking-wider">
                {t('products.profit')}
              </div>
              <div className={`text-sm font-black font-mono ${suggestion.margin >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                {suggestion.margin >= 0 ? '+' : ''}{suggestion.margin.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Esasy haryt bahasy */}
          <div className="bg-[#F8FAFC] border border-gray-200 rounded-xl p-3">
            <label className="block text-[10.5px] font-bold text-gray-600 mb-1">
              {t('products.mainPriceLabel')}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                step="0.01"
                value={newPrice || ''}
                onChange={(e) => setNewPrice(parseFloat(e.target.value) || 0)}
                className={`${INPUT} font-mono font-bold text-gray-800`}
              />
              <button
                type="button"
                onClick={() => setNewPrice(suggestion.sale)}
                className="h-9 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-[10.5px] font-bold flex-shrink-0"
                title={t('products.useSuggestedTooltip')}
              >
                {t('products.useSuggested')}
              </button>
            </div>
          </div>

          {notice && (
            <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
              {notice}
            </div>
          )}
        </div>

        {error && <div role="alert" className="px-4 text-rose-700">{error}</div>}
        <div className="flex justify-end gap-2 px-4 py-3 border-t border-gray-100 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs"
          >
            {t('cancel')}
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="h-9 px-5 rounded-xl bg-[#10b981] hover:bg-[#059669] text-white font-bold text-xs"
          >
            {t('save')}
          </button>
        </div>
      </div>
    </div>
  );
};