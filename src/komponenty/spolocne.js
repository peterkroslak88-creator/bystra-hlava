// Spoločné stavebné kamene obrazoviek.
import { h, zSvg } from '../dom.js';
import { ikona } from './ikony.js';
import { tlacidloCitania } from './citanie.js';
import { info } from './info.js';
import { rastlinaSvg } from '../dizajn/rastliny.js';

export function tlacidlo(text, { druh = '', ikonka = null, onClick, typ = 'button', ...ine } = {}) {
  const triedy = ['tlacidlo'];
  if (druh.includes('zakladne')) triedy.push('tlacidlo--zakladne');
  if (druh.includes('hlavne')) triedy.push('tlacidlo--zakladne', 'tlacidlo--hlavne', 'lesk');
  if (druh.includes('jemne')) triedy.push('tlacidlo--jemne');
  if (druh.includes('nebezpecne')) triedy.push('tlacidlo--nebezpecne');
  if (druh.includes('male')) triedy.push('tlacidlo--male');
  if (druh.includes('sirka')) triedy.push('tlacidlo--cela-sirka');
  return h('button', { type: typ, class: triedy.join(' '), onclick: onClick, ...ine }, ikonka ? ikona(ikonka) : null, text);
}

// Hlavička so značkou appky a tlačidlami vpravo
export function hlavicka(...akcie) {
  return h(
    'header',
    { class: 'hlavicka' },
    h('div', { class: 'znacka' }, zSvg(rastlinaSvg('levandula')), 'Bystrá hlava'),
    h('div', { class: 'hlavicka__akcie' }, akcie)
  );
}

/**
 * Nadpis s tlačidlom „Čítať nahlas“ a prípadnou vysvetlivkou.
 * @param {{uroven?: string, podnadpis?: string, vysvetlivka?: {nazov: string, text: string}}} moznosti
 */
export function nadpis(text, { uroven = 'h1', podnadpis = '', vysvetlivka = null, citat = true } = {}) {
  const citany = [text, podnadpis].filter(Boolean).join('. ');
  return h(
    'div',
    { class: 'nadpis-s-citanim' },
    h(uroven, {}, text),
    podnadpis ? h('p', { class: 'uvodny-text z-rozmazania' }, podnadpis) : null,
    citat || vysvetlivka
      ? h(
          'div',
          { class: 'nadpis-s-citanim__riadok' },
          citat ? tlacidloCitania(citany) : null,
          vysvetlivka ? info(vysvetlivka.nazov, vysvetlivka.text) : null
        )
      : null
  );
}

// Maľovaná krajina v hornej časti obrazovky
export function krajina(obrazok = 'zahrada.webp') {
  return h(
    'div',
    { class: 'krajina', 'aria-hidden': 'true' },
    h('img', { src: `./obrazky/${obrazok}`, alt: '', decoding: 'async' })
  );
}

export function obrazokRastliny(id, trieda) {
  const obal = h('span', { class: trieda });
  obal.append(zSvg(rastlinaSvg(id)));
  return obal;
}

// Formát dátumu pre personál: „dnes“, „včera“, inak „12. 11. 2026“
export function citatelnyDatum(den) {
  if (!den) return 'zatiaľ nehral';
  const [r, m, d] = den.split('-').map(Number);
  const datum = new Date(r, m - 1, d);
  const dnes = new Date();
  dnes.setHours(0, 0, 0, 0);
  const rozdiel = Math.round((dnes - datum) / 86400000);
  if (rozdiel === 0) return 'dnes';
  if (rozdiel === 1) return 'včera';
  return `${d}. ${m}. ${r}`;
}

export function slovoDni(n) {
  if (n === 1) return 'deň';
  if (n >= 2 && n <= 4) return 'dni';
  return 'dní';
}
