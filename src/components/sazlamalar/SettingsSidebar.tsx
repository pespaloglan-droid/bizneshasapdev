import React from 'react';
import { Cloud, ListChecks, Printer, ReceiptText, Ruler, Scale, ScrollText, Settings, ShieldCheck, Trash2 } from 'lucide-react';
import { useT } from '../../locales/LanguageContext';

export type SettingsSection =
  | 'printer'
  | 'scale'
  | 'receipt'
  | 'permissions'
  | 'units'
  | 'rules'
  | 'deleted'
  | 'sync'
  | 'audit'
  | 'health'
  | 'backup'
  | 'general';

export const SETTINGS_SECTIONS: {
  id: SettingsSection;
  labelKey: string;
  icon: React.ReactNode;
}[] = [
  { id: 'printer', labelKey: 'sazlamalar.secPrinter', icon: <Printer className="w-4 h-4" /> },
  { id: 'scale', labelKey: 'sazlamalar.secScale', icon: <Scale className="w-4 h-4" /> },
  { id: 'receipt', labelKey: 'sazlamalar.secReceipt', icon: <ReceiptText className="w-4 h-4" /> },
  { id: 'permissions', labelKey: 'sazlamalar.secPermissions', icon: <ShieldCheck className="w-4 h-4" /> },
  { id: 'units', labelKey: 'sazlamalar.secUnits', icon: <Ruler className="w-4 h-4" /> },
  { id: 'rules', labelKey: 'sazlamalar.secRules', icon: <ListChecks className="w-4 h-4" /> },
  { id: 'deleted', labelKey: 'sazlamalar.secDeleted', icon: <Trash2 className="w-4 h-4" /> },
  { id: 'sync', labelKey: 'sazlamalar.secSync', icon: <Cloud className="w-4 h-4" /> },
  { id: 'audit', labelKey: 'sazlamalar.secAudit', icon: <ScrollText className="w-4 h-4" /> },
  { id: 'health', labelKey: 'backup.health', icon: <ListChecks className="w-4 h-4" /> },
  { id: 'backup', labelKey: 'backup.title', icon: <ScrollText className="w-4 h-4" /> },
  { id: 'general', labelKey: 'sazlamalar.secGeneral', icon: <Settings className="w-4 h-4" /> },
];

interface SettingsSidebarProps {
  active: SettingsSection;
  dirty: Record<SettingsSection, boolean>;
  onSelect: (section: SettingsSection) => void;
  /** Görkezilýän bölümler (admin däl bolsa "Silinen fakturalar" gizlenýär). */
  visibleSections?: typeof SETTINGS_SECTIONS;
}

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({
  active,
  dirty,
  onSelect,
  visibleSections = SETTINGS_SECTIONS,
}) => {
  const t = useT();
  return (
  <aside className="w-[240px] flex-shrink-0 border-r border-gray-200 bg-white overflow-y-auto">
    <div className="px-4 py-3 border-b border-gray-100">
      <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{t('sazlamalar.settingsTitle')}</div>
    </div>
    <nav className="p-2 space-y-1">
      {visibleSections.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onSelect(item.id)}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
            active === item.id
              ? 'bg-[#10b981] text-white shadow-sm'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          <span className="flex-shrink-0">{item.icon}</span>
          <span className="truncate flex-1">{t(item.labelKey)}</span>
          {dirty[item.id] && (
            <span
              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                active === item.id ? 'bg-white' : 'bg-amber-500'
              }`}
            />
          )}
        </button>
      ))}
    </nav>
  </aside>
  );
};

interface UnsavedChangesDialogProps {
  onStay: () => void;
  onContinue: () => void;
}

export const UnsavedChangesDialog: React.FC<UnsavedChangesDialogProps> = ({
  onStay,
  onContinue,
}) => {
  const t = useT();
  return (
  <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center space-y-4">
      <p className="font-bold text-gray-800 text-sm">
        {t('sazlamalar.unsavedTitle')}
      </p>
      <p className="text-[11px] text-gray-500 font-medium">
        {t('sazlamalar.unsavedHint')}
      </p>
      <div className="flex gap-2 justify-center">
        <button
          type="button"
          onClick={onStay}
          className="px-5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs"
        >
          {t('sazlamalar.cancelBtn')}
        </button>
        <button
          type="button"
          onClick={onContinue}
          className="px-5 py-2 rounded-xl bg-[#10b981] hover:bg-[#059669] text-white font-bold text-xs"
        >
          {t('sazlamalar.continueBtn')}
        </button>
      </div>
    </div>
  </div>
  );
};