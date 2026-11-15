// Záhrada hráča (dočasná podoba – živá záhrada príde vo fáze 3).
import { h } from '../dom.js';
import { hlavicka, nadpis, tlacidlo, krajina, slovoDni } from '../komponenty/spolocne.js';
import { VYSVETLIVKY, pozdrav } from '../texty.js';
import { nacitajHraca, prehladHrania } from '../ulozisko/hraci.js';
import { relacia, odhlas } from '../relacia.js';
import { prejdi } from '../navigacia.js';

export async function zahrada() {
  const hrac = await nacitajHraca(relacia.hracId);
  if (!hrac) {
    prejdi('uvod');
    return null;
  }
  const { pocetDni } = prehladHrania(hrac);
  const textZahrady = pocetDni
    ? `Vaša záhrada rastie už ${pocetDni} ${slovoDni(pocetDni)}.`
    : 'Záhrada je zatiaľ pustá. Po prvom tréningu v nej vyrastie prvý kvet.';

  const oznam = h('p', { class: 'oznam', role: 'status', 'aria-live': 'polite' });

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
    h('div', { class: 'krajina-ramik' }, krajina(pocetDni ? 'zahrada.webp' : 'pust.webp')),
    h(
      'div',
      { class: 'obrazovka-stred' },
      nadpis(`${pozdrav()}, ${hrac.meno}`, { podnadpis: textZahrady, vysvetlivka: VYSVETLIVKY.zahrada }),
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
  return { el };
}
