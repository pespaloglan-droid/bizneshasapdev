import { useEffect, type Dispatch, type SetStateAction } from 'react';
import type { AppSettings, CartItem, Customer, InvoiceRecord, Product } from '../types';
import { getProductsForAccount } from '../db/productService';
import { ensureGeneralCustomerSeeded, GENERAL_CUSTOMER_ID } from '../db/customerService';
import { getInvoicesForAccount } from '../db/salesService';
import { getAppSettings } from '../db/settingsService';
import { SYNC_IMPORTED_EVENT } from '../db/schemaBridge';
import { setAuditEnabled, setAuditUser } from '../db/auditLog';

interface WorkspaceDataOptions {
  storeDb: string;
  currentUserId: string | undefined;
  setProducts: Dispatch<SetStateAction<Product[]>>;
  setCustomers: Dispatch<SetStateAction<Customer[]>>;
  setCompletedInvoices: Dispatch<SetStateAction<InvoiceRecord[]>>;
  setAppSettings: Dispatch<SetStateAction<AppSettings | null>>;
  setCartItems: Dispatch<SetStateAction<CartItem[]>>;
  setSelectedCustomer: Dispatch<SetStateAction<Customer | null>>;
}

/** Hesap başlangıç yüklemesi, sync yenilemesi ve audit kimliği yaşam döngüsü. */
export function useWorkspaceData({
  storeDb, currentUserId, setProducts, setCustomers, setCompletedInvoices,
  setAppSettings, setCartItems, setSelectedCustomer,
}: WorkspaceDataOptions): void {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [loadedProducts, loadedCustomers, loadedInvoices, loadedSettings] = await Promise.all([
        getProductsForAccount(storeDb),
        ensureGeneralCustomerSeeded(storeDb),
        getInvoicesForAccount(storeDb),
        getAppSettings(storeDb)
      ]);
      if (cancelled) return;
      setProducts(loadedProducts);
      setCustomers(loadedCustomers);
      setCompletedInvoices(loadedInvoices);
      setAppSettings(loadedSettings);
      // FAZ 2.2 audit: bayrak ayarlardan beslenir (upsertDoc her yazmada settings okumaz)
      setAuditEnabled(loadedSettings?.general?.auditLogEnabled ?? false);
      setCartItems([]);
      // "Umumy Müşderi" hakyky ýazgy — deslapky saýlaw şoňa işleýär.
      setSelectedCustomer(
        loadedCustomers.find((customer) => customer.id === GENERAL_CUSTOMER_ID) ?? null
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [storeDb]);

  // Bulut eşitleme sırasında PC'den gelen kayıtlar eklendi → listeleri tazele.
  useEffect(() => {
    let cancelled = false;
    const reload = async () => {
      const [loadedProducts, loadedCustomers, loadedInvoices] = await Promise.all([
        getProductsForAccount(storeDb),
        ensureGeneralCustomerSeeded(storeDb),
        getInvoicesForAccount(storeDb),
      ]);
      if (cancelled) return;
      setProducts(loadedProducts);
      setCustomers(loadedCustomers);
      setCompletedInvoices(loadedInvoices);
    };
    const handler = () => void reload();
    window.addEventListener(SYNC_IMPORTED_EVENT, handler);
    return () => {
      cancelled = true;
      window.removeEventListener(SYNC_IMPORTED_EVENT, handler);
    };
  }, [storeDb]);

  // FAZ 2.2 audit: günlüğe yazan kullanıcı kimliği
  useEffect(() => {
    setAuditUser(currentUserId);
  }, [currentUserId]);

}
