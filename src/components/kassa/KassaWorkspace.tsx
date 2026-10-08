import React, { useEffect, useMemo, useState } from 'react';
import { LanguageCode, MoneyTransaction, MoneyTxType, Customer, AppUser, Ledger, CurrencyRate, InvoiceRecord, OperationSettings } from '../../types';
import { categoryLabel } from '../../db/moneyService';
import { KassaDashboard } from './KassaDashboard';
import { KassaFilters, KassaFilterState, EMPTY_KASSA_FILTER } from './KassaFilters';
import { KassaTable } from './KassaTable';
import { MoneyFormModal } from './MoneyFormModal';
import { DeleteMoneyDialog } from './KassaDialogs';
import { onMobileAdd } from '../../utils/mobileEvents';
import { PageScroll } from '../common/PageScroll';
import { MoneySearchModal } from './MoneySearchModal';

/** Kassa moduly üçin inçe rugsatlar (WorkspaceRouter-den gelýär). */
export interface KassaExtras {
  addIncome: boolean;
  addExpense: boolean;
  viewBalance: boolean;
  /** undefined = ähli gelir kategoriýalary açyk; doly = diňe şolar; [] = hiç biri. */
  incomeCategories?: string[];
}

interface KassaWorkspaceProps {
  transactions: readonly MoneyTransaction[];
  customers: readonly Customer[];
  appUsers: readonly AppUser[];
  ledgers: readonly Ledger[];
  currencies: readonly CurrencyRate[];
  invoices: readonly InvoiceRecord[];
  language: LanguageCode;
  advancedSearchOpen?: boolean;
  onAdvancedSearchOpen: () => void;
  onAdvancedSearchClose: () => void;
  onSaveTransaction: (transaction: MoneyTransaction, previous: MoneyTransaction | null) => void;
  onDeleteTransaction: (transaction: MoneyTransaction) => void;
  onQuickAddCustomer: (name: string) => Customer;
  /** Inçe rugsatlar (Kassa). */
  kassaExtras?: KassaExtras;
  /** Modul düzenle rugsady (kalem ikony). */
  canEditTx?: boolean;
  /** Modul silme rugsady (çöp kutusu ikony). */
  canDeleteTx?: boolean;
  /** Operasiýa düzgünleri (seneler — ýazgy döwri). */
  operationRules?: OperationSettings | null;
}

function isFilterActive(filters: KassaFilterState): boolean {
  return Boolean(
    filters.search ||
      filters.type ||
      filters.category ||
      filters.customerId ||
      filters.dateFrom ||
      filters.dateTo
  );
}

function matchesFilters(
  transaction: MoneyTransaction,
  filters: KassaFilterState,
  customers: readonly Customer[]
): boolean {
  if (filters.type && transaction.type !== filters.type) return false;
  if (filters.category && transaction.category !== filters.category) return false;
  if (filters.customerId && transaction.customerId !== filters.customerId) return false;
  if (filters.dateFrom && transaction.date < filters.dateFrom) return false;
  if (filters.dateTo && transaction.date > filters.dateTo) return false;

  const query = filters.search.trim().toLowerCase();
  if (!query) return true;

  const customerName = customers.find((c) => c.id === transaction.customerId)?.name ?? '';
  return (
    (transaction.description ?? '').toLowerCase().includes(query) ||
    customerName.toLowerCase().includes(query) ||
    (transaction.personName ?? '').toLowerCase().includes(query) ||
    categoryLabel(transaction.category).toLowerCase().includes(query)
  );
}

export const KassaWorkspace: React.FC<KassaWorkspaceProps> = ({
  transactions,
  customers,
  appUsers,
  ledgers,
  currencies,
  invoices,
  language,
  advancedSearchOpen = false,
  onAdvancedSearchOpen,
  onAdvancedSearchClose,
  onSaveTransaction,
  onDeleteTransaction,
  onQuickAddCustomer,
  kassaExtras = { addIncome: true, addExpense: true, viewBalance: true },
  canEditTx = true,
  canDeleteTx = true,
  operationRules = null,
}) => {
  const [filters, setFilters] = useState<KassaFilterState>(EMPTY_KASSA_FILTER);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formType, setFormType] = useState<MoneyTxType>('income');
  const [editingTransaction, setEditingTransaction] = useState<MoneyTransaction | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MoneyTransaction | null>(null);
  const [saveError, setSaveError] = useState('');

  const canAddIncome = kassaExtras.addIncome;
  const canAddExpense = kassaExtras.addExpense;
  const canViewBalance = kassaExtras.viewBalance;

  const visibleTransactions = useMemo(() => {
    return transactions
      .filter((transaction) => matchesFilters(transaction, filters, customers))
      .sort((a, b) =>
        a.date === b.date ? b.createdAt.localeCompare(a.createdAt) : b.date.localeCompare(a.date)
      );
  }, [transactions, filters, customers]);

  const openForm = (type: MoneyTxType, transaction: MoneyTransaction | null) => {
    setSaveError('');
    setFormType(type);
    setEditingTransaction(transaction);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingTransaction(null);
    setSaveError('');
  };

  // Mobil yüzen + butonu — girdeji formuny açýar (rugsat bar bolsa).
  useEffect(() => onMobileAdd(() => {
    if (kassaExtras.addIncome) openForm('income', null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [kassaExtras.addIncome]);

  // ── Hizmet katmanı (backend) koruması: izinsiz gider/kategori/operasiya döwri ──
  const handleSave = (transaction: MoneyTransaction) => {
    // Operasiýa döwri: başlangyç/soňky sene aralygyndan daşarda ýazgy ýazylmaýar.
    if (operationRules) {
      const start = operationRules.operationStartDate;
      const end = operationRules.operationEndDate;
      if (start && transaction.date < start) {
        setSaveError(
          language === 'tm'
            ? `Bu sene operasiýa açylmady (başlangyç: ${start}).`
            : `Bu tarihte işlem açılmadı (başlangıç: ${start}).`
        );
        return;
      }
      if (end && transaction.date > end) {
        setSaveError(
          language === 'tm'
            ? `Operasiýa döwri gutardy (soňky: ${end}).`
            : `İşlem dönemi bitti (son: ${end}).`
        );
        return;
      }
    }
    if (transaction.type === 'expense' && !canAddExpense) {
      setSaveError(language === 'tm' ? 'Çykdajy goşmaga rugsadyňyz ýok.' : 'Gider ekleme yetkiniz yok.');
      return;
    }
    if (transaction.type === 'income' && !canAddIncome) {
      setSaveError(language === 'tm' ? 'Girdeji goşmaga rugsadyňyz ýok.' : 'Gelir ekleme yetkiniz yok.');
      return;
    }
    if (transaction.type === 'income') {
      const allowed = kassaExtras.incomeCategories;
      if (allowed !== undefined && !allowed.includes(transaction.category)) {
        setSaveError(language === 'tm' ? 'Bu kategoriýa üçin rugsat ýok.' : 'Bu kategori için yetkiniz yok.');
        return;
      }
    }
    onSaveTransaction(transaction, editingTransaction);
    closeForm();
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F1F5F9] overflow-hidden">
      <PageScroll>
      <div className="px-3 md:px-6 pt-3 md:pt-5 pb-3 space-y-3">
        {canViewBalance && <KassaDashboard transactions={transactions} language={language} />}
        <KassaFilters
          filters={filters}
          customers={customers}
          language={language}
          onChange={setFilters}
          onAddIncome={() => openForm('income', null)}
          onAddExpense={() => openForm('expense', null)}
          onOpenAdvanced={onAdvancedSearchOpen}
          canAddIncome={canAddIncome}
          canAddExpense={canAddExpense}
          allowedIncomeCategories={kassaExtras.incomeCategories}
        />
        {saveError && (
          <div className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
            {saveError}
          </div>
        )}

      <div className="px-3 md:px-6">
        <KassaTable
          transactions={visibleTransactions}
          customers={customers}
          appUsers={appUsers}
          language={language}
          canEdit={canEditTx}
          canDelete={canDeleteTx}
          onEdit={(transaction) => openForm(transaction.type, transaction)}
          onDelete={(transaction) => setDeleteTarget(transaction)}
        />
        {isFilterActive(filters) && (
          <div className="mt-2 text-[11px] font-bold text-gray-500 px-1">
            {visibleTransactions.length} hereket görkezilýär
          </div>
        )}
      </div>
      </div>
      </PageScroll>

      {isFormOpen && (
        <MoneyFormModal
          language={language}
          customers={customers}
          appUsers={appUsers}
          initialType={formType}
          editingTransaction={editingTransaction}
          onSave={handleSave}
          onClose={closeForm}
          onQuickAddCustomer={onQuickAddCustomer}
          allowedIncomeCategories={kassaExtras.incomeCategories}
          canAddExpense={canAddExpense}
        />
      )}

      {deleteTarget && (
        <DeleteMoneyDialog
          transaction={deleteTarget}
          language={language}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => {
            onDeleteTransaction(deleteTarget);
            setDeleteTarget(null);
          }}
        />
      )}

      {advancedSearchOpen && (
        <MoneySearchModal
          transactions={transactions}
          customers={customers}
          appUsers={appUsers}
          ledgers={ledgers}
          currencies={currencies}
          invoices={invoices}
          language={language}
          canEdit={canEditTx}
          canDelete={canDeleteTx}
          onEdit={(transaction) => openForm(transaction.type, transaction)}
          onDelete={(transaction) => setDeleteTarget(transaction)}
          onClose={onAdvancedSearchClose}
        />
      )}
    </div>
  );
};