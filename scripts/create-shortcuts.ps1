# create-shortcuts.ps1
# Masaustu kisayol olusturur:
#   1) Biznes Hasap (uygulama)
#   2) LisansYonetici (key / lisans ureteci - sadece admin kullanir)
#
# Kullanim:  powershell -ExecutionPolicy Bypass -File scripts\create-shortcuts.ps1

$ErrorActionPreference = 'Stop'

$ProjectRoot = Split-Path -Parent $PSScriptRoot

# Hedefler: oncelikle 'win-unpacked' (hizli acilis), yoksa portable tek dosya
$Targets = @(
    @{
        Name        = 'Biznes Hasap'
        Preferred   = Join-Path $ProjectRoot 'dist-v2\win-unpacked\Biznes Hasap.exe'
        Fallback    = Join-Path $ProjectRoot 'dist-v2\Biznes Hasap 1.150.0.exe'
        Description = 'Biznes Hasap - Satis / Alis / Stok / Kasa / On Muhasebe'
    },
    @{
        Name        = 'LisansYonetici'
        Preferred   = Join-Path $ProjectRoot 'admin-gui\dist\win-unpacked\LisansYonetici.exe'
        Fallback    = Join-Path $ProjectRoot 'admin-gui\dist\LisansYonetici 1.0.0.exe'
        Description = 'LisansYonetici - Lisans anahtari ureteci (sadece admin)'
    }
)

$Desktop = [Environment]::GetFolderPath('Desktop')
$Shell = New-Object -ComObject WScript.Shell

$created = 0
$missing = 0

foreach ($t in $Targets) {
    $target = $t.Preferred
    if (-not (Test-Path -LiteralPath $target)) { $target = $t.Fallback }

    if (-not (Test-Path -LiteralPath $target)) {
        Write-Host "[ATLANDI] $($t.Name): exe bulunamadi" -ForegroundColor Yellow
        Write-Host "           aranan: $($t.Preferred)"
        Write-Host "           aranan: $($t.Fallback)"
        $missing++
        continue
    }

    $linkPath = Join-Path $Desktop ($t.Name + '.lnk')
    $shortcut = $Shell.CreateShortcut($linkPath)
    $shortcut.TargetPath       = $target
    $shortcut.WorkingDirectory = Split-Path -Parent $target
    $shortcut.Description      = $t.Description
    $shortcut.WindowStyle      = 1
    $shortcut.IconLocation     = "$target,0"
    $shortcut.Save()

    Write-Host "[OK] $($t.Name)" -ForegroundColor Green
    Write-Host "     kisayol : $linkPath"
    Write-Host "     hedef  : $target"
    $created++
}

Write-Host ""
Write-Host "$created kisayol olusturuldu, $missing hedef bulunamadi." -ForegroundColor Cyan