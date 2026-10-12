import React, { useRef } from 'react';
import { Download, ExternalLink, Info, Upload } from 'lucide-react';
import type { GeneralSettings, LanguageCode } from '../../types';
import { DATE_FORMATS } from '../../db/settingsService';
import { Field, INPUT, Notice, SaveBar, SettingsCard, Toggle } from './settingsUi';
import { useT } from '../../locales/LanguageContext';

interface GeneralSettingsPanelProps {
  value: GeneralSettings;
  currencyCode: string;
  appVersion: string;
  dirty: boolean;
  onChange: (next: GeneralSettings) => void;
  onSave: () => void;
  onReset: () => void;
  onSelectLanguage: (lang: LanguageCode) => void;
  onGoToCurrency: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  transferNotice: { tone: 'success' | 'error' | 'info'; text: string } | null;
}

const LANGUAGES: { code: LanguageCode; label: string }[] = [
  { code: 'tm', label: 'Türkmençe' },
  { code: 'ru', label: 'Русский' },
  { code: 'en', label: 'English' },
  { code: 'tr', label: 'Türkçe' },
];

export const GeneralSettingsPanel: React.FC<GeneralSettingsPanelProps> = ({
  value,
  currencyCode,
  appVersion,
  dirty,
  onChange,
  onSave,
  onReset,
  onSelectLanguage,
  onGoToCurrency,
  onExport,
  onImport,
  transferNotice,
}) => {
  const t = useT();
  const importRef = useRef<HTMLInputElement>(null);
  const patch = (partial: Partial<GeneralSettings>) => onChange({ ...value, ...partial });

  return (
    <div className="space-y-3">
      <SettingsCard title={t('sazlamalar.secGeneral')} description={t('sazlamalar.genDesc')}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label={t('sazlamalar.genLanguage')}>
            <select
              value={value.language}
              onChange={(e) => {
                const next = e.target.value as LanguageCode;
                patch({ language: next });
                onSelectLanguage(next);
              }}
              className={`${INPUT} cursor-pointer font-medium text-gray-800`}
            >
              {LANGUAGES.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label={t('sazlamalar.genDateFormat')}>
            <select
              value={value.dateFormat}
              onChange={(e) => patch({ dateFormat: e.target.value })}
              className={`${INPUT} cursor-pointer font-mono font-medium text-gray-800`}
            >
              {DATE_FORMATS.map((format) => (
                <option key={format} value={format}>
                  {format}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-[#F8FAFC] px-3 py-2.5">
          <div>
            <div className="text-xs font-bold text-gray-800">{t('sazlamalar.genBaseCurrency')}</div>
            <div className="text-[10px] text-gray-500 font-medium mt-0.5">
              {t('sazlamalar.genBaseCurrencyHint')}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-sm text-emerald-600">{currencyCode}</span>
            <button
              type="button"
              onClick={onGoToCurrency}
              className="h-8 px-3 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-[11px] flex items-center gap-1.5"
            >
              <ExternalLink className="w-3 h-3" />
              {t('sazlamalar.genGoToCurrency')}
            </button>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard title={t('sazlamalar.backupTitle')} description={t('sazlamalar.backupDesc')}>
        <Toggle
          checked={value.autoBackup}
          onChange={(next) => patch({ autoBackup: next })}
          label={t('sazlamalar.backupAuto')}
          description={t('sazlamalar.backupAutoDesc')}
        />

        {value.autoBackup && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label={t('sazlamalar.backupFreq')}>
              <select
                value={value.backupFrequency}
                onChange={(e) =>
                  patch({ backupFrequency: e.target.value as GeneralSettings['backupFrequency'] })
                }
                className={`${INPUT} cursor-pointer font-medium text-gray-800`}
              >
                <option value="daily">{t('sazlamalar.backupDaily')}</option>
                <option value="weekly">{t('sazlamalar.backupWeekly')}</option>
              </select>
            </Field>
            <Field label={t('sazlamalar.backupFolder')}>
              <input
                type="text"
                value={value.backupFolder}
                onChange={(e) => patch({ backupFolder: e.target.value })}
                placeholder="C:\\BiznesHasap\\backup"
                className={`${INPUT} font-mono text-xs font-medium text-gray-800`}
              />
            </Field>
          </div>
        )}
      </SettingsCard>

      <SettingsCard
        title={t('sazlamalar.dataTitle')}
        description={t('sazlamalar.dataDesc')}
      >
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onExport}
            className="h-9 px-4 rounded-xl bg-[#0B1F3A] hover:bg-[#163864] text-white font-bold text-xs flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            {t('sazlamalar.dataExport')}
          </button>
          <button
            type="button"
            onClick={() => importRef.current?.click()}
            className="h-9 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            {t('sazlamalar.dataImport')}
          </button>
          <input
            ref={importRef}
            type="file"
            accept=".bhbak,.json,application/octet-stream"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onImport(file);
              e.target.value = '';
            }}
          />
        </div>
        {transferNotice && <Notice tone={transferNotice.tone} text={transferNotice.text} />}
      </SettingsCard>

      <SettingsCard
        title={t('sazlamalar.aboutTitle')}
        description={t('sazlamalar.aboutDesc')}
        aside={
          <span className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
            <Info className="w-4 h-4 text-gray-500" />
          </span>
        }
      >
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl border border-gray-200 bg-[#F8FAFC] px-3 py-2">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              {t('sazlamalar.aboutVersion')}
            </div>
            <div className="font-mono font-bold text-gray-800 mt-0.5">v{appVersion}</div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-[#F8FAFC] px-3 py-2">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              {t('sazlamalar.aboutLicense')}
            </div>
            <div className="font-bold text-gray-800 mt-0.5">{t('sazlamalar.aboutLicenseValue')}</div>
          </div>
        </div>
      </SettingsCard>

      <SaveBar dirty={dirty} onSave={onSave} onReset={onReset} />
    </div>
  );
};