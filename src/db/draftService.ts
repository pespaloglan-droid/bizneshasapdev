import type { InvoiceDraftStatus, InvoiceRecord, LanguageCode } from '../types';
import { localeFor } from '../utils/locale';

export interface DraftFilterState {
  search: string;
  createdBy: string;
  targowId: string;
  regionId: string;
  dateFrom: string;
  dateTo: string;
  status: InvoiceDraftStatus | '';
}

export const EMPTY_DRAFT_FILTER: DraftFilterState = {
  search: '',
  createdBy: '',
  targowId: '',
  regionId: '',
  dateFrom: '',
  dateTo: '',
  status: 'pending',
};

/** Garalama akymyna degişli ýazgylar (draftStatus kesgitlenen bolsa). */
export function isDraft(invoice: InvoiceRecord): boolean {
  return invoice.draftStatus !== undefined;
}

export function draftsFor(
  invoices: readonly InvoiceRecord[],
  filter: DraftFilterState
): InvoiceRecord[] {
  const query = filter.search.trim().toLowerCase();

  return invoices
    .filter(isDraft)
    .filter((invoice) => {
      if (invoice.status === 'voided') return false;
      if (filter.status && invoice.draftStatus !== filter.status) return false;
      if (filter.createdBy && invoice.createdBy !== filter.createdBy) return false;
      if (filter.targowId && invoice.targowId !== filter.targowId) return false;
      if (filter.regionId && invoice.regionId !== filter.regionId) return false;

      const day = invoice.createdAt.slice(0, 10);
      if (filter.dateFrom && day < filter.dateFrom) return false;
      if (filter.dateTo && day > filter.dateTo) return false;

      if (!query) return true;
      return (
        invoice.customerName.toLowerCase().includes(query) ||
        invoice.invoiceNo.toLowerCase().includes(query) ||
        (invoice.createdBy ?? '').toLowerCase().includes(query)
      );
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Badge üçin: diňe garaşýan garalamalar. */
export function pendingDraftCount(invoices: readonly InvoiceRecord[]): number {
  return invoices.filter(
    (invoice) => invoice.draftStatus === 'pending' && invoice.status !== 'voided'
  ).length;
}

/** "Ulanyjy boýunça" filtri üçin döredijileriň sanawy. */
export function draftCreators(invoices: readonly InvoiceRecord[]): string[] {
  const names = new Set<string>();
  for (const invoice of invoices) {
    if (invoice.draftStatus !== undefined && invoice.createdBy && invoice.status !== 'voided') {
      names.add(invoice.createdBy);
    }
  }
  return Array.from(names).sort((a, b) => a.localeCompare(b, 'tr'));
}

export function formatDraftDate(iso: string, language?: LanguageCode): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(localeFor(language), {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
