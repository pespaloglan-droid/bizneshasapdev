import React, { useEffect, useMemo, useState } from 'react';
import { User as UserIcon, Lock, ChevronDown, CheckCircle2, AlertCircle } from 'lucide-react';
import { Account, AppUser, LanguageCode, User } from '../types';
import { translations } from '../locales/i18n';
import { ROLE_LABELS, ensureAccountUsersSeeded } from '../db/userService';
import { getAccountStoreKey } from '../db/pouch';

interface RightLoginFormProps {
  account?: Account;
  selectedUserId?: string;
  language: LanguageCode;
  onSelectUser: (userId: string) => void;
  onLoginSuccess: (user: User) => void;
}

interface LoginEntry {
  readonly user: User;
  /** Çep tarapda görkezilýän ulanyjy ady — Ulanyjy modulyndaky sanaw bilen deň. */
  readonly displayName: string;
  /** Sag tarapda görkezilýän hakyky rol ady. */
  readonly roleLabel: string;
}

/** Ulanyjy modulyndaky ýazgyny giriş ekranynyň ýazgysyna öwürýär. */
function toLoginEntry(appUser: AppUser): LoginEntry {
  return {
    user: {
      id: appUser.id,
      name: appUser.fullName || appUser.username,
      role: appUser.role === 'Administrator' ? 'admin' : 'staff',
      hasPassword: Boolean(appUser.password),
      password: appUser.password || undefined
    },
    displayName: appUser.username,
    roleLabel: ROLE_LABELS[appUser.role] ?? appUser.role
  };
}

/** Seed ulanyjylary (AppUser ýok bolsa) üçin ätiýaçlyk görnüş. */
function accountUserEntry(user: User): LoginEntry {
  const roleLabel =
    user.role === 'admin' ? 'Administrator' : user.role === 'manager' ? 'Ýolbaşçy' : 'Işgär';
  return { user, displayName: user.name, roleLabel };
}

export const RightLoginForm: React.FC<RightLoginFormProps> = ({
  account,
  selectedUserId,
  language,
  onSelectUser,
  onLoginSuccess
}) => {
  const t = translations[language] || translations.en;
  const [password, setPassword] = useState('');
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [appUsers, setAppUsers] = useState<AppUser[]>([]);

  // Ulanyjy modulynda döredilen ulanyjylar hem giriş sanawynda görünsin.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!account) return;
      try {
        const list = await ensureAccountUsersSeeded(account.users, getAccountStoreKey(account));
        if (!cancelled) setAppUsers(list);
      } catch {
        if (!cancelled) setAppUsers([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [account]);

  const entries: LoginEntry[] = useMemo(() => {
    if (appUsers.length === 0) return (account?.users ?? []).map(accountUserEntry);
    return appUsers.map(toLoginEntry);
  }, [appUsers, account]);

  const selectedEntry = entries.find((entry) => entry.user.id === selectedUserId) ?? entries[0];
  const selectedUser = selectedEntry?.user;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedUser) {
      setErrorMessage('Kullanıcı bulunamadı');
      return;
    }

    // Administrator or user with no password
    if (!selectedUser.hasPassword) {
      setSuccessMessage(t.loginSuccess);
      setTimeout(() => {
        onLoginSuccess(selectedUser);
      }, 600);
      return;
    }

    // Password check for other staff
    if (selectedUser.password && selectedUser.password === password) {
      setSuccessMessage(t.loginSuccess);
      setTimeout(() => {
        onLoginSuccess(selectedUser);
      }, 600);
    } else {
      setErrorMessage(t.wrongPassword);
    }
  };

  return (
    <div className="flex-1 bg-white p-5 md:p-8 flex flex-col justify-center relative">
      <form onSubmit={handleLogin} className="w-full max-w-sm mx-auto space-y-5">
        {/* 1. Kullanıcı Alanı */}
        <div className="space-y-1.5 relative">
          <div className="flex items-center space-x-2 text-gray-700 text-sm font-medium">
            <div className="w-5 h-5 rounded-full border border-gray-600 flex items-center justify-center">
              <UserIcon className="w-3.5 h-3.5 text-gray-700" />
            </div>
            <span>{t.userLabel}</span>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
              className="w-full h-11 px-4 text-left border border-gray-300 rounded-lg bg-white text-gray-800 font-medium tracking-wide flex items-center justify-between hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            >
              <span className="truncate">{selectedEntry?.displayName || 'ADMINISTRATOR'}</span>
              <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0 ml-2" />
            </button>

            {/* Kullanıcı Seçim Dropdown */}
            {isUserDropdownOpen && (
              <div 
                className="absolute top-12 left-0 right-0 z-50 bg-white border border-gray-200 rounded-lg shadow-xl py-1 max-h-48 overflow-y-auto"
                onMouseLeave={() => setIsUserDropdownOpen(false)}
              >
                {entries.map(entry => (
                  <button
                    key={entry.user.id}
                    type="button"
                    onClick={() => {
                      onSelectUser(entry.user.id);
                      setIsUserDropdownOpen(false);
                      setPassword('');
                      setErrorMessage(null);
                    }}
                    className={`w-full px-4 py-2.5 text-left text-sm flex items-center justify-between hover:bg-gray-50 transition-colors ${
                      entry.user.id === selectedUser?.id ? 'bg-blue-50/70 font-semibold text-blue-900' : 'text-gray-700'
                    }`}
                  >
                    <span className="font-medium">{entry.displayName}</span>
                    <span className="text-[11px] text-gray-400 font-mono">
                      {entry.roleLabel}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 2. Şifre Alanı */}
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2 text-gray-700 text-sm font-medium">
            <Lock className="w-4 h-4 text-gray-700" />
            <span>{t.passwordLabel}</span>
          </div>

          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t.passwordPlaceholder}
              className="w-full h-11 px-4 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
        </div>

        {/* 3. Giriş Butonu */}
        <div className="pt-2">
          <button
            type="submit"
            className="w-full h-12 bg-[#0e3860] hover:bg-[#0a2845] active:scale-[0.99] text-white font-medium text-base rounded-full shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2"
          >
            <span>{t.loginButton}</span>
          </button>
        </div>

        {/* Bildirim Mesajları */}
        {errorMessage && (
          <div className="flex items-center space-x-2 text-red-600 text-xs font-medium bg-red-50 p-2 rounded-lg border border-red-100 animate-in fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="flex items-center space-x-2 text-emerald-700 text-xs font-medium bg-emerald-50 p-2 rounded-lg border border-emerald-100 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}
      </form>
    </div>
  );
};
