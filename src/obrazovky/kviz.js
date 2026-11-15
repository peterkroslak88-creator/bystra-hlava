// Skupinový kvíz na projektor: nastavenie tímov a samotný kvíz.
// Body sa držia len v pamäti, nič sa neukladá.
import { h } from '../dom.js';
import { hlavicka, nadpis, tlacidlo } from '../komponenty/spolocne.js';
import { skupinaVolieb } from '../komponenty/volba.js';
import { potvrdenie } from '../komponenty/potvrdenie.js';
import { tlacidloCitania } from '../komponenty/citanie.js';
import { padajuceLupene } from '../komponenty/oslava.js';
import { VYSVETLIVKY } from '../texty.js';
import { zasobaKvizu } from '../hra/obsah/kviz.js';
import { pripravKviz, PISMENA_MOZNOSTI } from '../hra/logika.js';
import { prejdi } from '../navigacia.js';

const NAZVY_TIMOV = ['Levanduľa', 'Mak', 'Harmanček', 'Ruža'];
const FARBY_TIMOV = ['#5b4d86', '#a3402f', '#75531a', '#8a425d'];
const POCET_OTAZOK = 10;

function jeCelaObrazovka() {
  return Boolean(document.fullscreenElement || document.webkitFullscreenElement);
}

function celaObrazovka(zapnut) {
  const el = document.documentElement;
  try {
    if (zapnut && !jeCelaObrazovka()) {
      const poziadavka = (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el);
      poziadavka?.catch?.(() => {});
    } else if (!zapnut && jeCelaObrazovka()) {
      (document.exitFullscreen || document.webkitExitFullscreen)?.call(document);
    }
  } catch {
    /* zariadenie celú obrazovku nepodporuje – nevadí */
  }
}

function bodyText(n) {
  if (n === 1) return '1 bod';
  if (n >= 2 && n <= 4) return `${n} body`;
  return `${n} bodov`;
}

// ---------- Nastavenie tímov ----------

export async function kvizNastavenie() {
  let pocet = 2;
  const polia = NAZVY_TIMOV.map((nazov, i) =>
    h('input', { class: 'vstup', id: `tim-${i}`, value: nazov, maxlength: 20, autocomplete: 'off' })
  );
  const riadky = polia.map((pole, i) =>
    h('div', { class: 'pole' }, h('label', { class: 'pole__nazov', for: pole.id }, `Názov ${i + 1}. tímu`), pole)
  );
  function obnov() {
    riadky.forEach((r, i) => (r.hidden = i >= pocet));
  }
  const volba = skupinaVolieb({
    popis: 'Počet tímov',
    trieda: 'nahlad-dni',
    vybrana: 2,
    moznosti: [2, 3, 4].map((n) => ({ hodnota: n, obsah: `${n} tímy` })),
    priZmene: (n) => {
      pocet = n;
      obnov();
    },
  });
  obnov();

  function zacat() {
    const timy = polia.slice(0, pocet).map((p, i) => p.value.trim() || NAZVY_TIMOV[i]);
    celaObrazovka(true);
    prejdi('kviz', { timy });
  }

  const el = h(
    'div',
    {},
    hlavicka(tlacidlo('Späť', { ikonka: 'spat', onClick: () => prejdi('personal') })),
    nadpis('Skupinový kvíz', {
      podnadpis: 'Nastavte tímy a spustite kvíz. Body sa nikam neukladajú.',
      vysvetlivka: VYSVETLIVKY.kviz,
    }),
    h(
      'div',
      { class: 'karta stlpec', style: 'margin-top: 24px' },
      h('div', { class: 'pole' }, h('p', { class: 'pole__nazov' }, 'Počet tímov'), volba.el),
      h('div', { class: 'kviz-timy' }, riadky),
      h('div', {}, tlacidlo('Začať kvíz', { druh: 'hlavne', ikonka: 'sipka', onClick: zacat }))
    )
  );
  return { el };
}

// ---------- Kvíz ----------

export async function kviz({ timy = NAZVY_TIMOV.slice(0, 2) } = {}) {
  const otazky = pripravKviz(zasobaKvizu(), POCET_OTAZOK);
  const body = timy.map(() => 0);
  let index = 0;

  const plocha = h('div', { class: 'kviz__plocha' });
  const tabula = h('div', { class: 'kviz__tabula', 'aria-label': 'Body tímov' });
  const prepinacObrazovky = tlacidlo('Celá obrazovka', {
    ikonka: 'plus',
    onClick: () => {
      celaObrazovka(!jeCelaObrazovka());
    },
  });

  function obnovTabulu() {
    tabula.replaceChildren(
      ...timy.map((t, i) =>
        h(
          'div',
          { class: 'kviz__tim', style: `--tim:${FARBY_TIMOV[i]}` },
          h('span', { class: 'kviz__tim-nazov' }, t),
          h('span', { class: 'kviz__tim-body' }, bodyText(body[i]))
        )
      )
    );
  }

  function ukazOtazku() {
    const q = otazky[index];
    const pripisane = new Set();
    const moznosti = q.moznosti.map((m, i) =>
      h('div', { class: 'kviz__moznost' }, h('span', { class: 'kviz__pismeno' }, PISMENA_MOZNOSTI[i]), h('span', {}, m))
    );
    const ovladanie = h('div', { class: 'kviz__ovladanie' });
    const citat = `${q.otazka} ${q.moznosti.map((m, i) => `${PISMENA_MOZNOSTI[i]}: ${m}.`).join(' ')}`;

    const odkryt = tlacidlo('Odkryť odpoveď', {
      druh: 'hlavne',
      onClick: () => {
        moznosti.forEach((m, i) => m.classList.add(i === q.spravna ? 'kviz__moznost--spravna' : 'kviz__moznost--tlmena'));
        moznosti[q.spravna].append(h('span', { class: 'volba__znacka' }, 'Správna odpoveď'));
        const posledna = index === otazky.length - 1;
        ovladanie.replaceChildren(
          h('p', { class: 'pole__nazov' }, 'Ktoré tímy odpovedali správne? Ťuknutím pripíšete bod.'),
          h(
            'div',
            { class: 'riadok' },
            timy.map((t, i) => {
              const b = h('button', { type: 'button', class: 'tlacidlo kviz__bod', 'aria-pressed': 'false', style: `--tim:${FARBY_TIMOV[i]}` }, `+1 bod: ${t}`);
              b.addEventListener('click', () => {
                if (pripisane.has(i)) {
                  pripisane.delete(i);
                  body[i]--;
                } else {
                  pripisane.add(i);
                  body[i]++;
                }
                b.setAttribute('aria-pressed', String(pripisane.has(i)));
                obnovTabulu();
              });
              return b;
            })
          ),
          h(
            'div',
            {},
            tlacidlo(posledna ? 'Ukázať výsledok' : 'Ďalšia otázka', {
              druh: 'zakladne',
              ikonka: 'sipka',
              onClick: () => {
                index++;
                if (index < otazky.length) ukazOtazku();
                else koniec();
              },
            })
          )
        );
      },
    });
    ovladanie.replaceChildren(h('div', { class: 'riadok' }, odkryt, tlacidloCitania(citat, { male: false })));

    plocha.replaceChildren(
      h('p', { class: 'kviz__poradie' }, `Otázka ${index + 1} z ${otazky.length}`),
      h('h1', { class: 'kviz__otazka' }, q.otazka),
      h('div', { class: 'kviz__moznosti' }, moznosti),
      ovladanie
    );
    window.scrollTo(0, 0);
  }

  function koniec() {
    padajuceLupene(24);
    plocha.replaceChildren(
      h('h1', { class: 'kviz__otazka' }, 'Koniec kvízu'),
      h('p', { class: 'uvodny-text' }, 'Ďakujeme všetkým tímom za krásnu hru.'),
      h(
        'div',
        { class: 'riadok' },
        tlacidlo('Hrať znova', { druh: 'zakladne', ikonka: 'sipka', onClick: () => prejdi('kviz', { timy }) }),
        tlacidlo('Späť k personálu', {
          ikonka: 'spat',
          onClick: () => {
            celaObrazovka(false);
            prejdi('personal');
          },
        })
      )
    );
  }

  async function ukoncit() {
    const ano = await potvrdenie({
      nadpis: 'Ukončiť kvíz?',
      text: 'Body sa nikam neukladajú, po ukončení zmiznú.',
      ano: 'Áno, ukončiť',
      nie: 'Pokračovať',
      nebezpecne: false,
    });
    if (!ano) return;
    celaObrazovka(false);
    prejdi('personal');
  }

  const el = h(
    'div',
    { class: 'kviz' },
    hlavicka(prepinacObrazovky, tlacidlo('Ukončiť kvíz', { ikonka: 'kriz', onClick: ukoncit })),
    h('div', { class: 'karta kviz__karta' }, plocha),
    tabula
  );
  obnovTabulu();
  ukazOtazku();
  return { el };
}
