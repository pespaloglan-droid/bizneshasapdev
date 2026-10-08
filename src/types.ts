export type LanguageCode = 'tr' | 'tm' | 'en' | 'ru';

export type PrinterMode = 'auto' | 'receipt' | 'standard';

export interface User {
  id: string;
  name: string;
  role: 'admin' | 'staff' | 'manager';
  hasPassword: boolean;
  password?: string;
}

// ── Kullanıcı Yönetimi (Ulanyjy Modülü) ─────────────────────────────────────

export type AppUserRole = 'Administrator' | 'Kassir' | 'Persenal' | 'Ýörite' | (string & {});

export type ModuleName =
  | 'faktura'
  | 'kassa'
  | 'musteri'
  | 'haryt'
  | 'hasaplama'
  | 'walyta'
  | 'depder'
  | 'ambar'
  | 'targowy'
  | 'sazlamalar'
  | 'ulanyjy';

export interface ModulePermission {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  report: boolean;
}

export type PermissionsMap = Record<ModuleName, ModulePermission>;

export interface AppUser {
  id: string;
  fullName: string;
  username: string;
  password: string;
  phone?: string;
  role: AppUserRole;
  isActive: boolean;
  permissions: PermissionsMap;

// ── Ýörite rugsatlar (Gelişmiş İzinler) ────────────────────────────────────
  /** Warsaýylan bahalar — täze faktura/kassa ýazgysynda formlar öňünden dolýar. */
  defaults?: UserDefaults;
  /** Elýeterlilik kontroli — belli ýazgylara erişim (Phase 2'de modüllerde ulanylýar). */
  accessControl?: UserAccessControl;

  // ── Modul inçe rugsatlary (Kassa / Faktura alt yetkileri) ─────────────────
  /**
   * Kassa we Faktura modullary üçin goşmaça inçe rugsatlar.
   * `undefined` / eksik alan = izinli deslapky (eski gürşüş saklanýar).
   */
  moduleExtras?: UserModuleExtras;

  createdAt: string;
  lastLogin?: string;
}

/** Kassa we Faktura modullary üçin goşmaça inçe rugsatlar. */
export interface UserModuleExtras {
  kassa?: {
    /** "Girdeji goş" — gelir ýazgysy döredip bilýär. */
    addIncome: boolean;
    /** "Çykdajy goş" — gider ýazgysy döredip bilýär. */
    addExpense: boolean;
    /** "Kassa balansyny görkez" — bakiye kartlaryny görkezýär. */
    viewBalance: boolean;
    /**
     * Rugsat berilen gelir kategoriýalary. `undefined` = ähli kategoriýalar açyk,
     * `[]` = hiç biri (Girdeji goş açyk bolsa-da ýazgy ýazyp bolmaýar),
     * doly sanaw = diňe şolar.
     */
    incomeCategories?: MoneyCategoryId[];
  };
  faktura?: {
    /** "Bahany üýtget" — sepetdäki fiyady üýtgedip bilýär (+/- % alanlaryna bagly däl). */
    editPrice: boolean;
    /** "Arzanladyş ber" — +/- % arzanladyş/komissiýa ulanyp bilýär. */
    allowDiscount: boolean;
  };
}

/**
 * Erişim modlary (beyaz/kara sanaw mantygy):
 * - `all`       → "Ählisine rugsat" — hiç hili çäklendirme ýok (deslapky).
 * - `whitelist` → "Diňe saýlananlara rugsat" — diňe sanawdaky ýazgylara elýeter.
 * - `blacklist` → "Saýlanandan başga hemmesine rugsat" — sanawdakylar dagyn.
 */
export type AccessControlMode = 'all' | 'whitelist' | 'blacklist';

/** Bir kategoriýanyň erişim belligi: mod + saýlanan ýazgy ID-leri. */
export interface AccessControlEntry {
  mode: AccessControlMode;
  list: string[];
}

/** Ulanyjynyň deslapky bahalary — täze ýazgy döredilende formlar şuňa görä dolýar. */
export interface UserDefaults {
  /** Başdaky faktura görnüşi (boş = ulgamy deslapky). */
  invoiceType?: InvoiceType | '';
  /** Başdaky töleg görnüşi (boş = ulgamy deslapky). */
  paymentType?: PaymentMethod | '';
  /** Başdaky ölçeg — esas birlik (Product.unit; boş = ulgamy deslapky). */
  unit?: UnitType;
  /** Başdaky ikinji ölçeg — paket/koli birligi (Product.unit2; boş = ulgamy deslapky). */
  unit2?: UnitType;
  /** Başdaky müşderi (boş = "Hiç kim"/Umumy; beýle = müşderi ID). */
  customerId?: string;
  /** Başdaky ambar (boş = ulgamy deslapky). */
  warehouseId?: string;
  /** Başdaky depder (ledger ID; boş = ulgamy deslapky). */
  depderId?: string;
}

/** Ýörite erişim kontroli — kategoriýa boýunça belli ýazgylara elýeterlilik. */
export interface UserAccessControl {
  invoiceTypes: AccessControlEntry;
  paymentTypes: AccessControlEntry;
  customers: AccessControlEntry;
  products: AccessControlEntry;
  warehouses: AccessControlEntry;
  /**
   * Faktura üçin aýratyn ambar rugsatlary. `null` bolsa umumy `warehouses`
   * rugsaty ulanylýar (referansdaky "Faktura üçin rugsatly ambarlar").
   */
  warehousesForInvoice: AccessControlEntry | null;
  depders: AccessControlEntry;
}

export interface Account {
  id: string;
  name: string;
  couchDbUrl: string;
  databaseName: string;
  logoUrl?: string;
  users: User[];
  createdAt: string;
  transactionCount: number;
  /**
   * Lisans Hesap ID'si — hesap oluşturulurken native `createAccountId()` ile bir kez
   * üretilir ve kalıcı saklanır (spec v3 §3.3). Lisans ekranı bu değeri ASLA yeniden
   * üretmez; her açılışta buradan okur. Eski hesaplarda undefined olabilir; bu durumda
   * `getOrCreateLicenseId()` ile geriye uyumlu üretilir.
   */
  licenseId?: string;
}

/**
 * Kategoriýa filtri. `All` ähli harytlary görkezýär; galan bahalar Haryt
 * modulyndaky harytlaryň `category` meýdançasyndan alynýar (erkin setir).
 */
export type ProductCategory = string;

/**
 * Ölçeg birligi kody. Ulanyjy öz birligini goşup bilýär, şonuň üçin
 * sabit sanaw däl — erkin setir (sazlamalarda dolandyrylýar).
 */
export type UnitType = string;

export interface Product {
  id: string;
  sku: string;
  barcode: string;
  extraBarcodes?: string[];   // Ek barkodlar (koli, ikinci barkod vs.)
  name: string;
  category: string;           // Serbest metin kategori
  price: number;              // Satış fiyatı (perakende)
  purchasePrice?: number;     // Alış fiyatı (maliyet)
  wholesalePrice?: number;    // Toptan fiyat
  stock: number;              // Mevcut stok miktarı
  allowNegativeStock?: boolean; // Açıkken stok 0 olsa da satış yapılır, stok eksiye iner
  criticalStock?: number;     // Kritik stok uyarı sınırı
  unit?: UnitType;            // Ölçü birimi 1 (ana birim)
  unit2?: UnitType;           // Ölçü birimi 2 (paket/koli birimi)
  unit2Qty?: number;          // 1 adet Birim2 kaç Birim1 içeriyor (örn: 1 karopka = 12 adet)
  expiryDate?: string;        // Son kullanma tarihi (YYYY-MM-DD)
  imageType: 'water' | 'cola' | 'pepsi' | 'orange' | 'chips' | 'chocolate' | 'milk' | 'bread' | 'default';
  imageUrl?: string;
  warehouseId?: string;       // Ürünün hangi ambar olduğu
  /** Passiw haryt — sazlamalara görä faktura/sepede ulanylyp bilmeýär. */
  isActive?: boolean;
}

export interface CartItem {
  id: string;
  productId: string;
  sku: string;
  name: string;
  price: number;
  qty: number;
  unit?: UnitType;  // Ölçü birimi
  percent?: number; // +/- % (Eksi: İndirim, Artı: Artırım/Komisyon)
  imageType: Product['imageType'];
  imageUrl?: string;
}

export type PaymentMethod = 'cash' | 'card' | 'credit' | 'split';

export type InvoiceType =
  | 'sales'           // Satış
  | 'purchase'        // Alış
  | 'sales_return'    // İade (müşteriden)
  | 'purchase_return' // Bizden İade (tedarikçiye)
  
  | 'other_in'        // Farklı Giriş
  | 'other_out'       // Farklı Çıkış
  | 'warehouse_move'  // Ammarların Hareketleri
  | 'proforma'
  | 'quotation';

export type CustomerType = 'customer' | 'employee' | 'supplier';

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  type?: CustomerType;
  dueDateDays?: number;
  creditLimit?: number;
  addressNote?: string;
  balance: number;
  /** Passiw müşderi — sazlamalara görä faktura/kassada ulanylyp bilmeýär. */
  isActive?: boolean;
  /** Nagt satuw gadagan — diňe nesiýe/kart bilen. */
  cashSalesBlocked?: boolean;
}

export interface Warehouse {
  id: string;
  name: string;
  code?: string;
  address?: string;
  phone?: string;
  note?: string;
  isDefault?: boolean;
  isActive?: boolean;
  createdAt: string;
}

export interface InvoiceRecord {
  id: string;
  invoiceNo: string;
  invoiceType: InvoiceType;
  customerId: string | null;
  customerName: string;
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  amountDue: number;
  paymentMethod: PaymentMethod;
  cashReceived: number;
  changeDue: number;
  status: 'completed'  | 'voided';
  createdAt: string;
  cashierName: string;
  internalNote?: string;
  currency?: string;             // Walýuta kody (TMT üçin goýulmaýar)
  exchangeRateAtTime?: number;   // Ýazgy pursatyndaky kurs
  amountTmt?: number;            // TMT karşılygy (geçmiş üçin sabit)
  targowId?: string;             // Sargydy getiren targowçy
  regionId?: string;             // Sargydyň etraby
  warehouseId?: string;          // Ammar (garalama üçin saýlanan)
  targetWarehouseId?: string;    // Hedef ammar — diňe "Ammarlar arasyndaky hereket"
  ledgerId?: string;             // Depder (garalama üçin saýlanan)
  draftStatus?: InvoiceDraftStatus;
  createdBy?: string;            // Garalamany döreden ulanyjy
  createdByRole?: string;        // Döredijiniň roly (Targowçy / Administrator)
  device?: string;               // Haýsy enjamdan: Mobil / Merkez
  acceptedBy?: string;           // Kabul eden ulanyjy
  acceptedAt?: string;           // Kabul edilen wagty
  rejectedReason?: string;       // Ret sebäbi

  // ── Pozmak / Ýatyrmak (denetim yzy) ───────────────────────────────────────
  voidedAt?: string;             // Pozulan wagty (ISO)
  voidedBy?: string;             // Pozan ulanyjy

  // ── Nesiýe (veresiýe) ─────────────────────────────────────────────────────
  paidAmount?: number;           // Satuw pursatynda öňünden berlen pul
  remainingDebt?: number;        // Galan bergi (amountDue − paidAmount)
  creditTermDays?: number;       // Nesiýe möhleti (gün)
  dueDate?: string;              // Vade senesi (YYYY-MM-DD)
}

// ── Garalama faktura akymy ──────────────────────────────────────────────────

export type InvoiceDraftStatus = 'pending' | 'accepted' | 'rejected';

// ── Targowy (Saha satyş wekilleri) ──────────────────────────────────────────

export interface TargowRegion {
  id: string;
  name: string;
  createdAt: string;
}

export interface Targow {
  id: string;
  fullName: string;
  phone: string;
  appUserId?: string;            // Ulanyjy modulundaky hasap
  regionIds: string[];           // Berkidilen etraplar
  commissionRate: number;        // Komissiýa göterimi (%)
  monthlyTarget: number;         // Aýlyk meýilnama (TMT)
  isActive: boolean;
  createdAt: string;
}

// ── Kassa (Para Hereketleri) ────────────────────────────────────────────────

export type MoneyTxType = 'income' | 'expense';

export type MoneyPaymentMethod = 'cash' | 'card' | 'transfer';

export type MoneySubCategoryId = 'karende' | 'elektrik' | 'suw' | 'beyleki';

export type MoneyCategoryId =
  // ── Girdeji ───────────────────────────────────────────────────────────────
  | 'hyzmat_toleg'
  | 'weresiye_yygnamak'      // görkezilýän ady: "Algy yygnamak"
  | 'karz_almak'
  | 'karende_girdejisi'
  | 'atiyaclandyrys_tolegi'
  | 'maya_goyum_girdejisi'
  | 'basga_girdeji'
  // ── Çykdajy ───────────────────────────────────────────────────────────────
  | 'dukan_cykdajylary'
  | 'aylyk'
  | 'karz_bermek'
  | 'karz_gaytarmak'
  | 'salgyt_tolegi'
  | 'ulag_cykdajylary'
  | 'mahabat_cykdajylary'
  | 'bejeris_abatlayys'
  | 'enjam_satyn_almak'
  | 'basga_cykdajy'
  // ── Formadan aýrylanlar (diňe köne/awtomatik ýazgylar üçin saklanýar) ────
  | 'haryt_satuw'
  | 'haryt_satyn_almak';

export interface MoneyTransaction {
  id: string;
  type: MoneyTxType;
  date: string;                  // YYYY-MM-DD
  amount: number;
  paymentMethod: MoneyPaymentMethod;
  category: MoneyCategoryId;
  subCategory?: MoneySubCategoryId;
  customerId?: string;           // Müşderi / Üpjün ediji
  personName?: string;           // Karz almak / bermek / gaýtarmak — kişi ady
  staffUserId?: string;          // Aýlyk — Ulanyjy modulundan
  description?: string;
  invoiceId?: string;            // Haryt satuw — faktura salgysy
  currency?: string;             // Walýuta kody (TMT üçin goýulmaýar)
  exchangeRateAtTime?: number;   // Ýazgy pursatyndaky kurs
  amountTmt?: number;            // TMT karşılygy (geçmiş üçin sabit)
  ledgerId?: string;             // Degişli depder (Depder moduly)
  transferGroupId?: string;      // Depderler arasy geçirim baglanyşygy
  createdAt: string;
}

// ── Walýuta (Döviz / Kur) ───────────────────────────────────────────────────

export interface CurrencyRate {
  id: string;
  code: string;                  // USD, EUR, RUB...
  name: string;                  // ABŞ dollary
  symbol: string;                // $, €, ₽
  rate: number;                  // 1 birlik = ? TMT
  createdAt: string;
  updatedAt: string;
}

// ── Depder (Çoklu Kassa / Defter) ───────────────────────────────────────────

export interface LedgerPermission {
  canEnter: boolean;      // Girip bilýär
  canAddIncome: boolean;  // Girdeji goşup bilýär
  canAddExpense: boolean; // Çykdajy goşup bilýär
  canEdit: boolean;       // Redaktirläp bilýär
  canDelete: boolean;     // Pozup bilýär
  canViewReport: boolean; // Hasabat görüp bilýär
}

export type LedgerPermissionKey = keyof LedgerPermission;

export interface Ledger {
  id: string;
  name: string;
  description?: string;
  currency: string;                              // Walýuta kody (TMT esas)
  openingBalance: number;                        // Başlangyç galyndy
  isActive: boolean;
  permissions: Record<string, LedgerPermission>; // appUserId -> rugsatlar
  createdAt: string;
}

// ── Sazlamalar (Ayarlar) ────────────────────────────────────────────────────

export type PrinterKind = 'standard' | 'receipt';
export type PaperWidth = '58mm' | '80mm';
export type PrinterConnection = 'usb' | 'network';
export type ScaleUnit = 'kg' | 'g';
export type BackupFrequency = 'daily' | 'weekly';

export interface PrinterSettings {
  defaultPrinter: string;
  kind: PrinterKind;
  paperWidth: PaperWidth;
  connection: PrinterConnection;
  ipAddress: string;
  port: string;
}

export interface ScaleSettings {
  port: string;
  model: string;
  unit: ScaleUnit;
  autoRead: boolean;
}

export interface ReceiptFieldFlags {
  logo: boolean;
  address: boolean;
  phone: boolean;
  taxId: boolean;
  qr: boolean;
  barcode: boolean;
  cashier: boolean;
  customer: boolean;
}

export type PrintFontScale = 'sm' | 'md' | 'lg';
export type PageOrientation = 'portrait' | 'landscape';
export type QrContent = 'invoice' | 'website' | 'payment';

/** Adaty (A4) çapda haýsy sütünler görkezilsin. */
export interface StandardPrintColumns {
  barcode: boolean;
  unit: boolean;
  unitPrice: boolean;
  discount: boolean;
  subtotal: boolean;
  tax: boolean;
}

/** Adaty (A4) çapda haýsy goşmaça maglumatlar görkezilsin. */
export interface StandardPrintInfo {
  currency: boolean; // Pul birligi (TMT)
  payment: boolean;  // Kassa / töleg usuly
  customer: boolean; // Müşderi ady
  ledger: boolean;   // Depder ady
}

/** Adaty printer (A4) üçin aýratyn sazlamalar. */
export interface StandardPrintSettings {
  orientation: PageOrientation;
  showImages: boolean;
  columns: StandardPrintColumns;
  info: StandardPrintInfo;
  header: boolean;
  pageNumbers: boolean;
  signature: boolean;
  notes: string;
  fontScale: PrintFontScale;
  copies: number;
}

export interface ReceiptSettings {
  // ── Ortak (her iki görnüşde hem ulanylýar) ──────────────────────────────
  logoDataUrl: string;
  companyName: string;
  address: string;
  phone: string;
  taxId: string;
  /** Fiş logosynyň ini (px; 0 = deslapky giňlik). */
  logoWidth?: number;
  /** Fiş logosy ortalaşdyrylsynmy. */
  logoCenter?: boolean;
  // ── Termal çek (58mm / 80mm) ────────────────────────────────────────────
  footerNote: string;
  fields: ReceiptFieldFlags;
  paperWidth: PaperWidth;
  fontScale: PrintFontScale;
  qrContent: QrContent;
  autoPrint: boolean;
  copies: number;
  // ── Adaty çap (A4) ──────────────────────────────────────────────────────
  standard: StandardPrintSettings;
}

/** Firma maglumatlary (sazlamalar → Düzgünler). */
export interface FirmSettings {
  name: string;
  code: string;
  title: string;
  phone: string;
  fax: string;
  address: string;
  taxPercent: number;
}

/** Operasiýa düzgünleri — iş mantygyny dolandyrýar (deslapky: eski gürşüş). */
export interface OperationSettings {
  /** Passiw müşderi faktura/kassada ulanylyp bilinýärmi. */
  allowInactiveCustomer: boolean;
  /** Passiw haryt sepete goşulyp bilinýärmi. */
  allowInactiveProduct: boolean;
  /** Alş bahasynyň aşagyna satylýarmy. */
  allowBelowCostSale: boolean;
  /** Nesiýe möhletiniň iň kiçi bahasy (gün). */
  creditMinDays: number;
  /** Nesiýe möhletiniň iň uly bahasy (gün). */
  creditMaxDays: number;
  /** Nesiýe möhletiniň deslapky bahasy (gün). */
  creditDefaultDays: number;
  /** Operasiýa başlangyç senesi ('' = açyk). */
  operationStartDate: string;
  /** Operasiýa soňky senesi ('' = açyk). */
  operationEndDate: string;
}

/** Barkod okaýjy sazlamalary (prefix/suffix arassalaýjy). */
export interface BarcodeReaderSettings {
  prefix: string;
  suffix: string;
}

export interface GeneralSettings {
  language: LanguageCode;
  dateFormat: string;
  autoBackup: boolean;
  backupFrequency: BackupFrequency;
  backupFolder: string;
  auditLogEnabled: boolean;
  /**
   * Sabit (ana) walyuta kodu — fiyat, fatura ve raporlarda varsayılan.
   * Kullanıcı Walyuta bölümünden değiştirebilir (örn. TMT → USD).
   */
  baseCurrencyCode: string;
  /** Taban walyutanın tam adı (etiketlerde gösterilir). */
  baseCurrencyName: string;
}

export interface AppSettings {
  printer: PrinterSettings;
  scale: ScaleSettings;
  receipt: ReceiptSettings;
  general: GeneralSettings;
  /** Firma maglumatlary. */
  firm: FirmSettings;
  /** Operasiýa düzgünleri (pasif haryt/müşderi, alş bahasy, möhlet, seneler). */
  operations: OperationSettings;
  /** Barkod okaýjy prefix/suffix. */
  barcode: BarcodeReaderSettings;
}

/** Rol ady -> modul rugsatlary (Ulanyjy moduly bilen deň model). */
export type RoleTemplates = Record<string, PermissionsMap>;

export interface SystemPrinter {
  readonly name: string;
  readonly displayName?: string;
  readonly isDefault?: boolean;
  readonly status?: number;
}
