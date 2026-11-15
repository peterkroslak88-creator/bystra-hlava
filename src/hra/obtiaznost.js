// Obťažnosť a tiché prispôsobovanie úrovne.
// Úroveň je len nastavenie hry, nie hodnotenie hráča.

export const TYPY_ULOH = [
  'stredOkraj',
  'pexeso',
  'nakup',
  'prislovie',
  'slovo',
  'rady',
  'nepatri',
  'tvary',
  'spomienky',
];

export const OBTIAZNOSTI = {
  lahka: {
    nazov: 'Ľahká',
    od: 1,
    do: 3,
    popis: 'Pokojné tempo a prehľadné úlohy.',
    vysvetlivka: 'Menej položiek naraz, kratšie slová a dosť času na každú odpoveď. Dobrá voľba na začiatok.',
  },
  stredna: {
    nazov: 'Stredná',
    od: 4,
    do: 7,
    popis: 'Pestrejšie úlohy s viacerými položkami.',
    vysvetlivka: 'Úlohy majú viac obrázkov a slov a o niečo dlhšie rady. Hra sa stále prispôsobuje tomu, ako sa darí.',
  },
  narocna: {
    nazov: 'Náročná',
    od: 8,
    do: 10,
    popis: 'Pre tých, ktorí majú radi výzvu.',
    vysvetlivka: 'Najviac položiek, dlhšie slová a zložitejšie rady. Na odpoveď je o niečo menej času.',
  },
};

export const KLUCE_OBTIAZNOSTI = Object.keys(OBTIAZNOSTI);

// Udrží úroveň v rozsahu zvolenej obťažnosti
export function vRozsahu(uroven, obtiaznost) {
  const { od, do: po } = OBTIAZNOSTI[obtiaznost];
  if (!Number.isFinite(uroven)) return od;
  return Math.min(po, Math.max(od, Math.round(uroven)));
}

// Úrovne všetkých úloh na začiatku zvolenej obťažnosti
export function zaciatocneUrovne(obtiaznost) {
  const od = OBTIAZNOSTI[obtiaznost].od;
  return Object.fromEntries(TYPY_ULOH.map((typ) => [typ, od]));
}

/**
 * Nová úroveň po dohraní úlohy.
 * ≥ 90 % správne → o jednu vyššie, menej ako 60 % → o jednu nižšie.
 * V jemnom režime sa úroveň nemení.
 * Počty správnych odpovedí sa nikam neukladajú, slúžia len na tento výpočet.
 */
export function novaUroven(uroven, obtiaznost, spravne, spolu, jemnyRezim = false) {
  const aktualna = vRozsahu(uroven, obtiaznost);
  if (jemnyRezim || !spolu) return aktualna;
  const pomer = spravne / spolu;
  if (pomer >= 0.9) return vRozsahu(aktualna + 1, obtiaznost);
  if (pomer < 0.6) return vRozsahu(aktualna - 1, obtiaznost);
  return aktualna;
}
