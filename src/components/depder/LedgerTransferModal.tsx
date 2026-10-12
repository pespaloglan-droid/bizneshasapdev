import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { CurrencyRate, LanguageCode, Ledger, MoneyTransaction } from '../../types';
import { rateForCode } from '../../db/currencyService';
import { buildTransferTransactions, convertBetween } from '../../db/ledgerService';
import { formatMoney, todayIsoDate } from '../../utils/money';
import { useT } from '../../locales/LanguageContext';

interface LedgerTransferModalProps {
  language: LanguageCode;
  ledgers: readonly Ledger[];
  currencies: readonly CurrencyRate[];
  onTransfer: (transactions: [MoneyTransaction, MoneyTransaction]) => void;
  onClose: () => void;
}

const INPUT =
  'w-full h-9 px-3 border border-gray-200 rounded-xl text-sm bg-[#F8FAFC] focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none';
const LABEL = 'block text-[11px] font-bold text-gray-500 mb-1';

export const LedgerTransferModal: React.FC<LedgerTransferModalProps> = ({
  language,
  ledgers,
  currencies,
  onTransfer,
  onClose,
}) => {
  const t = useT();
  const [fromId, setFromId] = useState(ledgers[0]?.id ?? '');
  const [toId, setToId] = useState(ledgers[1]?.id ?? '');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayIsoDate());
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const from = ledgers.find((ledger) => ledger.id === fromId) ?? null;
  const to = ledgers.find((ledger) => ledger.id === toId) ?? null;

  const fromRate = rateForCode(currencies, from?.currency);
  const toRate = rateForCode(currencies, to?.currency);
  const parsedAmount = Number(amount);
  const received =
    Number.isFinite(parsedAmount) && parsedAmount > 0 ? convertBetween(parsedAmount, fromRate, toRate) : 0;
  const crossCurrency = Boolean(from && to && from.currency !== to.currency);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!from || !to) {
      setError(t('depder.selectLedgers'));
      return;
    }
    if (from.id === to.id) {
      setError(t('depder.sameLedger'));
      return;
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError(t('depder.amountPositive'));
      return;
    }

    onTransfer(
      buildTransferTransactions({
        from,
        to,
        amount: parsedAmount,
        date,
        description,
        fromRate,
        toRate,
      })
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
        <div className="px-5 py-4 bg-gradient-to-r from-[#0B1F3A] to-[#163864] text-white flex items-center justify-between flex-shrink-0">
          <span className="font-bold text-sm tracking-wide">{t('depder.transferTitle')}</span>
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
              <label className={LABEL}>{t('depder.fromLedger')}</label>
              <select
                value={fromId}
                onChange={(e) => setFromId(e.target.value)}
                className={`${INPUT} cursor-pointer font-medium text-gray-800`}
              >
                {ledgers.map((ledger) => (
                  <option key={ledger.id} value={ledger.id}>
                    {ledger.name} ({ledger.currency})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={LABEL}>{t('depder.toLedger')}</label>
              <select
                value={toId}
                onChange={(e) => setToId(e.target.value)}
                className={`${INPUT} cursor-pointer font-medium text-gray-800`}
              >
                {ledgers.map((ledger) => (
                  <option key={ledger.id} value={ledger.id}>
                    {ledger.name} ({ledger.currency})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={LABEL}>
                {t('depder.amountLabel')} {from ? `(${from.currency})` : ''} *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className={`${INPUT} font-mono font-bold text-gray-800`}
              />
            </div>

            <div>
              <label className={LABEL}>{t('depder.dateLabel')}</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={`${INPUT} font-medium text-gray-800`}
              />
            </div>
          </div>

          {crossCurrency && (
            <div className="text-xs font-semibold text-sky-700 bg-sky-50 border border-sky-100 rounded-xl px-3 py-2">
              {from?.currency} → {to?.currency} · {t('depder.rateNote')}
              <span className="font-mono font-bold ml-1">
                ≈ {formatMoney(received)} {to?.currency}
              </span>
            </div>
          )}

          <div>
            <label className={LABEL}>{t('depder.descLabel')}</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('depder.transferDescPh')}
              className={`${INPUT} font-medium text-gray-800`}
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
              {t('depder.transferSubmit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
