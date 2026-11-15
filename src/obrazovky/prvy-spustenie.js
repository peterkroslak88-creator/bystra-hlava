// Prvé spustenie: personál si nastaví svoj PIN (zadá ho dvakrát).
import { h } from '../dom.js';
import { hlavicka, nadpis } from '../komponenty/spolocne.js';
import { pinpad } from '../komponenty/pinpad.js';
import { VYSVETLIVKY } from '../texty.js';
import { nastavPersonalPin, PIN_PERSONALU_DLZKA } from '../ulozisko/hraci.js';
import { prihlasPersonal } from '../relacia.js';
import { prejdi } from '../navigacia.js';

export async function prvySpustenie() {
  let prvyPin = null;
  const krok = h('p', { class: 'uvodny-text', 'aria-live': 'polite' }, 'Zadajte nový PIN personálu (6 číslic).');

  const pad = pinpad({
    dlzka: PIN_PERSONALU_DLZKA,
    popis: 'PIN personálu',
    async priZadani(pin, o) {
      if (!prvyPin) {
        prvyPin = pin;
        o.vycisti();
        krok.textContent = 'Výborne. Teraz ten istý PIN zadajte ešte raz.';
        return;
      }
      if (pin !== prvyPin) {
        prvyPin = null;
        o.vycisti();
        krok.textContent = 'Zadajte nový PIN personálu (6 číslic).';
        o.sprava('PIN sa nezhodoval. Začnime, prosím, znova.');
        return;
      }
      await nastavPersonalPin(pin);
      prihlasPersonal();
      o.sprava('PIN je nastavený.', true);
      prejdi('personal', { sprava: 'Vitajte. Teraz môžete pridať prvého hráča.' });
    },
  });

  const el = h(
    'div',
    {},
    hlavicka(),
    h(
      'div',
      { class: 'prihlasenie' },
      h(
        'div',
        { class: 'prihlasenie__text' },
        nadpis('Vitajte v Bystrej hlave', {
          podnadpis: 'Na začiatok si personál nastaví svoj PIN. Bude ho potrebovať na správu hráčov.',
          vysvetlivka: VYSVETLIVKY.pinPersonalu,
        }),
        krok
      ),
      h('div', { class: 'prihlasenie__klavesnica karta' }, pad.el)
    )
  );
  return { el, zrus: pad.zrus };
}
