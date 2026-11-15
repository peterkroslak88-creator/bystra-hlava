// Ako záhrada rastie: 1 deň tréningu = 1 krok. Míľniky sú väčšie skoky.
import { pole } from './sum.js';

export const PLNA_ZAHRADA = 45;

export const MILNIKY = [
  { den: 7, text: 'Za kvetom sa zazelenala lúka.' },
  { den: 10, text: 'Na lúke rozkvitli prvé poľné kvety.' },
  { den: 14, text: 'Na obzore sa objavili zelené kopce a chodníček.' },
  { den: 21, text: 'Pri lúke rozkvitla levanduľa a náprstníky.' },
  { den: 30, text: 'Objavili sa brezy a chodníček k chalúpke.' },
  { den: 45, text: 'Záhrada rozkvitla celá. Z púšte je raj.' },
];

const SKOK = 0.025; // navyše odkrytej plochy pri každom míľniku

/**
 * Aká časť maľby je odkrytá (0–1) po danom počte dní.
 * Na začiatku rastie pomalšie, míľniky pridajú väčší kus.
 */
export function podielOdkrytia(dni) {
  if (dni <= 0) return 0;
  if (dni >= PLNA_ZAHRADA) return 1;
  const skoky = MILNIKY.filter((m) => m.den <= dni).length;
  return Math.min(1, 0.004 + 0.85 * ((dni - 1) / (PLNA_ZAHRADA - 1)) ** 1.3 + skoky * SKOK);
}

// Rozloženie hodnôt poradového poľa po celej maľbe (vypočíta sa raz)
let zoradene = null;
function hodnotyPola() {
  if (!zoradene) {
    const hodnoty = [];
    for (let y = 0; y < 100; y++) {
      for (let x = 0; x < 200; x++) hodnoty.push(pole((x + 0.5) / 200, (y + 0.5) / 100));
    }
    zoradene = hodnoty.sort((a, b) => a - b);
  }
  return zoradene;
}

/**
 * Polomer odkrytia (v jednotkách „poradového poľa“ zo sum.js),
 * zvolený tak, aby odkrytá plocha zodpovedala podielu pre daný deň.
 * 0 dní = nič, 45 a viac dní = celá záhrada.
 */
export function odkrytie(dni) {
  if (dni <= 0) return -1;
  if (dni >= PLNA_ZAHRADA) return 9;
  const hodnoty = hodnotyPola();
  const index = Math.floor(podielOdkrytia(dni) * (hodnoty.length - 1));
  return hodnoty[index];
}

export function dalsiMilnik(dni) {
  const milnik = MILNIKY.find((m) => m.den > dni);
  return milnik ? { ...milnik, zostava: milnik.den - dni } : null;
}

function slovoDni(n) {
  if (n === 1) return 'deň';
  if (n >= 2 && n <= 4) return 'dni';
  return 'dní';
}

// Hlavná veta pod záhradou
export function textZahrady(dni) {
  if (dni <= 0) return 'Záhrada je zatiaľ pustá. Po prvom tréningu v nej vyrastie prvý kvet.';
  if (dni === 1) return 'V púšti vyrástol prvý kvet.';
  const dosiahnute = MILNIKY.filter((m) => m.den <= dni);
  const posledny = dosiahnute[dosiahnute.length - 1];
  if (posledny && posledny.den === dni) return posledny.text;
  if (dni < 7) return 'Okolo kvetu sa piesok pomaly mení na zem a trávu.';
  return posledny ? posledny.text : 'Záhrada pomaly rastie.';
}

// Veta o ďalšom prekvapení
export function textPrekvapenia(dni) {
  const dalsi = dalsiMilnik(dni);
  if (!dalsi) return 'Záhrada je v plnom kvete. Každý tréning ju udrží krásnu.';
  if (dalsi.zostava === 1) return 'Ďalšie prekvapenie príde už po najbližšom tréningu.';
  return `Ďalšie prekvapenie príde o ${dalsi.zostava} ${slovoDni(dalsi.zostava)} tréningu.`;
}

export function rocneObdobie(datum = new Date()) {
  const m = datum.getMonth() + 1;
  if (m >= 3 && m <= 5) return 'jar';
  if (m >= 6 && m <= 8) return 'leto';
  if (m >= 9 && m <= 11) return 'jesen';
  return 'zima';
}
