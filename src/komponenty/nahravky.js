// Zabudovaný hlas: vopred nahrané vety a slová (priečinok hlas/ je súčasťou appky).
// Balíky sa načítajú na pozadí hneď po spustení, aby sa pri ťuknutí na
// „Čítať nahlas“ dalo prehrať okamžite. Nič sa nikam neposiela.
import { nahravkyPreVetu } from './hlas-logika.js';

let index = null; // kľúč → [balík, začiatok, dĺžka]
let baliky = []; // obsah balíkov v pamäti
let prehravac = null;
let adresa = null;

export async function nacitajNahravky() {
  try {
    const odpoved = await fetch('./hlas/index.json');
    if (!odpoved.ok) return;
    const data = await odpoved.json();
    const nacitane = await Promise.all(
      Array.from({ length: data.baliky }, (_, i) => fetch(`./hlas/balik-${i}.bin`).then((r) => (r.ok ? r.arrayBuffer() : Promise.reject())))
    );
    baliky = nacitane;
    index = data.nahravky;
  } catch {
    index = null; // bez nahrávok číta hlas zariadenia
  }
}

export function nahravkyPripravene() {
  return Boolean(index);
}

// Nahrávky pre jednu vetu (celú, alebo poskladanú z častí), inak null
export function najdiNahravky(veta) {
  if (!index) return null;
  return nahravkyPreVetu(veta, (kluc) => index[kluc]);
}

/**
 * Prehrá jednu nahrávku. Vráti funkciu na zastavenie.
 * @param {[number, number, number]} nahravka
 */
export function prehraj([balik, zaciatok, dlzka], poSkonceni, priChybe) {
  if (!prehravac) prehravac = new Audio();
  if (adresa) URL.revokeObjectURL(adresa);
  adresa = URL.createObjectURL(new Blob([baliky[balik].slice(zaciatok, zaciatok + dlzka)], { type: 'audio/mpeg' }));
  prehravac.onended = poSkonceni;
  prehravac.onerror = priChybe;
  prehravac.src = adresa;
  prehravac.play().catch(priChybe);
}

export function zastavNahravku() {
  if (!prehravac) return;
  prehravac.onended = null;
  prehravac.onerror = null;
  prehravac.pause();
}
