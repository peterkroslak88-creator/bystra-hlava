// Kontrola, že v appke nie sú zakázané výrazy ani emoji.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { ZAKAZANE_VYRAZY } from './zakazane-vyrazy.js';
import { PATICKA } from '../src/texty.js';

const KOREN = join(import.meta.dirname, '..');

function vsetkySubory(priecinok) {
  const vysledok = [];
  for (const nazov of readdirSync(priecinok)) {
    const cesta = join(priecinok, nazov);
    if (statSync(cesta).isDirectory()) vysledok.push(...vsetkySubory(cesta));
    else if (/\.(js|css|html|json|webmanifest)$/.test(nazov)) vysledok.push(cesta);
  }
  return vysledok;
}

const subory = [
  ...vsetkySubory(join(KOREN, 'src')),
  join(KOREN, 'index.html'),
  ...(existsSync(join(KOREN, 'public')) ? vsetkySubory(join(KOREN, 'public')) : []),
];

describe('zakázané výrazy', () => {
  it('kontroluje aspoň niekoľko súborov', () => {
    expect(subory.length).toBeGreaterThan(10);
  });

  for (const subor of subory) {
    it(`${relative(KOREN, subor)} neobsahuje zakázané výrazy`, () => {
      // Povinná pätička je jediná povolená výnimka
      const obsah = readFileSync(subor, 'utf8').split(PATICKA).join('');
      const najdene = [];
      obsah.split('\n').forEach((riadok, i) => {
        for (const { vyraz, preco } of ZAKAZANE_VYRAZY) {
          if (vyraz.test(riadok)) najdene.push(`riadok ${i + 1}: „${riadok.trim()}“ (${preco})`);
        }
      });
      expect(najdene).toEqual([]);
    });

    it(`${relative(KOREN, subor)} neobsahuje emoji`, () => {
      const obsah = readFileSync(subor, 'utf8');
      expect(obsah.match(/\p{Extended_Pictographic}/gu) ?? []).toEqual([]);
    });
  }

  it('pätička má presné znenie', () => {
    expect(PATICKA).toBe(
      'Aplikácia slúži na aktivizáciu a tréning v hre. Nie je zdravotníckou pomôckou a jej údaje nie sú podkladom na diagnostiku ani liečbu. Údaje zostávajú len v tomto zariadení a nikam sa neodosielajú.'
    );
  });

  it('zoznam zakázaných výrazov naozaj zachytí zakázané slová', () => {
    const vzorky = ['demencia', 'kognitívny pokles', 'zhoršenie', 'diagnóza', 'riziko', 'skóre'];
    for (const slovo of vzorky) {
      expect(ZAKAZANE_VYRAZY.some(({ vyraz }) => vyraz.test(slovo)), slovo).toBe(true);
    }
  });
});
