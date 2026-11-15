// Prihlásenie personálu (6-miestny PIN).
import { h } from '../dom.js';
import { hlavicka, nadpis, tlacidlo } from '../komponenty/spolocne.js';
import { pinpad } from '../komponenty/pinpad.js';
import { VYSVETLIVKY } from '../texty.js';
import { overPersonalPin, PIN_PERSONALU_DLZKA } from '../ulozisko/hraci.js';
import { cakanie, nespravnyPokus, spravnyPokus, textCakania } from '../ulozisko/zamok.js';
import { prihlasPersonal } from '../relacia.js';
import { prejdi } from '../navigacia.js';

export async function prihlaseniePersonalu() {
  const zamok = 'personal';
  const pad = pinpad({
    dlzka: PIN_PERSONALU_DLZKA,
    popis: 'PIN personálu',
    async priZadani(pin, o) {
      const este = await cakanie(zamok);
      if (este) return o.pockaj(este, textCakania(este));
      if (await overPersonalPin(pin)) {
        await spravnyPokus(zamok);
        prihlasPersonal();
        prejdi('personal');
        return;
      }
      const sekundy = await nespravnyPokus(zamok);
      if (sekundy) o.pockaj(sekundy, textCakania(sekundy));
      else {
        o.vycisti();
        o.sprava('PIN nesedí. Skúste to, prosím, znova.');
      }
    },
  });
  // Prestávka platí aj po návrate späť alebo obnovení stránky
  const uzCaka = await cakanie(zamok);
  if (uzCaka) pad.ovladanie.pockaj(uzCaka, textCakania(uzCaka));

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
