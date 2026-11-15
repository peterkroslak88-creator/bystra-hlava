// Výber jednej oblasti a úlohy na samostatné hranie.
import { h, zSvg } from '../dom.js';
import { hlavicka, nadpis, tlacidlo } from '../komponenty/spolocne.js';
import { info } from '../komponenty/info.js';
import { rastlinaSvg } from '../dizajn/rastliny.js';
import { OBLASTI, NAZVY_ULOH } from '../hra/oblasti.js';
import { prejdi } from '../navigacia.js';

export async function oblasti() {
  const el = h(
    'div',
    {},
    hlavicka(tlacidlo('Späť do záhrady', { ikonka: 'spat', onClick: () => prejdi('zahrada') })),
    nadpis('Vyberte si, čo si zahráte', { podnadpis: 'Každú oblasť si môžete zahrať aj samostatne.' }),
    h(
      'ul',
      { class: 'oblasti', role: 'list' },
      OBLASTI.map((o) =>
        h(
          'li',
          { class: 'karta oblast-karta', style: `--oblast:${o.farba};--oblast-svetla:${o.svetla}` },
          h('span', { class: 'oblast-karta__rastlina' }, zSvg(rastlinaSvg(o.rastlina))),
          h(
            'div',
            { class: 'stlpec', style: 'gap: 10px' },
            h('div', { class: 'riadok', style: 'gap: 4px' }, h('h2', {}, o.nazov), info(o.nazov, o.vysvetlivka)),
            h('p', { class: 'jemny-text' }, o.popis),
            h(
              'div',
              { class: 'riadok' },
              o.ulohy.map((typ) =>
                tlacidlo(NAZVY_ULOH[typ], {
                  ikonka: 'sipka',
                  class: 'tlacidlo tlacidlo--oblast',
                  onClick: () => prejdi('trening', { ulohy: [{ oblast: o.id, typ }] }),
                })
              )
            )
          )
        )
      )
    )
  );
  return { el };
}
