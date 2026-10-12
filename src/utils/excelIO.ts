import ExcelJS from 'exceljs';
import type { LanguageCode } from '../types';
import { translate } from '../locales/i18n';
import { getActiveLanguage } from './locale';

/**
 * Excel okamak üçin umumy ýöriteleşdirilen gatlak (ExcelJS).
 * Haryt we Müşderi modullary şu bir ýeri ulanýar (DRY).
 */
export type SheetCell = string | number | boolean | Date | null;
export type SheetData = SheetCell[][];

type ReadErrorCode = 'FILE_TOO_LARGE' | 'TOO_MANY_ROWS' | 'XLS_NOT_SUPPORTED'
  | 'XLSX_ONLY' | 'INVALID_FILE' | 'READ_FAILED' | 'MAPPING_REQUIRED';

export class ExcelReadError extends Error {
  constructor(readonly code: ReadErrorCode) {
    super(code);
    this.name = 'ExcelReadError';
  }
}

/** Import çäkleri — uly faýl WebView-i dondurdyryp bilýär. */
export const EXCEL_MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
export const EXCEL_MAX_ROWS = 50_000;

/** Metin öýjükleri üçin iň uzyn kabul edilýän uzynlyk. */
const MAX_CELL_TEXT = 500;
/** San öýjükleri üçin kabul edilýän iň uly absolýut baha. */
const MAX_CELL_NUMBER = 1e12;

/** Faýl çäkleri bozulanda atylýan ýalňyşlyk (describeReadError terjime edýär). */
export class ExcelLimitError extends ExcelReadError {
  constructor(code: 'FILE_TOO_LARGE' | 'TOO_MANY_ROWS') {
    super(code);
    this.name = 'ExcelLimitError';
  }
}

/** Faýly okap, setirleri san görnüşinde gaýtarýar; çäkler bozulsa ExcelLimitError atýar. */
export async function readSheet(file: File): Promise<SheetData> {
  if (file.size > EXCEL_MAX_FILE_BYTES) {
    throw new ExcelLimitError('FILE_TOO_LARGE');
  }
  if (/\.xls$/i.test(file.name)) throw new ExcelReadError('XLS_NOT_SUPPORTED');
  if (!/\.xlsx$/i.test(file.name)) throw new ExcelReadError('XLSX_ONLY');

  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(await file.arrayBuffer());
  } catch {
    // XML/ZIP ayrıntıları veya dosya içeriği UI'a sızdırılmaz.
    throw new ExcelReadError('INVALID_FILE');
  }
  // Önceki okuyucu gibi ilk worksheet okunur. Kendi çıktılarımızda _meta ikincidir.
  const sheet = workbook.worksheets[0];
  if (!sheet) throw new ExcelReadError('INVALID_FILE');

  const data: SheetData = [];
  let lastRow = 0;
  let lastColumn = 0;
  sheet.eachRow((row, rowNumber) => {
    const values: SheetCell[] = [];
    let hasValue = false;
    row.eachCell((cell, columnNumber) => {
      // Birleştirilmiş hücrelerde yalnızca asıl değer alınır, kopyalanmaz.
      if (cell.type === ExcelJS.ValueType.Merge) return;
      const value = readCellValue(cell.value);
      if (value === null) return;
      if (rowNumber > EXCEL_MAX_ROWS) throw new ExcelLimitError('TOO_MANY_ROWS');
      values[columnNumber - 1] = value;
      lastColumn = Math.max(lastColumn, columnNumber);
      hasValue = true;
    });
    if (hasValue) {
      data[rowNumber - 1] = values;
      lastRow = rowNumber;
    }
  });
  if (lastRow === 0) throw new ExcelReadError('INVALID_FILE');

  // Boş ara satırlar/hücreler korunur: hata raporundaki gerçek satır no değişmez.
  for (let r = 0; r < lastRow; r += 1) {
    const row = data[r] ?? [];
    for (let c = 0; c < lastColumn; c += 1) row[c] ??= null;
    data[r] = row;
  }
  return data;
}

/** Formüller çalıştırılmaz; yalnızca dosyada kayıtlı sonuçları okunur. */
function readCellValue(value: ExcelJS.CellValue | undefined): SheetCell {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if ('formula' in value || 'sharedFormula' in value) return readCellValue(value.result);
  if ('richText' in value) return value.richText.map((part) => part.text).join('');
  if ('text' in value) return value.text;
  // Excel hata hücreleri geçerli veriye veya "[object Object]" metnine dönüşmez.
  return null;
}

/** Excel öýjügini tekste öwürýär (boş bahalar hem); zyýanly içerigi arassaýar. */
export function cellText(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  // Tab/newline-den başga C0 gözegçilik nyşanlary we DEL aýrylýar.
  let text = String(value)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim();
  // Formula injection garşysy: '=' bilen başlaýan metin DB-e ýazylmaz
  // (soň eksportda işjeň formula bolup galmaz ýaly).
  if (text.startsWith('=')) text = text.replace(/^=+/, '').trimStart();
  if (text.length > MAX_CELL_TEXT) text = text.slice(0, MAX_CELL_TEXT);
  return text;
}

/** Excel öýjügini san bilen öwürýär; nädogry ýa-da çäkden uly bolsa 0. */
export function cellNumber(value: unknown): number {
  const num =
    typeof value === 'number' && Number.isFinite(value)
      ? value
      : parseFloat(cellText(value).replace(',', '.'));
  if (!Number.isFinite(num) || Math.abs(num) > MAX_CELL_NUMBER) return 0;
  return num;
}

/** «Jemi»/«Total» ýaly jemiň setirlerini tanap, importda geçilmegine ýardam berýär. */
export function isTotalRowLabel(text: string): boolean {
  const normalized = text.trim().toLowerCase().replace(/:+$/, '');
  return normalized === 'jemi' || normalized === 'total' || normalized === 'toplam';
}

/** Faýl okalanda ýüze çykan ýalňyşlygy ulanyja düşnükli Türkmençe aýdýar. */
export function describeReadError(error: unknown, language: LanguageCode = getActiveLanguage()): string {
  const keys: Record<ReadErrorCode, string> = {
    FILE_TOO_LARGE: 'excel.fileTooLarge',
    TOO_MANY_ROWS: 'excel.tooManyRows',
    XLS_NOT_SUPPORTED: 'excel.xlsNotSupported',
    XLSX_ONLY: 'excel.xlsxOnly',
    INVALID_FILE: 'excel.invalidFile',
    READ_FAILED: 'excel.readFailed',
    MAPPING_REQUIRED: 'excel.mappingRequired',
  };
  const code = error instanceof ExcelReadError ? error.code : 'READ_FAILED';
  return translate(language, keys[code], { maxRows: EXCEL_MAX_ROWS, maxMB: 10 });
}
