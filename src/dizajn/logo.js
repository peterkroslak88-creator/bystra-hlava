// Logo Care Orbit – vektorová kresba znaku a nápis písmom Cormorant Garamond.
// Dve verzie: „svetle“ (na tmavý podklad, ako originál) a „tmave“ (na svetlý papier appky).
import { h, zSvg } from '../dom.js';

export const FARBY_LOGA = {
  // Originál: krémová a biela na tmavom podklade
  svetle: { obluk: '#e3cfa9', vnutro: '#8b909b', ciary: '#c9ccd3', bodky: '#ffffff', diamant: '#e3cfa9', care: '#ffffff', orbit: '#e3cfa9' },
  // Pre Bystrú hlavu: tmavý atrament a okrová na krémovom papieri
  tmave: { obluk: '#8a6a2e', vnutro: '#7d806f', ciary: '#5d6152', bodky: '#29301f', diamant: '#8a6a2e', care: '#29301f', orbit: '#75531a' },
};

/**
 * Znak Care Orbit (otvorená kruhová dráha, vnútorný kruh, os s diamantom a dva body).
 * Kresba 120 × 120, stred kruhu je v bode (60, 60), dolný bod leží v medzere dráhy.
 */
export function znakSvg(variant = 'tmave', { popis = false } = {}) {
  const f = FARBY_LOGA[variant];
  const pristupnost = popis ? 'role="img" aria-label="Care Orbit"' : 'aria-hidden="true" focusable="false"';
  return `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" ${pristupnost} class="logo__znak">
  <path d="M27.6 100.6A52 52 0 1 1 92.4 100.6" fill="none" stroke="${f.obluk}" stroke-width="3.2" stroke-linecap="round"/>
  <circle cx="60" cy="60" r="32" fill="none" stroke="${f.vnutro}" stroke-width="1.6"/>
  <path d="M60 36V112M40 60H80" stroke="${f.ciary}" stroke-width="1.4" stroke-linecap="round"/>
  <path d="M60 13L64 28 60 37 56 28Z" fill="${f.diamant}"/>
  <circle cx="60" cy="60" r="3" fill="${f.bodky}"/>
  <circle cx="60" cy="112" r="5.4" fill="${f.bodky}"/>
</svg>`;
}

/**
 * Celé logo: znak + nápis „Care Orbit“.
 * @param {'svetle'|'tmave'} variant
 */
export function logoCareOrbit(variant = 'tmave', trieda = '') {
  const f = FARBY_LOGA[variant];
  return h(
    'span',
    { class: `logo ${trieda}`, role: 'img', 'aria-label': 'Care Orbit' },
    zSvg(znakSvg(variant)),
    h(
      'span',
      { class: 'logo__napis', 'aria-hidden': 'true' },
      h('span', { class: 'logo__care', style: `color:${f.care}` }, 'Care'),
      ' ',
      h('span', { class: 'logo__orbit', style: `color:${f.orbit}` }, 'Orbit')
    )
  );
}
