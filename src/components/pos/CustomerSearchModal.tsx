import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Briefcase, MapPin, Search, User, X } from 'lucide-react';
import type { Customer, CustomerType, InvoiceRecord, LanguageCode } from '../../types';
import type { TargowRegion } from '../../types';
import { isCountedInvoice } from '../../db/targowService';
import { openCreditDebts } from '../../utils/creditReminders';
import { useT } from '../../locales/LanguageContext';

interface CustomerSearchModalProps {
  customers: readonly Customer[];
  invoices: readonly InvoiceRecord[];
  regions: readonly TargowRegion[];
  language: LanguageCode;
  onSelect: (customer: Customer) => void;
  onClose: () => void;
}

type WhoFilter = 'customer' | 'both' | 'employee';
type DebtFilter = 'all' | 'has' | 'none' | 'overdue';

const segBtn = (active: boolean) =>
  `h-8 px-2 rounded-lg text-[11px] font-bold transition-all ${
    active ? 'bg-emerald-500 text-white shadow-xs' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
  }`;

const typeBadge = (type: CustomerType | undefined, t: (key: string) => string): { text: string; cls: string } => {
  if (type === 'employee') {
    return {
      text: t('pos.csBadgeEmployee'),
      cls: 'bg-purple-50 text-purple-700 border border-purple-200',
    };
  }
  return {
    text: t('pos.csBadgeCustomer'),
    cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  };
};

export const CustomerSearchModal: React.FC<CustomerSearchModalProps> = ({
  customers,
  invoices,
  regions,
  language,
  onSelect,
  onClose,
}) => {
  const t = useT();
  const [query, setQuery] = useState('');
  const [startsWith, setStartsWith] = useState(false);
  const [who, setWho] = useState<WhoFilter>('both');
  const [regionId, setRegionId] = useState('');
  const [debt, setDebt] = useState<DebtFilter>('all');
  const [highlight, setHighlight] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  // Möhleti geçen bergisi bolan müşderiler (Faktura nesiýe maglumatynan)
  const overdueIds = useMemo(() => {
    const ids = new Set<string>();
    for (const row of openCreditDebts(invoices)) {
      if (row.daysLeft < 0 && row.invoice.customerId) ids.add(row.invoice.customerId);
    }
    return ids;
  }, [invoices]);

  // Saýlanan etrapdan sargyt alan müşderiler (Targowy maglumatynan)
  const regionCustomerIds = useMemo(() => {
    if (!regionId) return null;
    const ids = new Set<string>();
    for (const invoice of invoices) {
      if (invoice.regionId === regionId && invoice.customerId && isCountedInvoice(invoice)) {
        ids.add(invoice.customerId);
      }
    }
    return ids;
  }, [invoices, regionId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return customers.filter((customer) => {
      if (who === 'customer' && customer.type === 'employee') return false;
      if (who === 'employee' && customer.type !== 'employee') return false;
      if (regionCustomerIds && !regionCustomerIds.has(customer.id)) return false;
      if (debt === 'has' && customer.balance <= 0) return false;
      if (debt === 'none' && customer.balance > 0) return false;
      if (debt === 'overdue' && !overdueIds.has(customer.id)) return false;
      if (!q) return true;
      const name = customer.name.toLowerCase();
      const phone = (customer.phone ?? '').toLowerCase();
      if (startsWith) return name.startsWith(q) || phone.startsWith(q);
      return name.includes(q) || phone.includes(q);
    });
  }, [customers, query, startsWith, who, regionId, debt, overdueIds, regionCustomerIds]);

  useEffect(() => {
    setHighlight(0);
  }, [query, regionId, who, debt, startsWith]);

  const pick = (customer: Customer | undefined) => {
    if (!customer) return;
    onSelect(customer);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      pick(filtered[highlight]);
      return;
    }
    if (filtered.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => Math.min(filtered.length - 1, h + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(0, h - 1));
    }
    window.setTimeout(() => document.getElementById(`bh-csr-${highlight}`)?.scrollIntoView({ block: 'nearest' }), 0);
  };

  const WHO: { id: WhoFilter; labelKey: string }[] = [
    { id: 'customer', labelKey: 'pos.csBadgeCustomer' },
    { id: 'both', labelKey: 'pos.csWhoBoth' },
    { id: 'employee', labelKey: 'pos.csBadgeEmployee' },
  ];

  const DEBTS: { id: DebtFilter; labelKey: string }[] = [
    { id: 'all', labelKey: 'pos.csAll' },
    { id: 'has', labelKey: 'pos.csDebtHas' },
    { id: 'none', labelKey: 'pos.csDebtNone' },
    { id: 'overdue', labelKey: 'pos.csDebtOverdue' },
  ];

  return (
    <div className="fixed inset-0 z-[92] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
        <div className="px-5 py-4 bg-gradient-to-r from-[#0B1F3A] to-[#163864] text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5" />
            <div>
              <h3 className="text-sm font-bold tracking-wide">{t('pos.csTitle')}</h3>
              <p className="text-[11px] text-gray-300">
                {t('pos.csFoundHeader', { count: filtered.length })}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 flex min-h-0" onKeyDown={handleKeyDown}>
          {/* ÇEP: Filtreler */}
          <div className="w-[250px] flex-shrink-0 border-r border-gray-100 bg-gray-50/60 p-3 space-y-3 overflow-y-auto">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                {t('pos.csSearchLabel')}
              </label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600 pointer-events-none" />
                <input
                  ref={searchRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('pos.csSearchPlaceholder')}
                  className="w-full h-9 pl-9 pr-3 bg-white border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl text-xs font-semibold text-gray-800 outline-none"
                />
              </div>
              <label className="flex items-center gap-2 mt-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={startsWith}
                  onChange={(e) => setStartsWith(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-[11px] font-semibold text-gray-600">
                  {t('pos.csStartsWith')}
                </span>
              </label>
            </div>

            <div>
              <label className="flex items-center gap-1 text-[10px] font-bold text-gray-500 uppercase mb-1">
                <User className="w-3 h-3" /> {t('pos.csWhoLabel')}
              </label>
              <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white p-1">
                {WHO.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setWho(o.id)}
                    className={`flex-1 ${segBtn(who === o.id)}`}
                  >
                    {t(o.labelKey)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="flex items-center gap-1 text-[10px] font-bold text-gray-500 uppercase mb-1">
                <MapPin className="w-3 h-3" /> {t('pos.csRegionLabel')}
              </label>
              <select
                value={regionId}
                onChange={(e) => setRegionId(e.target.value)}
                className="w-full h-9 px-2 bg-white border border-gray-200 rounded-xl text-xs outline-none cursor-pointer"
              >
                <option value="">{t('pos.csAll')}</option>
                {regions.map((region) => (
                  <option key={region.id} value={region.id}>
                    {region.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center gap-1 text-[10px] font-bold text-gray-500 uppercase mb-1">
                <Briefcase className="w-3 h-3" /> {t('pos.csDebtLabel')}
              </label>
              <div className="grid grid-cols-2 gap-1 rounded-xl border border-gray-200 bg-white p-1">
                {DEBTS.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setDebt(o.id)}
                    className={segBtn(debt === o.id)}
                  >
                    {t(o.labelKey)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SAĞ: Netijeler */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="px-3 py-2 border-b border-gray-100 flex-shrink-0">
              <span className="text-[11px] font-bold text-gray-500">
                {t('pos.csFound', { count: filtered.length })}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              {filtered.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <User className="w-10 h-10 text-gray-200 mb-2 stroke-1" />
                  <span className="text-xs font-semibold text-gray-500">
                    {t('pos.csNotFound')}
                  </span>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {filtered.map((customer, index) => {
                    const badge = typeBadge(customer.type, t);
                    const isHi = index === highlight;
                    return (
                      <div
                        key={customer.id}
                        id={`bh-csr-${index}`}
                        onClick={() => pick(customer)}
                        className={`p-2 border rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                          isHi ? 'border-emerald-500 bg-emerald-50/40 shadow-xs' : 'border-gray-100 hover:border-emerald-500 hover:bg-emerald-50/20'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 ${
                              customer.type === 'employee' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {(customer.name.trim()[0] || '?').toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-gray-900 truncate">{customer.name}</div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={`inline-flex px-1.5 py-px rounded-md text-[9px] font-bold ${badge.cls}`}>
                                {badge.text}
                              </span>
                              <span className="text-[10px] text-gray-400 font-mono truncate">
                                {customer.phone || '—'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div
                          className={`text-xs font-mono font-black flex-shrink-0 ${
                            customer.balance > 0 ? 'text-rose-600' : customer.balance < 0 ? 'text-emerald-600' : 'text-gray-400'
                          }`}
                        >
                          {customer.balance.toFixed(2)} TMT
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between flex-shrink-0">
          <span className="text-[11px] font-bold text-gray-500">
            {t('pos.csFound', { count: filtered.length })}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};