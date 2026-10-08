/**
 * crypto-pouch plugin kaydı — TEK kaynak.
 *
 * `PouchDB.plugin()` idempotent DEĞİLDİR: hem pouch.ts (senkron şifreli dal)
 * hem dbEncryption.ts (async açılış) bu plugin'i kullanır. İki yerden kayıt
 * edilirse plugin iki kez işlenir. Bu modül tek `pluginRegistered` bayrağıyla
 * her iki çağırıcıyı da korur.
 */

import PouchDB from 'pouchdb-browser';
import cryptoPouch from 'crypto-pouch';

let pluginRegistered = false;

export function ensureCryptoPlugin(): void {
  if (pluginRegistered) return;
  PouchDB.plugin(cryptoPouch);
  pluginRegistered = true;
}
