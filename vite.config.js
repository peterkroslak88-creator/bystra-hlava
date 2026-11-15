// Nastavenie nástroja Vite (vývojový server a zostavenie appky)
import { defineConfig } from 'vite';

export default defineConfig({
  // Relatívne cesty, aby appka fungovala aj na GitHub Pages v podpriečinku
  base: './',
  server: { port: 5173, strictPort: true },
  test: {
    environment: 'node',
    setupFiles: ['fake-indexeddb/auto'],
    include: ['testy/**/*.test.js'],
  },
});
