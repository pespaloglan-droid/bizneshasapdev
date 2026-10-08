import React from 'react';
import type { InvoiceRecord, ReceiptSettings } from '../../types';
import { formatMoney } from '../../utils/money';
import { invoicePaymentLabel } from '../../utils/paymentLabels';

interface StandardInvoicePreviewProps {
  settings: ReceiptSettings;
  /** Berilse hakyky faktura görkeziler; ýogsa nusga maglumatlar. */
  invoice?: InvoiceRecord;
  /** Depder ady (settings.standard.info.ledger açyk bolsa). */
  ledgerName?: string;
}

interface PreviewRow {
  name: string;
  qty: number;
  price: number;
  sku: string;
  unit: string;
  percent: number;
  imageUrl?: string;
}

const SAMPLE_ITEMS: PreviewRow[] = [
  { name: 'Biznes Hasap Programma', qty: 1, price: 5000, sku: 'PRG-001', unit: 'sany', percent: 0 },
  { name: 'Termal çek kagyz', qty: 2, price: 45.5, sku: 'TCH-002', unit: 'sany', percent: 5 },
];

const FS: Record<string, { body: number; title: number; small: number }> = {
  sm: { body: 8, title: 11, small: 7 },
  md: { body: 9, title: 13, small: 8 },
  lg: { body: 11, title: 15, small: 9 },
};

export const StandardInvoicePreview: React.FC<StandardInvoicePreviewProps> = ({ settings, invoice, ledgerName }) => {
  const std = settings.standard;
  const f = settings.fields;
  const cols = std.columns;
  const info = std.info;
  const cur = info.currency ? ' TMT' : '';
  const fs = FS[std.fontScale] ?? FS.md;
  const landscape = std.orientation === 'landscape';
  const rows: PreviewRow[] = invoice
    ? invoice.items.map((item) => ({
        name: item.name,
        qty: item.qty,
        price: item.price,
        sku: item.sku || '',
        unit: item.unit || '',
        percent: item.percent || 0,
        imageUrl: item.imageUrl,
      }))
    : SAMPLE_ITEMS;
  const subtotal = invoice ? invoice.subtotal : rows.reduce((sum, i) => sum + i.qty * i.price, 0);
  const grand = invoice ? invoice.amountDue : subtotal;
  const isCredit = invoice?.paymentMethod === 'credit';
  const metaNo = invoice ? invoice.invoiceNo : 'SAT.09/26-343';
  const metaDate = invoice ? new Date(invoice.createdAt).toLocaleDateString('tr-TR') : '20.09.2026';
  const metaCustomer = invoice ? invoice.customerName : 'Umumy Müşderi';
  const metaCashier = invoice ? invoice.cashierName : 'Administrator';

  return (
    <div className="flex justify-center">
      <div
        className="bg-white shadow-lg border border-gray-200 p-3 text-gray-900"
        style={{ width: landscape ? '420px' : '320px', minHeight: landscape ? '250px' : '400px', fontSize: `${fs.body}px` }}
      >
        {std.header && (
          <div className="flex items-center gap-2 border-b-2 border-emerald-500 pb-2 mb-2">
            {f.logo && settings.logoDataUrl ? (
              <img src={settings.logoDataUrl} alt="logo" className="max-h-10 max-w-[70px] object-contain" />
            ) : (
              <div className="w-9 h-9 rounded bg-gray-100 flex items-center justify-center text-[8px] text-gray-400">
                LOGO
              </div>
            )}
            <div>
              <div className="font-bold" style={{ fontSize: `${fs.title}px` }}>
                {settings.companyName || 'BIZNES HASAP'}
              </div>
              {f.address && settings.address && <div className="text-gray-500">{settings.address}</div>}
              {f.phone && settings.phone && <div className="text-gray-500">Tel: {settings.phone}</div>}
              {f.taxId && settings.taxId && <div className="text-gray-500">STIR: {settings.taxId}</div>}
            </div>
          </div>
        )}

        <div className="text-center font-bold mb-2" style={{ fontSize: `${fs.title}px` }}>
          FAKTURA
        </div>

        <div className="flex justify-between text-gray-600 mb-2">
          <div>
            Faktura: {metaNo}
            <br />
            Sene: {metaDate}
          </div>
          <div className="text-right">
            {info.customer && (
              <>
                Müşderi: {metaCustomer}
                <br />
              </>
            )}
            {f.cashier && <>Kassir: {metaCashier}</>}
          </div>
        </div>

        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100" style={{ fontSize: `${fs.small}px` }}>
              <th className="text-left py-1 px-1 border-b border-gray-200">#</th>
              <th className="text-left py-1 px-1 border-b border-gray-200">Haryt</th>
              {cols.barcode && <th className="text-left py-1 px-1 border-b border-gray-200">Barkod</th>}
              <th className="text-right py-1 px-1 border-b border-gray-200">Sany</th>
              {cols.unit && <th className="text-left py-1 px-1 border-b border-gray-200">Birlik</th>}
              {cols.unitPrice && <th className="text-right py-1 px-1 border-b border-gray-200">Baha</th>}
              {cols.discount && <th className="text-right py-1 px-1 border-b border-gray-200">Ýeň.</th>}
              <th className="text-right py-1 px-1 border-b border-gray-200">Jemi</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item, index) => (
              <tr key={`${item.name}-${index}`} className="border-b border-gray-100">
                <td className="py-1 px-1">{index + 1}</td>
                <td className="py-1 px-1">
                  <div className="flex items-center gap-1.5">
                    {std.showImages &&
                      (item.imageUrl ? (
                        <img src={item.imageUrl} alt="" className="w-5 h-5 rounded object-cover border border-gray-200 flex-shrink-0" />
                      ) : (
                        <span className="w-5 h-5 rounded bg-gray-100 border border-gray-200 flex-shrink-0" />
                      ))}
                    <span>{item.name}</span>
                  </div>
                </td>
                {cols.barcode && <td className="py-1 px-1 font-mono">{item.sku}</td>}
                <td className="py-1 px-1 text-right">{item.qty}</td>
                {cols.unit && <td className="py-1 px-1">{item.unit}</td>}
                {cols.unitPrice && <td className="py-1 px-1 text-right font-mono">{formatMoney(item.price)}</td>}
                {cols.discount && <td className="py-1 px-1 text-right font-mono">{item.percent ? `${item.percent}%` : '-'}</td>}
                <td className="py-1 px-1 text-right font-mono font-bold">
                  {formatMoney(item.qty * item.price * (1 + item.percent / 100))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-2 ml-auto w-44">
          {cols.subtotal && (
            <div className="flex justify-between py-0.5">
              <span>Aralyk jemi:</span>
              <span className="font-mono">{formatMoney(subtotal)}{cur}</span>
            </div>
          )}
          {cols.tax && (
            <div className="flex justify-between py-0.5">
              <span>Salgyt:</span>
              <span className="font-mono">{formatMoney(invoice?.taxTotal ?? 0)}{cur}</span>
            </div>
          )}
          {info.ledger && ledgerName && (
            <div className="flex justify-between py-0.5">
              <span>Depder:</span>
              <span>{ledgerName}</span>
            </div>
          )}
          <div className="flex justify-between py-1 mt-1 border-t-2 border-gray-900 font-bold" style={{ fontSize: `${fs.title}px` }}>
            <span>Jemi:</span>
            <span className="font-mono">{formatMoney(grand)}{cur}</span>
          </div>
          {isCredit && invoice && (
            <>
              <div className="flex justify-between py-0.5">
                <span>Tölendi:</span>
                <span className="font-mono">{formatMoney(invoice.paidAmount ?? 0)}{cur}</span>
              </div>
              <div className="flex justify-between py-0.5 text-rose-700 font-bold">
                <span>Galan bergi:</span>
                <span className="font-mono">{formatMoney(invoice.remainingDebt ?? invoice.amountDue)}{cur}</span>
              </div>
            </>
          )}
          {info.payment && invoice && (
            <div className="flex justify-between py-0.5">
              <span>Töleg:</span>
              <span>{invoicePaymentLabel(invoice.paymentMethod)}</span>
            </div>
          )}
        </div>

        {std.signature && (
          <div className="flex justify-between mt-8 gap-6">
            <div className="flex-1 border-t border-gray-900 pt-1 text-center">Satyjy</div>
            <div className="flex-1 border-t border-gray-900 pt-1 text-center">Alyjy</div>
          </div>
        )}

        {std.notes && <div className="mt-4 pt-2 border-t border-dashed border-gray-300 text-gray-500">{std.notes}</div>}

        {std.pageNumbers && (
          <div className="mt-4 text-center text-gray-400" style={{ fontSize: `${fs.small}px` }}>
            {settings.companyName || 'BIZNES HASAP'} · Sahypa 1
          </div>
        )}
      </div>
    </div>
  );
};