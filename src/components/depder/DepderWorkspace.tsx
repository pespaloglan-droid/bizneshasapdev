import React, { useMemo, useState } from 'react';
import type {
  AppUser,
  CurrencyRate,
  Customer,
  LanguageCode,
  Ledger,
  MoneyTransaction,
  MoneyTxType,
  User,
} from '../../types';
import {
  computeLedgerBalance,
  ledgerTransactions,
  resolveLedgerPermission,
  visibleLedgersForUser,
} from '../../db/ledgerService';
import { LedgerList } from './LedgerList';
import { LedgerDetail } from './LedgerDetail';
import { LedgerFormModal } from './LedgerFormModal';
import { LedgerDeleteDialog } from './LedgerDeleteDialog';
import { LedgerTransferModal } from './LedgerTransferModal';
import { MoneyFormModal } from '../kassa/MoneyFormModal';

interface DepderWorkspaceProps {
  ledgers: readonly Ledger[];
  transactions: readonly MoneyTransaction[];
  customers: readonly Customer[];
  appUsers: readonly AppUser[];
  currencies: readonly CurrencyRate[];
  currentUser: User;
  language: LanguageCode;
  onSaveLedger: (ledger: Ledger) => void;
  onDeleteLedger: (ledger: Ledger) => void;
  onSaveTransaction: (transaction: MoneyTransaction, previous: MoneyTransaction | null) => void;
  onDeleteTransaction: (transaction: MoneyTransaction) => void;
  onTransfer: (transactions: [MoneyTransaction, MoneyTransaction]) => void;
  onQuickAddCustomer: (name: string) => Customer;
}

export const DepderWorkspace: React.FC<DepderWorkspaceProps> = ({
  ledgers,
  transactions,
  customers,
  appUsers,
  currencies,
  currentUser,
  language,
  onSaveLedger,
  onDeleteLedger,
  onSaveTransaction,
  onDeleteTransaction,
  onTransfer,
  onQuickAddCustomer,
}) => {
  const [selectedLedgerId, setSelectedLedgerId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLedger, setEditingLedger] = useState<Ledger | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Ledger | null>(null);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [moneyFormType, setMoneyFormType] = useState<MoneyTxType>('income');
  const [editingTransaction, setEditingTransaction] = useState<MoneyTransaction | null>(null);
  const [isMoneyFormOpen, setIsMoneyFormOpen] = useState(false);

  const visibleLedgers = useMemo(
    () => visibleLedgersForUser(ledgers, currentUser, appUsers),
    [ledgers, currentUser, appUsers]
  );

  const canManage = currentUser.role === 'admin';
  const selectedLedger = visibleLedgers.find((ledger) => ledger.id === selectedLedgerId) ?? null;

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingLedger(null);
  };

  const closeMoneyForm = () => {
    setIsMoneyFormOpen(false);
    setEditingTransaction(null);
  };

  const openMoneyForm = (type: MoneyTxType, transaction: MoneyTransaction | null) => {
    setMoneyFormType(type);
    setEditingTransaction(transaction);
    setIsMoneyFormOpen(true);
  };

  if (selectedLedger) {
    const permission = resolveLedgerPermission(selectedLedger, currentUser, appUsers);
    return (
      <>
        <LedgerDetail
          ledger={selectedLedger}
          transactions={transactions}
          customers={customers}
          appUsers={appUsers}
          language={language}
          balance={computeLedgerBalance(selectedLedger, transactions)}
          permission={permission}
          onBack={() => setSelectedLedgerId(null)}
          onNewTransaction={(type) => openMoneyForm(type, null)}
          onEditTransaction={(transaction) => openMoneyForm(transaction.type, transaction)}
          onDeleteTransaction={onDeleteTransaction}
        />

        {isMoneyFormOpen && (
          <MoneyFormModal
            language={language}
            customers={customers}
            appUsers={appUsers}
            initialType={moneyFormType}
            editingTransaction={editingTransaction}
            ledgerId={selectedLedger.id}
            onSave={(transaction) => {
              onSaveTransaction(transaction, editingTransaction);
              closeMoneyForm();
            }}
            onClose={closeMoneyForm}
            onQuickAddCustomer={onQuickAddCustomer}
          />
        )}
      </>
    );
  }

  return (
    <>
      <LedgerList
        ledgers={visibleLedgers}
        transactions={transactions}
        currencies={currencies}
        language={language}
        canManage={canManage}
        onOpen={(ledger) => setSelectedLedgerId(ledger.id)}
        onEdit={(ledger) => {
          setEditingLedger(ledger);
          setIsFormOpen(true);
        }}
        onDelete={(ledger) => setDeleteTarget(ledger)}
        onAdd={() => {
          setEditingLedger(null);
          setIsFormOpen(true);
        }}
        onTransfer={() => setIsTransferOpen(true)}
      />

      {isFormOpen && (
        <LedgerFormModal
          language={language}
          ledgers={ledgers}
          currencies={currencies}
          appUsers={appUsers}
          editingLedger={editingLedger}
          onSave={(ledger) => {
            onSaveLedger(ledger);
            closeForm();
          }}
          onClose={closeForm}
        />
      )}

      {deleteTarget && (
        <LedgerDeleteDialog
          ledger={deleteTarget}
          language={language}
          hasTransactions={ledgerTransactions(deleteTarget, transactions).length > 0}
          onCancel={() => setDeleteTarget(null)}
          onConfirmDelete={() => {
            onDeleteLedger(deleteTarget);
            setDeleteTarget(null);
          }}
          onDeactivate={() => {
            onSaveLedger({ ...deleteTarget, isActive: false });
            setDeleteTarget(null);
          }}
        />
      )}

      {isTransferOpen && (
        <LedgerTransferModal
          language={language}
          ledgers={visibleLedgers.filter((ledger) => ledger.isActive)}
          currencies={currencies}
          onTransfer={(created) => {
            onTransfer(created);
            setIsTransferOpen(false);
          }}
          onClose={() => setIsTransferOpen(false)}
        />
      )}
    </>
  );
};
