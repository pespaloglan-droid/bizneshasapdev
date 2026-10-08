/**
 * Derlenen uygulamayı (dist-electron/win-unpacked) kullanıcının gerçekten
 * çalıştırdığı KURULU konuma da kopyalar.
 *
 * Neden gerekli: masaüstü / başlat menüsü kısayolları
 *   %LOCALAPPDATA%\Programs\Biznes Hasap\Biznes Hasap.exe
 * dosyasını çalıştırır. Sadece win-unpacked'ı güncellemek, kullanıcının
 * eski sürümü görmesine yol açar.
 */
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(root, 'dist-electron', 'win-unpacked');
const localAppData = process.env.LOCALAPPDATA ?? '';
const target = join(localAppData, 'Programs', 'Biznes Hasap');

if (!existsSync(source)) {
  console.error(`[deploy] derleme bulunamadi: ${source}`);
  console.error('[deploy] once "npm run electron:dir" calistirin.');
  process.exit(1);
}

if (!localAppData || !existsSync(target)) {
  console.log(`[deploy] kurulu kopya yok (${target}) - sadece win-unpacked guncel.`);
  process.exit(0);
}

// robocopy: 0-7 arasi cikis kodlari basaridir (1 = dosya kopyalandi)
// /MIR (mirror) KULLANILIR: /E sadece kopyalar, hedefte KALAN ESKI dosyalari
// silmez. Onceki surumden kalan artik dosyalar (orn. eski app.asar.unpacked)
// kurulu kopyada kalip uygulamanin acilmasini engelliyordu.
const result = spawnSync(
  'robocopy',
  [source, target, '/MIR', '/R:2', '/W:1', '/NFL', '/NDL', '/NJH', '/NP'],
  { stdio: 'inherit' }
);

if (result.error) {
  console.error('[deploy] robocopy calistirilamadi:', result.error.message);
  process.exit(1);
}

const code = result.status ?? 1;
if (code >= 8) {
  console.error(`[deploy] robocopy hata kodu: ${code}`);
  process.exit(1);
}

console.log(`[deploy] kurulu konum guncellendi: ${target}`);
