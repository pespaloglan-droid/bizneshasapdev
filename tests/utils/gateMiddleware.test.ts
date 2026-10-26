import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ROUTE_GUARDS,
  checkRouteAccess,
  guardNavigation,
  setLicenseId,
  getLicenseId,
  getLicenseErrorMessage,
  LICENSE_ERRORS,
} from '../../src/utils/gateMiddleware';

const guardLicense = vi.fn();

beforeEach(() => {
  guardLicense.mockReset();
  (window as any).electronAPI.guardLicense = guardLicense;
  setLicenseId('TEST-ACCT-0001');
});

describe('gateMiddleware — route→modül eşleşmesi', () => {
  it('lisans gerektirmeyen rotalar haritada değil', () => {
    // Haritada olmayan rota → lisans kontrolü yapılmaz.
    expect(ROUTE_GUARDS['license' as keyof typeof ROUTE_GUARDS]).toBeUndefined();
  });

  it('ticaret rotaları doğru modüllere eşlenir', () => {
    expect(ROUTE_GUARDS.checkout).toBe('SATIS');
    expect(ROUTE_GUARDS.invoice).toBe('SATIS');
    expect(ROUTE_GUARDS.money).toBe('KASA');
    expect(ROUTE_GUARDS.customer).toBe('MUSTERI');
    expect(ROUTE_GUARDS.user).toBe('KULLANICI');
    expect(ROUTE_GUARDS.report).toBe('RAPOR');
    expect(ROUTE_GUARDS.settings).toBe('AYARLAR');
    expect(ROUTE_GUARDS.backup).toBe('YEDEK');
  });

  it('Türkçe rota adları da eşlenir', () => {
    expect(ROUTE_GUARDS.faktura).toBe('SATIS');
    expect(ROUTE_GUARDS.kassa).toBe('KASA');
    expect(ROUTE_GUARDS.sazlamalar).toBe('AYARLAR');
    expect(ROUTE_GUARDS.hasaplama).toBe('RAPOR');
  });
});

describe('gateMiddleware — lisans kimliği durumu', () => {
  it('setLicenseId/getLicenseId kalıcı', () => {
    setLicenseId('ABCD-EFGH-JKMN-PQ');
    expect(getLicenseId()).toBe('ABCD-EFGH-JKMN-PQ');
  });

  it('hesap değiştirince kimlik sıfırlanabilir (spec v3 §5.2)', () => {
    setLicenseId(undefined);
    expect(getLicenseId()).toBeUndefined();
  });
});

describe('checkRouteAccess', () => {
  it('lisans gerektirmeyen rotaya izin verir', async () => {
    const result = await checkRouteAccess('license-screen');
    expect(result.allowed).toBe(true);
    expect(result.reason).toBe('NO_LICENSE_REQUIRED');
  });

  it('gate yoksa (APK/web) mobil kontrole düşer — lisanssız hesap reddedilir', async () => {
    const saved = (window as any).electronAPI.guardLicense;
    delete (window as any).electronAPI.guardLicense;

    // Geçersiz/çözülemeyen Hesap ID → mobil gate fail-closed reddeder
    const result = await checkRouteAccess('checkout');
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('NO_LICENSE');

    (window as any).electronAPI.guardLicense = saved;
  });

  it('mobil gate: lisans kimliği yoksa NO_ACCOUNT ile reddeder', async () => {
    const saved = (window as any).electronAPI.guardLicense;
    delete (window as any).electronAPI.guardLicense;
    setLicenseId(undefined);

    const result = await checkRouteAccess('checkout');
    expect(result.allowed).toBe(false);
    expect(result.status).toBe(-5);
    expect(result.reason).toBe('NO_ACCOUNT');

    (window as any).electronAPI.guardLicense = saved;
    setLicenseId('TEST-ACCT-0001');
  });

  it('geçerli lisans → izin verir ve modül bilgisi taşınır', async () => {
    guardLicense.mockResolvedValue({
      allowed: true,
      status: 1,
      reason: 'OK',
      info: { daysLeft: 30 },
    });

    const result = await checkRouteAccess('checkout');

    expect(result.allowed).toBe(true);
    expect(result.info).toEqual({ daysLeft: 30 });
    expect(guardLicense).toHaveBeenCalledWith('SATIS', 'TEST-ACCT-0001');
  });

  it('süresi dolmuş lisans → reddeder', async () => {
    guardLicense.mockResolvedValue({ allowed: false, status: -1, reason: 'EXPIRED', info: null });

    const result = await checkRouteAccess('checkout');

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('EXPIRED');
  });

  it('hesap seçili değilse reddeder', async () => {
    guardLicense.mockResolvedValue({ allowed: false, status: -5, reason: 'NO_ACCOUNT', info: null });

    const result = await checkRouteAccess('report');

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('NO_ACCOUNT');
  });

  it('gate çöktüğünde kapalı modda reddeder (fail-closed)', async () => {
    guardLicense.mockRejectedValue(new Error('IPC patladı'));

    const result = await checkRouteAccess('checkout');

    // Güvenlik: hata durumunda İZİN VERMEZ.
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('STORAGE_ERROR');
  });
});

describe('guardNavigation', () => {
  it('izin verilen rotada true döner, geri çağrı yapılmaz', async () => {
    guardLicense.mockResolvedValue({ allowed: true, status: 1, reason: 'OK', info: null });
    const onBlocked = vi.fn();

    const allowed = await guardNavigation('checkout', onBlocked);

    expect(allowed).toBe(true);
    expect(onBlocked).not.toHaveBeenCalled();
  });

  it('engellenen rotada false döner ve sebebi bildirir', async () => {
    guardLicense.mockResolvedValue({ allowed: false, status: -1, reason: 'EXPIRED', info: null });
    const onBlocked = vi.fn();

    const allowed = await guardNavigation('checkout', onBlocked);

    expect(allowed).toBe(false);
    expect(onBlocked).toHaveBeenCalledWith('EXPIRED', null);
  });
});

describe('currency ve ledger rotaları (kapı açığı regresyonu)', () => {
  it('currency rotası FIYAT modülü gerektirir', async () => {
    guardLicense.mockResolvedValue({ allowed: false, status: -8, reason: 'FEATURE_LOCKED', info: null });

    const result = await checkRouteAccess('currency');

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('FEATURE_LOCKED');
    expect(guardLicense).toHaveBeenCalledWith('FIYAT', 'TEST-ACCT-0001');
  });

  it('ledger rotası RAPOR modülü gerektirir', async () => {
    guardLicense.mockResolvedValue({ allowed: false, status: -8, reason: 'FEATURE_LOCKED', info: null });

    const result = await checkRouteAccess('ledger');

    expect(result.allowed).toBe(false);
    expect(guardLicense).toHaveBeenCalledWith('RAPOR', 'TEST-ACCT-0001');
  });

  it('lisanslı kullanıcıda currency/ledger açılır', async () => {
    guardLicense.mockResolvedValue({ allowed: true, status: 1, reason: 'OK', info: null });

    expect((await checkRouteAccess('currency')).allowed).toBe(true);
    expect((await checkRouteAccess('ledger')).allowed).toBe(true);
  });

  it('eşleşme tablosunda currency/ledger tanımlı', () => {
    expect(ROUTE_GUARDS.currency).toBe('FIYAT');
    expect(ROUTE_GUARDS.ledger).toBe('RAPOR');
  });
});

describe('hata mesajları', () => {
  it('bilinen sebepleri Türkçe döner', () => {
    expect(getLicenseErrorMessage('EXPIRED')).toBe('Lisans süresi doldu');
    expect(getLicenseErrorMessage('NO_ACCOUNT')).toBe('Hesap seçilmedi');
    expect(getLicenseErrorMessage('FEATURE_LOCKED')).toBe('Bu özellik lisansınızda yok');
  });

  it('bilinmeyen sebepte ham değeri gösterir', () => {
    expect(getLicenseErrorMessage('WEIRD_CODE')).toContain('WEIRD_CODE');
  });

  it('her sebep için mesaj tanımlı', () => {
    for (const reason of Object.keys(LICENSE_ERRORS)) {
      expect(getLicenseErrorMessage(reason)).toBeTruthy();
    }
  });
});