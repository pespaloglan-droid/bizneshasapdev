import React from 'react';
import { AlertTriangle } from 'lucide-react';
import type { Customer, InvoiceRecord, MoneyTransaction } from '../../types';
import type { DateWindow } from '../../utils/calcPeriods';
import { borrowedTotal, lentTotal } from '../../utils/calcFlow';
import { receivables, supplierDebts, totalReceivables } from '../../utils/calcAssets';
import { overdueDebts } from '../../utils/creditReminders';
import { formatIsoDate } from '../../utils/paymentLabels';
import { formatMoney } from '../../utils/money';
import { updatedStamp, useReport } from '../../utils/report';
import { useT } from '../../locales/LanguageContext';
import { EmptyState, ReportActions } from './charts';

interface DebtTabProps {
  customers: readonly Customer[];
  transactions: readonly MoneyTransaction[];
  invoices: readonly InvoiceRecord[];
  window: DateWindow;
  rangeLabel: string;
  paperWidth: string;
}

export const DebtTab: React.FC<DebtTabProps> = ({
  customers,
  transactions,
  invoices,
  window,
  rangeLabel,
  paperWidth,
}) => {
  const t = useT();
  const rows = receivables(customers, transactions);
  const total = totalReceivables(rows);
  const supplier = supplierDebts(customers);
  const borrowed = borrowedTotal(transactions, window);
  const lent = lentTotal(transactions, window);
  const overdue = overdueDebts(invoices);
  const report = useReport(paperWidth);

  const csvRows: (string | number)[][] = rows.map((row) => [
    row.name,
    row.balance.toFixed(2),
    row.lastPayment ?? '—',
  ]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
          {t('hasaplama.tabDebt')} · {rangeLabel}
        </span>
        <ReportActions
          isPrinting={report.isPrinting}
          onPrint={() =>
            void report.print({
              title: t('hasaplama.tabDebt'),
              subtitle: rangeLabel,
              columns: [t('hasaplama.colCustomer'), t('hasaplama.colDebtTmt'), t('hasaplama.colLastPayment')],
              rows: csvRows,
              footer: t('hasaplama.totalReceivableFooter', { amount: formatMoney(total) }),
            })
          }
          csvName="bergi-borc"
          exportKind="debt"
          rows={csvRows}
          disabled={rows.length === 0}
        />
      </div>

      {report.notice && (
        <div className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
          {report.notice}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { key: 'recv', label: t('hasaplama.totalReceivable'), value: total, cls: 'text-amber-600' },
          { key: 'sup', label: t('hasaplama.supplierDebt'), value: supplier, cls: 'text-rose-600' },
          { key: 'bor', label: t('hasaplama.borrowed'), value: borrowed, cls: 'text-rose-600' },
          { key: 'lent', label: t('hasaplama.lent'), value: lent, cls: 'text-sky-600' },
        ].map((card) => (
          <div key={card.key} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              {card.label}
            </div>
            <div className={`text-base font-bold font-mono ${card.cls}`}>
              {formatMoney(card.value)} <span className="text-[10px] text-gray-400">TMT</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 text-xs font-bold text-gray-700">
          {t('hasaplama.receivablesTitle')}
        </div>
        {rows.length === 0 ? (
          <EmptyState text={t('hasaplama.noDebt')} />
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <th className="py-2 px-4">{t('hasaplama.colCustomer')}</th>
                <th className="py-2 px-4 text-right">{t('hasaplama.colDebtTmt')}</th>
                <th className="py-2 px-4">{t('hasaplama.colLastPayment')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50/60">
                  <td className="py-2 px-4 font-semibold text-gray-800">{row.name}</td>
                  <td className="py-2 px-4 text-right font-mono font-bold text-amber-600">
                    {formatMoney(row.balance)}
                  </td>
                  <td className="py-2 px-4 font-mono text-gray-500">{row.lastPayment ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Möhleti geçen nesiýe bergileri */}
      <div className="bg-white rounded-2xl border border-rose-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-rose-100 flex items-center justify-between">
          <span className="text-xs font-bold text-rose-700 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            {t('hasaplama.overdueTitle')}
          </span>
          <span className="text-[11px] font-bold font-mono text-rose-600">
            {formatMoney(overdue.reduce((sum, row) => sum + row.remaining, 0))} TMT
          </span>
        </div>
        {overdue.length === 0 ? (
          <EmptyState text={t('hasaplama.noOverdue')} />
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <th className="py-2 px-4">{t('hasaplama.colCustomer')}</th>
                <th className="py-2 px-4">{t('hasaplama.colInvoiceNo')}</th>
                <th className="py-2 px-4 text-right">{t('hasaplama.colDebtTmt')}</th>
                <th className="py-2 px-4">{t('hasaplama.colDueDate')}</th>
                <th className="py-2 px-4 text-right">{t('hasaplama.colLate')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {overdue.map((row) => (
                <tr key={row.invoiceId} className="bg-rose-50/40 hover:bg-rose-50">
                  <td className="py-2 px-4 font-semibold text-gray-800">{row.customerName}</td>
                  <td className="py-2 px-4 font-mono text-[10px] text-gray-500">
                    {row.invoiceNo}
                  </td>
                  <td className="py-2 px-4 text-right font-mono font-bold text-rose-600">
                    {formatMoney(row.remaining)}
                  </td>
                  <td className="py-2 px-4 font-mono text-gray-600">
                    {formatIsoDate(row.dueDate)}
                  </td>
                  <td className="py-2 px-4 text-right font-bold text-rose-700">
                    {t('hasaplama.daysLate', { days: row.daysLate })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="text-[10px] text-gray-400 font-semibold text-right">
        {t('hasaplama.preparedAt')} {updatedStamp()}
      </div>
    </div>
  );
};