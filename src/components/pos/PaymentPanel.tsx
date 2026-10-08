import React from 'react';
import { Banknote, CreditCard, ClipboardList, ArrowLeftRight } from 'lucide-react';
import { LanguageCode, PaymentMethod } from '../../types';
import { translations } from '../../locales/i18n';
import { CurrencyLabel } from './CurrencyLabel';
import { GaytargyBox } from './GaytargyBox';
import { BASE_CURRENCY_CODE } from '../../db/currencyService';
import { addDaysIso, todayIso } from '../../utils/paymentLabels';

interface PaymentPanelProps {
  amountDue: number;
  paymentMethod: PaymentMethod;
  cashReceived: number;
  language: LanguageCode;
  /** Ýörite rugsatlar: rugsat edilen töleg usullary (null = ählisi). */
  allowedPaymentMethods?: readonly PaymentMethod[] | null;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  onCashReceivedChange: (amount: number) => void;
  actionsSlot?: React.ReactNode;
  selectorsSlot?: React.ReactNode;
  /** Ýaşyl kartoçkanyň aşagynda ýerleşýän Depder saýlaýjy. */
  ledgerSlot?: React.ReactNode;
  /** Nesiýe satuwda öňünden berlen pul we möhlet. */
  creditAdvance: number;
  creditTermDays: number;
  onCreditAdvanceChange: (amount: number) => void;
  onCreditTermDaysChange: (days: number) => void;
}

export const PaymentPanel: React.FC<PaymentPanelProps> = ({
  amountDue,
  paymentMethod,
  cashReceived,
  language,
  allowedPaymentMethods = null,
  onPaymentMethodChange,
  onCashReceivedChange,
  actionsSlot,
  selectorsSlot,
  ledgerSlot,
  creditAdvance,
  creditTermDays,
  onCreditAdvanceChange,
  onCreditTermDaysChange
}) => {
  const t = translations[language] || translations.en;
  const changeDue = Math.max(0, cashReceived - amountDue);

  const allPaymentButtons: { id: PaymentMethod; label: string; icon: React.ReactNode }[] = [
    { id: 'cash', label: t.cashMethod, icon: <Banknote className="w-5 h-5 text-emerald-600" /> },
    { id: 'card', label: t.cardMethod, icon: <CreditCard className="w-5 h-5 text-blue-600" /> },
    { id: 'credit', label: t.creditMethod, icon: <ClipboardList className="w-5 h-5 text-amber-600" /> },
    { id: 'split', label: t.splitMethod, icon: <ArrowLeftRight className="w-5 h-5 text-purple-600" /> },
  ];

  // Ýörite rugsatlar boýunça görnüşlere çäklendirme (null = ählisi açyk).
  const paymentButtons = allowedPaymentMethods && allowedPaymentMethods.length > 0
    ? allPaymentButtons.filter((b) => allowedPaymentMethods.includes(b.id))
    : allPaymentButtons;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 flex space-x-3 shadow-sm w-full flex-shrink-0 overflow-hidden">
      {/* 1. Sol Kolon: ýaşyl kartoçka → Depder → amal ikonlary */}
      <div className="w-[140px] flex flex-col flex-shrink-0 gap-2 min-w-0">
        {/* Ýaşyl Tutar Kartı */}
        <div className="w-full h-[105px] bg-gradient-to-br from-[#10b981] to-[#059669] rounded-xl p-2.5 flex flex-col justify-between text-white shadow-sm flex-shrink-0 select-none">
          <div className="text-[10px] font-bold tracking-wider uppercase opacity-90 truncate">
            {t.amountDueLabel}
          </div>
          <div className="text-3xl font-black font-mono tracking-tight leading-none">
            {amountDue.toFixed(2)}
          </div>
          <div className="text-[9px] font-bold tracking-widest leading-none opacity-80">
            <CurrencyLabel className="text-[9px] font-bold" />
          </div>
          <div className="text-[10px] font-medium opacity-90 truncate">
            {changeDue > 0 ? (
              <span className="bg-white/25 px-1.5 py-0.5 rounded font-mono font-bold">
                {t.changeDueLabel}: {changeDue.toFixed(2)} TMT
              </span>
            ) : (
              <span>Biznes POS</span>
            )}
          </div>
        </div>

        {/* Depder saýlaýjy — galan boşluga görä dikligine merkezleşdirilen */}
        {ledgerSlot && <div className="flex-1 flex items-center min-w-0">{ledgerSlot}</div>}

        {/* Faktura amallarynyň ikonlary */}
        <div className="w-full min-w-0 overflow-hidden flex-shrink-0">
          {actionsSlot}
        </div>
      </div>

      {/* 2. Sag Kolon: Ammar/Sene → Alnan Nagt → Gaytargy → Töleg usullary */}
      <div className="flex-1 flex flex-col gap-2.5 min-w-0">
        <div className="w-full">
          {selectorsSlot}
        </div>

        <div className="flex flex-col gap-2">
          {/* Alnan Nagt / Nesiýe meýdanlary */}
          {paymentMethod === 'credit' ? (
            <div className="space-y-1">
              <div className="grid grid-cols-2 gap-1.5">
                <div>
                  <label className="block text-[9px] font-bold text-gray-500 mb-0.5">
                    Öňünden berlen pul
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={creditAdvance === 0 ? '' : creditAdvance}
                    onChange={(e) => onCreditAdvanceChange(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full h-8 px-2 text-right bg-gray-50/80 border border-gray-200 focus:bg-white focus:border-emerald-500 rounded-lg text-[11px] font-mono font-bold text-gray-800 placeholder-gray-400 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-gray-500 mb-0.5">
                    Nesiýe möhleti (gün)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={creditTermDays === 0 ? '' : creditTermDays}
                    onChange={(e) => onCreditTermDaysChange(parseInt(e.target.value) || 0)}
                    placeholder="30"
                    className="w-full h-8 px-2 text-right bg-gray-50/80 border border-amber-300 focus:bg-white focus:border-amber-500 rounded-lg text-[11px] font-mono font-bold text-gray-800 placeholder-gray-400 outline-none transition-all"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] font-bold">
                <span className="text-amber-700">
                  Galan bergi: {Math.max(0, amountDue - creditAdvance).toFixed(2)} TMT
                </span>
                {creditTermDays > 0 && (
                  <span className="text-gray-500 font-mono">
                    {addDaysIso(todayIso(), creditTermDays)}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-gray-700 whitespace-nowrap">
                {t.cashReceivedLabel}:
              </span>
              <div className="flex-1 relative">
                <input
                  type="number"
                  step="0.01"
                  value={cashReceived === 0 ? '' : cashReceived}
                  onChange={(e) => onCashReceivedChange(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full h-8 pl-2.5 pr-10 text-right bg-gray-50/80 border border-gray-200 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg text-sm font-mono font-bold text-gray-800 placeholder-gray-400 transition-all"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-gray-400 pointer-events-none">
                  <CurrencyLabel className="text-[9px] font-bold text-gray-400" />
                </span>
              </div>
            </div>
          )}

          {/* Gaytargy — Alnan Nagt bilen töleg usullarynyň arasynda */}
          <GaytargyBox change={changeDue} currencyCode={BASE_CURRENCY_CODE} language={language} />

          {/* Ödeme Metodu Butonları — iň aşakda */}
          <div className="grid grid-cols-4 gap-1.5">
            {paymentButtons.map((btn) => {
              const isSelected = paymentMethod === btn.id;
              return (
                <button
                  key={btn.id}
                  type="button"
                  onClick={() => onPaymentMethodChange(btn.id)}
                  className={`py-1.5 px-1 rounded-xl border flex flex-col items-center justify-center transition-all ${
                    isSelected
                      ? 'border-[#10b981] bg-emerald-50/90 ring-2 ring-[#10b981]/30 shadow-xs'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="mb-0.5">{btn.icon}</div>
                  <span className="text-[11px] font-bold text-gray-900 leading-tight truncate w-full text-center">{btn.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};