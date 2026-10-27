import React from 'react';
import type { Account, LanguageCode } from '../../types';
import { useT } from '../../locales/LanguageContext';
import { BackupPanel } from '../sazlamalar/BackupPanel';
interface ImportDataModalProps { account: Account; language: LanguageCode; storeDb: string; onClose: () => void }
/** Account-screen import uses the same account checks, preview and explicit
 * confirmation as Settings; there is no silent legacy-import bypass. */
export const ImportDataModal: React.FC<ImportDataModalProps> = ({ account, storeDb, onClose }) => {
  const t = useT();
  return <div className="fixed inset-0 z-50 bg-black/40 p-3 flex items-center justify-center">
    <div role="dialog" aria-modal="true" aria-label={t('backup.title')} className="bg-white rounded-2xl w-full max-w-3xl max-h-[90dvh] overflow-auto p-5">
      <div className="flex items-center justify-between mb-4"><strong>{account.name}</strong><button onClick={onClose} className="px-3 py-2 rounded-lg border">{t('cancel')}</button></div>
      <BackupPanel key={storeDb} storeDb={storeDb} accountId={account.id} accountName={account.name} licenseId={account.licenseId} databaseName={account.databaseName} canRestore />
    </div>
  </div>;
};
