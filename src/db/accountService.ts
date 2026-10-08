import { masterAccountsDb } from './pouch';
import { Account, User } from '../types';

/** Eski (kaldırılan) seed/mock hesaplar — kullanıcı verisi DEĞİLDİR, sessizce temizlenir. */
const SEED_ACCOUNT_IDS = new Set(['acc-1', 'acc-2', 'acc-3']);
const SEED_ACCOUNT_NAMES = new Set(['Acme yazılım', 'LC Waikiki', 'BİM Market']);

export function isSeedAccount(account: Account): boolean {
  return SEED_ACCOUNT_IDS.has(account.id) && SEED_ACCOUNT_NAMES.has(account.name);
}

export interface AccountDoc extends Account {
  _id: string;
  _rev?: string;
  docType: 'account';
}

/**
 * PouchDB'deki tüm hesapları getirir.
 * Hiçbir seed/mock veri yazmaz — yalnızca kullanıcının kendi oluşturduğu hesaplar.
 * Eski kurulumlarda kalan seed hesaplar da atlanır.
 */
export async function getAllAccountsFromDb(): Promise<Account[]> {
  try {
    const result = await masterAccountsDb.allDocs<AccountDoc>({
      include_docs: true
    });

    return result.rows
      .filter((row) => row.doc && (row.doc as any).docType === 'account')
      .map((row) => row.doc as AccountDoc)
      .filter((acc) => !isSeedAccount(acc));
  } catch (error) {
    console.warn('PouchDB accounts fetch failed:', error);
    return [];
  }
}

/**
 * Hesabı PouchDB'ye kaydeder veya günceller
 */
export async function saveAccountToDb(account: Account): Promise<Account> {
  const docId = `account_${account.id}`;
  try {
    let existingRev: string | undefined;
    try {
      const existing = await masterAccountsDb.get(docId);
      existingRev = existing._rev;
    } catch {
      // document does not exist yet
    }

    const docToSave: AccountDoc = {
      ...account,
      _id: docId,
      _rev: existingRev,
      docType: 'account'
    };

    await masterAccountsDb.put(docToSave);
    return account;
  } catch (err) {
    console.error('Failed to save account in PouchDB', err);
    return account;
  }
}

/**
 * Hesabı PouchDB'den siler
 */
export async function deleteAccountFromDb(accountId: string): Promise<boolean> {
  const docId = `account_${accountId}`;
  try {
    const doc = await masterAccountsDb.get(docId);
    await masterAccountsDb.remove(doc);
    return true;
  } catch (err) {
    console.error('Failed to delete account from PouchDB', err);
    return false;
  }
}

/**
 * Kullanıcı girişini doğrular (Administrator şifresiz kuralı dahil)
 */
export function validateLogin(user: User, passwordInput?: string): { success: boolean; message?: string } {
  // Administrator veya şifresi olmayan kullanıcı doğrudan giriş yapar
  if (!user.hasPassword || user.role === 'admin') {
    return { success: true };
  }

  if (user.password && user.password === passwordInput) {
    return { success: true };
  }

  return { success: false, message: 'Hatalı şifre!' };
}
