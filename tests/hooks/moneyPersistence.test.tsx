import {act,renderHook} from '@testing-library/react';
import {beforeEach,expect,it,vi} from 'vitest';
vi.mock('../../src/db/moneyService',()=>({getMoneyTransactions:vi.fn(async()=>[]),saveMoneyTransactionToDb:vi.fn(),deleteMoneyTransactionFromDb:vi.fn(),moneyCustomerBalanceDelta:()=>-40}));
import {saveMoneyTransactionToDb,deleteMoneyTransactionFromDb} from '../../src/db/moneyService';
import {useMoneyStore} from '../../src/hooks/useMoneyStore';
beforeEach(()=>vi.clearAllMocks());
it('P2-4 reddedilen tahsilat UI veya müşteri bakiyesini değiştirmez',async()=>{
  vi.mocked(saveMoneyTransactionToDb).mockRejectedValueOnce(new Error('fixture'));
  const apply=vi.fn(async()=>true),fail=vi.fn();const {result}=renderHook(()=>useMoneyStore('test',apply,fail));
  await act(async()=>{expect(await result.current.saveMoneyTransaction({id:'x',customerId:'c'} as any,null)).toBe(false);});
  expect(apply).not.toHaveBeenCalled();expect(result.current.moneyTransactions).toEqual([]);expect(fail).toHaveBeenCalledOnce();
});
it('P2-4 başarısız silme bakiye ters etkisini çalıştırmaz',async()=>{
  vi.mocked(deleteMoneyTransactionFromDb).mockResolvedValueOnce(false);
  const apply=vi.fn(async()=>true),fail=vi.fn();const {result}=renderHook(()=>useMoneyStore('test',apply,fail));
  await act(async()=>{expect(await result.current.deleteMoneyTransaction({id:'x',customerId:'c'} as any)).toBe(false);});
  expect(apply).not.toHaveBeenCalled();expect(fail).toHaveBeenCalledOnce();
});
