import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { AppUser, LanguageCode, Targow, TargowRegion } from '../../types';
import { generateTargowId } from '../../db/targowService';

interface TargowFormModalProps {
  language: LanguageCode;
  targows: readonly Targow[];
  regions: readonly TargowRegion[];
  appUsers: readonly AppUser[];
  editingTargow: Targow | null;
  onSave: (targow: Targow) => void;
  onClose: () => void;
}

interface TargowFormState {
  fullName: string;
  phone: string;
  appUserId: string;
  regionIds: string[];
  commissionRate: string;
  monthlyTarget: string;
  isActive: boolean;
}

const INPUT =
  'w-full h-9 px-3 border border-gray-200 rounded-xl text-sm bg-[#F8FAFC] focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none';
const LABEL = 'block text-[11px] font-bold text-gray-500 mb-1';

function emptyState(): TargowFormState {
  return {
    fullName: '',
    phone: '',
    appUserId: '',
    regionIds: [],
    commissionRate: '0',
    monthlyTarget: '0',
    isActive: true,
  };
}

function stateFromTargow(targow: Targow): TargowFormState {
  return {
    fullName: targow.fullName,
    phone: targow.phone,
    appUserId: targow.appUserId ?? '',
    regionIds: [...targow.regionIds],
    commissionRate: String(targow.commissionRate),
    monthlyTarget: String(targow.monthlyTarget),
    isActive: targow.isActive,
  };
}

export const TargowFormModal: React.FC<TargowFormModalProps> = ({
  language,
  targows,
  regions,
  appUsers,
  editingTargow,
  onSave,
  onClose,
}) => {
  const [form, setForm] = useState<TargowFormState>(() =>
    editingTargow ? stateFromTargow(editingTargow) : emptyState()
  );
  const [error, setError] = useState('');

  const patch = (partial: Partial<TargowFormState>) =>
    setForm((prev) => ({ ...prev, ...partial }));

  const toggleRegion = (regionId: string) => {
    patch({
      regionIds: form.regionIds.includes(regionId)
        ? form.regionIds.filter((id) => id !== regionId)
        : [...form.regionIds, regionId],
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullName = form.fullName.trim();
    const phone = form.phone.trim();

    if (!fullName) {
      setError(language === 'tm' ? 'Ady Familiýasy hökmanydyr.' : 'Ad Soyad zorunludur.');
      return;
    }
    if (!phone) {
      setError(language === 'tm' ? 'Telefon belgisi hökmanydyr.' : 'Telefon numarası zorunludur.');
      return;
    }
    if (targows.some((t) => t.fullName.trim().toLowerCase() === fullName.toLowerCase() && t.id !== editingTargow?.id)) {
      setError(language === 'tm' ? 'Bu targowçy eýýäm bar.' : 'Bu targowçı zaten var.');
      return;
    }

    const commissionRate = Number(form.commissionRate);
    const monthlyTarget = Number(form.monthlyTarget);

    onSave({
      id: editingTargow?.id ?? generateTargowId(),
      fullName,
      phone,
      appUserId: form.appUserId || undefined,
      regionIds: form.regionIds,
      commissionRate: Number.isFinite(commissionRate) ? commissionRate : 0,
      monthlyTarget: Number.isFinite(monthlyTarget) ? monthlyTarget : 0,
      isActive: form.isActive,
      createdAt: editingTargow?.createdAt ?? new Date().toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        <div className="px-5 py-4 bg-gradient-to-r from-[#0B1F3A] to-[#163864] text-white flex items-center justify-between flex-shrink-0">
          <span className="font-bold text-sm tracking-wide">
            {editingTargow ? 'Targowçyny redaktirle' : 'Täze targowçy'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Ady Familiýasy *</label>
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => patch({ fullName: e.target.value })}
                autoFocus
                className={`${INPUT} font-medium text-gray-800`}
              />
            </div>

            <div>
              <label className={LABEL}>Telefon belgisi *</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => patch({ phone: e.target.value })}
                placeholder="+993 65..."
                className={`${INPUT} font-medium text-gray-800`}
              />
            </div>

            <div>
              <label className={LABEL}>
                Ulanyjy hasaby ({language === 'tm' ? 'islege görä' : 'opsiyonel'})
              </label>
              <select
                value={form.appUserId}
                onChange={(e) => patch({ appUserId: e.target.value })}
                className={`${INPUT} cursor-pointer font-medium text-gray-800`}
              >
                <option value="">— Baglanmadyk —</option>
                {appUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.fullName} ({user.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={LABEL}>
                Komissiýa göterimi (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={form.commissionRate}
                onChange={(e) => patch({ commissionRate: e.target.value })}
                className={`${INPUT} font-mono font-bold text-gray-800`}
              />
            </div>

            <div>
              <label className={LABEL}>
                Aýlyk meýilnama (TMT)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.monthlyTarget}
                onChange={(e) => patch({ monthlyTarget: e.target.value })}
                className={`${INPUT} font-mono font-bold text-gray-800`}
              />
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={() => patch({ isActive: !form.isActive })}
                className={`h-9 px-3 rounded-xl border text-[11px] font-bold transition-all ${
                  form.isActive
                    ? 'bg-emerald-500 text-white border-emerald-500'
                    : 'bg-white text-gray-500 border-gray-200'
                }`}
              >
                {form.isActive ? 'Işjeň' : 'Işjeň däl'}
              </button>
            </div>
          </div>

          <div>
            <label className={LABEL}>Berkidilen etraplar</label>
            {regions.length === 0 ? (
              <p className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                {language === 'tm'
                  ? 'Etraplar ýok. "Etraplar" bölüminden goşuň.'
                  : 'Etrap yok. "Etraplar" bölümünden ekleyin.'}
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {regions.map((region) => {
                  const selected = form.regionIds.includes(region.id);
                  return (
                    <button
                      key={region.id}
                      type="button"
                      onClick={() => toggleRegion(region.id)}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all ${
                        selected
                          ? 'bg-emerald-500 text-white border-emerald-500'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-400'
                      }`}
                    >
                      {region.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {error && (
            <div className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs"
            >
              Ýatyr
            </button>
            <button
              type="submit"
              className="h-9 px-5 rounded-xl bg-[#10b981] hover:bg-[#059669] text-white font-bold text-xs"
            >
              Ýatda sakla
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
