import React from 'react';
import { AlertTriangle, Check } from 'lucide-react';
import type { LanguageCode } from '../../types';
import type { ParsedRow, ProductDraft } from '../../utils/productExcel';
import { formatMoney } from '../../utils/money';

interface ProductImportPreviewTableProps {
  rows: readonly ParsedRow[];
  conflictKeys: ReadonlySet<string>;
  language: LanguageCode;
}

export function isConflictDraft(
  draft: ProductDraft,
  conflictKeys: ReadonlySet<string>
): boolean {
  return (
    conflictKeys.has(`b:${draft.barcode.trim().toLowerCase()}`) ||
    conflictKeys.has(`n:${draft.name.trim().toLowerCase()}`)
  );
}

export const ProductImportPreviewTable: React.FC<ProductImportPreviewTableProps> = ({
  rows,
  conflictKeys,
  language,
}) => {
  const isTm = language === 'tm';

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="bg-gray-50/80 text-[10px] font-bold text-gray-500 uppercase border-b border-gray-100">
            <th className="py-2 px-3 w-12 text-center">#</th>
            <th className="py-2 px-3">Haryt Ady</th>
            <th className="py-2 px-3">Barkod</th>
            <th className="py-2 px-3 text-right">Satyş</th>
            <th className="py-2 px-3">Ýagdaý</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {rows.map((row) => {
            const conflict = row.draft ? isConflictDraft(row.draft, conflictKeys) : false;
            return (
              <tr key={row.rowNumber} className={row.errors.length ? 'bg-rose-50/40' : ''}>
                <td className="py-1.5 px-3 text-center font-mono text-gray-400">
                  {row.rowNumber}
                </td>
                <td className="py-1.5 px-3 font-semibold text-gray-800 truncate">
                  {row.draft?.name ?? '—'}
                </td>
                <td className="py-1.5 px-3 font-mono text-gray-600">
                  {row.draft?.barcode ?? '—'}
                </td>
                <td className="py-1.5 px-3 text-right font-mono text-emerald-600">
                  {row.draft ? formatMoney(row.draft.price) : '—'}
                </td>
                <td className="py-1.5 px-3">
                  {row.errors.length > 0 ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600">
                      <AlertTriangle className="w-3 h-3" />
                      {row.errors.join(' · ')}
                    </span>
                  ) : conflict ? (
                    <span className="text-[10px] font-bold text-amber-600">
                      {isTm ? 'Bar bolan' : 'Mevcut'}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                      <Check className="w-3 h-3" />
                      {isTm ? 'Täze' : 'Yeni'}
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