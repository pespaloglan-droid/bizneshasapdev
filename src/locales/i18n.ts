import { LanguageCode } from '../types';

export const translations: Record<LanguageCode, {
  windowTitle: string;
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
    windowTitle: "Test versiyon",
    otherAccounts: "Diğer hesaplar",
    addAccount: "Hesap ekle",
    userLabel: "Kullanıcı",
    passwordLabel: "Şifre",
    passwordPlaceholder: "Şifrenizi girin",
    loginButton: "Giriş",
    appName: "Biznes hesap",
    version: "v2.1.0 • 22 May 2025",
    delete: "Sil",
    edit: "Düzenle",
    import: "İçindekileri içeri aktar (Import et)",
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
      docsReceived: "belge alındı",
      docsSent: "belge gönderildi",
      liveContinues: "Canlı eşitleme devam ediyor",
      liveAfterTransfer: "Canlı eşitleme aktarım bitince başlayacak",
      mergeTitle: "Veriler birleştirilsin mi?",
      mergeLocalCount: "bu telefonda",
      mergeRemoteCount: "sunucuda kayıt var.",
      mergeKeep: "Birleştir",
      mergeKeepHint: "İki taraftaki kayıtlar tek veritabanında birleşir.",
      mergeServerOnly: "Yalnızca sunucu",
      mergeServerOnlyHint: "Telefondaki kayıtlar silinir, sunucudakiler alınır.",
    },
    confirmDeleteTitle: "Hesabı Sil",
    confirmDeleteMsg: "Bu hesabı ve ilişkili verileri silmek istediğinizden emin misiniz?",
    loginSuccess: "Giriş başarılı!",
    wrongPassword: "Hatalı şifre!",
    selectAccount: "Hesap Seçin",
    selectUser: "Kullanıcı Seçin",

    tabKassa: "Faktura",
    tabFatura: "Fatura",
    tabPara: "Kasa",
    tabMusteri: "Müşteri",
    tabUser: "Kullanıcı",
    tabHaryt: "Ürün",
    tabHesaplama: "Hesaplama",
    tabDoviz: "Döviz",
    
    tabDepder: "Defter",
    tabAmbar: "Ambar",
    tabKurye: "Targowy / Kurye",
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
    productNotFoundToast: "barkodlu ürün bulunamadı.",
    logoutTooltip: "Oturumu Kapat",
    internalNotePlaceholder: "Bellik yaz...",

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
    thanksMsg: "Bizi tercih ettiğiniz için teşekkür ederiz!"
  },
  tm: {
    windowTitle: "Test wersiýasy",
    otherAccounts: "Başga hasaplar",
    addAccount: "Hasap goş",
    userLabel: "Ulanyjy",
    passwordLabel: "Açar sözi",
    passwordPlaceholder: "Açar sözüňizi giriziň",
    loginButton: "Giriş",
    appName: "Biznes hasap",
    version: "v2.1.0 • 22 May 2025",
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
      sectionHint: "Saklamazdan öň baglantysy syna we sunucudaky maglumaty çek",
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
      statusOffline: "Çevrimdasty",
      denied: "Giriş reddedildi — ulanyjy/parola ýalňyş",
      connecting: "Baglanylyar…",
      firstWorking: "Işleýän ilkinji adres ulanylýar.",
      singleConnectionNote: "Bir wagtyň özünde bir baglanty açyk bolýar; beýlekisi awtomatik ýapylýar. Programma täzeden açylanda iň soňky ulanylan baglanty awtomatik başlaýar.",
      progressTransferring: "Geçirilýär…",
      progressDone: "Geçirme tamamlandy",
      docsReceived: "resmin aldy",
      docsSent: "resmin iberdi",
      liveContinues: "Janly deňeşme dowam edýär",
      liveAfterTransfer: "Janly deňeşme geçirme tamamlanandan soň başlar",
      mergeTitle: "Maglumatlar birleşdirilsinmi?",
      mergeLocalCount: "bu telefonda",
      mergeRemoteCount: "sunucuda resim bar.",
      mergeKeep: "Birleşdir",
      mergeKeepHint: "Iki tarapyň resimleri bir maglumat bazasy birleşýär.",
      mergeServerOnly: "Diňe sunucu",
      mergeServerOnlyHint: "Telefondaky resimler silinýär, sunucudakylar alynýar.",
    },
    confirmDeleteTitle: "Hasaby Poz",
    confirmDeleteMsg: "Bu hasaby we maglumatlary pozmak isleýändigiňize ynanýarsyňyzmy?",
    loginSuccess: "Giriş üstünlikli!",
    wrongPassword: "Ýalňyş açar sözi!",
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
    tabLisans: "Ygtyýarnama / Açary",
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
    productNotFoundToast: "barkodly haryt tapylmady.",
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
    thanksMsg: "Bizi saýlanyňyz üçin sag boluň!"
  },
  en: {
    windowTitle: "Test version",
    otherAccounts: "Other accounts",
    addAccount: "Add account",
    userLabel: "User",
    passwordLabel: "Password",
    passwordPlaceholder: "Enter your password",
    loginButton: "Login",
    appName: "Biznes hesap",
    version: "v2.1.0 • 22 May 2025",
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
      docsReceived: "documents received",
      docsSent: "documents sent",
      liveContinues: "Live sync continues",
      liveAfterTransfer: "Live sync starts when the transfer finishes",
      mergeTitle: "Merge data?",
      mergeLocalCount: "on this phone",
      mergeRemoteCount: "documents on the server.",
      mergeKeep: "Merge",
      mergeKeepHint: "Records from both sides are combined into one database.",
      mergeServerOnly: "Server only",
      mergeServerOnlyHint: "Phone records are deleted; server records are used.",
    },
    confirmDeleteTitle: "Delete Account",
    confirmDeleteMsg: "Are you sure you want to delete this account and its data?",
    loginSuccess: "Login successful!",
    wrongPassword: "Incorrect password!",
    selectAccount: "Select Account",
    selectUser: "Select User",

    tabKassa: "Faktura",
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
    productNotFoundToast: "product not found.",
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
    thanksMsg: "Thank you for your purchase!"
  },
  ru: {
    windowTitle: "Тестовая версия",
    otherAccounts: "Другие аккаунты",
    addAccount: "Добавить аккаунт",
    userLabel: "Пользователь",
    passwordLabel: "Пароль",
    passwordPlaceholder: "Введите пароль",
    loginButton: "Войти",
    appName: "Biznes hesap",
    version: "v2.1.0 • 22 May 2025",
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
      docsReceived: "документов получено",
      docsSent: "документов отправлено",
      liveContinues: "Синхронизация продолжается",
      liveAfterTransfer: "Синхронизация начнётся после завершения передачи",
      mergeTitle: "Объединить данные?",
      mergeLocalCount: "на этом телефоне",
      mergeRemoteCount: "записей на сервере.",
      mergeKeep: "Объединить",
      mergeKeepHint: "Записи с обеих сторон объединяются в одну базу.",
      mergeServerOnly: "Только сервер",
      mergeServerOnlyHint: "Записи на телефоне удаляются, используются данные сервера.",
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
    productNotFoundToast: "товар со штрихкодом не найден.",
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
    thanksMsg: "Спасибо за покупку!"
  }
};


