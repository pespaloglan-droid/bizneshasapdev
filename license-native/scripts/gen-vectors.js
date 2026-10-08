'use strict';
// Gerçek, imzalı test vektörü uretir ve vectors.json'a yazar.
// C++ native tarafi bu vektoru dogrudan dogrulayabilir (imza + CRC + hesap baglantisi).
const native = require('../native');
const core = require('../admin/core/license-core');
const codec = require('../admin/core/codec');
const path = require('path');
const os = require('os');
const fs = require('fs');

const vectorsPath = path.join(__dirname, '..', 'test', 'vectors.json');
const vectors = JSON.parse(fs.readFileSync(vectorsPath, 'utf8'));

if (!core.unlock('BiznesHasapAdmin2024!SecureKey')) {
  console.error('core unlock basarisiz');
  process.exit(1);
}

console.log('=== Gercek imzali vektor uretiliyor ===');

// Hesap ID'yi native'den uret (kontrol karakteri dogru olsun)
const FIXED_ACCOUNT = native.createAccountId();
const dir = path.join(os.tmpdir(), 'diag-vecgen');
fs.mkdirSync(dir, { recursive: true });
native.setDataDir(dir);

const req = native.getRequestCode(FIXED_ACCOUNT);
if (!req) {
  console.error('getRequestCode null dondu — hesap ID uretilemedi');
  process.exit(1);
}
console.log('hesap  :', FIXED_ACCOUNT);
console.log('istek  :', req);

// Bu hesap icin ilk key (seq 1) -> kok kod da uretilir
const r = core.createKey({
  requestCode: req,
  plan: 'monthly',
  days: undefined,
  features: 0x3F,
  maxRegisters: 0,
  activateByDays: 3650,   // cok uzun: vektor cok sonra da gecerli olsun
  extend: false,
  note: 'vectors.json sabit vektoru',
  platform: 'test'
});

if (r.error) {
  console.error('createKey hatasi:', r.error);
  process.exit(1);
}

console.log('seq    :', r.seq);
console.log('root   :', r.rootCode ? r.rootCode.slice(0, 20) + '...' : '(yok)');
console.log('key    :', r.key.slice(0, 20) + '...');

// Dogrulama: gercekten bu makinede aktive oluyor mu?
const stRoot = native.setRootCode(FIXED_ACCOUNT, r.rootCode);
const stAct = native.activate(FIXED_ACCOUNT, r.key);
console.log('dogrulama: setRootCode =', stRoot, ', activate =', stAct);
if (stRoot !== 1 || stAct !== 1) {
  console.error('VEKTOR DOGRULANMADI - JSON a yazilmiyor');
  process.exit(1);
}

// Geri al: ayni key ikinci kez kullanilamaz (REPLAYED) — vektorun tekrar
// kullanilabilir olmamasi icin state'i temizle
native.setDataDir(path.join(os.tmpdir(), 'diag-vecgen-clean'));
fs.mkdirSync(path.join(os.tmpdir(), 'diag-vecgen-clean'), { recursive: true });

// vectors.json'a yaz
vectors.keys = [
  {
    note: 'Gercek imzali monthly lisans anahtari (bu cihaza bagli)',
    accountId: FIXED_ACCOUNT,
    requestCode: req,
    deviceAnchor: core.decodeRequest(req).deviceAnchor,
    plan: 1,
    durationDays: 30,
    rootCode: r.rootCode,
    key: r.key,
    expectedStatus: 1
  }
];

fs.writeFileSync(vectorsPath, JSON.stringify(vectors, null, 2), 'utf8');
console.log('\nvectors.json guncellendi: keys[0] gercek degerlerle dolduruldu');

core.lock();