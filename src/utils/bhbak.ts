/**
 * Biznes Hasap ätiýaçlyk formaty (.bhbak)
 *
 * Düzüm V2 (şifreli - lisansa bağlı):
 *   0–3  'BHBK' sihirli belgi
 *   4    wersiýa (uint8 = 2)
 *   5–8  açyk JSON uzynlygy (uint32 LE)
 *   9+   AES-GCM şifreli + gzip sıkıştırılmış JSON
 *        (deriveKey('backup') ile şifrelenmiş)
 *
 * Düzüm V1 (şifresiz - sadece gzip):
 *   0–3  'BHBK'
 *   4    1
 *   5–8  uzunluk
 *   9+   gzip JSON
 *
 * Köne .json ätiýaçlyklar hem okalýar (migrasiýa).
 */

import { encryptWithKey, decryptWithKey, getLicenseKeyForBackup } from './licenseGuard';

export const BHBAK_EXT = 'bhbak';
export const BHBAK_MAGIC = 'BHBK';

const MAGIC_BYTES = new TextEncoder().encode(BHBAK_MAGIC);

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

/** Pipe both ends concurrently: awaiting write before reading can deadlock
 * once gzip's readable queue is full (real store backups exceed that queue). */
async function transformGzip(
  input: Uint8Array,
  stream: CompressionStream | DecompressionStream,
): Promise<Uint8Array> {
  const source = new Response(toArrayBuffer(input)).body!;
  return new Uint8Array(await new Response(source.pipeThrough(stream)).arrayBuffer());
}

async function gzipCompress(input: Uint8Array): Promise<Uint8Array> {
  return transformGzip(input, new CompressionStream('gzip'));
}

async function gzipDecompress(input: Uint8Array): Promise<Uint8Array> {
  return transformGzip(input, new DecompressionStream('gzip'));
}

function decodePayload(raw: Uint8Array, expectedLength: number): string {
  if (raw.byteLength !== expectedLength) {
    throw new Error('INVALID_LENGTH: Ätiýaçlyk faýlynyň uzynlygy nädogry.');
  }
  return new TextDecoder('utf-8', { fatal: true }).decode(raw);
}

function startsWithMagic(bytes: Uint8Array): boolean {
  if (bytes.length < MAGIC_BYTES.length) return false;
  return MAGIC_BYTES.every((b, i) => bytes[i] === b);
}

function looksLikeJson(bytes: Uint8Array): boolean {
  let i = 0;
  while (i < bytes.length && (bytes[i] === 0x20 || bytes[i] === 0x0a || bytes[i] === 0x0d || bytes[i] === 0x09)) {
    i += 1;
  }
  return bytes[i] === 0x7b; // '{'
}

/** 
 * JSON maglumatyny .bhbak baýtlaryna öwür.
 * V2: önce gzip, sonra AES-GCM şifreleme (lisans anahtarı ile).
 * Lisanssız çalıştırılırsa V1 formatına düşer (sadece gzip, şifresiz).
 */
export async function encodeBhbak(json: string, requireEncryption = false): Promise<Uint8Array> {
  const raw = new TextEncoder().encode(json);
  const compressed = await gzipCompress(raw);
  
  // Lisans anahtarı al - varsa şifrele (V2), yoksa şifresiz (V1)
  const licenseKey = await getLicenseKeyForBackup();
  
  if (requireEncryption && !licenseKey) throw new Error('LICENSE_REQUIRED');
  if (licenseKey) {
    // V2: Şifreli
    const encrypted = await encryptWithKey(compressed, licenseKey);
    const out = new Uint8Array(9 + encrypted.length);
    out.set(MAGIC_BYTES, 0);
    out[4] = 2; // V2
    const view = new DataView(out.buffer);
    view.setUint32(5, raw.length, true);
    out.set(encrypted, 9);
    return out;
  } else {
    // V1: Şifresiz (geriye uyumluluk)
    const out = new Uint8Array(9 + compressed.length);
    out.set(MAGIC_BYTES, 0);
    out[4] = 1; // V1
    const view = new DataView(out.buffer);
    view.setUint32(5, raw.length, true);
    out.set(compressed, 9);
    return out;
  }
}

/** 
 * .bhbak (ýa-da köne .json) baýtlaryny JSON tekste öwür.
 * V2: önce AES-GCM çözme (lisans gerekli), sonra gzip açma.
 * V1: sadece gzip açma.
 * Lisanssız cihazda V2 dosyası açılamaz - güvenlik özelliği.
 */
export async function decodeBhbak(bytes: Uint8Array): Promise<string> {
  if (startsWithMagic(bytes)) {
    if (bytes.byteLength < 10) {
      throw new Error('INVALID_HEADER: Ätiýaçlyk faýlynyň başlygy doly däl.');
    }
    const expectedLength = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
      .getUint32(5, true);
    const version = bytes[4];
    const payload = bytes.subarray(9);
    
    if (version === 2) {
      // V2: Şifreli - lisans anahtarı gerekli
      const licenseKey = await getLicenseKeyForBackup();
      if (!licenseKey) {
        throw new Error('LICENSE_REQUIRED: Bu yedek şifrelidir, lisans anahtarı gereklidir.');
      }
      
      try {
        const decrypted = await decryptWithKey(payload, licenseKey);
        const raw = await gzipDecompress(new Uint8Array(decrypted));
        return decodePayload(raw, expectedLength);
      } catch (err) {
        if (err instanceof Error && err.message.includes('DECRYPT_ERROR')) {
          throw new Error('DECRYPT_ERROR: Bu yedek farklı bir cihaz/hesap için oluşturulmuş - bu cihazda açılamaz.');
        }
        throw err;
      }
    } else if (version === 1) {
      // V1: Şifresiz (eski format)
      const raw = await gzipDecompress(payload);
      return decodePayload(raw, expectedLength);
    } else {
      throw new Error(`Näbelli .bhbak wersiýasy: ${version}`);
    }
  }
  
  // Eski JSON formatı (geriye uyumluluk)
  if (looksLikeJson(bytes)) {
    return new TextDecoder().decode(bytes);
  }
  
  throw new Error('Bu faýl Biznes Hasap ätiýaçlygy däl (.bhbak).');
}
