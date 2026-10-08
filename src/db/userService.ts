import { upsertDoc, removeDoc, listDocsByPrefix } from './pouch';
import { AppUser, AppUserRole, ModuleName, PermissionsMap, User } from '../types';
import { ensureUserAdvanced } from './accessService';
import { sanitizeAppUser } from './sanitize';

// ── Tam izin şablonu ────────────────────────────────────────────────────────

const FULL: { view: boolean; create: boolean; edit: boolean; delete: boolean; report: boolean } =
  { view: true, create: true, edit: true, delete: true, report: true };
const VIEW_ONLY = { view: true, create: false, edit: false, delete: false, report: false };
const VIEW_CREATE = { view: true, create: true, edit: false, delete: false, report: false };
const VIEW_CREATE_EDIT = { view: true, create: true, edit: true, delete: false, report: false };
const VIEW_EDIT = { view: true, create: false, edit: true, delete: false, report: false };
const NONE = { view: false, create: false, edit: false, delete: false, report: false };

export const ROLE_PERMISSIONS: Record<AppUserRole, PermissionsMap> = {
  Administrator: {
    faktura:    FULL,
    kassa:      FULL,
    musteri:    FULL,
    haryt:      FULL,
    hasaplama:  FULL,
    walyta:     FULL,
    depder:     FULL,
    ambar:      FULL,
    targowy:    FULL,
    sazlamalar: FULL,
    ulanyjy:    FULL,
  },
  Kassir: {
    faktura:    { view: true, create: true, edit: false, delete: false, report: false },
    kassa:      VIEW_CREATE,
    musteri:    VIEW_CREATE_EDIT,
    haryt:      VIEW_ONLY,
    hasaplama:  VIEW_ONLY,
    walyta:     VIEW_ONLY,
    depder:     NONE,
    ambar:      NONE,
    targowy:    VIEW_ONLY,
    sazlamalar: NONE,
    ulanyjy:    NONE,
  },
  Persenal: {
    faktura:    VIEW_ONLY,
    kassa:      NONE,
    musteri:    VIEW_ONLY,
    haryt:      VIEW_EDIT,
    hasaplama:  NONE,
    walyta:     NONE,
    depder:     NONE,
    ambar:      VIEW_CREATE_EDIT,
    targowy:    VIEW_ONLY,
    sazlamalar: NONE,
    ulanyjy:    NONE,
  },
  Ýörite: {
    faktura:    NONE,
    kassa:      NONE,
    musteri:    NONE,
    haryt:      NONE,
    hasaplama:  NONE,
    walyta:     NONE,
    depder:     NONE,
    ambar:      NONE,
    targowy:    NONE,
    sazlamalar: NONE,
    ulanyjy:    NONE,
  },
};

export const MODULE_LABELS: Record<ModuleName, string> = {
  faktura:    'Faktura',
  kassa:      'Kassa',
  musteri:    'Müşderi',
  haryt:      'Haryt',
  hasaplama:  'Hasaplama',
  walyta:     'Walýuta',
  depder:     'Depder',
  ambar:      'Ambar',
  targowy:    'Targowy',
  sazlamalar: 'Sazlamalar',
  ulanyjy:    'Ulanyjy',
};

export const ALL_MODULES: ModuleName[] = [
  'faktura', 'kassa', 'musteri', 'haryt', 'hasaplama',
  'walyta', 'depder', 'ambar', 'targowy', 'sazlamalar', 'ulanyjy',
];

// ── CRUD servisleri ─────────────────────────────────────────────────────────

const PREFIX = 'appuser_';

/**
 * Köne ýazgylarda `fullName` boş bolsa, sanaw boş görünmez ýaly
 * ulanyjy ady bilen doldurylýar (diňe okamada, ýazgy üýtgedilmeýär).
 * Ulanyjy redaktirleme ekranyndan hakyky at-soýady girizip bolýar.
 * Şoňa goşmaça, ýörite rugsatlar bölümi bar bolmasa deslapky bahalar bilen
 * doldurylýar (okuw pursatynda normalizasiýa — ýazgy üýtgedilmeýär).
 */
function normalizeUser(user: AppUser): AppUser {
  const fullName = (user.fullName ?? '').trim();
  const withFullName = fullName ? user : { ...user, fullName: user.username };
  return ensureUserAdvanced(withFullName);
}

export async function getUsersForAccount(storeDb: string): Promise<AppUser[]> {
  const docs = await listDocsByPrefix(storeDb, PREFIX);
  return docs
    .map((doc) => sanitizeAppUser((doc as unknown as Record<string, unknown>).user ?? doc))
    .filter((u): u is AppUser => u !== null)
    .map((user) => normalizeUser(user))
    .sort((a, b) => a.fullName.localeCompare(b.fullName, 'tr'));
}

export async function saveUserToDb(user: AppUser, storeDb: string): Promise<void> {
  const { id, ...fields } = user;
  await upsertDoc(storeDb, `${PREFIX}${id}`, { ...fields, id, docType: 'appuser' });
}

export async function deleteUserFromDb(userId: string, storeDb: string): Promise<boolean> {
  return removeDoc(storeDb, `${PREFIX}${userId}`);
}

export function generateUserId(): string {
  return `usr-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;
}

export function isUsernameUnique(
  username: string,
  users: AppUser[],
  excludeId?: string
): boolean {
  return !users.some(
    (u) => u.username.toLowerCase() === username.toLowerCase() && u.id !== excludeId
  );
}

export function clonePermissions(source: PermissionsMap): PermissionsMap {
  return {
    faktura: { ...source.faktura },
    kassa: { ...source.kassa },
    musteri: { ...source.musteri },
    haryt: { ...source.haryt },
    hasaplama: { ...source.hasaplama },
    walyta: { ...source.walyta },
    depder: { ...source.depder },
    ambar: { ...source.ambar },
    targowy: { ...source.targowy },
    sazlamalar: { ...source.sazlamalar },
    ulanyjy: { ...source.ulanyjy },
  };
}

export const APP_USER_ROLES: AppUserRole[] = [
  'Administrator',
  'Kassir',
  'Persenal',
  'Ýörite',
];

export const ROLE_LABELS: Record<AppUserRole, string> = {
  Administrator: 'Administrator',
  Kassir: 'Kassir',
  Persenal: 'Persenal',
  Ýörite: 'Ýörite (Özel)',
};

/**
 * Giriş ekranyndaky hasap ulanyjylaryny (Account.users) Ulanyjy modulyna geçirýär.
 *
 * Iki ulanyjy modeli aýratyn saklanýar: giriş `Account.users` bilen, Ulanyjy
 * moduly bolsa `AppUser` ýazgylary bilen işleýär. Şol sebäpli administrator
 * Ulanyjy sanawynda görünmeýärdi — bu funksiýa köprü bolup durýar.
 * Idempotent: at boýunça bar bolan ýazgylary täzeden döretmeýär.
 */
export async function ensureAccountUsersSeeded(
  accountUsers: readonly User[],
  storeDb: string
): Promise<AppUser[]> {
  const existing = await getUsersForAccount(storeDb);
  const knownNames = new Set(existing.map((user) => user.fullName.trim().toLowerCase()));
  const knownUsernames = new Set(existing.map((user) => user.username.trim().toLowerCase()));
  const created: AppUser[] = [];

  for (const accountUser of accountUsers) {
    const fullName = accountUser.name.trim();
    if (!fullName) continue;
    const username = fullName.toLowerCase().replace(/[^a-z0-9]+/g, '');
    if (!username) continue;
    if (knownNames.has(fullName.toLowerCase()) || knownUsernames.has(username)) continue;

    // 'staff' -> Kassir, beýlekiler (admin/manager) -> Administrator
    const role: AppUserRole = accountUser.role === 'staff' ? 'Kassir' : 'Administrator';
    const appUser: AppUser = {
      id: generateUserId(),
      fullName,
      username,
      password: accountUser.password ?? '',
      role,
      isActive: true,
      permissions: clonePermissions(ROLE_PERMISSIONS[role]),
      createdAt: new Date().toISOString(),
    };

    await saveUserToDb(appUser, storeDb);
    created.push(appUser);
    knownNames.add(fullName.toLowerCase());
    knownUsernames.add(username);
  }

  if (created.length === 0) return existing;
  return [...existing, ...created].sort((a, b) => a.fullName.localeCompare(b.fullName, 'tr'));
}
