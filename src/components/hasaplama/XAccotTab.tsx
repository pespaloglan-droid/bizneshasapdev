import React, { useMemo, useState } from 'react';
import { CalendarClock } from 'lucide-react';
import type { InvoiceRecord, MoneyTransaction, Product } from '../../types';
import { isCountedInvoice } from '../../db/targowService';
import { inWindow, type DateWindow } from '../../utils/calcPeriods';
import { moneyTmt } from '../../utils/calcFlow';
import { invoiceTmt, productSales } from '../../utils/calcAssets';
import { formatMoney, todayIsoDate } from '../../utils/money';
import { updatedStamp, useReport } from '../../utils/report';
import { EmptyState, ReportActions } from './charts';
import { PAY_LABEL, XAccotInvoiceTable } from './XAccotInvoiceTable';

interface XAccotTabProps {
  invoices: readonly InvoiceRecord[];
  transactions: readonly MoneyTransaction[];
  products: readonly Product[];
  rangeLabel: string;
  paperWidth: string;
}

function dayWindow(day: string): DateWindow {
  const from = new Date(`${day}T00:00:00`);
  const to = new Date(from.getTime() + 86400000);
  return { from, to };
}

interface DayStats {
  readonly orderCount: number;
  readonly salesTotal: number;
  readonly cash: number;
  readonly card: number;
  readonly credit: number;
  readonly income: number;
  readonly expense: number;
}

function computeDay(
  invoices: readonly InvoiceRecord[],
  transactions: readonly MoneyTransaction[],
  window: DateWindow
): DayStats {
  let orderCount = 0;
  let salesTotal = 0;
  let cash = 0;
  let card = 0;
  let credit = 0;

  for (const invoice of invoices) {
    if (!isCountedInvoice(invoice)) continue;
    if (!inWindow(invoice.createdAt, window)) continue;
    const amount = invoiceTmt(invoice);
    orderCount += 1;
    salesTotal += amount;
    if (invoice.paymentMethod === 'cash') cash += amount;
    else if (invoice.paymentMethod === 'card') card += amount;
    else if (invoice.paymentMethod === 'credit') credit += amount;
  }

  let income = 0;
  let expense = 0;
  for (const transaction of transactions) {
    if (!inWindow(transaction.date, window)) continue;
    if (transaction.type === 'income') income += moneyTmt(transaction);
    else expense += moneyTmt(transaction);
  }

  return { orderCount, salesTotal, cash, card, credit, income, expense };
}

export const XAccotTab: React.FC<XAccotTabProps> = ({
  invoices,
  transactions,
  products,
  rangeLabel,
  paperWidth,
}) => {
  const [day, setDay] = useState(todayIsoDate());
  const window = useMemo(() => dayWindow(day), [day]);
  const stats = useMemo(
    () => computeDay(invoices, transactions, window),
    [invoices, transactions, window]
  );
  const best = useMemo(() => productSales(invoices, window, 8, 'top'), [invoices, window]);
  const dayInvoices = useMemo(
    () =>
      invoices
        .filter((invoice) => isCountedInvoice(invoice) && inWindow(invoice.createdAt, window))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [invoices, window]
  );
  const report = useReport(paperWidth);

  const net = stats.income - stats.expense;
  const dayLabel = window.from.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const cards = [
    { key: 'orders', label: 'Faktura sany', value: String(stats.orderCount), cls: 'text-gray-900' },
    { key: 'sales', label: 'Satyş jemi', value: formatMoney(stats.salesTotal), cls: 'text-emerald-600' },
    { key: 'cash', label: 'Nagt', value: formatMoney(stats.cash), cls: 'text-emerald-600' },
    { key: 'card', label: 'Karta', value: formatMoney(stats.card), cls: 'text-sky-600' },
    { key: 'credit', label: 'Nesiýe', value: formatMoney(stats.credit), cls: 'text-amber-600' },
    { key: 'income', label: 'Kassa girdeji', value: formatMoney(stats.income), cls: 'text-emerald-600' },
    { key: 'expense', label: 'Kassa çykdajy', value: formatMoney(stats.expense), cls: 'text-rose-600' },
    { key: 'net', label: 'Arassa', value: formatMoney(net), cls: net >= 0 ? 'text-emerald-600' : 'text-rose-600' },
  ];

  const summaryRows: (string | number)[][] = [
    ['Faktura sany', stats.orderCount],
    ['Satyş jemi (TMT)', stats.salesTotal.toFixed(2)],
    ['Nagt', stats.cash.toFixed(2)],
    ['Karta', stats.card.toFixed(2)],
    ['Nesiýe', stats.credit.toFixed(2)],
    ['Kassa girdeji', stats.income.toFixed(2)],
    ['Kassa çykdajy', stats.expense.toFixed(2)],
    ['Arassa', net.toFixed(2)],
  ];

  const invoiceRows: (string | number)[][] = dayInvoices.map((invoice) => [
    invoice.invoiceNo,
    new Date(invoice.createdAt).toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    invoice.customerName,
    invoice.itemCount,
    PAY_LABEL[invoice.paymentMethod] ?? invoice.paymentMethod,
    invoiceTmt(invoice).toFixed(2),
  ]);

  const invoiceHeaders = ['Faktura No', 'Wagt', 'Müşderi', 'Haryt', 'Töleg', 'Tutar (TMT)'];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
          <CalendarClock className="w-3.5 h-3.5 text-emerald-600" />
          X-Accot · günlük biznes · {rangeLabel}
        </span>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={day}
            onChange={(e) => setDay(e.target.value || todayIsoDate())}
            className="h-9 px-2 bg-white border border-gray-200 rounded-xl text-[11px] font-bold text-gray-700 outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <ReportActions
            isPrinting={report.isPrinting}
            onPrint={() =>
              void report.print({
                title: 'X-ACCOT (Günlük biznes)',
                subtitle: dayLabel,
                columns: ['Beýan', 'Baha'],
                rows: summaryRows,
                footer: `Arassa: ${formatMoney(net)} TMT · ${dayInvoices.length} faktura`,
                extras: [
                  {
                    title: `Günüň fakturalary (${dayInvoices.length})`,
                    columns: invoiceHeaders,
                    rows: invoiceRows,
                  },
                ],
              })
            }
            csvName={`x-accot-${day}`}
            headers={invoiceHeaders}
            rows={invoiceRows}
          />
        </div>
      </div>

      {report.notice && (
        <div className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
          {report.notice}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((card) => (
          <div key={card.key} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              {card.label}
            </div>
            <div className={`text-base font-bold font-mono ${card.cls}`}>{card.value}</div>
          </div>
        ))}
      </div>

      <XAccotInvoiceTable invoices={dayInvoices} salesTotal={stats.salesTotal} />

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 text-xs font-bold text-gray-700">
          Günüň iň köp satylan harytlary
        </div>
        {best.length === 0 ? (
          <EmptyState text="Bu gün üçin satyş ýok" />
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <th className="py-2 px-4">Haryt</th>
                <th className="py-2 px-4 text-right">Sany</th>
                <th className="py-2 px-4 text-right">Tutar (TMT)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {best.map((row) => (
                <tr key={row.productId} className="hover:bg-gray-50/60">
                  <td className="py-2 px-4 font-semibold text-gray-800 truncate">{row.name}</td>
                  <td className="py-2 px-4 text-right font-mono text-gray-600">{row.qty}</td>
                  <td className="py-2 px-4 text-right font-mono font-bold text-emerald-600">
                    {formatMoney(row.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="text-[10px] text-gray-400 font-semibold text-right">
        Taýýarlanyldy: {updatedStamp()} · {products.length} haryt görnüşi
      </div>
    </div>
  );
};