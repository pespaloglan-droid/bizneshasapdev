/**
 * Veritabanı şifreleme kartı (FAZ 1.1 · MD §2.3 Adım 4-5).
 *
 * Akış:
 *  - KAPALI: uyarılar + "Maglumat bazasyny şifrle" → onay → TÜM hesap store'ları
 *    şifreli kovaya KOPYALANIR (kaynak asla silinmez) → flag açılır → restart önerilir.
 *  - AÇIK: durum rozeti + "Şifrlemäni öçür" → onay → flag kapanır → restart ile
 *    eski (şifresiz) kovaya dönülür. Veri kaybı yok: kaynak hiç silinmedi.
 *
 * Başarısız belge varsa flag AÇILMAZ ve liste gösterilir (sessiz kayıp yok).
 */

import React, { useState } from 'react';
import { Lock, LockOpen, RefreshCw, ShieldCheck } from 'lucide-react';
import { SettingsCard, Notice } from './settingsUi';
import { useT } from '../../locales/LanguageContext';
import { isEncryptionEnabled, applyEncryptionFlag } from '../../db/encryptionState';
import { migrateAllStoresToEncrypted, type AccountMigrationResult } from '../../db/runEncryptionMigration';
import { getAccountStoreKey } from '../../db/pouch';
import { loadStoredState } from '../../store/accountStore';

interface EncryptionSettingsCardProps {
  /** Sazlamalary üýtgetme rugsady ýoksa düwmeler işlemez. */
  disabled?: boolean;
}

type Phase =
  | { kind: 'idle' }
  | { kind: 'confirm-enable' }
  | { kind: 'confirm-disable' }
  | { kind: 'migrating'; done: number; total: number }
  | { kind: 'done'; results: AccountMigrationResult[]; restartNeeded: true }
  | { kind: 'disabled'; restartNeeded: true };

export const EncryptionSettingsCard: React.FC<EncryptionSettingsCardProps> = ({ disabled }) => {
  const t = useT();
  const [enabled, setEnabled] = useState(() => isEncryptionEnabled());
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' });

  const busy = phase.kind === 'migrating';

  const runMigration = async () => {
    const accounts = loadStoredState().accounts;
    const storeKeys = accounts.map((a) => getAccountStoreKey(a));
    setPhase({ kind: 'migrating', done: 0, total: storeKeys.length });
    const results = await migrateAllStoresToEncrypted(storeKeys, (done, total) => {
      setPhase({ kind: 'migrating', done, total });
    });
    const allOk = results.every((r) => r.verified);
    if (allOk) {
      applyEncryptionFlag(true);
      setEnabled(true);
    }
    setPhase({ kind: 'done', results, restartNeeded: true });
  };

  const runDisable = () => {
    // Geri dönüş yolu: kaynak (şifresiz) kovalar hiç silinmedi, flag'i kapatmak yeterli.
    applyEncryptionFlag(false);
    setEnabled(false);
    setPhase({ kind: 'disabled', restartNeeded: true });
  };

  const failedCount =
    phase.kind === 'done'
      ? phase.results.reduce((sum, r) => sum + r.failed.length, 0)
      : 0;

  return (
    <SettingsCard
      title={t('sazlamalar.encTitle')}
      description={t('sazlamalar.encDesc')}
      aside={
        <span
          className={`w-8 h-8 rounded-xl flex items-center justify-center ${
            enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
          }`}
        >
          {enabled ? <Lock className="w-4 h-4" /> : <LockOpen className="w-4 h-4" />}
        </span>
      }
    >
      <div className="space-y-3">
        {enabled ? (
          <Notice
            tone="success"
            text={t('sazlamalar.encEnabledNotice')}
          />
        ) : (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11px] font-semibold text-amber-800 space-y-1">
            <p>{t('sazlamalar.encWarn1')}</p>
            <p>{t('sazlamalar.encWarn2')}</p>
            <p>{t('sazlamalar.encWarn3')}</p>
            <p>{t('sazlamalar.encWarn4')}</p>
          </div>
        )}

        {phase.kind === 'migrating' && (
          <Notice
            tone="info"
            text={t('sazlamalar.encMigrating', { done: phase.done, total: phase.total })}
          />
        )}

        {phase.kind === 'done' && failedCount === 0 && (
          <Notice
            tone="success"
            text={t('sazlamalar.encDone', { count: phase.results.reduce((sum, r) => sum + r.copied, 0) })}
          />
        )}

        {phase.kind === 'done' && failedCount > 0 && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 space-y-1">
            <p className="text-[11px] font-bold text-rose-700">
              {t('sazlamalar.encFailed', { count: failedCount })}
            </p>
            <ul className="text-[10px] font-mono text-rose-600 max-h-28 overflow-y-auto space-y-0.5">
              {phase.results.flatMap((r) =>
                r.failed.map((f) => (
                  <li key={`${r.storeKey}:${f.id}`}>
                    {r.storeKey} · {f.id} — {f.reason}
                  </li>
                ))
              )}
            </ul>
          </div>
        )}

        {phase.kind === 'disabled' && (
          <Notice
            tone="info"
            text={t('sazlamalar.encDisabledNotice')}
          />
        )}

        {(phase.kind === 'done' || phase.kind === 'disabled') && (
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="h-9 px-4 rounded-xl bg-[#0B1F3A] hover:bg-[#163864] text-white font-bold text-xs flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {t('sazlamalar.encRestart')}
          </button>
        )}

        <div className="flex items-center gap-2">
          {!enabled && phase.kind !== 'done' && (
            <button
              type="button"
              disabled={disabled || busy}
              onClick={() => setPhase({ kind: 'confirm-enable' })}
              className="h-9 px-4 rounded-xl bg-[#10b981] hover:bg-[#059669] disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              {t('sazlamalar.encEnable')}
            </button>
          )}
          {enabled && phase.kind === 'idle' && (
            <button
              type="button"
              disabled={disabled || busy}
              onClick={() => setPhase({ kind: 'confirm-disable' })}
              className="h-9 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 font-bold text-xs"
            >
              {t('sazlamalar.encDisable')}
            </button>
          )}
        </div>
      </div>

      {/* Onay penjirsi — şifrlemäni açmak */}
      {phase.kind === 'confirm-enable' && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center space-y-4">
            <p className="font-bold text-gray-800 text-sm">
              {t('sazlamalar.encConfirmEnableTitle')}
            </p>
            <p className="text-[11px] text-gray-500 font-medium">
              {t('sazlamalar.encConfirmEnableHint')}
            </p>
            <div className="flex gap-2 justify-center">
              <button
                type="button"
                onClick={() => setPhase({ kind: 'idle' })}
                className="px-5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs"
              >
                {t('sazlamalar.cancelBtn')}
              </button>
              <button
                type="button"
                onClick={() => void runMigration()}
                className="px-5 py-2 rounded-xl bg-[#10b981] hover:bg-[#059669] text-white font-bold text-xs"
              >
                {t('sazlamalar.continueBtn')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Onay penjirsi — şifrlemäni öçürmek */}
      {phase.kind === 'confirm-disable' && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center space-y-4">
            <p className="font-bold text-gray-800 text-sm">{t('sazlamalar.encConfirmDisableTitle')}</p>
            <p className="text-[11px] text-gray-500 font-medium">
              {t('sazlamalar.encConfirmDisableHint')}
            </p>
            <div className="flex gap-2 justify-center">
              <button
                type="button"
                onClick={() => setPhase({ kind: 'idle' })}
                className="px-5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs"
              >
                {t('sazlamalar.cancelBtn')}
              </button>
              <button
                type="button"
                onClick={runDisable}
                className="px-5 py-2 rounded-xl bg-[#10b981] hover:bg-[#059669] text-white font-bold text-xs"
              >
                {t('sazlamalar.continueBtn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </SettingsCard>
  );
};
