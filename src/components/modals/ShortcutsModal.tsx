import React from 'react';
import { X, Keyboard, Search, Triangle } from 'lucide-react';
import { LanguageCode } from '../../types';
import { ShortcutGroups } from '../common/ShortcutGroups';
import { useT } from '../../locales/LanguageContext';

interface ShortcutsModalProps {
  /** Paneli açan ikon: 'search' = lumpa, 'triangle' = bellige. */
  type: 'search' | 'triangle';
  language: LanguageCode;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ type, language, onClose }) => {
  const t = useT();
  const isSearch = type === 'search';

  return (
    <div className="absolute inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200 animate-in zoom-in-95 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gradient-to-r from-[#0B1F3A] to-[#163864] text-white flex-shrink-0">
          <h3 className="text-sm font-bold flex items-center space-x-2">
            {isSearch ? (
              <Search className="w-4 h-4 text-emerald-400" />
            ) : (
              <Triangle className="w-4 h-4 text-amber-400" />
            )}
            <span>{t('modals.shortcutsTitle')}</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-gray-300 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 overflow-y-auto flex-1 min-h-0">
          <ShortcutGroups language={language} />
        </div>

        <div className="p-2.5 border-t border-gray-100 bg-gray-50 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-1 text-[10px] text-gray-500">
            <Keyboard className="w-3.5 h-3.5 text-gray-400" />
            <span>
              {t('modals.shortcutsHint')}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 rounded-lg shadow-sm"
          >
            {t('modals.shortcutsClose')}
          </button>
        </div>
      </div>
    </div>
  );
};
