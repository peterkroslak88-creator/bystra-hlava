// Denný tréning (4 úlohy) alebo jedna samostatná úloha.
// Úspešnosť sa drží len v pamäti počas hry a slúži iba na prispôsobenie úrovne.
import { h, zSvg } from '../dom.js';
import { hlavicka, tlacidlo } from '../komponenty/spolocne.js';
import { info } from '../komponenty/info.js';
import { potvrdenie } from '../komponenty/potvrdenie.js';
import { padajuceLupene } from '../komponenty/oslava.js';
import { tlacidloCitania } from '../komponenty/citanie.js';
import { rastlinaSvg } from '../dizajn/rastliny.js';
import { OBLASTI, dennyTrening } from '../hra/oblasti.js';
import { ULOHY } from '../hra/ulohy/index.js';
import { OBTIAZNOSTI, novaUroven, vRozsahu } from '../hra/obtiaznost.js';
import { nacitajHraca, nastavUroven, zaznamenajDenHrania, prehladHrania } from '../ulozisko/hraci.js';
import { relacia } from '../relacia.js';
import { prejdi } from '../navigacia.js';

/**
 * @param {{ulohy?: Array<{oblast: string, typ: string}>}} data  bez úloh = denný tréning
 */
export async function trening({ ulohy = null } = {}) {
  const hrac = await nacitajHraca(relacia.hracId);
  if (!hrac) {
    prejdi('uvod');
    return null;
  }
  const samostatne = Boolean(ulohy);
  const zoznam = ulohy || dennyTrening();
  const dniPred = prehladHrania(hrac).pocetDni;
  const obtiaznost = hrac.obtiaznost || 'lahka';
  const urovne = { ...hrac.urovne };
  let index = 0;
  let dokoncene = 0;
  let denZapisany = false;
  let zruseny = false;

  const postup = h('ol', { class: 'postup', 'aria-label': 'Postup tréningu' });
  const plocha = h('section', { class: 'trening__plocha', 'aria-live': 'off' });

  function obnovPostup() {
    postup.replaceChildren(
      ...zoznam.map((u, i) => {
        const oblast = OBLASTI.find((o) => o.id === u.oblast);
        const stavText = i < index ? 'hotovo' : i === index ? 'práve teraz' : 'čaká';
        return h(
          'li',
          {
            class: `postup__krok ${i < index ? 'postup__krok--hotovo' : ''} ${i === index ? 'postup__krok--teraz' : ''}`,
            style: `--oblast:${oblast.farba};--oblast-svetla:${oblast.svetla}`,
          },
          h('span', { class: 'postup__rastlina', html: rastlinaSvg(oblast.rastlina) }),
          h('span', { class: 'postup__nazov' }, oblast.nazov),
          h('span', { class: 'skryte' }, `, ${stavText}`)
        );
      })
    );
  }

  function nastavFarbu(oblast) {
    el.style.setProperty('--oblast', oblast.farba);
    el.style.setProperty('--oblast-svetla', oblast.svetla);
  }

  // Úvodná karta úlohy: oblasť, názov, vysvetlenie
  function uvodUlohy() {
    const { oblast: idOblasti, typ } = zoznam[index];
    const oblast = OBLASTI.find((o) => o.id === idOblasti);
    const uloha = ULOHY[typ];
    nastavFarbu(oblast);
    obnovPostup();
    const zacat = tlacidlo('Začať úlohu', { druh: 'hlavne', ikonka: 'sipka', onClick: () => hrajUlohu() });
    plocha.replaceChildren(
      h(
        'div',
        { class: 'karta uloha-uvod' },
        h('span', { class: 'uloha-uvod__rastlina' }, zSvg(rastlinaSvg(oblast.rastlina))),
        h(
          'div',
          { class: 'stlpec', style: 'gap: 14px' },
          h('p', { class: 'uloha-uvod__oblast' }, samostatne ? oblast.nazov : `Úloha ${index + 1} zo ${zoznam.length} · ${oblast.nazov}`),
          h('h1', {}, uloha.nazov),
          h('p', { class: 'uvodny-text' }, uloha.zadanie),
          h(
            'div',
            { class: 'riadok', style: 'gap: 8px' },
            tlacidloCitania(`${uloha.nazov}. ${uloha.zadanie}`),
            info(oblast.nazov, oblast.vysvetlivka)
          ),
          h('div', {}, zacat)
        )
      )
    );
    zacat.focus({ preventScroll: true });
  }

  async function hrajUlohu() {
    const { typ } = zoznam[index];
    const uloha = ULOHY[typ];
    const uroven = vRozsahu(urovne[typ] ?? OBTIAZNOSTI[obtiaznost].od, obtiaznost);
    const plochaUlohy = h('div', { class: 'karta uloha' });
    plocha.replaceChildren(plochaUlohy);

    const { spravne, spolu } = await uloha.spusti(plochaUlohy, { uroven, jemny: Boolean(hrac.jemnyRezim) });
    if (zruseny) return;

    // Tiché prispôsobenie úrovne (výsledok sa neukladá, len nová úroveň)
    const nova = novaUroven(uroven, obtiaznost, spravne, spolu, Boolean(hrac.jemnyRezim));
    urovne[typ] = nova;
    await nastavUroven(hrac.id, typ, nova);
    if (!denZapisany) {
      await zaznamenajDenHrania(hrac.id);
      denZapisany = true;
    }
    dokoncene++;
    index++;
    obnovPostup();
    padajuceLupene();

    const posledna = index >= zoznam.length;
    const textHotovo = posledna
      ? samostatne
        ? 'Úloha je hotová. Ďakujeme za hru.'
        : 'Dnešný tréning je hotový. Vaša záhrada sa teší.'
      : 'Úloha je hotová. Môžete si chvíľku oddýchnuť.';
    const dalej = posledna
      ? tlacidlo('Pozrieť sa do záhrady', { druh: 'hlavne', ikonka: 'lista', onClick: () => doZahrady() })
      : tlacidlo('Ďalšia úloha', { druh: 'hlavne', ikonka: 'sipka', onClick: () => uvodUlohy() });
    plocha.replaceChildren(
      h(
        'div',
        { class: 'karta hotovo' },
        h('h1', {}, posledna ? 'Výborne' : 'Pekne'),
        h('p', { class: 'uvodny-text' }, textHotovo),
        h('div', { class: 'riadok riadok--stred' }, dalej, tlacidloCitania(textHotovo))
      )
    );
    dalej.focus({ preventScroll: true });
  }

  function doZahrady() {
    prejdi('zahrada', { rastOd: dniPred });
  }

  async function ukoncit() {
    const ano = await potvrdenie({
      nadpis: samostatne ? 'Ukončiť úlohu?' : 'Ukončiť tréning?',
      text: dokoncene
        ? 'Dokončené úlohy sa počítajú a záhrada za ne porastie.'
        : 'Nič sa nestane, môžete sa vrátiť kedykoľvek.',
      ano: 'Áno, ukončiť',
      nie: 'Pokračovať v hre',
      nebezpecne: false,
    });
    if (ano) doZahrady();
  }

  const el = h(
    'div',
    { class: 'trening' },
    hlavicka(tlacidlo(samostatne ? 'Ukončiť úlohu' : 'Ukončiť tréning', { ikonka: 'kriz', onClick: ukoncit })),
    samostatne ? null : postup,
    plocha
  );
  uvodUlohy();
  return {
    el,
    zrus: () => {
      zruseny = true;
    },
  };
}
