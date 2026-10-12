import { translate } from '../locales/i18n';
import { formatMoney, formatDate } from './locale';
import type { InvoiceRecord, LanguageCode } from '../types';
import { daysBetweenIso, todayIso } from './paymentLabels';

export interface CreditReminder {
  readonly invoiceId: string;
  readonly invoiceNo: string;
  readonly customerName: string;
  readonly remaining: number;
  readonly dueDate: string;
  readonly kind: 'week' | 'dueToday' | 'overdue';
  readonly message: string;
}

export interface OverdueDebt {
  readonly invoiceId: string;
  readonly invoiceNo: string;
  readonly customerName: string;
  readonly remaining: number;
  readonly dueDate: string;
  readonly daysLate: number;
}

const NOTICE_KEY = 'bh_credit_notices';

function readNotified(): Record<string, string> {
  try {
    const raw = localStorage.getItem(NOTICE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, string>) : {};
  } catch {
    // no-excuse-ok: catch — localStorage zaýalanan bolsa, boş sanaw
    return {};
  }
}

function writeNotified(value: Record<string, string>): void {
  try {
    localStorage.setItem(NOTICE_KEY, JSON.stringify(value));
  } catch {
    // no-excuse-ok: catch — saklap bolmasa, hatyrlatma gaýtalanmagy mümkin (ähmiýetsiz)
  }
}

/** Ödenmedik nesiýe bergileri (möhleti geçenleri hem öz içine alýar). */
export function openCreditDebts(invoices: readonly InvoiceRecord[]): {
  invoice: InvoiceRecord;
  remaining: number;
  dueDate: string;
  daysLeft: number;
}[] {
  const today = todayIso();
  const rows: { invoice: InvoiceRecord; remaining: number; dueDate: string; daysLeft: number }[] = [];

  for (const invoice of invoices) {
    if (invoice.paymentMethod !== 'credit') continue;
    if (invoice.status === 'voided') continue;
    if (invoice.draftStatus === 'pending' || invoice.draftStatus === 'rejected') continue;
    const remaining = invoice.remainingDebt ?? 0;
    if (remaining <= 0) continue;
    if (!invoice.dueDate) continue;
    rows.push({
      invoice,
      remaining,
      dueDate: invoice.dueDate,
      daysLeft: daysBetweenIso(today, invoice.dueDate),
    });
  }

  return rows.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

/** Möhleti geçen bergiler — Hasaplama hasabaty üçin. */
export function overdueDebts(invoices: readonly InvoiceRecord[]): OverdueDebt[] {
  return openCreditDebts(invoices)
    .filter((row) => row.daysLeft < 0)
    .map((row) => ({
      invoiceId: row.invoice.id,
      invoiceNo: row.invoice.invoiceNo,
      customerName: row.invoice.customerName,
      remaining: row.remaining,
      dueDate: row.dueDate,
      daysLate: Math.abs(row.daysLeft),
    }));
}

/**
 * Möhleti ýakynlaşan bergiler üçin hatyrlatmalar.
 * Günde bir gezek (her faktura + görnüş üçin) gaýtarylýar.
 * Möhleti geçen bergiler üçin täze hatyrlatma döredilmeýär (spam bolmasyn).
 */
export function takeCreditReminders(invoices: readonly InvoiceRecord[], language: LanguageCode = 'tm'): CreditReminder[] {
  const today = todayIso();
  const notified = readNotified();
  const fresh: Record<string, string> = {};
  const reminders: CreditReminder[] = [];

  for (const row of openCreditDebts(invoices)) {
    const term = row.invoice.creditTermDays ?? 0;
    let kind: CreditReminder['kind'] | null = null;

    // "1 hepde galdy" — diňe möhleti 7 günden uzyn bolsa manysy bar
    if (row.daysLeft === 7 && term > 7) kind = 'week';
    else if (row.daysLeft === 0) kind = 'dueToday';
    else if (row.daysLeft < 0) continue;

    if (!kind) continue;

    const key = `${row.invoice.id}:${kind}:${today}`;
    if (notified[key]) {
      fresh[key] = today;
      continue;
    }
    fresh[key] = today;

    const amount = formatMoney(row.remaining, language);
    reminders.push({
      invoiceId: row.invoice.id,
      invoiceNo: row.invoice.invoiceNo,
      customerName: row.invoice.customerName,
      remaining: row.remaining,
      dueDate: row.dueDate,
      kind,
      message: translate(language, kind === 'week' ? 'pos.creditReminderWeek' : 'pos.creditReminderToday', {
        name: row.invoice.customerName, amount, date: formatDate(row.dueDate, language),
      }),
    });
  }

  writeNotified(fresh);
  return reminders;
}