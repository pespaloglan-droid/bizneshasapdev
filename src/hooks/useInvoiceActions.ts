import type { InvoiceEffectResult } from './useInvoiceEffects';
import type React from 'react';
import { useRef } from 'react';
import { formatMoney } from '../utils/locale';
import { useT, useLanguage } from '../locales/LanguageContext';
import type { OperationSettings } from '../types';
import { InvoiceRecord, CartItem, Customer, InvoiceType, PaymentMethod, Product, User } from '../types';
import { addDaysIso, todayIso } from '../utils/paymentLabels';
import { generateInvoiceNo, saveInvoiceToDb } from '../db/salesService';
import { insufficientCompositionStock } from '../utils/compositionStock';
import { WorkspaceToast } from './useCartActions';

interface Options {
  paymentMethod: PaymentMethod;
  creditAdvance: number;
  ops: import("../types").OperationSettings | undefined;
  creditTermDays: number;
  setIsPosTerminalModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setLastAuthCode: React.Dispatch<React.SetStateAction<string>>;
  invoiceType: InvoiceType;
  selectedCustomer: Customer | null;
  cartItems: CartItem[];
  subtotal: number;
  discountTotal: number;
  amountDue: number;
  fixedInvoiceAt: Date | null;
  currentUser: User;
  internalNote: string;
  storeDb: string;
  setCompletedInvoices: React.Dispatch<React.SetStateAction<InvoiceRecord[]>>;
  applyStockChanges: (items: CartItem[], type: InvoiceType, direction?: 1 | -1) => Promise<InvoiceEffectResult>;
  applyCustomerBalance: (invoice: InvoiceRecord, direction?: 1 | -1) => Promise<InvoiceEffectResult>;
  setActiveReceiptInvoice: React.Dispatch<React.SetStateAction<InvoiceRecord | null>>;
  setToastMessage: React.Dispatch<React.SetStateAction<WorkspaceToast | null>>;
  setCartItems: React.Dispatch<React.SetStateAction<CartItem[]>>;
  setCashReceived: React.Dispatch<React.SetStateAction<number>>;
  setInternalNote: React.Dispatch<React.SetStateAction<string>>;
  setGlobalPercent: React.Dispatch<React.SetStateAction<number>>;
  compositionMapRef: React.MutableRefObject<Map<string, { productId: string; qty: number; }[]>>;
  products: Product[];
  loadedDraftId: string | null;
  acceptLoadedDraft: () => void;
  cashReceived: number;
  setCreditAdvance: React.Dispatch<React.SetStateAction<number>>;
}

export function useInvoiceActions({ paymentMethod, creditAdvance, ops, creditTermDays, setIsPosTerminalModalOpen, setLastAuthCode, invoiceType, selectedCustomer, cartItems, subtotal, discountTotal, amountDue, fixedInvoiceAt, currentUser, internalNote, storeDb, setCompletedInvoices, applyStockChanges, applyCustomerBalance, setActiveReceiptInvoice, setToastMessage, setCartItems, setCashReceived, setInternalNote, setGlobalPercent, compositionMapRef, products, loadedDraftId, acceptLoadedDraft, cashReceived, setCreditAdvance }: Options) {
  const t = useT();
  const saleInFlight = useRef(false);
  const { language } = useLanguage();

const creditFields = (
    total: number
  ): Pick<InvoiceRecord, 'paidAmount' | 'remainingDebt' | 'creditTermDays' | 'dueDate'> => {
    if (paymentMethod !== 'credit') {
      return { paidAmount: undefined, remainingDebt: 0, creditTermDays: undefined, dueDate: undefined };
    }
    const paid = Math.min(Math.max(0, creditAdvance), total);
    // Nesiýe möhleti: düzgün boýunça [creditMinDays, creditMaxDays] aralygynda.
    const minDays = ops?.creditMinDays ?? 3;
    const maxDays = ops?.creditMaxDays ?? 360;
    const defaultDays = ops?.creditDefaultDays ?? 90;
    const term = Math.min(maxDays, Math.max(minDays, creditTermDays || defaultDays));
    return {
      paidAmount: paid,
      remainingDebt: Math.max(0, total - paid),
      creditTermDays: term,
      dueDate: addDaysIso(todayIso(), term),
    };
  };

const approveCardPayment = async (authCode: string) => {
    setIsPosTerminalModalOpen(false);
    setLastAuthCode(authCode);

    const newInvoice: InvoiceRecord = {
      id: `inv-${Date.now()}-${crypto.randomUUID()}`,
      invoiceNo: generateInvoiceNo(),
      invoiceType,                               // ← artık state'ten geliyor
      customerId: selectedCustomer?.id || null,
      customerName: selectedCustomer?.name || t('generalCustomer'),
      items: [...cartItems],
      itemCount: cartItems.reduce((sum, item) => sum + item.qty, 0),
      subtotal,
      discountTotal,
      taxTotal: 0,
      amountDue,
      paymentMethod: 'card',
      cashReceived: amountDue,
      changeDue: 0,
      status: 'completed',
      createdAt: (fixedInvoiceAt ?? new Date()).toISOString(),
      cashierName: currentUser.name,
      internalNote: internalNote.trim() ? internalNote.trim() : undefined
    };

    try { await saveInvoiceToDb(newInvoice, storeDb); }
    catch {
      setToastMessage({ type: 'info', text: t('pos.cardInvoiceSaveFailed') });
      return;
    }
    setCompletedInvoices(prev => [newInvoice, ...prev]);

    const stockResult = await applyStockChanges(cartItems, invoiceType);
    const balanceResult = await applyCustomerBalance(newInvoice);
    const failures = (stockResult?.failed.length ?? 0) + (balanceResult?.failed.length ?? 0);

    // Çeki Otomatik Aç ve Göster
    setActiveReceiptInvoice(newInvoice);

    setToastMessage({
      type: failures ? 'info' : 'success',
      text: failures ? t('pos.effectsIncomplete', { count: failures }) : t('pos.cardApprovedInvoice', { invoice: newInvoice.invoiceNo })
    });

    // Sepeti Sıfırla
    setCartItems([]);
    setCashReceived(0);
    setInternalNote('');
    setGlobalPercent(0);

    setTimeout(() => setToastMessage(null), 4000);
  };

const completeSale = async () => {
    if (cartItems.length === 0) return;

    // ── Düzüm (set) bölekleriniň stogy ýeterlik mi? ───────────────────────
    if (invoiceType === 'sales' || invoiceType === 'other_out') {
      const short = insufficientCompositionStock(
        compositionMapRef.current,
        cartItems,
        products
      );
      if (short.length > 0) {
        setToastMessage({
          type: 'info',
          text: t('pos.compositionShort', {
            list: short.map((s) => `${s.name} (${s.available}/${s.required})`).join(', '),
          }),
        });
        setTimeout(() => setToastMessage(null), 5000);
        return;
      }
    }

    // ── Operasiýa düzgünleri (seneler) ──────────────────────────────────────
    const effDate = (fixedInvoiceAt ?? new Date()).toISOString().slice(0, 10);
    if (ops?.operationStartDate && effDate < ops.operationStartDate) {
      setToastMessage({
        type: 'info',
        text: t('pos.dateBeforeStart', { date: ops.operationStartDate }),
      });
      setTimeout(() => setToastMessage(null), 3500);
      return;
    }
    if (ops?.operationEndDate && effDate > ops.operationEndDate) {
      setToastMessage({
        type: 'info',
        text: t('pos.dateAfterEnd', { date: ops.operationEndDate }),
      });
      setTimeout(() => setToastMessage(null), 3500);
      return;
    }

    // ── Nagt satuw gadagan müşderi ──────────────────────────────────────────
    if (paymentMethod === 'cash' && selectedCustomer?.cashSalesBlocked) {
      setToastMessage({
        type: 'info',
        text: t('pos.cashSaleBlocked'),
      });
      setTimeout(() => setToastMessage(null), 3500);
      return;
    }

    // ── Nesiýe: karz limiti ─────────────────────────────────────────────────
    if (paymentMethod === 'credit' && selectedCustomer) {
      const limit = selectedCustomer.creditLimit ?? 0;
      if (limit > 0) {
        const paid = Math.min(Math.max(0, creditAdvance), amountDue);
        const newReceivable = Math.max(0, amountDue - paid);
        const currentReceivable = Math.max(0, selectedCustomer.balance ?? 0);
        if (currentReceivable + newReceivable > limit) {
          setToastMessage({
            type: 'info',
            text: t('pos.creditLimitExceeded', { limit: formatMoney(limit, language) }),
          });
          setTimeout(() => setToastMessage(null), 3500);
          return;
        }
      }
    }

    // Açylan garalama bar bolsa — sebetdäki üýtgeşmeler bilen tassyklaýarys.
    if (loadedDraftId) {
      await acceptLoadedDraft();
      return;
    }

    if (paymentMethod === 'card') {
      setIsPosTerminalModalOpen(true);
      return;
    }

    const newInvoice: InvoiceRecord = {
      id: `inv-${Date.now()}-${crypto.randomUUID()}`,
      invoiceNo: generateInvoiceNo(),
      invoiceType,                               // ← artık state'ten geliyor
      customerId: selectedCustomer?.id || null,
      customerName: selectedCustomer?.name || t('generalCustomer'),
      items: [...cartItems],
      itemCount: cartItems.reduce((sum, item) => sum + item.qty, 0),
      subtotal,
      discountTotal,
      taxTotal: 0,
      amountDue,
      amountTmt: amountDue,
      paymentMethod,
      cashReceived:
        paymentMethod === 'credit'
          ? Math.min(creditAdvance, amountDue)
          : cashReceived > 0
          ? cashReceived
          : amountDue,
      changeDue:
        paymentMethod === 'credit'
          ? 0
          : Math.max(0, (cashReceived > 0 ? cashReceived : amountDue) - amountDue),
      status: 'completed',
      createdAt: (fixedInvoiceAt ?? new Date()).toISOString(),
      cashierName: currentUser.name,
      internalNote: internalNote.trim() ? internalNote.trim() : undefined,
      ...creditFields(amountDue)
    };

    try { await saveInvoiceToDb(newInvoice, storeDb); }
    catch {
      setToastMessage({ type: 'info', text: t('pos.saleSaveFailed') });
      return;
    }
    setCompletedInvoices(prev => [newInvoice, ...prev]);

    const stockResult = await applyStockChanges(cartItems, invoiceType);
    const balanceResult = await applyCustomerBalance(newInvoice);
    const failures = (stockResult?.failed.length ?? 0) + (balanceResult?.failed.length ?? 0);

    // Çek Önizleme Aç
    setActiveReceiptInvoice(newInvoice);

    setToastMessage({
      type: failures ? 'info' : 'success',
      text: failures ? t('pos.effectsIncomplete', { count: failures }) : t('pos.saleCompletedInvoice', { invoice: newInvoice.invoiceNo, amount: formatMoney(amountDue, language) })
    });

    // Reset Cart and Notes for next customer
    setCartItems([]);
    setCashReceived(0);
    setInternalNote('');
    setGlobalPercent(0);
    setCreditAdvance(0);

    setTimeout(() => setToastMessage(null), 4000);
  };

  const runSale = async (operation: () => Promise<void>) => {
    if (saleInFlight.current) return;
    saleInFlight.current = true;
    try { await operation(); } finally { saleInFlight.current = false; }
  };
  const handleCompleteSale = () => runSale(completeSale);
  const handleCardPaymentApproved = (code: string) => runSale(() => approveCardPayment(code));
  return { creditFields, handleCardPaymentApproved, handleCompleteSale };
}
