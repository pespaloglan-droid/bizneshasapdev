import { expect, it } from 'vitest';
import { creditVoidRemainingDebt } from '../../src/db/creditVoid';
const invoice = { id:'i1',customerId:'c1',paymentMethod:'credit',invoiceType:'sales',remainingDebt:100,amountDue:100 } as any;
const receipt = {id:'r1',invoiceId:'i1',customerId:'c1',category:'weresiye_yygnamak',type:'income',amount:40} as any;
it('P1-1 100 borç 40 tahsilat iptalinde yalnız kalan 60 terslenir',()=>expect(creditVoidRemainingDebt(invoice,[receipt])).toBe(60));
it('P1-1 başka faturanın ve müşterinin tahsilatını mahsup etmez',()=>expect(creditVoidRemainingDebt(invoice,[receipt,{...receipt,invoiceId:'i2'}, {...receipt,customerId:'c2',invoiceId:'i3'}])).toBe(60));
it('P1-1 bağlantısız eski tahsilat ve fazla tahsilatta tahmin yerine durur',()=>{
  expect(()=>creditVoidRemainingDebt(invoice,[{...receipt,invoiceId:undefined}])).toThrow('ALLOCATION_REQUIRED');
  expect(()=>creditVoidRemainingDebt(invoice,[{...receipt,amount:101}])).toThrow('ALLOCATION_REQUIRED');
});
it('P1-1 tahsilat iadesini net tahsilattan düşer',()=>expect(creditVoidRemainingDebt(invoice,[receipt,{...receipt,id:'refund',type:'expense',amount:10}])).toBe(70));
