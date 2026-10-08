import { describe, it, expect } from 'vitest';
import type { MoneyTransaction } from '../../src/types';
import {
  moneyTmt,
  flowTotals,
  categoryRows,
  flowTrend,
  paymentMix,
  paymentMixTotal,
  borrowedTotal,
  lentTotal,
} from '../../src/utils/calcFlow';

const WINDOW = {
  from: new Date(2026, 9, 1, 0, 0, 0),
  to: new Date(2026, 9, 8, 0, 0, 0),
};

let seq = 0;
function tx(overrides: Partial<MoneyTransaction>): MoneyTransaction {
  seq += 1;
  return {
    id: `tx-${seq}`,
    type: 'income',
    date: '2026-10-05',
    amount: 100,
    paymentMethod: 'cash',
    category: 'haryt_satuw',
    createdAt: '2026-10-05T10:00:00.000Z',
    ...overrides,
  };
}

describe('moneyTmt', () => {
  it('amountTmt varsa onu kullanır (dövizli işlem)', () => {
    expect(moneyTmt(tx({ amount: 10, amountTmt: 35 }))).toBe(35);
  });

  it('amountTmt yoksa amount kullanılır (TMT işlem)', () => {
    expect(moneyTmt(tx({ amount: 42 }))).toBe(42);
  });
});

describe('flowTotals', () => {
  it('gelir/gider dengesi doğru hesaplanır', () => {
    const totals = flowTotals(
      [
        tx({ type: 'income', amount: 200 }),
        tx({ type: 'income', amount: 50, amountTmt: 175 }),
        tx({ type: 'expense', amount: 120 }),
      ],
      WINDOW
    );
    expect(totals.income).toBe(375); // 200 + 175 (amountTmt tercih edilir)
    expect(totals.expense).toBe(120);
    expect(totals.net).toBe(255);
  });

  it('pencere dışı işlemler dahil edilmez', () => {
    const totals = flowTotals(
      [
        tx({ date: '2026-10-05', amount: 100 }),
        tx({ date: '2026-09-15', amount: 999 }), // pencere öncesi
        tx({ date: '2026-10-08', amount: 888 }), // bitiş günü = to (hariç)
      ],
      WINDOW
    );
    expect(totals.income).toBe(100);
  });

  it('sıfır işlem durumunda 0 döner', () => {
    expect(flowTotals([], WINDOW)).toEqual({ income: 0, expense: 0, net: 0 });
  });

  it('gider gelirden büyükse net negatiftir', () => {
    const totals = flowTotals(
      [tx({ type: 'income', amount: 50 }), tx({ type: 'expense', amount: 300 })],
      WINDOW
    );
    expect(totals.net).toBe(-250);
  });
});

describe('categoryRows', () => {
  it('kategoriye göre gruplar, toplam ve adet sayar, büyükten küçüğe sıralar', () => {
    const rows = categoryRows(
      [
        tx({ category: 'hyzmat_toleg', amount: 300 }),
        tx({ category: 'hyzmat_toleg', amount: 100 }),
        tx({ category: 'basga_girdeji', amount: 200 }),
      ],
      WINDOW,
      'income'
    );
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ id: 'hyzmat_toleg', total: 400, count: 2 });
    expect(rows[1]).toMatchObject({ id: 'basga_girdeji', total: 200, count: 1 });
    expect(rows[0].label).toBeTruthy();
  });

  it('istenmeyen türdeki işlemleri saymaz', () => {
    const rows = categoryRows(
      [tx({ type: 'expense', category: 'aylyk', amount: 500 })],
      WINDOW,
      'income'
    );
    expect(rows).toHaveLength(0);
  });

  it('pencere dışı işlemleri saymaz', () => {
    const rows = categoryRows(
      [tx({ date: '2026-08-01', amount: 100 })],
      WINDOW,
      'income'
    );
    expect(rows).toHaveLength(0);
  });
});

describe('flowTrend', () => {
  it('günlük kovalara gelir/gider dağıtır', () => {
    const trend = flowTrend(
      [
        tx({ type: 'income', date: '2026-10-02', amount: 10 }),
        tx({ type: 'income', date: '2026-10-02', amount: 20 }),
        tx({ type: 'expense', date: '2026-10-03', amount: 5 }),
      ],
      WINDOW
    );
    const day2 = trend.find((p) => p.label === '02.10');
    const day3 = trend.find((p) => p.label === '03.10');
    expect(day2).toMatchObject({ income: 30, expense: 0 });
    expect(day3).toMatchObject({ income: 0, expense: 5 });
  });

  it('bozuk tarihli işlemler sessizce atlanır', () => {
    const trend = flowTrend([tx({ date: 'bozuk-tarih', amount: 500 })], WINDOW);
    const total = trend.reduce((s, p) => s + p.income, 0);
    expect(total).toBe(0);
  });
});

describe('paymentMix', () => {
  it('yalnızca gelir işlemlerini ödeme yöntemine göre toplar', () => {
    const mix = paymentMix(
      [
        tx({ paymentMethod: 'cash', amount: 100 }),
        tx({ paymentMethod: 'card', amount: 250 }),
        tx({ paymentMethod: 'cash', amount: 50 }),
        tx({ type: 'expense', paymentMethod: 'cash', amount: 999 }), // gider sayılmaz
      ],
      WINDOW
    );
    expect(mix).toHaveLength(2);
    expect(mix[0]).toMatchObject({ method: 'card', total: 250, label: 'Bank kart' });
    expect(mix[1]).toMatchObject({ method: 'cash', total: 150, label: 'Nagt' });
  });

  it('paymentMixTotal satırları toplar', () => {
    const mix = paymentMix([tx({ amount: 70 }), tx({ paymentMethod: 'transfer', amount: 30 })], WINDOW);
    expect(paymentMixTotal(mix)).toBe(100);
  });
});

describe('karz toplamları', () => {
  it('borrowedTotal yalnızca karz_almak', () => {
    const total = borrowedTotal(
      [
        tx({ category: 'karz_almak', amount: 400 }),
        tx({ category: 'hyzmat_toleg', amount: 100 }),
      ],
      WINDOW
    );
    expect(total).toBe(400);
  });

  it('lentTotal yalnızca karz_bermek', () => {
    const total = lentTotal(
      [
        tx({ type: 'expense', category: 'karz_bermek', amount: 250 }),
        tx({ type: 'expense', category: 'aylyk', amount: 900 }),
      ],
      WINDOW
    );
    expect(total).toBe(250);
  });

  it('pencere dışı karz sayılmaz', () => {
    expect(borrowedTotal([tx({ category: 'karz_almak', date: '2026-01-01' })], WINDOW)).toBe(0);
  });
});
