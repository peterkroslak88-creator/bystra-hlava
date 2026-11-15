// Prvé prihlásenie hráča: výber obťažnosti.
import { h } from '../dom.js';
import { hlavicka, nadpis, tlacidlo } from '../komponenty/spolocne.js';
import { skupinaVolieb, moznostiObtiaznosti } from '../komponenty/volba.js';
import { VYSVETLIVKY } from '../texty.js';
import { upravHraca } from '../ulozisko/hraci.js';
import { relacia, odhlas } from '../relacia.js';
import { prejdi } from '../navigacia.js';

export async function vyberObtiaznosti() {
  const pokracovat = tlacidlo('Pokračovať do záhrady', {
    druh: 'hlavne',
    ikonka: 'sipka',
    disabled: true,
    onClick: async () => {
      await upravHraca(relacia.hracId, { obtiaznost: volba.hodnota() });
      prejdi('zahrada');
    },
  });

  const volba = skupinaVolieb({
    popis: 'Obťažnosť',
    trieda: 'vyber vyber--tri',
    moznosti: moznostiObtiaznosti(),
    priZmene: () => (pokracovat.disabled = false),
  });

  const el = h(
    'div',
    {},
    hlavicka(
      tlacidlo('Odhlásiť', {
        ikonka: 'odhlasit',
        onClick: () => {
          odhlas();
          prejdi('uvod');
        },
      })
    ),
    h(
      'div',
      { class: 'stlpec', style: 'gap: 32px; padding-top: 12px' },
      nadpis('Akú hru si zvolíte?', {
        podnadpis: 'Vyberte jednu možnosť. Neskôr ju môžete kedykoľvek zmeniť v Nastaveniach.',
        vysvetlivka: VYSVETLIVKY.obtiaznost,
      }),
      volba.el,
      h('div', {}, pokracovat)
    )
  );
  return { el };
}
