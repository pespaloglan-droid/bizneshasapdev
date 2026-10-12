import React, { useState } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { Account, LanguageCode } from '../../types';
import { translations } from '../../locales/i18n';
import { useT } from '../../locales/LanguageContext';
import { importStoreData } from '../../db/settingsService';
import { decodeBhbak } from '../../utils/bhbak';

interface ImportDataModalProps {
  account: Account;
  language: LanguageCode;
  storeDb: string;
  onClose: () => void;
}

export const ImportDataModal: React.FC<ImportDataModalProps> = ({
  account,
  language,
  storeDb,
  onClose,
}) => {
  const t = translations[language] || translations.en;
  const tt = useT();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imported, setImported] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setSelectedFile(e.target.files[0]);
      setError(null);
      setIsSuccess(false);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;
    setIsImporting(true);
    setError(null);
    try {
      const bytes = new Uint8Array(await selectedFile.arrayBuffer());
      const json = await decodeBhbak(bytes);
      const count = await importStoreData(storeDb, json);
      setImported(count);
      setIsSuccess(true);
      setTimeout(() => onClose(), 1400);
    } catch {
      setError(tt('modals.importFailed'));
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200 animate-in zoom-in-95 max-h-[420px] flex flex-col">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gray-50/80 flex-shrink-0">
          <h3 className="text-sm font-bold text-gray-800 flex items-center space-x-2">
            <Upload className="w-4 h-4 text-emerald-600" />
            <span>{t.import}</span>
          </h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700 rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3 flex-1 overflow-y-auto">
          <p className="text-[11px] text-gray-500">
            <span className="font-semibold text-gray-700">"{account.name}"</span>
            {tt('modals.accountFileHint')}
          </p>

          <label className="border-2 border-dashed border-gray-300 hover:border-emerald-500 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer bg-gray-50/50 hover:bg-emerald-50/30 transition-all">
            <input
              type="file"
              accept=".bhbak,.json,application/octet-stream"
              onChange={handleFileChange}
              className="hidden"
            />
            {selectedFile ? (
              <div className="flex flex-col items-center text-center">
                <FileText className="w-7 h-7 text-emerald-600 mb-1" />
                <span className="text-xs font-semibold text-gray-800 truncate max-w-[200px]">{selectedFile.name}</span>
                <span className="text-[10px] text-gray-400 font-mono">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center">
                <Upload className="w-6 h-6 text-gray-400 mb-1" />
                <span className="text-xs font-medium text-gray-700">
                  {tt('modals.clickToPick')}
                </span>
                <span className="text-[10px] text-gray-400">{tt('modals.bhbakNote')}</span>
              </div>
            )}
          </label>

          {error && (
            <div className="flex items-center space-x-2 text-rose-700 text-xs font-semibold bg-rose-50 p-2 rounded-lg border border-rose-100">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isSuccess && (
            <div className="flex items-center space-x-2 text-emerald-700 text-xs font-semibold bg-emerald-50 p-2 rounded-lg border border-emerald-100">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>
                {tt('modals.importedCount', { count: imported })}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end space-x-2 p-3 border-t border-gray-100 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {t.cancel}
          </button>
          <button
            type="button"
            disabled={!selectedFile || isImporting || isSuccess}
            onClick={() => void handleImport()}
            className="px-4 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg shadow-sm transition-all"
          >
            {isImporting ? tt('modals.importing') : t.import}
          </button>
        </div>
      </div>
    </div>
  );
};
