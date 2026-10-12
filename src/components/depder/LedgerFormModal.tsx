import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { AppUser, CurrencyRate, LanguageCode, Ledger, LedgerPermission } from '../../types';
import { BASE_CURRENCY, BASE_CURRENCY_CODE } from '../../db/currencyService';
import { generateLedgerId, isLedgerNameUnique } from '../../db/ledgerService';
import { LedgerPermissionMatrix } from './LedgerPermissionMatrix';
import { useT } from '../../locales/LanguageContext';

interface LedgerFormModalProps {
  language: LanguageCode;
  ledgers: readonly Ledger[];
  currencies: readonly CurrencyRate[];
  appUsers: readonly AppUser[];
  editingLedger: Ledger | null;
  onSave: (ledger: Ledger) => void;
  onClose: () => void;
}

interface LedgerFormState {
  name: string;
  description: string;
  currency: string;
  openingBalance: string;
  isActive: boolean;
  permissions: Record<string, LedgerPermission>;
}

const INPUT =
  'w-full h-9 px-3 border border-gray-200 rounded-xl text-sm bg-[#F8FAFC] focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none';
const LABEL = 'block text-[11px] font-bold text-gray-500 mb-1';

function emptyState(): LedgerFormState {
  return {
    name: '',
    description: '',
    currency: BASE_CURRENCY_CODE,
    openingBalance: '0',
    isActive: true,
    permissions: {},
  };
}

function stateFromLedger(ledger: Ledger): LedgerFormState {
  return {
    name: ledger.name,
    description: ledger.description ?? '',
    currency: ledger.currency,
    openingBalance: String(ledger.openingBalance),
    isActive: ledger.isActive,
    permissions: { ...ledger.permissions },
  };
}

export const LedgerFormModal: React.FC<LedgerFormModalProps> = ({
  language,
  ledgers,
  currencies,
  appUsers,
  editingLedger,
  onSave,
  onClose,
}) => {
  const t = useT();
  const [form, setForm] = useState<LedgerFormState>(() =>
    editingLedger ? stateFromLedger(editingLedger) : emptyState()
  );
  const [error, setError] = useState('');

  const patch = (partial: Partial<LedgerFormState>) =>
    setForm((prev) => ({ ...prev, ...partial }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = form.name.trim();

    if (!name) {
      setError(t('depder.nameRequired'));
      return;
    }
    if (!isLedgerNameUnique(name, ledgers, editingLedger?.id)) {
      setError(t('depder.nameExists'));
      return;
    }

    const openingBalance = Number(form.openingBalance);
    if (!Number.isFinite(openingBalance)) {
      setError(t('depder.openingBalanceNaN'));
      return;
    }

    onSave({
      id: editingLedger?.id ?? generateLedgerId(),
      name,
      description: form.description.trim() || undefined,
      currency: form.currency,
      openingBalance,
      isActive: form.isActive,
      permissions: form.permissions,
      createdAt: editingLedger?.createdAt ?? new Date().toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
        <div className="px-5 py-4 bg-gradient-to-r from-[#0B1F3A] to-[#163864] text-white flex items-center justify-between flex-shrink-0">
          <span className="font-bold text-sm tracking-wide">
            {editingLedger ? t('depder.editTitle') : t('depder.newTitle')}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>{t('depder.nameLabel')}</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => patch({ name: e.target.value })}
                autoFocus
                placeholder={t('depder.namePh')}
                className={`${INPUT} font-medium text-gray-800`}
              />
            </div>

            <div>
              <label className={LABEL}>{t('depder.currencyLabel')}</label>
              <select
                value={form.currency}
                onChange={(e) => patch({ currency: e.target.value })}
                className={`${INPUT} cursor-pointer font-medium text-gray-800`}
              >
                <option value={BASE_CURRENCY_CODE}>
                  {BASE_CURRENCY_CODE} — {BASE_CURRENCY.name}
                </option>
                {currencies.map((currency) => (
                  <option key={currency.id} value={currency.code}>
                    {currency.code} — {currency.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={LABEL}>
                {t('depder.openingLabel')} ({form.currency})
              </label>
              <input
                type="number"
                step="0.01"
                value={form.openingBalance}
                onChange={(e) => patch({ openingBalance: e.target.value })}
                className={`${INPUT} font-mono font-bold text-gray-800`}
              />
            </div>

            <div>
              <label className={LABEL}>{t('depder.descFieldLabel')}</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => patch({ description: e.target.value })}
                placeholder={t('depder.descPh')}
                className={`${INPUT} font-medium text-gray-800`}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => patch({ isActive: !form.isActive })}
            className={`h-8 px-3 rounded-xl border text-[11px] font-bold transition-all ${
              form.isActive
                ? 'bg-emerald-500 text-white border-emerald-500'
                : 'bg-white text-gray-500 border-gray-200'
            }`}
          >
            {form.isActive ? t('depder.activeLabel') : t('depder.inactiveLabel')}
          </button>

          <div>
            <div className="text-[11px] font-bold text-gray-500 mb-1.5">
              {t('depder.permsTitle')}
            </div>
            <LedgerPermissionMatrix
              appUsers={appUsers}
              permissions={form.permissions}
              onChange={(permissions) => patch({ permissions })}
            />
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
              {t('depder.cancelBtn')}
            </button>
            <button
              type="submit"
              className="h-9 px-5 rounded-xl bg-[#10b981] hover:bg-[#059669] text-white font-bold text-xs"
            >
              {t('depder.saveBtn')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
