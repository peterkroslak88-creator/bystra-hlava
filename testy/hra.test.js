// Testy obsahu a logiky úloh.
import { describe, it, expect } from 'vitest';
import { PRISLOVIA, rozober } from '../src/hra/obsah/prislovia.js';
import { SLOVA } from '../src/hra/obsah/slova.js';
import { SPOMIENKY } from '../src/hra/obsah/spomienky.js';
import { SKUPINY, PRIBUZNE, NEMIESAT, NAKUP } from '../src/hra/obsah/skupiny.js';
import { OBLASTI, NAZVY_ULOH, dennyTrening } from '../src/hra/oblasti.js';
import { ID_RASTLIN } from '../src/dizajn/rastliny.js';
import { TYPY_ULOH } from '../src/hra/obtiaznost.js';
import {
  PARAMETRE,
  otazkaPrislovia,
  slovaPreUroven,
  rozhadzPismena,
  otazkaRadu,
  otazkaNepatri,
  kolouNakupu,
  vyhodnotNakup,
  vyhodnotPexeso,
  otazkySpomienok,
  TVARY,
  jeChiralny,
  otazkaTvaru,
  otoc,
  zrkadli,
  kluc,
} from '../src/hra/logika.js';

const UROVNE = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const OPAKOVANI = 60;

describe('oblasti a typy úloh', () => {
  it('je šesť oblastí s ôsmimi typmi úloh a spomienkami', () => {
    expect(OBLASTI).toHaveLength(6);
    const typy = OBLASTI.flatMap((o) => o.ulohy).sort();
    expect(typy).toEqual([...TYPY_ULOH].sort());
    expect(Object.keys(NAZVY_ULOH).sort()).toEqual([...TYPY_ULOH].sort());
    expect(Object.keys(PARAMETRE).sort()).toEqual([...TYPY_ULOH].sort());
  });

  it('každá oblasť má vlastnú rastlinu a farbu', () => {
    expect(new Set(OBLASTI.map((o) => o.rastlina)).size).toBe(6);
    expect(new Set(OBLASTI.map((o) => o.farba)).size).toBe(6);
    for (const o of OBLASTI) expect(ID_RASTLIN).toContain(o.rastlina);
  });

  it('denný tréning má 4 úlohy zo 4 rôznych oblastí', () => {
    for (let i = 0; i < OPAKOVANI; i++) {
      const t = dennyTrening();
      expect(t).toHaveLength(4);
      expect(new Set(t.map((u) => u.oblast)).size).toBe(4);
      for (const u of t) expect(OBLASTI.find((o) => o.id === u.oblast).ulohy).toContain(u.typ);
    }
  });

  it('parametre existujú pre všetky úrovne 1–10', () => {
    for (const typ of TYPY_ULOH) {
      for (const u of UROVNE) {
        const p = PARAMETRE[typ](u);
        for (const hodnota of Object.values(p)) expect(hodnota).not.toBeUndefined();
      }
    }
    expect(PARAMETRE.pexeso(10).dvojice).toBeLessThanOrEqual(ID_RASTLIN.length);
  });
});

describe('príslovia', () => {
  it('každé príslovie má práve jedno chýbajúce slovo', () => {
    for (const p of PRISLOVIA) {
      expect(p.match(/\{/g), p).toHaveLength(1);
      expect(rozober(p).slovo.length).toBeGreaterThan(1);
    }
    expect(new Set(PRISLOVIA).size).toBe(PRISLOVIA.length);
    expect(PRISLOVIA.length).toBeGreaterThanOrEqual(40);
  });

  it('možnosti sú rôzne a obsahujú správne slovo', () => {
    for (const u of UROVNE) {
      const { moznosti: n } = PARAMETRE.prislovie(u);
      for (let i = 0; i < OPAKOVANI; i++) {
        const q = otazkaPrislovia(n);
        expect(q.moznosti).toHaveLength(n);
        expect(new Set(q.moznosti).size).toBe(n);
        expect(q.moznosti).toContain(q.slovo);
      }
    }
  });
});

describe('skladanie slov', () => {
  it('na každej úrovni je dosť slov', () => {
    for (const u of UROVNE) expect(slovaPreUroven(u).length, `úroveň ${u}`).toBeGreaterThanOrEqual(PARAMETRE.slovo(u).kola);
  });

  it('rozhádzané písmená nikdy netvoria pôvodné slovo', () => {
    for (const { slovo } of SLOVA) {
      for (let i = 0; i < 10; i++) {
        const p = rozhadzPismena(slovo);
        expect(p.join('')).not.toBe(slovo);
        expect([...p].sort().join('')).toBe([...slovo].sort().join(''));
      }
    }
  });
});

describe('rady čísel', () => {
  it('na každej úrovni je správna odpoveď medzi rôznymi kladnými možnosťami', () => {
    for (const u of UROVNE) {
      const { moznosti: n } = PARAMETRE.rady(u);
      for (let i = 0; i < OPAKOVANI; i++) {
        const q = otazkaRadu(u, n);
        expect(q.moznosti).toHaveLength(n);
        expect(new Set(q.moznosti).size).toBe(n);
        expect(q.moznosti).toContain(q.odpoved);
        for (const m of q.moznosti) expect(m).toBeGreaterThan(0);
        expect(q.popis.length).toBeGreaterThan(10);
      }
    }
  });
});

describe('čo nepatrí do skupiny', () => {
  it('žiadne slovo nie je v dvoch skupinách', () => {
    const vsetky = Object.values(SKUPINY).flatMap((s) => s.slova);
    expect(new Set(vsetky).size).toBe(vsetky.length);
  });

  it('príbuzné a zakázané dvojice odkazujú na existujúce skupiny', () => {
    for (const [a, b] of [...PRIBUZNE, ...NEMIESAT]) {
      expect(SKUPINY[a]).toBeDefined();
      expect(SKUPINY[b]).toBeDefined();
    }
  });

  it('práve jedno slovo nepatrí a nemiešajú sa nejednoznačné skupiny', () => {
    for (const u of UROVNE) {
      const p = PARAMETRE.nepatri(u);
      for (let i = 0; i < OPAKOVANI; i++) {
        const q = otazkaNepatri(p.pocet, p.pribuzne);
        expect(q.moznosti).toHaveLength(p.pocet);
        expect(new Set(q.moznosti).size).toBe(p.pocet);
        const mimo = q.moznosti.filter((s) => !SKUPINY[q.skupina].slova.includes(s));
        expect(mimo).toEqual([q.odpoved]);
        const zakazane = NEMIESAT.some(([a, b]) => (a === q.skupina && b === q.inaSkupina) || (b === q.skupina && a === q.inaSkupina));
        expect(zakazane).toBe(false);
      }
    }
  });
});

describe('nákupný zoznam a pexeso', () => {
  it('zoznam je súčasťou ponuky', () => {
    for (const u of UROVNE) {
      const p = PARAMETRE.nakup(u);
      const k = kolouNakupu(p.polozky, p.spolu);
      expect(k.zoznam).toHaveLength(p.polozky);
      expect(k.ponuka).toHaveLength(p.spolu);
      for (const z of k.zoznam) expect(k.ponuka).toContain(z);
    }
    expect(new Set(NAKUP).size).toBe(NAKUP.length);
  });

  it('vyhodnotenie nákupu', () => {
    expect(vyhodnotNakup(['a', 'b', 'c'], ['a', 'b', 'c'])).toEqual({ spravne: 3, spolu: 3 });
    expect(vyhodnotNakup(['a', 'b', 'c'], ['a', 'x'])).toEqual({ spravne: 0, spolu: 3 });
    expect(vyhodnotNakup(['a', 'b', 'c'], ['a', 'b'])).toEqual({ spravne: 2, spolu: 3 });
  });

  it('pexeso: pár omylov je v poriadku, veľa omylov zníži pomer', () => {
    const malo = vyhodnotPexeso(5, 7);
    expect(malo.spravne / malo.spolu).toBe(1);
    const vela = vyhodnotPexeso(5, 20);
    expect(vela.spravne / vela.spolu).toBeLessThan(0.6);
  });
});

describe('spomienky', () => {
  it('každá otázka má štyri rôzne možnosti a stupeň 1–3', () => {
    for (const s of SPOMIENKY) {
      expect(s.moznosti).toHaveLength(4);
      expect(new Set(s.moznosti).size).toBe(4);
      expect([1, 2, 3]).toContain(s.stupen);
    }
    expect(SPOMIENKY.filter((s) => s.stupen === 1).length).toBeGreaterThanOrEqual(PARAMETRE.spomienky(1).kola);
  });

  it('vybrané otázky obsahujú správnu odpoveď', () => {
    for (const u of UROVNE) {
      const p = PARAMETRE.spomienky(u);
      const otazky = otazkySpomienok(p.kola, p.stupen, p.moznosti);
      expect(otazky).toHaveLength(p.kola);
      for (const q of otazky) {
        expect(q.moznosti).toHaveLength(p.moznosti);
        expect(q.moznosti).toContain(q.odpoved);
        expect(q.stupen).toBeLessThanOrEqual(p.stupen);
      }
    }
  });
});

describe('otočené tvary', () => {
  it('všetky tvary sú nesúmerné (zrkadlo sa nedá získať otočením)', () => {
    for (const skupina of Object.values(TVARY)) for (const t of skupina) expect(jeChiralny(t), JSON.stringify(t)).toBe(true);
  });

  it('práve jedna možnosť je otočený vzor, ostatné sú zrkadlové', () => {
    for (const u of UROVNE) {
      const p = PARAMETRE.tvary(u);
      for (let i = 0; i < OPAKOVANI; i++) {
        const q = otazkaTvaru(p.zlozitost, p.moznosti);
        expect(q.moznosti).toHaveLength(p.moznosti);
        const otocenia = [0, 1, 2, 3].map((k) => kluc(otoc(q.vzor, k)));
        const spravne = q.moznosti.filter((m) => otocenia.includes(kluc(m.bunky)));
        expect(spravne).toHaveLength(1);
        expect(spravne[0].spravna).toBe(true);
        expect(kluc(spravne[0].bunky)).not.toBe(kluc(q.vzor));
        const zrkadla = [0, 1, 2, 3].map((k) => kluc(otoc(zrkadli(q.vzor), k)));
        for (const m of q.moznosti.filter((x) => !x.spravna)) expect(zrkadla).toContain(kluc(m.bunky));
        expect(new Set(q.moznosti.map((m) => kluc(m.bunky))).size).toBe(p.moznosti);
      }
    }
  });
});
