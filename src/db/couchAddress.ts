/**
 * CouchDB adres ayrıştırıcı.
 *
 * Kullanıcı yapıştırabileceği biçim:
 *   http://bizneshasap:EXAMPLE_PASSWORD@192.168.1.8:5984/bim_market
 *   http://bizneshasap:EXAMPLE_PASSWORD@dbpanel.hmxagent.cfd:5984/bim_market
 *
 * Parola URL-kodlü olabilir (`%40` = @ gibi) — çözülür.
 * Kullanıcı/parola adresten çıkarılır ve Basic Auth header'ı olarak gönderilir
 * (parola URL'e gömülü kalmaz).
 *
 * Bu dosyada HİÇBİR sabit adres/IP yoktur — kullanıcı ne yapıştırırsa o kullanılır.
 */

export interface ParsedAddress {
  /** http: | https: */
  protocol: 'http' | 'https';
  username: string;
  password: string;
  host: string;
  /** Verilmediyse şema varsayılanı (http→5984, https→443). */
  port: number;
  database: string;
  /** Doğrudan kullanılabilir uzak adres (kimlik bilgisi içermez). */
  remoteUrl: string;
}

export type AddressError =
  | 'empty'
  | 'badFormat'
  | 'noDatabase'
  | 'noCredentials';

const DEFAULT_PORTS: Record<'http' | 'https', number> = { http: 5984, https: 443 };

/** Güvenli çözümleme: new URL hata verirse elle ayrıştırır. */
function decode(part: string): string {
  try {
    return decodeURIComponent(part);
  } catch {
    return part;
  }
}

export function parseCouchDbAddress(input: string): ParsedAddress {
  const raw = (input ?? '').trim();
  if (!raw) throw new Error('empty');

  // Kullanıcı bazen şemayı yazmayı unutur: "192.168.1.8:5984/db" → ekle
  const withScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(raw) ? raw : `http://${raw}`;

  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    throw new Error('badFormat');
  }

  const protocol = url.protocol.replace(':', '').toLowerCase();
  if (protocol !== 'http' && protocol !== 'https') throw new Error('badFormat');
  if (!url.hostname) throw new Error('badFormat');

  const port = url.port ? parseInt(url.port, 10) : DEFAULT_PORTS[protocol];
  const database = decode(url.pathname.replace(/^\/+/, '').replace(/\/+$/, ''));

  if (!database) throw new Error('noDatabase');

  const username = decode(url.username ?? '');
  const password = decode(url.password ?? '');
  if (!username || !password) throw new Error('noCredentials');

  const hostForUrl = url.port ? `${url.hostname}:${port}` : url.hostname;

  return {
    protocol,
    username,
    password,
    host: url.hostname,
    port,
    database,
    // Parola URL'e gömülmez — header ile gider
    remoteUrl: `${protocol}://${hostForUrl}/${database}`,
  };
}

export function isParsableAddress(input: string): boolean {
  try {
    parseCouchDbAddress(input);
    return true;
  } catch {
    return false;
  }
}

/** Basic Auth header değeri. */
export function basicAuth(username: string, password: string): string {
  const raw = `${username}:${password}`;
  // Türkçe karakterli parolalar için UTF-8 → base64
  const bytes = new TextEncoder().encode(raw);
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return `Basic ${btoa(binary)}`;
}

/** Hata kodunu Türkçe mesaja çevirir. */
export function addressErrorMessage(code: string): string {
  switch (code) {
    case 'empty':
      return 'Adres boş. Örnek: http://kullanıcı:şifre@192.168.1.8:5984/bim_market';
    case 'badFormat':
      return 'Adres okunamadı. Biçim: http://kullanıcı:şifre@sunucu:5984/veritabanı';
    case 'noDatabase':
      return 'Veritabanı adı eksik. Adresin sonunda /bim_market gibi bir ad olmalı.';
    case 'noCredentials':
      return 'Kullanıcı adı veya şifre eksik. Biçim: http://kullanıcı:şifre@sunucu:5984/veritabanı';
    default:
      return 'Adres geçersiz.';
  }
}

/**
 * Parolaları (ve kullanıcı adlarını) metinden siler.
 *
 * Hata mesajları ve loglarda parola ASLA görünmemeli. Tarayıcının hata
 * metinlerinde gizmediği durumlar oluşabilir; burada her yolda temizliyoruz.
 */
export function redactSecrets(text: string, secrets: ReadonlyArray<string | undefined>): string {
  let out = text;
  for (const secret of secrets) {
    if (!secret || secret.length < 3) continue;
    while (out.includes(secret)) out = out.replace(secret, '••••');
  }
  // URL içindeki kullanıcı:parola@ kalıbını da temizle
  out = out.replace(/(\w+):([^@\s/]+)@/g, '$1:••••@');
  // Authorization header kalıbı
  out = out.replace(/(Basic\s+)[\w+/=]+/gi, '$1••••');
  return out;
}

/** Sayfayı barındıran origin (mixed content teşhisi için). */
export function currentOrigin(): string {
  try {
    return typeof location !== 'undefined' ? location.origin : '';
  } catch {
    return '';
  }
}

/** https sayfadan http adrese gidiyorsa WebView engeller — en olası sebep budur. */
export function isMixedContentBlocked(targetProtocol: 'http' | 'https'): boolean {
  const origin = currentOrigin();
  return targetProtocol === 'http' && origin.toLowerCase().startsWith('https:');
}

/**
 * `fetch` hatasını kullanıcının anlayacağı Türkçe metne çevirir.
 * Tarayıcı "Failed to fetch" gibi belirsiz mesajlar verdiği için olası nedenleri
 * sırayla deniyoruz ve gerçek ipucunu (durum kodu / hata adı) gösteriyoruz.
 */
export function describeFetchError(
  err: unknown,
  addr: { protocol: 'http' | 'https'; host: string; port: number; database: string },
  secrets: ReadonlyArray<string | undefined> = []
): string {
  const name = err instanceof Error ? err.name : '';
  const raw = err instanceof Error ? err.message : String(err ?? '');
  const clean = redactSecrets(raw, secrets);

  if (name === 'AbortError' || /abort|timeout/i.test(clean)) {
    return `Zaman aşımı — ${addr.host}:${addr.port} yanıt vermedi (süre doldu)`;
  }
  if (isMixedContentBlocked(addr.protocol)) {
    return (
      `Engellendi: uygulama https origin'inden http://${addr.host}:${addr.port} adresine ` +
      `bağlanamıyor (mixed content). Bu bir hata değil — sunucu çalışıyor olabilir.`
    );
  }
  if (/Failed to fetch|NetworkError|ERR_/i.test(clean)) {
    return (
      `Sunucuya ulaşılamıyor (${addr.host}:${addr.port}). ` +
      `Olası nedenler: aynı ağda değilsiniz, sunucu kapalı, ` +
      `güvenlik duvarı 5984'ü engelliyor veya alan adı/IP hatalı.`
    );
  }
  return `Bağlantı hatası: ${clean}`;
}

/** HTTP durum kodunu Türkçe açıklama ile döndürür. */
export function describeStatus(status: number, addr: { host: string; port: number; database: string }): string {
  switch (status) {
    case 401:
    case 403:
      return 'Kullanıcı adı veya şifre hatalı';
    case 404:
      return `Veritabanı bulunamadı: ${addr.database}`;
    case 405:
      return 'Sunucu bu isteği kabul etmiyor (CORS ayarı eksik olabilir)';
    case 408:
    case 504:
      return 'Zaman aşımı — sunucu yanıt vermedi';
    case 500:
    case 502:
    case 503:
      return `Sunucu hatası (HTTP ${status})`;
    default:
      return `Sunucu yanıtı: HTTP ${status}`;
  }
}