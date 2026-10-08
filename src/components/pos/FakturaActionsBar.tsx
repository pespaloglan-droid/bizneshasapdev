import React from 'react';
import { Bell, BellOff, FileClock, Save } from 'lucide-react';
import type { LanguageCode } from '../../types';

interface FakturaActionsBarProps {
  language: LanguageCode;
  pendingCount: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onSaveInvoice: () => void;
  onOpenDrafts: () => void;
}

const BASE =
  'min-w-0 rounded-xl border flex flex-col items-center justify-center gap-0.5 py-2 px-1 transition-all';

export const FakturaActionsBar: React.FC<FakturaActionsBarProps> = ({
  language,
  pendingCount,
  soundEnabled,
  onToggleSound,
  onSaveInvoice,
  onOpenDrafts,
}) => {
  const isTm = language === 'tm';

  return (
    <div className="w-full grid grid-cols-[1fr_1fr_auto] gap-1.5">
      {/* 1. Sessiz garalama ýazgysy — hiç bir modal açmaýar */}
      <button
        type="button"
        onClick={onSaveInvoice}
        className={`${BASE} border-gray-200 hover:border-emerald-400 hover:bg-emerald-50/70`}
        title={isTm ? 'Faktura ýazga al (garalama)' : 'Faturayı kaydet (taslak)'}
      >
        <Save className="w-5 h-5 text-[#0B1F3A]" />
        <span className="text-[11px] font-bold text-gray-800 leading-tight text-center truncate w-full">
          Faktura ýazga al
        </span>
      </button>

      {/* 2. Garalama sanawy */}
      <button
        type="button"
        onClick={onOpenDrafts}
        className={`${BASE} relative border-gray-200 hover:border-amber-400 hover:bg-amber-50/70`}
        title={isTm ? 'Garalama fakturalar' : 'Taslak faturalar'}
      >
        <FileClock className="w-5 h-5 text-amber-600" />
        <span className="text-[11px] font-bold text-gray-800 leading-tight text-center truncate w-full">
          Garalama fakturalar
        </span>
        {pendingCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
            {pendingCount > 99 ? '99+' : pendingCount}
          </span>
        )}
      </button>

      {/* 3. Bildirim sesi aç/kapa */}
      <button
        type="button"
        onClick={onToggleSound}
        className={`${BASE} w-10 ${
          soundEnabled
            ? 'border-emerald-300 bg-emerald-50/70 hover:bg-emerald-100'
            : 'border-gray-200 hover:bg-gray-50'
        }`}
        title={
          soundEnabled
            ? isTm
              ? 'Bildirim sesi açyk — basyp öçür'
              : 'Bildirim sesi açık — kapatmak için bas'
            : isTm
            ? 'Bildirim sesi ýapyk — basyp aç'
            : 'Bildirim sesi kapalı — açmak için bas'
        }
      >
        {soundEnabled ? (
          <Bell className="w-5 h-5 text-emerald-600" />
        ) : (
          <BellOff className="w-5 h-5 text-gray-400" />
        )}
      </button>
    </div>
  );
};