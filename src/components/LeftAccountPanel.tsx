import { splitStoredAddress } from '../db/credentialStorage';
import React, { useEffect, useState, useRef } from 'react';
import { ChevronDown, Plus, Menu, Image as ImageIcon } from 'lucide-react';
import { Account, LanguageCode } from '../types';
import { translations } from '../locales/i18n';
import { AccountContextMenu } from './menus/AccountContextMenu';
import defaultLogo from '../assets/bh_logo.png';

interface LeftAccountPanelProps {
  account?: Account;
  language: LanguageCode;
  onOpenOtherAccounts: () => void;
  onOpenAddAccount: () => void;
  onEditAccount: () => void;
  onDeleteAccount: () => void;
  onImportData: () => void;
  onUpdateLogo: (logoUrl: string) => void;
}

/** Logoyu localStorage kotasına sığacak boyuta küçültür (uzun kenar maxSize px). */
function downscaleLogo(src: string, maxSize: number, done: (url: string | null) => void): void {
  const img = new Image();
  img.onload = () => {
    try {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        done(src);
        return;
      }
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      done(canvas.toDataURL('image/jpeg', 0.85));
    } catch {
      done(src);
    }
  };
  img.onerror = () => done(src);
  img.src = src;
}

export const LeftAccountPanel: React.FC<LeftAccountPanelProps> = ({
  account,
  language,
  onOpenOtherAccounts,
  onOpenAddAccount,
  onEditAccount,
  onDeleteAccount,
  onImportData,
  onUpdateLogo,
}) => {
  const t = translations[language] || translations.en;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [logoBroken, setLogoBroken] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hesap değişince kırık bayrağını sıfırla (yeni logo denensin).
  useEffect(() => {
    setLogoBroken(false);
  }, [account?.logoUrl]);

  // Telefon fotoğrafları MB'lerce olur → localStorage kotası dolar ve logo
  // sessizce kaybolurdu. Kaydetmeden önce max 512px'e küçült (beyaz zeminli JPEG).
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result !== 'string') return;
      downscaleLogo(reader.result, 512, (dataUrl) => {
        if (dataUrl) {
          setLogoBroken(false);
          onUpdateLogo(dataUrl);
        }
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="w-full md:w-[300px] flex flex-col justify-between border-b md:border-b-0 md:border-r border-gray-200 bg-white relative">
      {/* 1. Üst Bar: Ortadan Dikey Çizgi, Tek Satır Yazı, Sol Başta İkon, Sağ Sonda İkon */}
      <div className="flex items-center h-11 border-b border-gray-200 flex-shrink-0 bg-gray-50/50">
        {/* Sol Buton: Başga hasaplar (İkon En Başta) */}
        <button
          type="button"
          onClick={onOpenOtherAccounts}
          className="flex-1 h-full px-3 flex items-center justify-start space-x-1.5 text-xs text-gray-700 hover:text-blue-900 hover:bg-gray-100/70 font-semibold transition-colors truncate"
          title={t.otherAccounts}
        >
          <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <span className="truncate whitespace-nowrap">{t.otherAccounts}</span>
        </button>

        {/* Tam Ortadan Geçen Dikey Çizgi */}
        <div className="w-px h-5 bg-gray-300 flex-shrink-0"></div>

        {/* Sağ Buton: Hasap goş (İkon En Sonda) */}
        <button
          type="button"
          onClick={onOpenAddAccount}
          className="flex-1 h-full px-3 flex items-center justify-end space-x-1.5 text-xs text-gray-700 hover:text-blue-900 hover:bg-gray-100/70 font-semibold transition-colors truncate"
          title={t.addAccount}
        >
          <span className="truncate whitespace-nowrap">{t.addAccount}</span>
          <Plus className="w-4 h-4 text-gray-500 flex-shrink-0" />
        </button>
      </div>

      {/* 2. Middle Logo Area */}
      <div className="flex-1 flex items-center justify-center p-3 overflow-hidden">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleLogoUpload}
          accept="image/*"
          className="hidden"
        />
        <div
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-full min-h-[160px] max-h-[190px] rounded-xl bg-gray-50/60 hover:bg-gray-100/80 border border-gray-200 hover:border-blue-400 flex items-center justify-center cursor-pointer transition-all relative group overflow-hidden shadow-inner p-2"
          title={t.selectLogo}
        >
          {account?.logoUrl && !logoBroken ? (
            <img
              src={account.logoUrl}
              alt={account.name}
              onError={() => setLogoBroken(true)}
              className="w-full h-full object-contain drop-shadow-sm transition-transform duration-200 group-hover:scale-105"
            />
          ) : (
            <div className="flex flex-col items-center justify-center transition-colors">
              <img
                src={defaultLogo}
                alt="Biznes Hasap"
                className="w-20 h-20 object-contain mb-1"
              />
              <span className="text-[11px] font-medium text-gray-400 group-hover:text-blue-600">{t.selectLogo}</span>
            </div>
          )}

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-xl backdrop-blur-[1px]">
            <div className="bg-white/90 text-gray-800 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-md flex items-center space-x-1.5">
              <ImageIcon className="w-4 h-4 text-blue-600" />
              <span>{t.selectLogo}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom Company Name & CouchDB Info */}
      <div className="px-4 py-2.5 border-t border-gray-100 relative flex-shrink-0">
        <div className="flex items-center space-x-3">
          {/* Hamburger Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-1.5 text-gray-700 hover:bg-gray-100 rounded transition-colors"
            title="Menu"
          >
            <Menu className="w-5 h-5 text-gray-800" />
          </button>

          {/* Company and DB address */}
          <div className="flex-1 overflow-hidden">
            <div className="text-sm font-semibold text-gray-900 truncate">
              {account?.name || t.conn.noAccount}
            </div>
            <div className="text-[11px] text-gray-500 font-normal truncate border-b border-gray-200 pb-0.5 inline-block min-w-[120px]">
              {splitStoredAddress(account?.couchDbUrl || 'http://127.0.0.1:5984').address}
            </div>
          </div>
        </div>

        {/* Pop-up Menu */}
        {isMenuOpen && (
          <AccountContextMenu
            language={language}
            onEdit={onEditAccount}
            onDelete={onDeleteAccount}
            onImport={onImportData}
            onClose={() => setIsMenuOpen(false)}
          />
        )}
      </div>
    </div>
  );
};
