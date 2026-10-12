import React, { useCallback, useEffect, useRef, useState } from 'react';
import { GitMerge } from 'lucide-react';
import type { LanguageCode } from '../../types';
import { translations, interpolate } from '../../locales/i18n';
import { ConnectionRow } from './ConnectionRow';
import {
  loadConnection,
  resumeLastConnection,
  saveConnection,
  startConnection,
  stopCurrent,
  testAddress,
  type ConnectionKind,
  type LinkStatusMap,
  type MergePrompt,
  type StoredConnection,
  type TransferProgress,
} from '../../db/connectionStore';

export interface ConnectionFieldsProps {
  /** Hesap kimliği — bağlantılar bu hesaba bağlı saklanır. */
  accountId: string;
  /** Veritabanı anahtarı (senkron bu veritabanına yapılır). */
  storeDb: string;
  language: LanguageCode;
  /** PC'den gelen belgeleri içeri alma tetikleyicisi. */
  onDocsChanged?: () => void;
  /** Kompakt görünüm (hesap modalı). */
  compact?: boolean;
}

/**
 * Hesap başına iki CouchDB bağlantısı (Local + Online).
 *
 * Hem ayarlardaki "Bulut eşitleme" panelinde hem de "Yeni Hesap" /
 * "Hesabı Düzenle" ekranlarında kullanılır — tek bileşen, kod tekrarı yok.
 */
export const ConnectionFields: React.FC<ConnectionFieldsProps> = ({
  accountId,
  storeDb,
  language,
  onDocsChanged,
  compact = false,
}) => {
  const t = translations[language]?.conn ?? translations.en.conn;
  const [conn, setConn] = useState<StoredConnection>({ local: '', online: '', active: null });
  const [status, setStatus] = useState<LinkStatusMap>(IDLE);
  const [reveal, setReveal] = useState<Record<ConnectionKind, boolean>>({ local: false, online: false });
  const [busy, setBusy] = useState<ConnectionKind | null>(null);
  const [mergePrompt, setMergePrompt] = useState<MergePrompt | null>(null);
  const [progress, setProgress] = useState<Record<ConnectionKind, TransferProgress | null>>({
    local: null,
    online: null,
  });
  const pendingRef = useRef<((c: 'merge' | 'serverOnly') => void) | null>(null);

  useEffect(() => {
    if (accountId) setConn(loadConnection(accountId));
  }, [accountId]);

  // Uygulama açılışında son aktif bağlantıyı otomatik başlat
  useEffect(() => {
    if (!accountId || !storeDb) return;
    void resumeLastConnection(accountId, storeDb, setStatus, onDocsChanged, language);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId, storeDb]);

  const setField = useCallback(
    (kind: ConnectionKind, value: string) => {
      setConn((prev) => {
        const next = { ...prev, [kind]: value };
        if (accountId) saveConnection(accountId, next);
        return next;
      });
    },
    [accountId]
  );

  const handleToggle = useCallback(
    async (kind: ConnectionKind) => {
      const raw = conn[kind];
      if (status[kind].state === 'connected') {
        stopCurrent();
        setStatus(IDLE);
        const next = { ...conn, active: null };
        setConn(next);
        if (accountId) saveConnection(accountId, next);
        return;
      }
      setBusy(kind);
      const result = await startConnection({
        accountId,
        storeDb,
        kind,
        raw,
        onStatus: setStatus,
        onDocsChanged,
        language,
        onProgress: (p) => setProgress((prev) => ({ ...prev, [kind]: p })),
        onMergeNeeded: (prompt) =>
          new Promise<'merge' | 'serverOnly'>((resolve) => {
            setMergePrompt(prompt);
            pendingRef.current = (choice) => {
              setMergePrompt(null);
              pendingRef.current = null;
              resolve(choice);
            };
          }),
      });
      setBusy(null);
      if (result.ok) onDocsChanged?.();
    },
    [conn, status, accountId, storeDb, onDocsChanged]
  );

  const handleTestOnly = useCallback(
    async (kind: ConnectionKind) => {
      setBusy(kind);
      const r = await testAddress(conn[kind]);
      // Başarılı TEST "bağlı" demek değildir → 'ok' (bağlan düğmesi "başlat" kalır)
      setStatus((prev) => ({
        ...prev,
        [kind]: { state: r.ok ? 'ok' : 'error', message: r.message },
      }));
      setBusy(null);
    },
    [conn]
  );

  const rows: { kind: ConnectionKind; title: string; placeholder: string }[] = [
    {
      kind: 'local',
      title: t.localTitle,
      placeholder: t.localPlaceholder,
    },
    {
      kind: 'online',
      title: t.onlineTitle,
      placeholder: t.onlinePlaceholder,
    },
  ];

  return (
    <>
      <section className="rounded-xl border bg-white p-3 space-y-2">
        <label className="block text-xs font-semibold">{t.historyTitle}
          <select className="block mt-2 w-full border rounded-lg p-2" value={conn.historyMonths ?? 0}
            disabled={busy !== null || status.local.state === 'connected' || status.online.state === 'connected' || conn.active !== null}
            onChange={event => {
              const value = Number(event.target.value);
              const historyMonths: 0 | 3 | 12 = value === 3 || value === 12 ? value : 0;
              const next = { ...conn, historyMonths };
              setConn(next); if (accountId) saveConnection(accountId, next);
            }}>
            <option value={0}>{t.historyAll}</option>
            <option value={3}>{t.historyThree}</option>
            <option value={12}>{t.historyYear}</option>
          </select>
        </label>
        <p className="text-[11px] text-gray-500">{t.historyHint}</p>
      </section>
      {rows.map((r) => (
        <ConnectionRow
          key={r.kind}
          kind={r.kind}
          title={r.title}
          placeholder={r.placeholder}
          value={conn[r.kind]}
          state={status[r.kind].state}
          message={status[r.kind].message}
          busy={busy === r.kind}
          revealed={reveal[r.kind]}
          language={language}
          onChange={(v) => setField(r.kind, v)}
          onToggleReveal={() => setReveal((s) => ({ ...s, [r.kind]: !s[r.kind] }))}
          onToggle={() => void handleToggle(r.kind)}
          onTestOnly={() => void handleTestOnly(r.kind)}
          hint={compact ? undefined : t.firstWorking}
        />
      ))}

      {/* İlk aktarım ilerlemesi — en altta tek kart. */}
      {progress[busy ?? conn.active ?? 'local'] && (
        <TransferProgressBar
          progress={progress[busy ?? conn.active ?? 'local']!}
          language={language}
        />
      )}

      {/* Birleştirme sorusu */}
      {mergePrompt && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-5 w-full max-w-sm space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                <GitMerge className="w-5 h-5" />
              </div>
              <div className="text-sm font-bold text-gray-900">{t.mergeTitle}</div>
            </div>
            <div className="text-xs text-gray-600 leading-relaxed space-y-1.5">
              <p>
                <b>{mergePrompt.localCount}</b> {t.mergeLocalCount},{' '}
                <b>{mergePrompt.remoteCount}</b> {t.mergeRemoteCount}
              </p>
              <p className="text-gray-400">
                <b>{t.mergeKeep}</b>: {t.mergeKeepHint}
                <br />
                <b>{t.mergeServerOnly}</b>: {t.mergeServerOnlyHint}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => pendingRef.current?.('merge')}
                data-testid="merge-yes"
                className="flex-1 h-11 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold"
              >
                {t.mergeKeep}
              </button>
              <button
                type="button"
                onClick={() => pendingRef.current?.('serverOnly')}
                data-testid="merge-server-only"
                className="flex-1 h-11 rounded-xl bg-white border border-rose-200 text-rose-600 text-xs font-bold hover:bg-rose-50"
              >
                {t.mergeServerOnly}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const IDLE: LinkStatusMap = {
  local: { state: 'idle', message: '' },
  online: { state: 'idle', message: '' },
};

/** İlk aktarım ilerlemesi: kaç belge geldi + bittiğinde "Aktarım tamamlandı". */
const TransferProgressBar: React.FC<{
  progress: TransferProgress;
  language: LanguageCode;
}> = ({ progress, language }) => {
  const t = translations[language]?.conn ?? translations.en.conn;
  const { received, sent, done, remoteTotal } = progress;
  const pct = remoteTotal > 0 ? Math.min(100, Math.round((received / remoteTotal) * 100)) : done ? 100 : 0;

  return (
    <div
      data-testid="transfer-progress"
      className={`rounded-2xl border p-3 space-y-2 ${
        done ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-gray-100 shadow-sm'
      }`}
    >
      <div className="flex items-center justify-between text-[11px] font-bold">
        <span className={done ? 'text-emerald-700' : 'text-gray-600'}>
          {done ? t.progressDone : t.progressTransferring}
        </span>
        <span className="font-mono text-gray-500">
          {done ? interpolate(t.docsReceived, { count: received }) : `${received} / ~${remoteTotal}`}
        </span>
      </div>
      <div className="w-full bg-gray-200/70 rounded-full h-2 overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${
            done ? 'bg-emerald-500' : 'bg-sky-500'
          }`}
          style={{ width: `${done ? 100 : pct}%` }}
        />
      </div>
      <div className="text-[10px] text-gray-500">
        {sent > 0 ? `${interpolate(t.docsSent, { count: sent })} · ` : ''}
        {done ? t.liveContinues : t.liveAfterTransfer}
      </div>
    </div>
  );
};

export default ConnectionFields;