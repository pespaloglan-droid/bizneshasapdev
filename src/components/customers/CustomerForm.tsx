import React, { useRef, useState } from 'react';
import type { Customer, CustomerType, LanguageCode } from '../../types';
import { useT } from '../../locales/LanguageContext';

interface CustomerFormProps {
  /** 'create' — täze müşderi/işgär goşmak; 'edit' — bar bolany üýtgetmek. */
  mode: 'create' | 'edit';
  /** Diňe 'edit' režiminde gerekli: üýtgedilýän müşderiniň häzirki bahalary. */
  initial?: Customer;
  language: LanguageCode;
  /**
   * "Umumy Müşderi" ýaly sistem ýazgylary üçin ady gutulup bolmaýar.
   * Beýle ýazgylarda ady salt-okunur görkezilýär.
   */
  nameReadOnly?: boolean;
  onSave: (customer: Customer) => boolean | void | Promise<boolean | void>;
  onCancel: () => void;
}

/**
 * "Müşderi / Işgär Goş" (create) we "Redaktirle" (edit) formlary üçin ortak bileşen.
 * Ekleme we üýtgetme režimleri şol ýerde ýaşaýar — kod gaýtalanmaýar.
 *
 * Galyndy (balance) Faktura/Kassa hereketlerinden awtomatik hasaplanýar,
 * şonuň üçin formada diňe görkezilýär (read-only), el bilen üýtgedilmeýär.
 */
export const CustomerForm: React.FC<CustomerFormProps> = ({
  mode,
  initial,
  language,
  nameReadOnly = false,
  onSave,
  onCancel,
}) => {
  const t = useT();

  const [name, setName] = useState(initial?.name ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [type, setType] = useState<CustomerType>(initial?.type ?? 'customer');
  const [dueDateDays, setDueDateDays] = useState<number>(initial?.dueDateDays ?? 0);
  const [creditLimit, setCreditLimit] = useState<number>(initial?.creditLimit ?? 0);
  const [addressNote, setAddressNote] = useState(initial?.addressNote ?? '');
  const [isActive, setIsActive] = useState<boolean>(initial?.isActive ?? true);
  const [cashSalesBlocked, setCashSalesBlocked] = useState<boolean>(
    initial?.cashSalesBlocked ?? false
  );

  const savingRef = useRef(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingRef.current || !name.trim()) return;
    savingRef.current=true; setSaving(true); setError('');
    try {
    let saved;

    if (mode === 'edit' && initial) {
      // Galyndy (balance) Faktura/Kassa hereketlerinden awtomatik hasaplanýar —
      // formada diňe görkezilýär, el bilen üýtgedilmeýär, şonuň üçin saklanýar.
      saved = await onSave({
        ...initial,
        name: name.trim(),
        phone: phone.trim() || undefined,
        type,
        dueDateDays: Number(dueDateDays) || 0,
        creditLimit: Number(creditLimit) || 0,
        addressNote: addressNote.trim() || undefined,
        isActive,
        cashSalesBlocked,
      });
    } else {
      saved = await onSave({
        id: `cust-${Date.now()}`,
        name: name.trim(),
        phone: phone.trim() || undefined,
        type,
        dueDateDays: Number(dueDateDays) || 0,
        creditLimit: Number(creditLimit) || 0,
        addressNote: addressNote.trim() || undefined,
        balance: 0,
        isActive,
        cashSalesBlocked,
      });
    }
    if (saved === false) setError(t('pos.catalogWriteFailed'));
    } catch { setError(t('pos.catalogWriteFailed')); }
    finally { savingRef.current=false; setSaving(false); }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl overflow-y-auto flex-1 min-h-0 p-5 space-y-4"
    >
      <div className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">
        {mode === 'edit'
          ? t('customers.editTitle', { name })
          : t('customers.newCardTitle')}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* 1. Ad Soyad / Firma Adı */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5">
            {t('customers.nameLabel')}
          </label>
          <input
            type="text"
            required
            disabled={nameReadOnly}
            autoFocus={!nameReadOnly}
            enterKeyHint="next"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('customers.namePlaceholder')}
            title={nameReadOnly
              ? t('customers.nameReadOnlyTitle')
              : undefined}
            className={`w-full h-9 px-3 rounded-xl text-xs font-medium text-gray-800 placeholder-gray-400 outline-none transition-all ${
              nameReadOnly
                ? 'bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gray-50/70 border border-gray-200 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
            }`}
          />
        </div>

        {/* 2. Telefon Numarası */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5">
            {t('customers.phoneLabelForm')}
          </label>
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+993 65..."
            className="w-full h-9 px-3 bg-gray-50/70 border border-gray-200 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-xs font-medium text-gray-800 placeholder-gray-400 outline-none transition-all"
          />
        </div>

        {/* 3. Cari Tipi */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5">
            {t('customers.typeLabel')}
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as CustomerType)}
            className="w-full h-9 px-3 bg-gray-50/70 border border-gray-200 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-xs font-medium text-gray-800 outline-none transition-all cursor-pointer"
          >
            <option value="customer">{t('customers.typeCustomerOption')}</option>
            <option value="employee">{t('customers.typeEmployeeOption')}</option>
          </select>
        </div>

        {/* 4. Vade Günü (Ödeme Süresi) */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5">
            {t('customers.dueDateLabelForm')}
          </label>
          <input
            type="number"
            min="0"
            value={dueDateDays}
            onChange={(e) => setDueDateDays(parseInt(e.target.value) || 0)}
            className="w-full h-9 px-3 bg-gray-50/70 border border-gray-200 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-xs font-mono font-bold text-gray-800 outline-none transition-all"
          />
        </div>

        {/* 5. Borç Limiti (Maksimum) */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5">
            {t('customers.creditLimitLabelForm')}
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={creditLimit}
            onChange={(e) => setCreditLimit(parseFloat(e.target.value) || 0)}
            className="w-full h-9 px-3 bg-gray-50/70 border border-gray-200 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-xs font-mono font-bold text-gray-800 outline-none transition-all"
          />
        </div>

        {/* 6. Adres / Notlar */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5">
            {t('customers.addressLabelForm')}
          </label>
          <input
            type="text"
            value={addressNote}
            onChange={(e) => setAddressNote(e.target.value)}
            placeholder={t('customers.addressPlaceholder')}
            className="w-full h-9 px-3 bg-gray-50/70 border border-gray-200 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-xs font-medium text-gray-800 placeholder-gray-400 outline-none transition-all"
          />
        </div>

        {/* 7. Galyndy (diňe edit režiminde — awtomatik hasaplanýan, read-only) */}
        {mode === 'edit' && initial && (
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              {t('customers.balanceLabel')}
            </label>
            <input
              type="text"
              disabled
              value={`${initial.balance.toFixed(2)} TMT`}
              title={t('customers.balanceAutoTitle')}
              className="w-full h-9 px-3 bg-gray-100 border border-gray-200 rounded-xl text-xs font-mono font-bold text-gray-700 cursor-not-allowed outline-none"
            />
            <p className="text-[9px] text-gray-400 mt-1 leading-tight">
              {t('customers.balanceAutoNote')}
            </p>
          </div>
        )}
      </div>

      {/* 8. Aktiw / Passiw we Nagt satuw gadagan */}
      <div className="flex flex-wrap items-center gap-5 pt-1">
        <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
          />
          {t('customers.activeLabel')}
        </label>
        <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={cashSalesBlocked}
            onChange={(e) => setCashSalesBlocked(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
          />
          {t('customers.cashBlockedLabel')}
        </label>
        <p className="text-[9px] text-gray-400 leading-tight">
          {t('customers.cashBlockedHint')}
        </p>
      </div>

      {error && <div role="alert" className="text-rose-700">{error}</div>}
      {/* Butonlar — formun altında sabit (sticky), hiçbir şeyin üstüne binmez */}
      <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 sticky bottom-0 bg-white z-10 shadow-sm pb-1">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="flex-1 sm:flex-none px-5 h-12 rounded-xl border border-gray-300 hover:bg-gray-50 text-sm font-bold text-gray-700 transition-all active:scale-95"
        >
          {t('cancel')}
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex-1 sm:flex-none px-6 h-12 rounded-xl bg-[#10b981] hover:bg-[#059669] text-sm font-bold text-white shadow-sm transition-all active:scale-95"
        >
          {mode === 'edit' ? t('save') : t('customers.saveCreateBtn')}
        </button>
      </div>
    </form>
  );
};