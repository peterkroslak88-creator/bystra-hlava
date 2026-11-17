// Zoznam všetkých stálych textov, ktoré appka číta nahlas.
// Používa ho nástroj `npm run hlas` (nahrá ich zabudovaným hlasom) a test,
// ktorý stráži, že nahrávky nechýbajú. Súbor nesmie závisieť od obrazovky.
//
// VETY  = celé texty (rozdelia sa na vety rovnako ako pri čítaní)
// CASTI = krátke kúsky, z ktorých sa skladajú zoznamy (možnosti, čísla, slová)
import { VYSVETLIVKY } from '../texty.js';
import { OBTIAZNOSTI } from '../hra/obtiaznost.js';
import { OBLASTI } from '../hra/oblasti.js';
import { TEXTY_ULOH, POZICIE_HVIEZDY, PISMENA_TVAROV } from '../hra/texty-uloh.js';
import { PRISLOVIA, rozober } from '../hra/obsah/prislovia.js';
import { SLOVA } from '../hra/obsah/slova.js';
import { SPOMIENKY } from '../hra/obsah/spomienky.js';
import { SKUPINY, NAKUP } from '../hra/obsah/skupiny.js';
import { KVIZ } from '../hra/obsah/kviz.js';
import { otazkaRadu } from '../hra/logika.js';
import { RASTLINY } from '../dizajn/rastliny.js';
import { textZahrady, textPrekvapenia, PLNA_ZAHRADA } from '../zahrada/milniky.js';

export const UKAZKA_HLASU = 'Dobrý deň. Takto bude znieť čítanie zadaní a vysvetliviek. Prajem vám príjemnú hru.';

// Nadpisy a úvodné texty obrazoviek (rovnaké znenie ako v src/obrazovky)
const OBRAZOVKY = [
  'Dobré ráno. Dobrý deň. Dobrý večer. Ďakujeme.',
  'Ťuknite na svoj obrázok s menom.',
  'Zadajte, prosím, svoj PIN.',
  'Vitajte v Bystrej hlave. Na začiatok si personál nastaví svoj PIN. Bude ho potrebovať na správu hráčov.',
  'Vstup pre personál. Zadajte PIN personálu (6 číslic).',
  'Akú hru si zvolíte? Vyberte jednu možnosť. Neskôr ju môžete kedykoľvek zmeniť v Nastaveniach.',
  'Nastavenia. Zmena sa uloží hneď po ťuknutí.',
  'Vyberte si, čo si zahráte. Každú oblasť si môžete zahrať aj samostatne.',
  'Správa hráčov. Tu pridávate hráčov, meníte ich nastavenia a spúšťate skupinový kvíz.',
  'Náhľad záhrady. Na predvádzanie hry. Nič sa tu neukladá.',
  'Skupinový kvíz. Nastavte tímy a spustite kvíz. Body sa nikam neukladajú.',
  'V záhrade dnes pribudol ďalší kúsok.',
  'Úloha je hotová. Ďakujeme za hru.',
  'Dnešný tréning je hotový. Vaša záhrada sa teší.',
  'Úloha je hotová. Môžete si chvíľku oddýchnuť.',
  UKAZKA_HLASU,
];

// Texty vo vnútri úloh (rovnaké znenie ako v src/hra/ulohy)
const V_ULOHACH = [
  'Správne! Nevadí.',
  'Ktorý obrázok bol v strede? Kde na okraji bola hviezda?',
  'Kolo 1 zo 4. Kolo 2 zo 4. Kolo 3 zo 4. Kolo 4 zo 4.',
  ...POZICIE_HVIEZDY.map((p) => `Hviezda bola ${p}.`),
  'Našli ste všetky dvojice.',
  'Ťuknite na všetko, čo bolo v nákupnom zozname. Potom ťuknite na Hotovo.',
  'Kúpili ste všetko zo zoznamu.',
  ...PISMENA_TVAROV.map((p) => `Správny je tvar ${p} – je len otočený. Ostatné sú obrátené ako v zrkadle.`),
];

export function zoznamNaNahratie() {
  const vety = [...OBRAZOVKY, ...V_ULOHACH];
  const casti = ['Možnosti', 'V zozname je', 'V zozname bolo', 'Rad', 'Odpoveď', 'Nápoveda', 'Hľadané slovo', 'V strede bol obrázok', 'Ďalej pokračuje číslo'];

  // Vysvetlivky „i“
  for (const v of Object.values(VYSVETLIVKY)) vety.push(`${v.nazov}. ${v.text}`);
  for (const o of Object.values(OBTIAZNOSTI)) vety.push(`Obťažnosť ${o.nazov}. ${o.vysvetlivka}`);
  for (const o of OBLASTI) vety.push(`${o.nazov}. ${o.vysvetlivka}`);

  // Úlohy: názov a zadanie
  for (const u of Object.values(TEXTY_ULOH)) vety.push(`${u.nazov}. ${u.zadanie}`);

  // Záhrada: texty pre každý počet dní
  for (let d = 0; d <= PLNA_ZAHRADA; d++) vety.push(`${textZahrady(d)} ${textPrekvapenia(d)}`);

  // Príslovia: s medzerou aj celé
  for (const p of PRISLOVIA) {
    const r = rozober(p);
    vety.push(`${r.pred} … ${r.za}`);
    vety.push(`Celé príslovie: ${r.cele}`);
    casti.push(r.slovo);
  }

  // Skladanie slov
  for (const s of SLOVA) {
    casti.push(s.slovo, s.napoveda);
    vety.push(`Slovo začína na písmeno ${s.slovo[0].toLocaleUpperCase('sk')}.`);
  }

  // Rady čísel: všetky popisy pravidiel a čísla
  for (let uroven = 1; uroven <= 10; uroven++) {
    for (let i = 0; i < 300; i++) vety.push(otazkaRadu(uroven, 3).popis);
  }
  for (let n = 0; n <= 300; n++) casti.push(String(n));

  // Čo nepatrí do skupiny
  for (const s of Object.values(SKUPINY)) {
    vety.push(`Ostatné patria medzi ${s.medzi}.`);
    for (const slovo of s.slova) {
      casti.push(slovo);
      vety.push(`Slovo ${slovo} patrí medzi ${s.medzi}.`);
    }
  }

  // Nákup, rastliny, miesta hviezdy, tvary
  casti.push(...NAKUP, ...RASTLINY.map((r) => r.nazov), ...POZICIE_HVIEZDY);
  for (const p of PISMENA_TVAROV) casti.push(`tvar ${p}`, p);

  // Spomienky a kvíz
  for (const s of SPOMIENKY) {
    vety.push(s.otazka);
    casti.push(...s.moznosti);
    if (s.rozhovor) vety.push(`Na rozhovor: ${s.rozhovor}`);
  }
  for (const q of KVIZ) {
    vety.push(q.otazka);
    casti.push(...q.moznosti);
  }

  return { vety: [...new Set(vety)], casti: [...new Set(casti)] };
}
