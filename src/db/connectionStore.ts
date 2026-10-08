import {
  basicAuth,
  describeFetchError,
  describeStatus,
  parseCouchDbAddress,
  type ParsedAddress,
} from './couchAddress';
import { startCouchDbSync, getLocalDatabase, upsertDocsBatch, type CouchAuth, type SyncStatus } from './pouch';
import type { LanguageCode } from '../types';
import { translations } from '../locales/i18n';

/** Bağlantı durum metinleri seçili dilde döner (tek dil kuralı). */
function syncMessage(s: SyncStatus, db: string, language: LanguageCode): string {
  const t = translations[language]?.conn ?? translations.en.conn;
  switch (s.status) {
    case 'active':
      return t.statusConnecting;
    case 'paused':
      return `${t.statusConnected} · ${db}`;
    case 'denied':
      return t.denied;
    case 'error':
      return t.statusError;
    case 'offline':
      return t.statusOffline;
    default:
      return s.message || t.statusConnected;
  }
}

/**
 * Hesap başına iki CouchDB bağlantısı yönetimi.
 *
 *   • local  — aynı Wi-Fi (bilgisayarın adresi)
 *   • online — alan adı
 *
 * Kurallar:
 *   • Aynı anda SADECE BİR bağlantı aktif olur; diğeri otomatik kapanır.
 *   • Yeşil ikona tekrar basılırsa o bağlantı durur.
 *   • Uygulama yeniden açıldığında son aktif bağlantı otomatik başlar.
 *   • Bağlantı koparsa otomatik tekrar denenir.
 *
 * Bu dosyada sabit adres/IP yoktur — kullanıcı yapıştırdığı adres kullanılır.
 */

export type ConnectionKind = 'local' | 'online';

/**
 * İkon renkleri:
 *   idle      = bağlı değil (gri)
 *   connecting= bağlanıyor (sarı)
 *   connected = bağlı ve akış çalışıyor (yeşil)
 *   ok        = bağlantı TESTEDİldi ama henüz bağlı değil (mavi)
 *   error     = hata (kırmızı)
 *
 * `ok` ayrı bir durumdur: başarılı bir test "bağlı" demek değildir. (Ayrı
 * dursaydı bağlan düğmesi yanlışlıkla "durdur"a dönüşürdü.)
 */
export type LinkState = 'idle' | 'connecting' | 'connected' | 'ok' | 'error';

export interface StoredConnection {
  local: string;
  online: string;
  /** Hangi bağlantı son kullanıldı (yeniden açılışta otomatik başlatılır). */
  active: ConnectionKind | null;
}

export interface LinkStatus {
  state: LinkState;
  message: string;
}

export type LinkStatusMap = Record<ConnectionKind, LinkStatus>;

const STORAGE_PREFIX = 'bh_couch_conn_';

export function emptyConnection(): StoredConnection {
  return { local: '', online: '', active: null };
}

export function loadConnection(accountId: string): StoredConnection {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + accountId);
    if (!raw) return emptyConnection();
    const p = JSON.parse(raw) as Partial<StoredConnection>;
    return {
      local: typeof p.local === 'string' ? p.local : '',
      online: typeof p.online === 'string' ? p.online : '',
      active: p.active === 'local' || p.active === 'online' ? p.active : null,
    };
  } catch {
    return emptyConnection();
  }
}

export function saveConnection(accountId: string, conn: StoredConnection): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + accountId, JSON.stringify(conn));
  } catch (error) {
    console.warn('Bağlantı ayarı kaydedilemedi', error);
  }
}

/** Adresi güvenli gösterim için maskeler: http://kullanici:••••@host/db */
export function maskAddress(raw: string): string {
  try {
    const a = parseCouchDbAddress(raw);
    return `http://${a.username}:••••@${a.host}:${a.port}/${a.database}`;
  } catch {
    return raw;
  }
}

export interface TestResult {
  ok: boolean;
  /** Adım adım sonuç (kullanıcıya ne olduğunu anlatır). */
  step: 'server' | 'auth' | 'db';
  message: string;
}

/**
 * Üç kademeli bağlantı testi:
 *   a) GET /            → sunucuya ulaşılabiliyor mu
 *   b) kimlik doğrulama → kullanıcı/şifre doğru mu
 *   c) GET /db          → veritabanı var mı
 *
 * Hata mesajlarında gerçek neden (durum kodu / hata adı) yazar; parola asla görünmez.
 */
export async function testAddress(raw: string, timeoutMs = 8000): Promise<TestResult> {
  let addr: ParsedAddress;
  try {
    addr = parseCouchDbAddress(raw);
  } catch (err) {
    const code = err instanceof Error ? err.message : 'badFormat';
    return { ok: false, step: 'server', message: addressMessage(code) };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const headers = { Authorization: basicAuth(addr.username, addr.password) };
  const secrets = [addr.password, addr.username];

  try {
    // a) Sunucu
    let res: Response;
    try {
      res = await fetch(`${addr.protocol}://${addr.host}:${addr.port}/`, {
        headers,
        signal: controller.signal,
      });
    } catch (err) {
      return { ok: false, step: 'server', message: describeFetchError(err, addr, secrets) };
    }
    if (res.status === 401 || res.status === 403) {
      return { ok: false, step: 'auth', message: 'Kullanıcı adı veya şifre hatalı' };
    }
    if (!res.ok) {
      return { ok: false, step: 'server', message: describeStatus(res.status, addr) };
    }

    // c) Veritabanı
    let dbRes: Response;
    try {
      dbRes = await fetch(addr.remoteUrl, { headers, signal: controller.signal });
    } catch (err) {
      return { ok: false, step: 'db', message: describeFetchError(err, addr, secrets) };
    }
    if (dbRes.status === 401 || dbRes.status === 403) {
      return { ok: false, step: 'auth', message: 'Kullanıcı adı veya şifre hatalı' };
    }
    if (!dbRes.ok) {
      return { ok: false, step: 'db', message: describeStatus(dbRes.status, addr) };
    }

    return { ok: true, step: 'db', message: 'Bağlantı başarılı: ' + addr.database };
  } catch (err) {
    return { ok: false, step: 'server', message: describeFetchError(err, addr, secrets) };
  } finally {
    clearTimeout(timer);
  }
}

function addressMessage(code: string): string {
  switch (code) {
    case 'empty':
      return 'Adres boş';
    case 'noDatabase':
      return 'Veritabanı adı eksik';
    case 'noCredentials':
      return 'Kullanıcı adı veya şifre eksik';
    default:
      return 'Adres okunamadı';
  }
}

interface Running {
  stop: () => void;
  accountId: string;
  storeDb: string;
  kind: ConnectionKind;
}

let running: Running | null = null;

/** Yalnızca bir bağlantı aktif olabilir; yenisi başlatılırsa eskisi durur. */
export function stopCurrent(): void {
  if (running) {
    running.stop();
    running = null;
  }
}

export type MergeChoice = 'merge' | 'serverOnly';

export interface MergePrompt {
  needsChoice: boolean;
  localCount: number;
  remoteCount: number;
}

async function docCount(url: string, headers: Record<string, string>): Promise<number> {
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) return 0;
    const info = (await res.json()) as { doc_count?: number };
    return info.doc_count ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Bağlanmadan önce: telefonda veri varsa ve sunucuda da veri varsa kullanıcıya
 * sorulur — "Telefondaki verilerle birleştir" / "Sadece sunucudakini al".
 */
export async function checkMergeNeeded(
  storeDb: string,
  addr: ParsedAddress
): Promise<MergePrompt> {
  let localCount = 0;
  try {
    const db = getLocalDatabase(storeDb);
    localCount = (await db.allDocs()).rows.length;
  } catch {
    localCount = 0;
  }
  const remoteCount = await docCount(addr.remoteUrl, {
    Authorization: basicAuth(addr.username, addr.password),
  });
  // Yerel DB'de her zaman birkaç sistem belgesi var (birimler, genel müşteri…);
  // eşiğin üstünde gerçek kullanıcı verisi sayılır.
  const hasLocalData = localCount > 3;
  return { needsChoice: hasLocalData && remoteCount > 0, localCount, remoteCount };
}

/** "Sadece sunucudakini al" — yerel hesap verilerini tombstone ile temizler. */
export async function clearLocalData(storeDb: string): Promise<void> {
  const db = getLocalDatabase(storeDb);
  const res = await db.allDocs();
  const ids = res.rows
    .map((r) => r.key)
    .filter((k): k is string => typeof k === 'string' && !k.startsWith('_design/'));
  if (ids.length === 0) return;
  await upsertDocsBatch(
    storeDb,
    ids.map((id) => ({ id, fields: { _deleted: true, tombstone: true, deletedAt: Date.now() } }))
  );
}

/** İlk aktarımın ilerlemesi. */
export interface TransferProgress {
  /** Sunucudan gelen belge sayısı. */
  received: number;
  /** Sunucuya gönderilen belge sayısı. */
  sent: number;
  /** İlk aktarım bitti mi? */
  done: boolean;
  /** Sunucudaki toplam belge (tahmin için). */
  remoteTotal: number;
}

export interface StartOptions {
  accountId: string;
  storeDb: string;
  kind: ConnectionKind;
  raw: string;
  onStatus: (status: LinkStatusMap) => void;
  onDocsChanged?: () => void;
  /** İlk aktarım sırasında ilerleme bildirimi. */
  onProgress?: (p: TransferProgress) => void;
  /**
   * Telefonda veri varsa sorulacak seçim. Verilmezse birleştirme varsayılan
   * kabul edilir (veri kaybı olmaz).
   */
  mergeChoice?: MergeChoice;
  /** Sunucuda da veri varsa ve mergeChoice verilmemişse çağrılır. */
  onMergeNeeded?: (prompt: MergePrompt) => Promise<MergeChoice>;
  /** Durum metinleri bu dilde döner (verilmezse Türkçe). */
  language?: LanguageCode;
}

/** Bağlantıyı başlatır. Önce test eder, sonra canlı senkron açar. */
export async function startConnection(opts: StartOptions): Promise<TestResult> {
  const { accountId, storeDb, kind, raw, onStatus, onDocsChanged } = opts;
  const language: LanguageCode = opts.language ?? 'tr';

  const tConn = translations[language]?.conn ?? translations.en.conn;
  onStatus({ local: { state: 'connecting', message: tConn.connecting }, online: { state: 'connecting', message: tConn.connecting } });

  const test = await testAddress(raw);
  if (!test.ok) {
    const state: LinkStatus = {
      state: 'error',
      message: test.step === 'server' && test.message.includes('Zaman') ? test.message : test.message,
    };
    const map: LinkStatusMap =
      kind === 'local'
        ? { local: state, online: { state: 'idle', message: '' } }
        : { local: { state: 'idle', message: '' }, online: state };
    onStatus(map);
    return test;
  }

  let addr: ParsedAddress;
  try {
    addr = parseCouchDbAddress(raw);
  } catch {
    return { ok: false, step: 'server', message: 'Adres okunamadı' };
  }

  // Aynı anda tek bağlantı: öncekin�� durdur
  stopCurrent();

  // Veri birleştirme: telefonda da, sunucuda da veri varsa sor
  let choice: MergeChoice = opts.mergeChoice ?? 'merge';
  if (!opts.mergeChoice && opts.onMergeNeeded) {
    const prompt = await checkMergeNeeded(storeDb, addr);
    if (prompt.needsChoice) {
      choice = await opts.onMergeNeeded(prompt);
      if (choice === 'serverOnly') {
        await clearLocalData(storeDb);
      }
    }
  }

  const auth: CouchAuth = { username: addr.username, password: addr.password };
  const okState = (msg: string): LinkStatusMap =>
    kind === 'local'
      ? { local: { state: 'connected', message: msg }, online: { state: 'idle', message: '' } }
      : { local: { state: 'idle', message: '' }, online: { state: 'connected', message: msg } };

  // İlk aktarım sayaçları + sunucudaki toplam belge (ilerleme için)
  let received = 0;
  let sent = 0;
  let sawChange = false;
  const remoteTotal = await docCount(addr.remoteUrl, {
    Authorization: basicAuth(addr.username, addr.password),
  });
  opts.onProgress?.({ received, sent, done: false, remoteTotal });

  const stop = startCouchDbSync(
    storeDb,
    addr.remoteUrl,
    auth,
    (s: SyncStatus) => {
      const msg = syncMessage(s, addr.database, language);
      // "paused" = o an için eşitleme bitti. İlk aktarım burada tamamlanır.
      if (s.status === 'paused' && !s.message.includes('Sunucu bekleniyor')) {
        if (sawChange) {
          opts.onProgress?.({ received, sent, done: true, remoteTotal });
          // İlk aktarım bitti — köprü aktarımı + arayüz tazeleme tetikle
          onDocsChanged?.();
          received = 0;
          sent = 0;
          sawChange = false;
        }
      }
      if (s.status === 'error' || s.status === 'denied') {
        const st: LinkStatus = { state: 'error', message: msg };
        onStatus(kind === 'local'
          ? { local: st, online: { state: 'idle', message: '' } }
          : { local: { state: 'idle', message: '' }, online: st });
      } else {
        onStatus(okState(msg));
      }
    },
    (info) => {
      sawChange = true;
      received += info.read;
      sent += info.written;
      opts.onProgress?.({ received, sent, done: false, remoteTotal });
    }
  );

  running = { stop, accountId, storeDb, kind };

  // "Son aktif bağlantı" bilgisini kalıcı yaz
  const conn = loadConnection(accountId);
  conn.active = kind;
  saveConnection(accountId, conn);

  return test;
}

/** Uygulama açılışında son aktif bağlantıyı otomatik başlatır. */
export async function resumeLastConnection(
  accountId: string,
  storeDb: string,
  onStatus: (status: LinkStatusMap) => void,
  onDocsChanged?: () => void,
  language?: LanguageCode
): Promise<void> {
  const conn = loadConnection(accountId);
  if (!conn.active) return;
  const raw = conn.active === 'local' ? conn.local : conn.online;
  if (!raw.trim()) return;
  await startConnection({ accountId, storeDb, kind: conn.active, raw, onStatus, onDocsChanged, language });
}