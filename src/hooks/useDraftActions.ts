import type { InvoiceEffectResult } from './useInvoiceEffects';
import type React from 'react';
import { useRef } from 'react';
import { useT } from '../locales/LanguageContext';
import type { MoneyTransaction } from '../types';
import { InvoiceRecord, CartItem, Customer, InvoiceType, PaymentMethod, User } from '../types';
import { saveInvoiceToDb, generateInvoiceNo } from '../db/salesService';
import { PosTabType } from '../components/pos/TopNavBar';
import { useMoneyStore } from './useMoneyStore';
import { WorkspaceToast } from './useCartActions';

interface Options {
  setCompletedInvoices: React.Dispatch<React.SetStateAction<InvoiceRecord[]>>;
  storeDb: string;
  applyStockChanges: (items: CartItem[], type: InvoiceType, direction?: 1 | -1) => Promise<InvoiceEffectResult>;
  applyCustomerBalance: (invoice: InvoiceRecord, direction?: 1 | -1) => Promise<InvoiceEffectResult>;
  moneyTransactions: import("../types").MoneyTransaction[];
  moneyStore: import("./useMoneyStore").MoneyStore;
  currentUser: User;
  setToastMessage: React.Dispatch<React.SetStateAction<WorkspaceToast | null>>;
  setIsDraftFormOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsGaralamaOpen: React.Dispatch<React.SetStateAction<boolean>>;
  cartItems: CartItem[];
  loadedDraftId: string | null;
  completedInvoices: InvoiceRecord[];
  invoiceType: InvoiceType;
  selectedCustomer: Customer | null;
  subtotal: number;
  discountTotal: number;
  amountDue: number;
  paymentMethod: PaymentMethod;
  creditAdvance: number;
  internalNote: string;
  creditFields: (total: number) => Pick<InvoiceRecord, "paidAmount" | "remainingDebt" | "creditTermDays" | "dueDate">;
  draftWarehouseId: string;
  draftTargetWarehouseId: string;
  draftLedgerId: string;
  setLoadedDraftId: React.Dispatch<React.SetStateAction<string | null>>;
  setCartItems: React.Dispatch<React.SetStateAction<CartItem[]>>;
  setCashReceived: React.Dispatch<React.SetStateAction<number>>;
  setInternalNote: React.Dispatch<React.SetStateAction<string>>;
  setGlobalPercent: React.Dispatch<React.SetStateAction<number>>;
  setSelectedCustomer: React.Dispatch<React.SetStateAction<Customer | null>>;
  customers: Customer[];
  setInvoiceType: React.Dispatch<React.SetStateAction<InvoiceType>>;
  setPaymentMethod: React.Dispatch<React.SetStateAction<PaymentMethod>>;
  setInvoiceCode: React.Dispatch<React.SetStateAction<string>>;
  setDraftWarehouseId: React.Dispatch<React.SetStateAction<string>>;
  setDraftLedgerId: React.Dispatch<React.SetStateAction<string>>;
  handleTabChange: (newTab: PosTabType) => Promise<void>;
}

export function useDraftActions({ setCompletedInvoices, storeDb, applyStockChanges, applyCustomerBalance, moneyTransactions, moneyStore, currentUser, setToastMessage, setIsDraftFormOpen, setIsGaralamaOpen, cartItems, loadedDraftId, completedInvoices, invoiceType, selectedCustomer, subtotal, discountTotal, amountDue, paymentMethod, creditAdvance, internalNote, creditFields, draftWarehouseId, draftTargetWarehouseId, draftLedgerId, setLoadedDraftId, setCartItems, setCashReceived, setInternalNote, setGlobalPercent, setSelectedCustomer, customers, setInvoiceType, setPaymentMethod, setInvoiceCode, setDraftWarehouseId, setDraftLedgerId, handleTabChange }: Options) {
  const t = useT();
  const pendingAccepts = useRef(new Set<string>());
  const completedAccepts = useRef(new Set<string>());

const upsertInvoice = async (invoice: InvoiceRecord) => {
    await saveInvoiceToDb(invoice, storeDb);
    setCompletedInvoices((prev) => {
      const exists = prev.some((item) => item.id === invoice.id);
      return exists
        ? prev.map((item) => (item.id === invoice.id ? invoice : item))
        : [invoice, ...prev];
    });

  };

const performVoidInvoice = async (invoice: InvoiceRecord) => {
    if (invoice.status === 'voided') return;

    await upsertInvoice({
      ...invoice,
      status: 'voided',
      voidedAt: new Date().toISOString(),
      voidedBy: currentUser.name,
    });

    let failures = 0;
    // Garalama (pending/rejected) modullara täsir etmedi → ters amal gerek däl.
    const effectsApplied =
      invoice.draftStatus !== 'pending' && invoice.draftStatus !== 'rejected';

    if (effectsApplied) {
      const stock = await applyStockChanges(invoice.items, invoice.invoiceType, -1);
      const balance = await applyCustomerBalance(invoice, -1);
      failures += (stock?.failed.length ?? 0) + (balance?.failed.length ?? 0);
    }

    // Şu faktura bagly Kassa/Depder ýazgylaryny aýyrýarys (bakiyeler awtomatik düzelýär).
    for (const tx of moneyTransactions) {
      if (tx.invoiceId === invoice.id && !await moneyStore.deleteMoneyTransaction(tx)) failures++;
    }

    setToastMessage({ type: failures ? 'info' : 'success', text: failures ? t('pos.effectsIncomplete', { count: failures }) : t('pos.invoiceVoided', { invoice: invoice.invoiceNo }) });
    setTimeout(() => setToastMessage(null), 3000);
  };

const performCreateDraft = async (invoice: InvoiceRecord) => {
    await upsertInvoice(invoice);
    setIsDraftFormOpen(false);
    setIsGaralamaOpen(true);
    setToastMessage({ type: 'success', text: t('pos.draftCreated', { invoice: invoice.invoiceNo }) });
    setTimeout(() => setToastMessage(null), 3000);
  };

const performSaveDraftFromCart = async () => {
    if (cartItems.length === 0) {
      setToastMessage({ type: 'info', text: t('pos.cartEmptyAddFirst') });
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    const existing = loadedDraftId
      ? completedInvoices.find((invoice) => invoice.id === loadedDraftId) ?? null
      : null;

    const draft: InvoiceRecord = {
      id: existing ? existing.id : `inv-${Date.now()}-${crypto.randomUUID()}`,
      invoiceNo: existing ? existing.invoiceNo : generateInvoiceNo(),
      invoiceType,
      customerId: selectedCustomer?.id ?? null,
      customerName: selectedCustomer?.name ?? t('generalCustomer'),
      items: [...cartItems],
      itemCount: cartItems.reduce((sum, item) => sum + item.qty, 0),
      subtotal,
      discountTotal,
      taxTotal: 0,
      amountDue,
      amountTmt: amountDue,
      paymentMethod,
      cashReceived: paymentMethod === 'credit' ? Math.min(creditAdvance, amountDue) : 0,
      changeDue: 0,
      status: 'completed',
      createdAt: existing ? existing.createdAt : new Date().toISOString(),
      cashierName: currentUser.name,
      internalNote: internalNote.trim() ? internalNote.trim() : undefined,
      ...creditFields(amountDue),
      draftStatus: 'pending',
      createdBy: existing ? existing.createdBy : currentUser.name,
      createdByRole: existing
        ? existing.createdByRole
        : currentUser.role === 'admin'
        ? 'Administrator'
        : 'Işgär',
      device: existing ? existing.device : 'Merkaz',
      warehouseId: draftWarehouseId ? draftWarehouseId : undefined,
      targetWarehouseId:
        invoiceType === 'warehouse_move' && draftTargetWarehouseId
          ? draftTargetWarehouseId
          : undefined,
      ledgerId: draftLedgerId ? draftLedgerId : undefined,
    };

    await upsertInvoice(draft);

    // Sessiz ýazgy: hiç hili sanaw/modal açylmaýar, diňe gysga bildirim.
    setToastMessage({
      type: 'success',
      text: existing
        ? t('pos.draftUpdated', { invoice: draft.invoiceNo })
        : t('pos.draftSaved', { invoice: draft.invoiceNo }),
    });
    setTimeout(() => setToastMessage(null), 3000);

    // Ekran täze sargyt üçin boşadylýar; garalama baglanyşygy hem aýrylýar.
    setLoadedDraftId(null);
    setCartItems([]);
    setCashReceived(0);
    setInternalNote('');
    setGlobalPercent(0);
  };

const applyAcceptedDraft = async (accepted: InvoiceRecord): Promise<boolean> => {
    if (pendingAccepts.current.has(accepted.id) || completedAccepts.current.has(accepted.id) ||
        completedInvoices.some(inv => inv.id === accepted.id && (inv.draftStatus === 'accepted' || inv.status === 'voided'))) return false;
    pendingAccepts.current.add(accepted.id);
    try {
    await saveInvoiceToDb(accepted, storeDb);
    setCompletedInvoices(prev => prev.some(inv => inv.id === accepted.id)
      ? prev.map(inv => inv.id === accepted.id ? accepted : inv) : [accepted, ...prev]);
    completedAccepts.current.add(accepted.id);
    const stockResult = await applyStockChanges(accepted.items, accepted.invoiceType);
    const balanceResult = await applyCustomerBalance(accepted);
    let failures = (stockResult?.failed.length ?? 0) + (balanceResult?.failed.length ?? 0);

    // Depder saýlanan bolsa we nagt/kart töleg bolsa — depdere degişli ýazgy düşýär.
    if (accepted.ledgerId && accepted.paymentMethod !== 'credit') {
      const isIncome = accepted.invoiceType === 'sales' || accepted.invoiceType === 'other_in';
      const isExpense = accepted.invoiceType === 'purchase' || accepted.invoiceType === 'other_out';
      if (isIncome || isExpense) {
        const moneyWritten = await moneyStore.saveMoneyTransaction(
          {
            id: `mtx-draft-${accepted.id}-ledger`,
            type: isIncome ? 'income' : 'expense',
            date: accepted.createdAt.slice(0, 10),
            amount: accepted.amountTmt ?? accepted.amountDue,
            paymentMethod: accepted.paymentMethod === 'card' ? 'card' : 'cash',
            category: isIncome ? 'haryt_satuw' : 'haryt_satyn_almak',
            ledgerId: accepted.ledgerId,
            customerId: accepted.customerId ? accepted.customerId : undefined,
            description: `${accepted.invoiceNo} · ${accepted.customerName}`,
            invoiceId: accepted.id,
            createdAt: new Date().toISOString(),
          },
          null
        );
        if (moneyWritten === false) failures++;
      }
    }

    setToastMessage({ type: failures ? 'info' : 'success', text: failures ? t('pos.effectsIncomplete', { count: failures }) : t('pos.draftAccepted', { invoice: accepted.invoiceNo }) });
    setTimeout(() => setToastMessage(null), 3000);
    return true;
    } catch {
      setToastMessage({ type: 'info', text: t('pos.saleSaveFailed') });
      return false;
    } finally { pendingAccepts.current.delete(accepted.id); }
  };

const handleAcceptDraft = (invoice: InvoiceRecord) => {
    return applyAcceptedDraft({
      ...invoice,
      draftStatus: 'accepted',
      acceptedBy: currentUser.name,
      acceptedAt: new Date().toISOString(),
    });
  };

const handleOpenDraft = (invoice: InvoiceRecord) => {
    setCartItems(invoice.items.map((item) => ({ ...item })));
    setSelectedCustomer(customers.find((c) => c.id === invoice.customerId) ?? null);
    setInvoiceType(invoice.invoiceType);
    setPaymentMethod(invoice.paymentMethod);
    setInternalNote(invoice.internalNote ?? '');
    setInvoiceCode(invoice.invoiceNo);
    setDraftWarehouseId(invoice.warehouseId ?? '');
    setDraftLedgerId(invoice.ledgerId ?? '');
    setLoadedDraftId(invoice.id);
    setIsGaralamaOpen(false);
    handleTabChange('checkout');
    setToastMessage({ type: 'info', text: t('pos.draftOpened', { invoice: invoice.invoiceNo }) });
    setTimeout(() => setToastMessage(null), 3000);
  };

const clearLoadedDraft = () => {
    setLoadedDraftId(null);
    setCartItems([]);
    setCashReceived(0);
    setInternalNote('');
    setGlobalPercent(0);
  };

const acceptLoadedDraft = async () => {
    const draft = completedInvoices.find((item) => item.id === loadedDraftId);
    if (!draft) {
      clearLoadedDraft();
      return;
    }
    const accepted = await applyAcceptedDraft({
      ...draft,
      customerId: selectedCustomer ? selectedCustomer.id : null,
      customerName: selectedCustomer ? selectedCustomer.name : t('generalCustomer'),
      items: [...cartItems],
      itemCount: cartItems.reduce((sum, item) => sum + item.qty, 0),
      subtotal,
      discountTotal,
      amountDue,
      amountTmt: amountDue,
      paymentMethod,
      cashReceived: paymentMethod === 'credit' ? Math.min(creditAdvance, amountDue) : 0,
      changeDue: 0,
      internalNote: internalNote.trim() ? internalNote.trim() : undefined,
      warehouseId: draftWarehouseId ? draftWarehouseId : undefined,
      ledgerId: draftLedgerId ? draftLedgerId : undefined,
      ...creditFields(amountDue),
      draftStatus: 'accepted',
      acceptedBy: currentUser.name,
      acceptedAt: new Date().toISOString(),
    });
    if (accepted) clearLoadedDraft();
  };

const performRejectDraft = async (invoice: InvoiceRecord, reason: string) => {
    await upsertInvoice({
      ...invoice,
      draftStatus: 'rejected',
      rejectedReason: reason ? reason : undefined,
    });
    setToastMessage({ type: 'info', text: t('pos.draftRejected', { invoice: invoice.invoiceNo }) });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const pendingWrites = useRef(new Set<string>());
  const draftWrite = async (key: string, operation: () => Promise<void>) => {
    if (pendingWrites.current.has(key)) return;
    pendingWrites.current.add(key);
    try { await operation(); }
    catch { setToastMessage({ type: 'info', text: t('pos.saleSaveFailed') }); }
    finally { pendingWrites.current.delete(key); }
  };
  const handleVoidInvoice = (invoice: InvoiceRecord) => draftWrite(`void:${invoice.id}`, () => performVoidInvoice(invoice));
  const handleCreateDraft = (invoice: InvoiceRecord) => draftWrite(`create:${invoice.id}`, () => performCreateDraft(invoice));
  const handleSaveDraftFromCart = () => draftWrite('cart-draft', performSaveDraftFromCart);
  const handleRejectDraft = (invoice: InvoiceRecord, reason: string) => draftWrite(`reject:${invoice.id}`, () => performRejectDraft(invoice, reason));
  return { upsertInvoice, handleVoidInvoice, handleCreateDraft, handleSaveDraftFromCart, applyAcceptedDraft, handleAcceptDraft, handleOpenDraft, clearLoadedDraft, acceptLoadedDraft, handleRejectDraft };
}
