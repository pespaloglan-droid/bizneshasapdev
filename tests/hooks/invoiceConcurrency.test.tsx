import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('../../src/db/salesService', () => ({ saveInvoiceToDb: vi.fn(), generateInvoiceNo: () => 'TEST' }));
import { saveInvoiceToDb } from '../../src/db/salesService';
import { useInvoiceActions } from '../../src/hooks/useInvoiceActions';
import { useDraftActions } from '../../src/hooks/useDraftActions';
import { LanguageProvider } from '../../src/locales/LanguageContext';
const wrapper = ({ children }: { children: React.ReactNode }) => <LanguageProvider language="en">{children}</LanguageProvider>;
beforeEach(() => vi.clearAllMocks());
const item = { id:'i', productId:'p', name:'Tea', sku:'001', qty:1, price:10, imageType:'default' };
function options() {
  return { paymentMethod:'cash', creditAdvance:0, ops:undefined, creditTermDays:30, invoiceType:'sales',
    selectedCustomer:null, cartItems:[item], subtotal:10, discountTotal:0, amountDue:10, fixedInvoiceAt:null,
    currentUser:{name:'QA',role:'admin'}, internalNote:'', storeDb:'QA', compositionMapRef:{current:new Map()},
    products:[], loadedDraftId:null, completedInvoices:[], cashReceived:10,
    applyStockChanges:vi.fn(), applyCustomerBalance:vi.fn(), setCompletedInvoices:vi.fn(), setActiveReceiptInvoice:vi.fn(),
    setToastMessage:vi.fn(), setCartItems:vi.fn(), setCashReceived:vi.fn(), setInternalNote:vi.fn(), setGlobalPercent:vi.fn(),
    setCreditAdvance:vi.fn(), setIsPosTerminalModalOpen:vi.fn(), setLastAuthCode:vi.fn(), acceptLoadedDraft:vi.fn(),
  } as any;
}
it('P0-3 aynı satış hookuna çift çağrı tek fatura ve tek yan etki yazar', async () => {
  let resolve!: () => void; const gate = new Promise<void>(r => resolve=r);
  vi.mocked(saveInvoiceToDb).mockImplementationOnce(async inv => { await gate; return inv; });
  const opts=options(); const {result}=renderHook(()=>useInvoiceActions(opts),{wrapper});
  await act(async()=>{ const first=result.current.handleCompleteSale(); const second=result.current.handleCompleteSale();
    expect(saveInvoiceToDb).toHaveBeenCalledTimes(1); resolve(); await Promise.all([first,second]); });
  expect(opts.applyStockChanges).toHaveBeenCalledTimes(1); expect(opts.applyCustomerBalance).toHaveBeenCalledTimes(1);
});
it('P0-3 taslak çift onayı tek yazım stok bakiye ve ledger kaydı üretir', async () => {
  let resolve!: () => void; const gate=new Promise<void>(r=>resolve=r);
  vi.mocked(saveInvoiceToDb).mockImplementationOnce(async inv=>{await gate;return inv;});
  const opts={...options(), moneyTransactions:[], moneyStore:{saveMoneyTransaction:vi.fn()},
    creditFields:vi.fn(), customers:[], draftWarehouseId:'', draftTargetWarehouseId:'', draftLedgerId:''};
  const {result}=renderHook(()=>useDraftActions(opts as any),{wrapper});
  const draft={id:'draft-1',draftStatus:'pending',status:'completed',invoiceType:'sales',paymentMethod:'cash',
    ledgerId:'ledger',items:[item],createdAt:'2026-10-12',amountDue:10,invoiceNo:'TEST'} as any;
  await act(async()=>{const a=result.current.handleAcceptDraft(draft);const b=result.current.handleAcceptDraft(draft);
    expect(saveInvoiceToDb).toHaveBeenCalledTimes(1);resolve();await Promise.all([a,b]);});
  await act(async()=>{await result.current.handleAcceptDraft(draft);});
  expect(opts.applyStockChanges).toHaveBeenCalledTimes(1);expect(opts.applyCustomerBalance).toHaveBeenCalledTimes(1);
  expect(opts.moneyStore.saveMoneyTransaction).toHaveBeenCalledTimes(1);
});
