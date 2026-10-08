import { describe, it, expect, vi } from 'vitest';

// pouch'u mock'la — yalnızca saf dönüştürücüler test ediliyor
vi.mock('../../src/db/pouch', () => ({
  listDocsByPrefix: vi.fn(),
  upsertDoc: vi.fn(),
  upsertDocsBatch: vi.fn(),
}));

import {
  pcToApkProduct,
  apkProductToPcDoc,
  pcToApkCustomer,
  apkCustomerToPcDoc,
  pcToApkInvoice,
  apkInvoiceToPcDoc,
  NON_SYNCED_DOC_IDS,
  PC_PREFIX,
  LOCAL_PREFIX,
} from '../../src/db/schemaBridge';
import type { Customer, InvoiceRecord, Product } from '../../src/types';

describe('önek sabitleri', () => {
  it('PC ve APK önekleri beklenen değerlerde', () => {
    expect(PC_PREFIX).toEqual({ product: 'urun:', customer: 'kagent:', invoice: 'fatura:' });
    expect(LOCAL_PREFIX).toEqual({ product: 'product_', customer: 'customer_', invoice: 'invoice_' });
  });

  it('lisans belgesi senkronize edilmez', () => {
    expect(NON_SYNCED_DOC_IDS.has('license')).toBe(true);
  });
});

describe('pcToApkProduct', () => {
  it('PC alanları APK alanlarına birebir eşlenir', () => {
    const apk = pcToApkProduct({
      _id: 'urun:abc-1',
      ad: 'Çay',
      barkod: '8690001',
      ekBarkodlar: ['8690002'],
      kategori: 'İçecek',
      fiyat: 35.5,
      alisFiyati: 28,
      toptanFiyat: 32,
      stok: 12,
      minStok: 3,
      birim: 'adet',
      sonKullanmaTarihi: '2027-01-01',
      resimData: 'data:image/png;base64,x',
      depoId: 'depo-1',
    });
    expect(apk).toMatchObject({
      id: 'abc-1',
      name: 'Çay',
      barcode: '8690001',
      extraBarcodes: ['8690002'],
      category: 'İçecek',
      price: 35.5,
      purchasePrice: 28,
      wholesalePrice: 32,
      stock: 12,
      criticalStock: 3,
      unit: 'adet',
      expiryDate: '2027-01-01',
      imageUrl: 'data:image/png;base64,x',
      warehouseId: 'depo-1',
    });
  });

  it('_id öneksiz veya boşsa null döner', () => {
    expect(pcToApkProduct({ _id: 'urun:' })).toBeNull();
    expect(pcToApkProduct({ _id: '' })).toBeNull();
    expect(pcToApkProduct({})).toBeNull();
  });

  it('eksik alanlar güvenli varsayılanlarla dolar', () => {
    const apk = pcToApkProduct({ _id: 'urun:x1' });
    expect(apk).toMatchObject({ id: 'x1', name: '', price: 0, stock: 0, category: '' });
    expect(apk?.purchasePrice).toBeUndefined();
  });
});

describe('apkProductToPcDoc', () => {
  const product: Product = {
    id: 'p-9', sku: '', barcode: 'B1', name: 'Süt', category: 'Gıda',
    price: 20, purchasePrice: 15, wholesalePrice: 18, stock: 30,
    criticalStock: 5, unit: 'litr', expiryDate: '2026-12-01',
    imageType: 'milk', imageUrl: 'img', warehouseId: 'wh-1',
  };

  it('APK alanları PC belgesine eşlenir', () => {
    const doc = apkProductToPcDoc(product);
    expect(doc).toMatchObject({
      _id: 'urun:p-9',
      type: 'urun',
      ad: 'Süt',
      barkod: 'B1',
      kategori: 'Gıda',
      fiyat: 20,
      alisFiyati: 15,
      toptanFiyat: 18,
      stok: 30,
      minStok: 5,
      birim: 'litr',
      sonKullanmaTarihi: '2026-12-01',
      resimData: 'img',
      depoId: 'wh-1',
    });
  });

  it('createdAt/updatedAt zaman damgası eklenir', () => {
    const doc = apkProductToPcDoc(product);
    expect(Date.parse(String(doc.createdAt))).not.toBeNaN();
    expect(Date.parse(String(doc.updatedAt))).not.toBeNaN();
  });

  it('ROUND-TRIP: PC → APK → PC alan kaybı olmaz', () => {
    const pcDoc = {
      _id: 'urun:rt-1', ad: 'Çay', barkod: 'B', kategori: 'İçecek',
      fiyat: 35, alisFiyati: 28, toptanFiyat: 32, stok: 12, minStok: 3,
      birim: 'adet', sonKullanmaTarihi: '2027-01-01', resimData: 'img', depoId: 'd1',
    };
    const apk = pcToApkProduct(pcDoc)!;
    const back = apkProductToPcDoc(apk);
    expect(back).toMatchObject({
      _id: 'urun:rt-1', ad: 'Çay', barkod: 'B', kategori: 'İçecek',
      fiyat: 35, alisFiyati: 28, toptanFiyat: 32, stok: 12, minStok: 3,
      birim: 'adet', sonKullanmaTarihi: '2027-01-01', resimData: 'img', depoId: 'd1',
    });
  });
});

describe('müşteri dönüşümü', () => {
  it('pcToApkCustomer tip eşlemesi (musteri/personel/tedarikci)', () => {
    expect(pcToApkCustomer({ _id: 'kagent:1', tip: 'musteri' })?.type).toBe('customer');
    expect(pcToApkCustomer({ _id: 'kagent:2', tip: 'personel' })?.type).toBe('employee');
    expect(pcToApkCustomer({ _id: 'kagent:3', tip: 'tedarikci' })?.type).toBe('supplier');
    expect(pcToApkCustomer({ _id: 'kagent:4', tip: 'bilinmeyen' })?.type).toBe('customer');
  });

  it('pcToApkCustomer alan eşlemesi', () => {
    const apk = pcToApkCustomer({
      _id: 'kagent:c1', ad: 'Ahmet', telefon: '0555', adres: 'Merkez',
      bakiye: 150, borcLimiti: 1000, vadeGunu: 30, tip: 'musteri',
    });
    expect(apk).toMatchObject({
      id: 'c1', name: 'Ahmet', phone: '0555', addressNote: 'Merkez',
      balance: 150, creditLimit: 1000, dueDateDays: 30,
    });
  });

  it('apkCustomerToPcDoc ters eşleme', () => {
    const customer: Customer = {
      id: 'c2', name: 'Veli', phone: '0444', type: 'supplier',
      balance: -200, creditLimit: 500, dueDateDays: 15, addressNote: 'Sanayi', isActive: true,
    };
    const doc = apkCustomerToPcDoc(customer);
    expect(doc).toMatchObject({
      _id: 'kagent:c2', type: 'kagent', ad: 'Veli', telefon: '0444',
      tip: 'tedarikci', bakiye: -200, borcLimiti: 500, vadeGunu: 15, adres: 'Sanayi',
    });
  });

  it('ROUND-TRIP: müşteri PC → APK → PC', () => {
    const pc = { _id: 'kagent:rt', ad: 'A', telefon: '1', tip: 'personel', bakiye: 7, borcLimiti: 9, vadeGunu: 5, adres: 'x' };
    const back = apkCustomerToPcDoc(pcToApkCustomer(pc)!);
    expect(back).toMatchObject({ _id: 'kagent:rt', ad: 'A', tip: 'personel', bakiye: 7, borcLimiti: 9, vadeGunu: 5, adres: 'x' });
  });
});

describe('fatura dönüşümü', () => {
  const pcInvoice = {
    _id: 'fatura:i1',
    faturaNo: 'F-100',
    faturaTipi: 'satis',
    durum: 'onayli',
    kagentId: 'kagent:c1',
    kagentAd: 'Ahmet',
    tarih: '2026-10-01T10:00:00.000Z',
    depoId: 'd1',
    kalemler: [
      { urunId: 'u1', urunAd: 'Çay', birim: 'adet', miktar: 2, fiyat: 35, iskontoYuzde: 10 },
    ],
    araToplam: 70, iskontoToplam: 7, vergiToplam: 0, toplam: 63,
    odemeTipi: 'kart', odenenNakit: 70, paraUstu: 7,
  };

  it('pcToApkInvoice kalemler ve toplamlar eşlenir', () => {
    const apk = pcToApkInvoice(pcInvoice)!;
    expect(apk).toMatchObject({
      id: 'i1', invoiceNo: 'F-100', invoiceType: 'sales', status: 'completed',
      customerId: 'kagent:c1', customerName: 'Ahmet', subtotal: 70,
      discountTotal: 7, taxTotal: 0, amountDue: 63,
      paymentMethod: 'card', cashReceived: 70, changeDue: 7, warehouseId: 'd1',
    });
    expect(apk.items).toHaveLength(1);
    expect(apk.items[0]).toMatchObject({
      productId: 'u1', name: 'Çay', qty: 2, price: 35, unit: 'adet', percent: 10,
    });
  });

  it('faturaTipi/odemeTipi eşlemesi tüm varyantlar', () => {
    expect(pcToApkInvoice({ _id: 'fatura:a', faturaTipi: 'alis' })?.invoiceType).toBe('purchase');
    expect(pcToApkInvoice({ _id: 'fatura:b', faturaTipi: 'satis_iade' })?.invoiceType).toBe('sales_return');
    expect(pcToApkInvoice({ _id: 'fatura:c', faturaTipi: 'alis_iade' })?.invoiceType).toBe('purchase_return');
    expect(pcToApkInvoice({ _id: 'fatura:d', faturaTipi: 'transfer' })?.invoiceType).toBe('warehouse_move');
    expect(pcToApkInvoice({ _id: 'fatura:e', odemeTipi: 'nakit' })?.paymentMethod).toBe('cash');
    expect(pcToApkInvoice({ _id: 'fatura:f', odemeTipi: 'veresiye' })?.paymentMethod).toBe('credit');
    expect(pcToApkInvoice({ _id: 'fatura:g', odemeTipi: 'parca' })?.paymentMethod).toBe('split');
  });

  it('durum=iptal → status=voided', () => {
    expect(pcToApkInvoice({ _id: 'fatura:x', durum: 'iptal' })?.status).toBe('voided');
  });

  it('kalemler dizisi yoksa boş items', () => {
    const apk = pcToApkInvoice({ _id: 'fatura:y' })!;
    expect(apk.items).toEqual([]);
    expect(apk.itemCount).toBe(0);
  });

  it('apkInvoiceToPcDoc ters eşleme + kalem toplamı hesaplanır', () => {
    const invoice: InvoiceRecord = {
      id: 'i2', invoiceNo: 'F-200', invoiceType: 'sales_return', customerId: 'c1',
      customerName: 'Veli',
      items: [{ id: 'ci-1', productId: 'u1', sku: '', name: 'Süt', price: 20, qty: 3, imageType: 'default' }],
      itemCount: 1, subtotal: 60, discountTotal: 0, taxTotal: 6, amountDue: 66,
      paymentMethod: 'credit', cashReceived: 0, changeDue: 0, status: 'voided',
      createdAt: '2026-10-02T00:00:00.000Z', cashierName: 'K',
    };
    const doc = apkInvoiceToPcDoc(invoice);
    expect(doc).toMatchObject({
      _id: 'fatura:i2', type: 'fatura', faturaNo: 'F-200', faturaTipi: 'satis_iade',
      durum: 'iptal', kagentId: 'c1', odemeTipi: 'veresiye', toplam: 66,
    });
    const kalemler = doc.kalemler as Array<Record<string, unknown>>;
    expect(kalemler[0]).toMatchObject({ urunId: 'u1', miktar: 3, fiyat: 20, toplam: 60 });
  });

  it('ROUND-TRIP: fatura PC → APK → PC finansal değerler korunur', () => {
    const apk = pcToApkInvoice(pcInvoice)!;
    const back = apkInvoiceToPcDoc(apk);
    expect(back).toMatchObject({
      _id: 'fatura:i1', faturaNo: 'F-100', faturaTipi: 'satis',
      araToplam: 70, iskontoToplam: 7, vergiToplam: 0, toplam: 63,
      odemeTipi: 'kart', odenenNakit: 70, paraUstu: 7, durum: 'onayli',
    });
  });
});
