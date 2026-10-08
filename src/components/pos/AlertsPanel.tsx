import React, { useEffect } from 'react';
import { AlertTriangle, HandCoins, Package, X } from 'lucide-react';
import type { InvoiceRecord, LanguageCode, Product } from '../../types';

export interface DueCreditRow {
  readonly invoice: InvoiceRecord;
  readonly remaining: number;
  readonly dueDate: string;
  readonly daysLeft: number;
}

interface AlertsPanelProps {
  language: LanguageCode;
  criticalStock: readonly Product[];
  dueCredits: readonly DueCreditRow[];
  onSelectProduct: (productId: string) => void;
  onSelectCustomer: (customerId: string) => void;
  onClose: () => void;
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({
  language,
  criticalStock,
  dueCredits,
  onSelectProduct,
  onSelectCustomer,
  onClose,
}) => {
  const isTm = language === 'tm';
  const total = criticalStock.length + dueCredits.length;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const dueLabel = (daysLeft: number): string => {
    if (daysLeft < 0) return isTm ? `${Math.abs(daysLeft)} gün geçdi` : `${Math.abs(daysLeft)} gün gecikti`;
    if (daysLeft === 0) return isTm ? 'Şu gün' : 'Bugün';
    return isTm ? `${daysLeft} gün galdy` : `${daysLeft} gün kaldı`;
  };

  return (
    <>
      {/* Daşyna basylanda ýapylýan fon */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Panel — alt bar üstünde, ortada */}
      <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 w-[440px] max-w-[92vw] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150 select-none">
        {/* Başlyk */}
        <div className="px-4 py-3 bg-gradient-to-r from-[#0B1F3A] to-[#163864] text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-wide">
                {isTm ? 'Duýduryşlar' : 'Uyarılar'}
              </h3>
              <p className="text-[10px] text-gray-300">
                {total > 0
                  ? isTm
                    ? `${total} sany üns talap edýär`
                    : `${total} adet dikkat gerektiriyor`
                  : isTm
                  ? 'Ähli zat ýerinde'
                  : 'Her şey yolunda'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {total === 0 ? (
            <div className="py-12 px-4 flex flex-col items-center justify-center text-gray-400">
              <AlertTriangle className="w-10 h-10 text-gray-200 mb-2 stroke-1" />
              <span className="text-xs font-semibold text-gray-500">
                {isTm ? 'Häzirlikçe duýduryş ýok' : 'Şu anda uyarı yok'}
              </span>
              <p className="text-[11px] text-gray-400 mt-1 text-center">
                {isTm
                  ? 'Kritik stok ýa-da möhleti ýakynlaşan bergi ýok.'
                  : 'Kritik stok veya vadesi yaklaşan borç yok.'}
              </p>
            </div>
          ) : (
            <>
              {/* 1. Kritik stok */}
              <div className="border-b border-gray-100">
                <div className="px-4 py-2 bg-gray-50/80 flex items-center gap-2 border-b border-gray-100">
                  <Package className="w-3.5 h-3.5 text-amber-600" />
                  <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">
                    {isTm ? 'Stokdaky azalan harytlar' : 'Stoğu azalan ürünler'}
                  </span>
                  <span className="ml-auto text-[10px] font-bold font-mono bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                    {criticalStock.length}
                  </span>
                </div>
                {criticalStock.length === 0 ? (
                  <div className="px-4 py-3 text-[11px] text-gray-400">
                    {isTm ? 'Kritik stok ýok' : 'Kritik stok yok'}
                  </div>
                ) : (
                  criticalStock.map((product) => {
                    const negative = product.stock < 0;
                    return (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => onSelectProduct(product.id)}
                        className="w-full px-4 py-2.5 text-left hover:bg-amber-50/60 transition-colors flex items-center gap-3 border-b border-gray-50 last:border-0"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-gray-900 truncate">
                            {product.name}
                          </div>
                          <div className="text-[10px] text-gray-400">
                            {isTm ? 'Kritik dereje' : 'Kritik seviye'}: {product.criticalStock ?? 0}
                          </div>
                        </div>
                        <span
                          className={`font-mono font-black text-sm flex-shrink-0 ${
                            negative ? 'text-rose-600' : 'text-amber-600'
                          }`}
                        >
                          {product.stock}
                        </span>
                        {negative && (
                          <span className="text-[9px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded flex-shrink-0">
                            {isTm ? 'MINUS' : 'EKSİ'}
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>

              {/* 2. Möhleti ýakynlaşan nesiýeler */}
              <div>
                <div className="px-4 py-2 bg-gray-50/80 flex items-center gap-2 border-b border-gray-100">
                  <HandCoins className="w-3.5 h-3.5 text-rose-600" />
                  <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">
                    {isTm ? 'Töleg wagty ýakynlaşýan nesiýeler' : 'Vadesi yaklaşan veresiyeler'}
                  </span>
                  <span className="ml-auto text-[10px] font-bold font-mono bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded">
                    {dueCredits.length}
                  </span>
                </div>
                {dueCredits.length === 0 ? (
                  <div className="px-4 py-3 text-[11px] text-gray-400">
                    {isTm ? 'Möhleti ýakyn bergi ýok' : 'Vadesi yakın borç yok'}
                  </div>
                ) : (
                  dueCredits.map((row) => {
                    const overdue = row.daysLeft < 0;
                    const today = row.daysLeft === 0;
                    return (
                      <button
                        key={row.invoice.id}
                        type="button"
                        onClick={() => {
                          if (row.invoice.customerId) onSelectCustomer(row.invoice.customerId);
                        }}
                        className={`w-full px-4 py-2.5 text-left hover:bg-rose-50/50 transition-colors flex items-center gap-3 border-b border-gray-50 last:border-0 ${
                          overdue ? 'bg-rose-50/40' : ''
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-xs font-bold truncate ${
                                overdue ? 'text-rose-800' : 'text-gray-900'
                              }`}
                            >
                              {row.invoice.customerName}
                            </span>
                            {overdue && (
                              <span className="text-[9px] font-bold text-white bg-rose-700 px-1.5 py-0.5 rounded flex-shrink-0">
                                {isTm ? 'MÖHLETI GEÇDI' : 'VADESİ GEÇTİ'}
                              </span>
                            )}
                            {today && (
                              <span className="text-[9px] font-bold text-white bg-rose-500 px-1.5 py-0.5 rounded flex-shrink-0">
                                {isTm ? 'ŞU GÜN' : 'BUGÜN'}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                            {row.dueDate} · {dueLabel(row.daysLeft)}
                          </div>
                        </div>
                        <span
                          className={`font-mono font-black text-sm flex-shrink-0 ${
                            overdue ? 'text-rose-700' : 'text-rose-600'
                          }`}
                        >
                          {row.remaining.toFixed(2)} TMT
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};