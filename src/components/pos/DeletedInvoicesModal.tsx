import React, { useState } from 'react';
import { Trash2, X } from 'lucide-react';
import type { InvoiceRecord, LanguageCode } from '../../types';
import { deleteInvoicePermanently } from '../../db/salesService';
import { useT } from '../../locales/LanguageContext';
import { localeFor } from '../../utils/locale';

interface DeletedInvoicesModalProps {
  invoices: readonly InvoiceRecord[];
  storeDb: string;
  language: LanguageCode;
  onClose: () => void;
  /** Pozulan ýazgylaryň ID-leri — çağyryjy öz sanawyndan hem aýyrýar. */
  onDeleted: (ids: string[]) => void;
}

const HEAD = 'text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 select-none';

function formatWhen(iso: string | undefined, language: LanguageCode): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(localeFor(language), {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

/**
 * Silinen (status:'voided') fakturalar — diňe administrator.
 * F9 bilen hem, Sazlamalar → "Silinen fakturalar" bilen hem şu bileşen açylýar.
 */
export const DeletedInvoicesModal: React.FC<DeletedInvoicesModalProps> = ({
  invoices,
  storeDb,
  language,
  onClose,
  onDeleted,
}) => {
  const t = useT();
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [confirmMode, setConfirmMode] = useState<'' | 'selected' | 'all'>('');
  const [busy, setBusy] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelected(next);
  };

  const toggleAll = () => {
    if (selected.size === invoices.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(invoices.map((inv) => inv.id)));
    }
  };

  const runDelete = async (ids: string[]) => {
    if (ids.length === 0) return;
    setBusy(true); setDeleteError('');
    const removedIds: string[] = [];
    try {
      for (const id of ids) {
        try { if (await deleteInvoicePermanently(id, storeDb)) removedIds.push(id); }
        catch { /* Diğer kayıtlara devam; yalnız başarılı ID'leri bildir. */ }
      }
      const failed = ids.filter(id => !removedIds.includes(id));
      setSelected(new Set(failed));
      setConfirmMode('');
      if (removedIds.length) onDeleted(removedIds);
      if (failed.length) setDeleteError(t('pos.invoiceDeleteFailed', { count: failed.length }));
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]">
        <div className="px-5 py-4 bg-gradient-to-r from-[#0B1F3A] to-[#163864] text-white flex items-center justify-between flex-shrink-0">
          <span className="font-bold text-sm tracking-wide">
            {t('invoices.deletedTitle')}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 min-h-0">
          {invoices.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <Trash2 className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <span className="font-semibold text-gray-400 text-xs">
                {t('invoices.deletedEmpty')}
              </span>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className={HEAD}>
                  <th className="py-2.5 px-3">
                    <input
                      type="checkbox"
                      checked={selected.size === invoices.length && invoices.length > 0}
                      onChange={toggleAll}
                      className="w-3.5 h-3.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                  </th>
                  <th className="py-2.5 px-3">{t('invoices.deletedColNo')}</th>
                  <th className="py-2.5 px-3">{t('invoices.deletedColDate')}</th>
                  <th className="py-2.5 px-3">{t('invoices.customerLabel')}</th>
                  <th className="py-2.5 px-3 text-right">{t('invoices.deletedColAmount')}</th>
                  <th className="py-2.5 px-3">{t('invoices.deletedColAt')}</th>
                  <th className="py-2.5 px-3">{t('invoices.deletedColBy')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-2 px-3">
                      <input
                        type="checkbox"
                        checked={selected.has(inv.id)}
                        onChange={() => toggle(inv.id)}
                        className="w-3.5 h-3.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                    </td>
                    <td className="py-2 px-3 font-mono font-bold text-gray-700">{inv.invoiceNo}</td>
                    <td className="py-2 px-3 text-gray-500">{formatWhen(inv.createdAt, language)}</td>
                    <td className="py-2 px-3 text-gray-700">{inv.customerName || '—'}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-gray-800">
                      {inv.amountDue.toFixed(2)} TMT
                    </td>
                    <td className="py-2 px-3 text-gray-500">{formatWhen(inv.voidedAt, language)}</td>
                    <td className="py-2 px-3 text-gray-600">{inv.voidedBy || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {deleteError && <p role="alert" className="text-red-700 text-xs px-4 py-2">{deleteError}</p>}
        <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-4 py-2.5 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs"
          >
            {t('invoices.closeShort')}
          </button>
          <button
            type="button"
            disabled={selected.size === 0 || busy}
            onClick={() => setConfirmMode('selected')}
            className="h-9 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {t('invoices.deleteSelected', { count: selected.size })}
          </button>
          <button
            type="button"
            disabled={invoices.length === 0 || busy}
            onClick={() => setConfirmMode('all')}
            className="h-9 px-4 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {t('invoices.deleteAll')}
          </button>
        </div>
      </div>

      {confirmMode && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-5">
            <div className="text-sm font-bold text-gray-800 mb-1">
              {t('invoices.permTitle')}
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              {confirmMode === 'all'
                ? t('invoices.permAllMsg')
                : t('invoices.permSelectedMsg', { count: selected.size })}
            </p>
            <div className="flex justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setConfirmMode('')}
                className="h-9 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs"
              >
                {t('invoices.permCancel')}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void runDelete(confirmMode === 'all' ? invoices.map((i) => i.id) : [...selected])}
                className="h-9 px-5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs"
              >
                {t('invoices.permConfirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};