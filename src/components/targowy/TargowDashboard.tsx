import React from 'react';
import { Award, PackageCheck, TrendingUp, Users } from 'lucide-react';
import type { InvoiceRecord, LanguageCode, Targow } from '../../types';
import { currentWindow, statsFor } from '../../db/targowService';
import { formatMoney } from '../../utils/money';
import { useT } from '../../locales/LanguageContext';

interface TargowDashboardProps {
  targows: readonly Targow[];
  invoices: readonly InvoiceRecord[];
  language: LanguageCode;
}

export const TargowDashboard: React.FC<TargowDashboardProps> = ({
  targows,
  invoices,
  language,
}) => {
  const t = useT();
  const window = currentWindow('today');
  const activeTargows = targows.filter((targow) => targow.isActive);

  let todayAmount = 0;
  let todayOrders = 0;
  let bestName: string | null = null;
  let bestAmount = 0;

  for (const targow of targows) {
    const stats = statsFor(invoices, targow.id, window);
    todayAmount += stats.totalAmount;
    todayOrders += stats.orderCount;
    if (stats.totalAmount > bestAmount) {
      bestAmount = stats.totalAmount;
      bestName = targow.fullName;
    }
  }

  const cards = [
    {
      key: 'amount',
      label: t('targowy.todayTotalSales'),
      value: `${formatMoney(todayAmount)} TMT`,
      valueClass: 'text-emerald-600',
      icon: <TrendingUp className="w-4 h-4" />,
      iconClass: 'bg-emerald-50 text-emerald-600',
    },
    {
      key: 'orders',
      label: t('targowy.todayOrderCount'),
      value: String(todayOrders),
      valueClass: 'text-gray-900',
      icon: <PackageCheck className="w-4 h-4" />,
      iconClass: 'bg-sky-50 text-sky-600',
    },
    {
      key: 'active',
      label: t('targowy.activeTargows'),
      value: `${activeTargows.length} / ${targows.length}`,
      valueClass: 'text-gray-900',
      icon: <Users className="w-4 h-4" />,
      iconClass: 'bg-gray-100 text-gray-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => (
        <div key={card.key} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              {card.label}
            </span>
            <span className={`w-8 h-8 rounded-xl flex items-center justify-center ${card.iconClass}`}>
              {card.icon}
            </span>
          </div>
          <div className={`text-lg font-bold font-mono ${card.valueClass}`}>{card.value}</div>
        </div>
      ))}

      <div className="bg-white rounded-2xl shadow-sm border border-amber-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            {t('targowy.bestToday')}
          </span>
          <span className="w-8 h-8 rounded-xl flex items-center justify-center bg-amber-50 text-amber-600">
            <Award className="w-4 h-4" />
          </span>
        </div>
        {bestName ? (
          <>
            <div className="text-sm font-bold text-gray-900 truncate">{bestName}</div>
            <div className="text-xs font-mono font-bold text-amber-600 mt-0.5">
              {formatMoney(bestAmount)} TMT
            </div>
          </>
        ) : (
          <div className="text-xs font-semibold text-gray-400">
            {t('targowy.noOrdersToday')}
          </div>
        )}
      </div>
    </div>
  );
};
