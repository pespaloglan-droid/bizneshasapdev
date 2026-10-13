import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * conflictResolver.ts — Last-Write-Wins davranışını kilitleyen testler.
 *
 * ÖNEMLİ: Bu testler MEVCUT davranışı belgeler. LWW, iki kasiyer aynı
 * bakiyeyi offline güncellerse birinin kaybına yol açar — FAZ 2.1
 * (append-only finansal belgeler) bu davranışı değiştirecek; o zaman
 * bu testlerin bilinçli şekilde güncellenmesi gerekir.
 */

interface LeafDoc extends Record<string, unknown> {
  _id: string;
  _rev: string;
}

/** Çakışmalı revizyonları taklit eden küçük bellek içi sahte PouchDB. */
class FakeConflictDb {
  /** id → rev → belge */
  private revs = new Map<string, Map<string, LeafDoc>>();
  /** id → kazanan (ana) revizyon */
  private winners = new Map<string, string>();
  putCalls: LeafDoc[] = [];
  removeCalls: Array<{ id: string; rev: string }> = [];
  failGetRevs = new Set<string>();

  addLeaf(id: string, rev: string, fields: Record<string, unknown>, isWinner = false) {
    if (!this.revs.has(id)) this.revs.set(id, new Map());
    this.revs.get(id)!.set(rev, { ...fields, _id: id, _rev: rev });
    if (isWinner) this.winners.set(id, rev);
    return this;
  }

  async allDocs(_opts?: unknown) {
    const rows: Array<{ id: string; doc: Record<string, unknown> }> = [];
    for (const [id, revMap] of this.revs) {
      const winRev = this.winners.get(id);
      if (!winRev) continue;
      const winDoc = revMap.get(winRev)!;
      const conflicts = [...revMap.keys()].filter((r) => r !== winRev);
      rows.push({
        id,
        doc: { ...winDoc, ...(conflicts.length ? { _conflicts: conflicts } : {}) },
      });
    }
    return { rows };
  }

  async get(id: string, opts?: { rev?: string }) {
    const rev = opts?.rev;
    if (!rev) throw new Error('get without rev not supported by fake');
    if (this.failGetRevs.has(rev)) throw new Error('simulated get failure');
    const doc = this.revs.get(id)?.get(rev);
    if (!doc) {
      const err = new Error('missing') as Error & { status: number };
      err.status = 404;
      throw err;
    }
    return doc;
  }

  async put(doc: LeafDoc) {
    this.putCalls.push(doc);
    const revMap = this.revs.get(doc._id);
    if (revMap && revMap.has(doc._rev)) {
      revMap.set(doc._rev, { ...doc });
    }
    return { ok: true, id: doc._id, rev: doc._rev };
  }

  async remove(id: string, rev: string) {
    this.removeCalls.push({ id, rev });
    const revMap = this.revs.get(id);
    if (!revMap || !revMap.has(rev)) {
      const err = new Error('missing') as Error & { status: number };
      err.status = 404;
      throw err;
    }
    revMap.delete(rev);
    return { ok: true };
  }

  leavesOf(id: string): string[] {
    return [...(this.revs.get(id)?.keys() ?? [])];
  }
}

let fakeDb: FakeConflictDb;

vi.mock('../../src/db/pouch', () => ({
  getLocalDatabase: vi.fn(() => fakeDb),
}));

import { docTimestamp, resolveConflicts, countConflicts, setConflictReviewEnabled, listDocumentConflicts, resolveReviewedConflict } from '../../src/db/conflictResolver';

beforeEach(() => {
  localStorage.clear();
  fakeDb = new FakeConflictDb();
});

describe('docTimestamp', () => {
  it('updatedAt tercih edilir', () => {
    const doc = { updatedAt: '2026-10-01T10:00:00Z', syncedAt: '2026-10-05T10:00:00Z' };
    expect(docTimestamp(doc)).toBe(Date.parse('2026-10-01T10:00:00Z'));
  });

  it('updatedAt yoksa syncedAt kullanılır', () => {
    expect(docTimestamp({ syncedAt: '2026-10-05T10:00:00Z' })).toBe(
      Date.parse('2026-10-05T10:00:00Z')
    );
  });

  it('syncedAt de yoksa createdAt kullanılır', () => {
    expect(docTimestamp({ createdAt: '2026-09-01T00:00:00Z' })).toBe(
      Date.parse('2026-09-01T00:00:00Z')
    );
  });

  it('iç içe product.updatedAt bulunur', () => {
    const doc = { product: { updatedAt: '2026-08-15T12:00:00Z' } };
    expect(docTimestamp(doc)).toBe(Date.parse('2026-08-15T12:00:00Z'));
  });

  it('iç içe customer/invoice/transaction.updatedAt bulunur', () => {
    expect(docTimestamp({ customer: { updatedAt: '2026-08-15T12:00:00Z' } })).toBe(
      Date.parse('2026-08-15T12:00:00Z')
    );
    expect(docTimestamp({ invoice: { updatedAt: '2026-08-16T12:00:00Z' } })).toBe(
      Date.parse('2026-08-16T12:00:00Z')
    );
    expect(docTimestamp({ transaction: { updatedAt: '2026-08-17T12:00:00Z' } })).toBe(
      Date.parse('2026-08-17T12:00:00Z')
    );
  });

  it('lastEditedAt son çare olarak kullanılır', () => {
    expect(docTimestamp({ lastEditedAt: '2026-07-01T00:00:00Z' })).toBe(
      Date.parse('2026-07-01T00:00:00Z')
    );
  });

  it('zaman damgası yoksa 0 döner', () => {
    expect(docTimestamp({ ad: 'Çay', fiyat: 35 })).toBe(0);
  });

  it('null/undefined belge için 0 döner', () => {
    expect(docTimestamp(null)).toBe(0);
    expect(docTimestamp(undefined)).toBe(0);
  });

  it('sayısal milisaniye değerini aynen kabul eder', () => {
    const ms = Date.parse('2026-10-01T00:00:00Z'); // ~1.7e12 (> 1e11)
    expect(docTimestamp({ updatedAt: ms })).toBe(ms);
  });

  it('küçük sayıları saniye kabul edip ms\'ye çevirir', () => {
    const seconds = 1700000000; // < 1e11 → saniye varsayılır
    expect(docTimestamp({ updatedAt: seconds })).toBe(seconds * 1000);
  });

  it('bozuk string değerleri atlar', () => {
    expect(docTimestamp({ updatedAt: 'tarih-degil', createdAt: '2026-01-01T00:00:00Z' })).toBe(
      Date.parse('2026-01-01T00:00:00Z')
    );
  });

  it('NaN sayısal değeri 0 kabul eder', () => {
    expect(docTimestamp({ updatedAt: NaN })).toBe(0);
  });

  it('iç içe kayıt dizi ise zaman damgası aranmaz', () => {
    expect(docTimestamp({ product: [1, 2, 3] })).toBe(0);
  });
});

describe('resolveConflicts', () => {
  it('en yeni updatedAt kazanır (ana revizyon eskiyse içerik taşınır)', async () => {
    fakeDb
      .addLeaf('kagent:1', '1-aaa', { ad: 'A', bakiye: 100, updatedAt: '2026-10-01T10:00:00Z' }, true)
      .addLeaf('kagent:1', '2-bbb', { ad: 'A', bakiye: 250, updatedAt: '2026-10-05T10:00:00Z' });

    const stats = await resolveConflicts('musteri');

    expect(stats.resolved).toBe(1);
    // Kazanan 2-bbb: içeriği ana revizyona (1-aaa) yazılmalı
    expect(fakeDb.putCalls).toHaveLength(1);
    expect(fakeDb.putCalls[0].bakiye).toBe(250);
    expect(fakeDb.putCalls[0]._rev).toBe('1-aaa');
    expect(fakeDb.putCalls[0]._id).toBe('kagent:1');
  });

  it('kaybeden yapraklar silinir', async () => {
    fakeDb
      .addLeaf('urun:1', '1-aaa', { ad: 'Çay', updatedAt: '2026-10-01T10:00:00Z' }, true)
      .addLeaf('urun:1', '2-bbb', { ad: 'Çay v2', updatedAt: '2026-10-05T10:00:00Z' })
      .addLeaf('urun:1', '2-ccc', { ad: 'Çay v3', updatedAt: '2026-10-03T10:00:00Z' });

    const stats = await resolveConflicts('haryt');

    // 2-bbb içeriği ana dala taşınır; eski 2-bbb ve 2-ccc kaldırılır.
    expect(stats.removed).toBe(2);
    expect(fakeDb.removeCalls.map((r) => r.rev).sort()).toEqual(['2-bbb', '2-ccc']);
    expect(fakeDb.leavesOf('urun:1')).toEqual(['1-aaa']);
    expect(fakeDb.putCalls[0].ad).toBe('Çay v2');
  });

  it('ana revizyon zaten en yeniyse put çağrılmaz', async () => {
    fakeDb
      .addLeaf('urun:2', '2-zzz', { ad: 'Tuz', updatedAt: '2026-10-06T10:00:00Z' }, true)
      .addLeaf('urun:2', '1-yyy', { ad: 'Tuz eski', updatedAt: '2026-10-01T10:00:00Z' });

    const stats = await resolveConflicts('haryt');

    expect(fakeDb.putCalls).toHaveLength(0);
    expect(stats.removed).toBe(1);
    expect(fakeDb.removeCalls).toEqual([{ id: 'urun:2', rev: '1-yyy' }]);
  });

  it('hiçbir yaprakta zaman damgası yoksa ilk revizyon seçilir ve sayaç artar', async () => {
    fakeDb
      .addLeaf('kagent:9', '1-aaa', { ad: 'X' }, true)
      .addLeaf('kagent:9', '2-bbb', { ad: 'X' });

    const stats = await resolveConflicts('musteri');

    expect(stats.noTimestamp).toBe(1);
    expect(fakeDb.putCalls).toHaveLength(0); // ilk yaprak zaten ana revizyon
    expect(stats.removed).toBe(1);
  });

  it('çakışmasız belgelere dokunmaz', async () => {
    fakeDb.addLeaf('urun:1', '1-aaa', { ad: 'Çay', updatedAt: '2026-10-01T10:00:00Z' }, true);

    const stats = await resolveConflicts('haryt');

    expect(stats).toEqual({ resolved: 0, removed: 0, noTimestamp: 0 });
    expect(fakeDb.putCalls).toHaveLength(0);
    expect(fakeDb.removeCalls).toHaveLength(0);
  });

  it('birden fazla çakışmalı belgeyi ayrı ayrı çözer', async () => {
    fakeDb
      .addLeaf('urun:1', '1-a', { ad: 'A', updatedAt: '2026-10-01T00:00:00Z' }, true)
      .addLeaf('urun:1', '2-b', { ad: 'A2', updatedAt: '2026-10-02T00:00:00Z' })
      .addLeaf('urun:2', '1-c', { ad: 'B', updatedAt: '2026-10-01T00:00:00Z' }, true)
      .addLeaf('urun:2', '2-d', { ad: 'B2', updatedAt: '2026-10-02T00:00:00Z' });

    const stats = await resolveConflicts('haryt');

    // Belge başına: kazanan içeriği ana revize yazılır, kazananın eski yaprağı
    // ve ana rev silinir → put + remove hesabı: her iki belgede de best 2-* rev.
    // Silinenler: 1-a (urun:1) ve 1-c (urun:2) + kazanan yapraklar silinmez.
    expect(stats.resolved).toBe(2);
    expect(stats.removed).toBe(2);
    expect(fakeDb.putCalls).toHaveLength(2);
  });

  it('onProgress her yığın sonunda çağrılır', async () => {
    for (let i = 0; i < 3; i++) {
      fakeDb
        .addLeaf(`urun:${i}`, '1-a', { ad: `U${i}`, updatedAt: '2026-10-01T00:00:00Z' }, true)
        .addLeaf(`urun:${i}`, '2-b', { ad: `U${i}v2`, updatedAt: '2026-10-02T00:00:00Z' });
    }
    const progress: number[] = [];

    await resolveConflicts('haryt', 2, (done) => progress.push(done));

    expect(progress).toEqual([2, 3]);
  });

  it('okunamayan yaprak varken çözüm ve silme yapılmaz', async () => {
    fakeDb
      .addLeaf('urun:1', '1-a', { ad: 'A', updatedAt: '2026-10-01T00:00:00Z' }, true)
      .addLeaf('urun:1', '2-b', { ad: 'A2', updatedAt: '2026-10-02T00:00:00Z' });
    fakeDb.failGetRevs.add('2-b');

    const stats = await resolveConflicts('haryt');

    // Eksik yapraklarla güvenli karar verilemez.
    expect(stats.resolved).toBe(0);
    expect(fakeDb.removeCalls).toHaveLength(0);
  });

  it('saniye cinsinden zaman damgasıyla da doğru kazananı seçer', async () => {
    fakeDb
      .addLeaf('fatura:1', '1-a', { toplam: 10, updatedAt: 1727740800 }, true) // 2024-10-01 (saniye)
      .addLeaf('fatura:1', '2-b', { toplam: 99, updatedAt: 1728000000 }); // 2024-10-04 (saniye)

    const stats = await resolveConflicts('fatura');

    expect(stats.resolved).toBe(1);
    expect(fakeDb.putCalls[0].toplam).toBe(99);
  });

  it('kaybeden yaprak silinemezse işlem devam eder', async () => {
    // Kazanan ana revizyon (1-a, daha yeni); kaybeden 2-b'nin silinmesi hata verir.
    fakeDb
      .addLeaf('urun:1', '1-a', { ad: 'A', updatedAt: '2026-10-05T00:00:00Z' }, true)
      .addLeaf('urun:1', '2-b', { ad: 'A2', updatedAt: '2026-10-01T00:00:00Z' });
    const originalRemove = fakeDb.remove.bind(fakeDb);
    fakeDb.remove = async (id: string, rev: string) => {
      if (rev === '2-b') throw new Error('rev changed');
      return originalRemove(id, rev);
    };

    const stats = await resolveConflicts('haryt');

    expect(stats.resolved).toBe(1);
    expect(stats.removed).toBe(0); // silme başarısız sayılmaz ama akış sürer
    expect(fakeDb.putCalls).toHaveLength(0); // kazanan zaten ana revizyon
  });
});

describe('countConflicts', () => {
  it('çakışmalı belge sayısını döner', async () => {
    fakeDb
      .addLeaf('urun:1', '1-a', { ad: 'A' }, true)
      .addLeaf('urun:1', '2-b', { ad: 'A2' })
      .addLeaf('urun:2', '1-c', { ad: 'B' }, true)
      .addLeaf('urun:3', '1-d', { ad: 'C' }, true)
      .addLeaf('urun:3', '2-e', { ad: 'C2' })
      .addLeaf('urun:3', '2-f', { ad: 'C3' });

    expect(await countConflicts('haryt')).toBe(2);
  });

  it('çakışma yoksa 0 döner', async () => {
    fakeDb.addLeaf('urun:1', '1-a', { ad: 'A' }, true);
    expect(await countConflicts('haryt')).toBe(0);
  });

  it('boş veritabanında 0 döner', async () => {
    expect(await countConflicts('haryt')).toBe(0);
  });
});


describe('güvenli çözüm ve inceleme', () => {
  it('seçilen içerik yazılamazsa hiçbir yaprak silinmez', async () => {
    fakeDb.addLeaf('urun:1', '1-a', { ad: 'A', updatedAt: '2026-01-01' }, true)
      .addLeaf('urun:1', '2-b', { ad: 'B', updatedAt: '2026-02-01' });
    fakeDb.put = async () => { throw Object.assign(new Error('conflict'), { status: 409 }); };
    expect((await resolveConflicts('guard')).resolved).toBe(0);
    expect(fakeDb.removeCalls).toHaveLength(0);
    expect(fakeDb.leavesOf('urun:1')).toEqual(['1-a', '2-b']);
  });
  it('inceleme açıkken otomatik LWW veri değiştirmez', async () => {
    fakeDb.addLeaf('urun:1', '1-a', { ad: 'A', updatedAt: '2026-01-01' }, true)
      .addLeaf('urun:1', '2-b', { ad: 'B', updatedAt: '2026-02-01' });
    setConflictReviewEnabled('review', true);
    expect((await resolveConflicts('review')).resolved).toBe(0);
    expect(fakeDb.putCalls).toHaveLength(0); expect(fakeDb.removeCalls).toHaveLength(0);
    setConflictReviewEnabled('review', false);
    expect((await resolveConflicts('review')).resolved).toBe(1);
  });
  it('geçersiz batch boyutunda döngüye girmez', async () => {
    await expect(resolveConflicts('guard', 0)).rejects.toThrow();
    await expect(resolveConflicts('guard', 1.5)).rejects.toThrow();
  });
});

it('P1-3 geçersiz LWW kazananında kopyalama ve dal silme yok', async () => {
  fakeDb.addLeaf('urun:invalid', '1-a', { ad: 'Valid', updatedAt: '2026-01-01' }, true)
    .addLeaf('urun:invalid', '2-b', { ad: 42, updatedAt: '2026-02-01' });
  const stats=await resolveConflicts('invalid');
  expect(stats.validationRejected).toBe(1);expect(stats.resolved).toBe(0);
  expect(fakeDb.putCalls).toHaveLength(0);expect(fakeDb.removeCalls).toHaveLength(0);
});

it('P3 unreadable revision diğer kayıtları saklamaz ama eksik kaydı çözmeyi durdurur',async()=>{
  fakeDb.addLeaf('urun:bad','1-a',{ad:'Current'},true).addLeaf('urun:bad','2-unreadable',{ad:'Other'});
  fakeDb.addLeaf('urun:good','1-b',{ad:'Good'},true).addLeaf('urun:good','2-c',{ad:'Other good'});
  fakeDb.failGetRevs.add('2-unreadable');
  const records=await listDocumentConflicts('QA');expect(records).toHaveLength(2);
  const incomplete=records.find(record=>record.id==='urun:bad')!;
  expect(incomplete.incomplete).toBe(true);expect(incomplete.versions).toHaveLength(2);
  expect(incomplete.versions.find(v=>v.rev==='2-unreadable')).toMatchObject({unreadable:true,valid:false});
  await expect(resolveReviewedConflict('QA',incomplete,'1-a')).rejects.toThrow();
  expect(fakeDb.putCalls).toHaveLength(0);expect(fakeDb.removeCalls).toHaveLength(0);
  expect(records.find(record=>record.id==='urun:good')!.incomplete).toBe(false);
});
it('P3 tombstone deletedAt oluşturulma zamanından önce değerlendirilir',()=>{
  expect(docTimestamp({_deleted:true,deletedAt:'2026-10-12',createdAt:'2025-01-01',updatedAt:'2025-02-01'})).toBe(Date.parse('2026-10-12'));
});
