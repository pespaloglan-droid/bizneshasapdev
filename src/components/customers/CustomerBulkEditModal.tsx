import React, { useMemo, useState } from 'react';
import { AlertTriangle, ListChecks, Save, Search, X } from 'lucide-react';
import type { Customer, CustomerType, LanguageCode } from '../../types';
import { GENERAL_CUSTOMER_ID } from '../../db/customerService';

interface CustomerBulkEditModalProps {
  customers: readonly Customer[];
  language: LanguageCode;
  onClose: () => void;
  onSave: (updated: Customer[]) => void;
}

const textInput =
  'w-full h-8 px-2 bg-[#F8FAFC] border rounded-lg text-[11px] font-medium outline-none focus:ring-1 focus:ring-emerald-500';
const numInput =
  'w-full h-8 px-2 text-right bg-[#F8FAFC] border rounded-lg text-[11px] font-mono font-bold outline-none focus:ring-1 focus:ring-emerald-500';

const TYPES: { id: CustomerType; tm: string; tr: string }[] = [
  { id: 'customer', tm: 'Müşderi', tr: 'Müşteri' },
  { id: 'employee', tm: 'Işgär', tr: 'İşgören' },
  { id: 'supplier', tm: 'Üpjün ediji', tr: 'Tedarikçi' },
];

export const CustomerBulkEditModal: React.FC<CustomerBulkEditModalProps> = ({
  customers,
  language,
  onClose,
  onSave,
}) => {
  const isTm = language === 'tm';
  const [drafts, setDrafts] = useState<Customer[]>(() => customers.map((c) => ({ ...c })));
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<CustomerType | ''>('');

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return drafts.filter((c) => {
      if (typeFilter && (c.type ?? 'customer') !== typeFilter) return false;
      if (!q) return true;
      return c.name.toLowerCase().includes(q) || (c.phone ?? '').toLowerCase().includes(q);
    });
  }, [drafts, query, typeFilter]);

  const updateText = (id: string, key: 'name' | 'phone' | 'addressNote', value: string) =>
    setDrafts((prev) => prev.map((c) => (c.id === id ? { ...c, [key]: value } : c)));

  const updateType = (id: string, value: CustomerType) =>
    setDrafts((prev) => prev.map((c) => (c.id === id ? { ...c, type: value } : c)));

  const updateNumber = (id: string, key: 'dueDateDays' | 'balance', value: string) =>
    setDrafts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [key]: value === '' ? 0 : parseFloat(value) || 0 } : c))
    );

  const rowError = (c: Customer): boolean => !c.name.trim();
  const errorCount = drafts.filter(rowError).length;

  const changed = drafts.filter((draft) => {
    const original = customers.find((c) => c.id === draft.id);
    if (!original) return false;
    return (
      original.name !== draft.name ||
      (original.phone ?? '') !== (draft.phone ?? '') ||
      (original.type ?? 'customer') !== (draft.type ?? 'customer') ||
      (original.dueDateDays ?? 0) !== (draft.dueDateDays ?? 0) ||
      (original.addressNote ?? '') !== (draft.addressNote ?? '') ||
      original.balance !== draft.balance
    );
  });

  const handleSave = () => {
    if (errorCount > 0 || changed.length === 0) return;
    onSave(changed);
  };

  return (
    <div className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl w-full max-w-6xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
        <div className="px-5 py-4 bg-gradient-to-r from-[#0B1F3A] to-[#163864] text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <ListChecks className="w-5 h-5" />
            <div>
              <h3 className="text-sm font-bold tracking-wide">
                {isTm ? 'Birbada Uýtgetmek — Müşderiler' : 'Toplu Düzenleme — Müşteriler'}
              </h3>
              <p className="text-[11px] text-gray-300">
                {changed.length} {isTm ? 'üýtgeşme taýýar' : 'değişiklik hazır'}
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

        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2 flex-wrap flex-shrink-0">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={isTm ? 'At ýa-da telefon boýunça gözle...' : 'İsim veya telefon...'}
              className="w-full h-9 pl-9 pr-3 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:border-emerald-500"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as CustomerType | '')}
            className="h-9 px-3 bg-white border border-gray-200 rounded-xl text-xs outline-none cursor-pointer"
          >
            <option value="">{isTm ? 'Ähli görnüşler' : 'Tüm türler'}</option>
            {TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {isTm ? t.tm : t.tr}
              </option>
            ))}
          </select>
          <span className="text-[11px] font-bold text-gray-500 font-mono">
            {visible.length} / {drafts.length}
          </span>
        </div>

        <div className="overflow-auto flex-1">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-gray-50 z-10">
              <tr className="text-[10px] font-bold text-gray-500 uppercase border-b border-gray-200">
                <th className="py-2 px-3 min-w-[170px]">{isTm ? 'Ady Familiýasy' : 'Ad Soyad'}</th>
                <th className="py-2 px-3 min-w-[140px]">{isTm ? 'Telefon' : 'Telefon'}</th>
                <th className="py-2 px-3 min-w-[120px]">{isTm ? 'Görnüşi' : 'Tür'}</th>
                <th className="py-2 px-3 w-[90px] text-right">{isTm ? 'Möhlet' : 'Vade'}</th>
                <th className="py-2 px-3 min-w-[150px]">{isTm ? 'Salgy / Bellik' : 'Adres / Not'}</th>
                <th className="py-2 px-3 w-[120px] text-right">{isTm ? 'Galyndy' : 'Bakiye'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {visible.map((c) => {
                const bad = rowError(c);
                const isSystem = c.id === GENERAL_CUSTOMER_ID;
                return (
                  <tr key={c.id} className={bad ? 'bg-rose-50/40' : 'hover:bg-emerald-50/20'}>
                    <td className="py-1.5 px-3">
                      <input
                        type="text"
                        value={c.name}
                        disabled={isSystem}
                        onChange={(e) => updateText(c.id, 'name', e.target.value)}
                        title={isSystem ? (isTm ? 'Sistem ýazgysy — ady üýtgedilmeýär' : 'Sistem kaydı — adı değiştirilemez') : ''}
                        className={`${textInput} ${bad ? 'border-rose-400' : 'border-gray-200'} ${isSystem ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}`}
                      />
                    </td>
                    <td className="py-1.5 px-3">
                      <input
                        type="text"
                        value={c.phone ?? ''}
                        onChange={(e) => updateText(c.id, 'phone', e.target.value)}
                        className={`${textInput} border-gray-200`}
                      />
                    </td>
                    <td className="py-1.5 px-3">
                      <select
                        value={c.type ?? 'customer'}
                        onChange={(e) => updateType(c.id, e.target.value as CustomerType)}
                        className={`${textInput} border-gray-200 cursor-pointer`}
                      >
                        {TYPES.map((t) => (
                          <option key={t.id} value={t.id}>
                            {isTm ? t.tm : t.tr}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-1.5 px-3">
                      <input
                        type="number"
                        step="1"
                        value={c.dueDateDays ?? 0}
                        onChange={(e) => updateNumber(c.id, 'dueDateDays', e.target.value)}
                        className={`${numInput} border-gray-200`}
                      />
                    </td>
                    <td className="py-1.5 px-3">
                      <input
                        type="text"
                        value={c.addressNote ?? ''}
                        onChange={(e) => updateText(c.id, 'addressNote', e.target.value)}
                        className={`${textInput} border-gray-200`}
                      />
                    </td>
                    <td className="py-1.5 px-3">
                      <input
                        type="number"
                        step="0.01"
                        value={c.balance}
                        onChange={(e) => updateNumber(c.id, 'balance', e.target.value)}
                        className={`${numInput} border-gray-200`}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between gap-2 flex-shrink-0">
          <div className="text-[11px] font-bold">
            {errorCount > 0 ? (
              <span className="inline-flex items-center gap-1.5 text-rose-600">
                <AlertTriangle className="w-3.5 h-3.5" />
                {errorCount} {isTm ? 'hataly setir (at boş)' : 'hatalı satır (ad boş)'}
              </span>
            ) : (
              <span className="text-gray-400">
                {isTm ? 'Galyndy: (+) bize borçly · (−) biz borçly' : 'Bakiye: (+) bize borçlu · (−) biz borçluyuz'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs"
            >
              {isTm ? 'Ýatyr' : 'İptal'}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={errorCount > 0 || changed.length === 0}
              className="h-9 px-5 rounded-xl bg-[#10b981] hover:bg-[#059669] disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              {isTm ? `Ýatda sakla (${changed.length})` : `Kaydet (${changed.length})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};