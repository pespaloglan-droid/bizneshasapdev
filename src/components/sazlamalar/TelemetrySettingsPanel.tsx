import { useState } from 'react';
import { useT } from '../../locales/LanguageContext';
import { analyticsConfigured, readTelemetryConsent, saveTelemetryConsent, type TelemetryConsent } from '../../utils/telemetry';
export function TelemetrySettingsPanel({ disabled = false }: { disabled?: boolean }) {
  const t = useT(); const [consent, setConsent] = useState(readTelemetryConsent); const [error, setError] = useState(false);
  function update(key: keyof TelemetryConsent, enabled: boolean) {
    try { const next = { ...consent, [key]: enabled }; saveTelemetryConsent(next); setConsent(next); setError(false); }
    catch { setError(true); }
  }
  return <section className="rounded-2xl bg-white border p-4 space-y-3">
    <h3 className="text-sm font-bold">{t('sazlamalar.telemetryTitle')}</h3>
    <p className="text-xs text-gray-500">{t('sazlamalar.telemetryHint')}</p>
    <label className="flex gap-2 text-sm"><input type="checkbox" disabled={disabled} checked={consent.analytics} onChange={e => update('analytics', e.target.checked)} />{t('sazlamalar.telemetryAnalytics')}</label>
    <label className="flex gap-2 text-sm"><input type="checkbox" disabled={disabled} checked={consent.crashes} onChange={e => update('crashes', e.target.checked)} />{t('sazlamalar.telemetryCrashes')}</label>
    {!analyticsConfigured() && <p className="text-xs text-gray-500">{t('sazlamalar.telemetryNotConfigured')}</p>}
    {error && <p role="alert" className="text-xs text-red-600">{t('errors.generic')}</p>}
  </section>;
}
