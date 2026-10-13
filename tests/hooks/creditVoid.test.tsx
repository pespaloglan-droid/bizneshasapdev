import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('../../src/db/salesService',()=>({saveInvoiceToDb:vi.fn(),generateInvoiceNo:()=> 'QA'}));
vi.mock('../../src/db/creditVoid',async importOriginal=>({...await importOriginal<any>(),readVoidSnapshot:vi.fn()}));
import { readVoidSnapshot } from '../../src/db/creditVoid';
import { saveInvoiceToDb } from '../../src/db/salesService';
import { useDraftActions } from '../../src/hooks/useDraftActions';
import { LanguageProvider } from '../../src/locales/LanguageContext';
const wrapper=({children}:{children:React.ReactNode})=><LanguageProvider language="en">{children}</LanguageProvider>;
const invoice={id:'i1',invoiceNo:'QA',customerId:'c1',paymentMethod:'credit',invoiceType:'sales',status:'completed',remainingDebt:100,amountDue:100,items:[]} as any;
const receipt={id:'r1',invoiceId:'i1',customerId:'c1',category:'weresiye_yygnamak',type:'income',amount:40} as any;
function options(){return {storeDb:'QA',currentUser:{name:'QA'},setCompletedInvoices:vi.fn(),setToastMessage:vi.fn(),applyStockChanges:vi.fn().mockResolvedValue({failed:[]}),applyCustomerBalance:vi.fn().mockResolvedValue({failed:[]}),moneyStore:{deleteMoneyTransaction:vi.fn()},moneyTransactions:[]} as any;}
beforeEach(()=>vi.clearAllMocks());
it('P1-1 gerçek tahsilatı silmeden yalnız 60 borcu tersler; çift iptal tek yazımdır',async()=>{
  vi.mocked(readVoidSnapshot).mockResolvedValue({invoice,transactions:[receipt]});
  const opts=options();const {result}=renderHook(()=>useDraftActions(opts),{wrapper});
  await act(async()=>{await Promise.all([result.current.handleVoidInvoice(invoice),result.current.handleVoidInvoice(invoice)]);});
  expect(saveInvoiceToDb).toHaveBeenCalledTimes(1);
  expect(opts.applyCustomerBalance).toHaveBeenCalledWith(expect.objectContaining({remainingDebt:60}),-1);
  expect(opts.moneyStore.deleteMoneyTransaction).not.toHaveBeenCalled();
});
it('P1-1 snapshot okuma hatası veya bağlantısız tahsilatta hiç yan etki yazmaz',async()=>{
  const opts=options();const {result}=renderHook(()=>useDraftActions(opts),{wrapper});
  vi.mocked(readVoidSnapshot).mockRejectedValueOnce(new Error('fixture'));
  await act(async()=>{await result.current.handleVoidInvoice(invoice);});
  vi.mocked(readVoidSnapshot).mockResolvedValue({invoice,transactions:[{...receipt,invoiceId:undefined}]});
  await act(async()=>{await result.current.handleVoidInvoice(invoice);});
  expect(saveInvoiceToDb).not.toHaveBeenCalled();expect(opts.applyCustomerBalance).not.toHaveBeenCalled();
});
