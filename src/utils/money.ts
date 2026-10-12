import type { LanguageCode } from '../types';
import { DEFAULT_CURRENCY_CODE, formatMoney as formatMoneyLocale, localeFor } from './locale';

/** Kassa / Walýuta ekranlarynda ulanylýan bitewüleşdirilen pul görnüşi. */
export function formatMoney(value: number, lang?: LanguageCode): string {
  return formatMoneyLocale(value, lang);
}

/** Esas walýuta (Manat/TMT) belligi bilen — bahalar birimsiz görünmesin. */
export function formatMoneyTmt(value: number, lang?: LanguageCode): string {
  return formatMoneyLocale(value, lang, DEFAULT_CURRENCY_CODE);
}

export function formatMoneySigned(
  value: number,
  type: 'income' | 'expense',
  lang?: LanguageCode
): string {
  const sign = type === 'income' ? '+' : '−';
  return `${sign}${formatMoney(Math.abs(value), lang)}`;
}

const rateFormatters = new Map<string, Intl.NumberFormat>();

function rateFormatter(lang?: LanguageCode): Intl.NumberFormat {
  const locale = localeFor(lang);
  let formatter = rateFormatters.get(locale);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    });
    rateFormatters.set(locale, formatter);
  }
  return formatter;
}

/** Walýuta kursy — azyndan 4 ondalık basama çenli goldaýar. */
export function formatRate(value: number, lang?: LanguageCode): string {
  return rateFormatter(lang).format(Number.isFinite(value) ? value : 0);
}

export function todayIsoDate(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

export function formatDate(iso: string): string {
  if (!iso) return '—';
  const [year, month, day] = iso.slice(0, 10).split('-');
  if (!year || !month || !day) return iso;
  return `${day}.${month}.${year}`;
}
