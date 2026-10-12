import React, { useState, useEffect } from 'react';
import type { LicenseInfo, LicenseStatus } from '../types/license';
import { localeFor } from '../utils/locale';
import { useLanguage, useT } from '../locales/LanguageContext';

const STATUS_KEYS: Record<LicenseStatus, string> = {
  1: 'license.statusActive',
  0: 'license.statusInvalidKey',
  [-1]: 'license.statusExpired',
  [-2]: 'license.statusOtherDevice',
  [-3]: 'license.statusClockReset',
  [-4]: 'license.statusUsed',
  [-5]: 'license.statusNotActivated',
  [-6]: 'license.statusInvalidInput',
  [-7]: 'license.statusKeyInvalid',
  [-8]: 'license.statusOtherAccount',
  [-9]: 'license.statusStorage',
  [-10]: 'license.statusRootRequired',
  [-11]: 'license.statusFileCorrupt'
};

interface LicenseScreenProps {
  /**
   * Giriş yapılan hesabın kalıcı Hesap ID'si (spec v3 §6). Bu hesaba ait
   * Hesap ID ve İstek Kodu gösterilir. Boşsa main süreçteki yedeğe düşülür.
   */
  licenseId?: string;
  /** Giriş yapılan hesabın adı — ekranda hangi hesap için key istendiğini belli eder. */
  accountName?: string;
  onClose?: () => void;
  blockedRoute?: string;
}

export default function LicenseScreen({ licenseId, accountName, onClose, blockedRoute }: LicenseScreenProps) {
  const { language } = useLanguage();
  const t = useT();
  const [accountId, setAccountId] = useState<string>('');
  const [reqCode, setReqCode] = useState<string>('');
  const [rootCode, setRootCode] = useState<string>('');
  const [licenseKey, setLicenseKey] = useState<string>('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [info, setInfo] = useState<LicenseInfo | null>(null);
  const [loading, setLoading] = useState(false);
  /** Kök kod alanı kullanıcı tarafından açıldı mı? (yeniden giriş / rebind) */
  const [showRootCode, setShowRootCode] = useState(false);

  /**
   * Kök kod alanı yalnızca hesabın henüz lisansı yokken zorunlu gösterilir.
   * Hesap zaten lisanslıysa gizlenir — yenilemede kullanıcı yalnızca anahtar girer.
   */
  const needsRootCode = showRootCode || !info || info.status === -5;

  useEffect(() => {
    loadLicenseInfo();
    // Hesap değişirse ekran yeniden yüklenir
  }, [licenseId]);

  async function loadLicenseInfo() {
    try {
      const data = await window.electronAPI.getLicenseInfo(licenseId);
      setInfo(data);
      setAccountId(data.accountId || '');

      if (data.accountId) {
        const code = await window.electronAPI.getLicenseRequestCode(licenseId);
        setReqCode(code || '');
      }
    } catch (err) {
      setMessage({ type: 'error', text: t('license.loadFailed', { error: String(err) }) });
    }
  }

  function formatRequestCode(code: string): string {
    // 24 karakteri 6'lı gruplara böl: XXXX-XXXX-XXXX-XXXX-XXXX-XXXX
    return code.replace(/(.{4})/g, '$1-').replace(/-$/, '');
  }

  async function copyToClipboard(text: string, label: string) {
    if (!text) {
      setMessage({ type: 'error', text: t('license.nothingToCopy') });
      return;
    }
    try {
      // Electron ana süreç üzerinden kopyala (file:// context'inde
      // navigator.clipboard güvenlik kısıtlamalarına takılır).
      const ok = await window.electronAPI.copyToClipboard(text);
      if (ok === false) throw new Error('clipboard-write failed');
      setMessage({ type: 'success', text: t('license.copied', { label }) });
      setTimeout(() => setMessage(null), 2000);
    } catch {
      // Son çare: tarayıcı API'si + eski execCommand yöntemi
      try {
        await navigator.clipboard.writeText(text);
        setMessage({ type: 'success', text: t('license.copied', { label }) });
        setTimeout(() => setMessage(null), 2000);
      } catch {
        setMessage({ type: 'error', text: t('license.copyFailed') });
      }
    }
  }

  async function handleActivate() {
    setLoading(true);
    setMessage(null);

    try {
      // İlk kullanımda kök kod gerekli
      if (rootCode.trim()) {
        const rootStatus = await window.electronAPI.setLicenseRoot(licenseId, rootCode.trim());
        if (rootStatus !== 1) {
          setMessage({ type: 'error', text: t('license.rootInvalid', { status: rootStatus }) });
          setLoading(false);
          return;
        }
      }

      // Lisans anahtarını aktive et
      const status = await window.electronAPI.activateLicense(licenseId, licenseKey.trim());
      
      if (status === 1) {
        setMessage({ type: 'success', text: t('license.activated') });
        await loadLicenseInfo();
        setTimeout(() => {
          if (onClose) onClose();
        }, 1000);
      } else {
        setMessage({ type: 'error', text: STATUS_KEYS[status as LicenseStatus] ? t(STATUS_KEYS[status as LicenseStatus]) : t('license.errorFallback', { status }) });
      }
    } catch (err) {
      setMessage({ type: 'error', text: t('license.activationError', { error: String(err) }) });
    } finally {
      setLoading(false);
    }
  }

  function getStatusColor(status?: LicenseStatus): string {
    if (!status) return 'bg-gray-500';
    if (status === 1) return 'bg-green-500';
    if (status === -1 || status === -2 || status === -3) return 'bg-red-500';
    if (status === -5 || status === -10) return 'bg-yellow-500';
    return 'bg-red-500';
  }

  function getDaysLeftColor(days?: number): string {
    if (!days || days < 0) return 'text-red-600';
    if (days <= 3) return 'text-yellow-600';
    return 'text-green-600';
  }

  return (
    <div className="fixed inset-0 z-[999] overflow-y-auto bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6">
      <div className="min-h-full flex items-start justify-center py-4">
        <div className="max-w-3xl w-full">
          <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8">
          {/* Header */}
          <div className="border-b pb-4 mb-6">
            <h1 className="text-3xl font-bold text-gray-800">{t('license.title')}</h1>
            {/* Giriş yapılan hesabın adı — key hangi hesap için istendiğini belli eder (v3 §6) */}
            {accountName && (
              <p className="mt-1 text-sm font-medium text-gray-600">
                {t('license.account')} <span className="font-bold text-gray-800">{accountName}</span>
              </p>
            )}
            {blockedRoute && (
              <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <strong>{t('license.attention')}</strong> {t('license.needLicense', { route: blockedRoute })}
                </p>
              </div>
            )}
            {!blockedRoute && info && info.status === -5 && (
              <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  {t('license.needKeyInfo')}
                </p>
              </div>
            )}
          </div>

          {/* Status Badge */}
          {info && info.status !== -5 && (
            <div className="mb-6 flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(info.status)}`}></div>
              <span className="text-lg font-medium text-gray-700">
                {t(STATUS_KEYS[info.status])}
              </span>
              {info.status === 1 && info.daysLeft !== undefined && (
                <span className={`text-sm font-semibold ${getDaysLeftColor(info.daysLeft)}`}>
                  {t('license.daysLeft', { days: info.daysLeft })}
                </span>
              )}
            </div>
          )}

          {/* Account ID Card */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t('license.accountId')}
            </label>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-lg font-mono text-lg text-gray-900 select-all">
                {accountId || t('license.loading')}
              </code>
              <button
                onClick={() => copyToClipboard(accountId, t('license.accountId'))}
                disabled={!accountId}
                className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {t('license.copy')}
              </button>
            </div>
          </div>

          {/* Request Code Card */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <label className="block text-sm font-semibold text-blue-800 mb-2">
              {t('license.requestCode')}
            </label>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-4 py-3 bg-white border border-blue-300 rounded-lg font-mono text-lg text-blue-900 select-all">
                {reqCode ? formatRequestCode(reqCode) : t('license.loading')}
              </code>
              <button
                onClick={() => copyToClipboard(reqCode, t('license.requestCode'))}
                disabled={!reqCode}
                className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {t('license.copy')}
              </button>
            </div>
            <p className="mt-2 text-xs text-blue-700">
              {t('license.requestCodeHint')}
            </p>
          </div>

          {/* Kök Kodu — YALNIZCA gerektiğinde gösterilir.
              Hesap daha önce lisanslandıysa gizlenir; "Yeniden gir" ile açılabilir
              (cihaz değişimi / rebind durumunda gerekir). */}
          {needsRootCode && (
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t('license.rootCode')} <span className="font-normal text-gray-500">{t('license.rootCodeFirstSetup')}</span>
              </label>
              <input
                type="text"
                value={rootCode}
                onChange={(e) => setRootCode(e.target.value.toUpperCase())}
                placeholder={t('license.rootCodePlaceholder')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">
                {t('license.rootCodeHint')}
              </p>
            </div>
          )}

          {!needsRootCode && (
            <div className="mb-4">
              <button
                type="button"
                onClick={() => setShowRootCode(true)}
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                {t('license.rootCodeReenter')}
              </button>
            </div>
          )}

          {/* License Key Input */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t('license.licenseKey')}
            </label>
            <textarea
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
              placeholder={t('license.licenseKeyPlaceholder')}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm resize-none"
            />
            <p className="mt-1 text-xs text-gray-500">
              {t('license.licenseKeyHint')}
            </p>
          </div>

          {/* Activate Button */}
          <button
            onClick={handleActivate}
            disabled={loading || !licenseKey.trim() || !accountId}
            className="w-full py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-bold text-lg"
          >
            {loading ? t('license.activating') : t('license.activate')}
          </button>

          {/* Message */}
          {message && (
            <div
              className={`mt-4 p-4 rounded-lg ${
                message.type === 'success'
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}
            >
              <p className="font-medium">{message.text}</p>
            </div>
          )}

          {/* License Info (if active) */}
          {info && info.status === 1 && info.expiry && (
            <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="font-bold text-green-800 mb-2">{t('license.activeLicense')}</h3>
              <div className="text-sm text-green-700 space-y-1">
                <p>
                  <strong>{t('license.expiry')}</strong>{' '}
                  {new Date(info.expiry * 1000).toLocaleDateString(localeFor(language))}
                </p>
                <p>
                  <strong>{t('license.remaining')}</strong>{' '}
                  <span className={getDaysLeftColor(info.daysLeft)}>
                    {t('license.days', { days: info.daysLeft ?? 0 })}
                  </span>
                </p>
                {info.features !== undefined && (
                  <p>
                    <strong>{t('license.features')}</strong> 0x{info.features.toString(16).toUpperCase()}
                  </p>
                )}
                {info.maxRegisters !== undefined && info.maxRegisters > 0 && (
                  <p>
                    <strong>{t('license.maxRegisters')}</strong> {info.maxRegisters}
                  </p>
                )}
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
