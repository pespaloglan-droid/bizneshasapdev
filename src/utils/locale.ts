import type { LanguageCode } from '../types';
import { detectInitialLanguage } from './languageDetect';

/** Dil kodu → BCP 47 locale eşleşmesi. */
export const LOCALE_MAP: Record<LanguageCode, string> = {
  tr: 'tr-TR',
  tm: 'tk-TM',
  en: 'en-US',
  ru: 'ru-RU',
};

/** Ana walýuta — bahalaryň birimsiz görünmesi üçin merkezi kod. */
export const DEFAULT_CURRENCY_CODE = 'TMT';

// accountStore'daki hızlı önbellek anahtarı — döngüsel import olmasın diye
// burada doğrudan localStorage okunur.
const SETTINGS_KEY = 'biznes_hasap_settings_v1';

/** Aktif dil: localStorage'daki son seçim; yoksa cihaz dilinden türetilir. */
export function getActiveLanguage(): LanguageCode {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    const lang = raw ? (JSON.parse(raw) as { language?: string }).language : undefined;
    if (lang && lang in LOCALE_MAP) return lang as LanguageCode;
  } catch {
    // yoksay — algılamaya düş
  }
  return detectInitialLanguage();
}

/** Dil verilmezse aktif dilin locale'ini döndürür. */
export function localeFor(lang?: LanguageCode | null): string {
  if (lang && lang in LOCALE_MAP) return LOCALE_MAP[lang];
  return LOCALE_MAP[getActiveLanguage()];
}

const moneyFormatters = new Map<string, Intl.NumberFormat>();

function moneyFormatter(lang?: LanguageCode): Intl.NumberFormat {
  const locale = localeFor(lang);
  let formatter = moneyFormatters.get(locale);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    moneyFormatters.set(locale, formatter);
  }
  return formatter;
}

/** Pul görnüşi — currency berilse sona eklenir (örn. 'TMT'). */
export function formatMoney(amount: number, lang?: LanguageCode, currency?: string): string {
  const formatted = moneyFormatter(lang).format(Number.isFinite(amount) ? amount : 0);
  return currency ? `${formatted} ${currency}` : formatted;
}

function toDate(date: Date | string | number): Date | null {
  const d = date instanceof Date ? date : new Date(date);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Sene görnüşi — opts berilmezse DD.MM.YYYY deňiz gün/ay/ýyl. */
export function formatDate(
  date: Date | string | number,
  lang?: LanguageCode,
  opts?: Intl.DateTimeFormatOptions
): string {
  const d = toDate(date);
  if (!d) return typeof date === 'string' && date ? date : '—';
  return d.toLocaleDateString(localeFor(lang), opts);
}

/** Sene + wagt görnüşi. */
export function formatDateTime(
  date: Date | string | number,
  lang?: LanguageCode,
  opts?: Intl.DateTimeFormatOptions
): string {
  const d = toDate(date);
  if (!d) return typeof date === 'string' && date ? date : '—';
  return d.toLocaleString(localeFor(lang), opts);
}

/** Diňe wagt görnüşi. */
export function formatTime(
  date: Date | string | number,
  lang?: LanguageCode,
  opts?: Intl.DateTimeFormatOptions
): string {
  const d = toDate(date);
  if (!d) return '';
  return d.toLocaleTimeString(localeFor(lang), opts);
}
