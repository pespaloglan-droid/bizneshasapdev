import React, { useState, useEffect } from 'react';
import {
  User,
  Briefcase,
  Trash2,
  Pencil,
  FileText,
  Receipt,
  Upload,
  Download,
  ListChecks,
  X
} from 'lucide-react';
import { Customer, InvoiceRecord, LanguageCode } from '../../types';
import { ReceiptModal } from '../pos/ReceiptModal';
import { CustomerExcelImportModal } from './CustomerExcelImportModal';
import type { CustomerImportEntry, ImportSummary } from './CustomerExcelImportModal';
import { CustomerExcelExportModal } from './CustomerExcelExportModal';
import { CustomerBulkEditModal } from './CustomerBulkEditModal';
import { CustomerForm } from './CustomerForm';
import type { BatchWriteResult } from '../../db/pouch';
import type { ImportErrorRow } from '../../utils/importErrorReport';
import { GENERAL_CUSTOMER_ID } from '../../db/customerService';
import { onMobileAdd } from '../../utils/mobileEvents';
import { PageScroll } from '../common/PageScroll';
import { isNative } from '../../utils/platform';
import { localeFor } from '../../utils/locale';
import { useT } from '../../locales/LanguageContext';
import { Search } from 'lucide-react';

export interface CustomerLedgerEntry {
  id: string;
  date: string;
  invoiceCode: string;
  reason: string;
  debit: number;
  credit: number;
  balance: number;
}

interface CustomerWorkspaceProps {
  customers: Customer[];
  invoices?: InvoiceRecord[];
  language: LanguageCode;
  /** "Müşderi → Üýtget" rugsady — şu rugsady bolan ulanyjylar diňe ✏️ görýär. */
  canEditCustomer?: boolean;
  onAddCustomer: (customer: Customer) => void;
  onUpdateCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
  /**
   * Excel importynyň toplu ýazgy prosesi: çykyşy tassyklanan müşderileriň
   * hemmesini BIR batch-de ýazýar we şowsuzlary aýratynlykda hasaba alýar.
   * Berlen bolsa tekil onAddCustomer/onUpdateCustomer ýerine şu ulanylýar.
   */
  onImportCustomers?: (
    items: ReadonlyArray<{ customer: Customer; rowNumber: number }>
  ) => Promise<BatchWriteResult>;
  /** Duýduryş panelinden gelýän fokus — degişli müşderini açýar. */
  focusCustomerId?: string | null;
  /** Firma/hesap ady — Excel çyktysynda header görkezilýär. */
  accountName?: string;
}

export const CustomerWorkspace: React.FC<CustomerWorkspaceProps> = ({
  customers,
  invoices = [],
  language,
  canEditCustomer = false,
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
  onImportCustomers,
  focusCustomerId = null,
  accountName = 'Biznes Hasap'
}) => {
  const t = useT();
  const [activeFilter, setActiveFilter] = useState<'all' | 'customer' | 'employee'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedDetailCustomer, setSelectedDetailCustomer] = useState<Customer | null>(null);
  const [activeReceiptInvoice, setActiveReceiptInvoice] = useState<InvoiceRecord | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);

  // Duýduryş panelinden gelen fokus — degişli müşderiniň detayyny açýar.
  useEffect(() => {
    if (!focusCustomerId) return;
    const customer = customers.find((c) => c.id === focusCustomerId);
    if (customer) setSelectedDetailCustomer(customer);
  }, [focusCustomerId]);

  // Mobil yüzen + butonu — täze müşderi formuny açýar.
  useEffect(() => onMobileAdd(() => setIsFormOpen(true)), []);

  // Filtered List
  const filteredCustomers = customers.filter((cust) => {
    if (activeFilter === 'customer' && cust.type === 'employee') return false;
    if (activeFilter === 'employee' && cust.type !== 'employee') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = cust.name.toLowerCase().includes(q);
      const matchPhone = cust.phone?.toLowerCase().includes(q) || false;
      return matchName || matchPhone;
    }
    return true;
  });

  const totalCount = customers.length;
  const customerCount = customers.filter(c => c.type !== 'employee').length;
  const employeeCount = customers.filter(c => c.type === 'employee').length;

  // Müşterinin Faktura we Bergi/Algy Hereketleri Taryhy
  const getCustomerTransactions = (customerId: string, baseBalance: number): CustomerLedgerEntry[] => {
    // 1. Bu sessiyada geçirilen hakyky fakturalar
    const sessionInvoices: CustomerLedgerEntry[] = (invoices || [])
      .filter(inv => inv.customerId === customerId)
      .map(inv => ({
        id: inv.id,
        date: new Date(inv.createdAt).toLocaleString(localeFor(language), {
          day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
        }),
        invoiceCode: inv.invoiceNo,
        reason: inv.invoiceType === 'sales'
          ? t('customers.reasonSalesInvoice', { count: inv.itemCount })
          : t('customers.reasonInvoiceOp'),
        debit: inv.paymentMethod === 'credit' ? inv.amountDue : 0,
        credit: inv.paymentMethod !== 'credit' ? inv.amountDue : 0,
        balance: baseBalance
      }));

    // 2. Demo müşteriler üçin taryhy hereketler
    if (customerId === 'c-1') {
      return [
        {
          id: 'tx-1',
          date: '20.08.2026 11:20',
          invoiceCode: 'SAT.08/26-088',
          reason: t('customers.reasonCreditSale'),
          debit: 200.00,
          credit: 0,
          balance: 200.00
        },
        {
          id: 'tx-2',
          date: '22.08.2026 16:45',
          invoiceCode: 'TÖL.08/26-014',
          reason: t('customers.reasonCashPayment'),
          debit: 0,
          credit: 50.00,
          balance: 150.00
        },
        ...sessionInvoices
      ];
    }

    if (customerId === 'c-3') {
      return [
        {
          id: 'tx-3',
          date: '15.08.2026 10:15',
          invoiceCode: 'SAT.08/26-042',
          reason: t('customers.reasonWholesale'),
          debit: 2500.00,
          credit: 0,
          balance: 2500.00
        },
        {
          id: 'tx-4',
          date: '18.08.2026 14:30',
          invoiceCode: 'TÖL.08/26-009',
          reason: t('customers.reasonBankTransfer'),
          debit: 0,
          credit: 1249.50,
          balance: 1250.50
        },
        ...sessionInvoices
      ];
    }

    if (sessionInvoices.length > 0) {
      return sessionInvoices;
    }

    if (baseBalance !== 0) {
      return [
        {
          id: 'tx-init',
          date: '01.08.2026 09:00',
          invoiceCode: 'FAK.08/26-001',
          reason: t('customers.reasonOpening'),
          debit: baseBalance > 0 ? baseBalance : 0,
          credit: baseBalance < 0 ? Math.abs(baseBalance) : 0,
          balance: baseBalance
        }
      ];
    }

    return [];
  };

  /**
   * Excel import: bar bolanlary täzeläp ýa-da geçip, täzelerini goşýar.
   *
   * Çykyşy tassyklanan müşderiler ýeke-ýeke däl-de mümkin bolsa BIR batch-de
   * ýazylýar (onImportCustomers); ýazylmadyklar `failed` sanawyna setir belgisi
   * we sebäbi bilen düşýär. onImportCustomers berlen bolmasa öňki tekil akym
   * ulanylýar (onAddCustomer/onUpdateCustomer).
   */
  const handleExcelImport = async (
    entries: readonly CustomerImportEntry[],
    mode: 'overwrite' | 'skip'
  ): Promise<ImportSummary> => {
    const byName = new Map(customers.map((c) => [c.name.trim().toLowerCase(), c]));
    const byPhone = new Map(
      customers
        .filter((c) => c.phone)
        .map((c) => [(c.phone as string).trim().toLowerCase(), c])
    );
    const handled = new Set<string>();
    let added = 0;
    let updated = 0;
    let skipped = 0;
    const planned: Array<{
      customer: Customer;
      rowNumber: number;
      action: 'add' | 'update';
    }> = [];

    for (const { draft, rowNumber } of entries) {
      const nameKey = draft.name.trim().toLowerCase();
      const phoneKey = draft.phone.trim().toLowerCase();
      if (handled.has(nameKey) || (phoneKey && handled.has(`p:${phoneKey}`))) {
        skipped += 1;
        continue;
      }
      handled.add(nameKey);
      if (phoneKey) handled.add(`p:${phoneKey}`);

      const existing =
        byName.get(nameKey) ?? (phoneKey ? byPhone.get(phoneKey) : undefined) ?? null;
      const balance = draft.algy - draft.bergi;

      if (existing) {
        if (mode === 'skip') {
          skipped += 1;
          continue;
        }
        planned.push({
          customer: {
            ...existing,
            name: draft.name,
            phone: draft.phone || undefined,
            type: draft.type,
            dueDateDays: draft.dueDateDays,
            addressNote: draft.addressNote || undefined,
            balance,
          },
          rowNumber,
          action: 'update',
        });
        updated += 1;
      } else {
        planned.push({
          customer: {
            id: `cust-${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            name: draft.name,
            phone: draft.phone || undefined,
            type: draft.type,
            dueDateDays: draft.dueDateDays,
            creditLimit: 0,
            addressNote: draft.addressNote || undefined,
            balance,
          },
          rowNumber,
          action: 'add',
        });
        added += 1;
      }
    }

    const failed: ImportErrorRow[] = [];
    if (onImportCustomers) {
      if (planned.length > 0) {
        const result = await onImportCustomers(
          planned.map((item) => ({ customer: item.customer, rowNumber: item.rowNumber }))
        );
        const failureById = new Map(result.failed.map((f) => [f.id, f.error]));
        for (const item of planned) {
          const reason = failureById.get(item.customer.id);
          if (reason === undefined) continue;
          failed.push({
            row: item.rowNumber,
            name: item.customer.name,
            detail: item.customer.phone ?? '',
            reason,
          });
          if (item.action === 'add') added -= 1;
          else updated -= 1;
        }
      }
    } else {
      for (const item of planned) {
        if (item.action === 'add') onAddCustomer(item.customer);
        else onUpdateCustomer(item.customer);
      }
    }

    return { added, updated, skipped, failed };
  };

  /** Birbada üýtgedilen müşderileriň hemmesini ýazýar. */
  const handleBulkCustomerSave = (updated: Customer[]) => {
    for (const customer of updated) onUpdateCustomer(customer);
    setIsBulkOpen(false);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F1F5F9] overflow-hidden min-h-0">
      <PageScroll>
      <div className="p-2 md:p-3">
      {/* 1. Üst Filtre ve Aksiyon Barı */}
      <div className="bg-white border border-gray-200 rounded-2xl p-2.5 flex items-center justify-between shadow-xs mb-3 flex-wrap gap-2 flex-shrink-0">
        {/* Sol Filtre Butonları & Arama Inputu */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Tümü (0) */}
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`h-10 px-4 rounded-xl text-xs font-bold transition-all flex items-center ${
              activeFilter === 'all'
                ? 'bg-[#10b981] text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {t('customers.filterAllCount', { count: totalCount })}
          </button>

          {/* Müşteriler */}
          <button
            type="button"
            onClick={() => setActiveFilter('customer')}
            className={`h-10 px-4 rounded-xl text-xs font-bold transition-all flex items-center ${
              activeFilter === 'customer'
                ? 'bg-[#10b981] text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span>{t('customers.filterCustomersCount', { count: customerCount })}</span>
          </button>

          {/* Işgärler */}
          <button
            type="button"
            onClick={() => setActiveFilter('employee')}
            className={`h-10 px-4 rounded-xl text-xs font-bold transition-all flex items-center ${
              activeFilter === 'employee'
                ? 'bg-[#10b981] text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
<span>{t('customers.filterEmployeesCount', { count: employeeCount })}</span>
          </button>

          {/* Arama Inputu — diğer modüllarla aynı: solda büyüteç, sağda temizle */}
          <div className="relative w-full sm:w-[220px] flex-shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              id="bh-customer-search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('customers.searchPlaceholder')}
              className="w-full h-10 pl-9 pr-8 bg-[#F8FAFC] border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent rounded-xl text-sm text-gray-700 placeholder-gray-400 outline-none transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                aria-label="Aramayı temizle"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Sağ Butonlar: Import / Export / Müşderi-Işgär Goş */}
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => setIsBulkOpen(true)}
            className="h-10 px-3 bg-white border border-gray-200 hover:border-violet-400 hover:bg-violet-50/60 text-gray-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors flex-shrink-0"
            title={t('customers.bulkEditTitle')}
          >
            <ListChecks className="w-4 h-4 text-violet-600" />
            {t('customers.bulkEdit')}
          </button>
          <button
            type="button"
            onClick={() => setIsImportOpen(true)}
            className="h-10 px-3 bg-white border border-gray-200 hover:border-emerald-400 hover:bg-emerald-50/60 text-gray-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors flex-shrink-0"
            title={t('customers.importExcelTitle')}
          >
            <Upload className="w-4 h-4 text-emerald-600" />
            {t('customers.importExcel')}
          </button>
          <button
            type="button"
            onClick={() => setIsExportOpen(true)}
            className="h-10 px-3 bg-white border border-gray-200 hover:border-sky-400 hover:bg-sky-50/60 text-gray-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors flex-shrink-0"
            title={t('customers.exportExcelTitle')}
          >
            <Download className="w-4 h-4 text-sky-600" />
            {t('customers.exportExcel')}
          </button>
          {/* Telefonda ekleme işlemi yüzen "+" butonu ile yapılır (tek ikon, tek yer).
            Bu düğme yalnızca PC'de görünür — telefonda tekrar etmez. */}
          {!isNative() && (
            <button
              type="button"
              onClick={() => setIsFormOpen(!isFormOpen)}
              className="h-10 px-4 bg-[#10b981] hover:bg-[#059669] text-white font-bold text-xs rounded-xl flex items-center justify-center transition-all shadow-sm active:scale-95 flex-shrink-0"
            >
              <span>{t('customers.addCustomer')}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Açılır Yeni Cari Kartı — Depder referanslı bottom-sheet modal (mobilde alttan açılır) */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center animate-in fade-in duration-150">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-3xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
            <div className="px-5 py-4 bg-gradient-to-r from-[#0B1F3A] to-[#163864] text-white flex items-center justify-between flex-shrink-0">
              <span className="font-bold text-sm tracking-wide">
                {t('customers.newCardTitle')}
              </span>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                aria-label="Kapat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <CustomerForm
              mode="create"
              language={language}
              onSave={(customer) => {
                onAddCustomer(customer);
                setIsFormOpen(false);
              }}
              onCancel={() => setIsFormOpen(false)}
            />
          </div>
        </div>
      )}

      {/* 2b. Müşderi / Işgär Redaktirle (Üýtget) Modalı — ortak CustomerForm bileşeni.
          "Umumy Müşderi" üçin diňe ady salt-okunur, galan meýdanlar üýtgedilýär.
          Galyndy (Bakiýe) Faktura/Kassa hereketlerinden awtomatik hasaplanýar —
          formada diňe görkezilýär, el bilen üýtgedilmeýär. */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            <CustomerForm
              mode="edit"
              initial={editingCustomer}
              language={language}
              nameReadOnly={editingCustomer.id === GENERAL_CUSTOMER_ID}
              onSave={(updated) => {
                onUpdateCustomer(updated);
                setEditingCustomer(null);
              }}
              onCancel={() => setEditingCustomer(null)}
            />
          </div>
        </div>
      )}

      {/* 3. Müşteri / Cari Tablosu */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden flex-1 flex flex-col min-h-0">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50 text-xs font-bold text-gray-600 select-none">
                <th className="py-3 px-4">{t('customers.colNamePhone')}</th>
                <th className="py-3 px-4">{t('customers.colType')}</th>
                <th className="py-3 px-4">{t('customers.colDueDate')}</th>
                <th className="py-3 px-4 text-right">{t('customers.colBalance')}</th>
                <th className="py-3 px-4 text-center">{t('customers.colActions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-xs text-gray-400 font-medium">
                    {t('customers.notFound')}
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => (
                  <tr
                    key={cust.id}
                    onDoubleClick={() => setSelectedDetailCustomer(cust)}
                    className="border-b border-gray-100 hover:bg-emerald-50/40 transition-colors text-xs cursor-pointer select-none"
                    title={t('customers.doubleClickHint')}
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-gray-900">{cust.name}</div>
                      {cust.phone && <div className="text-[11px] text-gray-400 font-mono">{cust.phone}</div>}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        cust.type === 'employee'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {cust.type === 'employee' ? t('customers.typeEmployee') : t('customers.typeCustomer')}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-gray-600">
                      {cust.dueDateDays ? `${cust.dueDateDays} gün` : '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold">
                      <span className={cust.balance > 0 ? 'text-rose-600' : cust.balance < 0 ? 'text-emerald-600' : 'text-gray-800'}>
                        {cust.balance.toFixed(2)} TMT
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        {/* Üýtget (Redaktirle) — "Müşderi → Üýtget" rugsady bolanlara görkezilýär.
                            "Umumy Müşderi" hem-de görýär (diňe ady gutulmaýar). */}
                        {canEditCustomer && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingCustomer(cust);
                            }}
                            className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title={t('customers.editAction')}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        )}
                        {/* Pozmak — diňe adaty müşderiler üçin; "Umumy Müşderi" pozulmaýar. */}
                        {cust.id === GENERAL_CUSTOMER_ID ? (
                          !canEditCustomer && (
                            <span
                              className="text-[10px] font-bold text-gray-300"
                              title={t('customers.generalCustomerNoDelete')}
                            >
                              —
                            </span>
                          )
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteCustomer(cust.id);
                            }}
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title={t('delete')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>
      </PageScroll>

      {/* 4. Müşderi / Işgär Giňişleýin Maglumat Penjiresi (Detay Modalı) */}
      {selectedDetailCustomer && (() => {
        const transactions = getCustomerTransactions(selectedDetailCustomer.id, selectedDetailCustomer.balance);
        return (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="px-5 py-4 bg-gradient-to-r from-[#0B1F3A] to-[#163864] text-white flex items-center justify-between flex-shrink-0">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-white/10 text-emerald-400">
                    {selectedDetailCustomer.type === 'employee' ? (
                      <Briefcase className="w-5 h-5" />
                    ) : (
                      <User className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold tracking-wide">{selectedDetailCustomer.name}</h3>
                    <span className="text-[11px] text-emerald-300 font-semibold">
                      {selectedDetailCustomer.type === 'employee'
                        ? t('customers.roleEmployee')
                        : t('customers.roleCustomer')}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDetailCustomer(null)}
                  className="p-1.5 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal İçeriği (Scrollable) */}
              <div className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
                {/* Üst Kartlar: Telefon, Bakiye, Vade, Limit */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {/* Telefon */}
                  <div className="bg-gray-50/80 p-2.5 rounded-xl border border-gray-100">
                    <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                      {t('customers.phoneLabel')}
                    </div>
                    <div className="font-bold text-gray-800 font-mono text-xs truncate">
                      {selectedDetailCustomer.phone || '-'}
                    </div>
                  </div>

                  {/* Hasap Galyndysy (Bakiye) */}
                  <div className="bg-gray-50/80 p-2.5 rounded-xl border border-gray-100">
                    <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                      {t('customers.balanceLabel')}
                    </div>
                    <div className={`font-black font-mono text-xs truncate ${
                      selectedDetailCustomer.balance > 0
                        ? 'text-rose-600'
                        : selectedDetailCustomer.balance < 0
                        ? 'text-emerald-600'
                        : 'text-gray-800'
                    }`}>
                      {selectedDetailCustomer.balance.toFixed(2)} TMT
                    </div>
                  </div>

                  {/* Möhlet Güni */}
                  <div className="bg-gray-50/80 p-2.5 rounded-xl border border-gray-100">
                    <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                      {t('customers.dueDateLabel')}
                    </div>
                    <div className="font-bold text-gray-800 font-mono text-xs truncate">
                      {selectedDetailCustomer.dueDateDays ? `${selectedDetailCustomer.dueDateDays} gün` : '-'}
                    </div>
                  </div>

                  {/* Borç Limiti */}
                  <div className="bg-gray-50/80 p-2.5 rounded-xl border border-gray-100">
                    <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                      {t('customers.creditLimitLabel')}
                    </div>
                    <div className="font-bold text-gray-800 font-mono text-xs truncate">
                      {selectedDetailCustomer.creditLimit ? `${selectedDetailCustomer.creditLimit.toFixed(2)} TMT` : t('customers.unlimited')}
                    </div>
                  </div>
                </div>

                {/* Salgy / Bellikler (Adres) */}
                {selectedDetailCustomer.addressNote && (
                  <div className="bg-gray-50/80 p-2.5 rounded-xl border border-gray-100">
                    <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                      {t('customers.addressLabel')}
                    </div>
                    <div className="text-gray-700 font-medium whitespace-pre-wrap text-xs">
                      {selectedDetailCustomer.addressNote}
                    </div>
                  </div>
                )}

                {/* 2. Aşak Bölek: Fakturalar we Bergi / Algy Hereketleri Taryhy */}
                <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                  <div className="bg-gray-50/90 px-3.5 py-2.5 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-emerald-600" />
                      <span className="font-bold text-gray-800 text-xs">
                        {t('customers.ledgerTitle')}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-500 font-mono font-bold bg-white px-2 py-0.5 rounded border border-gray-200">
                      {transactions.length} {t('customers.txCountSuffix')}
                    </span>
                  </div>

                  <div className="max-h-[220px] overflow-y-auto">
                    {transactions.length === 0 ? (
                      <div className="py-8 text-center text-xs text-gray-400 font-medium">
                        {t('customers.noTransactions')}
                      </div>
                    ) : (
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-wider select-none sticky top-0 bg-gray-50">
                            <th className="py-2 px-3">{t('customers.colDate')}</th>
                            <th className="py-2 px-3">{t('customers.colInvoiceCode')}</th>
                            <th className="py-2 px-3">{t('customers.colReason')}</th>
                            <th className="py-2 px-3 text-right">{t('customers.colDebit')}</th>
                            <th className="py-2 px-3 text-right">{t('customers.colCredit')}</th>
                            <th className="py-2 px-3 text-right">{t('customers.colBalance')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-xs">
                          {transactions.map((tx) => (
                            <tr key={tx.id} className="hover:bg-emerald-50/25 transition-colors">
                              <td className="py-2 px-3 font-mono text-[11px] text-gray-600 whitespace-nowrap">
                                {tx.date}
                              </td>
                              <td className="py-2 px-3">
                                {(() => {
                                  // Real invoice from session or create synthetic from tx data
                                  const invoiceToShow: InvoiceRecord =
                                    invoices.find(inv => inv.invoiceNo === tx.invoiceCode) ?? {
                                      id: tx.id,
                                      invoiceNo: tx.invoiceCode,
                                      invoiceType: 'sales',
                                      customerId: selectedDetailCustomer?.id ?? null,
                                      customerName: selectedDetailCustomer?.name ?? '',
                                      items: [],
                                      itemCount: 0,
                                      subtotal: tx.debit > 0 ? tx.debit : tx.credit,
                                      discountTotal: 0,
                                      taxTotal: 0,
                                      amountDue: tx.debit > 0 ? tx.debit : tx.credit,
                                      paymentMethod: tx.invoiceCode.startsWith('TÖL') ? 'cash' : 'credit',
                                      cashReceived: 0,
                                      changeDue: 0,
                                      status: 'completed',
                                      createdAt: (() => {
                                        try {
                                          const d = new Date(tx.date);
                                          if (!isNaN(d.getTime())) return d.toISOString();
                                          
                                          // Parse "DD.MM.YYYY HH:mm" if standard parsing fails
                                          const parts = tx.date.split(' ');
                                          if (parts.length === 2) {
                                            const [datePart, timePart] = parts;
                                            const [day, month, year] = datePart.split('.');
                                            if (year && month && day) {
                                              const parsed = new Date(`${year}-${month}-${day}T${timePart}:00`);
                                              if (!isNaN(parsed.getTime())) return parsed.toISOString();
                                            }
                                          }
                                          return new Date().toISOString();
                                        } catch {
                                          return new Date().toISOString();
                                        }
                                      })(),
                                      cashierName: 'Kassa',
                                      internalNote: tx.reason,
                                    };
                                  return (
                                    <button
                                      type="button"
                                      onClick={() => setActiveReceiptInvoice(invoiceToShow)}
                                      className="font-mono font-bold text-[11px] text-emerald-700 bg-emerald-50 hover:bg-emerald-600 hover:text-white border border-emerald-200/80 px-2 py-0.5 rounded-md whitespace-nowrap transition-all active:scale-95 flex items-center space-x-1 group"
                                      title={t('customers.receiptTooltip')}
                                    >
                                      <Receipt className="w-3 h-3 text-emerald-500 group-hover:text-white transition-colors" />
                                      <span>{tx.invoiceCode}</span>
                                    </button>
                                  );
                                })()}
                              </td>
                              <td className="py-2 px-3 font-medium text-gray-800">
                                {tx.reason}
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-rose-600 whitespace-nowrap">
                                {tx.debit > 0 ? `+${tx.debit.toFixed(2)}` : '-'}
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-emerald-600 whitespace-nowrap">
                                {tx.credit > 0 ? `-${tx.credit.toFixed(2)}` : '-'}
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-gray-900 whitespace-nowrap">
                                {tx.balance.toFixed(2)} TMT
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-5 py-3 bg-gray-50/80 border-t border-gray-100 flex justify-end space-x-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedDetailCustomer(null)}
                  className="px-6 py-2 rounded-xl bg-[#10b981] hover:bg-[#059669] text-white font-bold text-xs transition-colors shadow-xs"
                >
                  {t('customers.closeBtn')}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
      {/* 5. Faktura Çeki Modalı (Müşderi Detay Ekranından Açılan) */}
      {activeReceiptInvoice && (
        <ReceiptModal
          invoice={activeReceiptInvoice}
          storeName="Biznes Hasap"
          language={language}
          onClose={() => setActiveReceiptInvoice(null)}
        />
      )}

      {/* 6. Excel Import / Export modallary */}
      {isImportOpen && (
        <CustomerExcelImportModal
          language={language}
          customers={customers}
          accountName={accountName}
          onClose={() => setIsImportOpen(false)}
          onImport={handleExcelImport}
        />
      )}

      {isBulkOpen && (
        <CustomerBulkEditModal
          customers={customers}
          language={language}
          onClose={() => setIsBulkOpen(false)}
          onSave={handleBulkCustomerSave}
        />
      )}
      {isExportOpen && (
        <CustomerExcelExportModal
          language={language}
          customers={customers}
          accountName={accountName}
          onClose={() => setIsExportOpen(false)}
        />
      )}
    </div>
  );
};
