import { FirstRunWizard } from '../FirstRunWizard';
import { useTelemetry } from '../../hooks/useTelemetry';
import { useCatalogActions } from '../../hooks/useCatalogActions';
import { useDraftActions } from '../../hooks/useDraftActions';
import { useInvoiceEffects } from '../../hooks/useInvoiceEffects';
import { useInvoiceActions } from '../../hooks/useInvoiceActions';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { TopNavBar, PosTabType } from './TopNavBar';
import { MobileBottomNav, MobileDrawer, MobileHeader } from '../mobile/MobileShell';
import { MobileInvoiceBar } from '../mobile/MobileInvoiceBar';
import { requestMobileAdd } from '../../utils/mobileEvents';
import { isNative } from '../../utils/platform';
import { InvoiceControlBar } from './InvoiceControlBar';
import { CartTable } from './CartTable';
import { ProductCatalog } from './ProductCatalog';
import { PaymentPanel } from './PaymentPanel';
import { PosFooter } from './PosFooter';
import { WorkspaceRouter } from './WorkspaceRouter';
import { FakturaActionsBar } from './FakturaActionsBar';
import { FakturaMetaSelectors } from './FakturaMetaSelectors';
import { SeneWagtSelector } from './SeneWagtSelector';
import { LedgerSelect } from './LedgerSelect';
import { ShortcutsHelpModal } from './ShortcutsHelpModal';
import { ProductSearchModal } from './ProductSearchModal';
import { CustomerSearchModal } from './CustomerSearchModal';
import { DeletedInvoicesModal } from './DeletedInvoicesModal';
import { DraftPrintModal } from './DraftPrintModal';
import { printInvoice } from '../../utils/receiptHtml';
import { InvoiceListModal } from './InvoiceListModal';
import { CardTerminalPaymentModal } from './CardTerminalPaymentModal';
import { ReceiptModal } from './ReceiptModal';

import {
  Account,
  AppSettings,
  CartItem,
  Customer,
  InvoiceRecord,
  InvoiceType,
  LanguageCode,
  ModuleName,
  PaymentMethod,
  PrinterMode,
  Product,
  ProductCategory,
  User
} from '../../types';
import { ALL_CATEGORIES, filterProducts, saveProductToDb, saveProductsBatchDb, deleteProductFromDb } from '../../db/productService';
import { useAutoConnection } from '../../hooks/useAutoConnection';
import { generateInvoiceNo, getInvoicesForAccount, saveInvoiceToDb } from '../../db/salesService';
import { deleteCustomerFromDb, GENERAL_CUSTOMER_ID, saveCustomerToDb, saveCustomersBatchDb } from '../../db/customerService';
import { getAccountStoreKey, type BatchWriteResult } from '../../db/pouch';
import { resolveModulePermission } from '../../db/ledgerService';
import {
  filterIdList,
  filterItemsById,
  getActiveAccessControl,
  getActiveDefaults,
  isAdminUser,
  resolveModuleExtras,
} from '../../db/accessService';
import { INVOICE_TYPE_OPTIONS } from '../../utils/invoiceTypeOptions';
import { getAllCompositions } from '../../db/compositionService';
import { expandCompositionStock, insufficientCompositionStock } from '../../utils/compositionStock';
import { exportInvoiceStyled } from '../../utils/documentExports';
import { defaultSettings } from '../../db/settingsService';
import { BASE_CURRENCY_CODE } from '../../db/currencyService';
import { pendingDraftCount as countPendingDrafts } from '../../db/draftService';
import { playNotificationPing, readSoundEnabled, writeSoundEnabled } from '../../utils/notify';
import { addDaysIso, todayIso } from '../../utils/paymentLabels';
import { takeCreditReminders, openCreditDebts } from '../../utils/creditReminders';
import { stockValuation } from '../../utils/calcAssets';
import { AlertsPanel } from './AlertsPanel';
import { loadPromos, savePromos, type PromoRecord } from '../../db/promoService';
import { PromoModal } from '../promo/PromoModal';
import { GaralamaListModal } from '../faktura/GaralamaListModal';
import { DraftFormModal } from '../faktura/DraftFormModal';
import { useModuleStores } from '../../hooks/useModuleStores';
import { useMoneyStore, type CustomerAdjustment } from '../../hooks/useMoneyStore';
import { useCartActions, type WorkspaceToast } from '../../hooks/useCartActions';
import { useCustomerPriceActions } from '../../hooks/useCustomerPriceActions';
import { useWorkspaceData } from '../../hooks/useWorkspaceData';
import { translate } from '../../locales/i18n';
import { useT } from '../../locales/LanguageContext';
import { CheckCircle2, FileText, Plus } from 'lucide-react';
import { checkRouteAccess } from '../../utils/gateMiddleware';
import type { LicenseInfo } from '../../types/license';

interface PosWorkspaceProps {
  activeAccount: Account;
  currentUser: User;
  language: LanguageCode;
  printerMode: PrinterMode;
  /** Giriş anında sorgulanan lisans durumu (kalan gün uyarısı için). */
  licenseInfo?: LicenseInfo | null;
  onLogout: () => void;
  onSelectLanguage: (lang: LanguageCode) => void;
  onSelectPrinterMode: (mode: PrinterMode) => void;
  /** Lisans kapısı bir işlemi engellediğinde çağrılır (v3 §5.2). */
  onLicenseRequired?: (blockedRoute?: string) => void;
}

/**
 * Sekme → modul rugsady haritasy. `null` (lisans) — hemişe görünýär.
 * GÖRKEZ rugsady bolmadyk modulyň sekmeleri menýden gizlenýär.
 */
const TAB_MODULE: Record<PosTabType, ModuleName | null> = {
  checkout: 'faktura',
  invoice: 'faktura',
  money: 'kassa',
  customer: 'musteri',
  user: 'ulanyjy',
  product: 'haryt',
  calculation: 'hasaplama',
  currency: 'walyta',
  ledger: 'depder',
  warehouse: 'ambar',
  courier: 'targowy',
  settings: 'sazlamalar',
};

/** Mobil yüzen + butonunun erişilebilirlik etiketi. */
function fabLabel(tab: PosTabType, language: LanguageCode): string {
  switch (tab) {
    case 'product': return translate(language, 'pos.fabAddProduct');
    case 'customer': return translate(language, 'pos.fabAddCustomer');
    case 'money': return translate(language, 'pos.fabAddMoney');
    case 'courier': return translate(language, 'pos.fabAddCourier');
    case 'currency': return translate(language, 'pos.fabAddCurrency');
    default: return translate(language, 'pos.fabAdd');
  }
}

/** Menýdäki sıra boýunça ilkinji rugsatly sekme (login/geçişde ulanylýar). */
const FIRST_TAB_ORDER: PosTabType[] = [
  'checkout',
  'money',
  'customer',
  'user',
  'product',
  'calculation',
  'currency',
  'ledger',
  'warehouse',
  'courier',
  'settings',
];

export const PosWorkspace: React.FC<PosWorkspaceProps> = ({
  activeAccount,
  currentUser,
  language,
  printerMode,
  licenseInfo,
  onLogout,
  onSelectLanguage,
  onSelectPrinterMode,
  onLicenseRequired
}) => {
  const t = useT();

  // Navigation
  const [activeTab, setActiveTab] = useState<PosTabType>('checkout');
  useTelemetry(activeTab);
  // Mobil: çekmece menü + satış içi sekme (sepet / ürünler / ödeme)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [mobilePane, setMobilePane] = useState<'cart' | 'catalog' | 'pay'>('cart');
  const native = isNative();

  // Lisans ekranı artık App tarafından yönetilir (v3 §2: akış tek yerden).

  const storeDb = getAccountStoreKey(activeAccount);

  // CouchDB: son aktif baglantiyi acilista otomatik baslat
  useAutoConnection(activeAccount.id, storeDb);

  // Customer & Barcode
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [completedInvoices, setCompletedInvoices] = useState<InvoiceRecord[]>([]);
  const [isInvoiceListModalOpen, setIsInvoiceListModalOpen] = useState(false);
  /** F9 — silinen fakturalar (diňe administrator). */
  const [isDeletedInvoicesOpen, setIsDeletedInvoicesOpen] = useState(false);
  /** F10 — geri al onam diýalogy. */
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  /** F12 — sepet çap penjiresi. */
  const [isPrintDraftOpen, setIsPrintDraftOpen] = useState(false);
  /** F8 — baha görnüşi: perakende / toptan (lomoy). */
  const [priceMode, setPriceMode] = useState<'retail' | 'wholesale'>('retail');
  // Düzüm (set) harytlaryň bölekleri — satuwda stogy azaltmak üçin.
  const compositionMapRef = useRef<Map<string, { productId: string; qty: number }[]>>(new Map());
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const [promos, setPromos] = useState<PromoRecord[]>(() => loadPromos());
  const [isPromoOpen, setIsPromoOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isProductSearchOpen, setIsProductSearchOpen] = useState(false);
  const [isCustomerSearchOpen, setIsCustomerSearchOpen] = useState(false);
  const [isMoneySearchOpen, setIsMoneySearchOpen] = useState(false);
  const [focusTarget, setFocusTarget] = useState<{ kind: 'product' | 'customer'; id: string } | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [barcodeQuery, setBarcodeQuery] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [globalPercent, setGlobalPercent] = useState<number>(0);
  const [invoiceType, setInvoiceType] = useState<InvoiceType>('sales');
  const [invoiceCode, setInvoiceCode] = useState<string>(() => {
    // Başlangıçta SAT tipi için kod üret
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yy = String(now.getFullYear()).slice(-2);
    const seq = Math.floor(1 + Math.random() * 999);
    return `SAT.${mm}/${yy}-${seq}`;
  });
  const [printCopies, setPrintCopies] = useState<number>(1);

  // Products
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>(ALL_CATEGORIES);
  const [searchQuery, setSearchQuery] = useState('');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const cartCount = cartItems.reduce((sum, item) => sum + item.qty, 0);

  // Modul maglumatlary (Ambar, Ulanyjy, Walýuta, Depder, Targowy) hook içinde ýaşaýar.
  // PosWorkspace olary diňe WorkspaceRouter-a geçirýär, özi ulanmaýar.
  const stores = useModuleStores(storeDb, activeAccount.users);

  // ── Ýörite rugsatlar: giriş eden ulanyjynyň deslapky bahalary we erişim kontroli ──
  const activeAccess = useMemo(
    () => getActiveAccessControl(currentUser, stores.appUsers),
    [currentUser, stores.appUsers]
  );
  const activeDefaults = useMemo(
    () => getActiveDefaults(currentUser, stores.appUsers),
    [currentUser, stores.appUsers]
  );

  // Erişim kontroli boýunça görünýän sanawlar (gizleýär — diňe saýlamany çäklendirmeýär).
  const visibleCustomers = useMemo(() => {
    if (!activeAccess) return customers;
    return filterItemsById(activeAccess.customers, customers) ?? customers;
  }, [activeAccess, customers]);

  const visibleProducts = useMemo(() => {
    if (!activeAccess) return products;
    return filterItemsById(activeAccess.products, products) ?? products;
  }, [activeAccess, products]);

  const PAYMENT_METHOD_IDS: PaymentMethod[] = ['cash', 'card', 'credit', 'split'];
  const visiblePaymentMethods = useMemo(() => {
    if (!activeAccess) return null;
    const filtered = filterIdList(activeAccess.paymentTypes, PAYMENT_METHOD_IDS);
    return filtered as PaymentMethod[];
  }, [activeAccess]);

  const visibleInvoiceTypes = useMemo(() => {
    if (!activeAccess) return null;
    const filtered = filterIdList(
      activeAccess.invoiceTypes,
      INVOICE_TYPE_OPTIONS.map((o) => o.id)
    );
    return filtered as InvoiceType[];
  }, [activeAccess]);

  const visibleWarehousesGeneral = useMemo(() => {
    if (!activeAccess) return stores.warehouses;
    return filterItemsById(activeAccess.warehouses, stores.warehouses) ?? stores.warehouses;
  }, [activeAccess, stores.warehouses]);

  /** Faktura üçin ambar rugsaty: aýratyn `warehousesForInvoice` ýok bolsa umumy ulanylýar. */
  const visibleWarehousesForInvoice = useMemo(() => {
    if (!activeAccess) return stores.warehouses;
    const entry = activeAccess.warehousesForInvoice ?? activeAccess.warehouses;
    return filterItemsById(entry, stores.warehouses) ?? stores.warehouses;
  }, [activeAccess, stores.warehouses]);

  const visibleLedgers = useMemo(() => {
    if (!activeAccess) return stores.ledgers;
    return filterItemsById(activeAccess.depders, stores.ledgers) ?? stores.ledgers;
  }, [activeAccess, stores.ledgers]);

  // ── Operasiýa düzgünleri (sazlamalar → Düzgünler) ─────────────────────────
  const ops = appSettings?.operations;

  // Düzüm (set) kompozisyýalaryny ýükle — satuwda bölek stogy hem azalýar.
  useEffect(() => {
    let cancelled = false;
    void getAllCompositions(storeDb).then((list) => {
      if (cancelled) return;
      compositionMapRef.current = new Map(
        list.map((composition) => [composition.productId, composition.components])
      );
    });
    return () => {
      cancelled = true;
    };
  }, [storeDb]);

  // Passiw müşderi/haryt: düzgüne görä seçimden aýyr (passiw ulanylmaz).
  const selectableCustomers = useMemo(() => {
    if (!ops || ops.allowInactiveCustomer) return visibleCustomers;
    return visibleCustomers.filter((c) => c.isActive !== false);
  }, [ops, visibleCustomers]);

  const selectableProducts = useMemo(() => {
    if (!ops || ops.allowInactiveProduct) return visibleProducts;
    return visibleProducts.filter((p) => p.isActive !== false);
  }, [ops, visibleProducts]);

  // ── Mený rugsady: GÖRKEZ bolmadyk modullaryň sekmeleri gizlenýär ──────────
  const allowedTabs = useMemo(() => {
    const tabs = new Set<PosTabType>();
    for (const key of Object.keys(TAB_MODULE)) {
      const tab = key as PosTabType;
      const module = TAB_MODULE[tab];
      if (module === null || resolveModulePermission(module, currentUser, stores.appUsers).view) {
        tabs.add(tab);
      }
    }
    return tabs;
  }, [currentUser, stores.appUsers]);

  // ── Gate kontrolü: sekme değişiminde lisans kontrolü ──────────────────────
  // Kontrol ana süreçte (IPC) yapılır; bu yüzden async.
  const handleTabChange = async (newTab: PosTabType) => {
    // Tab için gate route adını belirle
    const gateRouteName = tabToGateRoute(newTab);
    if (gateRouteName) {
      const result = await checkRouteAccess(gateRouteName);
      if (!result.allowed) {
        // Üst bileşene bildir → Lisans ekranına geç (v3 §5.2)
        if (onLicenseRequired) {
          onLicenseRequired(gateRouteName);
        }
        return;
      }
    }
    setActiveTab(newTab);
  };

  // Tab → gate route mapping
  const tabToGateRoute = (tab: PosTabType): string | null => {
    const map: Record<PosTabType, string | null> = {
      'checkout': 'checkout',
      'invoice': 'invoice',
      'money': 'money',
      'customer': 'customer',
      'user': 'user',
      'product': 'product',
      'calculation': 'hasaplama',
      'currency': 'currency',
      'ledger': 'ledger',
      'warehouse': 'warehouse',
      'courier': 'courier',
      'settings': 'settings',
    };
    return map[tab] || null;
  };

  // ── Faktura inçe rugsatlary: Bahany üýtget / Arzanladyş ber ───────────────
  const fakturaExtras = useMemo(
    () => resolveModuleExtras(currentUser, stores.appUsers).faktura,
    [currentUser, stores.appUsers]
  );
  const canEditPrice = fakturaExtras.editPrice;
  const canAllowDiscount = fakturaExtras.allowDiscount;

  // Faktura → Poz rugsady (Ulanyjy modulynyň rugsat matrisasyndan).
  const canVoidInvoice = useMemo(
    () => resolveModulePermission('faktura', currentUser, stores.appUsers).delete,
    [currentUser, stores.appUsers]
  );

  // Müşderi → Üýtget (Redaktirle) rugsady — ✏️ ikony şu rugsada bagly.
  const canEditCustomer = useMemo(
    () => resolveModulePermission('musteri', currentUser, stores.appUsers).edit,
    [currentUser, stores.appUsers]
  );

  useWorkspaceData({
    storeDb, currentUserId: currentUser?.id, setProducts, setCustomers,
    setCompletedInvoices, setAppSettings, setCartItems, setSelectedCustomer,
  });

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [cashReceived, setCashReceived] = useState<number>(0);

  // Nesiýe (veresiýe) — öňünden berlen pul we möhlet
  const [creditAdvance, setCreditAdvance] = useState<number>(0);
  const [creditTermDays, setCreditTermDays] = useState<number>(30);

  /**
   * Nesiýe satuw üçin bergi meýdanlaryny hasaplaýar.
   * Galan bergi = jemi tutar − öňünden berlen pul.
   */

  const [toastMessage, setToastMessage] = useState<WorkspaceToast | null>(null);

  // Bank POS Terminal & Otomatik Çek Modalleri
  const [isPosTerminalModalOpen, setIsPosTerminalModalOpen] = useState(false);
  const [activeReceiptInvoice, setActiveReceiptInvoice] = useState<InvoiceRecord | null>(null);
  const [lastAuthCode, setLastAuthCode] = useState<string>('');

  // Garalama faktura modallary
  const [isGaralamaOpen, setIsGaralamaOpen] = useState(false);
  const [isDraftFormOpen, setIsDraftFormOpen] = useState(false);

  // Faktura ekranyna açylan garalama (üzerinde düzedip bolýar)
  const [loadedDraftId, setLoadedDraftId] = useState<string | null>(null);

  // Bildirim sesi — ulanyjy boýunça ýatda saklanýar
  const [soundEnabled, setSoundEnabled] = useState(() => readSoundEnabled(currentUser.id));
  useEffect(() => {
    writeSoundEnabled(currentUser.id, soundEnabled);
  }, [currentUser.id, soundEnabled]);

  // Garalama üçin saýlanan Ammar / 2-nji Ammar / Depder
  const [draftWarehouseId, setDraftWarehouseId] = useState('');
  const [draftTargetWarehouseId, setDraftTargetWarehouseId] = useState('');
  const [draftLedgerId, setDraftLedgerId] = useState('');
  /** null → häzirki wagt; baha → el bilen saýlanan faktura senesi/wagty. */
  const [fixedInvoiceAt, setFixedInvoiceAt] = useState<Date | null>(null);

  useEffect(() => {
    if (draftWarehouseId || visibleWarehousesForInvoice.length === 0) return;
    // Ulanyjynyň "Başdaky ambar" bahasy ilkinji — ýok bolsa ulgamy deslapky.
    const preferred = activeDefaults?.warehouseId
      ? visibleWarehousesForInvoice.find((w) => w.id === activeDefaults.warehouseId)
      : undefined;
    const systemDefault =
      visibleWarehousesForInvoice.find((w) => w.isDefault) ?? visibleWarehousesForInvoice[0];
    setDraftWarehouseId((preferred ?? systemDefault)?.id ?? '');
  }, [visibleWarehousesForInvoice, draftWarehouseId, activeDefaults]);

  useEffect(() => {
    if (draftTargetWarehouseId || visibleWarehousesForInvoice.length < 2) return;
    // 2-nji ammar üçin esasy ammardan başga birini saýla
    const source = draftWarehouseId || visibleWarehousesForInvoice[0].id;
    const other = visibleWarehousesForInvoice.find((w) => w.id !== source);
    if (other) setDraftTargetWarehouseId(other.id);
  }, [visibleWarehousesForInvoice, draftWarehouseId, draftTargetWarehouseId]);

  useEffect(() => {
    if (draftLedgerId || visibleLedgers.length === 0) return;
    // Ulanyjynyň "Başdaky depder" bahasy ilkinji — ýok bolsa ilkinji depder.
    const preferred = activeDefaults?.depderId
      ? visibleLedgers.find((l) => l.id === activeDefaults.depderId)
      : undefined;
    setDraftLedgerId((preferred ?? visibleLedgers[0])?.id ?? '');
  }, [visibleLedgers, draftLedgerId, activeDefaults]);

  // ── Deslapky bahalary ulan (faktura görnüşi, töleg, müşderi) ────────────────
  useEffect(() => {
    if (!activeDefaults) return;
    const d = activeDefaults;
    if (d.invoiceType && (!visibleInvoiceTypes || visibleInvoiceTypes.includes(d.invoiceType))) {
      setInvoiceType(d.invoiceType as InvoiceType);
    }
    if (d.paymentType && (!visiblePaymentMethods || visiblePaymentMethods.includes(d.paymentType))) {
      setPaymentMethod(d.paymentType as PaymentMethod);
    }
    if (d.customerId) {
      const found = visibleCustomers.find((c) => c.id === d.customerId);
      if (found) setSelectedCustomer(found);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDefaults]);

  // ── Erişim korumasy: rugsat bolmadyk baha düşürse, deslapky/ilkinji rugsatly baha geç ──
  useEffect(() => {
    if (!activeAccess || !visibleInvoiceTypes) return;
    if (!visibleInvoiceTypes.includes(invoiceType)) {
      setInvoiceType((visibleInvoiceTypes[0] ?? 'sales') as InvoiceType);
    }
  }, [activeAccess, visibleInvoiceTypes, invoiceType]);

  useEffect(() => {
    if (!activeAccess || !visiblePaymentMethods) return;
    if (!visiblePaymentMethods.includes(paymentMethod)) {
      setPaymentMethod((visiblePaymentMethods[0] ?? 'cash') as PaymentMethod);
    }
  }, [activeAccess, visiblePaymentMethods, paymentMethod]);

  useEffect(() => {
    if (!activeAccess || !selectedCustomer) return;
    if (!visibleCustomers.some((c) => c.id === selectedCustomer.id)) {
      const general =
        visibleCustomers.find((c) => c.id === GENERAL_CUSTOMER_ID) ?? visibleCustomers[0];
      setSelectedCustomer(general ?? null);
    }
  }, [activeAccess, visibleCustomers, selectedCustomer]);

  // Passiw müşderi: düzgün "ulanylmaz" diýse we saýlanan müşderi passiw bolsa — umumy müşderä geç.
  useEffect(() => {
    if (!ops || ops.allowInactiveCustomer) return;
    if (selectedCustomer && selectedCustomer.isActive === false) {
      const general = selectableCustomers.find((c) => c.id === GENERAL_CUSTOMER_ID) ?? null;
      setSelectedCustomer(general);
    }
  }, [ops, selectableCustomers, selectedCustomer]);

  useEffect(() => {
    if (!activeAccess) return;
    if (draftWarehouseId && !visibleWarehousesForInvoice.some((w) => w.id === draftWarehouseId)) {
      setDraftWarehouseId(visibleWarehousesForInvoice[0]?.id ?? '');
    }
  }, [activeAccess, visibleWarehousesForInvoice, draftWarehouseId]);

  useEffect(() => {
    if (!activeAccess) return;
    if (draftLedgerId && !visibleLedgers.some((l) => l.id === draftLedgerId)) {
      setDraftLedgerId(visibleLedgers[0]?.id ?? '');
    }
  }, [activeAccess, visibleLedgers, draftLedgerId]);

  // ── Mený guardy: GÖRKEZ bolmadyk sekme saýlanılsa ilkinji rugsatly sekme + "Rugsat ýok" ──
  useEffect(() => {
    if (allowedTabs.has(activeTab)) return;
    const first = FIRST_TAB_ORDER.find((tab) => allowedTabs.has(tab));
    handleTabChange(first ?? 'checkout');
    setToastMessage({
      type: 'info',
      text: t('pos.noPermission'),
    });
    setTimeout(() => setToastMessage(null), 3000);
  }, [allowedTabs, activeTab, t]);

  // Filtered Products (ýörite rugsatlar + passiw haryt düzgüni boýunça)
  const filteredProducts = useMemo(() => {
    return filterProducts(selectableProducts, selectedCategory, searchQuery);
  }, [selectableProducts, selectedCategory, searchQuery]);

  // Calculated Totals (Including +/- % Calculation)
  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      const pct = item.percent || 0;
      const factor = 1 + (pct / 100);
      return sum + Math.max(0, item.price * item.qty * factor);
    }, 0);
  }, [cartItems]);

  const discountTotal = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      const pct = item.percent || 0;
      if (pct < 0) {
        return sum + Math.abs(item.price * item.qty * (pct / 100));
      }
      return sum;
    }, 0);
  }, [cartItems]);

  const amountDue = subtotal;

  const {
    handleAddToCart, handleUpdateQty, handleSetQty, handleUpdatePrice,
    handleUpdatePercent, handleUpdateUnit, handleApplyGlobalPercent,
    handleRemoveItem, cartBasePriceOf,
  } = useCartActions({
    products, cartItems, setCartItems, priceMode, globalPercent, setGlobalPercent,
    ops, fakturaExtras, setToastMessage,
  });

  // ── F10: geri al — häzirki ekrandaky üýtgeşmeleri arassala ────────────────
  const handleResetCheckout = () => {
    setCartItems([]);
    setSelectedCustomer(
      selectableCustomers.find((c) => c.id === GENERAL_CUSTOMER_ID) ?? null
    );
    setBarcodeQuery('');
    setInternalNote('');
    setGlobalPercent(0);
    setCashReceived(0);
    setCreditAdvance(0);
    setCreditTermDays(ops?.creditDefaultDays ?? 90);
    setPaymentMethod('cash');
    setPriceMode('retail');
    setInvoiceType('sales');
    setIsResetConfirmOpen(false);
    setToastMessage({
      type: 'info',
      text: t('pos.resetDone'),
    });
    setTimeout(() => setToastMessage(null), 3000);
  };

  // ── F11: häzirki sepedi Excel (.xlsx) faýlyna eksport et ──────────────────
  // ── F11: Excel eksport — açyk faktura bar bolsa O FAKTURA, ýogsam sepet ──
  const handleExportInvoiceExcel = async () => {
    // F4-den açylan faktura bar bolsa — şony eksport et (F11 = o faktura).
    const openInvoice = activeReceiptInvoiceRef.current;
    const source: readonly CartItem[] = openInvoice ? openInvoice.items : cartItems;
    const codeLabel = openInvoice ? openInvoice.invoiceNo : invoiceCode;
    if (source.length === 0) {
      setToastMessage({
        type: 'info',
        text: t('pos.cartEmptyExport'),
      });
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    try {
      const safeCode = (codeLabel || 'FAKTURA').replace(/[^\w.-]+/g, '_');
      const saved = await exportInvoiceStyled({
        items: source,
        invoiceCode: codeLabel,
        total: openInvoice ? openInvoice.amountDue : subtotal,
        accountName: activeAccount.name,
        fileName: `${safeCode}-${todayIso()}.xlsx`,
        dialogTitle: t('pos.exportDialogTitle'),
      });
      setToastMessage({
        type: saved ? 'success' : 'info',
        text: saved
          ? t('pos.excelExported')
          : t('pos.exportCancelled'),
      });
      setTimeout(() => setToastMessage(null), 3500);
    } catch {
      setToastMessage({ type: 'info', text: t('pos.exportFailed') });
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  // Barcode / Add Button Handler (diňe erişim rugsady bolan harytlardan gözleýär)
  const handleBarcodeAdd = () => {
    if (!barcodeQuery.trim()) return;
    // Barkod okaýjy prefix/suffix belgilerini arassala (sazlamalar → Düzgünler).
    let raw = barcodeQuery.trim();
    const prefix = appSettings?.barcode?.prefix ?? '';
    const suffix = appSettings?.barcode?.suffix ?? '';
    if (prefix && raw.startsWith(prefix)) raw = raw.slice(prefix.length);
    if (suffix && raw.endsWith(suffix)) raw = raw.slice(0, raw.length - suffix.length);
    const query = raw.trim().toLowerCase();
    if (!query) return;
    const found = selectableProducts.find(
      (p) =>
        p.barcode.toLowerCase() === query ||
        p.sku.toLowerCase() === query ||
        (p.extraBarcodes || []).some((code) => code.toLowerCase() === query) ||
        p.name.toLowerCase().includes(query)
    );

    if (found) {
      handleAddToCart(found);
      setBarcodeQuery('');
    } else {
      setToastMessage({ type: 'info', text: translate(language, 'productNotFoundToast', { code: barcodeQuery }) });
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const { handleSaveCustomerPrices, handleApplyCustomerPrices } = useCustomerPriceActions({
    storeDb, selectedCustomer, cartItems, setCartItems, cartBasePriceOf, setToastMessage,
  });

  // ── F12: çap — açyk faktura bar bolsa O FAKTURA, ýogsam sepedäki çap ──────
  const handlePrintActive = async () => {
    const openInvoice = activeReceiptInvoiceRef.current;
    if (!openInvoice) {
      // Açyk faktura ýok — meýdançadaky sebedi çap penjiresi.
      setIsPrintDraftOpen(true);
      return;
    }
    if (!receiptSettings) {
      window.print();
      return;
    }
    const result = await printInvoice(
      openInvoice,
      receiptSettings,
      printerMode,
      activeAccount.name,
      language,
      lastAuthCode,
      activeLedgerName
    );
    if (!result.success) {
      setToastMessage({
        type: 'info',
        text: t('pos.printFailed', { reason: result.failureReason || t('pos.unknownError') }),
      });
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  // ── F10 onam diýalogy: Enter = geri al, Escape = ýatyr ───────────────────
  useEffect(() => {
    if (!isResetConfirmOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsResetConfirmOpen(false);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleResetCheckout();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isResetConfirmOpen, language]);

  // Ödeme Yöntemi Değiştirildiğinde (Karta seçilirse Logo gibi Terminali Tetikle)
  const handleSelectPaymentMethod = (method: PaymentMethod) => {
    setPaymentMethod(method);
    if (method === 'card' && amountDue > 0 && cartItems.length > 0) {
      setIsPosTerminalModalOpen(true);
    }
  };

  // ── Stok Güncelleme Yardımcısı ───────────────────────────────────
  // Satış → stok azalır | Alış → stok artar | İade ters yönde
  // Düzümli (set) haryt satylanda onuň bölekleriniň stogy hem azalýar.
  const { applyStockChanges, applyCustomerBalance } = useInvoiceEffects({ compositionMapRef, products, setProducts, storeDb, customers, setCustomers, setSelectedCustomer });



  // POS Terminal Kart Ödemesi Onaylandı (Logo POS Otomatik Çek Akışı)
  const { creditFields, handleCardPaymentApproved, handleCompleteSale } = useInvoiceActions({ paymentMethod, creditAdvance, ops, creditTermDays, setIsPosTerminalModalOpen, setLastAuthCode, invoiceType, selectedCustomer, cartItems, subtotal, discountTotal, amountDue, fixedInvoiceAt, currentUser, internalNote, storeDb, setCompletedInvoices, applyStockChanges, applyCustomerBalance, setActiveReceiptInvoice, setToastMessage, setCartItems, setCashReceived, setInternalNote, setGlobalPercent, compositionMapRef, products, loadedDraftId, acceptLoadedDraft: (...args) => acceptLoadedDraft(...args), cashReceived, setCreditAdvance });

  // Standart Nakit / Satışı Tamamla


  // Çap sazlamalary — settings ýok bolsa deslapky bahalar.
  const receiptSettings = useMemo(
    () => (appSettings ?? defaultSettings(language, activeAccount.name)).receipt,
    [appSettings, language, activeAccount.name]
  );

  // Gysgaltma düwmeleri hemişe iň soňky ýagdaýy görmeli. `handleCompleteSale` her
  // renderda täze döredilýär, effect bolsa diňe `[activeTab]` üýtgünde täzelenýär.
  // Stale-closure ýazganda F5 kona, boş sepetli ýagdaýy çagyryp satşy yzyna galýardy.
  // Ref her renderdan soň täzelenýär, şoňa görä basylandan dessine nokatyzly başlaýar.
  const completeSaleRef = useRef(handleCompleteSale);
  const modalOpenRef = useRef(false);
  const saleBusyRef = useRef(false);
  /** Administrator mı? (F9 silinen fakturalar diňe şolara). */
  const adminRef = useRef(false);
  /** F11 — Excel eksporty (häzirki sepet). */
  const exportInvoiceExcelRef = useRef<() => void>(() => undefined);
  /** F12 — Çap penjiresini açýar (häzirki sepet). */
  const printCartDraftRef = useRef<() => void>(() => undefined);
  /** F6 — ozel bahalary saýlanan müşdere sakla. */
  const saveCustomerPricesRef = useRef<() => void>(() => undefined);
  /** F7 — saýlanan müşderiniň ozel bahalaryny ulan. */
  const applyCustomerPricesRef = useRef<() => void>(() => undefined);
  /** F10 — geri al onam diýalogy (täze ýagdaý — stale closure bolmaz). */
  const resetCheckoutRef = useRef<() => void>(() => undefined);
  /** F11/F12 — açyk faktura (F4-den iki gezet basylanda açylan çek). */
  const activeReceiptInvoiceRef = useRef<InvoiceRecord | null>(null);
  useEffect(() => {
    completeSaleRef.current = handleCompleteSale;
    modalOpenRef.current =
      isGaralamaOpen ||
      isDraftFormOpen ||
      isPosTerminalModalOpen ||
      isInvoiceListModalOpen ||
      isDeletedInvoicesOpen ||
      isPrintDraftOpen ||
      isResetConfirmOpen ||
      activeReceiptInvoice !== null;
    adminRef.current = isAdminUser(currentUser, stores.appUsers);
    exportInvoiceExcelRef.current = () => void handleExportInvoiceExcel();
    printCartDraftRef.current = () => void handlePrintActive();
    activeReceiptInvoiceRef.current = activeReceiptInvoice;
    saveCustomerPricesRef.current = () => void handleSaveCustomerPrices();
    applyCustomerPricesRef.current = () => void handleApplyCustomerPrices();
    // F10: her basylanda HAZIRKY ýagdaýy okalmaly — state-i gönüden-göni
    // okamak stale closure berýär (sepet dolmady görüniip, F10 öňki ýaly durýar).
    resetCheckoutRef.current = () => {
      if (cartItems.length === 0 && !selectedCustomer && !barcodeQuery.trim()) {
        setToastMessage({
          type: 'info',
          text: t('pos.nothingToReset'),
        });
        setTimeout(() => setToastMessage(null), 3000);
        return;
      }
      setIsResetConfirmOpen(true);
    };
  });

  // Klawiatura gysgaltmalary: F1 — haryt gözlegi, F2 — müşderi gözlegi,
  // F3 — kassa gözlegi, F4 — fakturalaryň sanawy, F5 — göni satuw.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        if (activeTab === 'checkout') setIsProductSearchOpen(true);
        return;
      }
      if (e.key === 'F2') {
        e.preventDefault();
        if (activeTab === 'checkout') setIsCustomerSearchOpen(true);
        return;
      }
      if (e.key === 'F3') {
        e.preventDefault();
        if (activeTab === 'money') setIsMoneySearchOpen(true);
        return;
      }
      if (e.key === 'F4') {
        e.preventDefault();
        setIsInvoiceListModalOpen(true);
        return;
      }
      if (e.key === 'F5') {
        e.preventDefault();
        if (activeTab !== 'checkout') return;
        // Modal açyk bolsa ýa-da öňki satuş ýazylyp durka, gaýtalanmaň.
        if (modalOpenRef.current || saleBusyRef.current) return;
        saleBusyRef.current = true;
        void completeSaleRef.current().finally(() => {
          saleBusyRef.current = false;
        });
        return;
      }
      // ── F6 — ozel bahalary saýlanan müşdere sakla ─────────────────────────
      if (e.key === 'F6') {
        e.preventDefault();
        if (activeTab !== 'checkout') return;
        saveCustomerPricesRef.current();
        return;
      }
      // ── F7 — saýlanan müşderiniň ozel bahalaryny ulan ─────────────────────
      if (e.key === 'F7') {
        e.preventDefault();
        if (activeTab !== 'checkout') return;
        applyCustomerPricesRef.current();
        return;
      }
      // ── F8 — toptan/perakende baha üýtgeşmesi ─────────────────────────────
      if (e.key === 'F8') {
        e.preventDefault();
        if (activeTab !== 'checkout') return;
        setPriceMode((prev) => (prev === 'wholesale' ? 'retail' : 'wholesale'));
        return;
      }
      // ── F9 — silinen fakturalar (diňe administrator) ──────────────────────
      if (e.key === 'F9') {
        e.preventDefault();
        if (activeTab !== 'checkout') return;
        if (!adminRef.current) {
          setToastMessage({ type: 'info', text: t('pos.noPermission') });
          setTimeout(() => setToastMessage(null), 3000);
          return;
        }
        setIsDeletedInvoicesOpen(true);
        return;
      }
      // ── F10 — geri al (häzirki üýtgeşmeleri arassala) ─────────────────────
      if (e.key === 'F10') {
        e.preventDefault();
        if (activeTab !== 'checkout') return;
        resetCheckoutRef.current();
        return;
      }
      // ── F11 — Excel eksporty (açyk faktura bar bolsa O FAKTURA) ───────────
      if (e.key === 'F11') {
        e.preventDefault();
        if (activeTab !== 'checkout' && !activeReceiptInvoiceRef.current) return;
        exportInvoiceExcelRef.current();
        return;
      }
      // ── F12 — çap (açyk faktura bar bolsa O FAKTURA) ──────────────────────
      if (e.key === 'F12') {
        e.preventDefault();
        if (activeTab !== 'checkout' && !activeReceiptInvoiceRef.current) return;
        printCartDraftRef.current();
        return;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab]);

  // ── Şift açar sözi: ýeke özi basylyp goýberlende barkod meýdançasyna geçýär ──
  // Diňe Faktura (checkout) ekranynda we hiç hili modal açyk däl wagty işleýär.
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const shiftAloneRef = useRef(false);
  const isAnyModalOpen =
    isGaralamaOpen ||
    isDraftFormOpen ||
    isPosTerminalModalOpen ||
    isInvoiceListModalOpen ||
    activeReceiptInvoice !== null;

  useEffect(() => {
    const handleShiftDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        shiftAloneRef.current = true;
      } else if (shiftAloneRef.current) {
        // Şift basylyp durka başga düwme basyldy (seýleme / uly harp) — ýasama.
        shiftAloneRef.current = false;
      }
    };

    const handleShiftUp = (e: KeyboardEvent) => {
      if (e.key !== 'Shift') return;
      const wasAlone = shiftAloneRef.current;
      shiftAloneRef.current = false;
      if (!wasAlone) return;
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      if (activeTab !== 'checkout') return;
      if (isAnyModalOpen) return;
      barcodeInputRef.current?.focus();
    };

    window.addEventListener('keydown', handleShiftDown);
    window.addEventListener('keyup', handleShiftUp);
    return () => {
      window.removeEventListener('keydown', handleShiftDown);
      window.removeEventListener('keyup', handleShiftUp);
    };
  }, [activeTab, isAnyModalOpen]);

  // ── Product CRUD Handlers ────────────────────────────────────────
  const { handleAddProduct, handleUpdateProduct, handleDeleteProduct, handleImportProducts, handleImportCustomers, handleAddCustomer, handleUpdateCustomer, handleDeleteCustomer, applyCustomerDeltas, handleQuickAddCustomer } = useCatalogActions({ setProducts, storeDb, setCustomers, setSelectedCustomer, setToastMessage, selectedCustomer, customers });





  // ── Excel import: toplu ýazgy — ähli harytlar BIR batch-de ýazylýar. ──
  // Şowsuz galanlar UI-a goşulmaýar; setir belgisi + sebäp bilen hasaba alnyp
  // import modalyna gaýdýar (ýalňyşlyk ýutulmaýar).


  // ── Excel import: toplu ýazgy — ähli müşderiler BIR batch-de ýazylýar. ──








// ─ Kassa (Para Hereketleri) Handlers ────────────────────────────
  // Müşderi balansyny bir snapşot üstünde bitewüleşdirip ulanýarys —
  // hereket goşulanda hem-de öňki hereket üýtgedilende dogry hasaplansyn.
  // (Ambar / Ulanyjy CRUD-y useModuleStores hook-ynda ýaşaýar.)


  // Para hereketleri (Kassa + Depder geçirimleri) hook içinde ýaşaýar;
  // müşderi balansyny üýtgedýänligi üçin applyCustomerDeltas-a bagly.
  const moneyStore = useMoneyStore(storeDb, applyCustomerDeltas);
  const moneyTransactions = moneyStore.moneyTransactions;



  // Beýleki modullarda (Faktura / Kassa) ulanylýan walýuta kodlary.
  const inUseCurrencyCodes = useMemo(() => {
    const codes = new Set<string>();
    for (const invoice of completedInvoices) {
      if (invoice.currency) codes.add(invoice.currency);
    }
    for (const transaction of moneyTransactions) {
      if (transaction.currency) codes.add(transaction.currency);
    }
    return Array.from(codes);
  }, [completedInvoices, moneyTransactions]);

  // ── Duýduryşlar: kritik stok + möhleti ýakyn nesiýe bergileri ─────
  // Haryt/Hasaplama bilen AÝNY selektorlary ulanýar (DRY):
  //   stockValuation().critical  → kritik/negatiw stok
  //   openCreditDebts()          → nesiýe bergi (möhleti geçenler hem)
  const alerts = useMemo(() => {
    const criticalStock = stockValuation(products).critical;
    const dueCredits = openCreditDebts(completedInvoices)
      .filter((row) => row.daysLeft <= 7)
      .sort((a, b) => a.daysLeft - b.daysLeft);
    return { criticalStock, dueCredits, total: criticalStock.length + dueCredits.length };
  }, [products, completedInvoices]);

  const handleSelectProductAlert = (productId: string) => {
    setFocusTarget({ kind: 'product', id: productId });
    handleTabChange('product');
    setIsAlertsOpen(false);
  };

  const handleSelectCustomerAlert = (customerId: string) => {
    setFocusTarget({ kind: 'customer', id: customerId });
    handleTabChange('customer');
    setIsAlertsOpen(false);
  };

  // Açyk çekdäki fakturanyň depder ady (A4 çapda görkezilip bilner).
  const activeLedgerName = useMemo(() => {
    const id = activeReceiptInvoice?.ledgerId;
    if (!id) return undefined;
    return stores.ledgers.find((ledger) => ledger.id === id)?.name;
  }, [activeReceiptInvoice, stores.ledgers]);

  // ── PROMO moduly ───────────────────────────────────────────────────
  const handleSavePromo = (promo: PromoRecord) => {
    setPromos((prev) => {
      const next = prev.some((item) => item.id === promo.id)
        ? prev.map((item) => (item.id === promo.id ? promo : item))
        : [promo, ...prev];
      savePromos(next);
      return next;
    });
  };

  const handleDeletePromo = (id: string) => {
    setPromos((prev) => {
      const next = prev.filter((item) => item.id !== id);
      savePromos(next);
      return next;
    });
  };

  // ─ Garalama faktura akymy ───────────────────────────────────────
  // Garalama döredilende HİÇ bir modul täsirlenmeýär; diňe merkez
  // "Kabul et" diýende stok / bergi / istatistika şol pursat täzelenýär.
  const { upsertInvoice, handleVoidInvoice, handleCreateDraft, handleSaveDraftFromCart, applyAcceptedDraft, handleAcceptDraft, handleOpenDraft, clearLoadedDraft, acceptLoadedDraft, handleRejectDraft } = useDraftActions({ setCompletedInvoices, storeDb, applyStockChanges, applyCustomerBalance, moneyTransactions, moneyStore, currentUser, setToastMessage, setIsDraftFormOpen, setIsGaralamaOpen, cartItems, loadedDraftId, completedInvoices, invoiceType, selectedCustomer, subtotal, discountTotal, amountDue, paymentMethod, creditAdvance, internalNote, creditFields, draftWarehouseId, draftTargetWarehouseId, draftLedgerId, setLoadedDraftId, setCartItems, setCashReceived, setInternalNote, setGlobalPercent, setSelectedCustomer, customers, setInvoiceType, setPaymentMethod, setInvoiceCode, setDraftWarehouseId, setDraftLedgerId, handleTabChange });

  /**
   * Fakturany pozýar ("Ýatyryldy"). Öň döreden ähli täsirleriň tersini ýerine
   * ýetirýär: ammar stoky, müşderi bergisi we Kassa/Depder ýazgylary.
   * Ähli üýtgeşmeler bir pursatda (sinhron) goýulýar — ýarym ýagdaý bolmaýar.
   */




  // "Faktura ýazga al": sepetdäki faktura (harytlar + görnüşi + Ammar + Depder)
  // GARALAMA hökmünde ýazylýar — merkez kabul edýänçä hiç bir modula täsir etmeýär.
  //
  // Ekranda öň açylan garalama bar bolsa (loadedDraftId), TÄZE ýazgy döredilmeýär —
  // şol bir `id` bilen üstüne ýazylýar (çoýulma bolmaýar).


  /** Kabul edilen garalamany modullara geçirýär: stok, müşderi bergisi, depder. */




  /** Garalamany esasy Faktura ekranynda doly açýar — üstünde düzedip bolýar. */




  /** Açylan garalamany sebetdäki häzirki üýtgeşmeler bilen tassyklaýar. */




  const pendingDraftCount = useMemo(
    () => countPendingDrafts(completedInvoices),
    [completedInvoices]
  );

  // ─ Beýleki ulanyjylardan gelen garalamalar: rozet + sesli bildirim ─
  // (CouchDB sync ýa-da başga enjam arkaly düşen täze garalamalar)
  const knownDraftIdsRef = useRef<Set<string> | null>(null);

  useEffect(() => {
    const timer = window.setInterval(async () => {
      const fresh = await getInvoicesForAccount(storeDb);
      const pending = fresh.filter((invoice) => invoice.draftStatus === 'pending');

      const known = knownDraftIdsRef.current;
      if (known === null) {
        knownDraftIdsRef.current = new Set(pending.map((invoice) => invoice.id));
        setCompletedInvoices(fresh);
        return;
      }

      const incoming = pending.filter(
        (invoice) => !known.has(invoice.id) && invoice.createdBy !== currentUser.name
      );
      for (const invoice of pending) known.add(invoice.id);

      if (incoming.length > 0) {
        if (soundEnabled) playNotificationPing();
        setToastMessage({
          type: 'info',
          text: `${incoming.length} täze garalama faktura geldi`,
        });
        setTimeout(() => setToastMessage(null), 4000);
      }

      setCompletedInvoices(fresh);
    }, 15000);

    return () => window.clearInterval(timer);
  }, [storeDb, currentUser.name, soundEnabled]);

  // ─ Nesiýe möhleti hatyrlatmalary (günde bir gezek) ──────────────
  useEffect(() => {
    const reminders = takeCreditReminders(completedInvoices);
    if (reminders.length === 0) return;
    if (soundEnabled) playNotificationPing();
    setToastMessage({
      type: 'info',
      text:
        reminders.length === 1
          ? reminders[0].message
          : `${reminders.length} nesiýe bergisi barada hatyrlatma bar`,
    });
    setTimeout(() => setToastMessage(null), 6000);
  }, [completedInvoices, soundEnabled]);

  return (
    <div className={`w-full h-screen bg-[#F1F5F9] flex flex-col justify-between overflow-hidden select-none font-sans ${native ? 'bh-touch' : ''}`}>
      {/* 1. Üst Navigasyon: telefonda mobil başlık, PC'de sekmeler */}
      {native ? (
        <MobileHeader
          companyName={activeAccount.name}
          alertCount={alerts.total}
          onOpenMenu={() => setIsDrawerOpen(true)}
          onOpenAlerts={() => setIsAlertsOpen(true)}
        />
      ) : (
        <TopNavBar
          activeTab={activeTab}
          language={language}
          onSelectTab={handleTabChange}
          onLogout={onLogout}
          onSwitchAccount={onLogout}
          allowedTabs={allowedTabs}
        />
      )}

      {/* 2. Ana Çalışma Alanı */}
      {activeTab === 'checkout' ? (
        native ? (
          /* === MOBİL SATIŞ: sekmeli (sepet / ürünler / ödeme) === */
          <main className="flex-1 flex flex-col overflow-hidden min-h-0">
            <div className="flex-shrink-0 px-3 pt-2">
              <div className="grid grid-cols-3 gap-1 p-1 bg-white border border-gray-200 rounded-2xl shadow-sm">
                {(
                  [
                    { id: 'cart', label: t('pos.paneCart'), badge: cartCount > 0 ? String(cartCount) : '' },
                    { id: 'catalog', label: t('tabHaryt'), badge: '' },
                    { id: 'pay', label: t('pos.panePay'), badge: amountDue > 0 ? amountDue.toFixed(0) : '' },
                  ] as const
                ).map((pane) => (
                  <button
                    key={pane.id}
                    type="button"
                    onClick={() => setMobilePane(pane.id)}
                    className={`py-2.5 rounded-xl text-sm font-bold transition-all ${
                      mobilePane === pane.id ? 'bg-emerald-500 text-white shadow' : 'text-gray-600 active:bg-gray-100'
                    }`}
                  >
                    {pane.label}
                    {pane.badge ? ` (${pane.badge})` : ''}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 min-h-0">
              {mobilePane === 'cart' && (
                <div className="flex flex-col gap-2 min-h-full">
                  <MobileInvoiceBar
                    selectedCustomer={selectedCustomer}
                    barcodeQuery={barcodeQuery}
                    invoiceType={invoiceType}
                    invoiceCode={invoiceCode}
                    language={language}
                    customers={visibleCustomers}
                    allowedInvoiceTypes={visibleInvoiceTypes}
                    onCustomerChange={setSelectedCustomer}
                    onBarcodeChange={setBarcodeQuery}
                    onInvoiceTypeChange={setInvoiceType}
                    onInvoiceCodeChange={setInvoiceCode}
                    printCopies={printCopies}
                    onPrintCopiesChange={setPrintCopies}
                    onAddProduct={handleBarcodeAdd}
                    barcodeInputRef={barcodeInputRef}
                    promoCount={promos.length}
                    onOpenPromo={() => setIsPromoOpen(true)}
                    onOpenCustomerSearch={() => setIsCustomerSearchOpen(true)}
                  />
                  <CartTable
                    items={cartItems}
                    subtotal={subtotal}
                    internalNote={internalNote}
                    globalPercent={globalPercent}
                    language={language}
                    units={stores.units}
                    canEditPrice={canEditPrice}
                    canAllowDiscount={canAllowDiscount}
                    onUpdateQty={handleUpdateQty}
                    onSetQty={handleSetQty}
                    onUpdatePrice={handleUpdatePrice}
                    onUpdatePercent={handleUpdatePercent}
                    onUpdateUnit={handleUpdateUnit}
                    onApplyGlobalPercent={handleApplyGlobalPercent}
                    onRemoveItem={handleRemoveItem}
                    onInternalNoteChange={setInternalNote}
                    onCompleteSale={handleCompleteSale}
                    canCompleteSale={amountDue > 0}
                  />
                  {cartItems.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setMobilePane('pay')}
                      className="w-full py-4 rounded-2xl bg-[#0B1F3A] text-white font-bold text-base shadow-lg active:scale-[0.98]"
                    >
                      {t('pos.goToPayment')} • {amountDue.toFixed(2)}
                    </button>
                  )}
                </div>
              )}
              {mobilePane === 'catalog' && (
                <div className="min-h-full flex flex-col">
                  <ProductCatalog
                    products={filteredProducts}
                    selectedCategory={selectedCategory}
                    searchQuery={searchQuery}
                    language={language}
                    onSelectCategory={setSelectedCategory}
                    onSearchChange={setSearchQuery}
                    onProductClick={(p) => { handleAddToCart(p); }}
                  />
                </div>
              )}
              {mobilePane === 'pay' && (
                <div className="flex flex-col gap-2">
                  <PaymentPanel
                    amountDue={amountDue}
                    paymentMethod={paymentMethod}
                    cashReceived={cashReceived}
                    language={language}
                    allowedPaymentMethods={visiblePaymentMethods}
                    onPaymentMethodChange={handleSelectPaymentMethod}
                    onCashReceivedChange={setCashReceived}
                    creditAdvance={creditAdvance}
                    creditTermDays={creditTermDays}
                    onCreditAdvanceChange={setCreditAdvance}
                    onCreditTermDaysChange={setCreditTermDays}
                    actionsSlot={
                      <FakturaActionsBar
                        language={language}
                        pendingCount={pendingDraftCount}
                        soundEnabled={soundEnabled}
                        onToggleSound={() => setSoundEnabled(!soundEnabled)}
                        onSaveInvoice={handleSaveDraftFromCart}
                        onOpenDrafts={() => setIsGaralamaOpen(true)}
                      />
                    }
                    ledgerSlot={
                      <LedgerSelect
                        language={language}
                        ledgers={visibleLedgers}
                        value={draftLedgerId}
                        onChange={setDraftLedgerId}
                      />
                    }
                    selectorsSlot={
                      <FakturaMetaSelectors
                        language={language}
                        warehouses={visibleWarehousesForInvoice}
                        invoiceType={invoiceType}
                        warehouseId={draftWarehouseId}
                        targetWarehouseId={draftTargetWarehouseId}
                        onWarehouseChange={setDraftWarehouseId}
                        onTargetWarehouseChange={setDraftTargetWarehouseId}
                        dateTimeSlot={
                          <SeneWagtSelector
                            language={language}
                            value={fixedInvoiceAt}
                            onChange={setFixedInvoiceAt}
                          />
                        }
                      />
                    }
                  />
                </div>
              )}
            </div>
          </main>
        ) : (
        /* === FAKTURA BÖLÜMI: Söwda POS Ekrany (PC) === */
        <main className="flex-1 p-2.5 flex space-x-2.5 overflow-hidden min-h-0">
          {/* SOL VE ORTA ALAN: Müşteri Seçici + Geniş Barkod Arama + Sepet Tablosu */}
          <section className="flex-1 flex flex-col h-full overflow-hidden min-h-0">
            {loadedDraftId && (
              <div className="mb-2 flex items-center justify-between gap-3 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 flex-shrink-0">
                <span className="text-[11px] font-bold text-amber-800 truncate">
                  Garalama faktura açyldy — üstünde düzedip bolýar. Tassyklamak üçin
                  «Satuwy Tamamla» basyň.
                </span>
                <button
                  type="button"
                  onClick={clearLoadedDraft}
                  className="text-[10px] font-bold text-amber-700 hover:text-amber-900 underline flex-shrink-0"
                >
                  Ýatyr
                </button>
              </div>
            )}
            <InvoiceControlBar
              selectedCustomer={selectedCustomer}
              barcodeQuery={barcodeQuery}
              invoiceType={invoiceType}
              invoiceCode={invoiceCode}
              language={language}
              customers={selectableCustomers}
              allowedInvoiceTypes={visibleInvoiceTypes}
              onCustomerChange={setSelectedCustomer}
              onBarcodeChange={setBarcodeQuery}
              onInvoiceTypeChange={setInvoiceType}
              onInvoiceCodeChange={setInvoiceCode}
              printCopies={printCopies}
              onPrintCopiesChange={setPrintCopies}
              onAddProduct={handleBarcodeAdd}
              barcodeInputRef={barcodeInputRef}
              promoCount={promos.length}
              onOpenPromo={() => setIsPromoOpen(true)}
              onOpenCustomerSearch={() => setIsCustomerSearchOpen(true)}
            />

            <CartTable
              items={cartItems}
              subtotal={subtotal}
              internalNote={internalNote}
              globalPercent={globalPercent}
              language={language}
              units={stores.units}
              canEditPrice={canEditPrice}
              canAllowDiscount={canAllowDiscount}
              onUpdateQty={handleUpdateQty}
              onSetQty={handleSetQty}
              onUpdatePrice={handleUpdatePrice}
              onUpdatePercent={handleUpdatePercent}
              onUpdateUnit={handleUpdateUnit}
              onApplyGlobalPercent={handleApplyGlobalPercent}
              onRemoveItem={handleRemoveItem}
              onInternalNoteChange={setInternalNote}
              onCompleteSale={handleCompleteSale}
              canCompleteSale={amountDue > 0}
            />
          </section>

          {/* SAĞ ALAN: Ürün Kataloğu (Üst) ve Ferah Ödeme Paneli (Alt) */}
          <section className="w-[410px] xl:w-[440px] flex flex-col space-y-2.5 h-full overflow-hidden flex-shrink-0 min-h-0">
            {/* Ürün Kataloğu */}
            <ProductCatalog
              products={filteredProducts}
              selectedCategory={selectedCategory}
              searchQuery={searchQuery}
              language={language}
              onSelectCategory={setSelectedCategory}
              onSearchChange={setSearchQuery}
              onProductClick={handleAddToCart}
            />

            {/* Ödeme Paneli */}
            <PaymentPanel
              amountDue={amountDue}
              paymentMethod={paymentMethod}
              cashReceived={cashReceived}
              language={language}
              allowedPaymentMethods={visiblePaymentMethods}
              onPaymentMethodChange={handleSelectPaymentMethod}
              onCashReceivedChange={setCashReceived}
              creditAdvance={creditAdvance}
              creditTermDays={creditTermDays}
              onCreditAdvanceChange={setCreditAdvance}
              onCreditTermDaysChange={setCreditTermDays}
              actionsSlot={
                <FakturaActionsBar
                  language={language}
                  pendingCount={pendingDraftCount}
                  soundEnabled={soundEnabled}
                  onToggleSound={() => setSoundEnabled(!soundEnabled)}
                  onSaveInvoice={handleSaveDraftFromCart}
                  onOpenDrafts={() => setIsGaralamaOpen(true)}
                />
              }
              ledgerSlot={
                <LedgerSelect
                  language={language}
                  ledgers={visibleLedgers}
                  value={draftLedgerId}
                  onChange={setDraftLedgerId}
                />
              }
              selectorsSlot={
                <FakturaMetaSelectors
                  language={language}
                  warehouses={visibleWarehousesForInvoice}
                  invoiceType={invoiceType}
                  warehouseId={draftWarehouseId}
                  targetWarehouseId={draftTargetWarehouseId}
                  onWarehouseChange={setDraftWarehouseId}
                  onTargetWarehouseChange={setDraftTargetWarehouseId}
                  dateTimeSlot={
                    <SeneWagtSelector
                      language={language}
                      value={fixedInvoiceAt}
                      onChange={setFixedInvoiceAt}
                    />
                  }
                />
              }
            />
          </section>
        </main>
        )
      ) : (
        /* === BEÝLEKI MODULLAR: WorkspaceRouter dolandyrýar === */
        <WorkspaceRouter
          activeTab={activeTab}
          language={language}
          currentUser={currentUser}
          products={visibleProducts}
          customers={visibleCustomers}
          invoices={completedInvoices}
          stores={stores}
          moneyStore={moneyStore}
          inUseCurrencyCodes={inUseCurrencyCodes}
          account={activeAccount}
          focusProductId={focusTarget?.kind === 'product' ? focusTarget.id : null}
          focusCustomerId={focusTarget?.kind === 'customer' ? focusTarget.id : null}
          moneySearchOpen={isMoneySearchOpen}
          onMoneySearchOpen={() => setIsMoneySearchOpen(true)}
          onMoneySearchClose={() => setIsMoneySearchOpen(false)}
          operationRules={appSettings?.operations ?? null}
          onAddToCart={handleAddToCart}
          onGoToCheckout={() => handleTabChange('checkout')}
          onAddProduct={handleAddProduct}
          onUpdateProduct={handleUpdateProduct}
          onDeleteProduct={handleDeleteProduct}
          onImportProducts={handleImportProducts}
          onAddCustomer={handleAddCustomer}
          onUpdateCustomer={handleUpdateCustomer}
          onDeleteCustomer={handleDeleteCustomer}
          onImportCustomers={handleImportCustomers}
          canEditCustomer={canEditCustomer}
          onQuickAddCustomer={handleQuickAddCustomer}
          storeDb={storeDb}
          companyName={activeAccount.name}
          currencyCode={BASE_CURRENCY_CODE}
          onSelectLanguage={onSelectLanguage}
          onGoToCurrency={() => handleTabChange('currency')}
          onGoToTargow={() => handleTabChange('courier')}
        />
      )}

      {/* 3. Alt Bilgi Çubuğu: telefonda alt menü, PC'de bilgi çubuğu */}
      {native ? (
        <>
          {(activeTab === 'product' || activeTab === 'customer' || activeTab === 'money' || activeTab === 'courier' || activeTab === 'currency') && (
            <button
              type="button"
              onClick={() => requestMobileAdd()}
              className="fixed right-4 z-40 w-14 h-14 rounded-full bg-emerald-500 text-white shadow-2xl flex items-center justify-center active:scale-95"
              style={{ bottom: 'calc(76px + env(safe-area-inset-bottom, 0px))' }}
              aria-label={fabLabel(activeTab, language)}
            >
              <Plus className="w-7 h-7 stroke-[2.5]" />
            </button>
          )}
          <MobileBottomNav
            activeTab={activeTab}
            language={language}
            allowedTabs={allowedTabs}
            cartCount={cartCount}
            onSelectTab={handleTabChange}
          />
          <MobileDrawer
            open={isDrawerOpen}
            companyName={activeAccount.name}
            logoUrl={activeAccount.logoUrl}
            userName={currentUser.name}
            language={language}
            activeTab={activeTab}
            allowedTabs={allowedTabs}
            onSelectTab={handleTabChange}
            onClose={() => setIsDrawerOpen(false)}
            onLogout={onLogout}
          />
        </>
      ) : (
        <PosFooter
          language={language}
          printerMode={printerMode}
          onSelectLanguage={onSelectLanguage}
          onSelectPrinterMode={onSelectPrinterMode}
          onOpenSearch={() => setIsShortcutsOpen(true)}
          onOpenAlerts={() => setIsAlertsOpen(true)}
          alertCount={alerts.total}
        />
      )}

      {isAlertsOpen && (
        <AlertsPanel
          language={language}
          criticalStock={alerts.criticalStock}
          dueCredits={alerts.dueCredits}
          onSelectProduct={handleSelectProductAlert}
          onSelectCustomer={handleSelectCustomerAlert}
          onClose={() => setIsAlertsOpen(false)}
        />
      )}

      {/* PROMO modaly — ýaşyl ikon arkaly açylýar */}
      {isPromoOpen && (
        <PromoModal
          promos={promos}
          products={products}
          currencyCode={BASE_CURRENCY_CODE}
          onSave={handleSavePromo}
          onDelete={handleDeletePromo}
          onClose={() => setIsPromoOpen(false)}
        />
      )}

      {/* Klawiatura gysgaltmalary — ýardam paneli (büýüteç ikonundan açylýar) */}
      {isShortcutsOpen && (
        <ShortcutsHelpModal language={language} onClose={() => setIsShortcutsOpen(false)} />
      )}

      {/* F1 — Haryt gözle (resimli arama penceresi) */}
      {isProductSearchOpen && (
        <ProductSearchModal
          products={selectableProducts}
          warehouses={visibleWarehousesGeneral}
          language={language}
          onSelect={handleAddToCart}
          onClose={() => setIsProductSearchOpen(false)}
        />
      )}

      {/* F2 — Müşderi gözle */}
      {isCustomerSearchOpen && (
        <CustomerSearchModal
          customers={selectableCustomers}
          invoices={completedInvoices}
          regions={stores.regions}
          language={language}
          onSelect={(customer) => {
            setSelectedCustomer(customer);
            setIsCustomerSearchOpen(false);
          }}
          onClose={() => setIsCustomerSearchOpen(false)}
        />
      )}

      {/* F9 — Silinen fakturalar (diňe administrator) */}
      {isDeletedInvoicesOpen && (
        <DeletedInvoicesModal
          invoices={completedInvoices.filter((inv) => inv.status === 'voided')}
          storeDb={storeDb}
          language={language}
          onClose={() => setIsDeletedInvoicesOpen(false)}
          onDeleted={(ids) => {
            const removed = new Set(ids);
            setCompletedInvoices((prev) => prev.filter((inv) => !removed.has(inv.id)));
          }}
        />
      )}

      {/* F10 — Geri al onam diýalogy */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-5">
            <div className="text-sm font-bold text-gray-800 mb-1">
              {t('pos.resetTitle')}
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              {t('pos.resetMsg')}
            </p>
            <div className="flex justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="h-9 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs"
              >
                {t('pos.resetCancel')}
              </button>
              <button
                type="button"
                onClick={handleResetCheckout}
                className="h-9 px-5 rounded-xl bg-[#10b981] hover:bg-[#059669] text-white font-bold text-xs"
              >
                {t('pos.resetConfirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* F12 — Sepet çap penjiresi */}
      {isPrintDraftOpen && (
        <DraftPrintModal
          language={language}
          items={cartItems}
          subtotal={subtotal}
          discountTotal={discountTotal}
          invoiceCode={invoiceCode}
          selectedCustomer={selectedCustomer}
          storeName={activeAccount.name}
          settings={receiptSettings}
          onClose={() => setIsPrintDraftOpen(false)}
        />
      )}

      {/* 4. POS Terminal Kartla Ödeme Modalı (Logo Muhasebe POS Entegrasyonu) */}
      {isPosTerminalModalOpen && (
        <CardTerminalPaymentModal
          amountDue={amountDue}
          language={language}
          onApprove={handleCardPaymentApproved}
          onCancel={() => setIsPosTerminalModalOpen(false)}
        />
      )}

      {/* 5. Otomatik Çek / Fiş Çıkarma & Yazdırma Modalı */}
      {activeReceiptInvoice && (
        <ReceiptModal
          invoice={activeReceiptInvoice}
          storeName={activeAccount.name}
          language={language}
          authCode={lastAuthCode}
          onClose={() => setActiveReceiptInvoice(null)}
          settings={receiptSettings}
          printerMode={printerMode}
          ledgerName={activeLedgerName}
        />
      )}

      {/* 6. Fakturalaryň Sanawy Modalı (F4) */}
      <InvoiceListModal
        isOpen={isInvoiceListModalOpen}
        invoices={completedInvoices}
        language={language}
        onClose={() => setIsInvoiceListModalOpen(false)}
        onSelectInvoice={(inv) => {
          // Faktura ekrany açylananda sanawy ýap — indi diňe faktuňyň özi görünsin.
          setIsInvoiceListModalOpen(false);
          setActiveReceiptInvoice(inv);
        }}
        canDelete={canVoidInvoice}
        onVoidInvoice={handleVoidInvoice}
      />

      {/* 7. Garalama fakturalar sanawy (Kabul / Ret) */}
      {isGaralamaOpen && (
        <GaralamaListModal
          language={language}
          invoices={completedInvoices}
          targows={stores.targows}
          regions={stores.regions}
          onOpenDraft={handleOpenDraft}
          onAccept={handleAcceptDraft}
          onReject={handleRejectDraft}
          onCreateDraft={() => {
            setIsGaralamaOpen(false);
            setIsDraftFormOpen(true);
          }}
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled(!soundEnabled)}
          onClose={() => setIsGaralamaOpen(false)}
        />
      )}

      {/* 8. Täze garalama faktura döretmek (mobil / uzak ulanyjy) */}
      {isDraftFormOpen && (
        <DraftFormModal
          language={language}
          targows={stores.targows}
          regions={stores.regions}
          customers={customers}
          products={products}
          currencies={stores.currencies}
          currentUser={currentUser}
          preselectTargowId={null}
          onCreate={handleCreateDraft}
          onClose={() => setIsDraftFormOpen(false)}
        />
      )}

      <FirstRunWizard key={storeDb} account={activeAccount} dbName={storeDb} language={language} isAdmin={isAdminUser(currentUser, stores.appUsers)} />

      {/* Toast Bildirimleri */}
      {toastMessage && (
        <div
          className={`fixed bottom-12 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl shadow-2xl flex items-center space-x-2.5 text-white text-xs font-bold animate-in fade-in slide-in-from-bottom-2 duration-150 ${
            toastMessage.type === 'success' ? 'bg-[#10b981]' : 'bg-[#0B1F3A]'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-white" />
          ) : (
            <FileText className="w-4 h-4 text-amber-400" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}
    </div>
  );
};
