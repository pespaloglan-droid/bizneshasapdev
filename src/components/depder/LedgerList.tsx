import React from 'react';
import { BookOpen, Plus, Wallet } from 'lucide-react';
import type { CurrencyRate, LanguageCode, Ledger, MoneyTransaction } from '../../types';
import { convertToTmt, rateForCode } from '../../db/currencyService';
import { assignedUserCount, computeLedgerBalance } from '../../db/ledgerService';
import { formatMoney } from '../../utils/money';
import { LedgerCard } from './LedgerCard';
import { useT } from '../../locales/LanguageContext';

interface LedgerListProps {
  ledgers: readonly Ledger[];
  transactions: readonly MoneyTransaction[];
  currencies: readonly CurrencyRate[];
  language: LanguageCode;
  canManage: boolean;
  onOpen: (ledger: Ledger) => void;
  onEdit: (ledger: Ledger) => void;
  onDelete: (ledger: Ledger) => void;
  onAdd: () => void;
  onTransfer: () => void;
}

export const LedgerList: React.FC<LedgerListProps> = ({
  ledgers,
  transactions,
  currencies,
  language,
  canManage,
  onOpen,
  onEdit,
  onDelete,
  onAdd,
  onTransfer,
}) => {
  const t = useT();
  const grandTotalTmt = ledgers.reduce(
    (sum, ledger) =>
      sum + convertToTmt(computeLedgerBalance(ledger, transactions), rateForCode(currencies, ledger.currency)),
    0
  );

  return (
    <div className="flex-1 flex flex-col bg-[#F1F5F9] overflow-hidden">
      <div className="px-6 pt-5 pb-3 flex-shrink-0 space-y-3">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-4 lg:col-span-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <Wallet className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex-1">
              <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                {t('depder.grandTotal')}
              </div>
              <div className="text-lg font-bold font-mono text-emerald-600">
                {formatMoney(grandTotalTmt)}
              </div>
            </div>
            <div className="text-[11px] font-bold text-gray-400">
              {ledgers.length} {t('depder.ledgersUnit')}
            </div>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={onTransfer}
              disabled={ledgers.length < 2}
              className="h-10 px-4 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700 font-bold text-xs transition-colors"
            >
              {t('depder.transferBtn')}
            </button>
            {canManage && (
              <button
                type="button"
                onClick={onAdd}
                className="h-10 px-5 bg-[#10b981] hover:bg-[#059669] text-white font-bold text-sm rounded-xl flex items-center gap-2 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                {t('depder.newLedger')}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6 min-h-0">
        {ledgers.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="bg-white border border-gray-200 rounded-3xl p-10 flex flex-col items-center shadow-sm max-w-sm text-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-gray-300" />
              </div>
              <p className="font-bold text-gray-500 text-sm">
                {t('depder.noLedgers')}
              </p>
              <p className="text-xs text-gray-400">
                {t('depder.noLedgersHint')}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {ledgers.map((ledger) => (
              <LedgerCard
                key={ledger.id}
                ledger={ledger}
                balance={computeLedgerBalance(ledger, transactions)}
                assignedCount={assignedUserCount(ledger)}
                language={language}
                onOpen={() => onOpen(ledger)}
                onEdit={() => onEdit(ledger)}
                onDelete={() => onDelete(ledger)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
