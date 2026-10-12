import React from 'react';
import { Plus, Users } from 'lucide-react';
import type { InvoiceRecord, LanguageCode, Targow, TargowRegion } from '../../types';
import { currentWindow, dailyTotals, statsFor } from '../../db/targowService';
import { TargowCard } from './TargowCard';
import { useT } from '../../locales/LanguageContext';

export type TargowStatusFilter = 'all' | 'active' | 'inactive';

interface TargowListProps {
  targows: readonly Targow[];
  regions: readonly TargowRegion[];
  invoices: readonly InvoiceRecord[];
  language: LanguageCode;
  regionFilter: string;
  statusFilter: TargowStatusFilter;
  onRegionFilterChange: (value: string) => void;
  onStatusFilterChange: (value: TargowStatusFilter) => void;
  onAdd: () => void;
  onView: (targow: Targow) => void;
  onEdit: (targow: Targow) => void;
  onDelete: (targow: Targow) => void;
}

const FIELD =
  'h-10 px-3 bg-[#F8FAFC] border border-gray-200 rounded-xl text-xs font-medium text-gray-700 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer';

export const TargowList: React.FC<TargowListProps> = ({
  targows,
  regions,
  invoices,
  language,
  regionFilter,
  statusFilter,
  onRegionFilterChange,
  onStatusFilterChange,
  onAdd,
  onView,
  onEdit,
  onDelete,
}) => {
  const t = useT();
  const filtered = targows.filter((targow) => {
    if (regionFilter && !targow.regionIds.includes(regionFilter)) return false;
    if (statusFilter === 'active' && !targow.isActive) return false;
    if (statusFilter === 'inactive' && targow.isActive) return false;
    return true;
  });

  const todayWindow = currentWindow('today');
  const monthWindow = currentWindow('month');

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="px-6 pb-3 flex-shrink-0">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 flex items-center gap-3 flex-wrap">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            {t('targowy.targows')} ({filtered.length})
          </span>

          <select
            value={regionFilter}
            onChange={(e) => onRegionFilterChange(e.target.value)}
            className={FIELD}
          >
            <option value="">{t('targowy.allRegions')}</option>
            {regions.map((region) => (
              <option key={region.id} value={region.id}>
                {region.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value as TargowStatusFilter)}
            className={FIELD}
          >
            <option value="all">{t('targowy.allStatuses')}</option>
            <option value="active">{t('targowy.activeLabel')}</option>
            <option value="inactive">{t('targowy.inactiveLabel')}</option>
          </select>

          <button
            type="button"
            onClick={onAdd}
            className="h-10 px-5 bg-[#10b981] hover:bg-[#059669] text-white font-bold text-sm rounded-xl flex items-center gap-2 transition-colors shadow-sm ml-auto flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            {t('targowy.addTargow')}
          </button>
        </div>
      </div>

      <div className="px-3 md:px-6">
        {filtered.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="bg-white border border-gray-200 rounded-3xl p-10 flex flex-col items-center shadow-sm max-w-sm text-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                <Users className="w-8 h-8 text-gray-300" />
              </div>
              <p className="font-bold text-gray-500 text-sm">
                {targows.length === 0
                  ? t('targowy.noTargow')
                  : t('targowy.notFound')}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map((targow) => (
              <TargowCard
                key={targow.id}
                targow={targow}
                regions={regions}
                todayStats={statsFor(invoices, targow.id, todayWindow)}
                monthStats={statsFor(invoices, targow.id, monthWindow)}
                sparkline={dailyTotals(invoices, targow.id, 7)}
                language={language}
                onView={() => onView(targow)}
                onEdit={() => onEdit(targow)}
                onDelete={() => onDelete(targow)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
