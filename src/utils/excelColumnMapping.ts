import { cellText, ExcelReadError, type SheetData } from './excelIO';

export interface ImportColumn<Key extends string> {
  readonly key: Key;
  /** Türkmençe export sözleşmesi; alias'lar yalnızca import'ta kullanılır. */
  readonly header: string;
  readonly required: boolean;
  readonly aliases?: readonly string[];
}

export interface ExcelColumnSelection<Key extends string> {
  readonly headerIndex: number;
  readonly mapping: Partial<Record<Key, number>>;
  readonly ambiguousKeys?: readonly Key[];
}

export function normalizeExcelHeader(value: unknown): string {
  return cellText(value).normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '').replace(/ı/g, 'i')
    .toLowerCase().replace(/[\s\p{P}\p{S}]+/gu, '');
}

export function mapHeaderColumns<Key extends string>(
  row: readonly unknown[],
  columns: readonly ImportColumn<Key>[]
): Partial<Record<Key, number>> {
  const headers = row.map(normalizeExcelHeader);
  const mapping: Partial<Record<Key, number>> = {};
  const used = new Set<number>();
  const ambiguous = new Set<Key>();
  // Canonical başlıklar alias'lardan önce gelir. Birden çok eşleşme sessizce
  // seçilmez; kullanıcı kaynak kolonu manuel olarak seçmelidir.
  for (const canonical of [true, false]) {
    for (const column of columns) {
      if (mapping[column.key] !== undefined || ambiguous.has(column.key)) continue;
      const names = canonical ? [column.header] : column.aliases ?? [];
      const normalized = names.map(normalizeExcelHeader);
      const candidates = headers.flatMap((header, index) =>
        header && normalized.includes(header) ? [index] : []
      );
      if (candidates.length > 1) ambiguous.add(column.key);
      if (candidates.length === 1 && !used.has(candidates[0])) {
        mapping[column.key] = candidates[0];
        used.add(candidates[0]);
      }
    }
  }
  return mapping;
}

export function selectExcelHeader<Key extends string>(
  data: SheetData, headerIndex: number, columns: readonly ImportColumn<Key>[]
): ExcelColumnSelection<Key> {
  const row = data[headerIndex] ?? [];
  const headers = row.map(normalizeExcelHeader);
  const ambiguousKeys = columns.flatMap((column) => {
    const exact = headers.filter((value) => value === normalizeExcelHeader(column.header));
    const aliases = (column.aliases ?? []).map(normalizeExcelHeader);
    const count = exact.length || headers.filter((value) => value && aliases.includes(value)).length;
    return count > 1 ? [column.key] : [];
  });
  return { headerIndex, mapping: mapHeaderColumns(row, columns), ambiguousKeys };
}

export function detectExcelColumns<Key extends string>(
  data: SheetData,
  columns: readonly ImportColumn<Key>[]
): ExcelColumnSelection<Key> {
  let best: ExcelColumnSelection<Key> = { headerIndex: 0, mapping: {} };
  let bestScore = -1;
  for (let index = 0; index < Math.min(data.length, 12); index += 1) {
    const selection = selectExcelHeader(data, index, columns);
    const { mapping } = selection;
    const score = columns.reduce((sum, column) =>
      sum + (mapping[column.key] === undefined && !selection.ambiguousKeys?.includes(column.key)
        ? 0 : column.required ? 3 : 1), 0);
    if (score > bestScore) {
      best = selection;
      bestScore = score;
    }
  }
  return best;
}

export function validExcelSelection<Key extends string>(
  data: SheetData,
  columns: readonly ImportColumn<Key>[],
  selection: ExcelColumnSelection<Key>
): boolean {
  const { headerIndex, mapping } = selection;
  if (selection.ambiguousKeys?.length) return false;
  if (!Number.isInteger(headerIndex) || headerIndex < 0 || headerIndex >= data.length - 1) return false;
  const width = data[headerIndex]?.length ?? 0;
  const used = new Set<number>();
  for (const column of columns) {
    const index = mapping[column.key];
    if (index === undefined) {
      if (column.required) return false;
      continue;
    }
    if (!Number.isInteger(index) || index < 0 || index >= width || used.has(index)) return false;
    used.add(index);
  }
  return true;
}

export function requireExcelSelection<Key extends string>(
  data: SheetData,
  columns: readonly ImportColumn<Key>[],
  selection?: ExcelColumnSelection<Key>
): ExcelColumnSelection<Key> {
  const result = selection ?? detectExcelColumns(data, columns);
  if (!validExcelSelection(data, columns, result)) throw new ExcelReadError('MAPPING_REQUIRED');
  return result;
}
