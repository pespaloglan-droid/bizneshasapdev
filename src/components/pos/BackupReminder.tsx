import React, { useEffect, useState } from 'react';
import { backupReminderDue, lastBackupAt } from '../../db/backupService';
import { useT } from '../../locales/LanguageContext';
export const BackupReminder: React.FC<{ storeDb: string; createdAt: string; onOpen: () => void }> = ({ storeDb, createdAt, onOpen }) => {
  const t = useT(); const [visible, setVisible] = useState(false);
  useEffect(() => {
    const key = `bh.backup.reminded.${storeDb}`;
    try {
      if (!sessionStorage.getItem(key) && backupReminderDue(lastBackupAt(storeDb), createdAt)) {
        sessionStorage.setItem(key, '1'); setVisible(true);
      }
    } catch { /* Unavailable session storage must not break POS. */ }
  }, [storeDb, createdAt]);
  if (!visible) return null;
  return <aside role="status" className="flex flex-wrap items-center gap-3 p-3 bg-amber-50 border-b border-amber-200 text-sm">
    <span className="flex-1">{t('backup.reminder')}</span>
    <button className="font-bold underline" onClick={() => { setVisible(false); onOpen(); }}>{t('backup.open')}</button>
    <button onClick={() => setVisible(false)}>{t('backup.dismiss')}</button>
  </aside>;
};
