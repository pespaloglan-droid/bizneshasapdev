const { contextBridge, ipcRenderer } = require('electron');

// Renderer'a sadece izinli API'ler
contextBridge.exposeInMainWorld('adminApi', {
  // Kilit işlemleri
  unlock: (password) => ipcRenderer.invoke('unlock', password),
  lock: () => ipcRenderer.invoke('lock'),
  isUnlocked: () => ipcRenderer.invoke('is-unlocked'),
  
  // Key işlemleri
  decodeRequest: (code) => ipcRenderer.invoke('decode-request', code),
  createKey: (params) => ipcRenderer.invoke('create-key', params),
  listKeys: (filter) => ipcRenderer.invoke('list-keys', filter),
  clearKeys: () => ipcRenderer.invoke('clear-keys'),
  generateRootCode: (accountId) => ipcRenderer.invoke('generate-root-code', accountId)
});
