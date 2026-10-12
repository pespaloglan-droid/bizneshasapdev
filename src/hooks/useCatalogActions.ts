import type React from 'react';
import { useT } from '../locales/LanguageContext';
import { Product, Customer } from '../types';
import { saveProductToDb, deleteProductFromDb, saveProductsBatchDb } from '../db/productService';
import { BatchWriteResult } from '../db/pouch';
import { saveCustomersBatchDb, saveCustomerToDb, GENERAL_CUSTOMER_ID, deleteCustomerFromDb } from '../db/customerService';
import { CustomerAdjustment } from './useMoneyStore';
import { WorkspaceToast } from './useCartActions';

interface Options {
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  storeDb: string;
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  setSelectedCustomer: React.Dispatch<React.SetStateAction<Customer | null>>;
  setToastMessage: React.Dispatch<React.SetStateAction<WorkspaceToast | null>>;
  selectedCustomer: Customer | null;
  customers: Customer[];
}

export function useCatalogActions({ setProducts, storeDb, setCustomers, setSelectedCustomer, setToastMessage, selectedCustomer, customers }: Options) {
  const t = useT();

const handleAddProduct = (p: Product) => {
    setProducts(prev => [p, ...prev]);
    saveProductToDb(p, storeDb).catch(() => {});
  };

const handleUpdateProduct = (p: Product) => {
    setProducts(prev => prev.map(x => x.id === p.id ? p : x));
    saveProductToDb(p, storeDb).catch(() => {});
  };

const handleDeleteProduct = (id: string) => {
    setProducts(prev => prev.filter(x => x.id !== id));
    deleteProductFromDb(id, storeDb).catch(() => {});
  };

const handleImportProducts = async (
    items: ReadonlyArray<{ product: Product; rowNumber: number }>
  ): Promise<BatchWriteResult> => {
    const result = await saveProductsBatchDb(
      items.map((item) => item.product),
      storeDb
    );
    const failedIds = new Set(result.failed.map((f) => f.id));
    const succeeded = items.map((item) => item.product).filter((p) => !failedIds.has(p.id));
    setProducts((prev) => {
      const prevIds = new Set(prev.map((p) => p.id));
      const fresh: Product[] = [];
      const replaced = new Map<string, Product>();
      for (const product of succeeded) {
        if (prevIds.has(product.id)) replaced.set(product.id, product);
        else fresh.push(product);
      }
      return [...fresh, ...prev.map((p) => replaced.get(p.id) ?? p)];
    });
    return result;
  };

const handleImportCustomers = async (
    items: ReadonlyArray<{ customer: Customer; rowNumber: number }>
  ): Promise<BatchWriteResult> => {
    const result = await saveCustomersBatchDb(
      items.map((item) => item.customer),
      storeDb
    );
    const failedIds = new Set(result.failed.map((f) => f.id));
    const succeeded = items.map((item) => item.customer).filter((c) => !failedIds.has(c.id));
    setCustomers((prev) => {
      const prevIds = new Set(prev.map((c) => c.id));
      const fresh: Customer[] = [];
      const replaced = new Map<string, Customer>();
      for (const customer of succeeded) {
        if (prevIds.has(customer.id)) replaced.set(customer.id, customer);
        else fresh.push(customer);
      }
      return [...fresh, ...prev.map((c) => replaced.get(c.id) ?? c)];
    });
    setSelectedCustomer((prev) => {
      if (!prev) return prev;
      return succeeded.find((c) => c.id === prev.id) ?? prev;
    });
    return result;
  };

const handleAddCustomer = (newCustomer: Customer) => {
    setCustomers(prev => [newCustomer, ...prev]);
    saveCustomerToDb(newCustomer, storeDb).catch(() => {});
    setToastMessage({ type: 'success', text: `${newCustomer.name} üstünlikli goşuldy.` });
    setTimeout(() => setToastMessage(null), 3000);
  };

const handleUpdateCustomer = (customer: Customer) => {
    setCustomers(prev => prev.map(c => (c.id === customer.id ? customer : c)));
    setSelectedCustomer(prev => (prev?.id === customer.id ? customer : prev));
    saveCustomerToDb(customer, storeDb).catch(() => {});
  };

const handleDeleteCustomer = (id: string) => {
    // "Umumy Müşderi" sistem ýazgysy — pozup bolmaýar.
    if (id === GENERAL_CUSTOMER_ID) return;
    setCustomers(prev => prev.filter(c => c.id !== id));
    if (selectedCustomer?.id === id) setSelectedCustomer(null);
    deleteCustomerFromDb(id, storeDb).catch(() => {});
  };

const applyCustomerDeltas = (adjustments: CustomerAdjustment[]) => {
    const merged = new Map<string, number>();
    for (const { customerId, delta } of adjustments) {
      if (!customerId || delta === 0) continue;
      merged.set(customerId, (merged.get(customerId) ?? 0) + delta);
    }
    if (merged.size === 0) return;

    const touched: Customer[] = [];
    const nextCustomers = customers.map((customer) => {
      const delta = merged.get(customer.id);
      if (!delta) return customer;
      const updated: Customer = { ...customer, balance: customer.balance + delta };
      touched.push(updated);
      return updated;
    });

    setCustomers(nextCustomers);
    setSelectedCustomer((prev) =>
      prev ? nextCustomers.find((c) => c.id === prev.id) ?? prev : prev
    );
    for (const customer of touched) {
      saveCustomerToDb(customer, storeDb).catch(() => {});
    }
  };

const handleQuickAddCustomer = (name: string): Customer => {
    const customer: Customer = {
      id: `cust-${Date.now()}`,
      name: name.trim(),
      type: 'customer',
      balance: 0
    };
    setCustomers((prev) => [customer, ...prev]);
    saveCustomerToDb(customer, storeDb).catch(() => {});
    return customer;
  };

  return { handleAddProduct, handleUpdateProduct, handleDeleteProduct, handleImportProducts, handleImportCustomers, handleAddCustomer, handleUpdateCustomer, handleDeleteCustomer, applyCustomerDeltas, handleQuickAddCustomer };
}
