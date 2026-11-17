// Výber hlasu na čítanie nahlas (pre personál) s tlačidlom „Vyskúšať“.
// Predvolený je zabudovaný hlas Lili (nahrávky v appke). Personál môže namiesto
// neho zvoliť slovenský hlas uložený v tablete.
import { h } from '../dom.js';
import { ikona } from './ikony.js';
import { skupinaVolieb } from './volba.js';
import { dostupneHlasy, nastavPreferovanyHlas, priZmeneHlasov, citaj } from './citanie.js';
import { kvalitaHlasu } from './hlas-logika.js';
import { hlasCitania, nastavHlasCitania } from '../ulozisko/hraci.js';
import { UKAZKA_HLASU } from '../hlas/zoznam.js';

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

function moznost(nazov, popis) {
  return [
    h('span', { class: 'moznost__hlavicka' }, h('span', { class: 'pole__nazov' }, nazov), h('span', { class: 'moznost__znacka' }, 'Zvolené')),
    popis ? h('span', { class: 'jemny-text' }, popis) : null,
  ];
}

/**
 * Vráti prvok s výberom hlasu. Voľba sa uloží len ako nastavenie tohto tabletu.
 */
export async function vyberHlasu() {
  const obal = h('div', { class: 'stlpec', style: 'gap: 14px' });
  const oznam = h('p', { class: 'oznam', role: 'status', 'aria-live': 'polite' });
  let zvoleny = await hlasCitania();

  function vykresli() {
    const hlasy = dostupneHlasy();
    const volba = skupinaVolieb({
      popis: 'Hlas na čítanie',
      trieda: 'vyber',
      vybrana: hlasy.some((x) => x.voiceURI === zvoleny) ? zvoleny : null,
      moznosti: [
        { hodnota: null, obsah: moznost('Lili – hlas appky', 'Príjemný ženský hlas zabudovaný v appke. Znie rovnako na každom zariadení.') },
        ...hlasy.map((x) => ({ hodnota: x.voiceURI, obsah: moznost(popisHlasu(x), 'Hlas tohto zariadenia.') })),
      ],
      async priZmene(hodnota) {
        zvoleny = hodnota;
        await nastavHlasCitania(hodnota);
        nastavPreferovanyHlas(hodnota);
        oznam.textContent = 'Uložené.';
      },
    });
    const vyskusat = h(
      'button',
      { type: 'button', class: 'tlacidlo citanie', 'aria-pressed': 'false', 'data-popis': 'Vyskúšať hlas' },
      ikona('reproduktor'),
      h('span', { class: 'citanie__text' }, 'Vyskúšať hlas')
    );
    vyskusat.addEventListener('click', () => citaj(UKAZKA_HLASU, vyskusat));
    obal.replaceChildren(volba.el, h('div', {}, vyskusat), oznam);
  }

  vykresli();
  // Na iPade sa zoznam hlasov zariadenia načíta až o chvíľu
  const zrus = priZmeneHlasov(vykresli);
  return { el: obal, zrus };
}
