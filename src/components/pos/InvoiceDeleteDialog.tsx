import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import type { LanguageCode } from '../../types';
import { useT } from '../../locales/LanguageContext';

interface InvoiceDeleteDialogProps {
  invoiceNo: string;
  customerName: string;
  language: LanguageCode;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Fakturany pozmak üçin tassyklama dialogy.
 * "Hawa, poz" → faktura ýatyrylýar we ähli täsirleriň tersi ýerine ýetirilýär.
 */
export const InvoiceDeleteDialog: React.FC<InvoiceDeleteDialogProps> = ({
  invoiceNo,
  customerName,
  language,
  onConfirm,
  onCancel,
}) => {
  const t = useT();

  return (
    <div className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 select-none animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Başlyk */}
        <div className="px-5 py-4 bg-gradient-to-r from-[#7f1d1d] to-[#b91c1c] text-white flex items-center space-x-3">
          <div className="p-2 rounded-2xl bg-white/15 text-white border border-white/20">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-wide">
              {t('invoices.deleteTitle')}
            </h3>
            <p className="text-[11px] text-red-100 font-mono">{invoiceNo}</p>
          </div>
        </div>

        {/* Mazmun */}
        <div className="px-5 py-5 space-y-3">
          <p className="text-xs text-gray-700 font-medium leading-relaxed">
            {t('invoices.deleteMsg')}
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-[11px] text-amber-800 font-semibold">
            {t('invoices.deleteCascade')}
          </div>
          {customerName && (
            <div className="text-[11px] text-gray-500">
              {t('invoices.customerLabel')}: <span className="font-bold text-gray-700">{customerName}</span>
            </div>
          )}
        </div>

        {/* Düwmeler */}
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-xs transition-colors"
          >
            {t('invoices.cancelBtn')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors shadow-sm flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {t('invoices.confirmDeleteBtn')}
          </button>
        </div>
      </div>
    </div>
  );
};