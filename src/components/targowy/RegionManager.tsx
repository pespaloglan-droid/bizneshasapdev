import React, { useState } from 'react';
import { MapPin, Pencil, Plus, Trash2, Users } from 'lucide-react';
import type { InvoiceRecord, LanguageCode, Targow, TargowRegion } from '../../types';
import { currentWindow, generateRegionId, targowsOnRegion } from '../../db/targowService';
import { formatMoney } from '../../utils/money';
import { useT } from '../../locales/LanguageContext';

interface RegionManagerProps {
  regions: readonly TargowRegion[];
  targows: readonly Targow[];
  invoices: readonly InvoiceRecord[];
  language: LanguageCode;
  onSaveRegion: (region: TargowRegion) => void;
  onDeleteRegion: (region: TargowRegion) => void;
}

function regionSales(
  invoices: readonly InvoiceRecord[],
  regionId: string,
  from: Date,
  to: Date
): number {
  return invoices
    .filter((invoice) => invoice.regionId === regionId && invoice.status !== 'voided')
    .filter((invoice) => {
      const date = new Date(invoice.createdAt);
      return date >= from && date <= to;
    })
    .reduce((sum, invoice) => sum + invoice.amountDue, 0);
}

export const RegionManager: React.FC<RegionManagerProps> = ({
  regions,
  targows,
  invoices,
  language,
  onSaveRegion,
  onDeleteRegion,
}) => {
  const t = useT();
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [error, setError] = useState('');

  const todayWindow = currentWindow('today');
  const monthWindow = currentWindow('month');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    if (regions.some((region) => region.name.trim().toLowerCase() === trimmed.toLowerCase())) {
      setError(t('targowy.regionExists'));
      return;
    }
    onSaveRegion({ id: generateRegionId(), name: trimmed, createdAt: new Date().toISOString() });
    setName('');
    setError('');
  };

  const commitEdit = (region: TargowRegion) => {
    const trimmed = editingName.trim();
    if (trimmed) {
      onSaveRegion({ ...region, name: trimmed });
    }
    setEditingId(null);
    setEditingName('');
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="px-6 pb-3 flex-shrink-0">
        <form
          onSubmit={handleAdd}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 flex items-center gap-3"
        >
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('targowy.newRegionPh')}
              className="w-full pl-9 pr-4 h-10 bg-[#F8FAFC] border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <button
            type="submit"
            className="h-10 px-5 bg-[#10b981] hover:bg-[#059669] text-white font-bold text-sm rounded-xl flex items-center gap-2 transition-colors shadow-sm flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            {t('targowy.addRegion')}
          </button>
        </form>
        {error && (
          <div className="mt-2 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
            {error}
          </div>
        )}
      </div>

      <div className="px-3 md:px-6">
        {regions.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="bg-white border border-gray-200 rounded-3xl p-10 flex flex-col items-center shadow-sm max-w-sm text-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                <MapPin className="w-8 h-8 text-gray-300" />
              </div>
              <p className="font-bold text-gray-500 text-sm">
                {t('targowy.noRegions')}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {regions.map((region) => (
              <div
                key={region.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  {editingId === region.id ? (
                    <input
                      type="text"
                      value={editingName}
                      autoFocus
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitEdit(region);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      className="flex-1 h-8 px-2 border border-emerald-300 rounded-lg text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  ) : (
                    <div className="font-bold text-gray-900 text-sm leading-tight">{region.name}</div>
                  )}
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-sky-50 text-sky-700 text-[10px] font-bold flex-shrink-0">
                    <Users className="w-3 h-3" />
                    {targowsOnRegion(targows, region.id)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      {t('targowy.today')}
                    </div>
                    <div className="text-xs font-mono font-bold text-emerald-600">
                      {formatMoney(
                        regionSales(invoices, region.id, todayWindow.from, todayWindow.to)
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      {t('targowy.thisMonth')}
                    </div>
                    <div className="text-xs font-mono font-bold text-gray-800">
                      {formatMoney(
                        regionSales(invoices, region.id, monthWindow.from, monthWindow.to)
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-gray-50">
                  {editingId === region.id ? (
                    <button
                      type="button"
                      onClick={() => commitEdit(region)}
                      className="flex-1 h-8 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[11px]"
                    >
                      Ýatda sakla
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(region.id);
                        setEditingName(region.name);
                      }}
                      className="flex-1 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-[11px] flex items-center justify-center gap-1.5"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Redaktirle
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onDeleteRegion(region)}
                    className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-rose-500 hover:text-white text-gray-500 transition-colors"
                    title="Pozmak"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
