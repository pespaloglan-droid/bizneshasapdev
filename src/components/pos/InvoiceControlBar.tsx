import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  User, ChevronDown, Barcode, Plus,
  ShoppingCart, ShoppingBag, RotateCcw, CornerDownLeft,
  ArrowDownToLine, ArrowUpFromLine, Warehouse, Check,
  Pencil, Gift, Search, X as XIcon
} from 'lucide-react';
import { Customer, InvoiceType, LanguageCode } from '../../types';
import { translations } from '../../locales/i18n';
import { GENERAL_CUSTOMER_ID } from '../../db/customerService';

interface InvoiceControlBarProps {
  selectedCustomer: Customer | null;
  barcodeQuery: string;
  invoiceType: InvoiceType;
  invoiceCode: string;
  printCopies: number;
  language: LanguageCode;
  customers?: Customer[];
  /** Ýörite rugsatlar: rugsat edilen faktura görnüşleri (null = ählisi). */
  allowedInvoiceTypes?: readonly InvoiceType[] | null;
  onCustomerChange: (customer: Customer | null) => void;
  onBarcodeChange: (val: string) => void;
  onInvoiceTypeChange: (type: InvoiceType) => void;
  onInvoiceCodeChange: (code: string) => void;
  onPrintCopiesChange: (copies: number) => void;
  onAddProduct: () => void;
  /** Şift açar sözümi üçin — daşardan focus berilýär. */
  barcodeInputRef?: React.RefObject<HTMLInputElement>;
  /** Aktiw promolaryň sany (ýaşyl PROMO ikonundaky rozet). */
  promoCount?: number;
  onOpenPromo?: () => void;
  /** Müşderi gözle penjiresini açýar (🔍 / F2). */
  onOpenCustomerSearch?: () => void;
}

export interface InvoiceTypeOption {
  readonly id: InvoiceType;
  prefix: string;          // Faktura kodu öneki (SAT, ALY, IAD, BIA, GIR, CIK, AMB)
  labelTm: string;
  labelTr: string;
  labelEn: string;
  labelRu: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
}

export const invoiceTypeOptions: InvoiceTypeOption[] = [
  {
    id: 'sales', prefix: 'SAT',
    labelTm: 'Satuw (Çykyş)', labelTr: 'Satış', labelEn: 'Sales Invoice', labelRu: 'Расходная (Продажа)',
    icon: <ShoppingCart className="w-3.5 h-3.5" />,
    color: 'text-emerald-700', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200'
  },
  {
    id: 'purchase', prefix: 'ALY',
    labelTm: 'Satyn Alyş (Giriş)', labelTr: 'Alış', labelEn: 'Purchase Invoice', labelRu: 'Приходная (Покупка)',
    icon: <ShoppingBag className="w-3.5 h-3.5" />,
    color: 'text-blue-700', bgColor: 'bg-blue-50', borderColor: 'border-blue-200'
  },
  {
    id: 'sales_return', prefix: 'IAD',
    labelTm: 'Yzyna gaýtarmak (Müşderiden)', labelTr: 'İade (Müşteriden)', labelEn: 'Sales Return', labelRu: 'Возврат от клиента',
    icon: <RotateCcw className="w-3.5 h-3.5" />,
    color: 'text-amber-700', bgColor: 'bg-amber-50', borderColor: 'border-amber-200'
  },
  {
    id: 'purchase_return', prefix: 'BIA',
    labelTm: 'Yzyna gaýtarmak (Üpjün edijä)', labelTr: 'Bizden İade (Tedarikçiye)', labelEn: 'Purchase Return', labelRu: 'Возврат поставщику',
    icon: <CornerDownLeft className="w-3.5 h-3.5" />,
    color: 'text-orange-700', bgColor: 'bg-orange-50', borderColor: 'border-orange-200'
  },
  {
    id: 'other_in', prefix: 'GIR',
    labelTm: 'Başga Giriş', labelTr: 'Farklı Giriş', labelEn: 'Other Entry', labelRu: 'Другой приход',
    icon: <ArrowDownToLine className="w-3.5 h-3.5" />,
    color: 'text-indigo-700', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-200'
  },
  {
    id: 'other_out', prefix: 'CIK',
    labelTm: 'Başga Çykyş', labelTr: 'Farklı Çıkış', labelEn: 'Other Exit', labelRu: 'Другой расход',
    icon: <ArrowUpFromLine className="w-3.5 h-3.5" />,
    color: 'text-rose-700', bgColor: 'bg-rose-50', borderColor: 'border-rose-200'
  },
  {
    id: 'warehouse_move', prefix: 'AMB',
    labelTm: 'Ammarlaryň Hereketleri', labelTr: 'Ambarlar Arası Hareket', labelEn: 'Warehouse Transfer', labelRu: 'Перемещение склада',
    icon: <Warehouse className="w-3.5 h-3.5" />,
    color: 'text-purple-700', bgColor: 'bg-purple-50', borderColor: 'border-purple-200'
  }
];

export function getInvoiceTypeLabel(opt: InvoiceTypeOption, lang: LanguageCode): string {
  if (lang === 'tm') return opt.labelTm;
  if (lang === 'tr') return opt.labelTr;
  if (lang === 'ru') return opt.labelRu;
  return opt.labelEn;
}

/** Yeni faktura kodu döret: PREFIX.MM/YY-SIRA */
export function generateInvoiceCode(prefix: string): string {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yy = String(now.getFullYear()).slice(-2);
  const seq = Math.floor(1 + Math.random() * 999);
  return `${prefix}.${mm}/${yy}-${seq}`;
}

export const InvoiceControlBar: React.FC<InvoiceControlBarProps> = ({
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
  const [isInvoiceTypeOpen, setIsInvoiceTypeOpen] = useState(false);
  const [isCustomerOpen, setIsCustomerOpen] = useState(false);
  const invoiceDropdownRef = useRef<HTMLDivElement>(null);
  const customerDropdownRef = useRef<HTMLDivElement>(null);
  const codeInputRef = useRef<HTMLInputElement>(null);

  // Ýörite rugsatlar boýunça görnüşlere çäklendirme (null = ählisi açyk).
  const availableInvoiceTypes = useMemo(() => {
    if (!allowedInvoiceTypes || allowedInvoiceTypes.length === 0) return invoiceTypeOptions;
    return invoiceTypeOptions.filter((o) => allowedInvoiceTypes.includes(o.id));
  }, [allowedInvoiceTypes]);

  const activeInvoiceType =
    availableInvoiceTypes.find((o) => o.id === invoiceType) ??
    availableInvoiceTypes[0] ??
    invoiceTypeOptions[0];

  // "Umumy Müşderi" hakyky ýazgy — sanawyň başynda dursun.
  const availableCustomers: Customer[] = useMemo(() => {
    const general = customers.find((customer) => customer.id === GENERAL_CUSTOMER_ID);
    if (!general) return [...customers];
    return [general, ...customers.filter((customer) => customer.id !== GENERAL_CUSTOMER_ID)];
  }, [customers]);

  // Dışarı tıklandığında dropdown'ları kapat
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (invoiceDropdownRef.current && !invoiceDropdownRef.current.contains(e.target as Node)) {
        setIsInvoiceTypeOpen(false);
      }
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(e.target as Node)) {
        setIsCustomerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onAddProduct();
    }
  };

  // Kalem ikonuna basıldığında otomatik yeni kod döret
  const handleGenerateCode = useCallback(() => {
    const newCode = generateInvoiceCode(activeInvoiceType.prefix);
    onInvoiceCodeChange(newCode);
    // Kalem sadece yeni kod döredýär — input zaten görünür durumda
    codeInputRef.current?.focus();
  }, [activeInvoiceType.prefix, onInvoiceCodeChange]);

  // Faktura tipi değiştiğinde kodu da güncelle
  const handleInvoiceTypeChange = (type: InvoiceType) => {
    const opt = availableInvoiceTypes.find((o) => o.id === type) ?? availableInvoiceTypes[0];
    onInvoiceTypeChange(type);
    onInvoiceCodeChange(generateInvoiceCode(opt.prefix));
    setIsInvoiceTypeOpen(false);
  };

  return (
    <div className="flex items-center space-x-1.5 mb-2.5 flex-shrink-0">

      {/* 1. Faktura / Belge Tipi Seçici */}
      <div className="relative flex-shrink-0" ref={invoiceDropdownRef}>
        <button
          type="button"
          onClick={() => setIsInvoiceTypeOpen(!isInvoiceTypeOpen)}
          className={`h-10 px-3 border rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all hover:shadow-md whitespace-nowrap
            ${activeInvoiceType.bgColor} ${activeInvoiceType.borderColor} ${activeInvoiceType.color}`}
        >
          <span>{activeInvoiceType.icon}</span>
          <span className="max-w-[120px] truncate">{getInvoiceTypeLabel(activeInvoiceType, language)}</span>
          <ChevronDown className={`w-3 h-3 flex-shrink-0 transition-transform ${isInvoiceTypeOpen ? 'rotate-180' : ''}`} />
        </button>

        {isInvoiceTypeOpen && (
          <div className="absolute top-11 left-0 z-50 w-56 bg-white border border-gray-200 rounded-xl shadow-2xl py-1.5 animate-in fade-in slide-in-from-top-1 duration-100">
            <div className="px-3 py-1 mb-1 border-b border-gray-100">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Faktura Görnüşi / Belgesi</span>
            </div>
            {availableInvoiceTypes.map((opt) => {
              const isActive = opt.id === invoiceType;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleInvoiceTypeChange(opt.id)}
                  className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-gray-50 transition-colors ${isActive ? 'bg-gray-50' : ''}`}
                >
                  <div className="flex items-center space-x-2.5">
                    <span className={`p-1 rounded-md ${opt.bgColor} ${opt.color}`}>{opt.icon}</span>
                    <div className="flex flex-col">
                      <span className={`text-xs font-bold ${isActive ? opt.color : 'text-gray-700'}`}>
                        {getInvoiceTypeLabel(opt, language)}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono">{opt.prefix}.MM/YY-#</span>
                    </div>
                  </div>
                  {isActive && <Check className={`w-3.5 h-3.5 ${opt.color} flex-shrink-0`} />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Müşderi / Cari Seçici */}
      <div className="relative flex-shrink-0" ref={customerDropdownRef}>
        <button
          type="button"
          onClick={() => setIsCustomerOpen(!isCustomerOpen)}
          className="h-10 px-3 bg-white border border-gray-200 hover:border-gray-300 rounded-xl text-xs font-bold text-gray-800 flex items-center space-x-2 shadow-sm transition-all min-w-[180px] justify-between"
        >
          <div className="flex items-center space-x-1.5 truncate">
            <div className="p-1 rounded-lg bg-gray-100 text-gray-600 flex-shrink-0">
              <User className="w-3.5 h-3.5" />
            </div>
            <span className="truncate text-xs">{selectedCustomer?.name || t.generalCustomer}</span>
          </div>
          <ChevronDown className={`w-3 h-3 text-gray-500 flex-shrink-0 transition-transform ${isCustomerOpen ? 'rotate-180' : ''}`} />
        </button>

        {isCustomerOpen && (
          <div className="absolute top-11 left-0 z-50 w-64 bg-white border border-gray-200 rounded-xl shadow-xl py-1 text-xs animate-in fade-in slide-in-from-top-1 duration-100">
            {availableCustomers.map((cust) => (
              <button
                key={cust.id}
                type="button"
                onClick={() => {
                  onCustomerChange(cust);
                  setIsCustomerOpen(false);
                }}
                className="w-full px-3.5 py-2.5 text-left hover:bg-gray-50 transition-colors flex flex-col border-b border-gray-50 last:border-0"
              >
                <span className="font-bold text-gray-900">{cust.name}</span>
                {cust.phone && <span className="text-[10px] text-gray-400 font-mono mt-0.5">{cust.phone}</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 2b. Müşderi gözle (🔍 / F2) */}
      <button
        type="button"
        onClick={onOpenCustomerSearch}
        className="h-10 w-10 flex-shrink-0 flex items-center justify-center bg-white border border-gray-200 hover:border-emerald-400 hover:text-emerald-600 rounded-xl text-gray-600 shadow-sm transition-all active:scale-95"
        title={language === 'tm' ? 'Müşderi gözle (F2)' : 'Müşteri ara (F2)'}
      >
        <Search className="w-4 h-4" />
      </button>

      {/* 3. Barkod Girişi — sağ kenarında tek "+" ikonu */}
      <div className="relative" style={{ width: '200px', flexShrink: 0 }}>
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
          <Barcode className="w-4 h-4" />
        </div>
        <input
          ref={barcodeInputRef}
          type="text"
          value={barcodeQuery}
          onChange={(e) => onBarcodeChange(e.target.value)}
          onKeyDown={handleBarcodeKeyDown}
          placeholder={t.scanBarcodePlaceholder}
          className="w-full h-10 pl-9 pr-9 bg-white border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl text-xs font-mono font-medium text-gray-800 placeholder-gray-400 transition-all shadow-sm"
        />
        {/* + ikonu (sağ kenar) */}
        <button
          type="button"
          onClick={onAddProduct}
          title="Haryt goş (Enter)"
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-emerald-600 hover:text-emerald-700 transition-colors"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>

      {/* 4. Faktura Kodu Alanı — her zaman düzenlenebilir sabit input */}
      <div
        className={`h-10 flex items-center rounded-xl border shadow-sm transition-all flex-shrink-0 overflow-hidden
          ${activeInvoiceType.bgColor} ${activeInvoiceType.borderColor}`}
        style={{ width: '175px' }}
      >
        {/* Kod — her zaman doğrudan düzenlenebilir input */}
        <input
          ref={codeInputRef}
          type="text"
          value={invoiceCode}
          onChange={(e) => onInvoiceCodeChange(e.target.value)}
          placeholder="KOD..."
          className={`flex-1 h-full px-3 bg-transparent text-xs font-mono font-bold ${activeInvoiceType.color} outline-none min-w-0`}
          style={{ caretColor: 'currentColor' }}
        />

        {/* X — kodu sil */}
        {invoiceCode && (
          <button
            type="button"
            onClick={() => { onInvoiceCodeChange(''); codeInputRef.current?.focus(); }}
            className={`px-1.5 h-full flex items-center ${activeInvoiceType.color} opacity-60 hover:opacity-100 transition-opacity flex-shrink-0`}
            title="Kody aýyr"
          >
            <XIcon className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Kalem — Sadece yeni kod döret (layout değişmez) */}
        <button
          type="button"
          onClick={handleGenerateCode}
          className={`px-2 h-full flex items-center ${activeInvoiceType.color} opacity-60 hover:opacity-100 border-l ${activeInvoiceType.borderColor} transition-opacity flex-shrink-0`}
          title="Täze kod dör"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 5. Çek Adet Seçici — Printer ikonu + rozet (1→2→0→1) */}
      <button
        type="button"
        onClick={() => {
          // 1 → 2 → 0 → 1 döngüsü
          const next = printCopies === 0 ? 1 : printCopies === 1 ? 2 : 0;
          onPrintCopiesChange(next);
        }}
        title={`Çek sany: ${printCopies === 0 ? 'Çek çykarma' : printCopies + ' sany çek'}`}
        className={`relative h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-xl border shadow-sm transition-all hover:shadow-md active:scale-95
          ${printCopies === 0
            ? 'bg-gray-100 border-gray-200 text-gray-400'
            : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700'
          }`}
      >
        {/* Yazıcı İkonu */}
        <svg
          viewBox="0 0 24 24"
          className="w-5 h-5"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/>
        </svg>

        {/* Rozet — adet sayısı */}
        <span
          className={`absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-black flex items-center justify-center leading-none transition-all
            ${printCopies === 0
              ? 'bg-gray-300 text-gray-600'
              : printCopies === 1
              ? 'bg-blue-500 text-white'
              : 'bg-emerald-500 text-white'
            }`}
        >
          {printCopies}
        </span>
      </button>

      {/* 6. PROMO — ýaşyl ikon, ýazýjynyň ýanynda, san rozeti bilen */}
      <button
        type="button"
        onClick={onOpenPromo}
        title={`Promo (${promoCount})`}
        className="relative h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 shadow-sm transition-all hover:shadow-md active:scale-95"
      >
        <Gift className="w-5 h-5" />
        {promoCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-black flex items-center justify-center leading-none bg-blue-500 text-white">
            {promoCount}
          </span>
        )}
      </button>

    </div>
  );
};