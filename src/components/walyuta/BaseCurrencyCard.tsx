import React from 'react';
import { Check, Landmark } from 'lucide-react';
import type { CurrencyRate, LanguageCode } from '../../types';

interface BaseCurrencyCardProps {
  language: LanguageCode;
  /** Kullanıcının seçebileceği tüm walyutalar (taban olan dahil). */
  currencies: readonly CurrencyRate[];
  baseCode: string;
  /** "Sabit walyutany saýla" düğmesine basıldığında (onay penceresi açılır). */
  onPickBase: () => void;
}

export const BaseCurrencyCard: React.FC<BaseCurrencyCardProps> = ({
  language,
  currencies,
  baseCode,
  onPickBase,
}) => {
  const current = currencies.find((c) => c.code === baseCode);
  const name = current?.name ?? baseCode;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-emerald-200 p-4 flex items-center gap-3 sm:gap-4 flex-wrap">
      <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
        <Landmark className="w-5 h-5 text-emerald-600" />
      </div>

      <div className="flex-1 min-w-[140px]">
        <div className="text-sm font-bold text-gray-900 truncate">
          {language === 'tm' ? 'Esas walýuta' : 'Esas para birimi'}: {baseCode}
        </div>
        <div className="text-[11px] text-gray-500 font-medium mt-0.5 truncate">
          {name} · {language === 'tm'
            ? 'fiyat, fatura we hasabatlarda ulanylýar'
            : 'fiyat, fatura ve raporlarda kullanılır'}
        </div>
      </div>

      <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider flex-shrink-0 flex items-center gap-1">
        <Check className="w-3 h-3" />
        {language === 'tm' ? 'Sabit' : 'Sabit'}
      </span>

      <button
        type="button"
        onClick={onPickBase}
        className="h-9 px-4 rounded-xl bg-white border border-emerald-300 text-emerald-700 text-xs font-bold hover:bg-emerald-50 transition-colors flex-shrink-0"
      >
        {language === 'tm' ? 'Üýtget' : 'Değiştir'}
      </button>
    </div>
  );
};