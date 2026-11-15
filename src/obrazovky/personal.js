// Správa hráčov pre personál. Personál vidí iba počet dní a kedy hráč naposledy hral.
import { h } from '../dom.js';
import { hlavicka, nadpis, tlacidlo, obrazokRastliny, citatelnyDatum, slovoDni } from '../komponenty/spolocne.js';
import { info } from '../komponenty/info.js';
import { potvrdenie } from '../komponenty/potvrdenie.js';
import { VYSVETLIVKY } from '../texty.js';
import {
  zoznamHracov,
  prehladHrania,
  popisObtiaznosti,
  pridajUkazkovehoHraca,
  dniUpozornenia,
  nastavDniUpozornenia,
  hraciNaUpozornenie,
  maPersonalPin,
} from '../ulozisko/hraci.js';
import { vytvorZalohu, nazovSuboru, overZalohu, obnovZalohu, vymazVsetkyUdaje } from '../ulozisko/zaloha.js';
import { odhlas } from '../relacia.js';
import { vyberHlasu } from '../komponenty/vyber-hlasu.js';
import { prejdi } from '../navigacia.js';

// Karta so sekciou: nadpis, vysvetlivka „i“ a obsah
function sekcia(nazov, vysvetlivka, ...obsah) {
  return h(
    'section',
    { class: 'sekcia' },
    h(
      'div',
      { class: 'karta stlpec' },
      h('div', { class: 'riadok', style: 'gap: 4px' }, h('h2', {}, nazov), vysvetlivka ? info(vysvetlivka.nazov, vysvetlivka.text) : null),
      ...obsah
    )
  );
}

export async function personal({ sprava = '' } = {}) {
  const hraci = await zoznamHracov();
  let pocetDni = await dniUpozornenia();

  const oznam = h('p', { class: 'oznam', role: 'status', 'aria-live': 'polite' }, sprava);

  async function pridajUkazku() {
    const hrac = await pridajUkazkovehoHraca();
    prejdi('personal', { sprava: `Pridaný ukážkový hráč „${hrac.meno}“ s PIN 1234.` });
  }

  // ---------- Upozornenia ----------
  const obsahUpozorneni = h('div', { class: 'stlpec', style: 'gap: 12px', 'aria-live': 'polite' });
  function obnovUpozornenia() {
    const { dlhoBezHry, zatialNehrali } = hraciNaUpozornenie(hraci, pocetDni);
    const casti = [];
    if (dlhoBezHry.length) {
      casti.push(h('p', { class: 'upozornenie__nadpis' }, `Hráč sa ${pocetDni} ${slovoDni(pocetDni)} alebo dlhšie nezapojil do hry:`));
      casti.push(
        h(
          'ul',
          { class: 'upozornenia', role: 'list' },
          dlhoBezHry.map(({ hrac, dni, naposledy }) =>
            h(
              'li',
              { class: 'upozornenie' },
              obrazokRastliny(hrac.rastlina, 'upozornenie__obrazok'),
              h('span', {}, h('strong', {}, hrac.meno), ` – bez hry ${dni} ${slovoDni(dni)}, naposledy ${citatelnyDatum(naposledy)}`)
            )
          )
        )
      );
    } else if (hraci.length) {
      casti.push(h('p', {}, `Všetci, ktorí už hrali, sa zapojili do hry počas posledných ${pocetDni} ${slovoDni(pocetDni)}.`));
    } else {
      casti.push(h('p', { class: 'jemny-text' }, 'Zatiaľ tu nie sú žiadni hráči.'));
    }
    if (zatialNehrali.length) {
      casti.push(h('p', { class: 'jemny-text' }, `Zatiaľ nehrali: ${zatialNehrali.map((x) => x.meno).join(', ')}.`));
    }
    obsahUpozorneni.replaceChildren(...casti);
  }
  obnovUpozornenia();

  const hodnotaDni = h('span', { class: 'pocitadlo__hodnota', 'aria-live': 'polite' });
  function zobrazDni() {
    hodnotaDni.textContent = `${pocetDni} ${slovoDni(pocetDni)}`;
  }
  zobrazDni();
  async function zmenDni(o) {
    pocetDni = await nastavDniUpozornenia(pocetDni + o);
    zobrazDni();
    obnovUpozornenia();
  }

  // ---------- Záloha a obnova ----------
  const stavZalohy = h('p', { class: 'oznam', role: 'status', 'aria-live': 'polite' });
  async function ulozZalohu() {
    const data = await vytvorZalohu();
    const subor = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const adresa = URL.createObjectURL(subor);
    const odkaz = h('a', { href: adresa, download: nazovSuboru(), style: 'display:none' });
    document.body.append(odkaz);
    odkaz.click();
    odkaz.remove();
    setTimeout(() => URL.revokeObjectURL(adresa), 10000);
    stavZalohy.textContent = `Záloha je pripravená ako súbor ${nazovSuboru()}. Na iPade ho nájdete v aplikácii Súbory.`;
  }

  const vyberSuboru = h('input', { type: 'file', accept: '.json,application/json', class: 'skryte', id: 'subor-zalohy', tabindex: '-1' });
  vyberSuboru.addEventListener('change', async () => {
    const subor = vyberSuboru.files?.[0];
    vyberSuboru.value = '';
    if (!subor) return;
    let overene;
    try {
      overene = overZalohu(await subor.text());
    } catch (chyba) {
      stavZalohy.textContent = chyba.message;
      return;
    }
    const ano = await potvrdenie({
      nadpis: 'Obnoviť údaje zo zálohy?',
      text: `Záloha${overene.den ? ` z ${citatelnyDatum(overene.den)}` : ''} obsahuje ${overene.hraci.length} ${overene.hraci.length === 1 ? 'hráča' : 'hráčov'}. Všetky súčasné údaje v tomto tablete sa nahradia. ${overene.personalPin ? 'Platiť bude PIN personálu zo zálohy. ' : ''}Tento krok sa nedá vrátiť.`,
      ano: 'Áno, obnoviť',
      nie: 'Nechať tak',
    });
    if (!ano) return;
    await obnovZalohu(overene);
    odhlas();
    if (await maPersonalPin()) prejdi('uvod', { sprava: 'Údaje zo zálohy sú obnovené.' });
    else prejdi('prvySpustenie');
  });

  async function vymazVsetko() {
    const ano = await potvrdenie({
      nadpis: 'Vymazať všetky údaje?',
      text: 'Vymažú sa všetci hráči, ich záhrady, nastavenia aj PIN personálu. Ak nemáte zálohu, údaje sa už nedajú vrátiť.',
      ano: 'Áno, vymazať všetko',
      nie: 'Nechať tak',
    });
    if (!ano) return;
    await vymazVsetkyUdaje();
    odhlas();
    prejdi('prvySpustenie');
  }

  const vyberHlasuEl = await vyberHlasu();

  // ---------- Zoznam hráčov ----------
  const zoznam = hraci.length
    ? h(
        'ul',
        { class: 'zoznam-hracov', role: 'list' },
        hraci.map((hrac) => {
          const { pocetDni: dni, naposledy } = prehladHrania(hrac);
          return h(
            'li',
            { class: 'karta hrac-riadok' },
            obrazokRastliny(hrac.rastlina, 'hrac-riadok__obrazok'),
            h(
              'div',
              {},
              h('p', { class: 'hrac-riadok__meno' }, hrac.meno),
              h('p', { class: 'jemny-text' }, `Dni v hre: ${dni} · naposledy: ${citatelnyDatum(naposledy)}`),
              h('p', { class: 'jemny-text' }, `Obťažnosť: ${popisObtiaznosti(hrac)}${hrac.jemnyRezim ? ' · jemný režim' : ''}`)
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
    nadpis('Správa hráčov', { podnadpis: 'Tu pridávate hráčov, meníte ich nastavenia a spúšťate skupinový kvíz.' }),
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

    sekcia(
      'Upozornenia',
      VYSVETLIVKY.upozornenia,
      obsahUpozorneni,
      h(
        'div',
        { class: 'pocitadlo', role: 'group', 'aria-label': 'Po koľkých dňoch upozorniť' },
        h('span', { class: 'pole__nazov' }, 'Upozorniť po'),
        tlacidlo('O deň menej', { druh: 'male', onClick: () => zmenDni(-1) }),
        hodnotaDni,
        tlacidlo('O deň viac', { druh: 'male', onClick: () => zmenDni(1) })
      )
    ),

    h('section', { class: 'sekcia', 'aria-label': 'Hráči' }, h('h2', {}, 'Hráči'), zoznam),

    sekcia(
      'Skupinový kvíz',
      VYSVETLIVKY.kviz,
      h('p', { class: 'jemny-text' }, '10 otázok pre 2 až 4 tímy. Najlepšie na projektor alebo veľkú obrazovku.'),
      h('div', {}, tlacidlo('Pripraviť kvíz', { druh: 'zakladne', ikonka: 'sipka', onClick: () => prejdi('kvizNastavenie') }))
    ),

    sekcia(
      'Náhľad záhrady',
      VYSVETLIVKY.nahladZahrady,
      h('p', { class: 'jemny-text' }, 'Ukáže, ako záhrada rastie po 0 až 45 dňoch tréningu.'),
      h('div', {}, tlacidlo('Otvoriť náhľad', { ikonka: 'lista', onClick: () => prejdi('nahladZahrady') }))
    ),

    sekcia('Hlas na čítanie', VYSVETLIVKY.hlas, vyberHlasuEl.el),

    sekcia(
      'Záloha a obnova',
      VYSVETLIVKY.zaloha,
      h('p', { class: 'jemny-text' }, 'Zálohu odporúčame robiť pravidelne, napríklad raz týždenne.'),
      h(
        'div',
        { class: 'riadok' },
        tlacidlo('Uložiť zálohu do súboru', { ikonka: 'sipka', onClick: ulozZalohu }),
        tlacidlo('Nahrať zálohu zo súboru', { ikonka: 'plus', onClick: () => vyberSuboru.click() }),
        vyberSuboru
      ),
      stavZalohy
    ),

    sekcia(
      'Čo appka ukladá',
      VYSVETLIVKY.coUklada,
      h(
        'ul',
        { class: 'zoznam-bodky' },
        h('li', {}, 'prezývku alebo krstné meno a obrázok profilu,'),
        h('li', {}, 'PIN v zabezpečenej podobe, z ktorej sa nedá prečítať,'),
        h('li', {}, 'dni, keď hráč hral,'),
        h('li', {}, 'obťažnosť, jemný režim a úroveň úloh (nastavenia hry).')
      ),
      h('p', { class: 'jemny-text' }, 'Odpovede z úloh sa neukladajú. Všetko zostáva len v tomto tablete.')
    ),

    sekcia(
      'Vymazanie údajov',
      VYSVETLIVKY.vymazanie,
      h('p', { class: 'jemny-text' }, 'Vymaže všetko a appka začne odznova. Jedného hráča vymažete cez Upraviť.'),
      h('div', {}, tlacidlo('Vymazať všetky údaje', { druh: 'nebezpecne', ikonka: 'kos', onClick: vymazVsetko }))
    )
  );
  return { el, zrus: vyberHlasuEl.zrus };
}
