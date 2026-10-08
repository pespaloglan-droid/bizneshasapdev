import React, { useEffect } from 'react';
import { Command, X } from 'lucide-react';
import type { LanguageCode } from '../../types';
import { ShortcutGroups } from '../common/ShortcutGroups';

interface ShortcutsHelpModalProps {
  language: LanguageCode;
  onClose: () => void;
}

export const ShortcutsHelpModal: React.FC<ShortcutsHelpModalProps> = ({ language, onClose }) => {
  const isTm = language === 'tm';

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />

      <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 w-[460px] max-w-[94vw] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150 select-none">
        <div className="px-4 py-3 bg-gradient-to-r from-[#0B1F3A] to-[#163864] text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Command className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-wide">
                {isTm ? 'Klawiatura gysgaltmalary' : 'Klavye Kısayolları'}
              </h3>
              <p className="text-[10px] text-gray-300">
                {isTm ? 'ESC ýa-da daşyna basyp ýapyň' : 'ESC veya dışına tıklayarak kapatın'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-[62vh] overflow-y-auto p-3">
          <ShortcutGroups language={language} />
        </div>
      </div>
    </>
  );
};
