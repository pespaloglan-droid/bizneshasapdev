'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { load } = require('js-yaml');

const FIRST_CHECK_MS = 10_000;
const CHECK_INTERVAL_MS = 5 * 60_000;

function validateUpdateConfig(config) {
  const publishers = typeof config?.publisherName === 'string'
    ? [config.publisherName] : config?.publisherName;
  if (config?.provider !== 'github' || config.owner !== 'pespaloglan-droid' ||
      config.repo !== 'bizneshasapdev' || !Array.isArray(publishers) ||
      publishers.length === 0 || !publishers.every((name) => typeof name === 'string' && name.trim())) {
    throw new Error('Güncelleme sağlayıcısı veya imza sahibi yapılandırması geçersiz; güncelleme kapatıldı.');
  }
}

/** Yalnızca imzalı, kurulu Windows sürümü. Renderer'a yeni bir IPC yetkisi verilmez. */
function startAutoUpdates({ app, dialog, getWindow, redactSecrets, updatesEnabled }) {
  if (!app.isPackaged || process.platform !== 'win32' || updatesEnabled !== true ||
      process.env.PORTABLE_EXECUTABLE_FILE || process.env.PORTABLE_EXECUTABLE_DIR) {
    return () => {};
  }

  const logError = (error) => console.warn('[Güncelleme]', redactSecrets(String(error)));
  let autoUpdater;
  try {
    // İmzasız/eksik publisher bilgisine sessizce düşülmez.
    const config = load(fs.readFileSync(path.join(process.resourcesPath, 'app-update.yml'), 'utf8'));
    validateUpdateConfig(config);
    ({ autoUpdater } = require('electron-updater'));
  } catch (error) {
    logError(error);
    return () => {};
  }

  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = false;
  autoUpdater.allowPrerelease = false;
  autoUpdater.allowDowngrade = false;
  autoUpdater.disableWebInstaller = true;
  autoUpdater.logger = {
    info: (...args) => console.info('[Güncelleme]', redactSecrets(args.map(String).join(' '))),
    warn: (...args) => console.warn('[Güncelleme]', redactSecrets(args.map(String).join(' '))),
    error: (...args) => console.error('[Güncelleme]', redactSecrets(args.map(String).join(' '))),
    debug: () => {},
  };

  let stopped = false;
  let checking = false;
  let stage = 'idle';
  let promptedVersion = null;
  let requestedVersion = null;
  let downloadedInfo = null;
  let interval = null;

  const activeWindow = () => {
    const window = getWindow();
    return window && !window.isDestroyed() ? window : null;
  };

  async function offerInstall() {
    if (stopped || stage !== 'idle' || !downloadedInfo) return;
    const window = activeWindow();
    if (!window) return;
    stage = 'install-prompt';
    try {
      const { response } = await dialog.showMessageBox(window, {
        type: 'info',
        title: 'Güncelleme hazır',
        message: `Biznes Hasap ${downloadedInfo.version} indirildi.`,
        detail: 'Uygulama kapanıp yeni sürüm kurulacak. Devam etmeden önce açık işlemlerinizi kaydedin.',
        buttons: ['Şimdi yeniden başlat ve kur', 'Daha sonra'],
        defaultId: 1, cancelId: 1, noLink: true,
      });
      if (!stopped && response === 0) {
        autoUpdater.quitAndInstall(false, true);
      }
    } catch (error) {
      logError(error);
    } finally {
      if (!stopped) stage = 'idle';
    }
  }

  async function onAvailable(info) {
    if (stopped || stage !== 'idle' || downloadedInfo ||
        !info || typeof info.version !== 'string' || info.version === promptedVersion) return;
    const window = activeWindow();
    if (!window) return;
    promptedVersion = info.version;
    stage = 'download-prompt';
    try {
      const { response } = await dialog.showMessageBox(window, {
        type: 'info',
        title: 'Yeni sürüm mevcut',
        message: `Biznes Hasap ${info.version} kullanılabilir.`,
        detail: 'Güncelleme yalnızca onayınızla indirilir. Kurulumdan önce ayrıca onay istenecektir.',
        buttons: ['Güncellemeyi indir', 'Daha sonra'],
        defaultId: 1, cancelId: 1, noLink: true,
      });
      if (stopped || response !== 0) return;
      requestedVersion = info.version;
      stage = 'downloading';
      await autoUpdater.downloadUpdate();
    } catch (error) {
      downloadedInfo = null;
      promptedVersion = null; // Sonraki kontrolde yeniden deneme mümkün.
      logError(error);
      const currentWindow = activeWindow();
      if (!stopped && currentWindow) {
        await dialog.showMessageBox(currentWindow, {
          type: 'warning', title: 'Güncelleme tamamlanamadı',
          message: 'Güncelleme indirilemedi veya doğrulanamadı. Mevcut sürümle çalışmaya devam edebilirsiniz.',
          buttons: ['Tamam'], noLink: true,
        }).catch(logError);
      }
    } finally {
      if (!stopped) {
        stage = 'idle';
        await offerInstall();
      }
    }
  }

  function onDownloaded(info) {
    // Onaylı indirme dışında gelen olay bir kurulum başlatamaz.
    if (!stopped && stage === 'downloading' && info?.version === requestedVersion) {
      downloadedInfo = info;
    }
  }

  async function check() {
    if (stopped || checking || stage !== 'idle' || downloadedInfo || !activeWindow()) return;
    checking = true;
    try {
      await autoUpdater.checkForUpdatesAndNotify();
    } catch (error) {
      // Çevrimdışı/ilk release yok: satış akışı ve uygulama açılışı kesilmez.
      logError(error);
    } finally {
      checking = false;
    }
  }

  autoUpdater.on('update-available', onAvailable);
  autoUpdater.on('update-downloaded', onDownloaded);
  autoUpdater.on('error', logError);

  const timeout = setTimeout(() => {
    if (stopped) return;
    void check();
    interval = setInterval(() => void check(), CHECK_INTERVAL_MS);
    interval.unref?.();
  }, FIRST_CHECK_MS);
  timeout.unref?.();

  function stop() {
    if (stopped) return;
    stopped = true;
    clearTimeout(timeout);
    if (interval) clearInterval(interval);
    autoUpdater.removeListener('update-available', onAvailable);
    autoUpdater.removeListener('update-downloaded', onDownloaded);
    autoUpdater.removeListener('error', logError);
    app.removeListener('before-quit', stop);
  }
  app.once('before-quit', stop);
  return stop;
}

module.exports = { startAutoUpdates, validateUpdateConfig };
