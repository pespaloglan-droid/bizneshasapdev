import React, { useState } from 'react';
import { AlertTriangle, Eye, FilePlus2 } from 'lucide-react';
import type { InvoiceRecord, Product } from '../../types';
import type { DateWindow } from '../../utils/calcPeriods';
import { productSales, stockValuation } from '../../utils/calcAssets';
import { formatMoney } from '../../utils/money';
import { updatedStamp, useReport } from '../../utils/report';
import { EmptyState, ReportActions } from './charts';

interface StockTabProps {
  products: readonly Product[];
  invoices: readonly InvoiceRecord[];
  window: DateWindow;
  rangeLabel: string;
  paperWidth: string;
  /** Harytdan faktura döretmek (Hasaplama → Faktura). */
  onAddToCart?: (product: Product) => void;
  onGoToCheckout?: () => void;
}

type StockFilter = 'all' | 'positive' | 'negative';

export const StockTab: React.FC<StockTabProps> = ({
  products,
  invoices,
  window,
  rangeLabel,
  paperWidth,
  onAddToCart,
  onGoToCheckout,
}) => {
  const valuation = stockValuation(products);
  const best = productSales(invoices, window, 8, 'top');
  const worst = productSales(invoices, window, 8, 'bottom');
  const report = useReport(paperWidth);
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [previewId, setPreviewId] = useState<string | null>(null);

  const filteredStock = products
    .filter((product) => {
      if (stockFilter === 'positive') return product.stock > 0;
      if (stockFilter === 'negative') return product.stock < 0;
      return true;
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'tr'));

  const csvRows: (string | number)[][] = products.map((product) => [
    product.name,
    product.sku,
    product.stock,
    (product.purchasePrice ?? 0).toFixed(2),
    (product.stock * (product.purchasePrice ?? 0)).toFixed(2),
    (product.stock * product.price).toFixed(2),
  ]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
          Ambar hasabaty · {rangeLabel}
        </span>
        <ReportActions
          isPrinting={report.isPrinting}
          onPrint={() =>
            void report.print({
              title: 'Ambar hasabaty',
              subtitle: rangeLabel,
              columns: ['Haryt', 'SKU', 'Sany', 'Alış', 'Alış degeri', 'Satyş degeri'],
              rows: csvRows,
              footer: `Jemi alış degeri: ${formatMoney(valuation.purchaseValue)} TMT`,
            })
          }
          csvName="ambar-hasabaty"
          headers={['Haryt', 'SKU', 'Sany', 'Alış', 'Alış degeri', 'Satyş degeri']}
          rows={csvRows}
          disabled={products.length === 0}
        />
      </div>

      {report.notice && (
        <div className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
          {report.notice}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { key: 'sku', label: 'Haryt görnüşi', value: String(valuation.skuCount), cls: 'text-gray-900' },
          { key: 'qty', label: 'Jemi sany', value: String(valuation.totalQty), cls: 'text-gray-900' },
          {
            key: 'buy',
            label: 'Alış bahasy boýunça',
            value: `${formatMoney(valuation.purchaseValue)} TMT`,
            cls: 'text-sky-600',
          },
          {
            key: 'sell',
            label: 'Satyş bahasy boýunça',
            value: `${formatMoney(valuation.saleValue)} TMT`,
            cls: 'text-emerald-600',
          },
        ].map((card) => (
          <div key={card.key} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              {card.label}
            </div>
            <div className={`text-base font-bold font-mono ${card.cls}`}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* ── Haryt ostatogy (stok galyndy) — +/- filtreli ─────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3 flex-wrap">
          <span className="text-xs font-bold text-gray-700">Haryt ostatogy</span>
          <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
            {[
              { id: 'all', label: 'Ählisi' },
              { id: 'positive', label: '+ (plyus)' },
              { id: 'negative', label: '− (minus)' },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setStockFilter(opt.id as StockFilter)}
                className={`h-6 px-2.5 rounded-md text-[10px] font-bold transition-all ${
                  stockFilter === opt.id
                    ? 'bg-[#10b981] text-white'
                    : 'bg-transparent text-gray-600 hover:bg-gray-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <span className="text-[10px] text-gray-400">
            {filteredStock.length} / {products.length} haryt
          </span>
        </div>

        {filteredStock.length === 0 ? (
          <EmptyState text="Bu görnüşde haryt ýok" />
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <th className="py-2 px-3">Haryt</th>
                <th className="py-2 px-3 text-right">Stok</th>
                <th className="py-2 px-3 text-right">Alş</th>
                <th className="py-2 px-3 text-right">Satyş</th>
                <th className="py-2 px-3 text-right">Stok bahasy (satyş)</th>
                <th className="py-2 px-3 text-center">Amal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredStock.map((product) => (
                <React.Fragment key={product.id}>
                  <tr className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-2 px-3 font-semibold text-gray-800 truncate max-w-[220px]">
                      {product.name}
                      <span className="text-gray-400 font-mono text-[10px]"> · {product.sku}</span>
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold">
                      <span className={`${product.stock < 0 ? 'text-rose-600' : product.stock === 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {product.stock > 0 ? `+${product.stock}` : String(product.stock)}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-gray-600">
                      {(product.purchasePrice ?? 0).toFixed(2)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-gray-800">
                      {product.price.toFixed(2)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-gray-600">
                      {(product.stock * product.price).toFixed(2)}
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPreviewId(previewId === product.id ? null : product.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-[#0B1F3A] hover:text-white text-gray-500 transition-colors"
                          title={rangeLabel === '' ? 'Görkez' : 'Görkez'}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {onAddToCart && onGoToCheckout && (
                          <button
                            type="button"
                            onClick={() => {
                              onAddToCart(product);
                              onGoToCheckout();
                            }}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-emerald-50 hover:bg-[#10b981] hover:text-white text-emerald-700 transition-colors"
                            title="Faktura döret"
                          >
                            <FilePlus2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {previewId === product.id && (
                    <tr>
                      <td colSpan={6} className="py-2 px-3 bg-emerald-50/40">
                        <div className="flex flex-wrap gap-2 text-[10.5px]">
                          <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                            Kritik stok: {product.criticalStock ?? '—'}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                            Golkaýer: {product.expiryDate || '—'}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                            Alş bahasy: {(product.purchasePrice ?? 0).toFixed(2)} TMT
                          </span>
                          <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                            Lomoy bahasy: {(product.wholesalePrice ?? product.price).toFixed(2)} TMT
                          </span>
                          <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                            Barkod: {product.barcode || '—'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {valuation.critical.length > 0 && (
        <div className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-amber-100 text-xs font-bold text-amber-700 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            Kritik stok derejesinden aşak ( {valuation.critical.length} )
          </div>
          <div className="flex flex-wrap gap-2 p-3">
            {valuation.critical.map((product) => (
              <span
                key={product.id}
                className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 text-[11px] font-bold"
              >
                {product.name} · {product.stock}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {[
          { key: 'best', title: 'Iň köp satylan harytlar', rows: best },
          { key: 'worst', title: 'Iň az satylan harytlar', rows: worst },
        ].map((block) => (
          <div
            key={block.key}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-gray-100 text-xs font-bold text-gray-700">
              {block.title}
            </div>
            {block.rows.length === 0 ? (
              <EmptyState text="Döwür üçin satyş maglumaty ýok" />
            ) : (
              <table className="w-full text-left text-xs">
                <tbody className="divide-y divide-gray-50">
                  {block.rows.map((row) => (
                    <tr key={row.productId}>
                      <td className="py-2 px-4 font-semibold text-gray-800 truncate">{row.name}</td>
                      <td className="py-2 px-4 text-right font-mono text-gray-500 text-[10px]">
                        {row.qty}
                      </td>
                      <td className="py-2 px-4 text-right font-mono font-bold text-emerald-600">
                        {formatMoney(row.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ))}
      </div>

      <div className="text-[10px] text-gray-400 font-semibold text-right">
        Taýýarlanyldy: {updatedStamp()}
      </div>
    </div>
  );
};