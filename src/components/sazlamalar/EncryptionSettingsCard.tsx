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
      title="Maglumat bazasyny şifrlemek"
      description="Maglumatlar lisans açaryndan ösdürilýän parol bilen şifrlenýär"
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
            text="Şifrleme işjeň. Maglumat bazasy şifrlenen görnüşde saklanýar; lisanssyz enjamda açylmaz."
          />
        ) : (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11px] font-semibold text-amber-800 space-y-1">
            <p>Şifrleme açylandan soň lisanssyz enjamda maglumat okalyp bilinmez.</p>
            <p>Dowam etmezden öň ätiýaçlyk nusga (.bhbak) alyň.</p>
            <p>Bulut eşitleme ulanylsa, uzak serwerde maglumat şifrlenen galyar.</p>
            <p>Çeşme (şifresiz) maglumat bazasy POZULMAÝAR — islen wagt şifrlemäni öçürip dolanyp bilersiňiz.</p>
          </div>
        )}

        {phase.kind === 'migrating' && (
          <Notice
            tone="info"
            text={`Göçürilýär... ${phase.done}/${phase.total} maglumat bazasy`}
          />
        )}

        {phase.kind === 'done' && failedCount === 0 && (
          <Notice
            tone="success"
            text={`Göçürme tamamlandy: ${phase.results.reduce((s, r) => s + r.copied, 0)} ýazgy nusgalandy we barlandy. Çeşme bazalar saklandy.`}
          />
        )}

        {phase.kind === 'done' && failedCount > 0 && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 space-y-1">
            <p className="text-[11px] font-bold text-rose-700">
              {failedCount} ýazgy göçürilmedi — şifrleme AÇYLMADY. Hiç hili maglumat ýitmedi.
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
            text="Şifrleme öçürildi. Programma täzeden açylanda öňki (şifresiz) maglumat bazasy ulanylar."
          />
        )}

        {(phase.kind === 'done' || phase.kind === 'disabled') && (
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="h-9 px-4 rounded-xl bg-[#0B1F3A] hover:bg-[#163864] text-white font-bold text-xs flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Täzeden başlat (üýtgeşmäniň güýje girmegi üçin)
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
              Maglumat bazasyny şifrle
            </button>
          )}
          {enabled && phase.kind === 'idle' && (
            <button
              type="button"
              disabled={disabled || busy}
              onClick={() => setPhase({ kind: 'confirm-disable' })}
              className="h-9 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 font-bold text-xs"
            >
              Şifrlemäni öçür
            </button>
          )}
        </div>
      </div>

      {/* Onay penjirsi — şifrlemäni açmak */}
      {phase.kind === 'confirm-enable' && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center space-y-4">
            <p className="font-bold text-gray-800 text-sm">
              Ähli hesaplaryň maglumatlary şifrlenen bazaya KOPYALANAR. Dowam etmelimi?
            </p>
            <p className="text-[11px] text-gray-500 font-medium">
              Çeşme maglumat bazasy pozulmaýar. Lisanssyz enjamda şifrlenen maglumat açylmaz.
            </p>
            <div className="flex gap-2 justify-center">
              <button
                type="button"
                onClick={() => setPhase({ kind: 'idle' })}
                className="px-5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs"
              >
                Ýatyr
              </button>
              <button
                type="button"
                onClick={() => void runMigration()}
                className="px-5 py-2 rounded-xl bg-[#10b981] hover:bg-[#059669] text-white font-bold text-xs"
              >
                Dowam et
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Onay penjirsi — şifrlemäni öçürmek */}
      {phase.kind === 'confirm-disable' && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center space-y-4">
            <p className="font-bold text-gray-800 text-sm">Şifrlemäni öçürmek isleýärsiňizmi?</p>
            <p className="text-[11px] text-gray-500 font-medium">
              Programma täzeden açylanda öňki (şifresiz) maglumat bazasy ulanylar. Maglumat ýitmez.
            </p>
            <div className="flex gap-2 justify-center">
              <button
                type="button"
                onClick={() => setPhase({ kind: 'idle' })}
                className="px-5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs"
              >
                Ýatyr
              </button>
              <button
                type="button"
                onClick={runDisable}
                className="px-5 py-2 rounded-xl bg-[#10b981] hover:bg-[#059669] text-white font-bold text-xs"
              >
                Dowam et
              </button>
            </div>
          </div>
        </div>
      )}
    </SettingsCard>
  );
};
