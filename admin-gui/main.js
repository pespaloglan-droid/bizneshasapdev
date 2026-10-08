const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// ── Kalıcı veri dizini ──────────────────────────────────────────────────────
// secret.key ve issued.json ASAR'ın DIŞINDA, kalıcı bir klasörde tutulur.
// Portable build temp'e extract edilir; kayıtların kaybolmaması için ilk
// çalıştırmada uygulama verisi klasörüne kopyalanır.
function prepareDataDir() {
  const dataDir = app.getPath('userData');

  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  const isDev = !app.isPackaged;
  const sourceDir = isDev
    ? path.join(__dirname, '../license-native/admin')
    : path.join(process.resourcesPath, 'license-native/admin');

  // secret.key ve issued.json yoksa kaynak klasöründen kopyala
  for (const fileName of ['secret.key', 'issued.json']) {
    const target = path.join(dataDir, fileName);
    const source = path.join(sourceDir, fileName);
    if (!fs.existsSync(target) && fs.existsSync(source)) {
      fs.copyFileSync(source, target);
      try { fs.chmodSync(target, 0o600); } catch (_) { /* Windows: desteklenmez */ }
    }
  }

  return dataDir;
}

const dataDir = prepareDataDir();
process.env.LICDATA_DIR = dataDir;

// Admin çekirdek modülleri (LICDATA_DIR yukarıda ayarlandıktan SONRA yüklenir)
const corePath = app.isPackaged
  ? path.join(process.resourcesPath, 'license-native/admin/core/license-core')
  : path.join(__dirname, '../license-native/admin/core/license-core');

const core = require(corePath);

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 820,
    height: 940,
    minWidth: 820,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    },
    autoHideMenuBar: true,
    resizable: true,
    title: 'Lisans Yönetici'
  });

  mainWindow.loadFile('renderer/index.html');

  // Üretim modunda DevTools kapat
  if (!process.env.DEBUG) {
    mainWindow.webContents.on('devtools-opened', () => {
      mainWindow.webContents.closeDevTools();
    });
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// ── IPC Handler'lar: Tüm kripto işlemleri main process'te ──────────────────

// Kilit aç
ipcMain.handle('unlock', async (_event, password) => {
  try {
    return core.unlock(password);
  } catch (err) {
    console.error('Unlock error:', err);
    return false;
  }
});

// Kilit kapa
ipcMain.handle('lock', async () => {
  try {
    core.lock();
    return true;
  } catch (err) {
    console.error('Lock error:', err);
    return false;
  }
});

// Kilit durumu
ipcMain.handle('is-unlocked', async () => {
  try {
    return core.isUnlocked();
  } catch (err) {
    return false;
  }
});

// İstek kodunu decode et
ipcMain.handle('decode-request', async (_event, code) => {
  try {
    return core.decodeRequest(code);
  } catch (err) {
    console.error('Decode error:', err);
    return { valid: false, error: String(err.message || err) };
  }
});

// Key oluştur
ipcMain.handle('create-key', async (_event, params) => {
  try {
    return core.createKey(params);
  } catch (err) {
    console.error('Create key error:', err);
    return { error: String(err.message || err) };
  }
});

// Kayıtları listele
ipcMain.handle('list-keys', async (_event, filter) => {
  try {
    return core.listKeys(filter || {});
  } catch (err) {
    console.error('List keys error:', err);
    return [];
  }
});

// Tüm kayıtları temizle
ipcMain.handle('clear-keys', async () => {
  try {
    return core.clearKeys();
  } catch (err) {
    console.error('Clear keys error:', err);
    return { error: String(err.message || err) };
  }
});

// Kök kodu hesap ID'den yeniden üret — deterministiktir, ilk key'den sonra da
// çalışır (müşteri ilk kodu kaybettiyse veya cihaz değişimi için gerektiğinde).
ipcMain.handle('generate-root-code', async (_event, accountId) => {
  try {
    const code = core.generateRootCode(String(accountId || '').trim());
    if (!code) return { error: 'Kök kod üretilemedi — hesap ID geçersiz olabilir' };
    return { rootCode: code };
  } catch (err) {
    console.error('Generate root code error:', err);
    return { error: String(err.message || err) };
  }
});

// Pencere kapanınca kilitle
app.on('before-quit', () => {
  try {
    core.lock();
  } catch (err) {
    // Sessiz hata - çıkışta sorun olmaz
  }
});
