import { useEffect, useState } from 'react';
import type { MoneyTransaction } from '../types';
import {
  deleteMoneyTransactionFromDb,
  getMoneyTransactions,
  moneyCustomerBalanceDelta,
  saveMoneyTransactionToDb,
} from '../db/moneyService';

export interface CustomerAdjustment {
  readonly customerId?: string;
  readonly delta: number;
}

export interface MoneyStore {
  readonly moneyTransactions: MoneyTransaction[];
  readonly saveMoneyTransaction: (
    transaction: MoneyTransaction,
    previous: MoneyTransaction | null
  ) => void;
  readonly deleteMoneyTransaction: (transaction: MoneyTransaction) => void;
  readonly transfer: (created: [MoneyTransaction, MoneyTransaction]) => void;
}

export function useMoneyStore(
  storeDb: string,
  applyCustomerDeltas: (adjustments: CustomerAdjustment[]) => void
): MoneyStore {
  const [moneyTransactions, setMoneyTransactions] = useState<MoneyTransaction[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const loaded = await getMoneyTransactions(storeDb);
      if (cancelled) return;
      setMoneyTransactions(loaded);
    })();
    return () => {
      cancelled = true;
    };
  }, [storeDb]);

  const saveMoneyTransaction = (
    transaction: MoneyTransaction,
    previous: MoneyTransaction | null
  ) => {
    applyCustomerDeltas([
      ...(previous
        ? [{ customerId: previous.customerId, delta: -moneyCustomerBalanceDelta(previous) }]
        : []),
      { customerId: transaction.customerId, delta: moneyCustomerBalanceDelta(transaction) },
    ]);

    setMoneyTransactions((prev) =>
      prev.some((item) => item.id === transaction.id)
        ? prev.map((item) => (item.id === transaction.id ? transaction : item))
        : [transaction, ...prev]
    );
    saveMoneyTransactionToDb(transaction, storeDb).catch(() => {});
  };

  const deleteMoneyTransaction = (transaction: MoneyTransaction) => {
    applyCustomerDeltas([
      { customerId: transaction.customerId, delta: -moneyCustomerBalanceDelta(transaction) },
    ]);
    setMoneyTransactions((prev) => prev.filter((item) => item.id !== transaction.id));
    deleteMoneyTransactionFromDb(transaction.id, storeDb).catch(() => {});
  };

  const transfer = (created: [MoneyTransaction, MoneyTransaction]) => {
    setMoneyTransactions((prev) => [...created, ...prev]);
    for (const transaction of created) {
      saveMoneyTransactionToDb(transaction, storeDb).catch(() => {});
    }
  };

  return { moneyTransactions, saveMoneyTransaction, deleteMoneyTransaction, transfer };
}