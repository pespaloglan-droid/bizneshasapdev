import React, { useState } from 'react';
import {
  ShoppingCart,
  ShoppingBasket,
  FileText,
  DollarSign,
  User,
  UserCheck,
  Package,
  Boxes,
  Calculator,
  ArrowLeftRight, 
  BookOpen,
  Truck,
  Settings,
  LogOut,
  Building2,
  Minus,
  Square,
  X,
  ChevronDown
} from 'lucide-react';
import { LanguageCode } from '../../types';
import { translations } from '../../locales/i18n';

export type PosTabType =
  | 'checkout'
  | 'invoice'
  | 'money'
  | 'customer'
  | 'user'
  | 'product'
  | 'calculation'
  | 'currency'
  | 'ledger'
  | 'warehouse'
  | 'courier'
  | 'settings';

interface TopNavBarProps {
  activeTab: PosTabType;
  language: LanguageCode;
  onSelectTab: (tab: PosTabType) => void;
  onLogout: () => void;
  /** Hesap Değiştir — oturumu kapatıp Hesap Ekranına döner (v3 §5.2). */
  onSwitchAccount: () => void;
  /** Ýörite rugsatlar: görkezilýän sekmeler (null = ählisi). */
  allowedTabs?: ReadonlySet<PosTabType> | null;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  activeTab,
  language,
  onSelectTab,
  onLogout,
  onSwitchAccount,
  allowedTabs = null,
}) => {
  const t = translations[language] || translations.en;
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  // Rugsat boýunça diňe görünýän sekmeleri görkez (null = çäklendirme ýok).
  // (primaryTabs/systemTabs aşakda döredilýär — olardan soň hasaplanýar.)

  // Kullanıcının belirttiği 1-9 ana modüller
  const primaryTabs: { id: PosTabType; label: string; icon: React.ReactNode }[] = [
    { id: 'checkout', label: t.tabKassa, icon: <ShoppingBasket className="w-4 h-4" /> },
    { id: 'money', label: t.tabPara, icon: <DollarSign className="w-4 h-4" /> },
    { id: 'customer', label: t.tabMusteri, icon: <User className="w-4 h-4" /> },
    { id: 'user', label: t.tabUser, icon: <UserCheck className="w-4 h-4" /> },
    { id: 'product', label: t.tabHaryt, icon: <Boxes className="w-4 h-4" /> },
    { id: 'calculation', label: t.tabHesaplama, icon: <Calculator className="w-4 h-4" /> },
    { id: 'currency', label: t.tabDoviz, icon: <ArrowLeftRight className="w-4 h-4" /> },
    { id: 'ledger', label: t.tabDepder, icon: <BookOpen className="w-4 h-4" /> },
    { id: 'warehouse', label: t.tabAmbar, icon: <Package className="w-4 h-4" /> },
    { id: 'courier', label: t.tabKurye, icon: <Truck className="w-4 h-4" /> },
    
  ];

  // Sağ Sistem Sekmeleri (Ayarlar & Lisans)
  const systemTabs: { id: PosTabType; label: string; icon: React.ReactNode }[] = [
    { id: 'settings', label: t.tabAyarlar, icon: <Settings className="w-4 h-4" /> },
  ];

  // Rugsat boýunça diňe görünýän sekmeleri görkez (null = çäklendirme ýok).
  const visiblePrimary = allowedTabs
    ? primaryTabs.filter((tab) => allowedTabs.has(tab.id))
    : primaryTabs;
  const visibleSystem = allowedTabs
    ? systemTabs.filter((tab) => allowedTabs.has(tab.id))
    : systemTabs;

  const handleMinimize = () => (window as any).electronAPI?.minimize();
  const handleMaximize = () => (window as any).electronAPI?.maximize();
  const handleClose = () => (window as any).electronAPI?.close();

  return (
    <header
      className="h-11 w-full bg-[#0B1F3A] text-white flex items-center justify-between px-3 select-none flex-shrink-0 z-30 shadow-md border-b border-white/10"
      style={{ WebkitAppRegion: 'drag' } as any}
    >
      {/* Sol ve Orta Modül Sekmeleri (1. Kasa, 2. Fatura, 3. Para, 4. Müşteri, 5. User, 6. Hesaplama, 7. Döviz, 8. Ambar, 9. Kurye) */}
      <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar py-0.5" style={{ WebkitAppRegion: 'no-drag' } as any}>
        {visiblePrimary.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-[#1DB954] text-white font-semibold shadow-sm'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Sağ Sistem Sekmeleri (11. Ayarlar, 12. Lisans) ve Pencere Kontrolleri */}
      <div className="flex items-center space-x-1.5 flex-shrink-0 ml-2" style={{ WebkitAppRegion: 'no-drag' } as any}>
        {visibleSystem.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex items-center space-x-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-[#1DB954] text-white font-semibold shadow-sm'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              {tab.icon}
              <span className="hidden lg:inline">{tab.label}</span>
            </button>
          );
        })}

        {/* Hesap Değiştir (v3 §5.2) — oturumu kapatır, Hesap Ekranına döner */}
        <button
          onClick={onSwitchAccount}
          className="p-1.5 text-gray-300 hover:text-blue-300 hover:bg-white/10 rounded-lg transition-colors ml-0.5"
          title={t.logoutTooltip === 'Çıkış' ? 'Hesap Değiştir' : 'Hesap değiştir'}
          aria-label="Hesap değiştir"
        >
          <Building2 className="w-4 h-4" />
        </button>

        {/* Oturumu Kapat / Logout Butonu */}
        <button
          onClick={onLogout}
          className="p-1.5 text-gray-300 hover:text-red-400 hover:bg-white/10 rounded-lg transition-colors ml-0.5"
          title={t.logoutTooltip}
        >
          <LogOut className="w-4 h-4" />
        </button>

        {/* Pencere Kontrolleri */}
        <div className="flex items-center space-x-0.5 pl-1.5 border-l border-white/20">
          <button
            onClick={handleMinimize}
            className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleMaximize}
            className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
          >
            <Square className="w-3 h-3" />
          </button>
          <button
            onClick={handleClose}
            className="p-1 text-gray-400 hover:bg-red-600 hover:text-white rounded transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
