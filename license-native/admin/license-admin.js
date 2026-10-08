#!/usr/bin/env node
// admin/license-admin.js - CLI (ince kabuk, tüm mantık core'dan)
'use strict';

const readline = require('readline');
const core = require('./core/license-core');

// Helper: prompt password
function promptPassword(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    // Hide input
    const stdin = process.stdin;
    const setRawMode = stdin.setRawMode;
    
    let password = '';
    
    process.stdout.write(question);
    
    if (setRawMode) {
      stdin.setRawMode(true);
    }
    
    stdin.on('data', function onData(char) {
      char = char.toString('utf8');
      
      switch (char) {
        case '\n':
        case '\r':
        case '\u0004': // Ctrl+D
          stdin.removeListener('data', onData);
          if (setRawMode) stdin.setRawMode(false);
          process.stdout.write('\n');
          rl.close();
          resolve(password);
          break;
        case '\u0003': // Ctrl+C
          process.exit(1);
          break;
        case '\u007f': // Backspace
          password = password.slice(0, -1);
          process.stdout.clearLine();
          process.stdout.cursorTo(0);
          process.stdout.write(question + '*'.repeat(password.length));
          break;
        default:
          password += char;
          process.stdout.write('*');
          break;
      }
    });
  });
}

// Helper: get arg value
function getArg(args, name) {
  const idx = args.indexOf(name);
  return idx >= 0 && args[idx + 1] ? args[idx + 1] : null;
}

// Commands
async function cmdKeygen(args) {
  const force = args.includes('--force');
  const rotate = args.includes('--rotate');

  if (rotate) {
    console.error('Key rotation henüz implement edilmedi');
    process.exit(1);
  }

  const password = await promptPassword('Yeni admin parolası (min 12 karakter): ');
  if (password.length < 12) {
    console.error('Parola en az 12 karakter olmalı');
    process.exit(1);
  }

  const result = core.keygen(password, { force });
  
  if (result.error) {
    console.error('HATA:', result.error);
    process.exit(1);
  }

  console.log('✓ Keypair oluşturuldu');
  console.log('Public key:', result.publicKey);
  console.log('\n' + result.message);
}

async function cmdDecodeRequest(args) {
  const code = getArg(args, '--request') || args[1];
  if (!code) {
    console.error('Kullanım: decode-request <İSTEK_KODU>');
    process.exit(1);
  }

  const result = core.decodeRequest(code);
  
  if (!result.valid) {
    console.error('HATA:', result.error);
    process.exit(1);
  }

  console.log('✓ İstek kodu geçerli');
  console.log('Hesap ID:', result.accountIdFormatted);
  console.log('Device Anchor:', result.deviceAnchor.toString('hex'));
  console.log('Account ID (hex):', result.accountId.toString('hex'));
}

async function cmdSign(args) {
  const password = await promptPassword('Admin parolası: ');
  if (!core.unlock(password)) {
    console.error('Parola yanlış!');
    process.exit(1);
  }

  const requestCode = getArg(args, '--request');
  if (!requestCode) {
    console.error('--request <İSTEK_KODU> gerekli');
    process.exit(1);
  }

  const plan = getArg(args, '--plan');
  const daysStr = getArg(args, '--days');
  
  if (!plan && !daysStr) {
    console.error('--plan <monthly|quarterly|semiannual|yearly> veya --days <1-730> gerekli');
    process.exit(1);
  }

  const params = {
    requestCode,
    plan: plan || null,
    days: daysStr ? parseInt(daysStr) : null,
    features: parseInt(getArg(args, '--features') || '0x3F', 16),
    maxRegisters: parseInt(getArg(args, '--max-registers') || '0'),
    activateByDays: parseInt(getArg(args, '--activate-days') || '14'),
    extend: !args.includes('--no-extend'),
    note: getArg(args, '--note') || '',
    platform: 'cli'
  };

  const result = core.createKey(params);
  
  core.lock();

  if (result.error) {
    console.error('HATA:', result.error);
    process.exit(1);
  }

  if (result.rootCode) {
    console.log('\n=== KÖK KOD (önce girin) ===');
    console.log(result.rootCode);
    console.log('');
  }

  console.log('=== LİSANS ANAHTARI ===');
  console.log(result.key);
  console.log('');
  console.log('Sequence:', result.seq);
  console.log('Süre bitişi (tahmini):', result.expiryPreview);
  console.log('');
  console.log('✓ Anahtar oluşturuldu ve issued.json\'a kaydedildi');
}

async function cmdInspect(args) {
  const key = getArg(args, '--key') || args[1];
  if (!key) {
    console.error('Kullanım: inspect <ANAHTAR>');
    process.exit(1);
  }

  const result = core.inspectKey(key);
  
  if (result.error) {
    console.error('HATA:', result.error);
    process.exit(1);
  }

  console.log('=== ANAHTAR İNCELEME ===');
  console.log('Version:', result.version);
  console.log('Key ID:', result.keyId);
  console.log('Hesap ID:', result.accountId);
  console.log('Device Anchor:', result.deviceAnchor);
  console.log('Plan:', result.plan);
  console.log('Flags:', result.flags);
  console.log('Features:', result.features);
  console.log('Max Registers:', result.maxRegisters);
  console.log('Sequence:', result.sequence);
  console.log('Issued At:', result.issuedAt);
  console.log('Activate By:', result.activateBy);
  console.log('Duration Days:', result.durationDays);
  console.log('Signature:', result.signature);
}

async function cmdRoot(args) {
  const password = await promptPassword('Admin parolası: ');
  if (!core.unlock(password)) {
    console.error('Parola yanlış!');
    process.exit(1);
  }

  const accountId = getArg(args, '--account') || args[1];
  if (!accountId) {
    console.error('Kullanım: root <HESAP_ID>');
    process.exit(1);
  }

  // Decode account ID
  const codec = require('./core/codec');
  const accountIdBytes = codec.decodeAccountId(accountId);
  if (!accountIdBytes) {
    console.error('Geçersiz hesap ID');
    process.exit(1);
  }

  const rootCode = core.generateRootCode(accountIdBytes);
  
  core.lock();

  console.log('=== KÖK KOD ===');
  console.log(rootCode);
}

async function cmdRebind(args) {
  const password = await promptPassword('Admin parolası: ');
  if (!core.unlock(password)) {
    console.error('Parola yanlış!');
    process.exit(1);
  }

  const requestCode = getArg(args, '--request') || args[1];
  if (!requestCode) {
    console.error('Kullanım: rebind <YENİ_CİHAZ_İSTEK_KODU>');
    process.exit(1);
  }

  const result = core.makeRebindCode(requestCode);
  
  core.lock();

  if (result.error) {
    console.error('HATA:', result.error);
    process.exit(1);
  }

  console.log('=== REBIND ANAHTARI ===');
  console.log(result.key);
  console.log('');
  console.log('=== KÖK KOD (yeni cihazda gerekli) ===');
  console.log(result.rootCode);
  console.log('');
  console.log('Rebind sayısı:', result.rebindCount);
  if (result.rebindCount >= 2) {
    console.log('⚠️  UYARI: Bu hesap için 2+ rebind yapıldı!');
  }
}

async function cmdClockReset(args) {
  const password = await promptPassword('Admin parolası: ');
  if (!core.unlock(password)) {
    console.error('Parola yanlış!');
    process.exit(1);
  }

  const requestCode = getArg(args, '--request') || args[1];
  if (!requestCode) {
    console.error('Kullanım: clock-reset <İSTEK_KODU>');
    process.exit(1);
  }

  const result = core.makeClockResetCode(requestCode);
  
  core.lock();

  if (result.error) {
    console.error('HATA:', result.error);
    process.exit(1);
  }

  console.log('=== CLOCK-RESET ANAHTARI ===');
  console.log(result.key);
  console.log('');
  console.log('✓ Saat kurtarma anahtarı oluşturuldu');
}

async function cmdList(args) {
  const accountId = getArg(args, '--account');
  const showRebind = args.includes('--rebind-count');

  const keys = core.listKeys({ accountId: accountId || undefined });

  if (keys.length === 0) {
    console.log('Kayıtlı anahtar yok');
    return;
  }

  console.log('=== KAYITLI ANAHTARLAR ===');
  console.log('');

  keys.forEach((k, idx) => {
    console.log(`[${idx + 1}] ${k.accountIdFormatted} - ${k.plan} (${k.days} gün)`);
    console.log(`    Seq: ${k.seq} | Platform: ${k.platform} | Issued: ${k.issuedAt}`);
    if (showRebind && k.rebindCount > 0) {
      console.log(`    ⚠️  Rebind: ${k.rebindCount}`);
    }
    if (k.note) {
      console.log(`    Not: ${k.note}`);
    }
    console.log('');
  });
}

// Main
async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0];

  if (!cmd || cmd === 'help' || cmd === '--help') {
    console.log(`
Kullanım: node license-admin.js <komut> [seçenekler]

Komutlar:
  keygen [--force]                     Yeni keypair oluştur
  decode-request <İSTEK_KODU>          İstek kodunu decode et
  sign --request <KOD> --plan <PLAN>   Lisans anahtarı üret
       [--days <GÜN>]                  Özel gün sayısı (plan yerine)
       [--features <HEX>]              Özellik bitleri (varsayılan 0x3F)
       [--max-registers <N>]           Max kasa sayısı (0=sınırsız)
       [--activate-days <GÜN>]         Aktivasyon süresi (varsayılan 14)
       [--no-extend]                   Süreyi üstüne ekleme
       [--note <AÇIKLAMA>]             Not
  inspect <ANAHTAR>                    Anahtarı incele
  root <HESAP_ID>                      Kök kod üret
  rebind <YENİ_İSTEK_KODU>             Cihaz değişimi anahtarı
  clock-reset <İSTEK_KODU>             Saat kurtarma anahtarı
  list [--account <HESAP_ID>]          Kayıtları listele
       [--rebind-count]                Rebind sayılarını göster

Planlar: monthly, quarterly, semiannual, yearly

Örnekler:
  node license-admin.js keygen
  node license-admin.js decode-request XXXX-XXXX-XXXX-XXXX-XXXX-XXXX
  node license-admin.js sign --request <KOD> --plan yearly --note "Müşteri A"
  node license-admin.js sign --request <KOD> --days 45
  node license-admin.js inspect <ANAHTAR>
  node license-admin.js list --rebind-count
`);
    process.exit(0);
  }

  try {
    switch (cmd) {
      case 'keygen':
        await cmdKeygen(args);
        break;
      case 'decode-request':
        await cmdDecodeRequest(args);
        break;
      case 'sign':
        await cmdSign(args);
        break;
      case 'inspect':
        await cmdInspect(args);
        break;
      case 'root':
        await cmdRoot(args);
        break;
      case 'rebind':
        await cmdRebind(args);
        break;
      case 'clock-reset':
        await cmdClockReset(args);
        break;
      case 'list':
        await cmdList(args);
        break;
      default:
        console.error('Bilinmeyen komut:', cmd);
        console.error('Yardım için: node license-admin.js help');
        process.exit(1);
    }
  } catch (err) {
    console.error('HATA:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
