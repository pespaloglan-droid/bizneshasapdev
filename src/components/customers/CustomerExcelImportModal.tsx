import React, { useMemo, useRef, useState } from 'react';
import { AlertTriangle, Download, FileSpreadsheet, Loader2, Upload, X } from 'lucide-react';
import type { Customer, LanguageCode } from '../../types';
import { useT } from '../../locales/LanguageContext';
import { describeReadError } from '../../utils/excelIO';
import {
  customerConflictKeys,
  isCustomerConflict,
  parseCustomerRows,
  readCustomerFile,
  type ParsedCustomerRow,
  type CustomerDraft,
} from '../../utils/customerExcel';
import { exportCustomerTemplateStyled } from '../../utils/styledExports';
import { saveImportErrorReport, type ImportErrorRow } from '../../utils/importErrorReport';
import { CustomerImportPreviewTable } from './CustomerImportPreviewTable';

export interface ImportSummary {
  added: number;
  updated: number;
  skipped: number;
  /** Maglumat bazasyna ýazylmadyk setirler (setir № + sebäp). */
  failed: ImportErrorRow[];
}

/** Geçerli bir parse setiri — garalama + hakyky Excel setir belgisi. */
export interface CustomerImportEntry {
  readonly draft: CustomerDraft;
  readonly rowNumber: number;
}

interface CustomerExcelImportModalProps {
  language: LanguageCode;
  customers: readonly Customer[];
  accountName: string;
  onClose: () => void;
  onImport: (
    entries: readonly CustomerImportEntry[],
    mode: 'overwrite' | 'skip'
  ) => ImportSummary | Promise<ImportSummary>;
}

export const CustomerExcelImportModal: React.FC<CustomerExcelImportModalProps> = ({
  language,
  customers,
  accountName,
  onClose,
  onImport,
}) => {
  const t = useT();
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState<ParsedCustomerRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'overwrite' | 'skip'>('overwrite');
  const [summary, setSummary] = useState<ImportSummary | null>(null);

  const conflictKeys = useMemo(() => customerConflictKeys(customers), [customers]);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError('');
    setSummary(null);
    setIsLoading(true);
    setFileName(file.name);
    try {
      const data = await readCustomerFile(file);
      setRows(parseCustomerRows(data));
    } catch (err) {
      setRows([]);
      setError(describeReadError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const validRows = rows.filter((row) => row.draft !== null);
  const errorRows = rows.filter((row) => row.errors.length > 0);
  const conflictCount = validRows.filter(
    (row) => row.draft && isCustomerConflict(row.draft, conflictKeys)
  ).length;

  const handleImport = async () => {
    const entries: CustomerImportEntry[] = validRows
      .map((row) => ({ draft: row.draft, rowNumber: row.rowNumber }))
      .filter((entry): entry is CustomerImportEntry => entry.draft !== null);
    if (entries.length === 0) return;
    setIsImporting(true);
    try {
      setSummary(await onImport(entries, mode));
    } catch (err) {
      // Toplu ýazgy şowsuzlygy — setirler aýratyn ýalňyşlyk hökmünde görkezilýär.
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsImporting(false);
    }
  };

  const handleDownloadErrorReport = () => {
    if (!summary || summary.failed.length === 0) return;
    void saveImportErrorReport({
      accountName,
      fileName: 'musderi-import-yalnyslyklar.xlsx',
      title: t('excel.errorReportTitleCustomers'),
      detailHeader: t('excel.detailHeaderPhone'),
      rows: summary.failed,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]">
        <div className="px-5 py-4 bg-gradient-to-r from-[#0B1F3A] to-[#163864] text-white flex items-center justify-between flex-shrink-0">
          <span className="font-bold text-sm tracking-wide flex items-center gap-2">
            <Upload className="w-4 h-4" />
            {t('excel.importModalTitleCustomers')}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-3 overflow-y-auto flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="h-10 px-4 rounded-xl bg-[#10b981] hover:bg-[#059669] text-white font-bold text-xs flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              {t('excel.selectFile')}
            </button>
            <button
              type="button"
              onClick={() => void exportCustomerTemplateStyled(accountName, 'musderi-sablon.xlsx')}
              className="h-10 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              {t('excel.downloadTemplate')}
            </button>
            {fileName && (
              <span className="text-[11px] font-semibold text-gray-500 font-mono truncate">
                {fileName}
              </span>
            )}
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={(e) => {
                void handleFile(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
          </div>

          {isLoading && (
            <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              {t('excel.readingFile')}
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              {error}
            </div>
          )}

          {summary && (
            <div
              className={`text-xs font-semibold rounded-xl px-3 py-2 space-y-0.5 border ${
                summary.failed.length > 0
                  ? 'text-rose-700 bg-rose-50 border-rose-200'
                  : 'text-emerald-700 bg-emerald-50 border-emerald-100'
              }`}
            >
              <div className="font-bold">{t('excel.importDone')}</div>
              <div>
                {summary.added} {t('excel.importAdded')} · {summary.updated}{' '}
                {t('excel.importUpdated')} · {summary.skipped} {t('excel.importSkipped')}
              </div>
              {summary.failed.length > 0 && (
                <div className="font-bold">
                  {t('excel.failedSummary', {
                    total: summary.added + summary.updated + summary.failed.length,
                    written: summary.added + summary.updated,
                    failed: summary.failed.length,
                  })}
                </div>
              )}
            </div>
          )}

          {summary && summary.failed.length > 0 && (
            <div className="rounded-xl border border-rose-200 bg-rose-50/60 px-3 py-2 space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-rose-700">
                  {t('excel.failedRows')}
                </span>
                <button
                  type="button"
                  onClick={handleDownloadErrorReport}
                  className="h-8 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  {t('excel.errorReport')}
                </button>
              </div>
              <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                {summary.failed.map((failure, index) => (
                  <div
                    key={index}
                    className="text-[11px] font-semibold text-rose-600 flex items-baseline gap-2"
                  >
                    <span className="font-mono font-bold shrink-0">#{failure.row}</span>
                    <span className="truncate">
                      {failure.name}
                      {failure.detail ? ` · ${failure.detail}` : ''}
                    </span>
                    <span className="text-rose-400 shrink-0">— {failure.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {rows.length > 0 && !summary && (
            <>
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl border border-gray-200 bg-[#F8FAFC] px-3 py-2">
                  <div className="text-[10px] font-bold text-gray-400 uppercase">
                    {t('excel.validRow')}
                  </div>
                  <div className="font-mono font-bold text-emerald-600">{validRows.length}</div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-[#F8FAFC] px-3 py-2">
                  <div className="text-[10px] font-bold text-gray-400 uppercase">
                    {t('excel.existing')}
                  </div>
                  <div className="font-mono font-bold text-amber-600">{conflictCount}</div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-[#F8FAFC] px-3 py-2">
                  <div className="text-[10px] font-bold text-gray-400 uppercase">
                    {t('excel.errorRow')}
                  </div>
                  <div className="font-mono font-bold text-rose-600">{errorRows.length}</div>
                </div>
              </div>

              {conflictCount > 0 && (
                <div className="flex items-center gap-3 flex-wrap rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
                  <span className="text-[11px] font-bold text-amber-800">
                    {t('excel.existingCustomers')}
                  </span>
                  {(
                    [
                      { id: 'overwrite', label: t('excel.overwriteAll') },
                      { id: 'skip', label: t('excel.skipAll') },
                    ] as const
                  ).map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setMode(option.id)}
                      className={`h-8 px-3 rounded-lg text-[11px] font-bold transition-all ${
                        mode === option.id
                          ? 'bg-amber-500 text-white'
                          : 'bg-white text-gray-600 border border-gray-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}

              <CustomerImportPreviewTable rows={rows} conflictKeys={conflictKeys} language={language} />
            </>
          )}

          {rows.length === 0 && !error && !isLoading && (
            <div className="text-[11px] font-semibold text-gray-400 text-center py-6">
              {t('excel.selectFileHint')}
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs"
          >
            {summary ? t('excel.closeBtn') : t('cancel')}
          </button>
          {rows.length > 0 && !summary && (
            <button
              type="button"
              onClick={() => void handleImport()}
              disabled={validRows.length === 0 || isImporting}
              className="h-9 px-5 rounded-xl bg-[#10b981] hover:bg-[#059669] disabled:opacity-40 text-white font-bold text-xs flex items-center gap-2"
            >
              {isImporting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isImporting
                ? t('excel.writing')
                : t('excel.importBtn', { count: validRows.length })}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};