import React, { useEffect, useState } from 'react';
import { isNative } from '../../utils/platform';
import { useT } from '../../locales/LanguageContext';
import { checkMobileUpdate, type MobileUpdate } from '../../utils/mobileUpdates';
/** Notification only: never installs, downloads silently, or bypasses Android. */
export const MobileUpdateNotice: React.FC = () => {
  const t = useT(); const [update, setUpdate] = useState<MobileUpdate | null>(null); const [error, setError] = useState(false);
  useEffect(() => {
    if (!isNative()) return;
    let cancelled = false; const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 12000);
    void (async () => {
      const { App } = await import('@capacitor/app');
      const installed = await App.getInfo();
      const key = `bh.mobile.release.checked.${installed.version}`;
      const last = Number(localStorage.getItem(key) || 0);
      if (Date.now() - last < 24*60*60*1000) return;
      const available = await checkMobileUpdate(installed.version, controller.signal);
      if (cancelled) return;
      // Cache only a successful response; offline is not "up to date".
      if (!available) localStorage.setItem(key, String(Date.now()));
      setUpdate(available);
    })().catch(() => { if (!cancelled) console.warn('MOBILE_RELEASE_CHECK_UNAVAILABLE'); })
      .finally(() => window.clearTimeout(timeout));
    return () => { cancelled = true; controller.abort(); window.clearTimeout(timeout); };
  }, []);
  if (!update) return null;
  const download = async () => {
    try { const { Browser } = await import('@capacitor/browser'); await Browser.open({ url: update.downloadUrl }); }
    catch { setError(true); }
  };
  return <aside role="status" className="p-3 flex flex-wrap gap-3 items-center bg-blue-50 border-b text-sm">
    <span className="flex-1">{t('mobile.updateAvailable', { version: update.version })}</span>
    <button onClick={() => void download()} className="font-bold underline">{t('mobile.updateDownload')}</button>
    <button onClick={() => setUpdate(null)}>{t('backup.dismiss')}</button>
    {error && <span role="alert">{t('mobile.updateFailed')}</span>}
  </aside>;
};
