import React from 'react';
import { Pencil, Trash2, Wallet } from 'lucide-react';
import type { AppUser, Customer, LanguageCode, MoneyTransaction } from '../../types';
import { PAYMENT_METHOD_LABELS, SUB_CATEGORY_LABELS, categoryLabel } from '../../db/moneyService';
import { formatDate, formatMoneyTmt } from '../../utils/money';

interface KassaTableProps {
  transactions: readonly MoneyTransaction[];
  customers: readonly Customer[];
  appUsers: readonly AppUser[];
  language: LanguageCode;
  onEdit: (transaction: MoneyTransaction) => void;
  onDelete: (transaction: MoneyTransaction) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

const HEAD = 'text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 select-none';

function counterparty(
  transaction: MoneyTransaction,
  customers: readonly Customer[],
  appUsers: readonly AppUser[]
): string | null {
  if (transaction.customerId) {
    const customer = customers.find((c) => c.id === transaction.customerId);
    if (customer) return customer.name;
  }
  if (transaction.personName) return transaction.personName;
  if (transaction.staffUserId) {
    const staff = appUsers.find((u) => u.id === transaction.staffUserId);
    if (staff) return staff.fullName;
  }
  return null;
}

function transactionTime(createdAt: string): string {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

export const KassaTable: React.FC<KassaTableProps> = ({
  transactions,
  customers,
  appUsers,
  language,
  onEdit,
  onDelete,
  canEdit = true,
  canDelete = true,
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className={HEAD}>
            <th className="py-3 px-4">Sene / Wagt</th>
            <th className="py-3 px-4 text-center">Görnüşi</th>
            <th className="py-3 px-4">Kategoriýa</th>
            <th className="py-3 px-4">Müşderi / Üpjün ediji</th>
            <th className="py-3 px-4">Töleg görnüşi</th>
            <th className="py-3 px-4 text-right">Mukdar</th>
            <th className="py-3 px-4">Düşündiriş</th>
            <th className="py-3 px-4 text-center">Amal</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {transactions.length === 0 ? (
            <tr>
              <td colSpan={8} className="py-16 text-center text-gray-400">
                <div className="flex flex-col items-center gap-2">
                  <Wallet className="w-10 h-10 text-gray-200" />
                  <span className="font-semibold text-gray-400 text-xs">
                    {language === 'tm' ? 'Hereket tapylmady' : 'Hareket bulunamadı'}
                  </span>
                </div>
              </td>
            </tr>
          ) : (
            transactions.map((transaction) => {
              const isIncome = transaction.type === 'income';
              const partner = counterparty(transaction, customers, appUsers);
              return (
                <tr key={transaction.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="font-semibold text-gray-800">{formatDate(transaction.date)}</div>
                    <div className="text-[10px] text-gray-400 font-mono">
                      {transactionTime(transaction.createdAt)}
                    </div>
                  </td>

                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                        isIncome ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {isIncome ? '↑ Girdeji' : '↓ Çykdajy'}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-semibold text-gray-800">
                      {categoryLabel(transaction.category)}
                    </div>
                    {transaction.category === 'dukan_cykdajylary' && transaction.subCategory && (
                      <div className="text-[10px] text-gray-400 font-medium">
                        {SUB_CATEGORY_LABELS[transaction.subCategory]}
                      </div>
                    )}
                  </td>

                  <td className="py-3 px-4">
                    {partner ? (
                      <span className="text-gray-700 font-medium">{partner}</span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>

                  <td className="py-3 px-4">
                    <span className="inline-flex px-2 py-0.5 rounded-lg text-[10px] font-bold bg-gray-100 text-gray-600">
                      {PAYMENT_METHOD_LABELS[transaction.paymentMethod]}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <span
                      className={`font-mono font-bold text-sm ${
                        isIncome ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {isIncome ? '+' : '−'}
                      {formatMoneyTmt(Math.abs(transaction.amount))}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <span className="text-gray-500 line-clamp-1 max-w-[200px] inline-block">
                      {transaction.description || '—'}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-2">
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => onEdit(transaction)}
                          className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-[#0B1F3A] hover:text-white text-gray-500 transition-colors"
                          title="Redaktirle"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete(transaction)}
                          className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-rose-500 hover:text-white text-gray-500 transition-colors"
                          title="Pozmak"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {!canEdit && !canDelete && <span className="text-gray-300">—</span>}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};
