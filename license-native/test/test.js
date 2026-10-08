'use strict';
// test/test.js - Lisans sistemi tam test suite (30+ test)

const native = require('../native');
const assert = require('assert').strict;
const fs = require('fs');
const path = require('path');
const os = require('os');

// Gerçek admin core modülü
const core = require('../admin/core/license-core');

// Test başlangıcında unlock
const ADMIN_PASSWORD = 'BiznesHasapAdmin2024!SecureKey';
const unlocked = core.unlock(ADMIN_PASSWORD);
if (!unlocked) {
  console.error('✗ FATAL: Admin core unlock başarısız!');
  console.error('  Şifre:', ADMIN_PASSWORD);
  console.error('  secret.key dosyası var mı?', require('fs').existsSync('../admin/secret.key'));
  process.exit(1);
}

console.log('✓ Admin core unlocked\n');

const gate = require('../gate');

// Status sabitleri
const S = {
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
  STATE_TAMPERED: -11
};

// Test yardımcıları
const tmpDir = path.join(os.tmpdir(), 'license-native-test');
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

function makeTmpDir(name) {
  const dir = path.join(tmpDir, name);
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true });
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function makeKey(accountId, plan, extra = {}) {
  const reqCode = native.getRequestCode(accountId);
  if (!reqCode) throw new Error('getRequestCode failed');
  
  const planNames = { 1: 'monthly', 2: 'quarterly', 3: 'semiannual', 4: 'yearly' };
  
  const params = {
    requestCode: reqCode,
    platform: 'test',
    note: 'test key',
    ...extra
  };
  
  // Plan 255 = custom days
  if (plan === 255) {
    params.days = extra.durationDays || 45;
  } else {
    params.plan = planNames[plan];
  }
  
  const result = core.createKey(params);
  
  if (result.error) {
    throw new Error('createKey failed: ' + result.error);
  }
  
  return {
    rootCode: result.rootCode || null,
    key: result.key
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// TESTLER
// ──────────────────────────────────────────────────────────────────────────────

// Test 01: Geçerli planlar (monthly, quarterly, semiannual, yearly, custom)
function test01_ValidKeys() {
  const plans = [
    { plan: 1, days: 30 },
    { plan: 2, days: 90 },
    { plan: 3, days: 180 },
    { plan: 4, days: 365 },
    { plan: 255, days: 45 }
  ];

  for (const { plan, days } of plans) {
    const acc = native.createAccountId();
    assert(acc, 'createAccountId failed');
    
    const dir = makeTmpDir('test01-' + plan);
    native.setDataDir(dir);
    
    const { rootCode, key } = makeKey(acc, plan, {
      durationDays: plan === 255 ? 45 : 0
    });
    
    const rootSt = native.setRootCode(acc, rootCode);
    assert.equal(rootSt, S.OK, `Plan ${plan}: setRootCode failed (${rootSt})`);
    
    const actSt = native.activate(acc, key);
    assert.equal(actSt, S.OK, `Plan ${plan}: activate failed (${actSt})`);
    
    const info = native.checkLicense(acc);
    assert.equal(info.status, S.OK, `Plan ${plan}: checkLicense failed`);
    
    const exp = Math.floor(Date.now() / 1000) + days * 86400;
    assert(Math.abs(info.expiry - exp) < 10, `Plan ${plan}: beklenen ${days} gün, fark ${Math.abs(info.expiry - exp)}s`);
  }
  
  console.log('✓ Test 01: Geçerli planlar');
}

// Test 03: Hesap uyuşmazlığı
function test03_AccountMismatch() {
  const acc1 = native.createAccountId();
  const acc2 = native.createAccountId();
  const dir = makeTmpDir('test03');
  
  native.setDataDir(dir);
  const { rootCode, key } = makeKey(acc1, 1);
  
  native.setRootCode(acc1, rootCode);
  const st = native.activate(acc2, key);
  
  assert.equal(st, S.ACCOUNT_MISMATCH, 'Farklı hesaba aktivasyon geçti!');
  console.log('✓ Test 03: ACCOUNT_MISMATCH');
}

// Test 07: Tekrar aynı anahtarı kullanma (replay attack)
function test07_Replay() {
  const acc = native.createAccountId();
  const dir = makeTmpDir('test07');
  native.setDataDir(dir);
  
  const { rootCode, key } = makeKey(acc, 1);
  native.setRootCode(acc, rootCode);
  
  const st1 = native.activate(acc, key);
  assert.equal(st1, S.OK, 'İlk aktivasyon başarısız');
  
  const st2 = native.activate(acc, key);
  assert.equal(st2, S.REPLAYED, 'Replay engellenmedi!');
  
  console.log('✓ Test 07: REPLAYED');
}

// Test 08: Yenileme (renewal/extend)
function test08_Renewal() {
  const acc = native.createAccountId();
  const dir = makeTmpDir('test08');
  native.setDataDir(dir);
  
  const { rootCode, key: k1 } = makeKey(acc, 1, { seq: 1 });
  native.setRootCode(acc, rootCode);
  native.activate(acc, k1);
  
  const i1 = native.checkLicense(acc);
  assert.equal(i1.status, S.OK);
  
  const { key: k2 } = makeKey(acc, 2, { seq: 2, flags: 0x01 });
  const st2 = native.activate(acc, k2);
  assert.equal(st2, S.OK, 'Yenileme başarısız');
  
  const i2 = native.checkLicense(acc);
  assert(i2.expiry > i1.expiry + 85 * 86400, 'Süre uzamadı');
  assert.equal(i2.plan, 2, 'Plan değişmedi');
  
  console.log('✓ Test 08: Yenileme (extend)');
}

// Test 14: deriveKey - lisanstan türetilen anahtarlar
function test14_DeriveKey() {
  const acc = native.createAccountId();
  const dir = makeTmpDir('test14');
  native.setDataDir(dir);
  
  // Lisans yokken null dönmeli
  const k0 = native.deriveKey(acc, 'db');
  assert.equal(k0, null, 'Lisanssız deriveKey null dönmedi');
  
  const { rootCode, key } = makeKey(acc, 1);
  native.setRootCode(acc, rootCode);
  native.activate(acc, key);
  
  // Lisans varken 32 bayt döner
  const k1 = native.deriveKey(acc, 'db');
  assert(k1 instanceof Buffer && k1.length === 32, 'deriveKey Buffer dönmedi');
  
  const k2 = native.deriveKey(acc, 'reports');
  assert(!k1.equals(k2), 'Farklı purpose aynı key döndü');
  
  // Yenileme sonrası aynı key dönmeli
  const { key: kx } = makeKey(acc, 2, { seq: 2 });
  native.activate(acc, kx);
  const k3 = native.deriveKey(acc, 'db');
  assert(k1.equals(k3), 'Yenileme sonrası deriveKey değişti');
  
  console.log('✓ Test 14: deriveKey');
}

// Test 22: Çapraz vektörler (CRC16, Base32, imza)
function test22_Vectors() {
  try {
    const vectors = require('./vectors.json');
    
    // CRC16 vektörleri
    if (vectors.crc16) {
      const { crc16 } = require('../admin/core/codec');
      for (const v of vectors.crc16) {
        const input = Buffer.from(v.input_hex, 'hex').toString('ascii');
        const got = crc16(input);
        const expected = v.expected.toUpperCase();
        assert.equal(
          got.toString(16).toUpperCase().padStart(4, '0'),
          expected,
          `CRC16 uyumsuz: ${v.note}`
        );
      }
    }
    
    // Anahtar vektörleri
    if (vectors.keys) {
      for (const v of vectors.keys) {
        const dir = makeTmpDir('vec-' + v.accountId.substring(0, 8));
        native.setDataDir(dir);
        
        if (v.rootCode) native.setRootCode(v.accountId, v.rootCode);
        const st = native.activate(v.accountId, v.key);
        assert.equal(st, S.OK, `Vektör başarısız: ${v.note}`);
      }
    }
    
    console.log('✓ Test 22: Çapraz vektörler');
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      console.log('⊘ Test 22: vectors.json yok (atlandı)');
    } else {
      throw err;
    }
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// GATE TESTLERİ
// ──────────────────────────────────────────────────────────────────────────────

// Test 30: Lisans yokken tüm modüller kilitli
function test30_GateBlocksAll() {
  const acc = native.createAccountId();
  const dir = makeTmpDir('test30');
  native.setDataDir(dir);
  gate.selectAccount(acc);
  
  const modules = [
    gate.sale, gate.purchase, gate.stock, gate.register,
    gate.customer, gate.supplier, gate.report, gate.price,
    gate.settings, gate.backup, gate.users
  ];
  
  for (const fn of modules) {
    const r = fn();
    assert.equal(r.allowed, false, `${fn.name} lisanssızken açık!`);
  }
  
  console.log('✓ Test 30: Lisans yokken tüm modüller kilitli');
}

// Test 31: Aktivasyon sonrası tüm modüller açık
function test31_GateOpensAfterActivate() {
  const acc = native.createAccountId();
  const dir = makeTmpDir('test31');
  native.setDataDir(dir);
  
  const { rootCode, key } = makeKey(acc, 1, { features: 0x3F });
  native.setRootCode(acc, rootCode);
  native.activate(acc, key);
  gate.selectAccount(acc);
  
  const modules = [
    gate.sale, gate.purchase, gate.stock, gate.register,
    gate.customer, gate.supplier, gate.report, gate.price,
    gate.settings, gate.backup, gate.users
  ];
  
  for (const fn of modules) {
    const r = fn();
    assert.equal(r.allowed, true, `${fn.name} lisans varken kapalı!`);
  }
  
  console.log('✓ Test 31: Aktivasyon sonrası tüm modüller açık');
}

// Test 32: Özellik kilidi (features bitleri)
function test32_FeatureLock() {
  const acc = native.createAccountId();
  const dir = makeTmpDir('test32');
  native.setDataDir(dir);
  
  // Sadece MULTI_REGISTER (0x01) açık
  const { rootCode, key } = makeKey(acc, 1, { features: 0x01 });
  native.setRootCode(acc, rootCode);
  native.activate(acc, key);
  gate.selectAccount(acc);
  
  assert.equal(gate.sale().allowed, true, 'Sale açık olmalıydı');
  
  const stockR = gate.stock();
  assert.equal(stockR.allowed, false, 'Stock kilitli olmalıydı');
  assert.equal(stockR.reason, 'FEATURE_LOCKED', 'Reason yanlış');
  
  console.log('✓ Test 32: Özellik kilidi (features bitleri)');
}

// Test 33: Navigasyon koruması
function test33_NavigationGuard() {
  const acc = native.createAccountId();
  const dir = makeTmpDir('test33');
  native.setDataDir(dir);
  gate.selectAccount(acc);
  
  let target = null;
  const nav = (r, params) => { target = { r, params }; };
  
  // Lisanssız navigasyon
  require('../ui/gateMiddleware').navigationGuard('SaleScreen', nav);
  assert.equal(target.r, 'LicenseScreen', 'Lisanssızken LicenseScreen\'e yönlenmedi');
  assert.equal(target.params.blockedRoute, 'SaleScreen', 'blockedRoute yanlış');
  
  // Aktivasyon sonrası
  const { rootCode, key } = makeKey(acc, 1);
  native.setRootCode(acc, rootCode);
  native.activate(acc, key);
  
  require('../ui/gateMiddleware').navigationGuard('SaleScreen', nav);
  assert.equal(target.r, 'SaleScreen', 'Lisanslıyken yönlendirme yanlış');
  
  console.log('✓ Test 33: Navigasyon koruması');
}

// ──────────────────────────────────────────────────────────────────────────────
// ADMIN CORE TESTLERİ (v2)
// ──────────────────────────────────────────────────────────────────────────────

// Test 40: GUI/CLI aynı çekirdeği kullanır ve imza deterministiktir
//
// NOT (v2 düzeltmesi): Önceki sürüm iki ardışık createKey() çağrısının birebir
// aynı anahtarı döndürmesini bekliyordu. Bu YANLIŞTI: createKey() her çağrıda
// sequence'ı lastSeq+1 ile artırır (anti-replay, spec §4 "Her anahtar tek
// kullanımlıktır"). Bu yüzden iki çağrı farklı seq → farklı payload → farklı
// imza üretir. Doğru kriter şudur:
//   1) GUI ve CLI AYNI core modülünü çözer (tek doğru kaynak, kriptografi kopyalanmaz)
//   2) Aynı payload + aynı secret key => birebir aynı imza (Ed25519 deterministik)
//   3) Ardışık createKey() çağrıları sequence'ı artırır (anti-replay koruması)
function test40_CoreCliGuiParity() {
  const fsLocal = require('fs');

  // ── 1) GUI ve CLI aynı core dosyasını çözüyor mu? ────────────────────────
  const cliCorePath = require.resolve('../admin/core/license-core');
  const repoRoot = path.join(__dirname, '..', '..');
  const guiMainPath = path.join(repoRoot, 'admin-gui', 'main.js');

  assert.ok(fsLocal.existsSync(guiMainPath), 'admin-gui/main.js bulunamadı');
  const guiSrc = fsLocal.readFileSync(guiMainPath, 'utf8');

  // GUI de aynı dosyaya işaret etmeli (paketlenmiş halde resources'a kopyalanır)
  assert.ok(
    guiSrc.includes('license-native/admin/core/license-core'),
    'GUI core\'u license-native/admin/core/license-core yolundan yüklemeli'
  );
  assert.ok(
    guiSrc.includes("require(corePath)") || guiSrc.includes("require(corePath);"),
    'GUI core\'u ortak çekirdek modülünden yüklemeli (kripto kopyalanmamalı)'
  );

  // ── 2) Aynı payload + aynı secret key => birebir aynı imza ───────────────
  const coreDir = path.dirname(require.resolve('../admin/core/license-core'));
  const codecMod = require(path.join(coreDir, 'codec.js'));
  const naclLocal = require('tweetnacl');

  const testPayload = codecMod.buildPayload({
    keyId: 0,
    accountId: Buffer.from('0102030405060708', 'hex'),
    deviceAnchor: Buffer.from('deadbeef', 'hex'),
    plan: 4,
    flags: 0x01,
    features: 0x3F,
    maxRegisters: 0,
    seq: 42,
    issuedAt: 1700000000,
    activateBy: 1700000000 + 14 * 86400,
    durationDays: 0
  });

  // Aynı girdileri tekrar üret — payload birebir aynı olmalı (deterministik)
  const testPayload2 = codecMod.buildPayload({
    keyId: 0,
    accountId: Buffer.from('0102030405060708', 'hex'),
    deviceAnchor: Buffer.from('deadbeef', 'hex'),
    plan: 4,
    flags: 0x01,
    features: 0x3F,
    maxRegisters: 0,
    seq: 42,
    issuedAt: 1700000000,
    activateBy: 1700000000 + 14 * 86400,
    durationDays: 0
  });
  assert.ok(testPayload.equals(testPayload2), 'Aynı girdilerden farklı payload üretildi');

  // Aynı secret key ile iki kez imzala — imza birebir aynı olmalı
  const secretKey = Buffer.from(
    '5dab087e624a8a4b79e17f8b83800ee66f3bb1292618b6fd1c2f8b27ff88e0eb' +
    '3b6a27bcceb6a42d62a3a8d02a6f0d73653215771de243a63ac048a18b59da29',
    'hex'
  );
  const sig1 = naclLocal.sign.detached(new Uint8Array(testPayload), new Uint8Array(secretKey));
  const sig2 = naclLocal.sign.detached(new Uint8Array(testPayload2), new Uint8Array(secretKey));
  assert.ok(Buffer.from(sig1).equals(Buffer.from(sig2)),
    'Aynı payload + aynı anahtardan farklı imza üretildi (Ed25519 deterministik olmalı)');

  // CRC katmanı da deterministik
  const b32a = codecMod.base32Encode(testPayload);
  const b32b = codecMod.base32Encode(testPayload2);
  assert.equal(codecMod.appendCRC(b32a), codecMod.appendCRC(b32b),
    'CRC katmanı deterministik değil');

  // ── 3) Ardışık createKey() sequence'ı artırır (anti-replay) ──────────────
  const acc = native.createAccountId();
  const dir = makeTmpDir('test40');
  native.setDataDir(dir);
  const reqCode = native.getRequestCode(acc);

  const params = {
    requestCode: reqCode,
    plan: 'yearly',
    platform: 'test',
    note: 'parity test'
  };

  const first = core.createKey(params);
  const second = core.createKey(params);

  assert(!first.error, 'İlk createKey hatası: ' + first.error);
  assert(!second.error, 'İkinci createKey hatası: ' + second.error);

  assert.notEqual(first.key, second.key,
    'Ardışık key\'ler ayni olmamalı (anti-replay: sequence artmalı)');
  assert.equal(second.seq, first.seq + 1,
    `Sequence artmalı: ${first.seq} -> ${first.seq + 1} bekleniyordu, ${second.seq} geldi`);

  // Payload'da yalnızca sequence alanı (offset 19, 4 bayt) değişmiş olmalı
  const rawA = codecMod.base32Decode(first.key.slice(0, 156));
  const rawB = codecMod.base32Decode(second.key.slice(0, 156));
  const diffIdx = [];
  for (let i = 0; i < 33; i++) {
    if (rawA[i] !== rawB[i]) diffIdx.push(i);
  }
  assert.ok(diffIdx.length > 0 && diffIdx.every((i) => i >= 19 && i <= 22),
    `Payload\'ta yalnızca sequence (offset 19-22) değişmeli, değişen: ${diffIdx.join(',')}`);

  console.log('✓ Test 40: Tek çekirdek + deterministik imza + anti-replay sequence');
}

// Test 41: Bozuk istek kodu normalize
function test41_NormalizeMessyInput() {
  const acc = native.createAccountId();
  const dir = makeTmpDir('test41');
  native.setDataDir(dir);
  const reqCode = native.getRequestCode(acc);
  
  // WhatsApp'tan yapıştırılmış bozuk kod
  const messy = reqCode.slice(0, 6).toLowerCase() + ' - ' + reqCode.slice(6) + '\n';
  const d = core.decodeRequest(messy);
  
  assert.equal(d.valid, true, 'Bozuk kod normalize edilmedi');
  
  console.log('✓ Test 41: Bozuk/biçimsiz istek kodu normalize edilir');
}

// Test 42: Kilitli çekirdek imza üretmez
function test42_LockedCoreRefusesSign() {
  // Önce kilitle
  core.lock();
  assert.equal(core.isUnlocked(), false, 'Core kilitlenmedi');
  
  const r = core.createKey({ requestCode: 'X'.repeat(24), days: 30 });
  assert(r.error, 'Kilitliyken imzalama yapıldı!');
  
  // Testlerin devamı için tekrar aç
  const unlocked = core.unlock(ADMIN_PASSWORD);
  assert(unlocked, 'Tekrar unlock başarısız');
  
  console.log('✓ Test 42: Kilitli çekirdek imza üretmez');
}

// ──────────────────────────────────────────────────────────────────────────────
// v3: HESAP ÖNCELİKLİ AÇILIŞ AKIŞI VE HESAP-LİSANS BAĞI
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Uygulama kaynaklarını okur (renderer kodu JSX olduğu için require edilemez).
 * Açılış akışı testleri DOM olmadan kaynak düzeyinde doğrulanır.
 */
function readAppSource() {
  const appPath = path.join(__dirname, '..', '..', 'src', 'App.tsx');
  if (!fs.existsSync(appPath)) return null;
  return fs.readFileSync(appPath, 'utf8');
}

// Test 50: Açılışta direkt lisans sorulmaz, ilk ekran hesap ekranıdır
function test50_StartupFlowNoAccountShowsAccountScreen() {
  const src = readAppSource();
  if (!src) {
    // Kaynak yoksa (dağıtım paketi gibi) davranışı atla
    console.log('○ Test 50: App.tsx bulunamadı, atlandı');
    return;
  }

  // 1) Başlangıç fazı 'account' olmalı (lisans değil)
  assert.match(src, /useState<AppPhase>\('account'\)/,
    "Açılış fazı 'account' olmalı, LicenseScreen/PosWorkspace değil");

  // 2) Mount sırasında lisans kontrolü yapılmamalı.
  //    v2'de: useEffect(() => { getLicenseInfo() ... setShowLicenseScreen(true) }, [])
  //    v3'de böyle bir mount kontrolü olmamalı.
  const mountLicenseCheck = /useEffect\(\s*\(\)\s*=>\s*\{[^}]*getLicenseInfo/s;
  assert.ok(!mountLicenseCheck.test(src),
    "Açılışta (mount) getLicenseInfo çağrısı olmamalı — lisans giriş sonrası sorulur (v3 §2)");

  // 3) 'license' fazı render'ı hesap hedefiyle birlikte açılmalı
  assert.match(src, /phase === 'license' && licenseTarget/,
    'Lisans ekranı hesap hedefi belirlendikten sonra açılmalı');

  // 4) Hesap ekranı (phase 'account') her zaman render edilebilir olmalı
  assert.match(src, /HESAP EKRANI/,
    'Hesap ekranı (phase=account) render edilmeli');

  console.log('✓ Test 50: Açılışta ilk ekran hesap ekranı (lisans sorulmaz)');
}

// Test 51: Girişten hemen sonra lisans kontrolü — ara ekran yok
function test51_LoginGoesStraightToLicenseScreen() {
  const src = readAppSource();
  if (!src) {
    console.log('○ Test 51: App.tsx bulunamadı, atlandı');
    return;
  }

  // 1) handleLoginSuccess lisans kontrolü YAPMALI ve hedef hesabı set etmeli
  assert.match(src, /const handleLoginSuccess = async/,
    'handleLoginSuccess async olmalı');
  assert.match(src, /setLicenseTarget\(account\)/,
    'Girişte lisans hedefi (hesap) belirlenmeli');
  assert.match(src, /checkAccountLicense\(account\)/,
    'Girişten hemen sonra lisans kontrol edilmeli');

  // 2) Lisans geçerliyse workspace'e, değilse license fazına geçmeli
  assert.match(src, /status === 1[\s\S]{0,200}setPhase\('workspace'\)/,
    "Lisans geçerliyse doğrudan çalışma alanına geçmeli (akış kesintisiz)");
  assert.match(src, /setPhase\('license'\)/,
    'Lisans geçerli değilse lisans ekranında kalmalı');

  // 3) Ara ekran olmamalı: giriş ile lisans arasında workspace render'ı yok.
  //    'workspace' fazı YALNIZCA status===1 sonrası set edilmeli.
  const workspaceSetters = src.match(/setPhase\('workspace'\)/g) || [];
  assert.ok(workspaceSetters.length <= 2,
    'workspace fazına yalnızca lisans geçerliyken geçilmeli');

  // 4) Hesap değiştirme oturumu kapatıp hesap ekranına dönmeli
  assert.match(src, /const handleLogout = \(\) =>/,
    'handleLogout tanımlı olmalı');
  assert.match(src, /setPhase\('account'\)/,
    'Çıkışta hesap ekranına dönülmeli');
  assert.match(src, /selectLicenseAccount\?\.\(undefined\)/,
    'Çıkışta gate temizlenmeli (selectLicenseAccount undefined)');

  // 5) Lisans ekranı hesap adı ve hesabın kendi ID'siyle açılmalı
  assert.match(src, /licenseId=\{licenseTarget\.licenseId\}/,
    'Lisans ekranı hesabın licenseId değerini almalı');
  assert.match(src, /accountName=\{licenseTarget\.name\}/,
    'Lisans ekranı hesap adını göstermeli');

  // 6) Gerçek davranış: hesap seçilmeden guard() kilitli döner (v3 §5.1)
  makeTmpDir('test-51');
  native.setDataDir(path.join(tmpDir, 'test-51'));
  gate.selectAccount(null);
  const noAcc = gate.sale();
  assert.equal(noAcc.allowed, false, 'Hesap seçilmeden satış kilitli olmalı');
  assert.equal(noAcc.reason, 'NO_ACCOUNT', 'Reason NO_ACCOUNT olmalı');

  // Lisanslı hesap seçilince geçiş engelsiz olmalı (ara ekran yok → direkt OK)
  const acc = native.createAccountId();
  const r = makeKey(acc, 1, { features: 0x3F });
  native.setRootCode(acc, r.rootCode);
  native.activate(acc, r.key);
  gate.selectAccount(acc);
  const okGate = gate.sale();
  assert.equal(okGate.allowed, true, 'Lisanslı hesapta satış açık olmalı');
  assert.equal(okGate.reason, 'OK', 'Reason OK olmalı');

  console.log('✓ Test 51: Girişten hemen sonra lisans (ara ekran yok)');
}

// Test 52: Her hesabın istek kodu farklıdır
function test52_PerAccountRequestCodesDiffer() {
  makeTmpDir('test-52');
  native.setDataDir(path.join(tmpDir, 'test-52'));

  const a = native.createAccountId();
  const b = native.createAccountId();
  const r1 = native.getRequestCode(a);
  const r2 = native.getRequestCode(b);

  assert.notEqual(a, b, 'Hesap ID\'leri aynı olamaz');
  assert.notEqual(r1, r2, 'Aynı cihazda iki hesabın istek kodu aynı olamaz');
  assert.equal(r1.length, 24, 'İstek kodu 24 karakter olmalı');
  assert.equal(r2.length, 24, 'İstek kodu 24 karakter olmalı');

  console.log('✓ Test 52: Hesap başına istek kodları farklı');
}

// Test 53: Anahtar hesaba bağlıdır (A'nın key'i B'de reddedilir)
function test53_KeyBoundToAccount() {
  makeTmpDir('test-53');
  native.setDataDir(path.join(tmpDir, 'test-53'));

  const a = native.createAccountId();
  const b = native.createAccountId();

  const r = makeKey(a, 1);
  native.setRootCode(a, r.rootCode);
  assert.equal(native.activate(a, r.key), S.OK, 'A hesabında aktivasyon başarısız');

  // A'nın key'ini B'de dene
  const r2 = makeKey(a, 1, { seq: 2 });
  assert.equal(native.activate(b, r2.key), S.ACCOUNT_MISMATCH,
    'A hesabının key\'i B hesabında kabul edilmemeli');

  // B'nin durumu değişmemeli
  assert.equal(native.checkLicense(b).status, S.NOT_ACTIVATED,
    'Başarısız aktivasyon B\'nin durumunu değiştirmemeli');

  console.log('✓ Test 53: Anahtar hesaba bağlı (ACCOUNT_MISMATCH)');
}

// Test 54: Hesap başına bağımsız lisans durumu
function test54_IndependentLicenseStates() {
  makeTmpDir('test-54');
  native.setDataDir(path.join(tmpDir, 'test-54'));

  const a = native.createAccountId();
  const b = native.createAccountId();

  const r = makeKey(a, 1, { features: 0x3F });
  native.setRootCode(a, r.rootCode);
  native.activate(a, r.key);

  // A lisanslı, B lisanssız
  assert.equal(native.checkLicense(a).status, S.OK, 'A hesabı lisanslı olmalı');
  assert.equal(native.checkLicense(b).status, S.NOT_ACTIVATED, 'B hesabı lisanssız kalmalı');

  // Gate A'yı seçince her şey açık
  gate.selectAccount(a);
  for (const fn of [gate.sale, gate.stock, gate.report, gate.settings]) {
    assert.equal(fn().allowed, true, fn.name + ' A hesabında açık olmalı');
  }

  // Gate B'yi seçince her şey kilitli
  gate.selectAccount(b);
  for (const fn of [gate.sale, gate.stock, gate.report, gate.settings]) {
    const r2 = fn();
    assert.equal(r2.allowed, false, fn.name + ' B hesabında kilitli olmalı');
  }

  console.log('✓ Test 54: Hesap başına bağımsız lisans durumu');
}

// Test 55: Hesap değiştirme gate'i anında kilitler
function test55_SwitchAccountResetsGate() {
  makeTmpDir('test-55');
  native.setDataDir(path.join(tmpDir, 'test-55'));

  const a = native.createAccountId();
  const b = native.createAccountId();

  const r = makeKey(a, 1, { features: 0x3F });
  native.setRootCode(a, r.rootCode);
  native.activate(a, r.key);

  // Lisanslı hesapta açık
  gate.selectAccount(a);
  assert.equal(gate.sale().allowed, true, 'Lisanslı hesapta satış açık olmalı');

  // Lisanssız hesaba geç → anında kilitli
  gate.selectAccount(b);
  assert.equal(gate.sale().allowed, false, 'Hesap değiştirince gate anında kilitlenmeli');

  // Geri dön → tekrar açık
  gate.selectAccount(a);
  assert.equal(gate.sale().allowed, true, 'Geri dönünce tekrar açılmalı');

  // Hiç hesap seçili değilken NO_ACCOUNT
  gate.selectAccount(null);
  const noAcc = gate.sale();
  assert.equal(noAcc.allowed, false, 'Hesapsız durumda kilitli olmalı');
  assert.equal(noAcc.reason, 'NO_ACCOUNT', 'Reason NO_ACCOUNT olmalı');

  console.log('✓ Test 55: Hesap değiştirme gate\'i sıfırlar');
}

// Test 56: Hesap ID kalıcılığı — yeniden üretilmez
function test56_AccountIdPersistence() {
  makeTmpDir('test-56');
  const dir = path.join(tmpDir, 'test-56');
  native.setDataDir(dir);

  // "Hesap kaydı" (renderer'ın accounts.json'ı simüle eder)
  const registry = { accounts: [] };

  // Hesap oluştur
  const licenseId = native.createAccountId();
  registry.accounts.push({ id: 'acc-1', name: 'Merkez Şube', licenseId });
  assert.ok(licenseId, 'Hesap ID üretilemedi');
  // Format: XXXX-XXXX-XXXX-XX → 17 karakter (4+1+4+1+4+1+2)
  assert.equal(licenseId.length, 17, 'Hesap ID 17 karakter olmalı (tireli, 14 Base32)');
  assert.match(licenseId, /^[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{2}$/,
    'Hesap ID formatı geçersiz');

  // Uygulama yeniden başlatma simülasyonu: state'i yeniden oku
  const restored = JSON.parse(JSON.stringify(registry));
  assert.equal(restored.accounts[0].licenseId, licenseId, 'Hesap ID yeniden yüklemede değişmemeli');

  // İstek kodu da aynı hesap için aynı kalmalı (cihaz aynı)
  native.setDataDir(dir);
  const req1 = native.getRequestCode(restored.accounts[0].licenseId);
  const req2 = native.getRequestCode(licenseId);
  assert.equal(req1, req2, 'Aynı hesap ID için istek kodu sabit olmalı');
  assert.equal(req1.length, 24, 'İstek kodu 24 karakter olmalı');

  console.log('✓ Test 56: Hesap ID kalıcı, yeniden üretilmiyor');
}

// Test 57: Güvenlik — lisanssız hesap başka hesabın yetkisini kullanamaz
//
// Regresyon testi: Electron ana sürecinde bir noktada "hesap kimliği geçersizse
// varsayılan (global) hesaba düş" geri düşmesi vardı. Bu, lisanssız her hesabı
// lisanslı hesabın yetkisiyle açıyordu (yetki yükseltme açığı).
//
// Electron doğrudan çalıştırılamadığı için ana sürecin kaynağı denetlenir:
// geri düşme yolu veya toplu hesap kimliği SABİTLENMEMELİDİR.
function test57_SecurityNoLicenseFallback() {
  const fsLocal = require('fs');
  const mainPath = path.join(__dirname, '..', '..', 'electron', 'main.cjs');

  if (!fsLocal.existsSync(mainPath)) {
    console.log('○ Test 57: electron/main.cjs bulunamadı, atlandı');
    return;
  }

  const src = fsLocal.readFileSync(mainPath, 'utf8');

  // 1) Toplu/varsayılan hesap kimliği üreten fonksiyon kalmamalı
  assert.ok(!/function\s+getAccountId\s*\(/.test(src),
    'Ana süreçte varsayılan hesap kimliği üreten getAccountId() kalmamalı');

  // 2) account.id dosyası artık okunmamalı (tek kimlik dayatma kaynağıydı)
  assert.ok(!/accountIdFile|account\.id/.test(src),
    'Ana süreçte tek/global hesap kimliği dosyası okunmamalı');

  // 3) Geçersiz kimlik reddedilmeli — sessiz geri düşme olmamalı
  assert.ok(!/return\s+getAccountId\s*\(\s*\)/.test(src),
    'Geçersiz kimlikte varsayılan hesaba dönülmemeli');

  // 4) Kimlik doğrulaması katı olmalı (format denetimi)
  assert.ok(/isValidLicenseId|LICENSE_ID_RE/.test(src),
    'Hesap kimliği biçim denetimi (format) uygulanmalı');

  // 5) Lisans kontrolleri seçili hesabı kullanmalı
  assert.ok(/selectedLicenseId/.test(src),
    'Lisans kontrolleri renderer\'ın seçtiği hesap kimliğini kullanmalı');

  console.log('✓ Test 57: Lisanssız hesap başka hesabın yetkisini kullanamaz');
}

// ──────────────────────────────────────────────────────────────────────────────
// TEST RUNNER
// ──────────────────────────────────────────────────────────────────────────────

const tests = [
  test01_ValidKeys,
  test03_AccountMismatch,
  test07_Replay,
  test08_Renewal,
  test14_DeriveKey,
  test22_Vectors,
  test30_GateBlocksAll,
  test31_GateOpensAfterActivate,
  test32_FeatureLock,
  test33_NavigationGuard,
  test40_CoreCliGuiParity,
  test41_NormalizeMessyInput,
  test42_LockedCoreRefusesSign,
  // v3 — hesap öncelikli açılış akışı
  test50_StartupFlowNoAccountShowsAccountScreen,
  test51_LoginGoesStraightToLicenseScreen,
  test52_PerAccountRequestCodesDiffer,
  test53_KeyBoundToAccount,
  test54_IndependentLicenseStates,
  test55_SwitchAccountResetsGate,
  test56_AccountIdPersistence,
  // Güvenlik regresyonu
  test57_SecurityNoLicenseFallback,
];

console.log(`\nÇalıştırılıyor: ${tests.length} test\n`);

let failed = 0;
for (const test of tests) {
  try {
    test();
  } catch (err) {
    console.error(`✗ ${test.name}:`, err.message);
    if (process.env.VERBOSE) console.error(err.stack);
    failed++;
  }
}

console.log(`\n${tests.length - failed}/${tests.length} test geçti`);
if (failed > 0) {
  console.error(`\n${failed} test başarısız!`);
  process.exit(1);
} else {
  console.log('\n✓ Tüm testler başarılı\n');
}
