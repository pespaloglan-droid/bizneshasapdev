import React, { useState, useMemo, useEffect } from 'react';
import {
  FileText,
  Calendar,
  Filter,
  Search,
  Receipt,
  Printer,
  ChevronDown,
  X,
  CreditCard,
  Banknote,
  ClipboardList,
  ArrowLeftRight,
  TrendingUp,
  Clock,
  RotateCcw,
  Warehouse,
  Trash2
} from 'lucide-react';
import { InvoiceRecord, InvoiceType, LanguageCode } from '../../types';
import { useT } from '../../locales/LanguageContext';
import { localeFor } from '../../utils/locale';
import { InvoiceDeleteDialog } from './InvoiceDeleteDialog';

export type DateFilterType = 'today' | 'yesterday' | 'this_week' | 'this_month' | 'all';
export type InvoiceTypeFilter = 'sales' | 'purchase' | 'returns' | 'transfer' | 'other' | 'all';

interface InvoiceListModalProps {
  isOpen: boolean;
  invoices: InvoiceRecord[];
  language: LanguageCode;
  onClose: () => void;
  onSelectInvoice: (invoice: InvoiceRecord) => void;
  /** "Faktura → Poz" rugsady bar bolsa, pozmak ikonlary görünýär. */
  canDelete?: boolean;
  onVoidInvoice?: (invoice: InvoiceRecord) => void;
}

export const InvoiceListModal: React.FC<InvoiceListModalProps> = ({
  isOpen,
  invoices,
  language,
  onClose,
  onSelectInvoice,
  canDelete = false,
  onVoidInvoice
}) => {
  const t = useT();

  // Defaults: "direk f4 bastigimda bugunun satilmis fakturalari ciksin filtr sonradan yapilsin"
  const [dateFilter, setDateFilter] = useState<DateFilterType>('today');
  const [typeFilter, setTypeFilter] = useState<InvoiceTypeFilter>('sales');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRangeMenuOpen, setIsRangeMenuOpen] = useState(false);
  const [showVoided, setShowVoided] = useState(false);
  const [voidTarget, setVoidTarget] = useState<InvoiceRecord | null>(null);
  // F4 → satyryň üstüne bir gezek bas = saýla, IKI GEZET bas = faktuyny aç.
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Custom date range
  const todayStr = new Date().toISOString().slice(0, 10);
  const [dateFrom, setDateFrom] = useState<string>(todayStr);
  const [dateTo, setDateTo] = useState<string>(todayStr);

  // Reset to 'today' + 'sales' every time modal opens
  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().slice(0, 10);
      setDateFilter('today');
      setTypeFilter('sales');
      setSearchQuery('');
      setDateFrom(today);
      setDateTo(today);
      setShowVoided(false);
      setVoidTarget(null);
    }
  }, [isOpen]);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const allInvoices = invoices;

  // Filtering Logic
  const filteredInvoices = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
    
    // Start of Week (Monday)
    const dayOfWeek = now.getDay() || 7;
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek + 1).getTime();

    // Start of Month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    // Custom range bounds
    const fromTime = dateFrom ? new Date(dateFrom).getTime() : null;
    const toTime = dateTo ? new Date(dateTo + 'T23:59:59').getTime() : null;

    return allInvoices.filter((inv) => {
      const invTime = new Date(inv.createdAt).getTime();

      // 1. Date Filter
      if (dateFilter === 'today') {
        if (invTime < startOfToday) return false;
      } else if (dateFilter === 'yesterday') {
        if (invTime < startOfYesterday || invTime >= startOfToday) return false;
      } else if (dateFilter === 'this_week') {
        if (invTime < startOfWeek) return false;
      } else if (dateFilter === 'this_month') {
        if (invTime < startOfMonth) return false;
      } else if (dateFilter === 'all') {
        // Custom date range: if both from/to set, apply them
        if (fromTime !== null && invTime < fromTime) return false;
        if (toTime !== null && invTime > toTime) return false;
      }

      // 2. Invoice Type Filter
      if (typeFilter === 'sales') {
        if (inv.invoiceType !== 'sales') return false;
      } else if (typeFilter === 'purchase') {
        if (inv.invoiceType !== 'purchase') return false;
      } else if (typeFilter === 'returns') {
        if (inv.invoiceType !== 'sales_return' && inv.invoiceType !== 'purchase_return') return false;
      } else if (typeFilter === 'transfer') {
        if (inv.invoiceType !== 'warehouse_move') return false;
      } else if (typeFilter === 'other') {
        if (inv.invoiceType !== 'other_in' && inv.invoiceType !== 'other_out') return false;
      }

      // 3. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNo = inv.invoiceNo.toLowerCase().includes(q);
        const matchCust = inv.customerName.toLowerCase().includes(q);
        const matchCashier = inv.cashierName.toLowerCase().includes(q);
        if (!matchNo && !matchCust && !matchCashier) return false;
      }

      // 4. Ýatyrylan (voided) fakturalar — islege görä görkezilýär (deslapky: gizlin).
      if (!showVoided && inv.status === 'voided') return false;

      return true;
    });
  }, [allInvoices, dateFilter, typeFilter, searchQuery, dateFrom, dateTo, showVoided]);

  // Statistics Summary — ýatyrylan fakturalar hasaba alynmaýar.
  const stats = useMemo(() => {
    const rows = filteredInvoices.filter((inv) => inv.status !== 'voided');
    const totalCount = rows.length;
    const totalAmount = rows.reduce((sum, inv) => sum + inv.amountDue, 0);
    const cashTotal = rows.filter(i => i.paymentMethod === 'cash').reduce((sum, i) => sum + i.amountDue, 0);
    const cardTotal = rows.filter(i => i.paymentMethod === 'card').reduce((sum, i) => sum + i.amountDue, 0);
    const creditTotal = rows.filter(i => i.paymentMethod === 'credit').reduce((sum, i) => sum + i.amountDue, 0);

    return { totalCount, totalAmount, cashTotal, cardTotal, creditTotal };
  }, [filteredInvoices]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 select-none animate-in fade-in duration-150">
      <div className="bg-white border border-gray-200 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
        
        {/* 1. Modal Başlığı */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#0B1F3A] to-[#163864] text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold tracking-wide">
                  {t('invoices.title')}
                </h2>
                <span className="bg-emerald-500 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-full shadow-xs">
                  F4
                </span>
              </div>
              <p className="text-xs text-gray-300">
                {t('invoices.subtitle')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-2xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Filtre Kontrol Alanı */}
        <div className="p-4 bg-gray-50/70 border-b border-gray-200 flex flex-col space-y-3 flex-shrink-0">
          {/* Üst Satır: Tarih Butonları + Haçankylar Aralyk + Arama Kutusu */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Tarih Filtresi Butonları */}
            <div className="flex items-center space-x-1.5 bg-white p-1 rounded-2xl border border-gray-200 shadow-2xs flex-shrink-0">
              {(
                [
                  { id: 'today', labelKey: 'invoices.filterToday' },
                  { id: 'yesterday', labelKey: 'invoices.filterYesterday' },
                  { id: 'this_week', labelKey: 'invoices.filterThisWeek' },
                  { id: 'this_month', labelKey: 'invoices.filterThisMonth' },
                  { id: 'all', labelKey: 'invoices.filterAll' },
                ] as { id: DateFilterType; labelKey: string }[]
              ).map((btn) => {
                const isActive = dateFilter === btn.id;
                return (
                  <button
                    key={btn.id}
                    type="button"
                    onClick={() => setDateFilter(btn.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-[#10b981] text-white shadow-xs'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {t(btn.labelKey)}
                  </button>
                );
              })}
            </div>

            {/* Haçankylar: Başlangıç → Bitiş Tarih Aralık Seçici */}
            <div className="relative flex items-center bg-white border border-gray-200 rounded-2xl shadow-2xs px-3 py-1.5 gap-2 flex-shrink-0">
              {/* Başlık */}
              <div className="flex flex-col items-center mr-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-[#0B1F3A] opacity-70 leading-none mb-0.5">
                  {t('invoices.rangeTitle')}
                </span>
              </div>
              {/* Başlangıç Tarihi */}
              <div className="relative flex items-center">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setDateFilter('all');
                    setIsRangeMenuOpen(false);
                  }}
                  className="h-8 w-[120px] pl-2.5 pr-1 bg-[#F8FAFC] border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-xs font-mono font-bold text-[#0B1F3A] outline-none transition-all cursor-pointer"
                />
              </div>

              {/* ≡ Ayraç / Preset Menü Tetikleyici */}
              <div className="relative flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setIsRangeMenuOpen(prev => !prev)}
                  className={`flex flex-col items-center justify-center w-7 h-7 rounded-lg transition-all ${
                    isRangeMenuOpen
                      ? 'bg-[#10b981] shadow-md'
                      : 'bg-[#0B1F3A] hover:bg-[#163864]'
                  }`}
                  title={t('invoices.presetTooltip')}
                >
                  <div className="w-3 border-t-[1.5px] border-white mb-[2px]" />
                  <div className="w-3 border-t-[1.5px] border-white" />
                  <div className="w-3 border-t-[1.5px] border-white mt-[2px]" />
                </button>

                {/* Dropdown Preset Menüsü */}
                {isRangeMenuOpen && (
                  <div className="absolute top-9 left-1/2 -translate-x-1/2 z-[80] bg-white border border-gray-200 rounded-2xl shadow-2xl w-64 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-4 py-2.5 bg-[#0B1F3A] text-white text-[10px] font-black uppercase tracking-wider">
                      {t('invoices.presetMenuTitle')}
                    </div>
                    <div className="overflow-y-auto max-h-[320px] py-1">
                      {([
                        { days: null,  labelKey: 'invoices.presetToday',          from: 0,   to: 0   },
                        { days: -1,    labelKey: 'invoices.presetYesterday',      from: 1,   to: 1   },
                        { days: -2,    labelKey: 'invoices.presetDayBefore',      from: 2,   to: 2   },
                        { days: 7,     labelKey: 'invoices.presetThisWeek',       from: 'week_start', to: 0  },
                        { days: 31,    labelKey: 'invoices.presetThisMonth',      from: 'month_start', to: 0 },
                        { days: 365,   labelKey: 'invoices.presetThisYear',       from: 'year_start', to: 0  },
                        { days: null,  divider: true,                             from: null, to: null },
                        { days: 7,     labelKey: 'invoices.presetLastWeek',       from: 'last_week_start', to: 'last_week_end' },
                        { days: 31,    labelKey: 'invoices.presetLastMonth',      from: 'last_month_start', to: 'last_month_end' },
                        { days: 2,     labelKey: 'invoices.presetSinceYesterday', from: 1,   to: 0   },
                        { days: 3,     labelKey: 'invoices.presetSinceDayBefore', from: 2,   to: 0   },
                        { days: 8,     labelKey: 'invoices.presetSinceLastWeek',  from: 8,   to: 0   },
                        { days: 55,    labelKey: 'invoices.presetSinceLastMonth', from: 55,  to: 0   },
                        { days: 365,   labelKey: 'invoices.presetLastYear',       from: 'last_year_start', to: 'last_year_end' },
                      ] as any[]).map((preset, idx) => {
                        if (preset.divider) {
                          return <div key={idx} className="my-1 mx-4 border-t border-gray-100" />;
                        }

                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              const now = new Date();
                              const fmt = (d: Date) => d.toISOString().slice(0, 10);

                              let from = new Date();
                              let to = new Date();

                              if (preset.from === 0 && preset.to === 0) {
                                // Şu gün
                              } else if (typeof preset.from === 'number' && typeof preset.to === 'number') {
                                from.setDate(now.getDate() - preset.from);
                                to.setDate(now.getDate() - preset.to);
                              } else if (preset.from === 'week_start') {
                                const day = now.getDay() || 7;
                                from.setDate(now.getDate() - day + 1);
                              } else if (preset.from === 'month_start') {
                                from = new Date(now.getFullYear(), now.getMonth(), 1);
                              } else if (preset.from === 'year_start') {
                                from = new Date(now.getFullYear(), 0, 1);
                              } else if (preset.from === 'last_week_start') {
                                const day = now.getDay() || 7;
                                from = new Date(now); from.setDate(now.getDate() - day - 6);
                                to = new Date(now); to.setDate(now.getDate() - day);
                              } else if (preset.from === 'last_month_start') {
                                from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                                to = new Date(now.getFullYear(), now.getMonth(), 0);
                              } else if (preset.from === 'last_year_start') {
                                from = new Date(now.getFullYear() - 1, 0, 1);
                                to = new Date(now.getFullYear() - 1, 11, 31);
                              }

                              setDateFrom(fmt(from));
                              setDateTo(fmt(to));
                              setDateFilter('all');
                              setIsRangeMenuOpen(false);
                            }}
                            className="w-full flex items-center px-4 py-2.5 hover:bg-emerald-50 transition-colors text-left group"
                          >
                            {preset.days !== null && (
                              <span className="w-8 text-right mr-3 font-mono font-black text-xs text-[#0B1F3A] opacity-60 group-hover:opacity-100 group-hover:text-emerald-700 transition-colors flex-shrink-0">
                                {preset.days}
                              </span>
                            )}
                            {preset.days === null && <span className="w-8 mr-3" />}
                            <span className="text-xs font-semibold text-gray-700 group-hover:text-[#0B1F3A] transition-colors">
                              {t(preset.labelKey)}
                            </span>
                            {(preset.days === 365 && (preset.labelKey === 'invoices.presetThisYear' || preset.labelKey === 'invoices.presetLastYear')) && (
                              <span className="ml-auto text-blue-500 font-bold text-sm">›</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Bitiş Tarihi */}
              <div className="relative flex items-center">
                <input
                  type="date"
                  value={dateTo}
                  min={dateFrom}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setDateFilter('all');
                    setIsRangeMenuOpen(false);
                  }}
                  className="h-8 w-[120px] pl-2.5 pr-1 bg-[#F8FAFC] border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-xs font-mono font-bold text-[#0B1F3A] outline-none transition-all cursor-pointer"
                />
              </div>
            </div>

            {/* Arama Inputu */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('invoices.searchPlaceholder')}
                className="w-full h-9 pl-3 pr-8 bg-white border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-xs font-medium text-gray-800 placeholder-gray-400 outline-none shadow-2xs transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Alt Satır: Faktura Görnüşi Butonları */}
          <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mr-1 flex items-center space-x-1">
              <Filter className="w-3.5 h-3.5 text-gray-400" />
              <span>{t('invoices.typeLabel')}</span>
            </span>
            {(
              [
                { id: 'sales', labelKey: 'invoices.typeSales' },
                { id: 'all', labelKey: 'invoices.typeAll' },
                { id: 'purchase', labelKey: 'invoices.typePurchase' },
                { id: 'returns', labelKey: 'invoices.typeReturns' },
                { id: 'transfer', labelKey: 'invoices.typeTransfer' },
                { id: 'other', labelKey: 'invoices.typeOther' },
              ] as { id: InvoiceTypeFilter; labelKey: string }[]
            ).map((tBtn) => {
              const isSelected = typeFilter === tBtn.id;
              return (
                <button
                  key={tBtn.id}
                  type="button"
                  onClick={() => setTypeFilter(tBtn.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-gray-600 border border-gray-200/80 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  {t(tBtn.labelKey)}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Özet İstatistik Çubuğu (Stats Bar) */}
        <div className="px-6 py-2.5 bg-white border-b border-gray-100 flex items-center justify-between flex-wrap gap-3 text-xs flex-shrink-0">
          <div className="flex items-center space-x-4">
            <div>
              <span className="text-gray-400 font-medium">{t('invoices.statsTotal')}: </span>
              <span className="font-mono font-bold text-gray-900">{stats.totalCount} {t('invoices.statsCountSuffix')}</span>
            </div>
            <div>
              <span className="text-gray-400 font-medium">{t('invoices.statsAmount')}: </span>
              <span className="font-mono font-black text-emerald-600 text-sm">
                {stats.totalAmount.toFixed(2)} TMT
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-[11px]">
            <div className="flex items-center space-x-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60 font-mono font-bold">
              <Banknote className="w-3.5 h-3.5" />
              <span>{t('invoices.payCash')}: {stats.cashTotal.toFixed(2)} TMT</span>
            </div>
            <div className="flex items-center space-x-1 text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200/60 font-mono font-bold">
              <CreditCard className="w-3.5 h-3.5" />
              <span>{t('invoices.payCard')}: {stats.cardTotal.toFixed(2)} TMT</span>
            </div>
            <div className="flex items-center space-x-1 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/60 font-mono font-bold">
              <ClipboardList className="w-3.5 h-3.5" />
              <span>{t('invoices.payCredit')}: {stats.creditTotal.toFixed(2)} TMT</span>
            </div>

            {canDelete && (
              <button
                type="button"
                onClick={() => setShowVoided((prev) => !prev)}
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-colors ${
                  showVoided
                    ? 'bg-gray-800 text-white border-gray-800'
                    : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                }`}
                title={t('invoices.voidedToggleTip')}
              >
                {t('invoices.voidedToggle')}
              </button>
            )}
          </div>
        </div>

        {/* 4. Fakturalar Tablosu (Scrollable) */}
        <div className="flex-1 overflow-y-auto min-h-0 bg-white">
          {filteredInvoices.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-gray-400 text-xs">
              <FileText className="w-12 h-12 text-gray-300 mb-2 stroke-1" />
              <span className="font-semibold text-gray-500">
                {t('invoices.emptyTitle')}
              </span>
              <p className="text-[11px] text-gray-400 mt-1">
                {t('invoices.emptyHint')}
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-[10px] font-bold text-gray-500 uppercase tracking-wider select-none sticky top-0 bg-gray-50 z-10">
                  <th className="py-3 px-4">{t('invoices.colNo')}</th>
                  <th className="py-3 px-4">{t('invoices.colDate')}</th>
                  <th className="py-3 px-4">{t('invoices.colCustomer')}</th>
                  <th className="py-3 px-4">{t('invoices.colType')}</th>
                  <th className="py-3 px-4">{t('invoices.colPayment')}</th>
                  <th className="py-3 px-4 text-center">{t('invoices.colItems')}</th>
                  <th className="py-3 px-4 text-right">{t('invoices.colAmount')}</th>
                  {canDelete && (
                    <th className="py-3 px-4 text-center w-16">
                      {t('invoices.colAction')}
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredInvoices.map((inv) => {
                  const formattedDate = new Date(inv.createdAt).toLocaleString(
                    localeFor(language),
                    {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }
                  );

                  return (
                    <tr
                      key={inv.id}
                      onClick={() => setSelectedId(inv.id)}
                      onDoubleClick={() => onSelectInvoice(inv)}
                      className={`transition-colors cursor-pointer ${
                        selectedId === inv.id
                          ? 'bg-emerald-50 ring-1 ring-inset ring-emerald-300'
                          : inv.status === 'voided'
                            ? 'bg-gray-50/70 opacity-60'
                            : 'hover:bg-emerald-50/30'
                      }`}
                      title={t('invoices.rowOpenTip')}
                    >
                      {/* Faktura Kody */}
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectInvoice(inv);
                          }}
                          className="font-mono font-bold text-xs text-emerald-800 bg-emerald-50 hover:bg-emerald-600 hover:text-white border border-emerald-300 px-2.5 py-1 rounded-xl whitespace-nowrap shadow-xs transition-all flex items-center space-x-1.5 active:scale-95 group"
                          title={t('invoices.receiptOpenTip')}
                        >
                          <Receipt className="w-3.5 h-3.5 text-emerald-600 group-hover:text-white transition-colors" />
                          <span className={inv.status === 'voided' ? 'line-through' : ''}>{inv.invoiceNo}</span>
                        </button>
                        {inv.status === 'voided' && (
                          <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-600 border border-rose-200 text-[9px] font-bold align-middle">
                            {t('invoices.voidedBadge')}
                          </span>
                        )}
                      </td>

                      {/* Sene / Wagt */}
                      <td className="py-3 px-4 font-mono text-[11px] text-gray-600 whitespace-nowrap">
                        {formattedDate}
                      </td>

                      {/* Müşderi / Cari */}
                      <td className="py-3 px-4 font-bold text-gray-900">
                        {inv.customerName}
                      </td>

                      {/* Görnüşi */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            inv.invoiceType === 'sales'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200/80'
                              : inv.invoiceType === 'sales_return'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200/80'
                              : inv.invoiceType === 'warehouse_move'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200/80'
                              : 'bg-gray-100 text-gray-700 border border-gray-200'
                          }`}
                        >
                          {inv.invoiceType === 'sales'
                            ? t('invoices.typeSales')
                            : inv.invoiceType === 'sales_return'
                            ? t('invoices.returnBadge')
                            : inv.invoiceType === 'warehouse_move'
                            ? t('invoices.typeTransfer')
                            : inv.invoiceType}
                        </span>
                      </td>

                      {/* Töleg Usuly */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            inv.paymentMethod === 'cash'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                              : inv.paymentMethod === 'card'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                              : inv.paymentMethod === 'credit'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                              : 'bg-purple-50 text-purple-700 border border-purple-200/60'
                          }`}
                        >
                          {inv.paymentMethod === 'cash'
                            ? t('invoices.payCash')
                            : inv.paymentMethod === 'card'
                            ? t('invoices.payCard')
                            : inv.paymentMethod === 'credit'
                            ? t('invoices.payCredit')
                            : t('invoices.paySplit')}
                        </span>
                      </td>

                      {/* Haryt Sany */}
                      <td className="py-3 px-4 text-center font-mono font-semibold text-gray-700">
                        {inv.itemCount}
                      </td>

                      {/* Jemi Tutar */}
                      <td className="py-3 px-4 text-right font-mono font-black text-gray-900 text-sm whitespace-nowrap">
                        {inv.amountDue.toFixed(2)} TMT
                      </td>

                      {/* Amal — Faktura pozmak */}
                      {canDelete && (
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            disabled={inv.status === 'voided'}
                            onClick={(e) => {
                              e.stopPropagation();
                              setVoidTarget(inv);
                            }}
                            className="w-8 h-8 inline-flex items-center justify-center rounded-xl bg-gray-100 hover:bg-rose-500 hover:text-white text-gray-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            title={t('invoices.deleteTip')}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* 5. Alt Bilgi & Kapat Butonu */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between flex-shrink-0">
          <div className="text-[11px] text-gray-500 font-medium">
            {t('invoices.footerHint')}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-gray-800 hover:bg-gray-900 text-white font-bold text-xs transition-colors shadow-xs"
          >
            {t('invoices.closeBtn')}
          </button>
        </div>
      </div>

      {voidTarget && onVoidInvoice && (
        <InvoiceDeleteDialog
          invoiceNo={voidTarget.invoiceNo}
          customerName={voidTarget.customerName}
          language={language}
          onCancel={() => setVoidTarget(null)}
          onConfirm={() => {
            onVoidInvoice(voidTarget);
            setVoidTarget(null);
          }}
        />
      )}
    </div>
  );
};
