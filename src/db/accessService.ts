import type {
  AccessControlEntry,
  AppUser,
  MoneyCategoryId,
  ModuleName,
  ModulePermission,
  User,
  UserAccessControl,
  UserDefaults,
  UserModuleExtras,
} from '../types';
import { findAppUserForLoginUser, resolveModulePermission } from './ledgerService';

/**
 * "Ýörite rugsatlar" (gelişmiş izinler) veri katmany üçin kömekçiler.
 *
 * Bu gatlak modul-bazly CRUD matrisinden (AppUser.permissions) aýratyn:
 * matris "haýsy modüle näme edip bilýär" diýýär, bu gatlak bolsa
 * "ol modulüň ičindäki haýsy belli ýazgylara elýeter" diýýär.
 *
 * Täze goşulan ähli ýazgylar bu gatlagyň ähli mode ('all') bilen döreýär —
 * ýagny eski ulanyjylar hiç hili çäklendirme görmeýär (eski gürşüş saklanýar).
 */

export function emptyAccessControlEntry(): AccessControlEntry {
  return { mode: 'all', list: [] };
}

/** Täze (boş) warsaýylan bahalar — ähli meýdançalar boş, ulgamy deslapky ulanylýar. */
export function emptyDefaults(): UserDefaults {
  return {
    invoiceType: '',
    paymentType: '',
    unit: '',
    unit2: '',
    customerId: '',
    warehouseId: '',
    depderId: '',
  };
}

export function emptyAccessControl(): UserAccessControl {
  return {
    invoiceTypes: emptyAccessControlEntry(),
    paymentTypes: emptyAccessControlEntry(),
    customers: emptyAccessControlEntry(),
    products: emptyAccessControlEntry(),
    warehouses: emptyAccessControlEntry(),
    warehousesForInvoice: null,
    depders: emptyAccessControlEntry(),
  };
}

export function cloneAccessControlEntry(entry: AccessControlEntry): AccessControlEntry {
  return { mode: entry.mode, list: [...(entry.list ?? [])] };
}

export function cloneAccessControl(source: UserAccessControl): UserAccessControl {
  return {
    invoiceTypes: cloneAccessControlEntry(source.invoiceTypes),
    paymentTypes: cloneAccessControlEntry(source.paymentTypes),
    customers: cloneAccessControlEntry(source.customers),
    products: cloneAccessControlEntry(source.products),
    warehouses: cloneAccessControlEntry(source.warehouses),
    warehousesForInvoice: source.warehousesForInvoice
      ? cloneAccessControlEntry(source.warehousesForInvoice)
      : null,
    depders: cloneAccessControlEntry(source.depders),
  };
}

/** Köne/hususy ýazgylarda bölüm bar bolmasa deslapky bahalar bilen doldurýar. */
export function normalizeDefaults(defaults?: UserDefaults): UserDefaults {
  const source = defaults ?? {};
  return {
    invoiceType: source.invoiceType ?? '',
    paymentType: source.paymentType ?? '',
    unit: source.unit ?? '',
    unit2: source.unit2 ?? '',
    customerId: source.customerId ?? '',
    warehouseId: source.warehouseId ?? '',
    depderId: source.depderId ?? '',
  };
}

export function normalizeAccessControl(accessControl?: UserAccessControl): UserAccessControl {
  if (!accessControl) return emptyAccessControl();
  const source = accessControl;
  return {
    invoiceTypes: normalizeEntry(source.invoiceTypes),
    paymentTypes: normalizeEntry(source.paymentTypes),
    customers: normalizeEntry(source.customers),
    products: normalizeEntry(source.products),
    warehouses: normalizeEntry(source.warehouses),
    warehousesForInvoice: source.warehousesForInvoice
      ? normalizeEntry(source.warehousesForInvoice)
      : null,
    depders: normalizeEntry(source.depders),
  };
}

function normalizeEntry(entry?: AccessControlEntry): AccessControlEntry {
  if (!entry) return emptyAccessControlEntry();
  const mode = entry.mode === 'whitelist' || entry.mode === 'blacklist' ? entry.mode : 'all';
  const list = Array.isArray(entry.list) ? entry.list.filter((id) => typeof id === 'string') : [];
  return mode === 'all' ? { mode, list: [] } : { mode, list };
}

/**
 * Ulanyjy ýazgysynyň ýörite bölümini üpjün edýär. Okuw pursatynda her wagt
 * normalizasiýa geçýär — şonuň üçin eski ýazgylar bilen döretmek howpsuz.
 */
export function ensureUserAdvanced(user: AppUser): AppUser {
  return {
    ...user,
    defaults: normalizeDefaults(user.defaults),
    accessControl: normalizeAccessControl(user.accessControl),
    moduleExtras: normalizeModuleExtras(user.moduleExtras),
  };
}

// ── Modul inçe rugsatlary (Kassa / Faktura alt yetkileri) ────────────────────

/** Normallaşdyrylan inçe rugsatlar — kassa/faktura alanlary hemişe bar. */
export interface NormalizedModuleExtras {
  kassa: {
    addIncome: boolean;
    addExpense: boolean;
    viewBalance: boolean;
    incomeCategories?: MoneyCategoryId[];
  };
  faktura: {
    editPrice: boolean;
    allowDiscount: boolean;
  };
}

/** Ähli alanlar izinli — deslapky (eski gürşüş saklanýar). */
function permissiveModuleExtras(): NormalizedModuleExtras {
  return {
    kassa: { addIncome: true, addExpense: true, viewBalance: true },
    faktura: { editPrice: true, allowDiscount: true },
  };
}

/** Hiç hili inçe rugsat ýok (AppUser ýazgysy tapylmasa). */
function noneModuleExtras(): NormalizedModuleExtras {
  return {
    kassa: { addIncome: false, addExpense: false, viewBalance: false },
    faktura: { editPrice: false, allowDiscount: false },
  };
}

/**
 * Köne/hususy ýazgylarda inçe rugsatlar bar bolmasa deslapky (izinli) bahalar.
 * `incomeCategories`: undefined bolsa tüm kategoriler açyk galýar.
 */
export function normalizeModuleExtras(extras?: UserModuleExtras): NormalizedModuleExtras {
  const source = extras ?? {};
  const normalized: NormalizedModuleExtras = {
    kassa: {
      addIncome: source.kassa?.addIncome ?? true,
      addExpense: source.kassa?.addExpense ?? true,
      viewBalance: source.kassa?.viewBalance ?? true,
    },
    faktura: {
      editPrice: source.faktura?.editPrice ?? true,
      allowDiscount: source.faktura?.allowDiscount ?? true,
    },
  };
  if (source.kassa && source.kassa.incomeCategories !== undefined) {
    normalized.kassa.incomeCategories = source.kassa.incomeCategories.filter(
      (id) => typeof id === 'string'
    ) as MoneyCategoryId[];
  }
  return normalized;
}

/**
 * Giriş eden ulanyjynyň Kassa/Faktura inçe rugsatlary (normallaşdyrylan).
 * `admin` giriş ulanyjysy we "Administrator" roly üçin hemişe izinli.
 */
export function resolveModuleExtras(
  loginUser: User,
  appUsers: readonly AppUser[]
): NormalizedModuleExtras {
  if (loginUser.role === 'admin') return permissiveModuleExtras();
  const appUser = findAppUserForLoginUser(loginUser, appUsers);
  if (!appUser) return noneModuleExtras();
  if (appUser.role === 'Administrator') return permissiveModuleExtras();
  return normalizeModuleExtras(appUser.moduleExtras);
}

/** Merkezi modul rugsady kontroli — ähli ýerde şu ulanylýar. */
export function hasPermission(
  loginUser: User,
  appUsers: readonly AppUser[],
  moduleName: ModuleName,
  action: keyof ModulePermission
): boolean {
  return resolveModulePermission(moduleName, loginUser, appUsers)[action];
}

/**
 * Administrator mı? (giriş `admin` ýa-da Ulanyjy modulyndaky "Administrator" roly).
 * Diňe şolara ähli rugsatlar (silinen fakturalar ýaly) berilýär.
 */
export function isAdminUser(loginUser: User, appUsers: readonly AppUser[]): boolean {
  if (loginUser.role === 'admin') return true;
  const appUser = findAppUserForLoginUser(loginUser, appUsers);
  return appUser?.role === 'Administrator';
}

/**
 * Kassa girdejisinde kategoriýa ulanyp bolýarmy?
 * `incomeCategories` undefined bolsa (deslapky) ähli kategoriýalar açyk.
 */
export function canUseIncomeCategory(
  loginUser: User,
  appUsers: readonly AppUser[],
  categoryId: MoneyCategoryId
): boolean {
  const extras = resolveModuleExtras(loginUser, appUsers);
  if (!extras.kassa.addIncome) return false;
  const allowed = extras.kassa.incomeCategories;
  if (allowed === undefined) return true;
  return allowed.includes(categoryId);
}

// ── Aktiw sesiýa üçin çözgüçler (Phase 2 — modüllerde ulanylýar) ─────────────

/**
 * Giriş eden ulanyjynyň deslapky bahalary.
 * `admin` giriş ulanyjysy we "Administrator" roly üçin boş (çäklendirme ýok)
 * gaýtarylýar — edil module rugsatlarynda bolşy ýaly.
 */
export function getActiveDefaults(
  loginUser: User,
  appUsers: readonly AppUser[]
): UserDefaults {
  if (loginUser.role === 'admin') return emptyDefaults();
  const appUser = findAppUserForLoginUser(loginUser, appUsers);
  if (!appUser || appUser.role === 'Administrator') return emptyDefaults();
  return normalizeDefaults(appUser.defaults);
}

/**
 * Giriş eden ulanyjynyň erişim kontroli.
 * `null` → hiç hili çäklendirme ýok ("Ählisine rugsat" — eski gürşüş).
 * Administrator/admin üçin hem hemişe `null`.
 */
export function getActiveAccessControl(
  loginUser: User,
  appUsers: readonly AppUser[]
): UserAccessControl | null {
  if (loginUser.role === 'admin') return null;
  const appUser = findAppUserForLoginUser(loginUser, appUsers);
  if (!appUser || appUser.role === 'Administrator') return null;
  return normalizeAccessControl(appUser.accessControl);
}

/**
 * Bir erişim belligi boýunça ID sanawyny daraldýar.
 * `all` modda başlangyç sanaw doly gaýtarylýar (üýtgemez).
 */
export function filterIdList(
  entry: AccessControlEntry,
  allIds: readonly string[]
): string[] {
  if (entry.mode === 'all') return [...allIds];
  const set = new Set(entry.list);
  return entry.mode === 'whitelist'
    ? allIds.filter((id) => set.has(id))
    : allIds.filter((id) => !set.has(id));
}

/**
 * Bir erişim belligi boýunça haryt/müşderi... sanawyny daraldýar.
 * `null` → çäklendirme ýok (çağyryjy doly sanawy ulanýar).
 */
export function filterItemsById<T extends { id: string }>(
  entry: AccessControlEntry,
  items: readonly T[]
): T[] | null {
  if (entry.mode === 'all') return null;
  const set = new Set(entry.list);
  return entry.mode === 'whitelist'
    ? items.filter((item) => set.has(item.id))
    : items.filter((item) => !set.has(item.id));
}