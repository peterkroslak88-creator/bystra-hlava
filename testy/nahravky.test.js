// Zabudovaný hlas: každý stály text, ktorý appka číta, musí mať nahrávku.
// Ak tento test zlyhá po zmene textov, treba spustiť `npm run hlas`.
import { describe, it, expect } from 'vitest';
import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { zoznamNaNahratie } from '../src/hlas/zoznam.js';
import { pripravText, klucNahravky, castiVety, nahravkyPreVetu } from '../src/komponenty/hlas-logika.js';
import { otazkaPrislovia, otazkaNepatri, otazkaRadu, otazkySpomienok, kolouNakupu, pripravKviz, PARAMETRE, PISMENA_MOZNOSTI } from '../src/hra/logika.js';
import { zasobaKvizu } from '../src/hra/obsah/kviz.js';
import { SLOVA } from '../src/hra/obsah/slova.js';

const HLAS = join(import.meta.dirname, '..', 'public', 'hlas');
const data = JSON.parse(readFileSync(join(HLAS, 'index.json'), 'utf8'));
const ma = (kluc) => data.nahravky[kluc];
const celeNahrane = (text) => pripravText(text).filter((veta) => !nahravkyPreVetu(veta, ma));

describe('nahrávky zabudovaného hlasu', () => {
  it('balíky existujú a nahrávky do nich zapadajú', () => {
    const velkosti = Array.from({ length: data.baliky }, (_, i) => statSync(join(HLAS, `balik-${i}.bin`)).size);
    for (const [kluc, [balik, zaciatok, dlzka]] of Object.entries(data.nahravky)) {
      expect(zaciatok + dlzka, kluc).toBeLessThanOrEqual(velkosti[balik]);
      expect(dlzka).toBeGreaterThan(200);
    }
    expect(velkosti.reduce((a, b) => a + b, 0)).toBeLessThan(20_000_000);
  });

  it('každá veta a časť zo zoznamu má nahrávku', () => {
    const { vety, casti } = zoznamNaNahratie();
    const chybaju = [...vety.flatMap((t) => pripravText(t)).filter((v) => !ma(klucNahravky(v))), ...casti.filter((c) => !ma(klucNahravky(c)))];
    expect(chybaju).toEqual([]);
  });

  it('veta sa nájde celá alebo poskladaná z častí', () => {
    expect(nahravkyPreVetu('Správne!', ma)).toHaveLength(1);
    expect(castiVety('Možnosti: mrkva, ruža, dub.')).toEqual(['možnosti', 'mrkva', 'ruža', 'dub']);
    expect(nahravkyPreVetu('Možnosti: mrkva, ruža, dub.', ma)).toHaveLength(4);
    expect(nahravkyPreVetu('Rad: 4, 7, 10, 13.', ma)).toHaveLength(5);
    expect(nahravkyPreVetu('Dobrý deň, Hermenegilda.', ma)).toBeNull(); // meno hráča nahrané nie je
  });

  it('texty, ktoré vznikajú počas hry, sú celé nahrané', () => {
    const chybaju = new Set();
    const skus = (text) => celeNahrane(text).forEach((v) => chybaju.add(v));
    for (let uroven = 1; uroven <= 10; uroven++) {
      for (let i = 0; i < 40; i++) {
        const p = otazkaPrislovia(PARAMETRE.prislovie(uroven).moznosti);
        skus(`Ktoré slovo chýba v príslovi? ${p.pred} … ${p.za} Možnosti: ${p.moznosti.join(', ')}.`);
        skus(`Nevadí. Celé príslovie: ${p.cele}`);
        const r = otazkaRadu(uroven, PARAMETRE.rady(uroven).moznosti);
        skus(`Ktoré číslo v rade pokračuje? Rad: ${r.zobrazene.join(', ')}. Možnosti: ${r.moznosti.join(', ')}.`);
        skus(`Správne! ${r.popis} Ďalej pokračuje číslo: ${r.odpoved}.`);
        const n = otazkaNepatri(PARAMETRE.nepatri(uroven).pocet, PARAMETRE.nepatri(uroven).pribuzne);
        skus(`Ktoré slovo sa do skupiny nehodí? Možnosti: ${n.moznosti.join(', ')}.`);
        skus(`Nevadí. ${n.vysvetlenie}`);
        const k = kolouNakupu(PARAMETRE.nakup(uroven).polozky, PARAMETRE.nakup(uroven).spolu);
        skus(`V zozname je: ${k.zoznam.join(', ')}.`);
        skus(`Nevadí. V zozname bolo: ${k.zoznam.join(', ')}.`);
      }
      const s = PARAMETRE.spomienky(uroven);
      for (const q of otazkySpomienok(s.kola, s.stupen, s.moznosti)) {
        skus(`${q.otazka} Možnosti: ${q.moznosti.join(', ')}.`);
        skus(['Nevadí.', `Odpoveď: ${q.odpoved}.`, q.rozhovor ? `Na rozhovor: ${q.rozhovor}` : ''].filter(Boolean).join(' '));
      }
    }
    for (const { slovo, napoveda } of SLOVA) {
      skus(`Nápoveda: ${napoveda}. Slovo začína na písmeno ${slovo[0].toLocaleUpperCase('sk')}.`);
      skus(`Správne! Hľadané slovo: ${slovo.toLocaleUpperCase('sk')}.`);
    }
    for (const q of pripravKviz(zasobaKvizu(), zasobaKvizu().length)) {
      skus(`${q.otazka} ${q.moznosti.map((m, i) => `${PISMENA_MOZNOSTI[i]}: ${m}.`).join(' ')}`);
    }
    expect([...chybaju]).toEqual([]);
  });
});
