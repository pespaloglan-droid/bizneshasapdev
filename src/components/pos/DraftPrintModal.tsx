import React, { useEffect, useMemo, useState } from 'react';
import { Printer, X } from 'lucide-react';
import type {
  CartItem,
  Customer,
  InvoiceRecord,
  LanguageCode,
  ReceiptSettings,
} from '../../types';
import { buildThermalReceiptHtml } from '../../utils/receiptHtml';
import { listPrintersOrEmpty, printHtmlOrFallback } from '../../utils/electron';
import { useT } from '../../locales/LanguageContext';

interface DraftPrintModalProps {
  language: LanguageCode;
  items: readonly CartItem[];
  subtotal: number;
  discountTotal: number;
  invoiceCode: string;
  selectedCustomer: Customer | null;
  storeName: string;
  settings: ReceiptSettings;
  onClose: () => void;
}

/**
 * F12 — häzirki sepedi (garalama) öňünden görkezip yazdyryjy saýlap çap edýär.
 */
export const DraftPrintModal: React.FC<DraftPrintModalProps> = ({
  language,
  items,
  subtotal,
  discountTotal,
  invoiceCode,
  selectedCustomer,
  storeName,
  settings,
  onClose,
}) => {
  const t = useT();
  const [printers, setPrinters] = useState<{ name: string; displayName: string; isDefault: boolean }[]>([]);
  const [deviceName, setDeviceName] = useState('');
  const [notice, setNotice] = useState('');

  // Yazdyryjylary ýükle (bir gezek).
  useEffect(() => {
    let cancelled = false;
    void listPrintersOrEmpty().then((list) => {
      if (cancelled) return;
      setPrinters(
        list.map((p) => ({
          name: p.name,
          displayName: p.displayName ?? p.name,
          isDefault: p.isDefault ?? false,
        }))
      );
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const draft: InvoiceRecord = useMemo(
    () => ({
      id: `draft-${Date.now()}`,
      invoiceNo: invoiceCode || 'FAKTURA',
      invoiceType: 'sales',
      customerId: selectedCustomer?.id ?? null,
      customerName: selectedCustomer?.name ?? '',
      items: [...items],
      itemCount: items.reduce((sum, item) => sum + item.qty, 0),
      subtotal,
      discountTotal,
      taxTotal: 0,
      amountDue: subtotal - discountTotal,
      paymentMethod: 'cash',
      cashReceived: subtotal - discountTotal,
      changeDue: 0,
      status: 'completed',
      createdAt: new Date().toISOString(),
      cashierName: '',
    }),
    [items, subtotal, discountTotal, invoiceCode, selectedCustomer]
  );

  const html = buildThermalReceiptHtml(draft, settings, storeName, '', language);

  const handlePrint = async () => {
    setNotice('');
    const ok = await printHtmlOrFallback({
      html,
      deviceName: deviceName || undefined,
      paperWidth: settings.paperWidth,
      pageSize: undefined,
      landscape: false,
    });
    setNotice(
      ok
        ? t('pos.dpPrinted')
        : t('pos.dpPrintFailed')
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
        <div className="px-5 py-4 bg-gradient-to-r from-[#0B1F3A] to-[#163864] text-white flex items-center justify-between flex-shrink-0">
          <span className="font-bold text-sm tracking-wide">
            {t('pos.dpTitle', { no: draft.invoiceNo })}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-3 p-4 flex-1 min-h-0 overflow-hidden">
          {/* Öňünden görkeziş */}
          <div className="flex-1 min-h-0 bg-gray-50 rounded-xl overflow-auto p-2">
            <iframe
              title={t('pos.dpPreview')}
              srcDoc={html}
              className="w-full h-full min-h-[420px]"
            />
          </div>

          {/* Yazdyryjy saýlama */}
          <div className="w-64 flex flex-col gap-3 flex-shrink-0 bg-white border border-gray-200 rounded-xl p-3">
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              {t('pos.dpPrinter')}
            </div>
            <select
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              className="w-full h-9 px-2 border border-gray-200 rounded-lg text-[11px] text-gray-700 bg-[#F8FAFC] focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="">{t('pos.dpDefaultPrinter')}</option>
              {printers.map((printer) => (
                <option key={printer.name} value={printer.name}>
                  {printer.displayName}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handlePrint}
              className="h-10 px-4 rounded-xl bg-[#10b981] hover:bg-[#059669] text-white font-bold text-xs flex items-center gap-2 transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4" />
              {t('pos.dpPrintBtn')}
            </button>
            {notice && (
              <div className="text-[10px] font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-2 py-1.5">
                {notice}
              </div>
            )}
            <p className="text-[10px] text-gray-400 leading-snug">
              {t('pos.dpNote')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};