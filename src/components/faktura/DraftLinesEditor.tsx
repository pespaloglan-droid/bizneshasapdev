import React, { useState } from 'react';
import { Search, Trash2 } from 'lucide-react';
import type { CartItem, LanguageCode, Product } from '../../types';
import { formatMoney } from '../../utils/money';
import { useT } from '../../locales/LanguageContext';

interface DraftLinesEditorProps {
  language: LanguageCode;
  products: readonly Product[];
  lines: readonly CartItem[];
  currency: string;
  baseCurrency: string;
  subtotal: number;
  subtotalTmt: number;
  onAdd: (product: Product) => void;
  onQtyChange: (productId: string, delta: number) => void;
}

const INPUT =
  'w-full h-9 px-3 border border-gray-200 rounded-xl text-sm bg-[#F8FAFC] focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none';
const LABEL = 'block text-[11px] font-bold text-gray-500 mb-1';

export const DraftLinesEditor: React.FC<DraftLinesEditorProps> = ({
  language,
  products,
  lines,
  currency,
  baseCurrency,
  subtotal,
  subtotalTmt,
  onAdd,
  onQtyChange,
}) => {
  const t = useT();
  const [query, setQuery] = useState('');

  const filtered = products
    .filter((product) => {
      const q = query.trim().toLowerCase();
      if (!q) return false;
      return (
        product.name.toLowerCase().includes(q) ||
        product.barcode.toLowerCase().includes(q) ||
        product.sku.toLowerCase().includes(q)
      );
    })
    .slice(0, 6);

  return (
    <>
      <div className="relative">
        <label className={LABEL}>{t('faktura.addProductLabel')}</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('faktura.productSearchPh')}
            className={`${INPUT} pl-9`}
          />
        </div>
        {filtered.length > 0 && (
          <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-56 overflow-y-auto">
            {filtered.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => {
                  onAdd(product);
                  setQuery('');
                }}
                className="w-full text-left px-3 py-2 hover:bg-emerald-50 transition-colors flex items-center justify-between gap-2"
              >
                <span className="text-xs font-semibold text-gray-800">{product.name}</span>
                <span className="text-[10px] font-mono text-emerald-600">
                  {formatMoney(product.price)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-gray-50/80 text-[11px] font-bold text-gray-500 border-b border-gray-100">
              <th className="py-2 px-3">{t('faktura.colProduct')}</th>
              <th className="py-2 px-3 text-right">{t('faktura.colPrice')}</th>
              <th className="py-2 px-3 text-center">{t('faktura.colQty')}</th>
              <th className="py-2 px-3 text-right">{t('faktura.colTotal')}</th>
              <th className="py-2 px-2 w-8" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {lines.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-gray-400 font-semibold">
                  {t('faktura.noProductsAdded')}
                </td>
              </tr>
            ) : (
              lines.map((line) => (
                <tr key={line.productId}>
                  <td className="py-2 px-3 font-semibold text-gray-800">{line.name}</td>
                  <td className="py-2 px-3 text-right font-mono text-gray-600">
                    {formatMoney(line.price)}
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onQtyChange(line.productId, -1)}
                        className="w-5 h-5 rounded-md bg-gray-100 hover:bg-gray-200 font-bold text-gray-600"
                      >
                        −
                      </button>
                      <span className="font-mono font-bold w-6 text-center">{line.qty}</span>
                      <button
                        type="button"
                        onClick={() => onQtyChange(line.productId, 1)}
                        className="w-5 h-5 rounded-md bg-gray-100 hover:bg-gray-200 font-bold text-gray-600"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-emerald-600">
                    {formatMoney(line.price * line.qty)}
                  </td>
                  <td className="py-2 px-2 text-center">
                    <button
                      type="button"
                      onClick={() => onQtyChange(line.productId, -line.qty)}
                      className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-400 hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between bg-[#F8FAFC] border border-gray-200 rounded-xl px-4 py-2.5">
        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
          {t('totalCol')}
        </span>
        <div className="text-right">
          <span className="font-mono font-bold text-lg text-emerald-600">
            {formatMoney(subtotal)} {currency}
          </span>
          {currency !== baseCurrency && (
            <div className="text-[10px] font-bold text-gray-400">
              ≈ {formatMoney(subtotalTmt)} {baseCurrency}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
