import React from 'react';
import { Check } from 'lucide-react';
import { LanguageCode } from '../../types';
import { FlagIcon } from '../common/FlagIcon';

interface LanguageMenuProps {
  currentLanguage: LanguageCode;
  onSelectLanguage: (lang: LanguageCode) => void;
  onClose: () => void;
}

export const LanguageMenu: React.FC<LanguageMenuProps> = ({
  currentLanguage,
  onSelectLanguage,
  onClose
}) => {
  const languages: { code: LanguageCode; label: string; sub: string }[] = [
    { code: 'en', label: 'English', sub: 'USA' },
    { code: 'tr', label: 'Türkçe', sub: 'Türkiye' },
    { code: 'tm', label: 'Türkmençe', sub: 'Türkmenistan' },
    { code: 'ru', label: 'Русский', sub: 'Россия' }
  ];

  return (
    <div 
      className="absolute bottom-12 right-2 z-50 w-48 bg-white border border-gray-200 rounded-lg shadow-xl py-1 text-sm text-gray-700 animate-in fade-in duration-100"
      onMouseLeave={onClose}
    >
      <div className="px-3 py-1.5 text-[11px] font-semibold text-gray-400 border-b border-gray-100 uppercase tracking-wider">
        Dil Seçimi / Language
      </div>
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => { onSelectLanguage(lang.code); onClose(); }}
          className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-gray-50 transition-colors ${
            currentLanguage === lang.code ? 'bg-blue-50/60 font-semibold text-blue-900' : ''
          }`}
        >
          <div className="flex items-center space-x-2.5">
            <FlagIcon language={lang.code} className="w-5 h-3.5 flex-shrink-0" />
            <div className="flex flex-col">
              <span className="text-xs leading-tight">{lang.label}</span>
            </div>
          </div>
          {currentLanguage === lang.code && <Check className="w-3.5 h-3.5 text-blue-600" />}
        </button>
      ))}
    </div>
  );
};
