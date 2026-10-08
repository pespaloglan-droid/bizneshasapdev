/**
 * getLocalDatabase — şifreleme dalı (FAZ 1.1).
 *
 * PouchDB sahte ile mock'lanır; doğrulananlar:
 *  - flag kapalı → düz kova adı (biznes_<ad>)
 *  - flag açık + hazır + parola → şifreli kova (biznes_<ad>_enc) + crypto() çağrısı
 *  - system_accounts ASLA şifrelenmez (kilit döngüsü, spec v3 §3.2)
 *  - lisanssız op → LICENSE_REQUIRED (fail-closed, sessiz yutma yok)
 *  - lisans sonradan gelirse op anında crypto başlar (restart gerekmez)
 *  - crypto reddederse hata yüzeye çıkar
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => {
  const instances: any[] = [];
  return {
    instances,
    cryptoImpl: (_pw: string): Promise<void> => Promise.resolve(),
  };
});

vi.mock('pouchdb-browser', () => {
  class FakePouchDB {
    static plugin = vi.fn();
    name: string;
    crypto = vi.fn((pw: string) => h.cryptoImpl(pw));
    get = vi.fn(async (id: string) => ({ _id: id, _rev: '1-a' }));
    put = vi.fn(async (_doc: unknown) => ({ ok: true, id: 'x', rev: '1-a' }));
    destroy = vi.fn(async () => ({ ok: true }));
    constructor(name: string) {
      this.name = name;
      h.instances.push(this);
    }
  }
  return { default: FakePouchDB };
});

import {
  destroyLocalDatabase,
  getLocalDatabase,
  resetDatabaseKeyCacheForTests,
} from '../../src/db/pouch';
import {
  applyEncryptionFlag,
  resetEncryptionStateForTests,
  setCachedDbPassword,
} from '../../src/db/encryptionState';

const deriveMock = () => window.electronAPI!.deriveLicenseKey as ReturnType<typeof vi.fn>;
const findInstance = (name: string) => h.instances.find((i) => i.name === name);
const KEY = new Uint8Array(32).fill(7);

describe('getLocalDatabase — şifreleme dalı', () => {
  beforeEach(() => {
    localStorage.clear();
    resetEncryptionStateForTests();
    resetDatabaseKeyCacheForTests();
    h.instances.length = 0;
    h.cryptoImpl = () => Promise.resolve();
    deriveMock().mockReset().mockResolvedValue(KEY);
  });

  it('flag kapalı → düz kova açılır (biznes_<ad>)', () => {
    setCachedDbPassword(null); // hazırlık yapıldı, flag kapalı
    getLocalDatabase('enc_t1');
    expect(findInstance('biznes_enc_t1')).toBeTruthy();
    expect(findInstance('biznes_enc_t1_enc')).toBeFalsy();
  });

  it('flag açık + hazır + parola → şifreli kova + crypto(parola) çağrıldı', () => {
    applyEncryptionFlag(true);
    setCachedDbPassword('gizli-parola');
    getLocalDatabase('enc_t2');
    const inst = findInstance('biznes_enc_t2_enc');
    expect(inst).toBeTruthy();
    expect(inst.crypto).toHaveBeenCalledWith('gizli-parola');
    expect(findInstance('biznes_enc_t2')).toBeFalsy();
  });

  it('system_accounts flag açık olsa bile ASLA şifrelenmez (kilit döngüsü)', async () => {
    applyEncryptionFlag(true);
    setCachedDbPassword('gizli-parola');
    // Modül importunda (flag kapalıyken) oluşan cache girdisini temizle, yeniden aç.
    // destroy'un fiziksel temizlik için açtığı instance'lar listeyi kirletir → sıfırla.
    await destroyLocalDatabase('system_accounts');
    h.instances.length = 0;
    getLocalDatabase('system_accounts');
    expect(findInstance('biznes_system_accounts')).toBeTruthy();
    expect(findInstance('biznes_system_accounts_enc')).toBeFalsy();
  });

  it('flag açık ama hazırlık YOK → düz kova (App kapısı bunu engeller; davranış belgelenir)', () => {
    applyEncryptionFlag(true);
    // setCachedDbPassword çağrılmadı → isEncryptionPrepared() false
    getLocalDatabase('enc_t4');
    expect(findInstance('biznes_enc_t4')).toBeTruthy();
    expect(findInstance('biznes_enc_t4_enc')).toBeFalsy();
  });

  it('parola null + lisans yok → _enc kova açılır ama op LICENSE_REQUIRED ile reddedilir', async () => {
    applyEncryptionFlag(true);
    setCachedDbPassword(null);
    deriveMock().mockResolvedValue(null);
    const db = getLocalDatabase('enc_t5');
    expect(findInstance('biznes_enc_t5_enc')).toBeTruthy();
    await expect(db.put({ _id: 'x' } as never)).rejects.toMatchObject({
      code: 'LICENSE_REQUIRED',
    });
  });

  it('lisans sonradan gelirse op anında crypto başlar (restart gerekmez)', async () => {
    applyEncryptionFlag(true);
    setCachedDbPassword(null); // hazırlıkta lisans yoktu
    deriveMock().mockResolvedValue(null);
    const db = getLocalDatabase('enc_t6');
    const inst = findInstance('biznes_enc_t6_enc');
    expect(inst.crypto).not.toHaveBeenCalled();

    // Lisans şimdi geldi
    deriveMock().mockResolvedValue(KEY);
    await expect(db.put({ _id: 'x' } as never)).resolves.toMatchObject({ ok: true });
    expect(inst.crypto).toHaveBeenCalledTimes(1);
    expect(typeof inst.crypto.mock.calls[0][0]).toBe('string');
  });

  it('crypto reddederse hata yutulmaz, op reddedilir', async () => {
    applyEncryptionFlag(true);
    setCachedDbPassword('yanlis-parola');
    h.cryptoImpl = () => Promise.reject(new Error('WRONG_KEY'));
    const db = getLocalDatabase('enc_t7');
    await expect(db.put({ _id: 'x' } as never)).rejects.toThrow('WRONG_KEY');
  });
});
