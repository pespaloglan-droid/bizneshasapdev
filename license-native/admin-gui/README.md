# Lisans Yönetici - Admin GUI

Offline lisans anahtarı üretici - Biznes Hasap PC + APK için kolay arayüzlü Electron uygulaması.

## Kurulum

```powershell
cd admin-gui
npm install
```

## Kullanım

### Geliştirme

```powershell
npm start
```

### Build (portable .exe)

```powershell
# Sadece Windows x64
npm run build

# Tüm platformlar
npm run build-all
```

Çıktı: `dist/LisansYonetici-1.0.0.exe` (portable, taşınabilir)

## Ekranlar

1. **Kilit** - Parola girişi (ilk açılışta kök anahtar oluşturulur)
2. **Platform** - PC veya APK seçimi
3. **Keygen** - İstek kodu yapıştır, gün seç, anahtar oluştur

## Güvenlik

- Otomatik kilit: 10 dakika inaktivite
- Ağ erişimi: YOK
- contextIsolation: true
- Sandbox: true
- DevTools: production'da kapalı

## Core Paylaşımı

Admin GUI ve CLI aynı çekirdeği kullanır:
- `../admin/core/license-core.js` - Keygen/sign/decode mantığı
- `../admin/core/codec.js` - Base32 + CRC16

## Bağımlılıklar

- Electron 32+
- electron-builder
- tweetnacl (imza doğrulama)

## Platform Hedefleri

- **Windows**: Portable .exe (x64)
- **macOS**: .dmg (universal)
- **Linux**: AppImage (x64)
