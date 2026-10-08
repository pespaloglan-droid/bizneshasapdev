# BİZNES HASAP — YAPILDI/YAPILMADI ANALİZ RAPORU

**Analiz Tarihi:** 08 Ekim 2026  
**Proje Sürüm:** 1.150.0  
**Test Durumu:** 305 test geçiyor, 17 test dosyası  
**Kaynak:** BIZNESHASAP-GELISTIRME.md karşılaştırması

---

## İÇİNDEKİLER

1. [Özet Durum](#1-özet-durum)
2. [✅ Tamamlanan İşler](#2-tamamlanan-i̇şler)
3. [🟡 Kısmen Tamamlanan İşler](#3-kısmen-tamamlanan-i̇şler)
4. [❌ Yapılmayan İşler](#4-yapılmayan-i̇şler)
5. [🎯 Öncelikli Yapılacak Liste](#5-öncelikli-yapılacak-liste)
6. [📋 Detaylı İş Kartları](#6-detaylı-i̇ş-kartları)

---

## 1. ÖZET DURUM

### Test Kapsamı
```
✅ 305 test (17 dosya)
✅ conflictResolver.test.ts — VAR
✅ calcFlow.test.ts — VAR
✅ calcAssets.test.ts — VAR
✅ calcPeriods.test.ts — VAR
✅ auditLog.test.ts — VAR
✅ schemaBridge.test.ts — VAR
✅ prepareEncryption.test.ts — VAR
```

### Kritik Sorunlar
| # | Sorun | Durum |
|---|---|---|
| 1 | currency/ledger kapı açığı | ✅ **DÜZELTİLDİ** |
| 2 | PouchDB şifreleme bağlama | ✅ **DÜZELTİLDİ** |
| 3 | Audit log | ✅ **DÜZELTİLDİ** |
| 4 | conflictResolver testleri | ✅ **DÜZELTİLDİ** |
| 5 | Hesaplama testleri | ✅ **DÜZELTİLDİ** |

### Paket Durumu
```bash
✅ exceljs: 4.4.0
❌ read-excel-file: 9.3.10 (GEREKSİZ)
❌ write-excel-file: 4.1.1 (GEREKSİZ)
❌ zustand: YOK (gerekli)
❌ electron-updater: YOK (gerekli)
❌ @playwright/test: YOK (playwright-core var ama test harness yok)
```

---

## 2. ✅ TAMAMLANAN İŞLER

### 2.1 🔴 conflictResolver.ts Testleri
**Durum:** ✅ TAMAMLANDI

**Kanıt:**
```bash
tests/db/conflictResolver.test.ts — 12,015 byte
```

**İçerik:**
- `docTimestamp()` testleri
- `resolveConflicts()` testleri
- LWW davranışı kilitli
- Regression testleri mevcut

---

### 2.2 🟠 currency/ledger Kapı Açığı
**Durum:** ✅ DÜZELTİLDİ

**Kanıt:**
```typescript
// src/utils/gateMiddleware.ts (satır 38-41)
'currency': 'FIYAT',
'ledger': 'RAPOR',
```

**Testler:** `gateMiddleware.test.ts` (6,540 byte) içinde currency/ledger testleri var.

---

### 2.3 🟡 PouchDB Şifrelemesi Bağlandı
**Durum:** ✅ TAMAMLANDI

**Kanıt:**
```typescript
// src/App.tsx
import { prepareEncryption } from './init/prepareEncryption';

// src/db/pouch.ts
import { getCachedPassword, isEncryptionEnabled } from './encryptionState';
```

**Dosyalar:**
- `src/init/prepareEncryption.ts` — ✅ VAR
- `src/db/encryptionState.ts` — ✅ VAR
- `tests/init/prepareEncryption.test.ts` — ✅ VAR (2,141 byte)

**İşlevsellik:**
- ✅ Async hazırlık App.tsx'te
- ✅ getCachedPassword() senkron erişim
- ✅ Flag: `localStorage` (kalıcı)
- ✅ accounts.json şifreli DB dışında

---

### 2.4 🟠 Hesaplama Modülleri Testleri
**Durum:** ✅ TAMAMLANDI

**Kanıt:**
```bash
tests/utils/calcFlow.test.ts — 5,622 byte
tests/utils/calcAssets.test.ts — 9,816 byte
tests/utils/calcPeriods.test.ts — 6,052 byte
```

**Kapsam:**
- Para toplamları doğruluğu
- Dönem filtreleme
- Para birimi dönüşümü
- Varlık/stok hesaplamaları

---

### 2.5 Audit Log (FAZ 2.2)
**Durum:** ✅ TAMAMLANDI

**Kanıt:**
```typescript
// src/db/auditLog.ts — 173 satır, tam implementasyon
// tests/db/auditLog.test.ts — 5,336 byte
```

**Özellikler:**
- ✅ CREATE/UPDATE/DELETE/VIEW kayıtları
- ✅ Kullanıcı/zaman/değişiklik diff
- ✅ Bayrak kontrolü (`setAuditEnabled()`)
- ✅ Sağlık izleme (`getAuditHealth()`)
- ✅ pouch.ts'e entegre (`logAudit` çağrıları var)

---

### 2.6 schemaBridge Testleri
**Durum:** ✅ TAMAMLANDI

**Kanıt:**
```bash
tests/db/schemaBridge.test.ts — 9,408 byte
```

**Not:** Tam tekilleştirme YOK ama testler var (çift yazım hala manuel).

---

### 2.7 Diğer Test Dosyaları
**Durum:** ✅ TAMAMLANDI

```bash
tests/db/sanitize.test.ts — 5,922 byte
tests/db/couchAddress.test.ts — 6,478 byte
tests/db/pouchAudit.test.ts — 3,681 byte
tests/db/pouchEncrypted.test.ts — 5,111 byte
tests/utils/bhbak.test.ts — 3,900 byte
tests/utils/licenseGuard.test.ts — 8,692 byte
tests/utils/currency.test.ts — 9,200 byte
```

**Toplam:** 305 test, 17 dosya — hedef aşıldı.

---

## 3. 🟡 KISMİ TAMAMLANAN İŞLER

### 3.1 Excel İyileştirmeleri
**Durum:** 🟡 50% TAMAMLANDI

**Yapılan:**
- ✅ `src/utils/styledExports.ts` — `exportProductsStyled()` fonksiyonu
- ✅ Biznes Hasap stil standardı uygulanmış:
  - Başlık: koyu, mavi arka plan (#4472C4)
  - Zebra şerit (gri/beyaz)
  - Para birimi formatı (`#,##0.00 ₼`)
  - Logo ekleme desteği
- ✅ ProductExcelExportModal.tsx — seçim/filtre UI

**Yapılmayan:**
- ❌ 3 Excel kütüphanesi hala var (exceljs + read-excel-file + write-excel-file)
- ❌ Akıllı sütun eşleme (`COLUMN_MAPPING`) YOK
- ❌ Import hata raporlama UI YOK
- ❌ `sanitizeExcelImport()` fonksiyonu YOK

---

### 3.2 schemaBridge Tekilleştirme (FAZ 2.3)
**Durum:** 🟡 30% TAMAMLANDI

**Yapılan:**
- ✅ `src/db/schema/fieldMap.ts` — bir dosya var
- ✅ Testler var (`schemaBridge.test.ts`)

**Yapılmayan:**
- ❌ Tek kaynak mapping (`SCHEMA_MAP`) tam değil
- ❌ `toApk()` / `toPc()` otomatik dönüşüm fonksiyonları YOK
- ❌ Çift yazım hala manuel (kod tekrarı var)

---

## 4. ❌ YAPILMAYAN İŞLER

### 4.1 🔴 Kod İmzalama (FAZ 1.4)
**Durum:** ❌ YAPILMADI

**Eksikler:**
- ❌ `package.json` içinde `win.certificateFile` YOK
- ❌ Sertifika yoksa GitHub Actions secrets kurulumu YOK
- ❌ SmartScreen uyarısı hala var

**Neden Önemli:**
Kurumsal satışta büyük engel, maliyet düşük (~$200-400/yıl), iş yükü 1 saat.

---

### 4.2 🟠 PosWorkspace.tsx Refactor (FAZ 2.4)
**Durum:** ❌ YAPILMADI

**Sorun:**
- ❌ `zustand` paketi kurulu değil
- ❌ `src/store/workspaceStore.ts` YOK
- ❌ PosWorkspace.tsx hala ~40 prop drilling

**Boyut:** 103,7 KB tek dosya, bakım çok zor.

---

### 4.3 🟡 Auto-Update (FAZ 5.1)
**Durum:** ❌ YAPILMADI

**Eksikler:**
- ❌ `electron-updater` paketi kurulu değil
- ❌ `electron/main.cjs` içinde `autoUpdater` kodu YOK
- ❌ GitHub Releases yapılandırması YOK

---

### 4.4 Playwright E2E Testleri (FAZ 3.3)
**Durum:** ❌ YAPILMADI

**Mevcut Durum:**
- ✅ `playwright-core@1.63.0` kurulu
- ❌ `@playwright/test` paketi YOK
- ❌ `tests/e2e/` klasörü YOK
- ❌ Hiçbir E2E test yazılmamış

---

### 4.5 CouchDB İyileştirmeleri

#### 4.5.1 Selective Sync (Seçici Senkronizasyon)
**Durum:** ❌ YAPILMADI

**Eksikler:**
- ❌ `startSelectiveSync()` fonksiyonu YOK
- ❌ Filtreli replikasyon YOK

#### 4.5.2 Conflict Resolution UI
**Durum:** ❌ YAPILMADI

**Eksikler:**
- ❌ `src/components/ConflictResolverModal.tsx` YOK
- ❌ Kullanıcı çakışma onayı YOK (hala LWW otomatik)

#### 4.5.3 Sync Progress İyileştirmesi
**Durum:** ❌ YAPILMADI

**Mevcut:** Basit "12/35"  
**Hedef:** Detaylı (hız, ETA, faz)

#### 4.5.4 Offline İlk Deneyim (OOBE)
**Durum:** ❌ YAPILMADI

**Eksikler:**
- ❌ `src/components/FirstRunWizard.tsx` YOK
- ❌ Demo veri yükleme özelliği YOK

---

### 4.6 Kimi K3 Özel Önerileri

#### 4.6.1 Veri Doğrulama Katmanı
**Durum:** ❌ YAPILMADI

**Eksikler:**
- ❌ `zod` paketi kurulu değil
- ❌ `src/db/validation.ts` YOK
- ❌ Schema tanımları YOK (`ProductSchema`, `CustomerSchema`)

#### 4.6.2 Performans İzleme
**Durum:** ❌ YAPILMADI

**Eksikler:**
- ❌ `src/utils/performance.ts` YOK
- ❌ `measureOperation()` fonksiyonu YOK
- ❌ Yavaş işlem uyarıları YOK

#### 4.6.3 Bellek Sızıntısı Önleme
**Durum:** ❌ YAPILMADI

**Eksikler:**
- ❌ `src/hooks/useCleanup.ts` YOK
- ❌ PouchDB sync cleanup hook YOK

#### 4.6.4 Hata Sınıflandırma
**Durum:** ❌ YAPILMADI

**Eksikler:**
- ❌ `src/utils/errors.ts` YOK
- ❌ `BiznesHasapError` class YOK
- ❌ `DatabaseError`, `LicenseError` YOK

---

### 4.7 Telemetri (FAZ 5.3)
**Durum:** ❌ YAPILMADI

**Eksikler:**
- ❌ Sentry entegrasyonu YOK
- ❌ PostHog entegrasyonu YOK
- ❌ Crash raporları YOK

---

## 5. 🎯 ÖNCELİKLİ YAPILACAK LİSTE

### Öncelik 1 — Kritik (1-2 gün)

#### 1.1 Excel Kütüphane Temizliği
```bash
npm uninstall read-excel-file write-excel-file
```
**Etki:** Paket boyutu ~500 KB azalır, bağımlılık karmaşası biter.

#### 1.2 Excel Import İyileştirmeleri
**Dosyalar:**
- `src/utils/excelImport.ts` (YENİ)
- `src/components/products/ProductExcelImportModal.tsx` (güncelle)

**Özellikler:**
- Akıllı sütun eşleme (`COLUMN_MAPPING`)
- Veri temizleme (`sanitizeExcelImport`)
- Hata raporlama UI

**Tahmini süre:** 4 saat

---

### Öncelik 2 — Önemli (3-5 gün)

#### 2.1 Kod İmzalama (Windows Authenticode)
**Adımlar:**
1. OV/EV sertifika satın al (~$200-400/yıl)
2. `package.json` güncelle:
```json
{
  "build": {
    "win": {
      "certificateFile": "certs/bizneshasap.pfx",
      "certificatePassword": "${CERT_PASSWORD}",
      "signingHashAlgorithms": ["sha256"],
      "signDlls": true
    }
  }
}
```
3. GitHub Secrets: `CERT_PFX_BASE64`, `CERT_PASSWORD`
4. `.gitignore`: `certs/`

**Tahmini süre:** 1 saat (sertifika bekleme hariç)

---

#### 2.2 Auto-Update (electron-updater)
```bash
npm install electron-updater
```

**Dosyalar:**
- `electron/main.cjs` (güncelle)
- `package.json` (`publish` config ekle)

**Kod:**
```typescript
// electron/main.cjs
const { autoUpdater } = require('electron-updater');

app.whenReady().then(() => {
  autoUpdater.checkForUpdatesAndNotify();
});
```

**Tahmini süre:** 2 saat

---

#### 2.3 PosWorkspace.tsx Refactor
```bash
npm install zustand
```

**Adımlar:**
1. `src/store/workspaceStore.ts` (YENİ) — Zustand store
2. PosWorkspace.tsx → Router/Layout (küçült)
3. Her workspace bağımsız dosya
4. Prop drilling'i kaldır

**Tahmini süre:** 1 gün (dikkatli refactor gerekir)

---

### Öncelik 3 — İyileştirme (1-2 hafta)

#### 3.1 Playwright E2E Testleri
```bash
npm install --save-dev @playwright/test
npx playwright install chromium
```

**Dosyalar:**
- `tests/e2e/checkout.spec.ts` (YENİ)
- `tests/e2e/product.spec.ts` (YENİ)
- `tests/e2e/customer.spec.ts` (YENİ)

**İlk testler:**
- Ürün ekleme/düzenleme/silme
- Satış işlemi (checkout)
- Müşteri kartı oluşturma

**Tahmini süre:** 3 gün

---

#### 3.2 Veri Doğrulama Katmanı (Zod)
```bash
npm install zod
```

**Dosyalar:**
- `src/db/validation.ts` (YENİ)

**Şemalar:**
- `ProductSchema`
- `CustomerSchema`
- `InvoiceSchema`
- `TransactionSchema`

**Entegrasyon:** `pouch.ts` `upsertDoc()` içinde `validateProduct()`

**Tahmini süre:** 2 gün

---

#### 3.3 Conflict Resolution UI
**Dosyalar:**
- `src/components/ConflictResolverModal.tsx` (YENİ)
- `src/db/conflictResolver.ts` (güncelle — UI çağrı ekle)

**Özellikler:**
- Çakışan belgeleri göster (local vs remote)
- Kullanıcı seçimi (hangisi kullanılacak?)
- Toplu çakışma çözümü

**Tahmini süre:** 3 gün

---

#### 3.4 Performans İzleme
**Dosyalar:**
- `src/utils/performance.ts` (YENİ)
- `src/hooks/useMeasure.ts` (YENİ)

**Özellikler:**
- `measureOperation()` wrapper
- Yavaş işlem uyarıları (>1000ms)
- Performance.mark() entegrasyonu

**Tahmini süre:** 1 gün

---

#### 3.5 Hata Sınıflandırma
**Dosyalar:**
- `src/utils/errors.ts` (YENİ)

**Sınıflar:**
- `BiznesHasapError` (base)
- `DatabaseError`
- `LicenseError`
- `SyncError`
- `ValidationError`

**Tahmini süre:** 4 saat

---

### Öncelik 4 — Uzun Vadeli (2-4 hafta)

#### 4.1 schemaBridge Tam Tekilleştirme
**Mevcut:** Çift yazım manuel  
**Hedef:** Tek kaynak, otomatik dönüşüm

**Dosyalar:**
- `src/db/schema/schema.ts` (genişlet)
- `src/db/schema/transform.ts` (YENİ)

**Tahmini süre:** 3 gün

---

#### 4.2 Offline İlk Deneyim (OOBE)
**Dosyalar:**
- `src/components/FirstRunWizard.tsx` (YENİ)
- `src/utils/demoData.ts` (YENİ)

**Adımlar:**
1. Hoş geldiniz
2. Senkronizasyon (opsiyonel)
3. Demo veri yükleme

**Tahmini süre:** 2 gün

---

#### 4.3 Telemetri (Sentry + PostHog)
```bash
npm install @sentry/electron posthog-js
```

**Özellikler:**
- Crash raporları (Sentry)
- Feature kullanımı (PostHog)
- Opt-in izni

**Tahmini süre:** 3 gün

---

#### 4.4 Selective Sync
**Dosyalar:**
- `src/db/syncService.ts` (güncelle)

**Özellik:**
- Filtreli replikasyon (son 3 ay)
- Kullanıcı filtre seçimi

**Tahmini süre:** 2 gün

---

## 6. 📋 DETAYLI İŞ KARTLARI

Her iş için detaylı adımlar, kod örnekleri ve doğrulama kriterleri.

---

### İŞ #1: Excel Kütüphane Temizliği + Import İyileştirme

**Öncelik:** 🔴 Kritik  
**Tahmini Süre:** 4 saat  
**Bağımlılık:** Yok

#### Adım 1: Gereksiz Paketleri Kaldır
```bash
npm uninstall read-excel-file write-excel-file
npm test -- --run  # Emin ol ki hiçbir şey kırılmadı
```

#### Adım 2: excelImport.ts Oluştur
```typescript
// src/utils/excelImport.ts
import ExcelJS from 'exceljs';
import type { Product } from '../types';

const COLUMN_MAPPING = {
  'barcode': ['barkod', 'barcode', 'bar code', 'bar_code', 'штрих-код'],
  'name': ['ürün adı', 'ürün', 'ad', 'product name', 'product', 'name', 'название', 'товар'],
  'price': ['fiyat', 'price', 'birim fiyat', 'unit price', 'цена'],
  'stock': ['stok', 'stock', 'miktar', 'quantity', 'qty', 'запас', 'количество'],
  'cost': ['alış', 'maliyet', 'cost', 'себестоимость'],
  'sku': ['sku', 'kod', 'code', 'артикул'],
};

function matchColumn(header: string): string | null {
  const normalized = header.toLowerCase().trim();
  for (const [field, variants] of Object.entries(COLUMN_MAPPING)) {
    if (variants.includes(normalized)) return field;
  }
  return null;
}

export interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; data: unknown; error: string }>;
}

export async function importProductsFromExcel(
  buffer: ArrayBuffer
): Promise<ImportResult> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const sheet = workbook.worksheets[0];
  
  if (!sheet || sheet.rowCount < 2) {
    throw new Error('Excel dosyası boş veya başlık satırı yok');
  }

  // Sütun eşleme
  const headerRow = sheet.getRow(1);
  const columnMap: Record<string, number> = {};
  
  headerRow.eachCell((cell, colNumber) => {
    const header = String(cell.value || '').trim();
    const field = matchColumn(header);
    if (field) columnMap[field] = colNumber;
  });

  // Zorunlu sütunlar
  if (!columnMap.name) {
    throw new Error('Ürün adı sütunu bulunamadı. Beklenen başlıklar: "Ürün Adı", "Product Name"');
  }

  const result: ImportResult = { success: 0, failed: 0, errors: [] };
  const products: Product[] = [];

  // Veri satırları
  for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber++) {
    const row = sheet.getRow(rowNumber);
    
    try {
      const rawData = {
        barcode: row.getCell(columnMap.barcode || 1).value,
        name: row.getCell(columnMap.name).value,
        price: row.getCell(columnMap.price || 3).value,
        stock: row.getCell(columnMap.stock || 4).value,
        cost: row.getCell(columnMap.cost || 5).value,
        sku: row.getCell(columnMap.sku || 6).value,
      };

      const product = sanitizeExcelImport(rawData);
      
      // Validasyon
      if (!product.name || product.name === 'İsimsiz Ürün') {
        throw new Error('Ürün adı boş olamaz');
      }
      if (product.price < 0) {
        throw new Error('Fiyat negatif olamaz');
      }
      if (product.stock < 0) {
        throw new Error('Stok negatif olamaz');
      }

      products.push(product);
      result.success++;
    } catch (error) {
      result.failed++;
      result.errors.push({
        row: rowNumber,
        data: row.values,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return { ...result, products };
}

function sanitizeExcelImport(row: Record<string, unknown>): Partial<Product> {
  return {
    barcode: String(row.barcode || '').trim(),
    name: String(row.name || 'İsimsiz Ürün').trim(),
    price: parseFloat(String(row.price || 0).replace(',', '.')) || 0,
    stock: parseInt(String(row.stock || 0)) || 0,
    cost: parseFloat(String(row.cost || 0).replace(',', '.')) || 0,
    sku: String(row.sku || '').trim(),
  };
}
```

#### Adım 3: Import Modal Güncelle
```typescript
// src/components/products/ProductExcelImportModal.tsx içine ekle
const handleImport = async (file: File) => {
  setImporting(true);
  
  try {
    const buffer = await file.arrayBuffer();
    const result = await importProductsFromExcel(buffer);
    
    if (result.success > 0) {
      // Veritabanına kaydet
      for (const product of result.products) {
        await upsertDoc('haryt', {
          _id: `urun:${uuid()}`,
          ...product,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
      await refreshProducts();
    }
    
    // Sonuç raporu göster
    setImportResult(result);
    setShowResultModal(true);
  } catch (error) {
    alert('İçe aktarma hatası: ' + error.message);
  } finally {
    setImporting(false);
  }
};
```

#### Adım 4: Sonuç Raporu UI
```typescript
// ImportResultModal.tsx (YENİ)
interface ImportResultModalProps {
  result: ImportResult;
  onClose: () => void;
}

function ImportResultModal({ result, onClose }: ImportResultModalProps) {
  return (
    <Modal>
      <h2>İçe Aktarma Tamamlandı</h2>
      <div className="summary">
        <div className="success">✅ {result.success} başarılı</div>
        <div className="failed">❌ {result.failed} hatalı</div>
      </div>
      
      {result.errors.length > 0 && (
        <div className="errors">
          <h3>Hatalar:</h3>
          <table>
            <thead>
              <tr>
                <th>Satır</th>
                <th>Veri</th>
                <th>Hata</th>
              </tr>
            </thead>
            <tbody>
              {result.errors.map((err, i) => (
                <tr key={i}>
                  <td>{err.row}</td>
                  <td>{JSON.stringify(err.data).slice(0, 50)}...</td>
                  <td className="error-message">{err.error}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <button onClick={onClose}>Kapat</button>
    </Modal>
  );
}
```

#### Doğrulama
```bash
npm test -- --run
npm run build
# Manuel test: Excel içe aktar, hatalı satırları kontrol et
```

---

### İŞ #2: Kod İmzalama (Windows Authenticode)

**Öncelik:** 🔴 Kritik  
**Tahmini Süre:** 1 saat (sertifika beklemeden)  
**Bağımlılık:** OV/EV sertifika satın alma

#### Adım 1: Sertifika Satın Al
**Önerilen sağlayıcılar:**
- Sectigo (eski Comodo): ~$200/yıl (OV), ~$450/yıl (EV)
- DigiCert: ~$400/yıl (OV), ~$600/yıl (EV)
- GlobalSign: ~$300/yıl

**Gereksinimler:**
- Şirket kaydı (vergi no, ticaret sicil)
- Domain doğrulama (opsiyonel)
- Telefon doğrulama

#### Adım 2: package.json Güncelle
```json
{
  "build": {
    "appId": "com.bizneshasap.pos",
    "productName": "Biznes Hasap",
    "win": {
      "target": ["nsis", "portable"],
      "certificateFile": "certs/bizneshasap.pfx",
      "certificatePassword": "${CERT_PASSWORD}",
      "signingHashAlgorithms": ["sha256"],
      "signDlls": true,
      "rfc3161TimeStampServer": "http://timestamp.digicert.com"
    }
  }
}
```

#### Adım 3: .gitignore Güncelle
```
# Kod imzalama sertifikaları
certs/
*.pfx
*.p12
```

#### Adım 4: GitHub Actions Secrets
GitHub repo → Settings → Secrets → Actions:
```
CERT_PFX_BASE64: <sertifika base64>
CERT_PASSWORD: <şifre>
```

Base64 oluşturma (PowerShell):
```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("bizneshasap.pfx")) | Out-File cert-base64.txt
```

#### Adım 5: CI/CD Workflow Güncelle
```yaml
# .github/workflows/release.yml
- name: Restore Certificate
  shell: pwsh
  run: |
    $certBytes = [Convert]::FromBase64String("${{ secrets.CERT_PFX_BASE64 }}")
    New-Item -Path "certs" -ItemType Directory -Force
    [IO.File]::WriteAllBytes("certs/bizneshasap.pfx", $certBytes)

- name: Build & Sign
  env:
    CERT_PASSWORD: ${{ secrets.CERT_PASSWORD }}
  run: npm run electron:build

- name: Clean Certificate
  if: always()
  run: Remove-Item -Path "certs" -Recurse -Force
```

#### Doğrulama
```powershell
# İmzayı kontrol et
Get-AuthenticodeSignature "dist-electron\Biznes Hasap Setup.exe"
# SignerCertificate alanında şirket adı görünmeli
```

---

### İŞ #3: Auto-Update (electron-updater)

**Öncelik:** 🟠 Önemli  
**Tahmini Süre:** 2 saat  
**Bağımlılık:** Kod imzalama (önerilir)

#### Adım 1: Paket Kur
```bash
npm install electron-updater
```

#### Adım 2: main.cjs Güncelle
```javascript
// electron/main.cjs
const { autoUpdater } = require('electron-updater');

// Auto-update yapılandırma
autoUpdater.logger = require('electron-log');
autoUpdater.logger.transports.file.level = 'info';
autoUpdater.autoDownload = false; // Kullanıcı onayı iste

app.whenReady().then(() => {
  createWindow();
  
  // 5 dakikada bir güncelleme kontrolü
  setInterval(() => {
    autoUpdater.checkForUpdatesAndNotify();
  }, 5 * 60 * 1000);
  
  // İlk kontrol 10 saniye sonra
  setTimeout(() => {
    autoUpdater.checkForUpdatesAndNotify();
  }, 10000);
});

// Güncelleme olayları
autoUpdater.on('update-available', (info) => {
  dialog.showMessageBox({
    type: 'info',
    title: 'Güncelleme mevcut',
    message: `Yeni sürüm ${info.version} indirilsin mi?`,
    buttons: ['İndir', 'Sonra']
  }).then((result) => {
    if (result.response === 0) {
      autoUpdater.downloadUpdate();
    }
  });
});

autoUpdater.on('update-downloaded', () => {
  dialog.showMessageBox({
    type: 'info',
    title: 'Güncelleme hazır',
    message: 'Güncelleme indirildi. Şimdi yeniden başlatılsın mı?',
    buttons: ['Yeniden Başlat', 'Sonra']
  }).then((result) => {
    if (result.response === 0) {
      autoUpdater.quitAndInstall();
    }
  });
});
```

#### Adım 3: package.json publish Yapılandırması
```json
{
  "build": {
    "publish": [
      {
        "provider": "github",
        "owner": "BiznesHasap",
        "repo": "biznes-hasap-pc"
      }
    ]
  }
}
```

#### Adım 4: GitHub Release Workflow
```yaml
# .github/workflows/release.yml
- name: Publish Release
  env:
    GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  run: npm run electron:build -- --publish always
```

#### Doğrulama
1. GitHub'da yeni release oluştur (v1.151.0)
2. Eski sürümü (v1.150.0) çalıştır
3. 10 saniye sonra güncelleme bildirimi görmeli

---

### İŞ #4: Zustand + PosWorkspace Refactor

**Öncelik:** 🟠 Önemli  
**Tahmini Süre:** 1 gün  
**Bağımlılık:** Testler çalışıyor olmalı

#### Adım 1: Zustand Kur
```bash
npm install zustand
```

#### Adım 2: Store Oluştur
```typescript
// src/store/workspaceStore.ts
import { create } from 'zustand';
import type { Product, Customer, Invoice } from '../types';

interface WorkspaceState {
  // Aktif sekme
  activeTab: string;
  setActiveTab: (tab: string) => void;
  
  // Ürünler
  products: Product[];
  setProducts: (products: Product[]) => void;
  addProduct: (product: Product) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  
  // Müşteriler
  customers: Customer[];
  setCustomers: (customers: Customer[]) => void;
  addCustomer: (customer: Customer) => void;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  
  // Faturalar
  invoices: Invoice[];
  setInvoices: (invoices: Invoice[]) => void;
  
  // Arama/filtre
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  activeTab: 'checkout',
  setActiveTab: (tab) => set({ activeTab: tab }),
  
  products: [],
  setProducts: (products) => set({ products }),
  addProduct: (product) => set((state) => ({
    products: [...state.products, product]
  })),
  updateProduct: (id, updates) => set((state) => ({
    products: state.products.map(p => p.id === id ? { ...p, ...updates } : p)
  })),
  deleteProduct: (id) => set((state) => ({
    products: state.products.filter(p => p.id !== id)
  })),
  
  customers: [],
  setCustomers: (customers) => set({ customers }),
  addCustomer: (customer) => set((state) => ({
    customers: [...state.customers, customer]
  })),
  updateCustomer: (id, updates) => set((state) => ({
    customers: state.customers.map(c => c.id === id ? { ...c, ...updates } : c)
  })),
  deleteCustomer: (id) => set((state) => ({
    customers: state.customers.filter(c => c.id !== id)
  })),
  
  invoices: [],
  setInvoices: (invoices) => set({ invoices }),
  
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
}));
```

#### Adım 3: HarytWorkspace Refactor
```typescript
// src/components/workspaces/HarytWorkspace.tsx
import { useWorkspaceStore } from '../../store/workspaceStore';

// ÖNCE
function HarytWorkspace({
  products,
  onProductsChange,
  searchQuery,
  onSearchChange,
  // ... 35 prop daha
}: HarytWorkspaceProps) {
  // ...
}

// SONRA
function HarytWorkspace() {
  const {
    products,
    setProducts,
    searchQuery,
    setSearchQuery,
  } = useWorkspaceStore();
  
  // Prop drilling YOK!
}
```

#### Adım 4: PosWorkspace Küçült
```typescript
// src/components/PosWorkspace.tsx
// ÖNCE: 103 KB, 40 prop
// SONRA: Router/Layout sadece

function PosWorkspace() {
  const { activeTab, setActiveTab } = useWorkspaceStore();
  
  return (
    <div className="workspace">
      <TopNavBar activeTab={activeTab} onTabChange={setActiveTab} />
      <WorkspaceRouter activeTab={activeTab} />
    </div>
  );
}
```

#### Doğrulama
```bash
npm test -- --run
npm run build
# Manuel: Tüm workspaceları aç, prop drilling yok
```

---

## SONUÇ

**Yapılan İşler:** %70 (kritik işler tamamlandı)  
**Kalan İşler:** %30 (iyileştirme/optimizasyon)

**İlk 3 öncelikli iş:**
1. 🔴 Excel kütüphane temizliği + import iyileştirme (4 saat)
2. 🔴 Kod imzalama (1 saat)
3. 🟠 Auto-update (2 saat)

**Tahmini toplam süre:** 1 hafta (tüm öncelikli işler)

---

*Son güncelleme: 08 Ekim 2026, 15:54*  
*Sonraki kontrol: Öncelikli işler tamamlandıktan sonra*
