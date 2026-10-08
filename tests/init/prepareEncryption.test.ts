import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prepareEncryption } from '../../src/init/prepareEncryption';
import { resetDatabaseKeyCacheForTests } from '../../src/db/pouch';
import {
  applyEncryptionFlag,
  getCachedPassword,
  isEncryptionPrepared,
  resetEncryptionStateForTests,
} from '../../src/db/encryptionState';

const deriveMock = () => window.electronAPI!.deriveLicenseKey as ReturnType<typeof vi.fn>;

describe('prepareEncryption', () => {
  beforeEach(() => {
    localStorage.clear();
    resetEncryptionStateForTests();
    // getDatabaseKey 60 sn cache'ler — testler arası sıfırlanmazsa mock değişiklikleri görünmez
    resetDatabaseKeyCacheForTests();
    deriveMock().mockReset();
  });

  it('flag kapalıysa parola null önbelleğe alınır (hazırlık tamamlanır)', async () => {
    await prepareEncryption();
    expect(isEncryptionPrepared()).toBe(true);
    expect(getCachedPassword()).toBeNull();
    expect(deriveMock()).not.toHaveBeenCalled();
  });

  it('flag açık + lisans anahtarı var → parola türetilir', async () => {
    applyEncryptionFlag(true);
    deriveMock().mockResolvedValue(new Uint8Array(32).fill(7));
    await prepareEncryption();
    expect(isEncryptionPrepared()).toBe(true);
    const pw = getCachedPassword();
    expect(typeof pw).toBe('string');
    expect(pw!.length).toBeGreaterThan(0);
  });

  it('flag açık + lisans yok (null) → parola null, uygulama kilitlenmez', async () => {
    applyEncryptionFlag(true);
    deriveMock().mockResolvedValue(null);
    await prepareEncryption();
    expect(getCachedPassword()).toBeNull();
  });

  it('flag açık + derive hatası → fırlatmaz, parola null kalır', async () => {
    applyEncryptionFlag(true);
    deriveMock().mockRejectedValue(new Error('IPC yok'));
    await expect(prepareEncryption()).resolves.toBeUndefined();
    expect(getCachedPassword()).toBeNull();
  });

  it('iki kez çağrılabilir (idempotent)', async () => {
    await prepareEncryption();
    await expect(prepareEncryption()).resolves.toBeUndefined();
    expect(isEncryptionPrepared()).toBe(true);
  });
});
