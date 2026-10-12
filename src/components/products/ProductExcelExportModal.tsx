import React, { useMemo, useState } from 'react';
import { CheckSquare, Download, Loader2, Square, X } from 'lucide-react';
import type { LanguageCode, Product } from '../../types';
import { useT } from '../../locales/LanguageContext';
import type { MeasurementUnit } from '../../db/unitService';
import { exportProductsStyled } from '../../utils/styledExports';
import { isNative } from '../../utils/platform';

interface ProductExcelExportModalProps {
  language: LanguageCode;
  products: readonly Product[];
  units: readonly MeasurementUnit[];
  /** Firma/hesap ady — Excel header'ında görkezilýär. */
  accountName: string;
  onClose: () => void;
}

export const ProductExcelExportModal: React.FC<ProductExcelExportModalProps> = ({
  language,
  products,
  units,
  accountName,
  onClose,
}) => {
  const t = useT();
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(products.map((product) => product.id))
  );
  const [query, setQuery] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [status, setStatus] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);
  // 2) — aktarma öňüni soraglar (stok / alış bahasy ýazylsynmy?).
  const [includeStock, setIncludeStock] = useState(true);
  const [includeCost, setIncludeCost] = useState(true);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(q) ||
        product.barcode.toLowerCase().includes(q) ||
        (product.sku || '').toLowerCase().includes(q)
    );
  }, [products, query]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(products.map((product) => product.id)));
  const clearAll = () => setSelected(new Set());

  const handleExport = async () => {
    const chosen = products.filter((product) => selected.has(product.id));
    if (chosen.length === 0) return;
    setIsExporting(true);
    setStatus(null);
    try {
      const saved = await exportProductsStyled(
        chosen,
        units,
        {
          includeStock,
          includeCost,
          accountName,
          language,
        },
        `harytlar-${new Date().toISOString().slice(0, 10)}.xlsx`
      );
      if (saved) {
        if (isNative()) {
          setStatus({
            kind: 'success',
            text: t('excel.savedToDocuments'),
          });
        } else {
          onClose();
        }
      } else {
        setStatus({
          kind: 'error',
          text: t('excel.saveFailed'),
        });
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
        <div className="px-5 py-4 bg-gradient-to-r from-[#0B1F3A] to-[#163864] text-white flex items-center justify-between flex-shrink-0">
          <span className="font-bold text-sm tracking-wide flex items-center gap-2">
            <Download className="w-4 h-4" />
            {t('excel.exportModalTitle')}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-3 overflow-hidden flex-1 flex flex-col min-h-0">
          <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('searchProductsPlaceholder')}
              className="flex-1 min-w-[180px] h-9 px-3 border border-gray-200 rounded-xl text-sm bg-[#F8FAFC] focus:ring-2 focus:ring-emerald-500 outline-none"
            />
            <button
              type="button"
              onClick={selectAll}
              className="h-9 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-[11px] flex items-center gap-1.5"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              {t('excel.selectAll')}
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="h-9 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-[11px] flex items-center gap-1.5"
            >
              <Square className="w-3.5 h-3.5" />
              {t('excel.clearSelection')}
            </button>
            <span className="text-[11px] font-bold text-emerald-600 font-mono">
              {selected.size} / {products.length}
            </span>
          </div>

          {/* 2) — aktarma öňüni soraglar */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-3 py-2.5 bg-[#F8FAFC] border border-gray-200 rounded-xl flex-shrink-0">
            <label className="flex items-center gap-2 text-[11px] font-bold text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={includeStock}
                onChange={(e) => setIncludeStock(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              {t('excel.includeStock')}
            </label>
            <label className="flex items-center gap-2 text-[11px] font-bold text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={includeCost}
                onChange={(e) => setIncludeCost(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              {t('excel.includeCost')}
            </label>
          </div>

          <div className="border border-gray-200 rounded-xl overflow-y-auto flex-1 min-h-0">
            <table className="w-full text-left text-xs">
              <tbody className="divide-y divide-gray-50">
                {visible.length === 0 ? (
                  <tr>
                    <td className="py-10 text-center text-gray-400 font-semibold">
                      {t('products.notFound')}
                    </td>
                  </tr>
                ) : (
                  visible.map((product) => (
                    <tr
                      key={product.id}
                      onClick={() => toggle(product.id)}
                      className="hover:bg-gray-50/70 cursor-pointer"
                    >
                      <td className="py-2 px-3 w-10">
                        <input
                          type="checkbox"
                          checked={selected.has(product.id)}
                          onChange={() => toggle(product.id)}
                          className="w-3.5 h-3.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                        />
                      </td>
                      <td className="py-2 px-3 font-semibold text-gray-800 truncate">
                        {product.name}
                      </td>
                      <td className="py-2 px-3 text-[11px] text-emerald-600 font-semibold">
                        {product.category || '—'}
                      </td>
                      <td className="py-2 px-3 font-mono text-gray-500">{product.barcode}</td>
                      <td className="py-2 px-3 text-right font-mono text-gray-700">
                        {product.stock}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {status && (
          <div
            className={`px-5 py-2 text-[11px] font-bold flex-shrink-0 ${
              status.kind === 'error'
                ? 'text-rose-600 bg-rose-50'
                : 'text-emerald-600 bg-emerald-50'
            }`}
          >
            {status.text}
          </div>
        )}

        <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs"
          >
            {t('cancel')}
          </button>
          <button
            type="button"
            onClick={() => void handleExport()}
            disabled={selected.size === 0 || isExporting}
            className="h-9 px-5 rounded-xl bg-[#10b981] hover:bg-[#059669] disabled:opacity-40 text-white font-bold text-xs flex items-center gap-2"
          >
            {isExporting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            {t('excel.exportBtn', { count: selected.size })}
          </button>
        </div>
      </div>
    </div>
  );
};