// scripts/release-check.js - Release hijyen kontrolleri
// Production build öncesi çalıştırılır - sorun varsa build fail eder

'use strict';
const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
let errors = 0;
let warnings = 0;

function error(msg) {
  console.error('❌ HATA:', msg);
  errors++;
}

function warn(msg) {
  console.warn('⚠️  UYARI:', msg);
  warnings++;
}

function check(condition, message, level = 'error') {
  if (!condition) {
    level === 'error' ? error(message) : warn(message);
  }
}

console.log('🔍 Release hijyen kontrolleri başlıyor...\n');

// ──────────────────────────────────────────────────────────────────────────────
// 1. BINARY STRIP KONTROLÜ
// ──────────────────────────────────────────────────────────────────────────────
console.log('1️⃣  Binary strip kontrolü');

const buildDir = path.join(rootDir, 'build', 'Release');
if (fs.existsSync(buildDir)) {
  const binaries = fs.readdirSync(buildDir).filter(f => 
    f.endsWith('.node') || f.endsWith('.so') || f.endsWith('.dylib')
  );
  
  if (binaries.length === 0) {
    warn('Build dizininde binary bulunamadı - henüz derlenmemiş olabilir');
  } else {
    for (const bin of binaries) {
      const binPath = path.join(buildDir, bin);
      const stat = fs.statSync(binPath);
      
      // Binary 5MB'dan büyükse strip edilmemiş olabilir
      if (stat.size > 5 * 1024 * 1024) {
        warn(`${bin} çok büyük (${(stat.size / 1024 / 1024).toFixed(2)} MB) - strip edilmemiş olabilir`);
      }
    }
    console.log(`   ✓ ${binaries.length} binary kontrol edildi\n`);
  }
} else {
  warn('build/Release dizini yok - henüz derlenmemiş\n');
}

// ──────────────────────────────────────────────────────────────────────────────
// 2. LOG ÇIKTI KONTROLÜ (console.log, stdout, stderr)
// ──────────────────────────────────────────────────────────────────────────────
console.log('2️⃣  Native kod log çıktısı kontrolü');

const srcFiles = [
  'src/license.cc',
  'src/fingerprint.cc',
  'src/state.cc',
  'src/codec.cc',
  'src/business.cc',
  'src/integrity.cc'
];

const logPatterns = [
  /console\.log/i,
  /std::cout/,
  /std::cerr/,
  // \b ile sadece GERÇEK printf; sprintf/snprintf/vsnprintf eşleşmesin
  /\bprintf\s*\(/,
  /\bfprintf\s*\(/,
  /__android_log_print/,
  /NSLog/,
  /OutputDebugString/
];

let foundLogs = false;
for (const file of srcFiles) {
  const filePath = path.join(rootDir, file);
  if (!fs.existsSync(filePath)) continue;
  
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  lines.forEach((line, idx) => {
    // Yorum satırlarını atla
    if (line.trim().startsWith('//')) return;
    
    for (const pattern of logPatterns) {
      if (pattern.test(line)) {
        error(`${file}:${idx + 1} - Log çıktısı bulundu: ${line.trim()}`);
        foundLogs = true;
      }
    }
  });
}

if (!foundLogs) {
  console.log('   ✓ Native kodda log çıktısı bulunamadı\n');
}

// ──────────────────────────────────────────────────────────────────────────────
// 3. AĞ ERİŞİMİ KONTROLÜ
// ──────────────────────────────────────────────────────────────────────────────
console.log('3️⃣  Ağ erişimi kontrolü');

const networkPatterns = [
  /https?:\/\//i,
  /fetch\s*\(/,
  /XMLHttpRequest/,
  /socket\s*\(/,
  /connect\s*\(/,
  /curl_easy/,
  /WSAStartup/,
  /getaddrinfo/
];

let foundNetwork = false;
for (const file of srcFiles) {
  const filePath = path.join(rootDir, file);
  if (!fs.existsSync(filePath)) continue;
  
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  lines.forEach((line, idx) => {
    if (line.trim().startsWith('//')) return;
    
    for (const pattern of networkPatterns) {
      if (pattern.test(line)) {
        error(`${file}:${idx + 1} - Ağ erişimi bulundu: ${line.trim()}`);
        foundNetwork = true;
      }
    }
  });
}

if (!foundNetwork) {
  console.log('   ✓ Native kodda ağ erişimi bulunamadı\n');
}

// ──────────────────────────────────────────────────────────────────────────────
// 4. GEREKLİ DOSYALARIN VARLIĞI
// ──────────────────────────────────────────────────────────────────────────────
console.log('4️⃣  Gerekli dosya kontrolü');

const requiredFiles = [
  'src/public_keys.h',
  'src/fingerprint_salt.h',
  'third_party/tweetnacl.c',
  'third_party/tweetnacl.h',
  'native.js',
  'gate.js',
  'binding.gyp',
  'package.json'
];

for (const file of requiredFiles) {
  const filePath = path.join(rootDir, file);
  check(fs.existsSync(filePath), `Gerekli dosya eksik: ${file}`);
}

console.log('   ✓ Gerekli dosyalar mevcut\n');

// ──────────────────────────────────────────────────────────────────────────────
// 5. PUBLIC KEY KONTROLÜ
// ──────────────────────────────────────────────────────────────────────────────
console.log('5️⃣  Public key kontrolü');

const pubKeyPath = path.join(rootDir, 'src', 'public_keys.h');
if (fs.existsSync(pubKeyPath)) {
  const content = fs.readFileSync(pubKeyPath, 'utf8');
  
  if (content.includes('TODO') || content.includes('PLACEHOLDER')) {
    error('src/public_keys.h placeholder içeriyor - admin keygen çalıştırılmadı');
  } else if (content.includes('const uint8_t PUBLIC_KEYS')) {
    console.log('   ✓ Public key tanımlı\n');
  } else {
    error('src/public_keys.h formatı hatalı');
  }
} else {
  error('src/public_keys.h eksik - admin keygen önce çalıştırılmalı');
}

// ──────────────────────────────────────────────────────────────────────────────
// 6. ADMIN GUI AĞ KONTROLÜ
// ──────────────────────────────────────────────────────────────────────────────
console.log('6️⃣  Admin GUI ağ izolasyonu kontrolü');

const guiMainPath = path.join(rootDir, '..', 'admin-gui', 'main.js');
if (fs.existsSync(guiMainPath)) {
  const content = fs.readFileSync(guiMainPath, 'utf8');
  
  // Web güvenliği kapatılmamalı
  if (/disable-web-security/.test(content)) {
    error('GUI web güvenliği kapatmış (disable-web-security) — kaldırın');
  } else {
    console.log('   ✓ GUI web güvenliği aktif');
  }
  
  if (content.includes('nodeIntegration: false') && content.includes('contextIsolation: true')) {
    console.log('   ✓ GUI sandbox aktif\n');
  } else {
    error('GUI sandbox ayarları eksik (nodeIntegration, contextIsolation)');
  }
} else {
  warn('admin-gui/main.js bulunamadı (atlandı)\n');
}

// ──────────────────────────────────────────────────────────────────────────────
// 7. TEST VARLIĞI
// ──────────────────────────────────────────────────────────────────────────────
console.log('7️⃣  Test kontrolü');

const testPath = path.join(rootDir, 'test', 'test.js');
check(fs.existsSync(testPath), 'test/test.js eksik');

if (fs.existsSync(testPath)) {
  const content = fs.readFileSync(testPath, 'utf8');
  const testCount = (content.match(/function test\d+_/g) || []).length;
  
  if (testCount < 10) {
    warn(`Test sayısı az: ${testCount} test (en az 10 olmalı)`);
  } else {
    console.log(`   ✓ ${testCount} test fonksiyonu bulundu\n`);
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// 8. GİZLİ BİLGİ KONTROLÜ (hardcoded secrets)
// ──────────────────────────────────────────────────────────────────────────────
console.log('8️⃣  Hardcoded secret kontrolü');

const secretPatterns = [
  /password\s*=\s*["'](?!test|example)[^"']{8,}/i,
  /api[_-]?key\s*=\s*["'][^"']+["']/i,
  /secret\s*=\s*["'][^"']+["']/i,
  /token\s*=\s*["'][^"']{20,}["']/i
];

let foundSecrets = false;
const checkFiles = [...srcFiles, 'native.js', 'gate.js', 'admin/license-admin.js'];

for (const file of checkFiles) {
  const filePath = path.join(rootDir, file);
  if (!fs.existsSync(filePath)) continue;
  
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  lines.forEach((line, idx) => {
    if (line.trim().startsWith('//')) return;
    
    for (const pattern of secretPatterns) {
      if (pattern.test(line)) {
        warn(`${file}:${idx + 1} - Hardcoded secret olabilir: ${line.trim().substring(0, 60)}...`);
        foundSecrets = true;
      }
    }
  });
}

if (!foundSecrets) {
  console.log('   ✓ Hardcoded secret bulunamadı\n');
}

// ──────────────────────────────────────────────────────────────────────────────
// 9. MÜŞTERİ PAKETİ SIZINTI KONTROLÜ (EN KRİTİK)
// ──────────────────────────────────────────────────────────────────────────────
// Müşteriye giden pakette admin anahtarı (secret.key) veya imzalama çekirdeği
// (license-core.js) OLMAMALI. Bu dosyalar sızarsa saldırgan kendi lisanslarını
// üretebilir. Admin aracı (LisansYonetici) yalnızca admin bilgisayarında kalır.
console.log('9️⃣  Müşteri paketi sızıntı kontrolü');

const FORBIDDEN_IN_CUSTOMER = [
  'secret.key',
  'issued.json',
  'license-core.js',
  'license-admin.js'
];

// electron-builder çıktısı adresleri (yapılandırmaya göre)
const repoRoot = path.join(rootDir, '..');
const customerOutputDirs = ['dist-v2', 'dist-electron', 'dist'];

let customerPackageChecked = 0;

for (const dirName of customerOutputDirs) {
  const outDir = path.join(repoRoot, dirName);
  if (!fs.existsSync(outDir)) continue;

  customerPackageChecked++;
  const forbiddenHits = [];

  // Paketlenmiş uygulama dosyalarını tara (asar.unpacked + resources)
  const resourcesDir = path.join(outDir, 'win-unpacked', 'resources');
  if (!fs.existsSync(resourcesDir)) continue;

  const walk = (currentDir) => {
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      const full = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (FORBIDDEN_IN_CUSTOMER.includes(entry.name)) {
        forbiddenHits.push(path.relative(repoRoot, full));
      }
    }
  };

  try {
    walk(resourcesDir);
  } catch (e) {
    warn(`Paket taraması atlandı: ${e.message}`);
  }

  if (forbiddenHits.length > 0) {
    for (const hit of forbiddenHits) {
      error(`MÜŞTERİ PAKETİNDE ADMIN DOSYASI VAR: ${hit} — müşteriye dağıtmayın!`);
    }
  }
}

if (customerPackageChecked === 0) {
  warn('Müşteri paketi bulunamadı (dist-v2 / dist-electron) — sızıntı kontrolü yapılamadı');
} else {
  console.log(`   ✓ ${customerPackageChecked} müşteri paketi tarandı, admin dosyası sızmadı\n`);
}

// Admin aracı secret.key içermeli (aksi halde key üretilemez)
const adminGuiOut = path.join(repoRoot, 'admin-gui', 'dist', 'win-unpacked', 'resources');
if (fs.existsSync(adminGuiOut)) {
  const hasSecret = fs.existsSync(path.join(adminGuiOut, 'license-native', 'admin', 'secret.key'));
  if (hasSecret) {
    console.log('   ✓ Admin aracı secret.key içeriyor (key üretimi çalışır)\n');
  } else {
    error('Admin aracı secret.key içermiyor — LisansYonetici key üretemez');
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// SONUÇ
// ──────────────────────────────────────────────────────────────────────────────
console.log('═'.repeat(70));
console.log(`\n✅ Kontroller tamamlandı: ${errors} hata, ${warnings} uyarı\n`);

if (errors > 0) {
  console.error('❌ RELEASE BAŞARISIZ - Hataları düzeltin ve tekrar çalıştırın\n');
  process.exit(1);
}

if (warnings > 0) {
  console.warn('⚠️  Uyarılar var - gözden geçirin\n');
}

console.log('✓ Release hijyeni TAMAM - build devam edebilir\n');
