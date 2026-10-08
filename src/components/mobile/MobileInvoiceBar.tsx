import React, { useMemo, useRef, useState } from 'react';
import {
  Barcode, Check, ChevronDown, Gift, Pencil, Plus,
  ScanLine, Search, User, X as XIcon
} from 'lucide-react';
import type { Customer, InvoiceType, LanguageCode } from '../../types';
import { translations } from '../../locales/i18n';
import { GENERAL_CUSTOMER_ID } from '../../db/customerService';
import { useBarcodeScan } from '../../hooks/useBarcodeScan';
import { generateInvoiceCode, getInvoiceTypeLabel, invoiceTypeOptions } from '../pos/InvoiceControlBar';

interface MobileInvoiceBarProps {
  selectedCustomer: Customer | null;
  barcodeQuery: string;
  invoiceType: InvoiceType;
  invoiceCode: string;
  printCopies: number;
  language: LanguageCode;
  customers?: Customer[];
  allowedInvoiceTypes?: readonly InvoiceType[] | null;
  onCustomerChange: (customer: Customer | null) => void;
  onBarcodeChange: (val: string) => void;
  onInvoiceTypeChange: (type: InvoiceType) => void;
  onInvoiceCodeChange: (code: string) => void;
  onPrintCopiesChange: (copies: number) => void;
  onAddProduct: () => void;
  barcodeInputRef?: React.RefObject<HTMLInputElement>;
  promoCount?: number;
  onOpenPromo?: () => void;
  onOpenCustomerSearch?: () => void;
}

/**
 * Telefon için dikey fatura üst barı — yana kaydırma yok.
 * Satır 1: fatura tipi + müşteri | Satır 2: barkod + kamera + ekle |
 * Satır 3: fatura kodu + adet + promo.
 */
export const MobileInvoiceBar: React.FC<MobileInvoiceBarProps> = ({
  selectedCustomer,
  barcodeQuery,
  invoiceType,
  invoiceCode,
  printCopies,
  language,
  customers = [],
  allowedInvoiceTypes = null,
  onCustomerChange,
  onBarcodeChange,
  onInvoiceTypeChange,
  onInvoiceCodeChange,
  onPrintCopiesChange,
  onAddProduct,
  barcodeInputRef,
  promoCount = 0,
  onOpenPromo,
  onOpenCustomerSearch,
}) => {
  const t = translations[language] || translations.en;
  const [isTypeOpen, setIsTypeOpen] = useState(false);
  const [isCustomerOpen, setIsCustomerOpen] = useState(false);
  const typeRef = useRef<HTMLDivElement>(null);
  const customerRef = useRef<HTMLDivElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);
  const { scanning, scan } = useBarcodeScan();

  const availableTypes = useMemo(() => {
    if (!allowedInvoiceTypes || allowedInvoiceTypes.length === 0) return invoiceTypeOptions;
    return invoiceTypeOptions.filter((o) => allowedInvoiceTypes.includes(o.id));
  }, [allowedInvoiceTypes]);

  const activeType =
    availableTypes.find((o) => o.id === invoiceType) ?? availableTypes[0] ?? invoiceTypeOptions[0];

  const availableCustomers = useMemo(() => {
    const general = customers.find((c) => c.id === GENERAL_CUSTOMER_ID);
    if (!general) return [...customers];
    return [general, ...customers.filter((c) => c.id !== GENERAL_CUSTOMER_ID)];
  }, [customers]);

  const pickType = (type: InvoiceType) => {
    const opt = availableTypes.find((o) => o.id === type) ?? availableTypes[0];
    onInvoiceTypeChange(type);
    onInvoiceCodeChange(generateInvoiceCode(opt.prefix));
    setIsTypeOpen(false);
  };

  const handleCamera = async () => {
    const res = await scan();
    if (res && !res.cancelled && res.value) {
      onBarcodeChange(res.value);
      window.setTimeout(() => onAddProduct(), 120);
    }
  };

  React.useEffect(() => {
    const close = (e: MouseEvent) => {
      if (typeRef.current && !typeRef.current.contains(e.target as Node)) setIsTypeOpen(false);
      if (customerRef.current && !customerRef.current.contains(e.target as Node)) setIsCustomerOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return (
    <div className="flex flex-col gap-2 flex-shrink-0">
      {/* Satır 1: tip + müşteri */}
      <div className="grid grid-cols-2 gap-2">
        <div className="relative" ref={typeRef}>
          <button
            type="button"
            onClick={() => setIsTypeOpen(!isTypeOpen)}
            className={`w-full h-12 px-2 border rounded-2xl text-xs font-bold flex items-center justify-center gap-1 shadow-sm active:scale-[0.98] ${activeType.bgColor} ${activeType.borderColor} ${activeType.color}`}
          >
            <span>{activeType.icon}</span>
            <span className="truncate">{getInvoiceTypeLabel(activeType, language)}</span>
            <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" />
          </button>
          {isTypeOpen && (
            <div className="absolute top-13 left-0 right-0 z-50 bg-white border border-gray-200 rounded-2xl shadow-2xl py-1.5 max-h-[50vh] overflow-y-auto" style={{ top: 52 }}>
              {availableTypes.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => pickType(opt.id)}
                  className="w-full px-3 py-3 text-left flex items-center justify-between active:bg-gray-50"
                >
                  <span className="flex items-center gap-2">
                    <span className={`p-1.5 rounded-lg ${opt.bgColor} ${opt.color}`}>{opt.icon}</span>
                    <span className="text-sm font-bold text-gray-800">{getInvoiceTypeLabel(opt, language)}</span>
                  </span>
                  {opt.id === invoiceType && <Check className="w-4 h-4 text-emerald-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative" ref={customerRef}>
          <button
            type="button"
            onClick={() => setIsCustomerOpen(!isCustomerOpen)}
            className="w-full h-12 px-2 bg-white border border-gray-200 rounded-2xl text-xs font-bold text-gray-800 flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98]"
          >
            <User className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <span className="truncate">{selectedCustomer?.name || t.generalCustomer}</span>
          </button>
          {isCustomerOpen && (
            <div className="absolute left-0 right-0 z-50 bg-white border border-gray-200 rounded-2xl shadow-2xl py-1 max-h-[50vh] overflow-y-auto" style={{ top: 52 }}>
              {availableCustomers.map((cust) => (
                <button
                  key={cust.id}
                  type="button"
                  onClick={() => { onCustomerChange(cust); setIsCustomerOpen(false); }}
                  className="w-full px-4 py-3 text-left active:bg-gray-50 border-b border-gray-50 last:border-0"
                >
                  <span className="block text-sm font-bold text-gray-900">{cust.name}</span>
                  {cust.phone && <span className="text-[11px] text-gray-400 font-mono">{cust.phone}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Satır 2: barkod + kamera + müşteri ara + ekle */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Barcode className="w-5 h-5" />
          </div>
          <input
            ref={barcodeInputRef}
            type="text"
            value={barcodeQuery}
            onChange={(e) => onBarcodeChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onAddProduct(); } }}
            placeholder={t.scanBarcodePlaceholder}
            enterKeyHint="search"
            className="w-full h-12 pl-10 pr-3 bg-white border border-gray-200 focus:border-emerald-500 rounded-2xl text-sm font-mono text-gray-800 shadow-sm"
          />
        </div>
        <button
          type="button"
          onClick={() => void handleCamera()}
          disabled={scanning}
          title="Kamera"
          className="h-12 w-12 flex-shrink-0 flex items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-700 active:scale-95 disabled:opacity-50"
        >
          <ScanLine className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={onOpenCustomerSearch}
          title={language === 'tm' ? 'Müşderi gözle' : 'Müşteri ara'}
          className="h-12 w-12 flex-shrink-0 flex items-center justify-center rounded-2xl bg-white border border-gray-200 text-gray-600 active:scale-95"
        >
          <Search className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={onAddProduct}
          title="Ekle"
          className="h-12 w-12 flex-shrink-0 flex items-center justify-center rounded-2xl bg-emerald-500 text-white shadow active:scale-95"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>
      </div>

      {/* Satır 3: fatura kodu + adet + promo */}
      <div className="flex gap-2">
        <div className={`flex-1 h-12 flex items-center rounded-2xl border shadow-sm overflow-hidden ${activeType.bgColor} ${activeType.borderColor}`}>
          <input
            ref={codeRef}
            type="text"
            value={invoiceCode}
            onChange={(e) => onInvoiceCodeChange(e.target.value)}
            placeholder="Fatura kodu"
            className={`flex-1 h-full px-3 bg-transparent text-sm font-mono font-bold ${activeType.color} outline-none min-w-0`}
          />
          {invoiceCode ? (
            <button
              type="button"
              onClick={() => { onInvoiceCodeChange(''); codeRef.current?.focus(); }}
              className={`px-2.5 h-full ${activeType.color} opacity-60`}
              aria-label="Temizle"
            >
              <XIcon className="w-4 h-4" />
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => { onInvoiceCodeChange(generateInvoiceCode(activeType.prefix)); }}
            className={`px-2.5 h-full ${activeType.color} opacity-70 border-l ${activeType.borderColor}`}
            title="Yeni kod"
          >
            <Pencil className="w-4 h-4" />
          </button>
        </div>
        <button
          type="button"
          onClick={() => onPrintCopiesChange(printCopies === 0 ? 1 : printCopies === 1 ? 2 : 0)}
          className="relative h-12 w-12 flex-shrink-0 rounded-2xl border border-gray-200 bg-white text-gray-700 font-black active:scale-95"
          title="Fiş adedi"
        >
          {printCopies}
        </button>
        <button
          type="button"
          onClick={onOpenPromo}
          className="relative h-12 w-12 flex-shrink-0 rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-600 active:scale-95 flex items-center justify-center"
          title="Promo"
        >
          <Gift className="w-5 h-5" />
          {promoCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-black bg-blue-500 text-white flex items-center justify-center">
              {promoCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};
