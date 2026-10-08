import React from 'react';
import {
  ArrowLeftRight,
  Bell,
  BookOpen,
  Boxes,
  Calculator,
  DollarSign,
  LogOut,
  Menu,
  Package,
  Settings,
  ShoppingBasket,
  Truck,
  User,
  UserCheck,
  X
} from 'lucide-react';
import type { PosTabType } from '../pos/TopNavBar';
import type { LanguageCode } from '../../types';
import { translations } from '../../locales/i18n';
import defaultLogo from '../../assets/bh_logo.png';

const TAB_META: Record<PosTabType, { icon: React.ReactNode }> = {
  checkout: { icon: <ShoppingBasket className="w-5 h-5" /> },
  invoice: { icon: <ShoppingBasket className="w-5 h-5" /> },
  money: { icon: <DollarSign className="w-5 h-5" /> },
  customer: { icon: <User className="w-5 h-5" /> },
  user: { icon: <UserCheck className="w-5 h-5" /> },
  product: { icon: <Boxes className="w-5 h-5" /> },
  calculation: { icon: <Calculator className="w-5 h-5" /> },
  currency: { icon: <ArrowLeftRight className="w-5 h-5" /> },
  ledger: { icon: <BookOpen className="w-5 h-5" /> },
  warehouse: { icon: <Package className="w-5 h-5" /> },
  courier: { icon: <Truck className="w-5 h-5" /> },
  settings: { icon: <Settings className="w-5 h-5" /> },
};

function tabLabel(tab: PosTabType, language: LanguageCode): string {
  const t = translations[language] || translations.en;
  switch (tab) {
    case 'checkout': return t.tabKassa;
    case 'invoice': return t.tabFatura;
    case 'money': return t.tabPara;
    case 'customer': return t.tabMusteri;
    case 'user': return t.tabUser;
    case 'product': return t.tabHaryt;
    case 'calculation': return t.tabHesaplama;
    case 'currency': return t.tabDoviz;
    case 'ledger': return t.tabDepder;
    case 'warehouse': return t.tabAmbar;
    case 'courier': return t.tabKurye;
    case 'settings': return t.tabAyarlar;
  }
}

/** Alt menüde sabit 5 modül: Faktura, Haryt, Müşderi, Kassa, Hasaplama. */
const BOTTOM_TABS: PosTabType[] = ['checkout', 'product', 'customer', 'money', 'calculation'];

/** Alt menü etiketi — diğer yerlerdeki "Hasaplama" adıyla aynı. */
function bottomLabel(tab: PosTabType, language: LanguageCode): string {
  return tabLabel(tab, language);
}

interface MobileHeaderProps {
  companyName: string;
  alertCount: number;
  onOpenMenu: () => void;
  onOpenAlerts: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  companyName,
  alertCount,
  onOpenMenu,
  onOpenAlerts
}) => (
  <header className="bh-safe-top h-14 w-full bg-[#0B1F3A] text-white flex items-center gap-2 px-3 flex-shrink-0 z-30 shadow-md">
    <button
      type="button"
      onClick={onOpenMenu}
      className="p-2.5 -ml-1 rounded-xl hover:bg-white/10 active:bg-white/20"
      aria-label="Menü"
    >
      <Menu className="w-6 h-6" />
    </button>
    <span className="flex-1 truncate font-bold text-[15px] tracking-tight">{companyName}</span>
    <button
      type="button"
      onClick={onOpenAlerts}
      className="p-2.5 relative rounded-xl hover:bg-white/10 active:bg-white/20"
      aria-label="Uyarılar"
    >
      <Bell className="w-5 h-5" />
      {alertCount > 0 && (
        <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-[10px] font-bold flex items-center justify-center">
          {alertCount > 99 ? '99+' : alertCount}
        </span>
      )}
    </button>
  </header>
);

interface MobileBottomNavProps {
  activeTab: PosTabType;
  language: LanguageCode;
  allowedTabs: ReadonlySet<PosTabType> | null;
  cartCount: number;
  onSelectTab: (tab: PosTabType) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  language,
  allowedTabs,
  cartCount,
  onSelectTab
}) => {
  const visible = BOTTOM_TABS.filter((t) => !allowedTabs || allowedTabs.has(t));
  return (
    <nav className="bh-safe-bottom w-full bg-white border-t border-gray-200 flex items-stretch flex-shrink-0 z-30 shadow-[0_-2px_12px_rgba(0,0,0,0.06)]">
      {visible.map((tab) => {
        const isActive = activeTab === tab;
        return (
          <button
            key={tab}
            type="button"
            onClick={() => onSelectTab(tab)}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 relative active:bg-gray-50 ${
              isActive ? 'text-emerald-600' : 'text-gray-500'
            }`}
          >
            {TAB_META[tab].icon}
            <span className={`text-[10px] leading-tight ${isActive ? 'font-bold' : 'font-medium'}`}>
              {bottomLabel(tab, language)}
            </span>
            {tab === 'checkout' && cartCount > 0 && (
              <span className="absolute top-1 right-1/2 translate-x-6 min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
            {isActive && <span className="absolute bottom-0 h-0.5 w-10 rounded-full bg-emerald-500" />}
          </button>
        );
      })}
    </nav>
  );
};

interface MobileDrawerProps {
  open: boolean;
  companyName: string;
  logoUrl?: string;
  userName: string;
  language: LanguageCode;
  activeTab: PosTabType;
  allowedTabs: ReadonlySet<PosTabType> | null;
  onSelectTab: (tab: PosTabType) => void;
  onClose: () => void;
  onLogout: () => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  open,
  companyName,
  logoUrl,
  userName,
  language,
  activeTab,
  allowedTabs,
  onSelectTab,
  onClose,
  onLogout
}) => {
  const [logoBroken, setLogoBroken] = React.useState(false);
  React.useEffect(() => {
    setLogoBroken(false);
  }, [logoUrl]);
  if (!open) return null;
  const all: PosTabType[] = [
    'checkout', 'money', 'customer', 'user', 'product', 'calculation',
    'currency', 'ledger', 'warehouse', 'courier', 'settings'
  ];
  const visible = allowedTabs ? all.filter((t) => allowedTabs.has(t)) : all;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <aside className="absolute left-0 top-0 bottom-0 w-[84%] max-w-[320px] bg-white flex flex-col shadow-2xl">
        <div className="bh-safe-top bg-[#0B1F3A] text-white px-4 pt-3 pb-4">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center overflow-hidden flex-shrink-0">
              {logoUrl && !logoBroken ? (
                <img
                  src={logoUrl}
                  alt={companyName}
                  onError={() => setLogoBroken(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <img src={defaultLogo} alt="Biznes Hasap" className="w-8 h-8 object-contain" />
              )}
            </span>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-[15px] truncate">{companyName}</div>
              <span className="text-xs text-gray-300 truncate block">{userName}</span>
            </div>
            <button type="button" onClick={onClose} className="p-2 -mr-2 rounded-lg hover:bg-white/10" aria-label="Kapat">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {visible.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => { onSelectTab(tab); onClose(); }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left active:bg-emerald-50 relative ${
                  isActive ? 'bg-emerald-50' : ''
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-emerald-500" />
                )}
                <span className={isActive ? 'text-emerald-700' : 'text-gray-500'}>
                  {TAB_META[tab].icon}
                </span>
                <span className={`text-sm ${isActive ? 'font-bold text-emerald-800' : 'font-semibold text-gray-800'}`}>
                  {tabLabel(tab, language)}
                </span>
              </button>
            );
          })}
        </div>
        <div className="bh-safe-bottom border-t border-gray-200 p-3">
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-50 text-red-600 text-sm font-bold active:bg-red-100"
          >
            <LogOut className="w-4 h-4" />
            {(translations[language] || translations.en).logoutTooltip}
          </button>
        </div>
      </aside>
    </div>
  );
};
