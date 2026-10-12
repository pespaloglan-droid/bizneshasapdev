import { detectExcelColumns, requireExcelSelection, type ImportColumn, type ExcelColumnSelection } from './excelColumnMapping';
import {
  readSheet,
  cellText,
  cellNumber,
  isTotalRowLabel,
  type SheetData,
} from './excelIO';
import { makeUnitCode, type MeasurementUnit } from '../db/unitService';

export { describeReadError } from './excelIO';

/** Excel faýlynyň kolonlary — forma meýdançalary bilen birebir deň. */
export const PRODUCT_EXCEL_COLUMNS: readonly ImportColumn<keyof ProductDraft>[] = [
  { key: 'name', header: 'Haryt Ady', required: true, aliases: ["ürün adı", "urun adi", "product name", "name", "наименование", "название товара", "haryt"] },
  { key: 'category', header: 'Kategoriýa', required: false, aliases: ["kategori", "category", "категория"] },
  { key: 'barcode', header: 'Ana Barkod', required: true, aliases: ["barkod", "barcode", "штрих-код", "штрихкод", "barkod nomeri"] },
  { key: 'sku', header: 'SKU', required: false, aliases: ["stok kodu", "stock code", "артикул"] },
  { key: 'unit', header: 'Ölçeg Birligi 1', required: false, aliases: ["birim", "ölçü birimi", "unit", "unit 1", "единица", "единица измерения"] },
  { key: 'unit2', header: 'Ölçeg Birligi 2', required: false, aliases: ["ikinci birim", "birim 2", "unit 2", "secondary unit", "вторая единица"] },
  { key: 'unit2Qty', header: '1 (2-nji birlik) = ? (1-nji birlik)', required: false, aliases: ["birim çarpanı", "unit multiplier", "conversion factor", "коэффициент пересчета"] },
  { key: 'purchasePrice', header: 'Alyş Bahasy', required: false, aliases: ["alış fiyatı", "alis fiyati", "purchase price", "cost price", "закупочная цена"] },
  { key: 'price', header: 'Satyş Bahasy', required: true, aliases: ["satış fiyatı", "satis fiyati", "price", "sale price", "selling price", "цена продажи"] },
  { key: 'stock', header: 'Bar Stok Mukdary', required: false, aliases: ["stok", "stok miktarı", "stock", "quantity in stock", "остаток", "количество на складе"] },
  { key: 'criticalStock', header: 'Kritik Stok Duýdurşy', required: false, aliases: ["kritik stok", "minimum stok", "critical stock", "minimum stock", "минимальный остаток"] },
  { key: 'expiryDate', header: 'Ýaramlylyk Möhleti (SKT)', required: false, aliases: ["son kullanma tarihi", "skt", "expiry date", "expiration date", "срок годности"] },
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
  /** Excel-de görnýän hakyky setir belgisi (1-den başlaýar, sözbaşy hem hasaba alnar). */
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
  return detectExcelColumns(data, PRODUCT_EXCEL_COLUMNS).headerIndex;
}

/** Excel setirlerini kadalara laýyklykda barlap, önümiň garalama döredýär. */
export function parseRows(data: SheetData, units: readonly MeasurementUnit[], selection?: ExcelColumnSelection<keyof ProductDraft>): ParsedRow[] {
  if (data.length < 2) return [];
  const { headerIndex, mapping: indexOf } = requireExcelSelection(data, PRODUCT_EXCEL_COLUMNS, selection);

  const seenBarcodes = new Map<string, number>();
  const parsed: ParsedRow[] = [];

  for (let rowIndex = headerIndex + 1; rowIndex < data.length; rowIndex += 1) {
    const row = data[rowIndex];
    if (row.every((cell) => !cellText(cell))) continue;
    // Stilli eksportyň aşakyndaky «Jemi» setiri importda geçilýär.
    if (isTotalRowLabel(cellText(row[0]))) continue;
    // Excel-de görnýän hakyky setir belgisi (0-based index + 1).
    const excelRowNumber = rowIndex + 1;
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
        seenBarcodes.set(draft.barcode, excelRowNumber);
      }
    }

    // Doly boş setirler geçilýär
    const isEmpty = ['name', 'barcode', 'sku', 'category'].every((key) => !value(key as keyof ProductDraft));
    if (isEmpty && errors.length === 0) continue;

    parsed.push({
      rowNumber: excelRowNumber,
      draft: errors.length === 0 ? draft : null,
      errors,
    });
  }

  return parsed;
}
