import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  periodWindow,
  inWindow,
  trendGranularity,
  trendBuckets,
  CALC_PERIODS,
} from '../../src/utils/calcPeriods';

/** 2026-10-08 15:30 yerel saat — raporun "şu an" noktası. */
const NOW = new Date(2026, 9, 8, 15, 30, 0);

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('periodWindow', () => {
  it('today: gün başından şimdiye', () => {
    const w = periodWindow('today', '', '');
    expect(w.from).toEqual(new Date(2026, 9, 8, 0, 0, 0));
    expect(w.to.getTime()).toBeGreaterThan(NOW.getTime());
  });

  it('week: 6 gün öncesinden şimdiye (7 günlük pencere)', () => {
    const w = periodWindow('week', '', '');
    expect(w.from).toEqual(new Date(2026, 9, 2, 0, 0, 0));
  });

  it('month: ayın 1\'inden şimdiye', () => {
    const w = periodWindow('month', '', '');
    expect(w.from).toEqual(new Date(2026, 9, 1, 0, 0, 0));
  });

  it('lastMonth: önceki ayın tamamı (1 Eylül – 1 Ekim)', () => {
    const w = periodWindow('lastMonth', '', '');
    expect(w.from).toEqual(new Date(2026, 8, 1, 0, 0, 0));
    expect(w.to).toEqual(new Date(2026, 9, 1, 0, 0, 0));
  });

  it('quarter: çeyreğin ilk ayının 1\'i (Ekim → 1 Ekim)', () => {
    const w = periodWindow('quarter', '', '');
    expect(w.from).toEqual(new Date(2026, 9, 1, 0, 0, 0));
  });

  it('quarter: yıl ortasında doğru çeyrek başlangıcı (Mayıs → 1 Nisan)', () => {
    vi.setSystemTime(new Date(2026, 4, 20, 10, 0, 0));
    const w = periodWindow('quarter', '', '');
    expect(w.from).toEqual(new Date(2026, 3, 1, 0, 0, 0));
  });

  it('year: yılın ilk gününden şimdiye', () => {
    const w = periodWindow('year', '', '');
    expect(w.from).toEqual(new Date(2026, 0, 1, 0, 0, 0));
  });

  it('custom: verilen tarih aralığı (bitiş günü dahil)', () => {
    const w = periodWindow('custom', '2026-09-10', '2026-09-15');
    expect(w.from).toEqual(new Date(2026, 8, 10, 0, 0, 0));
    expect(w.to).toEqual(new Date(2026, 8, 16, 0, 0, 0)); // 15. gün dahil olsun diye +1
  });

  it('custom: bitiş başlangıçtan önceyse 1 günlük pencereye düzeltilir', () => {
    const w = periodWindow('custom', '2026-09-15', '2026-09-10');
    expect(w.to.getTime()).toBe(w.from.getTime() + 86400000);
  });

  it('custom: boş/bozuk tarihlerde bugüne düşer', () => {
    const w = periodWindow('custom', '', 'tarih-degil');
    expect(w.from).toEqual(new Date(2026, 9, 8, 0, 0, 0));
    expect(w.to.getTime()).toBeGreaterThan(w.from.getTime());
  });

  it('bilinmeyen period today ile aynı pencereyi verir', () => {
    const w = periodWindow('bilinmeyen' as never, '', '');
    expect(w.from).toEqual(new Date(2026, 9, 8, 0, 0, 0));
  });

  it('tüm tanımlı periodlar geçerli pencere üretir', () => {
    for (const p of CALC_PERIODS) {
      const w = periodWindow(p.id, '2026-09-01', '2026-09-30');
      expect(w.from.getTime()).toBeLessThan(w.to.getTime());
    }
  });
});

describe('inWindow', () => {
  const window = { from: new Date(2026, 9, 1), to: new Date(2026, 9, 8) };

  it('pencere içi tarih true', () => {
    expect(inWindow('2026-10-05T12:00:00', window)).toBe(true);
  });

  it('başlangıç sınırı dahil', () => {
    expect(inWindow(new Date(2026, 9, 1).toISOString(), window)).toBe(true);
  });

  it('bitiş sınırı HARİÇ', () => {
    expect(inWindow(new Date(2026, 9, 8).toISOString(), window)).toBe(false);
  });

  it('pencere öncesi false', () => {
    expect(inWindow('2026-09-30T23:59:59', window)).toBe(false);
  });

  it('bozuk tarih false (sessiz patlama yok)', () => {
    expect(inWindow('gecersiz', window)).toBe(false);
    expect(inWindow('', window)).toBe(false);
  });
});

describe('trendGranularity', () => {
  const days = (n: number) => ({
    from: new Date(2026, 0, 1),
    to: new Date(2026, 0, 1 + n),
  });

  it('31 gün ve altı daily', () => {
    expect(trendGranularity(days(31))).toBe('daily');
    expect(trendGranularity(days(1))).toBe('daily');
  });

  it('32–120 gün weekly', () => {
    expect(trendGranularity(days(32))).toBe('weekly');
    expect(trendGranularity(days(120))).toBe('weekly');
  });

  it('120 gün üstü monthly', () => {
    expect(trendGranularity(days(121))).toBe('monthly');
    expect(trendGranularity(days(400))).toBe('monthly');
  });
});

describe('trendBuckets', () => {
  it('daily: her gün bir kova, GG.AA etiketi', () => {
    const buckets = trendBuckets({ from: new Date(2026, 9, 1), to: new Date(2026, 9, 4) });
    expect(buckets).toHaveLength(3);
    expect(buckets[0].label).toBe('01.10');
    expect(buckets[2].label).toBe('03.10');
    // kovalar ardışık ve 1 günlük
    expect(buckets[0].to).toEqual(buckets[1].from);
  });

  it('daily: 62 kova üst sınırı aşılmaz', () => {
    // 31 günden fazla → weekly'ye geçer; daily sınırını test için doğrudan
    // from/to farkını 31 günde tutuyoruz, kova sayısı ≤ 62
    const buckets = trendBuckets({ from: new Date(2026, 0, 1), to: new Date(2026, 1, 1) });
    expect(buckets.length).toBeLessThanOrEqual(62);
  });

  it('weekly: 7 günlük kovalar', () => {
    const buckets = trendBuckets({ from: new Date(2026, 0, 1), to: new Date(2026, 3, 1) });
    expect(buckets.length).toBeGreaterThan(1);
    expect(buckets[1].from.getTime() - buckets[0].from.getTime()).toBe(7 * 86400000);
  });

  it('weekly: 30 kova üst sınırı', () => {
    const buckets = trendBuckets({ from: new Date(2026, 0, 1), to: new Date(2026, 3, 1) });
    expect(buckets.length).toBeLessThanOrEqual(30);
  });

  it('monthly: AA.YYYY etiketi, ay sınırlarında', () => {
    const buckets = trendBuckets({ from: new Date(2025, 0, 15), to: new Date(2026, 6, 1) });
    expect(buckets[0].label).toBe('01.2025');
    expect(buckets[0].from).toEqual(new Date(2025, 0, 1));
    expect(buckets[1].from).toEqual(new Date(2025, 1, 1));
    expect(buckets.length).toBeLessThanOrEqual(24);
  });
});
