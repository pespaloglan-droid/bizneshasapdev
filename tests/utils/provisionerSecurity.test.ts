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
