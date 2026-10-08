import React, { useMemo, useRef, useState } from 'react';
import { AlertTriangle, Download, FileSpreadsheet, Loader2, Upload, X } from 'lucide-react';
import type { LanguageCode, Product } from '../../types';
import type { MeasurementUnit } from '../../db/unitService';
import {
  describeReadError,
  parseRows,
  readProductFile,
  type ParsedRow,
  type ProductDraft,
} from '../../utils/productExcel';
import { exportProductTemplateStyled } from '../../utils/styledExports';
import {
  ProductImportPreviewTable,
  isConflictDraft,
} from './ProductImportPreviewTable';

interface ImportSummary {
  added: number;
  updated: number;
  skipped: number;
}

interface ProductExcelImportModalProps {
  language: LanguageCode;
  products: readonly Product[];
  units: readonly MeasurementUnit[];
  accountName: string;
  onClose: () => void;
  onImport: (drafts: readonly ProductDraft[], mode: 'overwrite' | 'skip') => ImportSummary;
}

export const ProductExcelImportModal: React.FC<ProductExcelImportModalProps> = ({
  language,
  products,
  units,
  accountName,
  onClose,
  onImport,
}) => {
  const isTm = language === 'tm';
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'overwrite' | 'skip'>('overwrite');
  const [summary, setSummary] = useState<ImportSummary | null>(null);

  // Bar bolan harytlar (barkod ýa-da at boýunça gabat gelme)
  const conflictKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const product of products) {
      keys.add(`b:${product.barcode.trim().toLowerCase()}`);
      keys.add(`n:${product.name.trim().toLowerCase()}`);
    }
    return keys;
  }, [products]);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError('');
    setSummary(null);
    setIsLoading(true);
    setFileName(file.name);
    try {
      const data = await readProductFile(file);
      setRows(parseRows(data, units));
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
    (row) => row.draft && isConflictDraft(row.draft, conflictKeys)
  ).length;

  const handleImport = () => {
    const drafts = validRows
      .map((row) => row.draft)
      .filter((draft): draft is ProductDraft => draft !== null);
    if (drafts.length === 0) return;
    setSummary(onImport(drafts, mode));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]">
        <div className="px-5 py-4 bg-gradient-to-r from-[#0B1F3A] to-[#163864] text-white flex items-center justify-between flex-shrink-0">
          <span className="font-bold text-sm tracking-wide flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Excel-den getir (Import)
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
              {isTm ? 'Excel faýl saýla' : 'Excel dosyası seç'}
            </button>
            <button
              type="button"
              onClick={() => void exportProductTemplateStyled(units, accountName, language, 'haryt-sablon.xlsx')}
              className="h-10 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              {isTm ? 'Nusga faýly ýükle' : 'Örnek şablon indir'}
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
              {isTm ? 'Faýl okalýar...' : 'Dosya okunuyor...'}
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              {error}
            </div>
          )}

          {summary && (
            <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2 space-y-0.5">
              <div className="font-bold">
                {isTm ? 'Import tamamlandy' : 'İçe aktarma tamamlandı'}
              </div>
              <div>
                {summary.added} {isTm ? 'goşuldy' : 'eklendi'} · {summary.updated}{' '}
                {isTm ? 'täzelendi' : 'güncellendi'} · {summary.skipped}{' '}
                {isTm ? 'geçildi' : 'atlandı'}
              </div>
            </div>
          )}

          {rows.length > 0 && !summary && (
            <>
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl border border-gray-200 bg-[#F8FAFC] px-3 py-2">
                  <div className="text-[10px] font-bold text-gray-400 uppercase">
                    {isTm ? 'Dogry setir' : 'Geçerli satır'}
                  </div>
                  <div className="font-mono font-bold text-emerald-600">{validRows.length}</div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-[#F8FAFC] px-3 py-2">
                  <div className="text-[10px] font-bold text-gray-400 uppercase">
                    {isTm ? 'Bar bolan' : 'Mevcut'}
                  </div>
                  <div className="font-mono font-bold text-amber-600">{conflictCount}</div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-[#F8FAFC] px-3 py-2">
                  <div className="text-[10px] font-bold text-gray-400 uppercase">
                    {isTm ? 'Hataly setir' : 'Hatalı satır'}
                  </div>
                  <div className="font-mono font-bold text-rose-600">{errorRows.length}</div>
                </div>
              </div>

              {conflictCount > 0 && (
                <div className="flex items-center gap-3 flex-wrap rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
                  <span className="text-[11px] font-bold text-amber-800">
                    {isTm ? 'Bar bolan harytlar üçin:' : 'Mevcut ürünler için:'}
                  </span>
                  {(
                    [
                      { id: 'overwrite', label: isTm ? 'Hemmesini üstüne ýaz' : 'Tümünü güncelle' },
                      { id: 'skip', label: isTm ? 'Hemmesini geç' : 'Tümünü atla' },
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

              <ProductImportPreviewTable
                rows={rows}
                conflictKeys={conflictKeys}
                language={language}
              />
            </>
          )}

          {rows.length === 0 && !error && !isLoading && (
            <div className="text-[11px] font-semibold text-gray-400 text-center py-6">
              {isTm
                ? 'Excel faýly saýlaň — setirler şu ýerde görkeziler.'
                : 'Excel dosyası seçin — satırlar burada görünecek.'}
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs"
          >
            {summary ? (isTm ? 'Ýap' : 'Kapat') : isTm ? 'Ýatyr' : 'İptal'}
          </button>
          {rows.length > 0 && !summary && (
            <button
              type="button"
              onClick={handleImport}
              disabled={validRows.length === 0}
              className="h-9 px-5 rounded-xl bg-[#10b981] hover:bg-[#059669] disabled:opacity-40 text-white font-bold text-xs"
            >
              {isTm ? `Import et (${validRows.length})` : `İçe aktar (${validRows.length})`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};