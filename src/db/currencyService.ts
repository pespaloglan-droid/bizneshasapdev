import { CurrencyRate } from '../types';
import { listDocsByPrefix, removeDoc, upsertDoc } from './pouch';
import { sanitizeCurrency } from './sanitize';

const PREFIX = 'currency_';

/**
 * Taban (sabit) walyuta — çalışma anında değiştirilebilir.
 * ESM canlı bağlayıcısı sayesinde bu değeri okuyan TÜM dosyalar
 * (CurrencyLabel, fatura, rapor, hasaplama...) otomatik güncellenir —
 * böylece APK ve PC aynı kodu paylaşır, tek noktadan yönetilir.
 */
export interface BaseCurrency {
  code: string;
  name: string;
  symbol: string;
}

export const DEFAULT_BASE_CURRENCY: BaseCurrency = {
  code: 'TMT',
  name: 'Türkmen manady',
  symbol: 'TMT',
};

let baseCurrency: BaseCurrency = DEFAULT_BASE_CURRENCY;

/** Taban walyutayı değiştirir (ayarlar yüklenirken / kullanıcı seçtiğinde). */
export function setBaseCurrency(next: BaseCurrency): void {
  applyBaseCurrency(next);
}

export function getBaseCurrency(): BaseCurrency {
  return baseCurrency;
}

/** Taban walyutanın canlı kodu (canlı bağlayıcı). */
export function getBaseCurrencyCode(): string {
  return BASE_CURRENCY_CODE;
}

/**
 * Canlı bağlayıcılar (ESM live binding): aşağıdaki değişkenler yeniden
 * atandığında onları import eden 14+ dosya otomatik olarak yeni değeri görür.
 * Bu sayede CurrencyLabel, fatura, rapor ve hasaplama ekranları tek noktadan
 * yönetilen taban walyutayı kullanır — APK ve PC'de ortak davranış.
 */
export let BASE_CURRENCY_CODE = DEFAULT_BASE_CURRENCY.code;
export let BASE_CURRENCY = DEFAULT_BASE_CURRENCY;

/** Taban walyutayı değiştirir ve canlı bağlayıcıları günceller. */
export function applyBaseCurrency(next: BaseCurrency): void {
  const code = next.code.trim().toUpperCase();
  if (!code) return;
  baseCurrency = {
    code,
    name: next.name.trim() || code,
    symbol: next.symbol.trim() || code.slice(0, 2),
  };
  BASE_CURRENCY = baseCurrency;
  BASE_CURRENCY_CODE = code;
}

export interface CommonCurrency {
  readonly code: string;
  readonly name: string;
  readonly symbol: string;
}

export const COMMON_CURRENCIES: readonly CommonCurrency[] = [
  { code: 'USD', name: 'ABŞ dollary', symbol: '$' },
  { code: 'EUR', name: 'Ýewro', symbol: '€' },
  { code: 'RUB', name: 'Rus rubly', symbol: '₽' },
  { code: 'TRY', name: 'Türk lirasy', symbol: '₺' },
  { code: 'GBP', name: 'Iňlis funt sterlingi', symbol: '£' },
  { code: 'CNY', name: 'Hytaý ýuany', symbol: '¥' },
  { code: 'KZT', name: 'Gazak tenge', symbol: '₸' },
  { code: 'AED', name: 'BAE dirhamy', symbol: 'د.إ' },
  { code: 'JPY', name: 'Ýapon ýeni', symbol: '¥' },
  { code: 'AZN', name: 'Azerbaýjan manaty', symbol: '' },
] as const;

export const CUSTOM_CURRENCY_OPTION = 'Beyleki';

export function commonCurrency(code: string): CommonCurrency | undefined {
  return COMMON_CURRENCIES.find((currency) => currency.code === code);
}

// ── CRUD ────────────────────────────────────────────────────────────────────

export async function getCurrenciesForAccount(storeDb: string): Promise<CurrencyRate[]> {
  const docs = await listDocsByPrefix(storeDb, PREFIX);
  return docs
    .filter((doc) => doc.docType === 'currency' && doc.currency)
    .map((doc) => sanitizeCurrency(doc.currency))
    .filter((c): c is CurrencyRate => c !== null)
    .sort((a, b) => a.code.localeCompare(b.code, 'tr'));
}

export async function saveCurrencyToDb(currency: CurrencyRate, storeDb: string): Promise<void> {
  await upsertDoc(storeDb, `${PREFIX}${currency.id}`, {
    docType: 'currency',
    currency,
  });
}

export async function deleteCurrencyFromDb(currencyId: string, storeDb: string): Promise<boolean> {
  return removeDoc(storeDb, `${PREFIX}${currencyId}`);
}

export function generateCurrencyId(code: string): string {
  return `cur-${code.trim().toLowerCase()}`;
}

/**
 * Taban walyuta (TMT) listesiz kalırsa, kullanıcı onu seçemez.
 * Bu yüzden ilk yüklemede TMT gerçek bir kayıt olarak eklenir (kursu 1).
 * Mevcut kayıtlar korunur — hicbir veri silinmez.
 */
export async function ensureBaseCurrencySeeded(
  currencies: readonly CurrencyRate[]
): Promise<CurrencyRate[]> {
  const code = DEFAULT_BASE_CURRENCY.code;
  const exists = currencies.some((c) => c.code.toUpperCase() === code);
  if (exists) return [...currencies];

  const now = new Date().toISOString();
  const seeded: CurrencyRate = {
    id: generateCurrencyId(code),
    code,
    name: DEFAULT_BASE_CURRENCY.name,
    symbol: DEFAULT_BASE_CURRENCY.symbol,
    rate: 1,
    createdAt: now,
    updatedAt: now,
  };
  return [...currencies, seeded];
}

export function isCurrencyCodeUnique(
  code: string,
  currencies: readonly CurrencyRate[],
  excludeId?: string
): boolean {
  const normalized = code.trim().toUpperCase();
  if (normalized === BASE_CURRENCY_CODE) return false;
  return !currencies.some(
    (currency) => currency.code.toUpperCase() === normalized && currency.id !== excludeId
  );
}

// ── Hasaplama kömekçileri ───────────────────────────────────────────────────

export function rateForCode(currencies: readonly CurrencyRate[], code: string | undefined): number {
  if (!code || code === BASE_CURRENCY_CODE) return 1;
  const found = currencies.find((currency) => currency.code === code);
  return found ? found.rate : 1;
}

export function convertToTmt(amount: number, rate: number): number {
  if (!Number.isFinite(amount) || !Number.isFinite(rate)) return 0;
  return Math.round(amount * rate * 100) / 100;
}

interface CurrencyCarrier {
  currency?: string;
}

/** Walýuta beýleki modullarda ulanylýan bolsa, pozmagy gadagan edýäris. */
export function isCurrencyInUse(code: string, references: readonly CurrencyCarrier[]): boolean {
  return references.some((reference) => reference.currency === code);
}