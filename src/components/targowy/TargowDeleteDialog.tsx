import React from 'react';
import type { LanguageCode, Targow } from '../../types';

interface TargowDeleteDialogProps {
  targow: Targow;
  language: LanguageCode;
  orderCount: number;
  onCancel: () => void;
  onConfirmDelete: () => void;
  onDeactivate: () => void;
}

export const TargowDeleteDialog: React.FC<TargowDeleteDialogProps> = ({
  targow,
  language,
  orderCount,
  onCancel,
  onConfirmDelete,
  onDeactivate,
}) => (
  <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 text-center space-y-4">
      <p className="font-bold text-gray-800 text-sm">
        {language === 'tm'
          ? `"${targow.fullName}" targowçyny pozmak isleýärsiňizmi?`
          : `"${targow.fullName}" targowçısını silmek istiyor musunuz?`}
      </p>

      {orderCount > 0 && (
        <p className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
          {language === 'tm'
            ? `Bu targowçynyň ${orderCount} sargydy bar. Pozmak ýerine Işjeň däl etmek maslahat berilýär.`
            : `Bu targowçının ${orderCount} siparişi var. Silmek yerine Pasif yapmanız önerilir.`}
        </p>
      )}

      <div className="flex gap-2 justify-center flex-wrap">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition-colors"
        >
          Ýatyr
        </button>
        {orderCount > 0 ? (
          <button
            type="button"
            onClick={onDeactivate}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition-colors"
          >
            Işjeň däl et
          </button>
        ) : (
          <button
            type="button"
            onClick={onConfirmDelete}
            className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs transition-colors"
          >
            Pozmak
          </button>
        )}
      </div>
    </div>
  </div>
);
