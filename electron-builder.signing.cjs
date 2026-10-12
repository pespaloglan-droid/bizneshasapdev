const fs = require('node:fs');
const path = require('node:path');
const { build } = require('./package.json');

// Sertifikasız geliştirme build'i package.json yapılandırmasını kullanmaya devam eder.
// İmzalı dağıtım yolu ise eksik sertifika/parolada imzasız çıktıya düşmez.
const certificateFile = path.resolve(
  __dirname,
  process.env.CERT_FILE || 'certs/bizneshasap.pfx'
);
const certificatePassword = process.env.CERT_PASSWORD;

if (!certificatePassword) {
  throw new Error('İmzalı build için CERT_PASSWORD ortam değişkeni zorunludur.');
}
if (!fs.existsSync(certificateFile) || !fs.statSync(certificateFile).isFile()) {
  throw new Error('İmzalama sertifikası bulunamadı. CERT_FILE veya certs/bizneshasap.pfx yolunu kontrol edin.');
}

module.exports = {
  ...build,
  extraMetadata: { ...build.extraMetadata, desktopUpdatesEnabled: true },
  forceCodeSigning: true,
  win: {
    ...build.win,
    signtoolOptions: {
      ...build.win.signtoolOptions,
      certificateFile,
      certificatePassword,
    },
  },
};
