// Nastavenia hráča: obťažnosť jedným ťuknutím a jemný režim.
import { h } from '../dom.js';
import { hlavicka, nadpis, tlacidlo } from '../komponenty/spolocne.js';
import { info } from '../komponenty/info.js';
import { skupinaVolieb, moznostiObtiaznosti } from '../komponenty/volba.js';
import { VYSVETLIVKY } from '../texty.js';
import { OBTIAZNOSTI } from '../hra/obtiaznost.js';
import { nacitajHraca, upravHraca } from '../ulozisko/hraci.js';
import { relacia } from '../relacia.js';
import { prejdi } from '../navigacia.js';

export async function nastavenia() {
  const hrac = await nacitajHraca(relacia.hracId);
  if (!hrac) {
    prejdi('uvod');
    return null;
  }

  const oznam = h('p', { class: 'oznam', role: 'status', 'aria-live': 'polite' });

  const obtiaznost = skupinaVolieb({
    popis: 'Obťažnosť',
    trieda: 'vyber vyber--tri',
    vybrana: hrac.obtiaznost,
    moznosti: moznostiObtiaznosti(),
    async priZmene(hodnota) {
      await upravHraca(hrac.id, { obtiaznost: hodnota });
      oznam.textContent = `Uložené. Obťažnosť: ${OBTIAZNOSTI[hodnota].nazov}.`;
    },
  });

  const jemny = h('input', { type: 'checkbox', id: 'nast-jemny', checked: Boolean(hrac.jemnyRezim) });
  jemny.addEventListener('change', async () => {
    await upravHraca(hrac.id, { jemnyRezim: jemny.checked });
    oznam.textContent = jemny.checked ? 'Uložené. Jemný režim je zapnutý.' : 'Uložené. Jemný režim je vypnutý.';
  });

  const el = h(
    'div',
    {},
    hlavicka(tlacidlo('Späť do záhrady', { ikonka: 'spat', onClick: () => prejdi('zahrada') })),
    nadpis('Nastavenia', { podnadpis: 'Zmena sa uloží hneď po ťuknutí.' }),
    oznam,
    h(
      'div',
      { class: 'stlpec', style: 'margin-top: 12px' },
      h(
        'section',
        { class: 'karta stlpec' },
        h('div', { class: 'riadok', style: 'gap: 4px' }, h('h2', {}, 'Obťažnosť'), info(VYSVETLIVKY.obtiaznost.nazov, VYSVETLIVKY.obtiaznost.text)),
        obtiaznost.el
      ),
      h(
        'section',
        { class: 'karta stlpec' },
        h('div', { class: 'riadok', style: 'gap: 4px' }, h('h2', {}, 'Jemný režim'), info(VYSVETLIVKY.jemnyRezim.nazov, VYSVETLIVKY.jemnyRezim.text)),
        h('label', { class: 'prepinac', for: 'nast-jemny' }, jemny, h('span', {}, 'Viac času a úlohy bez zmeny náročnosti'))
      )
    )
  );
  return { el };
}
