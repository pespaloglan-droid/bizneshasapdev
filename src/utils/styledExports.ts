/**
 * Haryt we müşderi aktarma tablalary — ORTAK STİL (excelWriter) arkaly.
 *
 * Sütun başlyklary PRODUCT_EXCEL_COLUMNS / CUSTOMER_EXCEL_COLUMNS-den
 * öndürilýär (productHeader/customerHeader) — şoňa görä eksport → içe aktarma
 * aýlanyşy bozulmaýar (import tarapy başlýan setiriň ýerini özi tapýar,
 * bkz. findHeaderRowIndex).
 */

import type { Customer, LanguageCode, Product } from '../types';
import type { MeasurementUnit } from '../db/unitService';
import { makeUnitCode, unitLabel } from '../db/unitService';
import { createAndSaveStyledWorkbook } from './excelWriter';
import type { ExcelColumn } from './excelStyle';
import { PRODUCT_EXCEL_COLUMNS, type ProductDraft } from './productExcel';
import { CUSTOMER_EXCEL_COLUMNS, customerTypeText, type CustomerDraft } from './customerExcel';

/** Başlyklaryň TEK ÇEŞMESI — import tarapyndaky kolon tanamalary. */
function productHeader(key: keyof ProductDraft): string {
  return PRODUCT_EXCEL_COLUMNS.find((column) => column.key === key)?.header ?? key;
}

function customerHeader(key: keyof CustomerDraft): string {
  return CUSTOMER_EXCEL_COLUMNS.find((column) => column.key === key)?.header ?? key;
}

// ── Haryt ──────────────────────────────────────────────────────────────────

export interface ProductExportOptions {
  /** «Stok mukdarlary ýazylsynmy?» — Hayýyr bolsa stok sütuny hiç ýok. */
  readonly includeStock: boolean;
  /** «Alış/maliýet bahalary ýazylsynmy?» */
  readonly includeCost: boolean;
  readonly accountName: string;
  /** Birim adlary bu dilde görkezilýär (Türkmen dili üçin 'tm'). */
  readonly language: LanguageCode;
  /** Görkeziljek başlyk. */
  readonly sheetName?: string;
  /** Jemiň setirinde görkezilýän label. */
  readonly totalLabel?: string;
}

export function buildProductColumns(
  units: readonly MeasurementUnit[],
  options: ProductExportOptions
): readonly ExcelColumn<Product>[] {
  const columns: ExcelColumn<Product>[] = [
    { header: productHeader('name'), get: (p) => p.name, width: 30 },
    { header: productHeader('category'), get: (p) => p.category ?? '' },
    { header: productHeader('barcode'), get: (p) => p.barcode, width: 16 },
    { header: productHeader('sku'), get: (p) => p.sku ?? '', width: 14 },
    {
      header: productHeader('unit'),
      get: (p) => unitLabel(units, p.unit ?? 'adet', options.language),
    },
    {
      header: productHeader('unit2'),
      get: (p) => (p.unit2 ? unitLabel(units, p.unit2, options.language) : ''),
    },
    {
      header: productHeader('unit2Qty'),
      get: (p) => (p.unit2 ? Number(p.unit2Qty ?? 1) : ''),
      kind: 'qty',
    },
  ];

  if (options.includeCost) {
    columns.push({
      header: productHeader('purchasePrice'),
      get: (p) => Number(p.purchasePrice ?? 0),
      kind: 'money',
    });
  }

  columns.push({
    header: productHeader('price'),
    get: (p) => Number(p.price ?? 0),
    kind: 'money',
  });

  if (options.includeStock) {
    columns.push({
      header: productHeader('stock'),
      get: (p) => Number(p.stock ?? 0),
      kind: 'qty',
      total: 'sum',
    });
    columns.push({
      header: productHeader('criticalStock'),
      get: (p) => Number(p.criticalStock ?? 0),
      kind: 'qty',
      // Düşük stok → gyzyl vurgu.
      tone: (p) =>
        Number(p.criticalStock ?? 0) > 0 && Number(p.stock ?? 0) <= Number(p.criticalStock ?? 0)
          ? 'danger'
          : null,
    });
  }

  columns.push({
    header: productHeader('expiryDate'),
    get: (p) => p.expiryDate ?? '',
    kind: 'date',
  });

  return columns;
}

export async function exportProductsStyled(
  products: readonly Product[],
  units: readonly MeasurementUnit[],
  options: ProductExportOptions,
  fileName: string
): Promise<boolean> {
  return createAndSaveStyledWorkbook<Product>(
    {
      sheetName: options.sheetName ?? 'Harytlar',
      title: 'Haryt Listesi',
      accountName: options.accountName,
      columns: buildProductColumns(units, options),
      rows: products,
      totalLabel: options.totalLabel ?? 'Jemi',
      meta: {
        kind: 'urun',
        accountName: options.accountName,
        template: 'urun',
        templateVersion: 1,
        options: {
          stokYazildy: options.includeStock,
          alisBahasYazildy: options.includeCost,
          harytSany: products.length,
        },
      },
    },
    fileName
  );
}

export async function exportProductTemplateStyled(
  units: readonly MeasurementUnit[],
  accountName: string,
  language: LanguageCode,
  fileName: string
): Promise<boolean> {
  const dummyProduct: Product = {
    id: 'nusga',
    name: 'Nusga Haryt (dolduryň)',
    barcode: '1234567890',
    price: 150,
    purchasePrice: 100,
    stock: 10,
    criticalStock: 5,
    unit: 'sany',
    category: 'Kategoriýa Ady',
    sku: 'SKU-001',
    imageType: 'default',
  };

  const columns = buildProductColumns(units, {
    includeCost: true,
    includeStock: true,
    accountName,
    language,
    totalLabel: '...', // sablonda toplama yok
  });

  return createAndSaveStyledWorkbook<Product>(
    {
      sheetName: 'Haryt Şablony',
      title: 'Haryt Import Şablony',
      accountName,
      columns,
      rows: [
        dummyProduct, 
        { ...dummyProduct, id: 'nusga2', name: 'Nusga Haryt 2', barcode: '0987654321', price: 200, unit: 'kg' }
      ],
      meta: {
        kind: 'template',
        accountName,
        template: 'urun',
        templateVersion: 1,
        options: {},
      },
      template: true, // ilk iki satırı önek alır
    },
    fileName
  );
}

// ── Müşderi ────────────────────────────────────────────────────────────────

export interface CustomerExportOptions {
  /** «Borç/alýak bakiýeleri ýazylsynmy?» */
  readonly includeBalance: boolean;
  readonly accountName: string;
  readonly sheetName?: string;
  readonly totalLabel?: string;
}

export function buildCustomerColumns(
  options: CustomerExportOptions
): readonly ExcelColumn<Customer>[] {
  const columns: ExcelColumn<Customer>[] = [
    { header: customerHeader('name'), get: (c) => c.name, width: 30 },
    { header: customerHeader('phone'), get: (c) => c.phone ?? '', width: 18 },
    { header: customerHeader('type'), get: (c) => customerTypeText(c.type) },
    { header: customerHeader('addressNote'), get: (c) => c.addressNote ?? '', width: 30 },
  ];

  if (options.includeBalance) {
    columns.push({
      header: customerHeader('algy'),
      get: (c) => (Number(c.balance ?? 0) > 0 ? Number(c.balance) : 0),
      kind: 'money',
      total: 'sum',
    });
    columns.push({
      header: customerHeader('bergi'),
      get: (c) => (Number(c.balance ?? 0) < 0 ? Math.abs(Number(c.balance)) : 0),
      kind: 'money',
      total: 'sum',
    });
    // Borçly müşteri → gyzyl vurgu.
    columns.push({
      header: 'Bakiýe',
      get: (c) => Number(c.balance ?? 0),
      kind: 'money',
      tone: (c) => (Number(c.balance ?? 0) < 0 ? 'danger' : null),
    });
  }

  columns.push({
    header: customerHeader('dueDateDays'),
    get: (c) => Number(c.dueDateDays ?? 0),
    kind: 'qty',
  });

  return columns;
}

export async function exportCustomersStyled(
  customers: readonly Customer[],
  options: CustomerExportOptions,
  fileName: string
): Promise<boolean> {
  return createAndSaveStyledWorkbook<Customer>(
    {
      sheetName: options.sheetName ?? 'Müşderiler',
      title: 'Müşderi Listesi',
      accountName: options.accountName,
      columns: buildCustomerColumns(options),
      rows: customers,
      totalLabel: options.totalLabel ?? 'Jemi',
      meta: {
        kind: 'musteri',
        accountName: options.accountName,
        template: 'musteri',
        templateVersion: 1,
        options: {
          bakiyeYazildy: options.includeBalance,
          musteriSany: customers.length,
        },
      },
    },
    fileName
  );
}

export async function exportCustomerTemplateStyled(
  accountName: string,
  fileName: string
): Promise<boolean> {
  const dummyCustomer: Customer = {
    id: 'nusga',
    name: 'Merdan Merdanow',
    phone: '+99365123456',
    type: 'customer',
    addressNote: 'Aşgabat, Parahat 7',
    balance: 500, // alacakli
    dueDateDays: 30,
  };

  const columns = buildCustomerColumns({
    includeBalance: true,
    accountName,
  });

  return createAndSaveStyledWorkbook<Customer>(
    {
      sheetName: 'Müşderi Şablony',
      title: 'Müşderi Import Şablony',
      accountName,
      columns,
      rows: [
        dummyCustomer, 
        { ...dummyCustomer, id: 'nusga2', name: 'Jeren Jerenowa', balance: -200, type: 'employee' }
      ],
      meta: {
        kind: 'template',
        accountName,
        template: 'musteri',
        templateVersion: 1,
        options: {},
      },
      template: true,
    },
    fileName
  );
}

// makeUnitCode — import tarapynda ulanylýar, bu ýerde diňe dogrulyk üçin.
void makeUnitCode;
