import { describe, it, expect } from 'vitest';
import {
  migrateToEncrypted,
  prepareDocForTarget,
  verifyMigration,
  type MigrationSource,
  type MigrationTarget,
} from '../../src/db/migrateToEncrypted';

/**
 * Gerçek PouchDB davranışı (ölçüldü, 08.10.2026):
 * `bulkDocs` kaynak `_rev` içeren belge alırsa `409 conflict` döner ve
 * belge YAZILMAZ. crypto-pouch bu hataları yutmaz ama çağıran taraf
 * yanlılıkla başarı varsayar. Bu sahte, tam olarak bu davranışı taklit eder.
 */
class RealisticTarget implements MigrationTarget {
  written: Array<Record<string, unknown>> = [];

  async bulkDocs(docs: Array<Record<string, unknown>>) {
    return docs.map((d) => {
      if (d._rev !== undefined) {
        return { error: 'conflict', status: 409, id: String(d._id) } as Record<string, unknown>;
      }
      this.written.push(d);
      return { ok: true, id: String(d._id) } as Record<string, unknown>;
    });
  }
}

function makeSource(docs: Array<Record<string, unknown>>): MigrationSource & {
  docCount: number;
} {
  return {
    docCount: docs.length,
    async allDocs() {
      return { rows: docs.map((d) => ({ doc: d })) };
    },
  };
}

const SAMPLE: Array<Record<string, unknown>> = [
  { _id: 'urun:1', _rev: '1-abc', ad: 'Çay', fiyat: 35.5, stok: 12 },
  { _id: 'urun:2', _rev: '1-def', ad: 'Şeker', fiyat: 12, stok: 40 },
  { _id: 'fatura:1', _rev: '1-ghi', toplam: 47.5, musteri: 'musteri:1' },
];

describe('prepareDocForTarget', () => {
  it('_rev alanını kaldırır', () => {
    const out = prepareDocForTarget({ _id: 'urun:1', _rev: '1-abc', ad: 'Çay' });
    expect(out).not.toHaveProperty('_rev');
  });

  it('_conflicts ve _deleted alanlarını da kaldırır', () => {
    const out = prepareDocForTarget({
      _id: 'urun:1',
      _rev: '1-abc',
      _conflicts: ['2-x'],
      _deleted: true,
      ad: 'Çay',
    });
    expect(out).not.toHaveProperty('_conflicts');
    expect(out).not.toHaveProperty('_deleted');
  });

  it('iş verisine dokunmaz', () => {
    const out = prepareDocForTarget({
      _id: 'urun:1',
      _rev: '1-abc',
      ad: 'Çay',
      fiyat: 35.5,
      stok: 12,
    });
    expect(out.ad).toBe('Çay');
    expect(out.fiyat).toBe(35.5);
    expect(out.stok).toBe(12);
    expect(out._id).toBe('urun:1');
  });

  it('kaynak belgeyi MUTLAKA değiştirmez', () => {
    const src = { _id: 'urun:1', _rev: '1-abc', ad: 'Çay' };
    prepareDocForTarget(src);
    expect(src._rev).toBe('1-abc'); // kaynakta hâlâ var
  });
});

describe('migrateToEncrypted', () => {
  it('tüm belgeleri kopyalar', async () => {
    const target = new RealisticTarget();
    const result = await migrateToEncrypted(makeSource(SAMPLE), target);

    expect(result.copied).toBe(3);
    expect(result.failed).toEqual([]);
    expect(target.written).toHaveLength(3);
  });

  it('🔴 REGRESYON: _rev temizlenmezse 409 alır ve 0 belge yazar', async () => {
    const target = new RealisticTarget();
    // prepareDocForTarget YOKSA ne olur? Elle taklit et:
    await target.bulkDocs(SAMPLE as Array<Record<string, unknown>>);

    expect(target.written).toHaveLength(0); // sessiz veri kaybı
  });

  it('migrasyon _rev içermeyen belgeler yazar', async () => {
    const target = new RealisticTarget();
    await migrateToEncrypted(makeSource(SAMPLE), target);

    target.written.forEach((d) => {
      expect(d._rev).toBeUndefined();
    });
  });

  it('migrasyon kaynağı silmez (sourcePreserved)', async () => {
    const source = makeSource(SAMPLE);
    const target = new RealisticTarget();

    const result = await migrateToEncrypted(source, target);

    // Kaynak hâlâ okunabilir ve dolu
    const after = await source.allDocs({});
    expect(after.rows).toHaveLength(3);
    expect(result.sourcePreserved).toBe(true);
  });

  it('toplu yazmada bir belge çakışırsa diğerleri yazılır', async () => {
    const target = new RealisticTarget();
    const karisik: Array<Record<string, unknown>> = [
      { _id: 'urun:1', ad: 'Çay' },
      { _id: 'urun:2', _rev: '1-bozuk', ad: 'Şeker' }, // _rev takılı kaldı
      { _id: 'urun:3', ad: 'Tuz' },
    ];

    const result = await migrateToEncrypted(makeSource(karisik), target);

    // prepareDocForTarget hepsini temizler → hepsi yazılır
    expect(result.copied).toBe(3);
    expect(result.failed).toEqual([]);
  });

  it('hedef hata dönerse belge kimliği raporlanır', async () => {
    const hedef: MigrationTarget = {
      async bulkDocs() {
        return [{ error: 'conflict' }, { error: 'conflict' }];
      },
    };

    const result = await migrateToEncrypted(makeSource(SAMPLE.slice(0, 2)), hedef);

    expect(result.copied).toBe(0);
    expect(result.failed).toHaveLength(2);
    expect(result.failed.map((f) => f.id)).toEqual(['urun:1', 'urun:2']);
    expect(result.failed[0].reason).toBe('conflict');
  });

  it('boş kaynakta 0 kopyalar, hata vermez', async () => {
    const target = new RealisticTarget();
    const result = await migrateToEncrypted(makeSource([]), target);

    expect(result.copied).toBe(0);
    expect(result.failed).toEqual([]);
  });

  it('null belge satırlarını atlar', async () => {
    const target = new RealisticTarget();
    const source: MigrationSource = {
      async allDocs() {
        return { rows: [{ doc: { _id: 'urun:1', ad: 'Çay' } }, { doc: null }] };
      },
    };

    const result = await migrateToEncrypted(source, target);
    expect(result.copied).toBe(1);
  });

  it('yığın boyutunu aşan veride de tamamlar', async () => {
    const target = new RealisticTarget();
    const cok: Array<Record<string, unknown>> = Array.from({ length: 250 }, (_, i) => ({
      _id: `urun:${i}`,
      _rev: `1-rev-${i}`,
      ad: `Ürün ${i}`,
    }));

    const result = await migrateToEncrypted(makeSource(cok), target, 100);

    expect(result.copied).toBe(250);
    expect(target.written).toHaveLength(250);
  });
});

describe('verifyMigration', () => {
  it('sayılar eşitse doğrular', async () => {
    const source = makeSource(SAMPLE);
    const result = await verifyMigration(source, 3);
    expect(result.ok).toBe(true);
    expect(result.expected).toBe(3);
    expect(result.actual).toBe(3);
  });

  it('hedef eksikse başarısız döner', async () => {
    const source = makeSource(SAMPLE);
    const result = await verifyMigration(source, 1);
    expect(result.ok).toBe(false);
    expect(result.expected).toBe(3);
    expect(result.actual).toBe(1);
  });
});