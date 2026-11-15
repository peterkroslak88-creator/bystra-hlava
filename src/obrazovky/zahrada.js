// Záhrada hráča: z púšte do raja. 1 deň tréningu = 1 krok.
import { h } from '../dom.js';
import { hlavicka, nadpis, tlacidlo } from '../komponenty/spolocne.js';
import { VYSVETLIVKY, pozdrav } from '../texty.js';
import { nacitajHraca, prehladHrania } from '../ulozisko/hraci.js';
import { relacia, odhlas } from '../relacia.js';
import { prejdi } from '../navigacia.js';
import { vytvorScenu } from '../zahrada/scena.js';
import { textZahrady, textPrekvapenia } from '../zahrada/milniky.js';

/**
 * @param {{rast?: boolean}} data  rast = práve pribudol prvý deň (prehrá sa rast kvetu)
 */
export async function zahrada({ rast = false } = {}) {
  const hrac = await nacitajHraca(relacia.hracId);
  if (!hrac) {
    prejdi('uvod');
    return null;
  }
  const { pocetDni } = prehladHrania(hrac);
  const oznam = h('p', { class: 'oznam', role: 'status', 'aria-live': 'polite' });

  const obalSceny = h('div', { role: 'img', 'aria-label': `Záhrada. ${textZahrady(pocetDni)}` });
  const scena = await vytvorScenu(obalSceny, { dni: rast ? 0 : pocetDni });
  if (rast) setTimeout(() => scena.prehrajRast(), 900);

  const el = h(
    'div',
    {},
    hlavicka(
      tlacidlo('Nastavenia', { ikonka: 'nastavenia', onClick: () => prejdi('nastavenia') }),
      tlacidlo('Odhlásiť', {
        ikonka: 'odhlasit',
        onClick: () => {
          odhlas();
          prejdi('uvod');
        },
      })
    ),
    obalSceny,
    h(
      'div',
      { class: 'obrazovka-stred', style: 'padding-top: 24px' },
      h(
        'div',
        { class: 'zahrada-text' },
        nadpis(`${pozdrav()}, ${hrac.meno}`, {
          podnadpis: `${textZahrady(pocetDni)} ${textPrekvapenia(pocetDni)}`,
          vysvetlivka: VYSVETLIVKY.zahrada,
        })
      ),
      tlacidlo('Začať dnešný tréning', {
        druh: 'hlavne',
        ikonka: 'lista',
        onClick: () => {
          oznam.textContent = 'Úlohy pribudnú v ďalšej fáze stavby appky.';
        },
      }),
      oznam
    )
  );
  return { el, zrus: () => scena.zrus() };
}
