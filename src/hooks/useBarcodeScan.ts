import { useCallback, useState } from 'react';
import { isNative } from '../utils/platform';

export interface BarcodeScanResult {
  readonly value: string;
  readonly cancelled: boolean;
}

/**
 * Barkod tarama: native'de MLKit kamera, web/PC'de prompt fallback.
 * Dinamik import — web bundle'a kamera kodu girmez.
 */
export function useBarcodeScan(): {
  readonly scanning: boolean;
  readonly lastError: string;
  scan: () => Promise<BarcodeScanResult | undefined>;
} {
  const [scanning, setScanning] = useState(false);
  const [lastError, setLastError] = useState('');

  const scan = useCallback(async (): Promise<BarcodeScanResult | undefined> => {
    setScanning(true);
    setLastError('');
    try {
      if (isNative()) {
        try {
          const mod = await import('@capacitor-mlkit/barcode-scanning') as unknown as Record<string, unknown>;
          const plugin = (mod['BarcodeScanner'] ?? mod['BarcodeScanning']) as {
            requestPermissions?: () => Promise<unknown>;
            checkPermissions?: () => Promise<unknown>;
            scan?: (opts?: unknown) => Promise<unknown>;
          };
          if (!plugin?.scan) throw new Error('Barkod eklentisi bulunamadı.');
          if (plugin.requestPermissions) {
            const perm = await plugin.requestPermissions();
            const s = JSON.stringify(perm);
            if (!/granted/i.test(s)) {
              setLastError('Kamera izni verilmedi.');
              return undefined;
            }
          }
          const res = (await plugin.scan()) as {
            barcodes?: Array<{ rawValue?: string; displayValue?: string }>;
            Scan?: string;
            content?: string;
          };
          const first = res.barcodes?.[0];
          const value = (
            first?.rawValue ??
            first?.displayValue ??
            res.Scan ??
            res.content ??
            ''
          ).trim();
          if (!value) return { value: '', cancelled: true };
          return { value, cancelled: false };
        } catch (err) {
          setLastError(err instanceof Error ? err.message : String(err));
          return undefined;
        } finally {
          setScanning(false);
        }
      }
      const manual = window.prompt('Barkodu yazın / okutun:') ?? '';
      const value = manual.trim();
      if (!value) return { value: '', cancelled: true };
      return { value, cancelled: false };
    } catch (err) {
      setLastError(err instanceof Error ? err.message : String(err));
      return undefined;
    } finally {
      setScanning(false);
    }
  }, []);

  return { scanning, lastError, scan };
}
