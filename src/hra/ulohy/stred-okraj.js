// Bystré oko – Stred a okraj: nakrátko sa ukáže obrázok v strede a hviezda na okraji.
import { h, zSvg } from '../../dom.js';
import { ID_RASTLIN, rastlinaSvg, nazovRastliny } from '../../dizajn/rastliny.js';
import { PARAMETRE, NASOBOK_JEMNY, vyber, zamiesaj } from '../logika.js';
import { zadanie, otazka, cakaj } from './spolocne.js';

const POZICIE = [
  { id: 'hore', x: 50, y: 10, nazov: 'hore' },
  { id: 'vpravo-hore', x: 91, y: 12, nazov: 'vpravo hore' },
  { id: 'vpravo', x: 91, y: 50, nazov: 'vpravo' },
  { id: 'vpravo-dole', x: 91, y: 88, nazov: 'vpravo dole' },
  { id: 'dole', x: 50, y: 90, nazov: 'dole' },
  { id: 'vlavo-dole', x: 9, y: 88, nazov: 'vľavo dole' },
  { id: 'vlavo', x: 9, y: 50, nazov: 'vľavo' },
  { id: 'vlavo-hore', x: 9, y: 12, nazov: 'vľavo hore' },
];
const STYRI = ['hore', 'vpravo', 'dole', 'vlavo'];

const HVIEZDA = `<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 3l4.9 10.6 11.6 1.3-8.6 7.9 2.4 11.4L20 28.4 9.7 34.2l2.4-11.4-8.6-7.9 11.6-1.3z" fill="#d9a441" stroke="#75531a" stroke-width="1.4" stroke-linejoin="round"/></svg>`;

function obrazokRastliny(id) {
  return h('span', { class: 'volba__obrazok' }, zSvg(rastlinaSvg(id)));
}

export const ULOHA = {
  nazov: 'Stred a okraj',
  zadanie: 'Pozerajte do stredu rámika. Na chvíľu sa ukáže obrázok a niekde na okraji hviezda. Zapamätajte si oboje.',
  async spusti(plocha, { uroven, jemny }) {
    const p = PARAMETRE.stredOkraj(uroven);
    const pozicie = p.pozicie === 4 ? POZICIE.filter((x) => STYRI.includes(x.id)) : POZICIE;
    let spravne = 0;
    let spolu = 0;

    for (let kolo = 0; kolo < p.kola; kolo++) {
      const rastliny = vyber(ID_RASTLIN, p.moznosti);
      const stredna = rastliny[0];
      const pozicia = pozicie[Math.floor(Math.random() * pozicie.length)];

      // 1. Príprava a krátke ukázanie
      const ramik = h('div', { class: 'ramik', 'aria-label': 'Rámik s obrázkom' });
      const ukaz = h('button', { type: 'button', class: 'tlacidlo tlacidlo--zakladne tlacidlo--hlavne' }, 'Ukázať obrázok');
      plocha.replaceChildren(
        zadanie(`${ULOHA.zadanie} Kolo ${kolo + 1} zo ${p.kola}.`),
        ramik,
        h('div', { class: 'riadok riadok--stred' }, ukaz)
      );
      await new Promise((hotovo) => ukaz.addEventListener('click', hotovo, { once: true }));
      ukaz.remove();
      await cakaj(500);
      ramik.append(
        h('span', { class: 'ramik__stred' }, zSvg(rastlinaSvg(stredna))),
        h('span', { class: 'ramik__hviezda', style: `left:${pozicia.x}%;top:${pozicia.y}%`, html: HVIEZDA })
      );
      ramik.classList.add('ramik--ukazany');
      await cakaj(p.zobrazenieMs * (jemny ? NASOBOK_JEMNY : 1));
      ramik.classList.remove('ramik--ukazany');
      await cakaj(250);
      ramik.replaceChildren();

      // 2. Ktorý obrázok bol v strede?
      spolu++;
      if (
        await otazka(plocha, {
          zadanieText: 'Ktorý obrázok bol v strede?',
          moznosti: zamiesaj(rastliny).map((id) => ({
            hodnota: id,
            popis: nazovRastliny(id),
            obsah: [obrazokRastliny(id), h('span', {}, nazovRastliny(id))],
          })),
          spravna: stredna,
          triedaMoznosti: 'volby--obrazky',
          vysvetlenie: `V strede bol obrázok: ${nazovRastliny(stredna)}.`,
        })
      )
        spravne++;

      // 3. Kde bola hviezda?
      spolu++;
      if (
        await otazka(plocha, {
          zadanieText: 'Kde na okraji bola hviezda?',
          moznosti: pozicie.map((poz) => ({ hodnota: poz.id, popis: poz.nazov, obsah: poz.nazov })),
          spravna: pozicia.id,
          vysvetlenie: `Hviezda bola ${pozicia.nazov}.`,
          rozlozMoznosti: (tlacidla) =>
            h(
              'div',
              { class: 'ramik ramik--volby' },
              tlacidla.map((t, i) => {
                t.classList.add('ramik__volba');
                t.style.left = `${pozicie[i].x}%`;
                t.style.top = `${pozicie[i].y}%`;
                return t;
              })
            ),
        })
      )
        spravne++;
    }
    return { spravne, spolu };
  },
};
