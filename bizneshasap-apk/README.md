# bizneshasap-apk — APK çalışma klasörü

PC projesi aynen durur, mobil işler bu klasörden izlenir.
Klasör adı boşluksuz (`bizneshasap-apk`) — Gradle/Capacitor boşluk sevmiyor.

## Bu turda yapılanlar (2026-09-30)
- `src/utils/platform.ts`: electron / native / web ayrımı tek yerden
- `src/utils/electron.ts`: `listPrintersOrEmpty()` + `printHtmlOrFallback()` eklendi
- `src/services/mobilePrintService.ts`: Bluetooth adapter takılabilir iskelet
- `src/hooks/useBarcodeScan.ts`: web prompt fallback, native TODO'lu
- `TitleBar`: Electron yoksa gizleniyor
- `App.tsx` login: mobilde alt-alta, PC'de yan yana
- `index.html`: viewport-fit + theme-color
- `capacitor.config.ts`: appId `com.bizneshasap.pos`, webDir `dist`
- `package.json`: Capacitor 6 paketleri + `build:mobile` scripti

## Sonraki adımlar
1. `npm install` (internetli makinede)
2. `npx cap add android` — Java 17 + Android SDK şart (bu makinede yok)
3. Barkod: `@capacitor-mlkit/barcode-scanning` tak, `useBarcodeScan.ts` içindeki TODO'ya bağla
4. Yazıcı: tek model seç (örn XPrinter 80mm), `registerBluetoothPrinter()` adapter yaz
5. `npm run build:mobile` → Android Studio'da `assembleDebug`

## Notlar
- Ortam: Node 24.19, Java yok, ANDROID_HOME yok (2026-09-30)
- PouchDB mobilde IndexedDB ile çalışır, CouchDB sync https ister
