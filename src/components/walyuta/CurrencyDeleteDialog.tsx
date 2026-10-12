import React from 'react';
import type { CurrencyRate, LanguageCode } from '../../types';
import { formatRate } from '../../utils/money';
import { useT } from '../../locales/LanguageContext';

interface CurrencyDeleteDialogProps {
  currency: CurrencyRate;
  language: LanguageCode;
  /** Faturalarda geçiyor → silinemez. */
  isInUse: boolean;
  /** Sabit (taban) walyuta → silinemez. */
  isBase: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export const CurrencyDeleteDialog: React.FC<CurrencyDeleteDialogProps> = ({
  currency,
  language,
  isInUse,
  isBase,
  onCancel,
  onConfirm,
}) => {
  const t = useT();
  const blocked = isInUse || isBase;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center space-y-4">
        <p className="font-bold text-gray-800 text-sm">
          {t('walyuta.deleteConfirm', { code: currency.code })}
        </p>

        <p className="text-xs text-gray-500 font-medium">
          {currency.name} · 1 {currency.code} = {formatRate(currency.rate)}
        </p>

        {isBase && (
          <p className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
            {t('walyuta.deleteBaseBlocked')}
          </p>
        )}

        {isInUse && (
          <p className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
            {t('walyuta.deleteInUse')}
          </p>
        )}

        <div className="flex gap-3 justify-center">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition-colors"
          >
            Ýatyr
          </button>
          {!blocked && (
            <button
              type="button"
              onClick={onConfirm}
              className="px-6 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs transition-colors"
            >
              Pozmak
            </button>
          )}
        </div>
      </div>
    </div>
  );
};