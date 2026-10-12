// License system type definitions

export type LicenseStatus =
  | 1   // OK - Lisans aktif
  | 0   // INVALID - Geçersiz lisans anahtarı
  | -1  // EXPIRED - Lisans süresi doldu
  | -2  // DEVICE_MISMATCH - Bu anahtar başka cihaza ait (rebind gerekli)
  | -3  // CLOCK_ROLLBACK - Cihaz saati geri alınmış (clock-reset gerekli)
  | -4  // REPLAYED - Bu anahtar zaten kullanılmış
  | -5  // NOT_ACTIVATED - Henüz aktivasyon yapılmamış
  | -6  // BAD_INPUT - Geçersiz giriş
  | -7  // KEY_EXPIRED - Anahtar geçersiz
  | -8  // ACCOUNT_MISMATCH - Anahtar farklı hesaba ait
  | -9  // STORAGE_ERROR - Depolama hatası
  | -10 // NEED_ROOT - Kök kod gerekli
  | -11; // STATE_TAMPERED - Lisans dosyası bozulmuş

export interface LicenseInfo {
  accountId: string;
  status: LicenseStatus;
  expiry?: number;          // Unix saniye
  daysLeft?: number;        // Kalan gün
  plan?: number;            // Plan kodu (1-4, 255)
  features?: number;        // Özellik bitleri
  maxRegisters?: number;    // Maksimum kasa sayısı
  graceUntil?: number;      // Grace period bitişi
  error?: string;           // Hata mesajı (varsa)
}

/** Lisans kapısı sonucu — ana süreçteki gate kontrolünden döner. */
export interface GateResult {
  allowed: boolean;
  status: number;
  reason: string;
  info: LicenseInfo | null;
  error?: string;
}

// Window.electronAPI extension
declare global {
  interface Window {
    electronAPI: {
      setCrashReportingConsent?(enabled: boolean): Promise<{ enabled: boolean; configured: boolean }>;
      // Window controls
      minimize(): void;
      maximize(): void;
      close(): void;
      enterFullscreen(): void;
      restoreCompact(): void;

      // Printer
      listPrinters(): Promise<Array<{
        name: string;
        displayName: string;
        isDefault: boolean;
        status: number;
      }>>;
      printTestPage(options: {
        deviceName?: string;
        paperWidth?: string;
        connection?: string;
        companyName?: string;
      }): Promise<{ success: boolean; failureReason?: string }>;

      // Scale
      getScaleStatus(): Promise<{ connected: boolean; message: string }>;

      // Print HTML
      printHtml(options: {
        html: string;
        deviceName?: string;
        paperWidth?: string;
        pageSize?: string;
        landscape?: boolean;
      }): Promise<{ success: boolean; failureReason?: string }>;

      // File operations
      saveFileAs(options: {
        title?: string;
        defaultName?: string;
        filters?: Array<{ name: string; extensions: string[] }>;
        data?: string;
      }): Promise<{ saved: boolean; canceled?: boolean; path?: string; error?: string }>;

      // License methods — hesap bazlı (spec v3 §4).
      // licenseId = giriş yapılan hesabın kalıcı Hesap ID'si.
      getLicenseInfo(licenseId?: string): Promise<LicenseInfo>;
      getLicenseRequestCode(licenseId?: string): Promise<string | null>;
      createLicenseId(): Promise<string | null>;
      setLicenseRoot(licenseId: string | undefined, code: string): Promise<number>;
      activateLicense(licenseId: string | undefined, key: string): Promise<number>;
      deriveLicenseKey(licenseId: string | undefined, purpose: string): Promise<number[] | null>;
      selectLicenseAccount(licenseId: string | undefined): Promise<boolean>;

      // Lisans kapısı — ana süreçte gate kontrolü yapılır (renderer'da native yok)
      guardLicense(moduleName: string, licenseId?: string): Promise<GateResult>;

      // Pano — Electron file:// context'inde navigator.clipboard çalışmaz
      copyToClipboard(text: string): Promise<boolean>;
    };
  }
}

export {};
