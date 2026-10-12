import { defineConfig, configDefaults } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    exclude: [...configDefaults.exclude, 'tests/e2e/**'],
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 10000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      // Kapsam hedefi şu an test edilen güvenlik-kritik modüller.
      // Tüm src/ için eşik koymak (3 test dosyasıyla) CI'ı anlamsız kılıyor;
      // kapsam büyüdükçe include genişletilecek.
      include: [
        'src/utils/licenseGuard.ts',
        'src/utils/bhbak.ts',
        'src/utils/gateMiddleware.ts',
        'src/db/currencyService.ts',
      ],
      exclude: ['src/**/*.d.ts'],
      all: true,
      // Vitest 5'te eşikler `coverage.thresholds` altında olmalı; düz
      // `coverage.lines` sessizce yok sayılır ve kapı hiç uygulanmaz.
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
