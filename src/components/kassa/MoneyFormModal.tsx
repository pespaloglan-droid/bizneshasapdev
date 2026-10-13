import React, { useRef, useState } from 'react';
import { X } from 'lucide-react';
import type {
  AppUser,
  InvoiceRecord,
  Customer,
  LanguageCode,
  MoneyCategoryId,
  MoneyPaymentMethod,
  MoneyTransaction,
  MoneyTxType,
} from '../../types';
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  PAYMENT_METHOD_LABELS,
  categoryMeta,
} from '../../db/moneyService';
import { formatMoney } from '../../utils/money';
import { MoneyExtraFields } from './MoneyExtraFields';
import { INPUT, LABEL } from './kassaStyles';
import {
  MoneyFormState,
  buildMoneyTransaction,
  emptyMoneyForm,
  moneyFormFromTransaction,
  switchMoneyType,
  validateMoneyForm,
} from './moneyFormModel';
import { useT } from '../../locales/LanguageContext';

interface MoneyFormModalProps {
  language: LanguageCode;
  customers: readonly Customer[];
  invoices?: readonly InvoiceRecord[];
  appUsers: readonly AppUser[];
  initialType: MoneyTxType;
  editingTransaction: MoneyTransaction | null;
  onSave: (transaction: MoneyTransaction) => void | Promise<void>;
  onClose: () => void;
  onQuickAddCustomer: (name: string) => Promise<Customer | null>;
  ledgerId?: string;
  /** Rugsat berilen gelir kategoriýalary (undefined = ählisi; dropdown diňe şolar görkezýär). */
  allowedIncomeCategories?: readonly string[];
  /** "Çykdajy" sekmesi görkezilýär. */
  canAddExpense?: boolean;
}

const PAYMENT_METHODS = Object.keys(PAYMENT_METHOD_LABELS) as MoneyPaymentMethod[];

export const MoneyFormModal: React.FC<MoneyFormModalProps> = ({
  language,
  customers,
  invoices = [],
  appUsers,
  initialType,
  editingTransaction,
  onSave,
  onClose,
  onQuickAddCustomer,
  ledgerId,
  allowedIncomeCategories,
  canAddExpense = true,
}) => {
  const [form, setForm] = useState<MoneyFormState>(() =>
    editingTransaction ? moneyFormFromTransaction(editingTransaction) : emptyMoneyForm(initialType)
  );
  const [error, setError] = useState('');
  const t = useT();
  const submitting = useRef(false);

  const extra = categoryMeta(form.category).extra;
  // Girdeji kategoriýalary: rugsat berilenler (undefined = ählisi açyk).
  const categories =
    form.type === 'income'
      ? allowedIncomeCategories && allowedIncomeCategories.length > 0
        ? INCOME_CATEGORIES.filter((c) => allowedIncomeCategories.includes(c.id))
        : INCOME_CATEGORIES
      : EXPENSE_CATEGORIES;
  const selectedCustomer = customers.find((customer) => customer.id === form.customerId) ?? null;

  const patch = (partial: Partial<MoneyFormState>) =>
    setForm((prev) => ({ ...prev, ...partial, ...(partial.customerId !== undefined && partial.customerId !== prev.customerId ? { invoiceId: '' } : {}) }));

  const quickAdding = useRef(false);
  const handleQuickAdd = async (name: string) => {
    if (quickAdding.current) return;
    quickAdding.current=true;
    try { const created = await onQuickAddCustomer(name); if (created) patch({ customerId: created.id }); else setError(t('pos.catalogWriteFailed')); }
    catch { setError(t('pos.catalogWriteFailed')); }
    finally { quickAdding.current=false; }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting.current) return;
    if (quickAdding.current) { setError(t('pos.catalogWriteFailed')); return; }
    // Hizmet katmanı (backend) koruması: izinsiz kategoriye/kayda yol ýok.
    if (
      form.type === 'income' &&
      allowedIncomeCategories !== undefined &&
      !allowedIncomeCategories.includes(form.category)
    ) {
      setError(t('kassa.noCategoryPerm'));
      return;
    }
    const nextError = validateMoneyForm(form, language);
    if (nextError) {
      setError(nextError);
      return;
    }
    if (form.category === 'weresiye_yygnamak' && form.invoiceId) {
      const linked = invoices.find(inv => inv.id === form.invoiceId);
      if (!linked || linked.customerId !== form.customerId || linked.paymentMethod !== 'credit' ||
          linked.status !== 'completed' || ['pending', 'rejected'].includes(linked.draftStatus ?? '') ||
          !['sales', 'other_out'].includes(linked.invoiceType)) {
        setError(t('pos.receiptInvoiceInvalid')); return;
      }
    }
    submitting.current=true;
    try {await onSave(buildMoneyTransaction(form, editingTransaction, ledgerId));}
    catch {setError(t('pos.moneyWriteFailed'));}
    finally {submitting.current=false;}
  };

  const title = editingTransaction
    ? t('kassa.editTitle')
    : form.type === 'income'
    ? t('kassa.addIncomeTitle')
    : t('kassa.addExpenseTitle');

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        <div className="px-5 py-4 bg-gradient-to-r from-[#0B1F3A] to-[#163864] text-white flex items-center justify-between flex-shrink-0">
          <span className="font-bold text-sm tracking-wide">{title}</span>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setForm((prev) => switchMoneyType(prev, 'income'))}
              className={`h-9 px-5 rounded-xl text-xs font-bold transition-all ${
                form.type === 'income'
                  ? 'bg-[#10b981] text-white'
                  : 'bg-white text-gray-500 border border-gray-200'
              }`}
            >
              {t('kassa.income')}
            </button>
            {canAddExpense && (
            <button
              type="button"
              onClick={() => setForm((prev) => switchMoneyType(prev, 'expense'))}
              className={`h-9 px-5 rounded-xl text-xs font-bold transition-all ${
                form.type === 'expense'
                  ? 'bg-rose-500 text-white'
                  : 'bg-white text-gray-500 border border-gray-200'
              }`}
            >
              {t('kassa.expense')}
            </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>{t('kassa.dateLabel')} *</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => patch({ date: e.target.value })}
                className={`${INPUT} font-medium text-gray-800`}
              />
            </div>

            <div>
              <label className={LABEL}>
                {t('kassa.colAmount')} * {form.amount ? `(${formatMoney(Number(form.amount) || 0)})` : ''}
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.amount}
                onChange={(e) => patch({ amount: e.target.value })}
                placeholder="0.00"
                className={`${INPUT} font-mono font-bold text-gray-800`}
              />
            </div>

            <div>
              <label className={LABEL}>{t('kassa.colPayment')}</label>
              <select
                value={form.paymentMethod}
                onChange={(e) => patch({ paymentMethod: e.target.value as MoneyPaymentMethod })}
                className={`${INPUT} cursor-pointer font-medium text-gray-800`}
              >
                {PAYMENT_METHODS.map((key) => (
                  <option key={key} value={key}>
                    {PAYMENT_METHOD_LABELS[key]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={LABEL}>{t('kassa.colCategory')} *</label>
              <select
                value={form.category}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    category: e.target.value as MoneyCategoryId,
                    subCategory: '',
                    customerId: '',
                    invoiceId: '',
                    personName: '',
                    staffUserId: '',
                  }))
                }
                className={`${INPUT} cursor-pointer font-medium text-gray-800`}
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <MoneyExtraFields
            extra={extra}
            form={form}
            customers={customers}
            appUsers={appUsers}
            language={language}
            selectedCustomer={selectedCustomer}
            patch={patch}
            onQuickAdd={handleQuickAdd}
          />

          {form.category === 'weresiye_yygnamak' && (
            <div>
              <label className={LABEL} htmlFor="receipt-invoice">{t('pos.receiptInvoice')}</label>
              <select id="receipt-invoice" className={INPUT} value={form.invoiceId ?? ''}
                onChange={e => patch({ invoiceId: e.target.value })}>
                <option value="">{t('pos.unallocatedReceipt')}</option>
                {form.invoiceId && !invoices.some(inv => inv.id === form.invoiceId) &&
                  <option value={form.invoiceId}>{form.invoiceId}</option>}
                {invoices.filter(inv => inv.customerId === form.customerId && inv.paymentMethod === 'credit' &&
                  inv.status === 'completed' && !['pending', 'rejected'].includes(inv.draftStatus ?? '') &&
                  ['sales', 'other_out'].includes(inv.invoiceType)).map(inv =>
                    <option key={inv.id} value={inv.id}>{inv.invoiceNo} · {formatMoney(inv.amountDue)}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className={LABEL}>{t('kassa.colDesc')}</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => patch({ description: e.target.value })}
              className={`${INPUT} font-medium text-gray-800`}
            />
          </div>

          {error && (
            <div className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="h-9 px-5 rounded-xl bg-[#10b981] hover:bg-[#059669] text-white font-bold text-xs"
            >
              {t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
