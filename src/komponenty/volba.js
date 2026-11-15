// Skupina volieb (vyberá sa jedna možnosť): obťažnosť, obrázok profilu…
// Ovláda sa ťuknutím aj šípkami na klávesnici.
import { h } from '../dom.js';
import { info } from './info.js';
import { OBTIAZNOSTI, KLUCE_OBTIAZNOSTI } from '../hra/obtiaznost.js';

/**
 * @param {{popis: string, moznosti: Array<{hodnota: any, obsah: any, trieda?: string, doplnok?: Node, obal?: string}>,
 *          vybrana?: any, priZmene?: (hodnota: any) => void, trieda?: string}} nastavenie
 */
export function skupinaVolieb({ popis, moznosti, vybrana = null, priZmene, trieda = 'vyber' }) {
  const skupina = h('div', { class: trieda, role: 'radiogroup', 'aria-label': popis });
  const tlacidla = [];
  let hodnota = vybrana;

  function oznac(nova, { fokus = false, oznamit = true } = {}) {
    hodnota = nova;
    for (const t of tlacidla) {
      const zvolene = t.dataset.hodnota === String(nova);
      t.setAttribute('aria-checked', String(zvolene));
      t.tabIndex = zvolene ? 0 : -1;
      if (zvolene && fokus) t.focus();
    }
    if (!tlacidla.some((t) => t.tabIndex === 0) && tlacidla[0]) tlacidla[0].tabIndex = 0;
    if (oznamit) priZmene?.(nova);
  }

  moznosti.forEach((m, i) => {
    const t = h(
      'button',
      { type: 'button', role: 'radio', class: `moznost ${m.trieda || ''}`, 'data-hodnota': String(m.hodnota) },
      m.obsah
    );
    t.addEventListener('click', () => oznac(m.hodnota));
    t.addEventListener('keydown', (e) => {
      const smer = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (!smer) return;
      e.preventDefault();
      const dalsia = moznosti[(i + smer + moznosti.length) % moznosti.length];
      oznac(dalsia.hodnota, { fokus: true });
    });
    tlacidla.push(t);
    skupina.append(m.doplnok ? h('div', { class: m.obal || '' }, t, m.doplnok) : t);
  });

  oznac(vybrana, { oznamit: false });
  return { el: skupina, hodnota: () => hodnota };
}

// Tri obťažnosti ako karty s popisom a vysvetlivkou „i“
export function moznostiObtiaznosti() {
  return KLUCE_OBTIAZNOSTI.map((kluc) => {
    const o = OBTIAZNOSTI[kluc];
    return {
      hodnota: kluc,
      obal: 'obtiaznost-karta',
      obsah: [
        h(
          'span',
          { class: 'moznost__hlavicka' },
          h('span', { class: 'moznost__nazov' }, o.nazov),
          h('span', { class: 'moznost__znacka' }, 'Zvolené')
        ),
        h('span', { class: 'jemny-text' }, o.popis),
      ],
      doplnok: info(`Obťažnosť ${o.nazov}`, o.vysvetlivka),
    };
  });
}
