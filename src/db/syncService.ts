import { encodeStoredValue, decodeStoredValue, splitStoredAddress } from './credentialStorage';
import { startCouchDbSync, stopCouchDbSync, type CouchAuth, type SyncStatus } from './pouch';

/**
 * Bulut eşitleme — hesap (base) başına ayrı veritabanı.
 *
 * Her hesabın kendi uzak veritabanı vardır (`Account.databaseName`). Böylece
 * iki mağazanın verisi birbirine karışmaz. Veritabanı sunucuda yoksa ilk
 * eşitlemede kendiliğinden oluşturulur.
 *
 * Bağlantı adresleri sırayla denenir: önce hesabın kayıtlı adresi, sonra
 * aynı Wi-Fi'daki bilgisayar, en son alan adı. İlk yanıt veren kazanır —
 * yani eve gelince LAN'a, dışarıdayken alan adına kendiliğinden bağlanır.
 */

export interface SyncEndpoint {
  id: string;
  /** Taban adres — veritabanı adı otomatik eklenir. */
  url: string;
  kind: 'lan' | 'domain' | 'account';
}

export interface SyncConfig {
  endpoints: SyncEndpoint[];
  username: string;
  password: string;
  enabled: boolean;
}

/**
 * Kullanıcının gireceği adresler (panelde listelenir).
 * LAN adresi bilgisayarın mevcut Wi-Fi IP'siyle doldurulur — kurulumdan sonra
 * çalışır durumda gelir. IP değişirse panelden güncellenmesi yeterlidir.
 */
export const DEFAULT_SYNC_CONFIG: SyncConfig = {
  endpoints: [
    { id: 'lan', url: 'http://192.168.1.8:5984', kind: 'lan' },
    { id: 'domain', url: '', kind: 'domain' },
  ],
  username: 'biznes_app',
  password: '',
  enabled: false,
};

const STORAGE_KEY = 'bh_sync_config';

export type ProbeFailure = 'empty' | 'unreachable' | 'unauthorized' | 'notCouch' | 'dbMissing';
export interface ProbeResult {
  ok: boolean;
  failure?: ProbeFailure;
}

export interface EndpointAttempt {
  url: string;
  kind: SyncEndpoint['kind'];
  ok: boolean;
  failure?: ProbeFailure;
}

export function loadSyncConfig(): SyncConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SYNC_CONFIG, endpoints: DEFAULT_SYNC_CONFIG.endpoints.map((e) => ({ ...e })) };
    const parsed = JSON.parse(raw) as Partial<SyncConfig> & { storageVersion?: number };
    if (parsed.storageVersion === 2) {
      const secret = decodeStoredValue<{ password: string; endpoints: SyncEndpoint[] }>(localStorage.getItem(STORAGE_KEY + '_credentials') ?? '');
      parsed.password = secret.password; parsed.endpoints = secret.endpoints;
    }
    const stored = Array.isArray(parsed.endpoints) ? parsed.endpoints : [];
    // Eksik/bozuk kayıtları varsayılanlarla tamamla — eski sürümden kalan
    // boş adresler eşitlemeyi sessizce engelliyordu.
    const endpoints = DEFAULT_SYNC_CONFIG.endpoints.map((def) => {
      const found = stored.find((e) => e && e.kind === def.kind);
      // Boş kayıt da "eksik" sayılır — eski sürümden kalma boş adresler
      // eşitlemeyi sessizce engelliyordu, varsayılana döndürülür.
      const usable = found && typeof found.url === 'string' && found.url.trim();
      return usable ? { ...def, url: found.url } : { ...def };
    });
    const config: SyncConfig = {
      endpoints,
      username: typeof parsed.username === 'string' && parsed.username ? parsed.username : DEFAULT_SYNC_CONFIG.username,
      password: typeof parsed.password === 'string' ? parsed.password : DEFAULT_SYNC_CONFIG.password,
      enabled: parsed.enabled === true,
    };
    if (parsed.storageVersion !== 2) saveSyncConfig(config);
    return config;
  } catch {
    return { ...DEFAULT_SYNC_CONFIG, endpoints: DEFAULT_SYNC_CONFIG.endpoints.map((e) => ({ ...e })) };
  }
}

export function saveSyncConfig(config: SyncConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY + '_credentials', encodeStoredValue({ password: config.password, endpoints: config.endpoints }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...config, storageVersion: 2, password: undefined,
      endpoints: config.endpoints.map(endpoint => ({ ...endpoint, url: splitStoredAddress(endpoint.url).address })) }));
  } catch (error) {
    console.warn('SYNC_CONFIG_STORAGE_FAILED');
  }
}

function authHeader(auth?: CouchAuth): Record<string, string> {
  const headers: Record<string, string> = {};
  if (auth && auth.username) {
    headers.Authorization = `Basic ${btoa(unescape(encodeURIComponent(`${auth.username}:${auth.password}`)))}`;
  }
  return headers;
}

/** Adresin sonundaki veritabanı yolunu sıyırıp sunucu kökünü döndürür. */
export function serverRootOf(endpointUrl: string, remoteDb: string): string {
  let base = endpointUrl.trim().replace(/\/+$/, '');
  if (remoteDb && base.toLowerCase().endsWith('/' + remoteDb.toLowerCase())) {
    base = base.slice(0, -(remoteDb.length + 1));
  }
  return base;
}

export function buildRemoteDbUrl(endpointUrl: string, remoteDb: string): string {
  return `${serverRootOf(endpointUrl, remoteDb)}/${remoteDb}`;
}

/** Adres çalışıyor mu ve CouchDB mi? */
export async function probeEndpoint(
  endpointUrl: string,
  auth?: CouchAuth,
  timeoutMs = 5000,
  remoteDb?: string
): Promise<ProbeResult> {
  const base = serverRootOf(endpointUrl, remoteDb ?? '');
  if (!base) return { ok: false, failure: 'empty' };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${base}/`, { headers: authHeader(auth), signal: controller.signal });
    if (res.status === 401 || res.status === 403) return { ok: false, failure: 'unauthorized' };
    if (!res.ok) return { ok: false, failure: 'notCouch' };
    const info = (await res.json()) as { couchdb?: string };
    if (typeof info.couchdb !== 'string') return { ok: false, failure: 'notCouch' };
    return { ok: true };
  } catch {
    return { ok: false, failure: 'unreachable' };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Hesabın uzak veritabanını sunucuda yoksa oluşturur.
 *
 * CouchDB'da veritabanı oluşturma yetkisi yalnızca ADMIN'de vardır; normal
 * uygulama kullanıcısı `PUT` ile açamaz (401). Bu yüzden:
 *   - DB zaten varsa kullanılır,
 *   - yoksa oluşturulmayı deneriz; yetki yoksa `forbidden` döner ve
 *     uygulama kullanıcıya veritabanının bilgisayarda açılması gerektiğini söyler.
 * Böylece `_admin` yetkisi cihaza verilmez (aksi halde sunucudaki diğer
 * veritabanlarına da erişir olurdu).
 */
export type EnsureResult = 'created' | 'exists' | 'forbidden' | 'failed';

export async function ensureRemoteDatabase(
  endpointUrl: string,
  remoteDb: string,
  auth?: CouchAuth
): Promise<EnsureResult> {
  const base = serverRootOf(endpointUrl, remoteDb);
  if (!base || !remoteDb) return 'failed';
  const safeDb = remoteDb.toLowerCase().replace(/[^a-z0-9_$()+-]/g, '_');
  const headers = authHeader(auth);
  try {
    const head = await fetch(`${base}/${safeDb}`, { method: 'HEAD', headers });
    if (head.ok) return 'exists';

    const put = await fetch(`${base}/${safeDb}`, { method: 'PUT', headers });
    if (put.ok) return 'created';
    if (put.status === 412) return 'exists';
    if (put.status === 401 || put.status === 403) {
      // Yetki yok — belki başka biri (PC) az önce açmıştır.
      const again = await fetch(`${base}/${safeDb}`, { method: 'HEAD', headers });
      return again.ok ? 'exists' : 'forbidden';
    }
    return 'failed';
  } catch {
    return 'failed';
  }
}

export interface ResolvedEndpoint {
  endpoint: SyncEndpoint;
  remoteDb: string;
  remoteDbUrl: string;
}

export interface ResolveResult {
  resolved: ResolvedEndpoint | null;
  attempts: EndpointAttempt[];
}

const isLocalhost = (url: string): boolean => /^https?:\/\/(127\.0\.0\.1|localhost|\[::1\])/i.test(url.trim());

/** Sırayla dener, ilk çalışanı döndürür; her denemeyi de raporlar. */
export async function resolveEndpoint(
  remoteDb: string,
  config: SyncConfig,
  accountUrl?: string
): Promise<ResolveResult> {
  const auth = config.username ? { username: config.username, password: config.password } : undefined;
  const attempts: EndpointAttempt[] = [];

  // Sıra: hesabın kayıtlı adresi → LAN → alan adı
  const candidates: SyncEndpoint[] = [];
  if (accountUrl && accountUrl.trim() && !isLocalhost(accountUrl)) {
    candidates.push({ id: 'account', url: accountUrl.trim(), kind: 'account' });
  }
  for (const e of config.endpoints) {
    if (e.url.trim() && !candidates.some((c) => c.url.trim() === e.url.trim())) {
      candidates.push({ ...e });
    }
  }

  for (const endpoint of candidates) {
    const probe = await probeEndpoint(endpoint.url, auth, 5000, remoteDb);
    if (!probe.ok) {
      attempts.push({ url: endpoint.url, kind: endpoint.kind, ok: false, failure: probe.failure });
      continue;
    }
    const ensured = await ensureRemoteDatabase(endpoint.url, remoteDb, auth);
    if (ensured === 'failed' || ensured === 'forbidden') {
      attempts.push({ url: endpoint.url, kind: endpoint.kind, ok: false, failure: 'dbMissing' });
      continue;
    }
    attempts.push({ url: endpoint.url, kind: endpoint.kind, ok: true });
    return {
      resolved: { endpoint, remoteDb, remoteDbUrl: buildRemoteDbUrl(endpoint.url, remoteDb) },
      attempts,
    };
  }
  return { resolved: null, attempts };
}

export interface StartSyncOptions {
  storeDbName: string;
  remoteDb: string;
  accountUrl?: string;
  onStatus?: (status: SyncStatus) => void;
  onResolved?: (result: ResolveResult) => void;
  onDocsChanged?: () => void;
}

/** Bir hesabın veritabanını uzak sunucuyla çift yönlü eşitler. */
export function startAccountSync(options: StartSyncOptions): () => void {
  const { storeDbName, remoteDb, accountUrl, onStatus, onResolved, onDocsChanged } = options;
  const config = loadSyncConfig();
  if (!config.enabled || !remoteDb) {
    onResolved?.({ resolved: null, attempts: [] });
    return () => {};
  }
  const auth = config.username ? { username: config.username, password: config.password } : undefined;

  let cancelled = false;
  let stopCurrent: (() => void) | null = null;

  void resolveEndpoint(remoteDb, config, accountUrl).then((result) => {
    if (cancelled) return;
    onResolved?.(result);
    if (!result.resolved) {
      onStatus?.({
        status: 'offline',
        message: 'Sunucuya ulaşılamıyor — veriler cihazda saklanıyor',
      });
      return;
    }
    const { endpoint, remoteDbUrl } = result.resolved;
    stopCurrent = startCouchDbSync(
      storeDbName,
      remoteDbUrl,
      auth,
      (status) => {
        const label =
          endpoint.kind === 'domain'
            ? 'İnternet'
            : endpoint.kind === 'account'
              ? 'Kayıtlı sunucu'
              : 'Yerel ağ';
        onStatus?.({ ...status, message: `${label}: ${status.message}` });
      },
      onDocsChanged
    );
  });

  return () => {
    cancelled = true;
    if (stopCurrent) stopCurrent();
    else stopCouchDbSync(storeDbName);
  };
}

export function stopAccountSync(storeDbName: string): void {
  stopCouchDbSync(storeDbName);
}

/** Hata sebebini anlaşılır dile çevirir. */
export function failureMessage(reason: ProbeFailure | undefined): string {
  switch (reason) {
    case 'empty':
      return 'Adres boş — bilgisayarının adresini yaz.';
    case 'unauthorized':
      return 'Kullanıcı adı veya şifre hatalı.';
    case 'notCouch':
      return 'Bu adres CouchDB değil.';
    case 'dbMissing':
      return 'Hesabın veritabanı sunucuda yok ve cihaz açamıyor. Bilgisayarda oluşturulmalı.';
    case 'unreachable':
    default:
      return 'Bilgisayara ulaşılamıyor — aynı Wi-Fi ağında mısın?';
  }
}
