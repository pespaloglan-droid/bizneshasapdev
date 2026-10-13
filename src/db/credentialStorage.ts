/** Kısa vadeli obfuscation, şifreleme/güvenli kasa DEĞİLDİR.
 * TODO: Electron safeStorage / Android Keystore (async native vault migration).
 * XSS veya cihaz erişimi olan biri bu kodlamayı geri çevirebilir. */
export function encodeStoredValue(value: unknown): string {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  return btoa(Array.from(bytes, byte => String.fromCharCode(byte)).join(''));
}
export function decodeStoredValue<T>(encoded: string): T {
  return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(atob(encoded), c => c.charCodeAt(0)))) as T;
}
export function splitStoredAddress(raw: string): { address: string; encoded: string } {
  try {
    const url = new URL(/^[a-z]+:\/\//i.test(raw) ? raw : `http://${raw}`);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('INVALID_ADDRESS');
    // Orijinal girdiyi ayrıca kodlamak kısmi/düzenlenen adres ve percent-encoding'i korur.
    url.username = ''; url.password = '';
    return { address: raw ? url.toString() : '', encoded: encodeStoredValue(raw) };
  } catch { return { address: '', encoded: encodeStoredValue(raw) }; }
}
export function usesPlainHttp(raw: string): boolean {
  try { return new URL(/^[a-z]+:\/\//i.test(raw) ? raw : `http://${raw}`).protocol === 'http:'; }
  catch { return false; }
}

/** Eski hesap taban URL'si de userinfo taşıyabilir; iki saklama yolu aynı codec'i kullanır. */
export function encodeStoredAccount<T extends { couchDbUrl: string }>(account: T): T & { couchDbUrlEncoded: string } {
  const split = splitStoredAddress(account.couchDbUrl);
  return { ...account, couchDbUrl: split.address, couchDbUrlEncoded: split.encoded };
}
export function decodeStoredAccount<T extends { couchDbUrl: string; couchDbUrlEncoded?: string }>(account: T): T {
  const { couchDbUrlEncoded, ...body } = account;
  return { ...body, couchDbUrl: couchDbUrlEncoded ? decodeStoredValue<string>(couchDbUrlEncoded) : account.couchDbUrl } as T;
}
