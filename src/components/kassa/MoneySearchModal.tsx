import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, Search, SlidersHorizontal, User, X } from 'lucide-react';
import type {
  AppUser,
  CurrencyRate,
  Customer,
  InvoiceRecord,
  LanguageCode,
  Ledger,
  MoneyCategoryId,
  MoneyPaymentMethod,
  MoneyTransaction,
  MoneyTxType,
} from '../../types';
import {
  LEGACY_CATEGORIES,
  MONEY_CATEGORIES,
  categoryLabel,
} from '../../db/moneyService';
import { BASE_CURRENCY_CODE } from '../../db/currencyService';
import { isCountedInvoice } from '../../db/targowService';
import { formatMoney } from '../../utils/money';
import { KassaTable } from './KassaTable';

interface MoneySearchModalProps {
  transactions: readonly MoneyTransaction[];
  customers: readonly Customer[];
  appUsers: readonly AppUser[];
  ledgers: readonly Ledger[];
  currencies: readonly CurrencyRate[];
  invoices: readonly InvoiceRecord[];
  language: LanguageCode;
  onEdit: (transaction: MoneyTransaction) => void;
  onDelete: (transaction: MoneyTransaction) => void;
  onClose: () => void;
  /** Kassa modul düzenle/sil rugsatlary (ikonlary gizleýär). */
  canEdit?: boolean;
  canDelete?: boolean;
}

const ALL_CATEGORIES: readonly MoneyCategoryId[] = [
  ...MONEY_CATEGORIES.map((c) => c.id),
  ...LEGACY_CATEGORIES.map((c) => c.id),
];

const FIELD =
  'w-full h-9 px-2 bg-white border border-gray-200 rounded-xl text-xs outline-none cursor-pointer';

const segBtn = (active: boolean) =>
  `h-8 px-2 rounded-lg text-[11px] font-bold transition-all ${
    active ? 'bg-emerald-500 text-white shadow-xs' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
  }`;

export const MoneySearchModal: React.FC<MoneySearchModalProps> = ({
  transactions,
  customers,
  appUsers,
  ledgers,
  currencies,
  invoices,
  language,
  onEdit,
  onDelete,
  onClose,
  canEdit = true,
  canDelete = true,
}) => {
  const isTm = language === 'tm';
  const [note, setNote] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [type, setType] = useState<MoneyTxType | ''>('');
  const [categories, setCategories] = useState<ReadonlySet<MoneyCategoryId>>(() => new Set(ALL_CATEGORIES));
  const [paymentMethod, setPaymentMethod] = useState<MoneyPaymentMethod | ''>('');
  const [customerId, setCustomerId] = useState('');
  const [staffUserId, setStaffUserId] = useState('');
  const [ledgerId, setLedgerId] = useState('');
  const [currency, setCurrency] = useState('');
  const [onlyDue, setOnlyDue] = useState(false);
  const noteRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    noteRef.current?.focus();
  }, []);

  // Möhleti (vade senesi) bolan nesiýe fakturalar
  const dueInvoiceIds = useMemo(() => {
    const ids = new Set<string>();
    for (const invoice of invoices) {
      if (invoice.dueDate && isCountedInvoice(invoice)) ids.add(invoice.id);
    }
    return ids;
  }, [invoices]);

  const invoiceById = useMemo(() => {
    const map = new Map<string, InvoiceRecord>();
    for (const invoice of invoices) map.set(invoice.id, invoice);
    return map;
  }, [invoices]);

  const toggleCategory = (id: MoneyCategoryId) => {
    setCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filtered = useMemo(() => {
    const q = note.trim().toLowerCase();
    return transactions
      .filter((t) => {
        if (type && t.type !== type) return false;
        if (!categories.has(t.category)) return false;
        if (paymentMethod && t.paymentMethod !== paymentMethod) return false;
        if (customerId && t.customerId !== customerId) return false;
        if (staffUserId && t.staffUserId !== staffUserId) return false;
        if (ledgerId && t.ledgerId !== ledgerId) return false;
        if (currency && (t.currency ?? BASE_CURRENCY_CODE) !== currency) return false;
        if (dateFrom && t.date < dateFrom) return false;
        if (dateTo && t.date > dateTo) return false;
        if (onlyDue && !(t.invoiceId && dueInvoiceIds.has(t.invoiceId))) return false;
        if (!q) return true;
        const customerName = customers.find((c) => c.id === t.customerId)?.name ?? '';
        return (
          (t.description ?? '').toLowerCase().includes(q) ||
          customerName.toLowerCase().includes(q) ||
          (t.personName ?? '').toLowerCase().includes(q) ||
          invoiceById.get(t.invoiceId ?? '')?.invoiceNo.toLowerCase().includes(q) ||
          categoryLabel(t.category).toLowerCase().includes(q) ||
          false
        );
      })
      .sort((a, b) =>
        a.date === b.date ? b.createdAt.localeCompare(a.createdAt) : b.date.localeCompare(a.date)
      );
  }, [
    transactions,
    note,
    dateFrom,
    dateTo,
    type,
    categories,
    paymentMethod,
    customerId,
    staffUserId,
    ledgerId,
    currency,
    onlyDue,
    customers,
    invoiceById,
    dueInvoiceIds,
  ]);

  const incomeTotal = filtered.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expenseTotal = filtered.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[92] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl w-full max-w-6xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh] animate-in zoom-in-95 duration-150">
        <div className="px-5 py-4 bg-gradient-to-r from-[#0B1F3A] to-[#163864] text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5" />
            <div>
              <h3 className="text-sm font-bold tracking-wide">
                {isTm ? 'Kassa hereketi gözle' : 'Kasa Hareketi Ara'}
              </h3>
              <p className="text-[11px] text-gray-300">
                {isTm ? 'Tapylan: ' : 'Bulunan: '}
                {filtered.length} {isTm ? 'hereket' : 'hareket'}
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
          <div className="w-[270px] flex-shrink-0 border-r border-gray-100 bg-gray-50/60 p-3 space-y-3 overflow-y-auto">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                {isTm ? 'Bellik' : 'Açıklama'}
              </label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600 pointer-events-none" />
                <input
                  ref={noteRef}
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={isTm ? 'Bellik / müşderi / faktura...' : 'Açıklama / müşteri / fatura...'}
                  className="w-full h-9 pl-9 pr-3 bg-white border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl text-xs font-semibold text-gray-800 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-1 text-[10px] font-bold text-gray-500 uppercase mb-1">
                <CalendarDays className="w-3 h-3" /> {isTm ? 'Haçankylar' : 'Tarih aralığı'}
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className={`${FIELD} flex-1 min-w-0`}
                />
                <span className="text-gray-400 font-bold">–</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className={`${FIELD} flex-1 min-w-0`}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                {isTm ? 'Görnüşi' : 'Tür'}
              </label>
              <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white p-1">
                {(
                  [
                    { id: '', tm: 'Hemmesi', tr: 'Tümü' },
                    { id: 'income', tm: 'Girdeji', tr: 'Gelir' },
                    { id: 'expense', tm: 'Çykdajy', tr: 'Gider' },
                  ] as { id: MoneyTxType | ''; tm: string; tr: string }[]
                ).map((o) => (
                  <button key={o.id} type="button" onClick={() => setType(o.id)} className={`flex-1 ${segBtn(type === o.id)}`}>
                    {isTm ? o.tm : o.tr}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">
                  {isTm ? 'Kategoriýa' : 'Kategori'}
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setCategories(
                      categories.size === ALL_CATEGORIES.length ? new Set() : new Set(ALL_CATEGORIES)
                    )
                  }
                  className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700"
                >
                  {categories.size === ALL_CATEGORIES.length ? (isTm ? 'Hiç biri' : 'Hiçbiri') : isTm ? 'Hemmesi' : 'Tümü'}
                </button>
              </div>
              <div className="max-h-32 overflow-y-auto rounded-xl border border-gray-200 bg-white p-1 space-y-0.5">
                {[...MONEY_CATEGORIES, ...LEGACY_CATEGORIES].map((c) => (
                  <label key={c.id} className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={categories.has(c.id)}
                      onChange={() => toggleCategory(c.id)}
                      className="w-3.5 h-3.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-[11px] font-semibold text-gray-700 truncate">{categoryLabel(c.id)}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                {isTm ? 'Töleg görnüşi' : 'Ödeme türü'}
              </label>
              <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white p-1">
                {(
                  [
                    { id: '', label: isTm ? 'Hemmesi' : 'Tümü' },
                    { id: 'cash', label: isTm ? 'Nagt' : 'Nakit' },
                    { id: 'card', label: isTm ? 'Karta' : 'Kart' },
                    { id: 'transfer', label: isTm ? 'Geçirme' : 'Havale' },
                  ] as { id: MoneyPaymentMethod | ''; label: string }[]
                ).map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setPaymentMethod(o.id)}
                    className={`flex-1 ${segBtn(paymentMethod === o.id)}`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="flex items-center gap-1 text-[10px] font-bold text-gray-500 uppercase mb-1">
                <User className="w-3 h-3" /> {isTm ? 'Müşderi' : 'Müşteri'}
              </label>
              <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className={FIELD}>
                <option value="">{isTm ? 'Hemmesi' : 'Tümü'}</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                {isTm ? 'Ulanyjy' : 'Kullanıcı'}
              </label>
              <select value={staffUserId} onChange={(e) => setStaffUserId(e.target.value)} className={FIELD}>
                <option value="">{isTm ? 'Hemmesi' : 'Tümü'}</option>
                {appUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                {isTm ? 'Depder' : 'Defter'}
              </label>
              <select value={ledgerId} onChange={(e) => setLedgerId(e.target.value)} className={FIELD}>
                <option value="">{isTm ? 'Hemmesi' : 'Tümü'}</option>
                {ledgers.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                {isTm ? 'Walýuta' : 'Para birimi'}
              </label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={FIELD}>
                <option value="">{isTm ? 'Hemmesi' : 'Tümü'}</option>
                <option value={BASE_CURRENCY_CODE}>{BASE_CURRENCY_CODE}</option>
                {currencies
                  .filter((c) => c.code !== BASE_CURRENCY_CODE)
                  .map((c) => (
                    <option key={c.id} value={c.code}>
                      {c.code} — {c.name}
                    </option>
                  ))}
              </select>
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none rounded-xl border border-gray-200 bg-white px-3 py-2">
              <input
                type="checkbox"
                checked={onlyDue}
                onChange={(e) => setOnlyDue(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-[11px] font-semibold text-gray-600">
                {isTm ? 'Diňe möhleti bar bolan (Nesiýe) hereketler' : 'Sadece vadeli (veresiye) hareketler'}
              </span>
            </label>
          </div>

          {/* SAĞ: Netijeler (Kassa tablosy) */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex-1 overflow-y-auto p-3 min-h-0 bg-[#F8FAFC]">
              <KassaTable
                transactions={filtered}
                customers={customers}
                appUsers={appUsers}
                language={language}
                onEdit={onEdit}
                onDelete={onDelete}
                canEdit={canEdit}
                canDelete={canDelete}
              />
            </div>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between flex-wrap gap-2 flex-shrink-0">
          <div className="flex items-center gap-4 text-[11px] font-bold">
            <span className="text-gray-500">
              {isTm ? 'Tapylan: ' : 'Bulunan: '}
              <span className="text-emerald-600 font-mono">{filtered.length}</span> {isTm ? 'hereket' : 'hareket'}
            </span>
            <span className="text-emerald-700 font-mono">↑ {formatMoney(incomeTotal)}</span>
            <span className="text-rose-700 font-mono">↓ {formatMoney(expenseTotal)}</span>
          </div>
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