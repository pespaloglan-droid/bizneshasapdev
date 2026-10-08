import React from 'react';
import type { CurrencyRate, LanguageCode } from '../../types';

interface CurrencyBaseConfirmDialogProps {
  currency: CurrencyRate;
  currentBaseCode: string;
  language: LanguageCode;
  onCancel: () => void;
  onConfirm: () => void;
}

/** Sabit walyuta değişikliği — kullanıcı bilinçli onaylasın. */
export const CurrencyBaseConfirmDialog: React.FC<CurrencyBaseConfirmDialogProps> = ({
  currency,
  currentBaseCode,
  language,
  onCancel,
  onConfirm,
}) => (
  <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center space-y-4">
      <p className="font-bold text-gray-800 text-sm">
        {language === 'tm'
          ? `${currency.code} esas walýuta edilsinmi?`
          : `${currency.code} esas para birimi yapılsın mı?`}
      </p>

      <p className="text-xs text-gray-500 font-medium leading-relaxed">
        {language === 'tm'
          ? `Bu düzeltme bahalaryň, faturalaryň we hasabatlaryň birimini ${currency.code} eder. Ähli görkezilen ýazgylar üçtgesiz görkezilýär, hasaplar we möçberler üýtgemýär.`
          : `Bu değişiklik fiyat, fatura ve raporlardaki birimi ${currency.code} yapar. Kayıtlı tutarlar değişmez, hesaplar korunur.`}
      </p>

      <p className="text-[11px] text-gray-400 font-medium">
        {language === 'tm' ? 'Öňki esas walýuta' : 'Önceki esas para birimi'}: {currentBaseCode}
      </p>

      <div className="flex gap-3 justify-center">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition-colors"
        >
          Ýatyr
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="px-6 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs transition-colors"
        >
          {language === 'tm' ? 'Üýtget' : 'Değiştir'}
        </button>
      </div>
    </div>
  </div>
);