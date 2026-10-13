import { afterEach, expect, it, vi } from 'vitest';
vi.mock('../../src/db/accountService',()=>({getAllAccountsFromDb:vi.fn().mockResolvedValue([]),isSeedAccount:()=>false,saveAccountToDb:vi.fn().mockResolvedValue({}),deleteAccountFromDb:vi.fn()}));
import { loadStoredState, saveAccountsState } from '../../src/store/accountStore';
import { encodeStoredAccount, decodeStoredAccount } from '../../src/db/credentialStorage';
afterEach(()=>localStorage.clear());
const account={id:'QA',name:'QA',couchDbUrl:'http://qa:fake-test@example.invalid:5984',databaseName:'qa',users:[],createdAt:'2026-10-12',transactionCount:0};
it('P1-6 eski hesap localStorage URL migrasyonu ve yeni kaydı credential-free olur',()=>{
  localStorage.setItem('biznes_hasap_accounts_v1',JSON.stringify([account]));
  expect(loadStoredState().accounts[0].couchDbUrl).toBe(account.couchDbUrl);
  expect(localStorage.getItem('biznes_hasap_accounts_v1')).not.toContain('qa:fake-test@');
  saveAccountsState([account],{language:'en'});
  expect(localStorage.getItem('biznes_hasap_accounts_v1')).not.toContain('fake-test');
  expect(loadStoredState().accounts[0].couchDbUrl).toBe(account.couchDbUrl);
});
it('P1-6 Pouch hesap codec aynı URL bilgisini kodlanmış biçimde korur',()=>{
  const encoded=encodeStoredAccount(account);expect(encoded.couchDbUrl).not.toContain('@');
  expect(decodeStoredAccount(encoded)).toEqual(account);
});
