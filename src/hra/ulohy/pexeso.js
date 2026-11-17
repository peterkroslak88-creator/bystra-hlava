import { TEXTY_ULOH } from '../texty-uloh.js';
// Pamäť – Pexeso: hľadanie dvojíc rovnakých obrázkov.
import { h, zSvg } from '../../dom.js';
import { ID_RASTLIN, rastlinaSvg, nazovRastliny } from '../../dizajn/rastliny.js';
import { PARAMETRE, NASOBOK_JEMNY, vyber, zamiesaj, vyhodnotPexeso } from '../logika.js';
import { zadanie, odozva, cakaj } from './spolocne.js';

export const ULOHA = {
  ...TEXTY_ULOH.pexeso,
  spusti(plocha, { uroven, jemny }) {
    return new Promise(async (hotovo) => {
      const p = PARAMETRE.pexeso(uroven);
      const nasobok = jemny ? NASOBOK_JEMNY : 1;
      const karty = zamiesaj(vyber(ID_RASTLIN, p.dvojice).flatMap((r) => [r, r])).map((rastlina, i) => ({
        i,
        rastlina,
        najdena: false,
      }));
      let otocene = [];
      let pokusy = 0;
      let najdene = 0;
      let cakame = true;

      const stav = h('p', { class: 'pexeso__stav', role: 'status', 'aria-live': 'polite' });
      const tlacidla = karty.map((k) => {
        const t = h(
          'button',
          { type: 'button', class: 'pexeso__karta', 'aria-label': `Karta ${k.i + 1}, zakrytá` },
          h('span', { class: 'pexeso__rub', 'aria-hidden': 'true' }),
          h('span', { class: 'pexeso__lic', 'aria-hidden': 'true' }, zSvg(rastlinaSvg(k.rastlina)), h('span', {}, nazovRastliny(k.rastlina)))
        );
        t.addEventListener('click', () => otoc(k, t));
        return t;
      });

      function ukaz(k, t, odkryta) {
        t.classList.toggle('pexeso__karta--odkryta', odkryta);
        t.setAttribute('aria-label', odkryta ? `Karta ${k.i + 1}: ${nazovRastliny(k.rastlina)}` : `Karta ${k.i + 1}, zakrytá`);
      }

      async function otoc(k, t) {
        if (cakame || k.najdena || otocene.some((o) => o.k === k)) return;
        ukaz(k, t, true);
        otocene.push({ k, t });
        if (otocene.length < 2) return;
        pokusy++;
        const [a, b] = otocene;
        if (a.k.rastlina === b.k.rastlina) {
          a.k.najdena = b.k.najdena = true;
          a.t.classList.add('pexeso__karta--najdena');
          b.t.classList.add('pexeso__karta--najdena');
          otocene = [];
          najdene++;
          stav.textContent = `Správne! Našli ste dvojicu: ${nazovRastliny(a.k.rastlina)}.`;
          if (najdene === p.dvojice) {
            await cakaj(700);
            await odozva(plocha, { spravne: true, vysvetlenie: 'Našli ste všetky dvojice.' });
            hotovo(vyhodnotPexeso(p.dvojice, pokusy));
          }
        } else {
          cakame = true;
          stav.textContent = 'Nevadí, tieto dve karty nie sú rovnaké.';
          await cakaj(p.ukazChybuMs * nasobok);
          ukaz(a.k, a.t, false);
          ukaz(b.k, b.t, false);
          otocene = [];
          cakame = false;
        }
      }

      const stlpce = karty.length <= 6 ? 3 : karty.length <= 16 ? 4 : 5;
      plocha.replaceChildren(
        zadanie(ULOHA.zadanie),
        h('div', { class: 'pexeso', style: `--stlpce:${stlpce}` }, tlacidla),
        stav
      );

      // Na nižších úrovniach sa karty najprv na chvíľu ukážu
      if (p.nahladMs) {
        stav.textContent = 'Zapamätajte si, kde sú obrázky.';
        karty.forEach((k, i) => ukaz(k, tlacidla[i], true));
        await cakaj(p.nahladMs * nasobok);
        karty.forEach((k, i) => ukaz(k, tlacidla[i], false));
        stav.textContent = '';
      }
      cakame = false;
    });
  },
};
