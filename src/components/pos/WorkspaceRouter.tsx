import React, { useMemo } from 'react';
import type { PosTabType } from './TopNavBar';
import type { Customer, InvoiceRecord, LanguageCode, OperationSettings, Product, User, Account } from '../../types';
import type { ModuleStores } from '../../hooks/useModuleStores';
import type { MoneyStore } from '../../hooks/useMoneyStore';
import {
  filterItemsById,
  getActiveAccessControl,
  getActiveDefaults,
  isAdminUser,
  resolveModuleExtras,
} from '../../db/accessService';
import { resolveModulePermission } from '../../db/ledgerService';
import { CustomerWorkspace } from '../customers/CustomerWorkspace';
import { UserWorkspace } from '../UserWorkspace';
import { KassaWorkspace } from '../kassa/KassaWorkspace';
import { WalyutaWorkspace } from '../walyuta/WalyutaWorkspace';
import { DepderWorkspace } from '../depder/DepderWorkspace';
import { TargowWorkspace } from '../targowy/TargowWorkspace';
import { ProductWorkspace } from '../products/ProductWorkspace';
import { WarehouseWorkspace } from '../warehouses/WarehouseWorkspace';
import { SazlamalarWorkspace } from '../sazlamalar/SazlamalarWorkspace';
import { HasaplamaWorkspace } from '../hasaplama/HasaplamaWorkspace';

interface WorkspaceRouterProps {
  activeTab: PosTabType;
  language: LanguageCode;
  currentUser: User;
  products: readonly Product[];
  customers: readonly Customer[];
  invoices: readonly InvoiceRecord[];
  stores: ModuleStores;
  moneyStore: MoneyStore;
  inUseCurrencyCodes: readonly string[];
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onAddCustomer: (customer: Customer) => void;
  onUpdateCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
  /** "Müşderi → Üýtget" rugsady — Müşderi modulyndaky redaktirle ikony. */
  canEditCustomer?: boolean;
  onQuickAddCustomer: (name: string) => Customer;
  storeDb: string;
  companyName: string;
  currencyCode: string;
  onSelectLanguage: (lang: LanguageCode) => void;
  onGoToCurrency: () => void;
  onGoToTargow: () => void;
  /** Duýduryş panelinden gelýän fokus: degişli ýazgyy açýar. */
  focusProductId?: string | null;
  focusCustomerId?: string | null;
  /** Aktif hesap — ayarlarda bulut eşitleme paneli için. */
  account?: Account;
  /** Kassa giňişleýin gözlegi (F3). */
  moneySearchOpen?: boolean;
  onMoneySearchOpen?: () => void;
  onMoneySearchClose?: () => void;
  /** Operasiýa düzgünleri (seneler — Kassa ýazgysynda çäklendirme). */
  operationRules?: OperationSettings | null;
  /** Stok hasabatyndan faktura döretmek (Hasaplama → Faktura). */
  onAddToCart?: (product: Product) => void;
  onGoToCheckout?: () => void;
}

/**
 * POS däl modullaryň hemmesini bir ýerde ýerleşdirýän ýönlendiriji.
 * (checkout bölümi sepet ýagdaýyna bagly bolany üçin PosWorkspace-de galýar.)
 */
export const WorkspaceRouter: React.FC<WorkspaceRouterProps> = ({
  activeTab,
  language,
  currentUser,
  products,
  customers,
  invoices,
  stores,
  moneyStore,
  inUseCurrencyCodes,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
  canEditCustomer = false,
  onQuickAddCustomer,
  storeDb,
  account,
  companyName,
  currencyCode,
  onSelectLanguage,
  onGoToCurrency,
  onGoToTargow,
  focusProductId = null,
  focusCustomerId = null,
  moneySearchOpen = false,
  onMoneySearchOpen,
  onMoneySearchClose,
  operationRules = null,
  onAddToCart,
  onGoToCheckout,
}) => {
  // Ýörite rugsatlar: ambar we depder sanawlaryny çäklendir (müşderi/haryt PosWorkspace'den gelýär)
  const activeAccess = useMemo(
    () => getActiveAccessControl(currentUser, stores.appUsers),
    [currentUser, stores.appUsers]
  );

  const activeDefaults = useMemo(
    () => getActiveDefaults(currentUser, stores.appUsers),
    [currentUser, stores.appUsers]
  );

  const visibleWarehouses = useMemo(() => {
    if (!activeAccess) return stores.warehouses;
    return filterItemsById(activeAccess.warehouses, stores.warehouses) ?? stores.warehouses;
  }, [activeAccess, stores.warehouses]);

  const visibleLedgers = useMemo(() => {
    if (!activeAccess) return stores.ledgers;
    return filterItemsById(activeAccess.depders, stores.ledgers) ?? stores.ledgers;
  }, [activeAccess, stores.ledgers]);

  // Kassa moduly: inçe rugsatlar + modul düzenle/sil rugsatlary.
  const kassaExtras = useMemo(
    () => resolveModuleExtras(currentUser, stores.appUsers).kassa,
    [currentUser, stores.appUsers]
  );
  const kassaModulePerm = useMemo(
    () => resolveModulePermission('kassa', currentUser, stores.appUsers),
    [currentUser, stores.appUsers]
  );

  // Sazlamalar: diňe üýtgetme rugsady bolanlar saklap bilýär.
  const canEditSettings = useMemo(
    () => resolveModulePermission('sazlamalar', currentUser, stores.appUsers).edit,
    [currentUser, stores.appUsers]
  );

  // "Silinen fakturalar" bölümi diňe administratora görkezilýär.
  const isAdminUserFlag = useMemo(
    () => isAdminUser(currentUser, stores.appUsers),
    [currentUser, stores.appUsers]
  );
  if (activeTab === 'customer') {
    return (
      <CustomerWorkspace
        customers={[...customers]}
        invoices={[...invoices]}
        language={language}
        canEditCustomer={canEditCustomer}
        onAddCustomer={onAddCustomer}
        onUpdateCustomer={onUpdateCustomer}
        onDeleteCustomer={onDeleteCustomer}
        focusCustomerId={focusCustomerId}
      />
    );
  }

  if (activeTab === 'user') {
    return (
      <UserWorkspace
        users={stores.appUsers}
        language={language}
        onAddUser={stores.addUser}
        onUpdateUser={stores.updateUser}
        onDeleteUser={stores.deleteUser}
        warehouses={visibleWarehouses}
        ledgers={visibleLedgers}
        units={stores.units}
        customers={customers}
        products={products}
      />
    );
  }

  if (activeTab === 'money') {
    return (
      <KassaWorkspace
        transactions={moneyStore.moneyTransactions}
        customers={customers}
        appUsers={stores.appUsers}
        ledgers={visibleLedgers}
        currencies={stores.currencies}
        invoices={invoices}
        language={language}
        kassaExtras={kassaExtras}
        canEditTx={kassaModulePerm.edit}
        canDeleteTx={kassaModulePerm.delete}
        operationRules={operationRules}
        advancedSearchOpen={moneySearchOpen}
        onAdvancedSearchOpen={onMoneySearchOpen ?? (() => undefined)}
        onAdvancedSearchClose={onMoneySearchClose ?? (() => undefined)}
        onSaveTransaction={moneyStore.saveMoneyTransaction}
        onDeleteTransaction={moneyStore.deleteMoneyTransaction}
        onQuickAddCustomer={onQuickAddCustomer}
      />
    );
  }

  if (activeTab === 'currency') {
    return (
      <WalyutaWorkspace
        currencies={stores.currencies}
        language={language}
        inUseCodes={inUseCurrencyCodes}
        storeDb={storeDb}
        onSaveCurrency={stores.saveCurrency}
        onDeleteCurrency={stores.deleteCurrency}
      />
    );
  }

  if (activeTab === 'ledger') {
    return (
      <DepderWorkspace
        ledgers={visibleLedgers}
        transactions={moneyStore.moneyTransactions}
        customers={customers}
        appUsers={stores.appUsers}
        currencies={stores.currencies}
        currentUser={currentUser}
        language={language}
        onSaveLedger={stores.saveLedger}
        onDeleteLedger={stores.deleteLedger}
        onSaveTransaction={moneyStore.saveMoneyTransaction}
        onDeleteTransaction={moneyStore.deleteMoneyTransaction}
        onTransfer={moneyStore.transfer}
        onQuickAddCustomer={onQuickAddCustomer}
      />
    );
  }

  if (activeTab === 'courier') {
    return (
      <TargowWorkspace
        targows={stores.targows}
        regions={stores.regions}
        invoices={invoices}
        appUsers={stores.appUsers}
        language={language}
        onSaveTargow={stores.saveTargow}
        onDeleteTargow={stores.deleteTargow}
        onSaveRegion={stores.saveRegion}
        onDeleteRegion={stores.deleteRegion}
      />
    );
  }

  if (activeTab === 'product') {
    return (
      <ProductWorkspace
        products={[...products]}
        units={stores.units}
        language={language}
        defaultUnit={activeDefaults.unit || undefined}
        defaultUnit2={activeDefaults.unit2 || undefined}
        storeDb={storeDb}
        onAddProduct={onAddProduct}
        onUpdateProduct={onUpdateProduct}
        onDeleteProduct={onDeleteProduct}
        onCreateUnit={stores.saveUnit}
        focusProductId={focusProductId}
      />
    );
  }

  if (activeTab === 'warehouse') {
    return (
      <WarehouseWorkspace
        warehouses={[...visibleWarehouses]}
        products={[...products]}
        language={language}
        onAddWarehouse={stores.addWarehouse}
        onUpdateWarehouse={stores.updateWarehouse}
        onDeleteWarehouse={stores.deleteWarehouse}
      />
    );
  }

  if (activeTab === 'calculation') {
    return (
      <HasaplamaWorkspace
        invoices={invoices}
        transactions={moneyStore.moneyTransactions}
        customers={customers}
        products={products}
        ledgers={visibleLedgers}
        currencies={stores.currencies}
        targows={stores.targows}
        storeDb={storeDb}
        onGoToTargow={onGoToTargow}
        onAddToCart={onAddToCart}
        onGoToCheckout={onGoToCheckout}
      />
    );
  }

  if (activeTab === 'settings') {
    return (
      <SazlamalarWorkspace
        language={language}
        storeDb={storeDb}
        account={account}
        companyName={companyName}
        currencyCode={currencyCode}
        onSelectLanguage={onSelectLanguage}
        onGoToCurrency={onGoToCurrency}
        units={stores.units}
        products={[...products]}
        onSaveUnit={stores.saveUnit}
        onDeleteUnit={stores.deleteUnit}
        canEditSettings={canEditSettings}
        isAdmin={isAdminUserFlag}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#F1F5F9] text-gray-400 select-none">
      <div className="bg-white border border-gray-200 rounded-3xl p-10 flex flex-col items-center shadow-sm max-w-sm text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-gray-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <div>
          <p className="font-bold text-gray-500 text-sm">
            {language === 'tm' ? 'Bu bölüm häzirlikçe boş' : 'Bu bölüm şimdilik boş'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {language === 'tm' ? 'Ýakyn wagtda mazmun goşular.' : 'Yakında içerik eklenecek.'}
          </p>
        </div>
      </div>
    </div>
  );
};
