/**
 * Stilli Excel workbook gurluşy — ähli aktarma tablalary MUNDAQ ýazylyar.
 *
 * Üpjür edilenler (1) bölümü:
 *  - üstde firma/hesap ady, logo, belge başlygy, döredilme senesi
 *  - reňkli-kalyn başlýan setir, inçe çarçuwlar, zebra (setir aralyk reňk)
 *  - awtomatik sütun giňligi, başlýan setiriň ýokary berkidilmegi, awtomatik süzgüç
 *  - para / sany / göterim / tarih GERÇEK Excel formatynda (metin däl)
 *  - aşaky jemiň setiri
 *  - düşük stok / borçly ýagdaýlarynyň reňkli vurgusy
 *  - A4 çap režimi, ýygnama (fit), her sahypada başlýan setiriniň gaýtalanmagy
 *  - gizli `_meta` sahypasy: programma, şablon görnüşi, wersiýa, hesap, senesi, saýlananlyklar
 */

import ExcelJS from 'exceljs';
import {
  APP_NAME,
  NUMBER_FORMAT,
  THEME,
  excelTheme,
  type ExcelColumn,
  type ExcelMeta,
  type RowTone,
} from './excelStyle';
import { saveFileAs } from './electron';

// ── Reňk kömekçileri (ARGB = FF + RRGGBB) ──────────────────────────────────
const argb = (hex: string): string => (hex.length === 8 ? hex : `FF${hex}`);

const thinBorder = (color: string): Partial<ExcelJS.Borders> => ({
  top: { style: 'thin', color: { argb: argb(color) } },
  left: { style: 'thin', color: { argb: argb(color) } },
  bottom: { style: 'thin', color: { argb: argb(color) } },
  right: { style: 'thin', color: { argb: argb(color) } },
});

const solidFill = (hex: string): ExcelJS.Fill => ({
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: argb(hex) },
});

const toneFill = (tone: RowTone): ExcelJS.Fill | null => {
  if (tone === 'danger') return solidFill(THEME.dangerSoft);
  if (tone === 'warning') return solidFill(THEME.warningSoft);
  return null;
};

const toneFont = (tone: RowTone): Partial<ExcelJS.Font> => {
  if (tone === 'danger') return { color: { argb: argb(THEME.danger) }, bold: true };
  if (tone === 'warning') return { color: { argb: argb(THEME.warning) } };
  return {};
};

function numFmtFor(kind: ExcelColumn<unknown>['kind']): string | undefined {
  if (kind === 'money') return NUMBER_FORMAT.money;
  if (kind === 'qty') return NUMBER_FORMAT.qty;
  if (kind === 'percent') return NUMBER_FORMAT.percent;
  if (kind === 'date') return NUMBER_FORMAT.date;
  return undefined;
}

function toDate(value: string | number | Date | null): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

/**
 * Formula injection garşysy: «= + - @» bilen başlaýan METIN bahalarynyň
 * öňüne ' goýulýar — ExcelJS olary işjeň formula hökmünde ýazyp bilerdi.
 * San tipinde gelen bahalara (meselem, otrisatel sanlara) degilmeýär.
 */
function escapeFormulaText(value: string): string {
  return /^[=+\-@]/.test(value) ? `'${value}` : value;
}

/** Başlyga görä ýazgy giňligi (excel birligi: 1 ≈ bir harf). */
function widthFor(header: string, sample: (string | number | Date | null)[]): number {
  let longest = header.length;
  for (const cell of sample) {
    if (cell === null) continue;
    const text = cell instanceof Date ? '00.00.0000' : String(cell);
    if (text.length > longest) longest = text.length;
  }
  return Math.min(46, Math.max(10, longest + 4));
}

export interface StyledSheetOptions<Row> {
  /** Saklama diyaloğunun aktif UI dilindeki başlığı. */
  readonly dialogTitle?: string;
  readonly sheetName: string;
  /** Belge başlygy — "Haryt Listesi", "Müşderi Listesi" ... */
  readonly title: string;
  /** Firma / hesap ady — header'da görkezilýär. */
  readonly accountName: string;
  readonly columns: readonly ExcelColumn<Row>[];
  readonly rows: readonly Row[];
  readonly meta: ExcelMeta;
  /** Jemiň setirinde görkezilýän label ("Jemi", "Toplam" ...). */
  readonly totalLabel?: string;
  /** Ýazgy senesi (default: şu gün). */
  readonly generatedAt?: Date;
  /** Boş şablon — 2 nusga setir + düşündiriş setiri goşulýar. */
  readonly template?: boolean;
  /** Önceden özetlenmiş raporlarda boş/yanıltıcı bir toplam satırı eklenmez. */
  readonly showTotals?: boolean;
}

/**
 * Stilli eýik (sayfa) ýazýar. Ýokaryda logo + firma + başlyk,
 * aşakynda jem setiri bilen bilelikde.
 */
export function buildStyledSheet<Row>(
  workbook: ExcelJS.Workbook,
  options: StyledSheetOptions<Row>
): void {
  const {
    sheetName,
    title,
    accountName,
    columns,
    rows,
    meta,
    totalLabel = 'Jemi',
    generatedAt = new Date(),
    template = false,
  } = options;

  const sheet = workbook.addWorksheet(sheetName, {
    // Başlýan setirleri ýokary berkidip ýazýarys (logo + firma + başlyk + başlýan setir).
    views: [{ state: 'frozen', ySplit: 4, showGridLines: false }],
    pageSetup: {
      paperSize: 9, // A4
      orientation: 'portrait',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      printTitlesRow: '1:4', // her sahypada başlýan setir gaýtalanýar
      margins: { left: 0.4, right: 0.4, top: 0.6, bottom: 0.5, header: 0.2, footer: 0.2 },
    },
  });

  const colCount = Math.max(1, columns.length);
  // 1 = logo, 2 = firma/başlyk, 3 = senesi
  sheet.getCell(1, 3).value = generatedAt.toISOString().slice(0, 10);
  sheet.getCell(1, 3).numFmt = NUMBER_FORMAT.date;
  sheet.getCell(1, 3).font = { size: 10, color: { argb: argb(THEME.textMuted) } };
  sheet.getCell(1, 3).alignment = { horizontal: 'right', vertical: 'middle' };

  sheet.getCell(2, 1).value = accountName || APP_NAME;
  sheet.getCell(2, 1).font = { size: 14, bold: true, color: { argb: argb(THEME.navy) } };
  sheet.getCell(2, 2).value = title;
  sheet.getCell(2, 2).font = { size: 12, bold: true, color: { argb: argb(THEME.green) } };
  sheet.getCell(2, 2).alignment = { vertical: 'middle' };
  sheet.getRow(2).height = 22;

  sheet.getCell(3, 1).value = meta.template;
  sheet.getCell(3, 1).font = { size: 9, italic: true, color: { argb: argb(THEME.textMuted) } };
  sheet.mergeCells(3, 1, 3, colCount);

  // Logo — PNG base64 gömülýär (SVG ExcelJS tarafyndan goldanmaýar).
  try {
    const imageId = workbook.addImage({
      base64: excelTheme.logoDataUrl,
      extension: 'png',
    });
    sheet.addImage(imageId, {
      tl: { col: colCount - 0.9, row: 0.15 },
      ext: { width: 68, height: 68 },
    });
  } catch {
    // Logo ýok bolsa ýazmak dogrusy hem ýeterlik — çykyşy saklaýarys.
  }

  const headerRowIndex = 4;
  const headerRow = sheet.getRow(headerRowIndex);
  columns.forEach((column, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = column.header;
    cell.font = { bold: true, size: 10.5, color: { argb: argb(THEME.white) } };
    cell.fill = solidFill(THEME.navy);
    cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
    cell.border = thinBorder(THEME.navy);
  });
  headerRow.height = 22;

  // Başlangyç sanlary (nusga üçin).
  const bodyRows = template
    ? (rows.slice(0, 2) as readonly Row[])
    : rows;
  const firstDataRow = headerRowIndex + 1;

  bodyRows.forEach((row, rowIndex) => {
    const excelRow = sheet.getRow(firstDataRow + rowIndex);
    const isZebra = rowIndex % 2 === 1;

    // Satyryň vurgusy: bir sütun «danger/warning» diýse şol reňk ulanylýar.
    let tone: RowTone = null;
    for (const column of columns) {
      const t = column.tone?.(row) ?? null;
      if (t) {
        tone = t;
        break;
      }
    }

    columns.forEach((column, i) => {
      const cell = excelRow.getCell(i + 1);
      const raw = column.get(row);
      const kind = column.kind ?? 'text';

      if (kind === 'date') {
        const date = toDate(raw);
        cell.value = date;
        if (date) cell.numFmt = NUMBER_FORMAT.date;
      } else if (kind === 'money' || kind === 'qty' || kind === 'percent') {
        if (typeof raw === 'number' && Number.isFinite(raw)) cell.value = raw;
        else if (typeof raw === 'string' && raw.trim() !== '') {
          const parsed = Number(raw.replace(',', '.'));
          cell.value = Number.isFinite(parsed) ? parsed : escapeFormulaText(raw);
        } else cell.value = null;
        const fmt = column.numFmt ?? numFmtFor(kind);
        if (fmt && typeof cell.value === 'number') cell.numFmt = fmt;
      } else {
        cell.value = raw === null ? '' : typeof raw === 'string' ? escapeFormulaText(raw) : raw;
      }

      if (kind === 'money' || kind === 'qty' || kind === 'percent') {
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
      } else {
        cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: false };
      }

      const fill = toneFill(tone ?? null) ?? (isZebra ? solidFill(THEME.zebra) : null);
      if (fill) cell.fill = fill;
      cell.font = { size: 10, ...toneFont(tone ?? null) };
      cell.border = thinBorder(THEME.border);
    });
  });

  const lastDataRow = firstDataRow + bodyRows.length - 1;

  // Awtomatik süzgüç — başlýan setirde.
  if (bodyRows.length > 0 && colCount > 0) {
    sheet.autoFilter = {
      from: { row: headerRowIndex, column: 1 },
      to: { row: headerRowIndex, column: colCount },
    };
  }

  // Aşaky jem setiri — has sütunlary toplanýar.
  if (!template && options.showTotals !== false && bodyRows.length > 0) {
    const totalRowIndex = lastDataRow + 1;
    const totalRow = sheet.getRow(totalRowIndex);
    columns.forEach((column, i) => {
      const cell = totalRow.getCell(i + 1);
      if (i === 0) {
        cell.value = totalLabel;
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      } else if (column.total === 'sum' || typeof column.total === 'number') {
        let sum = typeof column.total === 'number' ? column.total : 0;
        if (column.total === 'sum') {
          for (const row of rows) {
            const value = column.get(row);
            if (typeof value === 'number' && Number.isFinite(value)) sum += value;
          }
        }
        cell.value = Math.round(sum * 100) / 100;
        const fmt = column.numFmt ?? numFmtFor(column.kind ?? 'qty');
        if (fmt) cell.numFmt = fmt;
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
      }
      cell.font = { bold: true, size: 10, color: { argb: argb(THEME.navy) } };
      cell.fill = solidFill(THEME.greenSoft);
      cell.border = thinBorder(THEME.navy);
    });
    totalRow.height = 20;
  }

  // Sütun giňlikleri — awtomatik (iň uzyn içerikden).
  columns.forEach((column, i) => {
    if (column.width) {
      sheet.getColumn(i + 1).width = column.width;
      return;
    }
    const sample = bodyRows.slice(0, 60).map((row) => column.get(row));
    sheet.getColumn(i + 1).width = widthFor(column.header, sample);
  });
}

/** Gizli `_meta` sahypasy — şablon görnüşi we saýlananlyklar. */
export function buildMetaSheet(workbook: ExcelJS.Workbook, meta: ExcelMeta): void {
  const sheet = workbook.addWorksheet('_meta', {
    state: 'hidden',
    views: [{ showGridLines: false }],
  });
  const entries: [string, string | number | boolean][] = [
    ['app', APP_NAME],
    ['template', meta.template],
    ['templateVersion', meta.templateVersion],
    ['account', meta.accountName],
    ['generatedAt', new Date().toISOString()],
    ...Object.entries(meta.options).map(
      ([key, value]) => [key, value] as [string, string | number | boolean]
    ),
  ];
  entries.forEach(([key, value], i) => {
    sheet.getCell(i + 1, 1).value = key;
    sheet.getCell(i + 1, 1).font = { bold: true, size: 10 };
    sheet.getCell(i + 1, 2).value = value;
  });
  sheet.getColumn(1).width = 22;
  sheet.getColumn(2).width = 34;
}

/** Workbook-y `.xlsx` buffer-ine öwürýär. */
export async function writeWorkbook(
  workbook: ExcelJS.Workbook
): Promise<ArrayBuffer> {
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer as ArrayBuffer;
}

/**
 * Stilli çykty döredip ýatda ýazýar (Electron-da «Sakla» penjiresi bilen).
 * @returns faýl ýazylmady bolsa `false`.
 */
export async function createAndSaveStyledWorkbook<Row>(
  options: StyledSheetOptions<Row>,
  defaultName: string
): Promise<boolean> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = APP_NAME;
  workbook.created = options.generatedAt ?? new Date();
  buildStyledSheet(workbook, options);
  buildMetaSheet(workbook, options.meta);

  const buffer = await workbook.xlsx.writeBuffer();
  const bytes = new Uint8Array(buffer as ArrayBuffer);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return saveFileAs({
    title: options.dialogTitle ?? 'Excel-e çyk',
    defaultName,
    data: btoa(binary),
    filters: [{ name: 'Excel (.xlsx)', extensions: ['xlsx'] }],
  });
}
