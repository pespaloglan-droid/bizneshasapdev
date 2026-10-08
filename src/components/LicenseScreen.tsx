import React, { useState, useEffect } from 'react';
import type { LicenseInfo, LicenseStatus } from '../types/license';

const STATUS_MESSAGES: Record<LicenseStatus, string> = {
  1: 'Lisans aktif',
  0: 'Geçersiz lisans anahtarı',
  [-1]: 'Lisans süresi doldu',
  [-2]: 'Bu anahtar başka cihaza ait (rebind gerekli)',
  [-3]: 'Cihaz saati geri alınmış (clock-reset gerekli)',
  [-4]: 'Bu anahtar zaten kullanılmış',
  [-5]: 'Henüz aktivasyon yapılmamış',
  [-6]: 'Geçersiz giriş',
  [-7]: 'Anahtar geçersiz',
  [-8]: 'Anahtar farklı hesaba ait',
  [-9]: 'Depolama hatası',
  [-10]: 'Önce kök kodu gerekli',
  [-11]: 'Lisans dosyası bozulmuş'
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
      setMessage({ type: 'error', text: 'Lisans bilgileri yüklenemedi: ' + String(err) });
    }
  }

  function formatRequestCode(code: string): string {
    // 24 karakteri 6'lı gruplara böl: XXXX-XXXX-XXXX-XXXX-XXXX-XXXX
    return code.replace(/(.{4})/g, '$1-').replace(/-$/, '');
  }

  async function copyToClipboard(text: string, label: string) {
    if (!text) {
      setMessage({ type: 'error', text: 'Kopyalanacak içerik yok' });
      return;
    }
    try {
      // Electron ana süreç üzerinden kopyala (file:// context'inde
      // navigator.clipboard güvenlik kısıtlamalarına takılır).
      const ok = await window.electronAPI.copyToClipboard(text);
      if (ok === false) throw new Error('clipboard-write failed');
      setMessage({ type: 'success', text: `${label} kopyalandı` });
      setTimeout(() => setMessage(null), 2000);
    } catch {
      // Son çare: tarayıcı API'si + eski execCommand yöntemi
      try {
        await navigator.clipboard.writeText(text);
        setMessage({ type: 'success', text: `${label} kopyalandı` });
        setTimeout(() => setMessage(null), 2000);
      } catch {
        setMessage({ type: 'error', text: 'Kopyalama başarısız — metni elle seçebilirsiniz' });
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
          setMessage({ type: 'error', text: `Kök kodu hatalı (${rootStatus})` });
          setLoading(false);
          return;
        }
      }

      // Lisans anahtarını aktive et
      const status = await window.electronAPI.activateLicense(licenseId, licenseKey.trim());
      
      if (status === 1) {
        setMessage({ type: 'success', text: 'Lisans aktifleştirildi!' });
        await loadLicenseInfo();
        setTimeout(() => {
          if (onClose) onClose();
        }, 1000);
      } else {
        setMessage({ type: 'error', text: STATUS_MESSAGES[status as LicenseStatus] || `Hata: ${status}` });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Aktivasyon hatası: ' + String(err) });
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
            <h1 className="text-3xl font-bold text-gray-800">Lisans Yönetimi</h1>
            {/* Giriş yapılan hesabın adı — key hangi hesap için istendiğini belli eder (v3 §6) */}
            {accountName && (
              <p className="mt-1 text-sm font-medium text-gray-600">
                Hesap: <span className="font-bold text-gray-800">{accountName}</span>
              </p>
            )}
            {blockedRoute && (
              <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Dikkat:</strong> Bu işlem lisans gerektirir: {blockedRoute}
                </p>
              </div>
            )}
            {!blockedRoute && info && info.status === -5 && (
              <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  Lisans anahtarı almanız gerekir. Satış, alış, stok ve tüm işlemler lisansa bağlıdır.
                </p>
              </div>
            )}
          </div>

          {/* Status Badge */}
          {info && info.status !== -5 && (
            <div className="mb-6 flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(info.status)}`}></div>
              <span className="text-lg font-medium text-gray-700">
                {STATUS_MESSAGES[info.status]}
              </span>
              {info.status === 1 && info.daysLeft !== undefined && (
                <span className={`text-sm font-semibold ${getDaysLeftColor(info.daysLeft)}`}>
                  ({info.daysLeft} gün kaldı)
                </span>
              )}
            </div>
          )}

          {/* Account ID Card */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Hesap ID
            </label>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-lg font-mono text-lg text-gray-900 select-all">
                {accountId || 'Yükleniyor...'}
              </code>
              <button
                onClick={() => copyToClipboard(accountId, 'Hesap ID')}
                disabled={!accountId}
                className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Kopyala
              </button>
            </div>
          </div>

          {/* Request Code Card */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <label className="block text-sm font-semibold text-blue-800 mb-2">
              İstek Kodu (bize gönderin)
            </label>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-4 py-3 bg-white border border-blue-300 rounded-lg font-mono text-lg text-blue-900 select-all">
                {reqCode ? formatRequestCode(reqCode) : 'Yükleniyor...'}
              </code>
              <button
                onClick={() => copyToClipboard(reqCode, 'İstek Kodu')}
                disabled={!reqCode}
                className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Kopyala
              </button>
            </div>
            <p className="mt-2 text-xs text-blue-700">
              Bu kodu WhatsApp/Telegram ile gönderin. Size kök kod ve lisans anahtarı verilecek.
            </p>
          </div>

          {/* Kök Kodu — YALNIZCA gerektiğinde gösterilir.
              Hesap daha önce lisanslandıysa gizlenir; "Yeniden gir" ile açılabilir
              (cihaz değişimi / rebind durumunda gerekir). */}
          {needsRootCode && (
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Kök Kodu <span className="font-normal text-gray-500">(ilk kurulum)</span>
              </label>
              <input
                type="text"
                value={rootCode}
                onChange={(e) => setRootCode(e.target.value.toUpperCase())}
                placeholder="Kök kodunu buraya yapıştırın"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">
                107 karakter. Müşteriye ilk seferde verilir; sonraki yenilemelerde gerekmez.
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
                Kök kodu var mı / yeniden giriyorum
              </button>
            </div>
          )}

          {/* License Key Input */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Lisans Anahtarı
            </label>
            <textarea
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
              placeholder="Lisans anahtarını buraya yapıştırın"
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm resize-none"
            />
            <p className="mt-1 text-xs text-gray-500">
              160 karakter (6'lı gruplar halinde gelebilir)
            </p>
          </div>

          {/* Activate Button */}
          <button
            onClick={handleActivate}
            disabled={loading || !licenseKey.trim() || !accountId}
            className="w-full py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-bold text-lg"
          >
            {loading ? 'Aktifleştiriliyor...' : 'Aktifleştir'}
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
              <h3 className="font-bold text-green-800 mb-2">Aktif Lisans</h3>
              <div className="text-sm text-green-700 space-y-1">
                <p>
                  <strong>Son kullanma:</strong>{' '}
                  {new Date(info.expiry * 1000).toLocaleDateString('tr-TR')}
                </p>
                <p>
                  <strong>Kalan süre:</strong>{' '}
                  <span className={getDaysLeftColor(info.daysLeft)}>
                    {info.daysLeft} gün
                  </span>
                </p>
                {info.features !== undefined && (
                  <p>
                    <strong>Özellikler:</strong> 0x{info.features.toString(16).toUpperCase()}
                  </p>
                )}
                {info.maxRegisters !== undefined && info.maxRegisters > 0 && (
                  <p>
                    <strong>Maks. kasa sayısı:</strong> {info.maxRegisters}
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
