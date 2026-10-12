import type { LanguageCode, PaymentMethod } from '../types';
import { translate } from '../locales/i18n';

/**
 * Faktura/çek üçin töleg görnüşiniň etiketi — diňe GÖRKEZME/çap üçin.
 * DB-de `paymentMethod` enum hökmünde saklanýar; bu etiket hiç ýere ýazylmaýar.
 * `language` berilmezse köne behavior (türkmençe) saklanýar.
 * (Kassa modulyndaky `MoneyPaymentMethod` aýratyn — bu ýerde faktura tölegleri.)
 */
const INVOICE_PAYMENT_KEYS: Record<PaymentMethod, string> = {
  cash: 'payment.cash',
  card: 'payment.card',
  credit: 'payment.credit',
  split: 'payment.split',
};

export function invoicePaymentLabel(method: PaymentMethod, language: LanguageCode = 'tm'): string {
  const key = INVOICE_PAYMENT_KEYS[method];
  return key ? translate(language, key) : String(method).toUpperCase();
}

/** Satuw senesinden `days` gün goşup, vade senesini (YYYY-MM-DD) hasaplaýar. */
export function addDaysIso(iso: string, days: number): string {
  const base = new Date(iso);
  if (Number.isNaN(base.getTime())) return '';
  const due = new Date(base.getTime() + Math.max(1, days) * 86400000);
  const month = String(due.getMonth() + 1).padStart(2, '0');
  const day = String(due.getDate()).padStart(2, '0');
  return `${due.getFullYear()}-${month}-${day}`;
}

/** Iki senäniň arasyndaky gün sany (positive = geljekde). */
export function daysBetweenIso(fromIso: string, toIso: string): number {
  const from = new Date(`${fromIso}T00:00:00`);
  const to = new Date(`${toIso}T00:00:00`);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return 0;
  return Math.round((to.getTime() - from.getTime()) / 86400000);
}

export function todayIso(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

/** ISO senäni gg.aa.ýyyy görnüşinde görkezýär. */
export function formatIsoDate(iso: string | undefined): string {
  if (!iso) return '—';
  const [year, month, day] = iso.slice(0, 10).split('-');
  if (!year || !month || !day) return iso;
  return `${day}.${month}.${year}`;
}