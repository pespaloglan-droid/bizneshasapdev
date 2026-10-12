import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  encryptWithKey,
  decryptWithKey,
  getLicenseKeyForBackup,
  getLicenseKeyForReports,
  getLicenseKeyForExport,
  createEncryptedBackup,
  restoreEncryptedBackup,
  exportEncryptedReport,
} from '../../src/utils/licenseGuard';
import { setLicenseId } from '../../src/utils/gateMiddleware';

/** deriveKey çıktısı: 32 byte (spec: SHA-512(...)[0..32]). */
function makeKey(seed: number): number[] {
  return Array.from({ length: 32 }, (_, i) => (seed * 11 + i * 7) % 256);
}

const deriveLicenseKey = vi.fn();

beforeEach(() => {
  deriveLicenseKey.mockReset();
  (window as any).electronAPI.deriveLicenseKey = deriveLicenseKey;
  setLicenseId('TEST-ACCT-0001');
});

describe('licenseGuard AES-GCM', () => {
  // Mock 32-byte key
  const testKey = Uint8Array.from(makeKey(1));

  describe('encryptWithKey', () => {
    it('should encrypt string data', async () => {
      const plaintext = 'Test data for encryption';
      const encrypted = await encryptWithKey(plaintext, testKey);
      
      expect(encrypted).toBeInstanceOf(Uint8Array);
      expect(encrypted.length).toBeGreaterThan(plaintext.length); // IV + data + tag
      expect(encrypted.length).toBeGreaterThanOrEqual(12 + plaintext.length + 16);
    });

    it('should encrypt Buffer data', async () => {
      const plaintext = new TextEncoder().encode('Test buffer data');
      const encrypted = await encryptWithKey(plaintext, testKey);
      
      expect(encrypted).toBeInstanceOf(Uint8Array);
      expect(encrypted.length).toBeGreaterThan(plaintext.length);
    });

    it('should produce different ciphertext for same plaintext (random IV)', async () => {
      const plaintext = 'Same data';
      const encrypted1 = await encryptWithKey(plaintext, testKey);
      const encrypted2 = await encryptWithKey(plaintext, testKey);
      
      expect(encrypted1).not.toEqual(encrypted2); // Different IVs
    });

    it('should handle empty string', async () => {
      const encrypted = await encryptWithKey('', testKey);
      expect(encrypted).toBeInstanceOf(Uint8Array);
      expect(encrypted.length).toBe(12 + 16); // IV + tag only
    });
  });

  describe('decryptWithKey', () => {
    it('should decrypt data encrypted with same key', async () => {
      const plaintext = 'Secret message';
      const encrypted = await encryptWithKey(plaintext, testKey);
      const decrypted = await decryptWithKey(encrypted, testKey);
      
      expect(new TextDecoder().decode(decrypted)).toBe(plaintext);
    });

    it('should fail with wrong key', async () => {
      const plaintext = 'Secret message';
      const encrypted = await encryptWithKey(plaintext, testKey);
      
      const wrongKey = Uint8Array.from(makeKey(2));
      
      await expect(decryptWithKey(encrypted, wrongKey)).rejects.toThrow('DECRYPT_ERROR');
    });

    it('should fail with corrupted data', async () => {
      const plaintext = 'Secret message';
      const encrypted = await encryptWithKey(plaintext, testKey);
      
      // Corrupt last byte (auth tag)
      encrypted[encrypted.length - 1] ^= 0xFF;
      
      await expect(decryptWithKey(encrypted, testKey)).rejects.toThrow('DECRYPT_ERROR');
    });

    it('should fail with too short data', async () => {
      const tooShort = new TextEncoder().encode('short');
      await expect(decryptWithKey(tooShort, testKey)).rejects.toThrow('Veri çok kısa');
    });

    it('should handle empty encrypted data', async () => {
      const plaintext = '';
      const encrypted = await encryptWithKey(plaintext, testKey);
      const decrypted = await decryptWithKey(encrypted, testKey);
      
      expect(new TextDecoder().decode(decrypted)).toBe('');
    });
  });

  describe('round-trip encryption', () => {
    it('should preserve data integrity for various sizes', async () => {
      const testCases = [
        'x',
        'Short text',
        'Medium length text with some special characters: äöü €',
        'A'.repeat(1000), // 1KB
        JSON.stringify({ key: 'value', nested: { array: [1, 2, 3] } }),
      ];

      for (const plaintext of testCases) {
        const encrypted = await encryptWithKey(plaintext, testKey);
        const decrypted = await decryptWithKey(encrypted, testKey);
        expect(new TextDecoder().decode(decrypted)).toBe(plaintext);
      }
    });
  });
});

describe('licenseGuard — anahtar türetme (spec 16.1)', () => {
  describe('getLicenseKeyFor*', () => {
    it('her purpose için doğru etiketi ve hesap kimliğini gönderir', async () => {
      deriveLicenseKey.mockResolvedValue(makeKey(1));

      await getLicenseKeyForBackup();
      expect(deriveLicenseKey).toHaveBeenLastCalledWith('TEST-ACCT-0001', 'backup');

      await getLicenseKeyForReports();
      expect(deriveLicenseKey).toHaveBeenLastCalledWith('TEST-ACCT-0001', 'reports');

      await getLicenseKeyForExport();
      expect(deriveLicenseKey).toHaveBeenLastCalledWith('TEST-ACCT-0001', 'export');
    });

    it('farklı purpose farklı anahtar üretir (anahtar ayrımı)', async () => {
      // Aynı hesap, farklı purpose → farklı türetme girdisi. Burada yalnızca
      // etiketin doğru iletildiğini doğruluyoruz; ayrım native tarafta.
      deriveLicenseKey.mockResolvedValueOnce(makeKey(1)).mockResolvedValueOnce(makeKey(2));

      const backupKey = await getLicenseKeyForBackup();
      const reportKey = await getLicenseKeyForReports();

      expect(backupKey!).not.toEqual(reportKey!);
    });

    it('lisanssızda null döner (veri açılamaz)', async () => {
      deriveLicenseKey.mockResolvedValue(null);

      expect(await getLicenseKeyForBackup()).toBeNull();
      expect(await getLicenseKeyForReports()).toBeNull();
      expect(await getLicenseKeyForExport()).toBeNull();
    });

    it('IPC patlarsa null döner (istisna yutulur)', async () => {
      deriveLicenseKey.mockRejectedValue(new Error('IPC çöktü'));

      expect(await getLicenseKeyForBackup()).toBeNull();
    });

    it('electronAPI yoksa null döner', async () => {
      const saved = (window as any).electronAPI.deriveLicenseKey;
      delete (window as any).electronAPI.deriveLicenseKey;

      expect(await getLicenseKeyForBackup()).toBeNull();

      (window as any).electronAPI.deriveLicenseKey = saved;
    });

    it('32 byte anahtarı Uint8Array olarak döner', async () => {
      deriveLicenseKey.mockResolvedValue(makeKey(5));
      const key = await getLicenseKeyForBackup();
      expect(key).toBeInstanceOf(Uint8Array);
      expect(key!.length).toBe(32);
    });
  });

  describe('createEncryptedBackup', () => {
    it('lisanssızda LICENSE_REQUIREDR fırlatır', async () => {
      deriveLicenseKey.mockResolvedValue(null);
      await expect(createEncryptedBackup({ a: 1 })).rejects.toThrow('LICENSE_REQUIRED');
    });

    it('lisanslıysa şifreli yedek üretir ve geri okunur', async () => {
      deriveLicenseKey.mockResolvedValue(makeKey(1));
      const data = { products: [{ ad: 'Çay' }], invoices: [{ toplam: 100 }] };

      const encrypted = await createEncryptedBackup(data);
      expect(encrypted).toBeInstanceOf(Uint8Array);
      expect(new TextDecoder().decode(encrypted!)).not.toContain('Çay');

      const restored = await restoreEncryptedBackup(encrypted!);
      expect(restored).toEqual(data);
    });
  });

  describe('restoreEncryptedBackup', () => {
    it('lisanssızda fırlatır', async () => {
      deriveLicenseKey.mockResolvedValue(null);
      await expect(restoreEncryptedBackup(Uint8Array.from([1, 2, 3]))).rejects.toThrow(
        'LICENSE_REQUIRED'
      );
    });

    it('başka hesabın yedeğini açmaz (spec 16.1)', async () => {
      deriveLicenseKey.mockResolvedValue(makeKey(1));
      const encrypted = await createEncryptedBackup({ secret: 'bakiye' });

      // Farklı hesap/cihazın anahtarı
      deriveLicenseKey.mockResolvedValue(makeKey(77));

      await expect(restoreEncryptedBackup(encrypted!)).rejects.toThrow('DECRYPT_ERROR');
    });
  });

  describe('exportEncryptedReport', () => {
    it('lisanssızda fırlatır', async () => {
      deriveLicenseKey.mockResolvedValue(null);
      await expect(exportEncryptedReport({ r: 1 }, 'csv')).rejects.toThrow('LICENSE_REQUIRED');
    });

    it('lisanslıysa şifreli rapor üretir', async () => {
      deriveLicenseKey.mockResolvedValue(makeKey(1));
      const out = await exportEncryptedReport({ toplam: 500 }, 'excel');
      expect(out).toBeInstanceOf(Uint8Array);
      expect(new TextDecoder().decode(out!)).not.toContain('500');
    });
  });
});
