// Skrytý náhľad záhrady pre personál: prepínanie počtu dní na predvádzanie.
// Nič sa neukladá.
import { h } from '../dom.js';
import { hlavicka, nadpis, tlacidlo, slovoDni } from '../komponenty/spolocne.js';
import { skupinaVolieb } from '../komponenty/volba.js';
import { prejdi } from '../navigacia.js';
import { vytvorScenu } from '../zahrada/scena.js';
import { textZahrady, textPrekvapenia, PLNA_ZAHRADA } from '../zahrada/milniky.js';

const DNI = [0, 1, 5, 7, 10, 14, 15, 21, 30, 45];

export async function nahladZahrady() {
  let dni = 0;
  const obalSceny = h('div', { role: 'img', 'aria-label': 'Náhľad záhrady' });
  const scena = await vytvorScenu(obalSceny, { dni });

  const hlavnyText = h('p', { class: 'uvodny-text', 'aria-live': 'polite' });
  const prekvapenie = h('p', { class: 'zahrada-text__prekvapenie' });
  function obnovTexty() {
    hlavnyText.textContent = `${dni} ${slovoDni(dni)} tréningu. ${textZahrady(dni)}`;
    prekvapenie.textContent = textPrekvapenia(dni);
  }

  function nastav(n, animuj) {
    const predtym = dni;
    dni = n;
    if (n === 1 && predtym === 0) scena.prehrajRast();
    else scena.nastavDni(n, { animuj: animuj && n > predtym });
    obnovTexty();
  }

  const volba = skupinaVolieb({
    popis: 'Počet dní tréningu',
    trieda: 'nahlad-dni',
    vybrana: 0,
    moznosti: DNI.map((d) => ({ hodnota: d, obsah: `${d} ${slovoDni(d)}` })),
    priZmene: (n) => nastav(n, true),
  });

  obnovTexty();

  const el = h(
    'div',
    {},
    hlavicka(tlacidlo('Späť', { ikonka: 'spat', onClick: () => prejdi('personal') })),
    nadpis('Náhľad záhrady', { podnadpis: 'Na predvádzanie hry. Nič sa tu neukladá.' }),
    h('div', { style: 'margin-top: 20px' }, obalSceny),
    h('div', { class: 'zahrada-text', style: 'margin: 20px 0' }, hlavnyText, prekvapenie),
    h(
      'div',
      { class: 'karta stlpec' },
      h('h2', {}, 'Počet dní tréningu'),
      volba.el,
      h(
        'div',
        { class: 'riadok' },
        tlacidlo('Prehrať rast kvetu', {
          ikonka: 'lista',
          onClick: () => {
            dni = 1;
            scena.prehrajRast();
            obnovTexty();
          },
        }),
        tlacidlo('Pridať jeden deň', {
          ikonka: 'plus',
          onClick: () => nastav(Math.min(dni + 1, PLNA_ZAHRADA), true),
        })
      )
    )
  );
  return { el, zrus: () => scena.zrus() };
}
