import { AppUser, AppUserRole, LanguageCode, PermissionsMap, UserAccessControl, UserDefaults, UserModuleExtras } from '../../types';
import { ROLE_PERMISSIONS, clonePermissions, generateUserId, isUsernameUnique } from '../../db/userService';
import {
  emptyAccessControl,
  emptyDefaults,
  normalizeAccessControl,
  normalizeDefaults,
  normalizeModuleExtras,
} from '../../db/accessService';

export interface UserFormState {
  username: string;
  password: string;
  confirmPassword: string;
  role: AppUserRole;
  isActive: boolean;
  permissions: PermissionsMap;
  defaults: UserDefaults;
  accessControl: UserAccessControl;
  moduleExtras: UserModuleExtras;
}

export function emptyUserForm(): UserFormState {
  return {
    username: '',
    password: '',
    confirmPassword: '',
    role: 'Kassir',
    isActive: true,
    permissions: clonePermissions(ROLE_PERMISSIONS.Kassir),
    defaults: emptyDefaults(),
    accessControl: emptyAccessControl(),
    moduleExtras: normalizeModuleExtras(),
  };
}

export function formFromUser(user: AppUser): UserFormState {
  return {
    username: user.username,
    password: '',
    confirmPassword: '',
    role: user.role,
    isActive: user.isActive,
    permissions: clonePermissions(user.permissions),
    defaults: normalizeDefaults(user.defaults),
    accessControl: normalizeAccessControl(user.accessControl),
    moduleExtras: normalizeModuleExtras(user.moduleExtras),
  };
}

/**
 * Diňe Ulanyjy ady hökmany. Parol islege görä: boş (parolsyz) ýa-da
 * islendik uzynlykda (hatda 1 harp) bolup biler.
 */
export function validateUserForm(
  form: UserFormState,
  users: AppUser[],
  editingUser: AppUser | null,
  language: LanguageCode
): string | null {
  const tm = language === 'tm';
  const username = form.username.trim();

  if (!username) return tm ? 'Ulanyjy ady hökmanydyr.' : 'Kullanıcı adı zorunludur.';
  if (!isUsernameUnique(username, users, editingUser?.id)) {
    return tm ? 'Bu ulanyjy ady eýýäm ulanylýar.' : 'Bu kullanıcı ady zaten var.';
  }
  if (form.password !== form.confirmPassword) {
    return tm ? 'Parollar gabat gelenok.' : 'Şifreler eşleşmiyor.';
  }
  // Kassa: "Girdeji goş" açyk ýöne kategoriýa sanawy aýdyň boş — ýazga ýol ýok.
  const extras = normalizeModuleExtras(form.moduleExtras);
  if (
    extras.kassa.addIncome &&
    extras.kassa.incomeCategories !== undefined &&
    extras.kassa.incomeCategories.length === 0
  ) {
    return tm ? 'Iň azyndan bir kategoriýa saýlaň.' : 'En az bir kategoriya seçin.';
  }
  // Faktura: GOŞ açyk ýöne görnüş sanawy boş — hiç hili görnüşe ýol ýok.
  const access = normalizeAccessControl(form.accessControl);
  if (
    form.permissions.faktura.create &&
    access.invoiceTypes.mode === 'whitelist' &&
    access.invoiceTypes.list.length === 0
  ) {
    return tm ? 'Iň azyndan bir faktura görnüşi saýlaň.' : 'En az bir fatura türü seçin.';
  }
  return null;
}

export function buildSavedUser(form: UserFormState, editingUser: AppUser | null): AppUser {
  const username = form.username.trim();
  // "Ady Familiýasy" meýdançasy ýok — görkezilýän at hökmünde ulanyjy ady saklanýar.
  const fullName = username;

  if (editingUser) {
    return {
      ...editingUser,
      fullName,
      username,
      role: form.role,
      isActive: form.isActive,
      permissions: form.permissions,
      defaults: normalizeDefaults(form.defaults),
      accessControl: normalizeAccessControl(form.accessControl),
      moduleExtras: normalizeModuleExtras(form.moduleExtras),
      // Parol boş goýulsa, öňki parol saklanýar.
      password: form.password ? form.password : editingUser.password,
    };
  }

  return {
    id: generateUserId(),
    fullName,
    username,
    password: form.password,
    role: form.role,
    isActive: form.isActive,
    permissions: form.permissions,
    defaults: normalizeDefaults(form.defaults),
    accessControl: normalizeAccessControl(form.accessControl),
    moduleExtras: normalizeModuleExtras(form.moduleExtras),
    createdAt: new Date().toISOString(),
  };
}