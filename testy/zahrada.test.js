// Testy rastu záhrady a míľnikov.
import { describe, it, expect } from 'vitest';
import {
  odkrytie,
  podielOdkrytia,
  MILNIKY,
  PLNA_ZAHRADA,
  textZahrady,
  textPrekvapenia,
  dalsiMilnik,
  rocneObdobie,
} from '../src/zahrada/milniky.js';
import { pole, STRED } from '../src/zahrada/sum.js';
import { svetloDna } from '../src/zahrada/svetlo.js';

describe('rast záhrady', () => {
  it('pri 0 dňoch je záhrada pustá', () => {
    expect(podielOdkrytia(0)).toBe(0);
    expect(odkrytie(0)).toBeLessThan(0);
  });

  it('každý deň sa záhrada trochu zväčší', () => {
    for (let d = 1; d < PLNA_ZAHRADA; d++) {
      expect(odkrytie(d + 1), `deň ${d + 1}`).toBeGreaterThan(odkrytie(d));
    }
  });

  it('míľniky sú väčšie skoky ako bežné dni', () => {
    for (const { den } of MILNIKY) {
      if (den >= PLNA_ZAHRADA) continue;
      const skok = podielOdkrytia(den) - podielOdkrytia(den - 1);
      const bezny = podielOdkrytia(den + 1) - podielOdkrytia(den);
      expect(skok, `míľnik ${den}`).toBeGreaterThan(bezny);
    }
  });

  it('po 45 dňoch je záhrada celá, po 30 ešte nie', () => {
    expect(podielOdkrytia(45)).toBe(1);
    expect(podielOdkrytia(100)).toBe(1);
    expect(podielOdkrytia(30)).toBeLessThan(0.8);
    expect(podielOdkrytia(15)).toBeLessThan(0.4);
  });

  it('záhrada sa odkrýva od kvetu do strán', () => {
    expect(pole(STRED.x, STRED.y)).toBeLessThan(pole(0.05, 0.8));
    expect(pole(STRED.x, STRED.y)).toBeLessThan(pole(0.95, 0.3));
    expect(pole(0.5, 0.82)).toBeLessThan(odkrytie(1) + 0.1);
  });

  it('míľniky sú 7, 10, 14, 21, 30 a 45 dní', () => {
    expect(MILNIKY.map((m) => m.den)).toEqual([7, 10, 14, 21, 30, 45]);
  });
});

describe('svetlo podľa dennej doby', () => {
  it('cez deň je svetlo neutrálne a bez hviezd', () => {
    expect(svetloDna(12)).toEqual({ nadych: [1, 1, 1], hviezdy: 0 });
  });

  it('podvečer je teplé, v noci chladnejšie s hviezdami', () => {
    const zlata = svetloDna(18.5);
    expect(zlata.nadych[0]).toBeGreaterThan(zlata.nadych[2]);
    const noc = svetloDna(23);
    expect(noc.hviezdy).toBe(1);
    expect(noc.nadych[2]).toBeGreaterThan(noc.nadych[0]);
  });

  it('záhrada nie je nikdy príliš tmavá a prechody sú plynulé', () => {
    let predtym = svetloDna(0);
    for (let h = 0; h <= 24; h += 0.1) {
      const s = svetloDna(h);
      for (let i = 0; i < 3; i++) {
        expect(s.nadych[i]).toBeGreaterThanOrEqual(0.6);
        expect(Math.abs(s.nadych[i] - predtym.nadych[i])).toBeLessThan(0.05);
      }
      expect(s.hviezdy).toBeGreaterThanOrEqual(0);
      expect(s.hviezdy).toBeLessThanOrEqual(1);
      predtym = s;
    }
    expect(svetloDna(24)).toEqual(svetloDna(0));
  });
});

describe('texty pod záhradou', () => {
  it('0 dní má presný úvodný text', () => {
    expect(textZahrady(0)).toBe('Záhrada je zatiaľ pustá. Po prvom tréningu v nej vyrastie prvý kvet.');
  });

  it('v deň míľnika sa ukáže jeho text', () => {
    for (const m of MILNIKY) expect(textZahrady(m.den)).toBe(m.text);
  });

  it('ukáže, o koľko dní príde ďalšie prekvapenie', () => {
    expect(textPrekvapenia(0)).toBe('Ďalšie prekvapenie príde o 7 dní tréningu.');
    expect(textPrekvapenia(5)).toBe('Ďalšie prekvapenie príde o 2 dni tréningu.');
    expect(textPrekvapenia(6)).toBe('Ďalšie prekvapenie príde už po najbližšom tréningu.');
    expect(dalsiMilnik(45)).toBeNull();
  });

  it('ročné obdobia podľa mesiaca', () => {
    expect(rocneObdobie(new Date(2026, 3, 10))).toBe('jar');
    expect(rocneObdobie(new Date(2026, 6, 10))).toBe('leto');
    expect(rocneObdobie(new Date(2026, 10, 14))).toBe('jesen');
    expect(rocneObdobie(new Date(2026, 0, 10))).toBe('zima');
  });
});
