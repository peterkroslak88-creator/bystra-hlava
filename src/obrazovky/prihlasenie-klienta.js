// Prihlásenie hráča: veľká klávesnica na 4-miestny PIN.
import { h } from '../dom.js';
import { hlavicka, nadpis, tlacidlo, obrazokRastliny } from '../komponenty/spolocne.js';
import { pinpad } from '../komponenty/pinpad.js';
import { VYSVETLIVKY, pozdrav } from '../texty.js';
import { nacitajHraca, overPinHraca } from '../ulozisko/hraci.js';
import { cakanie, nespravnyPokus, spravnyPokus, textCakania } from '../ulozisko/zamok.js';
import { prihlasKlienta } from '../relacia.js';
import { prejdi } from '../navigacia.js';

export async function prihlasenieKlienta({ hracId }) {
  const hrac = await nacitajHraca(hracId);
  if (!hrac) {
    prejdi('uvod');
    return null;
  }

  const zamok = `hrac:${hracId}`;
  const pad = pinpad({
    dlzka: 4,
    popis: 'PIN',
    async priZadani(pin, o) {
      // Počas prestávky sa PIN vôbec neoveruje
      const este = await cakanie(zamok);
      if (este) return o.pockaj(este, textCakania(este));
      if (await overPinHraca(hracId, pin)) {
        await spravnyPokus(zamok);
        o.sprava('Vitajte!', true);
        prihlasKlienta(hracId);
        prejdi(hrac.obtiaznost ? 'zahrada' : 'vyberObtiaznosti');
        return;
      }
      const sekundy = await nespravnyPokus(zamok);
      if (sekundy) o.pockaj(sekundy, textCakania(sekundy));
      else {
        o.vycisti();
        o.sprava('Tento PIN nesedí. Skúste to, prosím, znova.');
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
        obrazokRastliny(hrac.rastlina, 'prihlasenie__rastlina'),
        nadpis(`${pozdrav()}, ${hrac.meno}`, {
          podnadpis: 'Zadajte, prosím, svoj PIN.',
          vysvetlivka: VYSVETLIVKY.pin,
          citatAko: pozdrav(),
        })
      ),
      h('div', { class: 'prihlasenie__klavesnica karta' }, pad.el)
    )
  );
  return { el, zrus: pad.zrus };
}
