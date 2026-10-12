'use strict';
const fs = require('node:fs');
const path = require('node:path');
/** Sentry olayları yalnızca sabit hata kodları taşır: stack/user/request/context yok. */
function sanitizeEvent(event, enabled) {
  if (!enabled) return null;
  return { event_id: event.event_id, timestamp: event.timestamp, platform: 'javascript', level: 'error',
    message: event.message === 'renderer_process_gone' ? 'renderer_process_gone' : 'main_process_exception' };
}
function setupCrashReporting({ app, ipcMain, getWindow, dsn }) {
  const consentFile = path.join(app.getPath('userData'), 'telemetry-consent.json');
  let consent = false; let sdk = null;
  try { consent = JSON.parse(fs.readFileSync(consentFile, 'utf8')).crashes === true; } catch {}
  function configured() { try { const url = new URL(dsn); return url.protocol === 'https:' && Boolean(url.username) && !url.password && /^\/\d+$/.test(url.pathname); } catch { return false; } }
  function capture(code) { if (consent && sdk) sdk.captureMessage(code, 'error'); }
  function exception() { capture('main_process_exception'); }
  function rendererGone() { capture('renderer_process_gone'); }
  function apply() {
    if (!consent || !configured()) { if (sdk) { void sdk.close(0); sdk = null; } return; }
    if (sdk) return;
    try {
      sdk = require('@sentry/electron/main');
      sdk.init({ dsn, sendDefaultPii: false, defaultIntegrations: false, autoSessionTracking: false,
        beforeSend: event => sanitizeEvent(event, consent), beforeBreadcrumb: () => null });
    } catch { sdk = null; }
  }
  apply();
  process.on('uncaughtExceptionMonitor', exception);
  app.on('render-process-gone', rendererGone);
  ipcMain.handle('telemetry-crash-consent', async (event, enabled) => {
    const window = getWindow();
    if (!window || event.sender !== window.webContents || event.senderFrame !== window.webContents.mainFrame || typeof enabled !== 'boolean') throw new Error('INVALID_TELEMETRY_REQUEST');
    // Önce disk: kayıt başarısızsa onay verildi kabul edilmez.
    fs.mkdirSync(path.dirname(consentFile), { recursive: true });
    fs.writeFileSync(consentFile, JSON.stringify({ crashes: enabled }), { mode: 0o600 });
    consent = enabled; apply(); return { enabled: consent, configured: configured() };
  });
  app.once('before-quit', () => {
    process.removeListener('uncaughtExceptionMonitor', exception); app.removeListener('render-process-gone', rendererGone);
  });
}
module.exports = { setupCrashReporting, sanitizeEvent };
