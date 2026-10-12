# Windows kod imzalama — D1

Bu hazırlık yalnızca Windows dağıtımı içindir. Sertifika satın alma, sertifika
sağlayıcısının kimlik doğrulaması ve gerçek imza kontrolü ayrıca tamamlanmalıdır.
İmzalama SmartScreen uyarılarının kesin olarak ortadan kalkacağı anlamına gelmez.

## Sertifika yöntemini önce doğrulayın

Bu yapılandırma **PFX dosyasıyla kullanılabilen bir kod imzalama sertifikası**
bekler. Modern OV/EV sertifikaları donanım anahtarı, HSM veya bulut imzalama
gerektirebilir; bunlardan dışa aktarılabilir PFX alınabileceğini varsaymayın.
Satın almadan önce sağlayıcının GitHub Actions/Windows runner desteğini doğrulayın.
Donanım/bulut sertifikası seçilirse bu PFX akışına uygun sağlayıcı entegrasyonu
eklenmelidir; güvenlik gereksinimleri devre dışı bırakılmamalıdır.

## Komutlar

- `npm run electron:build`: mevcut geliştirme paketleme yolu. İmzalama zorunlu değildir.
- `npm run electron:build:signed`: Windows NSIS + portable paketleme yolu.
  Sertifika/parola eksikse hata verir; `forceCodeSigning` ile imzasız dağıtıma düşmez.

Sertifika varsayılan olarak `certs/bizneshasap.pfx` konumundan okunur.
`CERT_FILE` ortam değişkeniyle başka bir dosya seçilebilir.
Parola yalnızca `CERT_PASSWORD` ortam değişkeninden okunur; JSON içinde
`${CERT_PASSWORD}` gibi bir metnin otomatik çözümleneceğine güvenilmez.

Yerel Windows build öncesi native lisans modülü de derlenmelidir:

```powershell
npm ci
Push-Location license-native
npm ci
npm run build-native
npm test
npm run release-check
Pop-Location
npm test -- --run
npm run build

$env:CERT_FILE = (Resolve-Path "certs/bizneshasap.pfx").Path
$secret = Read-Host "Sertifika parolası" -AsSecureString
$credential = [System.Management.Automation.PSCredential]::new("signing", $secret)
try {
  $env:CERT_PASSWORD = $credential.GetNetworkCredential().Password
  npm run electron:build:signed
  if ($LASTEXITCODE -ne 0) { throw "İmzalı build başarısız." }
} finally {
  Remove-Item Env:CERT_PASSWORD -ErrorAction SilentlyContinue
  Remove-Item Env:CERT_FILE -ErrorAction SilentlyContinue
  $secret.Dispose()
  $credential = $null
}
```

## GitHub Actions

Repo: `pespaloglan-droid/bizneshasapdev`.

Repo → Settings → Secrets and variables → Actions bölümünde:

| Secret | İçerik |
| --- | --- |
| `CERT_PFX_BASE64` | PFX dosyasının base64 içeriği |
| `CERT_PASSWORD` | PFX parolası |

Base64 içeriği Windows'ta doğrudan panoya alınabilir:

```powershell
[Convert]::ToBase64String(
  [IO.File]::ReadAllBytes((Resolve-Path "certs/bizneshasap.pfx").Path)
) | Set-Clipboard
```

Base64 şifreleme değildir; içeriği chat'e, commit'e veya loglara yapıştırmayın.
Secret kaydedildikten sonra panoyu temizleyin.

Actions → **Windows imzalı build** → **Run workflow** ile başlatın.
Workflow birim testlerini, native lisans testlerini, release kontrolünü ve web
build'i geçirir; sertifikayı runner'ın geçici dizinine yazar; imzalı build sonrası
her EXE'nin Authenticode imzasını ve zaman damgasını doğrular.
Sertifika temizliği `always()` ile çalışır; artifact yalnızca başarılı doğrulamada
yüklenir. GitHub Release yayınlanmaz; D2 ayrı bir adımdır.

Mevcut `CI` workflow'u değiştirilmedi. Sertifika secrets olmadan geliştirme CI'ı
çalışmaya devam eder. PFX/P12 dosyaları ve `certs/` gitignore kapsamındadır.
İmzalama secrets'ı yalnızca güvenilir kod/ref çalıştırmalarında kullanılmalıdır.

## Manuel doğrulama

```powershell
Get-ChildItem "dist-electron\*.exe" | ForEach-Object {
  Get-AuthenticodeSignature -LiteralPath $_.FullName |
    Format-List Path, Status, StatusMessage, SignerCertificate, TimeStamperCertificate
}
```

Başarı ölçütü: installer ve portable EXE'lerde `Status: Valid`, beklenen
sertifika sahibi ve zaman damgası sertifikası. Gerçek sertifika ve Windows build
olmadan D1'in imzalama/dağıtım doğrulaması tamamlanmış sayılmaz.
