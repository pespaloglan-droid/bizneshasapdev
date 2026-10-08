// Electron main process - LisansYonetici GUI
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// Admin core (paylaşılan çekirdek - CLI ile ortak)
const licenseCore = require('../admin/core/license-core.js');

let mainWindow = null;
let locked = true; // Başlangıçta kilitli
let autoLockTimer = null;

// Güvenlik: ağ erişimi kapalı
app.commandLine.appendSwitch('disable-http-cache');
app.commandLine.appendSwitch('disable-web-security', 'false');

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 650,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      enableRemoteModule: false,
      sandbox: true
    },
    autoHideMenuBar: true,
    title: 'Lisans Yönetici'
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  
  // Production'da DevTools kapalı
  if (!process.env.DEV) {
    mainWindow.webContents.on('devtools-opened', () => {
      mainWindow.webContents.closeDevTools();
    });
  }

  mainWindow.on('closed', () => {
    if (autoLockTimer) clearTimeout(autoLockTimer);
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// Otomatik kilit (10 dakika inaktivite)
function resetAutoLock() {
  if (autoLockTimer) clearTimeout(autoLockTimer);
  if (!locked) {
    autoLockTimer = setTimeout(() => {
      locked = true;
      if (mainWindow) mainWindow.webContents.send('auto-locked');
    }, 10 * 60 * 1000);
  }
}

// IPC Handlers
ipcMain.handle('unlock', async (event, password) => {
  resetAutoLock();
  try {
    const result = await licenseCore.unlock(password);
    if (result.success) {
      locked = false;
      resetAutoLock();
    }
    return result;
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('check-root-exists', async () => {
  resetAutoLock();
  try {
    return await licenseCore.checkRootExists();
  } catch (err) {
    return { exists: false, error: err.message };
  }
});

ipcMain.handle('create-root', async (event, password) => {
  resetAutoLock();
  try {
    return await licenseCore.createRoot(password);
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('create-key', async (event, params) => {
  if (locked) return { success: false, error: 'Kilit açılmamış' };
  resetAutoLock();
  
  try {
    // params: { requestCode, days, platform }
    const result = await licenseCore.createKey({
      requestCode: params.requestCode,
      durationDays: params.days,
      plan: 99, // Özel plan (GUI her zaman özel gün sayısı kullanır)
      features: 0xFFFF, // Tüm özellikler açık
      maxRegisters: 1 // Varsayılan
    });
    
    return {
      success: true,
      key: result.key,
      metadata: {
        accountId: result.accountId,
        deviceAnchor: result.deviceAnchor,
        keyId: result.keyId,
        issuedAt: result.issuedAt,
        activateBy: result.activateBy,
        durationDays: result.durationDays,
        platform: params.platform
      }
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('decode-request', async (event, requestCode) => {
  if (locked) return { success: false, error: 'Kilit açılmamış' };
  resetAutoLock();
  
  try {
    const result = await licenseCore.decodeRequestCode(requestCode);
    return { success: true, ...result };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('list-keys', async (event, filters) => {
  if (locked) return { success: false, error: 'Kilit açılmamış' };
  resetAutoLock();
  
  try {
    const keys = await licenseCore.listKeys(filters);
    return { success: true, keys };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('inspect-key', async (event, keyString) => {
  if (locked) return { success: false, error: 'Kilit açılmamış' };
  resetAutoLock();
  
  try {
    const info = await licenseCore.inspectKey(keyString);
    return { success: true, info };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('get-lock-status', () => {
  return { locked };
});

// Kullanıcı aktivitesi her IPC çağrısında otomatik kilidi resetler (yukarıda)
