import type {
  InvoiceRecord,
  LanguageCode,
  PrintFontScale,
  PrinterMode,
  ReceiptSettings,
} from '../types';
import { escapeHtml } from './csv';
import { electronBridge } from './electron';
import { printInvoiceSmart } from '../services/mobilePrintService';
import { formatIsoDate, invoicePaymentLabel } from './paymentLabels';
import { formatDateTime } from './locale';
import { translate } from '../locales/i18n';

export interface PrintOutcome {
  readonly success: boolean;
  readonly failureReason: string;
  /** Çap enjamy elýeterli bolmadykda (brauzer) ulanylýar. */
  readonly usedFallback?: boolean;
}

function scaleFactor(scale: PrintFontScale): number {
  if (scale === 'sm') return 0.85;
  if (scale === 'lg') return 1.2;
  return 1;
}

function money(value: number): string {
  return value.toFixed(2);
}

function itemRowTotal(item: InvoiceRecord['items'][number]): number {
  const factor = 1 + (item.percent || 0) / 100;
  return Math.max(0, item.qty * item.price * factor);
}

/** Termal çek (58/80mm) üçin HTML. */
export function buildThermalReceiptHtml(
  invoice: InvoiceRecord,
  settings: ReceiptSettings,
  storeName: string,
  authCode?: string,
  language?: LanguageCode
): string {
  const f = settings.fields;
  const fs = scaleFactor(settings.fontScale);
  const isCredit = invoice.paymentMethod === 'credit';
  const paidNow = isCredit ? invoice.paidAmount ?? 0 : invoice.amountDue;
  const remaining = isCredit ? invoice.remainingDebt ?? invoice.amountDue : 0;
  const date = formatDateTime(new Date(invoice.createdAt), language);

  const itemsHtml = invoice.items
    .map((item) => {
      const pct = item.percent || 0;
      return `<div class="row"><div class="grow"><b>${escapeHtml(item.name)}</b><br>
        <span class="dim">${item.qty} x ${money(item.price)}${pct !== 0 ? ` (${pct > 0 ? '+' : ''}${pct}%)` : ''}</span></div>
        <div><b>${money(itemRowTotal(item))}</b></div></div>`;
    })
    .join('');

  const creditHtml = isCredit
    ? `<div class="row bold rose"><span>${translate(language ?? 'tm', 'receipt.remainingDebt')}</span><span>${money(remaining)} TMT</span></div>
       <div class="row"><span>${translate(language ?? 'tm', 'receipt.creditTerm')}</span><span>${invoice.creditTermDays ?? 0} ${translate(language ?? 'tm', 'receipt.days')}</span></div>
       <div class="row"><span>${translate(language ?? 'tm', 'receipt.dueDate')}</span><span>${escapeHtml(formatIsoDate(invoice.dueDate))}</span></div>`
    : '';

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Courier New',monospace;color:#000;background:#fff;font-size:${11 * fs}px;padding:6px}
    .c{text-align:center}.r{text-align:right}.b{font-weight:700}
    .hr{border-top:1px dashed #000;margin:6px 0}
    .row{display:flex;justify-content:space-between;gap:6px}
    .grow{flex:1;min-width:0;word-break:break-word}
    .dim{color:#444;font-size:${9 * fs}px}
    .bold{font-weight:700}.rose{color:#b91c1c}
    .logo{max-height:60px;max-width:${settings.logoWidth && settings.logoWidth > 0 ? settings.logoWidth + 'px' : '70%'};object-fit:contain}
    .tot{font-size:${13 * fs}px;font-weight:900}
  </style></head><body>
    ${f.logo && settings.logoDataUrl ? `<div class="${settings.logoCenter ?? true ? 'c' : ''}"><img class="logo" src="${settings.logoDataUrl}" alt="logo"/></div>` : ''}
    <div class="c">
      <div class="b" style="font-size:${13 * fs}px">${escapeHtml(storeName || settings.companyName || 'BIZNES HASAP')}</div>
      ${f.address && settings.address ? `<div class="dim">${escapeHtml(settings.address)}</div>` : ''}
      ${f.phone && settings.phone ? `<div class="dim">Tel: ${escapeHtml(settings.phone)}</div>` : ''}
      ${f.taxId && settings.taxId ? `<div class="dim">STIR: ${escapeHtml(settings.taxId)}</div>` : ''}
    </div>
    <div class="hr"></div>
    <div class="row"><span>${translate(language ?? 'tm', 'receipt.colNo')}</span><span class="b">${escapeHtml(invoice.invoiceNo)}</span></div>
    <div class="row"><span>${translate(language ?? 'tm', 'receipt.thermalDate')}</span><span>${escapeHtml(date)}</span></div>
    ${f.cashier ? `<div class="row"><span>${translate(language ?? 'tm', 'receipt.colCashier')}</span><span>${escapeHtml(invoice.cashierName)}</span></div>` : ''}
    ${f.customer ? `<div class="row"><span>${translate(language ?? 'tm', 'receipt.colCustomer')}</span><span>${escapeHtml(invoice.customerName)}</span></div>` : ''}
    <div class="hr"></div>
    ${itemsHtml}
    <div class="hr"></div>
    <div class="row"><span>${translate(language ?? 'tm', 'receipt.subtotal')}</span><span>${money(invoice.subtotal)} TMT</span></div>
    ${invoice.discountTotal > 0 ? `<div class="row rose"><span>${translate(language ?? 'tm', 'receipt.discount')}</span><span>-${money(invoice.discountTotal)} TMT</span></div>` : ''}
    <div class="row tot"><span>${isCredit ? translate(language ?? 'tm', 'receipt.paid') : translate(language ?? 'tm', 'receipt.paidTotal')}</span><span>${money(paidNow)} TMT</span></div>
    ${creditHtml}
    <div class="hr"></div>
    <div class="row b"><span>${translate(language ?? 'tm', 'receipt.paymentType')}</span><span>${escapeHtml(invoicePaymentLabel(invoice.paymentMethod, language))}</span></div>
    ${invoice.paymentMethod === 'card' ? `<div class="row"><span>${translate(language ?? 'tm', 'receipt.authShort')}</span><span>${escapeHtml(authCode || '-')}</span></div>` : ''}
    ${f.qr ? `<div class="hr"></div><div class="c b">[ QR: ${escapeHtml(qrPayload(invoice, settings))} ]</div>` : ''}
    ${f.barcode ? `<div class="hr"></div><div class="c" style="letter-spacing:2px">*${escapeHtml(invoice.invoiceNo)}*</div>` : ''}
    ${settings.footerNote ? `<div class="hr"></div><div class="c b">${escapeHtml(settings.footerNote)}</div>` : ''}
  </body></html>`;
}

/** QR kod mazmuny (settings.qrContent boýunça). */
export function qrPayload(invoice: InvoiceRecord, settings: ReceiptSettings): string {
  if (settings.qrContent === 'invoice') return invoice.invoiceNo;
  if (settings.qrContent === 'payment') return `${invoice.invoiceNo}|${money(invoice.amountDue)}|TMT`;
  return settings.companyName || 'BIZNES HASAP';
}

/** Adaty çap (A4) üçin HTML. */
export function buildStandardInvoiceHtml(
  invoice: InvoiceRecord,
  settings: ReceiptSettings,
  storeName: string,
  ledgerName?: string,
  language?: LanguageCode
): string {
  const std = settings.standard;
  const f = settings.fields;
  const fs = scaleFactor(std.fontScale);
  const isCredit = invoice.paymentMethod === 'credit';
  const cols = std.columns;
  const info = std.info;
  const cur = info.currency ? ' TMT' : '';
  const landscape = std.orientation === 'landscape';

  const headCells: string[] = ['<th>#</th>', `<th>${translate(language ?? 'tm', 'receipt.colProduct')}</th>`];
  if (cols.barcode) headCells.push(`<th>${translate(language ?? 'tm', 'receipt.colBarcode')}</th>`);
  headCells.push(`<th class="r">${translate(language ?? 'tm', 'receipt.colQty')}</th>`);
  if (cols.unit) headCells.push(`<th>${translate(language ?? 'tm', 'receipt.colUnit')}</th>`);
  if (cols.unitPrice) headCells.push(`<th class="r">${translate(language ?? 'tm', 'receipt.colUnitPrice')}</th>`);
  if (cols.discount) headCells.push(`<th class="r">${translate(language ?? 'tm', 'receipt.colDiscount')}</th>`);
  headCells.push(`<th class="r">${translate(language ?? 'tm', 'receipt.colLineTotal')}</th>`);

  const bodyRows = invoice.items
    .map((item, index) => {
      const cells: string[] = [`<td>${index + 1}</td>`];
      const img =
        std.showImages && item.imageUrl
          ? `<img class="thumb" src="${item.imageUrl}" alt=""/>`
          : std.showImages
          ? '<span class="thumb empty"></span>'
          : '';
      cells.push(`<td><div class="prod">${img}<span>${escapeHtml(item.name)}</span></div></td>`);
      if (cols.barcode) cells.push(`<td class="mono">${escapeHtml(item.sku || '')}</td>`);
      cells.push(`<td class="r">${item.qty}</td>`);
      if (cols.unit) cells.push(`<td>${escapeHtml(item.unit || '')}</td>`);
      if (cols.unitPrice) cells.push(`<td class="r mono">${money(item.price)}</td>`);
      if (cols.discount) cells.push(`<td class="r mono">${item.percent ? `${item.percent}%` : '-'}</td>`);
      cells.push(`<td class="r mono b">${money(itemRowTotal(item))}</td>`);
      return `<tr>${cells.join('')}</tr>`;
    })
    .join('');

  const taxRow = cols.tax
    ? `<div class="row"><span>${translate(language ?? 'tm', 'receipt.taxLabel')}</span><span class="mono">${money(invoice.taxTotal)}${cur}</span></div>`
    : '';

  const headerBlock = std.header
    ? `<div class="head">
        ${f.logo && settings.logoDataUrl ? `<img class="logo" src="${settings.logoDataUrl}" alt="logo"/>` : ''}
        <div class="company">
          <div class="cname">${escapeHtml(storeName || settings.companyName || 'BIZNES HASAP')}</div>
          ${f.address && settings.address ? `<div>${escapeHtml(settings.address)}</div>` : ''}
          ${f.phone && settings.phone ? `<div>Tel: ${escapeHtml(settings.phone)}</div>` : ''}
          ${f.taxId && settings.taxId ? `<div>STIR: ${escapeHtml(settings.taxId)}</div>` : ''}
        </div>
      </div>`
    : '';

  const signatureBlock = std.signature
    ? `<div class="sign"><div class="box"><span>${translate(language ?? 'tm', 'receipt.seller')}</span></div><div class="box"><span>${translate(language ?? 'tm', 'receipt.buyer')}</span></div></div>`
    : '';

  const notesBlock = std.notes
    ? `<div class="notes"><b>${translate(language ?? 'tm', 'receipt.notesTerms')}</b><br/>${escapeHtml(std.notes).replace(/\n/g, '<br/>')}</div>`
    : '';

  const footer = std.pageNumbers
    ? `<div class="pfoot">${escapeHtml(settings.companyName || storeName)} · ${translate(language ?? 'tm', 'receipt.pageOne')}</div>`
    : '';

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page{size:A4 ${landscape ? 'landscape' : 'portrait'};margin:12mm}
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Segoe UI',Arial,sans-serif;color:#111;font-size:${11 * fs}px}
    .head{display:flex;align-items:center;gap:14px;border-bottom:2px solid #10b981;padding-bottom:10px;margin-bottom:14px}
    .logo{max-height:72px;max-width:180px;object-fit:contain}
    .cname{font-size:${16 * fs}px;font-weight:800}
    .title{font-size:${15 * fs}px;font-weight:800;text-align:center;margin:6px 0 12px}
    .meta{display:flex;justify-content:space-between;gap:16px;margin-bottom:10px}
    .meta div{font-size:${10 * fs}px}
    table{width:100%;border-collapse:collapse}
    th,td{border-bottom:1px solid #ddd;padding:5px 4px;text-align:left;vertical-align:middle}
    th{background:#f3f4f6;font-size:${10 * fs}px;text-transform:uppercase}
    .r{text-align:right}.b{font-weight:700}.mono{font-family:'Courier New',monospace}
    .prod{display:flex;align-items:center;gap:8px}
    .thumb{width:34px;height:34px;object-fit:cover;border:1px solid #e5e7eb;border-radius:4px}
    .thumb.empty{display:inline-block;background:#f3f4f6}
    .sum{margin-top:12px;margin-left:auto;width:320px}
    .sum .row{display:flex;justify-content:space-between;padding:3px 0}
    .sum .grand{font-weight:900;border-top:2px solid #111;margin-top:4px;padding-top:6px;font-size:${13 * fs}px}
    .sign{display:flex;justify-content:space-between;margin-top:48px;gap:40px}
    .sign .box{flex:1;border-top:1px solid #111;padding-top:6px;text-align:center}
    .notes{margin-top:20px;font-size:${9.5 * fs}px;color:#374151;border-top:1px dashed #bbb;padding-top:8px}
    .pfoot{margin-top:24px;text-align:center;font-size:${9 * fs}px;color:#9ca3af}
  </style></head><body>
    ${headerBlock}
    <div class="title">${translate(language ?? 'tm', 'receipt.invTitle')}</div>
    <div class="meta">
      <div><b>${translate(language ?? 'tm', 'receipt.invCode')}</b> ${escapeHtml(invoice.invoiceNo)}<br/>
        <b>${translate(language ?? 'tm', 'receipt.invDate')}</b> ${escapeHtml(formatDateTime(new Date(invoice.createdAt), language))}</div>
      <div class="r">${info.customer ? `<b>${translate(language ?? 'tm', 'receipt.invCustomer')}</b> ${escapeHtml(invoice.customerName)}<br/>` : ''}${f.cashier ? `<b>${translate(language ?? 'tm', 'receipt.invCashier')}</b> ${escapeHtml(invoice.cashierName)}` : ''}</div>
    </div>
    <table><thead><tr>${headCells.join('')}</tr></thead><tbody>${bodyRows}</tbody></table>
    <div class="sum">
      ${cols.subtotal ? `<div class="row"><span>${translate(language ?? 'tm', 'receipt.subtotalLabel')}</span><span class="mono">${money(invoice.subtotal)}${cur}</span></div>` : ''}
      ${invoice.discountTotal > 0 ? `<div class="row"><span>${translate(language ?? 'tm', 'receipt.discountLabel')}</span><span class="mono">-${money(invoice.discountTotal)}${cur}</span></div>` : ''}
      ${taxRow}
      ${info.ledger && ledgerName ? `<div class="row"><span>${translate(language ?? 'tm', 'receipt.ledgerLabel')}</span><span>${escapeHtml(ledgerName)}</span></div>` : ''}
      <div class="row grand"><span>${translate(language ?? 'tm', 'receipt.grandTotal')}</span><span class="mono">${money(invoice.amountDue)}${cur}</span></div>
      ${isCredit ? `<div class="row"><span>${translate(language ?? 'tm', 'receipt.paidLabel')}</span><span class="mono">${money(invoice.paidAmount ?? 0)}${cur}</span></div>
        <div class="row"><span>${translate(language ?? 'tm', 'receipt.remainingLabel')}</span><span class="mono">${money(invoice.remainingDebt ?? invoice.amountDue)}${cur}</span></div>` : ''}
      ${info.payment ? `<div class="row"><span>${translate(language ?? 'tm', 'receipt.paymentLabel')}</span><span>${escapeHtml(invoicePaymentLabel(invoice.paymentMethod, language))}</span></div>` : ''}
    </div>
    ${signatureBlock}
    ${notesBlock}
    ${footer}
  </body></html>`;
}

/** Sazlamalara görä dogry şablony saýlap çap edýär. */
export async function printInvoice(
  invoice: InvoiceRecord,
  settings: ReceiptSettings,
  printerMode: PrinterMode,
  storeName: string,
  language: LanguageCode,
  authCode?: string,
  ledgerName?: string
): Promise<PrintOutcome> {
  const isStandard = printerMode === 'standard';
  const html = isStandard
    ? buildStandardInvoiceHtml(invoice, settings, storeName, ledgerName, language)
    : buildThermalReceiptHtml(invoice, settings, storeName, authCode, language);
  const copies = Math.max(1, isStandard ? settings.standard.copies : settings.copies);

  // Mobil öncelik: Bluetooth bağlıysa oraya, yoksa Electron sessiz çap / window.print.
  // A4 standart rapor Bluetooth'a gönderilmez — termal rulo mantıklı değil.
  if (!isStandard) {
    try {
      const ok = await printInvoiceSmart({
        html,
        paperWidth: settings.paperWidth,
        pageSize: undefined,
        landscape: false
      });
      if (ok) return { success: true, failureReason: '' };
    } catch {
      // alta düş — eski yol
    }
  }

  const bridge = electronBridge();
  if (!bridge.printHtml) {
    // Brauzer gurşawy — köne usul.
    window.print();
    return { success: true, failureReason: '', usedFallback: true };
  }

  let lastFailure = '';
  for (let i = 0; i < copies; i += 1) {
    const result = await bridge.printHtml({
      html,
      paperWidth: settings.paperWidth,
      pageSize: isStandard ? 'A4' : undefined,
      landscape: isStandard && settings.standard.orientation === 'landscape',
    });
    if (!result.success) lastFailure = result.failureReason || '';
    else lastFailure = '';
  }
  return { success: !lastFailure, failureReason: lastFailure };
}