'use strict';
const nativeFs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
/** Main-process only. Existing automatic CouchDB creation is unchanged; only
 * the at-rest storage is migrated. Source is removed ONLY after readback. */
function createAdminVault({ userData, safeStorage, fs = nativeFs }) {
  const source = path.join(userData, 'server-admin.json');
  const target = path.join(userData, 'server-admin.vault.json');
  function config(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value) || typeof value.adminUser !== 'string' || !value.adminUser || typeof value.adminPass !== 'string' || !value.adminPass) throw new Error('ADMIN_CONFIG_INVALID');
    return value;
  }
  function available() {
    if (!safeStorage.isEncryptionAvailable() || safeStorage.getSelectedStorageBackend?.() === 'basic_text') throw new Error('ADMIN_VAULT_UNAVAILABLE');
  }
  function readEncrypted() {
    available();
    try {
      const file = JSON.parse(fs.readFileSync(target, 'utf8'));
      if (file.version !== 1 || typeof file.ciphertext !== 'string' || !file.ciphertext) throw new Error();
      return config(JSON.parse(safeStorage.decryptString(Buffer.from(file.ciphertext, 'base64'))));
    } catch { throw new Error('ADMIN_VAULT_READ_FAILED'); }
  }
  function read() {
    if (fs.existsSync(source)) {
      available();
      let legacy;
      try { legacy = config(JSON.parse(fs.readFileSync(source, 'utf8'))); }
      catch { throw new Error('ADMIN_CONFIG_INVALID'); }
      const serialized = JSON.stringify(legacy);
      const temporary = `${target}.tmp-${crypto.randomUUID()}`;
      try {
        const ciphertext = safeStorage.encryptString(serialized).toString('base64');
        fs.writeFileSync(temporary, JSON.stringify({ version: 1, ciphertext }), { mode: 0o600, flag: 'wx' });
        fs.renameSync(temporary, target);
        if (JSON.stringify(readEncrypted()) !== serialized) throw new Error();
      } catch {
        try { fs.unlinkSync(temporary); } catch { /* No plaintext is in this file. */ }
        throw new Error('ADMIN_VAULT_MIGRATION_FAILED');
      }
      try { fs.unlinkSync(source); } catch { throw new Error('ADMIN_VAULT_SOURCE_REMOVE_FAILED'); }
      return legacy;
    }
    return fs.existsSync(target) ? readEncrypted() : null;
  }
  return { read };
}
module.exports = { createAdminVault };
