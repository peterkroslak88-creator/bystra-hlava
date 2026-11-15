// Záhrada hráča: z púšte do raja. 1 deň tréningu = 1 krok.
import { h } from '../dom.js';
import { hlavicka, nadpis, tlacidlo } from '../komponenty/spolocne.js';
import { VYSVETLIVKY, pozdrav } from '../texty.js';
import { nacitajHraca, prehladHrania, dnesnyDen } from '../ulozisko/hraci.js';
import { relacia, odhlas } from '../relacia.js';
import { prejdi } from '../navigacia.js';
import { vytvorScenu } from '../zahrada/scena.js';
import { textZahrady, textPrekvapenia } from '../zahrada/milniky.js';

/**
 * @param {{rastOd?: number|null}} data  rastOd = počet dní pred tréningom;
 *   ak pribudol deň, záhrada sa pred očami rozrastie (pri prvom dni vyrastie kvet).
 *   Nič z toho sa neukladá – animácia sa prehrá len pri návrate z tréningu.
 */
export async function zahrada({ rastOd = null } = {}) {
  const hrac = await nacitajHraca(relacia.hracId);
  if (!hrac) {
    prejdi('uvod');
    return null;
  }
  const { pocetDni } = prehladHrania(hrac);
  const pribudlo = rastOd != null && pocetDni > rastOd;
  const hralDnes = hrac.dniHrania.includes(dnesnyDen());

  const obalSceny = h('div', { role: 'img', 'aria-label': `Záhrada. ${textZahrady(pocetDni)}` });
  const scena = await vytvorScenu(obalSceny, { dni: pribudlo ? rastOd : pocetDni });
  if (pribudlo) {
    setTimeout(() => {
      if (rastOd === 0) scena.prehrajRast();
      else scena.nastavDni(pocetDni, { animuj: true });
    }, 900);
  }

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
        nadpis(pribudlo ? `Ďakujeme, ${hrac.meno}` : `${pozdrav()}, ${hrac.meno}`, {
          podnadpis: `${pribudlo && rastOd > 0 ? 'V záhrade dnes pribudol ďalší kúsok. ' : ''}${textZahrady(pocetDni)} ${textPrekvapenia(pocetDni)}`,
          vysvetlivka: VYSVETLIVKY.zahrada,
        })
      ),
      h(
        'div',
        { class: 'riadok riadok--stred' },
        tlacidlo(hralDnes ? 'Zahrať si tréning znova' : 'Začať dnešný tréning', {
          druh: 'hlavne',
          ikonka: 'lista',
          onClick: () => prejdi('trening'),
        }),
        tlacidlo('Zahrať si jednu oblasť', { ikonka: 'sipka', onClick: () => prejdi('oblasti') })
      ),
      hralDnes ? h('p', { class: 'jemny-text' }, 'Dnes ste už trénovali. Záhrada rastie raz za deň, hrať sa však môžete koľkokrát chcete.') : null
    )
  );
  return { el, zrus: () => scena.zrus() };
}
