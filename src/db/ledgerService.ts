import {
  AppUser,
  Ledger,
  LedgerPermission,
  LedgerPermissionKey,
  ModuleName,
  ModulePermission,
  MoneyTransaction,
  User,
} from '../types';
import { listDocsByPrefix, removeDoc, upsertDoc } from './pouch';
import { generateMoneyTxId } from './moneyService';
import { sanitizeLedger } from './sanitize';

const PREFIX = 'ledger_';

export const FULL_LEDGER_PERMISSION: LedgerPermission = {
  canEnter: true,
  canAddIncome: true,
  canAddExpense: true,
  canEdit: true,
  canDelete: true,
  canViewReport: true,
};

export const EMPTY_LEDGER_PERMISSION: LedgerPermission = {
  canEnter: false,
  canAddIncome: false,
  canAddExpense: false,
  canEdit: false,
  canDelete: false,
  canViewReport: false,
};

export const LEDGER_PERMISSION_KEYS: readonly LedgerPermissionKey[] = [
  'canEnter',
  'canAddIncome',
  'canAddExpense',
  'canEdit',
  'canDelete',
  'canViewReport',
] as const;

export const LEDGER_PERMISSION_LABELS: Record<LedgerPermissionKey, string> = {
  canEnter: 'Girip bilýär',
  canAddIncome: 'Girdeji goşup bilýär',
  canAddExpense: 'Çykdajy goşup bilýär',
  canEdit: 'Redaktirläp bilýär',
  canDelete: 'Pozup bilýär',
  canViewReport: 'Hasabat görüp bilýär',
};

// ── CRUD ────────────────────────────────────────────────────────────────────

export async function getLedgersForAccount(storeDb: string): Promise<Ledger[]> {
  const docs = await listDocsByPrefix(storeDb, PREFIX);
  return docs
    .filter((doc) => doc.docType === 'ledger' && doc.ledger)
    .map((doc) => sanitizeLedger(doc.ledger))
    .filter((l): l is Ledger => l !== null)
    .sort((a, b) => a.name.localeCompare(b.name, 'tr'));
}

export async function saveLedgerToDb(ledger: Ledger, storeDb: string): Promise<void> {
  await upsertDoc(storeDb, `${PREFIX}${ledger.id}`, { docType: 'ledger', ledger });
}

export async function deleteLedgerFromDb(ledgerId: string, storeDb: string): Promise<boolean> {
  return removeDoc(storeDb, `${PREFIX}${ledgerId}`);
}

export function generateLedgerId(): string {
  return `lgr-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;
}

export function isLedgerNameUnique(
  name: string,
  ledgers: readonly Ledger[],
  excludeId?: string
): boolean {
  const normalized = name.trim().toLowerCase();
  return !ledgers.some(
    (ledger) => ledger.name.trim().toLowerCase() === normalized && ledger.id !== excludeId
  );
}

// ── Balans we rugsatlar ─────────────────────────────────────────────────────

export function ledgerTransactions(
  ledger: Ledger,
  transactions: readonly MoneyTransaction[]
): MoneyTransaction[] {
  return transactions.filter((transaction) => transaction.ledgerId === ledger.id);
}

export function computeLedgerBalance(
  ledger: Ledger,
  transactions: readonly MoneyTransaction[]
): number {
  let balance = ledger.openingBalance;
  for (const transaction of ledgerTransactions(ledger, transactions)) {
    balance += transaction.type === 'income' ? transaction.amount : -transaction.amount;
  }
  return balance;
}

export function ledgerTransactionCount(
  ledger: Ledger,
  transactions: readonly MoneyTransaction[]
): number {
  return ledgerTransactions(ledger, transactions).length;
}

/**
 * Giriş eden ulanyjyny Ulanyjy modulynyň (AppUser) ýazgysy bilen baglanyşdyrýar.
 * Iki ulanyjy modeli aýratyn saklanýar, şonuň üçin at/login boýunça deňeşdirýäris.
 */
export function findAppUserForLoginUser(
  loginUser: User,
  appUsers: readonly AppUser[]
): AppUser | null {
  const target = loginUser.name.trim().toLowerCase();
  return (
    appUsers.find((appUser) => appUser.fullName.trim().toLowerCase() === target) ??
    appUsers.find((appUser) => appUser.username.trim().toLowerCase() === target) ??
    null
  );
}

export const FULL_MODULE_PERMISSION: ModulePermission = {
  view: true,
  create: true,
  edit: true,
  delete: true,
  report: true,
};

export const EMPTY_MODULE_PERMISSION: ModulePermission = {
  view: false,
  create: false,
  edit: false,
  delete: false,
  report: false,
};

/**
 * Ulanyjy modulynyň rugsat matrisasyndan bir modulyň rugsatlaryny çözer.
 * `admin` giriş ulanyjysy we "Administrator" roly doly rugsat alýar.
 */
export function resolveModulePermission(
  moduleName: ModuleName,
  loginUser: User,
  appUsers: readonly AppUser[]
): ModulePermission {
  if (loginUser.role === 'admin') return FULL_MODULE_PERMISSION;

  const appUser = findAppUserForLoginUser(loginUser, appUsers);
  if (!appUser || appUser.role === 'Administrator') {
    return appUser ? FULL_MODULE_PERMISSION : EMPTY_MODULE_PERMISSION;
  }

  return appUser.permissions?.[moduleName] ?? EMPTY_MODULE_PERMISSION;
}

export function resolveLedgerPermission(
  ledger: Ledger,
  loginUser: User,
  appUsers: readonly AppUser[]
): LedgerPermission {
  if (loginUser.role === 'admin') return FULL_LEDGER_PERMISSION;

  const appUser = findAppUserForLoginUser(loginUser, appUsers);
  if (!appUser || appUser.role === 'Administrator') {
    return appUser ? FULL_LEDGER_PERMISSION : EMPTY_LEDGER_PERMISSION;
  }

  const granted = ledger.permissions[appUser.id];
  return granted ?? EMPTY_LEDGER_PERMISSION;
}

export function visibleLedgersForUser(
  ledgers: readonly Ledger[],
  loginUser: User,
  appUsers: readonly AppUser[]
): Ledger[] {
  if (loginUser.role === 'admin') return [...ledgers];
  return ledgers.filter((ledger) => resolveLedgerPermission(ledger, loginUser, appUsers).canEnter);
}

export function assignedUserCount(ledger: Ledger): number {
  return Object.values(ledger.permissions).filter((permission) => permission.canEnter).length;
}

// ── Depderler arasy geçirim ─────────────────────────────────────────────────

export function convertBetween(amount: number, fromRate: number, toRate: number): number {
  if (fromRate <= 0 || toRate <= 0) return 0;
  return Math.round(((amount * fromRate) / toRate) * 100) / 100;
}

export interface TransferDraft {
  readonly from: Ledger;
  readonly to: Ledger;
  readonly amount: number;
  readonly date: string;
  readonly description: string;
  readonly fromRate: number;
  readonly toRate: number;
}

export function buildTransferTransactions(draft: TransferDraft): [MoneyTransaction, MoneyTransaction] {
  const groupId = `trf-${Date.now()}`;
  const createdAt = new Date().toISOString();
  const label = draft.description.trim()
    ? draft.description.trim()
    : `Geçirim: ${draft.from.name} → ${draft.to.name}`;
  const outgoing = convertBetween(draft.amount, draft.fromRate, draft.toRate);

  return [
    {
      id: generateMoneyTxId(),
      type: 'expense',
      date: draft.date,
      amount: draft.amount,
      paymentMethod: 'cash',
      category: 'basga_cykdajy',
      ledgerId: draft.from.id,
      transferGroupId: groupId,
      description: `${label} (→ ${draft.to.name})`,
      createdAt,
    },
    {
      id: generateMoneyTxId(),
      type: 'income',
      date: draft.date,
      amount: outgoing,
      paymentMethod: 'cash',
      category: 'basga_girdeji',
      ledgerId: draft.to.id,
      transferGroupId: groupId,
      description: `${label} (← ${draft.from.name})`,
      createdAt,
    },
  ];
}
