import React from 'react';
import { AlertTriangle, Check } from 'lucide-react';
import type { LanguageCode } from '../../types';
import { useT } from '../../locales/LanguageContext';
import {
  customerTypeText,
  draftBalance,
  isCustomerConflict,
  type ParsedCustomerRow,
} from '../../utils/customerExcel';

interface CustomerImportPreviewTableProps {
  rows: readonly ParsedCustomerRow[];
  conflictKeys: ReadonlySet<string>;
  language: LanguageCode;
}

export const CustomerImportPreviewTable: React.FC<CustomerImportPreviewTableProps> = ({
  rows,
  conflictKeys,
  language,
}) => {
  const t = useT();

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="bg-gray-50/80 text-[10px] font-bold text-gray-500 uppercase border-b border-gray-100">
            <th className="py-2 px-3 w-12 text-center">#</th>
            <th className="py-2 px-3">{t('customers.colFullName')}</th>
            <th className="py-2 px-3">{t('customers.colPhone')}</th>
            <th className="py-2 px-3">{t('customers.colType')}</th>
            <th className="py-2 px-3 text-right">{t('customers.colBalance')}</th>
            <th className="py-2 px-3">{t('excel.colStatus')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {rows.map((row) => {
            const conflict = row.draft ? isCustomerConflict(row.draft, conflictKeys) : false;
            const balance = row.draft ? draftBalance(row.draft) : 0;
            return (
              <tr key={row.rowNumber} className={row.errors.length ? 'bg-rose-50/40' : ''}>
                <td className="py-1.5 px-3 text-center font-mono text-gray-400">{row.rowNumber}</td>
                <td className="py-1.5 px-3 font-semibold text-gray-800 truncate">
                  {row.draft?.name ?? '—'}
                </td>
                <td className="py-1.5 px-3 font-mono text-gray-600">{row.draft?.phone || '—'}</td>
                <td className="py-1.5 px-3 text-gray-600">
                  {row.draft ? customerTypeText(row.draft.type) : '—'}
                </td>
                <td
                  className={`py-1.5 px-3 text-right font-mono font-bold ${
                    balance > 0 ? 'text-rose-600' : balance < 0 ? 'text-emerald-600' : 'text-gray-500'
                  }`}
                >
                  {row.draft ? balance.toFixed(2) : '—'}
                </td>
                <td className="py-1.5 px-3">
                  {row.errors.length > 0 ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600">
                      <AlertTriangle className="w-3 h-3" />
                      {row.errors.join(' · ')}
                    </span>
                  ) : conflict ? (
                    <span className="text-[10px] font-bold text-amber-600">
                      {t('excel.existing')}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                      <Check className="w-3 h-3" />
                      {t('excel.statusNew')}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};