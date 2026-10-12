import React from 'react';
import type { LanguageCode, MoneyTransaction } from '../../types';
import { categoryLabel } from '../../db/moneyService';
import { formatMoney } from '../../utils/money';
import { useT } from '../../locales/LanguageContext';

interface DeleteMoneyDialogProps {
  transaction: MoneyTransaction;
  language: LanguageCode;
  onCancel: () => void;
  onConfirm: () => void;
}

export const DeleteMoneyDialog: React.FC<DeleteMoneyDialogProps> = ({
  transaction,
  language,
  onCancel,
  onConfirm,
}) => {
  const t = useT();
  return (
  <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center space-y-4">
      <p className="font-bold text-gray-800 text-sm">
        {t('kassa.deleteMsg')}
      </p>
      <p className="text-xs text-gray-500 font-medium">
        {categoryLabel(transaction.category)} · {formatMoney(Math.abs(transaction.amount))}
      </p>
      <div className="flex gap-3 justify-center">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition-colors"
        >
          {t('cancel')}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="px-6 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs transition-colors"
        >
          {t('kassa.deleteTip')}
        </button>
      </div>
    </div>
  </div>
  );
};
