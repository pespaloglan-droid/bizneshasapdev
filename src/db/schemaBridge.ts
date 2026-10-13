import { setMirrorPending } from './mirrorStatus';
import type { CartItem, Customer, CustomerType, InvoiceRecord, InvoiceType, PaymentMethod, Product } from '../types';
import { listDocsByPrefix, upsertDoc, upsertDocsBatch } from './pouch';

/**
 * PC (offline-pos) ile APK arasındaki veri köprüsü.
 *
 * İki uygulama farklı belge şeması kullanır:
 *   PC  →  urun:<uuid> · kagent:<uuid> · fatura:<uuid>   (Türkçe alan adları)
 *   APK →  product_<id> · customer_<id> · fatura_<id>    (İngilizce alan adları)
 *
 * Bu yüzden APK, kaydederken **iki formatta birden** yazar (asıl kayıt kendi
 * formatında, PC'ye ayna kayıt `urun:` / `kagent:` / `fatura:` olarak). PC de
 * kendi formatında okur. Böylece iki cihaz birbirinin verisini görür.
 *
 * Ayna kayıtlar ayrı `_id` alanına sahip olduğu için iki uygulama aynı belgeyi
 * eşzamanlı düzenlediğinde çakışma (conflict) oluşmaz. Çakışma yerine
 * `updatedAt` / `syncedAt` zaman damgalarıyla son yazan kazanır.
 */

/** Cihaza özel belgeler senkronizasyona katılmaz (aksi halde cihaz kimliği çatışır). */
export const NON_SYNCED_DOC_IDS: ReadonlySet<string> = new Set(['license']);

/**
 * Köprü aktarımı tamamlandığında yayınlanan olay.
 * Arayüz (PosWorkspace) bunu dinleyip ürün/müşteri/fatura listelerini tazeler —
 * aktarım arka planda çalıştığı için liste kendiliğinden yenilenmez.
 */
export const SYNC_IMPORTED_EVENT = 'bh:sync-imported';

export const PC_PREFIX = {
  product: 'urun:',
  customer: 'kagent:',
  invoice: 'fatura:',
} as const;

/** APK'nın kendi yerel önekleri (salesService / productService / customerService ile aynı). */
export const LOCAL_PREFIX = {
  product: 'product_',
  customer: 'customer_',
  invoice: 'invoice_',
} as const;

const str = (v: unknown): string => (typeof v === 'string' ? v : '');
const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
const optStr = (v: unknown): string | undefined => (typeof v === 'string' && v ? v : undefined);
const optNum = (v: unknown): number | undefined => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);
const optStrArr = (v: unknown): string[] | undefined =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : undefined;

/** `urun:abc-123` → `abc-123` */
function stripPrefix(id: string, prefix: string): string {
  return id.startsWith(prefix) ? id.slice(prefix.length) : id;
}

// ── Ürün ────────────────────────────────────────────────────────────────────

export function pcToApkProduct(doc: Record<string, unknown>): Product | null {
  const id = stripPrefix(str(doc._id), PC_PREFIX.product);
  if (!id) return null;
  return {
    id,
    sku: '',
    barcode: str(doc.barkod),
    extraBarcodes: optStrArr(doc.ekBarkodlar),
    name: str(doc.ad),
    category: optStr(doc.kategori) ?? '',
    price: num(doc.fiyat),
    purchasePrice: optNum(doc.alisFiyati),
    wholesalePrice: optNum(doc.toptanFiyat),
    stock: num(doc.stok),
    criticalStock: optNum(doc.minStok),
    unit: optStr(doc.birim),
    expiryDate: optStr(doc.sonKullanmaTarihi),
    imageType: 'default',
    imageUrl: optStr(doc.resimData),
    warehouseId: optStr(doc.depoId),
    isActive: true,
  };
}

export function apkProductToPcDoc(product: Product): Record<string, unknown> {
  const now = new Date().toISOString();
  return {
    _id: `${PC_PREFIX.product}${product.id}`,
    type: 'urun',
    ad: product.name ?? '',
    barkod: product.barcode ?? '',
    ekBarkodlar: product.extraBarcodes,
    kategori: product.category,
    stok: product.stock ?? 0,
    minStok: product.criticalStock ?? 0,
    birim: product.unit,
    alisFiyati: product.purchasePrice ?? 0,
    fiyat: product.price ?? 0,
    toptanFiyat: product.wholesalePrice,
    sonKullanmaTarihi: product.expiryDate,
    resimData: product.imageUrl,
    depoId: product.warehouseId,
    createdAt: now,
    updatedAt: now,
  };
}

// ── Müşteri ─────────────────────────────────────────────────────────────────

const PC_CUSTOMER_TYPE: Record<string, CustomerType> = {
  musteri: 'customer',
  personel: 'employee',
  tedarikci: 'supplier',
};
const APK_CUSTOMER_TYPE: Record<string, string> = {
  customer: 'musteri',
  employee: 'personel',
  supplier: 'tedarikci',
};

export function pcToApkCustomer(doc: Record<string, unknown>): Customer | null {
  const id = stripPrefix(str(doc._id), PC_PREFIX.customer);
  if (!id) return null;
  return {
    id,
    name: str(doc.ad),
    phone: optStr(doc.telefon),
    type: PC_CUSTOMER_TYPE[str(doc.tip)] ?? 'customer',
    dueDateDays: optNum(doc.vadeGunu),
    creditLimit: optNum(doc.borcLimiti),
    addressNote: optStr(doc.adres),
    balance: num(doc.bakiye),
    isActive: true,
  };
}

export function apkCustomerToPcDoc(customer: Customer): Record<string, unknown> {
  const now = new Date().toISOString();
  return {
    _id: `${PC_PREFIX.customer}${customer.id}`,
    type: 'kagent',
    ad: customer.name ?? '',
    unvan: undefined,
    telefon: customer.phone ?? '',
    adres: customer.addressNote ?? '',
    tip: APK_CUSTOMER_TYPE[customer.type ?? 'customer'] ?? 'musteri',
    bakiye: customer.balance ?? 0,
    borcLimiti: customer.creditLimit,
    vadeGunu: customer.dueDateDays,
    notlar: undefined,
    createdAt: now,
    updatedAt: now,
  };
}

// ── Fatura ──────────────────────────────────────────────────────────────────

const PC_INVOICE_TYPE: Record<string, InvoiceType> = {
  satis: 'sales',
  alis: 'purchase',
  satis_iade: 'sales_return',
  alis_iade: 'purchase_return',
  transfer: 'warehouse_move',
};
const APK_INVOICE_TYPE: Record<string, string> = {
  sales: 'satis',
  purchase: 'alis',
  sales_return: 'satis_iade',
  purchase_return: 'alis_iade',
  warehouse_move: 'transfer',
};
const PC_PAYMENT: Record<string, PaymentMethod> = {
  nakit: 'cash',
  kart: 'card',
  veresiye: 'credit',
  parca: 'split',
};
const APK_PAYMENT: Record<string, string> = {
  cash: 'nakit',
  card: 'kart',
  credit: 'veresiye',
  split: 'parca',
};

export function pcToApkInvoice(doc: Record<string, unknown>): InvoiceRecord | null {
  const id = stripPrefix(str(doc._id), PC_PREFIX.invoice);
  if (!id) return null;
  const kalemler = Array.isArray(doc.kalemler) ? (doc.kalemler as Record<string, unknown>[]) : [];
  const items: CartItem[] = kalemler.map((k, i) => ({
    id: `${id}-${i}`,
    productId: str(k.urunId),
    sku: '',
    name: str(k.urunAd),
    price: num(k.fiyat),
    qty: num(k.miktar),
    unit: optStr(k.birim),
    percent: optNum(k.iskontoYuzde),
    imageType: 'default',
  }));
  const durum = str(doc.durum);
  return {
    id,
    invoiceNo: str(doc.faturaNo),
    invoiceType: PC_INVOICE_TYPE[str(doc.faturaTipi)] ?? 'sales',
    customerId: optStr(doc.kagentId) ?? null,
    customerName: str(doc.kagentAd),
    items,
    itemCount: items.length,
    subtotal: num(doc.araToplam),
    discountTotal: num(doc.iskontoToplam),
    taxTotal: num(doc.vergiToplam),
    amountDue: num(doc.toplam),
    paymentMethod: PC_PAYMENT[str(doc.odemeTipi)] ?? 'cash',
    cashReceived: num(doc.odenenNakit),
    changeDue: num(doc.paraUstu),
    status: durum === 'iptal' ? 'voided' : 'completed',
    createdAt: str(doc.tarih) || new Date().toISOString(),
    cashierName: '',
    warehouseId: optStr(doc.depoId),
  };
}

export function apkInvoiceToPcDoc(invoice: InvoiceRecord): Record<string, unknown> {
  const now = new Date().toISOString();
  return {
    _id: `${PC_PREFIX.invoice}${invoice.id}`,
    type: 'fatura',
    faturaNo: invoice.invoiceNo ?? '',
    faturaTipi: APK_INVOICE_TYPE[invoice.invoiceType] ?? 'satis',
    durum: invoice.status === 'voided' ? 'iptal' : 'onayli',
    kagentId: invoice.customerId ?? '',
    kagentAd: invoice.customerName ?? '',
    tarih: invoice.createdAt || now,
    depoId: invoice.warehouseId,
    kalemler: (invoice.items ?? []).map((item) => ({
      urunId: item.productId,
      urunAd: item.name,
      barkod: undefined,
      birim: item.unit,
      miktar: item.qty,
      fiyat: item.price,
      iskontoYuzde: item.percent,
      toplam: item.price * item.qty,
    })),
    araToplam: invoice.subtotal ?? 0,
    iskontoToplam: invoice.discountTotal ?? 0,
    vergiToplam: invoice.taxTotal ?? 0,
    toplam: invoice.amountDue ?? 0,
    odemeTipi: APK_PAYMENT[invoice.paymentMethod] ?? 'nakit',
    odenenNakit: invoice.cashReceived ?? 0,
    paraUstu: invoice.changeDue ?? 0,
    createdAt: now,
    updatedAt: now,
  };
}

// ── Zaman damgası yardımcıları ──────────────────────────────────────────────

function pcUpdatedAt(doc: Record<string, unknown>): number {
  const t = Date.parse(str(doc.updatedAt) || str(doc.createdAt));
  return Number.isNaN(t) ? 0 : t;
}

/** APK belgesinin en son yerel değişiklik zamanı. */
function localSyncedAt(doc: Record<string, unknown>): number {
  const t = Date.parse(str(doc.syncedAt));
  return Number.isNaN(t) ? 0 : t;
}

type MirrorKind = 'product' | 'customer' | 'invoice';

/** Eşzamanlı köprü aktarımlarını sıraya alır (canlı senkron her değişimde tetikler). */
let bridgeRun: Promise<number> | null = null;

/**
 * PC'den gelen aynaları APK'nın asıl kayıtlarına aktarır.
 * Yalnızca PC tarafı daha yeniyse yazar — böylece iki taraf da kendi
 * son değişikliğini korur.
 */
export function importPcMirrorsIntoStore(storeDb: string): Promise<number> {
  if (bridgeRun) return bridgeRun;
  bridgeRun = runBridgeImport(storeDb).finally(() => {
    bridgeRun = null;
  });
  return bridgeRun;
}

async function runBridgeImport(storeDb: string): Promise<number> {
  // Yazılacak belgeler önce toplanır, sonra 100'erlik gruplar halinde yazılır —
  // tek tek yazmak büyük veride arayüzü donduruyordu.
  const writes: { id: string; fields: Record<string, unknown> }[] = [];

  const productDocs = await listDocsByPrefix(storeDb, PC_PREFIX.product);
  for (const mirror of productDocs) {
    if (NON_SYNCED_DOC_IDS.has(mirror._id)) continue;
    const nativeId = stripPrefix(mirror._id, PC_PREFIX.product);
    if (!nativeId) continue;
    const natives = await listDocsByPrefix(storeDb, `${LOCAL_PREFIX.product}${nativeId}`);
    const native = natives[0];
    if (native && localSyncedAt(native) > pcUpdatedAt(mirror)) continue;
    const product = pcToApkProduct(mirror);
    if (!product) continue;
    writes.push({
      id: `${LOCAL_PREFIX.product}${product.id}`,
      fields: {
        docType: 'product',
        product,
        syncedAt: str(mirror.updatedAt) || new Date().toISOString(),
      },
    });
  }

  const customerDocs = await listDocsByPrefix(storeDb, PC_PREFIX.customer);
  for (const mirror of customerDocs) {
    if (NON_SYNCED_DOC_IDS.has(mirror._id)) continue;
    const nativeId = stripPrefix(mirror._id, PC_PREFIX.customer);
    if (!nativeId) continue;
    const natives = await listDocsByPrefix(storeDb, `${LOCAL_PREFIX.customer}${nativeId}`);
    const native = natives[0];
    if (native && localSyncedAt(native) > pcUpdatedAt(mirror)) continue;
    const customer = pcToApkCustomer(mirror);
    if (!customer) continue;
    writes.push({
      id: `${LOCAL_PREFIX.customer}${customer.id}`,
      fields: {
        docType: 'customer',
        customer,
        syncedAt: str(mirror.updatedAt) || new Date().toISOString(),
      },
    });
  }

  const invoiceDocs = await listDocsByPrefix(storeDb, PC_PREFIX.invoice);
  for (const mirror of invoiceDocs) {
    if (NON_SYNCED_DOC_IDS.has(mirror._id)) continue;
    const nativeId = stripPrefix(mirror._id, PC_PREFIX.invoice);
    if (!nativeId) continue;
    const natives = await listDocsByPrefix(storeDb, `${LOCAL_PREFIX.invoice}${nativeId}`);
    const native = natives[0];
    if (native && localSyncedAt(native) > pcUpdatedAt(mirror)) continue;
    const invoice = pcToApkInvoice(mirror);
    if (!invoice) continue;
    writes.push({
      id: `${LOCAL_PREFIX.invoice}${invoice.id}`,
      fields: {
        docType: 'invoice',
        invoice,
        syncedAt: str(mirror.updatedAt) || new Date().toISOString(),
      },
    });
  }

  await upsertDocsBatch(storeDb, writes);
  return writes.length;
}

/** APK'da değişen bir kaydı PC'nin okuyacağı ayna belge olarak yazar. */
export async function mirrorToPc(storeDb: string, kind: MirrorKind, entity: unknown): Promise<void> {
  const doc =
    kind === 'product'
      ? apkProductToPcDoc(entity as Product)
      : kind === 'customer'
        ? apkCustomerToPcDoc(entity as Customer)
        : apkInvoiceToPcDoc(entity as InvoiceRecord);
  if (!doc || typeof doc._id !== 'string') return;
  try {
    await upsertDoc(storeDb, doc._id, doc);
  } catch(error) {
    await setMirrorPending(storeDb, doc._id, true);
    throw error;
  }
  await setMirrorPending(storeDb, doc._id, false);
}