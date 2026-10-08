import React, { useMemo, useState } from 'react';
import { AlertTriangle, ListChecks, Save, Search, X } from 'lucide-react';
import type { LanguageCode, Product } from '../../types';

interface ProductBulkEditModalProps {
  products: readonly Product[];
  language: LanguageCode;
  onClose: () => void;
  onSave: (updated: Product[]) => void;
}

type NumericKey = 'purchasePrice' | 'price' | 'stock' | 'criticalStock';

const numInput =
  'w-full h-8 px-2 text-right bg-[#F8FAFC] border rounded-lg text-[11px] font-mono font-bold outline-none focus:ring-1 focus:ring-emerald-500';
const textInput =
  'w-full h-8 px-2 bg-[#F8FAFC] border rounded-lg text-[11px] font-medium outline-none focus:ring-1 focus:ring-emerald-500';

export const ProductBulkEditModal: React.FC<ProductBulkEditModalProps> = ({
  products,
  language,
  onClose,
  onSave,
}) => {
  const isTm = language === 'tm';
  const [drafts, setDrafts] = useState<Product[]>(() => products.map((p) => ({ ...p })));
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const p of drafts) if (p.category.trim()) set.add(p.category.trim());
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'tr'));
  }, [drafts]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return drafts.filter((p) => {
      if (category && p.category !== category) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.barcode.toLowerCase().includes(q)
      );
    });
  }, [drafts, query, category]);

  const updateText = (id: string, key: 'name' | 'category', value: string) =>
    setDrafts((prev) => prev.map((p) => (p.id === id ? { ...p, [key]: value } : p)));

  const updateNum = (id: string, key: NumericKey, value: string) =>
    setDrafts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [key]: value === '' ? 0 : parseFloat(value) || 0 } : p))
    );

  const rowError = (p: Product): boolean =>
    p.price < 0 || (p.purchasePrice ?? 0) < 0 || !p.name.trim();

  const errorCount = drafts.filter(rowError).length;

  const changed = drafts.filter((draft) => {
    const original = products.find((p) => p.id === draft.id);
    if (!original) return false;
    return (
      original.name !== draft.name ||
      original.category !== draft.category ||
      (original.purchasePrice ?? 0) !== (draft.purchasePrice ?? 0) ||
      original.price !== draft.price ||
      original.stock !== draft.stock ||
      (original.criticalStock ?? 0) !== (draft.criticalStock ?? 0)
    );
  });

  const handleSave = () => {
    if (errorCount > 0 || changed.length === 0) return;
    onSave(changed);
  };

  return (
    <div className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl w-full max-w-6xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
        <div className="px-5 py-4 bg-gradient-to-r from-[#0B1F3A] to-[#163864] text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <ListChecks className="w-5 h-5" />
            <div>
              <h3 className="text-sm font-bold tracking-wide">
                {isTm ? 'Birbada Uýtgetmek — Harytlar' : 'Toplu Düzenleme — Ürünler'}
              </h3>
              <p className="text-[11px] text-gray-300">
                {changed.length} {isTm ? 'üýtgeşme taýýar' : 'değişiklik hazır'}
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

        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2 flex-wrap flex-shrink-0">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={isTm ? 'Haryt ady / barkod / SKU...' : 'Ürün adı / barkod / SKU...'}
              className="w-full h-9 pl-9 pr-3 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:border-emerald-500"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-9 px-3 bg-white border border-gray-200 rounded-xl text-xs outline-none cursor-pointer"
          >
            <option value="">{isTm ? 'Ähli kategoriýalar' : 'Tüm kategoriler'}</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <span className="text-[11px] font-bold text-gray-500 font-mono">
            {visible.length} / {drafts.length}
          </span>
        </div>

        <div className="overflow-auto flex-1">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-gray-50 z-10">
              <tr className="text-[10px] font-bold text-gray-500 uppercase border-b border-gray-200">
                <th className="py-2 px-3 min-w-[180px]">{isTm ? 'Haryt ady' : 'Ürün adı'}</th>
                <th className="py-2 px-3 min-w-[130px]">{isTm ? 'Kategoriýa' : 'Kategori'}</th>
                <th className="py-2 px-3 w-[110px] text-right">{isTm ? 'Alyş' : 'Alış'}</th>
                <th className="py-2 px-3 w-[110px] text-right">{isTm ? 'Satyş' : 'Satış'}</th>
                <th className="py-2 px-3 w-[100px] text-right">{isTm ? 'Stok' : 'Stok'}</th>
                <th className="py-2 px-3 w-[100px] text-right">{isTm ? 'Kritik' : 'Kritik'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {visible.map((p) => {
                const bad = rowError(p);
                return (
                  <tr key={p.id} className={bad ? 'bg-rose-50/40' : 'hover:bg-emerald-50/20'}>
                    <td className="py-1.5 px-3">
                      <input
                        type="text"
                        value={p.name}
                        onChange={(e) => updateText(p.id, 'name', e.target.value)}
                        className={`${textInput} ${bad && !p.name.trim() ? 'border-rose-400' : 'border-gray-200'}`}
                      />
                    </td>
                    <td className="py-1.5 px-3">
                      <input
                        type="text"
                        value={p.category}
                        onChange={(e) => updateText(p.id, 'category', e.target.value)}
                        className={`${textInput} border-gray-200`}
                      />
                    </td>
                    <td className="py-1.5 px-3">
                      <input
                        type="number"
                        step="0.01"
                        value={p.purchasePrice ?? 0}
                        onChange={(e) => updateNum(p.id, 'purchasePrice', e.target.value)}
                        className={`${numInput} ${(p.purchasePrice ?? 0) < 0 ? 'border-rose-400 text-rose-600' : 'border-gray-200'}`}
                      />
                    </td>
                    <td className="py-1.5 px-3">
                      <input
                        type="number"
                        step="0.01"
                        value={p.price}
                        onChange={(e) => updateNum(p.id, 'price', e.target.value)}
                        className={`${numInput} ${p.price < 0 ? 'border-rose-400 text-rose-600' : 'border-gray-200'}`}
                      />
                    </td>
                    <td className="py-1.5 px-3">
                      <input
                        type="number"
                        step="1"
                        value={p.stock}
                        onChange={(e) => updateNum(p.id, 'stock', e.target.value)}
                        className={`${numInput} border-gray-200`}
                      />
                    </td>
                    <td className="py-1.5 px-3">
                      <input
                        type="number"
                        step="1"
                        value={p.criticalStock ?? 0}
                        onChange={(e) => updateNum(p.id, 'criticalStock', e.target.value)}
                        className={`${numInput} border-gray-200`}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between gap-2 flex-shrink-0">
          <div className="text-[11px] font-bold">
            {errorCount > 0 ? (
              <span className="inline-flex items-center gap-1.5 text-rose-600">
                <AlertTriangle className="w-3.5 h-3.5" />
                {errorCount} {isTm ? 'hataly setir' : 'hatalı satır'} (at boş / baha minus)
              </span>
            ) : (
              <span className="text-gray-400">
                {isTm ? 'Bahalar minus bolmaly däl' : 'Fiyatlar negatif olamaz'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs"
            >
              {isTm ? 'Ýatyr' : 'İptal'}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={errorCount > 0 || changed.length === 0}
              className="h-9 px-5 rounded-xl bg-[#10b981] hover:bg-[#059669] disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              {isTm ? `Ýatda sakla (${changed.length})` : `Kaydet (${changed.length})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};