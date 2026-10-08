/**
 * auditLog.ts — saf fonksiyonlar + logAudit davranışı (pouch mock'lu).
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  put: vi.fn(async (_doc: unknown) => ({ ok: true })),
  docs: [] as Array<Record<string, unknown>>,
}));

vi.mock('../../src/db/pouch', () => ({
  getLocalDatabase: vi.fn(() => ({ put: h.put })),
  listDocsByPrefix: vi.fn(async () => h.docs),
}));

import {
  calculateDiff,
  docTypeFromId,
  getAuditHealth,
  getAuditUser,
  isAuditEnabled,
  listAuditEntries,
  logAudit,
  resetAuditStateForTests,
  setAuditEnabled,
  setAuditUser,
} from '../../src/db/auditLog';

describe('docTypeFromId', () => {
  it('iki nokta öneki: urun:abc → urun', () => {
    expect(docTypeFromId('urun:abc-123')).toBe('urun');
    expect(docTypeFromId('kagent:x')).toBe('kagent');
    expect(docTypeFromId('fatura:1')).toBe('fatura');
  });

  it('alt çizgi öneki: product_abc → product', () => {
    expect(docTypeFromId('product_abc')).toBe('product');
    expect(docTypeFromId('customer_1')).toBe('customer');
  });

  it('önek yoksa other', () => {
    expect(docTypeFromId('plainid')).toBe('other');
    expect(docTypeFromId('')).toBe('other');
  });
});

describe('calculateDiff', () => {
  it('değişen alanları {old,new} ile döner', () => {
    const diff = calculateDiff({ _id: 'a', ad: 'Eski', fiyat: 5 }, { _id: 'a', ad: 'Yeni', fiyat: 5 });
    expect(diff).toEqual({ ad: { old: 'Eski', new: 'Yeni' } });
  });

  it('_rev atlanır', () => {
    const diff = calculateDiff({ _id: 'a', _rev: '1-x', ad: 'A' }, { _id: 'a', ad: 'A' });
    expect(diff).toBeUndefined();
  });

  it('yeni alan eklendiyse old: undefined', () => {
    const diff = calculateDiff({ _id: 'a' }, { _id: 'a', stok: 3 });
    expect(diff).toEqual({ stok: { old: undefined, new: 3 } });
  });

  it('iç içe değerler JSON ile karşılaştırılır', () => {
    const kalemler = [{ urunId: '1', miktar: 2 }];
    const same = calculateDiff({ _id: 'f', kalemler }, { _id: 'f', kalemler: [{ urunId: '1', miktar: 2 }] });
    expect(same).toBeUndefined();
    const changed = calculateDiff({ _id: 'f', kalemler }, { _id: 'f', kalemler: [{ urunId: '1', miktar: 3 }] });
    expect(changed?.kalemler).toBeTruthy();
  });
});

describe('logAudit', () => {
  beforeEach(() => {
    resetAuditStateForTests();
    h.put.mockClear();
    h.put.mockResolvedValue({ ok: true } as never);
  });

  it('bayrak kapalıysa no-op: false döner, put çağrılmaz', async () => {
    const ok = await logAudit({ action: 'CREATE', docType: 'urun', docId: 'urun:1' });
    expect(ok).toBe(false);
    expect(h.put).not.toHaveBeenCalled();
    expect(isAuditEnabled()).toBe(false);
  });

  it('bayrak açıksa audit: önekli belge yazar, kullanıcı modül durumundan', async () => {
    setAuditEnabled(true);
    setAuditUser('user-42');
    const ok = await logAudit({ action: 'UPDATE', docType: 'fatura', docId: 'fatura:9', storeDb: 'store_a' });
    expect(ok).toBe(true);
    expect(h.put).toHaveBeenCalledTimes(1);
    const doc = h.put.mock.calls[0][0] as Record<string, unknown>;
    expect(String(doc._id)).toMatch(/^audit:\d+:/);
    expect(doc.userId).toBe('user-42');
    expect(doc.action).toBe('UPDATE');
    expect(doc.storeDb).toBe('store_a');
    expect(typeof doc.timestamp).toBe('string');
  });

  it('yazma patlarsa fırlatmaz: false + sağlık sayacı', async () => {
    setAuditEnabled(true);
    h.put.mockRejectedValueOnce(new Error('disk dolu'));
    const ok = await logAudit({ action: 'CREATE', docType: 'urun', docId: 'urun:2' });
    expect(ok).toBe(false);
    const health = getAuditHealth();
    expect(health.errorCount).toBe(1);
    expect(health.lastError).toContain('disk dolu');
  });

  it('setAuditUser(undefined) kullanıcıyı temizler', () => {
    setAuditUser('u1');
    expect(getAuditUser()).toBe('u1');
    setAuditUser(undefined);
    expect(getAuditUser()).toBe('');
  });
});

describe('listAuditEntries', () => {
  const entry = (id: string, ts: string, extra: Record<string, unknown> = {}) => ({
    _id: `audit:${id}`,
    timestamp: ts,
    userId: 'u1',
    action: 'UPDATE',
    docType: 'urun',
    docId: 'urun:x',
    ...extra,
  });

  beforeEach(() => {
    h.docs = [
      entry('1', '2026-10-01T10:00:00Z'),
      entry('2', '2026-10-03T10:00:00Z', { userId: 'u2', docType: 'fatura' }),
      entry('3', '2026-10-02T10:00:00Z', { storeDb: 'store_b' }),
    ];
  });

  it('en yeni önce gelir', async () => {
    const list = await listAuditEntries();
    expect(list.map((e) => e._id)).toEqual(['audit:2', 'audit:3', 'audit:1']);
  });

  it('docType ve userId filtreleri', async () => {
    const byType = await listAuditEntries(200, { docType: 'fatura' });
    expect(byType).toHaveLength(1);
    expect(byType[0]._id).toBe('audit:2');
    const byUser = await listAuditEntries(200, { userId: 'u1' });
    expect(byUser).toHaveLength(2);
  });

  it('tarih aralığı filtresi (from/to dahil)', async () => {
    const list = await listAuditEntries(200, {
      from: '2026-10-02T00:00:00Z',
      to: '2026-10-02T23:59:59Z',
    });
    expect(list.map((e) => e._id)).toEqual(['audit:3']);
  });

  it('limit uygulanır', async () => {
    const list = await listAuditEntries(2);
    expect(list).toHaveLength(2);
  });
});
