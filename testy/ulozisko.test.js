// Testy PIN, obťažnosti a toho, že sa ukladajú iba povolené údaje.
import { describe, it, expect, beforeEach } from 'vitest';
import { createHash } from 'node:crypto';
import { odtlacokPinu, zabezpecPin, overPin, jePlatnyPin } from '../src/ulozisko/pin.js';
import { novaUroven, vRozsahu, zaciatocneUrovne, OBTIAZNOSTI, TYPY_ULOH } from '../src/hra/obtiaznost.js';
import {
  POVOLENE_POLIA,
  vytvorHraca,
  upravHraca,
  nacitajHraca,
  zaznamenajDenHrania,
  overPinHraca,
  nastavPersonalPin,
  overPersonalPin,
  pridajUkazkovehoHraca,
  nastavUroven,
  vymazHraca,
  zoznamHracov,
} from '../src/ulozisko/hraci.js';
import { db } from '../src/ulozisko/db.js';

beforeEach(async () => {
  await db.vymazVsetko();
});

describe('PIN', () => {
  it('ukladá sa len odtlačok so soľou, nie samotný PIN', async () => {
    const zaznam = await zabezpecPin('1234');
    expect(zaznam.pinHash).toMatch(/^[0-9a-f]{64}$/);
    expect(zaznam.pinSol).toMatch(/^[0-9a-f]{32}$/);
    expect(JSON.stringify(zaznam)).not.toContain('1234');
  });

  it('rovnaký PIN má pri inej soli iný odtlačok', async () => {
    const a = await zabezpecPin('1234');
    const b = await zabezpecPin('1234');
    expect(a.pinHash).not.toBe(b.pinHash);
  });

  it('odtlačok je SHA-256 zo „soľ:PIN“', async () => {
    // Porovnanie s nezávislým výpočtom SHA-256 v Node.js
    const ocakavany = createHash('sha256').update('abc:1234').digest('hex');
    expect(await odtlacokPinu('1234', 'abc')).toBe(ocakavany);
  });

  it('overenie PIN funguje', async () => {
    const zaznam = await zabezpecPin('2580');
    expect(await overPin('2580', zaznam)).toBe(true);
    expect(await overPin('2581', zaznam)).toBe(false);
    expect(await overPin('2580', null)).toBe(false);
  });

  it('platný PIN má presne požadovaný počet číslic', () => {
    expect(jePlatnyPin('1234')).toBe(true);
    expect(jePlatnyPin('123')).toBe(false);
    expect(jePlatnyPin('12a4')).toBe(false);
    expect(jePlatnyPin('123456', 6)).toBe(true);
  });

  it('PIN personálu sa zadá, uloží a overí', async () => {
    await nastavPersonalPin('135790');
    expect(await overPersonalPin('135790')).toBe(true);
    expect(await overPersonalPin('000000')).toBe(false);
    await expect(nastavPersonalPin('1234')).rejects.toThrow();
  });
});

describe('obťažnosť', () => {
  it('rozsahy úrovní sú Ľahká 1–3, Stredná 4–7, Náročná 8–10', () => {
    expect([OBTIAZNOSTI.lahka.od, OBTIAZNOSTI.lahka.do]).toEqual([1, 3]);
    expect([OBTIAZNOSTI.stredna.od, OBTIAZNOSTI.stredna.do]).toEqual([4, 7]);
    expect([OBTIAZNOSTI.narocna.od, OBTIAZNOSTI.narocna.do]).toEqual([8, 10]);
  });

  it('≥ 90 % správne zvýši úroveň o jednu', () => {
    expect(novaUroven(4, 'stredna', 9, 10)).toBe(5);
    expect(novaUroven(4, 'stredna', 10, 10)).toBe(5);
  });

  it('menej ako 60 % zníži úroveň o jednu', () => {
    expect(novaUroven(5, 'stredna', 5, 10)).toBe(4);
  });

  it('medzi 60 a 90 % sa úroveň nemení', () => {
    expect(novaUroven(5, 'stredna', 6, 10)).toBe(5);
    expect(novaUroven(5, 'stredna', 8, 10)).toBe(5);
  });

  it('úroveň nikdy neopustí rozsah obťažnosti', () => {
    expect(novaUroven(3, 'lahka', 10, 10)).toBe(3);
    expect(novaUroven(1, 'lahka', 0, 10)).toBe(1);
    expect(novaUroven(10, 'narocna', 10, 10)).toBe(10);
    expect(novaUroven(8, 'narocna', 0, 10)).toBe(8);
    expect(vRozsahu(2, 'stredna')).toBe(4);
  });

  it('v jemnom režime sa úroveň nemení', () => {
    expect(novaUroven(5, 'stredna', 10, 10, true)).toBe(5);
    expect(novaUroven(5, 'stredna', 0, 10, true)).toBe(5);
  });

  it('začiatočné úrovne sú na začiatku rozsahu pre každú úlohu', () => {
    const urovne = zaciatocneUrovne('narocna');
    expect(Object.keys(urovne)).toEqual(TYPY_ULOH);
    expect(new Set(Object.values(urovne))).toEqual(new Set([8]));
  });
});

describe('ukladajú sa iba povolené údaje', () => {
  function overPolia(zaznam) {
    for (const pole of Object.keys(zaznam)) expect(POVOLENE_POLIA).toContain(pole);
  }

  it('nový hráč obsahuje len povolené polia', async () => {
    const hrac = await vytvorHraca({
      meno: 'Anna',
      rastlina: 'mak',
      pin: '1111',
      obtiaznost: 'lahka',
      // Tieto údaje sa NESMÚ uložiť
      poznamka: 'čokoľvek',
      vysledky: [1, 2, 3],
      rodneCislo: '000000/0000',
    });
    const ulozeny = await nacitajHraca(hrac.id);
    overPolia(ulozeny);
    expect(ulozeny).not.toHaveProperty('poznamka');
    expect(ulozeny).not.toHaveProperty('vysledky');
    expect(ulozeny).not.toHaveProperty('rodneCislo');
    expect(JSON.stringify(ulozeny)).not.toContain('1111');
  });

  it('úprava hráča nepridá nepovolené polia', async () => {
    const hrac = await vytvorHraca({ meno: 'Jozef', rastlina: 'lipa', pin: '2222' });
    await upravHraca(hrac.id, { meno: 'Jožko', poznamka: 'nie', odpovede: [true] });
    await zaznamenajDenHrania(hrac.id, '2026-11-01');
    await nastavUroven(hrac.id, 'pexeso', 3);
    overPolia(await nacitajHraca(hrac.id));
  });

  it('všetky uložené záznamy v databáze obsahujú len povolené polia', async () => {
    await pridajUkazkovehoHraca();
    await vytvorHraca({ meno: 'Mária', rastlina: 'ruza', pin: '3333', obtiaznost: 'stredna', jemnyRezim: true });
    for (const zaznam of await db.vsetciHraci()) overPolia(zaznam);
  });

  it('deň hrania sa zapíše len raz', async () => {
    const hrac = await vytvorHraca({ meno: 'Eva', rastlina: 'vres', pin: '4444' });
    await zaznamenajDenHrania(hrac.id, '2026-11-02');
    await zaznamenajDenHrania(hrac.id, '2026-11-02');
    await zaznamenajDenHrania(hrac.id, '2026-11-01');
    expect((await nacitajHraca(hrac.id)).dniHrania).toEqual(['2026-11-01', '2026-11-02']);
  });
});

describe('hráči', () => {
  it('ukážkový hráč má PIN 1234', async () => {
    const hrac = await pridajUkazkovehoHraca();
    expect(await overPinHraca(hrac.id, '1234')).toBe(true);
  });

  it('zmena obťažnosti nastaví úrovne na začiatok nového rozsahu', async () => {
    const hrac = await vytvorHraca({ meno: 'Ján', rastlina: 'mak', pin: '5555', obtiaznost: 'lahka' });
    await upravHraca(hrac.id, { obtiaznost: 'narocna' });
    const upraveny = await nacitajHraca(hrac.id);
    expect(upraveny.obtiaznost).toBe('narocna');
    expect(upraveny.urovne.pexeso).toBe(8);
  });

  it('prázdny PIN pri úprave nechá pôvodný PIN', async () => {
    const hrac = await vytvorHraca({ meno: 'Oľga', rastlina: 'mak', pin: '6666' });
    await upravHraca(hrac.id, { meno: 'Oľga', pin: '' });
    expect(await overPinHraca(hrac.id, '6666')).toBe(true);
  });

  it('neplatné údaje sa odmietnu', async () => {
    await expect(vytvorHraca({ meno: '', rastlina: 'mak', pin: '1234' })).rejects.toThrow();
    await expect(vytvorHraca({ meno: 'A', rastlina: 'kaktus', pin: '1234' })).rejects.toThrow();
    await expect(vytvorHraca({ meno: 'A', rastlina: 'mak', pin: '12' })).rejects.toThrow();
  });

  it('vymazanie hráča ho naozaj odstráni', async () => {
    const hrac = await vytvorHraca({ meno: 'Ivan', rastlina: 'mak', pin: '7777' });
    await vymazHraca(hrac.id);
    expect(await nacitajHraca(hrac.id)).toBeUndefined();
    expect(await zoznamHracov()).toEqual([]);
  });
});
