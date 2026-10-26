import { describe, it, expect, beforeEach, vi } from 'vitest';
import { encodeBhbak, decodeBhbak, BHBAK_MAGIC } from '../../src/utils/bhbak';
import { setLicenseId } from '../../src/utils/gateMiddleware';

/** 32-byte lisanstan türetilmiş anahtar (deriveKey çıktısı). */
function makeKey(seed: number): number[] {
  return Array.from({ length: 32 }, (_, i) => (seed * 7 + i * 13) % 256);
}

const deriveLicenseKey = vi.fn();

beforeEach(() => {
  deriveLicenseKey.mockReset();
  (window as any).electronAPI.deriveLicenseKey = deriveLicenseKey;
  setLicenseId('TEST-ACCT-0001');
});

/** V1/V2 sürüm baytını okur (byte 4). */
function versionOf(bytes: Uint8Array): number {
  return bytes[4];
}

describe('bhbak şifreli yedek (V2)', () => {
  const payload = JSON.stringify({
    products: [{ id: 'p1', ad: 'Çay', fiyat: 35.5, stok: 12 }],
    invoices: [{ id: 'f1', toplam: 71 }],
  });

  it('lisans varken V2 (şifreli) format üretir', async () => {
    deriveLicenseKey.mockResolvedValue(makeKey(1));

    const bytes = await encodeBhbak(payload);

    expect(new TextDecoder().decode(bytes.subarray(0, 4))).toBe(BHBAK_MAGIC);
    expect(versionOf(bytes)).toBe(2);
    // Şifreli + gzip + IV(12) + tag(16) → ham veriden büyük olmalı
    expect(bytes.length).toBeGreaterThan(payload.length);
  });

  it('şifreli yedeği aynı anahtarla çözer (round-trip)', async () => {
    deriveLicenseKey.mockResolvedValue(makeKey(1));
    const bytes = await encodeBhbak(payload);

    const decoded = await decodeBhbak(bytes);

    expect(decoded).toBe(payload);
    expect(JSON.parse(decoded).products[0].ad).toBe('Çay');
  });

  it('farklı hesabın anahtarıyla çözüm başarısız (spec 16.1)', async () => {
    deriveLicenseKey.mockResolvedValue(makeKey(1));
    const bytes = await encodeBhbak(payload);

    // Başka bir hesap/cihazın anahtarı
    deriveLicenseKey.mockResolvedValue(makeKey(99));

    await expect(decodeBhbak(bytes)).rejects.toThrow(/farklı bir cihaz\/hesap/i);
  });

  it('lisanssız cihazda şifreli yedek açılamaz', async () => {
    deriveLicenseKey.mockResolvedValue(makeKey(1));
    const bytes = await encodeBhbak(payload);

    // Lisanssız → deriveKey null
    deriveLicenseKey.mockResolvedValue(null);

    await expect(decodeBhbak(bytes)).rejects.toThrow(/LICENSE_REQUIRED|lisans anahtarı/i);
  });

  it('lisans varken bile şifreli yedekte düz JSON görünmez', async () => {
    deriveLicenseKey.mockResolvedValue(makeKey(1));
    const bytes = await encodeBhbak(payload);

    const raw = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
    expect(raw).not.toContain('Çay');
    expect(raw).not.toContain('products');
  });

  it('lisans yoksa V1\'e düşer (geriye uyumluluk) ve çözülebilir', async () => {
    deriveLicenseKey.mockResolvedValue(null);
    const bytes = await encodeBhbak(payload);

    expect(versionOf(bytes)).toBe(1);

    // Lisanslı cihazda V1 dosyası da okunabilir (anahtar gerekmez)
    deriveLicenseKey.mockResolvedValue(makeKey(1));
    const decoded = await decodeBhbak(bytes);
    expect(decoded).toBe(payload);
  });

  it('eski düz .json yedekleri okumaya devam eder', async () => {
    const legacy = new TextEncoder().encode(payload);
    const decoded = await decodeBhbak(legacy);
    expect(decoded).toBe(payload);
  });

  it('aynı metni iki kez şifrelemez (rastgele IV)', async () => {
    deriveLicenseKey.mockResolvedValue(makeKey(1));

    const a = await encodeBhbak(payload);
    const b = await encodeBhbak(payload);

    expect(Buffer.from(a).equals(Buffer.from(b))).toBe(false);
  });

  it('bozuk şifreli yedeği reddeder', async () => {
    deriveLicenseKey.mockResolvedValue(makeKey(1));
    const bytes = await encodeBhbak(payload);

    // Auth tag'ı boz
    bytes[bytes.length - 1] ^= 0xff;

    await expect(decodeBhbak(bytes)).rejects.toThrow();
  });
});
describe('bhbak büyük veri ve dosya doğrulaması', () => {
  it('büyük ve az sıkışan yedeği akış kilitlenmeden geri açar', async () => {
    deriveLicenseKey.mockResolvedValue(makeKey(1));
    // Tekrarlanan metin gzip tamponunu doldurmaz; deterministik gürültü doldurur.
    let seed = 123456789;
    const rows = Array.from({ length: 12000 }, (_, id) => {
      const text = Array.from({ length: 80 }, () => {
        seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
        return String.fromCharCode(33 + ((seed >>> 0) % 90));
      }).join('');
      return { id, text };
    });
    const json = JSON.stringify({ docs: rows });
    const encoded = await encodeBhbak(json);
    expect(encoded.length).toBeGreaterThan(65536);
    expect(await decodeBhbak(encoded)).toBe(json);
  }, 5000);

  it('eksik BHBK başlığını açık hatayla reddeder', async () => {
    await expect(decodeBhbak(new TextEncoder().encode('BHBK')))
      .rejects.toThrow(/INVALID_HEADER/);
  });

  it('başlıktaki JSON uzunluğu ile içerik uyuşmazlığını reddeder', async () => {
    deriveLicenseKey.mockResolvedValue(null);
    const bytes = await encodeBhbak('{"docs":[]}');
    new DataView(bytes.buffer).setUint32(5, 1, true);
    await expect(decodeBhbak(bytes)).rejects.toThrow(/INVALID_LENGTH/);
  });

  it('desteklenmeyen sürümü reddeder', async () => {
    const bytes = new Uint8Array(10);
    bytes.set(new TextEncoder().encode(BHBAK_MAGIC));
    bytes[4] = 99;
    await expect(decodeBhbak(bytes)).rejects.toThrow(/99/);
  });
});
