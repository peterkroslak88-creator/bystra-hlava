// Správa hráčov pre personál. Personál vidí iba počet dní a kedy hráč naposledy hral.
import { h } from '../dom.js';
import { hlavicka, nadpis, tlacidlo, obrazokRastliny, citatelnyDatum } from '../komponenty/spolocne.js';
import { info } from '../komponenty/info.js';
import { VYSVETLIVKY } from '../texty.js';
import { zoznamHracov, prehladHrania, popisObtiaznosti, pridajUkazkovehoHraca } from '../ulozisko/hraci.js';
import { odhlas } from '../relacia.js';
import { prejdi } from '../navigacia.js';

export async function personal({ sprava = '' } = {}) {
  const hraci = await zoznamHracov();

  const oznam = h('p', { class: 'oznam', role: 'status', 'aria-live': 'polite' }, sprava);

  async function pridajUkazku() {
    const hrac = await pridajUkazkovehoHraca();
    prejdi('personal', { sprava: `Pridaný ukážkový hráč „${hrac.meno}“ s PIN 1234.` });
  }

  const zoznam = hraci.length
    ? h(
        'ul',
        { class: 'zoznam-hracov', role: 'list' },
        hraci.map((hrac) => {
          const { pocetDni, naposledy } = prehladHrania(hrac);
          return h(
            'li',
            { class: 'karta hrac-riadok' },
            obrazokRastliny(hrac.rastlina, 'hrac-riadok__obrazok'),
            h(
              'div',
              {},
              h('p', { class: 'hrac-riadok__meno' }, hrac.meno),
              h('p', { class: 'jemny-text' }, `Dni v hre: ${pocetDni} · naposledy: ${citatelnyDatum(naposledy)}`),
              h(
                'p',
                { class: 'jemny-text' },
                `Obťažnosť: ${popisObtiaznosti(hrac)}${hrac.jemnyRezim ? ' · jemný režim' : ''}`
              )
            ),
            tlacidlo('Upraviť', {
              ikonka: 'pero',
              'aria-label': `Upraviť hráča ${hrac.meno}`,
              onClick: () => prejdi('hracEditor', { hracId: hrac.id }),
            })
          );
        })
      )
    : h(
        'div',
        { class: 'karta prazdne' },
        h('h3', {}, 'Zatiaľ žiadni hráči'),
        h('p', { class: 'jemny-text' }, 'Pridajte prvého hráča alebo ukážkového hráča na predstavenie hry.')
      );

  const el = h(
    'div',
    {},
    hlavicka(
      tlacidlo('Odhlásiť', {
        ikonka: 'odhlasit',
        onClick: () => {
          odhlas();
          prejdi('uvod');
        },
      })
    ),
    nadpis('Správa hráčov', { podnadpis: 'Tu pridávate hráčov a meníte ich nastavenia.' }),
    h(
      'div',
      { class: 'riadok', style: 'margin-top: 24px' },
      tlacidlo('Pridať hráča', { druh: 'zakladne', ikonka: 'plus', onClick: () => prejdi('hracEditor') }),
      h(
        'span',
        { class: 'riadok', style: 'gap: 4px' },
        tlacidlo('Pridať ukážkového hráča', { ikonka: 'plus', onClick: pridajUkazku }),
        info(VYSVETLIVKY.ukazkovyHrac.nazov, VYSVETLIVKY.ukazkovyHrac.text)
      )
    ),
    oznam,
    h('section', { class: 'sekcia', 'aria-label': 'Hráči' }, zoznam),
    h(
      'section',
      { class: 'sekcia' },
      h(
        'div',
        { class: 'karta stlpec' },
        h(
          'div',
          { class: 'riadok', style: 'gap: 4px' },
          h('h2', {}, 'Náhľad záhrady'),
          info(VYSVETLIVKY.nahladZahrady.nazov, VYSVETLIVKY.nahladZahrady.text)
        ),
        h('p', { class: 'jemny-text' }, 'Ukáže, ako záhrada rastie po 0 až 45 dňoch tréningu.'),
        h('div', {}, tlacidlo('Otvoriť náhľad', { ikonka: 'lista', onClick: () => prejdi('nahladZahrady') }))
      )
    ),
    h(
      'section',
      { class: 'sekcia' },
      h(
        'div',
        { class: 'karta stlpec' },
        h(
          'div',
          { class: 'riadok', style: 'gap: 4px' },
          h('h2', {}, 'Čo appka ukladá'),
          info(VYSVETLIVKY.coUklada.nazov, VYSVETLIVKY.coUklada.text)
        ),
        h(
          'ul',
          { class: 'zoznam-bodky' },
          h('li', {}, 'prezývku alebo krstné meno a obrázok profilu,'),
          h('li', {}, 'PIN v zabezpečenej podobe, z ktorej sa nedá prečítať,'),
          h('li', {}, 'dni, keď hráč hral,'),
          h('li', {}, 'obťažnosť, jemný režim a úroveň úloh (nastavenia hry).')
        ),
        h('p', { class: 'jemny-text' }, 'Odpovede z úloh sa neukladajú. Všetko zostáva len v tomto tablete.')
      )
    )
  );
  return { el };
}
