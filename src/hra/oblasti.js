// Šesť oblastí hry. Každá má svoju rastlinu a jemnú vlastnú farbu.

export const OBLASTI = [
  {
    id: 'oko',
    nazov: 'Bystré oko',
    rastlina: 'nevadza',
    farba: '#3f5f8c',
    svetla: '#e4ebf3',
    popis: 'Všímavosť a rýchly pohľad.',
    vysvetlivka: 'Na chvíľu sa ukáže obrázok v strede a hviezda na okraji. Potom si spomeniete, čo ste videli.',
    ulohy: ['stredOkraj'],
  },
  {
    id: 'pamat',
    nazov: 'Pamäť',
    rastlina: 'levandula',
    farba: '#5b4d86',
    svetla: '#ebe6f2',
    popis: 'Pexeso a nákupný zoznam.',
    vysvetlivka: 'Hľadáte dvojice obrázkov alebo si zapamätáte, čo treba kúpiť v obchode.',
    ulohy: ['pexeso', 'nakup'],
  },
  {
    id: 'slova',
    nazov: 'Slová',
    rastlina: 'harmancek',
    farba: '#75531a',
    svetla: '#f4e7c9',
    popis: 'Príslovia a skladanie slov.',
    vysvetlivka: 'Doplníte známe príslovie alebo poskladáte slovo z rozhádzaných písmen.',
    ulohy: ['prislovie', 'slovo'],
  },
  {
    id: 'logika',
    nazov: 'Logika',
    rastlina: 'lipa',
    farba: '#3b5832',
    svetla: '#e2e8d3',
    popis: 'Rady čísel a čo nepatrí do skupiny.',
    vysvetlivka: 'Nájdete, ktoré číslo pokračuje v rade, alebo ktoré slovo sa do skupiny nehodí.',
    ulohy: ['rady', 'nepatri'],
  },
  {
    id: 'orientacia',
    nazov: 'Orientácia',
    rastlina: 'zvoncek',
    farba: '#2f6563',
    svetla: '#e0eeec',
    popis: 'Otočené tvary.',
    vysvetlivka: 'Hľadáte tvar, ktorý je rovnaký, len otočený. Pozor na tvary obrátené ako v zrkadle.',
    ulohy: ['tvary'],
  },
  {
    id: 'spomienky',
    nazov: 'Spomienky',
    rastlina: 'ruza',
    farba: '#8a425d',
    svetla: '#f4e2e7',
    popis: 'Ako to bolo kedysi.',
    vysvetlivka: 'Otázky o tom, ako sa kedysi žilo, pracovalo a oslavovalo. Môžu byť začiatkom pekného rozhovoru.',
    ulohy: ['spomienky'],
  },
];

export const NAZVY_ULOH = {
  stredOkraj: 'Stred a okraj',
  pexeso: 'Pexeso',
  nakup: 'Nákupný zoznam',
  prislovie: 'Doplň príslovie',
  slovo: 'Poskladaj slovo',
  rady: 'Rady čísel',
  nepatri: 'Čo nepatrí do skupiny',
  tvary: 'Otočené tvary',
  spomienky: 'Ako to bolo kedysi',
};

export function oblastUlohy(typ) {
  return OBLASTI.find((o) => o.ulohy.includes(typ));
}

/**
 * Denný tréning: 4 úlohy zo 4 rôznych oblastí.
 * @param {() => number} nahoda  generátor náhodných čísel (kvôli testom)
 */
export function dennyTrening(nahoda = Math.random) {
  const oblasti = [...OBLASTI];
  for (let i = oblasti.length - 1; i > 0; i--) {
    const j = Math.floor(nahoda() * (i + 1));
    [oblasti[i], oblasti[j]] = [oblasti[j], oblasti[i]];
  }
  return oblasti.slice(0, 4).map((o) => ({ oblast: o.id, typ: o.ulohy[Math.floor(nahoda() * o.ulohy.length)] }));
}
