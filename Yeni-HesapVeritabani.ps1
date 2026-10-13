<#
  Hesap veritabani olusturucu (bilgisayarda ADMIN ile calisir).

  Kullanim:
    .\Yeni-HesapVeritabani.ps1 -Ad "Vitrin Magazet" -AdminUser "YONETICI_KULLANICISI"
    .\Yeni-HesapVeritabani.ps1 -Veritabani "vitrin_magazet_db" -AdminUser "YONETICI_KULLANICISI"

  Telefonda yeni hesap actiginda, o hesabin veritabani adi
  (Ayarlar > Bulut esitleme kisminda gorunur) burada olusturulur.
  Uygulama kullaniciya (_admin) yetkisi VERILMEZ - sadece veritabani acilir.

  NOT: ASCII karakterlerle yazildi (PowerShell 5.1 uyumlulugu).
#>
param(
  [string]$Ad = 'Hesap',
  [string]$Veritabani,
  [Parameter(Mandatory=$true)][ValidateNotNullOrEmpty()][string]$AdminUser,
  [Security.SecureString]$AdminPassword,
  [ValidateNotNullOrEmpty()][string]$AppUser = 'biznes_app'
)

$ErrorActionPreference = 'Stop'

# Parola CLI argumani veya kaynak literal olarak girilmez.
if (-not $AdminPassword) { $AdminPassword = Read-Host 'CouchDB yonetici parolasi' -AsSecureString }
$credential = New-Object Management.Automation.PSCredential($AdminUser, $AdminPassword)
$adminPass = $credential.GetNetworkCredential().Password
$server    = 'http://127.0.0.1:5984'

if (-not $Veritabani) {
  $slug = ($Ad.ToLower() -replace '[^a-z0-9]+', '_').Trim('_')
  $Veritabani = $slug + '_db'
}

# CouchDB veritabani adi izinleri: a-z 0-9 _ $ ( ) + -
$guvenli = ($Veritabani.ToLower() -replace '[^a-z0-9_$()+-]', '_')

try {
$auth = 'Basic ' + [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($adminUser + ':' + $adminPass))
$head = @{ Authorization = $auth }

Write-Host ('Hesap      : ' + $Ad)
Write-Host ('Veritabani : ' + $guvenli)
Write-Host ''

$status = 0
try {
  $r = Invoke-WebRequest -Uri ($server + '/' + $guvenli) -Method HEAD -Headers $head -UseBasicParsing -TimeoutSec 10
  Write-Host ('Zaten var (HTTP ' + $r.StatusCode + '). Bir sey yapilmadi.') -ForegroundColor Yellow
} catch {
  $code = $_.Exception.Response.StatusCode.value__
  if ($code -ne 404) {
    Write-Host ('Sunucuya ulasilamadi: ' + $_.Exception.Message) -ForegroundColor Red
    Write-Host "CouchDB calisiyor mu? Get-Service 'Apache CouchDB'" -ForegroundColor Yellow
    $status = 1
  } else {
    try {
      $r = Invoke-WebRequest -Uri ($server + '/' + $guvenli) -Method PUT -Headers $head -UseBasicParsing -TimeoutSec 15
      Write-Host ('Olusturuldu (HTTP ' + $r.StatusCode + ')') -ForegroundColor Green

      $sec = @{ admins = @{ names = @(); roles = @() }; members = @{ names = @($AppUser); roles = @() } } | ConvertTo-Json -Depth 4 -Compress
      $null = Invoke-WebRequest -Uri ($server + '/' + $guvenli + '/_security') -Method PUT -Headers $head -ContentType 'application/json' -Body $sec -UseBasicParsing -TimeoutSec 15
      Write-Host 'Uygulama kullanicisina DB uye erisimi verildi' -ForegroundColor Green
      Write-Host ''
      Write-Host 'Simdi telefonda: Ayarlar > Bulut esitleme > Baglantiyi sina' -ForegroundColor Cyan
    } catch {
      Write-Host ('Olusturulamadi: ' + $_.Exception.Message) -ForegroundColor Red
      $status = 1
    }
  }
}
} finally {
  $adminPass = $null
  $credential = $null
  $auth = $null
  $head = $null
}
exit $status