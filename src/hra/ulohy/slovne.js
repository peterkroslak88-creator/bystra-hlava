// Úlohy s výberom odpovede: príslovie, rady čísel, čo nepatrí, spomienky.
import { h } from '../../dom.js';
import { PARAMETRE, otazkaPrislovia, otazkaRadu, otazkaNepatri, otazkySpomienok } from '../logika.js';
import { otazka } from './spolocne.js';

// Slová – Doplň príslovie
export const PRISLOVIE = {
  nazov: 'Doplň príslovie',
  zadanie: 'Ktoré slovo chýba v príslovi?',
  async spusti(plocha, { uroven }) {
    const p = PARAMETRE.prislovie(uroven);
    const pouzite = [];
    let spravne = 0;
    for (let kolo = 0; kolo < p.kola; kolo++) {
      const q = otazkaPrislovia(p.moznosti, Math.random, pouzite);
      pouzite.push(q.prislovie);
      const ok = await otazka(plocha, {
        zadanieText: `Ktoré slovo chýba v príslovi? ${q.pred} … ${q.za}`,
        obsah: h('p', { class: 'veta' }, q.pred, h('span', { class: 'veta__medzera', 'aria-label': 'chýbajúce slovo' }, '……'), q.za),
        moznosti: q.moznosti.map((s) => ({ hodnota: s, popis: s, obsah: s })),
        spravna: q.slovo,
        triedaMoznosti: 'volby--slova',
        vysvetlenie: `Celé príslovie: ${q.cele}`,
      });
      if (ok) spravne++;
    }
    return { spravne, spolu: p.kola };
  },
};

// Logika – Rady čísel
export const RADY = {
  nazov: 'Rady čísel',
  zadanie: 'Ktoré číslo v rade pokračuje?',
  async spusti(plocha, { uroven }) {
    const p = PARAMETRE.rady(uroven);
    let spravne = 0;
    for (let kolo = 0; kolo < p.kola; kolo++) {
      const q = otazkaRadu(uroven, p.moznosti);
      const ok = await otazka(plocha, {
        zadanieText: `Ktoré číslo pokračuje v rade ${q.zobrazene.join(', ')}?`,
        obsah: h(
          'div',
          { class: 'rad-cisel', 'aria-hidden': 'true' },
          q.zobrazene.map((c) => h('span', { class: 'rad-cisel__cislo' }, String(c))),
          h('span', { class: 'rad-cisel__cislo rad-cisel__cislo--otaznik' }, '?')
        ),
        moznosti: q.moznosti.map((c) => ({ hodnota: c, popis: String(c), obsah: String(c) })),
        spravna: q.odpoved,
        triedaMoznosti: 'volby--cisla',
        vysvetlenie: `${q.popis} Ďalej pokračuje číslo ${q.odpoved}.`,
      });
      if (ok) spravne++;
    }
    return { spravne, spolu: p.kola };
  },
};

// Logika – Čo nepatrí do skupiny
export const NEPATRI = {
  nazov: 'Čo nepatrí do skupiny',
  zadanie: 'Ktoré slovo sa do skupiny nehodí?',
  async spusti(plocha, { uroven }) {
    const p = PARAMETRE.nepatri(uroven);
    let spravne = 0;
    for (let kolo = 0; kolo < p.kola; kolo++) {
      const q = otazkaNepatri(p.pocet, p.pribuzne);
      const ok = await otazka(plocha, {
        zadanieText: 'Ktoré slovo sa do skupiny nehodí?',
        moznosti: q.moznosti.map((s) => ({ hodnota: s, popis: s, obsah: s })),
        spravna: q.odpoved,
        triedaMoznosti: 'volby--slova',
        vysvetlenie: q.vysvetlenie,
      });
      if (ok) spravne++;
    }
    return { spravne, spolu: p.kola };
  },
};

// Spomienky – Ako to bolo kedysi
export const SPOMIENKY = {
  nazov: 'Ako to bolo kedysi',
  zadanie: 'Spomeňte si, ako sa kedysi žilo.',
  async spusti(plocha, { uroven }) {
    const p = PARAMETRE.spomienky(uroven);
    const otazky = otazkySpomienok(p.kola, p.stupen, p.moznosti);
    let spravne = 0;
    for (const q of otazky) {
      const ok = await otazka(plocha, {
        zadanieText: q.otazka,
        moznosti: q.moznosti.map((s) => ({ hodnota: s, popis: s, obsah: s })),
        spravna: q.odpoved,
        triedaMoznosti: 'volby--slova',
        vysvetlenie: `Odpoveď: ${q.odpoved}.`,
        rozhovor: q.rozhovor,
      });
      if (ok) spravne++;
    }
    return { spravne, spolu: otazky.length };
  },
};
