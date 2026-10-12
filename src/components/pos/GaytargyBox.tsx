import React from 'react';
import { HandCoins } from 'lucide-react';
import type { LanguageCode } from '../../types';
import { useT } from '../../locales/LanguageContext';

interface GaytargyBoxProps {
  /** Alnan nagt − tölemek üçin (otomatik, diňe okalýar). */
  change: number;
  currencyCode: string;
  language: LanguageCode;
}

/**
 * "Gaytargy" (para üstü) görkezijisi — diňe okalýar.
 * Bahasy: Alnan Nagt − Tölemek üçin; 0-dan kiçi bolsa 0 görkezilýär.
 */
export const GaytargyBox: React.FC<GaytargyBoxProps> = ({ change, currencyCode }) => {
  const t = useT();
  const hasChange = change > 0;
  return (
    <div
      className={`w-full h-8 rounded-lg border flex items-center justify-between px-2.5 transition-colors ${
        hasChange ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200 bg-[#F8FAFC]'
      }`}
      title={t('pos.changeTip')}
    >
      <span className="flex items-center gap-1.5 min-w-0">
        <HandCoins className={`w-3.5 h-3.5 flex-shrink-0 ${hasChange ? 'text-emerald-600' : 'text-gray-400'}`} />
        <span className={`text-[11px] font-bold truncate ${hasChange ? 'text-emerald-700' : 'text-gray-500'}`}>
          {t('pos.changeLabel')}
        </span>
      </span>
      <span className="flex items-baseline gap-1 flex-shrink-0">
        <span className={`font-mono font-black text-sm ${hasChange ? 'text-emerald-700' : 'text-gray-400'}`}>
          {change.toFixed(2)}
        </span>
        <span className={`text-[10px] font-bold ${hasChange ? 'text-emerald-600' : 'text-gray-400'}`}>
          {currencyCode}
        </span>
      </span>
    </div>
  );
};