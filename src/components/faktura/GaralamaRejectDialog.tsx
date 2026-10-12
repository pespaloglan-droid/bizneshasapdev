import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { InvoiceRecord, LanguageCode } from '../../types';
import { useT } from '../../locales/LanguageContext';

interface GaralamaRejectDialogProps {
  language: LanguageCode;
  invoice: InvoiceRecord;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}

export const GaralamaRejectDialog: React.FC<GaralamaRejectDialogProps> = ({
  language,
  invoice,
  onCancel,
  onConfirm,
}) => {
  const t = useT();
  const [reason, setReason] = useState('');

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-5 py-4 bg-gradient-to-r from-rose-500 to-rose-600 text-white flex items-center justify-between">
          <span className="font-bold text-sm tracking-wide">
            {t('faktura.rejectTitle')}
          </span>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-xl hover:bg-white/10 text-white/80 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <p className="text-xs text-gray-600 font-medium">
            {invoice.invoiceNo} · {invoice.customerName}
          </p>
          <p className="text-[11px] font-semibold text-gray-500">
            {t('faktura.rejectHint')}
          </p>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 mb-1">
              {t('faktura.rejectReasonLabel')}
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              autoFocus
              className="w-full h-9 px-3 border border-gray-200 rounded-xl text-sm bg-[#F8FAFC] focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="h-9 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs"
            >
              Ýatyr
            </button>
            <button
              type="button"
              onClick={() => onConfirm(reason.trim())}
              className="h-9 px-5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs"
            >
              Ret et
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
