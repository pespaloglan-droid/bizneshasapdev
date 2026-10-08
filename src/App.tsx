import React, { useState, useEffect } from 'react';
import { TitleBar } from './components/TitleBar';
import { LeftAccountPanel } from './components/LeftAccountPanel';
import { RightLoginForm } from './components/RightLoginForm';
import { BottomToolbar } from './components/BottomToolbar';
import { AddAccountModal } from './components/modals/AddAccountModal';
import { EditAccountModal } from './components/modals/EditAccountModal';
import { DeleteAccountModal } from './components/modals/DeleteAccountModal';
import { ImportDataModal } from './components/modals/ImportDataModal';
import { OtherAccountsModal } from './components/modals/OtherAccountsModal';
import { ShortcutsModal } from './components/modals/ShortcutsModal';
import { PosWorkspace } from './components/pos/PosWorkspace';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import LicenseScreen from './components/LicenseScreen';
import { Account, LanguageCode, PrinterMode, User } from './types';
import { loadStoredState, saveAccountsState } from './store/accountStore';
import { destroyLocalDatabase, getAccountStoreKey } from './db/pouch';
import type { LicenseInfo } from './types/license';
import { setLicenseId } from './utils/gateMiddleware';
import { prepareEncryption } from './init/prepareEncryption';
import { setAuditEnabled, setAuditUser } from './db/auditLog';

/**
 * Açılış akışı (spec v3 §2):
 *   1. Hesap ekranı (liste + yeni hesap + giriş)  ← İLK EKRAN
 *   2. Girişten hemen sonra Lisans Yönetimi     ← ara ekran YOK
 *   3. Lisans geçerliyse ana ekran, değilse lisans ekranında kalır
 * Uygulama açılışta ASLA doğrudan key/lisans sormaz.
 */
type AppPhase = 'account' | 'license' | 'workspace';

/** Hesap ID biçimi: XXXX-XXXX-XXXX-XX (Crockford Base32, tireli) */
const LICENSE_ID_PATTERN = /^[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{2}$/;

export const App: React.FC = () => {
  const [state, setState] = useState(() => loadStoredState());
  // Şifreleme açılış hazırlığı (FAZ 1.1): UI render edilmeden önce DB parolası
  // lisanstan türetilip önbelleğe alınır — getLocalDatabase senkron kaldığı için
  // bu adım atlanamaz. Hata olsa bile uygulama açılır (hazırlık içinde loglanır).
  const [encryptionReady, setEncryptionReady] = useState(false);
  const [activeModal, setActiveModal] = useState<
    'none' | 'addAccount' | 'editAccount' | 'deleteAccount' | 'importData' | 'otherAccounts' | 'shortcuts-search' | 'shortcuts-triangle'
  >('none');

  useEffect(() => {
    let cancelled = false;
    prepareEncryption()
      .catch((err) => {
        console.error('Şifreleme hazırlığı hatası:', err);
      })
      .finally(() => {
        if (!cancelled) setEncryptionReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
  const [phase, setPhase] = useState<AppPhase>('account');
  const [licenseInfo, setLicenseInfo] = useState<LicenseInfo | null>(null);
  /** Lisansı sorgulanan hesap (giriş yapılan hesap). */
  const [licenseTarget, setLicenseTarget] = useState<Account | null>(null);
  const [licenseBlockedRoute, setLicenseBlockedRoute] = useState<string | undefined>(undefined);

  // Active Account
  const activeAccount = state.accounts.find(a => a.id === state.selectedAccountId) || state.accounts[0];

  /**
   * Hesap kimliği göçü (spec v3 §3.3)
   *
   * Bu özellik eklenmeden önce oluşturulan hesapların `licenseId` alanı yoktur.
   * Ana süreç artık bilinçli olarak "kimlik yoksa varsayılan hesaba düş" davranışını
   * UYGULAMAZ (aksi halde lisanssız hesaplar lisanslı hesabın yetkisini kullanırdı).
   * Bu yüzden eksik kimlikli hesaplara uygulama açılışında bir kez kimlik atanır ve
   * kalıcı olarak saklanır — böylece hesap lisanslanabilir hâle gelir.
   */
  useEffect(() => {
    const missing = state.accounts.filter(
      (a) => !a.licenseId || !LICENSE_ID_PATTERN.test(a.licenseId)
    );
    if (missing.length === 0) return;

    let cancelled = false;
    void (async () => {
      const ids = new Map<string, string>();
      for (const account of missing) {
        const id = await window.electronAPI?.createLicenseId?.();
        if (id && LICENSE_ID_PATTERN.test(id)) {
          ids.set(account.id, id);
        }
      }
      if (cancelled || ids.size === 0) return;

      setState((prev) => ({
        ...prev,
        accounts: prev.accounts.map((a) => {
          const newId = ids.get(a.id);
          return newId ? { ...a, licenseId: newId } : a;
        })
      }));
    })();

    return () => {
      cancelled = true;
    };
    // Yalnızca hesap kimlikleri eksik olduğunda çalışır; sonrasında no-op.
  }, [state.accounts]);

  // ── Hesap bazlı lisans kontrolü (spec v3 §4) ────────────────────────────
  const checkAccountLicense = async (account: Account): Promise<LicenseInfo | null> => {
    try {
      // Gate kontrolü (renderer'daki sekme kontrolleri) bu hesabın lisansını
      // sorgulasın diye kimliği burada sabitliyoruz.
      setLicenseId(account.licenseId);
      await window.electronAPI?.selectLicenseAccount?.(account.licenseId);
      const info = await window.electronAPI?.getLicenseInfo?.(account.licenseId);
      return info ?? null;
    } catch {
      return null;
    }
  };

  // Save state on changes
  useEffect(() => {
    saveAccountsState(state.accounts, {
      selectedAccountId: state.selectedAccountId,
      selectedUserId: state.selectedUserId,
      language: state.language,
      printerMode: state.printerMode
    });
  }, [state]);

  // Window mode switch on Login / Logout
  const handleLoginSuccess = async (user: User) => {
    setLoggedInUser(user);
    if (window.electronAPI?.enterFullscreen) {
      window.electronAPI.enterFullscreen();
    }

    // Giriş tamamlandı → HEMEN lisans kontrolü (ara ekran yok)
    const account = activeAccount;
    if (!account) return;

    setLicenseTarget(account);
    const info = await checkAccountLicense(account);

    if (info && info.status === 1) {
      // Lisans geçerli → ana ekrana geç, ekranda takma kalma
      setLicenseInfo(info);
      setPhase('workspace');
    } else {
      setLicenseInfo(info);
      setPhase('license');
    }
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    setPhase('account');
    setLicenseTarget(null);
    setLicenseInfo(null);
    setLicenseBlockedRoute(undefined);
    // Gate'i temizle — sonraki girişe kadar kilitli kalsın
    setLicenseId(undefined);
    // Audit bağlamını temizle — çıkıştan sonra yazım olmasın
    setAuditUser(undefined);
    setAuditEnabled(false);
    void window.electronAPI?.selectLicenseAccount?.(undefined);
    if (window.electronAPI?.restoreCompact) {
      window.electronAPI.restoreCompact();
    }
  };

  /** Lisans ekranından çıkış: yeniden kontrol et, geçerliyse ana ekrana geç. */
  const handleLicenseClose = async () => {
    const account = licenseTarget;
    if (!account) {
      setPhase('account');
      return;
    }

    const info = await checkAccountLicense(account);
    setLicenseInfo(info);

    if (info && info.status === 1) {
      setLicenseBlockedRoute(undefined);
      setPhase('workspace');
    } else {
      setPhase('license');
    }
  };

  /** PosWorkspace içinden lisans engeli tetiklendiğinde. */
  const handleLicenseRequired = (blockedRoute?: string) => {
    setLicenseBlockedRoute(blockedRoute);
    setPhase('license');
  };

  // Handlers
  const handleSelectAccount = (accountId: string) => {
    const acc = state.accounts.find(a => a.id === accountId);
    setState(prev => ({
      ...prev,
      selectedAccountId: accountId,
      selectedUserId: acc?.users[0]?.id || prev.selectedUserId
    }));
  };

  const handleSelectUser = (userId: string) => {
    setState(prev => ({ ...prev, selectedUserId: userId }));
  };

  const handleAddAccount = (newAccount: Account) => {
    setState(prev => ({
      ...prev,
      accounts: [...prev.accounts, newAccount],
      selectedAccountId: newAccount.id,
      selectedUserId: newAccount.users[0]?.id
    }));
  };

  const handleUpdateAccount = (updatedAccount: Account) => {
    setState(prev => ({
      ...prev,
      accounts: prev.accounts.map(a => a.id === updatedAccount.id ? updatedAccount : a)
    }));
  };

  const handleDeleteAccount = (accountId: string) => {
    const accountToDelete = state.accounts.find((a) => a.id === accountId);
    if (accountToDelete) {
      destroyLocalDatabase(getAccountStoreKey(accountToDelete)).catch(() => {});
    }
    setState(prev => {
      const filtered = prev.accounts.filter(a => a.id !== accountId);
      const fallback = filtered[0];
      return {
        ...prev,
        accounts: filtered.length ? filtered : prev.accounts,
        selectedAccountId: fallback ? fallback.id : prev.selectedAccountId,
        selectedUserId: fallback ? fallback.users[0]?.id : prev.selectedUserId
      };
    });
  };

  const handleUpdateLogo = (logoUrl: string) => {
    if (!activeAccount) return;
    handleUpdateAccount({
      ...activeAccount,
      logoUrl
    });
  };

  const handleLanguageChange = (lang: LanguageCode) => {
    setState(prev => ({ ...prev, language: lang }));
  };

  const handlePrinterChange = (mode: PrinterMode) => {
    setState(prev => ({ ...prev, printerMode: mode }));
  };

  // 0. AÇILIŞ HAZIRLIĞI — şifreleme parolası lisanstan türetilirken beklenir
  if (!encryptionReady) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-white rounded-xl border border-gray-200 select-none">
        <div className="w-8 h-8 border-[3px] border-gray-200 border-t-[#10b981] rounded-full animate-spin" />
        <p className="mt-3 text-xs font-bold text-gray-400">Hazırlanıyor...</p>
      </div>
    );
  }

  // 0. LİSANS EKRANI — yalnızca giriş sonrası (veya çalışma sırasında engellenirse)
  //    Hesabın adı ve kendi Hesap ID'si gösterilir (v3 §6).
  if (phase === 'license' && licenseTarget) {
    return (
      <LicenseScreen
        licenseId={licenseTarget.licenseId}
        accountName={licenseTarget.name}
        blockedRoute={licenseBlockedRoute}
        onClose={handleLicenseClose}
      />
    );
  }

  // 1. ANA ÇALIŞMA ALANI — lisans geçerli + giriş yapılmış
  if (phase === 'workspace' && loggedInUser && activeAccount) {
    return (
      <ErrorBoundary key={activeAccount.id} onReset={handleLogout}>
        <PosWorkspace
          activeAccount={activeAccount}
          currentUser={loggedInUser}
          language={state.language}
          printerMode={state.printerMode}
          licenseInfo={licenseInfo}
          onLogout={handleLogout}
          onSelectLanguage={handleLanguageChange}
          onSelectPrinterMode={handlePrinterChange}
          onLicenseRequired={handleLicenseRequired}
        />
      </ErrorBoundary>
    );
  }

  // 2. HESAP EKRANI — açılışta ilk görünen ekran (v3 §2)
  //    Hesap listesi + yeni hesap + giriş. Lisans burada ASLA sorulmaz.
  return (
    <div className="w-full h-full flex flex-col bg-white rounded-xl overflow-hidden border border-gray-200 select-none relative">
      {/* 1. Custom Title Bar */}
      <TitleBar language={state.language} />

      {/* 2. Login Content Area — mobilde üst-alt, PC'de yan yana */}
      <div className="flex-1 flex flex-col md:flex-row bg-white overflow-y-auto md:overflow-hidden">
        {/* Left Account Panel */}
        <LeftAccountPanel
          account={activeAccount}
          language={state.language}
          onOpenOtherAccounts={() => setActiveModal('otherAccounts')}
          onOpenAddAccount={() => setActiveModal('addAccount')}
          onEditAccount={() => setActiveModal('editAccount')}
          onDeleteAccount={() => setActiveModal('deleteAccount')}
          onImportData={() => setActiveModal('importData')}
          onUpdateLogo={handleUpdateLogo}
        />

        {/* Right Login Form */}
        <RightLoginForm
          account={activeAccount}
          selectedUserId={state.selectedUserId}
          language={state.language}
          onSelectUser={handleSelectUser}
          onLoginSuccess={handleLoginSuccess}
        />
      </div>

      {/* 3. Bottom Information Toolbar */}
      <BottomToolbar
        language={state.language}
        printerMode={state.printerMode}
        onSelectLanguage={handleLanguageChange}
        onSelectPrinterMode={handlePrinterChange}
        onOpenShortcuts={(type) => setActiveModal(type === 'search' ? 'shortcuts-search' : 'shortcuts-triangle')}
      />

      {/* Modals */}
      {activeModal === 'addAccount' && (
        <AddAccountModal
          language={state.language}
          onAddAccount={handleAddAccount}
          onClose={() => setActiveModal('none')}
        />
      )}

      {activeModal === 'editAccount' && activeAccount && (
        <EditAccountModal
          account={activeAccount}
          language={state.language}
          onUpdateAccount={handleUpdateAccount}
          onClose={() => setActiveModal('none')}
        />
      )}

      {activeModal === 'deleteAccount' && activeAccount && (
        <DeleteAccountModal
          account={activeAccount}
          language={state.language}
          onConfirmDelete={handleDeleteAccount}
          onClose={() => setActiveModal('none')}
        />
      )}

      {activeModal === 'otherAccounts' && (
        <OtherAccountsModal
          accounts={state.accounts}
          selectedAccountId={state.selectedAccountId}
          language={state.language}
          onSelectAccount={handleSelectAccount}
          onOpenAddAccount={() => setActiveModal('addAccount')}
          onClose={() => setActiveModal('none')}
        />
      )}

      {activeModal === 'importData' && activeAccount && (
        <ImportDataModal
          account={activeAccount}
          language={state.language}
          storeDb={getAccountStoreKey(activeAccount)}
          onClose={() => setActiveModal('none')}
        />
      )}

      {(activeModal === 'shortcuts-search' || activeModal === 'shortcuts-triangle') && (
        <ShortcutsModal
          type={activeModal === 'shortcuts-search' ? 'search' : 'triangle'}
          language={state.language}
          onClose={() => setActiveModal('none')}
        />
      )}
    </div>
  );
};

export default App;
