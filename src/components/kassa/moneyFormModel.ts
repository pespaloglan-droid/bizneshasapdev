import type {
  MoneyCategoryId,
  MoneyPaymentMethod,
  MoneySubCategoryId,
  MoneyTransaction,
  MoneyTxType,
} from '../../types';
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  categoryMeta,
  generateMoneyTxId,
} from '../../db/moneyService';
import { todayIsoDate } from '../../utils/money';

export interface MoneyFormState {
  type: MoneyTxType;
  date: string;
  amount: string;
  paymentMethod: MoneyPaymentMethod;
  category: MoneyCategoryId;
  subCategory: MoneySubCategoryId | '';
  customerId: string;
  personName: string;
  staffUserId: string;
  description: string;
}

export function defaultCategory(type: MoneyTxType): MoneyCategoryId {
  const list = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  return list[0].id;
}

export function emptyMoneyForm(type: MoneyTxType): MoneyFormState {
  return {
    type,
    date: todayIsoDate(),
    amount: '',
    paymentMethod: 'cash',
    category: defaultCategory(type),
    subCategory: '',
    customerId: '',
    personName: '',
    staffUserId: '',
    description: '',
  };
}

export function moneyFormFromTransaction(transaction: MoneyTransaction): MoneyFormState {
  return {
    type: transaction.type,
    date: transaction.date,
    amount: String(transaction.amount),
    paymentMethod: transaction.paymentMethod,
    category: transaction.category,
    subCategory: transaction.subCategory ?? '',
    customerId: transaction.customerId ?? '',
    personName: transaction.personName ?? '',
    staffUserId: transaction.staffUserId ?? '',
    description: transaction.description ?? '',
  };
}

/** Görnüşi çalyşanda kategorini we oňa bagly meýdanlary täzeleýär. */
export function switchMoneyType(form: MoneyFormState, type: MoneyTxType): MoneyFormState {
  if (form.type === type) return form;
  return {
    ...emptyMoneyForm(type),
    date: form.date,
    paymentMethod: form.paymentMethod,
    description: form.description,
  };
}

export function validateMoneyForm(form: MoneyFormState): string | null {
  const amount = Number(form.amount);
  if (!Number.isFinite(amount) || amount <= 0) return 'Mukdar 0-dan uly bolmaly.';
  if (!form.date) return 'Senäni saýlaň.';

  const extra = categoryMeta(form.category).extra;
  if (extra === 'customer-required' && !form.customerId) return 'Müşderini saýlaň.';
  if (extra === 'person-required' && !form.personName.trim()) {
    return 'Kim bilen baglydygyny ýazyň.';
  }
  return null;
}

export function buildMoneyTransaction(
  form: MoneyFormState,
  editing: MoneyTransaction | null,
  ledgerId?: string
): MoneyTransaction {
  const extra = categoryMeta(form.category).extra;
  const transaction: MoneyTransaction = {
    id: editing?.id ?? generateMoneyTxId(),
    type: form.type,
    date: form.date,
    amount: Math.abs(Number(form.amount)),
    paymentMethod: form.paymentMethod,
    category: form.category,
    createdAt: editing?.createdAt ?? new Date().toISOString(),
  };

  const resolvedLedgerId = ledgerId ?? editing?.ledgerId;
  if (resolvedLedgerId) {
    transaction.ledgerId = resolvedLedgerId;
  }
  if (editing?.transferGroupId) {
    transaction.transferGroupId = editing.transferGroupId;
  }

  if (extra === 'subcategory' && form.subCategory) {
    transaction.subCategory = form.subCategory;
  }
  if (form.customerId) {
    transaction.customerId = form.customerId;
  }
  const personName = form.personName.trim();
  if (personName && (extra === 'person' || extra === 'person-required')) {
    transaction.personName = personName;
  }
  if (extra === 'staff' && form.staffUserId) {
    transaction.staffUserId = form.staffUserId;
  }
  const description = form.description.trim();
  if (description) {
    transaction.description = description;
  }
  if (editing?.invoiceId) {
    transaction.invoiceId = editing.invoiceId;
  }
  return transaction;
}
