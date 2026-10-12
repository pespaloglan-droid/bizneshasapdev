import React, { useState } from 'react';
import { X } from 'lucide-react';
import {
  AppUser,
  Customer,
  LanguageCode,
  Ledger,
  MoneyCategoryId,
  ModuleName,
  ModulePermission,
  Product,
  UserModuleExtras,
  Warehouse,
} from '../../types';
import { APP_USER_ROLES, ROLE_PERMISSIONS, clonePermissions } from '../../db/userService';
import { INCOME_CATEGORIES, LEGACY_CATEGORIES } from '../../db/moneyService';
import { INVOICE_TYPE_OPTIONS } from '../../utils/invoiceTypeOptions';
import { PermissionMatrix } from './PermissionMatrix';
import { UserAdvancedPermissions } from './UserAdvancedPermissions';
import {
  UserFormState,
  emptyUserForm,
  formFromUser,
  validateUserForm,
  buildSavedUser,
} from './userFormModel';
import type { MeasurementUnit } from '../../db/unitService';
import { useT } from '../../locales/LanguageContext';

/** Rugsat berilen gelir kategoriýalary: 7 esasy + "Haryt satuw" sistem kategoriýasy. */
const ALLOWED_INCOME_CATEGORIES = [...INCOME_CATEGORIES, LEGACY_CATEGORIES[0]];
const ALL_INCOME_IDS = ALLOWED_INCOME_CATEGORIES.map((c) => c.id);

interface UserFormModalProps {
  language: LanguageCode;
  users: AppUser[];
  editingUser: AppUser | null;
  onSave: (user: AppUser) => void;
  onClose: () => void;
  /** Ýörite rugsatlar bölümi üçin sanawlar. */
  warehouses: readonly Warehouse[];
  ledgers: readonly Ledger[];
  units: readonly MeasurementUnit[];
  customers: readonly Customer[];
  products: readonly Product[];
}

const INPUT =
  'w-full h-9 px-3 border border-gray-200 rounded-xl text-sm bg-[#F8FAFC] focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none';

export const UserFormModal: React.FC<UserFormModalProps> = ({
  language,
  users,
  editingUser,
  onSave,
  onClose,
  warehouses,
  ledgers,
  units,
  customers,
  products,
}) => {
  const [form, setForm] = useState<UserFormState>(
    editingUser ? formFromUser(editingUser) : emptyUserForm()
  );
  const [error, setError] = useState('');
  const t = useT();

  const handleRoleChange = (role: string) => {
    const template = ROLE_PERMISSIONS[role];
    setForm((prev) => ({
      ...prev,
      role,
      // Şablon bar bolsa şony ulanýarys; ýörite rolda häzirki rugsatlar galýar
      permissions: template ? clonePermissions(template) : prev.permissions,
    }));
  };

  const handlePermissionChange = (
    moduleName: ModuleName,
    action: keyof ModulePermission,
    value: boolean
  ) => {
    setForm((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [moduleName]: { ...prev.permissions[moduleName], [action]: value },
      },
    }));
  };

  // ── Kassa / Faktura inçe rugsatlary ────────────────────────────────────────

  const handleKassaExtras = (patch: Partial<NonNullable<UserModuleExtras['kassa']>>) => {
    setForm((prev) => ({
      ...prev,
      moduleExtras: {
        ...prev.moduleExtras,
        kassa: {
          ...(prev.moduleExtras.kassa ?? { addIncome: true, addExpense: true, viewBalance: true }),
          ...patch,
        },
      },
    }));
  };

  const handleFakturaExtras = (patch: Partial<NonNullable<UserModuleExtras['faktura']>>) => {
    setForm((prev) => ({
      ...prev,
      moduleExtras: {
        ...prev.moduleExtras,
        faktura: {
          ...(prev.moduleExtras.faktura ?? { editPrice: true, allowDiscount: true }),
          ...patch,
        },
      },
    }));
  };

  /** `incomeCategories`: undefined = ähli açyk; doly sanaw = diňe şolar; [] = hiç biri. */
  const incomeSet = () => {
    const cats = form.moduleExtras.kassa?.incomeCategories;
    return new Set(cats ?? ALL_INCOME_IDS);
  };

  const toggleIncomeCategory = (id: MoneyCategoryId) => {
    const next = incomeSet();
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    const arr = ALL_INCOME_IDS.filter((catId) => next.has(catId));
    // Ählisi saýlanan bolsa → undefined ("hemmesine rugsat") hökmünde sakla.
    handleKassaExtras({ incomeCategories: arr.length === ALL_INCOME_IDS.length ? undefined : arr });
  };

  const selectAllIncome = () => handleKassaExtras({ incomeCategories: undefined });
  const clearAllIncome = () => handleKassaExtras({ incomeCategories: [] });

  // ── Faktura görnüşleri (Çykyş / Yzyna gaýtarmak / ...) ──────────────────────
  // Basit whitelist: hepsi işaretli = "all"; bazıları = "whitelist" + liste.
  const invoiceTypeSet = () => {
    const entry = form.accessControl.invoiceTypes;
    if (entry.mode === 'whitelist') return new Set(entry.list);
    return new Set(INVOICE_TYPE_OPTIONS.map((o) => o.id));
  };

  const patchInvoiceTypes = (mode: 'all' | 'whitelist', list: string[]) => {
    setForm((prev) => ({
      ...prev,
      accessControl: {
        ...prev.accessControl,
        invoiceTypes: { mode, list },
      },
    }));
  };

  const toggleInvoiceType = (id: string) => {
    const next = invoiceTypeSet();
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    const arr = INVOICE_TYPE_OPTIONS.map((o) => o.id).filter((tid) => next.has(tid));
    patchInvoiceTypes(
      arr.length === INVOICE_TYPE_OPTIONS.length ? 'all' : 'whitelist',
      arr.length === INVOICE_TYPE_OPTIONS.length ? [] : arr
    );
  };

  const selectAllInvoiceTypes = () => patchInvoiceTypes('all', []);
  const clearAllInvoiceTypes = () => patchInvoiceTypes('whitelist', []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextError = validateUserForm(form, users, editingUser, language);
    if (nextError) {
      setError(nextError);
      return;
    }
    onSave(buildSavedUser(form, editingUser));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
        <div className="px-5 py-4 bg-gradient-to-r from-[#0B1F3A] to-[#163864] text-white flex items-center justify-between flex-shrink-0">
          <span className="font-bold text-sm tracking-wide">
            {editingUser ? t('users.editTitle') : t('users.newUser')}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="block text-[11px] font-bold text-gray-500">
              {t('users.colUsername')} *
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                autoFocus
                className={`${INPUT} mt-1 font-medium text-gray-800`}
              />
            </label>

            <label className="block text-[11px] font-bold text-gray-500">
              {t('users.roleLabel')}
              <input
                type="text"
                list="user-role-options"
                value={form.role}
                onChange={(e) => handleRoleChange(e.target.value)}
                placeholder="Administrator"
                className={`${INPUT} mt-1 font-medium text-gray-800`}
              />
              <datalist id="user-role-options">
                {APP_USER_ROLES.map((role) => (
                  <option key={role} value={role} />
                ))}
              </datalist>
              {!ROLE_PERMISSIONS[form.role] && form.role.trim().length > 0 && (
                <span className="block text-[10px] font-semibold text-amber-700 mt-1">
                  {t('users.customRoleHint')}
                </span>
              )}
            </label>

            <label className="block text-[11px] font-bold text-gray-500">
              {editingUser ? t('users.passwordEditLabel') : t('users.passwordNewLabel')}
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className={`${INPUT} mt-1 font-medium text-gray-800`}
              />
            </label>

            <label className="block text-[11px] font-bold text-gray-500">
              {t('users.confirmPassword')}
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                className={`${INPUT} mt-1 font-medium text-gray-800`}
              />
            </label>
          </div>

          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
            className={`h-8 px-3 rounded-xl border text-[11px] font-bold transition-all ${
              form.isActive
                ? 'bg-emerald-500 text-white border-emerald-500'
                : 'bg-white text-gray-500 border-gray-200'
            }`}
          >
            {form.isActive ? t('users.active') : t('users.passive')}
          </button>

          <div>
            <div className="text-[11px] font-bold text-gray-500 mb-1.5">{t('users.permissionsTitle')}</div>
            <PermissionMatrix
              language={language}
              permissions={form.permissions}
              onChange={handlePermissionChange}
            />
          </div>

          {/* ── Kassa / Faktura inçe rugsatlary ─────────────────────────────── */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-3 py-2 bg-gray-50/80 text-[11px] font-bold text-gray-600">
              {t('users.finePermsTitle')}
            </div>

            <div className="px-3 py-2.5 space-y-2.5">
              {/* Kassa */}
              <div className="text-[10.5px] font-bold text-gray-500">{t('users.kassaSection')}</div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-1.5 text-[10.5px] font-semibold text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.moduleExtras.kassa?.addIncome ?? true}
                    onChange={(e) => handleKassaExtras({ addIncome: e.target.checked })}
                    className="w-3.5 h-3.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  {t('users.addIncome')}
                </label>
                <label className="flex items-center gap-1.5 text-[10.5px] font-semibold text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.moduleExtras.kassa?.addExpense ?? true}
                    onChange={(e) => handleKassaExtras({ addExpense: e.target.checked })}
                    className="w-3.5 h-3.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  {t('users.addExpense')}
                </label>
                <label className="flex items-center gap-1.5 text-[10.5px] font-semibold text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.moduleExtras.kassa?.viewBalance ?? true}
                    onChange={(e) => handleKassaExtras({ viewBalance: e.target.checked })}
                    className="w-3.5 h-3.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  {t('users.showBalance')}
                </label>
              </div>

              {/* Girdeji kategoriýalary */}
              {(form.moduleExtras.kassa?.addIncome ?? true) && (
                <div className="bg-[#F8FAFC] border border-gray-200 rounded-lg p-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] font-bold text-gray-600">
                      {t('users.allowedCategories')}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={selectAllIncome}
                        className="px-2 py-0.5 rounded-lg bg-gray-100 hover:bg-emerald-50 text-[10px] font-bold text-gray-600 transition-colors"
                      >
                        {t('users.selectAll')}
                      </button>
                      <button
                        type="button"
                        onClick={clearAllIncome}
                        className="px-2 py-0.5 rounded-lg bg-gray-100 hover:bg-rose-50 text-[10px] font-bold text-gray-600 transition-colors"
                      >
                        {t('users.clearAll')}
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1 mt-1.5">
                    {ALLOWED_INCOME_CATEGORIES.map((category) => {
                      const checked = incomeSet().has(category.id);
                      return (
                        <label
                          key={category.id}
                          className="flex items-center gap-1.5 text-[10.5px] text-gray-700 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleIncomeCategory(category.id)}
                            className="w-3.5 h-3.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                          {category.label}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Faktura */}
              <div className="text-[10.5px] font-bold text-gray-500 mt-1">{t('users.fakturaSection')}</div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-1.5 text-[10.5px] font-semibold text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.moduleExtras.faktura?.editPrice ?? true}
                    onChange={(e) => handleFakturaExtras({ editPrice: e.target.checked })}
                    className="w-3.5 h-3.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  {t('users.editPrice')}
                </label>
                <label className="flex items-center gap-1.5 text-[10.5px] font-semibold text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.moduleExtras.faktura?.allowDiscount ?? true}
                    onChange={(e) => handleFakturaExtras({ allowDiscount: e.target.checked })}
                    className="w-3.5 h-3.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  {t('users.allowDiscount')}
                </label>
              </div>

              {/* Rugsat berilen faktura görnüşleri (Çykyş / Yzyna gaýtarmak / ...) */}
              <div className="bg-[#F8FAFC] border border-gray-200 rounded-lg p-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-bold text-gray-600">
                    {t('users.allowedInvoiceTypes')}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={selectAllInvoiceTypes}
                      className="px-2 py-0.5 rounded-lg bg-gray-100 hover:bg-emerald-50 text-[10px] font-bold text-gray-600 transition-colors"
                    >
                      {t('users.selectAll')}
                    </button>
                    <button
                      type="button"
                      onClick={clearAllInvoiceTypes}
                      className="px-2 py-0.5 rounded-lg bg-gray-100 hover:bg-rose-50 text-[10px] font-bold text-gray-600 transition-colors"
                    >
                      {t('users.clearAll')}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1 mt-1.5">
                  {INVOICE_TYPE_OPTIONS.map((type) => {
                    const checked = invoiceTypeSet().has(type.id);
                    return (
                      <label
                        key={type.id}
                        className="flex items-center gap-1.5 text-[10.5px] text-gray-700 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleInvoiceType(type.id)}
                          className="w-3.5 h-3.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        {language === 'tm' ? type.labelTm : type.labelTr}
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <UserAdvancedPermissions
            language={language}
            defaults={form.defaults}
            accessControl={form.accessControl}
            onChange={(patch) =>
              setForm((prev) => ({
                ...prev,
                ...(patch.defaults ? { defaults: patch.defaults } : {}),
                ...(patch.accessControl ? { accessControl: patch.accessControl } : {}),
              }))
            }
            warehouses={warehouses}
            ledgers={ledgers}
            units={units}
            customers={customers}
            products={products}
          />

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
