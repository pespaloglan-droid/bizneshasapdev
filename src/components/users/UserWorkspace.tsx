import React, { useMemo, useState } from 'react';
import { KeyRound, Lock, Pencil, Plus, Search, Trash2, UserCheck } from 'lucide-react';
import { AppUser, AppUserRole, Customer, LanguageCode, Ledger, Product, Warehouse } from '../../types';
import { APP_USER_ROLES, ROLE_LABELS } from '../../db/userService';
import { UserFormModal } from './UserFormModal';
import { DeleteUserDialog, ResetPasswordDialog } from './UserDialogs';
import type { MeasurementUnit } from '../../db/unitService';
import { PageScroll } from '../common/PageScroll';

interface UserWorkspaceProps {
  users: AppUser[];
  language: LanguageCode;
  onAddUser: (user: AppUser) => void;
  onUpdateUser: (user: AppUser) => void;
  onDeleteUser: (id: string) => void;
  /** Ýörite rugsatlar bölümi üçin sanawlar. */
  warehouses: readonly Warehouse[];
  ledgers: readonly Ledger[];
  units: readonly MeasurementUnit[];
  customers: readonly Customer[];
  products: readonly Product[];
}

const ROLE_BADGE: Record<AppUserRole, string> = {
  Administrator: 'bg-emerald-50 text-emerald-700',
  Kassir: 'bg-sky-50 text-sky-700',
  Persenal: 'bg-amber-50 text-amber-700',
  Ýörite: 'bg-violet-50 text-violet-700',
};

function formatLastLogin(iso: string | undefined, language: LanguageCode): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(language === 'tm' ? 'tk-TM' : 'tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const UserWorkspace: React.FC<UserWorkspaceProps> = ({
  users,
  language,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  warehouses,
  ledgers,
  units,
  customers,
  products,
}) => {
  const isTm = language === 'tm';
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<AppUserRole | ''>('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [resetUser, setResetUser] = useState<AppUser | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetConfirm, setResetConfirm] = useState('');
  const [resetError, setResetError] = useState('');

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return users.filter((user) => {
      if (roleFilter && user.role !== roleFilter) return false;
      if (!q) return true;
      return (
        user.fullName.toLowerCase().includes(q) ||
        user.username.toLowerCase().includes(q) ||
        user.role.toLowerCase().includes(q)
      );
    });
  }, [users, searchQuery, roleFilter]);

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingUser(null);
  };

  const handleSave = (user: AppUser) => {
    if (editingUser) onUpdateUser(user);
    else onAddUser(user);
    closeForm();
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetUser) return;
    if (resetPassword !== resetConfirm) {
      setResetError(isTm ? 'Parollar gabat gelenok.' : 'Şifreler eşleşmiyor.');
      return;
    }
    onUpdateUser({ ...resetUser, password: resetPassword });
    setResetUser(null);
    setResetPassword('');
    setResetConfirm('');
    setResetError('');
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F1F5F9] overflow-hidden">
      <PageScroll>
      <div className="px-3 md:px-6 pt-3 md:pt-5 pb-3">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder={isTm ? 'Ady ýa-da rol boýunça gözle...' : 'İsim veya role göre ara...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 h-10 bg-[#F8FAFC] border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as AppUserRole | '')}
            className="h-10 pl-3 pr-8 bg-[#F8FAFC] border border-gray-200 rounded-xl text-sm text-gray-700 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="">{isTm ? 'Ähli roller' : 'Tüm roller'}</option>
            {APP_USER_ROLES.map((role) => (
              <option key={role} value={role}>
                {ROLE_LABELS[role]}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => {
              setEditingUser(null);
              setIsFormOpen(true);
            }}
            className="h-10 px-5 bg-[#10b981] hover:bg-[#059669] text-white font-bold text-sm rounded-xl flex items-center gap-2 transition-colors shadow-sm flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            Täze ulanyjy
          </button>
        </div>
      </div>

      <div className="px-3 md:px-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 select-none">
                <th className="py-3 px-4">Ulanyjy ady</th>
                <th className="py-3 px-4">Rol</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Soňky giriş</th>
                <th className="py-3 px-4 text-center">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <UserCheck className="w-10 h-10 text-gray-200" />
                      <span className="font-semibold text-gray-400 text-xs">
                        {users.length === 0
                          ? 'Ulanyjy ýok. Täze ulanyjy dörediň.'
                          : 'Ulanyjy tapylmady'}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3 px-4 font-bold text-gray-900 text-sm font-mono">
                      {user.username}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                          ROLE_BADGE[user.role] ?? 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {ROLE_LABELS[user.role] ?? user.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                          user.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {user.isActive ? 'Aktiw' : 'Passiw'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500">{formatLastLogin(user.lastLogin, language)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        {user.role === 'Administrator' ? (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-xl bg-gray-100 text-gray-400 text-[10px] font-bold"
                            title={isTm ? 'Administrator düzedilip/silinip bilinmeýär' : 'Administrator düzenlenemez/silinemez'}
                          >
                            <Lock className="w-3 h-3" />
                            {isTm ? 'Goragly' : 'Korumalı'}
                          </span>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingUser(user);
                                setIsFormOpen(true);
                              }}
                              className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-[#0B1F3A] hover:text-white text-gray-500 transition-colors"
                              title="Redaktirle"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setResetUser(user);
                                setResetPassword('');
                                setResetConfirm('');
                                setResetError('');
                              }}
                              className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-amber-500 hover:text-white text-gray-500 transition-colors"
                              title="Paroly täzele"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(user.id)}
                              className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-rose-500 hover:text-white text-gray-500 transition-colors"
                              title="Pozmak"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
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
      </PageScroll>

      {isFormOpen && (
        <UserFormModal
          language={language}
          users={users}
          editingUser={editingUser}
          onSave={handleSave}
          onClose={closeForm}
          warehouses={warehouses}
          ledgers={ledgers}
          units={units}
          customers={customers}
          products={products}
        />
      )}

      {deleteConfirmId && (
        <DeleteUserDialog
          language={language}
          onCancel={() => setDeleteConfirmId(null)}
          onConfirm={() => {
            onDeleteUser(deleteConfirmId);
            setDeleteConfirmId(null);
          }}
        />
      )}

      {resetUser && (
        <ResetPasswordDialog
          user={resetUser}
          password={resetPassword}
          confirmPassword={resetConfirm}
          error={resetError}
          onPasswordChange={setResetPassword}
          onConfirmChange={setResetConfirm}
          onClose={() => setResetUser(null)}
          onSubmit={handleResetPassword}
        />
      )}
    </div>
  );
};
