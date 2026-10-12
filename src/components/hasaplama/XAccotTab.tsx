import React, { useMemo, useState } from 'react';
import { CalendarClock } from 'lucide-react';
import type { InvoiceRecord, MoneyTransaction, Product } from '../../types';
import { isCountedInvoice } from '../../db/targowService';
import { inWindow, type DateWindow } from '../../utils/calcPeriods';
import { moneyTmt } from '../../utils/calcFlow';
import { invoiceTmt, productSales } from '../../utils/calcAssets';
import { formatMoney, todayIsoDate } from '../../utils/money';
import { localeFor } from '../../utils/locale';
import { useLanguage, useT } from '../../locales/LanguageContext';
import { updatedStamp, useReport } from '../../utils/report';
import { EmptyState, ReportActions } from './charts';
import { payLabel, XAccotInvoiceTable } from './XAccotInvoiceTable';

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
  const { language } = useLanguage();
  const t = useT();
  const locale = localeFor(language);
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
  const dayLabel = window.from.toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const cards = [
    { key: 'orders', label: t('hasaplama.cardInvoices'), value: String(stats.orderCount), cls: 'text-gray-900' },
    { key: 'sales', label: t('hasaplama.cardSalesTotal'), value: formatMoney(stats.salesTotal), cls: 'text-emerald-600' },
    { key: 'cash', label: t('hasaplama.cardCash'), value: formatMoney(stats.cash), cls: 'text-emerald-600' },
    { key: 'card', label: t('hasaplama.cardCard'), value: formatMoney(stats.card), cls: 'text-sky-600' },
    { key: 'credit', label: t('hasaplama.cardCredit'), value: formatMoney(stats.credit), cls: 'text-amber-600' },
    { key: 'income', label: t('hasaplama.cardKassaIncome'), value: formatMoney(stats.income), cls: 'text-emerald-600' },
    { key: 'expense', label: t('hasaplama.cardKassaExpense'), value: formatMoney(stats.expense), cls: 'text-rose-600' },
    { key: 'net', label: t('hasaplama.cardNet'), value: formatMoney(net), cls: net >= 0 ? 'text-emerald-600' : 'text-rose-600' },
  ];

  const summaryRows: (string | number)[][] = [
    [t('hasaplama.cardInvoices'), stats.orderCount],
    [t('hasaplama.salesTotalTmt'), stats.salesTotal.toFixed(2)],
    [t('hasaplama.cardCash'), stats.cash.toFixed(2)],
    [t('hasaplama.cardCard'), stats.card.toFixed(2)],
    [t('hasaplama.cardCredit'), stats.credit.toFixed(2)],
    [t('hasaplama.cardKassaIncome'), stats.income.toFixed(2)],
    [t('hasaplama.cardKassaExpense'), stats.expense.toFixed(2)],
    [t('hasaplama.cardNet'), net.toFixed(2)],
  ];

  const invoiceRows: (string | number)[][] = dayInvoices.map((invoice) => [
    invoice.invoiceNo,
    new Date(invoice.createdAt).toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
    }),
    invoice.customerName,
    invoice.itemCount,
    payLabel(invoice.paymentMethod, t),
    invoiceTmt(invoice).toFixed(2),
  ]);

  const invoiceHeaders = [t('hasaplama.colInvoiceNo'), t('hasaplama.colTime'), t('hasaplama.colCustomer'), t('hasaplama.colProduct'), t('hasaplama.colPayment'), t('hasaplama.colAmountTmt')];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
          <CalendarClock className="w-3.5 h-3.5 text-emerald-600" />
          {t('hasaplama.xaccotTitle')} · {rangeLabel}
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
                title: t('hasaplama.xaccotPrintTitle'),
                subtitle: dayLabel,
                columns: [t('hasaplama.colDesc'), t('hasaplama.colValue')],
                rows: summaryRows,
                footer: t('hasaplama.netFooter', { amount: formatMoney(net), count: dayInvoices.length }),
                extras: [
                  {
                    title: t('hasaplama.dayInvoices', { count: dayInvoices.length }),
                    columns: invoiceHeaders,
                    rows: invoiceRows,
                  },
                ],
              })
            }
            csvName={`x-accot-${day}`}
            exportKind="xaccot"
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
          {t('hasaplama.dayBestSellers')}
        </div>
        {best.length === 0 ? (
          <EmptyState text={t('hasaplama.noSalesToday')} />
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <th className="py-2 px-4">{t('hasaplama.colProduct')}</th>
                <th className="py-2 px-4 text-right">{t('hasaplama.colQty')}</th>
                <th className="py-2 px-4 text-right">{t('hasaplama.colAmountTmt')}</th>
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
        {t('hasaplama.preparedAt')} {updatedStamp()} · {t('hasaplama.productKindsSuffix', { count: products.length })}
      </div>
    </div>
  );
};