/**
 * Lisans kontrolü gerektiren işlemler için yardımcı fonksiyonlar.
 * Backup, report export gibi hassas işlemlerde deriveKey kullanır.
 *
 * ÖNEMLİ: `electronAPI.deriveLicenseKey(licenseId, purpose)` iki argüman alır.
 * preload.cjs imzası: (licenseId: string|undefined, purpose: string)
 * Geçerli hesap kimlişi `gateMiddleware.getLicenseId()` üzerinden okunur.
 */

import { getLicenseId } from './gateMiddleware';

/**
 * Backup işlemi için lisans anahtarı türet.
 * Lisanssız/farklı cihazda null döner → yedek okunamaz.
 */
export async function getLicenseKeyForBackup(): Promise<Buffer | null> {
  if (typeof window === 'undefined' || !(window as any).electronAPI?.deriveLicenseKey) {
    return null;
  }

  try {
    const key = await (window as any).electronAPI.deriveLicenseKey(getLicenseId(), 'backup');
    return key ? Buffer.from(key) : null;
  } catch {
    return null;
  }
}

/**
 * Rapor export işlemi için lisans anahtarı türet.
 * Lisanssız/farklı cihazda null döner → export oluşturulamaz.
 */
export async function getLicenseKeyForReports(): Promise<Buffer | null> {
  if (typeof window === 'undefined' || !(window as any).electronAPI?.deriveLicenseKey) {
    return null;
  }

  try {
    const key = await (window as any).electronAPI.deriveLicenseKey(getLicenseId(), 'reports');
    return key ? Buffer.from(key) : null;
  } catch {
    return null;
  }
}

/**
 * Export işlemi için lisans anahtarı türet.
 * Cari/stok dışa aktarım dosyaları için.
 */
export async function getLicenseKeyForExport(): Promise<Buffer | null> {
  if (typeof window === 'undefined' || !(window as any).electronAPI?.deriveLicenseKey) {
    return null;
  }

  try {
    const key = await (window as any).electronAPI.deriveLicenseKey(getLicenseId(), 'export');
    return key ? Buffer.from(key) : null;
  } catch {
    return null;
  }
}

/**
 * AES-256-GCM şifreleme (Web Crypto API).
 * Format: [12 byte IV][şifreli veri][16 byte auth tag]
 * Lisans anahtarı ile veriyi şifreler.
 */
export async function encryptWithKey(data: string | Buffer, key: Buffer): Promise<Buffer> {
  const dataBuffer = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
  
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
    new Uint8Array(dataBuffer)
  );
  
  // IV + şifreli veri + tag birleştir
  const result = new Uint8Array(iv.length + encrypted.byteLength);
  result.set(iv, 0);
  result.set(new Uint8Array(encrypted), iv.length);
  
  return Buffer.from(result);
}

/**
 * AES-256-GCM çözme (Web Crypto API).
 * Format: [12 byte IV][şifreli veri][16 byte auth tag]
 */
export async function decryptWithKey(encrypted: Buffer, key: Buffer): Promise<Buffer> {
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
    
    return Buffer.from(decrypted);
  } catch (err) {
    throw new Error('DECRYPT_ERROR: Şifre çözme başarısız (yanlış anahtar veya bozuk veri)');
  }
}

/**
 * Yedekleme wrapper - AES-GCM ile şifreli.
 */
export async function createEncryptedBackup(data: any): Promise<Buffer | null> {
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
export async function restoreEncryptedBackup(encrypted: Buffer): Promise<any> {
  const key = await getLicenseKeyForBackup();
  if (!key) {
    throw new Error('LICENSE_REQUIRED: Yedek geri yükleme lisans gerektirir');
  }
  
  const decrypted = await decryptWithKey(encrypted, key);
  const jsonData = decrypted.toString('utf8');
  return JSON.parse(jsonData);
}

/**
 * Rapor export wrapper - AES-GCM ile şifreli.
 */
export async function exportEncryptedReport(reportData: any, format: 'pdf' | 'csv' | 'excel'): Promise<Buffer | null> {
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
