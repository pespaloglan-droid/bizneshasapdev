import React from 'react';
import { Minus, Square, X } from 'lucide-react';
import { translations } from '../locales/i18n';
import { LanguageCode } from '../types';

interface TitleBarProps {
  language: LanguageCode;
}

import { shouldShowWindowControls } from '../utils/platform';

export const TitleBar: React.FC<TitleBarProps> = ({ language }) => {
  const t = translations[language] || translations.en;

  // Mobil (Capacitor) ve web'de pencere butonları anlamsız — gizle.
  if (!shouldShowWindowControls()) {
    return null;
  }

  const handleMinimize = () => {
    if ((window as any).electronAPI) {
      (window as any).electronAPI.minimize();
    }
  };

  const handleMaximize = () => {
    if ((window as any).electronAPI) {
      (window as any).electronAPI.maximize();
    }
  };

  const handleClose = () => {
    if ((window as any).electronAPI) {
      (window as any).electronAPI.close();
    } else {
      window.close();
    }
  };

  return (
    <div 
      className="h-10 w-full flex items-center justify-between px-4 select-none border-b border-gray-100 bg-white rounded-t-xl"
      style={{ WebkitAppRegion: 'drag' } as any}
    >
      {/* Spacer on left for symmetry */}
      <div className="w-20" />

      {/* Center Title */}
      <div className="text-sm font-medium text-gray-700 tracking-wide">
        {t.windowTitle}
      </div>

      {/* Right Controls */}
      <div 
        className="flex items-center space-x-1" 
        style={{ WebkitAppRegion: 'no-drag' } as any}
      >
        <button
          onClick={handleMinimize}
          className="p-1.5 text-gray-500 hover:bg-gray-100 rounded transition-colors"
          title="Minimize"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleMaximize}
          className="p-1.5 text-gray-500 hover:bg-gray-100 rounded transition-colors"
          title="Maximize"
        >
          <Square className="w-3 h-3" />
        </button>
        <button
          onClick={handleClose}
          className="p-1.5 text-gray-500 hover:bg-red-500 hover:text-white rounded transition-colors"
          title="Close"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
