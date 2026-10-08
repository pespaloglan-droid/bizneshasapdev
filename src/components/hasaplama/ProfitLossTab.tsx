import React from 'react';
import type { MoneyTransaction } from '../../types';
import type { DateWindow } from '../../utils/calcPeriods';
import { categoryRows, flowTotals, flowTrend } from '../../utils/calcFlow';
import { formatMoney } from '../../utils/money';
import { updatedStamp, useReport } from '../../utils/report';
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
  const totals = flowTotals(transactions, window);
  const incomeRows = categoryRows(transactions, window, 'income');
  const expenseRows = categoryRows(transactions, window, 'expense');
  const trend = flowTrend(transactions, window);
  const report = useReport(paperWidth);

  const tableRows: (string | number)[][] = [
    ['GIRDEJI', '', ''],
    ...incomeRows.map((row) => [row.label, row.count, row.total.toFixed(2)]),
    ['Girdeji jemi', '', totals.income.toFixed(2)],
    ['ÇYKDAJY', '', ''],
    ...expenseRows.map((row) => [row.label, row.count, row.total.toFixed(2)]),
    ['Çykdajy jemi', '', totals.expense.toFixed(2)],
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
          Peýda-zyýan hasabaty · {rangeLabel}
        </span>
        <ReportActions
          isPrinting={report.isPrinting}
          onPrint={() =>
            void report.print({
              title: 'Peýda-zyýan hasabaty',
              subtitle: rangeLabel,
              columns: ['Beýan', 'Sany', 'Tutar (TMT)'],
              rows: tableRows,
              footer: `Arassa peýda: ${formatMoney(totals.net)} TMT`,
            })
          }
          csvName="peyda-zyyan"
          headers={['Kategoriýa', 'Sany', 'Tutar (TMT)']}
          rows={tableRows}
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="text-xs font-bold text-emerald-700 mb-2">Girdeji kalemleri</div>
          {incomeRows.length === 0 ? (
            <EmptyState text="Girdeji ýok" />
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
          <div className="text-xs font-bold text-rose-700 mb-2">Çykdajy kalemleri</div>
          {expenseRows.length === 0 ? (
            <EmptyState text="Çykdajy ýok" />
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
        <div className="text-xs font-bold text-gray-700 mb-2">Girdeji − Çykdajy</div>
        <div className="flex items-center gap-6 flex-wrap">
          <span className="text-xs font-semibold text-gray-600">
            Girdeji: <span className="font-mono font-bold text-emerald-600">{formatMoney(totals.income)}</span>
          </span>
          <span className="text-xs font-semibold text-gray-600">
            Çykdajy: <span className="font-mono font-bold text-rose-600">{formatMoney(totals.expense)}</span>
          </span>
          <span className="text-xs font-semibold text-gray-600">
            Arassa peýda:{' '}
            <span
              className={`font-mono font-bold ${totals.net >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}
            >
              {formatMoney(totals.net)}
            </span>
          </span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="text-xs font-bold text-gray-700 mb-3">Döwür boýunça hereket (girdeji / çykdajy)</div>
        <FlowTrendChart points={trend} />
      </div>

      <div className="text-[10px] text-gray-400 font-semibold text-right">
        Taýýarlanyldy: {updatedStamp()} · {paperWidth}
      </div>
    </div>
  );
};