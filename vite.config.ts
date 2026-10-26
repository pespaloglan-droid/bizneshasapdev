import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: './',
  define: {
    global: 'window',
    'process.env': {},
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      events: 'events',
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'react-vendor';
          if (/node_modules\/(pouchdb-browser|pouchdb-find)\//.test(id)) return 'database-vendor';
        },
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
