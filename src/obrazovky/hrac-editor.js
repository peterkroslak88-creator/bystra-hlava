// Pridanie alebo úprava hráča (len personál).
import { h, zSvg } from '../dom.js';
import { hlavicka, nadpis, tlacidlo } from '../komponenty/spolocne.js';
import { info } from '../komponenty/info.js';
import { skupinaVolieb, moznostiObtiaznosti } from '../komponenty/volba.js';
import { potvrdenie } from '../komponenty/potvrdenie.js';
import { RASTLINY, rastlinaSvg } from '../dizajn/rastliny.js';
import { VYSVETLIVKY } from '../texty.js';
import {
  nacitajHraca,
  zoznamHracov,
  vytvorHraca,
  upravHraca,
  vymazHraca,
  MAX_DLZKA_MENA,
} from '../ulozisko/hraci.js';
import { prejdi } from '../navigacia.js';

export async function hracEditor({ hracId = null } = {}) {
  const hrac = hracId ? await nacitajHraca(hracId) : null;
  const novy = !hrac;

  // Novému hráčovi ponúkneme rastlinu, ktorú ešte nikto nemá
  let predvolenaRastlina = hrac?.rastlina ?? null;
  if (novy) {
    const pouzite = new Set((await zoznamHracov()).map((x) => x.rastlina));
    predvolenaRastlina = (RASTLINY.find((r) => !pouzite.has(r.id)) || RASTLINY[0]).id;
  }

  const meno = h('input', {
    id: 'pole-meno',
    class: 'vstup',
    value: hrac?.meno ?? '',
    maxlength: MAX_DLZKA_MENA,
    autocomplete: 'off',
    autocapitalize: 'words',
    spellcheck: 'false',
  });

  const rastliny = skupinaVolieb({
    popis: 'Obrázok profilu',
    trieda: 'rastliny-vyber',
    vybrana: predvolenaRastlina,
    moznosti: RASTLINY.map((r) => ({
      hodnota: r.id,
      trieda: 'rastlina-moznost',
      obsah: [zSvg(rastlinaSvg(r.id)), h('span', {}, r.nazov)],
    })),
  });

  const pin = h('input', {
    id: 'pole-pin',
    inputmode: 'numeric',
    pattern: '[0-9]*',
    maxlength: 4,
    autocomplete: 'off',
    placeholder: novy ? 'napr. 2580' : 'nechať bez zmeny',
    style: 'max-width: 260px',
    class: 'vstup vstup--pin',
  });

  const obtiaznost = skupinaVolieb({
    popis: 'Obťažnosť',
    trieda: 'vyber vyber--tri',
    vybrana: hrac?.obtiaznost ?? null,
    moznosti: [
      {
        hodnota: null,
        obsah: [
          h(
            'span',
            { class: 'moznost__hlavicka' },
            h('span', { class: 'moznost__nazov' }, 'Vyberie si sám'),
            h('span', { class: 'moznost__znacka' }, 'Zvolené')
          ),
          h('span', { class: 'jemny-text' }, 'Hráč si zvolí pri prvom prihlásení.'),
        ],
      },
      ...moznostiObtiaznosti(),
    ],
  });

  const jemny = h('input', { type: 'checkbox', id: 'pole-jemny', checked: Boolean(hrac?.jemnyRezim) });
  const chyba = h('p', { class: 'chyba-text', role: 'alert' });

  async function uloz(e) {
    e.preventDefault();
    chyba.textContent = '';
    const udaje = {
      meno: meno.value,
      rastlina: rastliny.hodnota(),
      obtiaznost: obtiaznost.hodnota(),
      jemnyRezim: jemny.checked,
    };
    const novyPin = pin.value.trim();
    try {
      if (novy) {
        if (!novyPin) throw new Error('Zadajte, prosím, PIN zo 4 číslic.');
        const vytvoreny = await vytvorHraca({ ...udaje, pin: novyPin });
        prejdi('personal', { sprava: `Hráč „${vytvoreny.meno}“ je pridaný.` });
      } else {
        await upravHraca(hrac.id, novyPin ? { ...udaje, pin: novyPin } : udaje);
        prejdi('personal', { sprava: 'Zmeny sú uložené.' });
      }
    } catch (err) {
      chyba.textContent = err.message;
    }
  }

  async function vymaz() {
    const ano = await potvrdenie({
      nadpis: `Vymazať hráča ${hrac.meno}?`,
      text: 'Vymaže sa jeho záhrada aj všetky nastavenia. Tento krok sa nedá vrátiť.',
      ano: 'Áno, vymazať',
      nie: 'Nechať tak',
    });
    if (!ano) return;
    await vymazHraca(hrac.id);
    prejdi('personal', { sprava: `Hráč „${hrac.meno}“ bol vymazaný.` });
  }

  const formular = h(
    'form',
    { class: 'stlpec', novalidate: true, onsubmit: uloz },
    h(
      'div',
      { class: 'karta stlpec' },
      h(
        'div',
        { class: 'pole' },
        h('label', { class: 'pole__nazov', for: 'pole-meno' }, 'Prezývka alebo krstné meno'),
        meno
      ),
      h('div', { class: 'pole' }, h('p', { class: 'pole__nazov' }, 'Obrázok profilu'), rastliny.el),
      h(
        'div',
        { class: 'pole' },
        h(
          'div',
          { class: 'pole__nazov' },
          h('label', { for: 'pole-pin' }, novy ? 'PIN (4 číslice)' : 'Nový PIN (4 číslice)'),
          info(VYSVETLIVKY.pin.nazov, VYSVETLIVKY.pin.text)
        ),
        pin
      )
    ),
    h(
      'div',
      { class: 'karta stlpec' },
      h(
        'div',
        { class: 'pole' },
        h(
          'div',
          { class: 'pole__nazov' },
          h('span', {}, 'Obťažnosť'),
          info(VYSVETLIVKY.obtiaznost.nazov, VYSVETLIVKY.obtiaznost.text)
        ),
        obtiaznost.el
      ),
      h(
        'div',
        { class: 'riadok', style: 'gap: 4px' },
        h('label', { class: 'prepinac', for: 'pole-jemny' }, jemny, h('span', { class: 'pole__nazov' }, 'Jemný režim')),
        info(VYSVETLIVKY.jemnyRezim.nazov, VYSVETLIVKY.jemnyRezim.text)
      )
    ),
    chyba,
    h(
      'div',
      { class: 'riadok' },
      tlacidlo(novy ? 'Pridať hráča' : 'Uložiť zmeny', { druh: 'zakladne', typ: 'submit', ikonka: novy ? 'plus' : null }),
      tlacidlo('Zrušiť', { onClick: () => prejdi('personal') }),
      novy ? null : h('span', { style: 'flex: 1' }),
      novy ? null : tlacidlo('Vymazať hráča', { ikonka: 'kos', onClick: vymaz })
    )
  );

  const el = h(
    'div',
    {},
    hlavicka(tlacidlo('Späť', { ikonka: 'spat', onClick: () => prejdi('personal') })),
    nadpis(novy ? 'Nový hráč' : `Upraviť: ${hrac.meno}`, { citat: false }),
    h('div', { style: 'margin-top: 24px' }, formular)
  );
  return { el };
}
