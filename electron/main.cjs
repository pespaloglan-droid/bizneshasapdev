const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

const IS_PRODUCTION = !process.env.NODE_ENV || process.env.NODE_ENV === 'production' || app.isPackaged;

/**
 * Production'da hassas bilgileri hata mesajlarından temizler.
 * Spec FAZ 1.3: Şema/adres/kimlik bilgisi sızıntısını engelle.
 */
function redactSecrets(message) {
  if (!IS_PRODUCTION) return message; // Dev'de tam hata göster
  
  let cleaned = String(message);
  
  // URL'deki kimlik bilgilerini temizle: http://user:pass@host → http://***@host
  cleaned = cleaned.replace(/(:\/\/)[^:@\/]+:[^@\/]+@/g, '$1***:***@');
  
  // IP adresleri: 192.168.1.100 → ***.***.***.***
  cleaned = cleaned.replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '***.***.***.***');
  
  // Port numaraları: :5984 → :****
  cleaned = cleaned.replace(/:\d{4,5}\b/g, ':****');
  
  // Veritabanı adları: /db_name → /***
  cleaned = cleaned.replace(/\/[a-z0-9_-]{3,}/gi, '/***');
  
  // Dosya yolları: C:\Users\... → C:\***
  cleaned = cleaned.replace(/[A-Z]:\\[^\s]*/gi, 'C:\\***');
  cleaned = cleaned.replace(/\/home\/[^\s]*/gi, '/home/***');
  
  return cleaned;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Tek örnek kilidi
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  function createWindow() {
    mainWindow = new BrowserWindow({
      width: 780,
      height: 425,
      minWidth: 760,
      minHeight: 410,
      resizable: true,
      center: true,
      frame: false,
      backgroundColor: '#ffffff',
      show: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.cjs')
      },
      title: 'Biznes Hasap'
    });

    const isDev = process.env.NODE_ENV === 'development' && !app.isPackaged;

    if (isDev) {
      mainWindow.loadURL('http://localhost:5173');
    } else {
      mainWindow.loadFile(path.join(__dirname, '../dist/index.html')).catch((err) => {
        console.error('Failed to load file:', err);
      });
    }

    // Window Controls IPC
    ipcMain.on('window-minimize', () => mainWindow?.minimize());
    ipcMain.on('window-maximize', () => {
      if (mainWindow?.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow?.maximize();
      }
    });
    ipcMain.on('window-close', () => mainWindow?.close());

    // Full Screen / Mode Switch IPC
    ipcMain.on('window-enter-fullscreen', () => {
      mainWindow?.setResizable(true);
      mainWindow?.maximize();
    });

    ipcMain.on('window-restore-compact', () => {
      if (mainWindow?.isMaximized()) {
        mainWindow.unmaximize();
      }
      mainWindow?.setSize(780, 425);
      mainWindow?.center();
    });
  }

  app.whenReady().then(() => {
    // ── Lisans IPC ──────────────────────────────────────────────
    const native = require('../license-native/native.js');
    const gate = require('../license-native/gate.js');
    const licenseDir = path.join(app.getPath('userData'), 'license');

    // setDataDir EN ÖNCE çağrılmalı
    native.setDataDir(licenseDir);

    // ── Seçili hesabın lisans kimliği (spec v3 §3.3) ─────────────────────
    let selectedLicenseId = null;

    const LICENSE_ID_RE = /^[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{2}$/;

    function isValidLicenseId(id) {
      return typeof id === 'string' && LICENSE_ID_RE.test(id.trim());
    }

    function normalizeLicenseId(id) {
      if (!isValidLicenseId(id)) return null;
      return id.trim().toUpperCase();
    }

    function requireSelectedLicenseId() {
      return selectedLicenseId;
    }

    // guardedIPC: Tüm veri kanallarını lisans kontrolü ile korur
    function guardedIPC(channel, moduleBit, handler) {
      ipcMain.handle(channel, async (event, ...args) => {
        const accountId = requireSelectedLicenseId();
        if (!accountId) {
          const err = new Error('LICENSE_REQUIRED: No account selected');
          err.code = 'LICENSE_REQUIRED';
          throw err;
        }

        gate.selectAccount(accountId);
        const g = gate.guard(moduleBit);

        if (!g.allowed) {
          const err = new Error('LICENSE_REQUIRED: ' + g.reason);
          err.code = 'LICENSE_REQUIRED';
          err.reason = g.reason;
          err.status = g.status;
          throw err;
        }

        return handler(event, ...args);
      });
    }

    // ── Sazlamalar: printer IPC ──────────────────────────────────
    guardedIPC('printer-list', gate.MOD.AYARLAR, async () => {
      try {
        if (!mainWindow) return [];
        const printers = await mainWindow.webContents.getPrintersAsync();
        return printers.map((printer) => ({
          name: printer.name,
          displayName: printer.displayName || printer.name,
          isDefault: Boolean(printer.isDefault),
          status: printer.status
        }));
      } catch (err) {
        console.error('printer-list failed:', err);
        return [];
      }
    });

    guardedIPC('printer-print-test', gate.MOD.AYARLAR, async (_event, options) => {
      const opts = options || {};
      const deviceName = opts.deviceName || undefined;
      const widthMicrons = opts.paperWidth === '58mm' ? 58000 : 80000;
      let testWindow;

      try {
        testWindow = new BrowserWindow({
          show: false,
          webPreferences: { sandbox: true, contextIsolation: true }
        });

        const html = `<!doctype html><html><head><meta charset="utf-8"><style>
          *{margin:0;padding:0;box-sizing:border-box}
          body{font-family:'Courier New',monospace;padding:6px;color:#000;background:#fff}
          .c{text-align:center}.b{font-weight:700}
          .hr{border-top:1px dashed #000;margin:6px 0}
          h1{font-size:15px;margin-bottom:4px}p{font-size:11px;line-height:1.45}
        </style></head><body>
          <div class="c b"><h1>${escapeHtml(opts.companyName || 'BIZNES HASAP')}</h1></div>
          <div class="hr"></div>
          <div class="c"><p class="b">SYNAG ÇAP</p><p>${escapeHtml(new Date().toLocaleString('tr-TR'))}</p></div>
          <div class="hr"></div>
          <p>Printer: ${escapeHtml(deviceName || 'Default')}</p>
          <p>Kagyz: ${escapeHtml(opts.paperWidth || '80mm')}</p>
          <p>Baglanyşyk: ${escapeHtml(opts.connection || 'usb')}</p>
          <div class="hr"></div>
          <div class="c"><p class="b">Baglanyşyk üstünlikli!</p></div>
          <div class="hr"></div>
          <div class="c"><p>Sag boluň!</p></div>
        </body></html>`;

        await testWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));

        return await new Promise((resolve) => {
          testWindow.webContents.print(
            {
              silent: true,
              deviceName,
              margins: { marginType: 'none' },
              pageSize: { width: widthMicrons, height: 200000 }
            },
            (success, failureReason) => resolve({ success, failureReason: redactSecrets(failureReason || '') })
          );
        });
      } catch (err) {
        return { success: false, failureReason: redactSecrets(String((err && err.message) || err)) };
      } finally {
        if (testWindow && !testWindow.isDestroyed()) testWindow.close();
      }
    });

    // Terezi: seriýa port goldawy henüz ýok
    ipcMain.handle('scale-status', async () => ({
      connected: false,
      message: 'Terezi bilen göni aragatnaşyk häzirlikçe ýok (seriýa port goldawy goşulmaly).'
    }));

    // F11 — faktura/kassa Excel eksporty üçin "Sakla" diýalogy
    guardedIPC('save-file-as', gate.MOD.RAPOR, async (_event, options) => {
      const opts = options || {};
      try {
        const result = await dialog.showSaveDialog(mainWindow, {
          title: String(opts.title || 'Faýl sakla'),
          defaultPath: String(opts.defaultName || 'faýl'),
          filters: Array.isArray(opts.filters)
            ? opts.filters
            : [{ name: 'Ähli faýllar', extensions: ['*'] }]
        });
        if (!result.filePath || !result.filePath.trim()) return { saved: false, canceled: true };
        const data = Buffer.from(String(opts.data || ''), 'base64');
        fs.writeFileSync(result.filePath, data);
        return { saved: true, path: result.filePath };
      } catch (err) {
        return { saved: false, canceled: false, error: redactSecrets(String((err && err.message) || err)) };
      }
    });

    // Hasaplama: taýýar HTML hasabatyny sessiz çap etmek
    guardedIPC('print-html', gate.MOD.RAPOR, async (_event, options) => {
      const opts = options || {};
      const widthMicrons = opts.paperWidth === '58mm' ? 58000 : 80000;
      const pageSize = opts.pageSize === 'A4' ? 'A4' : { width: widthMicrons, height: 200000 };
      let reportWindow;

      try {
        reportWindow = new BrowserWindow({
          show: false,
          webPreferences: { sandbox: true, contextIsolation: true }
        });
        await reportWindow.loadURL(
          'data:text/html;charset=utf-8,' + encodeURIComponent(String(opts.html || ''))
        );
        return await new Promise((resolve) => {
          reportWindow.webContents.print(
            {
              silent: true,
              deviceName: opts.deviceName || undefined,
              margins: { marginType: 'none' },
              pageSize,
              landscape: Boolean(opts.landscape)
            },
            (success, failureReason) => resolve({ success, failureReason: redactSecrets(failureReason || '') })
          );
        });
      } catch (err) {
        return { success: false, failureReason: redactSecrets(String((err && err.message) || err)) };
      } finally {
        if (reportWindow && !reportWindow.isDestroyed()) reportWindow.close();
      }
    });

    // Pano — renderer'da navigator.clipboard file:// context'inde çalışmaz
    ipcMain.handle('clipboard-write', async (_event, text) => {
      try {
        const { clipboard } = require('electron');
        clipboard.writeText(String(text == null ? '' : text));
        return true;
      } catch (err) {
        return false;
      }
    });

    // Hesap bazlı lisans IPC'leri (spec v3 §4)
    ipcMain.handle('license-info', async (_e, licenseId) => {
      try {
        const accountId = normalizeLicenseId(licenseId);
        if (!accountId) {
          return { status: -9, error: 'Geçersiz hesap kimliği', accountId: '' };
        }
        const info = native.checkLicense(accountId);
        return { ...info, accountId };
      } catch (err) {
        return { status: -9, error: redactSecrets(String(err)), accountId: '' };
      }
    });

    ipcMain.handle('license-request-code', async (_e, licenseId) => {
      try {
        const accountId = normalizeLicenseId(licenseId);
        if (!accountId) return null;
        return native.getRequestCode(accountId);
      } catch {
        return null;
      }
    });

    ipcMain.handle('license-create-id', async () => {
      try {
        return native.createAccountId();
      } catch {
        return null;
      }
    });

    ipcMain.handle('license-set-root', async (_e, licenseId, rootCode) => {
      try {
        const accountId = normalizeLicenseId(licenseId);
        if (!accountId) return -9;
        return native.setRootCode(accountId, String(rootCode || ''));
      } catch {
        return -9;
      }
    });

    ipcMain.handle('license-activate', async (_e, licenseId, key) => {
      try {
        const accountId = normalizeLicenseId(licenseId);
        if (!accountId) return -9;
        return native.activate(accountId, String(key || ''));
      } catch {
        return -9;
      }
    });

    ipcMain.handle('license-derive-key', async (_e, licenseId, purpose) => {
      try {
        const accountId = normalizeLicenseId(licenseId);
        if (!accountId) return null;
        return native.deriveKey(accountId, String(purpose || ''));
      } catch {
        return null;
      }
    });

    ipcMain.handle('license-select-account', async (_e, licenseId) => {
      const accountId = normalizeLicenseId(licenseId);
      selectedLicenseId = accountId;
      return accountId;
    });

    ipcMain.handle('license-guard', async (_e, moduleName, licenseId) => {
      try {
        const accountId = normalizeLicenseId(licenseId);
        if (!accountId) {
          return { allowed: false, reason: 'NO_ACCOUNT', status: -5 };
        }
        gate.selectAccount(accountId);
        const moduleMap = {
          'checkout': gate.MOD.SATIS,
          'purchase': gate.MOD.ALIS,
          'stock': gate.MOD.STOK,
          'register': gate.MOD.KASA,
          'customer': gate.MOD.MUSTERI,
          'supplier': gate.MOD.TEDARIKCI,
          'reports': gate.MOD.RAPOR,
          'pricing': gate.MOD.FIYAT,
          'settings': gate.MOD.AYARLAR,
          'backup': gate.MOD.YEDEK,
          'users': gate.MOD.KULLANICI,
        };
        const moduleBit = moduleMap[moduleName] || 0;
        return gate.guard(moduleBit);
      } catch (err) {
        return { allowed: false, reason: 'ERROR', status: -9, error: redactSecrets(String(err)) };
      }
    });

    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
