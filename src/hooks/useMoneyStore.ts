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
  ) => Promise<boolean>;
  readonly deleteMoneyTransaction: (transaction: MoneyTransaction) => Promise<boolean>;
  readonly transfer: (created: [MoneyTransaction, MoneyTransaction]) => Promise<void>;
}

export function useMoneyStore(
  storeDb: string,
  applyCustomerDeltas: (adjustments: CustomerAdjustment[]) => Promise<boolean>,
  onFailure: () => void = () => console.warn('MONEY_WRITE_FAILED')
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

  const saveMoneyTransaction = async (transaction: MoneyTransaction, previous: MoneyTransaction | null): Promise<boolean> => {
    try { await saveMoneyTransactionToDb(transaction,storeDb); }
    catch { onFailure(); return false; }
    setMoneyTransactions(prev=>prev.some(item=>item.id===transaction.id)
      ? prev.map(item=>item.id===transaction.id?transaction:item) : [transaction,...prev]);
    const ok=await applyCustomerDeltas([
      ...(previous ? [{customerId:previous.customerId,delta:-moneyCustomerBalanceDelta(previous)}] : []),
      {customerId:transaction.customerId,delta:moneyCustomerBalanceDelta(transaction)},
    ]);
    if (!ok) onFailure();
    return true; // Birincil kayıt yazıldı; yeni ID ile tekrar tahsilat oluşturma.
  };
  const deleteMoneyTransaction = async (transaction: MoneyTransaction): Promise<boolean> => {
    const removed=await deleteMoneyTransactionFromDb(transaction.id,storeDb);
    if (!removed) {onFailure();return false;}
    setMoneyTransactions(prev=>prev.filter(item=>item.id!==transaction.id));
    const ok=await applyCustomerDeltas([{customerId:transaction.customerId,delta:-moneyCustomerBalanceDelta(transaction)}]);
    if (!ok) onFailure();return ok;
  };
  const transfer = async (created: [MoneyTransaction, MoneyTransaction]): Promise<void> => {
    const results=await Promise.allSettled(created.map(transaction=>saveMoneyTransactionToDb(transaction,storeDb)));
    const saved=created.filter((_,index)=>results[index].status==='fulfilled');
    setMoneyTransactions(prev=>[...saved,...prev]);
    if (saved.length!==created.length) onFailure();
  };

  return { moneyTransactions, saveMoneyTransaction, deleteMoneyTransaction, transfer };
}