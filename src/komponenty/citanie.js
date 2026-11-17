// Čítanie nahlas slovenským hlasom zariadenia (Web Speech API), rýchlosť 0,9.
// Vyberá sa najkrajší slovenský hlas v tablete; hlasy, ktoré posielajú text
// na internet, sa nepoužijú nikdy. Text sa číta po vetách s krátkou pauzou.
import { h } from '../dom.js';
import { ikona } from './ikony.js';
import { RYCHLOST, PAUZA_MEDZI_VETAMI_MS, vyberHlas, slovenskeHlasy, pripravText } from './hlas-logika.js';
import { najdiNahravky, prehraj, zastavNahravku } from './nahravky.js';

const PAUZA_MEDZI_CASTAMI_MS = 110;

// Hlas zariadenia (ak ho zariadenie má)
const recDostupna =
  typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
// Čítanie je dostupné vždy: appka má vlastný zabudovaný hlas
export const citanieDostupne = typeof window !== 'undefined';

let preferovanyHlas = null; // voiceURI zvolené personálom (nastavenie tabletu)
let hlas = null;
let aktivneTlacidlo = null;
let cisloCitania = 0; // pri novom čítaní sa staré zruší
const posluchaci = new Set();

function obnovHlas() {
  hlas = vyberHlas(window.speechSynthesis.getVoices(), preferovanyHlas);
  posluchaci.forEach((f) => f());
}

if (recDostupna) {
  obnovHlas();
  window.speechSynthesis.addEventListener?.('voiceschanged', obnovHlas);
}

// Zoznam slovenských hlasov v zariadení (na výber v nastaveniach)
export function dostupneHlasy() {
  return recDostupna ? slovenskeHlasy(window.speechSynthesis.getVoices()) : [];
}

export function aktualnyHlas() {
  return hlas;
}

export function nastavPreferovanyHlas(voiceURI) {
  preferovanyHlas = voiceURI || null;
  if (recDostupna) obnovHlas();
}

// Upozorní, keď zariadenie dočíta zoznam hlasov (na iPade to chvíľu trvá)
export function priZmeneHlasov(funkcia) {
  posluchaci.add(funkcia);
  return () => posluchaci.delete(funkcia);
}

function nastavTlacidlo(tlacidlo, cita) {
  if (!tlacidlo) return;
  tlacidlo.setAttribute('aria-pressed', String(cita));
  tlacidlo.querySelector('.citanie__text').textContent = cita ? 'Zastaviť čítanie' : tlacidlo.dataset.popis;
  tlacidlo.querySelector('svg').replaceWith(ikona(cita ? 'stop' : 'reproduktor'));
}

export function zastavCitanie() {
  if (!citanieDostupne) return;
  cisloCitania++;
  if (recDostupna) window.speechSynthesis.cancel();
  zastavNahravku();
  nastavTlacidlo(aktivneTlacidlo, false);
  aktivneTlacidlo = null;
}

/**
 * Prečíta text. Voliteľne konkrétnym hlasom (napr. pri „Vyskúšať“ v nastaveniach).
 */
export function citaj(text, tlacidlo = null, { hlas: inyHlas = null } = {}) {
  if (!citanieDostupne) return;
  const vety = pripravText(text);
  if (!vety.length) return;
  zastavCitanie();
  const toto = cisloCitania;
  aktivneTlacidlo = tlacidlo;
  nastavTlacidlo(tlacidlo, true);

  const koniec = () => {
    if (aktivneTlacidlo === tlacidlo && toto === cisloCitania) {
      nastavTlacidlo(tlacidlo, false);
      aktivneTlacidlo = null;
    }
  };

  const pouzityHlas = inyHlas || hlas;
  // Zabudovaný hlas sa použije, ak personál nezvolil konkrétny hlas zariadenia
  const zabudovany = !inyHlas && !preferovanyHlas;
  let i = 0;
  const dalsia = () => {
    if (toto !== cisloCitania) return; // medzitým sa začalo iné čítanie alebo sa zastavilo
    if (i >= vety.length) return koniec();
    const text = vety[i++];
    const nahravky = zabudovany ? najdiNahravky(text) : null;
    if (nahravky) {
      // Nahraná veta (alebo zoznam poskladaný z nahraných slov)
      let j = 0;
      const dalsiaCast = () => {
        if (toto !== cisloCitania) return;
        if (j >= nahravky.length) return setTimeout(dalsia, PAUZA_MEDZI_VETAMI_MS);
        prehraj(nahravky[j++], () => setTimeout(dalsiaCast, PAUZA_MEDZI_CASTAMI_MS), koniec);
      };
      return dalsiaCast();
    }
    if (!recDostupna) return dalsia(); // zariadenie nevie čítať – vetu preskočíme
    const veta = new SpeechSynthesisUtterance(text);
    veta.lang = 'sk-SK';
    veta.rate = RYCHLOST;
    veta.pitch = 1;
    if (pouzityHlas) veta.voice = pouzityHlas;
    veta.onend = () => setTimeout(dalsia, PAUZA_MEDZI_VETAMI_MS);
    veta.onerror = koniec;
    window.speechSynthesis.speak(veta);
  };
  dalsia();
}

/**
 * Tlačidlo „Čítať nahlas“. Text môže byť aj funkcia (zistí sa až pri ťuknutí).
 */
export function tlacidloCitania(text, { popis = 'Čítať nahlas', male = true } = {}) {
  if (!citanieDostupne) return null;
  const tlacidlo = h(
    'button',
    {
      type: 'button',
      class: `tlacidlo tlacidlo--jemne ${male ? 'tlacidlo--male' : ''} citanie`,
      'aria-pressed': 'false',
      'data-popis': popis,
    },
    ikona('reproduktor'),
    h('span', { class: 'citanie__text' }, popis)
  );
  tlacidlo.addEventListener('click', () => {
    if (aktivneTlacidlo === tlacidlo) zastavCitanie();
    else citaj(typeof text === 'function' ? text() : text, tlacidlo);
  });
  return tlacidlo;
}
