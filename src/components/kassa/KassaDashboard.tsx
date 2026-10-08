import React from 'react';
import { ArrowDownLeft, ArrowUpRight, CreditCard, Wallet } from 'lucide-react';
import type { LanguageCode, MoneyTransaction } from '../../types';
import { formatMoneyTmt, todayIsoDate } from '../../utils/money';

interface KassaDashboardProps {
  transactions: readonly MoneyTransaction[];
  language: LanguageCode;
}

interface MoneyTotals {
  balance: number;
  todayIncome: number;
  todayExpense: number;
  splitCash: number;
  splitCard: number;
}

function computeTotals(transactions: readonly MoneyTransaction[]): MoneyTotals {
  const today = todayIsoDate();
  let income = 0;
  let expense = 0;
  let todayIncome = 0;
  let todayExpense = 0;
  let todayCash = 0;
  let todayCard = 0;
  let allCash = 0;
  let allCard = 0;

  for (const tx of transactions) {
    const amount = Math.abs(tx.amount);
    const signed = tx.type === 'income' ? amount : -amount;
    const isToday = tx.date === today;

    if (tx.type === 'income') {
      income += amount;
      if (isToday) todayIncome += amount;
    } else {
      expense += amount;
      if (isToday) todayExpense += amount;
    }

    if (tx.paymentMethod === 'cash') {
      allCash += signed;
      if (isToday) todayCash += signed;
    } else {
      allCard += signed;
      if (isToday) todayCard += signed;
    }
  }

  const hasTodaySplit = todayCash !== 0 || todayCard !== 0;
  return {
    balance: income - expense,
    todayIncome,
    todayExpense,
    splitCash: hasTodaySplit ? todayCash : allCash,
    splitCard: hasTodaySplit ? todayCard : allCard,
  };
}

export const KassaDashboard: React.FC<KassaDashboardProps> = ({ transactions, language }) => {
  const totals = computeTotals(transactions);
  const todayLabel = language === 'tm' ? 'Şu gün' : 'Bugün';

  const cards = [
    {
      key: 'balance',
      label: 'Kassadaky galyndy',
      value: formatMoneyTmt(totals.balance),
      valueClass: totals.balance >= 0 ? 'text-emerald-600' : 'text-rose-600',
      icon: <Wallet className="w-4 h-4" />,
      iconClass: 'bg-emerald-50 text-emerald-600',
    },
    {
      key: 'income',
      label: 'Şu günki giriş',
      value: `+${formatMoneyTmt(totals.todayIncome)}`,
      valueClass: 'text-emerald-600',
      icon: <ArrowDownLeft className="w-4 h-4" />,
      iconClass: 'bg-emerald-50 text-emerald-600',
    },
    {
      key: 'expense',
      label: 'Şu günki çykyş',
      value: `−${formatMoneyTmt(totals.todayExpense)}`,
      valueClass: 'text-rose-600',
      icon: <ArrowUpRight className="w-4 h-4" />,
      iconClass: 'bg-rose-50 text-rose-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => (
        <div key={card.key} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              {card.label}
            </span>
            <span className={`w-8 h-8 rounded-xl flex items-center justify-center ${card.iconClass}`}>
              {card.icon}
            </span>
          </div>
          <div className={`text-lg font-bold font-mono ${card.valueClass}`}>{card.value}</div>
        </div>
      ))}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            {todayLabel}
          </span>
          <span className="w-8 h-8 rounded-xl flex items-center justify-center bg-sky-50 text-sky-600">
            <CreditCard className="w-4 h-4" />
          </span>
        </div>
        <div className="space-y-0.5 text-xs font-mono">
          <div className="flex items-center justify-between">
            <span className="text-gray-500 font-sans font-semibold">Nagt:</span>
            <span className="font-bold text-gray-800">{formatMoneyTmt(totals.splitCash)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500 font-sans font-semibold">Kart/Geçirme:</span>
            <span className="font-bold text-gray-800">{formatMoneyTmt(totals.splitCard)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
