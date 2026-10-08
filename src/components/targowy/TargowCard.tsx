import React from 'react';
import { Eye, Pencil, Phone, Trash2 } from 'lucide-react';
import type { LanguageCode, Targow, TargowRegion } from '../../types';
import type { TargowStats } from '../../db/targowService';
import { formatMoney } from '../../utils/money';

interface TargowCardProps {
  targow: Targow;
  regions: readonly TargowRegion[];
  todayStats: TargowStats;
  monthStats: TargowStats;
  sparkline: readonly number[];
  language: LanguageCode;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function initials(fullName: string): string {
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

export const TargowCard: React.FC<TargowCardProps> = ({
  targow,
  regions,
  todayStats,
  monthStats,
  sparkline,
  language,
  onView,
  onEdit,
  onDelete,
}) => {
  const assignedRegions = targow.regionIds
    .map((id) => regions.find((region) => region.id === id)?.name)
    .filter((name): name is string => Boolean(name));

  const peak = Math.max(...sparkline, 1);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center font-bold text-emerald-700 text-sm flex-shrink-0">
          {initials(targow.fullName) || '?'}
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-bold text-gray-900 text-sm leading-tight truncate">
            {targow.fullName}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-gray-500 font-medium mt-0.5">
            <Phone className="w-3 h-3 text-gray-400" />
            {targow.phone}
          </div>
        </div>

        <span
          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold flex-shrink-0 ${
            targow.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
          }`}
        >
          {targow.isActive ? 'Işjeň' : 'Işjeň däl'}
        </span>
      </div>

      <div className="flex flex-wrap gap-1">
        {assignedRegions.length === 0 ? (
          <span className="text-[10px] font-semibold text-gray-400">
            {language === 'tm' ? 'Etrap berkidilmedik' : 'Etrap atanmadı'}
          </span>
        ) : (
          assignedRegions.map((name) => (
            <span
              key={name}
              className="px-2 py-0.5 rounded-lg bg-sky-50 text-sky-700 text-[10px] font-bold"
            >
              {name}
            </span>
          ))
        )}
      </div>

      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            {language === 'tm' ? 'Şu günki sargytlar' : 'Bugünkü siparişler'}
          </div>
          <div className="text-xs font-mono font-bold text-gray-900">
            {todayStats.orderCount} · {formatMoney(todayStats.totalAmount)}
          </div>
        </div>

        <div className="text-right">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            {language === 'tm' ? 'Aýlyk netije' : 'Aylık sonuç'}
          </div>
          <div className="text-xs font-mono font-bold text-emerald-600">
            {formatMoney(monthStats.totalAmount)}
          </div>
        </div>
      </div>

      <div className="flex items-end gap-0.5 h-6" title={language === 'tm' ? 'Soňky 7 gün' : 'Son 7 gün'}>
        {sparkline.map((value, index) => (
          <span
            key={index}
            className={`flex-1 rounded-sm ${value > 0 ? 'bg-emerald-400' : 'bg-gray-100'}`}
            style={{ height: `${Math.max(8, (value / peak) * 100)}%` }}
          />
        ))}
      </div>

      <div className="flex items-center gap-2 pt-1 border-t border-gray-50">
        <button
          type="button"
          onClick={onView}
          className="flex-1 h-8 rounded-xl bg-[#10b981] hover:bg-[#059669] text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          {language === 'tm' ? 'Görüş' : 'Görüntüle'}
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-[#0B1F3A] hover:text-white text-gray-500 transition-colors"
          title="Redaktirle"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-rose-500 hover:text-white text-gray-500 transition-colors"
          title="Pozmak"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
