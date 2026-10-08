import React from 'react';
import { X, Building2, Check, Plus, Database } from 'lucide-react';
import { Account, LanguageCode } from '../../types';
import { translations } from '../../locales/i18n';

interface OtherAccountsModalProps {
  accounts: Account[];
  selectedAccountId: string;
  language: LanguageCode;
  onSelectAccount: (accountId: string) => void;
  onOpenAddAccount: () => void;
  onClose: () => void;
}

export const OtherAccountsModal: React.FC<OtherAccountsModalProps> = ({
  accounts,
  selectedAccountId,
  language,
  onSelectAccount,
  onOpenAddAccount,
  onClose
}) => {
  const t = translations[language] || translations.en;

  return (
    <div className="absolute inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200 animate-in zoom-in-95 max-h-[360px] flex flex-col">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gray-50/80 flex-shrink-0">
          <h3 className="text-sm font-bold text-gray-800 flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>{t.selectAccount}</span>
          </h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700 rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 overflow-y-auto space-y-1.5 flex-1">
          {accounts.map((acc, index) => {
            const isSelected = acc.id === selectedAccountId;
            return (
              <div
                key={acc.id}
                onClick={() => {
                  onSelectAccount(acc.id);
                  onClose();
                }}
                className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/60 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#e2e8f0] flex items-center justify-center overflow-hidden border border-gray-200 flex-shrink-0">
                    {acc.logoUrl ? (
                      <img src={acc.logoUrl} alt={acc.name} className="w-full h-full object-cover" />
                    ) : (
                      <Building2 className="w-4 h-4 text-[#0e3860]" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-900 flex items-center space-x-2">
                      <span>{index + 1}. {acc.name}</span>
                    </div>
                    <div className="text-[10px] text-gray-500 flex items-center space-x-1 font-mono">
                      <Database className="w-2.5 h-2.5 text-gray-400" />
                      <span>{acc.databaseName}</span>
                    </div>
                  </div>
                </div>

                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="p-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between flex-shrink-0">
          <button
            onClick={() => {
              onClose();
              onOpenAddAccount();
            }}
            className="flex items-center space-x-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.addAccount}</span>
          </button>

          <button
            onClick={onClose}
            className="px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200/60 rounded-lg transition-colors"
          >
            {t.cancel}
          </button>
        </div>
      </div>
    </div>
  );
};
