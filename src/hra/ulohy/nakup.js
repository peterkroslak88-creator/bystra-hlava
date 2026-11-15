// Pamäť – Nákupný zoznam: zapamätať si, čo treba kúpiť, a potom to nájsť.
import { h } from '../../dom.js';
import { PARAMETRE, kolouNakupu, vyhodnotNakup } from '../logika.js';
import { zadanie, odozva } from './spolocne.js';

export const ULOHA = {
  nazov: 'Nákupný zoznam',
  zadanie: 'Zapamätajte si, čo treba kúpiť v obchode. Keď budete pripravení, ťuknite na tlačidlo.',
  spusti: (plocha, nastavenie) => spusti(plocha, nastavenie),
};

async function spusti(plocha, { uroven }) {
  const p = PARAMETRE.nakup(uroven);
  let spravne = 0;
  let spolu = 0;

  for (let kolo = 0; kolo < p.kola; kolo++) {
    const { zoznam, ponuka } = kolouNakupu(p.polozky, p.spolu);

    // 1. Zapamätanie
    const hotovo = h('button', { type: 'button', class: 'tlacidlo tlacidlo--zakladne tlacidlo--hlavne' }, 'Mám to zapamätané');
    plocha.replaceChildren(
      zadanie(ULOHA.zadanie, `${ULOHA.zadanie} V zozname je: ${zoznam.join(', ')}.`),
      h('div', { class: 'zoznam-nakupu' }, h('p', { class: 'zoznam-nakupu__nadpis' }, 'Nákupný zoznam'), h('ul', {}, zoznam.map((z) => h('li', {}, z)))),
      h('div', { class: 'riadok riadok--stred' }, hotovo)
    );
    await new Promise((ok) => hotovo.addEventListener('click', ok, { once: true }));

    // 2. Hľadanie v obchode
    const vybrane = new Set();
    const tlacidla = ponuka.map((polozka) => {
      const t = h('button', { type: 'button', class: 'volba volba--prepinac', 'aria-pressed': 'false' }, polozka);
      t.addEventListener('click', () => {
        if (t.disabled) return;
        if (vybrane.has(polozka)) vybrane.delete(polozka);
        else vybrane.add(polozka);
        t.setAttribute('aria-pressed', String(vybrane.has(polozka)));
      });
      return t;
    });
    const skoncit = h('button', { type: 'button', class: 'tlacidlo tlacidlo--zakladne' }, 'Hotovo');
    const textZadania = 'Ťuknite na všetko, čo bolo v nákupnom zozname. Potom ťuknite na Hotovo.';
    plocha.replaceChildren(
      zadanie(textZadania, `${textZadania} Možnosti: ${ponuka.join(', ')}.`),
      h('div', { class: 'volby volby--slova' }, tlacidla),
      h('div', { class: 'riadok riadok--stred' }, skoncit)
    );
    await new Promise((ok) => skoncit.addEventListener('click', ok, { once: true }));
    skoncit.remove();

    // 3. Vyhodnotenie: zvýraznia sa správne položky
    const vysledok = vyhodnotNakup(zoznam, [...vybrane]);
    spravne += vysledok.spravne;
    spolu += vysledok.spolu;
    tlacidla.forEach((t, i) => {
      const polozka = ponuka[i];
      t.disabled = true;
      const bolo = zoznam.includes(polozka);
      if (bolo && vybrane.has(polozka)) t.classList.add('volba--spravna');
      else if (bolo) {
        t.classList.add('volba--chybala');
        t.append(h('span', { class: 'volba__znacka' }, 'bolo v zozname'));
      } else if (vybrane.has(polozka)) t.classList.add('volba--zla');
      else t.classList.add('volba--tlmena');
    });
    const vsetko = vysledok.spravne === zoznam.length;
    await odozva(plocha, {
      spravne: vsetko,
      vysvetlenie: vsetko ? 'Kúpili ste všetko zo zoznamu.' : `V zozname bolo: ${zoznam.join(', ')}.`,
    });
  }
  return { spravne, spolu };
}
