import React, { useEffect, useMemo, useState } from 'react';
import { Search, LayoutGrid, List, ScanLine, X } from 'lucide-react';
import { LanguageCode, Product, ProductCategory } from '../../types';
import { translations, translate } from '../../locales/i18n';
import { ProductImage } from './ProductImage';
import { CurrencyLabel } from './CurrencyLabel';
import { ALL_CATEGORIES, productCategories } from '../../db/productService';
import { useBarcodeScan } from '../../hooks/useBarcodeScan';

interface ProductCatalogProps {
  products: Product[];
  selectedCategory: ProductCategory;
  searchQuery: string;
  language: LanguageCode;
  onSelectCategory: (cat: ProductCategory) => void;
  onSearchChange: (query: string) => void;
  onProductClick: (product: Product) => void;
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({
  products,
  selectedCategory,
  searchQuery,
  language,
  onSelectCategory,
  onSearchChange,
  onProductClick
}) => {
  const t = translations[language] || translations.en;
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { scanning, scan } = useBarcodeScan();

  const handleCameraScan = async () => {
    const res = await scan();
    if (res && !res.cancelled && res.value) onSearchChange(res.value);
  };

  // Kategoriýa sekmeleri Haryt modulyndaky harytlardan awtomatik döredilýär.
  const categories = useMemo(
    () => [
      { id: ALL_CATEGORIES, label: t.allCategories },
      ...productCategories(products).map((name) => ({ id: name, label: name })),
    ],
    [products, t.allCategories]
  );

  // Saýlanan kategoriýa aýrylan bolsa (ähli harydy pozulan) — «Hemmesi»-ne dolan.
  useEffect(() => {
    if (selectedCategory !== ALL_CATEGORIES && !categories.some((c) => c.id === selectedCategory)) {
      onSelectCategory(ALL_CATEGORIES);
    }
  }, [categories, selectedCategory, onSelectCategory]);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-2.5 flex flex-col shadow-sm flex-1 min-h-[240px]">
      {/* 1. Kategori Sekmeleri */}
      <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar pb-1 flex-shrink-0">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-[#10b981] text-white shadow-xs font-bold'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 bg-gray-50/80 border border-gray-200/60'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* 2. Lupanın Sağına Kesin Boşluk Verilmiş ve Koyu Kenarlıklı Arama Kutusu */}
      <div className="flex items-center space-x-2 my-1.5 flex-shrink-0">
        {/* Arama Kutusu */}
        <div className="flex-1 relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-600 group-focus-within:text-emerald-700">
            <Search className="w-4 h-4 stroke-[2.5]" />
          </div>
          <input
            type="text"
            id="bh-product-search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t.searchProductsPlaceholder}
            style={{ paddingLeft: '38px' }}
            className="w-full h-9 pr-8 bg-white border border-gray-400 hover:border-gray-600 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/25 rounded-xl text-xs font-semibold text-gray-900 placeholder-gray-500 transition-all shadow-xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Kamera ile barkod */}
        <button
          type="button"
          onClick={() => void handleCameraScan()}
          disabled={scanning}
          title={translate(language, 'pos.cameraScanTip')}
          className="h-9 px-2.5 rounded-xl border border-gray-400 bg-white text-emerald-700 hover:border-emerald-600 disabled:opacity-50 flex items-center justify-center"
        >
          <ScanLine className="w-4 h-4" />
        </button>

        {/* Grid / List Görünüm Seçici */}
        <div className="flex items-center border border-gray-400 rounded-xl overflow-hidden bg-white p-0.5 h-9">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`px-2.5 h-full rounded-lg transition-colors flex items-center justify-center ${
              viewMode === 'grid' ? 'bg-emerald-100 text-emerald-800 font-bold' : 'text-gray-500 hover:text-gray-800'
            }`}
            title={translate(language, 'pos.gridView')}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`px-2.5 h-full rounded-lg transition-colors flex items-center justify-center ${
              viewMode === 'list' ? 'bg-emerald-100 text-emerald-800 font-bold' : 'text-gray-500 hover:text-gray-800'
            }`}
            title={translate(language, 'pos.listView')}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3. Ürün Kartları */}
      <div className="flex-1 overflow-y-auto pr-0.5">
        {products.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-gray-400">
            {t.outOfStock}
          </div>
        ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2">
            {products.map((p) => (
              <div
                key={p.id}
                onClick={() => onProductClick(p)}
                className="bg-white border border-gray-100 hover:border-emerald-500 hover:shadow-md rounded-xl p-2 flex flex-col items-center justify-between text-center cursor-pointer transition-all active:scale-95 group h-[115px]"
              >
                <div className="w-12 h-12 flex items-center justify-center mb-0.5">
                  <ProductImage type={p.imageType} imageUrl={p.imageUrl} className="w-11 h-11 group-hover:scale-105 transition-transform" />
                </div>
                <div className="text-[11px] font-semibold text-gray-800 line-clamp-1 leading-tight">
                  {p.name}
                </div>
                <div className={`text-[9px] font-mono ${p.stock < 0 ? 'text-rose-500 font-bold' : 'text-gray-400'}`}>
                  {t.stockLabel}: {p.stock}
                </div>
                <div className="text-xs font-bold text-[#10b981] font-mono">
                  {p.price.toFixed(2)} <CurrencyLabel className="text-[9px] text-emerald-600/70" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1.5">
            {products.map((p) => (
              <div
                key={p.id}
                onClick={() => onProductClick(p)}
                className="p-2 border border-gray-100 hover:border-emerald-500 hover:bg-emerald-50/20 rounded-lg flex items-center justify-between cursor-pointer transition-all"
              >
                <div className="flex items-center space-x-2.5">
                  <ProductImage type={p.imageType} imageUrl={p.imageUrl} className="w-8 h-8" />
                  <div>
                    <div className="text-xs font-semibold text-gray-900">{p.name}</div>
                    <div className="text-[10px] text-gray-400">SKU: {p.sku} • {t.stockLabel}: {p.stock}</div>
                  </div>
                </div>
                <div className="text-xs font-bold text-[#10b981] font-mono">
                  {p.price.toFixed(2)} <CurrencyLabel className="text-[9px] text-emerald-600/70" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
