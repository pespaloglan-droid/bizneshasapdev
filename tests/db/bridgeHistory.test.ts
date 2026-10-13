import { expect, it } from 'vitest';
import { apkInvoiceToPcDoc, pcToApkInvoice, shouldSkipPcInvoiceHistory } from '../../src/db/schemaBridge';
const now=new Date('2026-10-12T12:00:00Z');
const invoice={id:'old',invoiceNo:'OLD',createdAt:'2026-04-12',paymentMethod:'cash',status:'completed',invoiceType:'sales',items:[]} as any;
it('P1-2 aynı cutoff eski kesin-tamamlanmış aynayı eler ama legacy/taslak/iptal/borcu korur',()=>{
  const pc=apkInvoiceToPcDoc(invoice);expect(shouldSkipPcInvoiceHistory(pc,3,now)).toBe(true);
  expect(shouldSkipPcInvoiceHistory(pc,0,now)).toBe(false);
  for(const modified of [{...pc,bhInvoiceState:undefined},apkInvoiceToPcDoc({...invoice,draftStatus:'pending'}),apkInvoiceToPcDoc({...invoice,status:'voided'}),apkInvoiceToPcDoc({...invoice,paymentMethod:'credit',remainingDebt:100})]) expect(shouldSkipPcInvoiceHistory(modified,3,now)).toBe(false);
});
it('P1-2 ayna dönüşümü taslak ve borç bilgisini kaybetmez',()=>{
  expect(pcToApkInvoice(apkInvoiceToPcDoc({...invoice,paymentMethod:'credit',draftStatus:'pending',remainingDebt:60,paidAmount:40}))).toMatchObject({draftStatus:'pending',remainingDebt:60,paidAmount:40});
});
