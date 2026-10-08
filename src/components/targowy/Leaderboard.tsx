import React, { useMemo, useState } from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import type { InvoiceRecord, LanguageCode, Targow } from '../../types';
import {
  CRITERION_LABELS,
  PERIOD_LABELS,
  buildLeaderboard,
  type LeaderboardCriterion,
  type TargowPeriod,
} from '../../db/targowService';
import { formatMoney } from '../../utils/money';

interface LeaderboardProps {
  targows: readonly Targow[];
  invoices: readonly InvoiceRecord[];
  language: LanguageCode;
}

const PERIODS: TargowPeriod[] = ['today', 'week', 'month', 'all'];
const CRITERIA: LeaderboardCriterion[] = ['amount', 'orders', 'newCustomers'];
const MEDALS = ['🥇', '🥈', '🥉'];

export const Leaderboard: React.FC<LeaderboardProps> = ({ targows, invoices, language }) => {
  const [period, setPeriod] = useState<TargowPeriod>('month');
  const [criterion, setCriterion] = useState<LeaderboardCriterion>('amount');

  const rows = useMemo(
    () => buildLeaderboard(targows, invoices, period, criterion),
    [targows, invoices, period, criterion]
  );

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="px-6 pb-3 flex-shrink-0 space-y-2">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 flex items-center gap-2 flex-wrap">
          {PERIODS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setPeriod(item)}
              className={`h-9 px-4 rounded-xl text-xs font-bold transition-all ${
                period === item
                  ? 'bg-[#10b981] text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {PERIOD_LABELS[item]}
            </button>
          ))}

          <select
            value={criterion}
            onChange={(e) => setCriterion(e.target.value as LeaderboardCriterion)}
            className="h-9 px-3 ml-auto bg-[#F8FAFC] border border-gray-200 rounded-xl text-xs font-medium text-gray-700 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            {CRITERIA.map((item) => (
              <option key={item} value={item}>
                {CRITERION_LABELS[item]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="px-3 md:px-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 select-none">
                <th className="py-3 px-4 w-16 text-center">Sıra</th>
                <th className="py-3 px-4">Ady</th>
                <th className="py-3 px-4 text-right">Sargyt sany</th>
                <th className="py-3 px-4 text-right">Jemi tutar</th>
                <th className="py-3 px-4 text-right">Ortaça sargyt</th>
                <th className="py-3 px-4 text-right">Täze müşderi</th>
                <th className="py-3 px-4 text-center">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-gray-400 font-semibold text-xs">
                    {language === 'tm' ? 'Targowçy ýok' : 'Targowçı yok'}
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const isTop = row.rank <= 3;
                  return (
                    <tr
                      key={row.targow.id}
                      className={`transition-colors ${
                        isTop ? 'bg-amber-50/40 hover:bg-amber-50' : 'hover:bg-gray-50/60'
                      }`}
                    >
                      <td className="py-3 px-4 text-center">
                        {row.rank <= 3 ? (
                          <span className="text-lg" title={`${row.rank}-nji ýer`}>
                            {MEDALS[row.rank - 1]}
                          </span>
                        ) : (
                          <span className="font-mono font-bold text-gray-400">{row.rank}</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-gray-900">{row.targow.fullName}</div>
                        <div className="text-[10px] text-gray-400 font-mono">{row.targow.phone}</div>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-gray-800">
                        {row.current.orderCount}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                        {formatMoney(row.current.totalAmount)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-gray-700">
                        {formatMoney(row.current.averageAmount)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-sky-700">
                        {row.current.newCustomerCount}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center">
                          {row.trendPercent === null ? (
                            <span className="text-gray-300">—</span>
                          ) : row.trendPercent >= 0 ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[10px]">
                              <TrendingUp className="w-3.5 h-3.5" />
                              {row.trendPercent}%
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-rose-600 font-bold text-[10px]">
                              <TrendingDown className="w-3.5 h-3.5" />
                              {Math.abs(row.trendPercent)}%
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
