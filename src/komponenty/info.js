// Vysvetlivka „i“: malé tlačidlo, ktoré rozbalí krátky text.
// Na počítači sa otvorí pri prejdení myšou, na tablete ťuknutím.
// Zatvorí sa ťuknutím mimo, krížikom alebo klávesom Escape.
import { h } from '../dom.js';
import { ikona } from './ikony.js';
import { tlacidloCitania, zastavCitanie } from './citanie.js';

let pocitadlo = 0;
let otvorena = null; // { obal, tlacidlo, bublina }

const maMys = window.matchMedia('(hover: hover) and (pointer: fine)');

export function zatvorVysvetlivky({ vratitFokus = false } = {}) {
  if (!otvorena) return;
  const { obal, tlacidlo, bublina } = otvorena;
  bublina.hidden = true;
  tlacidlo.setAttribute('aria-expanded', 'false');
  obal.classList.remove('info--otvorena');
  if (bublina.contains(document.activeElement) || vratitFokus) tlacidlo.focus();
  if (bublina.querySelector('[aria-pressed="true"]')) zastavCitanie();
  otvorena = null;
}

function otvor(polozka) {
  if (otvorena && otvorena !== polozka) zatvorVysvetlivky();
  const { obal, tlacidlo, bublina } = polozka;
  bublina.hidden = false;
  tlacidlo.setAttribute('aria-expanded', 'true');
  obal.classList.add('info--otvorena');
  otvorena = polozka;
  umiestni(bublina);
}

// Bublina sa nesmie dostať mimo obrazovku
function umiestni(bublina) {
  bublina.style.left = '0px';
  bublina.style.top = '';
  bublina.style.bottom = '';
  const okraj = 16;
  const r = bublina.getBoundingClientRect();
  let posun = 0;
  if (r.right > window.innerWidth - okraj) posun = window.innerWidth - okraj - r.right;
  if (r.left + posun < okraj) posun = okraj - r.left;
  bublina.style.left = `${posun}px`;
  if (r.bottom > window.innerHeight - okraj && r.top - r.height > okraj + 60) {
    bublina.style.top = 'auto';
    bublina.style.bottom = 'calc(100% + 6px)';
  }
}

document.addEventListener('pointerdown', (e) => {
  if (otvorena && !otvorena.obal.contains(e.target)) zatvorVysvetlivky();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && otvorena) zatvorVysvetlivky({ vratitFokus: true });
});

/**
 * @param {string} nazov  krátky názov (napr. „Jemný režim“)
 * @param {string} text   1–3 vety vysvetlenia
 */
export function info(nazov, text) {
  const id = `vysvetlivka-${++pocitadlo}`;
  const obal = h('span', { class: 'info' });
  const tlacidlo = h(
    'button',
    {
      type: 'button',
      class: 'info__tlacidlo',
      'aria-expanded': 'false',
      'aria-controls': id,
      'aria-label': `Vysvetlivka: ${nazov}`,
    },
    h('span', { class: 'info__znak', 'aria-hidden': 'true' }, 'i')
  );
  const zavriet = h(
    'button',
    { type: 'button', class: 'tlacidlo tlacidlo--jemne tlacidlo--male' },
    ikona('kriz'),
    'Zavrieť'
  );
  const bublina = h(
    'div',
    { id, class: 'bublina', role: 'region', 'aria-label': nazov, hidden: true },
    h('p', { class: 'bublina__nazov' }, nazov),
    h('p', {}, text),
    h('div', { class: 'bublina__akcie' }, tlacidloCitania(`${nazov}. ${text}`), zavriet)
  );
  obal.append(tlacidlo, bublina);

  const polozka = { obal, tlacidlo, bublina };

  tlacidlo.addEventListener('click', () => {
    if (otvorena === polozka && !polozka.otvoreneMysou) zatvorVysvetlivky();
    else otvor(polozka);
    polozka.otvoreneMysou = false;
  });
  zavriet.addEventListener('click', () => zatvorVysvetlivky({ vratitFokus: true }));

  // Prejdenie myšou (len na zariadeniach s myšou)
  let casovac;
  obal.addEventListener('pointerenter', (e) => {
    if (!maMys.matches || e.pointerType !== 'mouse') return;
    clearTimeout(casovac);
    if (otvorena !== polozka) {
      polozka.otvoreneMysou = true;
      otvor(polozka);
    }
  });
  obal.addEventListener('pointerleave', (e) => {
    if (!maMys.matches || e.pointerType !== 'mouse') return;
    casovac = setTimeout(() => {
      if (otvorena === polozka && polozka.otvoreneMysou && !bublina.contains(document.activeElement)) {
        zatvorVysvetlivky();
      }
    }, 350);
  });

  return obal;
}
