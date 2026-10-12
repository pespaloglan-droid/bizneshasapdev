import React from 'react';
import type { CurrencyRate, Ledger, MoneyTransaction } from '../../types';
import type { DateWindow } from '../../utils/calcPeriods';
import { ledgerRows, totalLedgerTmt } from '../../utils/calcAssets';
import { moneyTmt, paymentMix } from '../../utils/calcFlow';
import { inWindow } from '../../utils/calcPeriods';
import { formatMoney } from '../../utils/money';
import { updatedStamp, useReport } from '../../utils/report';
import { useT } from '../../locales/LanguageContext';
import { DonutChart, EmptyState, ReportActions } from './charts';

interface CashFlowTabProps {
  ledgers: readonly Ledger[];
  transactions: readonly MoneyTransaction[];
  currencies: readonly CurrencyRate[];
  window: DateWindow;
  rangeLabel: string;
  paperWidth: string;
}

const METHOD_COLORS: Record<string, string> = {
  cash: '#10b981',
  card: '#3b82f6',
  transfer: '#f59e0b',
};

function ledgerFlow(
  ledgerId: string,
  transactions: readonly MoneyTransaction[],
  window: DateWindow
): { income: number; expense: number } {
  let income = 0;
  let expense = 0;
  for (const transaction of transactions) {
    if (transaction.ledgerId !== ledgerId) continue;
    if (!inWindow(transaction.date, window)) continue;
    if (transaction.type === 'income') income += moneyTmt(transaction);
    else expense += moneyTmt(transaction);
  }
  return { income, expense };
}

export const CashFlowTab: React.FC<CashFlowTabProps> = ({
  ledgers,
  transactions,
  currencies,
  window,
  rangeLabel,
  paperWidth,
}) => {
  const t = useT();
  const rows = ledgerRows(ledgers, transactions, currencies);
  const total = totalLedgerTmt(rows);
  const mix = paymentMix(transactions, window);
  const report = useReport(paperWidth);

  const csvRows: (string | number)[][] = rows.map((row) => {
    const flow = ledgerFlow(row.id, transactions, window);
    return [
      row.name,
      row.currency,
      flow.income.toFixed(2),
      flow.expense.toFixed(2),
      row.balance.toFixed(2),
      row.balanceTmt.toFixed(2),
    ];
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
          {t('hasaplama.tabCash')} · {rangeLabel}
        </span>
        <ReportActions
          isPrinting={report.isPrinting}
          onPrint={() =>
            void report.print({
              title: t('hasaplama.tabCash'),
              subtitle: rangeLabel,
              columns: [t('hasaplama.colLedger'), t('hasaplama.colCurrency'), t('hasaplama.income'), t('hasaplama.expense'), t('hasaplama.colBalance'), 'TMT'],
              rows: csvRows,
              footer: t('hasaplama.totalBalanceFooter', { amount: formatMoney(total) }),
            })
          }
          csvName="kassa-hasabaty"
          headers={[t('hasaplama.colLedger'), t('hasaplama.colCurrency'), t('hasaplama.income'), t('hasaplama.expense'), t('hasaplama.colBalance'), 'TMT']}
          rows={csvRows}
          disabled={ledgers.length === 0}
        />
      </div>

      {report.notice && (
        <div className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
          {report.notice}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <span className="text-xs font-bold text-gray-700">{t('hasaplama.byLedgers')}</span>
            <span className="text-[11px] font-bold font-mono text-emerald-600">
              {formatMoney(total)} TMT
            </span>
          </div>
          {rows.length === 0 ? (
            <EmptyState text={t('hasaplama.noLedgers')} />
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                  <th className="py-2 px-4">{t('hasaplama.colLedger')}</th>
                  <th className="py-2 px-4 text-right">{t('hasaplama.income')}</th>
                  <th className="py-2 px-4 text-right">{t('hasaplama.expense')}</th>
                  <th className="py-2 px-4 text-right">{t('hasaplama.colBalance')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map((row) => {
                  const flow = ledgerFlow(row.id, transactions, window);
                  return (
                    <tr key={row.id} className="hover:bg-gray-50/60">
                      <td className="py-2 px-4">
                        <span className="font-semibold text-gray-800">{row.name}</span>
                        <span className="ml-1.5 text-[10px] font-bold text-gray-400">
                          {row.currency}
                        </span>
                      </td>
                      <td className="py-2 px-4 text-right font-mono font-bold text-emerald-600">
                        {formatMoney(flow.income)}
                      </td>
                      <td className="py-2 px-4 text-right font-mono font-bold text-rose-600">
                        {formatMoney(flow.expense)}
                      </td>
                      <td className="py-2 px-4 text-right font-mono font-bold text-gray-800">
                        {formatMoney(row.balance)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="text-xs font-bold text-gray-700 mb-3">{t('hasaplama.paymentMethodIncome')}</div>
          {mix.length === 0 ? (
            <EmptyState text={t('hasaplama.noIncomePeriod')} />
          ) : (
            <DonutChart
              slices={mix.map((row) => ({
                label: row.label,
                total: row.total,
                color: METHOD_COLORS[row.method] ?? '#94a3b8',
              }))}
            />
          )}
        </div>
      </div>

      <div className="text-[10px] text-gray-400 font-semibold text-right">
        {t('hasaplama.preparedAt')} {updatedStamp()}
      </div>
    </div>
  );
};