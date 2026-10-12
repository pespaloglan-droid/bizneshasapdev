import React from 'react';
import { useT } from '../locales/LanguageContext';
import { cellText, type SheetData } from '../utils/excelIO';
import type { ExcelColumnSelection, ImportColumn } from '../utils/excelColumnMapping';

interface ExcelColumnMappingPanelProps<Key extends string> {
  data: SheetData;
  columns: readonly ImportColumn<Key>[];
  selection: ExcelColumnSelection<Key>;
  isValid: boolean;
  onHeaderChange: (index: number) => void;
  onColumnChange: (key: Key, index: number | undefined) => void;
  onConfirm: () => void;
}

export function ExcelColumnMappingPanel<Key extends string>({
  data, columns, selection, isValid, onHeaderChange, onColumnChange, onConfirm,
}: ExcelColumnMappingPanelProps<Key>) {
  const t = useT();
  const row = data[selection.headerIndex] ?? [];
  return (
    <section className="rounded-xl border border-amber-200 bg-amber-50/50 p-3 space-y-3">
      <div className="font-bold text-xs text-gray-800">{t('excel.mapColumns')}</div>
      <p className="text-[11px] text-gray-600">{t('excel.mappingHint')}</p>
      <label className="flex items-center gap-2 text-xs font-semibold">
        {t('excel.headerRow')}
        <input
          type="number" min={1} max={Math.max(1, data.length - 1)}
          value={selection.headerIndex + 1}
          onChange={(e) => onHeaderChange(Number(e.target.value) - 1)}
          className="w-24 h-9 rounded-lg border border-gray-300 px-2"
        />
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {columns.map((column) => {
          const index = selection.mapping[column.key];
          const ambiguous = selection.ambiguousKeys?.includes(column.key);
          return (
            <label key={column.key} className="space-y-1 text-xs font-semibold min-w-0">
              <span className="block">
                {column.header}
                {column.required && <span className="ml-1 text-rose-600">{t('excel.requiredColumn')}</span>}
              </span>
              <select
                value={ambiguous ? 'ambiguous' : index === undefined ? '' : String(index)}
                onChange={(e) => onColumnChange(column.key, e.target.value === '' ? undefined : Number(e.target.value))}
                className="w-full h-9 rounded-lg border border-gray-300 px-2 bg-white"
              >
                {ambiguous && <option value="ambiguous" disabled>{t('excel.mappingAmbiguous')}</option>}
                <option value="">{t('excel.unmappedColumn')}</option>
                {row.map((header, sourceIndex) => (
                  <option
                    key={sourceIndex} value={sourceIndex}
                    disabled={columns.some((other) =>
                      other.key !== column.key && selection.mapping[other.key] === sourceIndex
                    )}
                  >
                    {t('excel.sourceColumn', {
                      column: sourceIndex + 1,
                      header: cellText(header) || t('excel.emptyHeader'),
                    })}
                  </option>
                ))}
              </select>
              {index !== undefined && (
                <span className="block text-[10px] font-normal text-gray-500 truncate">
                  {t('excel.sampleCell', { value: cellText(data[selection.headerIndex + 1]?.[index]) })}
                </span>
              )}
            </label>
          );
        })}
      </div>
      {!isValid && <p className="text-[11px] text-rose-600">{t('excel.mappingRequired')}</p>}
      <button
        type="button" disabled={!isValid} onClick={onConfirm}
        className="h-9 px-3 rounded-lg bg-emerald-600 disabled:opacity-40 text-white text-xs font-bold"
      >
        {t('excel.applyMapping')}
      </button>
    </section>
  );
}
