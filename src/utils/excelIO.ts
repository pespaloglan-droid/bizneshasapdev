import { readSheet, InvalidInputError, type SheetData } from 'read-excel-file/browser';
import writeExcelFile from 'write-excel-file/browser';

/**
 * Excel okamak/ýazmak üçin umumy ýöriteleşdirilen gatlak.
 * Haryt we Müşderi modullary şu bir ýeri ulanýar (DRY).
 */
export { readSheet, writeExcelFile, InvalidInputError, type SheetData };

/** Excel öýjügini tekste öwürýär (boş bahalar hem). */
export function cellText(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).trim();
}

/** Excel öýjügini san bilen öwürýär; nädogry bolsa 0. */
export function cellNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const parsed = parseFloat(cellText(value).replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Faýl okalanda ýüze çykan ýalňyşlygy ulanyja düşnükli Türkmençe aýdýar. */
export function describeReadError(error: unknown): string {
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