// Nastavenie nástroja Vite (vývojový server a zostavenie appky)
import { defineConfig } from 'vite';
import { readdirSync, statSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createHash } from 'node:crypto';

// Všetky súbory z priečinka public (obrázky, ikony, manifest)
function suboryPublic(priecinok, koren = priecinok) {
  const vysledok = [];
  for (const nazov of readdirSync(priecinok)) {
    const cesta = join(priecinok, nazov);
    if (statSync(cesta).isDirectory()) vysledok.push(...suboryPublic(cesta, koren));
    else vysledok.push(relative(koren, cesta).replaceAll('\\', '/'));
  }
  return vysledok;
}

/**
 * Pri zostavení vytvorí service worker (sw.js) so zoznamom všetkých súborov appky,
 * aby appka po prvom načítaní fungovala aj úplne bez internetu.
 */
function offlineRezim() {
  return {
    name: 'bystra-hlava-offline',
    apply: 'build',
    generateBundle(_moznosti, balik) {
      // Staršie písma .woff netreba – všetky dnešné prehliadače vedia .woff2
      const subory = ['./', 'index.html', ...Object.keys(balik), ...suboryPublic('public')].filter(
        (s) => s !== 'sw.js' && !s.endsWith('.woff')
      );
      const unikatne = [...new Set(subory)];
      const sablona = readFileSync('nastroje/sw-sablona.js', 'utf8');
      // Verzia sa zmení pri každej zmene súborov aj samotného service workera
      const verzia = createHash('sha256').update(unikatne.join('|') + sablona).digest('hex').slice(0, 12);
      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: sablona.replace('__VERZIA__', verzia).replace('__SUBORY__', JSON.stringify(unikatne, null, 2)),
      });
    },
  };
}

export default defineConfig({
  // Relatívne cesty, aby appka fungovala aj na GitHub Pages v podpriečinku
  base: './',
  plugins: [offlineRezim()],
  server: { port: 5173, strictPort: true },
  test: {
    environment: 'node',
    setupFiles: ['fake-indexeddb/auto'],
    include: ['testy/**/*.test.js'],
  },
});
