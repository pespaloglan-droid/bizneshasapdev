import { describe, it, expect, beforeEach } from 'vitest';
import {
  convertToTmt,
  rateForCode,
  isCurrencyCodeUnique,
  generateCurrencyId,
  BASE_CURRENCY_CODE,
  COMMON_CURRENCIES,
  DEFAULT_BASE_CURRENCY,
  applyBaseCurrency,
  setBaseCurrency,
  getBaseCurrency,
  getBaseCurrencyCode,
  commonCurrency,
  ensureBaseCurrencySeeded,
  isCurrencyInUse,
} from '../../src/db/currencyService';
import type { CurrencyRate } from '../../src/types';

describe('currencyService', () => {
  const mockCurrencies: CurrencyRate[] = [
    {
      id: 'cur-usd',
      code: 'USD',
      name: 'ABŞ dollary',
      symbol: '$',
      rate: 35.0,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'cur-eur',
      code: 'EUR',
      name: 'Ýewro',
      symbol: '€',
      rate: 38.5,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'cur-rub',
      code: 'RUB',
      name: 'Rus rubly',
      symbol: '₽',
      rate: 0.38,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ];

  describe('convertToTmt', () => {
    it('should convert amount to TMT correctly', () => {
      expect(convertToTmt(100, 35.0)).toBe(3500);
      expect(convertToTmt(1, 38.5)).toBe(38.5);
      expect(convertToTmt(1000, 0.38)).toBe(380);
    });

    it('should round to 2 decimal places', () => {
      expect(convertToTmt(100.123, 1.234)).toBe(123.55);
      expect(convertToTmt(1.111, 3.333)).toBe(3.7);
    });

    it('should handle zero amounts', () => {
      expect(convertToTmt(0, 35.0)).toBe(0);
      expect(convertToTmt(100, 0)).toBe(0);
    });

    it('should handle invalid inputs gracefully', () => {
      expect(convertToTmt(NaN, 35.0)).toBe(0);
      expect(convertToTmt(100, NaN)).toBe(0);
      expect(convertToTmt(Infinity, 35.0)).toBe(0);
      expect(convertToTmt(100, Infinity)).toBe(0);
    });

    it('should handle negative amounts', () => {
      expect(convertToTmt(-100, 35.0)).toBe(-3500);
      expect(convertToTmt(100, -35.0)).toBe(-3500);
    });
  });

  describe('rateForCode', () => {
    it('should return correct rate for existing currency', () => {
      expect(rateForCode(mockCurrencies, 'USD')).toBe(35.0);
      expect(rateForCode(mockCurrencies, 'EUR')).toBe(38.5);
      expect(rateForCode(mockCurrencies, 'RUB')).toBe(0.38);
    });

    it('should return 1 for base currency (TMT)', () => {
      expect(rateForCode(mockCurrencies, BASE_CURRENCY_CODE)).toBe(1);
    });

    it('should return 1 for undefined currency code', () => {
      expect(rateForCode(mockCurrencies, undefined)).toBe(1);
    });

    it('should return 1 for unknown currency code', () => {
      expect(rateForCode(mockCurrencies, 'XXX')).toBe(1);
      expect(rateForCode(mockCurrencies, 'GBP')).toBe(1);
    });

    it('should be case-sensitive', () => {
      expect(rateForCode(mockCurrencies, 'usd')).toBe(1); // lowercase not found
      expect(rateForCode(mockCurrencies, 'USD')).toBe(35.0);
    });
  });

  describe('isCurrencyCodeUnique', () => {
    it('should return true for unique currency code', () => {
      expect(isCurrencyCodeUnique('GBP', mockCurrencies)).toBe(true);
      expect(isCurrencyCodeUnique('TRY', mockCurrencies)).toBe(true);
    });

    it('should return false for existing currency code', () => {
      expect(isCurrencyCodeUnique('USD', mockCurrencies)).toBe(false);
      expect(isCurrencyCodeUnique('EUR', mockCurrencies)).toBe(false);
    });

    it('should return false for base currency (TMT)', () => {
      expect(isCurrencyCodeUnique(BASE_CURRENCY_CODE, mockCurrencies)).toBe(false);
      expect(isCurrencyCodeUnique('tmt', mockCurrencies)).toBe(false);
    });

    it('should be case-insensitive', () => {
      expect(isCurrencyCodeUnique('usd', mockCurrencies)).toBe(false);
      expect(isCurrencyCodeUnique('Usd', mockCurrencies)).toBe(false);
      expect(isCurrencyCodeUnique('USD', mockCurrencies)).toBe(false);
    });

    it('should trim whitespace', () => {
      expect(isCurrencyCodeUnique(' USD ', mockCurrencies)).toBe(false);
      expect(isCurrencyCodeUnique(' GBP ', mockCurrencies)).toBe(true);
    });

    it('should exclude currency being edited', () => {
      expect(isCurrencyCodeUnique('USD', mockCurrencies, 'cur-usd')).toBe(true);
      expect(isCurrencyCodeUnique('EUR', mockCurrencies, 'cur-eur')).toBe(true);
      expect(isCurrencyCodeUnique('USD', mockCurrencies, 'cur-eur')).toBe(false);
    });
  });

  describe('generateCurrencyId', () => {
    it('should generate correct currency ID', () => {
      expect(generateCurrencyId('USD')).toBe('cur-usd');
      expect(generateCurrencyId('EUR')).toBe('cur-eur');
      expect(generateCurrencyId('GBP')).toBe('cur-gbp');
    });

    it('should handle lowercase conversion', () => {
      expect(generateCurrencyId('USD')).toBe('cur-usd');
      expect(generateCurrencyId('usd')).toBe('cur-usd');
      expect(generateCurrencyId('Usd')).toBe('cur-usd');
    });

    it('should trim whitespace', () => {
      expect(generateCurrencyId(' USD ')).toBe('cur-usd');
      expect(generateCurrencyId('  EUR  ')).toBe('cur-eur');
    });
  });
});

describe('currencyService — taban para birimi', () => {
  beforeEach(() => {
    // Modül durumu global; testler birbirini kirletmesin.
    applyBaseCurrency(DEFAULT_BASE_CURRENCY);
  });

  it('varsayılan taban TMT', () => {
    expect(getBaseCurrency().code).toBe('TMT');
    expect(getBaseCurrencyCode()).toBe('TMT');
  });

  it('kodu büyük harfe çevirip boşlukları kırpar', () => {
    applyBaseCurrency({ code: '  usd  ', name: 'Dolar', symbol: '$' });
    expect(getBaseCurrencyCode()).toBe('USD');
  });

  it('ad boşsa kodu ad olarak kullanır', () => {
    applyBaseCurrency({ code: 'EUR', name: '   ', symbol: '€' });
    expect(getBaseCurrency().name).toBe('EUR');
  });

  it('sembol boşsa kodun ilk iki harfini kullanır', () => {
    applyBaseCurrency({ code: 'GBP', name: 'Funt', symbol: '  ' });
    expect(getBaseCurrency().symbol).toBe('GB');
  });

  it('boş kod değişikliği yok sayar', () => {
    applyBaseCurrency({ code: '   ', name: 'X', symbol: 'X' });
    expect(getBaseCurrencyCode()).toBe('TMT');
  });

  it('setBaseCurrency da aynı normalizasyonu kullanır', () => {
    setBaseCurrency({ code: 'try', name: 'Lira', symbol: '₺' });
    expect(getBaseCurrencyCode()).toBe('TRY');
    expect(getBaseCurrency().symbol).toBe('₺');
  });
});

describe('currencyService — commonCurrency', () => {
  it('bilinen kodu döner', () => {
    expect(commonCurrency('USD')?.symbol).toBe('$');
    expect(commonCurrency('EUR')?.symbol).toBe('€');
  });

  it('listede olmayan kod için undefined', () => {
    expect(commonCurrency('XYZ')).toBeUndefined();
  });

  it('küçük harfle eşleşmez (kod büyük harf)', () => {
    expect(commonCurrency('usd')).toBeUndefined();
  });

  it('liste benzersiz kodlardan oluşur', () => {
    const codes = COMMON_CURRENCIES.map((c) => c.code);
    expect(new Set(codes).size).toBe(codes.length);
    expect(codes).toContain('USD');
    expect(codes).toContain('EUR');
  });
});

describe('currencyService — ensureBaseCurrencySeeded', () => {
  const usd: CurrencyRate = {
    id: 'cur-usd',
    code: 'USD',
    name: 'Dolar',
    symbol: '$',
    rate: 35,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  it('TMT yoksa ekler', async () => {
    const result = await ensureBaseCurrencySeeded([usd]);
    expect(result).toHaveLength(2);
    const tmt = result.find((c) => c.code === 'TMT');
    expect(tmt).toBeDefined();
    expect(tmt!.rate).toBe(1);
    expect(tmt!.id).toBe('cur-tmt');
  });

  it('TMT zaten varsa dokunmaz (idempotent)', async () => {
    const tmt: CurrencyRate = {
      id: 'cur-tmt',
      code: 'TMT',
      name: 'Manat',
      symbol: 'TMT',
      rate: 1,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };
    const result = await ensureBaseCurrencySeeded([usd, tmt]);
    expect(result).toHaveLength(2);
    // Mevcut kaydın adı korunur, üzerine yazılmaz.
    expect(result.find((c) => c.code === 'TMT')!.name).toBe('Manat');
  });

  it('küçük harfli tmt de mevcut sayılır', async () => {
    const tmtLower: CurrencyRate = { ...usd, id: 'cur-tmt', code: 'tmt' };
    const result = await ensureBaseCurrencySeeded([usd, tmtLower]);
    expect(result).toHaveLength(2);
  });

  it('girdi dizisini değiştirmez', async () => {
    const input = [usd];
    await ensureBaseCurrencySeeded(input);
    expect(input).toHaveLength(1);
  });
});

describe('currencyService — isCurrencyInUse', () => {
  it('referans varsa true', () => {
    expect(isCurrencyInUse('USD', [{ currency: 'USD' }, { currency: 'EUR' }])).toBe(true);
  });

  it('referans yoksa false', () => {
    expect(isCurrencyInUse('USD', [{ currency: 'EUR' }])).toBe(false);
  });

  it('boş listede false', () => {
    expect(isCurrencyInUse('USD', [])).toBe(false);
  });

  it('tanımsız currency alanı eşleşmez', () => {
    expect(isCurrencyInUse('USD', [{}])).toBe(false);
  });
});
