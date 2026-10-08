import React, { useState } from 'react';
import { Boxes, Gift, ListChecks, X } from 'lucide-react';
import type { Product } from '../../types';
import { ProductImage } from '../pos/ProductImage';
import { formatPromoMoney, productsInPromos, type PromoRecord } from '../../db/promoService';
import { PromoFormPanel } from './PromoFormPanel';
import { PromoListPanel } from './PromoListPanel';

interface PromoModalProps {
  promos: readonly PromoRecord[];
  products: readonly Product[];
  currencyCode: string;
  onSave: (promo: PromoRecord) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

type PromoTab = 'new' | 'list' | 'stock';

export const PromoModal: React.FC<PromoModalProps> = ({
  promos,
  products,
  currencyCode,
  onSave,
  onDelete,
  onClose,
}) => {
  const [tab, setTab] = useState<PromoTab>('new');
  const [editing, setEditing] = useState<PromoRecord | null>(null);

  const tabs: { id: PromoTab; label: string; icon: React.ReactNode }[] = [
    { id: 'new', label: editing ? 'Promo redaktirle' : 'Täze Promo', icon: <Gift className="w-4 h-4" /> },
    { id: 'list', label: `Işjeň Promolar (${promos.length})`, icon: <ListChecks className="w-4 h-4" /> },
    { id: 'stock', label: 'Stok ýagdaýy', icon: <Boxes className="w-4 h-4" /> },
  ];

  const usedProducts = productsInPromos(promos, products);

  const handleSave = (promo: PromoRecord) => {
    onSave(promo);
    setEditing(null);
    setTab('list');
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
        {/* Ýokarky setir */}
        <div className="px-5 py-4 bg-gradient-to-r from-[#0B1F3A] to-[#163864] text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-wide">PROMO ulgamy</h2>
              <p className="text-[11px] text-gray-300">
                Satuw + promo utgaşmasy, stok we kassa girdejisi · {currencyCode}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Bölümler */}
        <div className="px-5 pt-3 pb-2 flex items-center gap-1.5 bg-gray-50 border-b border-gray-100 flex-shrink-0">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (item.id === 'new' && tab !== 'new') setEditing(null);
                setTab(item.id);
              }}
              className={`h-9 px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                tab === item.id ? 'bg-[#10b981] text-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>

        {/* Mazmun */}
        <div className="p-5 overflow-y-auto flex-1">
          {tab === 'new' && (
            <PromoFormPanel
              products={products}
              currencyCode={currencyCode}
              editing={editing}
              onSave={handleSave}
              onCancel={() => {
                setEditing(null);
                setTab('list');
              }}
            />
          )}

          {tab === 'list' && (
            <PromoListPanel
              promos={promos}
              products={products}
              currencyCode={currencyCode}
              onEdit={(promo) => {
                setEditing(promo);
                setTab('new');
              }}
              onDelete={onDelete}
            />
          )}

          {tab === 'stock' &&
            (usedProducts.length === 0 ? (
              <div className="py-14 flex flex-col items-center justify-center text-gray-400">
                <Boxes className="w-10 h-10 text-gray-200 mb-2 stroke-1" />
                <span className="text-xs font-semibold text-gray-500">
                  Promolarda ýekeje haryt hem ulanylmady
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {usedProducts.map((product) => {
                  const negative = product.stock < 0;
                  const critical =
                    product.criticalStock !== undefined && product.stock <= product.criticalStock;
                  return (
                    <div
                      key={product.id}
                      className="rounded-2xl border border-gray-200 bg-white p-3 flex gap-3 shadow-xs"
                    >
                      <div className="w-12 h-12 rounded-xl border border-gray-100 bg-[#F8FAFC] flex items-center justify-center overflow-hidden flex-shrink-0">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain" />
                        ) : (
                          <ProductImage type={product.imageType} className="w-9 h-9" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-gray-800 truncate">{product.name}</div>
                        <div className="text-[10px] text-gray-400 truncate">{product.category || '—'}</div>
                        <div className="flex items-center justify-between mt-1">
                          <span
                            className={`text-[11px] font-bold font-mono ${
                              negative ? 'text-rose-600' : critical ? 'text-amber-600' : 'text-emerald-600'
                            }`}
                          >
                            Stok: {product.stock}
                          </span>
                          <span className="text-[11px] font-mono text-gray-600">
                            {formatPromoMoney(product.price, currencyCode)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};