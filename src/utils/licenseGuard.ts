/**
 * Lisans kontrolü gerektiren işlemler için yardımcı fonksiyonlar.
 * Backup, report export gibi hassas işlemlerde deriveKey kullanır.
 *
 * ÖNEMLİ: `electronAPI.deriveLicenseKey(licenseId, purpose)` iki argüman alır.
 * preload.cjs imzası: (licenseId: string|undefined, purpose: string)
 * Geçerli hesap kimlişi `gateMiddleware.getLicenseId()` üzerinden okunur.
 */

import { getLicenseId } from './gateMiddleware';
import { isNative } from './platform';
import { deriveMobileLicenseKey } from './licenseMobile';

/**
 * IPC'den dönen anahtarı baýtlara öwür (Electron structured clone
 * Node Buffer-y renderer'de Uint8Array edýär; `Buffer` globaly ýok).
 */
function toKeyBytes(key: unknown): Uint8Array | null {
  if (key instanceof Uint8Array) return key.length > 0 ? key : null;
  if (Array.isArray(key)) return key.length > 0 ? Uint8Array.from(key) : null;
  if (typeof key === 'string' && key) {
    try {
      const binary = atob(key);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      return bytes;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Backup işlemi için lisans anahtarı türet.
 * Lisanssız/farklı cihazda null döner → yedek okunamaz.
 */
export async function getLicenseKeyForBackup(): Promise<Uint8Array | null> {
  if (typeof window === 'undefined' || !(window as any).electronAPI?.deriveLicenseKey) {
    return isNative() ? deriveMobileLicenseKey(getLicenseId(), 'backup') : null;
  }

  try {
    const key = await (window as any).electronAPI.deriveLicenseKey(getLicenseId(), 'backup');
    return toKeyBytes(key);
  } catch {
    return null;
  }
}

/**
 * Rapor export işlemi için lisans anahtarı türet.
 * Lisanssız/farklı cihazda null döner → export oluşturulamaz.
 */
export async function getLicenseKeyForReports(): Promise<Uint8Array | null> {
  if (typeof window === 'undefined' || !(window as any).electronAPI?.deriveLicenseKey) {
    return isNative() ? deriveMobileLicenseKey(getLicenseId(), 'reports') : null;
  }

  try {
    const key = await (window as any).electronAPI.deriveLicenseKey(getLicenseId(), 'reports');
    return toKeyBytes(key);
  } catch {
    return null;
  }
}

/**
 * Export işlemi için lisans anahtarı türet.
 * Cari/stok dışa aktarım dosyaları için.
 */
export async function getLicenseKeyForExport(): Promise<Uint8Array | null> {
  if (typeof window === 'undefined' || !(window as any).electronAPI?.deriveLicenseKey) {
    return isNative() ? deriveMobileLicenseKey(getLicenseId(), 'export') : null;
  }

  try {
    const key = await (window as any).electronAPI.deriveLicenseKey(getLicenseId(), 'export');
    return toKeyBytes(key);
  } catch {
    return null;
  }
}

/**
 * AES-256-GCM şifreleme (Web Crypto API).
 * Format: [12 byte IV][şifreli veri][16 byte auth tag]
 * Lisans anahtarı ile veriyi şifreler.
 */
export async function encryptWithKey(data: string | Uint8Array, key: Uint8Array): Promise<Uint8Array> {
  const dataBytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  
  // Web Crypto API kullanarak şifrele
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    new Uint8Array(key.slice(0, 32)), // İlk 32 byte AES-256 anahtarı
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );
  
  // 12 byte random IV oluştur (NIST önerisi)
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  // Şifrele
  const encrypted = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
      tagLength: 128, // 16 byte auth tag
    },
    cryptoKey,
    new Uint8Array(dataBytes)
  );
  
  // IV + şifreli veri + tag birleştir
  const result = new Uint8Array(iv.length + encrypted.byteLength);
  result.set(iv, 0);
  result.set(new Uint8Array(encrypted), iv.length);
  
  return result;
}

/**
 * AES-256-GCM çözme (Web Crypto API).
 * Format: [12 byte IV][şifreli veri][16 byte auth tag]
 */
export async function decryptWithKey(encrypted: Uint8Array, key: Uint8Array): Promise<Uint8Array> {
  if (encrypted.length < 12 + 16) {
    throw new Error('DECRYPT_ERROR: Veri çok kısa (minimum 28 byte gerekli)');
  }
  
  // IV ve şifreli veriyi ayır
  const iv = new Uint8Array(encrypted.slice(0, 12));
  const ciphertext = new Uint8Array(encrypted.slice(12));
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    new Uint8Array(key.slice(0, 32)),
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );
  
  try {
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
        tagLength: 128,
      },
      cryptoKey,
      ciphertext
    );
    
    return new Uint8Array(decrypted);
  } catch (err) {
    throw new Error('DECRYPT_ERROR: Şifre çözme başarısız (yanlış anahtar veya bozuk veri)');
  }
}

/**
 * Yedekleme wrapper - AES-GCM ile şifreli.
 */
export async function createEncryptedBackup(data: any): Promise<Uint8Array | null> {
  const key = await getLicenseKeyForBackup();
  if (!key) {
    throw new Error('LICENSE_REQUIRED: Yedekleme lisans gerektirir');
  }
  
  const jsonData = JSON.stringify(data);
  const encrypted = await encryptWithKey(jsonData, key);
  return encrypted;
}

/**
 * Yedek geri yükleme wrapper - AES-GCM ile çözme.
 */
export async function restoreEncryptedBackup(encrypted: Uint8Array): Promise<any> {
  const key = await getLicenseKeyForBackup();
  if (!key) {
    throw new Error('LICENSE_REQUIRED: Yedek geri yükleme lisans gerektirir');
  }
  
  const decrypted = await decryptWithKey(encrypted, key);
  const jsonData = new TextDecoder().decode(decrypted);
  return JSON.parse(jsonData);
}

/**
 * Rapor export wrapper - AES-GCM ile şifreli.
 */
export async function exportEncryptedReport(reportData: any, format: 'pdf' | 'csv' | 'excel'): Promise<Uint8Array | null> {
  const key = await getLicenseKeyForReports();
  if (!key) {
    throw new Error('LICENSE_REQUIRED: Rapor export lisans gerektirir');
  }
  
  // Format'a göre veri hazırla
  const data = format === 'csv' 
    ? JSON.stringify(reportData) // CSV wrapper eklenecek
    : JSON.stringify(reportData);
  
  const encrypted = await encryptWithKey(data, key);
  return encrypted;
}
