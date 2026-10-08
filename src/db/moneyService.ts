import {
  MoneyCategoryId,
  MoneyPaymentMethod,
  MoneySubCategoryId,
  MoneyTransaction,
  MoneyTxType,
} from '../types';
import { listDocsByPrefix, removeDoc, upsertDoc } from './pouch';
import { sanitizeMoneyTx } from './sanitize';

const PREFIX = 'money_';

export type MoneyExtraField =
  | 'none'
  | 'customer'
  | 'customer-required'
  | 'supplier'
  | 'person'
  | 'person-required'
  | 'staff'
  | 'subcategory';

export interface MoneyCategoryMeta {
  readonly id: MoneyCategoryId;
  readonly type: MoneyTxType;
  readonly label: string;
  readonly extra: MoneyExtraField;
}

/**
 * Kassa formasynyň dropdownlarynda görünýän kategoriýalar.
 *
 * "Haryt satuw" we "Haryt satyn almak" aýryldy — bu hereketler Faktura/Ambar
 * arkaly awtomatik işlenýär (goşa ýazgy bolmasyn).
 */
export const MONEY_CATEGORIES: readonly MoneyCategoryMeta[] = [
  // ── Girdeji ───────────────────────────────────────────────────────────────
  { id: 'hyzmat_toleg', type: 'income', label: 'Hyzmat üçin töleg', extra: 'none' },
  { id: 'weresiye_yygnamak', type: 'income', label: 'Algy yygnamak', extra: 'customer-required' },
  { id: 'karz_almak', type: 'income', label: 'Karz almak', extra: 'person' },
  { id: 'karende_girdejisi', type: 'income', label: 'Kärende girdejisi', extra: 'none' },
  { id: 'atiyaclandyrys_tolegi', type: 'income', label: 'Ätiýaçlandyryş tölegi', extra: 'none' },
  { id: 'maya_goyum_girdejisi', type: 'income', label: 'Maýa goýum girdejisi', extra: 'none' },
  { id: 'basga_girdeji', type: 'income', label: 'Başga girdeji', extra: 'none' },

  // ── Çykdajy ───────────────────────────────────────────────────────────────
  { id: 'dukan_cykdajylary', type: 'expense', label: 'Dükan çykdajylary', extra: 'subcategory' },
  { id: 'aylyk', type: 'expense', label: 'Aýlyk (Zähmet haky)', extra: 'staff' },
  { id: 'karz_bermek', type: 'expense', label: 'Karz bermek', extra: 'person-required' },
  { id: 'karz_gaytarmak', type: 'expense', label: 'Karz gaýtarmak', extra: 'person-required' },
  { id: 'salgyt_tolegi', type: 'expense', label: 'Salgyt tölegi', extra: 'none' },
  { id: 'ulag_cykdajylary', type: 'expense', label: 'Ulag çykdajylary', extra: 'none' },
  { id: 'mahabat_cykdajylary', type: 'expense', label: 'Mahabat çykdajylary', extra: 'none' },
  { id: 'bejeris_abatlayys', type: 'expense', label: 'Bejeriş-abatlaýyş', extra: 'none' },
  { id: 'enjam_satyn_almak', type: 'expense', label: 'Enjam/Esbap satyn almak', extra: 'none' },
  { id: 'basga_cykdajy', type: 'expense', label: 'Başga çykdajy', extra: 'none' },
];

/**
 * Formadan aýrylan kategoriýalar. Dropdownlarda GÖRÜNMEÝÄR, ýöne
 * köne ýazgylaryň we Faktura/Ambar awtomatik ýazgylarynyň atlaryny
 * dogry çözmek üçin saklanýar.
 */
export const LEGACY_CATEGORIES: readonly MoneyCategoryMeta[] = [
  { id: 'haryt_satuw', type: 'income', label: 'Haryt satuw', extra: 'customer' },
  { id: 'haryt_satyn_almak', type: 'expense', label: 'Haryt satyn almak', extra: 'supplier' },
];

const ALL_CATEGORY_META: readonly MoneyCategoryMeta[] = [
  ...MONEY_CATEGORIES,
  ...LEGACY_CATEGORIES,
];

export const INCOME_CATEGORIES = MONEY_CATEGORIES.filter((c) => c.type === 'income');
export const EXPENSE_CATEGORIES = MONEY_CATEGORIES.filter((c) => c.type === 'expense');

export const PAYMENT_METHOD_LABELS: Record<MoneyPaymentMethod, string> = {
  cash: 'Nagt',
  card: 'Bank kart',
  transfer: 'Geçirme',
};

export const SUB_CATEGORY_LABELS: Record<MoneySubCategoryId, string> = {
  karende: 'Kärende',
  elektrik: 'Elektrik',
  suw: 'Suw',
  beyleki: 'Beýleki',
};

/** At çözmekde köne kategoriýalar hem göz öňünde tutulýar. */
export function categoryMeta(id: MoneyCategoryId): MoneyCategoryMeta {
  return (
    ALL_CATEGORY_META.find((category) => category.id === id) ??
    MONEY_CATEGORIES[MONEY_CATEGORIES.length - 1]
  );
}

export function categoryLabel(id: MoneyCategoryId): string {
  return categoryMeta(id).label;
}

// ── CRUD ────────────────────────────────────────────────────────────────────

export async function getMoneyTransactions(storeDb: string): Promise<MoneyTransaction[]> {
  const docs = await listDocsByPrefix(storeDb, PREFIX);
  return docs
    .filter((doc) => doc.docType === 'money' && doc.transaction)
    .map((doc) => sanitizeMoneyTx(doc.transaction))
    .filter((tx): tx is MoneyTransaction => tx !== null)
    .sort((a, b) => (a.date === b.date ? b.createdAt.localeCompare(a.createdAt) : b.date.localeCompare(a.date)));
}

export async function saveMoneyTransactionToDb(
  transaction: MoneyTransaction,
  storeDb: string
): Promise<void> {
  await upsertDoc(storeDb, `${PREFIX}${transaction.id}`, {
    docType: 'money',
    transaction,
  });
}

export async function deleteMoneyTransactionFromDb(
  transactionId: string,
  storeDb: string
): Promise<boolean> {
  return removeDoc(storeDb, `${PREFIX}${transactionId}`);
}

export function generateMoneyTxId(): string {
  return `tx-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;
}

/**
 * Müşderi balansyna täsir edýän ýeke-täk kategoriýa — "Weresiýe yygnamak".
 * Tahsilat müşderiniň bergisini azaldýar (gapma-garsy belgi bilen goşulýar).
 */
export function moneyCustomerBalanceDelta(transaction: MoneyTransaction): number {
  if (transaction.category !== 'weresiye_yygnamak') return 0;
  if (!transaction.customerId) return 0;
  const magnitude = Math.abs(transaction.amount);
  return transaction.type === 'income' ? -magnitude : magnitude;
}

export function isMoneyTransactionValid(transaction: MoneyTransaction): boolean {
  if (!Number.isFinite(transaction.amount) || transaction.amount <= 0) return false;
  if (!transaction.date) return false;
  const meta = categoryMeta(transaction.category);
  if (meta.extra === 'customer-required' && !transaction.customerId) return false;
  if (meta.extra === 'person-required' && !transaction.personName?.trim()) return false;
  return true;
}
