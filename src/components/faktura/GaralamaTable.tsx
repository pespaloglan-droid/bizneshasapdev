import React from 'react';
import { Check, Eye, Inbox, X } from 'lucide-react';
import type { InvoiceRecord, LanguageCode, Targow, TargowRegion } from '../../types';
import { DRAFT_STATUS_LABELS, DRAFT_STATUS_STYLES, regionName } from '../../db/targowService';
import { formatDraftDate } from '../../db/draftService';
import { formatMoney } from '../../utils/money';

interface GaralamaTableProps {
  language: LanguageCode;
  drafts: readonly InvoiceRecord[];
  targows: readonly Targow[];
  regions: readonly TargowRegion[];
  onOpen: (invoice: InvoiceRecord) => void;
  onAccept: (invoice: InvoiceRecord) => void;
  onReject: (invoice: InvoiceRecord) => void;
}

const HEAD =
  'text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 select-none';

function sender(invoice: InvoiceRecord, targows: readonly Targow[]): string {
  const targow = targows.find((item) => item.id === invoice.targowId);
  const who = invoice.createdBy || invoice.cashierName || '—';
  return targow ? `${targow.fullName} · ${who}` : who;
}

export const GaralamaTable: React.FC<GaralamaTableProps> = ({
  language,
  drafts,
  targows,
  regions,
  onOpen,
  onAccept,
  onReject,
}) => (
  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
    <table className="w-full text-left text-xs">
      <thead>
        <tr className={HEAD}>
          <th className="py-3 px-3">Sene / Wagt</th>
          <th className="py-3 px-3">Kim iberdi</th>
          <th className="py-3 px-3">Müşderi</th>
          <th className="py-3 px-3">Etrap</th>
          <th className="py-3 px-3 text-center">Haryt</th>
          <th className="py-3 px-3 text-right">Jemi</th>
          <th className="py-3 px-3 text-center">Status</th>
          <th className="py-3 px-3 text-center">Amal</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {drafts.length === 0 ? (
          <tr>
            <td colSpan={8} className="py-16 text-center text-gray-400">
              <div className="flex flex-col items-center gap-2">
                <Inbox className="w-10 h-10 text-gray-200" />
                <span className="font-semibold text-gray-400 text-xs">
                  {language === 'tm' ? 'Garalama faktura ýok' : 'Taslak fatura yok'}
                </span>
              </div>
            </td>
          </tr>
        ) : (
          drafts.map((invoice) => {
            const status = invoice.draftStatus ?? 'pending';
            const isPending = status === 'pending';
            return (
              <tr
                key={invoice.id}
                onClick={() => onOpen(invoice)}
                className="hover:bg-gray-50/60 transition-colors cursor-pointer"
                title={language === 'tm' ? 'Faktura ekranynda aç' : 'Fatura ekranında aç'}
              >
                <td className="py-3 px-3 whitespace-nowrap">
                  <div className="font-semibold text-gray-800">{formatDraftDate(invoice.createdAt)}</div>
                  <div className="text-[10px] text-gray-400 font-mono">
                    {invoice.device ?? '—'}
                  </div>
                </td>

                <td className="py-3 px-3">
                  <div className="font-semibold text-gray-800">{sender(invoice, targows)}</div>
                  {invoice.createdByRole && (
                    <div className="text-[10px] text-gray-400 font-medium">
                      {invoice.createdByRole}
                    </div>
                  )}
                </td>

                <td className="py-3 px-3 font-semibold text-gray-700">{invoice.customerName}</td>

                <td className="py-3 px-3 text-gray-500">
                  {regionName(regions, invoice.regionId)}
                </td>

                <td className="py-3 px-3 text-center font-mono text-gray-700">
                  {invoice.itemCount}
                </td>

                <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600">
                  {formatMoney(invoice.amountDue)}
                  {invoice.currency && (
                    <span className="text-[10px] text-gray-400 ml-1">{invoice.currency}</span>
                  )}
                </td>

                <td className="py-3 px-3 text-center">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-lg text-[10px] font-bold ${DRAFT_STATUS_STYLES[status]}`}
                  >
                    {DRAFT_STATUS_LABELS[status]}
                  </span>
                </td>

                <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onOpen(invoice)}
                      className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-[#0B1F3A] hover:text-white text-gray-500 transition-colors"
                      title={language === 'tm' ? 'Aç' : 'Aç'}
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    {isPending && (
                      <>
                        <button
                          type="button"
                          onClick={() => onAccept(invoice)}
                          className="w-8 h-8 flex items-center justify-center rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
                          title="Kabul et"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onReject(invoice)}
                          className="w-8 h-8 flex items-center justify-center rounded-xl bg-rose-500 hover:bg-rose-600 text-white transition-colors"
                          title="Ret et"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  </div>
);
