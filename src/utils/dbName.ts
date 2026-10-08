/**
 * İşletme adından CouchDB veritabanı adı üretir.
 *
 * Kurallar:
 *   1. Türkçe harfler ASCII karşılığına indirgenir (ı→i, ş→s, ğ→g, ü→u, ö→o, ç→c)
 *   2. Aksanlı harfler (é, ñ …) soyulur
 *   3. Küçük harfe çevrilir
 *   4. Boşluk ve özel karakterler "_" olur
 *   5. Baştaki/sondaki "_" temizlenir
 *   6. Harfle başlamak zorunda (CouchDB kuralı) — rakamla başlıyorsa "b_" eklenir
 *
 *   "BIM MARKET"  → "bim_market"
 *   "Şeker Market" → "seker_market"
 *   "Çiğdem Ürünler" → "cigdem_urunler"
 *   "2024 Mağaza" → "b_2024_magaza"
 */

const TR_MAP: Readonly<Record<string, string>> = {
  ı: 'i', İ: 'i', ş: 's', Ş: 's', ğ: 'g', Ğ: 'g',
  ü: 'u', Ü: 'u', ö: 'o', Ö: 'o', ç: 'c', Ç: 'c',
  â: 'a', Â: 'a', î: 'i', Î: 'i', û: 'u', Û: 'u',
};

/** CouchDB veritabanı adı en fazla 64 karakter olabilir; güvenli pay bırakır. */
const MAX_LENGTH = 60;

export function dbNameFrom(businessName: string): string {
  // Aksanlı harfleri soy (é → e, ñ → n)
  let s = (businessName ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Türkçe harfleri indirge
  s = s
    .split('')
    .map((ch) => TR_MAP[ch] ?? ch)
    .join('');

  s = s.toLowerCase();

  // Harf/rakam dışı her şey "_" olur (ardışıklar tek "_" olur)
  s = s.replace(/[^a-z0-9]+/g, '_');
  s = s.replace(/^_+|_+$/g, '');

  if (!s) return 'isletme';

  // CouchDB'de veritabanı adı harfle başlamalı
  if (!/^[a-z]/.test(s)) s = `b_${s}`;

  return s.slice(0, MAX_LENGTH);
}

/** Veritabanı adının CouchDB kurallarına uygun olduğunu doğrular. */
export function isValidDbName(name: string): boolean {
  return /^[a-z][a-z0-9_$()+/-]*$/.test(name) && !name.startsWith('_');
}