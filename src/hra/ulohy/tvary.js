// Orientácia – Otočené tvary: nájsť ten istý tvar, len otočený (nie zrkadlový).
import { h, zSvg } from '../../dom.js';
import { PARAMETRE, otazkaTvaru } from '../logika.js';
import { otazka } from './spolocne.js';

const PISMENA = ['A', 'B', 'C', 'D'];

function svgTvaru(bunky, farba = '#d3a85a') {
  const sirka = Math.max(...bunky.map(([x]) => x)) + 1;
  const vyska = Math.max(...bunky.map(([, y]) => y)) + 1;
  const strana = Math.max(sirka, vyska, 4);
  const posunX = (strana - sirka) / 2;
  const posunY = (strana - vyska) / 2;
  const stvorce = bunky
    .map(
      ([x, y]) =>
        `<rect x="${x + posunX + 0.05}" y="${y + posunY + 0.05}" width=".9" height=".9" rx=".14" fill="${farba}" fill-opacity=".78" stroke="#5a4932" stroke-width=".05"/>`
    )
    .join('');
  return zSvg(`<svg viewBox="-0.2 -0.2 ${strana + 0.4} ${strana + 0.4}" aria-hidden="true" class="tvar">${stvorce}</svg>`);
}

export const ULOHA = {
  nazov: 'Otočené tvary',
  zadanie: 'Ktorý tvar je ten istý ako vzor, len otočený? Pozor, niektoré sú obrátené ako v zrkadle.',
  async spusti(plocha, { uroven }) {
    const p = PARAMETRE.tvary(uroven);
    let spravne = 0;
    for (let kolo = 0; kolo < p.kola; kolo++) {
      const q = otazkaTvaru(p.zlozitost, p.moznosti);
      const spravnyIndex = q.moznosti.findIndex((m) => m.spravna);
      const ok = await otazka(plocha, {
        zadanieText: ULOHA.zadanie,
        obsah: h('div', { class: 'vzor' }, h('span', { class: 'vzor__popis' }, 'Vzor'), svgTvaru(q.vzor, '#8fa75f')),
        moznosti: q.moznosti.map((m, i) => ({
          hodnota: i,
          popis: `tvar ${PISMENA[i]}`,
          obsah: [svgTvaru(m.bunky), h('span', {}, `Tvar ${PISMENA[i]}`)],
        })),
        spravna: spravnyIndex,
        triedaMoznosti: 'volby--tvary',
        vysvetlenie: `Správny je tvar ${PISMENA[spravnyIndex]} – je len otočený. Ostatné sú obrátené ako v zrkadle.`,
      });
      if (ok) spravne++;
    }
    return { spravne, spolu: p.kola };
  },
};
