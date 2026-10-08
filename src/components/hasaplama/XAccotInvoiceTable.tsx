import React from 'react';
import type { InvoiceRecord } from '../../types';
import { invoiceTmt } from '../../utils/calcAssets';
import { formatMoney } from '../../utils/money';
import { EmptyState } from './charts';

export const PAY_LABEL: Record<string, string> = {
  cash: 'Nagt',
  card: 'Karta',
  credit: 'Nesiýe',
  split: 'Bölünen',
};

interface XAccotInvoiceTableProps {
  invoices: readonly InvoiceRecord[];
  salesTotal: number;
}

export const XAccotInvoiceTable: React.FC<XAccotInvoiceTableProps> = ({
  invoices,
  salesTotal,
}) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
      <span className="text-xs font-bold text-gray-700">
        Günüň ähli fakturalary ({invoices.length})
      </span>
      <span className="text-[11px] font-bold font-mono text-emerald-600">
        {formatMoney(salesTotal)} TMT
      </span>
    </div>
    {invoices.length === 0 ? (
      <EmptyState text="Bu gün üçin faktura ýok" />
    ) : (
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
            <th className="py-2 px-4">Faktura No</th>
            <th className="py-2 px-4">Wagt</th>
            <th className="py-2 px-4">Müşderi</th>
            <th className="py-2 px-4 text-center">Haryt</th>
            <th className="py-2 px-4 text-center">Töleg</th>
            <th className="py-2 px-4 text-right">Tutar (TMT)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {invoices.map((invoice) => (
            <tr key={invoice.id} className="hover:bg-gray-50/60">
              <td className="py-2 px-4 font-mono text-[10px] text-gray-500">{invoice.invoiceNo}</td>
              <td className="py-2 px-4 font-mono text-gray-600 whitespace-nowrap">
                {new Date(invoice.createdAt).toLocaleTimeString('tr-TR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </td>
              <td className="py-2 px-4 font-semibold text-gray-800 truncate">
                {invoice.customerName}
              </td>
              <td className="py-2 px-4 text-center font-mono text-gray-700">{invoice.itemCount}</td>
              <td className="py-2 px-4 text-center">
                <span className="inline-flex px-2 py-0.5 rounded-lg bg-gray-100 text-gray-600 text-[10px] font-bold">
                  {PAY_LABEL[invoice.paymentMethod] ?? invoice.paymentMethod}
                </span>
              </td>
              <td className="py-2 px-4 text-right font-mono font-bold text-emerald-600">
                {formatMoney(invoiceTmt(invoice))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
);