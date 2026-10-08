import React from 'react';
import { ArrowLeft, BookOpen, Plus } from 'lucide-react';
import type {
  AppUser,
  Customer,
  LanguageCode,
  Ledger,
  LedgerPermission,
  MoneyTransaction,
  MoneyTxType,
} from '../../types';
import { ledgerTransactions } from '../../db/ledgerService';
import { formatMoney } from '../../utils/money';
import { KassaTable } from '../kassa/KassaTable';

interface LedgerDetailProps {
  ledger: Ledger;
  transactions: readonly MoneyTransaction[];
  customers: readonly Customer[];
  appUsers: readonly AppUser[];
  language: LanguageCode;
  balance: number;
  permission: LedgerPermission;
  onBack: () => void;
  onNewTransaction: (type: MoneyTxType) => void;
  onEditTransaction: (transaction: MoneyTransaction) => void;
  onDeleteTransaction: (transaction: MoneyTransaction) => void;
}

export const LedgerDetail: React.FC<LedgerDetailProps> = ({
  ledger,
  transactions,
  customers,
  appUsers,
  language,
  balance,
  permission,
  onBack,
  onNewTransaction,
  onEditTransaction,
  onDeleteTransaction,
}) => {
  const rows = ledgerTransactions(ledger, transactions);

  return (
    <div className="flex-1 flex flex-col bg-[#F1F5F9] overflow-hidden">
      <div className="px-6 pt-5 pb-3 flex-shrink-0 space-y-3">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-4 flex-wrap">
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-[#0B1F3A] hover:text-white text-gray-500 transition-colors flex-shrink-0"
            title={language === 'tm' ? 'Yza' : 'Geri'}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-5 h-5 text-emerald-600" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-gray-900 truncate">{ledger.name}</div>
            <div className="text-[11px] text-gray-400 font-medium truncate">
              {ledger.description || (language === 'tm' ? 'Beýany ýok' : 'Açıklama yok')} ·{' '}
              {rows.length} {language === 'tm' ? 'hereket' : 'hareket'}
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              {language === 'tm' ? 'Häzirki galyndy' : 'Güncel bakiye'}
            </div>
            <div
              className={`font-mono font-bold text-lg ${
                balance >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {formatMoney(balance)}{' '}
              <span className="text-[11px] font-bold text-gray-400">{ledger.currency}</span>
            </div>
          </div>

          {(permission.canAddIncome || permission.canAddExpense) && (
            <div className="flex items-center gap-2">
              {permission.canAddIncome && (
                <button
                  type="button"
                  onClick={() => onNewTransaction('income')}
                  className="h-9 px-4 rounded-xl bg-[#10b981] hover:bg-[#059669] text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Girdeji
                </button>
              )}
              {permission.canAddExpense && (
                <button
                  type="button"
                  onClick={() => onNewTransaction('expense')}
                  className="h-9 px-4 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Çykdajy
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6 min-h-0">
        <KassaTable
          transactions={rows}
          customers={customers}
          appUsers={appUsers}
          language={language}
          onEdit={onEditTransaction}
          onDelete={onDeleteTransaction}
          canEdit={permission.canEdit}
          canDelete={permission.canDelete}
        />
      </div>
    </div>
  );
};
