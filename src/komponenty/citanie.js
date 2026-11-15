// Čítanie nahlas slovenským hlasom (Web Speech API), rýchlosť 0,9.
import { h } from '../dom.js';
import { ikona } from './ikony.js';

export const citanieDostupne =
  typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;

let slovenskyHlas = null;
let aktivneTlacidlo = null;

function najdiHlas() {
  const hlasy = window.speechSynthesis.getVoices();
  slovenskyHlas = hlasy.find((v) => v.lang?.toLowerCase().replace('_', '-').startsWith('sk')) || null;
}

if (citanieDostupne) {
  najdiHlas();
  window.speechSynthesis.addEventListener?.('voiceschanged', najdiHlas);
}

function nastavTlacidlo(tlacidlo, cita) {
  if (!tlacidlo) return;
  tlacidlo.setAttribute('aria-pressed', String(cita));
  tlacidlo.querySelector('.citanie__text').textContent = cita ? 'Zastaviť čítanie' : tlacidlo.dataset.popis;
  tlacidlo.querySelector('svg').replaceWith(ikona(cita ? 'stop' : 'reproduktor'));
}

export function zastavCitanie() {
  if (!citanieDostupne) return;
  window.speechSynthesis.cancel();
  nastavTlacidlo(aktivneTlacidlo, false);
  aktivneTlacidlo = null;
}

export function citaj(text, tlacidlo = null) {
  if (!citanieDostupne || !text) return;
  zastavCitanie();
  const veta = new SpeechSynthesisUtterance(text);
  veta.lang = 'sk-SK';
  veta.rate = 0.9;
  if (slovenskyHlas) veta.voice = slovenskyHlas;
  aktivneTlacidlo = tlacidlo;
  nastavTlacidlo(tlacidlo, true);
  const koniec = () => {
    if (aktivneTlacidlo === tlacidlo) {
      nastavTlacidlo(tlacidlo, false);
      aktivneTlacidlo = null;
    }
  };
  veta.onend = koniec;
  veta.onerror = koniec;
  window.speechSynthesis.speak(veta);
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
