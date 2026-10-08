/**
 * İşlem günlüğü görüntüleyici (FAZ 2.2 · MD §3.2 UI).
 * Son kayıtlar en üstte; docType/kullanıcı filtreli; JSON dışa aktarım.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { SettingsCard, Notice, Field, INPUT } from './settingsUi';
import {
  exportAuditLogJson,
  getAuditHealth,
  isAuditEnabled,
  listAuditEntries,
  type AuditEntry,
} from '../../db/auditLog';
import { saveFileAs } from '../../utils/electron';
import { bytesToBase64 } from '../../utils/bhbak';

const ACTION_LABEL: Record<string, string> = {
  CREATE: 'Täze',
  UPDATE: 'Üýtgedi',
  DELETE: 'Pozdy',
  VIEW: 'Gördü',
};

export const AuditLogPanel: React.FC = () => {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [docTypeFilter, setDocTypeFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [notice, setNotice] = useState<{ tone: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await listAuditEntries(300, {
        docType: docTypeFilter || undefined,
        userId: userFilter || undefined,
      });
      setEntries(list);
    } catch (error) {
      setNotice({
        tone: 'error',
        text: `Günlük okunamadı: ${error instanceof Error ? error.message : String(error)}`,
      });
    } finally {
      setLoading(false);
    }
  }, [docTypeFilter, userFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleExport = async () => {
    try {
      const json = await exportAuditLogJson();
      const bytes = new TextEncoder().encode(json);
      const saved = await saveFileAs({
        title: 'Işlem günlügini eksport et',
        defaultName: `audit-log-${new Date().toISOString().slice(0, 10)}.json`,
        data: bytesToBase64(bytes),
        filters: [{ name: 'JSON', extensions: ['json'] }],
      });
      setNotice(
        saved
          ? { tone: 'success', text: 'Günlük .json faýla saklandy.' }
          : { tone: 'info', text: 'Eksport ýatyryldy.' }
      );
    } catch (error) {
      setNotice({
        tone: 'error',
        text: `Eksport başartmady: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  };

  const health = getAuditHealth();
  const docTypes = Array.from(new Set(entries.map((e) => e.docType))).sort();
  const userIds = Array.from(new Set(entries.map((e) => e.userId).filter(Boolean))).sort();

  return (
    <SettingsCard
      title="Işlem günlügi"
      description="Kim, haçan, haýsy ýazgyny üýtgetdi — soňky 300 ýazgy"
    >
      <div className="space-y-3">
        {!isAuditEnabled() && (
          <Notice
            tone="info"
            text="Günlük ýazgysy öçüriýän. Işjeňleşdirmek üçin: Ygtyýarlar → Işlem günlügi."
          />
        )}
        {health.errorCount > 0 && (
          <Notice
            tone="error"
            text={`Günlük ýazgy başartmady (${health.errorCount} gezek): ${health.lastError ?? ''}`}
          />
        )}
        {notice && <Notice tone={notice.tone} text={notice.text} />}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="Ýazgy görnüşi">
            <select
              value={docTypeFilter}
              onChange={(e) => setDocTypeFilter(e.target.value)}
              className={`${INPUT} cursor-pointer font-medium text-gray-800`}
            >
              <option value="">Hemmesi</option>
              {docTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Ulanyjy">
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className={`${INPUT} cursor-pointer font-medium text-gray-800`}
            >
              <option value="">Hemmesi</option>
              {userIds.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </Field>
          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={() => void load()}
              className="h-9 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-[11px] flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Täzele
            </button>
            <button
              type="button"
              onClick={() => void handleExport()}
              className="h-9 px-3 rounded-xl bg-[#0B1F3A] hover:bg-[#163864] text-white font-bold text-[11px] flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Eksport (.json)
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="bg-gray-50 text-gray-500 font-bold">
                <th className="text-left px-3 py-2">Wagt</th>
                <th className="text-left px-3 py-2">Ulanyjy</th>
                <th className="text-left px-3 py-2">Hereket</th>
                <th className="text-left px-3 py-2">Görnüş</th>
                <th className="text-left px-3 py-2">Ýazgy</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-gray-400 font-semibold">
                    Ýüklenýär...
                  </td>
                </tr>
              )}
              {!loading && entries.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-gray-400 font-semibold">
                    Günlük boş — entek üýtgeşme ýazylmady.
                  </td>
                </tr>
              )}
              {!loading &&
                entries.map((entry) => (
                  <React.Fragment key={entry._id}>
                    <tr
                      className={`border-t border-gray-100 ${entry.changes ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                      onClick={() =>
                        entry.changes && setExpandedId(expandedId === entry._id ? null : entry._id)
                      }
                    >
                      <td className="px-3 py-2 font-mono text-gray-600">
                        {new Date(entry.timestamp).toLocaleString('tk-TM')}
                      </td>
                      <td className="px-3 py-2 font-semibold text-gray-700">{entry.userId || '—'}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-lg font-bold ${
                            entry.action === 'DELETE'
                              ? 'bg-rose-100 text-rose-700'
                              : entry.action === 'CREATE'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-sky-100 text-sky-700'
                          }`}
                        >
                          {ACTION_LABEL[entry.action] ?? entry.action}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-mono text-gray-600">{entry.docType}</td>
                      <td className="px-3 py-2 font-mono text-gray-500 truncate max-w-[220px]">
                        {entry.docId}
                        {entry.changes ? ' ▸' : ''}
                      </td>
                    </tr>
                    {expandedId === entry._id && entry.changes && (
                      <tr className="bg-gray-50">
                        <td colSpan={5} className="px-3 py-2">
                          <pre className="text-[10px] font-mono text-gray-600 whitespace-pre-wrap break-all">
                            {JSON.stringify(entry.changes, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </SettingsCard>
  );
};
