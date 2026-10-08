import React, { useState } from 'react';
import { X, Plus, Building2 } from 'lucide-react';
import { Account, LanguageCode } from '../../types';
import { translations } from '../../locales/i18n';
import { ConnectionFields } from '../pos/ConnectionFields';
import { getAccountStoreKey } from '../../db/pouch';
import { loadConnection, saveConnection } from '../../db/connectionStore';

/** Hesap kaydedilmeden önce bağlantıların tutulduğu geçici anahtar. */
const DRAFT_KEY = '__new_account_draft__';

interface AddAccountModalProps {
  language: LanguageCode;
  onAddAccount: (account: Account) => void;
  onClose: () => void;
}

export const AddAccountModal: React.FC<AddAccountModalProps> = ({
  language,
  onAddAccount,
  onClose
}) => {
  const t = translations[language] || translations.en;
  const [name, setName] = useState('');
  const [couchDbUrl, setCouchDbUrl] = useState('http://127.0.0.1:5984');
  const [databaseName, setDatabaseName] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!databaseName || databaseName === name.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_db') {
      setDatabaseName(val.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_db');
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setLogoUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const accountId = `acc-${Date.now()}`;
    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]/g, '_') || 'store';

    // Taslak bağlantıları gerçek hesap kimliğine taşı (yeni hesap ekranında
    // girilen Local/Online adresleri kaybolmasın).
    const draft = loadConnection(DRAFT_KEY);
    if (draft.local || draft.online || draft.active) {
      saveConnection(accountId, draft);
    }

    // Lisans Hesap ID'si — hesapla birlikte BİR KEZ üretilir ve kalıcı saklanır
    // (spec v3 §3.3). Hesabın lisansı bu kimliğe bağlıdır.
    let licenseId: string | undefined;
    try {
      licenseId = (await window.electronAPI?.createLicenseId?.()) ?? undefined;
    } catch {
      licenseId = undefined;
    }

    const newAccount: Account = {
      id: accountId,
      name: name.trim(),
      couchDbUrl: couchDbUrl.trim() || 'http://127.0.0.1:5984',
      databaseName: databaseName.trim() || `${slug}_${accountId}_db`,
      logoUrl,
      users: [
        { id: `u-${Date.now()}`, name: 'ADMINISTRATOR', role: 'admin', hasPassword: false }
      ],
      createdAt: new Date().toISOString().split('T')[0],
      transactionCount: 0,
      ...(licenseId ? { licenseId } : {})
    };

    onAddAccount(newAccount);
    onClose();
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200 animate-in zoom-in-95 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gray-50/80 flex-shrink-0">
          <h3 className="text-sm font-bold text-gray-800 flex items-center space-x-2">
            <Plus className="w-4 h-4 text-blue-600" />
            <span>{t.addAccountTitle}</span>
          </h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700 rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tek sütun düzen: logo+hesap adı → alanlar → bağlantı → footer */}
        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
          <div className="p-4 space-y-3 overflow-y-auto flex-1 min-h-0">
            {/* Logo + Hesap Adı */}
            <div className="flex items-start space-x-3">
              <div className="flex flex-col items-center flex-shrink-0">
                <label className="relative cursor-pointer group">
                  <input type="file" onChange={handleLogoUpload} accept="image/*" className="hidden" />
                  <div className="w-14 h-14 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 group-hover:border-blue-500 flex items-center justify-center overflow-hidden transition-all shadow-inner">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center text-gray-400 group-hover:text-blue-600">
                        <Building2 className="w-5 h-5" />
                        <span className="text-[9px] font-bold mt-0.5">+</span>
                      </div>
                    )}
                  </div>
                  <div className="text-center mt-1 text-[10px] text-gray-500 font-medium">{t.selectLogo}</div>
                </label>
              </div>

              <div className="flex-1 min-w-0">
                <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">
                  {t.accountName} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="örn. LC Waikiki veya Acme Yazılım"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full h-8 px-2.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>
            </div>

            {/* CouchDB URL */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">
                {t.couchDbUrl}
              </label>
              <input
                type="text"
                value={couchDbUrl}
                onChange={(e) => setCouchDbUrl(e.target.value)}
                className="w-full h-8 px-2.5 border border-gray-300 rounded-lg text-xs font-mono text-gray-600 focus:outline-none focus:border-blue-600"
              />
            </div>

            {/* Veritabanı Adı */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">
                {t.databaseName}
              </label>
              <input
                type="text"
                value={databaseName}
                onChange={(e) => setDatabaseName(e.target.value)}
                className="w-full h-8 px-2.5 border border-gray-300 rounded-lg text-xs font-mono text-gray-600 focus:outline-none focus:border-blue-600"
              />
            </div>

            {/* CouchDB Bağlantısı — hesap kaydedilmeden önce test edilir.
                Bağlantılar taslak anahtarında tutulur, kayıt anında gerçek
                hesap kimliğine taşınır. */}
            <div className="pt-3 border-t border-gray-100 space-y-2">
              <div>
                <div className="text-[11px] font-bold text-gray-700">{t.conn.sectionTitle}</div>
                <div className="text-[10px] text-gray-400 leading-snug">{t.conn.sectionHint}</div>
              </div>
              <ConnectionFields
                accountId={DRAFT_KEY}
                storeDb={getAccountStoreKey({ id: DRAFT_KEY })}
                language={language}
                compact
              />
            </div>
          </div>

          {/* Footer Buttons — kaydırılan gövdeden ayrı, her zaman görünür */}
          <div className="flex items-center justify-end space-x-2 px-4 py-2.5 border-t border-gray-100 bg-gray-50/60 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-medium text-white bg-[#0e3860] hover:bg-[#0a2845] rounded-lg shadow-sm transition-all"
            >
              {t.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
