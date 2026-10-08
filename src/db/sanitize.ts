import type {
  AppUser,
  CartItem,
  CurrencyRate,
  Customer,
  CustomerType,
  InvoiceRecord,
  InvoiceType,
  Ledger,
  MoneyTransaction,
  PaymentMethod,
  Product,
  Targow,
  TargowRegion,
  Warehouse,
} from '../types';

/**
 * Eski/eksik alanlı kayıt temizliği (beyaz ekran koruması).
 * Telefondaki eski sürüm kayıtlarında eksik alan olabilir; render anında
 * `.toLowerCase()`, `.trim()` gibi çağrılar patlayıp tüm ekranı unmount eder.
 * Yükleyiciler bu fonksiyonlardan geçirir: id'siz kayıt atılır, eksik
 * alanlar güvenli varsayılanlarla doldurulur. Mevcut veriler korunur.
 */

function str(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function num(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function strArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

function asRecord(raw: unknown): Record<string, unknown> | null {
  return raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : null;
}

const IMAGE_TYPES: Product['imageType'][] = [
  'water', 'cola', 'pepsi', 'orange', 'chips', 'chocolate', 'milk', 'bread', 'default',
];

const INVOICE_TYPES: InvoiceType[] = [
  'sales', 'purchase', 'sales_return', 'purchase_return',
  'other_in', 'other_out', 'warehouse_move', 'proforma', 'quotation',
];

const PAYMENT_METHODS: PaymentMethod[] = ['cash', 'card', 'credit', 'split'];
const CUSTOMER_TYPES: CustomerType[] = ['customer', 'employee', 'supplier'];

export function sanitizeProduct(raw: unknown): Product | null {
  const p = asRecord(raw);
  if (!p) return null;
  const id = str(p.id);
  if (!id) return null;
  const imageType = IMAGE_TYPES.includes(p.imageType as Product['imageType'])
    ? (p.imageType as Product['imageType'])
    : 'default';
  return {
    id,
    sku: str(p.sku),
    barcode: str(p.barcode),
    extraBarcodes: strArray(p.extraBarcodes),
    name: str(p.name, '—'),
    category: str(p.category),
    price: num(p.price),
    purchasePrice: typeof p.purchasePrice === 'number' ? p.purchasePrice : undefined,
    wholesalePrice: typeof p.wholesalePrice === 'number' ? p.wholesalePrice : undefined,
    stock: num(p.stock),
    allowNegativeStock: p.allowNegativeStock === true,
    criticalStock: typeof p.criticalStock === 'number' ? p.criticalStock : undefined,
    unit: typeof p.unit === 'string' && p.unit ? p.unit : undefined,
    unit2: typeof p.unit2 === 'string' && p.unit2 ? p.unit2 : undefined,
    unit2Qty: typeof p.unit2Qty === 'number' ? p.unit2Qty : undefined,
    expiryDate: typeof p.expiryDate === 'string' ? p.expiryDate : undefined,
    imageType,
    imageUrl: typeof p.imageUrl === 'string' ? p.imageUrl : undefined,
    warehouseId: typeof p.warehouseId === 'string' ? p.warehouseId : undefined,
  };
}

export function sanitizeCustomer(raw: unknown): Customer | null {
  const c = asRecord(raw);
  if (!c) return null;
  const id = str(c.id);
  if (!id) return null;
  const type = CUSTOMER_TYPES.includes(c.type as CustomerType)
    ? (c.type as CustomerType)
    : 'customer';
  return {
    id,
    name: str(c.name, '—'),
    phone: typeof c.phone === 'string' && c.phone ? c.phone : undefined,
    type,
    dueDateDays: typeof c.dueDateDays === 'number' ? c.dueDateDays : undefined,
    creditLimit: typeof c.creditLimit === 'number' ? c.creditLimit : undefined,
    addressNote: typeof c.addressNote === 'string' && c.addressNote ? c.addressNote : undefined,
    balance: num(c.balance),
  };
}

function sanitizeCartItem(raw: unknown): CartItem {
  const item = asRecord(raw) ?? {};
  return {
    id: str(item.id),
    productId: str(item.productId),
    sku: str(item.sku),
    name: str(item.name, '—'),
    price: num(item.price),
    qty: num(item.qty, 1) || 1,
    unit: typeof item.unit === 'string' ? item.unit : undefined,
    percent: typeof item.percent === 'number' ? item.percent : undefined,
    imageType: IMAGE_TYPES.includes(item.imageType as CartItem['imageType'])
      ? (item.imageType as CartItem['imageType'])
      : 'default',
    imageUrl: typeof item.imageUrl === 'string' ? item.imageUrl : undefined,
  };
}

export function sanitizeInvoice(raw: unknown): InvoiceRecord | null {
  const v = asRecord(raw);
  if (!v) return null;
  const id = str(v.id);
  if (!id) return null;
  const invoiceType = INVOICE_TYPES.includes(v.invoiceType as InvoiceType)
    ? (v.invoiceType as InvoiceType)
    : 'sales';
  const paymentMethod = PAYMENT_METHODS.includes(v.paymentMethod as PaymentMethod)
    ? (v.paymentMethod as PaymentMethod)
    : 'cash';
  const status = v.status === 'voided' ? 'voided' : 'completed';
  const items = Array.isArray(v.items) ? v.items.map(sanitizeCartItem) : [];
  return {
    ...(v as object),
    id,
    invoiceNo: str(v.invoiceNo, id),
    invoiceType,
    customerId: typeof v.customerId === 'string' ? v.customerId : null,
    customerName: str(v.customerName),
    items,
    itemCount: num(v.itemCount, items.length),
    subtotal: num(v.subtotal),
    discountTotal: num(v.discountTotal),
    taxTotal: num(v.taxTotal),
    amountDue: num(v.amountDue),
    paymentMethod,
    cashReceived: num(v.cashReceived),
    changeDue: num(v.changeDue),
    status,
    createdAt: str(v.createdAt, new Date(0).toISOString()),
    cashierName: str(v.cashierName),
  } as InvoiceRecord;
}

export function sanitizeMoneyTx(raw: unknown): MoneyTransaction | null {
  const t = asRecord(raw);
  if (!t) return null;
  const id = str(t.id);
  if (!id) return null;
  const type = t.type === 'expense' ? 'expense' : 'income';
  return {
    ...(t as object),
    id,
    type,
    date: str(t.date),
    amount: num(t.amount),
    createdAt: str(t.createdAt, new Date(0).toISOString()),
  } as MoneyTransaction;
}

export function sanitizeAppUser(raw: unknown): AppUser | null {
  const u = asRecord(raw);
  if (!u) return null;
  const id = str(u.id);
  if (!id) return null;
  return {
    ...(u as object),
    id,
    fullName: str(u.fullName, str(u.username, '—')),
    username: str(u.username),
    password: str(u.password),
    isActive: u.isActive !== false,
  } as AppUser;
}

export function sanitizeCurrency(raw: unknown): CurrencyRate | null {
  const c = asRecord(raw);
  if (!c) return null;
  const id = str(c.id);
  const code = str(c.code).toUpperCase();
  if (!id || !code) return null;
  return {
    ...(c as object),
    id,
    code,
    name: str(c.name, code),
    symbol: str(c.symbol, code.slice(0, 2)),
    rate: num(c.rate, 1) || 1,
  } as CurrencyRate;
}

export function sanitizeTargow(raw: unknown): Targow | null {
  const t = asRecord(raw);
  if (!t) return null;
  const id = str(t.id);
  if (!id) return null;
  return {
    ...(t as object),
    id,
    fullName: str(t.fullName, '—'),
    phone: str(t.phone),
    regionIds: strArray(t.regionIds),
    commissionRate: num(t.commissionRate),
    monthlyTarget: num(t.monthlyTarget),
    isActive: t.isActive !== false,
    createdAt: str(t.createdAt, new Date(0).toISOString()),
  } as Targow;
}

export function sanitizeRegion(raw: unknown): TargowRegion | null {
  const r = asRecord(raw);
  if (!r) return null;
  const id = str(r.id);
  const name = str(r.name);
  if (!id || !name) return null;
  return {
    ...(r as object),
    id,
    name,
    createdAt: str(r.createdAt, new Date(0).toISOString()),
  } as TargowRegion;
}

export function sanitizeLedger(raw: unknown): Ledger | null {
  const l = asRecord(raw);
  if (!l) return null;
  const id = str(l.id);
  if (!id) return null;
  const perms = asRecord(l.permissions) ?? {};
  return {
    ...(l as object),
    id,
    name: str(l.name, '—'),
    currency: str(l.currency, 'TMT') || 'TMT',
    openingBalance: num(l.openingBalance),
    isActive: l.isActive !== false,
    permissions: perms as Ledger['permissions'],
    createdAt: str(l.createdAt, new Date(0).toISOString()),
  } as Ledger;
}

export function sanitizeWarehouse(raw: unknown): Warehouse | null {
  const w = asRecord(raw);
  if (!w) return null;
  const id = str(w.id);
  if (!id) return null;
  return {
    ...(w as object),
    id,
    name: str(w.name, '—'),
    createdAt: str(w.createdAt, new Date(0).toISOString()),
  } as Warehouse;
}
