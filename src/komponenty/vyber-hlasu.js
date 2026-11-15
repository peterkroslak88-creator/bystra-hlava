// Výber hlasu na čítanie nahlas (pre personál) s tlačidlom „Vyskúšať“.
import { h } from '../dom.js';
import { ikona } from './ikony.js';
import { skupinaVolieb } from './volba.js';
import { citanieDostupne, dostupneHlasy, aktualnyHlas, nastavPreferovanyHlas, priZmeneHlasov, citaj } from './citanie.js';
import { kvalitaHlasu } from './hlas-logika.js';
import { hlasCitania, nastavHlasCitania } from '../ulozisko/hraci.js';

const UKAZKA = 'Dobrý deň. Takto bude znieť čítanie zadaní a vysvetliviek. Prajem vám príjemnú hru.';

// Krátky čitateľný názov, napr. „Microsoft Filip - Slovak (Slovakia)“ → „Filip“
function popisHlasu(hlas) {
  const vylepseny = kvalitaHlasu(hlas) >= 30;
  const meno = hlas.name
    .replace(/^(Microsoft|Google|Apple)\s+/i, '')
    .replace(/\s*-\s*Slovak.*$/i, '')
    .replace(/\s*\((Slovak|slovenčina)[^)]*\)/i, '')
    .trim();
  return `${meno || hlas.name}${vylepseny && !/vylepšen|enhanced|premium/i.test(meno) ? ' · vylepšený' : ''}`;
}

/**
 * Vráti prvok so zoznamom slovenských hlasov v tablete.
 * Voľba sa uloží len ako nastavenie tohto tabletu.
 */
export async function vyberHlasu() {
  const obal = h('div', { class: 'stlpec', style: 'gap: 14px' });
  const oznam = h('p', { class: 'oznam', role: 'status', 'aria-live': 'polite' });
  let zvoleny = await hlasCitania();

  function vykresli() {
    if (!citanieDostupne) {
      obal.replaceChildren(h('p', {}, 'Toto zariadenie nevie čítať nahlas.'));
      return;
    }
    const hlasy = dostupneHlasy();
    if (!hlasy.length) {
      obal.replaceChildren(
        h('p', {}, 'V tomto zariadení zatiaľ nie je slovenský hlas.'),
        h('p', { class: 'jemny-text' }, 'Na iPade ho stiahnete v Nastaveniach: Prístupnosť → Hovorený obsah → Hlasy → Slovenčina → Laura. Vyberte vylepšenú verziu.')
      );
      return;
    }
    const auto = aktualnyHlas();
    const volba = skupinaVolieb({
      popis: 'Hlas na čítanie',
      trieda: 'vyber',
      vybrana: hlasy.some((x) => x.voiceURI === zvoleny) ? zvoleny : null,
      moznosti: [
        {
          hodnota: null,
          obsah: [
            h('span', { class: 'moznost__hlavicka' }, h('span', { class: 'pole__nazov' }, 'Automaticky'), h('span', { class: 'moznost__znacka' }, 'Zvolené')),
            h('span', { class: 'jemny-text' }, `Najkrajší dostupný hlas${!zvoleny && auto ? `: ${popisHlasu(auto)}` : ''}`),
          ],
        },
        ...hlasy.map((x) => ({
          hodnota: x.voiceURI,
          obsah: [
            h('span', { class: 'moznost__hlavicka' }, h('span', { class: 'pole__nazov' }, popisHlasu(x)), h('span', { class: 'moznost__znacka' }, 'Zvolené')),
          ],
        })),
      ],
      async priZmene(hodnota) {
        zvoleny = hodnota;
        await nastavHlasCitania(hodnota);
        nastavPreferovanyHlas(hodnota);
        oznam.textContent = `Uložené. Hlas: ${aktualnyHlas() ? popisHlasu(aktualnyHlas()) : 'automaticky'}.`;
      },
    });
    const vyskusat = h('button', { type: 'button', class: 'tlacidlo citanie', 'aria-pressed': 'false', 'data-popis': 'Vyskúšať hlas' }, ikona('reproduktor'), h('span', { class: 'citanie__text' }, 'Vyskúšať hlas'));
    vyskusat.addEventListener('click', () => citaj(UKAZKA, vyskusat));
    obal.replaceChildren(volba.el, h('div', {}, vyskusat), oznam);
  }

  vykresli();
  // Na iPade sa zoznam hlasov načíta až o chvíľu
  const zrus = priZmeneHlasov(vykresli);
  return { el: obal, zrus };
}
