import React, { useState } from 'react';
import { ShieldCheck, Trash2 } from 'lucide-react';
import type { AppUser, LedgerPermission, LedgerPermissionKey } from '../../types';
import {
  EMPTY_LEDGER_PERMISSION,
  LEDGER_PERMISSION_KEYS,
} from '../../db/ledgerService';
import { useT } from '../../locales/LanguageContext';

/** İzin anahtarı → çeviri anahtarı (db'deki tm etiketler yerine). */
const PERM_KEYS: Record<string, string> = {
  canEnter: 'depder.permEnter',
  canAddIncome: 'depder.permAddIncome',
  canAddExpense: 'depder.permAddExpense',
  canEdit: 'depder.permEdit',
  canDelete: 'depder.permDelete',
  canViewReport: 'depder.permViewReport',
};

interface LedgerPermissionMatrixProps {
  appUsers: readonly AppUser[];
  permissions: Record<string, LedgerPermission>;
  onChange: (next: Record<string, LedgerPermission>) => void;
}

export const LedgerPermissionMatrix: React.FC<LedgerPermissionMatrixProps> = ({
  appUsers,
  permissions,
  onChange,
}) => {
  const t = useT();
  const [pendingUserId, setPendingUserId] = useState('');

  const assignedIds = Object.keys(permissions);
  const assigned = assignedIds
    .map((id) => appUsers.find((user) => user.id === id))
    .filter((user): user is AppUser => Boolean(user));
  const available = appUsers.filter((user) => !assignedIds.includes(user.id));

  const toggle = (userId: string, key: LedgerPermissionKey) => {
    const current = permissions[userId] ?? EMPTY_LEDGER_PERMISSION;
    onChange({ ...permissions, [userId]: { ...current, [key]: !current[key] } });
  };

  const addUser = (userId: string) => {
    if (!userId) return;
    onChange({
      ...permissions,
      [userId]: { ...EMPTY_LEDGER_PERMISSION, canEnter: true },
    });
    setPendingUserId('');
  };

  const removeUser = (userId: string) => {
    const next: Record<string, LedgerPermission> = { ...permissions };
    delete next[userId];
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <select
          value={pendingUserId}
          onChange={(e) => setPendingUserId(e.target.value)}
          className="flex-1 h-9 px-3 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 bg-[#F8FAFC] outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
        >
          <option value="">{t('depder.userSelectPh')}</option>
          {available.map((user) => (
            <option key={user.id} value={user.id}>
              {user.fullName} ({user.role})
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => addUser(pendingUserId)}
          disabled={!pendingUserId}
          className="h-9 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs"
        >
          {t('depder.userAdd')}
        </button>
      </div>

      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-left text-[11px]">
          <thead>
            <tr className="bg-gray-50/80 text-gray-500 font-bold border-b border-gray-100">
              <th className="py-2 px-3">{t('depder.userCol')}</th>
              {LEDGER_PERMISSION_KEYS.map((key) => (
                <th key={key} className="py-2 px-1.5 text-center">
                  {t(PERM_KEYS[key] ?? key)}
                </th>
              ))}
              <th className="py-2 px-2 w-8" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {assigned.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-6 text-center text-gray-400 font-semibold">
                  {t('depder.noUsersNote')}
                </td>
              </tr>
            ) : (
              assigned.map((user) => {
                const isAdmin = user.role === 'Administrator';
                const permission = permissions[user.id] ?? EMPTY_LEDGER_PERMISSION;
                return (
                  <tr key={user.id} className="hover:bg-gray-50/60">
                    <td className="py-1.5 px-3 font-semibold text-gray-700 whitespace-nowrap">
                      {user.fullName}
                      <span className="ml-1.5 text-[10px] text-gray-400 font-mono">{user.role}</span>
                    </td>

                    {isAdmin ? (
                      <td colSpan={6} className="py-1.5 px-2 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                          <ShieldCheck className="w-3 h-3" />
                          {t('depder.allPerms')}
                        </span>
                      </td>
                    ) : (
                      LEDGER_PERMISSION_KEYS.map((key) => (
                        <td key={key} className="py-1.5 px-1.5 text-center">
                          <input
                            type="checkbox"
                            checked={permission[key]}
                            onChange={() => toggle(user.id, key)}
                            className="w-3.5 h-3.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                        </td>
                      ))
                    )}

                    <td className="py-1.5 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeUser(user.id)}
                        className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                        title={t('depder.removeTip')}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
