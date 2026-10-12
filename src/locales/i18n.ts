import { LanguageCode } from '../types';
import pkg from '../../package.json';

export const translations: Record<LanguageCode, {
  windowTitle: string;
  languageMenuTitle: string;
  otherAccounts: string;
  addAccount: string;
  userLabel: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  loginButton: string;
  appName: string;
  version: string;
  delete: string;
  edit: string;
  import: string;
  autoSelectPrinter: string;
  receiptPrinter: string;
  standardPrinter: string;
  addAccountTitle: string;
  editAccountTitle: string;
  accountName: string;
  couchDbUrl: string;
  databaseName: string;
  save: string;
  cancel: string;
  selectLogo: string;
  /** CouchDB bağlantı arayüzü (hesap ekranı + ayarlar). */
  conn: {
    sectionTitle: string;
    sectionHint: string;
    localTitle: string;
    onlineTitle: string;
    localPlaceholder: string;
    onlinePlaceholder: string;
    testOnly: string;
    connect: string;
    stop: string;
    showPassword: string;
    hidePassword: string;
    statusIdle: string;
    statusConnecting: string;
    statusConnected: string;
    statusTested: string;
    statusError: string;
    statusOffline: string;
    denied: string;
    connecting: string;
    firstWorking: string;
    singleConnectionNote: string;
    progressTransferring: string;
    progressDone: string;
    docsReceived: string;
    docsSent: string;
    liveContinues: string;
    liveAfterTransfer: string;
    mergeTitle: string;
    mergeLocalCount: string;
    mergeRemoteCount: string;
    mergeKeep: string;
    mergeKeepHint: string;
    mergeServerOnly: string;
    mergeServerOnlyHint: string;
    noAccount: string;
    shareNote: string;
    panelNote: string;
  };
  /** POS / satış ekranı (PosWorkspace + pos/* yardımcı bileşenleri). */
  pos: {
    paymentCancelled: string;
    newSale: string;
    noPermission: string;
    noStock: string;
    inactiveProduct: string;
    resetDone: string;
    cartEmptyExport: string;
    excelExported: string;
    exportCancelled: string;
    exportDialogTitle: string;
    exportFailed: string;
    belowCost: string;
    selectCustomer: string;
    cartEmpty: string;
    cartEmptyAddFirst: string;
    specialPriceMissing: string;
    specialPriceSaved: string;
    priceSaveFailed: string;
    specialPriceNotFound: string;
    pricesApplied: string;
    printFailed: string;
    unknownError: string;
    compositionShort: string;
    dateBeforeStart: string;
    dateAfterEnd: string;
    cashSaleBlocked: string;
    creditLimitExceeded: string;
    nothingToReset: string;
    paneCart: string;
    panePay: string;
    goToPayment: string;
    resetTitle: string;
    resetMsg: string;
    resetCancel: string;
    resetConfirm: string;
    fabAddProduct: string;
    fabAddCustomer: string;
    fabAddMoney: string;
    fabAddCourier: string;
    fabAddCurrency: string;
    fabAdd: string;
    alertsTitle: string;
    alertsCount: string;
    alertsAttention: string;
    alertsAllOk: string;
    alertsEmpty: string;
    alertsEmptyHint: string;
    alertsLowStock: string;
    alertsNoCritical: string;
    alertsCriticalLevel: string;
    alertsMinus: string;
    alertsDueCredits: string;
    alertsNoDue: string;
    alertsOverdue: string;
    alertsToday: string;
    dueOverdue: string;
    dueToday: string;
    dueDaysLeft: string;
    csTitle: string;
    csFoundHeader: string;
    csFound: string;
    csSearchLabel: string;
    csSearchPlaceholder: string;
    csStartsWith: string;
    csWhoLabel: string;
    csBadgeCustomer: string;
    csWhoBoth: string;
    csBadgeEmployee: string;
    csRegionLabel: string;
    csAll: string;
    csDebtLabel: string;
    csDebtHas: string;
    csDebtNone: string;
    csDebtOverdue: string;
    csNotFound: string;
    psTitle: string;
    psFoundHeader: string;
    psFound: string;
    psSearchLabel: string;
    psSearchPlaceholder: string;
    psWarehouseLabel: string;
    psCategoryLabel: string;
    psAll: string;
    psBarcodeStatus: string;
    psBsWith: string;
    psBsWithout: string;
    psStockStatus: string;
    psSsInStock: string;
    psSsOut: string;
    psSsCritical: string;
    psNotFound: string;
    psStock: string;
    psClose: string;
    dpTitle: string;
    dpPreview: string;
    dpPrinter: string;
    dpDefaultPrinter: string;
    dpPrintBtn: string;
    dpPrinted: string;
    dpPrintFailed: string;
    dpNote: string;
    faSaveTip: string;
    faSaveLabel: string;
    faDraftsTip: string;
    faDraftsLabel: string;
    faSoundOnTip: string;
    faSoundOffTip: string;
    msWarehouseTip: string;
    msWarehouse: string;
    msTargetTip: string;
    msTargetDisabledTip: string;
    msWarehouse2: string;
    msTransferNote: string;
    changeTip: string;
    changeLabel: string;
    ledgerTip: string;
    ledgerOption: string;
    swLabel: string;
    swPickTip: string;
    swNowTip: string;
    swManualTip: string;
    swLiveTip: string;
    shortcutsTitle: string;
    shortcutsHint: string;
    emptySection: string;
    emptySectionHint: string;
    icbMenuTitle: string;
    icbCustomerSearchTip: string;
    icbAddTip: string;
    icbClearCodeTip: string;
    icbNewCodeTip: string;
    icbCopiesTip: string;
    icbCopiesNone: string;
    icbCopiesCount: string;
    printerSettingsTip: string;
    generalSearchTip: string;
    unitCol: string;
    switchAccount: string;
    cameraScanTip: string;
    gridView: string;
    listView: string;
    cardScanningPorts: string;
    cardTestModeTip: string;
    cardTestMode: string;
    cardWaitingBefore: string;
    cardApprove: string;
    cardWaitingAfter: string;
    cardBankApproval: string;
    cardPaymentFailed: string;
    cardApproveBtn: string;
  };
  /** Faktura sanawy modal (InvoiceListModal + silme diyalogları). */
  invoices: {
    title: string;
    subtitle: string;
    filterToday: string;
    filterYesterday: string;
    filterThisWeek: string;
    filterThisMonth: string;
    filterAll: string;
    rangeTitle: string;
    presetTooltip: string;
    presetMenuTitle: string;
    presetToday: string;
    presetYesterday: string;
    presetDayBefore: string;
    presetThisWeek: string;
    presetThisMonth: string;
    presetThisYear: string;
    presetLastWeek: string;
    presetLastMonth: string;
    presetSinceYesterday: string;
    presetSinceDayBefore: string;
    presetSinceLastWeek: string;
    presetSinceLastMonth: string;
    presetLastYear: string;
    searchPlaceholder: string;
    typeLabel: string;
    typeSales: string;
    typeAll: string;
    typePurchase: string;
    typeReturns: string;
    typeTransfer: string;
    typeOther: string;
    statsTotal: string;
    statsCountSuffix: string;
    statsAmount: string;
    payCash: string;
    payCard: string;
    payCredit: string;
    paySplit: string;
    voidedToggleTip: string;
    voidedToggle: string;
    emptyTitle: string;
    emptyHint: string;
    colNo: string;
    colDate: string;
    colCustomer: string;
    colType: string;
    colPayment: string;
    colItems: string;
    colAmount: string;
    colAction: string;
    rowOpenTip: string;
    receiptOpenTip: string;
    voidedBadge: string;
    returnBadge: string;
    deleteTip: string;
    footerHint: string;
    closeBtn: string;
    deleteTitle: string;
    deleteMsg: string;
    deleteCascade: string;
    customerLabel: string;
    cancelBtn: string;
    confirmDeleteBtn: string;
    deletedTitle: string;
    deletedEmpty: string;
    deletedColNo: string;
    deletedColDate: string;
    deletedColAmount: string;
    deletedColAt: string;
    deletedColBy: string;
    closeShort: string;
    deleteSelected: string;
    deleteAll: string;
    permTitle: string;
    permAllMsg: string;
    permSelectedMsg: string;
    permCancel: string;
    permConfirm: string;
  };
  /** Kasa / para hareketleri modülü. */
  kassa: {
    cashIn: string;
    cashOut: string;
    noExpensePerm: string;
    noIncomePerm: string;
    noCategoryPerm: string;
    shownCount: string;
    today: string;
    balanceCard: string;
    todayIncome: string;
    todayExpense: string;
    cashLabel: string;
    cardLabel: string;
    deleteMsg: string;
    editTip: string;
    deleteTip: string;
    searchPlaceholder: string;
    advancedSearchTip: string;
    all: string;
    income: string;
    expense: string;
    allCategories: string;
    allCustomers: string;
    dateStartTip: string;
    dateEndTip: string;
    clear: string;
    empty: string;
    colDate: string;
    colType: string;
    colCategory: string;
    colCustomer: string;
    colPayment: string;
    colAmount: string;
    colDesc: string;
    colAction: string;
    incomeBadge: string;
    expenseBadge: string;
    editTitle: string;
    addIncomeTitle: string;
    addExpenseTitle: string;
    dateLabel: string;
    searchTitle: string;
    foundPrefix: string;
    txSuffix: string;
    noteLabel: string;
    notePlaceholder: string;
    dateRange: string;
    allShort: string;
    none: string;
    payCard: string;
    payTransfer: string;
    customerLabel: string;
    userLabel: string;
    ledgerLabel: string;
    currencyLabel: string;
    onlyDue: string;
    searchOrType: string;
    quickAdd: string;
    debtLabel: string;
    creditLabel: string;
    settledLabel: string;
    customerOptional: string;
    supplierOptional: string;
    fromWhom: string;
    toWhom: string;
    staffLabel: string;
    selectOption: string;
    staffNameLabel: string;
    subCategoryLabel: string;
    errAmount: string;
    errDate: string;
    errCustomer: string;
    errPerson: string;
  };
  /** Hesaplama modülü. */
  hasaplama: {
    title: string;
    result: string;
    period: string;
    periodToday: string;
    periodWeek: string;
    periodMonth: string;
    periodLastMonth: string;
    periodQuarter: string;
    periodYear: string;
    periodCustom: string;
    tabXaccot: string;
    tabPl: string;
    tabDebt: string;
    tabStock: string;
    tabCash: string;
    tabTargow: string;
    summaryHideTip: string;
    summaryShowTip: string;
    summaryHide: string;
    summaryShow: string;
    printBtn: string;
    excelBtn: string;
    preparedAt: string;
    noDataPeriod: string;
    income: string;
    expense: string;
    incomeCaps: string;
    expenseCaps: string;
    incomeTotal: string;
    expenseTotal: string;
    incomeItems: string;
    expenseItems: string;
    noIncome: string;
    noExpense: string;
    incomeMinusExpense: string;
    netProfit: string;
    /** `{amount}` interpolasyonlu. */
    netProfitFooter: string;
    periodMovement: string;
    colDesc: string;
    colCount: string;
    colAmountTmt: string;
    colCategory: string;
    colCustomer: string;
    colDebtTmt: string;
    colLastPayment: string;
    totalReceivable: string;
    supplierDebt: string;
    borrowed: string;
    lent: string;
    receivablesTitle: string;
    noDebt: string;
    overdueTitle: string;
    noOverdue: string;
    colInvoiceNo: string;
    colDueDate: string;
    colLate: string;
    daysLate: string;
    totalReceivableFooter: string;
    colProduct: string;
    colQty: string;
    colPurchase: string;
    colPurchaseValue: string;
    colSaleValue: string;
    skuCount: string;
    totalQty: string;
    byPurchasePrice: string;
    bySalePrice: string;
    stockState: string;
    filterAll: string;
    filterPositive: string;
    filterNegative: string;
    stockCountLabel: string;
    noStockKind: string;
    colStock: string;
    colSale: string;
    colStockValue: string;
    colAction: string;
    showTip: string;
    createInvoiceTip: string;
    criticalStockLabel: string;
    expiryLabel: string;
    purchasePriceLabel: string;
    wholesaleLabel: string;
    barcodeLabel: string;
    belowCritical: string;
    bestSellers: string;
    worstSellers: string;
    noSalesPeriod: string;
    purchaseValueFooter: string;
    colLedger: string;
    colCurrency: string;
    colBalance: string;
    byLedgers: string;
    noLedgers: string;
    paymentMethodIncome: string;
    noIncomePeriod: string;
    totalBalanceFooter: string;
    colTargow: string;
    colOrderCount: string;
    colTotalAmount: string;
    colTotalAmountShort: string;
    colNewCustomer: string;
    colRank: string;
    noTargows: string;
    fullViewInTargow: string;
    totalFooter: string;
    xaccotTitle: string;
    xaccotPrintTitle: string;
    cardInvoices: string;
    cardSalesTotal: string;
    cardCash: string;
    cardCard: string;
    cardCredit: string;
    cardKassaIncome: string;
    cardKassaExpense: string;
    cardNet: string;
    salesTotalTmt: string;
    colValue: string;
    netFooter: string;
    dayInvoices: string;
    allDayInvoices: string;
    noInvoicesToday: string;
    colTime: string;
    colPayment: string;
    dayBestSellers: string;
    noSalesToday: string;
    productKindsSuffix: string;
    calculator: string;
    currencyLabel: string;
    totalIncome: string;
    totalExpense: string;
    stockValue: string;
    ledgerBalance: string;
  };
  /** Ayarlar ekranı. */
  sazlamalar: {
    sectionGeneral: string;
    resetToDefaults: string;
    unitNameRequired: string;
    unitNameRequiredEdit: string;
    unitExists: string;
    unitInUse: string;
    unitNewPh: string;
    unitAdd: string;
    unitColName: string;
    unitColUsedBy: string;
    unitColAction: string;
    unitEditTitle: string;
    unitFixedNoDelete: string;
    unitRuleHint: string;
    settingsTitle: string;
    secPrinter: string;
    secScale: string;
    secReceipt: string;
    secPermissions: string;
    secUnits: string;
    secRules: string;
    secDeleted: string;
    secSync: string;
    secAudit: string;
    secGeneral: string;
    unsavedTitle: string;
    unsavedHint: string;
    cancelBtn: string;
    continueBtn: string;
    saveBarDirty: string;
    saveBarClean: string;
    saveBtn: string;
    noEditPerm: string;
    saved: string;
    backupSaveTitle: string;
    backupFilterName: string;
    backupSaved: string;
    exportCancelled: string;
    exportFailed: string;
    importDone: string;
    importFailed: string;
    loading: string;
    genDesc: string;
    genLanguage: string;
    genDateFormat: string;
    genBaseCurrency: string;
    genBaseCurrencyHint: string;
    genGoToCurrency: string;
    backupTitle: string;
    backupDesc: string;
    backupAuto: string;
    backupAutoDesc: string;
    backupFreq: string;
    backupDaily: string;
    backupWeekly: string;
    backupFolder: string;
    dataTitle: string;
    dataDesc: string;
    dataExport: string;
    dataImport: string;
    aboutTitle: string;
    aboutDesc: string;
    aboutVersion: string;
    aboutLicense: string;
    aboutLicenseValue: string;
    encTitle: string;
    encDesc: string;
    encEnabledNotice: string;
    encWarn1: string;
    encWarn2: string;
    encWarn3: string;
    encWarn4: string;
    encMigrating: string;
    encDone: string;
    encFailed: string;
    encDisabledNotice: string;
    encRestart: string;
    encEnable: string;
    encDisable: string;
    encConfirmEnableTitle: string;
    encConfirmEnableHint: string;
    encConfirmDisableTitle: string;
    encConfirmDisableHint: string;
    firmTitle: string;
    firmDesc: string;
    firmName: string;
    firmCode: string;
    firmTitleField: string;
    firmPhone: string;
    firmFax: string;
    firmAddress: string;
    firmTax: string;
    opsTitle: string;
    opsDesc: string;
    opsInactiveCustomer: string;
    opsInactiveProduct: string;
    opsBelowCost: string;
    creditMin: string;
    creditMax: string;
    creditDefault: string;
    opStart: string;
    opEnd: string;
    barcodeTitle: string;
    barcodeDesc: string;
    barcodePrefix: string;
    barcodeSuffix: string;
    prKindStandard: string;
    prKindReceipt: string;
    prBtConnected: string;
    prBtFailed: string;
    prBtScanDone: string;
    prBtScanFailed: string;
    prBtPicked: string;
    prBtPickFailed: string;
    prBtTestSent: string;
    prBtNotConnected: string;
    prDesktopOnly: string;
    prNone: string;
    prTestDesktopOnly: string;
    prTestSent: string;
    prTestFailed: string;
    prUnknownError: string;
    prStatusTitle: string;
    prStatusDesc: string;
    statusConnected: string;
    statusDisconnected: string;
    prRefresh: string;
    prFound: string;
    prBrowserMode: string;
    prDefault: string;
    prSettingsDesc: string;
    prBtName: string;
    prBtSub: string;
    btConnected: string;
    btNone: string;
    btScanning: string;
    btScan: string;
    btDisconnect: string;
    btPickConnect: string;
    btScanHint: string;
    btConnect: string;
    btPrinting: string;
    btTestPrint: string;
    btUsbHint: string;
    btWifiHint: string;
    btClassicHint: string;
    prDefaultPrinter: string;
    selectOption: string;
    prKindLabel: string;
    prPaperWidth: string;
    prPaperWidthHint: string;
    prConnection: string;
    prNetwork: string;
    prIp: string;
    prPort: string;
    prTesting: string;
    prTest: string;
    scDesktopOnly: string;
    scMobileNote: string;
    scStatusTitle: string;
    scStatusDesc: string;
    scTesting: string;
    scTest: string;
    scTestHint: string;
    scSettingsDesc: string;
    scPort: string;
    scModel: string;
    scCustomModelNote: string;
    scUnit: string;
    scKg: string;
    scG: string;
    scAutoRead: string;
    scAutoReadDesc: string;
    rcErrType: string;
    rcErrSize: string;
    rcTabThermal: string;
    rcTabStandard: string;
    rcLogoTitle: string;
    rcLogoDesc: string;
    rcLogoUpload: string;
    rcRemove: string;
    rcLogoWidth: string;
    rcLogoCenter: string;
    rcCenter: string;
    rcLeft: string;
    rcCompanyTitle: string;
    rcCompanyDesc: string;
    rcCompanyName: string;
    rcAddress: string;
    rcPhone: string;
    rcTaxId: string;
    rcPreview: string;
    thShowLogo: string;
    thShowAddress: string;
    thShowPhone: string;
    thShowTaxId: string;
    thShowQr: string;
    thShowBarcode: string;
    thShowCashier: string;
    thShowCustomer: string;
    thFieldsTitle: string;
    thFieldsDesc: string;
    thPaperTitle: string;
    thPaperDesc: string;
    thFontSize: string;
    thFontHint: string;
    fontSm: string;
    fontMd: string;
    fontLg: string;
    thQrTitle: string;
    thQrDesc: string;
    thQrContent: string;
    qrInvoice: string;
    qrWebsite: string;
    qrPayment: string;
    thAutoPrint: string;
    thAutoPrintDesc: string;
    thCopies: string;
    thFooterNote: string;
    thFooterPh: string;
    spOrientPortrait: string;
    spOrientLandscape: string;
    spColBarcode: string;
    spColUnit: string;
    spColUnitPrice: string;
    spColDiscount: string;
    spColSubtotal: string;
    spColTax: string;
    spInfoCurrency: string;
    spInfoPayment: string;
    spInfoCustomer: string;
    spInfoLedger: string;
    spLayoutTitle: string;
    spLayoutDesc: string;
    spOrientation: string;
    spItemsTitle: string;
    spItemsDesc: string;
    spShowImages: string;
    spShowImagesDesc: string;
    spColumns: string;
    spInfo: string;
    spInfoHint: string;
    spHeadFootTitle: string;
    spHeadFootDesc: string;
    spHeader: string;
    spHeaderDesc: string;
    spFooter: string;
    spFooterDesc: string;
    spSignature: string;
    spSignatureDesc: string;
    spNotesTitle: string;
    spNotesDesc: string;
    spNotesPh: string;
    permRoleExists: string;
    permProtectedDelete: string;
    permRolesTitle: string;
    permRolesDesc: string;
    permNewRolePh: string;
    permAddRole: string;
    permDelete: string;
    permRolePerms: string;
    permModulesNote: string;
    permAuditTitle: string;
    permAuditDesc: string;
    permAuditLabel: string;
    permAuditLabelDesc: string;
    auditCreate: string;
    auditUpdate: string;
    auditDelete: string;
    auditView: string;
    auditReadFailed: string;
    auditExportTitle: string;
    auditSaved: string;
    auditExportFailed: string;
    auditDesc: string;
    auditDisabled: string;
    auditHealthError: string;
    auditDocType: string;
    auditUser: string;
    auditAll: string;
    auditRefresh: string;
    auditExport: string;
    auditColTime: string;
    auditColAction: string;
    auditColType: string;
    auditColEntry: string;
    auditLoading: string;
    auditEmpty: string;
    unitsDesc: string;
    unitColCode: string;
  };
  /** Mobil (telefon) arayüzü — components/mobile. */
  mobile: {
    customerSearchTitle: string;
  };
  /** Çek / fiş çıktısı. */
  receipt: {
    receiptNo: string;
    cashier: string;
    colNo: string;
    colDate: string;
    colCashier: string;
    colCustomer: string;
    colItemsQty: string;
    colTotal: string;
    subtotal: string;
    discount: string;
    paid: string;
    paidTotal: string;
    remainingDebt: string;
    creditTerm: string;
    days: string;
    dueDate: string;
    paymentType: string;
    auth: string;
    status: string;
    approved: string;
    waitingAgain: string;
    /** Standart (A4) faktura + termal çek gövde etiketleri. */
    invTitle: string;
    invCode: string;
    invNo: string;
    invDate: string;
    invCustomer: string;
    invCashier: string;
    colProduct: string;
    colBarcode: string;
    colQty: string;
    colUnit: string;
    colUnitPrice: string;
    colPrice: string;
    colDiscount: string;
    colDiscountShort: string;
    colLineTotal: string;
    taxLabel: string;
    taxShort: string;
    subtotalLabel: string;
    discountLabel: string;
    ledgerLabel: string;
    grandTotal: string;
    paidLabel: string;
    remainingLabel: string;
    paymentLabel: string;
    paymentShort: string;
    seller: string;
    buyer: string;
    notesTerms: string;
    pageOne: string;
    authShort: string;
    thermalDate: string;
    noShort: string;
    totalCaps: string;
  };
  /** Faktura/çek üzerindeki ödeme türü etiketleri (yalnızca görüntüleme; DB'de enum saklanır). */
  payment: {
    cash: string;
    card: string;
    credit: string;
    split: string;
  };
  /** Excel içe/dışa aktarım. */
  excel: {
    exportSuccess: string;
    /** `{count}` interpolasyon örneği: `translate(lang, 'excel.exportedRows', { count: n })`. */
    exportedRows: string;
    importModalTitle: string;
    exportModalTitle: string;
    errorReportTitle: string;
    selectFile: string;
    downloadTemplate: string;
    readingFile: string;
    importDone: string;
    importAdded: string;
    importUpdated: string;
    importSkipped: string;
    failedSummary: string;
    failedRows: string;
    errorReport: string;
    validRow: string;
    existing: string;
    errorRow: string;
    existingProducts: string;
    overwriteAll: string;
    skipAll: string;
    selectFileHint: string;
    closeBtn: string;
    writing: string;
    importBtn: string;
    statusNew: string;
    savedToDocuments: string;
    saveFailed: string;
    selectAll: string;
    clearSelection: string;
    includeStock: string;
    includeCost: string;
    exportBtn: string;
    colName: string;
    colStatus: string;
    errorReportTitleCustomers: string;
    detailHeaderPhone: string;
    importModalTitleCustomers: string;
    exportModalTitleCustomers: string;
    existingCustomers: string;
    searchCustomers: string;
    includeBalance: string;
    customerNotFound: string;
    fileTooLarge: string;
    tooManyRows: string;
    xlsNotSupported: string;
    xlsxOnly: string;
    invalidFile: string;
    readFailed: string;
    mapColumns: string;
    mappingHint: string;
    headerRow: string;
    requiredColumn: string;
    unmappedColumn: string;
    sourceColumn: string;
    emptyHeader: string;
    sampleCell: string;
    mappingRequired: string;
    applyMapping: string;
    mappingAmbiguous: string;
  };
  /** Haryt (ürün) modülü: ProductWorkspace ve yardımcı bileşenleri. */
  products: {
    searchPlaceholder: string;
    bulkEditTitle: string;
    bulkEdit: string;
    importExcelTitle: string;
    importExcel: string;
    exportExcelTitle: string;
    exportExcel: string;
    allCategoriesOption: string;
    newProduct: string;
    colNameCategory: string;
    colBarcode: string;
    colPurchaseSale: string;
    colStock: string;
    colActions: string;
    notFound: string;
    clickToEdit: string;
    composedTooltip: string;
    composedBadge: string;
    negativeStockAllowed: string;
    compositionEditTooltip: string;
    compositionAddTooltip: string;
    editAction: string;
    deleteConfirm: string;
    noBtn: string;
    editTitle: string;
    addTitle: string;
    imageChangeTitle: string;
    compressing: string;
    changeBtn: string;
    imageOptional: string;
    nameLabel: string;
    namePlaceholder: string;
    categoryLabel: string;
    categoryPlaceholder: string;
    barcodeLabel: string;
    unit1Label: string;
    priceLabel: string;
    unit2Enable: string;
    unit2Label: string;
    unit2QtyLabel: string;
    unit2Example: string;
    purchasePriceLabel: string;
    wholesalePriceLabel: string;
    stockLabel: string;
    negativeStockTooltip: string;
    negativeAllowedShort: string;
    inactiveTooltip: string;
    activeBtn: string;
    inactiveBtn: string;
    inactiveNote: string;
    compositionOpenTooltip: string;
    compositionBtn: string;
    criticalStockLabel: string;
    expiryLabel: string;
    extraBarcodesLabel: string;
    extraBarcodePlaceholder: string;
    addShort: string;
    cancelBtn: string;
    saveBtn: string;
    unitNameRequired: string;
    unitExists: string;
    customUnitPlaceholder: string;
    customUnitOption: string;
    unitAddedHint: string;
    bulkModalTitle: string;
    changesReady: string;
    bulkSearchPlaceholder: string;
    bulkAllCategories: string;
    colName: string;
    colPurchase: string;
    colSale: string;
    stockShort: string;
    colCritical: string;
    errorRowsHint: string;
    priceRule: string;
    saveCount: string;
    compSaved: string;
    compositionTitle: string;
    compositionSearchPlaceholder: string;
    selectProduct: string;
    stockAmount: string;
    stockPrefix: string;
    purchaseShort: string;
    saleShort: string;
    components: string;
    noComponents: string;
    stockInsufficient: string;
    unitShort: string;
    totalShort: string;
    removeTooltip: string;
    totalPurchase: string;
    totalSale: string;
    profit: string;
    mainPriceLabel: string;
    useSuggestedTooltip: string;
    useSuggested: string;
  };
  /** Müşderi (cari) modülü: CustomerWorkspace, CustomerForm, CustomerBulkEditModal. */
  customers: {
    filterAllCount: string;
    filterCustomersCount: string;
    filterEmployeesCount: string;
    filterAll: string;
    filterCustomers: string;
    filterEmployees: string;
    searchPlaceholder: string;
    bulkEditTitle: string;
    bulkEdit: string;
    importExcelTitle: string;
    importExcel: string;
    exportExcelTitle: string;
    exportExcel: string;
    addCustomer: string;
    newCardTitle: string;
    colNamePhone: string;
    colType: string;
    colKind: string;
    colDueDate: string;
    colBalance: string;
    colActions: string;
    notFound: string;
    doubleClickHint: string;
    typeEmployee: string;
    typeCustomer: string;
    typeSupplier: string;
    editAction: string;
    generalCustomerNoDelete: string;
    roleEmployee: string;
    roleCustomer: string;
    phoneLabel: string;
    balanceLabel: string;
    dueDateLabel: string;
    creditLimitLabel: string;
    unlimited: string;
    addressLabel: string;
    ledgerTitle: string;
    txCountSuffix: string;
    noTransactions: string;
    colDate: string;
    colInvoiceCode: string;
    colReason: string;
    colDebit: string;
    colCredit: string;
    closeBtn: string;
    receiptTooltip: string;
    reasonSalesInvoice: string;
    reasonInvoiceOp: string;
    reasonCreditSale: string;
    reasonCashPayment: string;
    reasonWholesale: string;
    reasonBankTransfer: string;
    reasonOpening: string;
    editTitle: string;
    nameLabel: string;
    namePlaceholder: string;
    nameReadOnlyTitle: string;
    phoneLabelForm: string;
    typeLabel: string;
    typeCustomerOption: string;
    typeEmployeeOption: string;
    dueDateLabelForm: string;
    creditLimitLabelForm: string;
    addressLabelForm: string;
    addressPlaceholder: string;
    balanceAutoTitle: string;
    balanceAutoNote: string;
    activeLabel: string;
    cashBlockedLabel: string;
    cashBlockedHint: string;
    saveCreateBtn: string;
    bulkModalTitle: string;
    changesReady: string;
    bulkSearchPlaceholder: string;
    allTypes: string;
    colFullName: string;
    colPhone: string;
    colAddressNote: string;
    systemNameReadOnly: string;
    errorEmptyName: string;
    balanceLegend: string;
    saveCount: string;
  };
  /** Ulanyjy (kullanıcı) modülü: UserWorkspace, UserFormModal, UserAdvancedPermissions. */
  users: {
    errUsernameRequired: string;
    errUsernameTaken: string;
    errPasswordMismatch: string;
    errCategoryRequired: string;
    errInvoiceTypeRequired: string;
    searchPlaceholder: string;
    allRoles: string;
    newUser: string;
    colUsername: string;
    colRole: string;
    colStatus: string;
    colLastLogin: string;
    colActions: string;
    emptyNoUsers: string;
    emptyNotFound: string;
    active: string;
    passive: string;
    protectedTip: string;
    protectedBadge: string;
    editTip: string;
    resetPasswordTip: string;
    deleteTip: string;
    deleteMsg: string;
    newPassword: string;
    confirmPassword: string;
    actView: string;
    actCreate: string;
    actEdit: string;
    actDelete: string;
    actReport: string;
    colModule: string;
    editTitle: string;
    roleLabel: string;
    customRoleHint: string;
    passwordEditLabel: string;
    passwordNewLabel: string;
    permissionsTitle: string;
    finePermsTitle: string;
    kassaSection: string;
    addIncome: string;
    addExpense: string;
    showBalance: string;
    allowedCategories: string;
    selectAll: string;
    clearAll: string;
    fakturaSection: string;
    editPrice: string;
    allowDiscount: string;
    allowedInvoiceTypes: string;
    modeAll: string;
    modeWhitelist: string;
    modeBlacklist: string;
    removeTip: string;
    selectedCount: string;
    noneSelected: string;
    notFound: string;
    searchIn: string;
    advTitle: string;
    defaultsSection: string;
    defInvoiceType: string;
    defPaymentType: string;
    defUnit: string;
    defUnit2: string;
    defCustomer: string;
    noOneGeneral: string;
    defWarehouse: string;
    defLedger: string;
    accessSection: string;
    payTypesTitle: string;
    phPayment: string;
    phCustomer: string;
    phProduct: string;
    phWarehouse: string;
    phLedger: string;
    customerPerms: string;
    productPerms: string;
    warehousePerms: string;
    invoiceWarehouses: string;
    ledgerPerms: string;
  };
  /** Genel hata mesajları. */
  errors: {
    documentValidation: string;
    invalidBatchSize: string;
    generic: string;
    network: string;
    boundaryTitle: string;
    boundaryRestart: string;
  };
  /** Lisans ekranı (LicenseScreen). */
  license: {
    title: string;
    account: string;
    attention: string;
    needLicense: string;
    needKeyInfo: string;
    daysLeft: string;
    days: string;
    accountId: string;
    loading: string;
    copy: string;
    requestCode: string;
    requestCodeHint: string;
    rootCode: string;
    rootCodeFirstSetup: string;
    rootCodePlaceholder: string;
    rootCodeHint: string;
    rootCodeReenter: string;
    licenseKey: string;
    licenseKeyPlaceholder: string;
    licenseKeyHint: string;
    activating: string;
    activate: string;
    activeLicense: string;
    expiry: string;
    remaining: string;
    features: string;
    maxRegisters: string;
    loadFailed: string;
    nothingToCopy: string;
    copied: string;
    copyFailed: string;
    rootInvalid: string;
    activated: string;
    activationError: string;
    errorFallback: string;
    statusActive: string;
    statusInvalidKey: string;
    statusExpired: string;
    statusOtherDevice: string;
    statusClockReset: string;
    statusUsed: string;
    statusNotActivated: string;
    statusInvalidInput: string;
    statusKeyInvalid: string;
    statusOtherAccount: string;
    statusStorage: string;
    statusRootRequired: string;
    statusFileCorrupt: string;
  };
  /** Targow (saha satıcısı) modülü — components/targowy. */
  targowy: {
    targows: string;
    addTargow: string;
    noTargow: string;
    notFound: string;
    view: string;
    todayOrders: string;
    monthResult: string;
    last7Days: string;
    last14Days: string;
    noRegionAssigned: string;
    todayTotalSales: string;
    todayOrderCount: string;
    activeTargows: string;
    bestToday: string;
    noOrdersToday: string;
    today: string;
    thisWeek: string;
    thisMonth: string;
    commission: string;
    ordersUnit: string;
    monthlyTarget: string;
    noOrders: string;
    allRegions: string;
    allStatuses: string;
    fullNameRequired: string;
    phoneRequired: string;
    targowExists: string;
    optional: string;
    noRegionsHint: string;
    deleteConfirm: string;
    deleteHasOrders: string;
    tabRegions: string;
    tabRating: string;
    regionExists: string;
    newRegionPh: string;
    addRegion: string;
    noRegions: string;
    activeLabel: string;
    inactiveLabel: string;
    editTitle: string;
    newTitle: string;
    fullNameLabel: string;
    colRank: string;
    colName: string;
    colOrderCount: string;
    colTotalAmount: string;
    avgOrder: string;
    colNewCustomer: string;
    colTrend: string;
    colCustomer: string;
    periodAll: string;
    critAmount: string;
    critOrders: string;
    critNewCustomers: string;
  };
  /** Walýuta (döviz) modülü — components/walyuta. */
  walyuta: {
    baseCurrency: string;
    baseCurrencyHint: string;
    fixed: string;
    change: string;
    confirmBaseTitle: string;
    confirmBaseMsg: string;
    prevBase: string;
    deleteConfirm: string;
    deleteBaseBlocked: string;
    deleteInUse: string;
    codeRequired: string;
    tmtIsBase: string;
    codeExists: string;
    nameRequired: string;
    ratePositive: string;
    customCodeLabel: string;
    colSymbol: string;
    colRate: string;
    colUpdated: string;
    emptyCurrencies: string;
    baseBadge: string;
    updateRate: string;
    setBase: string;
    baseCannotDelete: string;
    deleteLabel: string;
    baseSetNotice: string;
    baseSetFailed: string;
    addOtherFirst: string;
    addedCurrencies: string;
    editTitle: string;
    newTitle: string;
  };
  /** Garalama (taslak) faktura modülü — components/faktura. */
  faktura: {
    selectTargow: string;
    selectCustomer: string;
    selectRegion: string;
    addOneProduct: string;
    draftNoEffect: string;
    productSearchPh: string;
    noProductsAdded: string;
    filterSearchPh: string;
    recordsShown: string;
    soundOn: string;
    soundOff: string;
    rejectTitle: string;
    rejectHint: string;
    rejectReasonLabel: string;
    noDrafts: string;
    openInInvoice: string;
    openLabel: string;
    createTitle: string;
    noteLabel: string;
    cancelBtn: string;
    saveDraft: string;
    targowLabel: string;
    customerLabel: string;
    regionLabel: string;
    selectOption: string;
    paymentLabel: string;
    currencyLabel: string;
    payCash: string;
    payCard: string;
    payCredit: string;
    addProductLabel: string;
    colProduct: string;
    colPrice: string;
    colQty: string;
    colTotal: string;
    statusPending: string;
    statusAccepted: string;
    statusRejected: string;
    filterAll: string;
    filterByUser: string;
    filterByTargow: string;
    filterByRegion: string;
    dateStartTip: string;
    dateEndTip: string;
    clearFilters: string;
    colDate: string;
    colSender: string;
    colCustomer: string;
    colRegion: string;
    colStatus: string;
    colAction: string;
    acceptTip: string;
    rejectTip: string;
  };
  /** Depder (kasa defteri) modülü — components/depder. */
  depder: {
    noDescription: string;
    currentBalance: string;
    usersUnit: string;
    deleteConfirm: string;
    deleteHasTx: string;
    back: string;
    txUnit: string;
    nameRequired: string;
    nameExists: string;
    openingBalanceNaN: string;
    namePh: string;
    descPh: string;
    grandTotal: string;
    ledgersUnit: string;
    transferBtn: string;
    newLedger: string;
    noLedgers: string;
    noLedgersHint: string;
    selectLedgers: string;
    sameLedger: string;
    amountPositive: string;
    transferDescPh: string;
    transferTitle: string;
    fromLedger: string;
    toLedger: string;
    amountLabel: string;
    dateLabel: string;
    rateNote: string;
    descLabel: string;
    cancelBtn: string;
    transferSubmit: string;
    editTitle: string;
    newTitle: string;
    nameLabel: string;
    currencyLabel: string;
    openingLabel: string;
    descFieldLabel: string;
    activeLabel: string;
    inactiveLabel: string;
    permsTitle: string;
    saveBtn: string;
    userSelectPh: string;
    userAdd: string;
    userCol: string;
    noUsersNote: string;
    allPerms: string;
    removeTip: string;
    permEnter: string;
    permAddIncome: string;
    permAddExpense: string;
    permEdit: string;
    permDelete: string;
    permViewReport: string;
  };
  /** Ambar modülü — components/warehouses. */
  warehouses: {
    searchPh: string;
    newWarehouse: string;
    colWarehouse: string;
    colCode: string;
    colAddressTel: string;
    colStatus: string;
    colActions: string;
    emptyNone: string;
    emptyNotFound: string;
    itemsUnit: string;
    inactive: string;
    active: string;
    defaultBadge: string;
    editTitle: string;
    deleteConfirm: string;
    cancelNo: string;
    formEditTitle: string;
    formName: string;
    formPhone: string;
    formAddress: string;
    formNote: string;
    defaultWarehouse: string;
    itemsInside: string;
    colProductName: string;
    colBarcode: string;
    colQty: string;
    colUnit: string;
    colPrice: string;
    emptyWarehouse: string;
    close: string;
  };
  /** Genel amaçlı modallar — components/modals. */
  modals: {
    importFailed: string;
    accountFileHint: string;
    clickToPick: string;
    importedCount: string;
    importing: string;
    shortcutsTitle: string;
    shortcutsHint: string;
    shortcutsClose: string;
    bhbakNote: string;
  };
  /** Promo (indirim kampanyası) modülü — components/promo. */
  promo: {
    modalTitle: string;
    modalSubtitle: string;
    tabNew: string;
    tabEdit: string;
    tabList: string;
    tabStock: string;
    stockEmpty: string;
    stockLabel: string;
    noProducts: string;
    noSelection: string;
    clearTip: string;
    saleProduct: string;
    pickProduct: string;
    qtyLabel: string;
    totalLabel: string;
    promoProduct: string;
    pickPromoProduct: string;
    promoQty: string;
    modeFree: string;
    modePercent: string;
    modeFixed: string;
    modePercentLabel: string;
    modeFixedLabel: string;
    discountLabel: string;
    saleLabel: string;
    promoLabel: string;
    kassaIncome: string;
    discountWord: string;
    insufficientStock: string;
    cancel: string;
    create: string;
    update: string;
    pickSaleTitle: string;
    pickPromoTitle: string;
    pickerSearchPh: string;
    pickerAllCategories: string;
    pickerNotFound: string;
    pickerCount: string;
    pickerClose: string;
    listEmpty: string;
    listEmptyHint: string;
    editTip: string;
    deleteTip: string;
  };
  confirmDeleteTitle: string;
  confirmDeleteMsg: string;
  loginSuccess: string;
  wrongPassword: string;
  selectAccount: string;
  selectUser: string;
  
  // POS / Fatura Modülü Çevirileri
  tabKassa: string;
  tabFatura: string;
  tabPara: string;
  tabMusteri: string;
  tabUser: string;
  tabHaryt: string;
  tabHesaplama: string;
  tabDoviz: string;
  tabDepder: string;
  tabAmbar: string;
  tabKurye: string;
  tabDiger: string;
  tabAyarlar: string;
  tabLisans: string;
  salesInvoice: string;
  purchaseInvoice: string;
  salesReturnInvoice: string;
  purchaseReturnInvoice: string;
  proformaInvoice: string;
  quotationInvoice: string;
  generalCustomer: string;
  scanBarcodePlaceholder: string;
  addBtn: string;
  productNameCol: string;
  qtyCol: string;
  priceCol: string;
  discountCol: string;
  totalCol: string;
  emptyCartMsg: string;
  itemsCount: string;
  subtotalLabel: string;
  bulkPercentLabel: string;
  amountDueLabel: string;
  cashMethod: string;
  cardMethod: string;
  creditMethod: string;
  splitMethod: string;
  cashReceivedLabel: string;
  changeDueLabel: string;
  exactBtn: string;
  holdDraftBtn: string;
  completeSaleBtn: string;
  searchProductsPlaceholder: string;
  allCategories: string;
  stockLabel: string;
  outOfStock: string;
  saleCompletedToast: string;
  draftHeldToast: string;
  productNotFoundToast: string;
  logoutTooltip: string;
  internalNotePlaceholder: string;

  // POS Terminal & Çek Çıkarma
  posTerminalTitle: string;
  posTerminalConnected: string;
  posDeviceNotConnectedTitle: string;
  posConnectDeviceMsg: string;
  posAnalyzing: string;
  posRetryScan: string;
  posWaitingCard: string;
  posProcessing: string;
  posApproved: string;
  posDeclined: string;
  posAutoPrinting: string;
  posAuthCode: string;
  receiptTitle: string;
  printBtn: string;
  closeBtn: string;
  thanksMsg: string;
}> = {
  tr: {
    windowTitle: "Biznes Hasap",
    languageMenuTitle: "Dil Seçimi",
    otherAccounts: "Diğer hesaplar",
    addAccount: "Hesap ekle",
    userLabel: "Kullanıcı",
    passwordLabel: "Şifre",
    passwordPlaceholder: "Şifrenizi girin",
    loginButton: "Giriş",
    appName: "Biznes hesap",
    version: `v${pkg.version}`,
    delete: "Sil",
    edit: "Düzenle",
    import: "İçeri aktar",
    autoSelectPrinter: "Otomatik seç",
    receiptPrinter: "Çek yazıcı",
    standardPrinter: "Standart yazıcı",
    addAccountTitle: "Yeni Hesap Ekle",
    editAccountTitle: "Hesabı Düzenle",
    accountName: "Hesap / Mağaza Adı",
    couchDbUrl: "CouchDB Adresi",
    databaseName: "Veritabanı Adı",
    save: "Kaydet",
    cancel: "İptal",
    selectLogo: "Logo Seç",
    conn: {
      sectionTitle: "CouchDB Bağlantısı",
      sectionHint: "Kaydetmeden önce bağlantıyı sına ve sunucudaki veriyi çek",
      localTitle: "Yerel bağlantı (aynı Wi-Fi)",
      onlineTitle: "Çevrimiçi bağlantı (alan adı)",
      localPlaceholder: "http://kullanıcı:şifre@192.168.1.8:5984/veritabanı",
      onlinePlaceholder: "http://kullanıcı:şifre@alanadi:5984/veritabanı",
      testOnly: "Yalnızca bağlantıyı sına",
      connect: "Bağlan",
      stop: "Durdur",
      showPassword: "Parolayı göster",
      hidePassword: "Parolayı gizle",
      statusIdle: "Bağlı değil",
      statusConnecting: "Bağlanıyor…",
      statusConnected: "Bağlı",
      statusTested: "Sınandı",
      statusError: "Hata",
      statusOffline: "Çevrimdışı",
      denied: "Erişim reddedildi — kullanıcı/şifre hatalı",
      connecting: "Bağlanılıyor…",
      firstWorking: "Çalışan ilk adres kullanılır.",
      singleConnectionNote: "Aynı anda tek bağlantı açık olur; diğeri otomatik kapanır. Uygulama yeniden açıldığında son kullanılan bağlantı otomatik başlar.",
      progressTransferring: "Aktarılıyor…",
      progressDone: "Aktarım tamamlandı",
      docsReceived: "{count} belge alındı",
      docsSent: "{count} belge gönderildi",
      liveContinues: "Canlı eşitleme devam ediyor",
      liveAfterTransfer: "Canlı eşitleme aktarım bitince başlayacak",
      mergeTitle: "Veriler birleştirilsin mi?",
      mergeLocalCount: "bu telefonda",
      mergeRemoteCount: "sunucuda kayıt var.",
      mergeKeep: "Birleştir",
      mergeKeepHint: "İki taraftaki kayıtlar tek veritabanında birleşir.",
      mergeServerOnly: "Yalnızca sunucu",
      mergeServerOnlyHint: "Telefondaki kayıtlar silinir, sunucudakiler alınır.",
      noAccount: "Hesap seçilmedi.",
      shareNote: "{name} · veriler bilgisayarındaki sunucuyla paylaşılır",
      panelNote: "Aynı anda tek bağlantı açık olur; diğeri otomatik kapanır. Yeşil ikona tekrar basarsanız bağlantı durur. Uygulama yeniden açıldığında son kullanılan bağlantı otomatik başlar.",
    },
    confirmDeleteTitle: "Hesabı Sil",
    confirmDeleteMsg: "Bu hesabı ve ilişkili verileri silmek istediğinizden emin misiniz?",
    loginSuccess: "Giriş başarılı!",
    wrongPassword: "Hatalı şifre!",
    selectAccount: "Hesap Seçin",
    selectUser: "Kullanıcı Seçin",

    tabKassa: "Kasa",
    tabFatura: "Fatura",
    tabPara: "Kasa",
    tabMusteri: "Müşteri",
    tabUser: "Kullanıcı",
    tabHaryt: "Ürün",
    tabHesaplama: "Hesaplama",
    tabDoviz: "Döviz",

    tabDepder: "Defter",
    tabAmbar: "Ambar",
    tabKurye: "Kurye",
    tabDiger: "Diğer",
    tabAyarlar: "Ayarlar",
    tabLisans: "Lisans / Key",
    salesInvoice: "Satış Faturası",
    purchaseInvoice: "Alış Faturası",
    salesReturnInvoice: "Satış İade Faturası",
    purchaseReturnInvoice: "Alış İade Faturası",
    proformaInvoice: "Proforma Fatura",
    quotationInvoice: "Fiyat Teklifi",
    generalCustomer: "Genel Müşteri (Nakit)",
    scanBarcodePlaceholder: "Barkod okutun veya yazın...",
    addBtn: "Ekle +",
    productNameCol: "Ürün Adı",
    qtyCol: "Adet",
    priceCol: "Fiyat",
    discountCol: "+ / - %",
    totalCol: "Toplam",
    emptyCartMsg: "Sepet boş. Barkod okutun veya sağdan ürün seçin.",
    itemsCount: "Kalem",
    subtotalLabel: "Ara Toplam:",
    bulkPercentLabel: "Toplu %",
    amountDueLabel: "ÖDENECEK TUTAR",
    cashMethod: "Nakit",
    cardMethod: "Kart",
    creditMethod: "Veresiye",
    splitMethod: "Parçalı",
    cashReceivedLabel: "Alınan Nakit",
    changeDueLabel: "Para Üstü",
    exactBtn: "Tam Tutar",
    holdDraftBtn: "Taslak Kaydet",
    completeSaleBtn: "Satışı Tamamla (F2)",
    searchProductsPlaceholder: "Ürün ara...",
    allCategories: "Tümü",
    stockLabel: "Stok",
    outOfStock: "Stokta Yok",
    saleCompletedToast: "Satış Başarıyla Tamamlandı!",
    draftHeldToast: "Fatura taslak olarak askıya alındı.",
    productNotFoundToast: '"{code}" barkodlu ürün bulunamadı.',
    logoutTooltip: "Oturumu Kapat",
    internalNotePlaceholder: "Not yaz...",

    posTerminalTitle: "Banka Kart Terminali (POS)",
    posTerminalConnected: "Kart Terminali Bağlı (Hazır)",
    posDeviceNotConnectedTitle: "Kart Terminali Bağlı Değil!",
    posConnectDeviceMsg: "Lütfen kartla ödeme alan cihazı (POS cihazını) bilgisayara bağlayıp tekrar deneyiniz.",
    posAnalyzing: "Cihaz Bağlantısı Kontrol Ediliyor...",
    posRetryScan: "Cihazı Yeniden Tara",
    posWaitingCard: "Müşteri Kartı Bekleniyor (Temassız / Çip)...",
    posProcessing: "Ödeme İşleniyor, Lütfen Bekleyin...",
    posApproved: "Ödeme Başarıyla Kabul Edildi!",
    posDeclined: "Ödeme Reddedildi / İptal Edildi",
    posAutoPrinting: "Satış Çeki Otomatik Yazdırılıyor...",
    posAuthCode: "Onay Kodu",
    receiptTitle: "SATIŞ FİŞİ / ÇEK",
    printBtn: "Yazdır (Print)",
    closeBtn: "Kapat / Yeni Satış",
    thanksMsg: "Bizi tercih ettiğiniz için teşekkür ederiz!",
    pos: {
      paymentCancelled: "Ödeme iptal edildi",
      newSale: "Yeni Satış",
      noPermission: "Yetkiniz yok",
      noStock: "Stok yok. Eksi satış için üründe ikonu açın.",
      inactiveProduct: "Bu ürün pasif — sepete eklenemez.",
      resetDone: "Tüm değişiklikler geri alındı.",
      cartEmptyExport: "Sepet boş — dışa aktarılamaz.",
      excelExported: "Excel dışa aktarıldı.",
      exportCancelled: "Dışa aktarma iptal edildi.",
      exportDialogTitle: "Fatura Excel Dışa Aktarma",
      exportFailed: "Excel dışa aktarma başarısız.",
      belowCost: "Alış fiyatının altına satılamaz (alış: {cost}).",
      selectCustomer: "Müşteri seçin",
      cartEmpty: "Sepet boş",
      cartEmptyAddFirst: "Sepet boş. Önce ürün ekleyin.",
      specialPriceMissing: "Özel fiyat girilmedi",
      specialPriceSaved: "{count} ürünün özel fiyatı {customer} için kaydedildi",
      priceSaveFailed: "Fiyat kaydedilmedi",
      specialPriceNotFound: "Müşterinin veya ürünlerin özel fiyatı bulunamadı",
      pricesApplied: "{count} ürünün fiyatı uygulandı",
      printFailed: "Çap başarısız: {reason}",
      unknownError: "bilinmeyen hata",
      compositionShort: "Kompozisyon stoğu yetersiz: {list}",
      dateBeforeStart: "Bu tarihte işlem açılmadı (başlangıç: {date}).",
      dateAfterEnd: "İşlem dönemi bitti (son: {date}).",
      cashSaleBlocked: "Bu müşteriye nakit satış yapılamaz.",
      creditLimitExceeded: "Kredi limiti aşılıyor (limit: {limit} TMT).",
      nothingToReset: "Temizlenecek değişiklik yok",
      paneCart: "Sepet",
      panePay: "Ödeme",
      goToPayment: "Ödemeye geç",
      resetTitle: "Geri Al",
      resetMsg: "Mevcut ekrandaki tüm değişiklikler (seçilen ürünler, müşteri, fiyat tipi, ödeme) temizlenir. Devam etmek istiyor musunuz?",
      resetCancel: "İptal",
      resetConfirm: "Geri Al",
      fabAddProduct: "Ürün ekle",
      fabAddCustomer: "Müşteri ekle",
      fabAddMoney: "İşlem ekle",
      fabAddCourier: "Kurye ekle",
      fabAddCurrency: "Para birimi ekle",
      fabAdd: "Ekle",
      alertsTitle: "Uyarılar",
      alertsCount: "{count} uyarı",
      alertsAttention: "{count} adet dikkat gerektiriyor",
      alertsAllOk: "Her şey yolunda",
      alertsEmpty: "Şu anda uyarı yok",
      alertsEmptyHint: "Kritik stok veya vadesi yaklaşan borç yok.",
      alertsLowStock: "Stoğu azalan ürünler",
      alertsNoCritical: "Kritik stok yok",
      alertsCriticalLevel: "Kritik seviye",
      alertsMinus: "EKSİ",
      alertsDueCredits: "Vadesi yaklaşan veresiyeler",
      alertsNoDue: "Vadesi yakın borç yok",
      alertsOverdue: "VADESİ GEÇTİ",
      alertsToday: "BUGÜN",
      dueOverdue: "{days} gün gecikti",
      dueToday: "Bugün",
      dueDaysLeft: "{days} gün kaldı",
      csTitle: "Müşteri Ara",
      csFoundHeader: "Bulunan: {count} müşteri",
      csFound: "Bulunan: {count} müşteri",
      csSearchLabel: "Arama",
      csSearchPlaceholder: "Ad / telefon...",
      csStartsWith: "Kelimenin başından ara",
      csWhoLabel: "Kimler aransın?",
      csBadgeCustomer: "Müşteri",
      csWhoBoth: "Müşteri + İşgören",
      csBadgeEmployee: "İşgören",
      csRegionLabel: "Bölge",
      csAll: "Tümü",
      csDebtLabel: "Borç durumu",
      csDebtHas: "Borcu var",
      csDebtNone: "Borcu yok",
      csDebtOverdue: "Vadesi geçmiş",
      csNotFound: "Müşteri bulunamadı",
      psTitle: "Ürün Ara",
      psFoundHeader: "Bulunan: {count} ürün",
      psFound: "Bulunan: {count} ürün",
      psSearchLabel: "Arama",
      psSearchPlaceholder: "Ad / kod / barkod...",
      psWarehouseLabel: "Ambar",
      psCategoryLabel: "Kategori",
      psAll: "Tümü",
      psBarcodeStatus: "Barkod durumu",
      psBsWith: "Olanlar",
      psBsWithout: "Olmayanlar",
      psStockStatus: "Stok durumu",
      psSsInStock: "Stokta var",
      psSsOut: "Stok bitti",
      psSsCritical: "Kritik stok",
      psNotFound: "Ürün bulunamadı",
      psStock: "Stok",
      psClose: "Kapat",
      dpTitle: "Yazdır — {no}",
      dpPreview: "Önizleme",
      dpPrinter: "Yazıcı",
      dpDefaultPrinter: "Varsayılan (varsayılan)",
      dpPrintBtn: "Yazdır",
      dpPrinted: "Yazdırıldı.",
      dpPrintFailed: "Yazdırma başarısız.",
      dpNote: "Tutar ve fiyatlar mevcut sepete göre. Fatura tamamlanmadı — yalnızca taslak yazdırma.",
      faSaveTip: "Faturayı kaydet (taslak)",
      faSaveLabel: "Faturayı Kaydet",
      faDraftsTip: "Taslak faturalar",
      faDraftsLabel: "Taslak Faturalar",
      faSoundOnTip: "Bildirim sesi açık — kapatmak için bas",
      faSoundOffTip: "Bildirim sesi kapalı — açmak için bas",
      msWarehouseTip: "Ambar seç",
      msWarehouse: "Ambar",
      msTargetTip: "Hedef ambarı seç",
      msTargetDisabledTip: "Sadece \"Ambarlar arası hareket\" için aktif",
      msWarehouse2: "Ambar 2",
      msTransferNote: "Ambarlar arası transfer: 1. ambardan 2. ambara",
      changeTip: "Para üstü: Alınan nakit − ödenecek",
      changeLabel: "Para üstü",
      ledgerTip: "Defter seç",
      ledgerOption: "Defter",
      swLabel: "Tarih / Saat",
      swPickTip: "Tarih ve saati elle seç",
      swNowTip: "Şimdiki ana dön",
      swManualTip: "Elle seçilen zaman",
      swLiveTip: "Şimdiki zaman",
      shortcutsTitle: "Klavye Kısayolları",
      shortcutsHint: "ESC veya dışına tıklayarak kapatın",
      emptySection: "Bu bölüm şimdilik boş",
      emptySectionHint: "Yakında içerik eklenecek.",
      icbMenuTitle: "Fatura Tipi / Belgesi",
      icbCustomerSearchTip: "Müşteri ara (F2)",
      icbAddTip: "Ürün ekle (Enter)",
      icbClearCodeTip: "Kodu kaldır",
      icbNewCodeTip: "Yeni kod üret",
      icbCopiesTip: "Fiş adedi",
      icbCopiesNone: "Fiş yazdırma",
      icbCopiesCount: "{count} adet fiş",
      printerSettingsTip: "Yazıcı Ayarları",
      generalSearchTip: "Genel Arama",
      unitCol: "Ölçü",
      switchAccount: "Hesap Değiştir",
      cameraScanTip: "Kamera ile barkod okut",
      gridView: "Grid Görünümü",
      listView: "Liste Görünümü",
      cardScanningPorts: "USB / COM / LAN portları taranıyor...",
      cardTestModeTip: "Test amaçlı cihazı bağlı kabul et",
      cardTestMode: "Test Modu",
      cardWaitingBefore: "Müşteri kartını cihaza okutmalıdır. Cihaz ödemeyi onaylayınca aşağıdaki",
      cardApprove: "Onayla",
      cardWaitingAfter: "butonuna basınız.",
      cardBankApproval: "Banka Onayı Alınıyor...",
      cardPaymentFailed: "Ödeme tamamlanamadı.",
      cardApproveBtn: "Ödeme Kabul Edildi & Çek Çıkar (Enter)",
    },
    invoices: {
      title: "Fatura Listesi",
      subtitle: "Satıra iki kez tıkla → faturayı aç, sonra F11 (Excel) veya F12 (yazdır)",
      filterToday: "Bugün",
      filterYesterday: "Dün",
      filterThisWeek: "Bu Hafta",
      filterThisMonth: "Bu Ay",
      filterAll: "Tümü",
      rangeTitle: "Tarih Aralığı",
      presetTooltip: "Hazır tarih aralığı seç",
      presetMenuTitle: "Hazır Tarih Aralığı Seç",
      presetToday: "Bugün",
      presetYesterday: "Dün",
      presetDayBefore: "Evvelsi gün",
      presetThisWeek: "Bu hafta",
      presetThisMonth: "Bu ay",
      presetThisYear: "Bu yıl",
      presetLastWeek: "Geçen hafta",
      presetLastMonth: "Geçen ay",
      presetSinceYesterday: "Dünden bu yana",
      presetSinceDayBefore: "Evvelsiden bu yana",
      presetSinceLastWeek: "Geçen hafta başından beri",
      presetSinceLastMonth: "Geçen ay başından beri",
      presetLastYear: "Geçen yıl",
      searchPlaceholder: "Fatura no, müşteri adı ile ara...",
      typeLabel: "Fatura Tipi:",
      typeSales: "Satış Faturası",
      typeAll: "Tüm Tipler",
      typePurchase: "Alış Faturası",
      typeReturns: "İadeler",
      typeTransfer: "Transfer",
      typeOther: "Diğer Giriş/Çıkış",
      statsTotal: "Toplam Fatura",
      statsCountSuffix: "adet",
      statsAmount: "Toplam Tutar",
      payCash: "Nakit",
      payCard: "Kart",
      payCredit: "Veresiye",
      paySplit: "Parçalı",
      voidedToggleTip: "İptal edilen faturaları göster / gizle",
      voidedToggle: "İptaller",
      emptyTitle: "Seçili filtrelere uygun fatura bulunamadı.",
      emptyHint: "Filtreleri değiştirerek tekrar deneyebilirsiniz.",
      colNo: "Fatura No",
      colDate: "Tarih / Saat",
      colCustomer: "Müşteri",
      colType: "Tip",
      colPayment: "Ödeme",
      colItems: "Kalem",
      colAmount: "Tutar",
      colAction: "İşlem",
      rowOpenTip: "Faturayı açmak için iki kez tıklayın",
      receiptOpenTip: "Faturayı açmak için tıklayın",
      voidedBadge: "İptal",
      returnBadge: "İade",
      deleteTip: "Faturayı sil",
      footerHint: "Fatura detayını veya fişi görüntülemek için satıra tıklayın.",
      closeBtn: "Kapat (Esc)",
      deleteTitle: "Faturayı Sil",
      deleteMsg: "Bu faturayı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.",
      deleteCascade: "Faturaya bağlı ambar stoğu, müşteri borcu ve Kassa/Defter kayıtları da geri alınacaktır.",
      customerLabel: "Müşteri",
      cancelBtn: "Vazgeç",
      confirmDeleteBtn: "Evet, sil",
      deletedTitle: "Silinen Faturalar",
      deletedEmpty: "Silinmiş fatura yok.",
      deletedColNo: "Fatura No",
      deletedColDate: "Tarih",
      deletedColAmount: "Tutar",
      deletedColAt: "Silinme Tarihi",
      deletedColBy: "Silen",
      closeShort: "Kapat",
      deleteSelected: "Seçilenleri sil ({count})",
      deleteAll: "Hepsini Sil",
      permTitle: "Kalıcı Olarak Silme",
      permAllMsg: "Tüm silinmiş faturaları kalıcı olarak siler. Bu işlem geri alınamaz. Devam etmek istiyor musunuz?",
      permSelectedMsg: "Seçilen {count} faturayı kalıcı olarak siler. Bu işlem geri alınamaz. Devam etmek istiyor musunuz?",
      permCancel: "İptal",
      permConfirm: "Sil",
    },
    kassa: {
      cashIn: "Para Girişi",
      cashOut: "Para Çıkışı",
      noExpensePerm: "Gider ekleme yetkiniz yok.",
      noIncomePerm: "Gelir ekleme yetkiniz yok.",
      noCategoryPerm: "Bu kategori için yetkiniz yok.",
      shownCount: "{count} işlem gösteriliyor",
      today: "Bugün",
      balanceCard: "Kasadaki bakiye",
      todayIncome: "Bugünkü giriş",
      todayExpense: "Bugünkü çıkış",
      cashLabel: "Nakit",
      cardLabel: "Kart/Havale",
      deleteMsg: "Bu kasa hareketini silmek istiyor musunuz?",
      editTip: "Düzenle",
      deleteTip: "Sil",
      searchPlaceholder: "Açıklama veya kategoriye göre ara...",
      advancedSearchTip: "Gelişmiş arama (F3)",
      all: "Tümü",
      income: "Gelir",
      expense: "Gider",
      allCategories: "Tüm kategoriler",
      allCustomers: "Tüm müşteriler",
      dateStartTip: "Başlangıç tarihi",
      dateEndTip: "Bitiş tarihi",
      clear: "Temizle",
      empty: "Hareket bulunamadı",
      colDate: "Tarih / Saat",
      colType: "Tür",
      colCategory: "Kategori",
      colCustomer: "Müşteri / Tedarikçi",
      colPayment: "Ödeme türü",
      colAmount: "Tutar",
      colDesc: "Açıklama",
      colAction: "İşlem",
      incomeBadge: "↑ Gelir",
      expenseBadge: "↓ Gider",
      editTitle: "Hareketi düzenle",
      addIncomeTitle: "Gelir ekle",
      addExpenseTitle: "Gider ekle",
      dateLabel: "Tarih",
      searchTitle: "Kasa Hareketi Ara",
      foundPrefix: "Bulunan: ",
      txSuffix: "hareket",
      noteLabel: "Açıklama",
      notePlaceholder: "Açıklama / müşteri / fatura...",
      dateRange: "Tarih aralığı",
      allShort: "Tümü",
      none: "Hiçbiri",
      payCard: "Kart",
      payTransfer: "Havale",
      customerLabel: "Müşteri",
      userLabel: "Kullanıcı",
      ledgerLabel: "Defter",
      currencyLabel: "Para birimi",
      onlyDue: "Sadece vadeli (veresiye) hareketler",
      searchOrType: "Ara veya yaz...",
      quickAdd: "Kayıtta yok — yeni ekle: \"{name}\"",
      debtLabel: "Borç",
      creditLabel: "Alacak (kredi)",
      settledLabel: "Hesap temiz",
      customerOptional: "Müşteri (isteğe bağlı)",
      supplierOptional: "Tedarikçi (isteğe bağlı)",
      fromWhom: "Kimden",
      toWhom: "Kime",
      staffLabel: "Personel",
      selectOption: "— Seç —",
      staffNameLabel: "Personel adı (kayıtlı değil)",
      subCategoryLabel: "Alt kategori",
      errAmount: "Tutar 0'dan büyük olmalı.",
      errDate: "Tarih seçin.",
      errCustomer: "Müşteri seçin.",
      errPerson: "Kimle ilgili olduğunu yazın.",
    },
    hasaplama: {
      title: "Hesaplama",
      result: "Sonuç",
      period: "Dönem",
      periodToday: "Bugün",
      periodWeek: "Bu hafta",
      periodMonth: "Bu ay",
      periodLastMonth: "Geçen ay",
      periodQuarter: "Çeyrek",
      periodYear: "Yıl",
      periodCustom: "Özel aralık",
      tabXaccot: "X-Accot (günlük)",
      tabPl: "Kâr-zarar raporu",
      tabDebt: "Borç-alacak raporu",
      tabStock: "Stok raporu",
      tabCash: "Kasa raporu",
      tabTargow: "Kurye sonuçları",
      summaryHideTip: "Özet kartları gizle — rapora daha çok yer",
      summaryShowTip: "Özet kartları göster",
      summaryHide: "Özeti gizle",
      summaryShow: "Özeti göster",
      printBtn: "Yazdır",
      excelBtn: "Excel'e aktar",
      preparedAt: "Hazırlandı:",
      noDataPeriod: "Bu dönem için veri yok",
      income: "Gelir",
      expense: "Gider",
      incomeCaps: "GELİR",
      expenseCaps: "GİDER",
      incomeTotal: "Gelir toplamı",
      expenseTotal: "Gider toplamı",
      incomeItems: "Gelir kalemleri",
      expenseItems: "Gider kalemleri",
      noIncome: "Gelir yok",
      noExpense: "Gider yok",
      incomeMinusExpense: "Gelir − Gider",
      netProfit: "Net kâr",
      netProfitFooter: "Net kâr: {amount} TMT",
      periodMovement: "Dönem içi hareket (gelir / gider)",
      colDesc: "Açıklama",
      colCount: "Adet",
      colAmountTmt: "Tutar (TMT)",
      colCategory: "Kategori",
      colCustomer: "Müşteri",
      colDebtTmt: "Borç (TMT)",
      colLastPayment: "Son ödeme",
      totalReceivable: "Toplam alacak",
      supplierDebt: "Tedarikçilere borç",
      borrowed: "Alınan borç (Borç almak)",
      lent: "Verilen borç (Borç vermek)",
      receivablesTitle: "Müşterilerden alınacak (veresiye)",
      noDebt: "Borç yok — tüm hesaplar temiz",
      overdueTitle: "Vadesi geçen borçlar",
      noOverdue: "Vadesi geçen borç yok",
      colInvoiceNo: "Fatura №",
      colDueDate: "Vade tarihi",
      colLate: "Gecikme",
      daysLate: "{days} gün",
      totalReceivableFooter: "Toplam alacak: {amount} TMT",
      colProduct: "Ürün",
      colQty: "Adet",
      colPurchase: "Alış",
      colPurchaseValue: "Alış değeri",
      colSaleValue: "Satış değeri",
      skuCount: "Ürün çeşidi",
      totalQty: "Toplam adet",
      byPurchasePrice: "Alış fiyatına göre",
      bySalePrice: "Satış fiyatına göre",
      stockState: "Ürün stoğu",
      filterAll: "Tümü",
      filterPositive: "+ (artı)",
      filterNegative: "− (eksi)",
      stockCountLabel: "{shown} / {total} ürün",
      noStockKind: "Bu türde ürün yok",
      colStock: "Stok",
      colSale: "Satış",
      colStockValue: "Stok değeri (satış)",
      colAction: "İşlem",
      showTip: "Göster",
      createInvoiceTip: "Fatura oluştur",
      criticalStockLabel: "Kritik stok:",
      expiryLabel: "SKT:",
      purchasePriceLabel: "Alış fiyatı:",
      wholesaleLabel: "Toptan fiyatı:",
      barcodeLabel: "Barkod:",
      belowCritical: "Kritik stok seviyesinin altında ({count})",
      bestSellers: "En çok satan ürünler",
      worstSellers: "En az satan ürünler",
      noSalesPeriod: "Bu dönem için satış verisi yok",
      purchaseValueFooter: "Toplam alış değeri: {amount} TMT",
      colLedger: "Defter",
      colCurrency: "Para birimi",
      colBalance: "Bakiye",
      byLedgers: "Defterlere göre",
      noLedgers: "Defter yok",
      paymentMethodIncome: "Ödeme türü (gelir)",
      noIncomePeriod: "Bu dönem için gelir yok",
      totalBalanceFooter: "Toplam bakiye: {amount} TMT",
      colTargow: "Kurye",
      colOrderCount: "Sipariş adedi",
      colTotalAmount: "Toplam tutar (TMT)",
      colTotalAmountShort: "Toplam tutar",
      colNewCustomer: "Yeni müşteri",
      colRank: "Sıra",
      noTargows: "Kurye yok",
      fullViewInTargow: "Tam görünüm Kurye bölümünde",
      totalFooter: "Toplam: {amount} TMT",
      xaccotTitle: "X-Accot · günlük iş",
      xaccotPrintTitle: "X-ACCOT (Günlük iş)",
      cardInvoices: "Fatura adedi",
      cardSalesTotal: "Satış toplamı",
      cardCash: "Nakit",
      cardCard: "Kart",
      cardCredit: "Veresiye",
      cardKassaIncome: "Kasa girişi",
      cardKassaExpense: "Kasa çıkışı",
      cardNet: "Net",
      salesTotalTmt: "Satış toplamı (TMT)",
      colValue: "Değer",
      netFooter: "Net: {amount} TMT · {count} fatura",
      dayInvoices: "Günün faturaları ({count})",
      allDayInvoices: "Günün tüm faturaları ({count})",
      noInvoicesToday: "Bu gün için fatura yok",
      colTime: "Saat",
      colPayment: "Ödeme",
      dayBestSellers: "Günün en çok satan ürünleri",
      noSalesToday: "Bu gün için satış yok",
      productKindsSuffix: "{count} ürün çeşidi",
      calculator: "Hesap Makinesi",
      currencyLabel: "Para birimi",
      totalIncome: "Toplam gelir",
      totalExpense: "Toplam gider",
      stockValue: "Stoktaki ürünlerin değeri",
      ledgerBalance: "Kasadaki / Defterdeki bakiye",
    },
    sazlamalar: {
      sectionGeneral: "Genel Ayarlar",
      resetToDefaults: "Varsayılanlara Dön",
      unitNameRequired: "Ad giriniň.",
      unitNameRequiredEdit: "Ad girin.",
      unitExists: "Bu ölçü birimi zaten var.",
      unitInUse: "\"{name}\" kullanılıyor, silinemez.",
      unitNewPh: "Yeni birim (örn: RULON)",
      unitAdd: "Birim ekle",
      unitColName: "Ad",
      unitColUsedBy: "Kullanan ürün",
      unitColAction: "İşlem",
      unitEditTitle: "Düzenle",
      unitFixedNoDelete: "Sabit birim silinemez",
      unitRuleHint: "Bir birim ürünlerde kullanılıyorsa silinemez. Sabit birimler de silinemez.",
      settingsTitle: "Ayarlar",
      secPrinter: "Yazıcı ayarları",
      secScale: "Terazi ayarları",
      secReceipt: "Fiş ayarları",
      secPermissions: "Yetkiler",
      secUnits: "Ölçü birimleri",
      secRules: "Kurallar",
      secDeleted: "Silinen faturalar",
      secSync: "Bulut eşitleme",
      secAudit: "İşlem günlüğü",
      secGeneral: "Genel ayarlar",
      unsavedTitle: "Kaydedilmemiş değişiklikler var, devam etmek istiyor musunuz?",
      unsavedHint: "Bölümü değiştirirseniz mevcut değişiklikler kaybolur.",
      cancelBtn: "İptal",
      continueBtn: "Devam et",
      saveBarDirty: "Kaydedilmemiş değişiklikler var",
      saveBarClean: "Değişiklik yok",
      saveBtn: "Kaydet",
      noEditPerm: "Ayarları değiştirme yetkiniz yok.",
      saved: "Ayarlar kaydedildi.",
      backupSaveTitle: "Yedeği kaydet",
      backupFilterName: "Biznes Hasap yedeği (.bhbak)",
      backupSaved: "Yedek .bhbak dosyası kaydedildi.",
      exportCancelled: "Dışa aktarma iptal edildi.",
      exportFailed: "Dışa aktarma başarısız.",
      importDone: "{count} kayıt içe aktarıldı. Sayfayı yenileyin.",
      importFailed: "İçe aktarma başarısız: yalnızca .bhbak (veya eski .json yedek) kabul edilir.",
      loading: "Ayarlar yükleniyor...",
      genDesc: "Dil, para birimi ve tarih biçimi",
      genLanguage: "Dil",
      genDateFormat: "Tarih ve saat biçimi",
      genBaseCurrency: "Ana para birimi",
      genBaseCurrencyHint: "Sistem ana para birimi değiştirilemez",
      genGoToCurrency: "Para birimi ayarlarına git",
      backupTitle: "Yedek",
      backupDesc: "Verilerin otomatik yedeklenmesi",
      backupAuto: "Otomatik yedek",
      backupAutoDesc: "Veriler belirlenen sıklıkta yedeklenir",
      backupFreq: "Sıklık",
      backupDaily: "Günlük",
      backupWeekly: "Haftalık",
      backupFolder: "Yedek klasörü",
      dataTitle: "Veriler",
      dataDesc: "Yedek .bhbak dosyası — yalnızca Biznes Hasap açabilir (zip/json değil)",
      dataExport: "Verileri dışa aktar",
      dataImport: "Verileri içe aktar",
      aboutTitle: "Sistem hakkında",
      aboutDesc: "Program sürümü ve lisans bilgisi",
      aboutVersion: "Sürüm",
      aboutLicense: "Lisans",
      aboutLicenseValue: "Biznes Hasap · Sanly",
      encTitle: "Veritabanı şifreleme",
      encDesc: "Veriler, lisans anahtarından türetilen parola ile şifrelenir",
      encEnabledNotice: "Şifreleme etkin. Veritabanı şifreli saklanır; lisanssız cihazda açılmaz.",
      encWarn1: "Şifreleme açıldıktan sonra lisanssız cihazda veri okunamaz.",
      encWarn2: "Devam etmeden önce yedek (.bhbak) alın.",
      encWarn3: "Bulut eşitleme kullanılıyorsa uzak sunucuda veri şifreli kalır.",
      encWarn4: "Kaynak (şifresiz) veritabanı SİLİNMEZ — istediğiniz zaman şifrelemeyi kapatıp dönebilirsiniz.",
      encMigrating: "Taşınıyor... {done}/{total} veritabanı",
      encDone: "Taşıma tamamlandı: {count} kayıt kopyalandı ve doğrulandı. Kaynak veritabanları korundu.",
      encFailed: "{count} kayıt taşınamadı — şifreleme AÇILMADI. Hiçbir veri kaybolmadı.",
      encDisabledNotice: "Şifreleme kapatıldı. Program yeniden açıldığında önceki (şifresiz) veritabanı kullanılır.",
      encRestart: "Yeniden başlat (değişikliğin geçerli olması için)",
      encEnable: "Veritabanını şifrele",
      encDisable: "Şifrelemeyi kapat",
      encConfirmEnableTitle: "Tüm hesapların verileri şifreli veritabanına KOPYALANIR. Devam edilsin mi?",
      encConfirmEnableHint: "Kaynak veritabanı silinmez. Lisanssız cihazda şifreli veri açılmaz.",
      encConfirmDisableTitle: "Şifreleme kapatılsın mı?",
      encConfirmDisableHint: "Program yeniden açıldığında önceki (şifresiz) veritabanı kullanılır. Veri kaybolmaz.",
      firmTitle: "Firma bilgileri",
      firmDesc: "Ad, kod, ünvan, telefon, faks, adres ve KDV oranı",
      firmName: "Firma adı",
      firmCode: "Firma kodu",
      firmTitleField: "Ünvan (başlık)",
      firmPhone: "Telefon",
      firmFax: "Faks",
      firmAddress: "Adres",
      firmTax: "KDV oranı (%)",
      opsTitle: "İşlem kuralları",
      opsDesc: "Pasif kayıtlar, alış fiyatı, vade süresi ve tarihler",
      opsInactiveCustomer: "Pasif müşteriyi fatura/kasada kullan",
      opsInactiveProduct: "Pasif ürünü sepete ekle",
      opsBelowCost: "Alış fiyatının altına sat",
      creditMin: "Vade süresi (en az gün)",
      creditMax: "Vade süresi (en çok gün)",
      creditDefault: "Vade süresi (varsayılan gün)",
      opStart: "İşlem başlangıç tarihi (boş = açık)",
      opEnd: "İşlem bitiş tarihi (boş = açık)",
      barcodeTitle: "Barkod okuyucu",
      barcodeDesc: "Okuyucunun eklediği prefix/suffix karakterlerini temizle",
      barcodePrefix: "Prefix (baştaki karakterler)",
      barcodeSuffix: "Suffix (sondaki karakterler)",
      prKindStandard: "Standart yazıcı",
      prKindReceipt: "Fiş yazıcısı",
      prBtConnected: "Bluetooth yazıcı bağlandı: {name}",
      prBtFailed: "Bluetooth bağlanamadı: {error}",
      prBtScanDone: "Tarama bitti — listeden yazıcını seç.",
      prBtScanFailed: "Tarama başarısız: {error}",
      prBtPicked: "Bağlandı: {name} — deneme baskısı yap.",
      prBtPickFailed: "Bağlanamadı: {error}",
      prBtTestSent: "Deneme fişi gönderildi — yazıcıya bak.",
      prBtNotConnected: "Yazıcı bağlı değil. Önce bağlan.",
      prDesktopOnly: "Yazıcılar yalnızca masaüstü (Electron) programda görülebilir.",
      prNone: "Hiç yazıcı bulunamadı. Windows'ta yazıcı ekleyin.",
      prTestDesktopOnly: "Test yazdırma yalnızca masaüstü programda kullanılabilir.",
      prTestSent: "Test yazdırma gönderildi — yazıcıyı kontrol edin.",
      prTestFailed: "Yazdırma başarısız: {reason}",
      prUnknownError: "bilinmeyen hata",
      prStatusTitle: "Yazıcı durumu",
      prStatusDesc: "Sistemde bulunan yazıcılar ve bağlantı durumu",
      statusConnected: "Bağlı",
      statusDisconnected: "Bağlı değil",
      prRefresh: "Yazıcıları yenile",
      prFound: "{count} yazıcı bulundu",
      prBrowserMode: "Tarayıcı modu",
      prDefault: "Varsayılan",
      prSettingsDesc: "Varsayılan yazıcı ve yazdırma biçimi",
      prBtName: "Bluetooth termal yazıcı",
      prBtSub: "58/80mm mobil yazıcı (XPrinter uyumlu)",
      btConnected: "Bağlı",
      btNone: "Yok",
      btScanning: "Taranıyor...",
      btScan: "Cihazları tara",
      btDisconnect: "Kes",
      btPickConnect: "Seç-bağlan",
      btScanHint: "Yakındaki Bluetooth cihazlar aranıyor... yazıcıyı açıp eşleşme moduna al.",
      btConnect: "Bağlan ›",
      btPrinting: "Basılıyor...",
      btTestPrint: "Deneme fişi bas",
      btUsbHint: "USB yazıcı: OTG kablosuyla tak, Android sistem penceresinden izin ver — fiş yine bu uygulamadan basılır.",
      btWifiHint: "Ağ (WiFi) yazıcı: aynı ağda ol, IP'yi Bağlantı → Ağ bölümüne yaz.",
      btClassicHint: "Eski tip (klasik) Bluetooth yazıcılar listede görünmez — BLE destekli termal yazıcı gerekir.",
      prDefaultPrinter: "Varsayılan yazıcı",
      selectOption: "— Seç —",
      prKindLabel: "Yazıcı türü",
      prPaperWidth: "Kağıt genişliği",
      prPaperWidthHint: "Termal fiş yazıcıları için",
      prConnection: "Bağlantı türü",
      prNetwork: "Ağ (IP)",
      prIp: "IP adres",
      prPort: "Port",
      prTesting: "Yazdırılıyor...",
      prTest: "Test yazdır",
      scDesktopOnly: "Terazi kontrolü yalnızca masaüstü programda kullanılabilir.",
      scMobileNote: "Telefonda seri port (COM) yok. Bluetooth teraziler bir sonraki sürümde eklenecek — şimdilik kiloyu el ile gir.",
      scStatusTitle: "Terazi durumu",
      scStatusDesc: "Cihazla iletişimi kontrol edin",
      scTesting: "Kontrol ediliyor...",
      scTest: "Test",
      scTestHint: "Anlık ağırlık okuma kontrolü",
      scSettingsDesc: "Port, model ve ölçü birimi",
      scPort: "Bağlantı portu",
      scModel: "Terazi modeli / markası",
      scCustomModelNote: "Özel protokol için marka adını girin (örn.: KELLER, RADWAG).",
      scUnit: "Ölçü birimi",
      scKg: "kilogram (kg)",
      scG: "gram (g)",
      scAutoRead: "Otomatik ağırlık alma",
      scAutoReadDesc: "Ürün / Fatura ekranlarında ölçülen ağırlık otomatik çekilsin",
      rcErrType: "Yalnızca PNG veya JPG görsel kabul edilir.",
      rcErrSize: "Görsel boyutu 2 MB'dan büyük olmamalı.",
      rcTabThermal: "Termal fiş (80mm)",
      rcTabStandard: "Standart yazdırma (A4)",
      rcLogoTitle: "Logo",
      rcLogoDesc: "Her iki yazdırma biçiminde de kullanılan görsel (PNG/JPG, en fazla 2 MB)",
      rcLogoUpload: "Logo yükle",
      rcRemove: "Kaldır",
      rcLogoWidth: "Logo genişliği (px; 0 = varsayılan)",
      rcLogoCenter: "Logoyu ortala",
      rcCenter: "Ortada",
      rcLeft: "Solda",
      rcCompanyTitle: "Firma bilgileri",
      rcCompanyDesc: "İki yazdırma biçiminde de tek kaynaktan gelir",
      rcCompanyName: "Firma adı",
      rcAddress: "Adresi",
      rcPhone: "Telefon numarası",
      rcTaxId: "Vergi numarası / STIR",
      rcPreview: "Önizleme ({paper})",
      thShowLogo: "Logo göster",
      thShowAddress: "Adres göster",
      thShowPhone: "Telefon göster",
      thShowTaxId: "Vergi numarası göster",
      thShowQr: "QR kod göster",
      thShowBarcode: "Barkod göster",
      thShowCashier: "Kasiyer adı göster",
      thShowCustomer: "Müşteri adı göster",
      thFieldsTitle: "Gösterilecek alanlar",
      thFieldsDesc: "Fişte hangi bilgiler yazdırılsın",
      thPaperTitle: "Kağıt ve yazı",
      thPaperDesc: "Termal rulo genişliği ve yazı boyutu",
      thFontSize: "Yazı boyutu",
      thFontHint: "Görme zorluğu olan kasiyerler için büyütülebilir.",
      fontSm: "Küçük",
      fontMd: "Orta",
      fontLg: "Büyük",
      thQrTitle: "QR ve yazdırma işlemi",
      thQrDesc: "QR içeriği, otomatik yazdırma ve kopya sayısı",
      thQrContent: "QR kod içeriği",
      qrInvoice: "Fatura numarası (fiş №)",
      qrWebsite: "Firma adı / site",
      qrPayment: "Ödeme bilgisi",
      thAutoPrint: "Otomatik yazdır",
      thAutoPrintDesc: "Satış tamamlanınca fiş otomatik yazdırılsın (Fatura ekranında).",
      thCopies: "Kopya sayısı (1–3)",
      thFooterNote: "Fişin altındaki yazı",
      thFooterPh: "Teşekkürler, yine bekleriz!",
      spOrientPortrait: "Dikey (Portrait)",
      spOrientLandscape: "Yatay (Landscape)",
      spColBarcode: "Barkod / SKU",
      spColUnit: "Ölçü birimi",
      spColUnitPrice: "Birim fiyat",
      spColDiscount: "İndirim (%)",
      spColSubtotal: "Ara toplam",
      spColTax: "KDV",
      spInfoCurrency: "Para birimi (TMT)",
      spInfoPayment: "Kasa (ödeme şekli)",
      spInfoCustomer: "Müşteri adı",
      spInfoLedger: "Defter adı",
      spLayoutTitle: "Sayfa düzeni",
      spLayoutDesc: "A4 kağıdın yönü ve yazı boyutu",
      spOrientation: "Kağıt yönü",
      spItemsTitle: "Ürünler",
      spItemsDesc: "Ürün satırları nasıl gösterilsin",
      spShowImages: "Ürünleri resimle göster",
      spShowImagesDesc: "Açıkken her ürün satırında görseli de yazdırılır.",
      spColumns: "Gösterilecek sütunlar",
      spInfo: "Gösterilecek bilgiler",
      spInfoHint: "Kasa, müşteri, defter ve para birimi çıktıda gösterilsin mi.",
      spHeadFootTitle: "Sayfa başlığı / altı",
      spHeadFootDesc: "Üst ve alt düzenlemeler",
      spHeader: "Sayfa başlığı",
      spHeaderDesc: "Üstte büyük logo ve firma bilgileri gösterilsin.",
      spFooter: "Sayfa altı",
      spFooterDesc: "Alt bölümde firma adı ve sayfa numarası gösterilsin.",
      spSignature: "İmza / Kaşe yeri",
      spSignatureDesc: "Alt bölümde 'Satıcı' ve 'Alıcı' imza kutuları.",
      spNotesTitle: "Notlar / Şartlar",
      spNotesDesc: "A4 çıktısının altına eklenen ek metin",
      spNotesPh: "Örn: Ürün 14 gün içinde iade alınır. Ödeme şartları...",
      permRoleExists: "Bu rol zaten var.",
      permProtectedDelete: "Ana roller silinemez.",
      permRolesTitle: "Roller",
      permRolesDesc: "Rol şablonları Kullanıcı modülüyle aynı modeli paylaşır — yeni kullanıcı oluşturulunca bu yetkiler önceden doldurulur",
      permNewRolePh: "Yeni rolün adı...",
      permAddRole: "Yeni rol ekle",
      permDelete: "Sil",
      permRolePerms: "«{role}» rolü için modül yetkileri",
      permModulesNote: "{count} modül · Kullanıcı modülündeki özel değişiklikler bozulmaz",
      permAuditTitle: "Denetim",
      permAuditDesc: "Sistem hareketlerinin kaydı",
      permAuditLabel: "Bu sistemde tüm hareketleri kayda al",
      permAuditLabelDesc: "Etkinleştirilirse kullanıcıların hareketleri kayda alınır",
      auditCreate: "Yeni",
      auditUpdate: "Değiştirdi",
      auditDelete: "Sildi",
      auditView: "Gördü",
      auditReadFailed: "Günlük okunamadı: {error}",
      auditExportTitle: "İşlem günlüğünü dışa aktar",
      auditSaved: "Günlük .json dosyasına kaydedildi.",
      auditExportFailed: "Dışa aktarma başarısız: {error}",
      auditDesc: "Kim, ne zaman, hangi kaydı değiştirdi — son 300 kayıt",
      auditDisabled: "Günlük kaydı kapalı. Etkinleştirmek için: Yetkiler → İşlem günlüğü.",
      auditHealthError: "Günlük yazma başarısız ({count} kez): {error}",
      auditDocType: "Kayıt türü",
      auditUser: "Kullanıcı",
      auditAll: "Tümü",
      auditRefresh: "Yenile",
      auditExport: "Dışa aktar (.json)",
      auditColTime: "Zaman",
      auditColAction: "Hareket",
      auditColType: "Tür",
      auditColEntry: "Kayıt",
      auditLoading: "Yükleniyor...",
      auditEmpty: "Günlük boş — henüz değişiklik yazılmadı.",
      unitsDesc: "Ürün eklerken seçilen birimler. Sabit gelenler silinemez, üzerine ekleyebilirsiniz.",
      unitColCode: "Kod",
    },
    mobile: {
      customerSearchTitle: "Müşteri ara",
    },
    receipt: {
      receiptNo: "Fiş No",
      cashier: "Kasiyer",
      colNo: "FİŞ NO:",
      colDate: "TARİH:",
      colCashier: "KASİYER:",
      colCustomer: "MÜŞTERİ:",
      colItemsQty: "ÜRÜN / ADET",
      colTotal: "TOPLAM",
      subtotal: "ARA TOPLAM:",
      discount: "İNDİRİM:",
      paid: "ÖDENDİ:",
      paidTotal: "TOPLAM ÖDENDİ:",
      remainingDebt: "KALAN BORÇ:",
      creditTerm: "VADE SÜRESİ:",
      days: "gün",
      dueDate: "SON ÖDEME TARİHİ:",
      paymentType: "ÖDEME ŞEKLİ:",
      auth: "ONAY (AUTH):",
      status: "DURUM:",
      approved: "ONAYLANDI (APPROVED)",
      waitingAgain: "Yine bekleriz!",
      invTitle: "FATURA",
      invCode: "Fatura kodu:",
      invNo: "Fatura:",
      invDate: "Tarih:",
      invCustomer: "Müşteri:",
      invCashier: "Kasiyer:",
      colProduct: "Ürün",
      colBarcode: "Barkod",
      colQty: "Adet",
      colUnit: "Birim",
      colUnitPrice: "Birim fiyat",
      colPrice: "Fiyat",
      colDiscount: "İndirim",
      colDiscountShort: "İnd.",
      colLineTotal: "Toplam",
      taxLabel: "KDV:",
      taxShort: "KDV:",
      subtotalLabel: "Ara toplam:",
      discountLabel: "İndirim:",
      ledgerLabel: "Defter:",
      grandTotal: "Toplam:",
      paidLabel: "Ödendi:",
      remainingLabel: "Kalan borç:",
      paymentLabel: "Ödeme şekli:",
      paymentShort: "Ödeme:",
      seller: "Satıcı",
      buyer: "Alıcı",
      notesTerms: "Notlar / Şartlar:",
      pageOne: "Sayfa 1",
      authShort: "AUTH:",
      thermalDate: "TARİH:",
      noShort: "Fiş №:",
      totalCaps: "TOPLAM",
    },
    payment: {
      cash: "NAKİT",
      card: "BANKA KARTI",
      credit: "VERESİYE",
      split: "PARÇALI",
    },
    excel: {
      exportSuccess: "Excel'e aktarıldı",
      exportedRows: "{count} satır dışa aktarıldı.",
      importModalTitle: "Excel'den içe aktar (Import)",
      exportModalTitle: "Excel'e aktar (Export)",
      errorReportTitle: "Ürün İçe Aktarma Hata Raporu",
      selectFile: "Excel dosyası seç",
      downloadTemplate: "Örnek şablon indir",
      readingFile: "Dosya okunuyor...",
      importDone: "İçe aktarma tamamlandı",
      importAdded: "eklendi",
      importUpdated: "güncellendi",
      importSkipped: "atlandı",
      failedSummary: "{total} satırdan {written} yazıldı — {failed} başarısız.",
      failedRows: "Yazılamayan satırlar:",
      errorReport: "Hata raporu",
      validRow: "Geçerli satır",
      existing: "Mevcut",
      errorRow: "Hatalı satır",
      existingProducts: "Mevcut ürünler için:",
      overwriteAll: "Tümünü güncelle",
      skipAll: "Tümünü atla",
      selectFileHint: "Excel dosyası seçin — satırlar burada görünecek.",
      closeBtn: "Kapat",
      writing: "Yazılıyor...",
      importBtn: "İçe aktar ({count})",
      statusNew: "Yeni",
      savedToDocuments: "Dosya Documents klasörüne kaydedildi.",
      saveFailed: "Dosya kaydedilemedi — tekrar deneyin.",
      selectAll: "Tümünü seç",
      clearSelection: "Seçimi kaldır",
      includeStock: "Stok miktarları yazılsın mı?",
      includeCost: "Alış fiyatları yazılsın mı?",
      exportBtn: "Excel'e aktar ({count})",
      colName: "Ürün Adı",
      colStatus: "Durum",
      errorReportTitleCustomers: "Cari İçe Aktarma Hata Raporu",
      detailHeaderPhone: "Telefon",
      importModalTitleCustomers: "Excel'den içe aktar",
      exportModalTitleCustomers: "Excel'e aktar",
      existingCustomers: "Mevcut müşteriler için (ad/telefon eşleşiyor):",
      searchCustomers: "Müşteri ara...",
      includeBalance: "Borç / alacak bakiyeleri yazılsın mı?",
      customerNotFound: "Müşteri bulunamadı",
      fileTooLarge: "Dosya çok büyük — en fazla {maxMB} MB kabul edilir.",
      tooManyRows: "Dosyada çok fazla satır var — en fazla {maxRows} satır kabul edilir.",
      xlsNotSupported: "Eski .xls formatı desteklenmiyor. Dosyayı .xlsx olarak kaydedin.",
      xlsxOnly: "Yalnızca .xlsx dosyaları kabul edilir.",
      invalidFile: "Dosya bozuk veya boş.",
      readFailed: "Dosya okunamadı.",
      mapColumns: "Kolonları eşleştir",
      mappingHint: "Excel kolonlarını hedef alanlarla eşleştirin. Başlık satırını değiştirebilir ve kullanılmayacak kolonları atlayabilirsiniz.",
      headerRow: "Başlık satırı",
      requiredColumn: "(zorunlu)",
      unmappedColumn: "Eşleme / bu alanı atla",
      sourceColumn: "{column}. kolon — {header}",
      emptyHeader: "Başlıksız",
      sampleCell: "Örnek: {value}",
      mappingRequired: "Zorunlu alanları farklı kaynak kolonlarına eşleştirin ve belirsiz seçimleri netleştirin.",
      applyMapping: "Eşlemeyi uygula ve önizle",
      mappingAmbiguous: "Birden fazla eşleşme — kaynak seçin",
    },
    products: {
      searchPlaceholder: "Ürün adı veya barkod ile ara...",
      bulkEditTitle: "Toplu düzenleme",
      bulkEdit: "Toplu Düzenle",
      importExcelTitle: "Excel'den içe aktar",
      importExcel: "Excel'den getir",
      exportExcelTitle: "Excel'e aktar",
      exportExcel: "Excel'e çykar",
      allCategoriesOption: "Tümü",
      newProduct: "New Product",
      colNameCategory: "Ürün Adı / Kategori",
      colBarcode: "Barkod",
      colPurchaseSale: "Alış / Satış",
      colStock: "Mevcut Stok",
      colActions: "İşlemler",
      notFound: "Ürün bulunamadı",
      clickToEdit: "Düzenlemek için tıklayın",
      composedTooltip: "Bu ürünün kompozisyonu var",
      composedBadge: "Set",
      negativeStockAllowed: "Eksi stok izinli",
      compositionEditTooltip: "Ürün kompozisyonu: görmek/düzenlemek için",
      compositionAddTooltip: "Ürün kompozisyonu ekle",
      editAction: "Düzenle",
      deleteConfirm: "Bu ürünü silmek istiyor musunuz?",
      noBtn: "İptal",
      editTitle: "Ürünü Düzenle",
      addTitle: "Yeni Ürün Ekle",
      imageChangeTitle: "Resmi değiştirmek için tıklayın",
      compressing: "Sıkıştırılıyor…",
      changeBtn: "Değiştir",
      imageOptional: "Görsel (Opsiyonel)",
      nameLabel: "Ürün Adı (Haryt Ady) *",
      namePlaceholder: "Örn: Coca Cola 1L",
      categoryLabel: "Kategori",
      categoryPlaceholder: "Örn: Genel",
      barcodeLabel: "Ana Barkod *",
      unit1Label: "Ölçü Birimi 1",
      priceLabel: "Satış Fiyatı (Perakende) *",
      unit2Enable: "Ölçü Birimi 2'yi Etkinleştir",
      unit2Label: "Ölçü Birimi 2",
      unit2QtyLabel: "1 {unit2} içinde kaç {unit1}",
      unit2Example: "Örn: 1 {unit2} = {qty} {unit1}",
      purchasePriceLabel: "Alış Fiyatı (Maliyet)",
      wholesalePriceLabel: "Toptan Fiyat",
      stockLabel: "Mevcut Stok Miktarı",
      negativeStockTooltip: "Açıkken stok olmasa da satış yapılır, stok eksiye iner",
      negativeAllowedShort: "− gidebilir",
      inactiveTooltip: "Pasif ürün ayarlara göre sepete eklenemez",
      activeBtn: "Aktif",
      inactiveBtn: "Pasif",
      inactiveNote: "Pasif ürün fatura/sepete eklenemez (ayarlara bağlı).",
      compositionOpenTooltip: "Kompozisyonu aç/düzenle",
      compositionBtn: "Kompozisyon",
      criticalStockLabel: "Kritik Stok Uyarısı",
      expiryLabel: "Son Kullanma Tarihi (SKT)",
      extraBarcodesLabel: "Ek Barkodlar (Çoklu Barkod / Koli Barkodu)",
      extraBarcodePlaceholder: "İkinci veya üçüncü barkod...",
      addShort: "Ekle",
      cancelBtn: "Cancel",
      saveBtn: "Save",
      unitNameRequired: "Ad girin.",
      unitExists: "Bu ölçü birimi zaten var.",
      customUnitPlaceholder: "Örn: RULON",
      customUnitOption: "+ Kendi ölçü birimini ekle",
      unitAddedHint: "Yeni birim listeye eklenir ve seçilir",
      bulkModalTitle: "Toplu Düzenleme — Ürünler",
      changesReady: "değişiklik hazır",
      bulkSearchPlaceholder: "Ürün adı / barkod / SKU...",
      bulkAllCategories: "Tüm kategoriler",
      colName: "Ürün adı",
      colPurchase: "Alış",
      colSale: "Satış",
      stockShort: "Stok",
      colCritical: "Kritik",
      errorRowsHint: "(ad boş / fiyat negatif)",
      priceRule: "Fiyatlar negatif olamaz",
      saveCount: "Kaydet ({count})",
      compSaved: "Kaydedildi.",
      compositionTitle: "Ürün Kompozisyonu — {name}",
      compositionSearchPlaceholder: "Kompozisyona ürün eklemek için ara...",
      selectProduct: "Ürün seç",
      stockAmount: "Stok miktarı",
      stockPrefix: "St:",
      purchaseShort: "alış",
      saleShort: "satış",
      components: "Bileşenler",
      noComponents: "Henüz bileşen seçilmedi.",
      stockInsufficient: "Stok yetersiz",
      unitShort: "birim",
      totalShort: "toplam",
      removeTooltip: "Kaldır",
      totalPurchase: "Toplam Alış",
      totalSale: "Toplam Satış",
      profit: "Kâr (Marj)",
      mainPriceLabel: "Ana ürünün satış fiyatı",
      useSuggestedTooltip: "Toplam satış fiyatını kullan",
      useSuggested: "Önerileni kullan",
    },
    customers: {
      filterAllCount: "Tümü ({count})",
      filterCustomersCount: "Müşteriler ({count})",
      filterEmployeesCount: "İşgörenler / Işgärler ({count})",
      filterAll: "Tümü",
      filterCustomers: "Müşteriler",
      filterEmployees: "İşgörenler",
      searchPlaceholder: "İsim veya telefon ile ara...",
      bulkEditTitle: "Toplu düzenleme",
      bulkEdit: "Toplu Düzenle",
      importExcelTitle: "Excel'den içe aktar",
      importExcel: "Excel'den getir",
      exportExcelTitle: "Excel'e aktar",
      exportExcel: "Excel'e çykar",
      addCustomer: "Müşteri / Cari Ekle",
      newCardTitle: "Yeni Cari Kartı",
      colNamePhone: "Cari Adı / Telefon",
      colType: "Tip",
      colKind: "Tür",
      colDueDate: "Vade",
      colBalance: "Bakiye",
      colActions: "İşlemler",
      notFound: "Kayıtlı cari bulunamadı.",
      doubleClickHint: "Detayları görmek için çift tıklayın",
      typeEmployee: "İşgören",
      typeCustomer: "Müşteri",
      typeSupplier: "Tedarikçi",
      editAction: "Düzenle",
      generalCustomerNoDelete: "Genel Müşteri — sistem kaydı, silinemez",
      roleEmployee: "İşgören / Personel",
      roleCustomer: "Müşteri / Alıcı",
      phoneLabel: "Telefon",
      balanceLabel: "Hesap Bakiyesi",
      dueDateLabel: "Vade Süresi",
      creditLimitLabel: "Borç Limiti",
      unlimited: "Sınırsız",
      addressLabel: "Adres / Notlar",
      ledgerTitle: "Fatura & Borç/Alacak Geçmişi",
      txCountSuffix: "işlem",
      noTransactions: "Kayıtlı fatura veya borç/alacak hareketi bulunamadı.",
      colDate: "Tarih",
      colInvoiceCode: "Fatura Kodu",
      colReason: "İşlem / Sebep",
      colDebit: "Borç (+)",
      colCredit: "Ödeme (-)",
      closeBtn: "Kapat",
      receiptTooltip: "Çeki görmek için tıklayın",
      reasonSalesInvoice: "Satış Faturası ({count} kalem)",
      reasonInvoiceOp: "Fatura İşlemi",
      reasonCreditSale: "Vadeli Satış Faturası (Ürün Alımı)",
      reasonCashPayment: "Nakit Borç Ödemesi (Kasa)",
      reasonWholesale: "Toptan Satış Faturası (Vadeli)",
      reasonBankTransfer: "Banka Kartı / Havale Ödemesi",
      reasonOpening: "Açılış Hesap Bakiyesi",
      editTitle: "Düzenle — {name}",
      nameLabel: "Ad Soyad / Firma Adı *",
      namePlaceholder: "Örn: Ahmet Yılmaz",
      nameReadOnlyTitle: "Genel Müşteri — sistem kaydı, adı değiştirilemez",
      phoneLabelForm: "Telefon Numarası",
      typeLabel: "Cari Tipi",
      typeCustomerOption: "Müşteri (Alıcı)",
      typeEmployeeOption: "İşgören / Işgär",
      dueDateLabelForm: "Vade Günü (Ödeme Süresi)",
      creditLimitLabelForm: "Borç Limiti (Maksimum)",
      addressLabelForm: "Adres / Notlar",
      addressPlaceholder: "Adres veya açıklama...",
      balanceAutoTitle: "Fatura/Kasa hareketlerinden otomatik hesaplanır — elle değiştirilemez",
      balanceAutoNote: "Fatura/Kasa hareketlerinden otomatik hesaplanır — elle değiştirilemez.",
      activeLabel: "Aktif (kullanılıyor)",
      cashBlockedLabel: "Nakit satış yasak",
      cashBlockedHint: "Nakit satış yasak — bu müşteriye yalnız kart/veresiye ile satış yapılır.",
      saveCreateBtn: "Kaydet",
      bulkModalTitle: "Toplu Düzenleme — Müşteriler",
      changesReady: "değişiklik hazır",
      bulkSearchPlaceholder: "İsim veya telefon...",
      allTypes: "Tüm türler",
      colFullName: "Ad Soyad",
      colPhone: "Telefon",
      colAddressNote: "Adres / Not",
      systemNameReadOnly: "Sistem kaydı — adı değiştirilemez",
      errorEmptyName: "{count} hatalı satır (ad boş)",
      balanceLegend: "Bakiye: (+) bize borçlu · (−) biz borçluyuz",
      saveCount: "Kaydet ({count})",
    },
    users: {
      errUsernameRequired: "Kullanıcı adı zorunludur.",
      errUsernameTaken: "Bu kullanıcı adı zaten var.",
      errPasswordMismatch: "Şifreler eşleşmiyor.",
      errCategoryRequired: "En az bir kategoriya seçin.",
      errInvoiceTypeRequired: "En az bir fatura türü seçin.",
      searchPlaceholder: "İsim veya role göre ara...",
      allRoles: "Tüm roller",
      newUser: "Yeni kullanıcı",
      colUsername: "Kullanıcı adı",
      colRole: "Rol",
      colStatus: "Durum",
      colLastLogin: "Son giriş",
      colActions: "İşlemler",
      emptyNoUsers: "Kullanıcı yok. Yeni kullanıcı oluşturun.",
      emptyNotFound: "Kullanıcı bulunamadı",
      active: "Aktif",
      passive: "Pasif",
      protectedTip: "Administrator düzenlenemez/silinemez",
      protectedBadge: "Korumalı",
      editTip: "Düzenle",
      resetPasswordTip: "Şifreyi sıfırla",
      deleteTip: "Sil",
      deleteMsg: "Bu kullanıcıyı silmek istiyor musunuz?",
      newPassword: "Yeni şifre",
      confirmPassword: "Şifreyi onayla",
      actView: "Görüntüle",
      actCreate: "Ekle",
      actEdit: "Düzenle",
      actDelete: "Sil",
      actReport: "Rapor",
      colModule: "Modül",
      editTitle: "Kullanıcıyı düzenle",
      roleLabel: "Rol (elle yazılabilir)",
      customRoleHint: "Yeni rol — izinleri kendiniz belirlersiniz",
      passwordEditLabel: "Şifre (boş bırakırsanız değişmez)",
      passwordNewLabel: "Şifre (isteğe bağlı)",
      permissionsTitle: "İzinler",
      finePermsTitle: "Kasa ve Fatura ince izinleri",
      kassaSection: "Kasa",
      addIncome: "Gelir ekle",
      addExpense: "Gider ekle",
      showBalance: "Kasa bakiyesini göster",
      allowedCategories: "İzin verilen kategoriler",
      selectAll: "Tümünü seç",
      clearAll: "Tümünü kaldır",
      fakturaSection: "Fatura",
      editPrice: "Fiyatı değiştir",
      allowDiscount: "İndirim uygula",
      allowedInvoiceTypes: "İzin verilen fatura türleri",
      modeAll: "Hepsine izin",
      modeWhitelist: "Sadece seçilenlere",
      modeBlacklist: "Seçilenler hariç",
      removeTip: "Kaldır",
      selectedCount: "{count} seçildi",
      noneSelected: "Henüz seçilmedi",
      notFound: "Bulunamadı",
      searchIn: "{label} — ara...",
      advTitle: "Gelişmiş İzinler (Varsayılan Değerler ve Erişim)",
      defaultsSection: "Varsayılan Değerler",
      defInvoiceType: "Varsayılan fatura türü",
      defPaymentType: "Varsayılan ödeme türü",
      defUnit: "Varsayılan ölçü birimi (ana)",
      defUnit2: "Varsayılan ikinci ölçü birimi (paket/koli)",
      defCustomer: "Varsayılan müşteri",
      noOneGeneral: "Hiç kim (Genel Müşteri)",
      defWarehouse: "Varsayılan ambar",
      defLedger: "Varsayılan kasa defteri",
      accessSection: "Erişim Kontrolü",
      payTypesTitle: "Hangi ödeme türlerini oluşturabilir?",
      phPayment: "Ödeme türü",
      phCustomer: "Müşteri",
      phProduct: "Ürün",
      phWarehouse: "Ambar",
      phLedger: "Kasa defteri",
      customerPerms: "Müşteri İzinleri",
      productPerms: "Ürün İzinleri",
      warehousePerms: "Ambar İzinleri",
      invoiceWarehouses: "Fatura için izinli ambarlar (genel ambar izninden farklıysa)",
      ledgerPerms: "Kasa Defteri İzinleri",
    },
    errors: {
      documentValidation: "Kayıt doğrulanamadı. Hatalı veya eksik alanlar: {fields}",
      invalidBatchSize: "Toplu yazım boyutu pozitif bir tam sayı olmalıdır.",
      generic: "Beklenmeyen bir hata oluştu.",
      network: "Ağ hatası — bağlantınızı kontrol edin.",
      boundaryTitle: "Bir şeyler ters gitti",
      boundaryRestart: "Yeniden başlat",
    },
    license: {
      title: "Lisans Yönetimi",
      account: "Hesap:",
      attention: "Dikkat:",
      needLicense: "Bu işlem lisans gerektirir: {route}",
      needKeyInfo: "Lisans anahtarı almanız gerekir. Satış, alış, stok ve tüm işlemler lisansa bağlıdır.",
      daysLeft: "({days} gün kaldı)",
      days: "{days} gün",
      accountId: "Hesap ID",
      loading: "Yükleniyor...",
      copy: "Kopyala",
      requestCode: "İstek Kodu (bize gönderin)",
      requestCodeHint: "Bu kodu WhatsApp/Telegram ile gönderin. Size kök kod ve lisans anahtarı verilecek.",
      rootCode: "Kök Kodu",
      rootCodeFirstSetup: "(ilk kurulum)",
      rootCodePlaceholder: "Kök kodunu buraya yapıştırın",
      rootCodeHint: "107 karakter. Müşteriye ilk seferde verilir; sonraki yenilemelerde gerekmez.",
      rootCodeReenter: "Kök kodu var mı / yeniden giriyorum",
      licenseKey: "Lisans Anahtarı",
      licenseKeyPlaceholder: "Lisans anahtarını buraya yapıştırın",
      licenseKeyHint: "160 karakter (6'lı gruplar halinde gelebilir)",
      activating: "Aktifleştiriliyor...",
      activate: "Aktifleştir",
      activeLicense: "Aktif Lisans",
      expiry: "Son kullanma:",
      remaining: "Kalan süre:",
      features: "Özellikler:",
      maxRegisters: "Maks. kasa sayısı:",
      loadFailed: "Lisans bilgileri yüklenemedi: {error}",
      nothingToCopy: "Kopyalanacak içerik yok",
      copied: "{label} kopyalandı",
      copyFailed: "Kopyalama başarısız — metni elle seçebilirsiniz",
      rootInvalid: "Kök kodu hatalı ({status})",
      activated: "Lisans aktifleştirildi!",
      activationError: "Aktivasyon hatası: {error}",
      errorFallback: "Hata: {status}",
      statusActive: "Lisans aktif",
      statusInvalidKey: "Geçersiz lisans anahtarı",
      statusExpired: "Lisans süresi doldu",
      statusOtherDevice: "Bu anahtar başka cihaza ait (rebind gerekli)",
      statusClockReset: "Cihaz saati geri alınmış (clock-reset gerekli)",
      statusUsed: "Bu anahtar zaten kullanılmış",
      statusNotActivated: "Henüz aktivasyon yapılmamış",
      statusInvalidInput: "Geçersiz giriş",
      statusKeyInvalid: "Anahtar geçersiz",
      statusOtherAccount: "Anahtar farklı hesaba ait",
      statusStorage: "Depolama hatası",
      statusRootRequired: "Önce kök kodu gerekli",
      statusFileCorrupt: "Lisans dosyası bozulmuş",
    },
    targowy: {
      targows: "Targowçılar",
      addTargow: "Targowçı ekle",
      noTargow: "Targowçı yok",
      notFound: "Targowçı bulunamadı",
      view: "Görüntüle",
      todayOrders: "Bugünkü siparişler",
      monthResult: "Aylık sonuç",
      last7Days: "Son 7 gün",
      last14Days: "Son 14 gün",
      noRegionAssigned: "Etrap atanmadı",
      todayTotalSales: "Bugünkü toplam satış",
      todayOrderCount: "Bugünkü sipariş adedi",
      activeTargows: "Aktif targowçılar",
      bestToday: "Günün en iyi targowçısı",
      noOrdersToday: "Bugün sipariş yok",
      today: "Bugün",
      thisWeek: "Bu hafta",
      thisMonth: "Bu ay",
      commission: "komisyon",
      ordersUnit: "sipariş",
      monthlyTarget: "Aylık hedef",
      noOrders: "Sipariş yok",
      allRegions: "Tüm etraplar",
      allStatuses: "Tüm durumlar",
      fullNameRequired: "Ad Soyad zorunludur.",
      phoneRequired: "Telefon numarası zorunludur.",
      targowExists: "Bu targowçı zaten var.",
      optional: "opsiyonel",
      noRegionsHint: "Etrap yok. \"Etraplar\" bölümünden ekleyin.",
      deleteConfirm: "\"{name}\" targowçısını silmek istiyor musunuz?",
      deleteHasOrders: "Bu targowçının {count} siparişi var. Silmek yerine Pasif yapmanız önerilir.",
      tabRegions: "Etraplar",
      tabRating: "Sıralama",
      regionExists: "Bu etrap zaten var.",
      newRegionPh: "Yeni etrap adı",
      addRegion: "Etrap ekle",
      noRegions: "Etrap yok",
      activeLabel: "Aktif",
      inactiveLabel: "Pasif",
      editTitle: "Kuryeyi düzenle",
      newTitle: "Yeni kurye",
      fullNameLabel: "Adı Soyadı *",
      colRank: "Sıra",
      colName: "Adı",
      colOrderCount: "Sipariş adedi",
      colTotalAmount: "Toplam tutar",
      avgOrder: "Ortalama sipariş",
      colNewCustomer: "Yeni müşteri",
      colTrend: "Trend",
      colCustomer: "Müşteri",
      periodAll: "Tüm zamanlar",
      critAmount: "En çok TMT",
      critOrders: "En çok sipariş adedi",
      critNewCustomers: "En çok yeni müşteri",
    },
    walyuta: {
      baseCurrency: "Esas para birimi",
      baseCurrencyHint: "fiyat, fatura ve raporlarda kullanılır",
      fixed: "Sabit",
      change: "Değiştir",
      confirmBaseTitle: "{code} esas para birimi yapılsın mı?",
      confirmBaseMsg: "Bu değişiklik fiyat, fatura ve raporlardaki birimi {code} yapar. Kayıtlı tutarlar değişmez, hesaplar korunur.",
      prevBase: "Önceki esas para birimi",
      deleteConfirm: "{code} para birimini silmek istiyor musunuz?",
      deleteBaseBlocked: "Bu esas para birimi — önce başka bir para birimini esas yapıp sonra silin.",
      deleteInUse: "Bu para birimi kullanılıyor, silinemez.",
      codeRequired: "Para birimi kodunu girin.",
      tmtIsBase: "TMT esas para birimidir, ayrıca eklenemez.",
      codeExists: "Bu para birimi kodu zaten var.",
      nameRequired: "Para birimi adını girin.",
      ratePositive: "{code} kuru 0'dan büyük olmalı.",
      customCodeLabel: "Para birimi kodu (manuel)",
      colSymbol: "Simge",
      colRate: "Kur (1 birim = ? {code})",
      colUpdated: "Son güncelleme",
      emptyCurrencies: "Walýuta yok. Yeni walýuta ekleyin.",
      baseBadge: "Esas",
      updateRate: "Kuru güncelle",
      setBase: "Esas para birimi yap",
      baseCannotDelete: "Esas para birimi silinemez",
      deleteLabel: "Sil",
      baseSetNotice: "Esas para birimi: {code}",
      baseSetFailed: "Esas para birimi değiştirilemedi.",
      addOtherFirst: "Önce başka bir para birimi ekleyin.",
      addedCurrencies: "Eklenen para birimleri",
      editTitle: "Para birimini düzenle",
      newTitle: "Yeni para birimi",
    },
    faktura: {
      selectTargow: "Targowçı seçin.",
      selectCustomer: "Müşteri seçin.",
      selectRegion: "Etrap seçin.",
      addOneProduct: "En az bir ürün ekleyin.",
      draftNoEffect: "Merkez onaylayana kadar hiçbir modülü etkilemez",
      productSearchPh: "Ürün adı veya barkod...",
      noProductsAdded: "Ürün eklenmedi",
      filterSearchPh: "Müşteri veya fatura no...",
      recordsShown: "kayıt gösteriliyor",
      soundOn: "Bildirim sesi açık — kapatmak için bas",
      soundOff: "Bildirim sesi kapalı — açmak için bas",
      rejectTitle: "Taslağı reddet",
      rejectHint: "Reddedilen taslak hiçbir modülü etkilemez, ancak geçmişte kalır.",
      rejectReasonLabel: "Ret nedeni (opsiyonel)",
      noDrafts: "Taslak fatura yok",
      openInInvoice: "Fatura ekranında aç",
      openLabel: "Aç",
      createTitle: "Taslak fatura oluştur",
      noteLabel: "Açıklama",
      cancelBtn: "İptal",
      saveDraft: "Taslak olarak kaydet",
      targowLabel: "Kurye *",
      customerLabel: "Müşteri *",
      regionLabel: "Bölge *",
      selectOption: "— Seç —",
      paymentLabel: "Ödeme türü",
      currencyLabel: "Para birimi",
      payCash: "Nakit",
      payCard: "Kart",
      payCredit: "Borç (veresiye)",
      addProductLabel: "Ürün ekle",
      colProduct: "Ürün",
      colPrice: "Fiyatı",
      colQty: "Adet",
      colTotal: "Toplam",
      statusPending: "Bekliyor",
      statusAccepted: "Kabul edildi",
      statusRejected: "Reddedildi",
      filterAll: "Tümü",
      filterByUser: "Kullanıcıya göre",
      filterByTargow: "Kuryeye göre",
      filterByRegion: "Bölgeye göre",
      dateStartTip: "Başlangıç tarihi",
      dateEndTip: "Bitiş tarihi",
      clearFilters: "Temizle",
      colDate: "Tarih / Saat",
      colSender: "Gönderen",
      colCustomer: "Müşteri",
      colRegion: "Bölge",
      colStatus: "Durum",
      colAction: "İşlem",
      acceptTip: "Kabul et",
      rejectTip: "Reddet",
    },
    depder: {
      noDescription: "Açıklama yok",
      currentBalance: "Güncel bakiye",
      usersUnit: "kullanıcı",
      deleteConfirm: "\"{name}\" defterini silmek istiyor musunuz?",
      deleteHasTx: "Bu defterde işlem geçmişi var. Silmek yerine Pasif yapmanız önerilir — geçmiş kayıtlar korunur.",
      back: "Geri",
      txUnit: "hareket",
      nameRequired: "Defter adı zorunludur.",
      nameExists: "Bu defter adı zaten var.",
      openingBalanceNaN: "Açılış bakiyesi sayı olmalı.",
      namePh: "Örn: Merkezi kasa",
      descPh: "Kısa açıklama...",
      grandTotal: "Genel toplam (TMT)",
      ledgersUnit: "defter",
      transferBtn: "Defterler arası transfer",
      newLedger: "Yeni defter",
      noLedgers: "Defter yok",
      noLedgersHint: "Yeni defter oluşturup, kasalarınızı ayrı yönetin.",
      selectLedgers: "Defterleri seçin.",
      sameLedger: "Aynı deftere transfer yapılamaz.",
      amountPositive: "Tutar 0'dan büyük olmalı.",
      transferDescPh: "Örn: gün sonu transferi",
      transferTitle: "Defterler arası transfer",
      fromLedger: "Hangi defterden",
      toLedger: "Hangi deftere",
      amountLabel: "Tutar",
      dateLabel: "Tarih",
      rateNote: "kura göre:",
      descLabel: "Açıklama",
      cancelBtn: "İptal",
      transferSubmit: "Transferi gerçekleştir",
      editTitle: "Defteri düzenle",
      newTitle: "Yeni defter",
      nameLabel: "Adı *",
      currencyLabel: "Para birimi",
      openingLabel: "Açılış bakiyesi",
      descFieldLabel: "Açıklama",
      activeLabel: "Aktif",
      inactiveLabel: "Pasif",
      permsTitle: "İzinler — bu deftere kimler girebilir",
      saveBtn: "Kaydet",
      userSelectPh: "Kullanıcı seç...",
      userAdd: "Kullanıcı ekle",
      userCol: "Kullanıcı",
      noUsersNote: "Kullanıcı eklenmedi. Yöneticiler otomatik olarak tüm yetkilere sahiptir.",
      allPerms: "Tüm yetkiler",
      removeTip: "Kaldır",
      permEnter: "Girebilir",
      permAddIncome: "Gelir ekleyebilir",
      permAddExpense: "Gider ekleyebilir",
      permEdit: "Düzenleyebilir",
      permDelete: "Silebilir",
      permViewReport: "Rapor görebilir",
    },
    warehouses: {
      searchPh: "Ambar adı, kodu veya adresi ile ara...",
      newWarehouse: "Yeni ambar",
      colWarehouse: "Ambar",
      colCode: "Kod",
      colAddressTel: "Adres / Tel",
      colStatus: "Durum",
      colActions: "İşlemler",
      emptyNone: "Henüz ambar yok. Yeni ambar oluşturun.",
      emptyNotFound: "Ambar bulunamadı",
      itemsUnit: "ürün",
      inactive: "Pasif",
      active: "Aktif",
      defaultBadge: "Ana ambar",
      editTitle: "Düzenle",
      deleteConfirm: "Bu ambarı silmek istiyor musunuz?",
      cancelNo: "İptal",
      formEditTitle: "Ambarı düzenle",
      formName: "Ambar adı",
      formPhone: "Telefon",
      formAddress: "Adres",
      formNote: "Not",
      defaultWarehouse: "Ana ambar",
      itemsInside: "İçindeki ürünler",
      colProductName: "Ürün adı",
      colBarcode: "Barkod",
      colQty: "Miktar",
      colUnit: "Ölçü birimi",
      colPrice: "Fiyat",
      emptyWarehouse: "Bu ambar boş",
      close: "Kapat",
    },
    modals: {
      importFailed: "İçe aktarma başarısız: yalnızca .bhbak (veya eski .json yedek) kabul edilir.",
      accountFileHint: " hesabına yedek .bhbak dosyasını seçin. Yalnızca Biznes Hasap açabilir.",
      clickToPick: "Dosya seçmek için tıklayın",
      importedCount: "{count} kayıt içe aktarıldı.",
      importing: "Aktarılıyor...",
      shortcutsTitle: "Klavye Kısayolları",
      shortcutsHint: "F tuşlarına basarak doğrudan çalıştırabilirsiniz.",
      shortcutsClose: "Kapat",
      bhbakNote: ".bhbak — Biznes Hasap yedeği",
    },
    promo: {
      modalTitle: "PROMO sistemi",
      modalSubtitle: "Satış + promo eşleşmesi, stok ve kasa geliri · {code}",
      tabNew: "Yeni Promo",
      tabEdit: "Promoyu düzenle",
      tabList: "Aktif Promolar ({count})",
      tabStock: "Stok durumu",
      stockEmpty: "Promolarda henüz ürün kullanılmadı",
      stockLabel: "Stok:",
      noProducts: "Ürün modülünde ürün yok. Önce Ürün ekleyin.",
      noSelection: "Henüz ürün seçilmedi",
      clearTip: "Seçimi kaldır",
      saleProduct: "Satın alınacak ürün",
      pickProduct: "Ürün seç",
      qtyLabel: "Adet",
      totalLabel: "Toplam",
      promoProduct: "Promo ürün",
      pickPromoProduct: "Promo ürün seç",
      promoQty: "Promo adedi",
      modeFree: "Bedava",
      modePercent: "Yüzde %",
      modeFixed: "Sabit fiyat",
      modePercentLabel: "Yüzde %{pct}",
      modeFixedLabel: "Sabit {amount}",
      discountLabel: "Promo indirim",
      saleLabel: "Satış",
      promoLabel: "Promo",
      kassaIncome: "Kasa geliri",
      discountWord: "indirim",
      insufficientStock: "Stok yeterli değil!",
      cancel: "İptal",
      create: "Promo oluştur",
      update: "Güncelle",
      pickSaleTitle: "Satın alınacak ürünü seç",
      pickPromoTitle: "Promo ürünü seç",
      pickerSearchPh: "Ad / barkod / SKU ile ara...",
      pickerAllCategories: "Tüm kategoriler",
      pickerNotFound: "Ürün bulunamadı",
      pickerCount: "{count} ürün · aktif para birimi: {code}",
      pickerClose: "Kapat",
      listEmpty: "Aktif promo yok",
      listEmptyHint: "\"Yeni Promo\" bölümünden oluşturun.",
      editTip: "Düzenle",
      deleteTip: "Sil",
    },
  },
  tm: {
    windowTitle: "Biznes Hasap",
    languageMenuTitle: "Dil saýlaň",
    otherAccounts: "Başga hasaplar",
    addAccount: "Hasap goş",
    userLabel: "Ulanyjy",
    passwordLabel: "Parola",
    passwordPlaceholder: "Parolaňyzy giriziň",
    loginButton: "Giriş",
    appName: "Biznes hasap",
    version: `v${pkg.version}`,
    delete: "Poz",
    edit: "Düzet",
    import: "Maglumatlary import et",
    autoSelectPrinter: "Awto saýla",
    receiptPrinter: "Çek printeri",
    standardPrinter: "Standart printer",
    addAccountTitle: "Täze Hasap Goş",
    editAccountTitle: "Hasaby Düzet",
    accountName: "Hasap / Dükan Ady",
    couchDbUrl: "CouchDB Salgysy",
    databaseName: "Maglumatlar Binýady Ady",
    save: "Ýatda sakla",
    cancel: "Ýatyr",
    selectLogo: "Logo Saýla",
    conn: {
      sectionTitle: "CouchDB Baglantysy",
      sectionHint: "Saklamazdan öň baglantysy syna we serwerdäki maglumaty çek",
      localTitle: "Ýerel baglanty (şaher Wi-Fi)",
      onlineTitle: "Onlaýn baglanty (alan ady)",
      localPlaceholder: "http://ulanyjy:parola@192.168.1.8:5984/veritabany",
      onlinePlaceholder: "http://ulanyjy:parola@alandomain:5984/veritabany",
      testOnly: "Diňe baglantysy syna",
      connect: "Baglan",
      stop: "Durdur",
      showPassword: "Parolany görke",
      hidePassword: "Parolany gizle",
      statusIdle: "Bagly däl",
      statusConnecting: "Baglanyar…",
      statusConnected: "Bagly",
      statusTested: "Sinandy",
      statusError: "Ýalňyş",
      statusOffline: "Oflaýn",
      denied: "Giriş reddedildi — ulanyjy/parola ýalňyş",
      connecting: "Baglanylyar…",
      firstWorking: "Işleýän ilkinji adres ulanylýar.",
      singleConnectionNote: "Bir wagtyň özünde bir baglanty açyk bolýar; beýlekisi awtomatik ýapylýar. Programma täzeden açylanda iň soňky ulanylan baglanty awtomatik başlaýar.",
      progressTransferring: "Geçirilýär…",
      progressDone: "Geçirme tamamlandy",
      docsReceived: "{count} resmin aldy",
      docsSent: "{count} resmin iberdi",
      liveContinues: "Janly deňeşme dowam edýär",
      liveAfterTransfer: "Janly deňeşme geçirme tamamlanandan soň başlar",
      mergeTitle: "Maglumatlar birleşdirilsin mi?",
      mergeLocalCount: "bu telefonda",
      mergeRemoteCount: "serwerde resim bar.",
      mergeKeep: "Birleşdir",
      mergeKeepHint: "Iki tarapyň resimleri bir maglumat bazasy birleşýär.",
      mergeServerOnly: "Diňe serwer",
      mergeServerOnlyHint: "Telefondaky resimler silinýär, serwerdekiler alynýar.",
      noAccount: "Hasap saýlanmady.",
      shareNote: "{name} · maglumatlar kompýuteriňizdäki serwer bilen paýlaşylýar",
      panelNote: "Bir wagtyň özünde diňe bir baglanyşyk açyk bolýar; beýlekisi öz-özünden ýapylýar. Ýaşyl ikona ýene bassaňyz baglanyşyk duralýar. Programma täzeden açylanda soňky ulanylan baglanyşyk awtomatiki başlaýar.",
    },
    confirmDeleteTitle: "Hasaby Poz",
    confirmDeleteMsg: "Bu hasaby we maglumatlary pozmak isleýändigiňize ynanýarsyňyzmy?",
    loginSuccess: "Giriş üstünlikli!",
    wrongPassword: "Ýalňyş parola!",
    selectAccount: "Hasap Saýlaň",
    selectUser: "Ulanyjy Saýlaň",

    tabKassa: "Faktura",
    tabFatura: "Faktura",
    tabPara: "Kassa",
    tabMusteri: "Müşderi",
    tabUser: "Ulanyjy",
    tabHaryt: "Haryt",
    tabHesaplama: "Hasaplama",
    tabDoviz: "Walýuta",
    
    tabDepder: "Depder",
    tabAmbar: "Ambar",
    tabKurye: "Targowy",
    tabDiger: "Başgalar",
    tabAyarlar: "Sazlamalar",
    tabLisans: "Ygtyýarnama / Açar",
    salesInvoice: "Söwda Fakturasy (Satış)",
    purchaseInvoice: "Satyn Alyş Fakturasy (Alış)",
    salesReturnInvoice: "Satuw Yzyna Gaýtarmak (Satış İade)",
    purchaseReturnInvoice: "Satyn Alyş Yzyna Gaýtarmak (Alış İade)",
    proformaInvoice: "Deslapky Faktura (Proforma)",
    quotationInvoice: "Baha Teklibi (Teklif)",
    generalCustomer: "Umumy Müşderi (Nagt)",
    scanBarcodePlaceholder: "Barkody okadyň ýa-da ýazyň...",
    addBtn: "Goş +",
    productNameCol: "Haryt Ady",
    qtyCol: "Sany",
    priceCol: "Baha",
    discountCol: "+ / - %",
    totalCol: "Jemi",
    emptyCartMsg: "Sebet boş. Barkody okadyň ýa-da sagdan haryt saýlaň.",
    itemsCount: "Haryt",
    subtotalLabel: "Aralyk Jemi:",
    bulkPercentLabel: "Toptan %",
    amountDueLabel: "TÖLEMEK ÜÇIN",
    cashMethod: "Nagt",
    cardMethod: "Karta",
    creditMethod: "Nesiýe",
    splitMethod: "Bölünen",
    cashReceivedLabel: "Alnan Nagt",
    changeDueLabel: "Gaýtarym",
    exactBtn: "Doly Baha",
    holdDraftBtn: "Garalama Sakla",
    completeSaleBtn: "Satuwy Tamamla (F2)",
    searchProductsPlaceholder: "Haryt gözle...",
    allCategories: "Hemmesi",
    stockLabel: "Ambar",
    outOfStock: "Ammarda Ýok",
    saleCompletedToast: "Söwda Üstünlikli Tamamlandy!",
    draftHeldToast: "Faktura garalama hökmünde saklandy.",
    productNotFoundToast: '"{code}" barkodly haryt tapylmady.',
    logoutTooltip: "Ulgamdan Çyk",
    internalNotePlaceholder: "Bellik ýaz...",

    posTerminalTitle: "Bank Kart Terminaly (POS)",
    posTerminalConnected: "Kart Enjamy Birikdirilen (Taýyn)",
    posDeviceNotConnectedTitle: "Kart Terminaly Birikdirilmedik!",
    posConnectDeviceMsg: "Haýyş edýäris, kart bilen töleg alýan enjamy kompýutere birikdiriň we gaýtadan synanyşyň.",
    posAnalyzing: "Enjam Birikmesi Barlanýar...",
    posRetryScan: "Enjamy Gaýtadan Barla",
    posWaitingCard: "Müşderi Kartyna Garaşylýar (Galtaşyksyz / Çip)...",
    posProcessing: "Töleg Geçirilýär, Garaşyň...",
    posApproved: "Töleg Üstünlikli Kabul Edildi!",
    posDeclined: "Töleg Ret Edildi / Ýatyryldy",
    posAutoPrinting: "Söwda Çeki Awtomatiki Çykarylýar...",
    posAuthCode: "Tassyklama Kody",
    receiptTitle: "SÖWDA ÇEKI",
    printBtn: "Çek Çykar (Print)",
    closeBtn: "Ýap / Täze Söwda",
    thanksMsg: "Bizi saýlanyňyz üçin sag boluň!",
    pos: {
      paymentCancelled: "Töleg ýatyryldy",
      newSale: "Täze Söwda",
      noPermission: "Rugsat ýok",
      noStock: "Stok ýok. Minus satyş üçin harytda ikony açyň.",
      inactiveProduct: "Bu haryt passiw — sepete goşup bolmaýar.",
      resetDone: "Ähli üýtgeşmeler geri alyndy.",
      cartEmptyExport: "Sepet boş — eksport edip bolmaýar.",
      excelExported: "Excel eksport edildi.",
      exportCancelled: "Eksport ýatyrlanmady.",
      exportDialogTitle: "Faktura Excel eksporty",
      exportFailed: "Excel eksporty başartmady.",
      belowCost: "Alş bahasynyň aşagyna satyp bolmaýar (alş: {cost}).",
      selectCustomer: "Müşderi saýlaň",
      cartEmpty: "Sepet boş",
      cartEmptyAddFirst: "Sebet boş. Öň haryt goşuň.",
      specialPriceMissing: "Ozel baha girizilmedik",
      specialPriceSaved: "{count} harydyň ozel bahasy {customer} üçin saklandy",
      priceSaveFailed: "Baha saklanmady",
      specialPriceNotFound: "Müşderiniň ýa-da harytlaryň ozel bahasy tapylmady",
      pricesApplied: "{count} harydyň bahasy dikeldildi",
      printFailed: "Çap başartmady: {reason}",
      unknownError: "näbelli säwlik",
      compositionShort: "Düzüm stogy ýetmän: {list}",
      dateBeforeStart: "Bu sene operasiýa açylmady (başlangyç: {date}).",
      dateAfterEnd: "Operasiýa döwri gutardy (soňky: {date}).",
      cashSaleBlocked: "Bu müşderä nagt satuw edip bolmaýar.",
      creditLimitExceeded: "Karz limiti aşylýar (limit: {limit} TMT).",
      nothingToReset: "Arassalamak üçin üýtgeşme ýok",
      paneCart: "Sebet",
      panePay: "Töleg",
      goToPayment: "Tölege geç",
      resetTitle: "Geri almak",
      resetMsg: "Häzirki ekrandaky ähli üýtgeşmeler (saýlanan harytlar, müşderi, baha görnüşi, töleg) arassalanýar. Dowam etmek isleýärmiň?",
      resetCancel: "Ýatyr",
      resetConfirm: "Geri al",
      fabAddProduct: "Haryt goş",
      fabAddCustomer: "Müşderi goş",
      fabAddMoney: "Hereket goş",
      fabAddCourier: "Targowçy goş",
      fabAddCurrency: "Walýuta goş",
      fabAdd: "Goş",
      alertsTitle: "Duýduryşlar",
      alertsCount: "{count} duýduryş",
      alertsAttention: "{count} sany üns talap edýär",
      alertsAllOk: "Ähli zat ýerinde",
      alertsEmpty: "Häzirlikçe duýduryş ýok",
      alertsEmptyHint: "Kritik stok ýa-da möhleti ýakynlaşan bergi ýok.",
      alertsLowStock: "Stokdaky azalan harytlar",
      alertsNoCritical: "Kritik stok ýok",
      alertsCriticalLevel: "Kritik dereje",
      alertsMinus: "MINUS",
      alertsDueCredits: "Töleg wagty ýakynlaşýan nesiýeler",
      alertsNoDue: "Möhleti ýakyn bergi ýok",
      alertsOverdue: "MÖHLETI GEÇDI",
      alertsToday: "ŞU GÜN",
      dueOverdue: "{days} gün geçdi",
      dueToday: "Şu gün",
      dueDaysLeft: "{days} gün galdy",
      csTitle: "Müşderi gözle",
      csFoundHeader: "Tapylan: {count} müşderi",
      csFound: "Tapyldy: {count} müşderi",
      csSearchLabel: "Gözleg",
      csSearchPlaceholder: "Ady / telefon...",
      csStartsWith: "Sözüň başyndan başlap gözle",
      csWhoLabel: "Kimler gözlenilsin?",
      csBadgeCustomer: "Müşderi",
      csWhoBoth: "Müşderi + Işgär",
      csBadgeEmployee: "Işgär",
      csRegionLabel: "Etrap",
      csAll: "Hemmesi",
      csDebtLabel: "Bergi ýagdaýy",
      csDebtHas: "Bergisi bar",
      csDebtNone: "Bergisi ýok",
      csDebtOverdue: "Möhleti geçen",
      csNotFound: "Müşderi tapylmady",
      psTitle: "Haryt gözle",
      psFoundHeader: "Tapylan: {count} haryt",
      psFound: "Tapyldy: {count} haryt",
      psSearchLabel: "Gözleg",
      psSearchPlaceholder: "Ady / kody / ştrihkody...",
      psWarehouseLabel: "Ammar",
      psCategoryLabel: "Kategoriýa",
      psAll: "Hemmesi",
      psBarcodeStatus: "Ştrihkody ýagdaýy",
      psBsWith: "Barlar",
      psBsWithout: "Ýoklar",
      psStockStatus: "Stok ýagdaýy",
      psSsInStock: "Stokda bar",
      psSsOut: "Stok gutardy",
      psSsCritical: "Kritik stok",
      psNotFound: "Haryt tapylmady",
      psStock: "Stok",
      psClose: "Barysy",
      dpTitle: "Çap — {no}",
      dpPreview: "Öňünden görkeziş",
      dpPrinter: "Yazdyryjy",
      dpDefaultPrinter: "Deslapky (düzgün)",
      dpPrintBtn: "Çap et",
      dpPrinted: "Çap edildi.",
      dpPrintFailed: "Çap başartmady.",
      dpNote: "Mukdar we bahalar häzirki sepede görä. Faktura doly gutarylmadyk — diňe garalama çapy.",
      faSaveTip: "Faktura ýazga al (garalama)",
      faSaveLabel: "Faktura ýazga al",
      faDraftsTip: "Garalama fakturalar",
      faDraftsLabel: "Garalama fakturalar",
      faSoundOnTip: "Bildirim sesi açyk — basyp öçür",
      faSoundOffTip: "Bildirim sesi ýapyk — basyp aç",
      msWarehouseTip: "Ammar saýla",
      msWarehouse: "Ammar",
      msTargetTip: "Hedef ammary saýla",
      msTargetDisabledTip: "Diňe \"Ammarlar arasyndaky hereket\" üçin işjeň",
      msWarehouse2: "Ammar 2",
      msTransferNote: "Ammarlar arasyndaky geçirim: 1-nji ammardan 2-nji ammara",
      changeTip: "Gaytargy: Alnan nagt − tölemek üçin",
      changeLabel: "Gaytargy",
      ledgerTip: "Depder saýla",
      ledgerOption: "Depder",
      swLabel: "Sene / Wagt",
      swPickTip: "Senäni we wagty el bilen saýla",
      swNowTip: "Häzirki wagta dolan",
      swManualTip: "El bilen saýlanan wagt",
      swLiveTip: "Häzirki wagt",
      shortcutsTitle: "Klawiatura gysgaltmalary",
      shortcutsHint: "ESC ýa-da daşyna basyp ýapyň",
      emptySection: "Bu bölüm häzirlikçe boş",
      emptySectionHint: "Ýakyn wagtda mazmun goşular.",
      icbMenuTitle: "Faktura Görnüşi / Belgesi",
      icbCustomerSearchTip: "Müşderi gözle (F2)",
      icbAddTip: "Haryt goş (Enter)",
      icbClearCodeTip: "Kody aýyr",
      icbNewCodeTip: "Täze kod dör",
      icbCopiesTip: "Çek sany",
      icbCopiesNone: "Çek çykarma",
      icbCopiesCount: "{count} sany çek",
      printerSettingsTip: "Çap ediji sazlamalary",
      generalSearchTip: "Umumy gözleg",
      unitCol: "Ölçü",
      switchAccount: "Hasap çalyş",
      cameraScanTip: "Kamera bilen ştrihkod oka",
      gridView: "Tor görnüşi",
      listView: "Sanaw görnüşi",
      cardScanningPorts: "USB / COM / LAN portlary skanirlenýär...",
      cardTestModeTip: "Synag üçin enjamy bagly hasapla",
      cardTestMode: "Synag režimi",
      cardWaitingBefore: "Müşderi kartyny enjama okatmalı. Enjam tölegi tassyklandan soň aşakdaky",
      cardApprove: "Tassykla",
      cardWaitingAfter: "düwmä basyň.",
      cardBankApproval: "Bank tassyklamasy alynýar...",
      cardPaymentFailed: "Töleg tamamlanmady.",
      cardApproveBtn: "Töleg kabul edildi & Çek çykar (Enter)",
    },
    invoices: {
      title: "Fakturalaryň Sanawy",
      subtitle: "Satyryň üstüne iki gezet bas → faktuyny aç, soňra F11 (Excel) ýa-da F12 (çap)",
      filterToday: "Şügün",
      filterYesterday: "Düýn",
      filterThisWeek: "Şu Hepde",
      filterThisMonth: "Şu Aý",
      filterAll: "Ählisi",
      rangeTitle: "Haçankylar",
      presetTooltip: "Taýýar aralygy saýlaň",
      presetMenuTitle: "Taýýar Aralygy Saýla",
      presetToday: "Şu gün",
      presetYesterday: "Düýn",
      presetDayBefore: "Öňňun",
      presetThisWeek: "Şu hepde",
      presetThisMonth: "Şu aý",
      presetThisYear: "Şu ýyl",
      presetLastWeek: "Geçen hepde",
      presetLastMonth: "Geçen aý",
      presetSinceYesterday: "Düýnden bäri",
      presetSinceDayBefore: "Öňňundan bäri",
      presetSinceLastWeek: "Geçen hepdäniň başyndan bäri",
      presetSinceLastMonth: "Geçen aýyň başyndan bäri",
      presetLastYear: "Geçen ýyl",
      searchPlaceholder: "Faktura kody, müşderi ady...",
      typeLabel: "Görnüşi:",
      typeSales: "Söwda (Satış)",
      typeAll: "Hemmesi (Ählisi)",
      typePurchase: "Satyn Alyş (Alış)",
      typeReturns: "Yzyna Gaýtarmak (İade)",
      typeTransfer: "Ammarlar Hereketi",
      typeOther: "Başga Giriş/Çykyş",
      statsTotal: "Jemi Faktura",
      statsCountSuffix: "sany",
      statsAmount: "Jemi Tutar",
      payCash: "Nagt",
      payCard: "Karta",
      payCredit: "Nesiýe",
      paySplit: "Bölünen",
      voidedToggleTip: "Ýatyrylan fakturalary görkez / gizle",
      voidedToggle: "Ýatyrylanlar",
      emptyTitle: "Görkezilen filtre görä faktura tapylmady.",
      emptyHint: "Tarih ýa-da görnüş filtrini üýtgedip görüň.",
      colNo: "Faktura Kody",
      colDate: "Sene / Wagt",
      colCustomer: "Müşderi / Cari",
      colType: "Görnüşi",
      colPayment: "Töleg Usuly",
      colItems: "Haryt",
      colAmount: "Jemi Tutar",
      colAction: "Amal",
      rowOpenTip: "Fakturany açmak üçin iki gezet basyň",
      receiptOpenTip: "Fakturanyň çekini açmak üçin basyň",
      voidedBadge: "Ýatyryldy",
      returnBadge: "İade",
      deleteTip: "Faturany pozmak",
      footerHint: "Faturany görmek üçin satyra ýa-da \"Çek\" düwmesine basyň.",
      closeBtn: "Ýap (Esc)",
      deleteTitle: "Fakturany pozmak",
      deleteMsg: "Bu fakturany pozmak isleýäňizmi? Bu amal yza gaýtarylyp bilinmez.",
      deleteCascade: "Faktura bilen bagly ammar stoky, müşderi bergisi we Kassa/Depder ýazgylary hem tersine düzediler.",
      customerLabel: "Müşderi",
      cancelBtn: "Ýatyr",
      confirmDeleteBtn: "Hawa, poz",
      deletedTitle: "Silinen fakturalar",
      deletedEmpty: "Silinen faktura ýok.",
      deletedColNo: "Faktura №",
      deletedColDate: "Senesi",
      deletedColAmount: "Tutar",
      deletedColAt: "Silinen wagty",
      deletedColBy: "Silan",
      closeShort: "Ýap",
      deleteSelected: "Saýlananlary poz ({count})",
      deleteAll: "Hemmesini poz",
      permTitle: "Dynmäzdan pozmak",
      permAllMsg: "Ähli silinen fakturalary dynmäzdan pozýar. Bu amal yzyna gaýtaryp bolmaýar. Dowam etmek isleýärmiň?",
      permSelectedMsg: "Saýlanan {count} fakturany dynmäzdan pozýar. Bu amal yzyna gaýtaryp bolmaýar. Dowam etmek isleýärmiň?",
      permCancel: "Ýatyr",
      permConfirm: "Poz",
    },
    kassa: {
      cashIn: "Nagt Girişi",
      cashOut: "Nagt Çykyşy",
      noExpensePerm: "Çykdajy goşmaga rugsadyňyz ýok.",
      noIncomePerm: "Girdeji goşmaga rugsadyňyz ýok.",
      noCategoryPerm: "Bu kategoriýa üçin rugsat ýok.",
      shownCount: "{count} hereket görkezilýär",
      today: "Şu gün",
      balanceCard: "Kassadaky galyndy",
      todayIncome: "Şu günki giriş",
      todayExpense: "Şu günki çykyş",
      cashLabel: "Nagt",
      cardLabel: "Kart/Geçirme",
      deleteMsg: "Bu kassa hereketini pozmak isleýärsiňizmi?",
      editTip: "Redaktirle",
      deleteTip: "Pozmak",
      searchPlaceholder: "Düşündiriş ýa-da kategoriýa boýunça gözle...",
      advancedSearchTip: "Giňişleýin gözleg (F3)",
      all: "Ählisi",
      income: "Girdeji",
      expense: "Çykdajy",
      allCategories: "Ähli kategoriýalar",
      allCustomers: "Ähli müşderiler",
      dateStartTip: "Başlangyç sene",
      dateEndTip: "Ahyrky sene",
      clear: "Arassala",
      empty: "Hereket tapylmady",
      colDate: "Sene / Wagt",
      colType: "Görnüşi",
      colCategory: "Kategoriýa",
      colCustomer: "Müşderi / Üpjün ediji",
      colPayment: "Töleg görnüşi",
      colAmount: "Mukdar",
      colDesc: "Düşündiriş",
      colAction: "Amal",
      incomeBadge: "↑ Girdeji",
      expenseBadge: "↓ Çykdajy",
      editTitle: "Hereketi redaktirle",
      addIncomeTitle: "Girdeji goş",
      addExpenseTitle: "Çykdajy goş",
      dateLabel: "Sene",
      searchTitle: "Kassa hereketi gözle",
      foundPrefix: "Tapylan: ",
      txSuffix: "hereket",
      noteLabel: "Bellik",
      notePlaceholder: "Bellik / müşderi / faktura...",
      dateRange: "Haçankylar",
      allShort: "Hemmesi",
      none: "Hiç biri",
      payCard: "Karta",
      payTransfer: "Geçirme",
      customerLabel: "Müşderi",
      userLabel: "Ulanyjy",
      ledgerLabel: "Depder",
      currencyLabel: "Walýuta",
      onlyDue: "Diňe möhleti bar bolan (Nesiýe) hereketler",
      searchOrType: "Gözle ýa-da ýaz...",
      quickAdd: "Ýazgyda ýok — täze goş: \"{name}\"",
      debtLabel: "Bergi",
      creditLabel: "Aljy (kredit)",
      settledLabel: "Hasaby arassa",
      customerOptional: "Müşderi (islege görä)",
      supplierOptional: "Üpjün ediji (islege görä)",
      fromWhom: "Kimden",
      toWhom: "Kime",
      staffLabel: "Işgär",
      selectOption: "— Saýla —",
      staffNameLabel: "Işgär ady (bellige alynmadyk)",
      subCategoryLabel: "Alt kategoriýa",
      errAmount: "Mukdar 0-dan uly bolmaly.",
      errDate: "Senäni saýlaň.",
      errCustomer: "Müşderini saýlaň.",
      errPerson: "Kim bilen baglydygyny ýazyň.",
    },
    hasaplama: {
      title: "Hasaplama",
      result: "Netije",
      period: "Döwür",
      periodToday: "Şu gün",
      periodWeek: "Şu hepde",
      periodMonth: "Şu aý",
      periodLastMonth: "Geçen aý",
      periodQuarter: "Çärýek",
      periodYear: "Ýyl",
      periodCustom: "Ýörite aralyk",
      tabXaccot: "X-Accot (günlük)",
      tabPl: "Peýda-zyýan hasabaty",
      tabDebt: "Bergi-borç hasabaty",
      tabStock: "Ambar hasabaty",
      tabCash: "Kassa hasabaty",
      tabTargow: "Targowçy netijeleri",
      summaryHideTip: "Özet kartlary gizle — hasabata has köp ýer",
      summaryShowTip: "Özet kartlary görkez",
      summaryHide: "Özeti gizle",
      summaryShow: "Özeti görkez",
      printBtn: "Çap et",
      excelBtn: "Excel-e eksport et",
      preparedAt: "Taýýarlanyldy:",
      noDataPeriod: "Döwür üçin maglumat ýok",
      income: "Girdeji",
      expense: "Çykdajy",
      incomeCaps: "GIRDEJI",
      expenseCaps: "ÇYKDAJY",
      incomeTotal: "Girdeji jemi",
      expenseTotal: "Çykdajy jemi",
      incomeItems: "Girdeji kalemleri",
      expenseItems: "Çykdajy kalemleri",
      noIncome: "Girdeji ýok",
      noExpense: "Çykdajy ýok",
      incomeMinusExpense: "Girdeji − Çykdajy",
      netProfit: "Arassa peýda",
      netProfitFooter: "Arassa peýda: {amount} TMT",
      periodMovement: "Döwür boýunça hereket (girdeji / çykdajy)",
      colDesc: "Beýan",
      colCount: "Sany",
      colAmountTmt: "Tutar (TMT)",
      colCategory: "Kategoriýa",
      colCustomer: "Müşderi",
      colDebtTmt: "Bergi (TMT)",
      colLastPayment: "Soňky töleg",
      totalReceivable: "Jemi alacak",
      supplierDebt: "Üpjün edijilere bergi",
      borrowed: "Alynan karz (Karz almak)",
      lent: "Beren karz (Karz bermek)",
      receivablesTitle: "Müşderilerden alynmaly (weresiýe)",
      noDebt: "Bergi ýok — ähli hasaplar arassa",
      overdueTitle: "Möhleti geçen bergiler",
      noOverdue: "Möhleti geçen bergi ýok",
      colInvoiceNo: "Faktura №",
      colDueDate: "Vade senesi",
      colLate: "Gecikme",
      daysLate: "{days} gün",
      totalReceivableFooter: "Jemi alacak: {amount} TMT",
      colProduct: "Haryt",
      colQty: "Sany",
      colPurchase: "Alış",
      colPurchaseValue: "Alış degeri",
      colSaleValue: "Satyş degeri",
      skuCount: "Haryt görnüşi",
      totalQty: "Jemi sany",
      byPurchasePrice: "Alış bahasy boýunça",
      bySalePrice: "Satyş bahasy boýunça",
      stockState: "Haryt ostatogy",
      filterAll: "Ählisi",
      filterPositive: "+ (plyus)",
      filterNegative: "− (minus)",
      stockCountLabel: "{shown} / {total} haryt",
      noStockKind: "Bu görnüşde haryt ýok",
      colStock: "Stok",
      colSale: "Satyş",
      colStockValue: "Stok bahasy (satyş)",
      colAction: "Amal",
      showTip: "Görkez",
      createInvoiceTip: "Faktura döret",
      criticalStockLabel: "Kritik stok:",
      expiryLabel: "Golkaýer:",
      purchasePriceLabel: "Alş bahasy:",
      wholesaleLabel: "Lomoy bahasy:",
      barcodeLabel: "Barkod:",
      belowCritical: "Kritik stok derejesinden aşak ({count})",
      bestSellers: "Iň köp satylan harytlar",
      worstSellers: "Iň az satylan harytlar",
      noSalesPeriod: "Döwür üçin satyş maglumaty ýok",
      purchaseValueFooter: "Jemi alış degeri: {amount} TMT",
      colLedger: "Depder",
      colCurrency: "Walýuta",
      colBalance: "Galyndy",
      byLedgers: "Depderler boýunça",
      noLedgers: "Depder ýok",
      paymentMethodIncome: "Töleg görnüşi (girdeji)",
      noIncomePeriod: "Döwür üçin girdeji ýok",
      totalBalanceFooter: "Jemi galyndy: {amount} TMT",
      colTargow: "Targowçy",
      colOrderCount: "Sargyt sany",
      colTotalAmount: "Jemi tutar (TMT)",
      colTotalAmountShort: "Jemi tutar",
      colNewCustomer: "Täze müşderi",
      colRank: "Sıra",
      noTargows: "Targowçy ýok",
      fullViewInTargow: "Doly görnüşi Targowy bölüminde",
      totalFooter: "Jemi: {amount} TMT",
      xaccotTitle: "X-Accot · günlük biznes",
      xaccotPrintTitle: "X-ACCOT (Günlük biznes)",
      cardInvoices: "Faktura sany",
      cardSalesTotal: "Satyş jemi",
      cardCash: "Nagt",
      cardCard: "Karta",
      cardCredit: "Nesiýe",
      cardKassaIncome: "Kassa girdeji",
      cardKassaExpense: "Kassa çykdajy",
      cardNet: "Arassa",
      salesTotalTmt: "Satyş jemi (TMT)",
      colValue: "Baha",
      netFooter: "Arassa: {amount} TMT · {count} faktura",
      dayInvoices: "Günüň fakturalary ({count})",
      allDayInvoices: "Günüň ähli fakturalary ({count})",
      noInvoicesToday: "Bu gün üçin faktura ýok",
      colTime: "Wagt",
      colPayment: "Töleg",
      dayBestSellers: "Günüň iň köp satylan harytlary",
      noSalesToday: "Bu gün üçin satyş ýok",
      productKindsSuffix: "{count} haryt görnüşi",
      calculator: "Hasaplaýjy",
      currencyLabel: "Walýuta",
      totalIncome: "Umumy girdeji",
      totalExpense: "Umumy çykdajy",
      stockValue: "Ambardaky harytlaryň bahasy",
      ledgerBalance: "Kassadaky / Depderdäki galyndy",
    },
    sazlamalar: {
      sectionGeneral: "Umumy Sazlamalar",
      resetToDefaults: "Deslapky Sazlamalara Gaýtar",
      unitNameRequired: "At giriziň.",
      unitNameRequiredEdit: "At giriziň.",
      unitExists: "Bu ölçeg birligi eýýäm bar.",
      unitInUse: "\"{name}\" ulanylýar, pozup bolmaýar.",
      unitNewPh: "Täze birlik (meselem: RULON)",
      unitAdd: "Birlik goş",
      unitColName: "At",
      unitColUsedBy: "Ulanýan haryt",
      unitColAction: "Amal",
      unitEditTitle: "Redaktirle",
      unitFixedNoDelete: "Sabit birlik pozulmaýar",
      unitRuleHint: "Bir birlik harytlarda ulanylýan bolsa pozup bolmaýar. Sabit birlikler hem pozulmaýar.",
      settingsTitle: "Sazlamalar",
      secPrinter: "Printer sazlamalary",
      secScale: "Terezi sazlamalary",
      secReceipt: "Çek sazlamalary",
      secPermissions: "Ygtyýarlar",
      secUnits: "Ölçeg birlikleri",
      secRules: "Düzgünler",
      secDeleted: "Silinen fakturalar",
      secSync: "Bulut eşitleme",
      secAudit: "Işlem günlügi",
      secGeneral: "Umumy sazlamalar",
      unsavedTitle: "Ýatda saklanmadyk üýtgeşmeler bar, dowam etmek isleýärsiňizmi?",
      unsavedHint: "Bölümi çalşyrsaňyz, häzirki üýtgeşmeler ýitiriler.",
      cancelBtn: "Ýatyr",
      continueBtn: "Dowam et",
      saveBarDirty: "Ýatda saklanmadyk üýtgeşmeler bar",
      saveBarClean: "Üýtgeşme ýok",
      saveBtn: "Ýatda sakla",
      noEditPerm: "Sazlamalary üýtgetmäge rugsadyňyz ýok.",
      saved: "Sazlamalar ýatda saklandy.",
      backupSaveTitle: "Ätiýaçlyk sakla",
      backupFilterName: "Biznes Hasap ätiýaçlyk (.bhbak)",
      backupSaved: "Ätiýaçlyk .bhbak faýly saklandy.",
      exportCancelled: "Eksport ýatyryldy.",
      exportFailed: "Eksport başartmady.",
      importDone: "{count} ýazgy import edildi. Sahypany täzeläň.",
      importFailed: "Import başartmady: diňe .bhbak (ýa-da köne .json ätiýaçlyk) kabul edilýär.",
      loading: "Sazlamalar ýüklenýär...",
      genDesc: "Dil, walýuta we sene görnüşi",
      genLanguage: "Dil",
      genDateFormat: "Sene we wagt formaty",
      genBaseCurrency: "Esasy walýuta",
      genBaseCurrencyHint: "Sistem esas walýutasy üýtgedilip bilinmez",
      genGoToCurrency: "Walýuta sazlamalaryna git",
      backupTitle: "Ätiýaçlyk nusgasy",
      backupDesc: "Maglumatlaryň awtomatik ätiýaçlygy",
      backupAuto: "Awtomatik ätiýaçlyk nusgasy",
      backupAutoDesc: "Maglumatlar bellenen ýygylykda ätiýaçlandyrylýar",
      backupFreq: "Ýygylyk",
      backupDaily: "Gündelik",
      backupWeekly: "Hepdelik",
      backupFolder: "Ätiýaçlyk papkasy",
      dataTitle: "Maglumatlar",
      dataDesc: "Ätiýaçlyk .bhbak faýly — diňe Biznes Hasap açyp bilýär (zip/json däl)",
      dataExport: "Maglumatlary eksport et",
      dataImport: "Maglumatlary import et",
      aboutTitle: "Ulgam barada",
      aboutDesc: "Programma wersiýasy we lisans maglumaty",
      aboutVersion: "Wersiýa",
      aboutLicense: "Lisans",
      aboutLicenseValue: "Biznes Hasap · Sanly",
      encTitle: "Maglumat bazasyny şifrlemek",
      encDesc: "Maglumatlar lisans açaryndan ösdürilýän parol bilen şifrlenýär",
      encEnabledNotice: "Şifrleme işjeň. Maglumat bazasy şifrlenen görnüşde saklanýar; lisanssyz enjamda açylmaz.",
      encWarn1: "Şifrleme açylandan soň lisanssyz enjamda maglumat okalyp bilinmez.",
      encWarn2: "Dowam etmezden öň ätiýaçlyk nusga (.bhbak) alyň.",
      encWarn3: "Bulut eşitleme ulanylsa, uzak serwerde maglumat şifrlenen galyar.",
      encWarn4: "Çeşme (şifresiz) maglumat bazasy POZULMAÝAR — islen wagt şifrlemäni öçürip dolanyp bilersiňiz.",
      encMigrating: "Göçürilýär... {done}/{total} maglumat bazasy",
      encDone: "Göçürme tamamlandy: {count} ýazgy nusgalandy we barlandy. Çeşme bazalar saklandy.",
      encFailed: "{count} ýazgy göçürilmedi — şifrleme AÇYLMADY. Hiç hili maglumat ýitmedi.",
      encDisabledNotice: "Şifrleme öçürildi. Programma täzeden açylanda öňki (şifresiz) maglumat bazasy ulanylar.",
      encRestart: "Täzeden başlat (üýtgeşmäniň güýje girmegi üçin)",
      encEnable: "Maglumat bazasyny şifrle",
      encDisable: "Şifrlemäni öçür",
      encConfirmEnableTitle: "Ähli hesaplaryň maglumatlary şifrlenen bazaya KOPYALANAR. Dowam etmelimi?",
      encConfirmEnableHint: "Çeşme maglumat bazasy pozulmaýar. Lisanssyz enjamda şifrlenen maglumat açylmaz.",
      encConfirmDisableTitle: "Şifrlemäni öçürmek isleýärsiňizmi?",
      encConfirmDisableHint: "Programma täzeden açylanda öňki (şifresiz) maglumat bazasy ulanylar. Maglumat ýitmez.",
      firmTitle: "Firma maglumatlary",
      firmDesc: "Ad, kod, başlyk, telefon, faks, salgy we salgyt göterimi",
      firmName: "Firma ady",
      firmCode: "Firma kody",
      firmTitleField: "Başlyk (beýany)",
      firmPhone: "Telefon",
      firmFax: "Faks",
      firmAddress: "Salgy",
      firmTax: "Salgyt göterimi (%)",
      opsTitle: "Operasiýa düzgünleri",
      opsDesc: "Pasif ýazgylar, alş bahasy, nesiýe möhleti we seneler",
      opsInactiveCustomer: "Passiw müşderini faktura/kassada ulan",
      opsInactiveProduct: "Passiw harydy sepete goş",
      opsBelowCost: "Alş bahasynyň aşagyna sat",
      creditMin: "Nesiýä möhleti (iň kiçi gün)",
      creditMax: "Nesiýä möhleti (iň uly gün)",
      creditDefault: "Nesiýä möhleti (deslapky gün)",
      opStart: "Operasiýa başlangyç senesi (boş = açyk)",
      opEnd: "Operasiýa soňky senesi (boş = açyk)",
      barcodeTitle: "Barkod okaýjy",
      barcodeDesc: "Tarapyzdaky okaýjynyň goşýan prefix/suffix belgilerini arassala",
      barcodePrefix: "Prefix (başdaky belgiler)",
      barcodeSuffix: "Suffix (soňky belgiler)",
      prKindStandard: "Adaty printer",
      prKindReceipt: "Çek printeri",
      prBtConnected: "Bluetooth printer birikdi: {name}",
      prBtFailed: "Bluetooth birikmedi: {error}",
      prBtScanDone: "Gözleg gutardy — sanawdan printeri saýlaň.",
      prBtScanFailed: "Gözleg başartmady: {error}",
      prBtPicked: "Birikdi: {name} — synag çapyny ediň.",
      prBtPickFailed: "Birixip bolmady: {error}",
      prBtTestSent: "Synag çeki iberildi — printeri barlaň.",
      prBtNotConnected: "Printer birikmedik. Öň birikiň.",
      prDesktopOnly: "Printerleri diňe masaüstü (Electron) programmada görmek bolýar.",
      prNone: "Hiç printer tapylmady. Windows-da printer goşuň.",
      prTestDesktopOnly: "Synag çap diňe masaüstü programmada elýeterli.",
      prTestSent: "Synag çap iberildi — printeri barlaň.",
      prTestFailed: "Çap başartmady: {reason}",
      prUnknownError: "näbelli säwlik",
      prStatusTitle: "Printer agdaýy",
      prStatusDesc: "Sistemada tapylan printerler we baglanyşyk ýagdaýy",
      statusConnected: "Birikdi",
      statusDisconnected: "Birikmedi",
      prRefresh: "Printerleri täzele",
      prFound: "{count} printer tapyldy",
      prBrowserMode: "Brauzer režimi",
      prDefault: "Esasy",
      prSettingsDesc: "Esasy printer we çap görnüşi",
      prBtName: "Bluetooth termal printer",
      prBtSub: "58/80mm mobil printer (XPrinter gabat gelýär)",
      btConnected: "Bagly",
      btNone: "Ýok",
      btScanning: "Gözlenýär...",
      btScan: "Enjamlary gözle",
      btDisconnect: "Üz",
      btPickConnect: "Saýla-baglan",
      btScanHint: "Ýakyn Bluetooth enjamlar gözlenýär... printeri açyp jübütlenme režimine geçiriň.",
      btConnect: "Baglan ›",
      btPrinting: "Çap edilýär...",
      btTestPrint: "Synag çekini çap et",
      btUsbHint: "USB printer: OTG kabel bilen tak, Android ulgam penjiresinden rugsat ber — çek ýene şu programmadan çykarylýar.",
      btWifiHint: "Tor (WiFi) printer: şol bir tor da bol, IP-ni Baglanyşyk → Tor bölümine ýaz.",
      btClassicHint: "Köne görnüşli (klassik) Bluetooth printerler sanawda görünmez — BLE goldaýan termal printer gerek.",
      prDefaultPrinter: "Esasy printer",
      selectOption: "— Saýla —",
      prKindLabel: "Printer görnüşi",
      prPaperWidth: "Kagyz ini",
      prPaperWidthHint: "Termal çek printerleri üçin",
      prConnection: "Baglanyşyk görnüşi",
      prNetwork: "Tor (IP)",
      prIp: "IP adres",
      prPort: "Port",
      prTesting: "Çap edilýär...",
      prTest: "Synag çap et",
      scDesktopOnly: "Terezi barlagy diňe masaüstü programmada elýeterli.",
      scMobileNote: "Telefonda seri port (COM) ýok. Bluetooth tereziler indiki wersiýada goşular — şenlik agramy el bilen giriz.",
      scStatusTitle: "Terezi ýagdaýy",
      scStatusDesc: "Enjam bilen aragatnaşygy barlaň",
      scTesting: "Barlanýar...",
      scTest: "Synag",
      scTestHint: "Anlyk agram okamak barlagy",
      scSettingsDesc: "Port, model we ölçeg birligi",
      scPort: "Baglanyşyk porty",
      scModel: "Terezi modeli / markasy",
      scCustomModelNote: "Ýörite protokol üçin marka adyny giriziň (meselem: KELLER, RADWAG).",
      scUnit: "Ölçeg birligi",
      scKg: "kilogram (kg)",
      scG: "gram (g)",
      scAutoRead: "Awtomatik agram alma",
      scAutoReadDesc: "Haryt / Faktura ekranlarynda ölçenen agram awtomatik çekilsin",
      rcErrType: "Diňe PNG ýa-da JPG surat kabul edilýär.",
      rcErrSize: "Suratyň ululygy 2 MB-dan uly bolmaly däl.",
      rcTabThermal: "Termal çek (80mm)",
      rcTabStandard: "Adaty çap (A4)",
      rcLogoTitle: "Logo",
      rcLogoDesc: "Her iki çap görnüşinde hem ulanylýan surat (PNG/JPG, iň köp 2 MB)",
      rcLogoUpload: "Logo ýükle",
      rcRemove: "Aýyr",
      rcLogoWidth: "Logo ini (px; 0 = deslapky)",
      rcLogoCenter: "Logony ortalaşdyr",
      rcCenter: "Ortada",
      rcLeft: "Çepde",
      rcCompanyTitle: "Kärhana maglumatlary",
      rcCompanyDesc: "Iki çap görnüşinde hem bir hakyky çeşmeden gelýär",
      rcCompanyName: "Kärhananyň ady",
      rcAddress: "Salgysy",
      rcPhone: "Telefon belgisi",
      rcTaxId: "Salgyt belgisi / STIR",
      rcPreview: "Öňünden görmek ({paper})",
      thShowLogo: "Logo görkez",
      thShowAddress: "Salgy görkez",
      thShowPhone: "Telefon görkez",
      thShowTaxId: "Salgyt belgisi görkez",
      thShowQr: "QR kod görkez",
      thShowBarcode: "Barkod görkez",
      thShowCashier: "Kassir ady görkez",
      thShowCustomer: "Müşderi ady görkez",
      thFieldsTitle: "Görkezmeli meýdançalar",
      thFieldsDesc: "Çekde haýsy maglumatlar çap edilsin",
      thPaperTitle: "Kagyz we ýazy",
      thPaperDesc: "Termal rulonyň ini we ýazy ölçüsi",
      thFontSize: "Ýazy ölçüsi",
      thFontHint: "Göz zorlugy bolan kassirler üçin ulaldyp bolýar.",
      fontSm: "Kiçi",
      fontMd: "Orta",
      fontLg: "Uly",
      thQrTitle: "QR we çap hereketi",
      thQrDesc: "QR mazmuny, awtomatik çap we nusga sany",
      thQrContent: "QR kod mazmuny",
      qrInvoice: "Faktura belgisi (çek №)",
      qrWebsite: "Kärhananyň ady / saýt",
      qrPayment: "Töleg maglumaty",
      thAutoPrint: "Awtomatik çap",
      thAutoPrintDesc: "Satyş tamamlananda çek awtomatik çap edilsin (Faktura ekranynda).",
      thCopies: "Nusga sany (1–3)",
      thFooterNote: "Çekiň aşagyndaky ýazgy",
      thFooterPh: "Sag boluň, ýene geliň!",
      spOrientPortrait: "Dik (Portrait)",
      spOrientLandscape: "Ýatyk (Landscape)",
      spColBarcode: "Barkod / SKU",
      spColUnit: "Ölçeg birligi",
      spColUnitPrice: "Birlik bahasy",
      spColDiscount: "Ýeňillik (%)",
      spColSubtotal: "Aralyk jemi",
      spColTax: "Salgyt (KDV)",
      spInfoCurrency: "Pul birligi (TMT)",
      spInfoPayment: "Kassa (töleg usuly)",
      spInfoCustomer: "Müşderi ady",
      spInfoLedger: "Depder ady",
      spLayoutTitle: "Sahypa düzeni",
      spLayoutDesc: "A4 kagyzynyň ugry we ýaz ölçüsi",
      spOrientation: "Kagyz ugry",
      spItemsTitle: "Harytlar",
      spItemsDesc: "Haryt satyrlary nähili görkezilsin",
      spShowImages: "Harytlary resim bilen görkez",
      spShowImagesDesc: "Açyk bolsa her haryt satyrynda onuň suraty hem çap edilýär.",
      spColumns: "Görkeziljek sütünler",
      spInfo: "Görkeziljek maglumatlar",
      spInfoHint: "Kassa, müşderi, depder we pul birligi çapda görkezilsinmi.",
      spHeadFootTitle: "Sahypa başlygy / aýagy",
      spHeadFootDesc: "Ýokarsy we aşaky düzenlemeler",
      spHeader: "Sahypa başlygy",
      spHeaderDesc: "Ýokarsynda uly logo we kärhana maglumatlary görkezilsin.",
      spFooter: "Sahypa aýagy",
      spFooterDesc: "Aşaky böleginde kärhana ady we sahypa belgisi görkezilsin.",
      spSignature: "Imza / Möhür ýeri",
      spSignatureDesc: "Aşaky böleginde 'Satyjy' we 'Alyjy' imza gutulary.",
      spNotesTitle: "Bellikler / Şertler",
      spNotesDesc: "A4 çapynyň aşagyna goşulýan goşmaça tekst",
      spNotesPh: "Mysal: Haryt 14 günüň dowamynda yzyna alynýar. Töleg şertleri...",
      permRoleExists: "Bu rol eýýäm bar.",
      permProtectedDelete: "Esasy rollary pozup bolmaýar.",
      permRolesTitle: "Roller",
      permRolesDesc: "Rol şablonlary Ulanyjy moduly bilen deň modeli paýlaşýar — täze ulanyjy döredilende şu rugsatlar öňünden doldurylýar",
      permNewRolePh: "Täze rolyň ady...",
      permAddRole: "Täze rol goş",
      permDelete: "Poz",
      permRolePerms: "«{role}» roly üçin modul rugsatlary",
      permModulesNote: "{count} modul · Ulanyjy modulyndaky aýratyn üýtgeşmeler bozulmaýar",
      permAuditTitle: "Audit",
      permAuditDesc: "Ulgam hereketleriniň ýazgysy",
      permAuditLabel: "Bu ulgamda ähli hereketleri ýazga alaýsyn",
      permAuditLabelDesc: "Işjeňleşdirilse, ulanyjylaryň hereketleri ýazga alynýar",
      auditCreate: "Täze",
      auditUpdate: "Üýtgedi",
      auditDelete: "Pozdy",
      auditView: "Gördü",
      auditReadFailed: "Günlük okunamady: {error}",
      auditExportTitle: "Işlem günlügini eksport et",
      auditSaved: "Günlük .json faýla saklandy.",
      auditExportFailed: "Eksport başartmady: {error}",
      auditDesc: "Kim, haçan, haýsy ýazgyny üýtgetdi — soňky 300 ýazgy",
      auditDisabled: "Günlük ýazgysy öçüriýän. Işjeňleşdirmek üçin: Ygtyýarlar → Işlem günlügi.",
      auditHealthError: "Günlük ýazgy başartmady ({count} gezek): {error}",
      auditDocType: "Ýazgy görnüşi",
      auditUser: "Ulanyjy",
      auditAll: "Hemmesi",
      auditRefresh: "Täzele",
      auditExport: "Eksport (.json)",
      auditColTime: "Wagt",
      auditColAction: "Hereket",
      auditColType: "Görnüş",
      auditColEntry: "Ýazgy",
      auditLoading: "Ýüklenýär...",
      auditEmpty: "Günlük boş — entek üýtgeşme ýazylmady.",
      unitsDesc: "Önüm goşanda saýlanýan birlikler. Sabit gelenler pozulmaýar, üstüne goşup bilersiňiz.",
      unitColCode: "Kod",
    },
    mobile: {
      customerSearchTitle: "Müşderi gözle",
    },
    receipt: {
      receiptNo: "Çek №",
      cashier: "Kassir",
      colNo: "ÇEK NO:",
      colDate: "SENESİ:",
      colCashier: "KASSIR:",
      colCustomer: "MÜŞDERİ:",
      colItemsQty: "HARYT / SANY",
      colTotal: "JEMI",
      subtotal: "ARALYK JEMI:",
      discount: "ÝEŇILLIK:",
      paid: "TÖLENDI:",
      paidTotal: "JEMI TÖLENDI:",
      remainingDebt: "GALAN BERGI:",
      creditTerm: "NESIÝE MÖHLETI:",
      days: "gün",
      dueDate: "SOŇKY TÖLEG SENESI:",
      paymentType: "TÖLEG GÖRNÜŞI:",
      auth: "TASSYKLAMA (AUTH):",
      status: "STATUS:",
      approved: "KABUL EDILDI (APPROVED)",
      waitingAgain: "Ýene-de garaşýarys!",
      invTitle: "FAKTURA",
      invCode: "Faktura kody:",
      invNo: "Faktura:",
      invDate: "Sene:",
      invCustomer: "Müşderi:",
      invCashier: "Kassir:",
      colProduct: "Haryt",
      colBarcode: "Barkod",
      colQty: "Sany",
      colUnit: "Birlik",
      colUnitPrice: "Birlik baha",
      colPrice: "Baha",
      colDiscount: "Ýeňillik",
      colDiscountShort: "Ýeň.",
      colLineTotal: "Jemi",
      taxLabel: "Salgyt (KDV):",
      taxShort: "Salgyt:",
      subtotalLabel: "Aralyk jemi:",
      discountLabel: "Ýeňillik:",
      ledgerLabel: "Depder:",
      grandTotal: "Jemi:",
      paidLabel: "Tölendi:",
      remainingLabel: "Galan bergi:",
      paymentLabel: "Töleg görnüşi:",
      paymentShort: "Töleg:",
      seller: "Satyjy",
      buyer: "Alyjy",
      notesTerms: "Bellikler / Şertler:",
      pageOne: "Sahypa 1",
      authShort: "AUTH:",
      thermalDate: "SENE:",
      noShort: "Çek №:",
      totalCaps: "JEMI",
    },
    payment: {
      cash: "NAGT",
      card: "BANK KARTY",
      credit: "NESIÝE",
      split: "BÖLÜNEN",
    },
    excel: {
      exportSuccess: "Excel-e geçirildi",
      exportedRows: "{count} setir Excel-e geçirildi.",
      importModalTitle: "Excel-den getir (Import)",
      exportModalTitle: "Excel-e çykar (Export)",
      errorReportTitle: "Haryt Import Ýalňyşlyk Hasabaty",
      selectFile: "Excel faýl saýla",
      downloadTemplate: "Nusga faýly ýükle",
      readingFile: "Faýl okalýar...",
      importDone: "Import tamamlandy",
      importAdded: "goşuldy",
      importUpdated: "täzelendi",
      importSkipped: "geçildi",
      failedSummary: "{total} setirden {written} ýazyldy — {failed} şowsuz.",
      failedRows: "Ýazylmadyk setirler:",
      errorReport: "Ýalňyşlyk hasabaty",
      validRow: "Dogry setir",
      existing: "Bar bolan",
      errorRow: "Hataly setir",
      existingProducts: "Bar bolan harytlar üçin:",
      overwriteAll: "Hemmesini üstüne ýaz",
      skipAll: "Hemmesini geç",
      selectFileHint: "Excel faýly saýlaň — setirler şu ýerde görkeziler.",
      closeBtn: "Ýap",
      writing: "Ýazylýar...",
      importBtn: "Import et ({count})",
      statusNew: "Täze",
      savedToDocuments: "Faýl Documents bukjasyna ýazyldy.",
      saveFailed: "Faýl ýazylmady — täzeden synanyşyň.",
      selectAll: "Hemmesini saýla",
      clearSelection: "Saýlanany aýyr",
      includeStock: "Stok mukdarlary ýazylsynmy?",
      includeCost: "Alýyş bahalary ýazylsynmy?",
      exportBtn: "Excel-e eksport et ({count})",
      colName: "Haryt Ady",
      colStatus: "Ýagdaý",
      errorReportTitleCustomers: "Müşderi Import Ýalňyşlyk Hasabaty",
      detailHeaderPhone: "Telefon belgisi",
      importModalTitleCustomers: "Excel-den getir (Import)",
      exportModalTitleCustomers: "Excel-e çykar (Export)",
      existingCustomers: "Bar bolan müşderiler üçin (at/telefon gabat gelýär):",
      searchCustomers: "Müşderi gözle...",
      includeBalance: "Borç / alýak bakiýeleri ýazylsynmy?",
      customerNotFound: "Müşderi tapylmady",
      fileTooLarge: "Faýl gaty uly — iň köp {maxMB} MB kabul edilýär.",
      tooManyRows: "Faýlda gaty köp setir bar — iň köp {maxRows} setir kabul edilýär.",
      xlsNotSupported: "Köne .xls formaty goldanylmaýar. Faýly .xlsx görnüşinde ýazdyryň.",
      xlsxOnly: "Diňe .xlsx faýllary kabul edilýär.",
      invalidFile: "Faýl zaýalanan ýa-da boş.",
      readFailed: "Faýl okalyp bilinmedi.",
      mapColumns: "Sütünleri gabat getiriň",
      mappingHint: "Excel sütünlerini degişli meýdanlara gabat getiriň. Başlyk setirini üýtgedip, ulanylmajak sütünleri geçirip bilersiňiz.",
      headerRow: "Başlyk setiri",
      requiredColumn: "(hökmany)",
      unmappedColumn: "Gabat getirme / bu meýdany geçir",
      sourceColumn: "{column}. sütün — {header}",
      emptyHeader: "Başlyksyz",
      sampleCell: "Nusga: {value}",
      mappingRequired: "Hökmany meýdanlary aýratyn çeşme sütünlerine gabat getiriň we näbellilikleri aýyryň.",
      applyMapping: "Gabat getirmäni ulanyp, öňünden görüň",
      mappingAmbiguous: "Birnäçe gabat gelme — çeşmäni saýlaň",
    },
    products: {
      searchPlaceholder: "Haryt ady ýa-da barkod boýunça gözle...",
      bulkEditTitle: "Birbada köp harydy üýtget",
      bulkEdit: "Birbada Uýtgetmek",
      importExcelTitle: "Excel-den getir",
      importExcel: "Excelden getir",
      exportExcelTitle: "Excel-e çykar",
      exportExcel: "Excel-e çykar",
      allCategoriesOption: "Ählisi",
      newProduct: "Täze Haryt",
      colNameCategory: "Haryt Ady / Kategoriýa",
      colBarcode: "Barkod",
      colPurchaseSale: "Alys / Satyş",
      colStock: "Bar Stok",
      colActions: "Amallar",
      notFound: "Haryt tapylmady",
      clickToEdit: "Düzeltmek üçin basyň",
      composedTooltip: "Bu harydyň düzümi bar",
      composedBadge: "Düzüm",
      negativeStockAllowed: "Minus stok rugsat",
      compositionEditTooltip: "Haryt düzümi: düzümi görmek/redaktirlemek üçin",
      compositionAddTooltip: "Haryt düzümi (kompozisyýa) goş",
      editAction: "Üýtget",
      deleteConfirm: "Bu harydy pozmak isleýärsiňizmi?",
      noBtn: "Ýok",
      editTitle: "Harydy Üýtget",
      addTitle: "Täze Haryt Goş",
      imageChangeTitle: "Surat üýtgetmek üçin basyň",
      compressing: "Gysdyrylýar…",
      changeBtn: "Üýtget",
      imageOptional: "Surat (Isleg)",
      nameLabel: "Haryt Ady *",
      namePlaceholder: "Mysal: Coca Cola 1L",
      categoryLabel: "Kategoriýa",
      categoryPlaceholder: "Mysal: Içgiler",
      barcodeLabel: "Ana Barkod *",
      unit1Label: "Ölçeg Birligi 1",
      priceLabel: "Satyş Bahasy (Bölek) *",
      unit2Enable: "Ölçeg Birligi 2-ni işjet",
      unit2Label: "Ölçeg Birligi 2",
      unit2QtyLabel: "1 {unit2} = kaç {unit1}",
      unit2Example: "Mysal: 1 {unit2} = {qty} {unit1}",
      purchasePriceLabel: "Alyş Bahasy (Maliýet)",
      wholesalePriceLabel: "Lomaý Bahasy",
      stockLabel: "Bar Stok Mukdary",
      negativeStockTooltip: "Açykda stok 0 bolsa-da satylyp, minus gidip biler",
      negativeAllowedShort: "− gidip biler",
      inactiveTooltip: "Passiw haryt sazlamalara görä sepete goşulyp bilinmeýär",
      activeBtn: "Aktiw",
      inactiveBtn: "Passiw",
      inactiveNote: "Passiw haryt faktura/sepete goşulyp bilinmeýär (sazlamalara bagly).",
      compositionOpenTooltip: "Düzümi açmak/redaktirlemek",
      compositionBtn: "Haryt düzümi",
      criticalStockLabel: "Kritik Stok Duýduryşy",
      expiryLabel: "Ýaramlylyk Möhleti (SKT)",
      extraBarcodesLabel: "Goşmaça Barkodlar (Köp Barkod / Koli Barkody)",
      extraBarcodePlaceholder: "Ikinji ýa-da üçünji barkod...",
      addShort: "Goş",
      cancelBtn: "Ýatyr",
      saveBtn: "Sakla",
      unitNameRequired: "At giriziň.",
      unitExists: "Bu ölçeg birligi eýýäm bar.",
      customUnitPlaceholder: "Meselem: RULON",
      customUnitOption: "+ Öz ölçeg birligiňi goş",
      unitAddedHint: "Täze birlik sanawa goşulýar we saýlanýar",
      bulkModalTitle: "Birbada Uýtgetmek — Harytlar",
      changesReady: "üýtgeşme taýýar",
      bulkSearchPlaceholder: "Haryt ady / barkod / SKU...",
      bulkAllCategories: "Ähli kategoriýalar",
      colName: "Haryt ady",
      colPurchase: "Alyş",
      colSale: "Satyş",
      stockShort: "Stok",
      colCritical: "Kritik",
      errorRowsHint: "(at boş / baha minus)",
      priceRule: "Bahalar minus bolmaly däl",
      saveCount: "Ýatda sakla ({count})",
      compSaved: "Ýatda saklandy.",
      compositionTitle: "Haryt düzümi — {name}",
      compositionSearchPlaceholder: "Düzüme haryt goşmak üçin gözle...",
      selectProduct: "Haryt saýla",
      stockAmount: "Stok mukdary",
      stockPrefix: "S:",
      purchaseShort: "alş",
      saleShort: "satyş",
      components: "Düzüm bölekleri",
      noComponents: "Entek bölek saýlanmady.",
      stockInsufficient: "Stok ýeterlik däl",
      unitShort: "birim",
      totalShort: "jemi",
      removeTooltip: "Aýyr",
      totalPurchase: "Jemi alş",
      totalSale: "Jemi satyş",
      profit: "Peýda (marj)",
      mainPriceLabel: "Esasy harydyň satyş bahasy",
      useSuggestedTooltip: "Jemi satyş bahasyny ulanyň",
      useSuggested: "Önerileni ulanyň",
    },
    customers: {
      filterAllCount: "Ählisi ({count})",
      filterCustomersCount: "Müşderiler ({count})",
      filterEmployeesCount: "Işgärler ({count})",
      filterAll: "Ählisi",
      filterCustomers: "Müşderiler",
      filterEmployees: "Işgärler",
      searchPlaceholder: "At ýa-da telefon bilen gözle...",
      bulkEditTitle: "Birbada köp müşderini üýtget",
      bulkEdit: "Birbada Uýtgetmek",
      importExcelTitle: "Excel-den getir",
      importExcel: "Excelden getir",
      exportExcelTitle: "Excel-e çykar",
      exportExcel: "Excel-e çykar",
      addCustomer: "Müşderi / Işgär Goş",
      newCardTitle: "Täze Müşderi / Işgär Karty",
      colNamePhone: "Müşderi / Işgär Ady / Telefon",
      colType: "Görnüşi",
      colKind: "Görnüşi",
      colDueDate: "Möhlet",
      colBalance: "Galyndy",
      colActions: "Amallar",
      notFound: "Ýazga alnan müşderi/işgär tapylmady.",
      doubleClickHint: "Giňişleýin maglumat üçin iki gezek basyň",
      typeEmployee: "Işgär",
      typeCustomer: "Müşderi",
      typeSupplier: "Üpjün ediji",
      editAction: "Redaktirle (Üýtget)",
      generalCustomerNoDelete: "Umumy Müşderi — sistem ýazgysy, pozup bolmaýar",
      roleEmployee: "Işgär / Işçi",
      roleCustomer: "Müşderi / Alyjy",
      phoneLabel: "Telefon Belgisi",
      balanceLabel: "Galyndy (Bakiýe)",
      dueDateLabel: "Möhlet (Vade)",
      creditLimitLabel: "Bergi Limiti",
      unlimited: "Çäksiz",
      addressLabel: "Salgy / Bellikler (Adres)",
      ledgerTitle: "Fakturalar & Bergi / Algy Taryhy",
      txCountSuffix: "faktura / hereket",
      noTransactions: "Bu müşderi üçin faktura ýa-da bergi/algy hereketi tapylmady.",
      colDate: "Sene (Haçan)",
      colInvoiceCode: "Faktura Kody",
      colReason: "Näme Üçin (Sebäbi)",
      colDebit: "Bergi (+)",
      colCredit: "Töleg / Algy (-)",
      closeBtn: "Ýap",
      receiptTooltip: "Fakturanyň çek sanawyny görmek üçin basyň",
      reasonSalesInvoice: "Söwda Fakturasy ({count} haryt)",
      reasonInvoiceOp: "Faktura Hasaby",
      reasonCreditSale: "Nesiýe Söwda Fakturasy (Haryt Alyş)",
      reasonCashPayment: "Nagt Bergi Tölegi (Kassa)",
      reasonWholesale: "Toptan Söwda Fakturasy (Nesiýe)",
      reasonBankTransfer: "Bank Karty / Geçirim Tölegi",
      reasonOpening: "Ilkinji Hasap Galyndysy (Açylyş)",
      editTitle: "Redaktirle — {name}",
      nameLabel: "Ady Familiýasy / Firma Ady *",
      namePlaceholder: "Örn: Ahmet Ýylmaz",
      nameReadOnlyTitle: "Umumy Müşderi — sistem ýazgysy, ady üýtgedilmeýär",
      phoneLabelForm: "Telefon Belgisi",
      typeLabel: "Görnüşi (Tipi)",
      typeCustomerOption: "Müşderi (Alyjy)",
      typeEmployeeOption: "Işgär (Işçi)",
      dueDateLabelForm: "Möhlet Güni (Töleg Möhleti)",
      creditLimitLabelForm: "Bergi Limiti (Maksimum)",
      addressLabelForm: "Salgy / Bellikler",
      addressPlaceholder: "Salgy ýa-da düşündiriş...",
      balanceAutoTitle: "Faktura/Kassa hereketlerinden awtomatik hasaplanýar — el bilen üýtgedilmeýär",
      balanceAutoNote: "Faktura/Kassa hereketlerinden awtomatik hasaplanýar — el bilen üýtgedilmeýär.",
      activeLabel: "Aktiw (işledilýär)",
      cashBlockedLabel: "Nagt satuw gadagan",
      cashBlockedHint: "Nagt satuw gadagan — bu müşderä diňe kart/nesiýe bilen satuw edilýär.",
      saveCreateBtn: "Ýazdyr",
      bulkModalTitle: "Birbada Uýtgetmek — Müşderiler",
      changesReady: "üýtgeşme taýýar",
      bulkSearchPlaceholder: "At ýa-da telefon boýunça gözle...",
      allTypes: "Ähli görnüşler",
      colFullName: "Ady Familiýasy",
      colPhone: "Telefon",
      colAddressNote: "Salgy / Bellik",
      systemNameReadOnly: "Sistem ýazgysy — ady üýtgedilmeýär",
      errorEmptyName: "{count} hataly setir (at boş)",
      balanceLegend: "Galyndy: (+) bize borçly · (−) biz borçly",
      saveCount: "Ýatda sakla ({count})",
    },
    users: {
      errUsernameRequired: "Ulanyjy ady hökmanydyr.",
      errUsernameTaken: "Bu ulanyjy ady eýýäm ulanylýar.",
      errPasswordMismatch: "Parollar gabat gelenok.",
      errCategoryRequired: "Iň azyndan bir kategoriýa saýlaň.",
      errInvoiceTypeRequired: "Iň azyndan bir faktura görnüşi saýlaň.",
      searchPlaceholder: "Ady ýa-da rol boýunça gözle...",
      allRoles: "Ähli roller",
      newUser: "Täze ulanyjy",
      colUsername: "Ulanyjy ady",
      colRole: "Rol",
      colStatus: "Status",
      colLastLogin: "Soňky giriş",
      colActions: "Amallar",
      emptyNoUsers: "Ulanyjy ýok. Täze ulanyjy dörediň.",
      emptyNotFound: "Ulanyjy tapylmady",
      active: "Aktiw",
      passive: "Passiw",
      protectedTip: "Administrator düzedilip/silinip bilinmeýär",
      protectedBadge: "Goragly",
      editTip: "Redaktirle",
      resetPasswordTip: "Paroly täzele",
      deleteTip: "Pozmak",
      deleteMsg: "Bu ulanyjyny pozmak isleýärsiňizmi?",
      newPassword: "Täze parol",
      confirmPassword: "Paroly tassykla",
      actView: "Görkez",
      actCreate: "Goş",
      actEdit: "Üýtget",
      actDelete: "Poz",
      actReport: "Hasabat",
      colModule: "Modul",
      editTitle: "Ulanyjyny redaktirle",
      roleLabel: "Rol (elle ýazyp bolýar)",
      customRoleHint: "Täze rol — rugsatlary özüňiz belleýärsiňiz",
      passwordEditLabel: "Parol (boş goýsaňyz üýtgemez)",
      passwordNewLabel: "Parol (islege görä)",
      permissionsTitle: "Rugsatlar",
      finePermsTitle: "Kassa we Faktura inçe rugsatlary",
      kassaSection: "Kassa",
      addIncome: "Girdeji goş",
      addExpense: "Çykdajy goş",
      showBalance: "Kassa balansyny görkez",
      allowedCategories: "Rugsat berilen kategoriýalar",
      selectAll: "Hemmesini saýla",
      clearAll: "Hemmesini aýyr",
      fakturaSection: "Faktura",
      editPrice: "Bahany üýtget",
      allowDiscount: "Arzanladyş ber",
      allowedInvoiceTypes: "Rugsat berilen faktura görnüşleri",
      modeAll: "Ählisine rugsat",
      modeWhitelist: "Diňe saýlananlara",
      modeBlacklist: "Saýlanandan başga",
      removeTip: "Aýyr",
      selectedCount: "{count} saýlandy",
      noneSelected: "Entek saýlanmady",
      notFound: "Tapylmady",
      searchIn: "{label} — gözle...",
      advTitle: "Ýörite rugsatlar (Warsaýylan bahalar we elýeterlilik)",
      defaultsSection: "Warsaýylan bahalar",
      defInvoiceType: "Başdaky faktura görnüşi",
      defPaymentType: "Başdaky töleg görnüşi",
      defUnit: "Başdaky ölçeg (esas)",
      defUnit2: "Başdaky ikinji ölçeg (paket/koli)",
      defCustomer: "Başdaky müşderi",
      noOneGeneral: "Hiç kim (Umumy Müşderi)",
      defWarehouse: "Başdaky ambar",
      defLedger: "Başdaky depder",
      accessSection: "Elýeterlilik (Erişim) kontroli",
      payTypesTitle: "Tölegleriň haýsy görnüşlerini emele getirip bilýär?",
      phPayment: "Töleg görnüşi",
      phCustomer: "Müşderi",
      phProduct: "Haryt",
      phWarehouse: "Ambar",
      phLedger: "Depder",
      customerPerms: "Müşderi rugsatlary",
      productPerms: "Haryt rugsatlary",
      warehousePerms: "Ambar rugsatlary",
      invoiceWarehouses: "Faktura üçin rugsatly ambarlar (umumy ambar rugsatyndan tapawutly bolsa)",
      ledgerPerms: "Depder rugsatlary",
    },
    errors: {
      documentValidation: "Ýazgy barlanmady. Nädogry ýa-da ýetmeýän meýdanlar: {fields}",
      invalidBatchSize: "Toplu ýazuwyň ölçegi položitel bitin san bolmalydyr.",
      generic: "Garaşylmadyk ýalňyşlyk ýüze çykdy.",
      network: "Tor ýalňyşlygy — baglanyşygyňyzy barlaň.",
      boundaryTitle: "Bir zat ýalňyş boldy",
      boundaryRestart: "Täzeden başlat",
    },
    license: {
      title: "Ygtyýarnama Dolandyryşy",
      account: "Hasap:",
      attention: "Üns:",
      needLicense: "Bu amal ygtyýarnama talap edýär: {route}",
      needKeyInfo: "Ygtyýarnama açary almalyňyz. Satuw, satyn alyş, stok we ähli amallar ygtyýarnama baglydyr.",
      daysLeft: "({days} gün galdy)",
      days: "{days} gün",
      accountId: "Hasap ID",
      loading: "Ýüklenýär...",
      copy: "Kopiýala",
      requestCode: "Talap Kody (bize iberiň)",
      requestCodeHint: "Bu kody WhatsApp/Telegram bilen iberiň. Size kök kod we ygtyýarnama açary berler.",
      rootCode: "Kök Kody",
      rootCodeFirstSetup: "(ilkinji gurnama)",
      rootCodePlaceholder: "Kök kody şu ýere goýuň",
      rootCodeHint: "107 simwol. Müşderä ilkinji gezek berilýär; soňky täzelenmelerde gerek däl.",
      rootCodeReenter: "Kök kod bar / täzeden girizýärin",
      licenseKey: "Ygtyýarnama Açary",
      licenseKeyPlaceholder: "Ygtyýarnama açaryny şu ýere goýuň",
      licenseKeyHint: "160 simwol (6-ly toparlar görnüşinde gelip biler)",
      activating: "Işjeňleşdirilýär...",
      activate: "Işjeňleştir",
      activeLicense: "Işjeň Ygtyýarnama",
      expiry: "Möhleti:",
      remaining: "Galan wagt:",
      features: "Aýratynlyklar:",
      maxRegisters: "Iň köp kassa sany:",
      loadFailed: "Ygtyýarnama maglumatlary ýüklenmedi: {error}",
      nothingToCopy: "Kopiýalanjak zat ýok",
      copied: "{label} kopiýalandy",
      copyFailed: "Kopiýalama başartmady — metni el bilen saýlap bilersiňiz",
      rootInvalid: "Kök kody ýalňyş ({status})",
      activated: "Ygtyýarnama işjeňleşdirildi!",
      activationError: "Işjeňleştirme ýalňyşlygy: {error}",
      errorFallback: "Ýalňyşlyk: {status}",
      statusActive: "Ygtyýarnama işjeň",
      statusInvalidKey: "Ýalňyş ygtyýarnama açary",
      statusExpired: "Ygtyýarnama möhleti gutardy",
      statusOtherDevice: "Bu açar başga enjama degişli (rebind gerek)",
      statusClockReset: "Enjam sagady yzyna alynyp (clock-reset gerek)",
      statusUsed: "Bu açar eýýäm ulanylan",
      statusNotActivated: "Entek işjeňleştirme ýerine ýetirilmedik",
      statusInvalidInput: "Ýalňyş giriş",
      statusKeyInvalid: "Açar ýalňyş",
      statusOtherAccount: "Açar başga hasaba degişli",
      statusStorage: "Saklanyş ýalňyşlygy",
      statusRootRequired: "Ilki kök kody gerek",
      statusFileCorrupt: "Ygtyýarnama faýly bozulan",
    },
    targowy: {
      targows: "Targowçylar",
      addTargow: "Targowçy goş",
      noTargow: "Targowçy ýok",
      notFound: "Targowçy tapylmady",
      view: "Görüş",
      todayOrders: "Şu günki sargytlar",
      monthResult: "Aýlyk netije",
      last7Days: "Soňky 7 gün",
      last14Days: "Soňky 14 gün",
      noRegionAssigned: "Etrap berkidilmedik",
      todayTotalSales: "Şu günki umumy satuw",
      todayOrderCount: "Şu günki sargytlar sany",
      activeTargows: "Işjeň targowçylar",
      bestToday: "Iň gowy targowçy (şu gün)",
      noOrdersToday: "Şu gün sargyt ýok",
      today: "Şu gün",
      thisWeek: "Şu hepde",
      thisMonth: "Şu aý",
      commission: "komissiýa",
      ordersUnit: "sargyt",
      monthlyTarget: "Aýlyk meýilnama",
      noOrders: "Sargyt ýok",
      allRegions: "Ähli etraplar",
      allStatuses: "Ähli status",
      fullNameRequired: "Ady Familiýasy hökmanydyr.",
      phoneRequired: "Telefon belgisi hökmanydyr.",
      targowExists: "Bu targowçy eýýäm bar.",
      optional: "islege görä",
      noRegionsHint: "Etraplar ýok. \"Etraplar\" bölüminden goşuň.",
      deleteConfirm: "\"{name}\" targowçyny pozmak isleýärsiňizmi?",
      deleteHasOrders: "Bu targowçynyň {count} sargydy bar. Pozmak ýerine Işjeň däl etmek maslahat berilýär.",
      tabRegions: "Etraplar",
      tabRating: "Reýting",
      regionExists: "Bu etrap eýýäm bar.",
      newRegionPh: "Täze etrap ady (Aşgabat - Berkararlyk)",
      addRegion: "Etrap goş",
      noRegions: "Etrap ýok",
      activeLabel: "Işjeň",
      inactiveLabel: "Işjeň däl",
      editTitle: "Targowçyny redaktirle",
      newTitle: "Täze targowçy",
      fullNameLabel: "Ady Familiýasy *",
      colRank: "Sıra",
      colName: "Ady",
      colOrderCount: "Sargyt sany",
      colTotalAmount: "Jemi tutar",
      avgOrder: "Ortaça sargyt",
      colNewCustomer: "Täze müşderi",
      colTrend: "Trend",
      colCustomer: "Müşderi",
      periodAll: "Ähli wagt",
      critAmount: "Iň köp TMT",
      critOrders: "Iň köp sargyt sany",
      critNewCustomers: "Iň köp täze müşderi",
    },
    walyuta: {
      baseCurrency: "Esas walýuta",
      baseCurrencyHint: "fiyat, fatura we hasabatlarda ulanylýar",
      fixed: "Sabit",
      change: "Üýtget",
      confirmBaseTitle: "{code} esas walýuta edilsinmi?",
      confirmBaseMsg: "Bu düzeltme bahalaryň, faturalaryň we hasabatlaryň birimini {code} eder. Ähli görkezilen ýazgylar üçtgesiz görkezilýär, hasaplar we möçberler üýtgemýär.",
      prevBase: "Öňki esas walýuta",
      deleteConfirm: "{code} walýutasyny pozmak isleýärsiňizmi?",
      deleteBaseBlocked: "Bu esas walýuta — ilki başga bir walýutany esas edip, soňra pozyň.",
      deleteInUse: "Bu walýuta ulanylýar, pozup bolmaýar.",
      codeRequired: "Walýuta koduny giriziň.",
      tmtIsBase: "TMT esas walýuta, aýratyn goşup bolmaýar.",
      codeExists: "Bu walýuta kody eýýäm bar.",
      nameRequired: "Walýuta adyny giriziň.",
      ratePositive: "{code} kursy 0-dan uly bolmaly.",
      customCodeLabel: "Walýuta kody (el bilen)",
      colSymbol: "Belgi",
      colRate: "Kurs (1 birlik = ? {code})",
      colUpdated: "Soňky täzelenme",
      emptyCurrencies: "Walýuta ýok. Täze walýuta goşuň.",
      baseBadge: "Esas",
      updateRate: "Kursy täzele",
      setBase: "Esas walýuta ed",
      baseCannotDelete: "Esas walýuta pozup bolmaýar",
      deleteLabel: "Pozmak",
      baseSetNotice: "Esas walýuta: {code}",
      baseSetFailed: "Esas walýuta üýtgedilmedi.",
      addOtherFirst: "Öň başga walýuta goşuň.",
      addedCurrencies: "Goşulan walýutalar",
      editTitle: "Walýutany redaktirle",
      newTitle: "Täze walýuta",
    },
    faktura: {
      selectTargow: "Targowçyny saýlaň.",
      selectCustomer: "Müşderini saýlaň.",
      selectRegion: "Etraby saýlaň.",
      addOneProduct: "Iň azyndan bir haryt goşuň.",
      draftNoEffect: "Merkez kabul edýänçä hiç bir modula täsir etmeýär",
      productSearchPh: "Haryt ady ýa-da barkod...",
      noProductsAdded: "Haryt goşulmady",
      filterSearchPh: "Müşderi ýa-da faktura no...",
      recordsShown: "ýazgy görkezilýär",
      soundOn: "Bildirim sesi açyk — basyp öçür",
      soundOff: "Bildirim sesi ýapyk — basyp aç",
      rejectTitle: "Garalamany ret et",
      rejectHint: "Ret edilen garalama hiç bir modula täsir etmeýär, ýöne taryhda galýar.",
      rejectReasonLabel: "Ret sebäbi (islege görä)",
      noDrafts: "Garalama faktura ýok",
      openInInvoice: "Faktura ekranynda aç",
      openLabel: "Aç",
      createTitle: "Garalama faktura döret",
      noteLabel: "Düşündiriş",
      cancelBtn: "Ýatyr",
      saveDraft: "Garalama hökmünde ýazgy et",
      targowLabel: "Targowçy *",
      customerLabel: "Müşderi *",
      regionLabel: "Etrap *",
      selectOption: "— Saýla —",
      paymentLabel: "Töleg görnüşi",
      currencyLabel: "Walýuta",
      payCash: "Nagt",
      payCard: "Kart",
      payCredit: "Karz (nesiýe)",
      addProductLabel: "Haryt goş",
      colProduct: "Haryt",
      colPrice: "Bahasy",
      colQty: "Sany",
      colTotal: "Jemi",
      statusPending: "Garaşylýar",
      statusAccepted: "Kabul edildi",
      statusRejected: "Ret edildi",
      filterAll: "Ählisi",
      filterByUser: "Ulanyjy boýunça",
      filterByTargow: "Targowçy boýunça",
      filterByRegion: "Etrap boýunça",
      dateStartTip: "Başlangyç sene",
      dateEndTip: "Ahyrky sene",
      clearFilters: "Arassala",
      colDate: "Sene / Wagt",
      colSender: "Kim iberdi",
      colCustomer: "Müşderi",
      colRegion: "Etrap",
      colStatus: "Status",
      colAction: "Amal",
      acceptTip: "Kabul et",
      rejectTip: "Ret et",
    },
    depder: {
      noDescription: "Beýany ýok",
      currentBalance: "Häzirki galyndy",
      usersUnit: "ulanyjy",
      deleteConfirm: "\"{name}\" depderini pozmak isleýärsiňizmi?",
      deleteHasTx: "Bu depderde iş hereketleri bar. Pozmak ýerine Passiw etmek maslahat berilýär — taryhy maglumatlar saklanar.",
      back: "Yza",
      txUnit: "hereket",
      nameRequired: "Depder ady hökmanydyr.",
      nameExists: "Bu depder ady eýýäm bar.",
      openingBalanceNaN: "Başlangyç galyndy san bolmaly.",
      namePh: "Meselem: Merkezi kassa",
      descPh: "Gysga düşündiriş...",
      grandTotal: "Umumy galyndy (TMT)",
      ledgersUnit: "depder",
      transferBtn: "Depderler arasynda geçirim",
      newLedger: "Täze depder",
      noLedgers: "Depder ýok",
      noLedgersHint: "Täze depder döredip, kassalaryňyzy aýratyn alyp baryň.",
      selectLedgers: "Depderleri saýlaň.",
      sameLedger: "Bir depderden özüne geçirip bolmaýar.",
      amountPositive: "Mukdar 0-dan uly bolmaly.",
      transferDescPh: "Meselem: gün soňy geçirim",
      transferTitle: "Depderler arasynda geçirim",
      fromLedger: "Haýsy depderden",
      toLedger: "Haýsy depdere",
      amountLabel: "Mukdar",
      dateLabel: "Sene",
      rateNote: "kurs boýunça:",
      descLabel: "Düşündiriş",
      cancelBtn: "Ýatyr",
      transferSubmit: "Geçirimi ýerine ýetir",
      editTitle: "Depderi redaktirle",
      newTitle: "Täze depder",
      nameLabel: "Ady *",
      currencyLabel: "Walýuta",
      openingLabel: "Başlangyç galyndy",
      descFieldLabel: "Beýany",
      activeLabel: "Aktiw",
      inactiveLabel: "Passiw",
      permsTitle: "Ruhsatlar — bu depdere kimler girip biler",
      saveBtn: "Ýatda sakla",
      userSelectPh: "Ulanyjy saýla...",
      userAdd: "Ulanyjy goş",
      userCol: "Ulanyjy",
      noUsersNote: "Ulanyjy goşulmady. Administratorler awtomatik hemme ygtyýara eýe.",
      allPerms: "Hemme ygtyýar",
      removeTip: "Aýyr",
      permEnter: "Girip bilýär",
      permAddIncome: "Girdeji goşup bilýär",
      permAddExpense: "Çykdajy goşup bilýär",
      permEdit: "Redaktirläp bilýär",
      permDelete: "Pozup bilýär",
      permViewReport: "Hasabat görüp bilýär",
    },
    warehouses: {
      searchPh: "Ammar ady, kody ýa-da salgysy boýunça gözle...",
      newWarehouse: "Täze ammar",
      colWarehouse: "Ammar",
      colCode: "Kod",
      colAddressTel: "Salgy / Tel",
      colStatus: "Ýagdaý",
      colActions: "Amallar",
      emptyNone: "Ammar ýok. Täze ammar dörediň.",
      emptyNotFound: "Ammar tapylmady",
      itemsUnit: "haryt",
      inactive: "Ýapyk",
      active: "Açyk",
      defaultBadge: "Esasy",
      editTitle: "Üýtget",
      deleteConfirm: "Bu ammary pozmak isleýärsiňizmi?",
      cancelNo: "Ýok",
      formEditTitle: "Ammary üýtget",
      formName: "Ammar ady",
      formPhone: "Telefon",
      formAddress: "Salgy",
      formNote: "Bellik",
      defaultWarehouse: "Esasy ammar",
      itemsInside: "Içindäki harytlar",
      colProductName: "Haryt ady",
      colBarcode: "Barkod",
      colQty: "Sany",
      colUnit: "Ölçeg birligi",
      colPrice: "Bahasy",
      emptyWarehouse: "Bu ammary boş",
      close: "Ýapyş",
    },
    modals: {
      importFailed: "Import başartmady: diňe .bhbak (ýa-da köne .json ätiýaçlyk) kabul edilýär.",
      accountFileHint: " hasabyna ätiýaçlyk .bhbak faýlyny saýlaň. Diňe Biznes Hasap açyp bilýär.",
      clickToPick: "Faýl saýlamak üçin basyň",
      importedCount: "{count} ýazgy import edildi.",
      importing: "Aktarylýar...",
      shortcutsTitle: "Klawiatura gysgaltmalary",
      shortcutsHint: "F düwmelerine basyp gönüden-göni işledip bilersiňiz.",
      shortcutsClose: "Ýapy",
      bhbakNote: ".bhbak — Biznes Hasap ätiýaçlyk",
    },
    promo: {
      modalTitle: "PROMO ulgamy",
      modalSubtitle: "Satuw + promo utgaşmasy, stok we kassa girdejisi · {code}",
      tabNew: "Täze Promo",
      tabEdit: "Promo redaktirle",
      tabList: "Işjeň Promolar ({count})",
      tabStock: "Stok ýagdaýy",
      stockEmpty: "Promolarda ýekeje haryt hem ulanylmady",
      stockLabel: "Stok:",
      noProducts: "Haryt modulynda haryt ýok. Ilki Haryt goşuň.",
      noSelection: "Häzir haryt saýlanmady",
      clearTip: "Saýlamany aýyr",
      saleProduct: "Satyn alynjak haryt",
      pickProduct: "Haryt saýla",
      qtyLabel: "Sany",
      totalLabel: "Jemi",
      promoProduct: "Promo haryt",
      pickPromoProduct: "Promo haryt saýla",
      promoQty: "Promo sany",
      modeFree: "Mugt",
      modePercent: "Göterim %",
      modeFixed: "Sabit baha",
      modePercentLabel: "Göterim %{pct}",
      modeFixedLabel: "Sabit {amount}",
      discountLabel: "Promo ýeňillik",
      saleLabel: "Satuw",
      promoLabel: "Promo",
      kassaIncome: "Kassa girdejisi",
      discountWord: "ýeňillik",
      insufficientStock: "Stok ýeterlik däl!",
      cancel: "Ýatyr",
      create: "Promo döret",
      update: "Täzele",
      pickSaleTitle: "Satyn alynjak harydy saýla",
      pickPromoTitle: "Promo harydy saýla",
      pickerSearchPh: "Ady / barkod / SKU boýunça gözle...",
      pickerAllCategories: "Ähli kategoriýalar",
      pickerNotFound: "Haryt tapylmady",
      pickerCount: "{count} haryt · işjeň walýuta: {code}",
      pickerClose: "Ýap",
      listEmpty: "Işjeň promo ýok",
      listEmptyHint: "\"Täze Promo\" bölüminden dörediň.",
      editTip: "Redaktirle",
      deleteTip: "Poz",
    },
  },
  en: {
    windowTitle: "Biznes Hasap",
    languageMenuTitle: "Select Language",
    otherAccounts: "Other accounts",
    addAccount: "Add account",
    userLabel: "User",
    passwordLabel: "Password",
    passwordPlaceholder: "Enter your password",
    loginButton: "Login",
    appName: "Biznes hesap",
    version: `v${pkg.version}`,
    delete: "Delete",
    edit: "Edit",
    import: "Import data",
    autoSelectPrinter: "Auto select",
    receiptPrinter: "Receipt printer",
    standardPrinter: "Standard printer",
    addAccountTitle: "Add New Account",
    editAccountTitle: "Edit Account",
    accountName: "Account / Store Name",
    couchDbUrl: "CouchDB URL",
    databaseName: "Database Name",
    save: "Save",
    cancel: "Cancel",
    selectLogo: "Choose Logo",
    conn: {
      sectionTitle: "CouchDB Connection",
      sectionHint: "Test the connection and pull server data before saving",
      localTitle: "Local connection (same Wi-Fi)",
      onlineTitle: "Online connection (domain)",
      localPlaceholder: "http://user:password@192.168.1.8:5984/database",
      onlinePlaceholder: "http://user:password@yourdomain:5984/database",
      testOnly: "Test connection only",
      connect: "Connect",
      stop: "Stop",
      showPassword: "Show password",
      hidePassword: "Hide password",
      statusIdle: "Not connected",
      statusConnecting: "Connecting…",
      statusConnected: "Connected",
      statusTested: "Tested",
      statusError: "Error",
      statusOffline: "Offline",
      denied: "Access denied — wrong username or password",
      connecting: "Connecting…",
      firstWorking: "The first address that works is used.",
      singleConnectionNote: "Only one connection is active at a time; the other closes automatically. When the app reopens, the last used connection starts automatically.",
      progressTransferring: "Transferring…",
      progressDone: "Transfer complete",
      docsReceived: "{count} documents received",
      docsSent: "{count} documents sent",
      liveContinues: "Live sync continues",
      liveAfterTransfer: "Live sync starts when the transfer finishes",
      mergeTitle: "Merge data?",
      mergeLocalCount: "on this phone",
      mergeRemoteCount: "documents on the server.",
      mergeKeep: "Merge",
      mergeKeepHint: "Records from both sides are combined into one database.",
      mergeServerOnly: "Server only",
      mergeServerOnlyHint: "Phone records are deleted; server records are used.",
      noAccount: "No account selected.",
      shareNote: "{name} · data is shared with the server on your computer",
      panelNote: "Only one connection is open at a time; the other closes automatically. Press the green icon again to stop the connection. The last used connection starts automatically when the app reopens.",
    },
    confirmDeleteTitle: "Delete Account",
    confirmDeleteMsg: "Are you sure you want to delete this account and its data?",
    loginSuccess: "Login successful!",
    wrongPassword: "Incorrect password!",
    selectAccount: "Select Account",
    selectUser: "Select User",

    tabKassa: "Register",
    tabFatura: "Invoice",
    tabPara: "Cash/Register",
    tabMusteri: "Customer",
    tabUser: "User",
    tabHaryt: "Products",
    tabHesaplama: "Calculation",
    tabDoviz: "Currency Exchange", 
    tabDepder: "Ledger",
    tabAmbar: "Warehouse",
    tabKurye: "Courier/Delivery",
    tabDiger: "More",
    tabAyarlar: "Settings",
    tabLisans: "License Key",
    salesInvoice: "Sales Invoice",
    purchaseInvoice: "Purchase Invoice",
    salesReturnInvoice: "Sales Return Invoice",
    purchaseReturnInvoice: "Purchase Return Invoice",
    proformaInvoice: "Proforma Invoice",
    quotationInvoice: "Price Quotation",
    generalCustomer: "General Customer (Cash)",
    scanBarcodePlaceholder: "Scan or type barcode...",
    addBtn: "Add +",
    productNameCol: "Product Name",
    qtyCol: "Qty",
    priceCol: "Price",
    discountCol: "+ / - %",
    totalCol: "Total",
    emptyCartMsg: "Cart is empty. Scan barcode or choose products on the right.",
    itemsCount: "Items",
    subtotalLabel: "Subtotal:",
    bulkPercentLabel: "Bulk %",
    amountDueLabel: "AMOUNT DUE",
    cashMethod: "Cash",
    cardMethod: "Card",
    creditMethod: "Credit",
    splitMethod: "Split",
    cashReceivedLabel: "Cash Received",
    changeDueLabel: "Change",
    exactBtn: "Exact",
    holdDraftBtn: "Hold as Draft",
    completeSaleBtn: "Complete Sale (F2)",
    searchProductsPlaceholder: "Search products...",
    allCategories: "All",
    stockLabel: "Stock",
    outOfStock: "Out of Stock",
    saleCompletedToast: "Sale Completed Successfully!",
    draftHeldToast: "Invoice held as draft.",
    productNotFoundToast: 'No product found with barcode "{code}".',
    logoutTooltip: "Logout",
    internalNotePlaceholder: "Internal note / memo (not printed on receipt)...",

    posTerminalTitle: "Bank Card POS Terminal",
    posTerminalConnected: "Card Terminal Connected (Ready)",
    posDeviceNotConnectedTitle: "POS Terminal Not Connected!",
    posConnectDeviceMsg: "Please connect the card payment device (POS terminal) to the computer and try again.",
    posAnalyzing: "Checking Device Connection...",
    posRetryScan: "Retry Scanning Device",
    posWaitingCard: "Waiting for Customer Card (Contactless / Chip)...",
    posProcessing: "Processing Payment, Please Wait...",
    posApproved: "Payment Approved Successfully!",
    posDeclined: "Payment Declined / Cancelled",
    posAutoPrinting: "Printing Sales Receipt Automatically...",
    posAuthCode: "Auth Code",
    receiptTitle: "SALES RECEIPT",
    printBtn: "Print Receipt",
    closeBtn: "Close / New Sale",
    thanksMsg: "Thank you for your purchase!",
    pos: {
      paymentCancelled: "Payment cancelled",
      newSale: "New Sale",
      noPermission: "Not authorized",
      noStock: "Out of stock. Enable the icon on the product to allow negative sale.",
      inactiveProduct: "This product is inactive — it cannot be added to the cart.",
      resetDone: "All changes have been reverted.",
      cartEmptyExport: "Cart is empty — cannot export.",
      excelExported: "Excel exported.",
      exportCancelled: "Export cancelled.",
      exportDialogTitle: "Invoice Excel Export",
      exportFailed: "Excel export failed.",
      belowCost: "Cannot sell below purchase price (purchase: {cost}).",
      selectCustomer: "Select a customer",
      cartEmpty: "Cart is empty",
      cartEmptyAddFirst: "Cart is empty. Add a product first.",
      specialPriceMissing: "No special price entered",
      specialPriceSaved: "Special price saved for {count} product(s) for {customer}",
      priceSaveFailed: "Price could not be saved",
      specialPriceNotFound: "No special price found for the customer or products",
      pricesApplied: "Price applied to {count} product(s)",
      printFailed: "Print failed: {reason}",
      unknownError: "unknown error",
      compositionShort: "Insufficient composition stock: {list}",
      dateBeforeStart: "Operations are not open on this date (start: {date}).",
      dateAfterEnd: "The operation period has ended (last: {date}).",
      cashSaleBlocked: "Cash sale is not allowed for this customer.",
      creditLimitExceeded: "Credit limit exceeded (limit: {limit} TMT).",
      nothingToReset: "Nothing to clear",
      paneCart: "Cart",
      panePay: "Payment",
      goToPayment: "Go to payment",
      resetTitle: "Revert",
      resetMsg: "All changes on the current screen (selected products, customer, price type, payment) will be cleared. Do you want to continue?",
      resetCancel: "Cancel",
      resetConfirm: "Revert",
      fabAddProduct: "Add product",
      fabAddCustomer: "Add customer",
      fabAddMoney: "Add transaction",
      fabAddCourier: "Add courier",
      fabAddCurrency: "Add currency",
      fabAdd: "Add",
      alertsTitle: "Alerts",
      alertsCount: "{count} alerts",
      alertsAttention: "{count} item(s) need attention",
      alertsAllOk: "Everything is fine",
      alertsEmpty: "No alerts right now",
      alertsEmptyHint: "No critical stock or debts nearing their due date.",
      alertsLowStock: "Products with low stock",
      alertsNoCritical: "No critical stock",
      alertsCriticalLevel: "Critical level",
      alertsMinus: "NEGATIVE",
      alertsDueCredits: "Credits nearing due date",
      alertsNoDue: "No debts due soon",
      alertsOverdue: "OVERDUE",
      alertsToday: "TODAY",
      dueOverdue: "{days} days overdue",
      dueToday: "Today",
      dueDaysLeft: "{days} days left",
      csTitle: "Search Customer",
      csFoundHeader: "Found: {count} customers",
      csFound: "Found: {count} customers",
      csSearchLabel: "Search",
      csSearchPlaceholder: "Name / phone...",
      csStartsWith: "Search from the start of the word",
      csWhoLabel: "Who to search?",
      csBadgeCustomer: "Customer",
      csWhoBoth: "Customer + Employee",
      csBadgeEmployee: "Employee",
      csRegionLabel: "Region",
      csAll: "All",
      csDebtLabel: "Debt status",
      csDebtHas: "Has debt",
      csDebtNone: "No debt",
      csDebtOverdue: "Overdue",
      csNotFound: "No customers found",
      psTitle: "Search Product",
      psFoundHeader: "Found: {count} products",
      psFound: "Found: {count} products",
      psSearchLabel: "Search",
      psSearchPlaceholder: "Name / code / barcode...",
      psWarehouseLabel: "Warehouse",
      psCategoryLabel: "Category",
      psAll: "All",
      psBarcodeStatus: "Barcode status",
      psBsWith: "With barcode",
      psBsWithout: "Without barcode",
      psStockStatus: "Stock status",
      psSsInStock: "In stock",
      psSsOut: "Out of stock",
      psSsCritical: "Critical stock",
      psNotFound: "No products found",
      psStock: "Stock",
      psClose: "Close",
      dpTitle: "Print — {no}",
      dpPreview: "Preview",
      dpPrinter: "Printer",
      dpDefaultPrinter: "Default (system)",
      dpPrintBtn: "Print",
      dpPrinted: "Printed.",
      dpPrintFailed: "Print failed.",
      dpNote: "Amounts and prices reflect the current cart. The invoice is not finalized — draft print only.",
      faSaveTip: "Save invoice (draft)",
      faSaveLabel: "Save Invoice",
      faDraftsTip: "Draft invoices",
      faDraftsLabel: "Draft Invoices",
      faSoundOnTip: "Notification sound on — click to mute",
      faSoundOffTip: "Notification sound off — click to unmute",
      msWarehouseTip: "Select warehouse",
      msWarehouse: "Warehouse",
      msTargetTip: "Select target warehouse",
      msTargetDisabledTip: "Only active for \"Warehouse transfer\"",
      msWarehouse2: "Warehouse 2",
      msTransferNote: "Warehouse transfer: from warehouse 1 to warehouse 2",
      changeTip: "Change: cash received − amount due",
      changeLabel: "Change",
      ledgerTip: "Select ledger",
      ledgerOption: "Ledger",
      swLabel: "Date / Time",
      swPickTip: "Pick date and time manually",
      swNowTip: "Back to current time",
      swManualTip: "Manually selected time",
      swLiveTip: "Current time",
      shortcutsTitle: "Keyboard Shortcuts",
      shortcutsHint: "Press ESC or click outside to close",
      emptySection: "This section is empty for now",
      emptySectionHint: "Content will be added soon.",
      icbMenuTitle: "Invoice Type / Document",
      icbCustomerSearchTip: "Search customer (F2)",
      icbAddTip: "Add product (Enter)",
      icbClearCodeTip: "Clear code",
      icbNewCodeTip: "Generate new code",
      icbCopiesTip: "Receipt count",
      icbCopiesNone: "No receipt",
      icbCopiesCount: "{count} receipt(s)",
      printerSettingsTip: "Printer Settings",
      generalSearchTip: "Global Search",
      unitCol: "Unit",
      switchAccount: "Switch Account",
      cameraScanTip: "Scan barcode with camera",
      gridView: "Grid View",
      listView: "List View",
      cardScanningPorts: "Scanning USB / COM / LAN ports...",
      cardTestModeTip: "Treat device as connected for testing",
      cardTestMode: "Test Mode",
      cardWaitingBefore: "The customer must tap their card on the device. Once the device approves the payment, press the",
      cardApprove: "Approve",
      cardWaitingAfter: "button.",
      cardBankApproval: "Awaiting bank approval...",
      cardPaymentFailed: "Payment could not be completed.",
      cardApproveBtn: "Payment Accepted & Print Receipt (Enter)",
    },
    invoices: {
      title: "Invoice List",
      subtitle: "Double-click a row → open the invoice, then F11 (Excel) or F12 (print)",
      filterToday: "Today",
      filterYesterday: "Yesterday",
      filterThisWeek: "This Week",
      filterThisMonth: "This Month",
      filterAll: "All",
      rangeTitle: "Date Range",
      presetTooltip: "Select a preset range",
      presetMenuTitle: "Select Preset Range",
      presetToday: "Today",
      presetYesterday: "Yesterday",
      presetDayBefore: "Day before yesterday",
      presetThisWeek: "This week",
      presetThisMonth: "This month",
      presetThisYear: "This year",
      presetLastWeek: "Last week",
      presetLastMonth: "Last month",
      presetSinceYesterday: "Since yesterday",
      presetSinceDayBefore: "Since the day before yesterday",
      presetSinceLastWeek: "Since the start of last week",
      presetSinceLastMonth: "Since the start of last month",
      presetLastYear: "Last year",
      searchPlaceholder: "Invoice no, customer name...",
      typeLabel: "Type:",
      typeSales: "Sales",
      typeAll: "All Types",
      typePurchase: "Purchase",
      typeReturns: "Returns",
      typeTransfer: "Transfer",
      typeOther: "Other In/Out",
      statsTotal: "Total Invoices",
      statsCountSuffix: "pcs",
      statsAmount: "Total Amount",
      payCash: "Cash",
      payCard: "Card",
      payCredit: "Credit",
      paySplit: "Split",
      voidedToggleTip: "Show / hide voided invoices",
      voidedToggle: "Voided",
      emptyTitle: "No invoices match the selected filters.",
      emptyHint: "Try changing the date or type filter.",
      colNo: "Invoice No",
      colDate: "Date / Time",
      colCustomer: "Customer",
      colType: "Type",
      colPayment: "Payment",
      colItems: "Items",
      colAmount: "Amount",
      colAction: "Action",
      rowOpenTip: "Double-click to open the invoice",
      receiptOpenTip: "Click to open the invoice receipt",
      voidedBadge: "Voided",
      returnBadge: "Return",
      deleteTip: "Delete invoice",
      footerHint: "Click a row or the \"Receipt\" button to view the invoice.",
      closeBtn: "Close (Esc)",
      deleteTitle: "Delete Invoice",
      deleteMsg: "Are you sure you want to delete this invoice? This action cannot be undone.",
      deleteCascade: "Warehouse stock, customer debt and Cash/Ledger records linked to the invoice will also be reversed.",
      customerLabel: "Customer",
      cancelBtn: "Cancel",
      confirmDeleteBtn: "Yes, delete",
      deletedTitle: "Deleted Invoices",
      deletedEmpty: "No deleted invoices.",
      deletedColNo: "Invoice No",
      deletedColDate: "Date",
      deletedColAmount: "Amount",
      deletedColAt: "Deleted At",
      deletedColBy: "Deleted By",
      closeShort: "Close",
      deleteSelected: "Delete selected ({count})",
      deleteAll: "Delete All",
      permTitle: "Permanent Deletion",
      permAllMsg: "Permanently deletes all deleted invoices. This cannot be undone. Do you want to continue?",
      permSelectedMsg: "Permanently deletes the selected {count} invoice(s). This cannot be undone. Do you want to continue?",
      permCancel: "Cancel",
      permConfirm: "Delete",
    },
    kassa: {
      cashIn: "Cash In",
      cashOut: "Cash Out",
      noExpensePerm: "You are not allowed to add expenses.",
      noIncomePerm: "You are not allowed to add income.",
      noCategoryPerm: "No permission for this category.",
      shownCount: "{count} transactions shown",
      today: "Today",
      balanceCard: "Cash balance",
      todayIncome: "Today's income",
      todayExpense: "Today's expense",
      cashLabel: "Cash",
      cardLabel: "Card/Transfer",
      deleteMsg: "Do you want to delete this cash transaction?",
      editTip: "Edit",
      deleteTip: "Delete",
      searchPlaceholder: "Search by description or category...",
      advancedSearchTip: "Advanced search (F3)",
      all: "All",
      income: "Income",
      expense: "Expense",
      allCategories: "All categories",
      allCustomers: "All customers",
      dateStartTip: "Start date",
      dateEndTip: "End date",
      clear: "Clear",
      empty: "No transactions found",
      colDate: "Date / Time",
      colType: "Type",
      colCategory: "Category",
      colCustomer: "Customer / Supplier",
      colPayment: "Payment method",
      colAmount: "Amount",
      colDesc: "Description",
      colAction: "Action",
      incomeBadge: "↑ Income",
      expenseBadge: "↓ Expense",
      editTitle: "Edit transaction",
      addIncomeTitle: "Add income",
      addExpenseTitle: "Add expense",
      dateLabel: "Date",
      searchTitle: "Search Cash Transaction",
      foundPrefix: "Found: ",
      txSuffix: "transactions",
      noteLabel: "Note",
      notePlaceholder: "Note / customer / invoice...",
      dateRange: "Date range",
      allShort: "All",
      none: "None",
      payCard: "Card",
      payTransfer: "Transfer",
      customerLabel: "Customer",
      userLabel: "User",
      ledgerLabel: "Ledger",
      currencyLabel: "Currency",
      onlyDue: "Only transactions with a due date (credit)",
      searchOrType: "Search or type...",
      quickAdd: "Not in records — add new: \"{name}\"",
      debtLabel: "Debt",
      creditLabel: "Receivable (credit)",
      settledLabel: "Account settled",
      customerOptional: "Customer (optional)",
      supplierOptional: "Supplier (optional)",
      fromWhom: "From whom",
      toWhom: "To whom",
      staffLabel: "Employee",
      selectOption: "— Select —",
      staffNameLabel: "Employee name (not registered)",
      subCategoryLabel: "Subcategory",
      errAmount: "Amount must be greater than 0.",
      errDate: "Select a date.",
      errCustomer: "Select a customer.",
      errPerson: "Enter the related person.",
    },
    hasaplama: {
      title: "Calculation",
      result: "Result",
      period: "Period",
      periodToday: "Today",
      periodWeek: "This week",
      periodMonth: "This month",
      periodLastMonth: "Last month",
      periodQuarter: "Quarter",
      periodYear: "Year",
      periodCustom: "Custom range",
      tabXaccot: "X-Report (daily)",
      tabPl: "Profit & loss report",
      tabDebt: "Debt report",
      tabStock: "Stock report",
      tabCash: "Cash report",
      tabTargow: "Courier results",
      summaryHideTip: "Hide summary cards — more room for the report",
      summaryShowTip: "Show summary cards",
      summaryHide: "Hide summary",
      summaryShow: "Show summary",
      printBtn: "Print",
      excelBtn: "Export to Excel",
      preparedAt: "Prepared:",
      noDataPeriod: "No data for this period",
      income: "Income",
      expense: "Expense",
      incomeCaps: "INCOME",
      expenseCaps: "EXPENSE",
      incomeTotal: "Total income",
      expenseTotal: "Total expense",
      incomeItems: "Income items",
      expenseItems: "Expense items",
      noIncome: "No income",
      noExpense: "No expenses",
      incomeMinusExpense: "Income − Expense",
      netProfit: "Net profit",
      netProfitFooter: "Net profit: {amount} TMT",
      periodMovement: "Movement over the period (income / expense)",
      colDesc: "Description",
      colCount: "Count",
      colAmountTmt: "Amount (TMT)",
      colCategory: "Category",
      colCustomer: "Customer",
      colDebtTmt: "Debt (TMT)",
      colLastPayment: "Last payment",
      totalReceivable: "Total receivable",
      supplierDebt: "Debt to suppliers",
      borrowed: "Borrowed (Borrowing)",
      lent: "Lent (Lending)",
      receivablesTitle: "Receivable from customers (credit)",
      noDebt: "No debt — all accounts are settled",
      overdueTitle: "Overdue debts",
      noOverdue: "No overdue debts",
      colInvoiceNo: "Invoice №",
      colDueDate: "Due date",
      colLate: "Delay",
      daysLate: "{days} days",
      totalReceivableFooter: "Total receivable: {amount} TMT",
      colProduct: "Product",
      colQty: "Qty",
      colPurchase: "Purchase",
      colPurchaseValue: "Purchase value",
      colSaleValue: "Sale value",
      skuCount: "Product kinds",
      totalQty: "Total quantity",
      byPurchasePrice: "By purchase price",
      bySalePrice: "By sale price",
      stockState: "Product stock",
      filterAll: "All",
      filterPositive: "+ (plus)",
      filterNegative: "− (minus)",
      stockCountLabel: "{shown} / {total} products",
      noStockKind: "No products of this kind",
      colStock: "Stock",
      colSale: "Sale",
      colStockValue: "Stock value (sale)",
      colAction: "Action",
      showTip: "Show",
      createInvoiceTip: "Create invoice",
      criticalStockLabel: "Critical stock:",
      expiryLabel: "Expiry:",
      purchasePriceLabel: "Purchase price:",
      wholesaleLabel: "Wholesale price:",
      barcodeLabel: "Barcode:",
      belowCritical: "Below critical stock level ({count})",
      bestSellers: "Best-selling products",
      worstSellers: "Least-selling products",
      noSalesPeriod: "No sales data for this period",
      purchaseValueFooter: "Total purchase value: {amount} TMT",
      colLedger: "Ledger",
      colCurrency: "Currency",
      colBalance: "Balance",
      byLedgers: "By ledger",
      noLedgers: "No ledgers",
      paymentMethodIncome: "Payment method (income)",
      noIncomePeriod: "No income for this period",
      totalBalanceFooter: "Total balance: {amount} TMT",
      colTargow: "Courier",
      colOrderCount: "Order count",
      colTotalAmount: "Total amount (TMT)",
      colTotalAmountShort: "Total amount",
      colNewCustomer: "New customers",
      colRank: "Rank",
      noTargows: "No couriers",
      fullViewInTargow: "Full view in the Courier section",
      totalFooter: "Total: {amount} TMT",
      xaccotTitle: "X-Report · daily business",
      xaccotPrintTitle: "X-REPORT (Daily business)",
      cardInvoices: "Invoice count",
      cardSalesTotal: "Sales total",
      cardCash: "Cash",
      cardCard: "Card",
      cardCredit: "Credit",
      cardKassaIncome: "Cash income",
      cardKassaExpense: "Cash expense",
      cardNet: "Net",
      salesTotalTmt: "Sales total (TMT)",
      colValue: "Value",
      netFooter: "Net: {amount} TMT · {count} invoices",
      dayInvoices: "Invoices of the day ({count})",
      allDayInvoices: "All invoices of the day ({count})",
      noInvoicesToday: "No invoices for this day",
      colTime: "Time",
      colPayment: "Payment",
      dayBestSellers: "Best-selling products of the day",
      noSalesToday: "No sales for this day",
      productKindsSuffix: "{count} product kinds",
      calculator: "Calculator",
      currencyLabel: "Currency",
      totalIncome: "Total income",
      totalExpense: "Total expense",
      stockValue: "Value of products in stock",
      ledgerBalance: "Cash / ledger balance",
    },
    sazlamalar: {
      sectionGeneral: "General Settings",
      resetToDefaults: "Reset to Defaults",
      unitNameRequired: "Enter a name.",
      unitNameRequiredEdit: "Enter a name.",
      unitExists: "This unit already exists.",
      unitInUse: "\"{name}\" is in use and cannot be deleted.",
      unitNewPh: "New unit (e.g. ROLL)",
      unitAdd: "Add unit",
      unitColName: "Name",
      unitColUsedBy: "Used by products",
      unitColAction: "Action",
      unitEditTitle: "Edit",
      unitFixedNoDelete: "Built-in unit cannot be deleted",
      unitRuleHint: "A unit used by products cannot be deleted. Built-in units cannot be deleted either.",
      settingsTitle: "Settings",
      secPrinter: "Printer settings",
      secScale: "Scale settings",
      secReceipt: "Receipt settings",
      secPermissions: "Permissions",
      secUnits: "Units of measure",
      secRules: "Rules",
      secDeleted: "Deleted invoices",
      secSync: "Cloud sync",
      secAudit: "Activity log",
      secGeneral: "General settings",
      unsavedTitle: "There are unsaved changes, do you want to continue?",
      unsavedHint: "If you switch sections, current changes will be lost.",
      cancelBtn: "Cancel",
      continueBtn: "Continue",
      saveBarDirty: "There are unsaved changes",
      saveBarClean: "No changes",
      saveBtn: "Save",
      noEditPerm: "You are not allowed to change settings.",
      saved: "Settings saved.",
      backupSaveTitle: "Save backup",
      backupFilterName: "Biznes Hasap backup (.bhbak)",
      backupSaved: "Backup .bhbak file saved.",
      exportCancelled: "Export cancelled.",
      exportFailed: "Export failed.",
      importDone: "{count} records imported. Refresh the page.",
      importFailed: "Import failed: only .bhbak (or legacy .json backup) is accepted.",
      loading: "Loading settings...",
      genDesc: "Language, currency and date format",
      genLanguage: "Language",
      genDateFormat: "Date and time format",
      genBaseCurrency: "Base currency",
      genBaseCurrencyHint: "The system base currency cannot be changed",
      genGoToCurrency: "Go to currency settings",
      backupTitle: "Backup",
      backupDesc: "Automatic backup of data",
      backupAuto: "Automatic backup",
      backupAutoDesc: "Data is backed up at the chosen frequency",
      backupFreq: "Frequency",
      backupDaily: "Daily",
      backupWeekly: "Weekly",
      backupFolder: "Backup folder",
      dataTitle: "Data",
      dataDesc: "Backup .bhbak file — only Biznes Hasap can open it (not zip/json)",
      dataExport: "Export data",
      dataImport: "Import data",
      aboutTitle: "About the system",
      aboutDesc: "Program version and license information",
      aboutVersion: "Version",
      aboutLicense: "License",
      aboutLicenseValue: "Biznes Hasap · Sanly",
      encTitle: "Database encryption",
      encDesc: "Data is encrypted with a password derived from the license key",
      encEnabledNotice: "Encryption is on. The database is stored encrypted; it cannot be opened on an unlicensed device.",
      encWarn1: "Once encryption is enabled, data cannot be read on an unlicensed device.",
      encWarn2: "Take a backup (.bhbak) before continuing.",
      encWarn3: "If cloud sync is used, data stays encrypted on the remote server.",
      encWarn4: "The source (unencrypted) database is NOT deleted — you can disable encryption and roll back at any time.",
      encMigrating: "Migrating... {done}/{total} databases",
      encDone: "Migration complete: {count} records copied and verified. Source databases kept.",
      encFailed: "{count} records could not be migrated — encryption was NOT enabled. No data was lost.",
      encDisabledNotice: "Encryption disabled. The previous (unencrypted) database will be used after restart.",
      encRestart: "Restart (for the change to take effect)",
      encEnable: "Encrypt the database",
      encDisable: "Disable encryption",
      encConfirmEnableTitle: "All accounts' data will be COPIED to the encrypted database. Continue?",
      encConfirmEnableHint: "The source database is not deleted. Encrypted data cannot be opened on an unlicensed device.",
      encConfirmDisableTitle: "Disable encryption?",
      encConfirmDisableHint: "The previous (unencrypted) database will be used after restart. No data is lost.",
      firmTitle: "Company information",
      firmDesc: "Name, code, title, phone, fax, address and VAT rate",
      firmName: "Company name",
      firmCode: "Company code",
      firmTitleField: "Title (heading)",
      firmPhone: "Phone",
      firmFax: "Fax",
      firmAddress: "Address",
      firmTax: "VAT rate (%)",
      opsTitle: "Operation rules",
      opsDesc: "Inactive records, purchase price, credit term and dates",
      opsInactiveCustomer: "Use inactive customer in invoice/cash register",
      opsInactiveProduct: "Add inactive product to cart",
      opsBelowCost: "Sell below purchase price",
      creditMin: "Credit term (min days)",
      creditMax: "Credit term (max days)",
      creditDefault: "Credit term (default days)",
      opStart: "Operation start date (empty = open)",
      opEnd: "Operation end date (empty = open)",
      barcodeTitle: "Barcode reader",
      barcodeDesc: "Strip prefix/suffix characters added by your reader",
      barcodePrefix: "Prefix (leading characters)",
      barcodeSuffix: "Suffix (trailing characters)",
      prKindStandard: "Standard printer",
      prKindReceipt: "Receipt printer",
      prBtConnected: "Bluetooth printer connected: {name}",
      prBtFailed: "Bluetooth could not connect: {error}",
      prBtScanDone: "Scan finished — pick your printer from the list.",
      prBtScanFailed: "Scan failed: {error}",
      prBtPicked: "Connected: {name} — print a test page.",
      prBtPickFailed: "Could not connect: {error}",
      prBtTestSent: "Test receipt sent — check the printer.",
      prBtNotConnected: "Printer not connected. Connect first.",
      prDesktopOnly: "Printers can only be viewed in the desktop (Electron) app.",
      prNone: "No printers found. Add a printer in Windows.",
      prTestDesktopOnly: "Test print is only available in the desktop app.",
      prTestSent: "Test print sent — check the printer.",
      prTestFailed: "Print failed: {reason}",
      prUnknownError: "unknown error",
      prStatusTitle: "Printer status",
      prStatusDesc: "Printers found on the system and connection state",
      statusConnected: "Connected",
      statusDisconnected: "Not connected",
      prRefresh: "Refresh printers",
      prFound: "{count} printers found",
      prBrowserMode: "Browser mode",
      prDefault: "Default",
      prSettingsDesc: "Default printer and print format",
      prBtName: "Bluetooth thermal printer",
      prBtSub: "58/80mm mobile printer (XPrinter compatible)",
      btConnected: "Connected",
      btNone: "None",
      btScanning: "Scanning...",
      btScan: "Scan devices",
      btDisconnect: "Disconnect",
      btPickConnect: "Pick & connect",
      btScanHint: "Searching nearby Bluetooth devices... turn the printer on and enter pairing mode.",
      btConnect: "Connect ›",
      btPrinting: "Printing...",
      btTestPrint: "Print test receipt",
      btUsbHint: "USB printer: plug in via OTG cable and grant permission in the Android system dialog — the receipt is still printed from this app.",
      btWifiHint: "Network (WiFi) printer: be on the same network and enter the IP under Connection → Network.",
      btClassicHint: "Legacy (classic) Bluetooth printers do not appear in the list — a BLE thermal printer is required.",
      prDefaultPrinter: "Default printer",
      selectOption: "— Select —",
      prKindLabel: "Printer type",
      prPaperWidth: "Paper width",
      prPaperWidthHint: "For thermal receipt printers",
      prConnection: "Connection type",
      prNetwork: "Network (IP)",
      prIp: "IP address",
      prPort: "Port",
      prTesting: "Printing...",
      prTest: "Test print",
      scDesktopOnly: "Scale check is only available in the desktop app.",
      scMobileNote: "Phones have no serial port (COM). Bluetooth scales will be added in a future release — enter the weight manually for now.",
      scStatusTitle: "Scale status",
      scStatusDesc: "Check communication with the device",
      scTesting: "Checking...",
      scTest: "Test",
      scTestHint: "Live weight reading check",
      scSettingsDesc: "Port, model and unit of measure",
      scPort: "Connection port",
      scModel: "Scale model / brand",
      scCustomModelNote: "Enter the brand name for a custom protocol (e.g.: KELLER, RADWAG).",
      scUnit: "Unit of measure",
      scKg: "kilogram (kg)",
      scG: "gram (g)",
      scAutoRead: "Automatic weight capture",
      scAutoReadDesc: "Measured weight is captured automatically on Product / Invoice screens",
      rcErrType: "Only PNG or JPG images are accepted.",
      rcErrSize: "Image size must not exceed 2 MB.",
      rcTabThermal: "Thermal receipt (80mm)",
      rcTabStandard: "Standard print (A4)",
      rcLogoTitle: "Logo",
      rcLogoDesc: "Image used in both print formats (PNG/JPG, max 2 MB)",
      rcLogoUpload: "Upload logo",
      rcRemove: "Remove",
      rcLogoWidth: "Logo width (px; 0 = default)",
      rcLogoCenter: "Center the logo",
      rcCenter: "Centered",
      rcLeft: "Left",
      rcCompanyTitle: "Company information",
      rcCompanyDesc: "Comes from a single source in both print formats",
      rcCompanyName: "Company name",
      rcAddress: "Address",
      rcPhone: "Phone number",
      rcTaxId: "Tax ID / STIR",
      rcPreview: "Preview ({paper})",
      thShowLogo: "Show logo",
      thShowAddress: "Show address",
      thShowPhone: "Show phone",
      thShowTaxId: "Show tax ID",
      thShowQr: "Show QR code",
      thShowBarcode: "Show barcode",
      thShowCashier: "Show cashier name",
      thShowCustomer: "Show customer name",
      thFieldsTitle: "Fields to show",
      thFieldsDesc: "Which information is printed on the receipt",
      thPaperTitle: "Paper and font",
      thPaperDesc: "Thermal roll width and font size",
      thFontSize: "Font size",
      thFontHint: "Can be enlarged for cashiers with poor eyesight.",
      fontSm: "Small",
      fontMd: "Medium",
      fontLg: "Large",
      thQrTitle: "QR and print action",
      thQrDesc: "QR content, automatic print and copy count",
      thQrContent: "QR code content",
      qrInvoice: "Invoice number (receipt №)",
      qrWebsite: "Company name / website",
      qrPayment: "Payment information",
      thAutoPrint: "Automatic print",
      thAutoPrintDesc: "Print the receipt automatically when the sale completes (on the Invoice screen).",
      thCopies: "Copy count (1–3)",
      thFooterNote: "Text at the bottom of the receipt",
      thFooterPh: "Thank you, come again!",
      spOrientPortrait: "Portrait",
      spOrientLandscape: "Landscape",
      spColBarcode: "Barcode / SKU",
      spColUnit: "Unit of measure",
      spColUnitPrice: "Unit price",
      spColDiscount: "Discount (%)",
      spColSubtotal: "Subtotal",
      spColTax: "VAT",
      spInfoCurrency: "Currency (TMT)",
      spInfoPayment: "Register (payment method)",
      spInfoCustomer: "Customer name",
      spInfoLedger: "Ledger name",
      spLayoutTitle: "Page layout",
      spLayoutDesc: "A4 paper orientation and font size",
      spOrientation: "Paper orientation",
      spItemsTitle: "Products",
      spItemsDesc: "How product rows are shown",
      spShowImages: "Show products with images",
      spShowImagesDesc: "When on, each product row also prints its image.",
      spColumns: "Columns to show",
      spInfo: "Information to show",
      spInfoHint: "Whether register, customer, ledger and currency are shown on the printout.",
      spHeadFootTitle: "Page header / footer",
      spHeadFootDesc: "Top and bottom arrangements",
      spHeader: "Page header",
      spHeaderDesc: "Show a large logo and company information at the top.",
      spFooter: "Page footer",
      spFooterDesc: "Show company name and page number at the bottom.",
      spSignature: "Signature / stamp area",
      spSignatureDesc: "'Seller' and 'Buyer' signature boxes at the bottom.",
      spNotesTitle: "Notes / Terms",
      spNotesDesc: "Extra text appended to the bottom of the A4 printout",
      spNotesPh: "E.g.: Goods are accepted back within 14 days. Payment terms...",
      permRoleExists: "This role already exists.",
      permProtectedDelete: "Built-in roles cannot be deleted.",
      permRolesTitle: "Roles",
      permRolesDesc: "Role templates share the same model as the Users module — these permissions are pre-filled when a new user is created",
      permNewRolePh: "New role name...",
      permAddRole: "Add role",
      permDelete: "Delete",
      permRolePerms: "Module permissions for the «{role}» role",
      permModulesNote: "{count} modules · Per-user overrides in the Users module are preserved",
      permAuditTitle: "Audit",
      permAuditDesc: "Record of system activity",
      permAuditLabel: "Record all activity in this system",
      permAuditLabelDesc: "When enabled, user actions are logged",
      auditCreate: "Created",
      auditUpdate: "Updated",
      auditDelete: "Deleted",
      auditView: "Viewed",
      auditReadFailed: "Could not read the log: {error}",
      auditExportTitle: "Export activity log",
      auditSaved: "Log saved to a .json file.",
      auditExportFailed: "Export failed: {error}",
      auditDesc: "Who changed which record and when — last 300 entries",
      auditDisabled: "Logging is off. To enable: Permissions → Activity log.",
      auditHealthError: "Log write failed ({count} times): {error}",
      auditDocType: "Record type",
      auditUser: "User",
      auditAll: "All",
      auditRefresh: "Refresh",
      auditExport: "Export (.json)",
      auditColTime: "Time",
      auditColAction: "Action",
      auditColType: "Type",
      auditColEntry: "Record",
      auditLoading: "Loading...",
      auditEmpty: "Log is empty — no changes recorded yet.",
      unitsDesc: "Units selectable when adding a product. Built-in ones cannot be deleted; you can add your own.",
      unitColCode: "Code",
    },
    mobile: {
      customerSearchTitle: "Search customer",
    },
    receipt: {
      receiptNo: "Receipt No",
      cashier: "Cashier",
      colNo: "RECEIPT NO:",
      colDate: "DATE:",
      colCashier: "CASHIER:",
      colCustomer: "CUSTOMER:",
      colItemsQty: "ITEM / QTY",
      colTotal: "TOTAL",
      subtotal: "SUBTOTAL:",
      discount: "DISCOUNT:",
      paid: "PAID:",
      paidTotal: "TOTAL PAID:",
      remainingDebt: "REMAINING DEBT:",
      creditTerm: "CREDIT TERM:",
      days: "days",
      dueDate: "DUE DATE:",
      paymentType: "PAYMENT METHOD:",
      auth: "AUTH:",
      status: "STATUS:",
      approved: "APPROVED",
      waitingAgain: "We look forward to seeing you again!",
      invTitle: "INVOICE",
      invCode: "Invoice no:",
      invNo: "Invoice:",
      invDate: "Date:",
      invCustomer: "Customer:",
      invCashier: "Cashier:",
      colProduct: "Product",
      colBarcode: "Barcode",
      colQty: "Qty",
      colUnit: "Unit",
      colUnitPrice: "Unit price",
      colPrice: "Price",
      colDiscount: "Discount",
      colDiscountShort: "Disc.",
      colLineTotal: "Total",
      taxLabel: "Tax (VAT):",
      taxShort: "Tax:",
      subtotalLabel: "Subtotal:",
      discountLabel: "Discount:",
      ledgerLabel: "Ledger:",
      grandTotal: "Total:",
      paidLabel: "Paid:",
      remainingLabel: "Remaining debt:",
      paymentLabel: "Payment method:",
      paymentShort: "Payment:",
      seller: "Seller",
      buyer: "Buyer",
      notesTerms: "Notes / Terms:",
      pageOne: "Page 1",
      authShort: "AUTH:",
      thermalDate: "DATE:",
      noShort: "Receipt №:",
      totalCaps: "TOTAL",
    },
    payment: {
      cash: "CASH",
      card: "BANK CARD",
      credit: "CREDIT",
      split: "SPLIT",
    },
    excel: {
      exportSuccess: "Exported to Excel",
      exportedRows: "{count} rows exported.",
      importModalTitle: "Import from Excel",
      exportModalTitle: "Export to Excel",
      errorReportTitle: "Product Import Error Report",
      selectFile: "Choose Excel file",
      downloadTemplate: "Download sample template",
      readingFile: "Reading file...",
      importDone: "Import completed",
      importAdded: "added",
      importUpdated: "updated",
      importSkipped: "skipped",
      failedSummary: "{written} of {total} rows written — {failed} failed.",
      failedRows: "Rows not written:",
      errorReport: "Error report",
      validRow: "Valid row",
      existing: "Existing",
      errorRow: "Invalid row",
      existingProducts: "For existing products:",
      overwriteAll: "Update all",
      skipAll: "Skip all",
      selectFileHint: "Choose an Excel file — the rows will appear here.",
      closeBtn: "Close",
      writing: "Writing...",
      importBtn: "Import ({count})",
      statusNew: "New",
      savedToDocuments: "File saved to the Documents folder.",
      saveFailed: "File could not be saved — please try again.",
      selectAll: "Select all",
      clearSelection: "Clear selection",
      includeStock: "Include stock quantities?",
      includeCost: "Include purchase prices?",
      exportBtn: "Export to Excel ({count})",
      colName: "Product Name",
      colStatus: "Status",
      errorReportTitleCustomers: "Customer Import Error Report",
      detailHeaderPhone: "Phone",
      importModalTitleCustomers: "Import from Excel",
      exportModalTitleCustomers: "Export to Excel",
      existingCustomers: "For existing customers (name/phone match):",
      searchCustomers: "Search customers...",
      includeBalance: "Include debt/credit balances?",
      customerNotFound: "No customers found",
      fileTooLarge: "File too large — the limit is {maxMB} MB.",
      tooManyRows: "Too many rows — the limit is {maxRows} rows.",
      xlsNotSupported: "Legacy .xls files are not supported. Save the file as .xlsx.",
      xlsxOnly: "Only .xlsx files are accepted.",
      invalidFile: "The file is corrupt or empty.",
      readFailed: "The file could not be read.",
      mapColumns: "Map columns",
      mappingHint: "Match Excel columns to target fields. You can change the header row and skip fields you do not need.",
      headerRow: "Header row",
      requiredColumn: "(required)",
      unmappedColumn: "Do not map / skip this field",
      sourceColumn: "Column {column} — {header}",
      emptyHeader: "No header",
      sampleCell: "Sample: {value}",
      mappingRequired: "Map required fields to distinct source columns and resolve ambiguous matches.",
      applyMapping: "Apply mapping and preview",
      mappingAmbiguous: "Multiple matches — choose a source",
    },
    products: {
      searchPlaceholder: "Search by product name or barcode...",
      bulkEditTitle: "Bulk edit many products",
      bulkEdit: "Bulk Edit",
      importExcelTitle: "Import from Excel",
      importExcel: "Import from Excel",
      exportExcelTitle: "Export to Excel",
      exportExcel: "Export to Excel",
      allCategoriesOption: "All",
      newProduct: "New Product",
      colNameCategory: "Product Name / Category",
      colBarcode: "Barcode",
      colPurchaseSale: "Purchase / Sale",
      colStock: "Current Stock",
      colActions: "Actions",
      notFound: "No products found",
      clickToEdit: "Click to edit",
      composedTooltip: "This product has a composition",
      composedBadge: "Set",
      negativeStockAllowed: "Negative stock allowed",
      compositionEditTooltip: "Product composition: view/edit",
      compositionAddTooltip: "Add product composition",
      editAction: "Edit",
      deleteConfirm: "Do you want to delete this product?",
      noBtn: "Cancel",
      editTitle: "Edit Product",
      addTitle: "Add New Product",
      imageChangeTitle: "Click to change the image",
      compressing: "Compressing…",
      changeBtn: "Change",
      imageOptional: "Image (Optional)",
      nameLabel: "Product Name *",
      namePlaceholder: "E.g.: Coca Cola 1L",
      categoryLabel: "Category",
      categoryPlaceholder: "E.g.: Beverages",
      barcodeLabel: "Main Barcode *",
      unit1Label: "Unit 1",
      priceLabel: "Sale Price (Retail) *",
      unit2Enable: "Enable Unit 2",
      unit2Label: "Unit 2",
      unit2QtyLabel: "1 {unit2} contains how many {unit1}",
      unit2Example: "E.g.: 1 {unit2} = {qty} {unit1}",
      purchasePriceLabel: "Purchase Price (Cost)",
      wholesalePriceLabel: "Wholesale Price",
      stockLabel: "Current Stock Quantity",
      negativeStockTooltip: "When enabled, sales continue even without stock; stock goes negative",
      negativeAllowedShort: "can go −",
      inactiveTooltip: "Inactive products cannot be added to the cart depending on settings",
      activeBtn: "Active",
      inactiveBtn: "Inactive",
      inactiveNote: "Inactive products cannot be added to invoices/cart (depends on settings).",
      compositionOpenTooltip: "Open/edit composition",
      compositionBtn: "Composition",
      criticalStockLabel: "Critical Stock Alert",
      expiryLabel: "Expiration Date",
      extraBarcodesLabel: "Extra Barcodes (Multiple / Box Barcode)",
      extraBarcodePlaceholder: "Second or third barcode...",
      addShort: "Add",
      cancelBtn: "Cancel",
      saveBtn: "Save",
      unitNameRequired: "Enter a name.",
      unitExists: "This unit already exists.",
      customUnitPlaceholder: "E.g.: ROLL",
      customUnitOption: "+ Add your own unit",
      unitAddedHint: "The new unit is added to the list and selected",
      bulkModalTitle: "Bulk Edit — Products",
      changesReady: "changes ready",
      bulkSearchPlaceholder: "Product name / barcode / SKU...",
      bulkAllCategories: "All categories",
      colName: "Product name",
      colPurchase: "Purchase",
      colSale: "Sale",
      stockShort: "Stock",
      colCritical: "Critical",
      errorRowsHint: "(empty name / negative price)",
      priceRule: "Prices cannot be negative",
      saveCount: "Save ({count})",
      compSaved: "Saved.",
      compositionTitle: "Product Composition — {name}",
      compositionSearchPlaceholder: "Search for products to add to the composition...",
      selectProduct: "Select product",
      stockAmount: "Stock quantity",
      stockPrefix: "St:",
      purchaseShort: "cost",
      saleShort: "sale",
      components: "Components",
      noComponents: "No components selected yet.",
      stockInsufficient: "Insufficient stock",
      unitShort: "unit",
      totalShort: "total",
      removeTooltip: "Remove",
      totalPurchase: "Total Cost",
      totalSale: "Total Sale",
      profit: "Profit (Margin)",
      mainPriceLabel: "Main product sale price",
      useSuggestedTooltip: "Use the total sale price",
      useSuggested: "Use suggested",
    },
    customers: {
      filterAllCount: "All ({count})",
      filterCustomersCount: "Customers ({count})",
      filterEmployeesCount: "Employees ({count})",
      filterAll: "All",
      filterCustomers: "Customers",
      filterEmployees: "Employees",
      searchPlaceholder: "Search by name or phone...",
      bulkEditTitle: "Bulk edit customers",
      bulkEdit: "Bulk Edit",
      importExcelTitle: "Import from Excel",
      importExcel: "Import from Excel",
      exportExcelTitle: "Export to Excel",
      exportExcel: "Export to Excel",
      addCustomer: "Add Customer / Employee",
      newCardTitle: "New Customer Card",
      colNamePhone: "Name / Phone",
      colType: "Type",
      colKind: "Type",
      colDueDate: "Term",
      colBalance: "Balance",
      colActions: "Actions",
      notFound: "No registered customers/employees found.",
      doubleClickHint: "Double-click to view details",
      typeEmployee: "Employee",
      typeCustomer: "Customer",
      typeSupplier: "Supplier",
      editAction: "Edit",
      generalCustomerNoDelete: "General Customer — system record, cannot be deleted",
      roleEmployee: "Employee / Staff",
      roleCustomer: "Customer / Buyer",
      phoneLabel: "Phone",
      balanceLabel: "Account Balance",
      dueDateLabel: "Term (Due)",
      creditLimitLabel: "Debt Limit",
      unlimited: "Unlimited",
      addressLabel: "Address / Notes",
      ledgerTitle: "Invoices & Debt/Payment History",
      txCountSuffix: "transactions",
      noTransactions: "No invoices or debt/payment transactions found for this customer.",
      colDate: "Date",
      colInvoiceCode: "Invoice Code",
      colReason: "Transaction / Reason",
      colDebit: "Debt (+)",
      colCredit: "Payment (-)",
      closeBtn: "Close",
      receiptTooltip: "Click to view the receipt",
      reasonSalesInvoice: "Sales Invoice ({count} items)",
      reasonInvoiceOp: "Invoice Transaction",
      reasonCreditSale: "Credit Sales Invoice (Product Purchase)",
      reasonCashPayment: "Cash Debt Payment (Register)",
      reasonWholesale: "Wholesale Sales Invoice (Credit)",
      reasonBankTransfer: "Bank Card / Transfer Payment",
      reasonOpening: "Opening Account Balance",
      editTitle: "Edit — {name}",
      nameLabel: "Full Name / Company Name *",
      namePlaceholder: "E.g.: John Smith",
      nameReadOnlyTitle: "General Customer — system record, name cannot be changed",
      phoneLabelForm: "Phone Number",
      typeLabel: "Account Type",
      typeCustomerOption: "Customer (Buyer)",
      typeEmployeeOption: "Employee (Worker)",
      dueDateLabelForm: "Due Days (Payment Term)",
      creditLimitLabelForm: "Debt Limit (Maximum)",
      addressLabelForm: "Address / Notes",
      addressPlaceholder: "Address or description...",
      balanceAutoTitle: "Calculated automatically from invoice/register transactions — cannot be edited manually",
      balanceAutoNote: "Calculated automatically from invoice/register transactions — cannot be edited manually.",
      activeLabel: "Active (in use)",
      cashBlockedLabel: "Cash sales blocked",
      cashBlockedHint: "Cash sales blocked — this customer can only buy with card/credit.",
      saveCreateBtn: "Save",
      bulkModalTitle: "Bulk Edit — Customers",
      changesReady: "changes ready",
      bulkSearchPlaceholder: "Name or phone...",
      allTypes: "All types",
      colFullName: "Full Name",
      colPhone: "Phone",
      colAddressNote: "Address / Note",
      systemNameReadOnly: "System record — name cannot be changed",
      errorEmptyName: "{count} invalid rows (empty name)",
      balanceLegend: "Balance: (+) owes us · (−) we owe",
      saveCount: "Save ({count})",
    },
    users: {
      errUsernameRequired: "Username is required.",
      errUsernameTaken: "This username is already in use.",
      errPasswordMismatch: "Passwords do not match.",
      errCategoryRequired: "Select at least one category.",
      errInvoiceTypeRequired: "Select at least one invoice type.",
      searchPlaceholder: "Search by name or role...",
      allRoles: "All roles",
      newUser: "New user",
      colUsername: "Username",
      colRole: "Role",
      colStatus: "Status",
      colLastLogin: "Last login",
      colActions: "Actions",
      emptyNoUsers: "No users. Create a new user.",
      emptyNotFound: "No users found",
      active: "Active",
      passive: "Inactive",
      protectedTip: "Administrator cannot be edited or deleted",
      protectedBadge: "Protected",
      editTip: "Edit",
      resetPasswordTip: "Reset password",
      deleteTip: "Delete",
      deleteMsg: "Do you want to delete this user?",
      newPassword: "New password",
      confirmPassword: "Confirm password",
      actView: "View",
      actCreate: "Add",
      actEdit: "Edit",
      actDelete: "Delete",
      actReport: "Report",
      colModule: "Module",
      editTitle: "Edit user",
      roleLabel: "Role (can be typed manually)",
      customRoleHint: "New role — you set the permissions yourself",
      passwordEditLabel: "Password (leave empty to keep unchanged)",
      passwordNewLabel: "Password (optional)",
      permissionsTitle: "Permissions",
      finePermsTitle: "Cash Register and Invoice fine permissions",
      kassaSection: "Cash Register",
      addIncome: "Add income",
      addExpense: "Add expense",
      showBalance: "Show cash balance",
      allowedCategories: "Allowed categories",
      selectAll: "Select all",
      clearAll: "Clear all",
      fakturaSection: "Invoice",
      editPrice: "Edit price",
      allowDiscount: "Allow discount",
      allowedInvoiceTypes: "Allowed invoice types",
      modeAll: "Allow all",
      modeWhitelist: "Only selected",
      modeBlacklist: "All except selected",
      removeTip: "Remove",
      selectedCount: "{count} selected",
      noneSelected: "Not selected yet",
      notFound: "Not found",
      searchIn: "{label} — search...",
      advTitle: "Advanced Permissions (Default Values and Access)",
      defaultsSection: "Default Values",
      defInvoiceType: "Default invoice type",
      defPaymentType: "Default payment method",
      defUnit: "Default unit (main)",
      defUnit2: "Default second unit (pack/box)",
      defCustomer: "Default customer",
      noOneGeneral: "None (General Customer)",
      defWarehouse: "Default warehouse",
      defLedger: "Default ledger",
      accessSection: "Access Control",
      payTypesTitle: "Which payment methods can they create?",
      phPayment: "Payment method",
      phCustomer: "Customer",
      phProduct: "Product",
      phWarehouse: "Warehouse",
      phLedger: "Ledger",
      customerPerms: "Customer Permissions",
      productPerms: "Product Permissions",
      warehousePerms: "Warehouse Permissions",
      invoiceWarehouses: "Warehouses allowed for invoices (if different from the general warehouse permission)",
      ledgerPerms: "Ledger Permissions",
    },
    errors: {
      documentValidation: "Record validation failed. Invalid or missing fields: {fields}",
      invalidBatchSize: "Batch size must be a positive integer.",
      generic: "An unexpected error occurred.",
      network: "Network error — check your connection.",
      boundaryTitle: "Something went wrong",
      boundaryRestart: "Restart",
    },
    license: {
      title: "License Management",
      account: "Account:",
      attention: "Note:",
      needLicense: "This action requires a license: {route}",
      needKeyInfo: "You need to obtain a license key. Sales, purchases, stock and all operations are tied to the license.",
      daysLeft: "({days} days left)",
      days: "{days} days",
      accountId: "Account ID",
      loading: "Loading...",
      copy: "Copy",
      requestCode: "Request Code (send to us)",
      requestCodeHint: "Send this code via WhatsApp/Telegram. You will be given a root code and a license key.",
      rootCode: "Root Code",
      rootCodeFirstSetup: "(first setup)",
      rootCodePlaceholder: "Paste the root code here",
      rootCodeHint: "107 characters. Given to the customer the first time; not needed for later renewals.",
      rootCodeReenter: "Have a root code / re-entering",
      licenseKey: "License Key",
      licenseKeyPlaceholder: "Paste the license key here",
      licenseKeyHint: "160 characters (may arrive in groups of 6)",
      activating: "Activating...",
      activate: "Activate",
      activeLicense: "Active License",
      expiry: "Expires:",
      remaining: "Time left:",
      features: "Features:",
      maxRegisters: "Max. registers:",
      loadFailed: "License information could not be loaded: {error}",
      nothingToCopy: "Nothing to copy",
      copied: "{label} copied",
      copyFailed: "Copy failed — you can select the text manually",
      rootInvalid: "Root code is invalid ({status})",
      activated: "License activated!",
      activationError: "Activation error: {error}",
      errorFallback: "Error: {status}",
      statusActive: "License is active",
      statusInvalidKey: "Invalid license key",
      statusExpired: "License has expired",
      statusOtherDevice: "This key belongs to another device (rebind required)",
      statusClockReset: "Device clock was set back (clock-reset required)",
      statusUsed: "This key has already been used",
      statusNotActivated: "Not activated yet",
      statusInvalidInput: "Invalid input",
      statusKeyInvalid: "Key is invalid",
      statusOtherAccount: "Key belongs to a different account",
      statusStorage: "Storage error",
      statusRootRequired: "Root code required first",
      statusFileCorrupt: "License file is corrupted",
    },
    targowy: {
      targows: "Sales agents",
      addTargow: "Add agent",
      noTargow: "No agents",
      notFound: "No agents found",
      view: "View",
      todayOrders: "Today's orders",
      monthResult: "Monthly result",
      last7Days: "Last 7 days",
      last14Days: "Last 14 days",
      noRegionAssigned: "No region assigned",
      todayTotalSales: "Today's total sales",
      todayOrderCount: "Today's order count",
      activeTargows: "Active agents",
      bestToday: "Best agent (today)",
      noOrdersToday: "No orders today",
      today: "Today",
      thisWeek: "This week",
      thisMonth: "This month",
      commission: "commission",
      ordersUnit: "orders",
      monthlyTarget: "Monthly target",
      noOrders: "No orders",
      allRegions: "All regions",
      allStatuses: "All statuses",
      fullNameRequired: "Full name is required.",
      phoneRequired: "Phone number is required.",
      targowExists: "This agent already exists.",
      optional: "optional",
      noRegionsHint: "No regions. Add one from the \"Regions\" section.",
      deleteConfirm: "Delete agent \"{name}\"?",
      deleteHasOrders: "This agent has {count} orders. Deactivating instead of deleting is recommended.",
      tabRegions: "Regions",
      tabRating: "Rating",
      regionExists: "This region already exists.",
      newRegionPh: "New region name",
      addRegion: "Add region",
      noRegions: "No regions",
      activeLabel: "Active",
      inactiveLabel: "Inactive",
      editTitle: "Edit courier",
      newTitle: "New courier",
      fullNameLabel: "Full name *",
      colRank: "Rank",
      colName: "Name",
      colOrderCount: "Order count",
      colTotalAmount: "Total amount",
      avgOrder: "Average order",
      colNewCustomer: "New customers",
      colTrend: "Trend",
      colCustomer: "Customer",
      periodAll: "All time",
      critAmount: "Most TMT",
      critOrders: "Most orders",
      critNewCustomers: "Most new customers",
    },
    walyuta: {
      baseCurrency: "Base currency",
      baseCurrencyHint: "used in prices, invoices and reports",
      fixed: "Fixed",
      change: "Change",
      confirmBaseTitle: "Set {code} as the base currency?",
      confirmBaseMsg: "This changes the unit used in prices, invoices and reports to {code}. Recorded amounts stay unchanged and totals are preserved.",
      prevBase: "Previous base currency",
      deleteConfirm: "Delete currency {code}?",
      deleteBaseBlocked: "This is the base currency — set another currency as base first, then delete it.",
      deleteInUse: "This currency is in use and cannot be deleted.",
      codeRequired: "Enter the currency code.",
      tmtIsBase: "TMT is the base currency and cannot be added separately.",
      codeExists: "This currency code already exists.",
      nameRequired: "Enter the currency name.",
      ratePositive: "{code} rate must be greater than 0.",
      customCodeLabel: "Currency code (manual)",
      colSymbol: "Symbol",
      colRate: "Rate (1 unit = ? {code})",
      colUpdated: "Last updated",
      emptyCurrencies: "No currencies. Add a new currency.",
      baseBadge: "Base",
      updateRate: "Update rate",
      setBase: "Set as base currency",
      baseCannotDelete: "Base currency cannot be deleted",
      deleteLabel: "Delete",
      baseSetNotice: "Base currency: {code}",
      baseSetFailed: "Base currency could not be changed.",
      addOtherFirst: "Add another currency first.",
      addedCurrencies: "Added currencies",
      editTitle: "Edit currency",
      newTitle: "New currency",
    },
    faktura: {
      selectTargow: "Select an agent.",
      selectCustomer: "Select a customer.",
      selectRegion: "Select a region.",
      addOneProduct: "Add at least one product.",
      draftNoEffect: "Does not affect any module until approved by the office",
      productSearchPh: "Product name or barcode...",
      noProductsAdded: "No products added",
      filterSearchPh: "Customer or invoice no...",
      recordsShown: "records shown",
      soundOn: "Notification sound on — press to mute",
      soundOff: "Notification sound off — press to unmute",
      rejectTitle: "Reject draft",
      rejectHint: "A rejected draft does not affect any module but stays in history.",
      rejectReasonLabel: "Rejection reason (optional)",
      noDrafts: "No draft invoices",
      openInInvoice: "Open in invoice screen",
      openLabel: "Open",
      createTitle: "Create draft invoice",
      noteLabel: "Note",
      cancelBtn: "Cancel",
      saveDraft: "Save as draft",
      targowLabel: "Courier *",
      customerLabel: "Customer *",
      regionLabel: "Region *",
      selectOption: "— Select —",
      paymentLabel: "Payment method",
      currencyLabel: "Currency",
      payCash: "Cash",
      payCard: "Card",
      payCredit: "Credit",
      addProductLabel: "Add product",
      colProduct: "Product",
      colPrice: "Price",
      colQty: "Qty",
      colTotal: "Total",
      statusPending: "Pending",
      statusAccepted: "Accepted",
      statusRejected: "Rejected",
      filterAll: "All",
      filterByUser: "By user",
      filterByTargow: "By courier",
      filterByRegion: "By region",
      dateStartTip: "Start date",
      dateEndTip: "End date",
      clearFilters: "Clear",
      colDate: "Date / Time",
      colSender: "Sent by",
      colCustomer: "Customer",
      colRegion: "Region",
      colStatus: "Status",
      colAction: "Action",
      acceptTip: "Accept",
      rejectTip: "Reject",
    },
    depder: {
      noDescription: "No description",
      currentBalance: "Current balance",
      usersUnit: "users",
      deleteConfirm: "Delete ledger \"{name}\"?",
      deleteHasTx: "This ledger has transactions. Deactivating instead of deleting is recommended — history is preserved.",
      back: "Back",
      txUnit: "transactions",
      nameRequired: "Ledger name is required.",
      nameExists: "This ledger name already exists.",
      openingBalanceNaN: "Opening balance must be a number.",
      namePh: "e.g. Main cash desk",
      descPh: "Short description...",
      grandTotal: "Grand total (TMT)",
      ledgersUnit: "ledgers",
      transferBtn: "Transfer between ledgers",
      newLedger: "New ledger",
      noLedgers: "No ledgers",
      noLedgersHint: "Create a new ledger to manage your cash desks separately.",
      selectLedgers: "Select the ledgers.",
      sameLedger: "Cannot transfer to the same ledger.",
      amountPositive: "Amount must be greater than 0.",
      transferDescPh: "e.g. end-of-day transfer",
      transferTitle: "Transfer between ledgers",
      fromLedger: "From ledger",
      toLedger: "To ledger",
      amountLabel: "Amount",
      dateLabel: "Date",
      rateNote: "by rate:",
      descLabel: "Description",
      cancelBtn: "Cancel",
      transferSubmit: "Make transfer",
      editTitle: "Edit ledger",
      newTitle: "New ledger",
      nameLabel: "Name *",
      currencyLabel: "Currency",
      openingLabel: "Opening balance",
      descFieldLabel: "Description",
      activeLabel: "Active",
      inactiveLabel: "Passive",
      permsTitle: "Permissions — who can access this ledger",
      saveBtn: "Save",
      userSelectPh: "Select user...",
      userAdd: "Add user",
      userCol: "User",
      noUsersNote: "No users added. Administrators automatically have all permissions.",
      allPerms: "All permissions",
      removeTip: "Remove",
      permEnter: "Can enter",
      permAddIncome: "Can add income",
      permAddExpense: "Can add expense",
      permEdit: "Can edit",
      permDelete: "Can delete",
      permViewReport: "Can view reports",
    },
    warehouses: {
      searchPh: "Search by warehouse name, code or address...",
      newWarehouse: "New warehouse",
      colWarehouse: "Warehouse",
      colCode: "Code",
      colAddressTel: "Address / Phone",
      colStatus: "Status",
      colActions: "Actions",
      emptyNone: "No warehouses yet. Create a new one.",
      emptyNotFound: "No warehouse found",
      itemsUnit: "item",
      inactive: "Inactive",
      active: "Active",
      defaultBadge: "Default",
      editTitle: "Edit",
      deleteConfirm: "Delete this warehouse?",
      cancelNo: "Cancel",
      formEditTitle: "Edit warehouse",
      formName: "Warehouse name",
      formPhone: "Phone",
      formAddress: "Address",
      formNote: "Note",
      defaultWarehouse: "Default warehouse",
      itemsInside: "Items inside",
      colProductName: "Product name",
      colBarcode: "Barcode",
      colQty: "Quantity",
      colUnit: "Unit",
      colPrice: "Price",
      emptyWarehouse: "This warehouse is empty",
      close: "Close",
    },
    modals: {
      importFailed: "Import failed: only .bhbak (or legacy .json backup) is accepted.",
      accountFileHint: " — select a backup .bhbak file for this account. Only Biznes Hasap can open it.",
      clickToPick: "Click to choose a file",
      importedCount: "{count} records imported.",
      importing: "Importing...",
      shortcutsTitle: "Keyboard Shortcuts",
      shortcutsHint: "You can press the F-keys to run actions directly.",
      shortcutsClose: "Close",
      bhbakNote: ".bhbak — Biznes Hasap backup",
    },
    promo: {
      modalTitle: "PROMO system",
      modalSubtitle: "Sale + promo bundle, stock and cash income · {code}",
      tabNew: "New Promo",
      tabEdit: "Edit promo",
      tabList: "Active Promos ({count})",
      tabStock: "Stock status",
      stockEmpty: "No products are used in promos yet",
      stockLabel: "Stock:",
      noProducts: "No products in the Products module. Add a product first.",
      noSelection: "No product selected yet",
      clearTip: "Clear selection",
      saleProduct: "Product to buy",
      pickProduct: "Pick product",
      qtyLabel: "Qty",
      totalLabel: "Total",
      promoProduct: "Promo product",
      pickPromoProduct: "Pick promo product",
      promoQty: "Promo qty",
      modeFree: "Free",
      modePercent: "Percent %",
      modeFixed: "Fixed price",
      modePercentLabel: "Percent %{pct}",
      modeFixedLabel: "Fixed {amount}",
      discountLabel: "Promo discount",
      saleLabel: "Sale",
      promoLabel: "Promo",
      kassaIncome: "Cash income",
      discountWord: "discount",
      insufficientStock: "Not enough stock!",
      cancel: "Cancel",
      create: "Create promo",
      update: "Update",
      pickSaleTitle: "Pick the product to buy",
      pickPromoTitle: "Pick the promo product",
      pickerSearchPh: "Search by name / barcode / SKU...",
      pickerAllCategories: "All categories",
      pickerNotFound: "No products found",
      pickerCount: "{count} products · active currency: {code}",
      pickerClose: "Close",
      listEmpty: "No active promos",
      listEmptyHint: "Create one from the \"New Promo\" section.",
      editTip: "Edit",
      deleteTip: "Delete",
    },
  },
  ru: {
    windowTitle: "Biznes Hasap",
    languageMenuTitle: "Выбор языка",
    otherAccounts: "Другие аккаунты",
    addAccount: "Добавить аккаунт",
    userLabel: "Пользователь",
    passwordLabel: "Пароль",
    passwordPlaceholder: "Введите пароль",
    loginButton: "Войти",
    appName: "Biznes hesap",
    version: `v${pkg.version}`,
    delete: "Удалить",
    edit: "Редактировать",
    import: "Импорт данных",
    autoSelectPrinter: "Авто выбор",
    receiptPrinter: "Чековый принтер",
    standardPrinter: "Стандартный принтер",
    addAccountTitle: "Добавить новый аккаунт",
    editAccountTitle: "Редактировать аккаунт",
    accountName: "Название аккаунта / магазина",
    couchDbUrl: "Адрес CouchDB",
    databaseName: "Имя базы данных",
    save: "Сохранить",
    cancel: "Отмена",
    selectLogo: "Выбрать логотип",
    conn: {
      sectionTitle: "Подключение CouchDB",
      sectionHint: "Проверьте подключение и загрузите данные с сервера до сохранения",
      localTitle: "Локальное подключение (та же Wi-Fi)",
      onlineTitle: "Онлайн-подключение (домен)",
      localPlaceholder: "http://пользователь:пароль@192.168.1.8:5984/база",
      onlinePlaceholder: "http://пользователь:пароль@вашдомен:5984/база",
      testOnly: "Только проверить подключение",
      connect: "Подключить",
      stop: "Остановить",
      showPassword: "Показать пароль",
      hidePassword: "Скрыть пароль",
      statusIdle: "Не подключено",
      statusConnecting: "Подключение…",
      statusConnected: "Подключено",
      statusTested: "Проверено",
      statusError: "Ошибка",
      statusOffline: "Не в сети",
      denied: "Доступ запрещён — неверное имя пользователя или пароль",
      connecting: "Подключение…",
      firstWorking: "Используется первый рабочий адрес.",
      singleConnectionNote: "Одновременно активно только одно подключение; второе закрывается автоматически. При повторном открытии приложения последнее подключение запускается автоматически.",
      progressTransferring: "Передача…",
      progressDone: "Передача завершена",
      docsReceived: "{count} документов получено",
      docsSent: "{count} документов отправлено",
      liveContinues: "Синхронизация продолжается",
      liveAfterTransfer: "Синхронизация начнётся после завершения передачи",
      mergeTitle: "Объединить данные?",
      mergeLocalCount: "на этом телефоне",
      mergeRemoteCount: "записей на сервере.",
      mergeKeep: "Объединить",
      mergeKeepHint: "Записи с обеих сторон объединяются в одну базу.",
      mergeServerOnly: "Только сервер",
      mergeServerOnlyHint: "Записи на телефоне удаляются, используются данные сервера.",
      noAccount: "Аккаунт не выбран.",
      shareNote: "{name} · данные синхронизируются с сервером на вашем компьютере",
      panelNote: "Одновременно открыто только одно соединение; другое закрывается автоматически. Нажмите зелёную иконку ещё раз, чтобы остановить соединение. При перезапуске приложения последнее использованное соединение запускается автоматически.",
    },
    confirmDeleteTitle: "Удалить аккаунт",
    confirmDeleteMsg: "Вы уверены, что хотите удалить этот аккаунт и связанные данные?",
    loginSuccess: "Вход выполнен успешно!",
    wrongPassword: "Неверный пароль!",
    selectAccount: "Выберите аккаунт",
    selectUser: "Выберите пользователя",

    tabKassa: "Фактура",
    tabFatura: "Счета-фактуры",
    tabPara: "Касса",
    tabMusteri: "Клиенты",
    tabUser: "Пользователи",
    tabHaryt: "Товары",
    tabHesaplama: "Расчет",
    tabDoviz: "Обмен валюты",
    tabDepder: "Журнал",
    tabAmbar: "Склад",
    tabKurye: "Курьер/Доставка",
    tabDiger: "Другие",
    tabAyarlar: "Настройки",
    tabLisans: "Лицензия / Ключ",
    salesInvoice: "Расходная накладная (Продажа)",
    purchaseInvoice: "Приходная накладная (Покупка)",
    salesReturnInvoice: "Возврат от покупателя (Продажа возврат)",
    purchaseReturnInvoice: "Возврат поставщику (Покупка возврат)",
    proformaInvoice: "Проформа-фактура",
    quotationInvoice: "Коммерческое предложение",
    generalCustomer: "Общий клиент (Наличные)",
    scanBarcodePlaceholder: "Сканируйте или введите штрихкод...",
    addBtn: "Добавить +",
    productNameCol: "Наименование товара",
    qtyCol: "Кол-во",
    priceCol: "Цена",
    discountCol: "+ / - %",
    totalCol: "Итого",
    emptyCartMsg: "Корзина пуста. Отсканируйте штрихкод или выберите товар справа.",
    itemsCount: "Позиций",
    subtotalLabel: "Промежуточный итог:",
    bulkPercentLabel: "Оптом %",
    amountDueLabel: "К ОПЛАТЕ",
    cashMethod: "Наличные",
    cardMethod: "Карта",
    creditMethod: "В долг",
    splitMethod: "Раздельно",
    cashReceivedLabel: "Получено",
    changeDueLabel: "Сдача",
    exactBtn: "Ровно",
    holdDraftBtn: "Отложить чек",
    completeSaleBtn: "Завершить продажу (F2)",
    searchProductsPlaceholder: "Поиск товаров...",
    allCategories: "Все",
    stockLabel: "Склад",
    outOfStock: "Нет на складе",
    saleCompletedToast: "Продажа успешно завершена!",
    draftHeldToast: "Чек отложен в черновики.",
    productNotFoundToast: 'Товар со штрихкодом "{code}" не найден.',
    logoutTooltip: "Выйти из системы",
    internalNotePlaceholder: "Примечание (не печатается на чеке)...",

    posTerminalTitle: "Банковский терминал (POS)",
    posTerminalConnected: "Терминал подключен (Готов)",
    posDeviceNotConnectedTitle: "Терминал не подключен!",
    posConnectDeviceMsg: "Пожалуйста, подключите платежный терминал к компьютеру и повторите попытку.",
    posAnalyzing: "Проверка подключения устройства...",
    posRetryScan: "Повторить поиск устройства",
    posWaitingCard: "Ожидание карты (Бесконтактная / Чип)...",
    posProcessing: "Обработка платежа, подождите...",
    posApproved: "Оплата успешно принята!",
    posDeclined: "Оплата отклонена / отменена",
    posAutoPrinting: "Автоматическая печать чека...",
    posAuthCode: "Код авторизации",
    receiptTitle: "ТОВАРНЫЙ ЧЕК",
    printBtn: "Печать чека",
    closeBtn: "Закрыть / Новая продажа",
    thanksMsg: "Спасибо за покупку!",
    pos: {
      paymentCancelled: "Оплата отменена",
      newSale: "Новая продажа",
      noPermission: "Нет доступа",
      noStock: "Нет на складе. Включите иконку на товаре для продажи в минус.",
      inactiveProduct: "Этот товар неактивен — его нельзя добавить в корзину.",
      resetDone: "Все изменения отменены.",
      cartEmptyExport: "Корзина пуста — экспорт невозможен.",
      excelExported: "Excel экспортирован.",
      exportCancelled: "Экспорт отменён.",
      exportDialogTitle: "Экспорт счёта в Excel",
      exportFailed: "Ошибка экспорта Excel.",
      belowCost: "Нельзя продать ниже закупочной цены (закупка: {cost}).",
      selectCustomer: "Выберите клиента",
      cartEmpty: "Корзина пуста",
      cartEmptyAddFirst: "Корзина пуста. Сначала добавьте товар.",
      specialPriceMissing: "Специальная цена не введена",
      specialPriceSaved: "Специальная цена для {count} товара(ов) сохранена для {customer}",
      priceSaveFailed: "Не удалось сохранить цену",
      specialPriceNotFound: "Специальная цена для клиента или товаров не найдена",
      pricesApplied: "Цена применена к {count} товарам",
      printFailed: "Ошибка печати: {reason}",
      unknownError: "неизвестная ошибка",
      compositionShort: "Недостаточно комплектующих: {list}",
      dateBeforeStart: "На эту дату операции не открыты (начало: {date}).",
      dateAfterEnd: "Операционный период завершён (последняя: {date}).",
      cashSaleBlocked: "Этому клиенту запрещена продажа за наличные.",
      creditLimitExceeded: "Превышен кредитный лимит (лимит: {limit} TMT).",
      nothingToReset: "Нечего очищать",
      paneCart: "Корзина",
      panePay: "Оплата",
      goToPayment: "Перейти к оплате",
      resetTitle: "Отменить изменения",
      resetMsg: "Все изменения на текущем экране (выбранные товары, клиент, тип цены, оплата) будут очищены. Продолжить?",
      resetCancel: "Отмена",
      resetConfirm: "Отменить",
      fabAddProduct: "Добавить товар",
      fabAddCustomer: "Добавить клиента",
      fabAddMoney: "Добавить операцию",
      fabAddCourier: "Добавить курьера",
      fabAddCurrency: "Добавить валюту",
      fabAdd: "Добавить",
      alertsTitle: "Уведомления",
      alertsCount: "Уведомлений: {count}",
      alertsAttention: "Требуют внимания: {count}",
      alertsAllOk: "Всё в порядке",
      alertsEmpty: "Сейчас уведомлений нет",
      alertsEmptyHint: "Нет критических остатков или долгов с приближающимся сроком.",
      alertsLowStock: "Товары с низким остатком",
      alertsNoCritical: "Нет критических остатков",
      alertsCriticalLevel: "Критический уровень",
      alertsMinus: "МИНУС",
      alertsDueCredits: "Кредиты с приближающимся сроком",
      alertsNoDue: "Нет долгов с близким сроком",
      alertsOverdue: "ПРОСРОЧЕНО",
      alertsToday: "СЕГОДНЯ",
      dueOverdue: "просрочено на {days} дн.",
      dueToday: "Сегодня",
      dueDaysLeft: "осталось {days} дн.",
      csTitle: "Поиск клиента",
      csFoundHeader: "Найдено: {count} клиентов",
      csFound: "Найдено: {count} клиентов",
      csSearchLabel: "Поиск",
      csSearchPlaceholder: "Имя / телефон...",
      csStartsWith: "Искать с начала слова",
      csWhoLabel: "Кого искать?",
      csBadgeCustomer: "Клиент",
      csWhoBoth: "Клиент + Сотрудник",
      csBadgeEmployee: "Сотрудник",
      csRegionLabel: "Регион",
      csAll: "Все",
      csDebtLabel: "Статус долга",
      csDebtHas: "Есть долг",
      csDebtNone: "Нет долга",
      csDebtOverdue: "Просрочено",
      csNotFound: "Клиенты не найдены",
      psTitle: "Поиск товара",
      psFoundHeader: "Найдено: {count} товаров",
      psFound: "Найдено: {count} товаров",
      psSearchLabel: "Поиск",
      psSearchPlaceholder: "Название / код / штрихкод...",
      psWarehouseLabel: "Склад",
      psCategoryLabel: "Категория",
      psAll: "Все",
      psBarcodeStatus: "Статус штрихкода",
      psBsWith: "Со штрихкодом",
      psBsWithout: "Без штрихкода",
      psStockStatus: "Статус остатка",
      psSsInStock: "В наличии",
      psSsOut: "Закончился",
      psSsCritical: "Критический остаток",
      psNotFound: "Товары не найдены",
      psStock: "Остаток",
      psClose: "Закрыть",
      dpTitle: "Печать — {no}",
      dpPreview: "Предпросмотр",
      dpPrinter: "Принтер",
      dpDefaultPrinter: "По умолчанию (системный)",
      dpPrintBtn: "Печать",
      dpPrinted: "Напечатано.",
      dpPrintFailed: "Ошибка печати.",
      dpNote: "Суммы и цены соответствуют текущей корзине. Счёт не завершён — только черновая печать.",
      faSaveTip: "Сохранить счёт (черновик)",
      faSaveLabel: "Сохранить счёт",
      faDraftsTip: "Черновики счетов",
      faDraftsLabel: "Черновики счетов",
      faSoundOnTip: "Звук уведомлений включён — нажмите, чтобы выключить",
      faSoundOffTip: "Звук уведомлений выключен — нажмите, чтобы включить",
      msWarehouseTip: "Выберите склад",
      msWarehouse: "Склад",
      msTargetTip: "Выберите целевой склад",
      msTargetDisabledTip: "Активно только для «Перемещения между складами»",
      msWarehouse2: "Склад 2",
      msTransferNote: "Перемещение между складами: со склада 1 на склад 2",
      changeTip: "Сдача: получено наличными − к оплате",
      changeLabel: "Сдача",
      ledgerTip: "Выберите журнал",
      ledgerOption: "Журнал",
      swLabel: "Дата / Время",
      swPickTip: "Выбрать дату и время вручную",
      swNowTip: "Вернуться к текущему времени",
      swManualTip: "Время выбрано вручную",
      swLiveTip: "Текущее время",
      shortcutsTitle: "Горячие клавиши",
      shortcutsHint: "Нажмите ESC или кликните снаружи, чтобы закрыть",
      emptySection: "Этот раздел пока пуст",
      emptySectionHint: "Содержимое будет добавлено в ближайшее время.",
      icbMenuTitle: "Тип счёта / Документ",
      icbCustomerSearchTip: "Поиск клиента (F2)",
      icbAddTip: "Добавить товар (Enter)",
      icbClearCodeTip: "Очистить код",
      icbNewCodeTip: "Создать новый код",
      icbCopiesTip: "Количество чеков",
      icbCopiesNone: "Без чека",
      icbCopiesCount: "{count} чек(ов)",
      printerSettingsTip: "Настройки принтера",
      generalSearchTip: "Общий поиск",
      unitCol: "Ед.",
      switchAccount: "Сменить аккаунт",
      cameraScanTip: "Сканировать штрихкод камерой",
      gridView: "Сетка",
      listView: "Список",
      cardScanningPorts: "Сканирование портов USB / COM / LAN...",
      cardTestModeTip: "Считать устройство подключённым для теста",
      cardTestMode: "Тестовый режим",
      cardWaitingBefore: "Клиент должен приложить карту к устройству. После подтверждения оплаты устройством нажмите кнопку",
      cardApprove: "«Подтвердить»",
      cardWaitingAfter: ".",
      cardBankApproval: "Ожидание подтверждения банка...",
      cardPaymentFailed: "Не удалось завершить оплату.",
      cardApproveBtn: "Оплата принята и печать чека (Enter)",
    },
    invoices: {
      title: "Список счетов",
      subtitle: "Двойной клик по строке → открыть счёт, затем F11 (Excel) или F12 (печать)",
      filterToday: "Сегодня",
      filterYesterday: "Вчера",
      filterThisWeek: "Эта неделя",
      filterThisMonth: "Этот месяц",
      filterAll: "Все",
      rangeTitle: "Диапазон дат",
      presetTooltip: "Выберите готовый диапазон",
      presetMenuTitle: "Выбор готового диапазона",
      presetToday: "Сегодня",
      presetYesterday: "Вчера",
      presetDayBefore: "Позавчера",
      presetThisWeek: "Эта неделя",
      presetThisMonth: "Этот месяц",
      presetThisYear: "Этот год",
      presetLastWeek: "Прошлая неделя",
      presetLastMonth: "Прошлый месяц",
      presetSinceYesterday: "Со вчерашнего дня",
      presetSinceDayBefore: "С позавчерашнего дня",
      presetSinceLastWeek: "С начала прошлой недели",
      presetSinceLastMonth: "С начала прошлого месяца",
      presetLastYear: "Прошлый год",
      searchPlaceholder: "№ счёта, имя клиента...",
      typeLabel: "Тип:",
      typeSales: "Продажа",
      typeAll: "Все типы",
      typePurchase: "Покупка",
      typeReturns: "Возвраты",
      typeTransfer: "Перемещение",
      typeOther: "Прочий приход/расход",
      statsTotal: "Всего счетов",
      statsCountSuffix: "шт",
      statsAmount: "Общая сумма",
      payCash: "Наличные",
      payCard: "Карта",
      payCredit: "Кредит",
      paySplit: "Смешанная",
      voidedToggleTip: "Показать / скрыть аннулированные",
      voidedToggle: "Аннулированные",
      emptyTitle: "По выбранным фильтрам счета не найдены.",
      emptyHint: "Попробуйте изменить фильтры.",
      colNo: "№ счёта",
      colDate: "Дата / Время",
      colCustomer: "Клиент",
      colType: "Тип",
      colPayment: "Оплата",
      colItems: "Позиции",
      colAmount: "Сумма",
      colAction: "Действие",
      rowOpenTip: "Дважды щёлкните, чтобы открыть счёт",
      receiptOpenTip: "Нажмите, чтобы открыть чек",
      voidedBadge: "Аннулирован",
      returnBadge: "Возврат",
      deleteTip: "Удалить счёт",
      footerHint: "Нажмите на строку или кнопку «Чек», чтобы просмотреть счёт.",
      closeBtn: "Закрыть (Esc)",
      deleteTitle: "Удаление счёта",
      deleteMsg: "Вы уверены, что хотите удалить этот счёт? Это действие нельзя отменить.",
      deleteCascade: "Складские остатки, долг клиента и записи Кассы/Журнала, связанные со счётом, также будут отменены.",
      customerLabel: "Клиент",
      cancelBtn: "Отмена",
      confirmDeleteBtn: "Да, удалить",
      deletedTitle: "Удалённые счета",
      deletedEmpty: "Нет удалённых счетов.",
      deletedColNo: "№ счёта",
      deletedColDate: "Дата",
      deletedColAmount: "Сумма",
      deletedColAt: "Дата удаления",
      deletedColBy: "Кем удалён",
      closeShort: "Закрыть",
      deleteSelected: "Удалить выбранные ({count})",
      deleteAll: "Удалить все",
      permTitle: "Безвозвратное удаление",
      permAllMsg: "Безвозвратно удаляет все удалённые счета. Это действие нельзя отменить. Продолжить?",
      permSelectedMsg: "Безвозвратно удаляет выбранные счета ({count}). Это действие нельзя отменить. Продолжить?",
      permCancel: "Отмена",
      permConfirm: "Удалить",
    },
    kassa: {
      cashIn: "Приход наличных",
      cashOut: "Расход наличных",
      noExpensePerm: "У вас нет прав на добавление расхода.",
      noIncomePerm: "У вас нет прав на добавление прихода.",
      noCategoryPerm: "Нет прав для этой категории.",
      shownCount: "Показано операций: {count}",
      today: "Сегодня",
      balanceCard: "Остаток в кассе",
      todayIncome: "Приход сегодня",
      todayExpense: "Расход сегодня",
      cashLabel: "Наличные",
      cardLabel: "Карта/Перевод",
      deleteMsg: "Удалить эту кассовую операцию?",
      editTip: "Изменить",
      deleteTip: "Удалить",
      searchPlaceholder: "Поиск по описанию или категории...",
      advancedSearchTip: "Расширенный поиск (F3)",
      all: "Все",
      income: "Приход",
      expense: "Расход",
      allCategories: "Все категории",
      allCustomers: "Все клиенты",
      dateStartTip: "Дата начала",
      dateEndTip: "Дата окончания",
      clear: "Очистить",
      empty: "Операции не найдены",
      colDate: "Дата / Время",
      colType: "Тип",
      colCategory: "Категория",
      colCustomer: "Клиент / Поставщик",
      colPayment: "Способ оплаты",
      colAmount: "Сумма",
      colDesc: "Описание",
      colAction: "Действие",
      incomeBadge: "↑ Приход",
      expenseBadge: "↓ Расход",
      editTitle: "Изменить операцию",
      addIncomeTitle: "Добавить приход",
      addExpenseTitle: "Добавить расход",
      dateLabel: "Дата",
      searchTitle: "Поиск кассовой операции",
      foundPrefix: "Найдено: ",
      txSuffix: "операций",
      noteLabel: "Примечание",
      notePlaceholder: "Примечание / клиент / счёт...",
      dateRange: "Диапазон дат",
      allShort: "Все",
      none: "Ничего",
      payCard: "Карта",
      payTransfer: "Перевод",
      customerLabel: "Клиент",
      userLabel: "Пользователь",
      ledgerLabel: "Журнал",
      currencyLabel: "Валюта",
      onlyDue: "Только операции со сроком оплаты (кредит)",
      searchOrType: "Искать или ввести...",
      quickAdd: "Нет в записях — добавить: \"{name}\"",
      debtLabel: "Долг",
      creditLabel: "К получению (кредит)",
      settledLabel: "Счёт закрыт",
      customerOptional: "Клиент (необязательно)",
      supplierOptional: "Поставщик (необязательно)",
      fromWhom: "От кого",
      toWhom: "Кому",
      staffLabel: "Сотрудник",
      selectOption: "— Выбрать —",
      staffNameLabel: "Имя сотрудника (не зарегистрирован)",
      subCategoryLabel: "Подкатегория",
      errAmount: "Сумма должна быть больше 0.",
      errDate: "Выберите дату.",
      errCustomer: "Выберите клиента.",
      errPerson: "Укажите связанное лицо.",
    },
    hasaplama: {
      title: "Расчет",
      result: "Результат",
      period: "Период",
      periodToday: "Сегодня",
      periodWeek: "Эта неделя",
      periodMonth: "Этот месяц",
      periodLastMonth: "Прошлый месяц",
      periodQuarter: "Квартал",
      periodYear: "Год",
      periodCustom: "Произвольный период",
      tabXaccot: "X-Отчёт (дневной)",
      tabPl: "Отчёт о прибыли и убытках",
      tabDebt: "Отчёт по долгам",
      tabStock: "Складской отчёт",
      tabCash: "Кассовый отчёт",
      tabTargow: "Результаты курьеров",
      summaryHideTip: "Скрыть карточки сводки — больше места отчёту",
      summaryShowTip: "Показать карточки сводки",
      summaryHide: "Скрыть сводку",
      summaryShow: "Показать сводку",
      printBtn: "Печать",
      excelBtn: "Экспорт в Excel",
      preparedAt: "Подготовлено:",
      noDataPeriod: "Нет данных за период",
      income: "Доход",
      expense: "Расход",
      incomeCaps: "ДОХОД",
      expenseCaps: "РАСХОД",
      incomeTotal: "Итого доход",
      expenseTotal: "Итого расход",
      incomeItems: "Статьи дохода",
      expenseItems: "Статьи расхода",
      noIncome: "Нет дохода",
      noExpense: "Нет расходов",
      incomeMinusExpense: "Доход − Расход",
      netProfit: "Чистая прибыль",
      netProfitFooter: "Чистая прибыль: {amount} TMT",
      periodMovement: "Движение за период (доход / расход)",
      colDesc: "Описание",
      colCount: "Кол-во",
      colAmountTmt: "Сумма (TMT)",
      colCategory: "Категория",
      colCustomer: "Клиент",
      colDebtTmt: "Долг (TMT)",
      colLastPayment: "Последний платёж",
      totalReceivable: "Итого к получению",
      supplierDebt: "Долг поставщикам",
      borrowed: "Взятый заём (Взять взаймы)",
      lent: "Выданный заём (Дать взаймы)",
      receivablesTitle: "К получению от клиентов (в кредит)",
      noDebt: "Долгов нет — все счета чисты",
      overdueTitle: "Просроченные долги",
      noOverdue: "Нет просроченных долгов",
      colInvoiceNo: "Счёт №",
      colDueDate: "Срок оплаты",
      colLate: "Просрочка",
      daysLate: "{days} дн.",
      totalReceivableFooter: "Итого к получению: {amount} TMT",
      colProduct: "Товар",
      colQty: "Кол-во",
      colPurchase: "Закупка",
      colPurchaseValue: "Стоимость закупки",
      colSaleValue: "Стоимость продажи",
      skuCount: "Видов товара",
      totalQty: "Всего единиц",
      byPurchasePrice: "По цене закупки",
      bySalePrice: "По цене продажи",
      stockState: "Остаток товара",
      filterAll: "Все",
      filterPositive: "+ (плюс)",
      filterNegative: "− (минус)",
      stockCountLabel: "{shown} / {total} товаров",
      noStockKind: "Нет товаров этого вида",
      colStock: "Остаток",
      colSale: "Продажа",
      colStockValue: "Стоимость остатка (продажа)",
      colAction: "Действие",
      showTip: "Показать",
      createInvoiceTip: "Создать счёт",
      criticalStockLabel: "Критический остаток:",
      expiryLabel: "Срок годности:",
      purchasePriceLabel: "Цена закупки:",
      wholesaleLabel: "Оптовая цена:",
      barcodeLabel: "Штрихкод:",
      belowCritical: "Ниже критического уровня остатка ({count})",
      bestSellers: "Самые продаваемые товары",
      worstSellers: "Наименее продаваемые товары",
      noSalesPeriod: "Нет данных о продажах за период",
      purchaseValueFooter: "Общая стоимость закупки: {amount} TMT",
      colLedger: "Книга",
      colCurrency: "Валюта",
      colBalance: "Остаток",
      byLedgers: "По книгам",
      noLedgers: "Нет книг",
      paymentMethodIncome: "Способ оплаты (доход)",
      noIncomePeriod: "Нет дохода за период",
      totalBalanceFooter: "Общий остаток: {amount} TMT",
      colTargow: "Курьер",
      colOrderCount: "Кол-во заказов",
      colTotalAmount: "Общая сумма (TMT)",
      colTotalAmountShort: "Общая сумма",
      colNewCustomer: "Новые клиенты",
      colRank: "Место",
      noTargows: "Нет курьеров",
      fullViewInTargow: "Полный вид в разделе «Курьеры»",
      totalFooter: "Итого: {amount} TMT",
      xaccotTitle: "X-Отчёт · дневной бизнес",
      xaccotPrintTitle: "X-ОТЧЁТ (Дневной бизнес)",
      cardInvoices: "Кол-во счетов",
      cardSalesTotal: "Сумма продаж",
      cardCash: "Наличные",
      cardCard: "Карта",
      cardCredit: "В кредит",
      cardKassaIncome: "Приход кассы",
      cardKassaExpense: "Расход кассы",
      cardNet: "Чистыми",
      salesTotalTmt: "Сумма продаж (TMT)",
      colValue: "Значение",
      netFooter: "Чистыми: {amount} TMT · {count} счетов",
      dayInvoices: "Счета дня ({count})",
      allDayInvoices: "Все счета дня ({count})",
      noInvoicesToday: "Нет счетов за этот день",
      colTime: "Время",
      colPayment: "Оплата",
      dayBestSellers: "Самые продаваемые товары дня",
      noSalesToday: "Нет продаж за этот день",
      productKindsSuffix: "{count} видов товара",
      calculator: "Калькулятор",
      currencyLabel: "Валюта",
      totalIncome: "Общий доход",
      totalExpense: "Общий расход",
      stockValue: "Стоимость товаров на складе",
      ledgerBalance: "Остаток в кассе / книге",
    },
    sazlamalar: {
      sectionGeneral: "Общие настройки",
      resetToDefaults: "Сбросить настройки",
      unitNameRequired: "Введите название.",
      unitNameRequiredEdit: "Введите название.",
      unitExists: "Такая единица уже существует.",
      unitInUse: "\"{name}\" используется, удалить нельзя.",
      unitNewPh: "Новая единица (напр.: РУЛОН)",
      unitAdd: "Добавить единицу",
      unitColName: "Название",
      unitColUsedBy: "Используют товары",
      unitColAction: "Действие",
      unitEditTitle: "Изменить",
      unitFixedNoDelete: "Встроенную единицу нельзя удалить",
      unitRuleHint: "Единицу, используемую товарами, нельзя удалить. Встроенные единицы также нельзя удалить.",
      settingsTitle: "Настройки",
      secPrinter: "Настройки принтера",
      secScale: "Настройки весов",
      secReceipt: "Настройки чека",
      secPermissions: "Права",
      secUnits: "Единицы измерения",
      secRules: "Правила",
      secDeleted: "Удалённые счета",
      secSync: "Облачная синхронизация",
      secAudit: "Журнал действий",
      secGeneral: "Общие настройки",
      unsavedTitle: "Есть несохранённые изменения, продолжить?",
      unsavedHint: "При переключении раздела текущие изменения будут потеряны.",
      cancelBtn: "Отмена",
      continueBtn: "Продолжить",
      saveBarDirty: "Есть несохранённые изменения",
      saveBarClean: "Нет изменений",
      saveBtn: "Сохранить",
      noEditPerm: "У вас нет права изменять настройки.",
      saved: "Настройки сохранены.",
      backupSaveTitle: "Сохранить резервную копию",
      backupFilterName: "Резервная копия Biznes Hasap (.bhbak)",
      backupSaved: "Резервная копия .bhbak сохранена.",
      exportCancelled: "Экспорт отменён.",
      exportFailed: "Экспорт не удался.",
      importDone: "Импортировано записей: {count}. Обновите страницу.",
      importFailed: "Импорт не удался: принимается только .bhbak (или старый .json бэкап).",
      loading: "Загрузка настроек...",
      genDesc: "Язык, валюта и формат даты",
      genLanguage: "Язык",
      genDateFormat: "Формат даты и времени",
      genBaseCurrency: "Основная валюта",
      genBaseCurrencyHint: "Основную валюту системы нельзя изменить",
      genGoToCurrency: "Перейти к настройкам валюты",
      backupTitle: "Резервная копия",
      backupDesc: "Автоматическое резервное копирование данных",
      backupAuto: "Автоматическая резервная копия",
      backupAutoDesc: "Данные копируются с заданной периодичностью",
      backupFreq: "Периодичность",
      backupDaily: "Ежедневно",
      backupWeekly: "Еженедельно",
      backupFolder: "Папка резервных копий",
      dataTitle: "Данные",
      dataDesc: "Резервная копия .bhbak — открыть может только Biznes Hasap (не zip/json)",
      dataExport: "Экспорт данных",
      dataImport: "Импорт данных",
      aboutTitle: "О системе",
      aboutDesc: "Версия программы и информация о лицензии",
      aboutVersion: "Версия",
      aboutLicense: "Лицензия",
      aboutLicenseValue: "Biznes Hasap · Sanly",
      encTitle: "Шифрование базы данных",
      encDesc: "Данные шифруются паролем, полученным из лицензионного ключа",
      encEnabledNotice: "Шифрование включено. База данных хранится в зашифрованном виде; на устройстве без лицензии не откроется.",
      encWarn1: "После включения шифрования данные нельзя прочитать на устройстве без лицензии.",
      encWarn2: "Перед продолжением сделайте резервную копию (.bhbak).",
      encWarn3: "При облачной синхронизации данные на удалённом сервере остаются зашифрованными.",
      encWarn4: "Исходная (незашифрованная) база НЕ удаляется — шифрование можно отключить и вернуться в любой момент.",
      encMigrating: "Перенос... {done}/{total} баз данных",
      encDone: "Перенос завершён: скопировано и проверено записей: {count}. Исходные базы сохранены.",
      encFailed: "Не удалось перенести записей: {count} — шифрование НЕ включено. Данные не потеряны.",
      encDisabledNotice: "Шифрование отключено. После перезапуска будет использоваться прежняя (незашифрованная) база.",
      encRestart: "Перезапустить (чтобы изменение вступило в силу)",
      encEnable: "Зашифровать базу данных",
      encDisable: "Отключить шифрование",
      encConfirmEnableTitle: "Данные всех аккаунтов будут СКОПИРОВАНЫ в зашифрованную базу. Продолжить?",
      encConfirmEnableHint: "Исходная база не удаляется. Зашифрованные данные не открываются на устройстве без лицензии.",
      encConfirmDisableTitle: "Отключить шифрование?",
      encConfirmDisableHint: "После перезапуска будет использоваться прежняя (незашифрованная) база. Данные не потеряются.",
      firmTitle: "Сведения о фирме",
      firmDesc: "Название, код, заголовок, телефон, факс, адрес и ставка НДС",
      firmName: "Название фирмы",
      firmCode: "Код фирмы",
      firmTitleField: "Заголовок (название)",
      firmPhone: "Телефон",
      firmFax: "Факс",
      firmAddress: "Адрес",
      firmTax: "Ставка НДС (%)",
      opsTitle: "Правила операций",
      opsDesc: "Неактивные записи, цена закупки, срок кредита и даты",
      opsInactiveCustomer: "Использовать неактивного клиента в счёте/кассе",
      opsInactiveProduct: "Добавлять неактивный товар в корзину",
      opsBelowCost: "Продавать ниже цены закупки",
      creditMin: "Срок кредита (мин. дней)",
      creditMax: "Срок кредита (макс. дней)",
      creditDefault: "Срок кредита (по умолчанию, дней)",
      opStart: "Дата начала операций (пусто = открыто)",
      opEnd: "Дата окончания операций (пусто = открыто)",
      barcodeTitle: "Сканер штрихкодов",
      barcodeDesc: "Удалять символы prefix/suffix, добавляемые вашим сканером",
      barcodePrefix: "Prefix (начальные символы)",
      barcodeSuffix: "Suffix (конечные символы)",
      prKindStandard: "Обычный принтер",
      prKindReceipt: "Чековый принтер",
      prBtConnected: "Bluetooth-принтер подключён: {name}",
      prBtFailed: "Не удалось подключиться по Bluetooth: {error}",
      prBtScanDone: "Сканирование завершено — выберите принтер из списка.",
      prBtScanFailed: "Ошибка сканирования: {error}",
      prBtPicked: "Подключён: {name} — напечатайте пробную страницу.",
      prBtPickFailed: "Не удалось подключиться: {error}",
      prBtTestSent: "Пробный чек отправлен — проверьте принтер.",
      prBtNotConnected: "Принтер не подключён. Сначала подключите.",
      prDesktopOnly: "Принтеры можно увидеть только в настольной (Electron) программе.",
      prNone: "Принтеры не найдены. Добавьте принтер в Windows.",
      prTestDesktopOnly: "Пробная печать доступна только в настольной программе.",
      prTestSent: "Пробная печать отправлена — проверьте принтер.",
      prTestFailed: "Печать не удалась: {reason}",
      prUnknownError: "неизвестная ошибка",
      prStatusTitle: "Состояние принтера",
      prStatusDesc: "Найденные в системе принтеры и состояние подключения",
      statusConnected: "Подключён",
      statusDisconnected: "Не подключён",
      prRefresh: "Обновить список принтеров",
      prFound: "Найдено принтеров: {count}",
      prBrowserMode: "Режим браузера",
      prDefault: "По умолчанию",
      prSettingsDesc: "Основной принтер и формат печати",
      prBtName: "Bluetooth термопринтер",
      prBtSub: "Мобильный принтер 58/80мм (совместим с XPrinter)",
      btConnected: "Подключён",
      btNone: "Нет",
      btScanning: "Сканирование...",
      btScan: "Найти устройства",
      btDisconnect: "Отключить",
      btPickConnect: "Выбрать и подключить",
      btScanHint: "Поиск ближайших Bluetooth-устройств... включите принтер и переведите его в режим сопряжения.",
      btConnect: "Подключить ›",
      btPrinting: "Печать...",
      btTestPrint: "Напечатать пробный чек",
      btUsbHint: "USB-принтер: подключите OTG-кабелем и дайте разрешение в системном окне Android — чек всё равно печатается из этого приложения.",
      btWifiHint: "Сетевой (WiFi) принтер: будьте в той же сети и укажите IP в разделе Подключение → Сеть.",
      btClassicHint: "Старые (классические) Bluetooth-принтеры не отображаются в списке — нужен термопринтер с поддержкой BLE.",
      prDefaultPrinter: "Основной принтер",
      selectOption: "— Выбрать —",
      prKindLabel: "Тип принтера",
      prPaperWidth: "Ширина бумаги",
      prPaperWidthHint: "Для термопринтеров чеков",
      prConnection: "Тип подключения",
      prNetwork: "Сеть (IP)",
      prIp: "IP-адрес",
      prPort: "Порт",
      prTesting: "Печать...",
      prTest: "Пробная печать",
      scDesktopOnly: "Проверка весов доступна только в настольной программе.",
      scMobileNote: "В телефоне нет последовательного порта (COM). Bluetooth-весы будут добавлены в следующей версии — пока вводите вес вручную.",
      scStatusTitle: "Состояние весов",
      scStatusDesc: "Проверьте связь с устройством",
      scTesting: "Проверка...",
      scTest: "Тест",
      scTestHint: "Проверка мгновенного считывания веса",
      scSettingsDesc: "Порт, модель и единица измерения",
      scPort: "Порт подключения",
      scModel: "Модель / марка весов",
      scCustomModelNote: "Введите название марки для особого протокола (напр.: KELLER, RADWAG).",
      scUnit: "Единица измерения",
      scKg: "килограмм (kg)",
      scG: "грамм (g)",
      scAutoRead: "Автоматическое считывание веса",
      scAutoReadDesc: "Измеренный вес подхватывается автоматически на экранах Товар / Счёт",
      rcErrType: "Принимаются только изображения PNG или JPG.",
      rcErrSize: "Размер изображения не должен превышать 2 МБ.",
      rcTabThermal: "Термочек (80мм)",
      rcTabStandard: "Обычная печать (A4)",
      rcLogoTitle: "Логотип",
      rcLogoDesc: "Изображение, используемое в обоих форматах печати (PNG/JPG, макс. 2 МБ)",
      rcLogoUpload: "Загрузить логотип",
      rcRemove: "Убрать",
      rcLogoWidth: "Ширина логотипа (px; 0 = по умолчанию)",
      rcLogoCenter: "Центрировать логотип",
      rcCenter: "По центру",
      rcLeft: "Слева",
      rcCompanyTitle: "Сведения о фирме",
      rcCompanyDesc: "В обоих форматах печати берутся из одного источника",
      rcCompanyName: "Название фирмы",
      rcAddress: "Адрес",
      rcPhone: "Номер телефона",
      rcTaxId: "Налоговый номер / STIR",
      rcPreview: "Предпросмотр ({paper})",
      thShowLogo: "Показывать логотип",
      thShowAddress: "Показывать адрес",
      thShowPhone: "Показывать телефон",
      thShowTaxId: "Показывать налоговый номер",
      thShowQr: "Показывать QR-код",
      thShowBarcode: "Показывать штрихкод",
      thShowCashier: "Показывать имя кассира",
      thShowCustomer: "Показывать имя клиента",
      thFieldsTitle: "Отображаемые поля",
      thFieldsDesc: "Какая информация печатается на чеке",
      thPaperTitle: "Бумага и шрифт",
      thPaperDesc: "Ширина термоленты и размер шрифта",
      thFontSize: "Размер шрифта",
      thFontHint: "Можно увеличить для кассиров со слабым зрением.",
      fontSm: "Мелкий",
      fontMd: "Средний",
      fontLg: "Крупный",
      thQrTitle: "QR и действие печати",
      thQrDesc: "Содержимое QR, автопечать и число копий",
      thQrContent: "Содержимое QR-кода",
      qrInvoice: "Номер счёта (чек №)",
      qrWebsite: "Название фирмы / сайт",
      qrPayment: "Платёжная информация",
      thAutoPrint: "Автопечать",
      thAutoPrintDesc: "Печатать чек автоматически при завершении продажи (на экране Счёт).",
      thCopies: "Число копий (1–3)",
      thFooterNote: "Текст внизу чека",
      thFooterPh: "Спасибо, приходите ещё!",
      spOrientPortrait: "Книжная (Portrait)",
      spOrientLandscape: "Альбомная (Landscape)",
      spColBarcode: "Штрихкод / SKU",
      spColUnit: "Единица измерения",
      spColUnitPrice: "Цена за единицу",
      spColDiscount: "Скидка (%)",
      spColSubtotal: "Подытог",
      spColTax: "НДС",
      spInfoCurrency: "Валюта (TMT)",
      spInfoPayment: "Касса (способ оплаты)",
      spInfoCustomer: "Имя клиента",
      spInfoLedger: "Название книги",
      spLayoutTitle: "Макет страницы",
      spLayoutDesc: "Ориентация листа A4 и размер шрифта",
      spOrientation: "Ориентация бумаги",
      spItemsTitle: "Товары",
      spItemsDesc: "Как отображаются строки товаров",
      spShowImages: "Показывать товары с изображениями",
      spShowImagesDesc: "Если включено, в каждой строке товара печатается и его изображение.",
      spColumns: "Отображаемые столбцы",
      spInfo: "Отображаемая информация",
      spInfoHint: "Показывать ли на печати кассу, клиента, книгу и валюту.",
      spHeadFootTitle: "Верхний / нижний колонтитул",
      spHeadFootDesc: "Оформление верхней и нижней части",
      spHeader: "Верхний колонтитул",
      spHeaderDesc: "Показывать крупный логотип и сведения о фирме вверху.",
      spFooter: "Нижний колонтитул",
      spFooterDesc: "Показывать название фирмы и номер страницы внизу.",
      spSignature: "Место для подписи / печати",
      spSignatureDesc: "Поля подписи «Продавец» и «Покупатель» внизу.",
      spNotesTitle: "Примечания / Условия",
      spNotesDesc: "Дополнительный текст внизу печатной формы A4",
      spNotesPh: "Напр.: Товар принимается обратно в течение 14 дней. Условия оплаты...",
      permRoleExists: "Такая роль уже существует.",
      permProtectedDelete: "Встроенные роли нельзя удалить.",
      permRolesTitle: "Роли",
      permRolesDesc: "Шаблоны ролей используют ту же модель, что и модуль Пользователи — эти права предзаполняются при создании нового пользователя",
      permNewRolePh: "Название новой роли...",
      permAddRole: "Добавить роль",
      permDelete: "Удалить",
      permRolePerms: "Права модулей для роли «{role}»",
      permModulesNote: "Модулей: {count} · индивидуальные изменения в модуле Пользователи сохраняются",
      permAuditTitle: "Аудит",
      permAuditDesc: "Запись действий в системе",
      permAuditLabel: "Записывать все действия в этой системе",
      permAuditLabelDesc: "Если включено, действия пользователей записываются",
      auditCreate: "Создал",
      auditUpdate: "Изменил",
      auditDelete: "Удалил",
      auditView: "Просмотрел",
      auditReadFailed: "Не удалось прочитать журнал: {error}",
      auditExportTitle: "Экспорт журнала действий",
      auditSaved: "Журнал сохранён в файл .json.",
      auditExportFailed: "Экспорт не удался: {error}",
      auditDesc: "Кто, когда и какую запись изменил — последние 300 записей",
      auditDisabled: "Запись журнала отключена. Чтобы включить: Права → Журнал действий.",
      auditHealthError: "Ошибка записи в журнал ({count} раз): {error}",
      auditDocType: "Тип записи",
      auditUser: "Пользователь",
      auditAll: "Все",
      auditRefresh: "Обновить",
      auditExport: "Экспорт (.json)",
      auditColTime: "Время",
      auditColAction: "Действие",
      auditColType: "Тип",
      auditColEntry: "Запись",
      auditLoading: "Загрузка...",
      auditEmpty: "Журнал пуст — изменения ещё не записывались.",
      unitsDesc: "Единицы, выбираемые при добавлении товара. Встроенные удалить нельзя, можно добавлять свои.",
      unitColCode: "Код",
    },
    mobile: {
      customerSearchTitle: "Поиск клиента",
    },
    receipt: {
      receiptNo: "Чек №",
      cashier: "Кассир",
      colNo: "ЧЕК №:",
      colDate: "ДАТА:",
      colCashier: "КАССИР:",
      colCustomer: "КЛИЕНТ:",
      colItemsQty: "ТОВАР / КОЛ.",
      colTotal: "ИТОГО",
      subtotal: "ПОДЫТОГ:",
      discount: "СКИДКА:",
      paid: "ОПЛАЧЕНО:",
      paidTotal: "ИТОГО ОПЛАЧЕНО:",
      remainingDebt: "ОСТАТОК ДОЛГА:",
      creditTerm: "СРОК КРЕДИТА:",
      days: "дн.",
      dueDate: "СРОК ОПЛАТЫ:",
      paymentType: "СПОСОБ ОПЛАТЫ:",
      auth: "ПОДТВЕРЖДЕНИЕ (AUTH):",
      status: "СТАТУС:",
      approved: "ОДОБРЕНО (APPROVED)",
      waitingAgain: "Ждём вас снова!",
      invTitle: "СЧЁТ",
      invCode: "Номер счёта:",
      invNo: "Счёт:",
      invDate: "Дата:",
      invCustomer: "Клиент:",
      invCashier: "Кассир:",
      colProduct: "Товар",
      colBarcode: "Штрихкод",
      colQty: "Кол-во",
      colUnit: "Ед.",
      colUnitPrice: "Цена за ед.",
      colPrice: "Цена",
      colDiscount: "Скидка",
      colDiscountShort: "Скид.",
      colLineTotal: "Итого",
      taxLabel: "Налог (НДС):",
      taxShort: "Налог:",
      subtotalLabel: "Подытог:",
      discountLabel: "Скидка:",
      ledgerLabel: "Книга:",
      grandTotal: "Итого:",
      paidLabel: "Оплачено:",
      remainingLabel: "Остаток долга:",
      paymentLabel: "Способ оплаты:",
      paymentShort: "Оплата:",
      seller: "Продавец",
      buyer: "Покупатель",
      notesTerms: "Примечания / Условия:",
      pageOne: "Страница 1",
      authShort: "AUTH:",
      thermalDate: "ДАТА:",
      noShort: "Чек №:",
      totalCaps: "ИТОГО",
    },
    payment: {
      cash: "НАЛИЧНЫЕ",
      card: "БАНКОВСКАЯ КАРТА",
      credit: "КРЕДИТ",
      split: "СМЕШАННАЯ",
    },
    excel: {
      exportSuccess: "Экспортировано в Excel",
      exportedRows: "Экспортировано строк: {count}.",
      importModalTitle: "Импорт из Excel",
      exportModalTitle: "Экспорт в Excel",
      errorReportTitle: "Отчёт об ошибках импорта товаров",
      selectFile: "Выбрать файл Excel",
      downloadTemplate: "Скачать образец шаблона",
      readingFile: "Чтение файла...",
      importDone: "Импорт завершён",
      importAdded: "добавлено",
      importUpdated: "обновлено",
      importSkipped: "пропущено",
      failedSummary: "Записано {written} из {total} строк — ошибок: {failed}.",
      failedRows: "Не записанные строки:",
      errorReport: "Отчёт об ошибках",
      validRow: "Корректная строка",
      existing: "Существующий",
      errorRow: "Строка с ошибкой",
      existingProducts: "Для существующих товаров:",
      overwriteAll: "Обновить все",
      skipAll: "Пропустить все",
      selectFileHint: "Выберите файл Excel — строки появятся здесь.",
      closeBtn: "Закрыть",
      writing: "Запись...",
      importBtn: "Импорт ({count})",
      statusNew: "Новый",
      savedToDocuments: "Файл сохранён в папку Documents.",
      saveFailed: "Не удалось сохранить файл — попробуйте ещё раз.",
      selectAll: "Выбрать все",
      clearSelection: "Снять выбор",
      includeStock: "Включить остатки?",
      includeCost: "Включить закупочные цены?",
      exportBtn: "Экспорт в Excel ({count})",
      colName: "Название товара",
      colStatus: "Статус",
      errorReportTitleCustomers: "Отчёт об ошибках импорта клиентов",
      detailHeaderPhone: "Телефон",
      importModalTitleCustomers: "Импорт из Excel",
      exportModalTitleCustomers: "Экспорт в Excel",
      existingCustomers: "Для существующих клиентов (совпадает имя/телефон):",
      searchCustomers: "Поиск клиентов...",
      includeBalance: "Включить балансы долга/оплат?",
      customerNotFound: "Клиенты не найдены",
      fileTooLarge: "Файл слишком большой — максимум {maxMB} МБ.",
      tooManyRows: "Слишком много строк — максимум {maxRows} строк.",
      xlsNotSupported: "Старый формат .xls не поддерживается. Сохраните файл в формате .xlsx.",
      xlsxOnly: "Допускаются только файлы .xlsx.",
      invalidFile: "Файл повреждён или пуст.",
      readFailed: "Не удалось прочитать файл.",
      mapColumns: "Сопоставить столбцы",
      mappingHint: "Сопоставьте столбцы Excel с полями. Можно изменить строку заголовков и пропустить ненужные поля.",
      headerRow: "Строка заголовков",
      requiredColumn: "(обязательно)",
      unmappedColumn: "Не сопоставлять / пропустить поле",
      sourceColumn: "Столбец {column} — {header}",
      emptyHeader: "Без заголовка",
      sampleCell: "Пример: {value}",
      mappingRequired: "Сопоставьте обязательные поля с разными столбцами и разрешите неоднозначные совпадения.",
      applyMapping: "Применить и показать предпросмотр",
      mappingAmbiguous: "Несколько совпадений — выберите источник",
    },
    products: {
      searchPlaceholder: "Поиск по названию или штрихкоду...",
      bulkEditTitle: "Массовое редактирование товаров",
      bulkEdit: "Массовое изменение",
      importExcelTitle: "Импорт из Excel",
      importExcel: "Импорт из Excel",
      exportExcelTitle: "Экспорт в Excel",
      exportExcel: "Экспорт в Excel",
      allCategoriesOption: "Все",
      newProduct: "Новый товар",
      colNameCategory: "Название / Категория",
      colBarcode: "Штрихкод",
      colPurchaseSale: "Закупка / Продажа",
      colStock: "Текущий остаток",
      colActions: "Действия",
      notFound: "Товары не найдены",
      clickToEdit: "Нажмите для редактирования",
      composedTooltip: "У этого товара есть состав",
      composedBadge: "Набор",
      negativeStockAllowed: "Отрицательный остаток разрешён",
      compositionEditTooltip: "Состав товара: просмотр/редактирование",
      compositionAddTooltip: "Добавить состав товара",
      editAction: "Изменить",
      deleteConfirm: "Удалить этот товар?",
      noBtn: "Отмена",
      editTitle: "Редактировать товар",
      addTitle: "Добавить товар",
      imageChangeTitle: "Нажмите, чтобы изменить изображение",
      compressing: "Сжатие…",
      changeBtn: "Изменить",
      imageOptional: "Изображение (необязательно)",
      nameLabel: "Название товара *",
      namePlaceholder: "Напр.: Coca Cola 1L",
      categoryLabel: "Категория",
      categoryPlaceholder: "Напр.: Напитки",
      barcodeLabel: "Основной штрихкод *",
      unit1Label: "Ед. измерения 1",
      priceLabel: "Цена продажи (розница) *",
      unit2Enable: "Включить ед. измерения 2",
      unit2Label: "Ед. измерения 2",
      unit2QtyLabel: "1 {unit2} — сколько {unit1}",
      unit2Example: "Напр.: 1 {unit2} = {qty} {unit1}",
      purchasePriceLabel: "Закупочная цена (себестоимость)",
      wholesalePriceLabel: "Оптовая цена",
      stockLabel: "Текущий остаток",
      negativeStockTooltip: "Если включено, продажа возможна и без остатка — остаток уйдёт в минус",
      negativeAllowedShort: "можно в минус",
      inactiveTooltip: "Неактивный товар нельзя добавить в корзину (зависит от настроек)",
      activeBtn: "Активный",
      inactiveBtn: "Неактивный",
      inactiveNote: "Неактивный товар нельзя добавить в накладную/корзину (зависит от настроек).",
      compositionOpenTooltip: "Открыть/изменить состав",
      compositionBtn: "Состав",
      criticalStockLabel: "Предупреждение о критическом остатке",
      expiryLabel: "Срок годности",
      extraBarcodesLabel: "Доп. штрихкоды (несколько / штрихкод короба)",
      extraBarcodePlaceholder: "Второй или третий штрихкод...",
      addShort: "Добавить",
      cancelBtn: "Отмена",
      saveBtn: "Сохранить",
      unitNameRequired: "Введите название.",
      unitExists: "Такая единица уже существует.",
      customUnitPlaceholder: "Напр.: РУЛОН",
      customUnitOption: "+ Добавить свою единицу",
      unitAddedHint: "Новая единица добавляется в список и выбирается",
      bulkModalTitle: "Массовое изменение — Товары",
      changesReady: "изменений готово",
      bulkSearchPlaceholder: "Название / штрихкод / SKU...",
      bulkAllCategories: "Все категории",
      colName: "Название",
      colPurchase: "Закупка",
      colSale: "Продажа",
      stockShort: "Остаток",
      colCritical: "Критич.",
      errorRowsHint: "(пустое название / отрицательная цена)",
      priceRule: "Цены не могут быть отрицательными",
      saveCount: "Сохранить ({count})",
      compSaved: "Сохранено.",
      compositionTitle: "Состав товара — {name}",
      compositionSearchPlaceholder: "Поиск товара для добавления в состав...",
      selectProduct: "Выберите товар",
      stockAmount: "Количество на складе",
      stockPrefix: "Скл:",
      purchaseShort: "закупка",
      saleShort: "продажа",
      components: "Составляющие",
      noComponents: "Компоненты пока не выбраны.",
      stockInsufficient: "Недостаточно на складе",
      unitShort: "ед.",
      totalShort: "итого",
      removeTooltip: "Удалить",
      totalPurchase: "Итого закупка",
      totalSale: "Итого продажа",
      profit: "Прибыль (маржа)",
      mainPriceLabel: "Цена продажи основного товара",
      useSuggestedTooltip: "Использовать итоговую цену продажи",
      useSuggested: "Использовать рекомендованную",
    },
    customers: {
      filterAllCount: "Все ({count})",
      filterCustomersCount: "Клиенты ({count})",
      filterEmployeesCount: "Сотрудники ({count})",
      filterAll: "Все",
      filterCustomers: "Клиенты",
      filterEmployees: "Сотрудники",
      searchPlaceholder: "Поиск по имени или телефону...",
      bulkEditTitle: "Массовое изменение клиентов",
      bulkEdit: "Массовое изменение",
      importExcelTitle: "Импорт из Excel",
      importExcel: "Импорт из Excel",
      exportExcelTitle: "Экспорт в Excel",
      exportExcel: "Экспорт в Excel",
      addCustomer: "Добавить клиента / сотрудника",
      newCardTitle: "Новая карточка клиента",
      colNamePhone: "Имя / Телефон",
      colType: "Тип",
      colKind: "Тип",
      colDueDate: "Срок",
      colBalance: "Баланс",
      colActions: "Действия",
      notFound: "Зарегистрированные клиенты/сотрудники не найдены.",
      doubleClickHint: "Дважды щёлкните для просмотра деталей",
      typeEmployee: "Сотрудник",
      typeCustomer: "Клиент",
      typeSupplier: "Поставщик",
      editAction: "Редактировать",
      generalCustomerNoDelete: "Общий клиент — системная запись, удалить нельзя",
      roleEmployee: "Сотрудник / Персонал",
      roleCustomer: "Клиент / Покупатель",
      phoneLabel: "Телефон",
      balanceLabel: "Баланс счёта",
      dueDateLabel: "Срок (отсрочка)",
      creditLimitLabel: "Лимит долга",
      unlimited: "Без лимита",
      addressLabel: "Адрес / Примечания",
      ledgerTitle: "Накладные и история долга/оплат",
      txCountSuffix: "операций",
      noTransactions: "Для этого клиента не найдено накладных или операций по долгу/оплате.",
      colDate: "Дата",
      colInvoiceCode: "Код накладной",
      colReason: "Операция / Причина",
      colDebit: "Долг (+)",
      colCredit: "Оплата (-)",
      closeBtn: "Закрыть",
      receiptTooltip: "Нажмите, чтобы посмотреть чек",
      reasonSalesInvoice: "Расходная накладная ({count} поз.)",
      reasonInvoiceOp: "Операция по накладной",
      reasonCreditSale: "Накладная продажи в долг (покупка товара)",
      reasonCashPayment: "Оплата долга наличными (касса)",
      reasonWholesale: "Оптовая накладная (в долг)",
      reasonBankTransfer: "Оплата картой / переводом",
      reasonOpening: "Начальный баланс счёта",
      editTitle: "Редактировать — {name}",
      nameLabel: "ФИО / Название компании *",
      namePlaceholder: "Напр.: Иван Иванов",
      nameReadOnlyTitle: "Общий клиент — системная запись, имя нельзя изменить",
      phoneLabelForm: "Номер телефона",
      typeLabel: "Тип контрагента",
      typeCustomerOption: "Клиент (покупатель)",
      typeEmployeeOption: "Сотрудник (работник)",
      dueDateLabelForm: "Дни отсрочки (срок оплаты)",
      creditLimitLabelForm: "Лимит долга (максимум)",
      addressLabelForm: "Адрес / Примечания",
      addressPlaceholder: "Адрес или описание...",
      balanceAutoTitle: "Рассчитывается автоматически по накладным/кассе — нельзя изменить вручную",
      balanceAutoNote: "Рассчитывается автоматически по накладным/кассе — нельзя изменить вручную.",
      activeLabel: "Активен (используется)",
      cashBlockedLabel: "Продажа за наличные запрещена",
      cashBlockedHint: "Продажа за наличные запрещена — этому клиенту продажа только по карте/в долг.",
      saveCreateBtn: "Сохранить",
      bulkModalTitle: "Массовое изменение — Клиенты",
      changesReady: "изменений готово",
      bulkSearchPlaceholder: "Имя или телефон...",
      allTypes: "Все типы",
      colFullName: "ФИО",
      colPhone: "Телефон",
      colAddressNote: "Адрес / Примечание",
      systemNameReadOnly: "Системная запись — имя нельзя изменить",
      errorEmptyName: "Строк с ошибкой: {count} (пустое имя)",
      balanceLegend: "Баланс: (+) нам должны · (−) мы должны",
      saveCount: "Сохранить ({count})",
    },
    users: {
      errUsernameRequired: "Имя пользователя обязательно.",
      errUsernameTaken: "Это имя пользователя уже занято.",
      errPasswordMismatch: "Пароли не совпадают.",
      errCategoryRequired: "Выберите хотя бы одну категорию.",
      errInvoiceTypeRequired: "Выберите хотя бы один тип счёта.",
      searchPlaceholder: "Поиск по имени или роли...",
      allRoles: "Все роли",
      newUser: "Новый пользователь",
      colUsername: "Имя пользователя",
      colRole: "Роль",
      colStatus: "Статус",
      colLastLogin: "Последний вход",
      colActions: "Действия",
      emptyNoUsers: "Нет пользователей. Создайте нового пользователя.",
      emptyNotFound: "Пользователи не найдены",
      active: "Активен",
      passive: "Неактивен",
      protectedTip: "Администратора нельзя изменить или удалить",
      protectedBadge: "Защищён",
      editTip: "Изменить",
      resetPasswordTip: "Сбросить пароль",
      deleteTip: "Удалить",
      deleteMsg: "Удалить этого пользователя?",
      newPassword: "Новый пароль",
      confirmPassword: "Подтвердите пароль",
      actView: "Просмотр",
      actCreate: "Добавить",
      actEdit: "Изменить",
      actDelete: "Удалить",
      actReport: "Отчёт",
      colModule: "Модуль",
      editTitle: "Изменить пользователя",
      roleLabel: "Роль (можно ввести вручную)",
      customRoleHint: "Новая роль — права задаёте самостоятельно",
      passwordEditLabel: "Пароль (оставьте пустым — без изменений)",
      passwordNewLabel: "Пароль (необязательно)",
      permissionsTitle: "Права",
      finePermsTitle: "Детальные права кассы и счетов",
      kassaSection: "Касса",
      addIncome: "Добавить приход",
      addExpense: "Добавить расход",
      showBalance: "Показывать баланс кассы",
      allowedCategories: "Разрешённые категории",
      selectAll: "Выбрать все",
      clearAll: "Снять все",
      fakturaSection: "Счёт",
      editPrice: "Изменить цену",
      allowDiscount: "Разрешить скидку",
      allowedInvoiceTypes: "Разрешённые типы счетов",
      modeAll: "Разрешить все",
      modeWhitelist: "Только выбранные",
      modeBlacklist: "Все, кроме выбранных",
      removeTip: "Убрать",
      selectedCount: "Выбрано: {count}",
      noneSelected: "Пока не выбрано",
      notFound: "Не найдено",
      searchIn: "{label} — поиск...",
      advTitle: "Расширенные права (значения по умолчанию и доступ)",
      defaultsSection: "Значения по умолчанию",
      defInvoiceType: "Тип счёта по умолчанию",
      defPaymentType: "Способ оплаты по умолчанию",
      defUnit: "Единица по умолчанию (основная)",
      defUnit2: "Вторая единица по умолчанию (упак./короб)",
      defCustomer: "Клиент по умолчанию",
      noOneGeneral: "Никто (общий клиент)",
      defWarehouse: "Склад по умолчанию",
      defLedger: "Журнал по умолчанию",
      accessSection: "Контроль доступа",
      payTypesTitle: "Какие способы оплаты можно создавать?",
      phPayment: "Способ оплаты",
      phCustomer: "Клиент",
      phProduct: "Товар",
      phWarehouse: "Склад",
      phLedger: "Журнал",
      customerPerms: "Права на клиентов",
      productPerms: "Права на товары",
      warehousePerms: "Права на склады",
      invoiceWarehouses: "Склады, разрешённые для счетов (если отличаются от общего права на склады)",
      ledgerPerms: "Права на журналы",
    },
    errors: {
      documentValidation: "Запись не прошла проверку. Неверные или отсутствующие поля: {fields}",
      invalidBatchSize: "Размер пакета должен быть положительным целым числом.",
      generic: "Произошла непредвиденная ошибка.",
      network: "Ошибка сети — проверьте подключение.",
      boundaryTitle: "Что-то пошло не так",
      boundaryRestart: "Перезапустить",
    },
    license: {
      title: "Управление лицензией",
      account: "Аккаунт:",
      attention: "Внимание:",
      needLicense: "Для этого действия требуется лицензия: {route}",
      needKeyInfo: "Вам нужно получить лицензионный ключ. Продажи, закупки, склад и все операции привязаны к лицензии.",
      daysLeft: "(осталось {days} дн.)",
      days: "{days} дн.",
      accountId: "ID аккаунта",
      loading: "Загрузка...",
      copy: "Копировать",
      requestCode: "Код запроса (отправьте нам)",
      requestCodeHint: "Отправьте этот код через WhatsApp/Telegram. Вам выдадут корневой код и лицензионный ключ.",
      rootCode: "Корневой код",
      rootCodeFirstSetup: "(первая установка)",
      rootCodePlaceholder: "Вставьте корневой код сюда",
      rootCodeHint: "107 символов. Выдаётся клиенту один раз; при последующих продлениях не нужен.",
      rootCodeReenter: "Есть корневой код / ввожу заново",
      licenseKey: "Лицензионный ключ",
      licenseKeyPlaceholder: "Вставьте лицензионный ключ сюда",
      licenseKeyHint: "160 символов (может прийти группами по 6)",
      activating: "Активация...",
      activate: "Активировать",
      activeLicense: "Активная лицензия",
      expiry: "Истекает:",
      remaining: "Осталось:",
      features: "Возможности:",
      maxRegisters: "Макс. число касс:",
      loadFailed: "Не удалось загрузить сведения о лицензии: {error}",
      nothingToCopy: "Нечего копировать",
      copied: "{label} скопировано",
      copyFailed: "Копирование не удалось — можно выделить текст вручную",
      rootInvalid: "Неверный корневой код ({status})",
      activated: "Лицензия активирована!",
      activationError: "Ошибка активации: {error}",
      errorFallback: "Ошибка: {status}",
      statusActive: "Лицензия активна",
      statusInvalidKey: "Недействительный лицензионный ключ",
      statusExpired: "Срок лицензии истёк",
      statusOtherDevice: "Этот ключ принадлежит другому устройству (требуется rebind)",
      statusClockReset: "Часы устройства переведены назад (требуется clock-reset)",
      statusUsed: "Этот ключ уже использован",
      statusNotActivated: "Активация ещё не выполнена",
      statusInvalidInput: "Недопустимый ввод",
      statusKeyInvalid: "Ключ недействителен",
      statusOtherAccount: "Ключ принадлежит другому аккаунту",
      statusStorage: "Ошибка хранилища",
      statusRootRequired: "Сначала требуется корневой код",
      statusFileCorrupt: "Файл лицензии повреждён",
    },
    targowy: {
      targows: "Торговые агенты",
      addTargow: "Добавить агента",
      noTargow: "Нет агентов",
      notFound: "Агенты не найдены",
      view: "Просмотр",
      todayOrders: "Заказы сегодня",
      monthResult: "Итог за месяц",
      last7Days: "Последние 7 дней",
      last14Days: "Последние 14 дней",
      noRegionAssigned: "Район не назначен",
      todayTotalSales: "Продажи сегодня",
      todayOrderCount: "Заказов сегодня",
      activeTargows: "Активные агенты",
      bestToday: "Лучший агент (сегодня)",
      noOrdersToday: "Сегодня заказов нет",
      today: "Сегодня",
      thisWeek: "На этой неделе",
      thisMonth: "В этом месяце",
      commission: "комиссия",
      ordersUnit: "заказов",
      monthlyTarget: "Месячный план",
      noOrders: "Нет заказов",
      allRegions: "Все районы",
      allStatuses: "Все статусы",
      fullNameRequired: "ФИО обязательно.",
      phoneRequired: "Номер телефона обязателен.",
      targowExists: "Такой агент уже существует.",
      optional: "необязательно",
      noRegionsHint: "Нет районов. Добавьте в разделе «Районы».",
      deleteConfirm: "Удалить агента «{name}»?",
      deleteHasOrders: "У этого агента {count} заказов. Рекомендуется деактивировать вместо удаления.",
      tabRegions: "Районы",
      tabRating: "Рейтинг",
      regionExists: "Такой район уже существует.",
      newRegionPh: "Название нового района",
      addRegion: "Добавить район",
      noRegions: "Нет районов",
      activeLabel: "Активен",
      inactiveLabel: "Неактивен",
      editTitle: "Редактировать курьера",
      newTitle: "Новый курьер",
      fullNameLabel: "ФИО *",
      colRank: "Место",
      colName: "Имя",
      colOrderCount: "Кол-во заказов",
      colTotalAmount: "Общая сумма",
      avgOrder: "Средний заказ",
      colNewCustomer: "Новые клиенты",
      colTrend: "Тренд",
      colCustomer: "Клиент",
      periodAll: "За всё время",
      critAmount: "Больше всего TMT",
      critOrders: "Больше всего заказов",
      critNewCustomers: "Больше всего новых клиентов",
    },
    walyuta: {
      baseCurrency: "Базовая валюта",
      baseCurrencyHint: "используется в ценах, счетах и отчётах",
      fixed: "Фиксированная",
      change: "Изменить",
      confirmBaseTitle: "Сделать {code} базовой валютой?",
      confirmBaseMsg: "Единица в ценах, счетах и отчётах изменится на {code}. Сохранённые суммы не изменятся, расчёты сохранятся.",
      prevBase: "Предыдущая базовая валюта",
      deleteConfirm: "Удалить валюту {code}?",
      deleteBaseBlocked: "Это базовая валюта — сначала назначьте базовой другую валюту, затем удалите.",
      deleteInUse: "Эта валюта используется, удалить нельзя.",
      codeRequired: "Введите код валюты.",
      tmtIsBase: "TMT — базовая валюта, её нельзя добавить отдельно.",
      codeExists: "Такой код валюты уже существует.",
      nameRequired: "Введите название валюты.",
      ratePositive: "Курс {code} должен быть больше 0.",
      customCodeLabel: "Код валюты (вручную)",
      colSymbol: "Символ",
      colRate: "Курс (1 ед. = ? {code})",
      colUpdated: "Обновлено",
      emptyCurrencies: "Нет валют. Добавьте новую валюту.",
      baseBadge: "Базовая",
      updateRate: "Обновить курс",
      setBase: "Сделать базовой",
      baseCannotDelete: "Базовую валюту нельзя удалить",
      deleteLabel: "Удалить",
      baseSetNotice: "Базовая валюта: {code}",
      baseSetFailed: "Не удалось изменить базовую валюту.",
      addOtherFirst: "Сначала добавьте другую валюту.",
      addedCurrencies: "Добавленные валюты",
      editTitle: "Редактировать валюту",
      newTitle: "Новая валюта",
    },
    faktura: {
      selectTargow: "Выберите агента.",
      selectCustomer: "Выберите клиента.",
      selectRegion: "Выберите район.",
      addOneProduct: "Добавьте хотя бы один товар.",
      draftNoEffect: "Не влияет ни на один модуль до подтверждения в офисе",
      productSearchPh: "Название товара или штрихкод...",
      noProductsAdded: "Товары не добавлены",
      filterSearchPh: "Клиент или номер счёта...",
      recordsShown: "записей показано",
      soundOn: "Звук уведомлений включён — нажмите, чтобы выключить",
      soundOff: "Звук уведомлений выключен — нажмите, чтобы включить",
      rejectTitle: "Отклонить черновик",
      rejectHint: "Отклонённый черновик не влияет ни на один модуль, но остаётся в истории.",
      rejectReasonLabel: "Причина отказа (необязательно)",
      noDrafts: "Нет черновиков счетов",
      openInInvoice: "Открыть на экране счетов",
      openLabel: "Открыть",
      createTitle: "Создать черновик счёта",
      noteLabel: "Примечание",
      cancelBtn: "Отмена",
      saveDraft: "Сохранить как черновик",
      targowLabel: "Курьер *",
      customerLabel: "Клиент *",
      regionLabel: "Район *",
      selectOption: "— Выбрать —",
      paymentLabel: "Способ оплаты",
      currencyLabel: "Валюта",
      payCash: "Наличные",
      payCard: "Карта",
      payCredit: "В долг (кредит)",
      addProductLabel: "Добавить товар",
      colProduct: "Товар",
      colPrice: "Цена",
      colQty: "Кол-во",
      colTotal: "Итого",
      statusPending: "Ожидает",
      statusAccepted: "Принят",
      statusRejected: "Отклонён",
      filterAll: "Все",
      filterByUser: "По пользователю",
      filterByTargow: "По курьеру",
      filterByRegion: "По району",
      dateStartTip: "Начальная дата",
      dateEndTip: "Конечная дата",
      clearFilters: "Очистить",
      colDate: "Дата / Время",
      colSender: "Отправитель",
      colCustomer: "Клиент",
      colRegion: "Район",
      colStatus: "Статус",
      colAction: "Действие",
      acceptTip: "Принять",
      rejectTip: "Отклонить",
    },
    depder: {
      noDescription: "Нет описания",
      currentBalance: "Текущий баланс",
      usersUnit: "пользователей",
      deleteConfirm: "Удалить книгу «{name}»?",
      deleteHasTx: "В этой книге есть операции. Рекомендуется деактивировать вместо удаления — история сохранится.",
      back: "Назад",
      txUnit: "операций",
      nameRequired: "Название книги обязательно.",
      nameExists: "Такое название книги уже существует.",
      openingBalanceNaN: "Начальный баланс должен быть числом.",
      namePh: "Напр.: Главная касса",
      descPh: "Краткое описание...",
      grandTotal: "Общий итог (TMT)",
      ledgersUnit: "книг",
      transferBtn: "Перевод между книгами",
      newLedger: "Новая книга",
      noLedgers: "Нет книг",
      noLedgersHint: "Создайте новую книгу, чтобы вести кассы раздельно.",
      selectLedgers: "Выберите книги.",
      sameLedger: "Нельзя перевести в ту же книгу.",
      amountPositive: "Сумма должна быть больше 0.",
      transferDescPh: "Напр.: перевод в конце дня",
      transferTitle: "Перевод между книгами",
      fromLedger: "Из какой книги",
      toLedger: "В какую книгу",
      amountLabel: "Сумма",
      dateLabel: "Дата",
      rateNote: "по курсу:",
      descLabel: "Описание",
      cancelBtn: "Отмена",
      transferSubmit: "Выполнить перевод",
      editTitle: "Редактировать книгу",
      newTitle: "Новая книга",
      nameLabel: "Название *",
      currencyLabel: "Валюта",
      openingLabel: "Начальный остаток",
      descFieldLabel: "Описание",
      activeLabel: "Активна",
      inactiveLabel: "Неактивна",
      permsTitle: "Права — кто может работать с этой книгой",
      saveBtn: "Сохранить",
      userSelectPh: "Выберите пользователя...",
      userAdd: "Добавить пользователя",
      userCol: "Пользователь",
      noUsersNote: "Пользователи не добавлены. Администраторы автоматически имеют все права.",
      allPerms: "Все права",
      removeTip: "Убрать",
      permEnter: "Может входить",
      permAddIncome: "Может добавлять приход",
      permAddExpense: "Может добавлять расход",
      permEdit: "Может редактировать",
      permDelete: "Может удалять",
      permViewReport: "Может смотреть отчёты",
    },
    warehouses: {
      searchPh: "Поиск по названию, коду или адресу склада...",
      newWarehouse: "Новый склад",
      colWarehouse: "Склад",
      colCode: "Код",
      colAddressTel: "Адрес / Тел.",
      colStatus: "Статус",
      colActions: "Действия",
      emptyNone: "Складов пока нет. Создайте новый.",
      emptyNotFound: "Склад не найден",
      itemsUnit: "товар",
      inactive: "Неактивен",
      active: "Активен",
      defaultBadge: "Основной",
      editTitle: "Изменить",
      deleteConfirm: "Удалить этот склад?",
      cancelNo: "Отмена",
      formEditTitle: "Изменить склад",
      formName: "Название склада",
      formPhone: "Телефон",
      formAddress: "Адрес",
      formNote: "Заметка",
      defaultWarehouse: "Основной склад",
      itemsInside: "Товары внутри",
      colProductName: "Название",
      colBarcode: "Штрих-код",
      colQty: "Количество",
      colUnit: "Ед. изм.",
      colPrice: "Цена",
      emptyWarehouse: "Этот склад пустой",
      close: "Закрыть",
    },
    modals: {
      importFailed: "Ошибка импорта: принимаются только .bhbak (или старый .json).",
      accountFileHint: " — выберите файл резервной копии .bhbak для этого аккаунта. Открыть его может только Biznes Hasap.",
      clickToPick: "Нажмите, чтобы выбрать файл",
      importedCount: "Импортировано записей: {count}.",
      importing: "Импорт...",
      shortcutsTitle: "Горячие клавиши",
      shortcutsHint: "Клавиши F выполняют действия напрямую.",
      shortcutsClose: "Закрыть",
      bhbakNote: ".bhbak — резервная копия Biznes Hasap",
    },
    promo: {
      modalTitle: "Система ПРОМО",
      modalSubtitle: "Продажа + промо-комплект, остаток и приход кассы · {code}",
      tabNew: "Новая акция",
      tabEdit: "Редактировать акцию",
      tabList: "Активные акции ({count})",
      tabStock: "Состояние остатков",
      stockEmpty: "В акциях пока не используется ни один товар",
      stockLabel: "Остаток:",
      noProducts: "В модуле Товары нет товаров. Сначала добавьте товар.",
      noSelection: "Товар пока не выбран",
      clearTip: "Снять выбор",
      saleProduct: "Покупаемый товар",
      pickProduct: "Выбрать товар",
      qtyLabel: "Кол-во",
      totalLabel: "Итого",
      promoProduct: "Промо-товар",
      pickPromoProduct: "Выбрать промо-товар",
      promoQty: "Промо кол-во",
      modeFree: "Бесплатно",
      modePercent: "Процент %",
      modeFixed: "Фиксированная цена",
      modePercentLabel: "Процент %{pct}",
      modeFixedLabel: "Фикс. {amount}",
      discountLabel: "Промо-скидка",
      saleLabel: "Продажа",
      promoLabel: "Промо",
      kassaIncome: "Приход кассы",
      discountWord: "скидка",
      insufficientStock: "Недостаточно на складе!",
      cancel: "Отмена",
      create: "Создать акцию",
      update: "Обновить",
      pickSaleTitle: "Выберите покупаемый товар",
      pickPromoTitle: "Выберите промо-товар",
      pickerSearchPh: "Поиск по названию / штрихкоду / SKU...",
      pickerAllCategories: "Все категории",
      pickerNotFound: "Товары не найдены",
      pickerCount: "Товаров: {count} · активная валюта: {code}",
      pickerClose: "Закрыть",
      listEmpty: "Нет активных акций",
      listEmptyHint: "Создайте в разделе \"Новая акция\".",
      editTip: "Редактировать",
      deleteTip: "Удалить",
    },
  }
};

export type TranslationDict = (typeof translations)['en'];

/** `{ad}` yer tutucularını params ile değiştirir. Eksik parametre görünür kalır (sessiz bozulma yok). */
export function interpolate(template: string, params: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : match
  );
}

function resolveKey(dict: unknown, path: string): string | undefined {
  let node: unknown = dict;
  for (const part of path.split('.')) {
    if (node === null || typeof node !== 'object' || !(part in node)) return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === 'string' ? node : undefined;
}

/**
 * Düz veya noktalı anahtar (`"save"`, `"conn.connect"`, `"errors.generic"`) → çeviri.
 * Aktif dilde anahtar yoksa anahtar seviyesinde en'e düşer; o da yoksa anahtarın
 * kendisi döner (görünür hata). `params` verilirse `{placeholder}` interpolasyonu yapılır.
 */
export function translate(
  language: LanguageCode,
  key: string,
  params?: Record<string, string | number>
): string {
  const raw =
    resolveKey(translations[language], key) ?? resolveKey(translations.en, key) ?? key;
  return params ? interpolate(raw, params) : raw;
}

