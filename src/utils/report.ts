import { useState } from 'react';
import { buildReportHtml, type ReportTable } from './csv';
import { electronBridge } from './electron';
import { formatDateTime } from './locale';

export interface ReportPayload {
  readonly title: string;
  readonly subtitle: string;
  readonly columns: readonly string[];
  readonly rows: readonly (readonly (string | number)[])[];
  readonly footer: string;
  readonly extras?: readonly ReportTable[];
}

export interface ReportState {
  readonly isPrinting: boolean;
  readonly notice: string | null;
  readonly print: (payload: ReportPayload, paperWidth?: string) => Promise<void>;
  readonly clearNotice: () => void;
}

export function useReport(paperWidth = '80mm'): ReportState {
  const [isPrinting, setIsPrinting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const print = async (payload: ReportPayload, width?: string) => {
    const bridge = electronBridge();
    if (!bridge.printHtml) {
      setNotice('Çap diňe masaüstü programmada elýeterli.');
      return;
    }
    setIsPrinting(true);
    setNotice(null);
    try {
      const html = buildReportHtml(
        payload.title,
        payload.subtitle,
        payload.columns,
        payload.rows,
        payload.footer,
        payload.extras ?? []
      );
      const result = await bridge.printHtml({ html, paperWidth: width ?? paperWidth });
      setNotice(result.success ? null : `Çap başartmady: ${result.failureReason || 'näbelli säwlik'}`);
    } finally {
      setIsPrinting(false);
    }
  };

  return { isPrinting, notice, print, clearNotice: () => setNotice(null) };
}

export function updatedStamp(): string {
  return formatDateTime(new Date());
}