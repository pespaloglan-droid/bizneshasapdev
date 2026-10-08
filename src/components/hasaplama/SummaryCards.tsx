import React from 'react';
import {
  Coins,
  HandCoins,
  Package,
  PiggyBank,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import type { FlowTotals } from '../../utils/calcFlow';
import { formatMoney } from '../../utils/money';

interface SummaryCardsProps {
  totals: FlowTotals;
  receivableTotal: number;
  supplierDebtTotal: number;
  stockValue: number;
  ledgerTotal: number;
}

interface CardSpec {
  key: string;
  label: string;
  value: string;
  valueClass: string;
  icon: React.ReactNode;
  iconClass: string;
  /**
   * Häzirlikçe görkezilmeýär. Hasaplama kody saklanýar — diňe UI-dan
   * aýryldy, geljekde yzyna goşmak aňsat.
   */
  hidden?: boolean;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  totals,
  receivableTotal,
  supplierDebtTotal,
  stockValue,
  ledgerTotal,
}) => {
  const cards: CardSpec[] = [
    {
      key: 'income',
      label: 'Umumy girdeji',
      value: formatMoney(totals.income),
      valueClass: 'text-emerald-600',
      icon: <TrendingUp className="w-4 h-4" />,
      iconClass: 'bg-emerald-50 text-emerald-600',
    },
    {
      key: 'expense',
      label: 'Umumy çykdajy',
      value: formatMoney(totals.expense),
      valueClass: 'text-rose-600',
      icon: <TrendingDown className="w-4 h-4" />,
      iconClass: 'bg-rose-50 text-rose-600',
      hidden: true,
    },
    {
      key: 'net',
      label: 'Arassa peýda',
      value: formatMoney(totals.net),
      valueClass: totals.net >= 0 ? 'text-emerald-600' : 'text-rose-600',
      icon: <Coins className="w-4 h-4" />,
      iconClass:
        totals.net >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600',
      hidden: true,
    },
    {
      key: 'receivable',
      label: 'Müşderilerden alynmaly',
      value: formatMoney(receivableTotal),
      valueClass: 'text-amber-600',
      icon: <HandCoins className="w-4 h-4" />,
      iconClass: 'bg-amber-50 text-amber-600',
    },
    {
      key: 'supplier',
      label: 'Üpjün edijilere bergi',
      value: formatMoney(supplierDebtTotal),
      valueClass: 'text-rose-600',
      icon: <Wallet className="w-4 h-4" />,
      iconClass: 'bg-rose-50 text-rose-600',
      hidden: true,
    },
    {
      key: 'stock',
      label: 'Ambardaky harytlaryň bahasy',
      value: formatMoney(stockValue),
      valueClass: 'text-sky-600',
      icon: <Package className="w-4 h-4" />,
      iconClass: 'bg-sky-50 text-sky-600',
    },
    {
      key: 'ledger',
      label: 'Kassadaky / Depderdäki galyndy',
      value: formatMoney(ledgerTotal),
      valueClass: ledgerTotal >= 0 ? 'text-emerald-600' : 'text-rose-600',
      icon: <PiggyBank className="w-4 h-4" />,
      iconClass: 'bg-emerald-50 text-emerald-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards
        .filter((card) => !card.hidden)
        .map((card) => (
        <div key={card.key} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              {card.label}
            </span>
            <span
              className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 ${card.iconClass}`}
            >
              {card.icon}
            </span>
          </div>
          <div className={`text-base font-bold font-mono leading-tight ${card.valueClass}`}>
            {card.value} <span className="text-[10px] font-bold text-gray-400">TMT</span>
          </div>
        </div>
      ))}
    </div>
  );
};