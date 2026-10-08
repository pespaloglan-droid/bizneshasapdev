import {
  readSheet,
  writeExcelFile,
  cellText,
  cellNumber,
  type SheetData,
} from './excelIO';
import { makeUnitCode, type MeasurementUnit } from '../db/unitService';

export { describeReadError } from './excelIO';

/** Excel faýlynyň kolonlary — forma meýdançalary bilen birebir deň. */
export const PRODUCT_EXCEL_COLUMNS: readonly {
  key: keyof ProductDraft;
  header: string;
  required: boolean;
}[] = [
  { key: 'name', header: 'Haryt Ady', required: true },
  { key: 'category', header: 'Kategoriýa', required: false },
  { key: 'barcode', header: 'Ana Barkod', required: true },
  { key: 'sku', header: 'SKU', required: false },
  { key: 'unit', header: 'Ölçeg Birligi 1', required: false },
  { key: 'unit2', header: 'Ölçeg Birligi 2', required: false },
  { key: 'unit2Qty', header: '1 (2-nji birlik) = ? (1-nji birlik)', required: false },
  { key: 'purchasePrice', header: 'Alyş Bahasy', required: false },
  { key: 'price', header: 'Satyş Bahasy', required: true },
  { key: 'stock', header: 'Bar Stok Mukdary', required: false },
  { key: 'criticalStock', header: 'Kritik Stok Duýdurşy', required: false },
  { key: 'expiryDate', header: 'Ýaramlylyk Möhleti (SKT)', required: false },
];

export interface ProductDraft {
  name: string;
  category: string;
  barcode: string;
  sku: string;
  unit: string;
  unit2: string;
  unit2Qty: number;
  purchasePrice: number;
  price: number;
  stock: number;
  criticalStock: number;
  expiryDate: string;
}

// Re-export for use in other modules
export type { ProductDraft as ProductDraftType };

export interface ParsedRow {
  /** Excel-de 1-den başlaýan setir belgisi (sözbaşy hasaplanmaýar). */
  readonly rowNumber: number;
  readonly draft: ProductDraft | null;
  readonly errors: string[];
}

export function defaultDraft(): ProductDraft {
  return {
    name: '',
    category: '',
    barcode: '',
    sku: '',
    unit: 'adet',
    unit2: '',
    unit2Qty: 1,
    purchasePrice: 0,
    price: 0,
    stock: 0,
    criticalStock: 5,
    expiryDate: '',
  };
}

// ── Birlik at ↔ kod ─────────────────────────────────────────────────────────

/** Eksportda ulanyjynyň tanaýan ady ýazylýar. */
export function unitText(units: readonly MeasurementUnit[], code: string): string {
  if (!code) return '';
  const found = units.find((unit) => unit.code === code);
  return found ? found.labelTm : code.toUpperCase();
}

/** Importda at ýa-da kod boýunça kodu tapýar. */
export function resolveUnitCode(units: readonly MeasurementUnit[], text: string): string {
  const value = text.trim();
  if (!value) return 'adet';
  const lower = value.toLowerCase();
  const byLabel = units.find(
    (unit) => unit.labelTm.toLowerCase() === lower || unit.labelTr.toLowerCase() === lower
  );
  if (byLabel) return byLabel.code;
  const byCode = units.find((unit) => unit.code === lower);
  if (byCode) return byCode.code;
  return makeUnitCode(value) || 'adet';
}

// ── Excel okamak ────────────────────────────────────────────────────────────

export async function readProductFile(file: File): Promise<SheetData> {
  return readSheet(file);
}

/**
 * Başlýan setiriň ýerini tapýar — stilli çyktylarda logo/firma setirleri
 * başdan bolup biler, şonuň üçin «iň köp meşhur başlyk bar bolan setir»
 * saýlanýar (aynyndan ilkinji setir däl-de, islendik setir).
 */
export function findHeaderRowIndex(data: SheetData): number {
  const limit = Math.min(data.length, 12);
  let best = 0;
  let bestScore = -1;
  for (let r = 0; r < limit; r += 1) {
    const row = data[r];
    if (!row) continue;
    let score = 0;
    for (const column of PRODUCT_EXCEL_COLUMNS) {
      if (row.some((cell) => cellText(cell).toLowerCase() === column.header.toLowerCase())) {
        score += 1;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      best = r;
    }
  }
  return bestScore > 0 ? best : 0;
}

/** Excel setirlerini kadalara laýyklykda barlap, önümiň garalama döredýär. */
export function parseRows(data: SheetData, units: readonly MeasurementUnit[]): ParsedRow[] {
  const headerIndex = findHeaderRowIndex(data);
  if (data.length < headerIndex + 2) return [];

  const headerRow = data[headerIndex];
  const indexOf: Record<string, number> = {};
  for (const column of PRODUCT_EXCEL_COLUMNS) {
    const index = headerRow.findIndex(
      (cell) => cellText(cell).toLowerCase() === column.header.toLowerCase()
    );
    if (index >= 0) indexOf[column.key] = index;
  }

  const seenBarcodes = new Map<string, number>();
  const parsed: ParsedRow[] = [];

  for (let rowIndex = headerIndex + 1; rowIndex < data.length; rowIndex += 1) {
    const row = data[rowIndex];
    const errors: string[] = [];
    const value = (key: keyof ProductDraft): string => {
      const index = indexOf[key];
      return index === undefined ? '' : cellText(row[index]);
    };

    const draft = defaultDraft();
    draft.name = value('name');
    draft.category = value('category');
    draft.barcode = value('barcode');
    draft.sku = value('sku');
    draft.unit = resolveUnitCode(units, value('unit'));
    const unit2Text = value('unit2');
    draft.unit2 = unit2Text ? resolveUnitCode(units, unit2Text) : '';
    draft.unit2Qty = Math.max(1, Math.round(cellNumber(value('unit2Qty'))) || 1);
    draft.purchasePrice = cellNumber(value('purchasePrice'));
    draft.price = cellNumber(value('price'));
    draft.stock = cellNumber(value('stock'));
    draft.criticalStock = Math.round(cellNumber(value('criticalStock'))) || 0;
    draft.expiryDate = value('expiryDate');

    if (!draft.name) errors.push('Haryt ady boş');
    if (!draft.barcode) errors.push('Ana barkod boş');
    if (draft.price <= 0) errors.push('Satyş bahasy nädogry');

    if (draft.barcode) {
      const firstSeen = seenBarcodes.get(draft.barcode);
      if (firstSeen !== undefined) {
        errors.push(`Barkod faýlda gaýtalanýar (${firstSeen}-nji setirde)`);
      } else {
        seenBarcodes.set(draft.barcode, rowIndex);
      }
    }

    // Doly boş setirler geçilýär
    const isEmpty = ['name', 'barcode', 'sku', 'category'].every((key) => !value(key as keyof ProductDraft));
    if (isEmpty && errors.length === 0) continue;

    parsed.push({
      rowNumber: rowIndex,
      draft: errors.length === 0 ? draft : null,
      errors,
    });
  }

  return parsed;
}

// ─ Excel ýazmak ────────────────────────────────────────────────────────────

export function buildExportRows(
  products: readonly {
    name: string;
    category: string;
    barcode: string;
    sku: string;
    unit?: string;
    unit2?: string;
    unit2Qty?: number;
    purchasePrice?: number;
    price: number;
    stock: number;
    criticalStock?: number;
    expiryDate?: string;
  }[],
  units: readonly MeasurementUnit[]
): (string | number)[][] {
  const header = PRODUCT_EXCEL_COLUMNS.map((column) => column.header);
  const rows = products.map((product) => [
    product.name,
    product.category,
    product.barcode,
    product.sku,
    unitText(units, product.unit ?? 'adet'),
    product.unit2 ? unitText(units, product.unit2) : '',
    product.unit2 ? product.unit2Qty ?? 1 : '',
    product.purchasePrice ?? 0,
    product.price,
    product.stock,
    product.criticalStock ?? 0,
    product.expiryDate ?? '',
  ]);
  return [header, ...rows];
}

export async function writeProductExcel(
  rows: (string | number)[][],
  fileName: string
): Promise<void> {
  await writeExcelFile(rows).toFile(fileName);
}

/** Örnek şablon: sözbaşy + bir nusga setir. */
export function buildTemplateRows(): (string | number)[][] {
  const header = PRODUCT_EXCEL_COLUMNS.map((column) => column.header);
  const sample = ['Nusga haryt', 'Programma', '1234567890', 'SKU-1', 'SANY', '', '', 100, 150, 10, 5, ''];
  return [header, sample];
}

export async function downloadTemplate(): Promise<void> {
  await writeExcelFile(buildTemplateRows()).toFile('haryt-sablon.xlsx');
}