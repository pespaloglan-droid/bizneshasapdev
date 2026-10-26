import type {
  AppSettings,
  LanguageCode,
  PermissionsMap,
  RoleTemplates,
} from '../types';
import { getLocalDatabase, upsertDoc } from './pouch';
import { ROLE_PERMISSIONS } from './userService';
import { applyBaseCurrency, DEFAULT_BASE_CURRENCY } from './currencyService';
import { detectInitialLanguage } from '../utils/languageDetect';

const SETTINGS_DOC = 'settings_app';
const ROLES_DOC = 'settings_roles';

/** Ulanyjy moduly bilen deň model — rol şablonlary şu ýerden dolandyrylýar. */
export const DEFAULT_ROLE_TEMPLATES: RoleTemplates = { ...ROLE_PERMISSIONS };

export const SCALE_MODELS = [
  'CAS',
  'Massa-K',
  'Şuni özi giriz',
  'ACLAS',
  'Bizerba',
  'Mettler Toledo',
] as const;

export const SCALE_PORTS = ['COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'USB'] as const;

export const DATE_FORMATS = ['DD.MM.YYYY', 'YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY'] as const;

export function defaultSettings(language: LanguageCode, companyName: string): AppSettings {
  return {
    printer: {
      defaultPrinter: '',
      kind: 'standard',
      paperWidth: '80mm',
      connection: 'usb',
      ipAddress: '',
      port: '9100',
    },
    scale: {
      port: 'COM1',
      model: 'CAS',
      unit: 'kg',
      autoRead: false,
    },
    receipt: {
      logoDataUrl: '',
      companyName,
      address: '',
      phone: '',
      taxId: '',
      logoWidth: 0,
      logoCenter: true,
      footerNote: 'Sag boluň, ýene geliň!',
      fields: {
        logo: true,
        address: true,
        phone: true,
        taxId: false,
        qr: false,
        barcode: false,
        cashier: true,
        customer: true,
      },
      paperWidth: '80mm',
      fontScale: 'md',
      qrContent: 'invoice',
      autoPrint: false,
      copies: 1,
      standard: {
        orientation: 'portrait',
        showImages: false,
        columns: {
          barcode: false,
          unit: true,
          unitPrice: true,
          discount: true,
          subtotal: true,
          tax: false,
        },
        info: {
          currency: true,
          payment: true,
          customer: true,
          ledger: false,
        },
        header: true,
        pageNumbers: true,
        signature: false,
        notes: '',
        fontScale: 'md',
        copies: 1,
      },
    },
    general: {
      language,
      dateFormat: 'DD.MM.YYYY',
      autoBackup: false,
      backupFrequency: 'daily',
      backupFolder: '',
      auditLogEnabled: false,
      baseCurrencyCode: DEFAULT_BASE_CURRENCY.code,
      baseCurrencyName: DEFAULT_BASE_CURRENCY.name,
    },
    firm: {
      name: companyName,
      code: '',
      title: '',
      phone: '',
      fax: '',
      address: '',
      taxPercent: 0,
    },
    // Deslapky: eski gürşüş saklanýar (passiw ulanylmaz, alş aşagy açyk, 90 gün).
    operations: {
      allowInactiveCustomer: false,
      allowInactiveProduct: false,
      allowBelowCostSale: true,
      creditMinDays: 3,
      creditMaxDays: 360,
      creditDefaultDays: 90,
      operationStartDate: '',
      operationEndDate: '',
    },
    barcode: {
      prefix: '',
      suffix: '',
    },
  };
}

async function readDoc<T>(storeDb: string, id: string): Promise<T | null> {
  try {
    const doc = await getLocalDatabase(storeDb).get(id);
    return doc as unknown as T;
  } catch {
    return null;
  }
}

export async function getAppSettings(storeDb: string): Promise<AppSettings | null> {
  const doc = await readDoc<{ settings?: AppSettings }>(storeDb, SETTINGS_DOC);
  const settings = normalizeSettings(doc?.settings ?? null);
  syncBaseCurrency(settings);
  return settings;
}

/**
 * Kayıtlı taban walyutayı canlı bağlayıcılara yazar.
 * Böylece fiyat, fatura ve rapor ekranları ayar yüklenir yüklenmez
 * doğru kodu gösterir (APK ve PC'de ortak).
 */
export function syncBaseCurrency(settings: AppSettings | null): void {
  const code = settings?.general?.baseCurrencyCode;
  if (!code) return;
  const name = settings?.general?.baseCurrencyName || code;
  applyBaseCurrency({ code, name, symbol: code.slice(0, 2) });
}

/** Taban walyutayı kalıcı olarak değiştirir ve hemen uygular. */
export async function saveBaseCurrency(
  storeDb: string,
  currency: { code: string; name: string; symbol: string }
): Promise<void> {
  const current = (await getAppSettings(storeDb)) ?? defaultSettings(detectInitialLanguage(), '');
  const next: AppSettings = {
    ...current,
    general: {
      ...current.general,
      baseCurrencyCode: currency.code.trim().toUpperCase(),
      baseCurrencyName: currency.name.trim() || currency.code.trim().toUpperCase(),
    },
  };
  await saveAppSettings(next, storeDb);
  syncBaseCurrency(next);
}

/**
 * Köne ýazylan sazlamalarda täze meýdanlar ýok bolmagy mümkin —
 * şonuň üçin deslapky bahalar bilen çuňňur birleşdirilýär (migration).
 */
export function normalizeSettings(raw: AppSettings | null): AppSettings | null {
  if (!raw) return null;
  const language = raw.general?.language ?? detectInitialLanguage();
  const companyName = raw.receipt?.companyName ?? '';
  const d = defaultSettings(language, companyName);
  const rawStandard = raw.receipt?.standard;
  return {
    printer: { ...d.printer, ...raw.printer },
    scale: { ...d.scale, ...raw.scale },
    general: { ...d.general, ...raw.general },
    firm: { ...d.firm, ...raw.firm },
    operations: { ...d.operations, ...raw.operations },
    barcode: { ...d.barcode, ...raw.barcode },
    receipt: {
      ...d.receipt,
      ...raw.receipt,
      fields: { ...d.receipt.fields, ...raw.receipt?.fields },
      standard: {
        ...d.receipt.standard,
        ...rawStandard,
        columns: { ...d.receipt.standard.columns, ...rawStandard?.columns },
        info: { ...d.receipt.standard.info, ...rawStandard?.info },
      },
    },
  };
}

export async function saveAppSettings(
  settings: AppSettings,
  storeDb: string
): Promise<void> {
  await upsertDoc(storeDb, SETTINGS_DOC, { docType: 'settings', settings });
}

/**
 * Tek dil kaynağı senkronu: localStorage'daki son seçim kazanır ve
 * AppSettings.general.language olarak DB'ye yazılır (dil değişiminde ve girişte).
 */
export async function syncLanguageToDb(
  storeDb: string,
  language: LanguageCode
): Promise<void> {
  const current = (await getAppSettings(storeDb)) ?? defaultSettings(language, '');
  if (current.general.language === language) return;
  await saveAppSettings(
    { ...current, general: { ...current.general, language } },
    storeDb
  );
}

export async function getRoleTemplates(storeDb: string): Promise<RoleTemplates> {
  const doc = await readDoc<{ templates?: RoleTemplates }>(storeDb, ROLES_DOC);
  return doc?.templates ?? { ...DEFAULT_ROLE_TEMPLATES };
}

export async function saveRoleTemplates(
  templates: RoleTemplates,
  storeDb: string
): Promise<void> {
  await upsertDoc(storeDb, ROLES_DOC, { docType: 'settings', templates });
}

export function emptyPermissions(): PermissionsMap {
  const none = { view: false, create: false, edit: false, delete: false, report: false };
  return {
    faktura: { ...none },
    kassa: { ...none },
    musteri: { ...none },
    haryt: { ...none },
    hasaplama: { ...none },
    walyta: { ...none },
    depder: { ...none },
    ambar: { ...none },
    targowy: { ...none },
    sazlamalar: { ...none },
    ulanyjy: { ...none },
  };
}

/** Ulanyjy modulyna täze rol düşende ulanylýan standart şablon. */
export function templateFor(templates: RoleTemplates, role: string): PermissionsMap {
  return templates[role] ?? emptyPermissions();
}

// ── Maglumat eksport / import ───────────────────────────────────────────────

export async function exportStoreData(storeDb: string): Promise<string> {
  const db = getLocalDatabase(storeDb);
  const result = await db.allDocs({ include_docs: true });
  const docs = result.rows.flatMap((row) => (row.doc ? [row.doc] : []));
  return JSON.stringify(
    { app: 'biznes-hasap', version: 1, exportedAt: new Date().toISOString(), docs },
    null,
    2
  );
}

export async function importStoreData(storeDb: string, json: string, accountId?: string, allowLegacy = false): Promise<number> {
  const { inspectBackup, restoreSelectedBackup } = await import('./backupService');
  const backup = inspectBackup(json);
  const result = await restoreSelectedBackup(storeDb, accountId ?? storeDb, backup, backup.scopes, allowLegacy);
  if (result.failed.length) throw new Error(`BACKUP_PARTIAL_FAILURE:${result.failed.length}`);
  return Object.values(result.written).reduce((a, b) => a + b, 0);
}
