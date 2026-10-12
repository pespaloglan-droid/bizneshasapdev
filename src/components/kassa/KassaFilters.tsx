import React from 'react';
import { Plus, Search, SlidersHorizontal, X } from 'lucide-react';
import type { Customer, LanguageCode, MoneyCategoryId, MoneyTxType } from '../../types';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../../db/moneyService';
import { useT } from '../../locales/LanguageContext';

export interface KassaFilterState {
  search: string;
  type: MoneyTxType | '';
  category: MoneyCategoryId | '';
  customerId: string;
  dateFrom: string;
  dateTo: string;
}

export const EMPTY_KASSA_FILTER: KassaFilterState = {
  search: '',
  type: '',
  category: '',
  customerId: '',
  dateFrom: '',
  dateTo: '',
};

interface KassaFiltersProps {
  filters: KassaFilterState;
  customers: readonly Customer[];
  language: LanguageCode;
  onChange: (next: KassaFilterState) => void;
  onAddIncome: () => void;
  onAddExpense: () => void;
  /** Giňişleýin gözleg (F3) penjiresini açýar. */
  onOpenAdvanced?: () => void;
  /** Inçe rugsatlar: "+ Girdeji" butony görkezilýär. */
  canAddIncome?: boolean;
  /** Inçe rugsatlar: "+ Çykdajy" butony görkezilýär. */
  canAddExpense?: boolean;
  /** Rugsat berilen gelir kategoriýalary (undefined = ählisi; filtrede diňe şolar görünýär). */
  allowedIncomeCategories?: readonly string[];
}

const FIELD =
  'h-10 px-3 bg-[#F8FAFC] border border-gray-200 rounded-xl text-xs font-medium text-gray-700 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent cursor-pointer';

function hasActiveFilter(filters: KassaFilterState): boolean {
  return Boolean(
    filters.search ||
      filters.type ||
      filters.category ||
      filters.customerId ||
      filters.dateFrom ||
      filters.dateTo
  );
}

export const KassaFilters: React.FC<KassaFiltersProps> = ({
  filters,
  customers,
  language,
  onChange,
  onAddIncome,
  onAddExpense,
  onOpenAdvanced,
  canAddIncome = true,
  canAddExpense = true,
  allowedIncomeCategories,
}) => {
  const t = useT();
  // Rugsat berilen gelir kategoriýalary (undefined = ählisi açyk).
  const visibleIncomeCategories =
    allowedIncomeCategories && allowedIncomeCategories.length > 0
      ? INCOME_CATEGORIES.filter((category) => allowedIncomeCategories.includes(category.id))
      : INCOME_CATEGORIES;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 flex items-center gap-3 flex-wrap">
      <div className="relative flex-1 min-w-[220px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          placeholder={t('kassa.searchPlaceholder')}
          className="w-full pl-9 pr-4 h-10 bg-[#F8FAFC] border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
        />
      </div>

      {/* Giňişleýin gözleg (F3) */}
      <button
        type="button"
        onClick={onOpenAdvanced}
        className="h-10 w-10 flex-shrink-0 flex items-center justify-center bg-white border border-gray-200 hover:border-emerald-400 hover:text-emerald-600 rounded-xl text-gray-600 shadow-sm transition-all active:scale-95"
        title={t('kassa.advancedSearchTip')}
      >
        <SlidersHorizontal className="w-4 h-4" />
      </button>

      <select
        value={filters.type}
        onChange={(e) => onChange({ ...filters, type: e.target.value as MoneyTxType | '' })}
        className={FIELD}
      >
        <option value="">{t('kassa.all')}</option>
        <option value="income">{t('kassa.income')}</option>
        <option value="expense">{t('kassa.expense')}</option>
      </select>

      <select
        value={filters.category}
        onChange={(e) => onChange({ ...filters, category: e.target.value as MoneyCategoryId | '' })}
        className={FIELD}
      >
        <option value="">{t('kassa.allCategories')}</option>
        <optgroup label={t('kassa.income')}>
          {visibleIncomeCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.label}
            </option>
          ))}
        </optgroup>
        <optgroup label={t('kassa.expense')}>
          {EXPENSE_CATEGORIES.map((category) => (
            <option key={category.id} value={category.id}>
              {category.label}
            </option>
          ))}
        </optgroup>
      </select>

      <select
        value={filters.customerId}
        onChange={(e) => onChange({ ...filters, customerId: e.target.value })}
        className={FIELD}
      >
        <option value="">{t('kassa.allCustomers')}</option>
        {customers.map((customer) => (
          <option key={customer.id} value={customer.id}>
            {customer.name}
          </option>
        ))}
      </select>

      <input
        type="date"
        value={filters.dateFrom}
        onChange={(e) => onChange({ ...filters, dateFrom: e.target.value })}
        title={t('kassa.dateStartTip')}
        className={FIELD}
      />
      <input
        type="date"
        value={filters.dateTo}
        onChange={(e) => onChange({ ...filters, dateTo: e.target.value })}
        title={t('kassa.dateEndTip')}
        className={FIELD}
      />

      {hasActiveFilter(filters) && (
        <button
          type="button"
          onClick={() => onChange(EMPTY_KASSA_FILTER)}
          className="h-10 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center gap-1.5 text-xs font-bold transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          {t('kassa.clear')}
        </button>
      )}

      <div className="flex items-center gap-2 ml-auto">
        {canAddIncome && (
        <button
          type="button"
          onClick={onAddIncome}
          className="h-10 px-5 rounded-xl bg-[#10b981] hover:bg-[#059669] text-white font-bold text-sm flex items-center gap-2 transition-colors shadow-sm flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          {t('kassa.income')}
        </button>
        )}
        {canAddExpense && (
        <button
          type="button"
          onClick={onAddExpense}
          className="h-10 px-5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm flex items-center gap-2 transition-colors shadow-sm flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          {t('kassa.expense')}
        </button>
        )}
      </div>
    </div>
  );
};
