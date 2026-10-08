// Preload script - güvenli IPC köprüsü
const { contextBridge, ipcRenderer } = require('electron');

// Sadece izinli API'ler renderer'a açılır
contextBridge.exposeInMainWorld('licenseAPI', {
  // Kilit yönetimi
  unlock: (password) => ipcRenderer.invoke('unlock', password),
  checkRootExists: () => ipcRenderer.invoke('check-root-exists'),
  createRoot: (password) => ipcRenderer.invoke('create-root', password),
  getLockStatus: () => ipcRenderer.invoke('get-lock-status'),
  
  // Anahtar işlemleri
  createKey: (params) => ipcRenderer.invoke('create-key', params),
  decodeRequest: (requestCode) => ipcRenderer.invoke('decode-request', requestCode),
  listKeys: (filters) => ipcRenderer.invoke('list-keys', filters),
  inspectKey: (keyString) => ipcRenderer.invoke('inspect-key', keyString),
  
  // Otomatik kilit eventi
  onAutoLocked: (callback) => {
    ipcRenderer.on('auto-locked', callback);
  }
});
