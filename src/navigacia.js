// Prechody medzi obrazovkami.
import { odchodObrazovky, vstupObrazovky } from './dizajn/pohyb.js';
import { zatvorVysvetlivky } from './komponenty/info.js';
import { zastavCitanie } from './komponenty/citanie.js';
import { relacia } from './relacia.js';

import { prvySpustenie } from './obrazovky/prvy-spustenie.js';
import { uvod } from './obrazovky/uvod.js';
import { prihlasenieKlienta } from './obrazovky/prihlasenie-klienta.js';
import { prihlaseniePersonalu } from './obrazovky/prihlasenie-personalu.js';
import { personal } from './obrazovky/personal.js';
import { hracEditor } from './obrazovky/hrac-editor.js';
import { vyberObtiaznosti } from './obrazovky/vyber-obtiaznosti.js';
import { zahrada } from './obrazovky/zahrada.js';
import { nastavenia } from './obrazovky/nastavenia.js';
import { nahladZahrady } from './obrazovky/nahlad-zahrady.js';
import { trening } from './obrazovky/trening.js';
import { oblasti } from './obrazovky/oblasti.js';
import { kvizNastavenie, kviz } from './obrazovky/kviz.js';

// rola = kto smie obrazovku vidieť
const OBRAZOVKY = {
  prvySpustenie: { vytvor: prvySpustenie },
  uvod: { vytvor: uvod },
  prihlasenieKlienta: { vytvor: prihlasenieKlienta },
  prihlaseniePersonalu: { vytvor: prihlaseniePersonalu },
  personal: { vytvor: personal, rola: 'personal' },
  hracEditor: { vytvor: hracEditor, rola: 'personal' },
  vyberObtiaznosti: { vytvor: vyberObtiaznosti, rola: 'klient' },
  zahrada: { vytvor: zahrada, rola: 'klient' },
  nastavenia: { vytvor: nastavenia, rola: 'klient' },
  nahladZahrady: { vytvor: nahladZahrady, rola: 'personal' },
  trening: { vytvor: trening, rola: 'klient' },
  oblasti: { vytvor: oblasti, rola: 'klient' },
  kvizNastavenie: { vytvor: kvizNastavenie, rola: 'personal' },
  kviz: { vytvor: kviz, rola: 'personal' },
};

let aktualna = null;
let rad = Promise.resolve();

export function prejdi(nazov, data = {}) {
  rad = rad.then(() => zmen(nazov, data)).catch((chyba) => console.error(chyba));
  return rad;
}

async function zmen(nazov, data) {
  let definicia = OBRAZOVKY[nazov] || OBRAZOVKY.uvod;
  if (definicia.rola && relacia.rola !== definicia.rola) definicia = OBRAZOVKY.uvod;

  const main = document.getElementById('obrazovka');
  zatvorVysvetlivky();
  zastavCitanie();

  const nova = await definicia.vytvor(data);
  if (!nova) return; // obrazovka sama presmerovala inam

  await odchodObrazovky(main.firstElementChild);
  aktualna?.zrus?.();
  main.replaceChildren(nova.el);
  aktualna = nova;
  window.scrollTo(0, 0);
  main.focus({ preventScroll: true });
  vstupObrazovky(nova.el);
}
