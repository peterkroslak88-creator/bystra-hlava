// Veľká klávesnica na zadanie PIN.
import { h } from '../dom.js';
import { ikona } from './ikony.js';

/**
 * @param {{dlzka?: number, popis?: string, priZadani: (pin: string, ovladanie: object) => void}} moznosti
 * Vracia { el, zrus } – zrus odpojí ovládanie klávesnicou.
 */
export function pinpad({ dlzka = 4, popis = 'PIN', priZadani }) {
  let pin = '';
  let zamknute = false;

  const bodky = Array.from({ length: dlzka }, () => h('span', { class: 'pin__bodka' }));
  const stav = h('p', { class: 'skryte', 'aria-live': 'polite' });
  const sprava = h('p', { class: 'pin__sprava', role: 'status', 'aria-live': 'polite' });

  function obnov() {
    bodky.forEach((b, i) => b.classList.toggle('pin__bodka--plna', i < pin.length));
    stav.textContent = `Zadané ${pin.length} z ${dlzka} číslic`;
  }

  function pridaj(cislica) {
    if (zamknute || pin.length >= dlzka) return;
    pin += cislica;
    sprava.textContent = '';
    obnov();
    if (pin.length === dlzka) {
      zamknute = true;
      // Krátka pauza, aby bolo vidieť poslednú bodku
      setTimeout(() => priZadani(pin, ovladanie), 220);
    }
  }

  function zmaz() {
    if (zamknute || !pin.length) return;
    pin = pin.slice(0, -1);
    obnov();
  }

  const ovladanie = {
    vycisti() {
      pin = '';
      zamknute = false;
      obnov();
    },
    sprava(text, ok = false) {
      sprava.textContent = text;
      sprava.classList.toggle('pin__sprava--ok', ok);
    },
    // Dočasné zamknutie (napr. po viacerých nesprávnych pokusoch)
    pockaj(sekundy, text) {
      zamknute = true;
      pin = '';
      obnov();
      sprava.textContent = text;
      setTimeout(() => {
        zamknute = false;
        sprava.textContent = '';
      }, sekundy * 1000);
    },
  };

  const klavesnica = h('div', { class: 'pin__klavesnica', role: 'group', 'aria-label': `Klávesnica: ${popis}` });
  for (const c of '123456789') {
    klavesnica.append(h('button', { type: 'button', class: 'pin__klaves', onclick: () => pridaj(c) }, c));
  }
  klavesnica.append(
    h('button', { type: 'button', class: 'pin__klaves pin__klaves--text', onclick: zmaz }, ikona('vymazat'), 'Vymazať'),
    h('button', { type: 'button', class: 'pin__klaves', onclick: () => pridaj('0') }, '0'),
    h('span', { 'aria-hidden': 'true' })
  );

  // Ovládanie aj klávesnicou počítača
  function klaves(e) {
    if (e.target instanceof HTMLInputElement) return;
    if (/^\d$/.test(e.key)) pridaj(e.key);
    else if (e.key === 'Backspace') zmaz();
  }
  document.addEventListener('keydown', klaves);

  obnov();
  const el = h('div', { class: 'pin' }, h('div', { class: 'pin__bodky', 'aria-hidden': 'true' }, bodky), stav, klavesnica, sprava);
  return { el, zrus: () => document.removeEventListener('keydown', klaves), ovladanie };
}
