import React from 'react';
import { ArrowRightLeft, BookOpen, Pencil, Trash2, Users } from 'lucide-react';
import type { LanguageCode, Ledger } from '../../types';
import { formatMoney } from '../../utils/money';

interface LedgerCardProps {
  ledger: Ledger;
  balance: number;
  assignedCount: number;
  language: LanguageCode;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const LedgerCard: React.FC<LedgerCardProps> = ({
  ledger,
  balance,
  assignedCount,
  language,
  onOpen,
  onEdit,
  onDelete,
}) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col gap-3 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between gap-2">
      <div className="flex items-start gap-3 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
          <BookOpen className="w-5 h-5 text-emerald-600" />
        </div>
        <div className="min-w-0">
          <div className="font-bold text-gray-900 text-sm leading-tight truncate">{ledger.name}</div>
          <div className="text-[11px] text-gray-400 font-medium truncate mt-0.5">
            {ledger.description || (language === 'tm' ? 'Beýany ýok' : 'Açıklama yok')}
          </div>
        </div>
      </div>

      <span
        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold flex-shrink-0 ${
          ledger.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
        }`}
      >
        {ledger.isActive ? 'Aktiw' : 'Passiw'}
      </span>
    </div>

    <div className="flex items-end justify-between">
      <div>
        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
          {language === 'tm' ? 'Häzirki galyndy' : 'Güncel bakiye'}
        </div>
        <div
          className={`font-mono font-bold text-lg leading-tight ${
            balance >= 0 ? 'text-emerald-600' : 'text-rose-600'
          }`}
        >
          {formatMoney(balance)}{' '}
          <span className="text-[11px] font-bold text-gray-400">{ledger.currency}</span>
        </div>
      </div>

      <div className="flex items-center gap-1 text-[11px] font-bold text-gray-500">
        <Users className="w-3.5 h-3.5 text-gray-400" />
        {assignedCount} {language === 'tm' ? 'ulanyjy' : 'kullanıcı'}
      </div>
    </div>

    <div className="flex items-center gap-2 pt-1 border-t border-gray-50">
      <button
        type="button"
        onClick={onOpen}
        className="flex-1 h-8 rounded-xl bg-[#10b981] hover:bg-[#059669] text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors"
      >
        <ArrowRightLeft className="w-3.5 h-3.5" />
        {language === 'tm' ? 'Aç' : 'Aç'}
      </button>
      <button
        type="button"
        onClick={onEdit}
        className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-[#0B1F3A] hover:text-white text-gray-500 transition-colors"
        title="Redaktirle"
      >
        <Pencil className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-rose-500 hover:text-white text-gray-500 transition-colors"
        title="Pozmak"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  </div>
);
