// Canlı CouchDB'ye bağlanmaz; runtime credential sözleşmesini kontrol eder.
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
it('P0-4 provisioner kaynakta parola taşımaz ve SecureString prompt kullanır', () => {
  const source=readFileSync('Yeni-HesapVeritabani.ps1','utf8');
  expect(source).not.toMatch(/\$adminPass\s*=\s*['"][^'"]+['"]/i);
  expect(source).not.toMatch(/\$adminUser\s*=\s*['"][^'"]+['"]/i);
  expect(source).toContain('Mandatory=$true'); expect(source).toContain('-AsSecureString');
  expect(source).toContain('[Security.SecureString]$AdminPassword'); expect(source).toContain('finally {');
});

import { createRequire } from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const require = createRequire(import.meta.url);
const { createAdminVault } = require('../../electron/admin-vault.cjs');
const testConfig = { adminUser: 'test-admin', adminPass: 'test-only-value', appUser: 'test-app', appPass: 'test-app-value' };
function storage() { return { isEncryptionAvailable: () => true, encryptString: (s: string) => Buffer.from([...Buffer.from(s)].map(n => n ^ 0xa5)), decryptString: (b: Buffer) => Buffer.from([...b].map(n => n ^ 0xa5)).toString() }; }
it('admin vault: yaz → geri oku → doğrula → plaintext sil; otomatik açma kimliği korunur', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bh-vault-'));
  try {
    fs.writeFileSync(path.join(dir,'server-admin.json'),JSON.stringify(testConfig));
    const vault = createAdminVault({ userData:dir, safeStorage:storage() });
    expect(vault.read()).toEqual(testConfig);
    expect(fs.existsSync(path.join(dir,'server-admin.json'))).toBe(false);
    expect(fs.readFileSync(path.join(dir,'server-admin.vault.json'),'utf8')).not.toContain(testConfig.adminPass);
    expect(vault.read()).toEqual(testConfig);
  } finally { fs.rmSync(dir,{recursive:true,force:true}); }
});
it('admin vault: kasa kullanılamıyorsa kaynak silinmez', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bh-vault-'));
  try {
    const source=path.join(dir,'server-admin.json');fs.writeFileSync(source,JSON.stringify(testConfig));
    expect(()=>createAdminVault({userData:dir,safeStorage:{...storage(),isEncryptionAvailable:()=>false}}).read()).toThrow('ADMIN_VAULT_UNAVAILABLE');
    expect(JSON.parse(fs.readFileSync(source,'utf8'))).toEqual(testConfig);
  } finally { fs.rmSync(dir,{recursive:true,force:true}); }
});
it('admin vault: geri okuma doğrulanmadan eski kaynak silinmez', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bh-vault-'));
  try {
    const source=path.join(dir,'server-admin.json');fs.writeFileSync(source,JSON.stringify(testConfig));
    expect(()=>createAdminVault({userData:dir,safeStorage:{...storage(),decryptString:()=>'{"bad":true}'}}).read()).toThrow('ADMIN_VAULT_MIGRATION_FAILED');
    expect(fs.existsSync(source)).toBe(true);
  } finally { fs.rmSync(dir,{recursive:true,force:true}); }
});
it('admin vault: Linux basic_text güvenli kasa sayılmaz ve bozuk ciphertext sessiz geçilmez', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bh-vault-'));
  try {
    fs.writeFileSync(path.join(dir,'server-admin.vault.json'),'{}');
    expect(()=>createAdminVault({userData:dir,safeStorage:storage()}).read()).toThrow('ADMIN_VAULT_READ_FAILED');
    expect(()=>createAdminVault({userData:dir,safeStorage:{...storage(),getSelectedStorageBackend:()=> 'basic_text'}}).read()).toThrow('ADMIN_VAULT_UNAVAILABLE');
  } finally { fs.rmSync(dir,{recursive:true,force:true}); }
});
