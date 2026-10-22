const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  setCrashReportingConsent: (enabled) => ipcRenderer.invoke('telemetry-crash-consent', enabled),
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  enterFullscreen: () => ipcRenderer.send('window-enter-fullscreen'),
  restoreCompact: () => ipcRenderer.send('window-restore-compact'),

  // Sazlamalar — printer
  listPrinters: () => ipcRenderer.invoke('printer-list'),
  printTestPage: (options) => ipcRenderer.invoke('printer-print-test', options),

  // Sazlamalar — terezi (hazirlikce placeholder)
  getScaleStatus: () => ipcRenderer.invoke('scale-status'),

  // Hasaplama — hasabat çapy
  printHtml: (options) => ipcRenderer.invoke('print-html', options),

  // F11 — faktura Excel eksporty (kayıt penjiresi + faýl ýazmak)
  saveFileAs: (options) => ipcRenderer.invoke('save-file-as', options),

  // Lisans — hesap bazlı (spec v3 §4).
  // licenseId = giriş yapılan hesabın kalıcı Hesap ID'si.
  getLicenseInfo: (licenseId) => ipcRenderer.invoke('license-info', licenseId),
  getLicenseRequestCode: (licenseId) => ipcRenderer.invoke('license-request-code', licenseId),
  createLicenseId: () => ipcRenderer.invoke('license-create-id'),
  setLicenseRoot: (licenseId, code) => ipcRenderer.invoke('license-set-root', licenseId, code),
  activateLicense: (licenseId, key) => ipcRenderer.invoke('license-activate', licenseId, key),
  deriveLicenseKey: (licenseId, purpose) => ipcRenderer.invoke('license-derive-key', licenseId, purpose),
  selectLicenseAccount: (licenseId) => ipcRenderer.invoke('license-select-account', licenseId),

  // Lisans kapısı — renderer native modülü yükleyemediği için ana süreçte
  // gate kontrolü yapılır, sonuç buradan döner (spec B.2/B.3).
  guardLicense: (moduleName, licenseId) => ipcRenderer.invoke('license-guard', moduleName, licenseId),

  // Pano — Electron file:// context'inde navigator.clipboard çalışmaz
  copyToClipboard: (text) => ipcRenderer.invoke('clipboard-write', text),

  // Yeni mağaza DB'sini yerel CouchDB'de otomatik açma (yalnız PC, loopback)
  provisionCouchDb: (dbName, serverUrl) => ipcRenderer.invoke('couch-provision-db', dbName, serverUrl)
});
