import React from 'react';
import { ConflictResolverModal } from '../ConflictResolverModal';
import { Link2 } from 'lucide-react';
import type { Account, LanguageCode } from '../../types';
import { translate } from '../../locales/i18n';
import { ConnectionFields } from './ConnectionFields';

interface Props {
  language: LanguageCode;
  storeDb: string;
  account?: Account;
  /** PC'den gelen belgeleri içeri alma tetikleyicisi. */
  onDocsChanged?: () => void;
}

/**
 * Ayarlar → "Bulut eşitleme" ekranı.
 *
 * Satırların kendisi `ConnectionFields` bileşeninde — hesap ekranları da aynı
 * bileşeni kullanıyor (kod tekrarı yok).
 */
export const AccountConnectionPanel: React.FC<Props> = ({ language, storeDb, account, onDocsChanged }) => {
  if (!account?.id) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-xs text-gray-500">
        {translate(language, 'conn.noAccount')}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-start gap-3">
        <div className="w-11 h-11 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center flex-shrink-0">
          <Link2 className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-bold text-gray-900">{translate(language, 'conn.sectionTitle')}</div>
          <div className="text-[11px] text-gray-500">
            {translate(language, 'conn.shareNote', { name: account.name })}
          </div>
        </div>
      </div>

      <ConflictResolverModal dbName={storeDb} />

      <ConnectionFields
        accountId={account.id}
        storeDb={storeDb}
        language={language}
        onDocsChanged={onDocsChanged}
      />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-[10px] text-gray-400 leading-relaxed">
        {translate(language, 'conn.panelNote')}
      </div>
    </div>
  );
};

export default AccountConnectionPanel;