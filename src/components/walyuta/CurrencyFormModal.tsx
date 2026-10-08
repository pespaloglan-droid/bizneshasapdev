import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { CurrencyRate, LanguageCode } from '../../types';
import {
  BASE_CURRENCY_CODE,
  COMMON_CURRENCIES,
  CUSTOM_CURRENCY_OPTION,
  commonCurrency,
  generateCurrencyId,
  isCurrencyCodeUnique,
} from '../../db/currencyService';

interface CurrencyFormModalProps {
  language: LanguageCode;
  currencies: readonly CurrencyRate[];
  editingCurrency: CurrencyRate | null;
  onSave: (currency: CurrencyRate) => void;
  onClose: () => void;
}

interface CurrencyFormState {
  codeChoice: string;
  customCode: string;
  name: string;
  symbol: string;
  rate: string;
}

const INPUT =
  'w-full h-9 px-3 border border-gray-200 rounded-xl text-sm bg-[#F8FAFC] focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none';
const LABEL = 'block text-[11px] font-bold text-gray-500 mb-1';

function emptyState(): CurrencyFormState {
  return { codeChoice: 'USD', customCode: '', name: 'ABŞ dollary', symbol: '$', rate: '' };
}

function stateFromCurrency(currency: CurrencyRate): CurrencyFormState {
  const known = commonCurrency(currency.code);
  return {
    codeChoice: known ? currency.code : CUSTOM_CURRENCY_OPTION,
    customCode: known ? '' : currency.code,
    name: currency.name,
    symbol: currency.symbol,
    rate: String(currency.rate),
  };
}

export const CurrencyFormModal: React.FC<CurrencyFormModalProps> = ({
  language,
  currencies,
  editingCurrency,
  onSave,
  onClose,
}) => {
  const [form, setForm] = useState<CurrencyFormState>(() =>
    editingCurrency ? stateFromCurrency(editingCurrency) : emptyState()
  );
  const [error, setError] = useState('');

  const isCustom = form.codeChoice === CUSTOM_CURRENCY_OPTION;
  const resolvedCode = (isCustom ? form.customCode : form.codeChoice).trim().toUpperCase();

  const patch = (partial: Partial<CurrencyFormState>) =>
    setForm((prev) => ({ ...prev, ...partial }));

  const handleCodeChoice = (choice: string) => {
    const known = commonCurrency(choice);
    patch(
      known
        ? { codeChoice: choice, customCode: '', name: known.name, symbol: known.symbol }
        : { codeChoice: choice, customCode: '', name: '', symbol: '' }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!resolvedCode) {
      setError(language === 'tm' ? 'Walýuta koduny giriziň.' : 'Para birimi kodunu girin.');
      return;
    }
    if (resolvedCode === BASE_CURRENCY_CODE) {
      setError(
        language === 'tm'
          ? 'TMT esas walýuta, aýratyn goşup bolmaýar.'
          : 'TMT esas para birimidir, ayrıca eklenemez.'
      );
      return;
    }
    if (!isCurrencyCodeUnique(resolvedCode, currencies, editingCurrency?.id)) {
      setError(
        language === 'tm' ? 'Bu walýuta kody eýýäm bar.' : 'Bu para birimi kodu zaten var.'
      );
      return;
    }
    if (!form.name.trim()) {
      setError(language === 'tm' ? 'Walýuta adyny giriziň.' : 'Para birimi adını girin.');
      return;
    }

    const rate = Number(form.rate);
    if (!Number.isFinite(rate) || rate <= 0) {
      setError(
        language === 'tm'
          ? `${resolvedCode} kursy 0-dan uly bolmaly.`
          : `${resolvedCode} kuru 0'dan büyük olmalı.`
      );
      return;
    }

    const now = new Date().toISOString();
    onSave({
      id: editingCurrency?.id ?? generateCurrencyId(resolvedCode),
      code: resolvedCode,
      name: form.name.trim(),
      symbol: form.symbol.trim() || resolvedCode.slice(0, 2),
      rate,
      createdAt: editingCurrency?.createdAt ?? now,
      updatedAt: now,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
        <div className="px-5 py-4 bg-gradient-to-r from-[#0B1F3A] to-[#163864] text-white flex items-center justify-between flex-shrink-0">
          <span className="font-bold text-sm tracking-wide">
            {editingCurrency ? 'Walýutany redaktirle' : 'Täze walýuta'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-5 space-y-4">
          <div>
            <label className={LABEL}>Kod *</label>
            <select
              value={form.codeChoice}
              onChange={(e) => handleCodeChoice(e.target.value)}
              className={`${INPUT} cursor-pointer font-medium text-gray-800`}
            >
              {COMMON_CURRENCIES.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.code} — {currency.name}
                </option>
              ))}
              <option value={CUSTOM_CURRENCY_OPTION}>
                {CUSTOM_CURRENCY_OPTION} (el bilen giriz)
              </option>
            </select>
          </div>

          {isCustom && (
            <div>
              <label className={LABEL}>
                {language === 'tm' ? 'Walýuta kody (el bilen)' : 'Para birimi kodu (manuel)'} *
              </label>
              <input
                type="text"
                value={form.customCode}
                onChange={(e) => patch({ customCode: e.target.value.toUpperCase() })}
                placeholder="CHF"
                maxLength={6}
                className={`${INPUT} font-mono font-bold text-gray-800 uppercase`}
              />
            </div>
          )}

          <div>
            <label className={LABEL}>Ady *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => patch({ name: e.target.value })}
              className={`${INPUT} font-medium text-gray-800`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>
                Kurs bahasy ({resolvedCode || '—'}) *
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500 whitespace-nowrap">
                  1 {resolvedCode || '?'} =
                </span>
                <input
                  type="number"
                  step="0.0001"
                  min="0"
                  value={form.rate}
                  onChange={(e) => patch({ rate: e.target.value })}
                  placeholder="0.0000"
                  className={`${INPUT} font-mono font-bold text-gray-800`}
                />
                <span className="text-xs font-bold text-gray-500">{BASE_CURRENCY_CODE}</span>
              </div>
            </div>

            <div>
              <label className={LABEL}>
                Belgi / Simge ({language === 'tm' ? 'islege görä' : 'opsiyonel'})
              </label>
              <input
                type="text"
                value={form.symbol}
                onChange={(e) => patch({ symbol: e.target.value })}
                placeholder="$"
                maxLength={4}
                className={`${INPUT} font-bold text-gray-800`}
              />
            </div>
          </div>

          {error && (
            <div className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs"
            >
              Ýatyr
            </button>
            <button
              type="submit"
              className="h-9 px-5 rounded-xl bg-[#10b981] hover:bg-[#059669] text-white font-bold text-xs"
            >
              Ýatda sakla
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};