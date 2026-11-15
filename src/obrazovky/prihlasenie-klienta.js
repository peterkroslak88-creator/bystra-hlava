// Prihlásenie hráča: veľká klávesnica na 4-miestny PIN.
import { h } from '../dom.js';
import { hlavicka, nadpis, tlacidlo, obrazokRastliny } from '../komponenty/spolocne.js';
import { pinpad } from '../komponenty/pinpad.js';
import { VYSVETLIVKY, pozdrav } from '../texty.js';
import { nacitajHraca, overPinHraca } from '../ulozisko/hraci.js';
import { prihlasKlienta } from '../relacia.js';
import { prejdi } from '../navigacia.js';

const MAX_POKUSOV = 5;

export async function prihlasenieKlienta({ hracId }) {
  const hrac = await nacitajHraca(hracId);
  if (!hrac) {
    prejdi('uvod');
    return null;
  }

  let pokusy = 0;
  const pad = pinpad({
    dlzka: 4,
    popis: 'PIN',
    async priZadani(pin, o) {
      if (await overPinHraca(hracId, pin)) {
        o.sprava('Vitajte!', true);
        prihlasKlienta(hracId);
        prejdi(hrac.obtiaznost ? 'zahrada' : 'vyberObtiaznosti');
        return;
      }
      pokusy++;
      if (pokusy >= MAX_POKUSOV) {
        pokusy = 0;
        o.pockaj(30, 'Chvíľu si oddýchnime. Skúste to znova o pol minúty.');
      } else {
        o.vycisti();
        o.sprava('Tento PIN nesedí. Skúste to, prosím, znova.');
      }
    },
  });

  const el = h(
    'div',
    {},
    hlavicka(tlacidlo('Späť', { ikonka: 'spat', onClick: () => prejdi('uvod') })),
    h(
      'div',
      { class: 'prihlasenie' },
      h(
        'div',
        { class: 'prihlasenie__text' },
        obrazokRastliny(hrac.rastlina, 'prihlasenie__rastlina'),
        nadpis(`${pozdrav()}, ${hrac.meno}`, {
          podnadpis: 'Zadajte, prosím, svoj PIN.',
          vysvetlivka: VYSVETLIVKY.pin,
        })
      ),
      h('div', { class: 'prihlasenie__klavesnica karta' }, pad.el)
    )
  );
  return { el, zrus: pad.zrus };
}
