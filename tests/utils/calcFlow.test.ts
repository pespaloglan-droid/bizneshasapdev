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

import { historyRows, historyColumns, validHistoryFilter } from '../../src/utils/historyExports';
import type { InvoiceRecord } from '../../src/types';
describe('ayrıntılı Excel geçmişi sözleşmesi', () => {
  const invoice = { id:'i',invoiceNo:'INV-1',createdAt:'2026-10-01T12:00:00Z',invoiceType:'sales',status:'completed',customerId:'c',customerName:'Test',paymentMethod:'credit',currency:'USD',amountDue:100,paidAmount:40,remainingDebt:60,items:[{id:'line',productId:'p',sku:'0001',name:'Tea',qty:2,unit:'Box'}] } as InvoiceRecord;
  const filter = {from:'2026-10-01',to:'2026-10-31'};
  it('Türkmençe başlıklar ve sıfırlı SKU korunur, mevcut çarpan geçmişe uygulanmaz', () => {
    const rows=historyRows('stock',[invoice],[],[],filter);
    expect(rows[0][4]).toBe('0001');expect(rows[0][6]).toBe('Box');expect(rows[0][7]).toBe(-2);
    expect(historyColumns('stock')[5].header).toBe('Haryt');
  });
  it('aralık dışı faturanın aralık içindeki iptalini hareket olarak gösterir', () => {
    const cancelled={...invoice,createdAt:'2026-09-01',status:'voided',voidedAt:'2026-10-15'} as InvoiceRecord;
    const rows=historyRows('stock',[cancelled],[],[],filter);
    expect(rows).toHaveLength(1);expect(rows[0][2]).toBe('void');expect(rows[0][7]).toBe(2);
  });
  it('bekleyen taslak stok hareketi sayılmaz; para birimi ayrı korunur', () => {
    expect(historyRows('stock',[{...invoice,draftStatus:'pending'}],[],[],filter)).toHaveLength(0);
    expect(historyRows('sales',[invoice],[],[],filter)[0][7]).toBe('USD');
    expect(historyRows('sales',[invoice],[],[],{...filter,customerId:'other'})).toHaveLength(0);
  });
  it('kalan borç ikinci kez tahsilat çıkarılarak azaltılmaz', () => {
    const rows=historyRows('debt',[invoice],[],[],filter);expect(rows[0][7]).toBe(60);
  });
  it('ters ve gerçek olmayan tarih aralığını reddeder', () => {
    expect(validHistoryFilter({from:'2026-10-31',to:'2026-10-01'})).toBe(false);
    expect(validHistoryFilter({from:'2026-02-30',to:''})).toBe(false);
  });
});
