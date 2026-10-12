'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const asar = require('@electron/asar');
const { load } = require('js-yaml');
const { validateUpdateConfig } = require('../electron/auto-update.cjs');
const { version } = require('../package.json');

async function checkDesktopUpdatePackage(outputDirectory = 'dist-electron') {
  const resources = path.resolve(outputDirectory, 'win-unpacked/resources');
  validateUpdateConfig(load(fs.readFileSync(path.join(resources, 'app-update.yml'), 'utf8')));
  const archive = path.join(resources, 'app.asar');
  const files = new Set(asar.listPackage(archive).map((name) => name.replace(/^[/\\]/, '').replace(/\\/g, '/')));
  const readPackage = (directory) => JSON.parse(asar.extractFile(archive, path.posix.join(directory, 'package.json')).toString('utf8'));
  const application = readPackage('.');
  assert.equal(application.version, version, 'Paket sürümü kaynak sürümüyle eşleşmeli.');
  assert.equal(application.desktopUpdatesEnabled, true, 'İmzalı pakette güncelleme izni bulunmalı.');
  assert(files.has('electron/auto-update.cjs'), 'Güncelleme yaşam döngüsü dosyası pakette yok.');
  const visited = new Set();
  function verifyDependencies(directory) {
    if (visited.has(directory)) return;
    visited.add(directory);
    const manifest = readPackage(directory);
    for (const dependency of Object.keys(manifest.dependencies ?? {})) {
      let ancestor = directory;
      let found = null;
      while (true) {
        const candidate = path.posix.join(ancestor, 'node_modules', dependency);
        if (files.has(`${candidate}/package.json`)) { found = candidate; break; }
        if (ancestor === '.') break;
        ancestor = path.posix.dirname(ancestor);
      }
      assert(found, `Güncelleme runtime bağımlılığı eksik: ${dependency}`);
      verifyDependencies(found);
    }
  }
  assert(files.has('node_modules/electron-updater/package.json'), 'electron-updater paketlenmemiş.');
  const updater = readPackage('node_modules/electron-updater');
  assert(files.has(path.posix.join('node_modules/electron-updater', updater.main)), 'Updater giriş dosyası eksik.');
  verifyDependencies('node_modules/electron-updater');
  verifyDependencies('node_modules/js-yaml');

  const feed = load(fs.readFileSync(path.resolve(outputDirectory, 'latest.yml'), 'utf8'));
  assert.equal(feed.version, version, 'latest.yml sürümü yanlış.');
  assert(Array.isArray(feed.files) && feed.files.length > 0, 'Güncelleme dosyası yok.');
  for (const item of feed.files) {
    const name = decodeURIComponent(item.url);
    assert.equal(name, path.basename(name), 'Güncelleme dosyası yalnızca yerel dosya adı olmalı.');
    assert(/setup.*\.exe$/i.test(name), 'Güncelleme NSIS installer olmalı; portable olamaz.');
    const file = path.resolve(outputDirectory, name);
    const hash = crypto.createHash('sha512');
    for await (const chunk of fs.createReadStream(file)) hash.update(chunk);
    assert.equal(hash.digest('base64'), item.sha512, 'Güncelleme checksum eşleşmiyor.');
  }
  console.log('Paket runtime bağımlılıkları, imza sahibi, latest.yml ve SHA-512 doğrulandı.');
}

if (require.main === module) {
  checkDesktopUpdatePackage(process.argv[2])
    .catch((error) => { console.error(error.message); process.exitCode = 1; });
}
module.exports = { checkDesktopUpdatePackage };
