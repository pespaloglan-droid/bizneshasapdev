import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Account, LanguageCode } from '../../types';
import { translations } from '../../locales/i18n';

interface DeleteAccountModalProps {
  account: Account;
  language: LanguageCode;
  onConfirmDelete: (accountId: string) => void;
  onClose: () => void;
}

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  account,
  language,
  onConfirmDelete,
  onClose
}) => {
  const t = translations[language] || translations.en;

  return (
    <div className="absolute inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden border border-gray-200 animate-in zoom-in-95 max-h-[320px] flex flex-col">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-red-50/60 flex-shrink-0">
          <h3 className="text-sm font-bold text-red-700 flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span>{t.confirmDeleteTitle}</span>
          </h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700 rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 flex-1">
          <p className="text-xs text-gray-600 mb-4">
            <span className="font-semibold text-gray-900">"{account.name}"</span> {t.confirmDeleteMsg}
          </p>

          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {t.cancel}
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirmDelete(account.id);
                onClose();
              }}
              className="px-4 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-all"
            >
              {t.delete}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
