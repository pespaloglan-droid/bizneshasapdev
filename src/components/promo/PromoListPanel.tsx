import React from 'react';
import { Pencil, Trash2, Gift } from 'lucide-react';
import type { Product } from '../../types';
import {
  calcPromo,
  formatPromoMoney,
  productById,
  type PromoRecord,
} from '../../db/promoService';
import { useT } from '../../locales/LanguageContext';

interface PromoListPanelProps {
  promos: readonly PromoRecord[];
  products: readonly Product[];
  currencyCode: string;
  onEdit: (promo: PromoRecord) => void;
  onDelete: (id: string) => void;
}

export const PromoListPanel: React.FC<PromoListPanelProps> = ({
  promos,
  products,
  currencyCode,
  onEdit,
  onDelete,
}) => {
  const t = useT();

  /** db'deki tm etiket fonksiyonu yerine çeviri bazlı etiket. */
  const discountLabel = (promo: PromoRecord): string => {
    if (promo.discountMode === 'free') return t('promo.modeFree');
    if (promo.discountMode === 'percent') return t('promo.modePercentLabel', { pct: promo.percent || 0 });
    return t('promo.modeFixedLabel', { amount: formatPromoMoney(promo.fixed || 0, currencyCode) });
  };

  if (promos.length === 0) {
    return (
      <div className="py-14 flex flex-col items-center justify-center text-gray-400">
        <Gift className="w-10 h-10 text-gray-200 mb-2 stroke-1" />
        <span className="text-xs font-semibold text-gray-500">{t('promo.listEmpty')}</span>
        <p className="text-[11px] text-gray-400 mt-1">{t('promo.listEmptyHint')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {promos.map((promo) => {
        const calc = calcPromo(promo, products);
        const sale = productById(products, promo.saleProductId);
        const promoProduct = productById(products, promo.promoProductId);
        return (
          <div
            key={promo.id}
            className="rounded-2xl border border-gray-200 bg-white p-3 flex items-center gap-3 shadow-xs"
          >
            <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="min-w-0">
                <div className="text-[10px] font-bold text-blue-500 uppercase">{t('promo.saleLabel')}</div>
                <div className="text-xs font-bold text-gray-800 truncate">
                  {promo.saleQty}x {sale?.name ?? '—'}
                </div>
                <div className="font-mono text-[11px] text-gray-500">
                  {formatPromoMoney(calc.saleTotal, currencyCode)}
                </div>
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-bold text-emerald-600 uppercase">{t('promo.promoLabel')}</div>
                <div className="text-xs font-bold text-gray-800 truncate">
                  {promo.promoQty}x {promoProduct?.name ?? '—'}
                </div>
                <div className="font-mono text-[11px] text-gray-500">
                  {discountLabel(promo)}
                </div>
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-bold text-violet-600 uppercase">{t('promo.kassaIncome')}</div>
                <div className="font-mono font-black text-violet-700">
                  {formatPromoMoney(calc.kasaIncome, currencyCode)}
                </div>
                <div className="text-[10px] text-gray-400">
                  {t('promo.discountWord')} {formatPromoMoney(calc.discount, currencyCode)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                type="button"
                onClick={() => onEdit(promo)}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-[#0B1F3A] hover:text-white text-gray-500 transition-colors"
                title={t('promo.editTip')}
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(promo.id)}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-rose-500 hover:text-white text-gray-500 transition-colors"
                title={t('promo.deleteTip')}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};