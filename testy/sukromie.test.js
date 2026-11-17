// Appka nič neodosiela: v kóde nesmie byť volanie servera ani analytika.
// A musí sa dať nainštalovať na iPad (manifest, ikony, offline).
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const KOREN = join(import.meta.dirname, '..');

function subory(priecinok) {
  return readdirSync(priecinok).flatMap((n) => {
    const c = join(priecinok, n);
    return statSync(c).isDirectory() ? subory(c) : /\.(js|html|css|webmanifest)$/.test(n) ? [c] : [];
  });
}

const KOD = [...subory(join(KOREN, 'src')), join(KOREN, 'index.html'), join(KOREN, 'nastroje', 'sw-sablona.js')];

// Povolené sú len menné priestory SVG (nie sú to sieťové požiadavky)
const POVOLENE_ADRESY = ['http://www.w3.org/2000/svg'];

describe('súkromie: nič sa neodosiela', () => {
  for (const subor of KOD) {
    it(`${relative(KOREN, subor)} nevolá žiadny server`, () => {
      const obsah = readFileSync(subor, 'utf8');
      const adresy = (obsah.match(/https?:\/\/[^\s'"`)]+/g) || []).filter((a) => !POVOLENE_ADRESY.includes(a));
      expect(adresy).toEqual([]);
      expect(obsah).not.toMatch(/XMLHttpRequest|sendBeacon|WebSocket|EventSource|navigator\.geolocation/);
      expect(obsah).not.toMatch(/google-analytics|gtag\(|googletagmanager|matomo|plausible|sentry|hotjar|mixpanel/i);
      // fetch smie byť len v service workeri (sťahuje súbory appky z vlastnej adresy)
      // a pri načítaní zabudovaného hlasu – tam len vlastné súbory appky z priečinka hlas/
      if (subor.endsWith('nahravky.js')) {
        const volania = obsah.match(/fetch\([^)]*/g) ?? [];
        expect(volania.length).toBeGreaterThan(0);
        for (const v of volania) expect(v).toMatch(/^fetch\(['`]\.\/hlas\//);
      } else if (!subor.endsWith('sw-sablona.js')) expect(obsah).not.toMatch(/\bfetch\(/);
    });
  }

  it('service worker obsluhuje len vlastnú adresu appky', () => {
    const sw = readFileSync(join(KOREN, 'nastroje', 'sw-sablona.js'), 'utf8');
    expect(sw).toMatch(/origin !== self\.location\.origin\) return/);
  });

  it('service worker ukladá vždy čerstvé súbory (nie zo starej pamäte prehliadača)', () => {
    const sw = readFileSync(join(KOREN, 'nastroje', 'sw-sablona.js'), 'utf8');
    expect(sw).toMatch(/cache: 'reload'/);
  });
});

describe('inštalácia na iPad', () => {
  const manifest = JSON.parse(readFileSync(join(KOREN, 'public', 'manifest.webmanifest'), 'utf8'));

  it('manifest má názov, jazyk a samostatné okno', () => {
    expect(manifest.name).toBe('Bystrá hlava');
    expect(manifest.lang).toBe('sk');
    expect(manifest.display).toBe('standalone');
  });

  it('všetky ikony existujú', () => {
    for (const ikona of manifest.icons) expect(existsSync(join(KOREN, 'public', ikona.src)), ikona.src).toBe(true);
    expect(existsSync(join(KOREN, 'public', 'ikony', 'apple-touch-icon.png'))).toBe(true);
  });

  it('stránka odkazuje na manifest a ikonu pre iPad', () => {
    const html = readFileSync(join(KOREN, 'index.html'), 'utf8');
    expect(html).toContain('rel="manifest"');
    expect(html).toContain('rel="apple-touch-icon"');
    expect(html).toContain('lang="sk"');
  });
});
