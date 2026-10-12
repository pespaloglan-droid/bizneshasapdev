import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, LayoutGrid, List, X, Package, Warehouse, Filter } from 'lucide-react';
import type { LanguageCode, Product, Warehouse as WarehouseType } from '../../types';
import { ProductImage } from './ProductImage';
import { CurrencyLabel } from './CurrencyLabel';
import { productCategories } from '../../db/productService';
import { useT } from '../../locales/LanguageContext';

interface ProductSearchModalProps {
  products: readonly Product[];
  warehouses: readonly WarehouseType[];
  language: LanguageCode;
  onSelect: (product: Product) => void;
  onClose: () => void;
}

type BarcodeStatus = 'all' | 'with' | 'without';
type StockStatus = 'all' | 'inStock' | 'out' | 'critical';

const GRID_COLUMNS = 4;

const segBtn = (active: boolean) =>
  `h-8 px-2 rounded-lg text-[11px] font-bold transition-all ${
    active ? 'bg-emerald-500 text-white shadow-xs' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
  }`;

export const ProductSearchModal: React.FC<ProductSearchModalProps> = ({
  products,
  warehouses,
  language,
  onSelect,
  onClose,
}) => {
  const t = useT();
  const [query, setQuery] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [category, setCategory] = useState('');
  const [barcodeStatus, setBarcodeStatus] = useState<BarcodeStatus>('all');
  const [stockStatus, setStockStatus] = useState<StockStatus>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [highlight, setHighlight] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  const categories = useMemo(() => productCategories(products), [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (warehouseId && p.warehouseId !== warehouseId) return false;
      if (category && p.category !== category) return false;
      const hasBarcode = Boolean(p.barcode.trim());
      if (barcodeStatus === 'with' && !hasBarcode) return false;
      if (barcodeStatus === 'without' && hasBarcode) return false;
      if (stockStatus === 'inStock' && p.stock <= 0) return false;
      if (stockStatus === 'out' && p.stock > 0) return false;
      if (
        stockStatus === 'critical' &&
        !(p.criticalStock !== undefined && p.stock <= p.criticalStock)
      )
        return false;
      if (!q) return true;
      const extra = (p.extraBarcodes || []).some((code) => code.toLowerCase().includes(q));
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.barcode.toLowerCase().includes(q) ||
        extra
      );
    });
  }, [products, query, warehouseId, category, barcodeStatus, stockStatus]);

  useEffect(() => {
    setHighlight(0);
  }, [query, warehouseId, category, barcodeStatus, stockStatus]);

  const pick = (product: Product | undefined) => {
    if (!product) return;
    onSelect(product);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      pick(filtered[highlight]);
      return;
    }
    if (filtered.length === 0) return;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      setHighlight((h) => Math.min(filtered.length - 1, h + 1));
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setHighlight((h) => Math.max(0, h - 1));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => Math.min(filtered.length - 1, h + (viewMode === 'grid' ? GRID_COLUMNS : 1)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(0, h - (viewMode === 'grid' ? GRID_COLUMNS : 1)));
    }
    window.setTimeout(() => document.getElementById(`bh-psr-${highlight}`)?.scrollIntoView({ block: 'nearest' }), 0);
  };

  return (
    <div className="fixed inset-0 z-[92] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
        {/* Ýokarky setir */}
        <div className="px-5 py-4 bg-gradient-to-r from-[#0B1F3A] to-[#163864] text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            <div>
              <h3 className="text-sm font-bold tracking-wide">{t('pos.psTitle')}</h3>
              <p className="text-[11px] text-gray-300">
                {t('pos.psFoundHeader', { count: filtered.length })}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 flex min-h-0" onKeyDown={handleKeyDown}>
          {/* ÇEP: Filtreler */}
          <div className="w-[250px] flex-shrink-0 border-r border-gray-100 bg-gray-50/60 p-3 space-y-3 overflow-y-auto">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                {t('pos.psSearchLabel')}
              </label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600 pointer-events-none" />
                <input
                  ref={searchRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('pos.psSearchPlaceholder')}
                  className="w-full h-9 pl-9 pr-3 bg-white border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl text-xs font-semibold text-gray-800 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-1 text-[10px] font-bold text-gray-500 uppercase mb-1">
                <Warehouse className="w-3 h-3" /> {t('pos.psWarehouseLabel')}
              </label>
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                className="w-full h-9 px-2 bg-white border border-gray-200 rounded-xl text-xs outline-none cursor-pointer"
              >
                <option value="">{t('pos.psAll')}</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center gap-1 text-[10px] font-bold text-gray-500 uppercase mb-1">
                <Filter className="w-3 h-3" /> {t('pos.psCategoryLabel')}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-9 px-2 bg-white border border-gray-200 rounded-xl text-xs outline-none cursor-pointer"
              >
                <option value="">{t('pos.psAll')}</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                {t('pos.psBarcodeStatus')}
              </label>
              <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white p-1">
                {(
                  [
                    { id: 'all', labelKey: 'pos.psAll' },
                    { id: 'with', labelKey: 'pos.psBsWith' },
                    { id: 'without', labelKey: 'pos.psBsWithout' },
                  ] as { id: BarcodeStatus; labelKey: string }[]
                ).map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setBarcodeStatus(o.id)}
                    className={`flex-1 ${segBtn(barcodeStatus === o.id)}`}
                  >
                    {t(o.labelKey)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                {t('pos.psStockStatus')}
              </label>
              <div className="grid grid-cols-2 gap-1 rounded-xl border border-gray-200 bg-white p-1">
                {(
                  [
                    { id: 'all', labelKey: 'pos.psAll' },
                    { id: 'inStock', labelKey: 'pos.psSsInStock' },
                    { id: 'out', labelKey: 'pos.psSsOut' },
                    { id: 'critical', labelKey: 'pos.psSsCritical' },
                  ] as { id: StockStatus; labelKey: string }[]
                ).map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setStockStatus(o.id)}
                    className={segBtn(stockStatus === o.id)}
                  >
                    {t(o.labelKey)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SAĞ: Netijeler */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="px-3 py-2 flex items-center justify-between border-b border-gray-100 flex-shrink-0">
              <span className="text-[11px] font-bold text-gray-500">
                {t('pos.psFound', { count: filtered.length })}
              </span>
              <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden bg-white p-0.5 h-8">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`px-2 h-full rounded-lg ${viewMode === 'grid' ? 'bg-emerald-100 text-emerald-800' : 'text-gray-500'}`}
                  title="Grid"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`px-2 h-full rounded-lg ${viewMode === 'list' ? 'bg-emerald-100 text-emerald-800' : 'text-gray-500'}`}
                  title="Liste"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              {filtered.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <Package className="w-10 h-10 text-gray-200 mb-2 stroke-1" />
                  <span className="text-xs font-semibold text-gray-500">
                    {t('pos.psNotFound')}
                  </span>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {filtered.map((p, index) => {
                    const isHi = index === highlight;
                    return (
                      <div
                        key={p.id}
                        id={`bh-psr-${index}`}
                        onClick={() => pick(p)}
                        className={`bg-white border rounded-xl p-2 flex flex-col items-center justify-between text-center cursor-pointer transition-all active:scale-95 h-[120px] ${
                          isHi ? 'border-emerald-500 ring-2 ring-emerald-500/30 shadow-md' : 'border-gray-100 hover:border-emerald-500 hover:shadow-md'
                        }`}
                      >
                        <div className="w-12 h-12 flex items-center justify-center mb-0.5">
                          <ProductImage type={p.imageType} imageUrl={p.imageUrl} className="w-11 h-11" />
                        </div>
                        <div className="text-[11px] font-semibold text-gray-800 line-clamp-1 leading-tight">{p.name}</div>
                        <div className="text-[9px] text-gray-400 line-clamp-1">{p.category || '—'}</div>
                        <div className={`text-[9px] font-mono ${p.stock < 0 ? 'text-rose-500 font-bold' : 'text-gray-400'}`}>
                          {t('pos.psStock')}: {p.stock}
                        </div>
                        <div className="text-xs font-bold text-[#10b981] font-mono">
                          {p.price.toFixed(2)} <CurrencyLabel className="text-[9px] text-emerald-600/70" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-1.5">
                  {filtered.map((p, index) => {
                    const isHi = index === highlight;
                    return (
                      <div
                        key={p.id}
                        id={`bh-psr-${index}`}
                        onClick={() => pick(p)}
                        className={`p-2 border rounded-lg flex items-center justify-between cursor-pointer transition-all ${
                          isHi ? 'border-emerald-500 bg-emerald-50/40' : 'border-gray-100 hover:border-emerald-500 hover:bg-emerald-50/20'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <ProductImage type={p.imageType} imageUrl={p.imageUrl} className="w-8 h-8" />
                          <div>
                            <div className="text-xs font-semibold text-gray-900">{p.name}</div>
                            <div className="text-[10px] text-gray-400">
                              {p.category || '—'} • SKU: {p.sku} • {t('pos.psStock')}: {p.stock}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs font-bold text-[#10b981] font-mono">
                          {p.price.toFixed(2)} <CurrencyLabel className="text-[9px] text-emerald-600/70" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Aşaky setir */}
        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between flex-shrink-0">
          <span className="text-[11px] font-bold text-gray-500">
            {t('pos.psFound', { count: filtered.length })}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs"
          >
            {t('pos.psClose')}
          </button>
        </div>
      </div>
    </div>
  );
};