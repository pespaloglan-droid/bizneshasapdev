import { describe, it, expect, beforeEach, vi } from 'vitest';
import { encodeBhbak, decodeBhbak, BHBAK_MAGIC } from '../../src/utils/bhbak';
import { setLicenseId } from '../../src/utils/gateMiddleware';

/** 32-byte lisanstan türetilmiş anahtar (deriveKey çıktısı). */
function makeKey(seed: number): number[] {
  return Array.from({ length: 32 }, (_, i) => (seed * 7 + i * 13) % 256);
}

const deriveLicenseKey = vi.fn();

beforeEach(() => {
  deriveLicenseKey.mockReset();
  (window as any).electronAPI.deriveLicenseKey = deriveLicenseKey;
  setLicenseId('TEST-ACCT-0001');
});

/** V1/V2 sürüm baytını okur (byte 4). */
function versionOf(bytes: Uint8Array): number {
  return bytes[4];
}

describe('bhbak şifreli yedek (V2)', () => {
  const payload = JSON.stringify({
    products: [{ id: 'p1', ad: 'Çay', fiyat: 35.5, stok: 12 }],
    invoices: [{ id: 'f1', toplam: 71 }],
  });

  it('lisans varken V2 (şifreli) format üretir', async () => {
    deriveLicenseKey.mockResolvedValue(makeKey(1));

    const bytes = await encodeBhbak(payload);

    expect(new TextDecoder().decode(bytes.subarray(0, 4))).toBe(BHBAK_MAGIC);
    expect(versionOf(bytes)).toBe(2);
    // Şifreli + gzip + IV(12) + tag(16) → ham veriden büyük olmalı
    expect(bytes.length).toBeGreaterThan(payload.length);
  });

  it('şifreli yedeği aynı anahtarla çözer (round-trip)', async () => {
    deriveLicenseKey.mockResolvedValue(makeKey(1));
    const bytes = await encodeBhbak(payload);

    const decoded = await decodeBhbak(bytes);

    expect(decoded).toBe(payload);
    expect(JSON.parse(decoded).products[0].ad).toBe('Çay');
  });

  it('farklı hesabın anahtarıyla çözüm başarısız (spec 16.1)', async () => {
    deriveLicenseKey.mockResolvedValue(makeKey(1));
    const bytes = await encodeBhbak(payload);

    // Başka bir hesap/cihazın anahtarı
    deriveLicenseKey.mockResolvedValue(makeKey(99));

    await expect(decodeBhbak(bytes)).rejects.toThrow(/farklı bir cihaz\/hesap/i);
  });

  it('lisanssız cihazda şifreli yedek açılamaz', async () => {
    deriveLicenseKey.mockResolvedValue(makeKey(1));
    const bytes = await encodeBhbak(payload);

    // Lisanssız → deriveKey null
    deriveLicenseKey.mockResolvedValue(null);

    await expect(decodeBhbak(bytes)).rejects.toThrow(/LICENSE_REQUIRED|lisans anahtarı/i);
  });

  it('lisans varken bile şifreli yedekte düz JSON görünmez', async () => {
    deriveLicenseKey.mockResolvedValue(makeKey(1));
    const bytes = await encodeBhbak(payload);

    const raw = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
    expect(raw).not.toContain('Çay');
    expect(raw).not.toContain('products');
  });

  it('lisans yoksa V1\'e düşer (geriye uyumluluk) ve çözülebilir', async () => {
    deriveLicenseKey.mockResolvedValue(null);
    const bytes = await encodeBhbak(payload);

    expect(versionOf(bytes)).toBe(1);

    // Lisanslı cihazda V1 dosyası da okunabilir (anahtar gerekmez)
    deriveLicenseKey.mockResolvedValue(makeKey(1));
    const decoded = await decodeBhbak(bytes);
    expect(decoded).toBe(payload);
  });

  it('eski düz .json yedekleri okumaya devam eder', async () => {
    const legacy = new TextEncoder().encode(payload);
    const decoded = await decodeBhbak(legacy);
    expect(decoded).toBe(payload);
  });

  it('aynı metni iki kez şifrelemez (rastgele IV)', async () => {
    deriveLicenseKey.mockResolvedValue(makeKey(1));

    const a = await encodeBhbak(payload);
    const b = await encodeBhbak(payload);

    expect(Buffer.from(a).equals(Buffer.from(b))).toBe(false);
  });

  it('bozuk şifreli yedeği reddeder', async () => {
    deriveLicenseKey.mockResolvedValue(makeKey(1));
    const bytes = await encodeBhbak(payload);

    // Auth tag'ı boz
    bytes[bytes.length - 1] ^= 0xff;

    await expect(decodeBhbak(bytes)).rejects.toThrow();
  });
});
describe('bhbak büyük veri ve dosya doğrulaması', () => {
  it('büyük ve az sıkışan yedeği akış kilitlenmeden geri açar', async () => {
    deriveLicenseKey.mockResolvedValue(makeKey(1));
    // Tekrarlanan metin gzip tamponunu doldurmaz; deterministik gürültü doldurur.
    let seed = 123456789;
    const rows = Array.from({ length: 12000 }, (_, id) => {
      const text = Array.from({ length: 80 }, () => {
        seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
        return String.fromCharCode(33 + ((seed >>> 0) % 90));
      }).join('');
      return { id, text };
    });
    const json = JSON.stringify({ docs: rows });
    const encoded = await encodeBhbak(json);
    expect(encoded.length).toBeGreaterThan(65536);
    expect(await decodeBhbak(encoded)).toBe(json);
  }, 5000);

  it('eksik BHBK başlığını açık hatayla reddeder', async () => {
    await expect(decodeBhbak(new TextEncoder().encode('BHBK')))
      .rejects.toThrow(/INVALID_HEADER/);
  });

  it('başlıktaki JSON uzunluğu ile içerik uyuşmazlığını reddeder', async () => {
    deriveLicenseKey.mockResolvedValue(null);
    const bytes = await encodeBhbak('{"docs":[]}');
    new DataView(bytes.buffer).setUint32(5, 1, true);
    await expect(decodeBhbak(bytes)).rejects.toThrow(/INVALID_LENGTH/);
  });

  it('desteklenmeyen sürümü reddeder', async () => {
    const bytes = new Uint8Array(10);
    bytes.set(new TextEncoder().encode(BHBAK_MAGIC));
    bytes[4] = 99;
    await expect(decodeBhbak(bytes)).rejects.toThrow(/99/);
  });
});

// Selective backup uses a real validator but isolated database I/O.
const backupIo = vi.hoisted(() => ({ allDocs: vi.fn(), upsertDoc: vi.fn() }));
vi.mock('../../src/db/connectionStore', () => ({ loadConnection: () => ({ local: '', online: '', active: null }), saveConnection: vi.fn(), stopCurrent: vi.fn() }));
vi.mock('../../src/db/pouch', () => ({ getLocalDatabase: () => ({ allDocs: backupIo.allDocs }), upsertDoc: backupIo.upsertDoc }));
import { BACKUP_SCOPES, backupScope, inspectBackup, assertBackupAccount, exportSelectedBackup, restoreSelectedBackup, backupReminderDue, recordBackupSaved, lastBackupAt } from '../../src/db/backupService';

const sampleProduct = { _id: 'product_1', _rev: '5-old', docType: 'product', product: { id: '1', sku: '001', barcode: '002', name: 'Çaý', category: '', price: 3, stock: 9, imageType: 'default' } };
function makeBackup(docs: unknown[], extra: Record<string, unknown> = {}) { return inspectBackup(JSON.stringify({ app: 'biznes-hasap', version: 2, account: { id: 'A', storeDb: 'storeA' }, scopes: [...BACKUP_SCOPES], docs, ...extra })); }

describe('seçimli tam yedek güvenliği', () => {
  beforeEach(() => { backupIo.allDocs.mockReset(); backupIo.upsertDoc.mockReset().mockResolvedValue(undefined); });
  it('on kapsamı tanır; lisans ve credential belgelerini dışarıda bırakır', () => {
    for (const id of ['license', '_local/crypto', '_design/index', 'journal_1', 'credentials', 'settings_secret', 'account_A']) expect(backupScope(id)).toBeNull();
    expect(backupScope('settings_roles')).toBe('users');
    expect(backupScope('composition_1')).toBe('products');
    expect(backupScope('customerprice_1')).toBe('customers');
  });
  it('yanlış hesaba hiçbir belge yazmaz', async () => {
    const file = makeBackup([sampleProduct]);
    expect(() => assertBackupAccount(file, 'B', 'storeA')).toThrow('ACCOUNT_MISMATCH');
    await expect(restoreSelectedBackup('storeB', 'B', file, ['products'])).rejects.toThrow('ACCOUNT_MISMATCH');
    expect(backupIo.upsertDoc).not.toHaveBeenCalled();
  });
  it('eski yedeği açık onay olmadan yazmaz', async () => {
    const file = makeBackup([sampleProduct], { version: 1, account: undefined, scopes: undefined });
    await expect(restoreSelectedBackup('storeA', 'A', file, ['products'])).rejects.toThrow('LEGACY_CONFIRMATION_REQUIRED');
    expect(backupIo.upsertDoc).not.toHaveBeenCalled();
    expect((await restoreSelectedBackup('storeA', 'A', file, ['products'], true)).written.products).toBe(1);
  });
  it('eksik docs, yabancı uygulama ve bilinmeyen kapsam reddedilir', () => {
    expect(() => inspectBackup('{}')).toThrow('INVALID_BACKUP');
    expect(() => makeBackup([], { app: 'other' })).toThrow('INVALID_BACKUP');
    expect(() => makeBackup([], { scopes: ['credentials'] })).toThrow('INVALID_BACKUP');
  });
  it('bozuk satır, aynı ID, korunan belge ve tombstone raporlanır', () => {
    const file = makeBackup([null, sampleProduct, sampleProduct, { _id: 'license' }, { _id: 'product_bad', _deleted: true }, { ...sampleProduct, _id: 'product_bad', product: { ...sampleProduct.product, id: 'bad', stock: 'oops' } }]);
    expect(file.docs).toHaveLength(1); expect(file.issues).toHaveLength(5);
    expect(file.docs[0]).not.toHaveProperty('_rev');
  });
  it('seçilmeyen kapsamı yazmaz ve her yazma hatasını kısmi özete ekler', async () => {
    const file = makeBackup([sampleProduct, { _id: 'settings_roles', templates: {} }, { _id: 'unit_1', unit: { id: '1', labelTm: 'Sany' } }]);
    backupIo.upsertDoc.mockRejectedValueOnce(new Error('disk-full'));
    const result = await restoreSelectedBackup('storeA', 'A', file, ['products', 'users']);
    expect(result.written.products).toBe(0); expect(result.written.users).toBe(1);
    expect(result.failed).toHaveLength(1); expect(result.skipped).toBe(1);
    expect(backupIo.upsertDoc).toHaveBeenCalledTimes(2);
  });
  it('export yalnızca seçilen kapsamı ve hesap bağını içerir', async () => {
    backupIo.allDocs.mockResolvedValue({ rows: [{ doc: sampleProduct }, { doc: { _id: 'license', secret: 'NEVER' } }, { doc: { _id: 'settings_app' } }] });
    const json = await exportSelectedBackup('storeA', 'A', ['products']);
    expect(json).not.toContain('NEVER'); const file = JSON.parse(json);
    expect(file.account).toEqual({ id: 'A', storeDb: 'storeA' }); expect(file.docs).toHaveLength(1);
    expect(file.docs[0]._rev).toBeUndefined(); expect(file.scopes).toEqual(['products']);
  });
  it('boş kapsamla export veya restore başlatmaz', async () => {
    await expect(exportSelectedBackup('storeA', 'A', [])).rejects.toThrow('NO_SCOPES');
    await expect(restoreSelectedBackup('storeA', 'A', makeBackup([]), [])).rejects.toThrow('NO_SCOPES');
  });
  it('30 gün sınırını, yeni hesabı ve gelecekteki tarihi doğru ele alır', () => {
    const now = Date.parse('2026-10-27T00:00:00Z');
    expect(backupReminderDue('2026-09-27T00:00:00Z', '', now)).toBe(true);
    expect(backupReminderDue('2026-09-28T00:00:00Z', '', now)).toBe(false);
    expect(backupReminderDue(null, '2026-10-26', now)).toBe(false);
    expect(backupReminderDue(null, 'invalid', now)).toBe(false);
    expect(backupReminderDue('2027-01-01', '', now)).toBe(false);
  });
  it('son başarılı yedek hesabın kendi anahtarında saklanır', () => {
    recordBackupSaved('backup-test-A');
    expect(lastBackupAt('backup-test-A')).toBeTruthy();
    expect(lastBackupAt('backup-test-B')).toBeNull();
  });
});


it('yeni UI için şifreleme zorunluysa V1e sessiz düşmez', async () => {
  deriveLicenseKey.mockResolvedValue(null);
  await expect(encodeBhbak('{"docs":[]}', true)).rejects.toThrow('LICENSE_REQUIRED');
});


it('aynı lisans hesabı PC ve APKda farklı yerel UUID ile geri yüklenebilir; farklı mağaza reddedilir', async () => {
  const file = makeBackup([sampleProduct], { account: { id: 'pc-local', storeDb: 'store_pc_local', licenseId: 'SHARED-LICENSE', databaseName: 'shop' } });
  expect(() => assertBackupAccount(file, 'phone-local', 'store_phone_local', { licenseId: 'SHARED-LICENSE', databaseName: 'shop' })).not.toThrow();
  expect(() => assertBackupAccount(file, 'phone-local', 'store_phone_local', { licenseId: 'OTHER', databaseName: 'shop' })).toThrow('ACCOUNT_MISMATCH');
  expect(() => assertBackupAccount(file, 'phone-local', 'store_phone_local', { licenseId: 'SHARED-LICENSE', databaseName: 'other' })).toThrow('ACCOUNT_MISMATCH');
});

it('yazma hatası filtrelenmiş diziyi değil kaynak dosyadaki satırı bildirir', async () => {
  backupIo.upsertDoc.mockReset().mockRejectedValue(new Error('disk-full'));
  const file = makeBackup([null, sampleProduct]);
  const result = await restoreSelectedBackup('storeA', 'A', file, ['products']);
  expect(result.failed.find(issue => issue.code === 'WRITE_FAILED')?.row).toBe(2);
});
