// Prihlásenie personálu (6-miestny PIN).
import { h } from '../dom.js';
import { hlavicka, nadpis, tlacidlo } from '../komponenty/spolocne.js';
import { pinpad } from '../komponenty/pinpad.js';
import { VYSVETLIVKY } from '../texty.js';
import { overPersonalPin, PIN_PERSONALU_DLZKA } from '../ulozisko/hraci.js';
import { prihlasPersonal } from '../relacia.js';
import { prejdi } from '../navigacia.js';

export async function prihlaseniePersonalu() {
  let pokusy = 0;
  const pad = pinpad({
    dlzka: PIN_PERSONALU_DLZKA,
    popis: 'PIN personálu',
    async priZadani(pin, o) {
      if (await overPersonalPin(pin)) {
        prihlasPersonal();
        prejdi('personal');
        return;
      }
      pokusy++;
      if (pokusy >= 5) {
        pokusy = 0;
        o.pockaj(60, 'Príliš veľa pokusov. Skúste to znova o minútu.');
      } else {
        o.vycisti();
        o.sprava('PIN nesedí. Skúste to, prosím, znova.');
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
        nadpis('Vstup pre personál', {
          podnadpis: 'Zadajte PIN personálu (6 číslic).',
          vysvetlivka: VYSVETLIVKY.pinPersonalu,
        })
      ),
      h('div', { class: 'prihlasenie__klavesnica karta' }, pad.el)
    )
  );
  return { el, zrus: pad.zrus };
}
