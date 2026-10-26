import { HealthPanel } from './HealthPanel';
import { BackupPanel } from './BackupPanel';
import { TelemetrySettingsPanel } from './TelemetrySettingsPanel';
import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import type { Account, AppSettings, InvoiceRecord, LanguageCode, Product, RoleTemplates } from '../../types';
import type { MeasurementUnit } from '../../db/unitService';
import {
  defaultSettings,
  getAppSettings,
  getRoleTemplates,
  saveAppSettings,
  saveRoleTemplates,
} from '../../db/settingsService';
import { getInvoicesForAccount } from '../../db/salesService';
import { DeletedInvoicesModal } from '../pos/DeletedInvoicesModal';
import { PrinterSettingsPanel } from './PrinterSettingsPanel';
import { ScaleSettingsPanel } from './ScaleSettingsPanel';
import { ReceiptSettingsPanel } from './ReceiptSettingsPanel';
import { PermissionsPanel } from './PermissionsPanel';
import { UnitsPanel } from './UnitsPanel';
import { GeneralSettingsPanel } from './GeneralSettingsPanel';
import { EncryptionSettingsCard } from './EncryptionSettingsCard';
import { RulesPanel } from './RulesPanel';
import { AccountConnectionPanel } from '../pos/AccountConnectionPanel';
import { AuditLogPanel } from './AuditLogPanel';
import { setAuditEnabled } from '../../db/auditLog';
import {
  SettingsSidebar,
  SETTINGS_SECTIONS,
  UnsavedChangesDialog,
  type SettingsSection,
} from './SettingsSidebar';
import { isNative } from '../../utils/platform';
import { useT } from '../../locales/LanguageContext';

interface SazlamalarWorkspaceProps {
  language: LanguageCode;
  storeDb: string;
  /** Aktif hesap — bulut eşitleme paneli hesabın veritabanını kullanır. */
  account?: Account;
  companyName: string;
  currencyCode: string;
  onSelectLanguage: (lang: LanguageCode) => void;
  onGoToCurrency: () => void;
  units: readonly MeasurementUnit[];
  products: readonly Product[];
  onSaveUnit: (unit: MeasurementUnit) => void;
  onDeleteUnit: (unit: MeasurementUnit) => void;
  /** Sazlamalary üýtgetmek rugsady (modul rugsady — diňe admin/üýtget). */
  canEditSettings?: boolean;
  /** Administrator mı? — "Silinen fakturalar" bölümi diňe şolara görkezilýär. */
  isAdmin?: boolean;
  backupRequest?: number;
  syncStates?: readonly string[];
  licenseDays?: number;
}

const APP_VERSION = '2.1.0';

function same(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export const SazlamalarWorkspace: React.FC<SazlamalarWorkspaceProps> = ({
  language,
  storeDb,
  account,
  companyName,
  currencyCode,
  onSelectLanguage,
  onGoToCurrency,
  units,
  products,
  onSaveUnit,
  onDeleteUnit,
  canEditSettings = true,
  isAdmin = true,
  backupRequest = 0,
  syncStates,
  licenseDays,
}) => {
  const t = useT();
  const [saved, setSaved] = useState<AppSettings | null>(null);
  const [draft, setDraft] = useState<AppSettings | null>(null);
  const [savedTemplates, setSavedTemplates] = useState<RoleTemplates>({});
  const [draftTemplates, setDraftTemplates] = useState<RoleTemplates>({});
  const [backupFile, setBackupFile] = useState<File | undefined>();
  const [section, setSection] = useState<SettingsSection>(backupRequest ? 'backup' : 'printer');
  const [pendingSection, setPendingSection] = useState<SettingsSection | null>(null);
  // Mobil: önce bölüm listesi, dokununca detay (geri tuşlu).
  const [mobileDetail, setMobileDetail] = useState(!!backupRequest);
  const native = isNative();
  const [notice, setNotice] = useState<
    { tone: 'success' | 'error' | 'info'; text: string } | null
  >(null);
  // Silinen fakturalar (diňe admin) — F9 bilen şol bir bileşen.
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [isDeletedOpen, setIsDeletedOpen] = useState(false);

  // "Silinen fakturalar" diňe administrator görýär.
  const visibleSections = isAdmin
    ? SETTINGS_SECTIONS
    : SETTINGS_SECTIONS.filter((s) => s.id !== 'deleted' && s.id !== 'backup');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [loadedSettings, loadedTemplates, loadedInvoices] = await Promise.all([
        getAppSettings(storeDb),
        getRoleTemplates(storeDb),
        getInvoicesForAccount(storeDb),
      ]);
      if (cancelled) return;
      const initial = loadedSettings ?? defaultSettings(language, companyName);
      setSaved(initial);
      setDraft(initial);
      setSavedTemplates(loadedTemplates);
      setDraftTemplates(loadedTemplates);
      setInvoices(loadedInvoices);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeDb]);

  const dirty = useMemo(() => {
    if (!draft || !saved) {
      return {
        printer: false,
        scale: false,
        receipt: false,
        permissions: false,
        units: false,
        rules: false,
        deleted: false,
        sync: false,
        audit: false,
        general: false,
        backup: false,
        health: false,
      };
    }
    return {
      printer: !same(draft.printer, saved.printer),
      scale: !same(draft.scale, saved.scale),
      receipt: !same(draft.receipt, saved.receipt),
      permissions:
        !same(draftTemplates, savedTemplates) ||
        draft.general.auditLogEnabled !== saved.general.auditLogEnabled,
      // Ölçeg birlikleri derrew ýazylýar — garaşylýan üýtgeşme ýok.
      units: false,
      rules:
        !same(draft.firm, saved.firm) ||
        !same(draft.operations, saved.operations) ||
        !same(draft.barcode, saved.barcode),
      deleted: false,
      // Senkronizasyon ayarları kendi kaydetme düğmesiyle yazılır.
      sync: false,
      // Günlük görüntüleyici salt-okunur — kaydedilecek taslağı yok.
      audit: false,
      backup: false,
      health: false,
      general: !same(draft.general, saved.general),
    };
  }, [draft, saved, draftTemplates, savedTemplates]);

  const handleSelectSection = (next: SettingsSection) => {
    if (next === 'backup' && !isAdmin) { setNotice({ tone: 'error', text: t('sazlamalar.noEditPerm') }); return; }
    if (next === 'deleted') {
      // "Silinen fakturalar" — özi penjire bolup açylýar (F9 bilen deň).
      if (isAdmin) setIsDeletedOpen(true);
      return;
    }
    if (next === section) {
      if (native) setMobileDetail(true);
      return;
    }
    if (dirty[section]) {
      setPendingSection(next);
      return;
    }
    setSection(next);
    if (native) setMobileDetail(true);
  };

  useEffect(() => {
    if (backupRequest) handleSelectSection('backup');
  }, [backupRequest]);

  const handleSave = async (target: SettingsSection) => {
    if (!draft) return;
    // Sazlamalary diňe üýtgetme rugsady bolanlar saklap bilýär.
    if (!canEditSettings) {
      setNotice({ tone: 'error', text: t('sazlamalar.noEditPerm') });
      return;
    }
    if (target === 'permissions') {
      await saveRoleTemplates(draftTemplates, storeDb);
      await saveAppSettings(draft, storeDb);
      setSavedTemplates(draftTemplates);
    } else {
      await saveAppSettings(draft, storeDb);
    }
    setSaved(draft);
    // Günlük bayrağı değiştiyse yeniden giriş beklemeden geçerli olsun
    setAuditEnabled(draft.general.auditLogEnabled);
    setNotice({ tone: 'success', text: t('sazlamalar.saved') });
  };

  const handleReset = (target: SettingsSection) => {
    if (!draft || !saved) return;
    if (target === 'printer') setDraft({ ...draft, printer: saved.printer });
    else if (target === 'scale') setDraft({ ...draft, scale: saved.scale });
    else if (target === 'receipt') setDraft({ ...draft, receipt: saved.receipt });
    else if (target === 'general') setDraft({ ...draft, general: saved.general });
    else if (target === 'rules') {
      setDraft({
        ...draft,
        firm: saved.firm,
        operations: saved.operations,
        barcode: saved.barcode,
      });
    }
    else {
      setDraftTemplates(savedTemplates);
      setDraft({ ...draft, general: saved.general });
    }
    setNotice(null);
  };

  const handleExport = () => handleSelectSection('backup');
  const handleImport = (file: File) => {
    setBackupFile(file);
    handleSelectSection('backup');
  };

  if (!draft || !saved) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#F1F5F9]">
        <span className="text-xs font-bold text-gray-400">{t('sazlamalar.loading')}</span>
      </div>
    );
  }

  const activeMeta = SETTINGS_SECTIONS.find((s) => s.id === section);

  return (
    <div className={`flex-1 flex bg-[#F1F5F9] overflow-hidden min-h-0 ${native ? 'bh-touch' : ''}`}>
      {/* Mobil: bölüm listesi */}
      {native && !mobileDetail ? (
        <div className="flex-1 overflow-y-auto bg-white">
          <div className="px-4 py-3 border-b border-gray-100 sticky top-0 bg-white z-10">
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{t('sazlamalar.settingsTitle')}</div>
          </div>
          <nav className="p-3 space-y-1.5 pb-8">
            {visibleSections.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectSection(item.id)}
                className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl text-sm font-bold text-gray-800 bg-gray-50 border border-gray-100 active:bg-emerald-50 active:border-emerald-200 text-left"
              >
                <span className="text-emerald-700">{item.icon}</span>
                <span className="flex-1">{t(item.labelKey)}</span>
                {dirty[item.id] && <span className="w-2.5 h-2.5 rounded-full bg-amber-500 flex-shrink-0" />}
                <span className="text-gray-300 text-lg leading-none">›</span>
              </button>
            ))}
          </nav>
        </div>
      ) : (
        <>
          {/* Çep menýu (PC) */}
          {!native && <SettingsSidebar active={section} dirty={dirty} onSelect={handleSelectSection} visibleSections={visibleSections} />}

          {/* Sag panel */}
          <div className="flex-1 overflow-y-auto p-3 md:p-5 min-w-0">
            {native && (
              <button
                type="button"
                onClick={() => setMobileDetail(false)}
                className="mb-3 flex items-center gap-1.5 h-11 px-3 rounded-2xl bg-white border border-gray-200 text-sm font-bold text-gray-700 shadow-sm active:bg-gray-50"
              >
                <ArrowLeft className="w-5 h-5" />
                {activeMeta ? t(activeMeta.labelKey) : t('sazlamalar.settingsTitle')}
              </button>
            )}
        {notice && (
          <div
            className={`mb-3 flex items-center gap-2 text-xs font-semibold border rounded-xl px-3 py-2 ${
              notice.tone === 'success'
                ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                : notice.tone === 'error'
                ? 'bg-rose-50 border-rose-100 text-rose-700'
                : 'bg-sky-50 border-sky-100 text-sky-700'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{notice.text}</span>
          </div>
        )}

        {section === 'printer' && (
          <PrinterSettingsPanel
            value={draft.printer}
            companyName={draft.receipt.companyName}
            dirty={dirty.printer}
            onChange={(printer) => setDraft({ ...draft, printer })}
            onSave={() => void handleSave('printer')}
            onReset={() => handleReset('printer')}
          />
        )}

        {section === 'scale' && (
          <ScaleSettingsPanel
            value={draft.scale}
            dirty={dirty.scale}
            onChange={(scale) => setDraft({ ...draft, scale })}
            onSave={() => void handleSave('scale')}
            onReset={() => handleReset('scale')}
          />
        )}

        {section === 'receipt' && (
          <ReceiptSettingsPanel
            value={draft.receipt}
            paperWidth={draft.printer.paperWidth}
            dirty={dirty.receipt}
            onChange={(receipt) => setDraft({ ...draft, receipt })}
            onSave={() => void handleSave('receipt')}
            onReset={() => handleReset('receipt')}
          />
        )}

        {section === 'permissions' && (
          <PermissionsPanel
            templates={draftTemplates}
            auditLogEnabled={draft.general.auditLogEnabled}
            language={language}
            dirty={dirty.permissions}
            onChangeTemplates={setDraftTemplates}
            onChangeAudit={(auditLogEnabled) =>
              setDraft({ ...draft, general: { ...draft.general, auditLogEnabled } })
            }
            onSave={() => void handleSave('permissions')}
            onReset={() => handleReset('permissions')}
          />
        )}

        {section === 'units' && (
          <UnitsPanel
            units={units}
            products={products}
            language={language}
            onSaveUnit={onSaveUnit}
            onDeleteUnit={onDeleteUnit}
          />
        )}

        {section === 'rules' && (
          <RulesPanel
            firm={draft.firm}
            operations={draft.operations}
            barcode={draft.barcode}
            dirty={dirty.rules}
            onChange={({ firm, operations, barcode }) =>
              setDraft({ ...draft, firm, operations, barcode })
            }
            onSave={() => void handleSave('rules')}
            onReset={() => handleReset('rules')}
          />
        )}

        {section === 'sync' && (
          <AccountConnectionPanel language={language} storeDb={storeDb} account={account} canEdit={canEditSettings} />
        )}

        {section === 'audit' && <AuditLogPanel />}

        {section === 'health' && <HealthPanel storeDb={storeDb} syncStates={syncStates} licenseDays={licenseDays} />}

        {section === 'backup' && <BackupPanel key={storeDb} storeDb={storeDb} accountId={account?.id ?? storeDb} canRestore={canEditSettings && isAdmin} initialFile={backupFile} accountName={companyName} licenseId={account?.licenseId} databaseName={account?.databaseName} />}

        {section === 'general' && (
          <div className="space-y-3">
            <EncryptionSettingsCard disabled={!canEditSettings} />
            <TelemetrySettingsPanel disabled={!canEditSettings} />
            <GeneralSettingsPanel
              value={draft.general}
              currencyCode={currencyCode}
              appVersion={APP_VERSION}
              dirty={dirty.general}
              onChange={(general) => setDraft({ ...draft, general })}
              onSave={() => void handleSave('general')}
              onReset={() => handleReset('general')}
              onSelectLanguage={onSelectLanguage}
              onGoToCurrency={onGoToCurrency}
              onExport={() => void handleExport()}
              onImport={(file) => void handleImport(file)}
              transferNotice={notice}
            />
          </div>
        )}
      </div>

      {/* Ýatda saklanmadyk üýtgeşme duýduryşy */}
      {pendingSection && (
        <UnsavedChangesDialog
          onStay={() => setPendingSection(null)}
          onContinue={() => {
            setSection(pendingSection);
            setPendingSection(null);
            if (native) setMobileDetail(true);
          }}
        />
      )}

      {/* Silinen fakturalar — F9 bilen şol bir bileşen (diňe administrator) */}
      {isDeletedOpen && (
        <DeletedInvoicesModal
          invoices={invoices.filter((inv) => inv.status === 'voided')}
          storeDb={storeDb}
          language={language}
          onClose={() => setIsDeletedOpen(false)}
          onDeleted={(ids) => {
            const removed = new Set(ids);
            setInvoices((prev) => prev.filter((inv) => !removed.has(inv.id)));
          }}
        />
      )}
        </>
      )}
    </div>
  );
};