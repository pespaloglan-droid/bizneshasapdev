import React from 'react';
import { ExternalLink, Trophy } from 'lucide-react';
import type { InvoiceRecord, Targow } from '../../types';
import type { DateWindow } from '../../utils/calcPeriods';
import { statsFor } from '../../db/targowService';
import { formatMoney } from '../../utils/money';
import { updatedStamp, useReport } from '../../utils/report';
import { useT } from '../../locales/LanguageContext';
import { EmptyState, ReportActions } from './charts';

interface TargowPerfTabProps {
  targows: readonly Targow[];
  invoices: readonly InvoiceRecord[];
  window: DateWindow;
  rangeLabel: string;
  paperWidth: string;
  onGoToTargow: () => void;
}

const MEDALS = ['🥇', '🥈', '🥉'];

export const TargowPerfTab: React.FC<TargowPerfTabProps> = ({
  targows,
  invoices,
  window,
  rangeLabel,
  paperWidth,
  onGoToTargow,
}) => {
  const t = useT();
  const rows = targows
    .map((targow) => ({ targow, stats: statsFor(invoices, targow.id, window) }))
    .sort((a, b) => b.stats.totalAmount - a.stats.totalAmount);
  const report = useReport(paperWidth);

  const csvRows: (string | number)[][] = rows.map((row) => [
    row.targow.fullName,
    row.stats.orderCount,
    row.stats.totalAmount.toFixed(2),
    row.stats.newCustomerCount,
  ]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
          <Trophy className="w-3.5 h-3.5 text-amber-500" />
          {t('hasaplama.tabTargow')} · {rangeLabel}
        </span>
        <div className="flex items-center gap-2">
          <ReportActions
            isPrinting={report.isPrinting}
            onPrint={() =>
              void report.print({
                title: t('hasaplama.tabTargow'),
                subtitle: rangeLabel,
                columns: [t('hasaplama.colTargow'), t('hasaplama.colOrderCount'), t('hasaplama.colTotalAmount'), t('hasaplama.colNewCustomer')],
                rows: csvRows,
                footer: t('hasaplama.totalFooter', { amount: formatRowsTotal(rows) }),
              })
            }
            csvName="targowcy-netijeleri"
            headers={[t('hasaplama.colTargow'), t('hasaplama.colOrderCount'), t('hasaplama.colTotalAmount'), t('hasaplama.colNewCustomer')]}
            rows={csvRows}
            disabled={rows.length === 0}
          />
          <button
            type="button"
            onClick={onGoToTargow}
            className="h-9 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-[11px] flex items-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            {t('hasaplama.fullViewInTargow')}
          </button>
        </div>
      </div>

      {report.notice && (
        <div className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
          {report.notice}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState text={t('hasaplama.noTargows')} />
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <th className="py-2 px-4 w-14 text-center">{t('hasaplama.colRank')}</th>
                <th className="py-2 px-4">{t('hasaplama.colTargow')}</th>
                <th className="py-2 px-4 text-right">{t('hasaplama.colOrderCount')}</th>
                <th className="py-2 px-4 text-right">{t('hasaplama.colTotalAmountShort')}</th>
                <th className="py-2 px-4 text-right">{t('hasaplama.colNewCustomer')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map((row, index) => (
                <tr
                  key={row.targow.id}
                  className={index < 3 ? 'bg-amber-50/40' : 'hover:bg-gray-50/60'}
                >
                  <td className="py-2 px-4 text-center">
                    {index < 3 ? (
                      <span className="text-base">{MEDALS[index]}</span>
                    ) : (
                      <span className="font-mono font-bold text-gray-400">{index + 1}</span>
                    )}
                  </td>
                  <td className="py-2 px-4 font-semibold text-gray-800">{row.targow.fullName}</td>
                  <td className="py-2 px-4 text-right font-mono text-gray-700">
                    {row.stats.orderCount}
                  </td>
                  <td className="py-2 px-4 text-right font-mono font-bold text-emerald-600">
                    {formatMoney(row.stats.totalAmount)}
                  </td>
                  <td className="py-2 px-4 text-right font-mono text-sky-700">
                    {row.stats.newCustomerCount}
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

function formatRowsTotal(
  rows: readonly { stats: { totalAmount: number } }[]
): string {
  return rows.reduce((sum, row) => sum + row.stats.totalAmount, 0).toFixed(2);
}