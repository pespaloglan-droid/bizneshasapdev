/**
 * Excel import ýalňyşlyk hasabaty — şowsuz galan setirleri `.xlsx` hökmünde ýazýar.
 *
 * Haryt we müşderi importynda ortak: setir belgisi, tanam (barkod/telefon),
 * ad we sebäp. Stili ähli çyktylar ýaly excelWriter görnüşinde ýazylýar.
 */

import { createAndSaveStyledWorkbook } from './excelWriter';
import type { ExcelColumn } from './excelStyle';

/** Importda ýazylmadyk bir setir — UI sanawy we hasabat üçin ortak görnüş. */
export interface ImportErrorRow {
  /** Excel-de görnýän hakyky setir belgisi. */
  row: number;
  /** Haryt ady ýa-da müşderi ady. */
  name: string;
  /** Tanam: haryt üçin barkod, müşderi üçin telefon. */
  detail: string;
  /** Ýalňyşlyk sebäbi (PouchDB ýalňyşlyk teksti). */
  reason: string;
}

export interface ImportErrorReportOptions {
  readonly accountName: string;
  /** Çykty faýlynyň ady (mys. 'haryt-import-yalnyslyklar.xlsx'). */
  readonly fileName: string;
  /** 'Haryt Import Ýalňyşlyk Hasabaty' */
  readonly title: string;
  /** Detail sütunyň başlygy: 'Barkod' ýa-da 'Telefon belgisi'. */
  readonly detailHeader: string;
  readonly rows: readonly ImportErrorRow[];
}

/**
 * Şowsuz setirleriň hasabatyny döredip ýazdyrýar (Electron-da «Sakla» penjiresi).
 * @returns faýl ýazylmady bolsa `false`.
 */
export async function saveImportErrorReport(
  options: ImportErrorReportOptions
): Promise<boolean> {
  const columns: readonly ExcelColumn<ImportErrorRow>[] = [
    { header: 'Setir №', get: (f) => f.row, kind: 'qty', width: 10 },
    { header: options.detailHeader, get: (f) => f.detail, width: 18 },
    { header: 'Ady', get: (f) => f.name, width: 30 },
    { header: 'Sebäp', get: (f) => f.reason, width: 40, tone: () => 'danger' },
  ];

  return createAndSaveStyledWorkbook<ImportErrorRow>(
    {
      sheetName: 'Ýalňyşlyklar',
      title: options.title,
      accountName: options.accountName,
      columns,
      rows: options.rows,
      meta: {
        kind: 'genel',
        accountName: options.accountName,
        template: 'import_error_report',
        templateVersion: 1,
        options: { yalnyslykSany: options.rows.length },
      },
    },
    options.fileName
  );
}
