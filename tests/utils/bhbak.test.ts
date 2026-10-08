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