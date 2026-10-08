/**
 * PC ↔ APK alan eşleme haritası (FAZ 2.3 · MD §3.3).
 *
 * TEK KAYNAK: her alan çifti burada bir kez tanımlı; iki yönün dönüşümü de
 * (pcToApk*/apk*ToPcDoc) bu haritadan türetilir. Yeni alan eklerken yalnızca
 * ilgili listeye satır eklenir — ters yönü unutmak imkânsızlaşır.
 *
 * Enum dönüşümleri (tip/faturaTipi/durum/odemeTipi), kalem dizisi ve sabit
 * alanlar (type:'urun', sku:'', ...) haritaya GİRMEZ — bunlar değer
 * dönüşümü değil, yapı kararıdır; schemaBridge.ts'deki dönüştürücülerde kalır.
 */

const str = (v: unknown): string => (typeof v === 'string' ? v : '');
const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
const optStr = (v: unknown): string | undefined => (typeof v === 'string' && v ? v : undefined);
const optNum = (v: unknown): number | undefined =>
  typeof v === 'number' && Number.isFinite(v) ? v : undefined;
const optStrArr = (v: unknown): string[] | undefined =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : undefined;

export type FieldKind =
  /** iki yönde de string, boşsa '' */
  | 'string'
  /** iki yönde de sayı, boşsa 0 */
  | 'number'
  /** iki yönde de opsiyonel string (undefined kalabilir) */
  | 'optString'
  /** iki yönde de opsiyonel sayı */
  | 'optNumber'
  /** string dizisi, yoksa undefined */
  | 'optStringArray'
  /** pc→apk: boşsa '' zorunlu (APK modelde alan zorunlu); apk→pc: ham */
  | 'requiredOnApk'
  /** pc→apk: opsiyonel; apk→pc: boşsa '' (PC belge hep string taşır) */
  | 'requiredOnPc'
  /** pc→apk: boşsa null; apk→pc: boşsa '' (kagentId ↔ customerId) */
  | 'refOrNull'
  /** ISO zaman damgası; boşsa "şimdi" */
  | 'timestampNow';

export interface FieldPair {
  /** PC belge alanı (Türkçe: ad, fiyat, stok...) */
  pc: string;
  /** APK model alanı (İngilizce: name, price, stock...) */
  apk: string;
  kind: FieldKind;
}

const COERCE: Record<FieldKind, { pcToApk: (v: unknown) => unknown; apkToPc: (v: unknown) => unknown }> = {
  string: { pcToApk: str, apkToPc: str },
  number: { pcToApk: num, apkToPc: num },
  optString: { pcToApk: optStr, apkToPc: (v) => v },
  optNumber: { pcToApk: optNum, apkToPc: (v) => v },
  optStringArray: { pcToApk: optStrArr, apkToPc: (v) => v },
  requiredOnApk: { pcToApk: (v) => optStr(v) ?? '', apkToPc: (v) => v },
  requiredOnPc: { pcToApk: optStr, apkToPc: str },
  refOrNull: { pcToApk: (v) => optStr(v) ?? null, apkToPc: str },
  timestampNow: {
    pcToApk: (v) => str(v) || new Date().toISOString(),
    apkToPc: (v) => str(v) || new Date().toISOString(),
  },
};

/**
 * Alan çiftlerini tek yönde uygular.
 * pcToApk: PC belge → APK model alanları; apkToPc: APK model → PC belge alanları.
 */
export function applyFieldMap(
  source: Record<string, unknown>,
  fields: readonly FieldPair[],
  direction: 'pcToApk' | 'apkToPc'
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const field of fields) {
    const coerce = COERCE[field.kind][direction];
    if (direction === 'pcToApk') {
      out[field.apk] = coerce(source[field.pc]);
    } else {
      out[field.pc] = coerce(source[field.apk]);
    }
  }
  return out;
}

// ── Ürün: urun:<id> ↔ product_<id> ─────────────────────────────────────────

export const PRODUCT_FIELDS: readonly FieldPair[] = [
  { pc: 'ad', apk: 'name', kind: 'string' },
  { pc: 'barkod', apk: 'barcode', kind: 'string' },
  { pc: 'ekBarkodlar', apk: 'extraBarcodes', kind: 'optStringArray' },
  { pc: 'kategori', apk: 'category', kind: 'requiredOnApk' },
  { pc: 'fiyat', apk: 'price', kind: 'number' },
  { pc: 'alisFiyati', apk: 'purchasePrice', kind: 'optNumber' },
  { pc: 'toptanFiyat', apk: 'wholesalePrice', kind: 'optNumber' },
  { pc: 'stok', apk: 'stock', kind: 'number' },
  { pc: 'minStok', apk: 'criticalStock', kind: 'optNumber' },
  { pc: 'birim', apk: 'unit', kind: 'optString' },
  { pc: 'sonKullanmaTarihi', apk: 'expiryDate', kind: 'optString' },
  { pc: 'resimData', apk: 'imageUrl', kind: 'optString' },
  { pc: 'depoId', apk: 'warehouseId', kind: 'optString' },
];

// ── Müşteri: kagent:<id> ↔ customer_<id> ───────────────────────────────────

export const CUSTOMER_FIELDS: readonly FieldPair[] = [
  { pc: 'ad', apk: 'name', kind: 'string' },
  { pc: 'telefon', apk: 'phone', kind: 'requiredOnPc' },
  { pc: 'adres', apk: 'addressNote', kind: 'requiredOnPc' },
  { pc: 'bakiye', apk: 'balance', kind: 'number' },
  { pc: 'borcLimiti', apk: 'creditLimit', kind: 'optNumber' },
  { pc: 'vadeGunu', apk: 'dueDateDays', kind: 'optNumber' },
];

// ── Fatura: fatura:<id> ↔ invoice_<id> ─────────────────────────────────────

export const INVOICE_FIELDS: readonly FieldPair[] = [
  { pc: 'faturaNo', apk: 'invoiceNo', kind: 'string' },
  { pc: 'kagentId', apk: 'customerId', kind: 'refOrNull' },
  { pc: 'kagentAd', apk: 'customerName', kind: 'string' },
  { pc: 'tarih', apk: 'createdAt', kind: 'timestampNow' },
  { pc: 'depoId', apk: 'warehouseId', kind: 'optString' },
  { pc: 'araToplam', apk: 'subtotal', kind: 'number' },
  { pc: 'iskontoToplam', apk: 'discountTotal', kind: 'number' },
  { pc: 'vergiToplam', apk: 'taxTotal', kind: 'number' },
  { pc: 'toplam', apk: 'amountDue', kind: 'number' },
  { pc: 'odenenNakit', apk: 'cashReceived', kind: 'number' },
  { pc: 'paraUstu', apk: 'changeDue', kind: 'number' },
];
