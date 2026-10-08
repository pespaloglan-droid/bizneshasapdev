import { describe, it, expect } from 'vitest';
import type { Customer, CurrencyRate, InvoiceRecord, Ledger, MoneyTransaction, Product } from '../../src/types';
import {
  invoiceTmt,
  invoiceRevenue,
  receivables,
  totalReceivables,
  supplierDebts,
  stockValuation,
  ledgerRows,
  totalLedgerTmt,
  productSales,
} from '../../src/utils/calcAssets';

const WINDOW = {
  from: new Date(2026, 9, 1, 0, 0, 0),
  to: new Date(2026, 9, 8, 0, 0, 0),
};

let seq = 0;
const nextId = (p: string) => `${p}-${++seq}`;

function product(overrides: Partial<Product>): Product {
  return {
    id: nextId('prd'),
    sku: 'SKU',
    barcode: '123',
    name: 'Ürün',
    category: 'Genel',
    price: 10,
    stock: 5,
    imageType: 'default',
    ...overrides,
  };
}

function customer(overrides: Partial<Customer>): Customer {
  return {
    id: nextId('cst'),
    name: 'Müşteri',
    type: 'customer',
    balance: 0,
    isActive: true,
    ...overrides,
  };
}

function invoice(overrides: Partial<InvoiceRecord>): InvoiceRecord {
  return {
    id: nextId('inv'),
    invoiceNo: 'F-1',
    invoiceType: 'sales',
    customerId: null,
    customerName: '',
    items: [],
    itemCount: 0,
    subtotal: 0,
    discountTotal: 0,
    taxTotal: 0,
    amountDue: 100,
    paymentMethod: 'cash',
    cashReceived: 100,
    changeDue: 0,
    status: 'completed',
    createdAt: '2026-10-05T10:00:00.000Z',
    cashierName: 'Kasiyer',
    ...overrides,
  };
}

function tx(overrides: Partial<MoneyTransaction>): MoneyTransaction {
  return {
    id: nextId('tx'),
    type: 'income',
    date: '2026-10-05',
    amount: 100,
    paymentMethod: 'cash',
    category: 'weresiye_yygnamak',
    createdAt: '2026-10-05T10:00:00.000Z',
    ...overrides,
  };
}

describe('invoiceTmt / invoiceRevenue', () => {
  it('amountTmt varsa o kullanılır', () => {
    expect(invoiceTmt(invoice({ amountDue: 10, amountTmt: 35 }))).toBe(35);
    expect(invoiceTmt(invoice({ amountDue: 42 }))).toBe(42);
  });

  it('pencere içi sayılan faturalar toplanır', () => {
    const revenue = invoiceRevenue(
      [
        invoice({ amountDue: 200 }),
        invoice({ amountDue: 50, amountTmt: 175 }),
        invoice({ amountDue: 999, createdAt: '2026-08-01T10:00:00.000Z' }), // pencere dışı
      ],
      WINDOW
    );
    expect(revenue).toBe(375);
  });

  it('iptal (voided) faturalar sayılmaz', () => {
    const revenue = invoiceRevenue(
      [invoice({ amountDue: 100 }), invoice({ amountDue: 500, status: 'voided' })],
      WINDOW
    );
    expect(revenue).toBe(100);
  });

  it('bekleyen/reddedilen taslaklar sayılmaz', () => {
    const revenue = invoiceRevenue(
      [
        invoice({ amountDue: 100 }),
        invoice({ amountDue: 300, draftStatus: 'pending' }),
        invoice({ amountDue: 400, draftStatus: 'rejected' }),
      ],
      WINDOW
    );
    expect(revenue).toBe(100);
  });
});

describe('receivables', () => {
  it('pozitif bakiyeli müşteriler borçlu listelenir, bakiyeye göre sıralanır', () => {
    const rows = receivables(
      [
        customer({ name: 'A', balance: 50 }),
        customer({ name: 'B', balance: 300 }),
        customer({ name: 'C', balance: 0 }), // bakiyesiz listede yok
        customer({ name: 'D', balance: -20 }), // alacaklı (negatif) yok
      ],
      []
    );
    expect(rows.map((r) => r.name)).toEqual(['B', 'A']);
    expect(totalReceivables(rows)).toBe(350);
  });

  it('tedarikçiler müşteri alacağına KARIŞMAZ', () => {
    const rows = receivables(
      [customer({ type: 'supplier', balance: 500 }), customer({ balance: 100 })],
      []
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].balance).toBe(100);
  });

  it('son weresiye ödeme tarihi bulunur', () => {
    const c = customer({ balance: 100 });
    const rows = receivables(
      [c],
      [
        tx({ customerId: c.id, date: '2026-09-01' }),
        tx({ customerId: c.id, date: '2026-10-02' }), // en yeni
        tx({ customerId: c.id, category: 'hyzmat_toleg', date: '2026-10-06' }), // farklı kategori sayılmaz
      ]
    );
    expect(rows[0].lastPayment).toBe('2026-10-02');
  });

  it('ödeme yoksa lastPayment null', () => {
    expect(receivables([customer({ balance: 10 })], [])[0].lastPayment).toBeNull();
  });
});

describe('supplierDebts', () => {
  it('negatif bakiyeli tedarikçi borçları mutlak toplanır', () => {
    const debt = supplierDebts([
      customer({ type: 'supplier', balance: -300 }),
      customer({ type: 'supplier', balance: -150 }),
      customer({ type: 'supplier', balance: 50 }), // pozitif bakiye borç değil
      customer({ type: 'customer', balance: -400 }), // müşteri değil
    ]);
    expect(debt).toBe(450);
  });
});

describe('stockValuation', () => {
  it('stok değeri = miktar × birim fiyat (alış ve satış ayrı)', () => {
    const v = stockValuation([
      product({ stock: 10, purchasePrice: 5, price: 8 }),
      product({ stock: 4, purchasePrice: 20, price: 30 }),
    ]);
    expect(v.skuCount).toBe(2);
    expect(v.totalQty).toBe(14);
    expect(v.purchaseValue).toBe(10 * 5 + 4 * 20); // 130
    expect(v.saleValue).toBe(10 * 8 + 4 * 30); // 200
  });

  it('alış fiyatı bilinmeyen ürün 0 maliyet sayılır', () => {
    const v = stockValuation([product({ stock: 3, purchasePrice: undefined, price: 10 })]);
    expect(v.purchaseValue).toBe(0);
    expect(v.saleValue).toBe(30);
  });

  it('kritik stok listesi eşikte ve altında, az çoktan sıralı', () => {
    const v = stockValuation([
      product({ name: 'A', stock: 1, criticalStock: 5 }),
      product({ name: 'B', stock: 5, criticalStock: 5 }), // eşik dahil
      product({ name: 'C', stock: 8, criticalStock: 5 }), // üstünde, listede yok
      product({ name: 'D', stock: 0, criticalStock: undefined }), // eşik tanımsız
    ]);
    expect(v.critical.map((p) => p.name)).toEqual(['A', 'B']);
  });

  it('boş listede sıfırlar', () => {
    expect(stockValuation([])).toEqual({
      skuCount: 0, totalQty: 0, purchaseValue: 0, saleValue: 0, critical: [],
    });
  });
});

describe('ledgerRows', () => {
  const ledger = (overrides: Partial<Ledger>): Ledger => ({
    id: nextId('lgr'),
    name: 'Ana Kasa',
    currency: 'TMT',
    openingBalance: 0,
    isActive: true,
    permissions: {},
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  });

  it('bakiye = açılış + gelir − gider (yalnızca o defterin işlemleri)', () => {
    const l1 = ledger({ openingBalance: 100 });
    const l2 = ledger({});
    const rows = ledgerRows(
      [l1, l2],
      [
        tx({ ledgerId: l1.id, type: 'income', amount: 50 }),
        tx({ ledgerId: l1.id, type: 'expense', amount: 30 }),
        tx({ ledgerId: l2.id, type: 'income', amount: 999 }), // başka defter
        tx({ ledgerId: undefined, type: 'income', amount: 77 }), // deftersiz
      ],
      []
    );
    expect(rows[0].balance).toBe(120);
    expect(rows[1].balance).toBe(999);
  });

  it('yabancı para bakiyesi kura göre TMT\'ye çevrilir', () => {
    const usd = ledger({ currency: 'USD', openingBalance: 10 });
    const currencies: CurrencyRate[] = [
      { id: 'cur-1', code: 'USD', name: 'Dollar', symbol: '$', rate: 34.5, isActive: true, createdAt: '' },
    ];
    const rows = ledgerRows([usd], [], currencies);
    expect(rows[0].balance).toBe(10);
    expect(rows[0].balanceTmt).toBe(345);
  });

  it('kur bilinmiyorsa 1 kabul edilir', () => {
    const eur = ledger({ currency: 'EUR', openingBalance: 7 });
    const rows = ledgerRows([eur], [], []);
    expect(rows[0].balanceTmt).toBe(7);
  });

  it('totalLedgerTmt satırları toplar', () => {
    const rows = ledgerRows(
      [ledger({ openingBalance: 100 }), ledger({ openingBalance: 250 })],
      [],
      []
    );
    expect(totalLedgerTmt(rows)).toBe(350);
  });
});

describe('productSales', () => {
  const inv = (items: { productId: string; name: string; price: number; qty: number }[]) =>
    invoice({ items: items.map((i) => ({ id: nextId('ci'), sku: '', imageType: 'default' as const, ...i })) });

  it('ürün bazında miktar ve tutar toplar, top sıralar', () => {
    const rows = productSales(
      [
        inv([
          { productId: 'p1', name: 'Ekmek', price: 5, qty: 10 },
          { productId: 'p2', name: 'Süt', price: 20, qty: 2 },
        ]),
        inv([{ productId: 'p1', name: 'Ekmek', price: 5, qty: 5 }]),
      ],
      WINDOW,
      10,
      'top'
    );
    expect(rows[0]).toMatchObject({ productId: 'p1', qty: 15, amount: 75 });
    expect(rows[1]).toMatchObject({ productId: 'p2', qty: 2, amount: 40 });
  });

  it('bottom yönü en az satanı öne alır', () => {
    const rows = productSales(
      [
        inv([
          { productId: 'p1', name: 'A', price: 100, qty: 1 },
          { productId: 'p2', name: 'B', price: 1, qty: 1 },
        ]),
      ],
      WINDOW,
      10,
      'bottom'
    );
    expect(rows[0].productId).toBe('p2');
  });

  it('limit uygulanır', () => {
    const invoices = Array.from({ length: 20 }, (_, i) =>
      inv([{ productId: `p${i}`, name: `U${i}`, price: i + 1, qty: 1 }])
    );
    expect(productSales(invoices, WINDOW, 5, 'top')).toHaveLength(5);
  });

  it('voided fatura kalemleri sayılmaz', () => {
    const rows = productSales(
      [invoice({ status: 'voided', items: inv([{ productId: 'p1', name: 'A', price: 10, qty: 1 }]).items })],
      WINDOW,
      10,
      'top'
    );
    expect(rows).toHaveLength(0);
  });

  it('pencere dışı faturalar sayılmaz', () => {
    const rows = productSales(
      [invoice({ createdAt: '2026-01-01T00:00:00.000Z', items: inv([{ productId: 'p1', name: 'A', price: 10, qty: 1 }]).items })],
      WINDOW,
      10,
      'top'
    );
    expect(rows).toHaveLength(0);
  });
});
