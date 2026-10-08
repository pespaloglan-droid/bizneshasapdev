import React from 'react';
import { Printer, Receipt, Check } from 'lucide-react';
import { LanguageCode, PrinterMode } from '../../types';
import { translations } from '../../locales/i18n';

interface PrinterMenuProps {
  currentMode: PrinterMode;
  language: LanguageCode;
  onSelectMode: (mode: PrinterMode) => void;
  onClose: () => void;
}

export const PrinterMenu: React.FC<PrinterMenuProps> = ({
  currentMode,
  language,
  onSelectMode,
  onClose
}) => {
  const t = translations[language] || translations.en;

  const options: { id: PrinterMode; label: string; icon: React.ReactNode }[] = [
    { id: 'auto', label: t.autoSelectPrinter, icon: <Printer className="w-4 h-4 text-blue-600" /> },
    { id: 'receipt', label: t.receiptPrinter, icon: <Receipt className="w-4 h-4 text-emerald-600" /> },
    { id: 'standard', label: t.standardPrinter, icon: <Printer className="w-4 h-4 text-purple-600" /> },
  ];

  return (
    <div 
      className="absolute bottom-12 left-12 z-50 w-52 bg-white border border-gray-200 rounded-lg shadow-xl py-1 text-sm text-gray-700 animate-in fade-in duration-100"
      onMouseLeave={onClose}
    >
      <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 border-b border-gray-100">
        Yazıcı Tercihi
      </div>
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => { onSelectMode(opt.id); onClose(); }}
          className="w-full px-3 py-2 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center space-x-2.5">
            {opt.icon}
            <span className={currentMode === opt.id ? 'font-medium text-gray-900' : ''}>
              {opt.label}
            </span>
          </div>
          {currentMode === opt.id && <Check className="w-3.5 h-3.5 text-blue-600" />}
        </button>
      ))}
    </div>
  );
};
