// Testy zálohy a obnovy, upozornení a skupinového kvízu.
import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../src/ulozisko/db.js';
import {
  vytvorHraca,
  zaznamenajDenHrania,
  nastavPersonalPin,
  overPersonalPin,
  overPinHraca,
  hraciNaUpozornenie,
  dniUpozornenia,
  nastavDniUpozornenia,
  PREDVOLENE_DNI_UPOZORNENIA,
  POVOLENE_POLIA,
  zoznamHracov,
} from '../src/ulozisko/hraci.js';
import { vytvorZalohu, overZalohu, obnovZalohu, vymazVsetkyUdaje, ZNACKA_ZALOHY } from '../src/ulozisko/zaloha.js';
import { KVIZ, zasobaKvizu } from '../src/hra/obsah/kviz.js';
import { pripravKviz } from '../src/hra/logika.js';

beforeEach(async () => {
  await db.vymazVsetko();
});

describe('záloha a obnova', () => {
  it('záloha sa dá obnoviť a hráči aj PIN fungujú ďalej', async () => {
    await nastavPersonalPin('135790');
    await nastavDniUpozornenia(7);
    const anna = await vytvorHraca({ meno: 'Anna', rastlina: 'mak', pin: '1111', obtiaznost: 'stredna' });
    await zaznamenajDenHrania(anna.id, '2026-11-01');

    const text = JSON.stringify(await vytvorZalohu());
    await vymazVsetkyUdaje();
    expect(await zoznamHracov()).toEqual([]);

    await obnovZalohu(overZalohu(text));
    const hraci = await zoznamHracov();
    expect(hraci.map((h) => h.meno)).toEqual(['Anna']);
    expect(hraci[0].dniHrania).toEqual(['2026-11-01']);
    expect(await overPinHraca(anna.id, '1111')).toBe(true);
    expect(await overPersonalPin('135790')).toBe(true);
    expect(await dniUpozornenia()).toBe(7);
  });

  it('záloha neobsahuje PIN v čitateľnej podobe ani nepovolené polia', async () => {
    await vytvorHraca({ meno: 'Jozef', rastlina: 'lipa', pin: '2468', poznamka: 'nie' });
    const zaloha = await vytvorZalohu();
    const text = JSON.stringify(zaloha);
    expect(text).not.toContain('2468');
    for (const h of zaloha.hraci) for (const pole of Object.keys(h)) expect(POVOLENE_POLIA).toContain(pole);
  });

  it('pri obnove sa nepovolené polia zahodia', async () => {
    const hrac = await vytvorHraca({ meno: 'Eva', rastlina: 'ruza', pin: '1357' });
    const zaloha = await vytvorZalohu();
    zaloha.hraci[0].poznamka = 'citlivý text';
    zaloha.hraci[0].vysledky = [1, 0, 1];
    const overene = overZalohu(JSON.stringify(zaloha));
    expect(overene.hraci[0]).not.toHaveProperty('poznamka');
    expect(overene.hraci[0]).not.toHaveProperty('vysledky');
    expect(overene.hraci[0].id).toBe(hrac.id);
  });

  it('poškodený alebo cudzí súbor sa odmietne', async () => {
    expect(() => overZalohu('toto nie je json')).toThrow();
    expect(() => overZalohu(JSON.stringify({ hraci: [] }))).toThrow();
    expect(() => overZalohu(JSON.stringify({ znacka: ZNACKA_ZALOHY, verzia: 1, hraci: [{ meno: 'X' }] }))).toThrow();
    const zly = { znacka: ZNACKA_ZALOHY, verzia: 1, hraci: [{ id: 'a', meno: 'A', rastlina: 'kaktus', pinSol: 'ab', pinHash: 'a'.repeat(64), dniHrania: [] }] };
    expect(() => overZalohu(JSON.stringify(zly))).toThrow();
  });

  it('úrovne zo zálohy sa udržia v rozsahu obťažnosti', async () => {
    await vytvorHraca({ meno: 'Ján', rastlina: 'mak', pin: '1111', obtiaznost: 'lahka' });
    const zaloha = await vytvorZalohu();
    zaloha.hraci[0].urovne.pexeso = 99;
    const overene = overZalohu(JSON.stringify(zaloha));
    expect(overene.hraci[0].urovne.pexeso).toBe(3);
  });
});

describe('upozornenia', () => {
  const hrac = (meno, dni) => ({ meno, dniHrania: dni });

  it('ukážu hráčov, ktorí N a viac dní nehrali', () => {
    const vysledok = hraciNaUpozornenie(
      [hrac('A', ['2026-11-13']), hrac('B', ['2026-11-01', '2026-11-09']), hrac('C', ['2026-10-20']), hrac('D', [])],
      5,
      '2026-11-14'
    );
    expect(vysledok.dlhoBezHry.map((x) => [x.hrac.meno, x.dni])).toEqual([
      ['C', 25],
      ['B', 5],
    ]);
    expect(vysledok.zatialNehrali.map((x) => x.meno)).toEqual(['D']);
  });

  it('predvolene sa upozorňuje po 5 dňoch a nastavenie má rozumné hranice', async () => {
    expect(await dniUpozornenia()).toBe(PREDVOLENE_DNI_UPOZORNENIA);
    expect(PREDVOLENE_DNI_UPOZORNENIA).toBe(5);
    expect(await nastavDniUpozornenia(0)).toBe(1);
    expect(await nastavDniUpozornenia(500)).toBe(60);
  });
});

describe('skupinový kvíz', () => {
  it('každá otázka má štyri rôzne možnosti', () => {
    for (const q of zasobaKvizu()) {
      expect(q.moznosti, q.otazka).toHaveLength(4);
      expect(new Set(q.moznosti).size).toBe(4);
    }
    expect(KVIZ.length).toBeGreaterThanOrEqual(25);
    expect(new Set(zasobaKvizu().map((q) => q.otazka)).size).toBe(zasobaKvizu().length);
  });

  it('kvíz má 10 rôznych otázok a správna odpoveď sedí', () => {
    const zasoba = zasobaKvizu();
    for (let i = 0; i < 30; i++) {
      const otazky = pripravKviz(zasoba, 10);
      expect(otazky).toHaveLength(10);
      expect(new Set(otazky.map((q) => q.otazka)).size).toBe(10);
      for (const q of otazky) {
        const povodna = zasoba.find((z) => z.otazka === q.otazka);
        expect(q.moznosti[q.spravna]).toBe(povodna.moznosti[0]);
      }
    }
  });
});
