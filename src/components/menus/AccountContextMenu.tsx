import React from 'react';
import { Trash2, Edit3, Upload } from 'lucide-react';
import { translations } from '../../locales/i18n';
import { LanguageCode } from '../../types';

interface AccountContextMenuProps {
  language: LanguageCode;
  onEdit: () => void;
  onDelete: () => void;
  onImport: () => void;
  onClose: () => void;
}

export const AccountContextMenu: React.FC<AccountContextMenuProps> = ({
  language,
  onEdit,
  onDelete,
  onImport,
  onClose
}) => {
  const t = translations[language] || translations.en;

  return (
    <div 
      className="absolute bottom-12 left-2 z-50 w-56 bg-white border border-gray-200 rounded-lg shadow-xl py-1 text-sm text-gray-700 animate-in fade-in zoom-in-95 duration-100"
      onMouseLeave={onClose}
    >
      <button
        onClick={() => { onEdit(); onClose(); }}
        className="w-full px-3.5 py-2 text-left flex items-center space-x-2.5 hover:bg-gray-50 transition-colors"
      >
        <Edit3 className="w-4 h-4 text-blue-600" />
        <span>{t.edit}</span>
      </button>

      <button
        onClick={() => { onImport(); onClose(); }}
        className="w-full px-3.5 py-2 text-left flex items-center space-x-2.5 hover:bg-gray-50 transition-colors"
      >
        <Upload className="w-4 h-4 text-emerald-600" />
        <span>{t.import}</span>
      </button>

      <div className="my-1 border-t border-gray-100" />

      <button
        onClick={() => { onDelete(); onClose(); }}
        className="w-full px-3.5 py-2 text-left flex items-center space-x-2.5 hover:bg-red-50 text-red-600 transition-colors"
      >
        <Trash2 className="w-4 h-4 text-red-600" />
        <span>{t.delete}</span>
      </button>
    </div>
  );
};
