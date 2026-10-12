import React from 'react';
import { Search, X } from 'lucide-react';
import type { InvoiceDraftStatus, LanguageCode, Targow, TargowRegion } from '../../types';
import type { DraftFilterState } from '../../db/draftService';
import { EMPTY_DRAFT_FILTER } from '../../db/draftService';
import { useT } from '../../locales/LanguageContext';

interface GaralamaFiltersProps {
  language: LanguageCode;
  filters: DraftFilterState;
  creators: readonly string[];
  targows: readonly Targow[];
  regions: readonly TargowRegion[];
  onChange: (next: DraftFilterState) => void;
}

const FIELD =
  'h-10 px-3 bg-[#F8FAFC] border border-gray-200 rounded-xl text-xs font-medium text-gray-700 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer';

const STATUS_OPTIONS: { value: InvoiceDraftStatus | ''; labelKey: string }[] = [
  { value: 'pending', labelKey: 'faktura.statusPending' },
  { value: 'accepted', labelKey: 'faktura.statusAccepted' },
  { value: 'rejected', labelKey: 'faktura.statusRejected' },
  { value: '', labelKey: 'faktura.filterAll' },
];

function isFiltered(filters: DraftFilterState): boolean {
  return Boolean(
    filters.search ||
      filters.createdBy ||
      filters.targowId ||
      filters.regionId ||
      filters.dateFrom ||
      filters.dateTo ||
      filters.status !== EMPTY_DRAFT_FILTER.status
  );
}

export const GaralamaFilters: React.FC<GaralamaFiltersProps> = ({
  language,
  filters,
  creators,
  targows,
  regions,
  onChange,
}) => {
  const t = useT();
  return (
  <div className="bg-white rounded-2xl border border-gray-100 p-3 flex items-center gap-2 flex-wrap">
    <div className="relative flex-1 min-w-[180px]">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      <input
        type="text"
        value={filters.search}
        onChange={(e) => onChange({ ...filters, search: e.target.value })}
        placeholder={t('faktura.filterSearchPh')}
        className="w-full pl-9 pr-3 h-10 bg-[#F8FAFC] border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-emerald-500"
      />
    </div>

    <select
      value={filters.createdBy}
      onChange={(e) => onChange({ ...filters, createdBy: e.target.value })}
      className={FIELD}
    >
      <option value="">{t('faktura.filterByUser')}</option>
      {creators.map((name) => (
        <option key={name} value={name}>
          {name}
        </option>
      ))}
    </select>

    <select
      value={filters.targowId}
      onChange={(e) => onChange({ ...filters, targowId: e.target.value })}
      className={FIELD}
    >
      <option value="">{t('faktura.filterByTargow')}</option>
      {targows.map((targow) => (
        <option key={targow.id} value={targow.id}>
          {targow.fullName}
        </option>
      ))}
    </select>

    <select
      value={filters.regionId}
      onChange={(e) => onChange({ ...filters, regionId: e.target.value })}
      className={FIELD}
    >
      <option value="">{t('faktura.filterByRegion')}</option>
      {regions.map((region) => (
        <option key={region.id} value={region.id}>
          {region.name}
        </option>
      ))}
    </select>

    <input
      type="date"
      value={filters.dateFrom}
      onChange={(e) => onChange({ ...filters, dateFrom: e.target.value })}
      className={FIELD}
      title={t('faktura.dateStartTip')}
    />
    <input
      type="date"
      value={filters.dateTo}
      onChange={(e) => onChange({ ...filters, dateTo: e.target.value })}
      className={FIELD}
      title={t('faktura.dateEndTip')}
    />

    <select
      value={filters.status}
      onChange={(e) =>
        onChange({ ...filters, status: e.target.value as InvoiceDraftStatus | '' })
      }
      className={FIELD}
    >
      {STATUS_OPTIONS.map((option) => (
        <option key={option.value || 'all'} value={option.value}>
          {t(option.labelKey)}
        </option>
      ))}
    </select>

    {isFiltered(filters) && (
      <button
        type="button"
        onClick={() => onChange(EMPTY_DRAFT_FILTER)}
        className="h-10 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center gap-1.5 text-xs font-bold transition-colors"
      >
        <X className="w-3.5 h-3.5" />
        {t('faktura.clearFilters')}
      </button>
    )}
  </div>
  );
};
