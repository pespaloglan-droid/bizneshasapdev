import React, { useState } from 'react';
import { Printer, AlertTriangle, Search, ChevronDown } from 'lucide-react';
import { LanguageCode, PrinterMode } from '../../types';
import { FlagIcon } from '../common/FlagIcon';
import { LanguageMenu } from '../menus/LanguageMenu';
import { PrinterMenu } from '../menus/PrinterMenu';
import { useT } from '../../locales/LanguageContext';
import pkg from '../../../package.json';

interface PosFooterProps {
  language: LanguageCode;
  printerMode: PrinterMode;
  onSelectLanguage: (lang: LanguageCode) => void;
  onSelectPrinterMode: (mode: PrinterMode) => void;
  onOpenSearch: () => void;
  onOpenAlerts: () => void;
  /** Jemi duýduryş sany (kritik stok + möhleti ýakyn bergi). */
  alertCount?: number;
}

export const PosFooter: React.FC<PosFooterProps> = ({
  language,
  printerMode,
  onSelectLanguage,
  onSelectPrinterMode,
  onOpenSearch,
  onOpenAlerts,
  alertCount = 0
}) => {
  const t = useT();
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isPrinterOpen, setIsPrinterOpen] = useState(false);

  const langCodes: Record<LanguageCode, string> = {
    en: 'ENG',
    tr: 'TUR',
    tm: 'TKM',
    ru: 'RUS',
  };

  return (
    <footer className="h-10 w-full bg-[#0B1F3A] text-white flex items-center justify-between px-4 select-none flex-shrink-0 z-20 text-xs shadow-inner">
      {/* 1. Sol Marka Logosu (Eski Orijinal Geometrik Çubuklar) */}
      <div className="flex items-center space-x-2">
        <div className="flex items-end space-x-0.5 h-4">
          <div className="w-1.5 h-2.5 bg-[#10b981] rounded-xs"></div>
          <div className="w-1.5 h-4 bg-white rounded-xs"></div>
          <div className="w-1.5 h-3 bg-[#3b82f6] rounded-xs"></div>
        </div>
        <span className="font-bold text-sm tracking-tight text-white">Biznes Hasap</span>
      </div>

      {/* 2. Orta İkonlar (Esas Sayfada Görünen Araçlar: Yazıcı, Uyarılar, Arama) */}
      <div className="flex items-center space-x-2">
        {/* Yazıcı */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsPrinterOpen(!isPrinterOpen)}
            className="p-1.5 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title={t('pos.printerSettingsTip')}
          >
            <Printer className="w-4 h-4" />
          </button>
          {isPrinterOpen && (
            <PrinterMenu
              currentMode={printerMode}
              language={language}
              onSelectMode={onSelectPrinterMode}
              onClose={() => setIsPrinterOpen(false)}
            />
          )}
        </div>

        {/* Uyarılar */}
        <button
          type="button"
          onClick={onOpenAlerts}
          className={`relative p-1.5 rounded-lg transition-colors ${
            alertCount > 0
              ? 'text-amber-400 hover:text-amber-300 hover:bg-white/10'
              : 'text-gray-300 hover:text-white hover:bg-white/10'
          }`}
          title={alertCount > 0 ? t('pos.alertsCount', { count: alertCount }) : t('pos.alertsTitle')}
        >
          <AlertTriangle className="w-4 h-4" />
          {alertCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[15px] h-[15px] px-0.5 rounded-full bg-amber-500 text-[#0B1F3A] text-[9px] font-black flex items-center justify-center leading-none border border-[#0B1F3A]">
              {alertCount > 99 ? '99+' : alertCount}
            </span>
          )}
        </button>

        {/* Genel Arama */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="p-1.5 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          title={t('pos.generalSearchTip')}
        >
          <Search className="w-4 h-4" />
        </button>
      </div>

      {/* 3. Sağ Bilgi & Dil Seçici */}
      <div className="flex items-center space-x-4">
        <div className="text-[11px] text-gray-300 font-mono hidden md:flex items-center space-x-1.5">
          <span className="font-semibold text-white">Biznes Hasap</span>
          <span className="text-gray-500">|</span>
          <span>v{pkg.version}</span>
        </div>

        {/* Dil Seçici Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsLangOpen(!isLangOpen)}
            className="flex items-center space-x-1.5 px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 transition-all active:scale-95"
          >
            <FlagIcon language={language} className="w-4 h-3" />
            <span className="text-[11px] font-bold font-mono tracking-wider">{langCodes[language]}</span>
            <ChevronDown className="w-3 h-3 text-gray-300" />
          </button>

          {isLangOpen && (
            <LanguageMenu
              currentLanguage={language}
              onSelectLanguage={onSelectLanguage}
              onClose={() => setIsLangOpen(false)}
            />
          )}
        </div>
      </div>
    </footer>
  );
};
