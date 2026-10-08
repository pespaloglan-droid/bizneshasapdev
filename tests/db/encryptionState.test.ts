import { beforeEach, describe, expect, it } from 'vitest';
import {
  applyEncryptionFlag,
  getCachedPassword,
  isEncryptionEnabled,
  isEncryptionPrepared,
  resetEncryptionStateForTests,
  setCachedDbPassword,
} from '../../src/db/encryptionState';

describe('encryptionState', () => {
  beforeEach(() => {
    localStorage.clear();
    resetEncryptionStateForTests();
  });

  it('varsayılan: şifreleme KAPALI', () => {
    expect(isEncryptionEnabled()).toBe(false);
  });

  it('applyEncryptionFlag(true) kalıcı olarak açar', () => {
    applyEncryptionFlag(true);
    expect(isEncryptionEnabled()).toBe(true);
    expect(localStorage.getItem('bh.db.encrypted.v1')).toBe('1');
  });

  it('applyEncryptionFlag(false) bayrağı kaldırır', () => {
    applyEncryptionFlag(true);
    applyEncryptionFlag(false);
    expect(isEncryptionEnabled()).toBe(false);
    expect(localStorage.getItem('bh.db.encrypted.v1')).toBeNull();
  });

  it('hazırlık yapılmadan getCachedPassword çağrılırsa hata atar', () => {
    expect(isEncryptionPrepared()).toBe(false);
    expect(() => getCachedPassword()).toThrow('prepareEncryption');
  });

  it('setCachedDbPassword(null) hazırlıklı ama parolasız demektir', () => {
    setCachedDbPassword(null);
    expect(isEncryptionPrepared()).toBe(true);
    expect(getCachedPassword()).toBeNull();
  });

  it('setCachedDbPassword(parola) okunabilir', () => {
    setCachedDbPassword('c2VjcmV0');
    expect(isEncryptionPrepared()).toBe(true);
    expect(getCachedPassword()).toBe('c2VjcmV0');
  });

  it('reset sonrası tekrar hazırlıksız olur', () => {
    setCachedDbPassword('x');
    resetEncryptionStateForTests();
    expect(isEncryptionPrepared()).toBe(false);
  });
});
