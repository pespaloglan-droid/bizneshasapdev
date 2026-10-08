/**
 * pouch.ts upsertDoc/removeDoc → auditLog entegrasyonu (auditLog mock'lu).
 * Doğrulanan: CREATE/UPDATE/DELETE doğru argümanlarla çağrılır;
 * 'audit' DB'sinin kendi yazmaları ASLA loglanmaz (sonsuz döngü önlemi).
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => {
  const instances: any[] = [];
  return {
    instances,
    logAudit: vi.fn(async (_e: unknown) => true),
    calculateDiff: vi.fn(() => undefined),
    docTypeFromId: vi.fn((_id: string) => 'urun'),
  };
});

vi.mock('pouchdb-browser', () => {
  class FakePouchDB {
    static plugin = vi.fn();
    name: string;
    docs = new Map<string, Record<string, unknown>>();
    crypto = vi.fn(() => Promise.resolve());
    get = vi.fn(async (id: string) => {
      const d = this.docs.get(id);
      if (!d) {
        const e = new Error('missing') as Error & { status: number };
        e.status = 404;
        throw e;
      }
      return d;
    });
    put = vi.fn(async (doc: Record<string, unknown>) => {
      this.docs.set(String(doc._id), { ...doc, _rev: '1-x' });
      return { ok: true };
    });
    remove = vi.fn(async (doc: Record<string, unknown>) => {
      this.docs.delete(String(doc._id));
      return { ok: true };
    });
    destroy = vi.fn(async () => ({ ok: true }));
    constructor(name: string) {
      this.name = name;
      h.instances.push(this);
    }
  }
  return { default: FakePouchDB };
});

vi.mock('../../src/db/auditLog', () => ({
  logAudit: h.logAudit,
  calculateDiff: h.calculateDiff,
  docTypeFromId: h.docTypeFromId,
}));

import { removeDoc, resetDatabaseKeyCacheForTests, upsertDoc } from '../../src/db/pouch';

const deriveMock = () => window.electronAPI!.deriveLicenseKey as ReturnType<typeof vi.fn>;
const KEY = new Uint8Array(32).fill(7);

describe('upsertDoc/removeDoc — audit entegrasyonu', () => {
  beforeEach(() => {
    localStorage.clear();
    resetDatabaseKeyCacheForTests();
    h.instances.length = 0;
    h.logAudit.mockClear();
    deriveMock().mockReset().mockResolvedValue(KEY);
  });

  it('yeni belge → CREATE', async () => {
    await upsertDoc('store_audit_t1', 'urun:1', { ad: 'Nan' });
    expect(h.logAudit).toHaveBeenCalledTimes(1);
    const entry = h.logAudit.mock.calls[0][0];
    expect(entry.action).toBe('CREATE');
    expect(entry.docId).toBe('urun:1');
    expect(entry.storeDb).toBe('store_audit_t1');
    expect(entry.changes).toBeUndefined();
  });

  it('mevcut belge → UPDATE + changes hesaplanır', async () => {
    await upsertDoc('store_audit_t2', 'urun:2', { ad: 'Nan' });
    h.logAudit.mockClear();
    await upsertDoc('store_audit_t2', 'urun:2', { ad: 'Bereket' });
    expect(h.logAudit).toHaveBeenCalledTimes(1);
    const entry = h.logAudit.mock.calls[0][0];
    expect(entry.action).toBe('UPDATE');
    expect(h.calculateDiff).toHaveBeenCalled();
  });

  it("'audit' DB'sine yazma ASLA loglanmaz (sonsuz döngü önlemi)", async () => {
    await upsertDoc('audit', 'audit:1:x', { action: 'CREATE' });
    expect(h.logAudit).not.toHaveBeenCalled();
  });

  it('removeDoc → DELETE', async () => {
    await upsertDoc('store_audit_t3', 'urun:3', { ad: 'Nan' });
    h.logAudit.mockClear();
    const ok = await removeDoc('store_audit_t3', 'urun:3');
    expect(ok).toBe(true);
    expect(h.logAudit).toHaveBeenCalledTimes(1);
    expect(h.logAudit.mock.calls[0][0].action).toBe('DELETE');
  });

  it("removeDoc('audit', ...) loglanmaz", async () => {
    await upsertDoc('audit', 'audit:2:y', { action: 'CREATE' });
    h.logAudit.mockClear();
    await removeDoc('audit', 'audit:2:y');
    expect(h.logAudit).not.toHaveBeenCalled();
  });
});
