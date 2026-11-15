// Čistá logika úloh (bez obrazovky), aby sa dala ľahko otestovať.
import { SKUPINY, PRIBUZNE, NEMIESAT, NAKUP } from './obsah/skupiny.js';
import { PRISLOVIA, rozober } from './obsah/prislovia.js';
import { SLOVA, dlzkaPreUroven } from './obsah/slova.js';
import { SPOMIENKY } from './obsah/spomienky.js';

// ---------- Pomocníci ----------

export function zamiesaj(pole, nahoda = Math.random) {
  const kopia = [...pole];
  for (let i = kopia.length - 1; i > 0; i--) {
    const j = Math.floor(nahoda() * (i + 1));
    [kopia[i], kopia[j]] = [kopia[j], kopia[i]];
  }
  return kopia;
}

export function vyber(pole, pocet, nahoda = Math.random) {
  return zamiesaj(pole, nahoda).slice(0, pocet);
}

const podlaUrovne = (tabulka, uroven) => tabulka[Math.min(10, Math.max(1, uroven)) - 1];

// Viac času v jemnom režime
export const NASOBOK_JEMNY = 1.6;

// ---------- Parametre úloh podľa úrovne 1–10 ----------

export const PARAMETRE = {
  stredOkraj: (u) => ({
    kola: 4,
    zobrazenieMs: podlaUrovne([2600, 2200, 1900, 1600, 1400, 1200, 1000, 850, 700, 600], u),
    moznosti: podlaUrovne([2, 2, 2, 3, 3, 3, 3, 4, 4, 4], u),
    pozicie: podlaUrovne([4, 4, 4, 4, 8, 8, 8, 8, 8, 8], u),
  }),
  pexeso: (u) => ({
    dvojice: podlaUrovne([3, 4, 4, 5, 6, 6, 8, 8, 10, 10], u),
    nahladMs: podlaUrovne([4000, 4500, 3500, 3500, 3000, 0, 0, 0, 0, 0], u),
    ukazChybuMs: 1700,
  }),
  nakup: (u) => ({
    kola: 2,
    polozky: podlaUrovne([3, 3, 4, 4, 5, 5, 6, 6, 7, 7], u),
    spolu: podlaUrovne([6, 6, 8, 8, 9, 10, 10, 12, 12, 12], u),
  }),
  prislovie: (u) => ({ kola: 5, moznosti: podlaUrovne([2, 2, 3, 3, 3, 4, 4, 4, 4, 4], u) }),
  slovo: (u) => ({ kola: 4, dlzka: dlzkaPreUroven(Math.min(10, Math.max(1, u))), prvePismeno: u <= 3 }),
  rady: (u) => ({ kola: 5, moznosti: podlaUrovne([3, 3, 3, 3, 4, 4, 4, 4, 4, 4], u) }),
  nepatri: (u) => ({
    kola: 5,
    pocet: podlaUrovne([4, 4, 4, 5, 5, 5, 5, 6, 6, 6], u),
    pribuzne: u >= 7,
  }),
  tvary: (u) => ({
    kola: 5,
    moznosti: podlaUrovne([2, 2, 3, 3, 3, 3, 4, 4, 4, 4], u),
    zlozitost: podlaUrovne([1, 1, 1, 2, 2, 2, 2, 3, 3, 3], u),
  }),
  spomienky: (u) => ({
    kola: 5,
    moznosti: podlaUrovne([2, 2, 3, 3, 3, 4, 4, 4, 4, 4], u),
    stupen: podlaUrovne([1, 1, 1, 2, 2, 2, 3, 3, 3, 3], u),
  }),
};

// ---------- Príslovia ----------

export function otazkaPrislovia(pocetMoznosti, nahoda = Math.random, vynechat = []) {
  const kandidati = PRISLOVIA.filter((p) => !vynechat.includes(p));
  const prislovie = kandidati[Math.floor(nahoda() * kandidati.length)];
  const casti = rozober(prislovie);
  const ine = [...new Set(PRISLOVIA.map((p) => rozober(p).slovo))].filter((s) => s !== casti.slovo);
  const moznosti = zamiesaj([casti.slovo, ...vyber(ine, pocetMoznosti - 1, nahoda)], nahoda);
  return { prislovie, ...casti, moznosti };
}

// ---------- Skladanie slov ----------

export function slovaPreUroven(uroven) {
  const [od, po] = dlzkaPreUroven(uroven);
  return SLOVA.filter((s) => [...s.slovo].length >= od && [...s.slovo].length <= po);
}

// Rozhádže písmená tak, aby nevzniklo pôvodné slovo
export function rozhadzPismena(slovo, nahoda = Math.random) {
  const pismena = [...slovo];
  for (let pokus = 0; pokus < 20; pokus++) {
    const z = zamiesaj(pismena, nahoda);
    if (z.join('') !== slovo) return z;
  }
  return [...pismena].reverse();
}

// ---------- Rady čísel ----------

function rad(start, krok, dlzka, typ = '+') {
  const hodnoty = [start];
  for (let i = 1; i < dlzka; i++) {
    const p = hodnoty[i - 1];
    hodnoty.push(typ === '*' ? p * krok : p + krok);
  }
  return hodnoty;
}

const VZORY = [
  // úroveň 1
  (n) => {
    const s = 1 + Math.floor(n() * 6);
    return { cisla: rad(s, 1, 5), popis: 'Každé ďalšie číslo je o 1 väčšie.' };
  },
  // 2
  (n) => {
    const s = 2 * (1 + Math.floor(n() * 5));
    return { cisla: rad(s, 2, 5), popis: 'Každé ďalšie číslo je o 2 väčšie.' };
  },
  // 3
  (n) =>
    n() < 0.5
      ? { cisla: rad(5 * (1 + Math.floor(n() * 4)), 5, 5), popis: 'Každé ďalšie číslo je o 5 väčšie.' }
      : { cisla: rad(15 + Math.floor(n() * 6), -1, 5), popis: 'Každé ďalšie číslo je o 1 menšie.' },
  // 4
  (n) =>
    n() < 0.5
      ? { cisla: rad(10 * (1 + Math.floor(n() * 4)), 10, 5), popis: 'Každé ďalšie číslo je o 10 väčšie.' }
      : { cisla: rad(1 + Math.floor(n() * 5), 3, 5), popis: 'Každé ďalšie číslo je o 3 väčšie.' },
  // 5
  (n) =>
    n() < 0.5
      ? { cisla: rad(1 + Math.floor(n() * 3), 2, 5, '*'), popis: 'Každé ďalšie číslo je dvakrát väčšie.' }
      : { cisla: rad(40 + 5 * Math.floor(n() * 3), -5, 5), popis: 'Každé ďalšie číslo je o 5 menšie.' },
  // 6
  (n) => {
    const s = 1 + Math.floor(n() * 5);
    return { cisla: [s, s + 1, s + 3, s + 6, s + 10], popis: 'Rozdiely sa zväčšujú: o 1, o 2, o 3, o 4.' };
  },
  // 7
  (n) => {
    const s = 2 + Math.floor(n() * 5);
    return { cisla: [s, s + 1, s + 4, s + 5, s + 8], popis: 'Striedavo sa pripočíta 1 a 3.' };
  },
  // 8
  (n) =>
    n() < 0.5
      ? { cisla: rad(1 + Math.floor(n() * 2), 3, 5, '*'), popis: 'Každé ďalšie číslo je trikrát väčšie.' }
      : { cisla: rad(60 + Math.floor(n() * 10), -7, 5), popis: 'Každé ďalšie číslo je o 7 menšie.' },
  // 9
  (n) => {
    const s = 1 + Math.floor(n() * 4);
    return { cisla: [s, s + 2, s + 6, s + 12, s + 20], popis: 'Rozdiely sa zväčšujú: o 2, o 4, o 6, o 8.' };
  },
  // 10
  (n) =>
    n() < 0.5
      ? { cisla: [1, 4, 9, 16, 25], popis: 'Sú to čísla 1×1, 2×2, 3×3, 4×4 a 5×5.' }
      : { cisla: [1, 1, 2, 3, 5, 8], popis: 'Každé číslo je súčtom dvoch predchádzajúcich.' },
];

/**
 * Rad čísel: ukážu sa všetky okrem posledného, to sa háda.
 */
export function otazkaRadu(uroven, pocetMoznosti, nahoda = Math.random) {
  const { cisla, popis } = VZORY[Math.min(10, Math.max(1, uroven)) - 1](nahoda);
  const odpoved = cisla[cisla.length - 1];
  const zobrazene = cisla.slice(0, -1);
  const krok = Math.abs(odpoved - zobrazene[zobrazene.length - 1]) || 1;
  const kandidati = [odpoved + 1, odpoved - 1, odpoved + krok, odpoved - krok, odpoved + 2, odpoved + 10, odpoved - 2, zobrazene[zobrazene.length - 1]]
    .filter((x) => x > 0 && x !== odpoved);
  const zle = [...new Set(kandidati)];
  const moznosti = zamiesaj([odpoved, ...vyber(zle, pocetMoznosti - 1, nahoda)], nahoda);
  return { zobrazene, odpoved, moznosti, popis };
}

// ---------- Čo nepatrí do skupiny ----------

function moznoMiesat(a, b) {
  return a !== b && !NEMIESAT.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
}

export function otazkaNepatri(pocet, pribuzne, nahoda = Math.random) {
  const kluce = Object.keys(SKUPINY);
  let hlavna;
  let ina;
  if (pribuzne) {
    const par = PRIBUZNE[Math.floor(nahoda() * PRIBUZNE.length)];
    [hlavna, ina] = nahoda() < 0.5 ? par : [par[1], par[0]];
  } else {
    hlavna = kluce[Math.floor(nahoda() * kluce.length)];
    const vzdialene = kluce.filter(
      (k) => moznoMiesat(hlavna, k) && !PRIBUZNE.some(([x, y]) => (x === hlavna && y === k) || (x === k && y === hlavna))
    );
    ina = vzdialene[Math.floor(nahoda() * vzdialene.length)];
  }
  const slova = vyber(SKUPINY[hlavna].slova, pocet - 1, nahoda);
  const navyse = vyber(SKUPINY[ina].slova, 1, nahoda)[0];
  return {
    moznosti: zamiesaj([...slova, navyse], nahoda),
    odpoved: navyse,
    skupina: hlavna,
    inaSkupina: ina,
    vysvetlenie: `Slovo „${navyse}“ patrí medzi ${SKUPINY[ina].medzi}. Ostatné patria medzi ${SKUPINY[hlavna].medzi}.`,
  };
}

// ---------- Nákupný zoznam ----------

export function kolouNakupu(pocetPoloziek, spolu, nahoda = Math.random) {
  const vsetky = vyber(NAKUP, spolu, nahoda);
  return { zoznam: vsetky.slice(0, pocetPoloziek), ponuka: zamiesaj(vsetky, nahoda) };
}

// Správne = trafené položky mínus omylom vybraté (nie menej ako 0)
export function vyhodnotNakup(zoznam, vybrane) {
  const trafene = vybrane.filter((v) => zoznam.includes(v)).length;
  const navyse = vybrane.filter((v) => !zoznam.includes(v)).length;
  return { spravne: Math.max(0, trafene - navyse), spolu: zoznam.length };
}

// ---------- Pexeso ----------

// Pomer pre prispôsobenie: pri pexese je bežné, že sa pár ráz netrafí
export function vyhodnotPexeso(dvojice, pokusy) {
  const tolerancia = Math.round(dvojice * 1.6);
  return { spravne: Math.min(pokusy, tolerancia), spolu: Math.max(pokusy, 1) };
}

// ---------- Spomienky ----------

export function otazkySpomienok(pocet, stupen, pocetMoznosti, nahoda = Math.random) {
  const vhodne = SPOMIENKY.filter((s) => s.stupen <= stupen);
  return vyber(vhodne, pocet, nahoda).map((s) => {
    const odpoved = s.moznosti[0];
    const zle = vyber(s.moznosti.slice(1), pocetMoznosti - 1, nahoda);
    return { ...s, odpoved, moznosti: zamiesaj([odpoved, ...zle], nahoda) };
  });
}

// ---------- Otočené tvary ----------

// Tvary zo štvorčekov (súradnice [x, y]); všetky sú nesúmerné,
// takže zrkadlový obraz sa nedá získať otočením
export const TVARY = {
  1: [
    [[0, 0], [0, 1], [0, 2], [1, 2]], // L
    [[1, 0], [2, 0], [0, 1], [1, 1]], // S
    [[0, 0], [1, 0], [0, 1], [1, 1], [0, 2]], // P
  ],
  2: [
    [[1, 0], [2, 0], [0, 1], [1, 1], [1, 2]], // F
    [[0, 0], [0, 1], [1, 1], [1, 2], [1, 3]], // N
    [[1, 0], [0, 1], [1, 1], [1, 2], [1, 3]], // Y
    [[0, 0], [0, 1], [0, 2], [0, 3], [1, 3]], // dlhé L
  ],
  3: [
    [[0, 0], [1, 0], [1, 1], [2, 1], [2, 2], [3, 2]], // schody
    [[0, 0], [1, 0], [2, 0], [2, 1], [3, 1], [1, 2]],
    [[1, 0], [0, 1], [1, 1], [2, 1], [2, 2], [2, 3]],
    [[0, 0], [0, 1], [1, 1], [2, 1], [2, 2], [3, 1]],
  ],
};

// Posunie tvar do rohu a zoradí, aby sa dali tvary porovnať
export function normalizuj(bunky) {
  const minX = Math.min(...bunky.map(([x]) => x));
  const minY = Math.min(...bunky.map(([, y]) => y));
  return bunky
    .map(([x, y]) => [x - minX, y - minY])
    .sort((a, b) => a[1] - b[1] || a[0] - b[0]);
}

export const kluc = (bunky) => normalizuj(bunky).map((b) => b.join(',')).join(';');

export function otoc(bunky, krat = 1) {
  let b = bunky;
  for (let i = 0; i < krat % 4; i++) b = b.map(([x, y]) => [-y, x]);
  return normalizuj(b);
}

export function zrkadli(bunky) {
  return normalizuj(bunky.map(([x, y]) => [-x, y]));
}

export function jeChiralny(bunky) {
  const zrkadlo = kluc(zrkadli(bunky));
  return [0, 1, 2, 3].every((k) => kluc(otoc(bunky, k)) !== zrkadlo);
}

/**
 * Úloha: ktorý tvar je ten istý, len otočený?
 * Správna = otočený tvar, nesprávne = zrkadlové tvary v rôznych otočeniach.
 */
export function otazkaTvaru(zlozitost, pocetMoznosti, nahoda = Math.random) {
  // Len tvary, ktoré majú dosť rôznych zrkadlových otočení na všetky možnosti
  const pocetOtoceni = (b) => new Set([0, 1, 2, 3].map((k) => kluc(otoc(b, k)))).size;
  const skupina = TVARY[zlozitost].filter((t) => pocetOtoceni(zrkadli(t)) >= pocetMoznosti - 1);
  const tvar = normalizuj(skupina[Math.floor(nahoda() * skupina.length)]);
  const otocenieVzoru = Math.floor(nahoda() * 4);
  const vzor = otoc(tvar, otocenieVzoru);
  // Správny tvar musí byť naozaj otočený (nie rovnaký ako vzor)
  const otocenia = [1, 2, 3].filter((k) => kluc(otoc(vzor, k)) !== kluc(vzor));
  const spravna = otoc(vzor, otocenia[Math.floor(nahoda() * otocenia.length)]);
  const zrkadlo = zrkadli(vzor);
  const zle = [];
  const kluce = new Set([kluc(spravna), kluc(vzor)]);
  for (const k of zamiesaj([0, 1, 2, 3], nahoda)) {
    const z = otoc(zrkadlo, k);
    if (!kluce.has(kluc(z))) {
      kluce.add(kluc(z));
      zle.push(z);
    }
  }
  const moznosti = zamiesaj([{ bunky: spravna, spravna: true }, ...zle.slice(0, pocetMoznosti - 1).map((b) => ({ bunky: b, spravna: false }))], nahoda);
  return { vzor, moznosti };
}
