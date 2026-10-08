<#
  Hesap veritabani olusturucu (bilgisayarda ADMIN ile calisir).

  Kullanim:
    .\Yeni-HesapVeritabani.ps1 -Ad "Vitrin Magazet"
    .\Yeni-HesapVeritabani.ps1 -Veritabani "vitrin_magazet_db"

  Telefonda yeni hesap actiginda, o hesabin veritabani adi
  (Ayarlar > Bulut esitleme kisminda gorunur) burada olusturulur.
  Uygulama kullaniciya (_admin) yetkisi VERILMEZ - sadece veritabani acilir.

  NOT: ASCII karakterlerle yazildi (PowerShell 5.1 uyumlulugu).
#>
param(
  [string]$Ad = 'Hesap',
  [string]$Veritabani
)

$ErrorActionPreference = 'Stop'

# CouchDB yoneticisi (C:\Program Files\etc\local.d\20-biznes.ini)
$adminUser = 'biznes'
$adminPass = 'bh_sync_8fK2mQ7xR4pW'
$server    = 'http://127.0.0.1:5984'

if (-not $Veritabani) {
  $slug = ($Ad.ToLower() -replace '[^a-z0-9]+', '_').Trim('_')
  $Veritabani = $slug + '_db'
}

# CouchDB veritabani adi izinleri: a-z 0-9 _ $ ( ) + -
$guvenli = ($Veritabani.ToLower() -replace '[^a-z0-9_$()+-]', '_')

$auth = 'Basic ' + [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes($adminUser + ':' + $adminPass))
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

      $sec = '{"admins":{"names":[],"roles":[]},"members":{"names":["biznes_app"],"roles":[]}}'
      $null = Invoke-WebRequest -Uri ($server + '/' + $guvenli + '/_security') -Method PUT -Headers $head -ContentType 'application/json' -Body $sec -UseBasicParsing -TimeoutSec 15
      Write-Host 'Yetki verildi: biznes_app tam erisim' -ForegroundColor Green
      Write-Host ''
      Write-Host 'Simdi telefonda: Ayarlar > Bulut esitleme > Baglantiyi sina' -ForegroundColor Cyan
    } catch {
      Write-Host ('Olusturulamadi: ' + $_.Exception.Message) -ForegroundColor Red
      $status = 1
    }
  }
}
exit $status