// gateMiddleware.ts — Lisans kapısı UI/navigasyon koruması
import type { LicenseInfo, GateResult } from '../types/license';
import { getMobileLicenseInfo } from './licenseMobile';

// Route → gerekli modül eşleşmesi
export const ROUTE_GUARDS = {  // Satış/Fatura
  'checkout': 'SATIS',
  'invoice': 'SATIS',
  'faktura': 'SATIS',
  
  // Stok
  'warehouse': 'STOK',
  'stock': 'STOK',
  'product': 'STOK',
  
  // Kasa/Para
  'money': 'KASA',
  'register': 'KASA',
  'kassa': 'KASA',
  
  // Müşteri/Cari
  'customer': 'MUSTERI',
  'musteri': 'MUSTERI',
  
  // Tedarikçi
  'supplier': 'TEDARIKCI',
  
  // Raporlar
  'report': 'RAPOR',
  'reports': 'RAPOR',
  'hasaplama': 'RAPOR',
  
  // Fiyat
  'price': 'FIYAT',
  'pricing': 'FIYAT',

  // Para Birimi Yönetimi — PosWorkspace 'currency' sekmesi buraya eşlenir
  'currency': 'FIYAT',

  // Muhasebe Defteri — PosWorkspace 'ledger' sekmesi buraya eşlenir
  'ledger': 'RAPOR',
  
  // Ayarlar
  'settings': 'AYARLAR',
  'sazlamalar': 'AYARLAR',
  
  // Yedekleme
  'backup': 'YEDEK',
  
  // Kullanıcı yönetimi
  'user': 'KULLANICI',
  'users': 'KULLANICI',
  'ulanyjy': 'KULLANICI'
} as const;

export type RouteName = keyof typeof ROUTE_GUARDS;
export type ModuleName = typeof ROUTE_GUARDS[RouteName];

export type { GateResult };

/**
 * Modül → lisans features bit'i (license-native/gate.js FEATURE_FOR ile aynı).
 * Yalnızca bu tablodaki modüller feature bit'i ister; diğerleri OK yeterlidir.
 */
const MODULE_FEATURE_BIT: Partial<Record<ModuleName, number>> = {
  STOK: 1 << 1,  // FEAT_STOCK
  RAPOR: 1 << 2, // FEAT_ADV_REPORTS
  KASA: 1 << 0,  // FEAT_MULTI_REGISTER (çoklu kasa için)
};

/**
 * Giriş yapılan hesabın lisans Hesap ID'si. Lisans ekranında gösterilen ve
 * admin'e gönderilen kod bu hesaba aittir (spec v3 §6).
 */
let currentLicenseId: string | undefined = undefined;

export function setLicenseId(licenseId: string | undefined) {
  currentLicenseId = licenseId;
}

export function getLicenseId(): string | undefined {
  return currentLicenseId;
}

/**
 * Bir route için lisans kontrolü yapar.
 *
 * NOT: Renderer native modülü (.node) yükleyemez — bu yüzden gate kontrolü
 * ana süreçte (`license-guard` IPC) yapılır. Böylece hem giriş anındaki kontrol
 * hem de çalışma sırasındaki sekme değişimleri AYNI kaynaktan beslenir;
 * "girişte lisans açıldı ama sekmede tekrar key istiyor" tutarsızlığı oluşmaz.
 */
export async function checkRouteAccess(routeName: string): Promise<GateResult> {
  const moduleName = ROUTE_GUARDS[routeName as RouteName];

  // Lisans gerektirmeyen rotalar (lisans ekranı, hakkında vs.)
  if (!moduleName) {
    return {
      allowed: true,
      status: 1,
      reason: 'NO_LICENSE_REQUIRED',
      info: null
    };
  }

  // Electron dışında (APK/WebView) mobil lisans kontrolü — artık kör izin YOK.
  if (typeof window === 'undefined' || !window.electronAPI?.guardLicense) {
    return checkMobileRouteAccess(moduleName);
  }

  try {
    const result = await window.electronAPI.guardLicense(moduleName, currentLicenseId);
    return {
      allowed: result.allowed,
      status: result.status,
      reason: result.reason,
      info: result.info ?? null
    };
  } catch {
    return {
      allowed: false,
      status: -9,
      reason: 'STORAGE_ERROR',
      info: null
    };
  }
}

/**
 * APK/WebView kapı kontrolü — license-native/gate.js guard() mantığının mobil portu.
 * Fail-closed: lisanssız / süresi dolmuş / feature bit'i yoksa İZİN VERMEZ.
 */
async function checkMobileRouteAccess(moduleName: ModuleName): Promise<GateResult> {
  if (!currentLicenseId) {
    return { allowed: false, status: -5, reason: 'NO_ACCOUNT', info: null };
  }

  let info: LicenseInfo;
  try {
    info = await getMobileLicenseInfo(currentLicenseId);
  } catch {
    return { allowed: false, status: -9, reason: 'STORAGE_ERROR', info: null };
  }

  const now = Math.floor(Date.now() / 1000);

  if (info.status === -1 || (info.graceUntil !== undefined && now > info.graceUntil)) {
    return { allowed: false, status: -1, reason: 'EXPIRED', info };
  }

  if (info.status !== 1) {
    return { allowed: false, status: info.status, reason: 'NO_LICENSE', info };
  }

  const featureBit = MODULE_FEATURE_BIT[moduleName];
  if (featureBit && !((info.features ?? 0) & featureBit)) {
    return { allowed: false, status: 0, reason: 'FEATURE_LOCKED', info };
  }

  return { allowed: true, status: 1, reason: 'OK', info };
}

// Electron renderer için navigasyon koruması
export async function guardNavigation(
  routeName: string,
  onBlocked?: (reason: string, info: LicenseInfo | null) => void
): Promise<boolean> {
  const result = await checkRouteAccess(routeName);

  if (!result.allowed && onBlocked) {
    onBlocked(result.reason, result.info);
  }

  return result.allowed;
}

// Hata mesajları (Türkçe)
export const LICENSE_ERRORS: Record<string, string> = {
  'NO_ACCOUNT': 'Hesap seçilmedi',
  'EXPIRED': 'Lisans süresi doldu',
  'NO_LICENSE': 'Lisans bulunamadı',
  'FEATURE_LOCKED': 'Bu özellik lisansınızda yok',
  'GATE_UNAVAILABLE': 'Lisans kontrolü kullanılamıyor',
  'STORAGE_ERROR': 'Depolama hatası',
  'INVALID_MODULE': 'Geçersiz modül'
};

export function getLicenseErrorMessage(reason: string): string {
  return LICENSE_ERRORS[reason] || 'Lisans hatası: ' + reason;
}
