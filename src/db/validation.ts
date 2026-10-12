import { z } from 'zod';
import { translate } from '../locales/i18n';
import { getActiveLanguage } from '../utils/locale';
import { CUSTOMER_FIELDS, INVOICE_FIELDS, PRODUCT_FIELDS, type FieldPair } from './schema/fieldMap';

// Doğrulama dönüşüm değildir: coerce/default/strip yok; orijinal değerler yazılır.
// Serbest kategori/birimler, negatif stok/bakiye ve +/- yüzde davranışı korunur.
const text = z.string();
const identifier = text.refine((value) => value.trim().length > 0);
const number = z.number().finite();
const imageType = z.enum(['water', 'cola', 'pepsi', 'orange', 'chips', 'chocolate', 'milk', 'bread', 'default']);
const optText = text.optional();
const optNumber = number.optional();
const optBoolean = z.boolean().optional();

export const ProductSchema = z.object({
  id: identifier, sku: text, barcode: text, name: text, category: text,
  price: number, stock: number, imageType,
  extraBarcodes: z.array(text).optional(), purchasePrice: optNumber,
  wholesalePrice: optNumber, criticalStock: optNumber, allowNegativeStock: optBoolean,
  unit: optText, unit2: optText, unit2Qty: optNumber, expiryDate: optText,
  imageUrl: optText, warehouseId: optText, isActive: optBoolean,
}).passthrough();

export const CustomerSchema = z.object({
  id: identifier, name: text, balance: number, phone: optText,
  type: z.enum(['customer', 'employee', 'supplier']).optional(),
  dueDateDays: optNumber, creditLimit: optNumber, addressNote: optText,
  isActive: optBoolean, cashSalesBlocked: optBoolean,
}).passthrough();

const CartItemSchema = z.object({
  id: identifier, productId: text, sku: text, name: text,
  price: number, qty: number, imageType,
  unit: optText, percent: optNumber, imageUrl: optText,
}).passthrough();

export const InvoiceSchema = z.object({
  id: identifier, invoiceNo: text,
  invoiceType: z.enum(['sales', 'purchase', 'sales_return', 'purchase_return',
    'other_in', 'other_out', 'warehouse_move', 'proforma', 'quotation']),
  customerId: text.nullable(), customerName: text, items: z.array(CartItemSchema),
  itemCount: number.int().nonnegative(), subtotal: number, discountTotal: number,
  taxTotal: number, amountDue: number,
  paymentMethod: z.enum(['cash', 'card', 'credit', 'split']), cashReceived: number,
  changeDue: number, status: z.enum(['completed', 'voided']), createdAt: text,
  cashierName: text, internalNote: optText, currency: optText,
  exchangeRateAtTime: optNumber, amountTmt: optNumber, targowId: optText,
  regionId: optText, warehouseId: optText, targetWarehouseId: optText,
  ledgerId: optText, draftStatus: z.enum(['pending', 'accepted', 'rejected']).optional(),
  createdBy: optText, createdByRole: optText, device: optText, acceptedBy: optText,
  acceptedAt: optText, rejectedReason: optText, voidedAt: optText, voidedBy: optText,
  paidAmount: optNumber, remainingDebt: optNumber, creditTermDays: optNumber, dueDate: optText,
}).passthrough();

export const TransactionSchema = z.object({
  id: identifier, type: z.enum(['income', 'expense']), date: text, amount: number,
  paymentMethod: z.enum(['cash', 'card', 'transfer']),
  category: z.enum(['hyzmat_toleg', 'weresiye_yygnamak', 'karz_almak',
    'karende_girdejisi', 'atiyaclandyrys_tolegi', 'maya_goyum_girdejisi', 'basga_girdeji',
    'dukan_cykdajylary', 'aylyk', 'karz_bermek', 'karz_gaytarmak', 'salgyt_tolegi',
    'ulag_cykdajylary', 'mahabat_cykdajylary', 'bejeris_abatlayys', 'enjam_satyn_almak',
    'basga_cykdajy', 'haryt_satuw', 'haryt_satyn_almak']),
  subCategory: z.enum(['karende', 'elektrik', 'suw', 'beyleki']).optional(),
  customerId: optText, personName: optText, staffUserId: optText, description: optText,
  invoiceId: optText, currency: optText, exchangeRateAtTime: optNumber, amountTmt: optNumber,
  ledgerId: optText, transferGroupId: optText, createdAt: text,
}).passthrough();

// PC belgeleri düz ve eski sürümlerde seyrektir. Bilinen alanlar varsa tipleri
// denetlenir; APK modelinin zorunlu alanları PC kaydına dayatılmaz.
function pcFields(fields: readonly FieldPair[]): Record<string, z.ZodType> {
  return Object.fromEntries(fields.map((field) => [field.pc,
    (field.kind === 'number' || field.kind === 'optNumber' ? number
      : field.kind === 'optStringArray' ? z.array(text) : text).optional(),
  ]));
}
// LWW katmanı eski belgelerde ISO string yanında saniye/ms sayılarını da okur.
const timestamp = z.union([text, number]).optional();
const metadata = { createdAt: timestamp, updatedAt: timestamp, syncedAt: timestamp };
export const PcProductSchema = z.object({
  ...pcFields(PRODUCT_FIELDS), ...metadata, type: z.literal('urun').optional(),
  ad: text, sku: optText, isActive: optBoolean,
}).passthrough();
export const PcCustomerSchema = z.object({
  ...pcFields(CUSTOMER_FIELDS), ...metadata, type: z.literal('kagent').optional(),
  ad: text, tip: optText, unvan: optText, notlar: optText,
}).passthrough();
const PcInvoiceItemSchema = z.object({
  urunId: optText, urunAd: optText, barkod: optText, birim: optText,
  miktar: optNumber, fiyat: optNumber, iskontoYuzde: optNumber, toplam: optNumber,
}).passthrough();
export const PcInvoiceSchema = z.object({
  ...pcFields(INVOICE_FIELDS), ...metadata, type: z.literal('fatura').optional(),
  faturaTipi: optText, durum: optText, odemeTipi: optText,
  kalemler: z.array(PcInvoiceItemSchema).optional(),
}).passthrough();

export interface DocumentValidationIssue { path: string; code: string }

/** Hata mesajı belge değerlerini (isim, telefon, fatura içeriği) sızdırmaz. */
export class DocumentValidationError extends Error {
  readonly code = 'VALIDATION_ERROR';
  constructor(readonly issues: readonly DocumentValidationIssue[]) {
    const paths = [...new Set(issues.map((issue) => issue.path || '$'))].join(', ');
    super(translate(getActiveLanguage(), 'errors.documentValidation', { fields: paths }));
    this.name = 'DocumentValidationError';
  }
}

function fail(path: string, code: string): never {
  throw new DocumentValidationError([{ path, code }]);
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function check(schema: z.ZodType, value: unknown, prefix = ''): void {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new DocumentValidationError(result.error.issues.map((issue) => ({
      path: [prefix, ...issue.path.map(String)].filter(Boolean).join('.'), code: issue.code,
    })));
  }
}

const LOCAL_DOCUMENTS = [
  { prefix: 'product_', payload: 'product', docType: 'product', schema: ProductSchema },
  { prefix: 'customer_', payload: 'customer', docType: 'customer', schema: CustomerSchema },
  { prefix: 'invoice_', payload: 'invoice', docType: 'invoice', schema: InvoiceSchema },
  { prefix: 'money_', payload: 'transaction', docType: 'money', schema: TransactionSchema },
] as const;

/**
 * Son yazılacak belgeyi üretir ve doğrular. Kısmi üst alan/payload güncellemeleri
 * mevcut kayıtla birleşir; diziler değiştirilir, derin/genel merge yapılmaz.
 * Sonuç Zod parse çıktısı DEĞİLDİR: bilinmeyen alanlar ve hassas değerler korunur.
 */
export function prepareDocumentForWrite(
  id: string,
  fields: Record<string, unknown>,
  existing?: Record<string, unknown>
): Record<string, unknown> & { _id: string } {
  check(identifier, id, '_id');
  if (!isRecord(fields)) fail('$', 'invalid_type');
  if (fields._id !== undefined && fields._id !== id) fail('_id', 'identity_mismatch');
  const doc: Record<string, unknown> & { _id: string } =
    { ...existing, ...fields, _id: id, _rev: existing?._rev };
  if (doc._deleted !== undefined && typeof doc._deleted !== 'boolean') fail('_deleted', 'invalid_type');
  // Tombstone'lar domain gövdesi taşımaz; clearLocalData ve silme replikasyonu korunur.
  if (doc._deleted === true) return doc;

  const local = LOCAL_DOCUMENTS.find((definition) => id.startsWith(definition.prefix));
  if (local) {
    const { payload, docType, schema, prefix } = local;
    if (isRecord(existing?.[payload]) && isRecord(fields[payload])) {
      doc[payload] = { ...existing[payload], ...fields[payload] };
    }
    if (doc.docType !== docType) fail('docType', 'invalid_value');
    check(schema, doc[payload], payload);
    const body = doc[payload] as Record<string, unknown>;
    if (body.id !== id.slice(prefix.length)) fail(`${payload}.id`, 'identity_mismatch');
    check(z.object(metadata).passthrough(), doc);
  } else if (id.startsWith('urun:')) {
    if (!id.slice('urun:'.length)) fail('_id', 'identity_mismatch');
    check(PcProductSchema, doc);
  } else if (id.startsWith('kagent:')) {
    if (!id.slice('kagent:'.length)) fail('_id', 'identity_mismatch');
    check(PcCustomerSchema, doc);
  } else if (id.startsWith('fatura:')) {
    if (!id.slice('fatura:'.length)) fail('_id', 'identity_mismatch');
    check(PcInvoiceSchema, doc);
  }
  // audit, settings, license, hesap ve diğer modüller bu dört domain şemasına ait değil.
  return doc;
}
