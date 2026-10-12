import type { CartItem } from '../types';
import { translate } from '../locales/i18n';
import type { CellKind, ExcelColumn } from './excelStyle';
import { createAndSaveStyledWorkbook } from './excelWriter';

/** Excel sözleşmesi: UI dili değişse de kolon başlıkları Türkmençe kalır. */
export type ReportExportKind = 'xaccot' | 'pl' | 'debt' | 'stock' | 'cash' | 'targow';
type ReportRow = readonly (string | number)[];
type ReportColumn = readonly [headerKey: string, kind: CellKind];

const REPORTS: Record<ReportExportKind, { titleKey: string; columns: readonly ReportColumn[] }> = {
  xaccot: {
    titleKey: 'hasaplama.xaccotTitle',
    columns: [
      ['hasaplama.colInvoiceNo', 'text'], ['hasaplama.colTime', 'text'],
      ['hasaplama.colCustomer', 'text'], ['hasaplama.colProduct', 'qty'],
      ['hasaplama.colPayment', 'text'], ['hasaplama.colAmountTmt', 'money'],
    ],
  },
  pl: {
    titleKey: 'hasaplama.tabPl',
    columns: [
      ['hasaplama.colCategory', 'text'], ['hasaplama.colCount', 'qty'],
      ['hasaplama.colAmountTmt', 'money'],
    ],
  },
  debt: {
    titleKey: 'hasaplama.tabDebt',
    columns: [
      ['hasaplama.colCustomer', 'text'], ['hasaplama.colDebtTmt', 'money'],
      ['hasaplama.colLastPayment', 'text'],
    ],
  },
  stock: {
    titleKey: 'hasaplama.tabStock',
    columns: [
      ['hasaplama.colProduct', 'text'], ['SKU', 'text'], ['hasaplama.colQty', 'qty'],
      ['hasaplama.colPurchase', 'money'], ['hasaplama.colPurchaseValue', 'money'],
      ['hasaplama.colSaleValue', 'money'],
    ],
  },
  cash: {
    titleKey: 'hasaplama.tabCash',
    columns: [
      ['hasaplama.colLedger', 'text'], ['hasaplama.colCurrency', 'text'],
      ['hasaplama.income', 'money'], ['hasaplama.expense', 'money'],
      ['hasaplama.colBalance', 'money'], ['TMT', 'money'],
    ],
  },
  targow: {
    titleKey: 'hasaplama.tabTargow',
    columns: [
      ['hasaplama.colTargow', 'text'], ['hasaplama.colOrderCount', 'qty'],
      ['hasaplama.colTotalAmount', 'money'], ['hasaplama.colNewCustomer', 'qty'],
    ],
  },
};

export function reportExcelColumns(kind: ReportExportKind): readonly ExcelColumn<ReportRow>[] {
  return REPORTS[kind].columns.map(([key, cellKind], index) => ({
    header: key.includes('.') ? translate('tm', key) : key,
    get: (row) => row[index] ?? null,
    kind: cellKind,
    numFmt: key === 'hasaplama.colQty' ? '#,##0.###' : undefined,
  }));
}

export async function exportReportStyled(options: {
  kind: ReportExportKind;
  rows: readonly ReportRow[];
  fileName: string;
  dialogTitle: string;
  accountName?: string;
}): Promise<boolean> {
  const accountName = options.accountName ?? '';
  return createAndSaveStyledWorkbook<ReportRow>({
    sheetName: 'Hasabat',
    title: translate('tm', REPORTS[options.kind].titleKey),
    dialogTitle: options.dialogTitle,
    accountName,
    columns: reportExcelColumns(options.kind),
    rows: options.rows,
    showTotals: false,
    meta: {
      kind: 'genel', accountName, template: `report_${options.kind}`,
      templateVersion: 1, options: {},
    },
  }, options.fileName);
}

interface InvoiceExcelRow {
  item: CartItem;
  lineNumber: number;
}

export async function exportInvoiceStyled(options: {
  items: readonly CartItem[];
  invoiceCode: string;
  total: number;
  accountName: string;
  fileName: string;
  dialogTitle: string;
}): Promise<boolean> {
  const columns: readonly ExcelColumn<InvoiceExcelRow>[] = [
    { header: '№', get: (r) => r.lineNumber, kind: 'qty' },
    { header: 'Haryt', get: (r) => r.item.name },
    { header: 'SKU', get: (r) => r.item.sku },
    { header: 'Ölçeg', get: (r) => r.item.unit ?? '' },
    { header: 'Mukdar', get: (r) => r.item.qty, kind: 'qty', numFmt: '#,##0.###' },
    { header: 'Baha', get: (r) => r.item.price, kind: 'money' },
    { header: '%', get: (r) => r.item.percent ?? 0, kind: 'percent' },
    {
      header: 'Jemi', kind: 'money', total: options.total,
      // Mevcut faktura hesaplaması aynen korunur; genel toplam ayrıca alınır.
      get: (r) => Math.round(r.item.qty * r.item.price * (1 + (r.item.percent || 0) / 100) * 100) / 100,
    },
  ];
  return createAndSaveStyledWorkbook<InvoiceExcelRow>({
    sheetName: 'Faktura',
    title: `Faktura — ${options.invoiceCode}`,
    dialogTitle: options.dialogTitle,
    accountName: options.accountName,
    columns,
    rows: options.items.map((item, index) => ({ item, lineNumber: index + 1 })),
    meta: {
      kind: 'faktura', accountName: options.accountName, template: 'invoice',
      templateVersion: 1, options: { invoiceCode: options.invoiceCode },
    },
  }, options.fileName);
}
