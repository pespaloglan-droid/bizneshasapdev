import { measureOperation } from '../utils/performance';
import { buildSelectivePullSelector, type SyncHistoryMonths } from './syncSelection';
import PouchDB from 'pouchdb-browser';
import { getLicenseId } from '../utils/gateMiddleware';
import { ensureCryptoPlugin } from './cryptoPlugin';
import { getCachedPassword, isEncryptionEnabled, isEncryptionPrepared } from './encryptionState';
import { prepareDocumentForWrite } from './validation';
import { translate } from '../locales/i18n';
import { getActiveLanguage } from '../utils/locale';

export interface SyncStatus {
  status: 'idle' | 'active' | 'paused' | 'denied' | 'error' | 'offline';
  message: string;
  lastSyncTime?: string;
}

const dbInstances = new Map<string, any>();
const syncInstances = new Map<string, any>();

// Lisans anahtarı cache (performans için)
let cachedDbKey: number[] | null = null;
let lastKeyCheck = 0;
const KEY_CACHE_TTL = 60000; // 1 dakika

/**
 * Lisanstan türetilen DB anahtarını alır.
 * Lisans yoksa null döner - DB açılamaz.
 * Spec bölüm 8 + 16.1: Asıl koruma burada.
 *
 * Dışa açık: şifreli DB açarken (dbEncryption.ts) aynı anahtarı kullanır —
 * ikinci bir türetme yolu olmasın diye tek kaynak burasıdır.
 */
export async function getDatabaseKey(): Promise<number[] | null> {
  const now = Date.now();
  
  // Cache geçerliyse kullan
  if (cachedDbKey && (now - lastKeyCheck) < KEY_CACHE_TTL) {
    return cachedDbKey;
  }
  
  // Electron ortamında electronAPI üzerinden deriveKey çağır
  if (typeof window !== 'undefined' && (window as any).electronAPI?.deriveLicenseKey) {
    try {
      // preload imzası: deriveLicenseKey(licenseId, purpose)
      const licenseId = getLicenseId();
      const rawKey = await (window as any).electronAPI.deriveLicenseKey(licenseId, 'db');
      if (!rawKey) {
        cachedDbKey = null;
        return null;
      }
      cachedDbKey = Array.from(rawKey as ArrayLike<number>);
      lastKeyCheck = now;
      return cachedDbKey;
    } catch (e) {
      console.warn('License key derivation failed:', e);
      cachedDbKey = null;
      return null;
    }
  }
  
  // Electron dışında (test/dev) - anahtar yok
  return null;
}

/** Testler için anahtar önbelleğini sıfırlar. Üretim kodunda çağırma. */
export function resetDatabaseKeyCacheForTests(): void {
  cachedDbKey = null;
  lastKeyCheck = 0;
}

export function sanitizeDbName(dbName: string): string {
  return dbName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
}

/** Şifreli DB adı: düz adın şifreli karşılığı. Aynı veri, ayrı kova. */
export function encryptedDbName(dbName: string): string {
  return `${sanitizeDbName(dbName)}_enc`;
}

/**
 * Kilit döngüsü önlemi (spec v3 §3.2): hesap/lisans verisi ASLA şifrelenmez.
 * Yoksa hesap seçilmeden lisans açılamaz, lisans olmadan hesap açılamaz.
 */
const NEVER_ENCRYPTED_DBS: ReadonlySet<string> = new Set(['system_accounts']);

/**
 * Bu DB şifreli kovadan mı açılmalı?
 * Flag açık + açılış hazırlığı (prepareEncryption) tamamsa → evet.
 * Parola o an null olabilir (lisans sonradan gelir) — DB yine de şifreli
 * açılır, op anında parola tekrar türetilir (fail-closed).
 */
function shouldUseEncryptedDb(sanitizedName: string): boolean {
  if (NEVER_ENCRYPTED_DBS.has(sanitizedName)) return false;
  return isEncryptionEnabled() && isEncryptionPrepared();
}

/**
 * Lisans anahtarından DB parolası türetir (crypto-pouch string parola ister).
 * dbEncryption.getDbPassword ile aynı türetme — tek kaynak burası, o burayı çağırır.
 */
export async function deriveDbPassword(): Promise<string | null> {
  const key = await getDatabaseKey();
  if (!key || key.length === 0) return null;
  let binary = '';
  for (let i = 0; i < key.length; i += 1) {
    binary += String.fromCharCode(key[i] & 0xff);
  }
  return btoa(binary);
}

/** Her hesabın ürün / müşteri / fatura verisi bu anahtarla ayrı durur. */
export function getAccountStoreKey(account: { id: string }): string {
  return `store_${sanitizeDbName(account.id)}`;
}

/** 
 * Yerel PouchDB örneği getirir veya oluşturur.
 * Spec bölüm 16.1: Lisans yoksa DB açılamaz - asıl koruma burada.
 *
 * Şifreleme (FAZ 1.1): flag açık + hazırlık tamamsa `<ad>_enc` kovası açılır
 * ve her op `crypto()` tamamlanmadan çalışmaz. Parola hazırlıkta null kaldıysa
 * (lisans sonradan geldiyse) ilk op'ta tekrar türetilir — restart gerekmez.
 */
export function getLocalDatabase<T extends {} = {}>(dbName: string): PouchDB.Database<T> {
  const sanitizedName = sanitizeDbName(dbName);
  
  if (!dbInstances.has(sanitizedName)) {
    try {
      const encrypted = shouldUseEncryptedDb(sanitizedName);
      const db = new PouchDB<T>(
        `biznes_${encrypted ? encryptedDbName(sanitizedName) : sanitizedName}`,
        { auto_compaction: true }
      );

      // Şifreli dal: crypto() hazırlıktaki parolayla hemen başlar; yoksa op anında
      // lisanstan tekrar türetilir. Reddedilen promise op'a taşınır (sessizlik yok).
      let ensureCryptoReady: (() => Promise<void>) | null = null;
      if (encrypted) {
        ensureCryptoPlugin();
        let cryptoReady: Promise<unknown> | null = null;
        const startCrypto = (password: string) => {
          const p = (db as unknown as { crypto(pw: string): Promise<void> }).crypto(password);
          p.catch(() => {});
          return p;
        };
        const initialPassword = getCachedPassword();
        if (initialPassword) {
          cryptoReady = startCrypto(initialPassword);
        }
        ensureCryptoReady = async () => {
          if (!cryptoReady) {
            const password = await deriveDbPassword();
            if (!password) {
              const err = new Error('LICENSE_REQUIRED: Şifreli veritabanı için geçerli lisans gerekli');
              (err as Error & { code: string }).code = 'LICENSE_REQUIRED';
              throw err;
            }
            cryptoReady = startCrypto(password);
          }
          await cryptoReady;
        };
      }

      // DB wrapper: Her işlemde lisans kontrolü (+ şifreliyse crypto hazırlığı) yap
      const cryptoGate = ensureCryptoReady;
      const wrappedDb = new Proxy(db, {
        get(target, prop) {
          const original = (target as any)[prop];
          
          // Okuma/yazma işlemlerinde lisans kontrolü
          if (['get', 'put', 'post', 'allDocs', 'bulkDocs', 'query', 'find'].includes(String(prop))) {
            return async function(...args: any[]) {
              const key = await getDatabaseKey();
              if (!key) {
                const err = new Error('LICENSE_REQUIRED: Database access requires valid license');
                (err as any).code = 'LICENSE_REQUIRED';
                throw err;
              }
              if (cryptoGate) await cryptoGate();
              return original.apply(target, args);
            };
          }
          
          return typeof original === 'function' ? original.bind(target) : original;
        }
      });
      
      dbInstances.set(sanitizedName, wrappedDb);
    } catch (e) {
      console.warn('PouchDB instance creation warning:', e);
      // Minimal fallback stub
      const fallbackStub: any = {
        allDocs: async () => ({ rows: [] }),
        put: async (doc: any) => doc,
        get: async () => { throw new Error('Not found'); },
        remove: async () => ({ ok: true }),
        sync: () => ({ on: () => ({ on: () => {} }) })
      };
      dbInstances.set(sanitizedName, fallbackStub);
    }
  }
  return dbInstances.get(sanitizedName) as PouchDB.Database<T>;
}

/** Aynı belge için eşzamanlı yazmaları sıraya alır (conflict/409 ölüm döngüsünü önler). */
const writeLocks = new Map<string, Promise<unknown>>();

/** Audit DB'sinin kendi yazmaları ASLA loglanmaz (sonsuz döngü). auditLog.ts'deki AUDIT_DB ile aynı. */
const AUDIT_DB_NAME = 'audit';
type DocumentUpdate = Record<string, unknown> | ((current: Record<string, unknown> | undefined) => Record<string, unknown>);

export async function upsertDoc(
  dbName: string,
  id: string,
  fields: DocumentUpdate
): Promise<void> {
  const lockKey = `${dbName}::${id}`;
  const previous = writeLocks.get(lockKey) ?? Promise.resolve();
  const task = previous.catch(() => undefined).then(() => writeDocWithRetry(dbName, id, fields));
  writeLocks.set(lockKey, task);
  try {
    const { previousDoc, writtenDoc } = await task;
    // FAZ 2.2 audit: dinamik import — pouch ↔ auditLog döngüsünü kırar.
    // Bayrak kapalıysa logAudit no-op'tur; hata ana akışı bozmaz (kendi içinde yakalanır).
    if (dbName !== AUDIT_DB_NAME && !id.startsWith('_local/')) {
      try {
      const { logAudit, calculateDiff, docTypeFromId } = await import('./auditLog');
      void logAudit({
        action: previousDoc ? 'UPDATE' : 'CREATE',
        docType: docTypeFromId(id),
        docId: id,
        storeDb: dbName,
        changes: previousDoc ? calculateDiff(previousDoc, writtenDoc) : undefined,
      });
      } catch { console.warn('AUDIT_MODULE_UNAVAILABLE'); }
    }
  } finally {
    if (writeLocks.get(lockKey) === task) writeLocks.delete(lockKey);
  }
}

/**oku-then-yaz: eşzamanlı yazma olduysa rev tazelenip yeniden denenir. */
async function writeDocWithRetry(
  dbName: string,
  id: string,
  fields: DocumentUpdate
): Promise<{ previousDoc?: Record<string, unknown>; writtenDoc: Record<string, unknown> }> {
  const db = getLocalDatabase(dbName);
  let lastError: unknown;
  let previousDoc: Record<string, unknown> | undefined;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    let existing: Record<string, unknown> | undefined;
    previousDoc = undefined;
    try {
      existing = (await db.get(id)) as Record<string, unknown>;
      previousDoc = existing;
    } catch (error) {
      // Yetki/ağ/şifreleme hatası yeni belge demek değildir.
      if ((error as { status?: number } | null)?.status !== 404) throw error;
      const missing = error as { reason?: string; message?: string };
      if (missing.reason === 'deleted' || missing.message === 'deleted') {
        // get(), tombstone için 404 verir ama yeniden yaratmada son rev gerekir.
        const result = await db.allDocs({ keys: [id] });
        const row = result.rows[0];
        if (row && 'value' in row) existing = { _id: id, _rev: row.value.rev };
      }
    }
    const patch = typeof fields === 'function' ? fields(existing) : fields;
    const writtenDoc = prepareDocumentForWrite(id, patch, existing);
    try {
      await db.put(writtenDoc as never);
      return { previousDoc, writtenDoc };
    } catch (error) {
      lastError = error;
      // Yalnızca 409 conflict -> rev tazele, birleştir/doğrula, tekrar dene.
      if ((error as { status?: number } | null)?.status !== 409) throw error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

export async function removeDoc(dbName: string, id: string): Promise<boolean> {
  const db = getLocalDatabase(dbName);
  try {
    const doc = await db.get(id);
    await db.remove(doc);
    if (dbName !== AUDIT_DB_NAME) {
      const { logAudit, docTypeFromId } = await import('./auditLog');
      void logAudit({
        action: 'DELETE',
        docType: docTypeFromId(id),
        docId: id,
        storeDb: dbName,
      });
    }
    return true;
  } catch (err) {
    console.error('Failed to remove PouchDB doc', id, err);
    return false;
  }
}

/** Toplu yazma yığın boyutu (PouchDB `_bulk_docs`). */
export const BULK_BATCH_SIZE = 100;

/** Toplu yazmada şowsuz galan bir belge. */
export interface BatchWriteFailure {
  /** Yazylmadyk belginiň `_id`-si. */
  id: string;
  /** PouchDB ýalňyşlyk teksti (conflict, license we ş.m.). */
  error: string;
}

/** Toplu yazma jemi — ýazylan/şowsuz sanawy bilen (import hasabaty üçin). */
export interface BatchWriteResult {
  written: number;
  /** Birincil başarı sayısını değiştirmeyen, ayrıca raporlanan PC ayna hataları. */
  mirrorFailed?: number;
  failed: BatchWriteFailure[];
}

/** PouchDB bulkDocs jogabyndan okalýan ýalňyşlyk teksti. */
function bulkErrorText(row: unknown): string {
  const r = row as { message?: string; reason?: string; name?: string } | null;
  return r?.message || r?.reason || r?.name || 'unknown_error';
}

/**
 * Çok sayıda belgeyi topluca yazar (100'erlik gruplar).
 *
 * Tek tek `upsertDoc` çağırmak yüzlerce `get` + `put` demek; hem yavaştır hem
 * arayüzü meşgul eder. Burada rev'ler tek `allDocs` çağrısında alınır, yazma
 * `bulkDocs` ile yapılır — büyük veri aktarımında arayüzün donmasını önler.
 *
 * Kısmi başarı mumkin: her belge aýratyn netijelenýär. Şowsuz belgiler
 * YUTULMAÝAR — `failed` sanawyna aýratynlykda düşýär (satyr + sebäp).
 */
async function writeDocsBatch(
  dbName: string,
  entries: ReadonlyArray<{ id: string; fields: Record<string, unknown> }>,
  batchSize = BULK_BATCH_SIZE
): Promise<BatchWriteResult> {
  if (!Number.isSafeInteger(batchSize) || batchSize <= 0) {
    throw new RangeError(translate(getActiveLanguage(), 'errors.invalidBatchSize'));
  }
  if (entries.length === 0) return { written: 0, failed: [] };
  const db = getLocalDatabase(dbName);
  let written = 0;
  const failed: BatchWriteFailure[] = [];

  for (let i = 0; i < entries.length; i += batchSize) {
    const chunk = entries.slice(i, i + batchSize);
    const keys = chunk.map((e) => e.id);

    const existing = new Map<string, Record<string, unknown>>();
    try {
      const res = await db.allDocs({ keys, include_docs: true });
      for (const row of res.rows) {
        const rev = (row as { value?: { rev?: string } }).value?.rev;
        if (row.key && rev) {
          existing.set(row.key, {
            ...('doc' in row ? row.doc as Record<string, unknown> | null : undefined),
            _id: row.key, _rev: rev,
          });
        }
      }
    } catch {
      // Rev/gövde okunmadan kısmi belge bulk'a verilmez. Tekil güvenli yolu dene.
      for (const entry of chunk) {
        try {
          await upsertDoc(dbName, entry.id, entry.fields);
          written += 1;
        } catch (error) {
          failed.push({ id: entry.id, error: error instanceof Error ? error.message : String(error) });
        }
      }
      if (i + batchSize < entries.length) await new Promise((r) => setTimeout(r, 0));
      continue;
    }

    const docs: Array<Record<string, unknown> & { _id: string }> = [];
    const validEntries: typeof chunk = [];
    for (const entry of chunk) {
      try {
        docs.push(prepareDocumentForWrite(entry.id, entry.fields, existing.get(entry.id)));
        validEntries.push(entry);
      } catch (error) {
        failed.push({ id: entry.id, error: error instanceof Error ? error.message : String(error) });
      }
    }
    try {
      const res = docs.length ? await db.bulkDocs(docs as never[]) : [];
      for (let index = 0; index < docs.length; index += 1) {
        const row = res[index];
        const r = row as { id?: string; ok?: boolean };
        if (r?.ok) written += 1;
        else failed.push({ id: docs[index]._id, error: bulkErrorText(row) });
      }
    } catch {
      // Toplu yazma başarısızsa tek tek dene (kısmi başarı korunur)
      for (const entry of validEntries) {
        try {
          await upsertDoc(dbName, entry.id, entry.fields);
          written += 1;
        } catch (error) {
          failed.push({
            id: entry.id,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }

    // Arayüze nefes alma payı — donma olmasın
    if (i + batchSize < entries.length) {
      await new Promise((r) => setTimeout(r, 0));
    }
  }
  return { written, failed };
}

export function upsertDocsBatch(
  dbName: string,
  entries: ReadonlyArray<{ id: string; fields: Record<string, unknown> }>,
  batchSize = BULK_BATCH_SIZE
): Promise<BatchWriteResult> {
  return measureOperation('database.batch', () => writeDocsBatch(dbName, entries, batchSize));
}

export async function listDocsByPrefix(
  dbName: string,
  prefix: string
): Promise<Array<Record<string, unknown> & { _id: string }>> {
  const db = getLocalDatabase(dbName);
  const result = await db.allDocs({
    include_docs: true,
    startkey: prefix,
    endkey: `${prefix}\ufff0`
  });
  return result.rows
    .map((row) => row.doc as (Record<string, unknown> & { _id: string }) | undefined)
    .filter((doc): doc is Record<string, unknown> & { _id: string } => Boolean(doc));
}

export const masterAccountsDb = getLocalDatabase('system_accounts');

/**
 * Çift yönlü canlı senkronizasyon başlatır
 */
export interface CouchAuth {
  username: string;
  password: string;
}

/**
 * Çift yönlü canlı senkronizasyon başlatır.
 * @param localDbName  yerel veritabanı anahtarı (ör. store_<hesapId>)
 * @param remoteUrl    uzak veritabanının TAM adresi (ör. http://192.168.1.8:5984/biznes_hasap)
 * @param auth         CouchDB kullanıcı bilgileri (sunucu kimlik doğrulama istiyorsa zorunlu)
 */
export function startCouchDbSync(
  localDbName: string,
  remoteUrl: string,
  auth?: CouchAuth,
  onStatusChange?: (status: SyncStatus) => void,
  /** Aktarım ilerlemesi: kaç belge geldi / gitti. */
  onDocsChanged?: (info: { written: number; read: number }) => void,
  historyMonths: SyncHistoryMonths = 0
): () => void {
  try {
    const localDb = getLocalDatabase(localDbName);
    if (!localDb || typeof localDb.sync !== 'function') return () => {};

    const targetRemoteUrl = remoteUrl.replace(/\/$/, '');

    stopCouchDbSync(localDbName);

    const remoteOptions: Record<string, unknown> = {};
    if (auth && auth.username) {
      remoteOptions.auth = { username: auth.username, password: auth.password };
    }

    const remoteDb = new PouchDB(targetRemoteUrl, remoteOptions);

    const syncHandler = localDb.sync(remoteDb, {
      live: true,
      retry: true,
      ...(historyMonths === 3 || historyMonths === 12 ? {
        pull: { selector: buildSelectivePullSelector(historyMonths) },
        push: {},
      } : {}),
      back_off_function: (delay: number) => (delay === 0 ? 1000 : delay * 2 > 30000 ? 30000 : delay * 2)
    });

    if (syncHandler && typeof syncHandler.on === 'function') {
      syncHandler
        .on('change', (info: any) => {
          onDocsChanged?.({
            written: info?.change?.docs_written ?? 0,
            read: info?.change?.docs_read ?? 0,
          });
          onStatusChange?.({
            status: 'active',
            message: `Canlı eşitlendi (${info.change?.docs_written || 1} kayıt)`,
            lastSyncTime: new Date().toLocaleTimeString()
          });
        })
        .on('paused', (err: any) => {
          if (err) {
            onStatusChange?.({
              status: 'offline',
              message: 'CouchDB bekleniyor (Çevrimdışı mod)'
            });
          } else {
            onStatusChange?.({
              status: 'paused',
              message: 'Veriler güncel ve eşitlendi',
              lastSyncTime: new Date().toLocaleTimeString()
            });
          }
        })
        .on('active', () => {
          onStatusChange?.({
            status: 'active',
            message: 'Eşitleme devam ediyor...'
          });
        })
        .on('denied', (err: any) => {
          onStatusChange?.({
            status: 'denied',
            message: `Erişim reddedildi: ${err?.message || 'Yetki hatası'}`
          });
        })
        .on('error', (err: any) => {
          onStatusChange?.({
            status: 'error',
            message: `Bağlantı hatası: ${err?.message || 'CouchDB çalışmıyor'}`
          });
        });

      syncInstances.set(localDbName, syncHandler);
    }

    return () => {
      // Eski bileşenin cleanup'ı yeni bağlantıyı yanlışlıkla kapatamaz.
      if (syncInstances.get(localDbName) === syncHandler) stopCouchDbSync(localDbName);
    };
  } catch (err: any) {
    onStatusChange?.({
      status: 'error',
      message: `Senkronizasyon başlatılamadı: ${err?.message || ''}`
    });
    return () => {};
  }
}

/** Server-only: aktif yerel kovayı siler; replike olabilen tombstone üretmez.
 * Hesap silme yordamından farklı olarak destroy hatası yutulmaz ve diğer
 * (şifreli/düz) kovaya dokunulmaz. Çağıran canlı sync'i önce durdurmalıdır.
 */
export async function resetLocalDatabaseForReplacement(dbName: string): Promise<void> {
  const key = sanitizeDbName(dbName);
  stopCouchDbSync(dbName);
  const db = getLocalDatabase(dbName);
  await db.destroy();
  dbInstances.delete(key);
}

export async function destroyLocalDatabase(dbName: string): Promise<void> {
  const sanitizedName = sanitizeDbName(dbName);
  stopCouchDbSync(dbName);
  const db = dbInstances.get(sanitizedName);
  if (db && typeof db.destroy === 'function') {
    try {
      await db.destroy();
    } catch (err) {
      console.warn('Failed to destroy local database', dbName, err);
    }
  }
  dbInstances.delete(sanitizedName);

  // Hesap silme: öbür kova (düz veya şifreli) cache'te hiç açılmamış olabilir.
  // Fiziksel kalıntı bırakmamak için iki ismi de temizle.
  const plainPhysical = `biznes_${sanitizedName}`;
  const encryptedPhysical = `biznes_${encryptedDbName(sanitizedName)}`;
  for (const physical of [plainPhysical, encryptedPhysical]) {
    if (db && (db as { name?: string }).name === physical) continue; // yukarıda silindi
    try {
      await new PouchDB(physical).destroy();
    } catch {
      // DB hiç var olmadıysa silinecek bir şey yok — hata beklenmez ama zararsız.
    }
  }
}

export function stopCouchDbSync(localDbName: string) {
  if (syncInstances.has(localDbName)) {
    try {
      const handler = syncInstances.get(localDbName);
      handler?.cancel();
      handler?.removeAllListeners?.();
    } catch {
      // ignore
    }
    syncInstances.delete(localDbName);
  }
}
