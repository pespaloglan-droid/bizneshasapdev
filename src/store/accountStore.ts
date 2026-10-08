import { Account, LanguageCode, PrinterMode } from '../types';
import {
  getAllAccountsFromDb,
  isSeedAccount,
  saveAccountToDb,
  deleteAccountFromDb,
} from '../db/accountService';

const STORAGE_KEY = 'biznes_hasap_accounts_v1';
const SETTINGS_KEY = 'biznes_hasap_settings_v1';

export interface AppState {
  accounts: Account[];
  selectedAccountId: string;
  selectedUserId: string;
  language: LanguageCode;
  printerMode: PrinterMode;
}

const EMPTY_STATE: AppState = {
  accounts: [],
  selectedAccountId: '',
  selectedUserId: '',
  language: 'en',
  printerMode: 'auto',
};

export function loadStoredState(): AppState {
  try {
    const rawAccounts = localStorage.getItem(STORAGE_KEY);
    const rawSettings = localStorage.getItem(SETTINGS_KEY);

    // Açılışta hiçbir hesap otomatik seçilmez/tohumlanmaz.
    // Yalnızca kullanıcının daha önce kaydettiği hesaplar yüklenir; yoksa boş başlanır.
    const all: Account[] = rawAccounts ? JSON.parse(rawAccounts) : [];
    if (!Array.isArray(all)) return EMPTY_STATE;
    // Eski seed/mock hesaplar (Acme yazılım, LC Waikiki, BİM Market) temizlenir.
    const accounts = all.filter((a) => !isSeedAccount(a));

    const settings = rawSettings
      ? JSON.parse(rawSettings)
      : { language: 'en', printerMode: 'auto' };

    // Arka planda PouchDB'yi doğrula (seed YOK — sadece mevcutları oku).
    getAllAccountsFromDb().catch(() => {});

    return {
      accounts,
      selectedAccountId: settings.selectedAccountId && accounts.some((a) => a.id === settings.selectedAccountId)
        ? settings.selectedAccountId
        : '',
      selectedUserId: settings.selectedUserId && accounts.some((a) => a.users.some((u) => u.id === settings.selectedUserId))
        ? settings.selectedUserId
        : '',
      language: settings.language || 'en',
      printerMode: settings.printerMode || 'auto'
    };
  } catch {
    return EMPTY_STATE;
  }
}

export function saveAccountsState(accounts: Account[], state: Partial<AppState>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
    const currentSettings = {
      selectedAccountId: state.selectedAccountId,
      selectedUserId: state.selectedUserId,
      language: state.language,
      printerMode: state.printerMode
    };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(currentSettings));

    // PouchDB'ye de arka planda kaydet
    accounts.forEach((acc) => {
      saveAccountToDb(acc).catch(() => {});
    });
  } catch (e) {
    console.error('Failed to save state', e);
  }
}

export { saveAccountToDb, deleteAccountFromDb };
