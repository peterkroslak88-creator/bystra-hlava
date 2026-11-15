// Hráči a personál. Ukladajú sa IBA povolené údaje (pozri CLAUDE.md, bod 2).
import { db } from './db.js';
import { zabezpecPin, overPin, jePlatnyPin } from './pin.js';
import { ID_RASTLIN } from '../dizajn/rastliny.js';
import { KLUCE_OBTIAZNOSTI, zaciatocneUrovne, vRozsahu, OBTIAZNOSTI } from '../hra/obtiaznost.js';

// Jediné polia, ktoré smie mať záznam hráča
export const POVOLENE_POLIA = Object.freeze([
  'id', // technický identifikátor
  'meno', // prezývka alebo krstné meno
  'rastlina', // botanický obrázok profilu
  'pinHash', // odtlačok PIN
  'pinSol', // soľ k odtlačku
  'dniHrania', // zoznam dní, keď hral (RRRR-MM-DD)
  'obtiaznost', // lahka / stredna / narocna / null (vyberie si sám)
  'jemnyRezim', // áno / nie
  'urovne', // aktuálna úroveň jednotlivých úloh (nastavenie hry)
]);

export const MAX_DLZKA_MENA = 24;
export const PIN_PERSONALU_DLZKA = 6;

// Odstráni všetko, čo nie je povolené
export function ocistiHraca(zaznam) {
  const cisty = {};
  for (const pole of POVOLENE_POLIA) {
    if (pole in zaznam) cisty[pole] = zaznam[pole];
  }
  return cisty;
}

export function dnesnyDen(datum = new Date()) {
  const r = datum.getFullYear();
  const m = String(datum.getMonth() + 1).padStart(2, '0');
  const d = String(datum.getDate()).padStart(2, '0');
  return `${r}-${m}-${d}`;
}

function skontrolujMeno(meno) {
  const upravene = String(meno ?? '').trim().replace(/\s+/g, ' ');
  if (!upravene) throw new Error('Napíšte, prosím, meno alebo prezývku.');
  if (upravene.length > MAX_DLZKA_MENA) throw new Error(`Meno môže mať najviac ${MAX_DLZKA_MENA} znakov.`);
  return upravene;
}

function skontrolujRastlinu(rastlina) {
  if (!ID_RASTLIN.includes(rastlina)) throw new Error('Vyberte, prosím, obrázok.');
  return rastlina;
}

function skontrolujObtiaznost(obtiaznost) {
  if (obtiaznost == null || obtiaznost === '') return null;
  if (!KLUCE_OBTIAZNOSTI.includes(obtiaznost)) throw new Error('Neznáma obťažnosť.');
  return obtiaznost;
}

// ---------- Hráči ----------

export async function zoznamHracov() {
  const hraci = await db.vsetciHraci();
  return hraci.sort((a, b) => a.meno.localeCompare(b.meno, 'sk'));
}

export function nacitajHraca(id) {
  return db.hrac(id);
}

export async function vytvorHraca({ meno, rastlina, pin, obtiaznost = null, jemnyRezim = false }) {
  if (!jePlatnyPin(pin, 4)) throw new Error('PIN musí mať presne 4 číslice.');
  const obt = skontrolujObtiaznost(obtiaznost);
  const hrac = ocistiHraca({
    id: crypto.randomUUID(),
    meno: skontrolujMeno(meno),
    rastlina: skontrolujRastlinu(rastlina),
    ...(await zabezpecPin(pin)),
    dniHrania: [],
    obtiaznost: obt,
    jemnyRezim: Boolean(jemnyRezim),
    urovne: obt ? zaciatocneUrovne(obt) : {},
  });
  await db.ulozHraca(hrac);
  return hrac;
}

// Úprava hráča. Prázdny PIN = PIN sa nemení.
export async function upravHraca(id, zmeny) {
  const povodny = await db.hrac(id);
  if (!povodny) throw new Error('Hráč sa nenašiel.');
  const novy = { ...povodny };
  if ('meno' in zmeny) novy.meno = skontrolujMeno(zmeny.meno);
  if ('rastlina' in zmeny) novy.rastlina = skontrolujRastlinu(zmeny.rastlina);
  if ('jemnyRezim' in zmeny) novy.jemnyRezim = Boolean(zmeny.jemnyRezim);
  if ('obtiaznost' in zmeny) {
    const obt = skontrolujObtiaznost(zmeny.obtiaznost);
    if (obt !== povodny.obtiaznost) {
      novy.obtiaznost = obt;
      novy.urovne = obt ? zaciatocneUrovne(obt) : {};
    }
  }
  if (zmeny.pin) {
    if (!jePlatnyPin(zmeny.pin, 4)) throw new Error('PIN musí mať presne 4 číslice.');
    Object.assign(novy, await zabezpecPin(zmeny.pin));
  }
  const cisty = ocistiHraca(novy);
  await db.ulozHraca(cisty);
  return cisty;
}

// Uloží novú úroveň jednej úlohy (v rozsahu obťažnosti)
export async function nastavUroven(id, typUlohy, uroven) {
  const hrac = await db.hrac(id);
  if (!hrac?.obtiaznost) return;
  hrac.urovne = { ...hrac.urovne, [typUlohy]: vRozsahu(uroven, hrac.obtiaznost) };
  await db.ulozHraca(ocistiHraca(hrac));
}

export async function zaznamenajDenHrania(id, den = dnesnyDen()) {
  const hrac = await db.hrac(id);
  if (!hrac) return null;
  if (!hrac.dniHrania.includes(den)) {
    hrac.dniHrania = [...hrac.dniHrania, den].sort();
    await db.ulozHraca(ocistiHraca(hrac));
  }
  return hrac;
}

export function vymazHraca(id) {
  return db.vymazHraca(id);
}

export async function overPinHraca(id, pin) {
  const hrac = await db.hrac(id);
  return hrac ? overPin(pin, hrac) : false;
}

export async function pridajUkazkovehoHraca() {
  const hraci = await db.vsetciHraci();
  let meno = 'Ukážka';
  let poradie = 2;
  while (hraci.some((h) => h.meno === meno)) meno = `Ukážka ${poradie++}`;
  return vytvorHraca({ meno, rastlina: 'ruza', pin: '1234' });
}

// Koľko dní hral a kedy naposledy (iba toto vidí personál)
export function prehladHrania(hrac) {
  const dni = hrac.dniHrania || [];
  return { pocetDni: dni.length, naposledy: dni.length ? dni[dni.length - 1] : null };
}

export function popisObtiaznosti(hrac) {
  return hrac.obtiaznost ? OBTIAZNOSTI[hrac.obtiaznost].nazov : 'vyberie si pri prvom prihlásení';
}

// ---------- Personál ----------

export async function maPersonalPin() {
  return Boolean(await db.citajNastavenie('personalPin'));
}

export async function nastavPersonalPin(pin) {
  if (!jePlatnyPin(pin, PIN_PERSONALU_DLZKA)) throw new Error('PIN personálu musí mať 6 číslic.');
  await db.ulozNastavenie('personalPin', await zabezpecPin(pin));
}

export async function overPersonalPin(pin) {
  return overPin(pin, await db.citajNastavenie('personalPin'));
}
