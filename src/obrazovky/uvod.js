// Úvodná obrazovka: hráči ťuknú na svoj obrázok s menom.
import { h } from '../dom.js';
import { hlavicka, nadpis, krajina, tlacidlo, obrazokRastliny } from '../komponenty/spolocne.js';
import { pozdrav } from '../texty.js';
import { zoznamHracov } from '../ulozisko/hraci.js';
import { odhlas } from '../relacia.js';
import { prejdi } from '../navigacia.js';

export async function uvod({ sprava = '' } = {}) {
  odhlas();
  const hraci = await zoznamHracov();

  const obsah = hraci.length
    ? h(
        'ul',
        { class: 'hraci-mriezka', role: 'list', 'aria-label': 'Hráči' },
        hraci.map((hrac) =>
          h(
            'li',
            {},
            h(
              'button',
              {
                type: 'button',
                class: 'karta hrac-karta',
                onclick: () => prejdi('prihlasenieKlienta', { hracId: hrac.id }),
              },
              obrazokRastliny(hrac.rastlina, 'hrac-karta__obrazok'),
              h('span', { class: 'hrac-karta__meno' }, hrac.meno)
            )
          )
        )
      )
    : h(
        'div',
        { class: 'karta prazdne' },
        h('h2', {}, 'Zatiaľ tu nie sú žiadni hráči'),
        h('p', { class: 'jemny-text' }, 'Hráčov pridáva personál cez tlačidlo Personál hore.')
      );

  const el = h(
    'div',
    {},
    hlavicka(tlacidlo('Personál', { ikonka: 'kluc', onClick: () => prejdi('prihlaseniePersonalu') })),
    krajina(),
    h(
      'div',
      { class: 'uvod__obsah' },
      nadpis(pozdrav(), {
        podnadpis: hraci.length ? 'Ťuknite na svoj obrázok s menom.' : '',
      }),
      sprava ? h('p', { class: 'karta oznam', role: 'status' }, sprava) : null,
      obsah
    )
  );
  return { el };
}
