import React from 'react';
import type { MoneyTransaction } from '../../types';
import type { DateWindow } from '../../utils/calcPeriods';
import { categoryRows, flowTotals, flowTrend } from '../../utils/calcFlow';
import { formatMoney } from '../../utils/money';
import { updatedStamp, useReport } from '../../utils/report';
import { useT } from '../../locales/LanguageContext';
import { EmptyState, FlowTrendChart, ReportActions } from './charts';

interface ProfitLossTabProps {
  transactions: readonly MoneyTransaction[];
  window: DateWindow;
  rangeLabel: string;
  paperWidth: string;
}

export const ProfitLossTab: React.FC<ProfitLossTabProps> = ({
  transactions,
  window,
  rangeLabel,
  paperWidth,
}) => {
  const t = useT();
  const totals = flowTotals(transactions, window);
  const incomeRows = categoryRows(transactions, window, 'income');
  const expenseRows = categoryRows(transactions, window, 'expense');
  const trend = flowTrend(transactions, window);
  const report = useReport(paperWidth);

  const tableRows: (string | number)[][] = [
    [t('hasaplama.incomeCaps'), '', ''],
    ...incomeRows.map((row) => [row.label, row.count, row.total.toFixed(2)]),
    [t('hasaplama.incomeTotal'), '', totals.income.toFixed(2)],
    [t('hasaplama.expenseCaps'), '', ''],
    ...expenseRows.map((row) => [row.label, row.count, row.total.toFixed(2)]),
    [t('hasaplama.expenseTotal'), '', totals.expense.toFixed(2)],
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
          {t('hasaplama.tabPl')} · {rangeLabel}
        </span>
        <ReportActions
          isPrinting={report.isPrinting}
          onPrint={() =>
            void report.print({
              title: t('hasaplama.tabPl'),
              subtitle: rangeLabel,
              columns: [t('hasaplama.colDesc'), t('hasaplama.colCount'), t('hasaplama.colAmountTmt')],
              rows: tableRows,
              footer: t('hasaplama.netProfitFooter', { amount: formatMoney(totals.net) }),
            })
          }
          csvName="peyda-zyyan"
          exportKind="pl"
          rows={tableRows}
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="text-xs font-bold text-emerald-700 mb-2">{t('hasaplama.incomeItems')}</div>
          {incomeRows.length === 0 ? (
            <EmptyState text={t('hasaplama.noIncome')} />
          ) : (
            <table className="w-full text-left text-xs">
              <tbody className="divide-y divide-gray-50">
                {incomeRows.map((row) => (
                  <tr key={row.id}>
                    <td className="py-1.5 font-semibold text-gray-700">{row.label}</td>
                    <td className="py-1.5 text-right font-mono text-gray-400 text-[10px]">
                      {row.count}
                    </td>
                    <td className="py-1.5 text-right font-mono font-bold text-emerald-600">
                      {formatMoney(row.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="text-xs font-bold text-rose-700 mb-2">{t('hasaplama.expenseItems')}</div>
          {expenseRows.length === 0 ? (
            <EmptyState text={t('hasaplama.noExpense')} />
          ) : (
            <table className="w-full text-left text-xs">
              <tbody className="divide-y divide-gray-50">
                {expenseRows.map((row) => (
                  <tr key={row.id}>
                    <td className="py-1.5 font-semibold text-gray-700">{row.label}</td>
                    <td className="py-1.5 text-right font-mono text-gray-400 text-[10px]">
                      {row.count}
                    </td>
                    <td className="py-1.5 text-right font-mono font-bold text-rose-600">
                      {formatMoney(row.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {report.notice && (
        <div className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
          {report.notice}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="text-xs font-bold text-gray-700 mb-2">{t('hasaplama.incomeMinusExpense')}</div>
        <div className="flex items-center gap-6 flex-wrap">
          <span className="text-xs font-semibold text-gray-600">
            {t('hasaplama.income')}: <span className="font-mono font-bold text-emerald-600">{formatMoney(totals.income)}</span>
          </span>
          <span className="text-xs font-semibold text-gray-600">
            {t('hasaplama.expense')}: <span className="font-mono font-bold text-rose-600">{formatMoney(totals.expense)}</span>
          </span>
          <span className="text-xs font-semibold text-gray-600">
            {t('hasaplama.netProfit')}:{' '}
            <span
              className={`font-mono font-bold ${totals.net >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}
            >
              {formatMoney(totals.net)}
            </span>
          </span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="text-xs font-bold text-gray-700 mb-3">{t('hasaplama.periodMovement')}</div>
        <FlowTrendChart points={trend} />
      </div>

      <div className="text-[10px] text-gray-400 font-semibold text-right">
        {t('hasaplama.preparedAt')} {updatedStamp()} · {paperWidth}
      </div>
    </div>
  );
};