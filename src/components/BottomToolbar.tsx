import React, { useState } from 'react';
import { LanguageCode, PrinterMode } from '../types';
import { LanguageMenu } from './menus/LanguageMenu';
import { FlagIcon } from './common/FlagIcon';
import bhLogo from '../assets/bh_logo.svg';

interface BottomToolbarProps {
  language: LanguageCode;
  printerMode: PrinterMode;
  onSelectLanguage: (lang: LanguageCode) => void;
  onSelectPrinterMode: (mode: PrinterMode) => void;
  onOpenShortcuts: (type: 'search' | 'triangle') => void;
}

export const BottomToolbar: React.FC<BottomToolbarProps> = ({
  language,
  onSelectLanguage,
}) => {
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);

  const langCodes: Record<LanguageCode, string> = {
    en: 'ENG',
    tr: 'TUR',
    tm: 'TKM',
    ru: 'RUS',
  };

  return (
    <div className="min-h-14 w-full bg-white border-t border-gray-200 px-4 py-2 flex items-center justify-between select-none relative rounded-b-xl flex-shrink-0 flex-wrap gap-y-1">
      {/* 1. Sol: Sadece Resmi 3D BH Marka Logosu (Diğer İkonlar Giriş Ekranından Kaldırıldı) */}
      <div className="flex items-center">
        <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center border border-gray-200 shadow-sm flex-shrink-0 bg-black">
          <img src={bhLogo} alt="Biznes Hasap Logo" className="w-full h-full object-cover" />
        </div>
      </div>

      {/* 2. Sağ Bölge: 3 Satır Ortalanmış (Biznes hesap / v1.150 / 20.06.2026) + Dil Seçim Butonu */}
      <div className="flex items-center space-x-4">
        {/* Biznes Hasap / Versiyon / Tarih */}
        <div className="flex flex-col items-center justify-center text-center leading-tight">
          <span className="text-[11px] font-semibold text-gray-800 tracking-tight">
            Biznes hesap
          </span>
          <span className="text-[9px] font-medium text-gray-500 font-mono">
            v1.150
          </span>
          <span className="text-[9px] font-normal text-gray-400 font-mono">
            20.06.2026
          </span>
        </div>

        {/* Dil Seçim Butonu */}
        <div className="relative">
          <button
            onClick={() => setIsLanguageOpen(!isLanguageOpen)}
            className="flex flex-col items-center justify-center px-2.5 py-1 border border-gray-200 hover:border-gray-400 rounded-lg bg-white shadow-sm transition-all hover:bg-gray-50 active:scale-95 min-w-[48px]"
            title="Dil Seçimi / Change Language"
          >
            <div className="mb-0.5 flex items-center justify-center">
              <FlagIcon language={language} className="w-4 h-3" />
            </div>
            <span className="text-[9px] font-bold text-gray-700 tracking-wider font-mono leading-none">
              {langCodes[language]}
            </span>
          </button>

          {isLanguageOpen && (
            <LanguageMenu
              currentLanguage={language}
              onSelectLanguage={onSelectLanguage}
              onClose={() => setIsLanguageOpen(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
};
