'use strict';
// native.js - JS wrapper for license.node
const path = require('path');
const fs = require('fs');

function loadNative() {
  const candidates = [];
  
  // Paketlenmiş ortam (Electron): app.asar.unpacked içinde
  if (process.resourcesPath) {
    candidates.push(path.join(process.resourcesPath, 'app.asar.unpacked',
                   'license-native', 'build', 'Release', 'license.node'));
  }
  
  // Geliştirme ortamı
  candidates.push(path.join(__dirname, 'build', 'Release', 'license.node'));
  candidates.push(path.join(__dirname, '..', 'build', 'Release', 'license.node'));
  
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) {
        return require(p);
      }
    } catch (e) {
      // Bir sonraki adayı dene
    }
  }
  
  throw new Error('license.node bulunamadı. Denenilen yollar:\n' + 
    candidates.map(c => '  - ' + c).join('\n') +
    '\nPC: npm run build-native | APK: npm run build-android');
}

let _native;
try {
  _native = loadNative();
} catch (e) {
  throw e;
}

function assertString(val, name) {
  if (typeof val !== 'string') throw new TypeError(name + ' string olmalı');
}

module.exports = {
  // Status sabitleri (C++ constants.h ile aynı)
  OK: 1,
  INVALID: 0,
  EXPIRED: -1,
  DEVICE_MISMATCH: -2,
  CLOCK_ROLLBACK: -3,
  REPLAYED: -4,
  NOT_ACTIVATED: -5,
  BAD_INPUT: -6,
  KEY_EXPIRED: -7,
  ACCOUNT_MISMATCH: -8,
  STORAGE_ERROR: -9,
  NEED_ROOT: -10,
  STATE_TAMPERED: -11,

  createAccountId() {
    try {
      return _native.createAccountId();
    } catch {
      return null;
    }
  },

  getRequestCode(accountId) {
    assertString(accountId, 'accountId');
    try {
      return _native.getRequestCode(accountId);
    } catch {
      return null;
    }
  },

  setRootCode(accountId, rootCode) {
    assertString(accountId, 'accountId');
    assertString(rootCode, 'rootCode');
    try {
      return _native.setRootCode(accountId, rootCode);
    } catch {
      return -6; // BAD_INPUT
    }
  },

  activate(accountId, key) {
    assertString(accountId, 'accountId');
    assertString(key, 'key');
    try {
      return _native.activate(accountId, key);
    } catch {
      return -6;
    }
  },

  checkLicense(accountId) {
    assertString(accountId, 'accountId');
    try {
      return _native.checkLicense(accountId);
    } catch {
      return { status: -6 };
    }
  },

  deriveKey(accountId, purpose) {
    assertString(accountId, 'accountId');
    assertString(purpose, 'purpose');
    try {
      return _native.deriveKey(accountId, purpose);
    } catch {
      return null;
    }
  },

  setDataDir(dirPath) {
    assertString(dirPath, 'dirPath');
    try {
      return _native.setDataDir(dirPath);
    } catch {
      return false;
    }
  },

  getVersion() {
    try {
      return _native.getVersion();
    } catch {
      return 'unknown';
    }
  },

  // Android köprüsü (PC'de no-op)
  setDeviceComponents(comps) {
    try {
      _native.setDeviceComponents(comps);
    } catch {}
  },

  setBootElapsed(sec) {
    try {
      _native.setBootElapsed(sec);
    } catch {}
  },

  // İş mantığı fonksiyonları
  calcReceiptTotals(accountId, items) {
    assertString(accountId, 'accountId');
    try {
      return _native.calcReceiptTotals(accountId, items);
    } catch {
      return -6;
    }
  },

  calcProfitReport(accountId, sales) {
    assertString(accountId, 'accountId');
    try {
      return _native.calcProfitReport(accountId, sales);
    } catch {
      return -6;
    }
  },

  calcStockValue(accountId, stock) {
    assertString(accountId, 'accountId');
    try {
      return _native.calcStockValue(accountId, stock);
    } catch {
      return -6;
    }
  }
};
