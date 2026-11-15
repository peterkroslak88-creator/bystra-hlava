// Spoločné prvky úloh: zadanie, možnosti odpovede a jemná spätná väzba.
import { h } from '../../dom.js';
import { tlacidloCitania } from '../../komponenty/citanie.js';
import { ikona } from '../../komponenty/ikony.js';
import { pohybPovoleny } from '../../dizajn/pohyb.js';

export const cakaj = (ms) => new Promise((hotovo) => setTimeout(hotovo, ms));

// Zadanie úlohy s tlačidlom „Čítať nahlas“
export function zadanie(text, citat = text) {
  return h('div', { class: 'zadanie' }, h('p', { class: 'zadanie__text' }, text), tlacidloCitania(citat));
}

function znacka(text) {
  return h('span', { class: 'volba__znacka' }, text);
}

/**
 * Spätná väzba po odpovedi: „Správne!“ alebo „Nevadí“ a tlačidlo Ďalej.
 * @returns {Promise<void>} splní sa po ťuknutí na Ďalej
 */
export function odozva(plocha, { spravne, vysvetlenie = '', rozhovor = '', dalej = 'Ďalej' }) {
  return new Promise((hotovo) => {
    const tlacidloDalej = h('button', { type: 'button', class: 'tlacidlo tlacidlo--zakladne' }, dalej, ikona('sipka'));
    const nadpis = spravne ? 'Správne!' : 'Nevadí';
    const panel = h(
      'div',
      { class: `odozva ${spravne ? 'odozva--spravne' : 'odozva--nevadi'}`, role: 'status', 'aria-live': 'polite' },
      h('p', { class: 'odozva__nadpis' }, ikona('lista'), nadpis),
      vysvetlenie ? h('p', {}, vysvetlenie) : null,
      rozhovor ? h('p', { class: 'odozva__rozhovor' }, `Na rozhovor: ${rozhovor}`) : null,
      h(
        'div',
        { class: 'riadok' },
        tlacidloDalej,
        tlacidloCitania([nadpis, vysvetlenie, rozhovor].filter(Boolean).join(' '))
      )
    );
    tlacidloDalej.addEventListener('click', () => {
      panel.remove();
      hotovo();
    });
    plocha.append(panel);
    panel.scrollIntoView({ block: 'nearest', behavior: pohybPovoleny() ? 'smooth' : 'auto' });
  });
}

/**
 * Otázka s možnosťami. Vráti true/false podľa toho, či odpoveď bola správna.
 * @param {HTMLElement} plocha
 * @param {{zadanieText: string, obsah?: Node, moznosti: Array<{hodnota: any, obsah: any, popis: string}>,
 *          spravna: any, vysvetlenie?: string, rozhovor?: string, triedaMoznosti?: string,
 *          rozlozMoznosti?: (tlacidla: HTMLElement[]) => Node}} o
 */
export function otazka(plocha, o) {
  return new Promise((hotovo) => {
    // Nahlas sa prečíta aj obsah otázky (napr. príslovie), ktorý je na obrazovke len raz
    const citat = `${o.zadanieText} ${o.citatNavyse ? `${o.citatNavyse} ` : ''}Možnosti: ${o.moznosti.map((m) => m.popis).join(', ')}.`;
    const tlacidla = o.moznosti.map((m) =>
      h('button', { type: 'button', class: 'volba', 'data-hodnota': String(m.hodnota) }, m.obsah)
    );
    let odpovedane = false;
    tlacidla.forEach((t, i) => {
      t.addEventListener('click', async () => {
        if (odpovedane) return;
        odpovedane = true;
        const zvolena = o.moznosti[i].hodnota;
        const spravne = zvolena === o.spravna;
        tlacidla.forEach((b, j) => {
          b.disabled = true;
          const jeSpravna = o.moznosti[j].hodnota === o.spravna;
          if (jeSpravna) {
            b.classList.add('volba--spravna');
            b.append(znacka(spravne ? 'Správne' : 'Správna odpoveď'));
          } else if (j === i) {
            b.classList.add('volba--zla');
            b.append(znacka('Vaša voľba'));
          } else {
            b.classList.add('volba--tlmena');
          }
        });
        await odozva(plocha, { spravne, vysvetlenie: o.vysvetlenie, rozhovor: o.rozhovor });
        hotovo(spravne);
      });
    });
    const mriezka = o.rozlozMoznosti
      ? o.rozlozMoznosti(tlacidla)
      : h('div', { class: `volby ${o.triedaMoznosti || ''}` }, tlacidla);
    plocha.replaceChildren(...[zadanie(o.zadanieText, citat), o.obsah, mriezka].filter(Boolean));
  });
}
