import {
  readSheet as readSheetRaw,
  InvalidInputError,
  type SheetData,
} from 'read-excel-file/browser';
import writeExcelFile from 'write-excel-file/browser';

/**
 * Excel okamak/ýazmak üçin umumy ýöriteleşdirilen gatlak.
 * Haryt we Müşderi modullary şu bir ýeri ulanýar (DRY).
 */
export { writeExcelFile, InvalidInputError, type SheetData };

/** Import çäkleri — uly faýl WebView-i dondurdyryp bilýär. */
export const EXCEL_MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
export const EXCEL_MAX_ROWS = 50_000;

/** Metin öýjükleri üçin iň uzyn kabul edilýän uzynlyk. */
const MAX_CELL_TEXT = 500;
/** San öýjükleri üçin kabul edilýän iň uly absolýut baha. */
const MAX_CELL_NUMBER = 1e12;

/** Faýl çäkleri bozulanda atylýan ýalňyşlyk (describeReadError terjime edýär). */
export class ExcelLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ExcelLimitError';
  }
}

/** Faýly okap, setirleri san görnüşinde gaýtarýar; çäkler bozulsa ExcelLimitError atýar. */
export async function readSheet(file: File): Promise<SheetData> {
  if (file.size > EXCEL_MAX_FILE_BYTES) {
    throw new ExcelLimitError('Faýl gaty uly — 10 MB-dan kiçi bolmaly.');
  }
  const data = await readSheetRaw(file);
  if (data.length > EXCEL_MAX_ROWS) {
    throw new ExcelLimitError(`Faýlda gaty köp setir bar — iň köp ${EXCEL_MAX_ROWS} kabul edilýär.`);
  }
  return data;
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
export function describeReadError(error: unknown): string {
  if (error instanceof ExcelLimitError) {
    return error.message;
  }
  if (error instanceof InvalidInputError) {
    if (error.code === 'XLS_FILE_NOT_SUPPORTED') {
      return 'Köne .xls formaty goldanylmaýar. Faýly .xlsx görnüşinde ýazdyryň.';
    }
    if (error.code === 'FILE_NOT_SUPPORTED') {
      return 'Faýl .xlsx däl. Diňe .xlsx kabul edilýär.';
    }
    if (error.code === 'INVALID_ZIP' || error.code === 'NO_DATA') {
      return 'Faýl zaýalanan ýa-da boş.';
    }
    return 'Faýl okalyp bilinmedi.';
  }
  return 'Faýl okalyp bilinmedi.';
}