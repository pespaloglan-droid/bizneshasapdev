import { describe, it, expect } from 'vitest';
import {
  sanitizeProduct,
  sanitizeCustomer,
  sanitizeInvoice,
  sanitizeMoneyTx,
  sanitizeAppUser,
  sanitizeCurrency,
  sanitizeTargow,
  sanitizeRegion,
  sanitizeLedger,
  sanitizeWarehouse,
} from '../../src/db/sanitize';

describe('sanitizeProduct', () => {
  it('geçerli kayıt korunur', () => {
    const p = sanitizeProduct({
      id: 'p1', name: 'Çay', price: 35.5, stock: 12, barcode: 'B1',
      category: 'İçecek', sku: 'S1', imageType: 'cola',
    });
    expect(p).toMatchObject({ id: 'p1', name: 'Çay', price: 35.5, stock: 12, imageType: 'cola' });
  });

  it('id yoksa null döner', () => {
    expect(sanitizeProduct({ name: 'X' })).toBeNull();
    expect(sanitizeProduct(null)).toBeNull();
    expect(sanitizeProduct('string')).toBeNull();
  });

  it('bozuk sayılar 0 olur, eksik isim — olur', () => {
    const p = sanitizeProduct({ id: 'p2', price: 'otuz', stock: NaN, name: undefined });
    expect(p?.price).toBe(0);
    expect(p?.stock).toBe(0);
    expect(p?.name).toBe('—');
  });

  it('bilinmeyen imageType default olur', () => {
    expect(sanitizeProduct({ id: 'p3', imageType: 'ufo' })?.imageType).toBe('default');
  });

  it('extraBarcodes yalnızca string öğeleri tutar', () => {
    const p = sanitizeProduct({ id: 'p4', extraBarcodes: ['a', 5, null, 'b'] });
    expect(p?.extraBarcodes).toEqual(['a', 'b']);
  });

  it('allowNegativeStock yalnızca true ise true', () => {
    expect(sanitizeProduct({ id: 'p5', allowNegativeStock: 1 })?.allowNegativeStock).toBe(false);
    expect(sanitizeProduct({ id: 'p6', allowNegativeStock: true })?.allowNegativeStock).toBe(true);
  });
});

describe('sanitizeCustomer', () => {
  it('tip beyaz listeden değilse customer olur', () => {
    expect(sanitizeCustomer({ id: 'c1', type: 'hacker' })?.type).toBe('customer');
    expect(sanitizeCustomer({ id: 'c2', type: 'supplier' })?.type).toBe('supplier');
  });

  it('bakiye bozuksa 0', () => {
    expect(sanitizeCustomer({ id: 'c3', balance: 'borçlu' })?.balance).toBe(0);
  });

  it('id yoksa null', () => {
    expect(sanitizeCustomer({})).toBeNull();
  });
});

describe('sanitizeInvoice', () => {
  it('varsayılanlar: sales / cash / completed', () => {
    const inv = sanitizeInvoice({ id: 'i1' });
    expect(inv).toMatchObject({
      invoiceType: 'sales', paymentMethod: 'cash', status: 'completed',
      amountDue: 0, itemCount: 0,
    });
  });

  it('voided durumu korunur, bilinmeyen durum completed olur', () => {
    expect(sanitizeInvoice({ id: 'i2', status: 'voided' })?.status).toBe('voided');
    expect(sanitizeInvoice({ id: 'i3', status: 'yarım' })?.status).toBe('completed');
  });

  it('kalemler temizlenir: bozuk qty 1 olur, bilinmeyen alanlar atılır', () => {
    const inv = sanitizeInvoice({
      id: 'i4',
      items: [{ productId: 'u1', qty: 0, price: 'x' }],
    });
    expect(inv?.items[0]).toMatchObject({ productId: 'u1', qty: 1, price: 0 });
  });

  it('itemCount eksikse kalem sayısı kullanılır', () => {
    const inv = sanitizeInvoice({ id: 'i5', items: [{}, {}, {}] });
    expect(inv?.itemCount).toBe(3);
  });

  it('bilinmeyen invoiceType/paymentMethod varsayılana döner', () => {
    const inv = sanitizeInvoice({ id: 'i6', invoiceType: 'ufo', paymentMethod: 'bitcoin' });
    expect(inv?.invoiceType).toBe('sales');
    expect(inv?.paymentMethod).toBe('cash');
  });

  it('id yoksa null', () => {
    expect(sanitizeInvoice({ invoiceNo: 'F-1' })).toBeNull();
  });
});

describe('sanitizeMoneyTx', () => {
  it('expense dışındaki type income olur', () => {
    expect(sanitizeMoneyTx({ id: 't1', type: 'transfer' })?.type).toBe('income');
    expect(sanitizeMoneyTx({ id: 't2', type: 'expense' })?.type).toBe('expense');
  });

  it('amount bozuksa 0', () => {
    expect(sanitizeMoneyTx({ id: 't3', amount: 'çok' })?.amount).toBe(0);
  });

  it('id yoksa null', () => {
    expect(sanitizeMoneyTx({ amount: 5 })).toBeNull();
  });
});

describe('sanitizeCurrency', () => {
  it('kod büyük harfe çevrilir, rate 0 ise 1 olur', () => {
    const c = sanitizeCurrency({ id: 'cur1', code: 'usd', rate: 0 });
    expect(c?.code).toBe('USD');
    expect(c?.rate).toBe(1);
  });

  it('id veya kod yoksa null', () => {
    expect(sanitizeCurrency({ id: 'cur2' })).toBeNull();
    expect(sanitizeCurrency({ code: 'EUR' })).toBeNull();
  });

  it('symbol/name eksikse koddan türetilir', () => {
    const c = sanitizeCurrency({ id: 'cur3', code: 'EUR', rate: 38 });
    expect(c?.symbol).toBe('EU');
    expect(c?.name).toBe('EUR');
  });
});

describe('diğer varlıklar', () => {
  it('sanitizeAppUser: isActive varsayılan true, fullName username\'den türetilir', () => {
    const u = sanitizeAppUser({ id: 'u1', username: 'kasir1' });
    expect(u?.isActive).toBe(true);
    expect(u?.fullName).toBe('kasir1');
    expect(sanitizeAppUser({ username: 'x' })).toBeNull();
  });

  it('sanitizeTargow: regionIds yalnızca string, isActive varsayılan true', () => {
    const t = sanitizeTargow({ id: 'tg1', regionIds: ['r1', 42], isActive: 0 });
    expect(t?.regionIds).toEqual(['r1']);
    expect(t?.isActive).toBe(true);
  });

  it('sanitizeRegion: id+name zorunlu', () => {
    expect(sanitizeRegion({ id: 'r1' })).toBeNull();
    expect(sanitizeRegion({ name: 'Ahal' })).toBeNull();
    expect(sanitizeRegion({ id: 'r1', name: 'Ahal' })).toMatchObject({ id: 'r1', name: 'Ahal' });
  });

  it('sanitizeLedger: currency varsayılan TMT, permissions nesne olmalı', () => {
    const l = sanitizeLedger({ id: 'l1', currency: '', permissions: 'bozuk' });
    expect(l?.currency).toBe('TMT');
    expect(l?.permissions).toEqual({});
  });

  it('sanitizeWarehouse: id zorunlu', () => {
    expect(sanitizeWarehouse({ name: 'Depo' })).toBeNull();
    expect(sanitizeWarehouse({ id: 'w1', name: 'Depo' })).toMatchObject({ id: 'w1', name: 'Depo' });
  });
});
