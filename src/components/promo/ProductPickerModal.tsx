import React, { useMemo, useState } from 'react';
import { Search, X, Package, Check } from 'lucide-react';
import type { Product } from '../../types';
import { ProductImage } from '../pos/ProductImage';
import { formatPromoMoney } from '../../db/promoService';
import { useT } from '../../locales/LanguageContext';

export type PickerAccent = 'blue' | 'green';

interface ProductPickerModalProps {
  products: readonly Product[];
  currencyCode: string;
  title: string;
  accent: PickerAccent;
  selectedId?: string;
  onSelect: (product: Product) => void;
  onClose: () => void;
}

const ACCENT: Record<PickerAccent, { head: string; ring: string }> = {
  blue: { head: 'from-blue-600 to-blue-700', ring: 'hover:border-blue-400' },
  green: { head: 'from-emerald-500 to-emerald-600', ring: 'hover:border-emerald-400' },
};

export const ProductPickerModal: React.FC<ProductPickerModalProps> = ({
  products,
  currencyCode,
  title,
  accent,
  selectedId,
  onSelect,
  onClose,
}) => {
  const t = useT();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const tone = ACCENT[accent];

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const product of products) if (product.category.trim()) set.add(product.category.trim());
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'tr'));
  }, [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((product) => {
      if (category && product.category !== category) return false;
      if (!q) return true;
      return (
        product.name.toLowerCase().includes(q) ||
        product.sku.toLowerCase().includes(q) ||
        product.barcode.toLowerCase().includes(q)
      );
    });
  }, [products, query, category]);

  return (
    <div className="fixed inset-0 z-[95] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
        {/* Ýokarky setir */}
        <div className={`px-5 py-4 bg-gradient-to-r ${tone.head} text-white flex items-center justify-between flex-shrink-0`}>
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            <div>
              <h3 className="text-sm font-bold tracking-wide">{title}</h3>
              <p className="text-[11px] opacity-90">
                {t('promo.pickerCount', { count: products.length, code: currencyCode })}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Süzgüçler */}
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2 flex-wrap flex-shrink-0">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('promo.pickerSearchPh')}
              className="w-full h-9 pl-9 pr-3 bg-white border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-xs outline-none"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-9 px-3 bg-white border border-gray-200 rounded-xl text-xs outline-none cursor-pointer"
          >
            <option value="">{t('promo.pickerAllCategories')}</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        {/* Haryt sanawy */}
        <div className="p-4 overflow-y-auto flex-1">
          {filtered.length === 0 ? (
            <div className="py-14 flex flex-col items-center justify-center text-gray-400">
              <Package className="w-10 h-10 text-gray-200 mb-2 stroke-1" />
              <span className="text-xs font-semibold text-gray-500">{t('promo.pickerNotFound')}</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {filtered.map((product) => {
                const negative = product.stock < 0;
                const critical =
                  product.criticalStock !== undefined && product.stock <= product.criticalStock;
                const isSelected = product.id === selectedId;
                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => onSelect(product)}
                    className={`text-left rounded-2xl border p-2.5 flex gap-3 transition-all ${
                      isSelected
                        ? 'border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-50/50'
                        : `border-gray-200 bg-white ${tone.ring}`
                    }`}
                  >
                    <div className="w-14 h-14 rounded-xl border border-gray-100 bg-[#F8FAFC] flex items-center justify-center overflow-hidden flex-shrink-0">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain" />
                      ) : (
                        <ProductImage type={product.imageType} className="w-11 h-11" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-1">
                        <div className="text-xs font-bold text-gray-900 truncate">{product.name}</div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />}
                      </div>
                      <div className="text-[10px] text-gray-400 truncate">{product.category || '—'}</div>
                      <div className="flex items-center justify-between mt-1 gap-1">
                        <span
                          className={`text-[11px] font-bold font-mono ${
                            negative ? 'text-rose-600' : critical ? 'text-amber-600' : 'text-gray-600'
                          }`}
                        >
                          {t('promo.stockLabel')} {product.stock}
                        </span>
                        <span className="text-[11px] font-black font-mono text-emerald-700">
                          {formatPromoMoney(product.price, currencyCode)}
                        </span>
                      </div>
                      <div className="text-[9px] text-gray-400 font-mono truncate mt-0.5">
                        {product.sku ? `SKU: ${product.sku}` : product.barcode}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-gray-100 flex justify-end flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs"
          >
            {t('promo.pickerClose')}
          </button>
        </div>
      </div>
    </div>
  );
};