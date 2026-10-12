import React, { useEffect, useRef, useState } from 'react';
import { Printer, CheckCircle, X, Download } from 'lucide-react';
import { InvoiceRecord, LanguageCode, PrinterMode, ReceiptSettings } from '../../types';
import { useT } from '../../locales/LanguageContext';
import { playPrinterMotorSound } from '../../utils/audio';
import { formatIsoDate, invoicePaymentLabel } from '../../utils/paymentLabels';
import { printInvoice } from '../../utils/receiptHtml';
import { localeFor } from '../../utils/locale';
import { StandardInvoicePreview } from '../sazlamalar/StandardInvoicePreview';

interface ReceiptModalProps {
  invoice: InvoiceRecord;
  storeName: string;
  language: LanguageCode;
  authCode?: string;
  onClose: () => void;
  /** Çap sazlamalary (berilse täze çap ulgamy işjeňleşýär). */
  settings?: ReceiptSettings | null;
  /** 'standard' → A4, aksiýada termal çek. */
  printerMode?: PrinterMode;
  /** Depder ady (A4 çapda görkezilip bilner). */
  ledgerName?: string;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  invoice,
  storeName,
  language,
  authCode,
  onClose,
  settings,
  printerMode = 'receipt',
  ledgerName
}) => {
  const t = useT();
  const receiptRef = useRef<HTMLDivElement>(null);
  const [printNotice, setPrintNotice] = useState<string | null>(null);
  const autoPrintedRef = useRef(false);
  const isStandard = printerMode === 'standard';

  // Nesiýe satuwda: diňe öňünden berlen pul tölenen hasaplanýar,
  // galany müşderiniň bergisi bolup galýar.
  const isCredit = invoice.paymentMethod === 'credit';
  const paidNow = isCredit ? invoice.paidAmount ?? 0 : invoice.amountDue;
  const remaining = isCredit ? invoice.remainingDebt ?? invoice.amountDue : 0;

  // Açılışta otomatik termal yazıcı motor sesi efekti
  useEffect(() => {
    playPrinterMotorSound();
  }, []);

  const handlePrint = async () => {
    playPrinterMotorSound();
    if (!settings) {
      window.print();
      return;
    }
    setPrintNotice(null);
    const result = await printInvoice(invoice, settings, printerMode, storeName, language, authCode, ledgerName);
    if (!result.success) {
      setPrintNotice(t('pos.printFailed', { reason: result.failureReason || t('pos.unknownError') }));
    }
  };

  // Awtomatik çap (diňe termal režimde we sazlamada açyk bolsa)
  useEffect(() => {
    if (!settings?.autoPrint || isStandard || autoPrintedRef.current) return;
    autoPrintedRef.current = true;
    void handlePrint();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formattedDate = new Date(invoice.createdAt).toLocaleString(
    localeFor(language),
    {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }
  );

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150 overflow-y-auto">
      <div className={`bg-white rounded-2xl shadow-2xl border border-gray-200 w-full ${isStandard && settings ? 'max-w-3xl' : 'max-w-sm'} overflow-hidden flex flex-col my-auto animate-in slide-in-from-bottom-3 duration-200`}>
        {/* Modal Başlık Çubuğu */}
        <div className="bg-[#0B1F3A] text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-2">
            <div className="p-1 rounded-md bg-emerald-500/20 text-emerald-400">
              <CheckCircle className="w-4 h-4" />
            </div>
            <span className="font-bold text-xs">{t('receiptTitle')}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Gerçekçi Termal Fiş / Çek Önizleme Alanı */}
        <div className="p-4 bg-gray-100 flex justify-center overflow-y-auto max-h-[70vh]">
          {isStandard && settings ? (
            <StandardInvoicePreview settings={settings} invoice={invoice} ledgerName={ledgerName} />
          ) : (
          <div
            ref={receiptRef}
            className="w-full bg-white p-4 shadow-md rounded-md border border-gray-200 text-gray-900 font-mono text-[11px] leading-tight select-text"
            style={{ fontFamily: "'Courier New', Courier, monospace" }}
          >
            {/* Üst Mağaza Bilgileri */}
            <div className="text-center pb-2 border-b border-dashed border-gray-400">
              <div className="text-sm font-black uppercase tracking-wider">{storeName || 'BIZNES HASAP'}</div>
              <div className="text-[10px] text-gray-600 mt-0.5">AŞGABAT / TÜRKMENİSTAN</div>
              <div className="text-[10px] text-gray-500">TEL: +993 (12) 00-00-00</div>
              <div className="text-[9px] text-gray-400 mt-1">ÖKC FISKAL TERMINAL • NO: 89412</div>
            </div>

            {/* Fiş Detayları */}
            <div className="py-2 text-[10px] border-b border-dashed border-gray-400 space-y-0.5">
              <div className="flex justify-between">
                <span className="text-gray-500">{t('receipt.colNo')}</span>
                <span className="font-bold">{invoice.invoiceNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t('receipt.colDate')}</span>
                <span>{formattedDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t('receipt.colCashier')}</span>
                <span>{invoice.cashierName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t('receipt.colCustomer')}</span>
                <span className="truncate max-w-[150px]">{invoice.customerName}</span>
              </div>
            </div>

            {/* Kalemler / Ürün Tablosu */}
            <div className="py-2 border-b border-dashed border-gray-400">
              <div className="flex justify-between text-[10px] font-bold text-gray-600 mb-1">
                <span>{t('receipt.colItemsQty')}</span>
                <span>{t('receipt.colTotal')}</span>
              </div>
              <div className="space-y-1.5">
                {invoice.items.map((item) => {
                  const pct = item.percent || 0;
                  const factor = 1 + pct / 100;
                  const rowTotal = Math.max(0, item.qty * item.price * factor);

                  return (
                    <div key={item.id} className="flex justify-between items-start">
                      <div className="overflow-hidden pr-2">
                        <div className="font-bold truncate text-[11px]">{item.name}</div>
                        <div className="text-[9px] text-gray-500">
                          {item.qty} x {item.price.toFixed(2)} TMT
                          {pct !== 0 && ` (${pct > 0 ? '+' : ''}${pct}%)`}
                        </div>
                      </div>
                      <div className="font-bold whitespace-nowrap text-[11px]">
                        {rowTotal.toFixed(2)} TMT
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Toplamlar */}
            <div className="py-2 border-b border-dashed border-gray-400 space-y-1">
              <div className="flex justify-between text-[10px] text-gray-600">
                <span>{t('receipt.subtotal')}</span>
                <span>{invoice.subtotal.toFixed(2)} TMT</span>
              </div>
              {invoice.discountTotal > 0 && (
                <div className="flex justify-between text-[10px] text-red-600">
                  <span>{t('receipt.discount')}</span>
                  <span>-{invoice.discountTotal.toFixed(2)} TMT</span>
                </div>
              )}
              <div className="flex justify-between text-xs font-black pt-1 border-t border-dotted border-gray-300">
                <span>{isCredit ? t('receipt.paid') : t('receipt.paidTotal')}</span>
                <span className="text-sm font-black">{paidNow.toFixed(2)} TMT</span>
              </div>

              {isCredit && (
                <>
                  <div className="flex justify-between text-[11px] font-black text-rose-700 pt-1">
                    <span>{t('receipt.remainingDebt')}</span>
                    <span>{remaining.toFixed(2)} TMT</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-700 pt-1 border-t border-dotted border-gray-300">
                    <span>{t('receipt.creditTerm')}</span>
                    <span className="font-bold">{invoice.creditTermDays ?? 0} {t('receipt.days')}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-700">
                    <span>{t('receipt.dueDate')}</span>
                    <span className="font-bold">{formatIsoDate(invoice.dueDate)}</span>
                  </div>
                </>
              )}
            </div>

            {/* Ödeme Yöntemi ve Banka POS Terminal Bilgisi */}
            <div className="py-2 border-b border-dashed border-gray-400 text-[10px] space-y-0.5">
              <div className="flex justify-between font-bold">
                <span>{t('receipt.paymentType')}</span>
                <span className="text-blue-700">{invoicePaymentLabel(invoice.paymentMethod, language)}</span>
              </div>
              {invoice.paymentMethod === 'card' && (
                <>
                  <div className="flex justify-between text-gray-600">
                    <span>{t('receipt.auth')}</span>
                    <span className="font-mono font-bold text-emerald-700">{authCode || 'AUTH-749214'}</span>
                  </div>
                  <div className="flex justify-between text-gray-500 text-[9px]">
                    <span>{t('receipt.status')}</span>
                    <span className="font-bold text-emerald-600">{t('receipt.approved')}</span>
                  </div>
                </>
              )}
            </div>

            {/* Alt Mesaj ve Barkod Görseli */}
            <div className="text-center pt-3 text-[10px] text-gray-600">
              <div className="font-bold">{t('thanksMsg')}</div>
              <div className="text-[9px] text-gray-400 mt-0.5">{t('receipt.waitingAgain')}</div>

              {/* Simüle Edilmiş Çek Barkodu */}
              <div className="mt-3 flex flex-col items-center justify-center opacity-80">
                <div className="h-6 w-44 flex items-end justify-center space-x-0.5">
                  {[3, 1, 4, 2, 1, 3, 2, 4, 1, 2, 3, 1, 4, 2, 1, 3, 2, 1, 4, 3, 1, 2, 4, 1, 3, 2].map(
                    (w, i) => (
                      <div
                        key={i}
                        className="bg-black h-full"
                        style={{ width: `${w}px` }}
                      ></div>
                    )
                  )}
                </div>
                <span className="text-[8px] font-mono tracking-widest text-gray-500 mt-1">
                  *{invoice.invoiceNo}*
                </span>
              </div>
            </div>
          </div>
          )}
        </div>

        {printNotice && (
          <div className="px-3.5 py-2 text-[11px] font-semibold text-rose-600 bg-rose-50 border-t border-rose-100">
            {printNotice}
          </div>
        )}

        {/* Butonlar */}
        <div className="p-3.5 bg-white border-t border-gray-200 flex items-center justify-between space-x-2.5 flex-shrink-0">
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white text-xs font-bold transition-all flex items-center justify-center space-x-1.5 shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>{t('printBtn')}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-bold transition-all flex items-center justify-center space-x-1 shadow-sm"
          >
            <span>{t('closeBtn')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
