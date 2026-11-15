// Slová – Poskladaj slovo z rozhádzaných písmen.
import { h } from '../../dom.js';
import { ikona } from '../../komponenty/ikony.js';
import { PARAMETRE, slovaPreUroven, rozhadzPismena, vyber } from '../logika.js';
import { zadanie, odozva } from './spolocne.js';

const velke = (t) => t.toLocaleUpperCase('sk');

export const ULOHA = {
  nazov: 'Poskladaj slovo',
  zadanie: 'Ťukajte na písmená v správnom poradí a poskladajte slovo.',
  async spusti(plocha, { uroven }) {
    const p = PARAMETRE.slovo(uroven);
    const slova = vyber(slovaPreUroven(uroven), p.kola);
    let spravne = 0;
    for (const { slovo, napoveda } of slova) {
      if (await jednoSlovo(plocha, slovo, napoveda, p.prvePismeno)) spravne++;
    }
    return { spravne, spolu: slova.length };
  },
};

function jednoSlovo(plocha, slovo, napoveda, prvePismeno) {
  return new Promise((hotovo) => {
    const pismena = rozhadzPismena(slovo);
    const dlzka = pismena.length;
    let poskladane = []; // indexy použitých písmen

    const sloty = Array.from({ length: dlzka }, () => h('span', { class: 'slovo__slot' }));
    const stav = h('p', { class: 'skryte', 'aria-live': 'polite' });
    const tlacidla = pismena.map((pismeno, i) => {
      const t = h('button', { type: 'button', class: 'slovo__pismeno', 'aria-label': `Písmeno ${velke(pismeno)}` }, velke(pismeno));
      t.addEventListener('click', () => pridaj(i));
      return t;
    });
    const spat = h('button', { type: 'button', class: 'tlacidlo tlacidlo--male' }, ikona('vymazat'), 'Vymazať posledné');
    const znova = h('button', { type: 'button', class: 'tlacidlo tlacidlo--male tlacidlo--jemne' }, 'Začať znova');
    spat.addEventListener('click', () => {
      poskladane.pop();
      obnov();
    });
    znova.addEventListener('click', () => {
      poskladane = [];
      obnov();
    });

    function obnov() {
      const text = poskladane.map((i) => pismena[i]).join('');
      sloty.forEach((s, i) => (s.textContent = i < text.length ? velke(text[i]) : ''));
      tlacidla.forEach((t, i) => (t.disabled = poskladane.includes(i)));
      stav.textContent = text ? `Zatiaľ poskladané: ${velke(text)}` : '';
    }

    async function pridaj(i) {
      if (poskladane.includes(i) || poskladane.length >= dlzka) return;
      poskladane.push(i);
      obnov();
      if (poskladane.length < dlzka) return;
      const text = poskladane.map((j) => pismena[j]).join('');
      const ok = text === slovo;
      tlacidla.forEach((t) => (t.disabled = true));
      spat.disabled = znova.disabled = true;
      // Pri chybe sa ukáže správne slovo
      if (!ok) [...slovo].forEach((c, j) => (sloty[j].textContent = velke(c)));
      sloty.forEach((s) => s.classList.add(ok ? 'slovo__slot--spravne' : 'slovo__slot--ukazane'));
      await odozva(plocha, { spravne: ok, vysvetlenie: `Hľadané slovo: ${velke(slovo)}.` });
      hotovo(ok);
    }

    const textNapovedy = `Nápoveda: ${napoveda}.${prvePismeno ? ` Slovo začína na ${velke(slovo[0])}.` : ''}`;
    plocha.replaceChildren(
      zadanie(ULOHA.zadanie, `${ULOHA.zadanie} ${textNapovedy}`),
      h('p', { class: 'napoveda' }, textNapovedy),
      h('div', { class: 'slovo__sloty', 'aria-hidden': 'true' }, sloty),
      stav,
      h('div', { class: 'slovo__pismena' }, tlacidla),
      h('div', { class: 'riadok riadok--stred' }, spat, znova)
    );
    obnov();
  });
}
