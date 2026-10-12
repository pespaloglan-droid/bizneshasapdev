import React, { useState } from 'react';
import { Coins, Pencil, RefreshCw, Star, Trash2, X, Check } from 'lucide-react';
import type { CurrencyRate, LanguageCode } from '../../types';
import { formatRate } from '../../utils/money';
import { localeFor } from '../../utils/locale';
import { useT } from '../../locales/LanguageContext';

interface CurrencyTableProps {
  currencies: readonly CurrencyRate[];
  language: LanguageCode;
  /** Sabit walyuta kodu — satırda yıldızla işaretlenir, silinemez. */
  baseCode: string;
  onUpdateRate: (currency: CurrencyRate, rate: number) => void;
  onEdit: (currency: CurrencyRate) => void;
  onDelete: (currency: CurrencyRate) => void;
  onSetBase: (currency: CurrencyRate) => void;
}

const HEAD =
  'text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 select-none';

function formatUpdatedAt(iso: string, language: LanguageCode): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(localeFor(language), {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const CurrencyTable: React.FC<CurrencyTableProps> = ({
  currencies,
  language,
  baseCode,
  onUpdateRate,
  onEdit,
  onDelete,
  onSetBase,
}) => {
  const t = useT();
  const [editingRateId, setEditingRateId] = useState<string | null>(null);
  const [rateDraft, setRateDraft] = useState('');

  const startRateEdit = (currency: CurrencyRate) => {
    setEditingRateId(currency.id);
    setRateDraft(String(currency.rate));
  };

  const commitRateEdit = (currency: CurrencyRate) => {
    const parsed = Number(rateDraft);
    if (Number.isFinite(parsed) && parsed > 0) {
      onUpdateRate(currency, parsed);
    }
    setEditingRateId(null);
    setRateDraft('');
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className={HEAD}>
            <th className="py-3 px-4">{t('walyuta.colSymbol')}</th>
            <th className="py-3 px-4">Kod</th>
            <th className="py-3 px-4">Ady</th>
            <th className="py-3 px-4 text-right">
              {t('walyuta.colRate', { code: baseCode })}
            </th>
            <th className="py-3 px-4">
              {t('walyuta.colUpdated')}
            </th>
            <th className="py-3 px-4 text-center">Amal</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {currencies.length === 0 ? (
            <tr>
              <td colSpan={6} className="py-16 text-center text-gray-400">
                <div className="flex flex-col items-center gap-2">
                  <Coins className="w-10 h-10 text-gray-200" />
                  <span className="font-semibold text-gray-400 text-xs">
                    {t('walyuta.emptyCurrencies')}
                  </span>
                </div>
              </td>
            </tr>
          ) : (
            currencies.map((currency) => {
              const isBase = currency.code === baseCode;
              return (
              <tr key={currency.id} className={`transition-colors ${isBase ? 'bg-emerald-50/40' : 'hover:bg-gray-50/60'}`}>
                <td className="py-3 px-4">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[11px] font-bold text-emerald-700">
                    {currency.symbol || currency.code.slice(0, 2)}
                  </div>
                </td>

                <td className="py-3 px-4">
                  <span className="font-mono font-bold text-gray-900 text-sm">{currency.code}</span>
                  {isBase && (
                    <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500 text-white text-[9px] font-bold uppercase">
                      <Star className="w-2.5 h-2.5" />
                      {t('walyuta.baseBadge')}
                    </span>
                  )}
                </td>

                <td className="py-3 px-4 font-semibold text-gray-700">{currency.name}</td>

                <td className="py-3 px-4 text-right">
                  {editingRateId === currency.id ? (
                    <div className="flex items-center justify-end gap-1.5">
                      <input
                        type="number"
                        step="0.0001"
                        min="0"
                        value={rateDraft}
                        autoFocus
                        onChange={(e) => setRateDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitRateEdit(currency);
                          if (e.key === 'Escape') setEditingRateId(null);
                        }}
                        className="w-28 h-8 px-2 border border-emerald-300 rounded-lg text-sm font-mono text-right bg-white outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => commitRateEdit(currency)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingRateId(null)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : isBase ? (
                    <span className="font-mono font-bold text-sm text-emerald-700">1.0000</span>
                  ) : (
                    <span className="font-mono font-bold text-sm text-gray-900">
                      {formatRate(currency.rate)}
                    </span>
                  )}
                </td>

                <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                  {isBase
                    ? '—'
                    : formatUpdatedAt(currency.updatedAt, language)}
                </td>

                <td className="py-3 px-4">
                  <div className="flex items-center justify-center gap-2">
                    {!isBase && (
                      <button
                        type="button"
                        onClick={() => startRateEdit(currency)}
                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-emerald-500 hover:text-white text-gray-500 transition-colors"
                        title={t('walyuta.updateRate')}
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {!isBase && (
                      <button
                        type="button"
                        onClick={() => onSetBase(currency)}
                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-amber-500 hover:text-white text-gray-500 transition-colors"
                        title={t('walyuta.setBase')}
                      >
                        <Star className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onEdit(currency)}
                      className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-[#0B1F3A] hover:text-white text-gray-500 transition-colors"
                      title="Redaktirle"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(currency)}
                      disabled={isBase}
                      className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 text-gray-400 transition-colors enabled:hover:bg-rose-500 enabled:hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                      title={
                        isBase
                          ? t('walyuta.baseCannotDelete')
                          : t('walyuta.deleteLabel')
                      }
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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