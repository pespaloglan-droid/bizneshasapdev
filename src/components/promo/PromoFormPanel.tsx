import React, { useMemo, useState } from 'react';
import { Banknote, Gift, Percent, Save, ShoppingCart, X, Search } from 'lucide-react';
import type { Product } from '../../types';
import { ProductImage } from '../pos/ProductImage';
import {
  calcPromo,
  emptyPromo,
  formatPromoMoney,
  newPromoId,
  productById,
  type PromoDiscountMode,
  type PromoRecord,
} from '../../db/promoService';
import { ProductPickerModal } from './ProductPickerModal';

interface PromoFormPanelProps {
  products: readonly Product[];
  currencyCode: string;
  editing: PromoRecord | null;
  onSave: (promo: PromoRecord) => void;
  onCancel: () => void;
}

const MODES: { id: PromoDiscountMode; label: string; icon: React.ReactNode }[] = [
  { id: 'free', label: 'Mugt', icon: <Gift className="w-3.5 h-3.5" /> },
  { id: 'percent', label: 'Göterim %', icon: <Percent className="w-3.5 h-3.5" /> },
  { id: 'fixed', label: 'Sabit baha', icon: <Banknote className="w-3.5 h-3.5" /> },
];

const inputCls =
  'w-full h-9 px-2 rounded-xl border text-sm bg-white/90 focus:ring-2 outline-none font-medium text-gray-800';

/** Saýlanan harydyň görnüşi + ähli maglumaty bilen jemleýji kart. */
const SelectedProductCard: React.FC<{
  product: Product | undefined;
  currencyCode: string;
  tone: 'blue' | 'green';
  onClear: () => void;
}> = ({ product, currencyCode, tone, onClear }) => {
  if (!product) {
    return (
      <div className="rounded-xl bg-white/15 px-3 py-4 text-center text-xs font-bold opacity-80">
        Häzir haryt saýlanmady
      </div>
    );
  }
  const negative = product.stock < 0;
  return (
    <div className="relative rounded-xl bg-white/95 text-gray-800 p-2.5 flex gap-3">
      <button
        type="button"
        onClick={onClear}
        title="Saýlamany aýyr"
        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-lg bg-gray-100 hover:bg-rose-500 hover:text-white text-gray-500 flex items-center justify-center transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
      <div className="w-14 h-14 rounded-xl border border-gray-100 bg-[#F8FAFC] flex items-center justify-center overflow-hidden flex-shrink-0">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain" />
        ) : (
          <ProductImage type={product.imageType} className="w-11 h-11" />
        )}
      </div>
      <div className="min-w-0 flex-1 pr-6">
        <div className="text-xs font-bold truncate">{product.name}</div>
        <div className="text-[10px] text-gray-400 truncate">{product.category || '—'}</div>
        <div className="flex items-center justify-between mt-1 gap-1">
          <span className={`text-[11px] font-bold font-mono ${negative ? 'text-rose-600' : 'text-gray-600'}`}>
            Stok: {product.stock}
          </span>
          <span className={`text-[12px] font-black font-mono ${tone === 'blue' ? 'text-blue-700' : 'text-emerald-700'}`}>
            {formatPromoMoney(product.price, currencyCode)}
          </span>
        </div>
        {(product.sku || product.barcode) && (
          <div className="text-[9px] text-gray-400 font-mono truncate mt-0.5">
            {product.sku ? `SKU: ${product.sku}` : `Barkod: ${product.barcode}`}
          </div>
        )}
      </div>
    </div>
  );
};

export const PromoFormPanel: React.FC<PromoFormPanelProps> = ({
  products,
  currencyCode,
  editing,
  onSave,
  onCancel,
}) => {
  const [form, setForm] = useState<PromoRecord>(() => editing ?? emptyPromo());
  const [picker, setPicker] = useState<'sale' | 'promo' | null>(null);
  const patch = (partial: Partial<PromoRecord>) => setForm((prev) => ({ ...prev, ...partial }));

  const calc = useMemo(() => calcPromo(form, products), [form, products]);
  const saleProduct = productById(products, form.saleProductId);
  const promoProduct = productById(products, form.promoProductId);

  const insufficient =
    (saleProduct ? form.saleQty > saleProduct.stock : false) ||
    (promoProduct ? form.promoQty > promoProduct.stock : false);
  const canSave =
    !!saleProduct && !!promoProduct && form.saleQty > 0 && form.promoQty > 0 && !insufficient;

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      ...form,
      id: form.id || newPromoId(),
      createdAt: form.createdAt || new Date().toISOString(),
    });
  };

  if (products.length === 0) {
    return (
      <div className="py-12 text-center text-xs font-semibold text-gray-400">
        Haryt modulynda haryt ýok. Ilki Haryt goşuň.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* SOL — SATUW (mavi) */}
        <div className="rounded-2xl p-4 bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-xl bg-white/20">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm">Satyn alynjak haryt</span>
          </div>

          <button
            type="button"
            onClick={() => setPicker('sale')}
            className="w-full h-9 mb-2 rounded-xl bg-white/90 hover:bg-white text-gray-800 text-xs font-bold flex items-center justify-center gap-1.5"
          >
            <Search className="w-3.5 h-3.5" />
            Haryt saýla
          </button>
          <SelectedProductCard
            product={saleProduct}
            currencyCode={currencyCode}
            tone="blue"
            onClear={() => patch({ saleProductId: '' })}
          />

          <label className="block text-[11px] font-bold text-blue-100 mt-3 mb-1">Sany</label>
          <input
            type="number"
            min={0}
            value={form.saleQty === 0 ? '' : form.saleQty}
            onChange={(e) =>
              patch({ saleQty: e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value) || 0) })
            }
            placeholder="0"
            className={`${inputCls} border-blue-300 mb-2`}
          />

          <div className="flex items-center justify-between bg-white/15 rounded-xl px-3 py-2">
            <span className="text-xs font-bold">Jemi</span>
            <span className="font-mono font-black text-lg">{formatPromoMoney(calc.saleTotal, currencyCode)}</span>
          </div>
        </div>

        {/* SAĞ — PROMO (ýaşyl) */}
        <div className="rounded-2xl p-4 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-xl bg-white/20">
              <Gift className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm">Promo haryt</span>
          </div>

          <button
            type="button"
            onClick={() => setPicker('promo')}
            className="w-full h-9 mb-2 rounded-xl bg-white/90 hover:bg-white text-gray-800 text-xs font-bold flex items-center justify-center gap-1.5"
          >
            <Search className="w-3.5 h-3.5" />
            Promo haryt saýla
          </button>
          <SelectedProductCard
            product={promoProduct}
            currencyCode={currencyCode}
            tone="green"
            onClear={() => patch({ promoProductId: '' })}
          />

          <label className="block text-[11px] font-bold text-emerald-50 mt-3 mb-1">Promo sany</label>
          <input
            type="number"
            min={0}
            value={form.promoQty === 0 ? '' : form.promoQty}
            onChange={(e) =>
              patch({ promoQty: e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value) || 0) })
            }
            placeholder="0"
            className={`${inputCls} border-emerald-300 mb-2`}
          />

          <div className="flex items-center gap-1.5 mb-2">
            {MODES.map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => patch({ discountMode: mode.id })}
                className={`flex-1 h-8 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-all ${
                  form.discountMode === mode.id
                    ? 'bg-white text-emerald-700 shadow'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {mode.icon}
                {mode.label}
              </button>
            ))}
          </div>

          {form.discountMode === 'percent' && (
            <input
              type="number"
              min={0}
              max={100}
              value={form.percent}
              onChange={(e) => patch({ percent: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) })}
              placeholder="meselem: 50"
              className={`${inputCls} border-emerald-300 mb-2`}
            />
          )}
          {form.discountMode === 'fixed' && (
            <input
              type="number"
              min={0}
              value={form.fixed}
              onChange={(e) => patch({ fixed: Math.max(0, parseFloat(e.target.value) || 0) })}
              placeholder="meselem: 500"
              className={`${inputCls} border-emerald-300 mb-2`}
            />
          )}

          <div className="flex items-center justify-between bg-white/15 rounded-xl px-3 py-2">
            <span className="text-xs font-bold">Promo ýeňillik</span>
            <span className="font-mono font-black text-lg">−{formatPromoMoney(calc.discount, currencyCode)}</span>
          </div>
        </div>
      </div>

      {/* JEMLEÝJI */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
          <div className="rounded-xl bg-blue-50 border border-blue-100 px-3 py-2">
            <div className="text-[10px] font-bold text-blue-500 uppercase">Satuw</div>
            <div className="font-mono font-black text-blue-700 truncate">
              {form.saleQty}x {saleProduct?.name ?? '—'} = {formatPromoMoney(calc.saleTotal, currencyCode)}
            </div>
          </div>
          <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2">
            <div className="text-[10px] font-bold text-emerald-600 uppercase">Promo</div>
            <div className="font-mono font-black text-emerald-700 truncate">
              {form.promoQty}x {promoProduct?.name ?? '—'} = {formatPromoMoney(calc.discount, currencyCode)} ýeňillik
            </div>
          </div>
          <div className="rounded-xl bg-violet-50 border border-violet-100 px-3 py-2">
            <div className="text-[10px] font-bold text-violet-600 uppercase">Kassa girdejisi</div>
            <div className="font-mono font-black text-violet-700">
              {formatPromoMoney(calc.kasaIncome, currencyCode)}
            </div>
          </div>
        </div>
        <div className="text-[11px] text-gray-500 mt-2 text-center">
          Jemi {formatPromoMoney(calc.total, currencyCode)} − ýeňillik{' '}
          {formatPromoMoney(calc.discount, currencyCode)} ={' '}
          <span className="font-bold text-gray-800">{formatPromoMoney(calc.kasaIncome, currencyCode)}</span>
        </div>
      </div>

      {insufficient && (
        <div className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
          Stok ýeterlik däl!
        </div>
      )}

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="h-9 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs flex items-center gap-1.5"
        >
          <X className="w-3.5 h-3.5" />
          Ýatyr
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          className="h-9 px-5 rounded-xl bg-[#10b981] hover:bg-[#059669] disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1.5"
        >
          <Save className="w-3.5 h-3.5" />
          {editing ? 'Täzele' : 'Promo döret'}
        </button>
      </div>

      {picker && (
        <ProductPickerModal
          products={products}
          currencyCode={currencyCode}
          title={picker === 'sale' ? 'Satyn alynjak harydy saýla' : 'Promo harydy saýla'}
          accent={picker === 'sale' ? 'blue' : 'green'}
          selectedId={picker === 'sale' ? form.saleProductId : form.promoProductId}
          onSelect={(product) => {
            if (picker === 'sale') patch({ saleProductId: product.id });
            else patch({ promoProductId: product.id });
            setPicker(null);
          }}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  );
};