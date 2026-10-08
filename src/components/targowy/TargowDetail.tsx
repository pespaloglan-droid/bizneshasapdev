import React from 'react';
import { ArrowLeft, Award, Phone } from 'lucide-react';
import type { InvoiceRecord, LanguageCode, Targow, TargowRegion } from '../../types';
import {
  DRAFT_STATUS_LABELS,
  DRAFT_STATUS_STYLES,
  currentWindow,
  dailyTotals,
  ordersFor,
  regionName,
  statsFor,
} from '../../db/targowService';
import { formatMoney } from '../../utils/money';
import { PageScroll } from '../common/PageScroll';

interface TargowDetailProps {
  targow: Targow;
  regions: readonly TargowRegion[];
  invoices: readonly InvoiceRecord[];
  language: LanguageCode;
  onBack: () => void;
}

export const TargowDetail: React.FC<TargowDetailProps> = ({
  targow,
  regions,
  invoices,
  language,
  onBack,
}) => {
  const todayStats = statsFor(invoices, targow.id, currentWindow('today'));
  const weekStats = statsFor(invoices, targow.id, currentWindow('week'));
  const monthStats = statsFor(invoices, targow.id, currentWindow('month'));
  const orders = ordersFor(invoices, targow.id, currentWindow('all')).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
  const sparkline = dailyTotals(invoices, targow.id, 14);
  const peak = Math.max(...sparkline, 1);
  const progress =
    targow.monthlyTarget > 0
      ? Math.min(100, Math.round((monthStats.totalAmount / targow.monthlyTarget) * 100))
      : 0;

  const perf = [
    { key: 'today', label: language === 'tm' ? 'Şu gün' : 'Bugün', stats: todayStats },
    { key: 'week', label: language === 'tm' ? 'Şu hepde' : 'Bu hafta', stats: weekStats },
    { key: 'month', label: language === 'tm' ? 'Şu aý' : 'Bu ay', stats: monthStats },
  ];

  return (
    <div className="flex-1 flex flex-col bg-[#F1F5F9] overflow-hidden">
      <PageScroll>
      <div className="px-3 md:px-6 pt-3 md:pt-5 pb-3 space-y-3">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-4 flex-wrap">
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-[#0B1F3A] hover:text-white text-gray-500 transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center font-bold text-emerald-700 flex-shrink-0">
            {targow.fullName.slice(0, 2).toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-gray-900 truncate">{targow.fullName}</div>
            <div className="flex items-center gap-2 text-[11px] text-gray-500 font-medium mt-0.5">
              <Phone className="w-3 h-3 text-gray-400" />
              {targow.phone}
              <span className="text-gray-300">·</span>
              <span className="text-emerald-600 font-bold">
                {targow.commissionRate}% {language === 'tm' ? 'komissiýa' : 'komisyon'}
              </span>
            </div>
            <div className="flex flex-wrap gap-1 mt-1.5">
              {targow.regionIds.map((id) => (
                <span
                  key={id}
                  className="px-2 py-0.5 rounded-lg bg-sky-50 text-sky-700 text-[10px] font-bold"
                >
                  {regionName(regions, id)}
                </span>
              ))}
            </div>
          </div>

          <span
            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
              targow.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
            }`}
          >
            {targow.isActive ? 'Işjeň' : 'Işjeň däl'}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {perf.map((item) => (
            <div key={item.key} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                {item.label}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-mono font-bold text-lg text-emerald-600">
                  {formatMoney(item.stats.totalAmount)}
                </span>
                <span className="text-[11px] font-bold text-gray-400">
                  {item.stats.orderCount} {language === 'tm' ? 'sargyt' : 'sipariş'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {targow.monthlyTarget > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider inline-flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-500" />
                {language === 'tm' ? 'Aýlyk meýilnama' : 'Aylık hedef'}
              </span>
              <span className="text-[11px] font-bold text-gray-700 font-mono">
                {formatMoney(monthStats.totalAmount)} / {formatMoney(targow.monthlyTarget)} · {progress}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  progress >= 100 ? 'bg-emerald-500' : 'bg-amber-400'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
            {language === 'tm' ? 'Soňky 14 gün' : 'Son 14 gün'}
          </div>
          <div className="flex items-end gap-1 h-16">
            {sparkline.map((value, index) => (
              <span
                key={index}
                className={`flex-1 rounded-sm ${value > 0 ? 'bg-emerald-400' : 'bg-gray-100'}`}
                style={{ height: `${Math.max(6, (value / peak) * 100)}%` }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="px-3 md:px-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 select-none">
                <th className="py-3 px-4">Sene</th>
                <th className="py-3 px-4">Müşderi</th>
                <th className="py-3 px-4">Etrap</th>
                <th className="py-3 px-4 text-center">Haryt</th>
                <th className="py-3 px-4 text-right">Tutar</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Faktura</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-gray-400 font-semibold text-xs">
                    {language === 'tm' ? 'Sargyt ýok' : 'Sipariş yok'}
                  </td>
                </tr>
              ) : (
                orders.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3 px-4 text-gray-600 whitespace-nowrap">
                      {new Date(invoice.createdAt).toLocaleString('tr-TR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-800">{invoice.customerName}</td>
                    <td className="py-3 px-4 text-gray-500">{regionName(regions, invoice.regionId)}</td>
                    <td className="py-3 px-4 text-center font-mono text-gray-700">
                      {invoice.itemCount}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                      {formatMoney(invoice.amountDue)}
                      {invoice.currency && (
                        <span className="text-[10px] text-gray-400 ml-1">{invoice.currency}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {invoice.draftStatus ? (
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                            DRAFT_STATUS_STYLES[invoice.draftStatus]
                          }`}
                        >
                          {DRAFT_STATUS_LABELS[invoice.draftStatus]}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-[10px] text-gray-500">
                      {invoice.invoiceNo}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      </PageScroll>
    </div>
  );
};
