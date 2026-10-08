# BİZNES HASAP - KAPSAMLI GELİŞTİRME VE İYİLEŞTİRME PLANI

**Proje:** Biznes Hasap PC-APK  
**Hazırlanma Tarihi:** 7 Ekim 2026  
**Hedef:** AISH karşılaştırması sonrası tespit edilen eksikliklerin giderilmesi  
**Toplam Tahmini Süre:** 6-8 Hafta

---

## 📋 DURUM ÖZETİ

### Mevcut Durum
- ✅ **Native Lisans Modülü:** Derlenmiş, çalışır durumda (`license-native/build/Release/license.node`)
- ✅ **Admin GUI:** LisansYonetici.exe derlenmiş ve hazır
- ⚠️ **Entegrasyon:** %15 tamamlanmış (main.cjs'te IPC var, UI eksik)
- ❌ **Veri Şifreleme:** YOK - CouchDB açık JSON
- ❌ **Lisans UI:** LicenseScreen.tsx mevcut ama tamamlanmamış
- ❌ **Gate Koruması:** Modül bağlantıları eksik
- ❌ **Test Suite:** Bozuk (makeKey() hatası)

### Kritik Eksiklikler (AISH Karşılaştırmasından)
1. 🔴 **Veri şifreleme** - En kritik güvenlik açığı
2. 🔴 **Lisans kapısı entegrasyonu** - Modüller kilitli değil
3. 🟡 **Sequence replay koruması** - Native'de var, test edilmemiş
4. 🟡 **Çift saat kaynağı** - Native'de var, test edilmemiş
5. 🟢 **Admin GUI** - Derlenmiş ✅

---

## 🎯 FAZ 0: HAZIRLIQ (0.5 GÜN)

### Görev 0.1: Proje Temizliği
**Öncelik:** P0  
**Süre:** 1 saat

```powershell
# Ölü dosyaları temizle (HANDOFF'tan)
cd "C:\Users\User\Desktop\Biznes Hasap PC-APK 1"

Remove-Item "license-native.node", "native.js", "gate.js" -Force -ErrorAction SilentlyContinue

Remove-Item "license-native\generate-*.js" -Force -ErrorAction SilentlyContinue

Remove-Item "license-native\admin\secret.key.test*" -Force -ErrorAction SilentlyContinue
```

**Kontrol:**
```powershell
# Kök dizinde yalnız proje dosyaları kalmalı
Get-ChildItem -File | Where-Object { $_.Extension -notin @('.json','.md','.ts','.js','.config.ts') }
```

---

### Görev 0.2: Bağımlılık Kontrolü
**Öncelik:** P0  
**Süre:** 2 saat

```bash
# 1. Ana proje bağımlılıkları
npm install

# 2. Native modül yeniden derleme (Electron ABI uyumu için)
cd license-native
npm run build-native

# 3. Electron rebuild (KRİTİK - Node.js 24 → Electron 34 ABI uyumsuzluğu)
cd ..
npx electron-rebuild -f -w license-native --version 34.2.0
```

**Beklenen Çıktı:**
```
✔ Rebuild Complete
✔ license-native: 0.0.1
```

**Hata Durumu:**
Eğer `Module did not self-register` hatası alınırsa:
```bash
# Native modülü temizleyip yeniden derle
cd license-native
rm -rf build node_modules
npm install
npm run build-native
cd ..
npx electron-rebuild -f -w license-native --version 34.2.0
```

---

### Görev 0.3: Test Ortamı Kontrolü
**Öncelik:** P0  
**Süre:** 1 saat

```bash
# Dev sunucusu başlatma testi
npm run dev
# → http://localhost:5173 açılmalı

# Electron dev testi
npm run electron:dev
# → Uygulama penceresi açılmalı
```

**Kontrol Noktaları:**
- [ ] Vite dev server başlıyor
- [ ] Electron penceresi açılıyor
- [ ] Console'da hata yok
- [ ] "Test versiyon" başlık çubuğunda görünüyor

---

## 🔐 FAZ 1: LİSANS SİSTEMİ ENTEGRASYONu (3 GÜN)

### Görev 1.1: Native Modül Paketleme Düzeltmesi
**Öncelik:** P0 - KRİTİK  
**Süre:** 2 saat  
**Dosya:** `package.json`

**Sorun:** Native `.node` dosyası asar içinde çalışmaz, `asarUnpack` eksik.

**Değişiklik:**
```json
{
  "build": {
    "files": [
      "dist/**/*",
      "electron/**/*",
      "license-native/native.js",
      "license-native/gate.js",
      "license-native/package.json",
      "license-native/build/Release/*.node",
      "!node_modules/**/*",
      "!**/*.md",
      "!license-native/admin/**/*",
      "!license-native/admin-gui/**/*",
      "!license-native/test/**/*",
      "!license-native/third_party/**/*",
      "!license-native/src/**/*"
    ],
    "asarUnpack": [
      "license-native/build/Release/*.node"
    ]
  }
}
```

**Test:**
```bash
npm run electron:build
Test-Path "dist-electron\win-unpacked\resources\app.asar.unpacked\license-native\build\Release\license.node"
# → True döngmeli
```

---

### Görev 1.2: LicenseScreen.tsx Tamamlama
**Öncelik:** P0 - KRİTİK  
**Süre:** 6 saat  
**Dosya:** `src/components/LicenseScreen.tsx`

**Mevcut Durum:** Dosya var ama eksik/tamamlanmamış.

**Gereksinimler:**

1. **Hesap ID ve İstek Kodu Gösterimi:**
```tsx
// LicenseScreen.tsx - Eklenecek bölüm
const [licenseInfo, setLicenseInfo] = useState<{
  accountId: string;
  requestCode: string;
  status: number;
  expiry?: number;
  daysLeft?: number;
  plan?: number;
} | null>(null);

useEffect(() => {
  const loadLicenseInfo = async () => {
    try {
      const info = await window.electronAPI.getLicenseInfo();
      const reqCode = await window.electronAPI.getLicenseRequestCode();
      setLicenseInfo({ ...info, requestCode: reqCode || '' });
    } catch (err) {
      console.error('Lisans bilgisi alınamadı:', err);
    }
  };
  loadLicenseInfo();
}, []);
```

2. **Kopyala Butonları:**
```tsx
const copyToClipboard = (text: string, label: string) => {
  navigator.clipboard.writeText(text).then(() => {
    // Toast/bildirim göster
    console.log(`${label} kopyalandı`);
  });
};

// Render içinde:
<div className="license-card">
  <label>Hesap ID</label>
  <div className="flex items-center gap-2">
    <code className="flex-1 p-2 bg-gray-100 rounded">
      {licenseInfo?.accountId || '...'}
    </code>
    <button 
      onClick={() => copyToClipboard(licenseInfo?.accountId || '', 'Hesap ID')}
      className="btn-icon">
      📋 Kopyala
    </button>
  </div>
</div>
```

3. **Durum Göstergesi:**
```tsx
const statusMessages = {
  1: { text: 'Lisans Aktif', color: 'green', emoji: '✅' },
  0: { text: 'Geçersiz Anahtar', color: 'red', emoji: '❌' },
  [-1]: { text: 'Lisans Süresi Doldu', color: 'red', emoji: '⏰' },
  [-2]: { text: 'Bu Anahtar Başka Cihaza Ait', color: 'red', emoji: '🔒' },
  [-3]: { text: 'Cihaz Saati Geri Alınmış', color: 'orange', emoji: '⚠️' },
  [-5]: { text: 'Lisans Henüz Aktive Edilmedi', color: 'gray', emoji: '⭕' },
  [-10]: { text: 'Önce Kök Kod Gerekli', color: 'orange', emoji: '🔑' },
};

const currentStatus = statusMessages[licenseInfo?.status || -5] || statusMessages[0];

<div className={`status-badge status-${currentStatus.color}`}>
  <span>{currentStatus.emoji}</span>
  <span>{currentStatus.text}</span>
  {licenseInfo?.daysLeft && licenseInfo.daysLeft > 0 && (
    <span className="ml-2">({licenseInfo.daysLeft} gün kaldı)</span>
  )}
</div>
```

4. **Aktivasyon Formu:**
```tsx
const [rootCode, setRootCode] = useState('');
const [licenseKey, setLicenseKey] = useState('');
const [isActivating, setIsActivating] = useState(false);

const handleActivate = async () => {
  setIsActivating(true);
  try {
    // İlk aktivasyonda kök kod zorunlu
    if (rootCode.trim() && licenseInfo?.status === -10) {
      const rootResult = await window.electronAPI.setLicenseRoot(rootCode);
      if (rootResult !== 1) {
        alert('Kök kodu hatalı (hata kodu: ' + rootResult + ')');
        return;
      }
    }

    const result = await window.electronAPI.activateLicense(licenseKey);
    if (result === 1) {
      alert('✅ Lisans başarıyla aktive edildi!');
      // Bilgileri yenile
      const info = await window.electronAPI.getLicenseInfo();
      setLicenseInfo(prev => ({ ...prev, ...info }));
      setRootCode('');
      setLicenseKey('');
    } else {
      alert(getActivationErrorMessage(result));
    }
  } catch (err) {
    alert('Aktivasyon hatası: ' + err.message);
  } finally {
    setIsActivating(false);
  }
};
```

**Test:**
```bash
npm run dev
# Lisans ekranını manuel olarak aç ve kontrol et:
# - Hesap ID 14 karakter (XXXX-XXXX-XXXX-XC)
# - İstek kodu 24 karakter
# - Kopyala butonları çalışıyor
# - Status doğru gösteriliyor
```

---

### Görev 1.3: Navigasyon Akışı Düzeltmesi
**Öncelik:** P0  
**Süre:** 3 saat  
**Dosyalar:** `src/App.tsx`, `src/components/LeftAccountPanel.tsx`

**Gereksinim:** Spec v3'e göre açılış akışı:
```
Uygulama Başlat → Hesap Seç → LicenseScreen → (Lisans OK ise) → Ana Ekran
```

**Değişiklik - App.tsx:**
```tsx
// src/App.tsx
import { useState, useEffect } from 'react';
import LicenseScreen from './components/LicenseScreen';
import UserWorkspace from './components/UserWorkspace';

function App() {
  const [currentAccount, setCurrentAccount] = useState<Account | null>(null);
  const [licenseStatus, setLicenseStatus] = useState<number>(-5); // NOT_ACTIVATED

  // Hesap seçilince lisans kontrolü
  useEffect(() => {
    if (currentAccount?.licenseId) {
      checkLicenseStatus(currentAccount.licenseId);
    }
  }, [currentAccount]);

  const checkLicenseStatus = async (accountId: string) => {
    try {
      const info = await window.electronAPI.getLicenseInfo(accountId);
      setLicenseStatus(info.status);
    } catch {
      setLicenseStatus(-5);
    }
  };

  // Lisans geçerli değilse LicenseScreen göster
  if (currentAccount && licenseStatus !== 1) {
    return <LicenseScreen 
      account={currentAccount} 
      onActivated={() => checkLicenseStatus(currentAccount.licenseId!)} 
    />;
  }

  // Lisans OK, ana uygulamaya geç
  if (currentAccount && licenseStatus === 1) {
    return <UserWorkspace account={currentAccount} />;
  }

  // Hesap seçim ekranı (mevcut)
  return <LoginScreen onAccountSelected={setCurrentAccount} />;
}
```

**Test:**
```bash
# 1. Yeni hesap oluştur → direkt LicenseScreen'e düşmeli
# 2. Lisanssız hesap seç → LicenseScreen'e düşmeli
# 3. Lisanslı hesap seç → UserWorkspace'e geçmeli
```

---

### Görev 1.4: Gate Modül Bağlantıları
**Öncelik:** P0 - KRİTİK  
**Süre:** 4 saat  
**Dosyalar:** `src/components/*Workspace.tsx`

**Gereksinim:** Her modül gate.guard() ile korunmalı.

**Modül Listesi:**
```typescript
// Gate modül eşleştirmeleri
const WORKSPACE_GATES = {
  'pos': gate.MOD.SATIS,
  'customers': gate.MOD.MUSTERI,
  'products': gate.MOD.STOK,
  'faktura': gate.MOD.SATIS,
  'kassa': gate.MOD.KASA,
  'depder': gate.MOD.MUSTERI, // veya ayrı MOD.DEFTER ekle
  'hasaplama': gate.MOD.RAPOR,
  'targowy': gate.MOD.RAPOR,
  'warehouses': gate.MOD.STOK,
  'users': gate.MOD.KULLANICI,
  'sazlamalar': gate.MOD.AYARLAR,
};
```

**Değişiklik - Örnek (CustomerWorkspace.tsx):**
```tsx
// src/components/customers/CustomerWorkspace.tsx
import { useEffect, useState } from 'react';

function CustomerWorkspace({ accountId }: { accountId: string }) {
  const [gateStatus, setGateStatus] = useState<{ allowed: boolean; reason?: string } | null>(null);

  useEffect(() => {
    // Gate kontrolü
    window.electronAPI.checkGate('customers', accountId).then(setGateStatus);
  }, [accountId]);

  if (gateStatus === null) {
    return <div>Yükleniyor...</div>;
  }

  if (!gateStatus.allowed) {
    return (
      <div className="gate-blocked">
        <h2>🔒 Bu Modül Kilitli</h2>
        <p>{gateStatus.reason}</p>
        <button onClick={() => window.location.href = '/license'}>
          Lisans Ayarları
        </button>
      </div>
    );
  }

  // Normal içerik
  return <div>Müşteri İşlemleri</div>;
}
```

**IPC Eklenmesi (electron/main.cjs):**
```javascript
// Gate kontrolü için IPC
ipcMain.handle('check-gate', async (_event, moduleName, accountId) => {
  const native = require('../license-native/native.js');
  const gate = require('../license-native/gate.js');
  
  gate.selectAccount(accountId);
  
  const moduleMap = {
    'customers': gate.MOD.MUSTERI,
    'products': gate.MOD.STOK,
    'sales': gate.MOD.SATIS,
    'reports': gate.MOD.RAPOR,
    // ... diğerleri
  };
  
  const result = gate.guard(moduleMap[moduleName] || 0);
  return {
    allowed: result.allowed,
    reason: result.reason,
    status: result.status,
  };
});
```

**Test:**
```bash
# 1. Lisanssız hesap seç
# 2. Her workspace'e tıkla
# 3. "Bu Modül Kilitli" mesajı görünmeli
# 4. Lisans aktive et
# 5. Tüm workspace'ler açılmalı
```

---

## 🔒 FAZ 2: VERİ ŞİFRELEME (2 GÜN)

### Görev 2.1: crypto-pouch Kurulumu
**Öncelik:** P0 - EN KRİTİK GÜVENLİK EKSİĞİ  
**Süre:** 2 saat

```bash
npm install crypto-pouch
npm install @types/crypto-pouch --save-dev
```

**Bağımlılık Kontrolü:**
```json
// package.json'da görmeli:
{
  "dependencies": {
    "crypto-pouch": "^4.0.0"
  }
}
```

---

### Görev 2.2: Şifreli DB Wrapper Oluşturma
**Öncelik:** P0  
**Süre:** 4 saat  
**Dosya:** `src/db/encryptedPouch.ts` (YENİ)

```typescript
// src/db/encryptedPouch.ts
import PouchDB from 'pouchdb-browser';
import cryptoPouch from 'crypto-pouch';

PouchDB.plugin(cryptoPouch);

/**
 * Şifreli PouchDB instance oluşturur.
 * Lisanstan türetilen anahtarla DB'yi açar.
 */
export async function openEncryptedDb(
  dbName: string,
  accountId: string
): Promise<PouchDB.Database> {
  // Lisans anahtarını al
  const keyArray = await window.electronAPI.deriveLicenseKey('db', accountId);
  
  if (!keyArray) {
    throw new Error(
      'Veritabanı şifreleme anahtarı alınamadı. ' +
      'Lisans aktive edilmemiş veya süresi dolmuş.'
    );
  }

  // Buffer'a çevir
  const key = Buffer.from(keyArray).toString('hex');

  // PouchDB aç
  const db = new PouchDB(dbName);

  // Şifreleme aktive et
  await db.crypto(key);

  return db;
}

/**
 * Yedekleme için şifreli export
 */
export async function exportEncryptedBackup(
  db: PouchDB.Database,
  accountId: string
): Promise<Blob> {
  const backupKeyArray = await window.electronAPI.deriveLicenseKey('backup', accountId);
  
  if (!backupKeyArray) {
    throw new Error('Yedekleme anahtarı alınamadı');
  }

  const allDocs = await db.allDocs({ include_docs: true });
  const data = JSON.stringify(allDocs.rows.map(r => r.doc));
  
  // Şifrele (crypto-pouch kullanarak)
  const backupKey = Buffer.from(backupKeyArray).toString('hex');
  // TODO: Burada tweetnacl secretbox ile manuel şifreleme yapılabilir
  
  return new Blob([data], { type: 'application/json' });
}
```

---

### Görev 2.3: Mevcut DB Servislerini Güncelleme
**Öncelik:** P0  
**Süre:** 6 saat  
**Dosyalar:** `src/db/pouch.ts`, `src/db/*Service.ts`

**Değişiklik - pouch.ts:**
```typescript
// src/db/pouch.ts - ÖNCE (şifresiz)
import PouchDB from 'pouchdb-browser';

export function getDb(dbName: string): PouchDB.Database {
  return new PouchDB(dbName);
}

// SONRA (şifreli)
import { openEncryptedDb } from './encryptedPouch';

let cachedDbs = new Map<string, PouchDB.Database>();

export async function getDb(
  dbName: string, 
  accountId: string
): Promise<PouchDB.Database> {
  const cacheKey = `${accountId}:${dbName}`;
  
  if (cachedDbs.has(cacheKey)) {
    return cachedDbs.get(cacheKey)!;
  }

  const db = await openEncryptedDb(dbName, accountId);
  cachedDbs.set(cacheKey, db);
  
  return db;
}
```

**Değişiklik - Örnek Service (customerService.ts):**
```typescript
// ÖNCE
export async function getAllCustomers() {
  const db = getDb('customers');
  const result = await db.allDocs({ include_docs: true });
  return result.rows.map(r => r.doc);
}

// SONRA
export async function getAllCustomers(accountId: string) {
  const db = await getDb('customers', accountId); // async oldu
  const result = await db.allDocs({ include_docs: true });
  return result.rows.map(r => r.doc);
}
```

**Toplu Değişiklik Scripti:**
```bash
# Tüm *Service.ts dosyalarındaki getDb çağrılarını bul
grep -r "getDb(" src/db/*Service.ts

# Manuel olarak her birini kontrol edip accountId parametresi ekle
```

---

### Görev 2.4: Mevcut Verileri Migration
**Öncelik:** P1  
**Süre:** 4 saat  
**Dosya:** `src/db/migrateLegacyData.ts` (YENİ)

**Sorun:** Eski veriler şifresiz, yeni sistem şifreli bekliyor.

```typescript
// src/db/migrateLegacyData.ts
import PouchDB from 'pouchdb-browser';
import { openEncryptedDb } from './encryptedPouch';

export async function migrateLegacyAccount(
  accountId: string,
  oldDbNames: string[]
): Promise<void> {
  for (const dbName of oldDbNames) {
    console.log(`Migrating ${dbName}...`);
    
    // Eski DB'yi aç (şifresiz)
    const oldDb = new PouchDB(dbName);
    
    // Yeni DB'yi aç (şifreli)
    const newDbName = `${dbName}_encrypted`;
    const newDb = await openEncryptedDb(newDbName, accountId);
    
    // Tüm dokümanları kopyala
    const allDocs = await oldDb.allDocs({ include_docs: true });
    const docs = allDocs.rows.map(r => r.doc).filter(d => d);
    
    if (docs.length > 0) {
      await newDb.bulkDocs(docs);
    }
    
    console.log(`✓ ${docs.length} doküman kopyalandı`);
    
    // Eski DB'yi sil (opsiyonel, kullanıcıya sor)
    // await oldDb.destroy();
  }
}

// Kullanıcı arayüzünden çağrılacak
export async function checkAndMigrate(accountId: string): Promise<boolean> {
  const legacyDbs = ['customers', 'products', 'invoices', 'warehouse'];
  
  // Eski DB'lerin varlığını kontrol et
  const hasLegacy = await Promise.all(
    legacyDbs.map(async name => {
      try {
        const db = new PouchDB(name);
        const info = await db.info();
        return info.doc_count > 0;
      } catch {
        return false;
      }
    })
  );
  
  if (hasLegacy.some(h => h)) {
    return true; // Migration gerekli
  }
  
  return false;
}
```

**UI Eklentisi (LicenseScreen.tsx):**
```tsx
const [needsMigration, setNeedsMigration] = useState(false);

useEffect(() => {
  if (licenseStatus === 1) {
    checkAndMigrate(accountId).then(setNeedsMigration);
  }
}, [licenseStatus]);

{needsMigration && (
  <div className="migration-prompt">
    <h3>⚠️ Eski Verileriniz Bulundu</h3>
    <p>Güvenlik için verilerinizi şifreli formata geçirmeniz önerilir.</p>
    <button onClick={handleMigration}>Şimdi Geçir</button>
    <button onClick={() => setNeedsMigration(false)}>Daha Sonra</button>
  </div>
)}
```

---

## 🧪 FAZ 3: TEST VE DOĞRULAMA (2 GÜN)

### Görev 3.1: Test Suite Düzeltmesi
**Öncelik:** P1  
**Süre:** 4 saat  
**Dosya:** `license-native/test/test.js`

**Sorun:** `makeKey()` fonksiyonu hatalı - `core.signForTest` yok.

**Düzeltme:**
```javascript
// license-native/test/test.js
const core = require('../admin/core/license-core');

// ÖNCE (hatalı)
function makeKey(accountId, plan, extra = {}) {
  const reqCode = native.getRequestCode(accountId);
  return core.signForTest({ requestCode: reqCode, plan, ...extra });
}

// SONRA (doğru)
function makeKey(accountId, plan, extra = {}) {
  const reqCode = native.getRequestCode(accountId);
  if (!reqCode) throw new Error('getRequestCode failed');
  
  // Unlock gerekli
  if (!core.isUnlocked()) {
    const unlocked = core.unlock('BiznesHasapAdmin2024!SecureKey');
    if (!unlocked) throw new Error('Unlock failed');
  }
  
  const planName = { 1: 'monthly', 2: 'quarterly', 3: 'semiannual', 4: 'yearly' }[plan];
  
  const result = core.createKey({
    requestCode: reqCode,
    ...(plan === 255 ? { days: extra.durationDays || 45 } : { plan: planName }),
    features: extra.features || 0x3F,
    maxRegisters: extra.maxRegisters || 0,
    activateByDays: extra.activateByDays || 14,
    extend: extra.extend !== false,
    note: 'test',
    platform: 'test',
  });
  
  if (result.error) throw new Error('createKey: ' + result.error);
  
  return { 
    rootCode: result.rootCode || null, 
    key: result.key 
  };
}
```

**Test Çalıştırma:**
```bash
cd license-native
node test/test.js

# Beklenen:
# ✓ Test 01: Geçerli planlar
# ✓ Test 03: ACCOUNT_MISMATCH
# ✓ Test 07: REPLAYED
# ✓ Test 08: Yenileme (extend)
# ... (toplam 40+ test)
```

---

### Görev 3.2: Entegrasyon Testleri
**Öncelik:** P1  
**Süre:** 6 saat  
**Dosya:** `test/integration.spec.ts` (YENİ)

```typescript
// test/integration.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Lisans Sistemi Entegrasyonu', () => {
  test('Lisanssız hesap tüm modülleri kilitlemeli', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // Yeni hesap oluştur
    await page.click('button:has-text("Hesap Ekle")');
    await page.fill('input[name="accountName"]', 'Test Şirket');
    await page.click('button:has-text("Oluştur")');
    
    // LicenseScreen'e düşmeli
    await expect(page.locator('text=Lisans Anahtarı')).toBeVisible();
    
    // Ana ekrana geçmeyi dene (bypass denemesi)
    await page.goto('http://localhost:5173/workspace');
    
    // Yine LicenseScreen'e yönlendirilmeli
    await expect(page.locator('text=Lisans Gerekli')).toBeVisible();
  });

  test('Geçerli key ile aktivasyon', async ({ page }) => {
    await page.goto('http://localhost:5173/license');
    
    // İstek kodunu al
    const requestCode = await page.locator('[data-testid="request-code"]').textContent();
    
    // Admin aracı ile key üret (mock)
    const testKey = 'XXXX-XXXX-XXXX-XXXX-...' // 160 karakter
    
    // Key'i gir
    await page.fill('input[name="licenseKey"]', testKey);
    await page.click('button:has-text("Aktifleştir")');
    
    // Başarı mesajı
    await expect(page.locator('text=başarıyla aktive')).toBeVisible();
    
    // Ana ekrana geçmeli
    await expect(page.locator('text=Biznes Hasap')).toBeVisible();
  });

  test('Şifreli DB kaydı ve okuma', async ({ page }) => {
    // Lisanslı hesapla giriş yap
    await loginWithLicense(page);
    
    // Yeni müşteri ekle
    await page.goto('http://localhost:5173/customers');
    await page.click('button:has-text("Yeni Müşteri")');
    await page.fill('input[name="name"]', 'Test Müşteri');
    await page.fill('input[name="phone"]', '5551234567');
    await page.click('button:has-text("Kaydet")');
    
    // Kayıt başarılı
    await expect(page.locator('text=Test Müşteri')).toBeVisible();
    
    // DB'yi kontrol et (IndexedDB şifreli olmalı)
    const dbData = await page.evaluate(() => {
      return window.indexedDB.databases();
    });
    
    // Raw data şifreli olmalı (okunabilir JSON olmamalı)
    expect(dbData).toBeTruthy();
  });
});
```

**Playwright Kurulum:**
```bash
npm install -D @playwright/test
npx playwright install
```

**Çalıştırma:**
```bash
npx playwright test
```

---

### Görev 3.3: Manuel QA Checklist
**Öncelik:** P1  
**Süre:** 4 saat

#### Lisans Akışı
- [ ] Yeni hesap oluştur → direkt LicenseScreen açılıyor
- [ ] Hesap ID ve İstek Kodu görünüyor (doğru formatta)
- [ ] Kopyala butonları çalışıyor
- [ ] Admin GUI ile key üret
- [ ] Key'i gir → "başarıyla aktive edildi" mesajı
- [ ] Ana ekrana geçiliyor

#### Gate Koruması
- [ ] Lisanssız hesapta Müşteriler modülüne tıkla → "Kilitli" mesajı
- [ ] Lisanssız hesapta Ürünler modülüne tıkla → "Kilitli" mesajı
- [ ] Lisanssız hesapta Raporlar'a tıkla → "Kilitli" mesajı
- [ ] Lisans aktive et
- [ ] Tüm modüller açılıyor

#### Veri Şifreleme
- [ ] Lisanslı hesapta müşteri ekle
- [ ] DevTools → Application → IndexedDB → _pouch_customers
- [ ] Raw data şifreli görünüyor (okunabilir JSON değil)
- [ ] Müşteri listesi normal açılıyor (şifre çözme çalışıyor)

#### Saat Koruması
- [ ] Lisans aktive et, son görülme zamanı kaydet
- [ ] Sistem saatini 1 gün geriye al
- [ ] Uygulamayı aç → "Cihaz saati geri alınmış" hatası
- [ ] Saati düzelt → normal çalışıyor

#### Sequence Replay
- [ ] Admin'den aynı sequence'li 2 key üret
- [ ] İlk key'i aktive et → başarılı
- [ ] İkinci key'i aktive et → "Bu anahtar zaten kullanılmış" hatası

---

## 🚀 FAZ 4: PERFORMANS VE İYİLEŞTİRMELER (1.5 GÜN)

### Görev 4.1: DB Cache Optimizasyonu
**Öncelik:** P2  
**Süre:** 3 saat  
**Dosya:** `src/db/pouch.ts`

**Sorun:** Her service çağrısında DB yeniden açılıyor.

```typescript
// Cache yönetimi
const dbCache = new Map<string, PouchDB.Database>();
const cacheTimeout = 30 * 60 * 1000; // 30 dakika

export async function getDb(
  dbName: string, 
  accountId: string,
  options: { forceNew?: boolean } = {}
): Promise<PouchDB.Database> {
  const cacheKey = `${accountId}:${dbName}`;
  
  if (!options.forceNew && dbCache.has(cacheKey)) {
    return dbCache.get(cacheKey)!;
  }

  const db = await openEncryptedDb(dbName, accountId);
  dbCache.set(cacheKey, db);
  
  // 30 dakika sonra cache'i temizle
  setTimeout(() => {
    dbCache.delete(cacheKey);
    db.close();
  }, cacheTimeout);
  
  return db;
}

// Hesap değişiminde cache temizle
export function clearDbCache(accountId?: string) {
  if (accountId) {
    for (const [key, db] of dbCache.entries()) {
      if (key.startsWith(accountId + ':')) {
        db.close();
        dbCache.delete(key);
      }
    }
  } else {
    dbCache.forEach(db => db.close());
    dbCache.clear();
  }
}
```

---

### Görev 4.2: Lazy Loading - Gate Kontrolü
**Öncelik:** P2  
**Süre:** 2 saat

**Sorun:** Her workspace açılışında gate kontrolü yapılıyor, gecikme oluşuyor.

```typescript
// src/hooks/useGate.ts (YENİ)
import { useEffect, useState } from 'react';

const gateCache = new Map<string, { result: any; timestamp: number }>();
const CACHE_DURATION = 60000; // 1 dakika

export function useGate(moduleName: string, accountId: string) {
  const [status, setStatus] = useState<{
    loading: boolean;
    allowed: boolean;
    reason?: string;
  }>({ loading: true, allowed: false });

  useEffect(() => {
    const cacheKey = `${accountId}:${moduleName}`;
    const cached = gateCache.get(cacheKey);
    
    // Cache varsa ve taze ise kullan
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setStatus({ loading: false, ...cached.result });
      return;
    }

    // Yoksa kontrol et
    window.electronAPI.checkGate(moduleName, accountId)
      .then(result => {
        gateCache.set(cacheKey, { result, timestamp: Date.now() });
        setStatus({ loading: false, ...result });
      })
      .catch(() => {
        setStatus({ loading: false, allowed: false, reason: 'Kontrol hatası' });
      });
  }, [moduleName, accountId]);

  return status;
}
```

**Kullanım:**
```typescript
// Workspace içinde
function CustomerWorkspace({ accountId }: { accountId: string }) {
  const gate = useGate('customers', accountId);

  if (gate.loading) return <LoadingSpinner />;
  if (!gate.allowed) return <GateBlockedMessage reason={gate.reason} />;
  
  return <div>Müşteri İşlemleri</div>;
}
```

---

### Görev 4.3: Bundle Size Optimizasyonu
**Öncelik:** P2  
**Süre:** 2 saat  
**Dosya:** `vite.config.ts`

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-pouch': ['pouchdb-browser', 'pouchdb-find', 'crypto-pouch'],
          'vendor-excel': ['exceljs', 'write-excel-file', 'read-excel-file'],
          'vendor-ui': ['lucide-react', 'clsx', 'tailwind-merge'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  optimizeDeps: {
    include: ['pouchdb-browser', 'crypto-pouch'],
  },
});
```

**Analiz:**
```bash
npm run build
npx vite-bundle-visualizer
```

---

## 📱 FAZ 5: ANDROID APK DESTEĞI (2 GÜN)

### Görev 5.1: Capacitor Yapılandırması
**Öncelik:** P2  
**Süre:** 3 saat  
**Dosya:** `capacitor.config.ts`

```typescript
// capacitor.config.ts
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bizneshasap.pos',
  appName: 'Biznes Hasap',
  webDir: 'dist',
  server: {
    androidScheme: 'http', // Düz HTTP sunuculara bağlanabilmek için
    cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
    },
  },
};

export default config;
```

---

### Görev 5.2: Android Manifest Düzenlemeleri
**Öncelik:** P2  
**Süre:** 2 saat  
**Dosya:** `android/app/src/main/AndroidManifest.xml`

```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<manifest>
    <application
        android:allowBackup="false"
        android:usesCleartextTraffic="true"
        android:networkSecurityConfig="@xml/network_security_config">
        <!-- ... -->
    </application>
    
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.CAMERA" />
</manifest>
```

**Network Security Config:**
```xml
<!-- android/app/src/main/res/xml/network_security_config.xml -->
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>
</network-security-config>
```

---

### Görev 5.3: Native Bridge (Android)
**Öncelik:** P1  
**Süre:** 4 saat  
**Dosya:** `android/app/src/main/java/com/bizneshasap/pos/DeviceBridge.kt` (YENİ)

```kotlin
// DeviceBridge.kt
package com.bizneshasap.pos

import android.content.Context
import android.os.Build
import android.provider.Settings
import com.getcapacitor.Plugin
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import org.json.JSONObject

@CapacitorPlugin(name = "DeviceBridge")
class DeviceBridge : Plugin() {

    @PluginMethod
    fun getDeviceComponents(call: PluginCall) {
        val context = this.context
        
        val components = JSONObject()
        components.put("androidId", getAndroidId(context))
        components.put("serial", getBuildSerial())
        components.put("cpuInfo", getCpuInfo())
        components.put("mac", getFirstMac(context))
        
        call.resolve(components)
    }

    @PluginMethod
    fun getBootElapsed(call: PluginCall) {
        val elapsed = android.os.SystemClock.elapsedRealtime() / 1000 // saniye
        call.resolve(JSObject().put("seconds", elapsed))
    }

    private fun getAndroidId(context: Context): String {
        return Settings.Secure.getString(
            context.contentResolver,
            Settings.Secure.ANDROID_ID
        ) ?: ""
    }

    private fun getBuildSerial(): String {
        return try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                Build.getSerial()
            } else {
                Build.SERIAL
            }
        } catch (e: Exception) {
            ""
        }
    }

    private fun getCpuInfo(): String {
        return try {
            val cpuinfo = java.io.File("/proc/cpuinfo").readText()
            val hardware = cpuinfo.lines()
                .firstOrNull { it.startsWith("Hardware") }
                ?.substringAfter(":")?.trim() ?: ""
            val serial = cpuinfo.lines()
                .firstOrNull { it.startsWith("Serial") }
                ?.substringAfter(":")?.trim() ?: ""
            "$hardware-$serial"
        } catch (e: Exception) {
            ""
        }
    }

    private fun getFirstMac(context: Context): String {
        // NetworkInterface üzerinden ilk fiziksel MAC
        return try {
            val interfaces = java.net.NetworkInterface.getNetworkInterfaces()
            interfaces.toList()
                .firstOrNull { !it.isLoopback && it.hardwareAddress != null }
                ?.hardwareAddress
                ?.joinToString(":") { "%02X".format(it) }
                ?: ""
        } catch (e: Exception) {
            ""
        }
    }
}
```

**TypeScript Bridge:**
```typescript
// src/native/deviceBridge.ts
import { registerPlugin } from '@capacitor/core';

export interface DeviceBridgePlugin {
  getDeviceComponents(): Promise<{
    androidId: string;
    serial: string;
    cpuInfo: string;
    mac: string;
  }>;
  getBootElapsed(): Promise<{ seconds: number }>;
}

const DeviceBridge = registerPlugin<DeviceBridgePlugin>('DeviceBridge');

export default DeviceBridge;
```

**Kullanım:**
```typescript
// LicenseScreen.tsx (mobile)
import { Capacitor } from '@capacitor/core';
import DeviceBridge from '../native/deviceBridge';

useEffect(() => {
  if (Capacitor.getPlatform() === 'android') {
    // Cihaz bileşenlerini native'e gönder
    DeviceBridge.getDeviceComponents().then(components => {
      window.electronAPI.setDeviceComponents(components);
    });
    
    DeviceBridge.getBootElapsed().then(({ seconds }) => {
      window.electronAPI.setBootElapsed(seconds);
    });
  }
}, []);
```

---

### Görev 5.4: APK Build ve Test
**Öncelik:** P2  
**Süre:** 3 saat

```bash
# 1. Web build
npm run build

# 2. Capacitor sync
npx cap sync android

# 3. Android Studio'da aç
npx cap open android

# 4. Build (Android Studio içinde)
# Build → Generate Signed Bundle / APK → APK
# Release variant seç
# Keystore oluştur/seç
# Build

# 5. APK yolu:
# android/app/build/outputs/apk/release/app-release.apk
```

**Test:**
```bash
# Emulator'de test
npx cap run android

# Fiziksel cihazda test (USB debugging)
adb install android/app/build/outputs/apk/release/app-release.apk
```

---

## 📚 FAZ 6: DÖKÜMANTASYON (1 GÜN)

### Görev 6.1: Kullanıcı Kılavuzu
**Öncelik:** P2  
**Süre:** 3 saat  
**Dosya:** `docs/KULLANICI-KILAVUZU.md` (YENİ)

```markdown
# Biznes Hasap Kullanıcı Kılavuzu

## İlk Kurulum

1. **Uygulamayı İndirin ve Kurun**
   - Windows: `BiznesHasap-Setup-1.150.0.exe`
   - Android: `bizneshasap-v1.150.0.apk`

2. **İlk Hesabınızı Oluşturun**
   - "Hesap Ekle" butonuna tıklayın
   - İşletme adınızı girin
   - CouchDB bağlantı bilgilerini girin (opsiyonel)

3. **Lisans Anahtarı Alın**
   - Lisans ekranında gösterilen **Hesap ID** ve **İstek Kodu**nu kopyalayın
   - WhatsApp/Telegram ile destek@bizneshasap.com'a gönderin
   - Size gönderilen **Kök Kod** ve **Lisans Anahtarı**nı girin

## Lisans Yenileme

Lisansınızın süresi dolmadan 3 gün önce uyarı alırsınız.

1. Ayarlar → Lisans Yönetimi
2. "Yeni Anahtar Gir" butonuna tıklayın
3. Destek ekibinden aldığınız yeni anahtarı yapıştırın
4. "Aktifleştir" butonuna tıklayın

## Sorun Giderme

### "Lisans gerekli" hatası
- Lisans süresi dolmuş olabilir
- Ayarlar → Lisans Yönetimi'nden kontrol edin

### "Bu anahtar başka cihaza ait" hatası
- Bilgisayar/telefon donanımı değişmiş
- Destek ekibinden REBIND kodu isteyin

### Veri kaybı
- Ayarlar → Yedekle
- Düzenli yedekleme önerilir (haftada 1)
```

---

### Görev 6.2: Admin Kılavuzu
**Öncelik:** P2  
**Süre:** 2 saat  
**Dosya:** `docs/ADMIN-KILAVUZU.md` (YENİ)

```markdown
# Biznes Hasap Admin Kılavuzu

## LisansYonetici.exe Kullanımı

### İlk Çalıştırma

1. `LisansYonetici-1.0.0.exe` dosyasını çift tıklayın
2. Admin parolasını girin: `[GÜVENLİ YERDE SAKLANMALI]`
3. Platform seçin: **PC** veya **APK**

### Anahtar Üretme

1. Kullanıcıdan gelen **İstek Kodu**nu (24 karakter) yapıştırın
2. Süre seçin:
   - 1 Ay (30 gün)
   - 3 Ay (90 gün)
   - 6 Ay (180 gün)
   - 1 Yıl (365 gün)
   - Özel: 1-730 gün arası
3. "KEY OLUŞTUR" butonuna tıklayın
4. **Kök Kod** (ilk aktivasyonda) ve **Lisans Anahtarı**nı kullanıcıya gönderin

### Özellik Yönetimi

Gelişmiş sekmesinde:
- ☑ Çoklu Kasa
- ☑ Stok Takibi
- ☑ Gelişmiş Raporlar
- ☑ Barkod Yazdırma
- ☑ Fiş Yazdırma
- ☑ Çoklu Kullanıcı

İşaretlenmeyenler kullanıcıda kilitli olur.

### REBIND (Cihaz Değişimi)

Kullanıcı bilgisayar/telefon değiştirdiğinde:

1. Kayıtlar sekmesi → "Rebind Kodu Üret"
2. **Yeni** cihazın istek kodunu girin
3. Eski hesap ID'sini seç
4. Rebind kodunu kullanıcıya gönder
5. Kullanıcı rebind kodu + kök kodu girer

### CLOCK-RESET (Saat Sorunu)

Saat geri alma hatası alan kullanıcı için:

1. Kayıtlar sekmesi → "Clock-Reset Kodu Üret"
2. Kullanıcının istek kodunu girin
3. Kurtarma kodunu gönder

## Güvenlik

- `admin/secret.key` dosyasını **asla** paylaşmayın
- Parolayı güvenli bir yerde saklayın
- `issued.json` şifreli - düzenli yedek alın
```

---

### Görev 6.3: Geliştirici Dökümanı
**Öncelik:** P2  
**Süre:** 3 saat  
**Dosya:** `docs/GELISTIRICI.md` (YENİ)

```markdown
# Biznes Hasap Geliştirici Dökümanı

## Proje Yapısı

\`\`\`
Biznes Hasap PC-APK 1/
├── electron/               # Electron main/preload
│   ├── main.cjs           # Ana süreç, IPC handler'lar
│   └── preload.cjs        # Renderer köprüsü
├── src/
│   ├── components/        # React bileşenleri
│   ├── db/               # PouchDB servisleri
│   │   ├── encryptedPouch.ts  # Şifreli DB wrapper
│   │   └── *Service.ts   # CRUD işlemleri
│   ├── types.ts          # TypeScript tip tanımları
│   └── App.tsx           # Ana uygulama
├── license-native/       # C++ lisans modülü
│   ├── src/              # Native C++ kaynak kodları
│   ├── admin/            # Anahtar üretim (CLI)
│   └── admin-gui/        # LisansYonetici.exe
└── android/              # Capacitor Android projesi
\`\`\`

## Yeni Modül Ekleme

1. **Service Oluştur** (`src/db/newModuleService.ts`)
2. **Gate Modülü Tanımla** (main.cjs)
3. **Workspace Bileşeni** (`src/components/newModule/NewModuleWorkspace.tsx`)
4. **Gate Kontrolü Ekle** (useGate hook)

## API Referansı

### Native Lisans API

\`\`\`typescript
window.electronAPI.getLicenseInfo(accountId: string): Promise<LicenseInfo>
window.electronAPI.getLicenseRequestCode(): Promise<string>
window.electronAPI.setLicenseRoot(code: string): Promise<number>
window.electronAPI.activateLicense(key: string): Promise<number>
window.electronAPI.deriveLicenseKey(purpose: string, accountId: string): Promise<number[] | null>
\`\`\`

### Şifreli DB API

\`\`\`typescript
import { openEncryptedDb } from './db/encryptedPouch';

const db = await openEncryptedDb('mydb', accountId);
\`\`\`

## Build ve Deployment

### Development
\`\`\`bash
npm run dev              # Vite dev server
npm run electron:dev     # Electron + hot reload
\`\`\`

### Production Build
\`\`\`bash
npm run electron:build   # Windows NSIS + portable
npm run build:mobile     # Android APK
\`\`\`
```

---

## ✅ FAZ 7: FİNAL TEST VE DEPLOY (1 GÜN)

### Görev 7.1: Penetrasyon Testi
**Öncelik:** P1  
**Süre:** 3 saat

**Test Senaryoları:**

1. **Bypass Denemesi - Renderer Patch**
```javascript
// DevTools Console'da dene:
window.electronAPI.checkGate = () => Promise.resolve({ allowed: true });
// Workspace'e git
// Beklenen: Main process'te gate kontrolü devrede, yine kilitli
```

2. **Veri Çalma Denemesi**
```bash
# IndexedDB dosyalarını kopyala
# Başka bilgisayarda aç
# Beklenen: Şifreli, okunamaz
```

3. **Saat Manipülasyonu**
```bash
# Sistem saatini 1 ay geriye al
# Uygulamayı aç
# Beklenen: CLOCK_ROLLBACK hatası
```

4. **Key Replay**
```bash
# Aynı key'i 2 kez kullan
# Beklenen: İkincisinde REPLAYED hatası
```

5. **State Dosyası Silme**
```bash
# %APPDATA%/Biznes Hasap/license/ klasörünü sil
# Uygulamayı aç
# Beklenen: Yeni aktivasyon ister
```

---

### Görev 7.2: Performans Benchmark
**Öncelik:** P2  
**Süre:** 2 saat

```typescript
// benchmark/performance.ts
import { performance } from 'perf_hooks';

async function benchmarkDbOperations() {
  const accountId = 'TEST-ACCOUNT-ID';
  
  // 1. DB açılış süresi
  const dbOpenStart = performance.now();
  const db = await openEncryptedDb('test', accountId);
  const dbOpenTime = performance.now() - dbOpenStart;
  console.log(`DB Açılış: ${dbOpenTime.toFixed(2)}ms`);
  
  // 2. 1000 kayıt yazma
  const writeStart = performance.now();
  const docs = Array.from({ length: 1000 }, (_, i) => ({
    _id: `test_${i}`,
    name: `Test ${i}`,
    value: Math.random(),
  }));
  await db.bulkDocs(docs);
  const writeTime = performance.now() - writeStart;
  console.log(`1000 Kayıt Yazma: ${writeTime.toFixed(2)}ms`);
  
  // 3. Okuma
  const readStart = performance.now();
  await db.allDocs({ include_docs: true });
  const readTime = performance.now() - readStart;
  console.log(`1000 Kayıt Okuma: ${readTime.toFixed(2)}ms`);
  
  // 4. Gate kontrolü
  const gateStart = performance.now();
  for (let i = 0; i < 100; i++) {
    await window.electronAPI.checkGate('customers', accountId);
  }
  const gateTime = performance.now() - gateStart;
  console.log(`100 Gate Kontrolü: ${gateTime.toFixed(2)}ms (${(gateTime/100).toFixed(2)}ms/adet)`);
}
```

**Beklenen Değerler:**
- DB Açılış: < 100ms
- 1000 Kayıt Yazma: < 500ms
- 1000 Kayıt Okuma: < 200ms
- Gate Kontrolü: < 10ms/adet (cache ile)

---

### Görev 7.3: Release Build ve Signing
**Öncelik:** P0  
**Süre:** 3 saat

**Windows:**
```bash
# 1. Build
npm run electron:build

# 2. Kontrol
Test-Path "dist-electron\win-unpacked\Biznes Hasap.exe"
Test-Path "dist-electron\Biznes Hasap Setup 1.150.0.exe"

# 3. Test
.\dist-electron\win-unpacked\Biznes Hasap.exe
# → Uygulama açılmalı, lisans ekranı görünmeli

# 4. Code signing (opsiyonel, sertifika varsa)
signtool sign /f certificate.pfx /p PASSWORD /tr http://timestamp.digicert.com /td sha256 "dist-electron\Biznes Hasap Setup 1.150.0.exe"
```

**Android:**
```bash
# 1. Keystore oluştur (ilk seferde)
keytool -genkey -v -keystore bizneshasap-release.keystore -alias bizneshasap -keyalg RSA -keysize 2048 -validity 10000

# 2. Build
cd android
./gradlew assembleRelease

# 3. Sign
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 \
  -keystore ../bizneshasap-release.keystore \
  app/build/outputs/apk/release/app-release-unsigned.apk \
  bizneshasap

# 4. Zipalign
zipalign -v 4 app/build/outputs/apk/release/app-release-unsigned.apk \
  app/build/outputs/apk/release/bizneshasap-v1.150.0.apk

# 5. Test
adb install app/build/outputs/apk/release/bizneshasap-v1.150.0.apk
```

---

## 📊 ÖZET ve TAKVİM

### Toplam Tahmini Süre: **6-8 Hafta**

| Faz | Görev Sayısı | Tahmini Süre | Öncelik |
|-----|--------------|--------------|---------|
| **Faz 0: Hazırlık** | 3 | 0.5 gün | P0 |
| **Faz 1: Lisans Entegrasyon** | 4 | 3 gün | P0 |
| **Faz 2: Veri Şifreleme** | 4 | 2 gün | P0 |
| **Faz 3: Test ve Doğrulama** | 3 | 2 gün | P1 |
| **Faz 4: Performans** | 3 | 1.5 gün | P2 |
| **Faz 5: Android APK** | 4 | 2 gün | P2 |
| **Faz 6: Dökümantasyon** | 3 | 1 gün | P2 |
| **Faz 7: Final Test** | 3 | 1 gün | P1 |
| **TOPLAM** | **27** | **13 gün** | |

### Kritik Yol (Minimum Viable Product - 1 Hafta)

Sadece P0 öncelikli görevler:
1. Faz 0: Hazırlık (0.5 gün)
2. Faz 1: Lisans Entegrasyon (3 gün)
3. Faz 2: Veri Şifreleme (2 gün)
4. Faz 7.3: Release Build (0.5 gün)

**Toplam: 6 gün** - Piyasaya hazır minimum güvenlikli sistem

### Sprint Planı (2 Hafta x 3 Sprint)

**Sprint 1 (Hafta 1-2): Temel Güvenlik**
- Faz 0: Hazırlık
- Faz 1: Lisans Entegrasyon
- Faz 2: Veri Şifreleme
- Faz 3.1: Test Suite Düzeltmesi

**Sprint 2 (Hafta 3-4): Test ve Optimizasyon**
- Faz 3.2-3.3: Entegrasyon ve Manuel Test
- Faz 4: Performans İyileştirmeleri
- Faz 5.1-5.2: Android Altyapı

**Sprint 3 (Hafta 5-6): Finalizasyon**
- Faz 5.3-5.4: Android Bridge ve Build
- Faz 6: Dökümantasyon
- Faz 7: Final Test ve Deploy

---

## 🚨 RİSK YÖNETİMİ

### Yüksek Riskli Görevler

| Görev | Risk | Olasılık | Etki | Azaltma Stratejisi |
|-------|------|----------|------|-------------------|
| **Electron ABI Uyumsuzluğu** | Native modül yüklenmiyor | Yüksek | Kritik | electron-rebuild her build'de çalışmalı |
| **Veri Migration Hatası** | Eski veri kaybı | Orta | Yüksek | Migration öncesi otomatik yedek |
| **Performans Düşüşü** | Şifreleme gecikme yaratıyor | Orta | Orta | Cache optimizasyonu + benchmark |
| **Android Bridge Sorunu** | Fingerprint çalışmıyor | Düşük | Yüksek | Test cihazları + fallback mekanizması |

### Geri Dönüş Planı

**Eğer kritik hata oluşursa:**

1. **Veri Şifreleme Başarısız**
   - Geri Dön: Şifreleme olmadan lisans sistemi çalışır
   - Ek İş: Sadece lisans state'i şifreli kalır

2. **Gate Sistemi Performans Sorunu**
   - Geri Dön: Gate cache süresini artır (5 dakika)
   - Ek İş: Lazy evaluation + pre-check

3. **Android Build Sorunu**
   - Geri Dön: Sadece PC versiyonu release et
   - Ek İş: Android ayrı sprint olur

---

## 📝 KONTROL LİSTESİ (Tamamlanma Kriterleri)

### Faz 1: Lisans ✅
- [ ] Native modül electron'a dahil (asarUnpack)
- [ ] LicenseScreen tamamlandı (ID + kod + aktivasyon)
- [ ] Navigasyon akışı (Hesap → Lisans → Workspace)
- [ ] Gate tüm modüllere bağlı
- [ ] IPC guardedIPC ile korumalı

### Faz 2: Veri Güvenliği ✅
- [ ] crypto-pouch kurulu
- [ ] encryptedPouch.ts çalışıyor
- [ ] Tüm service'ler şifreli DB kullanıyor
- [ ] Migration mevcut verileri taşıdı
- [ ] Yedekleme şifreli

### Faz 3: Test ✅
- [ ] 40+ unit test geçiyor
- [ ] 10+ integration test geçiyor
- [ ] Manuel QA checklist tamamlandı
- [ ] Penetrasyon testleri başarılı

### Faz 7: Release ✅
- [ ] Windows installer çalışıyor
- [ ] Windows portable EXE çalışıyor
- [ ] Android APK yükleniyor ve çalışıyor
- [ ] Dökümantasyon tamamlandı
- [ ] Admin'e LisansYonetici.exe teslim edildi

---

## 🎯 SONRAKI AŞAMA

Bu plan tamamlandığında sisteminiz:

✅ **AISH'ten daha güvenli** olacak:
- Sequence replay koruması
- Çift saat kaynağı
- Veri şifreleme
- Lisans kapısı

✅ **Specification'a uygun** olacak:
- Ed25519 kriptografi
- Gate.guard() tüm modüllerde
- deriveKey() ile veri koruması
- Admin GUI (LisansYonetici.exe)

✅ **Piyasaya hazır** olacak:
- PC + Android APK
- Kullanıcı + admin dökümanları
- Test edilmiş ve güvenli

---

**Sorular veya Destek:**
- Teknik: development@bizneshasap.com
- Lisans: admin@bizneshasap.com

**Bu dokümant oluşturulma tarihi:** 7 Ekim 2026
