import type { LanguageCode, Product } from '../types';
import { listDocsByPrefix, removeDoc, upsertDoc } from './pouch';

const PREFIX = 'unit_';

export interface MeasurementUnit {
  id: string;
  code: string;      // önümiň `unit` meýdançasynda saklanýar
  labelTm: string;   // görkezilýän at (türkmen)
  labelTr: string;   // görkezilýän at (türk)
  createdAt: string;
}

/** Sabit gelen başlangyç sanaw — pozulmaýar, diňe üstüne goşulýar. */
export const DEFAULT_UNITS: readonly MeasurementUnit[] = [
  { id: 'unit_adet', code: 'adet', labelTm: 'SANY', labelTr: 'ADET', createdAt: '' },
  { id: 'unit_kg', code: 'kg', labelTm: 'KG', labelTr: 'KG', createdAt: '' },
  { id: 'unit_litre', code: 'litre', labelTm: 'LITR', labelTr: 'LITRE', createdAt: '' },
  { id: 'unit_paket', code: 'paket', labelTm: 'PAKET', labelTr: 'PAKET', createdAt: '' },
  { id: 'unit_metre', code: 'metre', labelTm: 'METR', labelTr: 'METRE', createdAt: '' },
  { id: 'unit_kutu', code: 'kutu', labelTm: 'GUTY', labelTr: 'KUTU', createdAt: '' },
  { id: 'unit_karopka', code: 'karopka', labelTm: 'KAROPKA', labelTr: 'KAROPKA', createdAt: '' },
  { id: 'unit_halta', code: 'halta', labelTm: 'HALTA', labelTr: 'HALTA', createdAt: '' },
  { id: 'unit_celek', code: 'celek', labelTm: 'ÇELEK', labelTr: 'ÇELEK', createdAt: '' },
];

export const DEFAULT_UNIT_CODE = 'adet';

/** Atdan kod öndürýär: "RULON" -> "rulon", "Aýlyk set" -> "aylykset". */
export function makeUnitCode(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/ä/g, 'a')
    .replace(/ý/g, 'y')
    .replace(/ň/g, 'n')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ç/g, 'c')
    .replace(/ž/g, 'z')
    .replace(/[^a-z0-9]+/g, '');
}

export function generateUnitId(code: string): string {
  return `unit_${code || Date.now()}`;
}

// ── CRUD ────────────────────────────────────────────────────────────────────

export async function getUnits(storeDb: string): Promise<MeasurementUnit[]> {
  const docs = await listDocsByPrefix(storeDb, PREFIX);
  return docs
    .filter((doc) => doc.docType === 'unit' && doc.unit)
    .map((doc) => doc.unit as MeasurementUnit)
    .sort((a, b) => a.labelTm.localeCompare(b.labelTm, 'tr'));
}

export async function saveUnit(unit: MeasurementUnit, storeDb: string): Promise<void> {
  await upsertDoc(storeDb, `${PREFIX}${unit.id}`, { docType: 'unit', unit });
}

export async function deleteUnit(unitId: string, storeDb: string): Promise<boolean> {
  return removeDoc(storeDb, `${PREFIX}${unitId}`);
}

/** Sanaw boş bolsa, sabit birlikler ýazylýar (idempotent). */
export async function ensureUnitsSeeded(storeDb: string): Promise<MeasurementUnit[]> {
  const existing = await getUnits(storeDb);
  if (existing.length > 0) return existing;

  const now = new Date().toISOString();
  const seeded = DEFAULT_UNITS.map((unit) => ({ ...unit, createdAt: now }));
  for (const unit of seeded) {
    await saveUnit(unit, storeDb);
  }
  return [...seeded].sort((a, b) => a.labelTm.localeCompare(b.labelTm, 'tr'));
}

// ── Kömekçiler ──────────────────────────────────────────────────────────────

export function unitLabel(
  units: readonly MeasurementUnit[],
  code: string | undefined,
  language: LanguageCode
): string {
  if (!code) return '';
  const found = units.find((unit) => unit.code === code);
  if (!found) return code.toUpperCase();
  return language === 'tm' ? found.labelTm : found.labelTr;
}

/** Kod ýa-da at boýunça gaýtalanmany barlaýar (uly/kiçi harp duýgur däl). */
export function isUnitNameUnique(
  name: string,
  units: readonly MeasurementUnit[],
  excludeId?: string
): boolean {
  const code = makeUnitCode(name);
  const label = name.trim().toLowerCase();
  return !units.some(
    (unit) =>
      unit.id !== excludeId &&
      (unit.code === code ||
        unit.labelTm.toLowerCase() === label ||
        unit.labelTr.toLowerCase() === label)
  );
}

/** Birlik haýsy-da bolsa önümde ulanylýarmy? */
export function isUnitInUse(code: string, products: readonly Product[]): boolean {
  return products.some((product) => product.unit === code || product.unit2 === code);
}

export function makeCustomUnit(name: string): MeasurementUnit {
  const trimmed = name.trim();
  const code = makeUnitCode(trimmed) || `unit${Date.now()}`;
  const label = trimmed.toUpperCase();
  return {
    id: generateUnitId(code),
    code,
    labelTm: label,
    labelTr: label,
    createdAt: new Date().toISOString(),
  };
}