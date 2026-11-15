// Záloha a obnova údajov (súbor JSON, ktorý si personál uloží do tabletu).
// Záloha obsahuje len povolené údaje (pozri CLAUDE.md, bod 2).
import { db } from './db.js';
import { ocistiHraca, dnesnyDen, MAX_DLZKA_MENA } from './hraci.js';
import { jePlatnyOdtlacok } from './pin.js';
import { ID_RASTLIN } from '../dizajn/rastliny.js';
import { KLUCE_OBTIAZNOSTI, TYPY_ULOH, vRozsahu } from '../hra/obtiaznost.js';

export const ZNACKA_ZALOHY = 'bystra-hlava-zaloha';
export const VERZIA_ZALOHY = 1;

const HEX = /^[0-9a-f]+$/;
const DEN = /^\d{4}-\d{2}-\d{2}$/;

export async function vytvorZalohu() {
  const hraci = (await db.vsetciHraci()).map(ocistiHraca);
  return {
    znacka: ZNACKA_ZALOHY,
    verzia: VERZIA_ZALOHY,
    den: dnesnyDen(),
    personalPin: (await db.citajNastavenie('personalPin')) ?? null,
    dniUpozornenia: (await db.citajNastavenie('dniUpozornenia')) ?? null,
    hraci,
  };
}

export function nazovSuboru(den = dnesnyDen()) {
  return `bystra-hlava-zaloha-${den}.json`;
}

function chyba() {
  return new Error('Tento súbor nie je záloha appky Bystrá hlava alebo je poškodený.');
}

function overPin(p) {
  return p && typeof p.pinSol === 'string' && p.pinSol.length <= 128 && HEX.test(p.pinSol) && jePlatnyOdtlacok(p.pinHash);
}

// Skontroluje a vyčistí jedného hráča zo zálohy
function overHraca(h) {
  if (!h || typeof h !== 'object') throw chyba();
  const c = ocistiHraca(h);
  if (typeof c.id !== 'string' || !c.id) throw chyba();
  if (typeof c.meno !== 'string' || !c.meno.trim() || c.meno.length > MAX_DLZKA_MENA) throw chyba();
  if (!ID_RASTLIN.includes(c.rastlina)) throw chyba();
  if (!overPin(c)) throw chyba();
  if (!Array.isArray(c.dniHrania) || !c.dniHrania.every((d) => typeof d === 'string' && DEN.test(d))) throw chyba();
  c.dniHrania = [...new Set(c.dniHrania)].sort();
  if (c.obtiaznost != null && !KLUCE_OBTIAZNOSTI.includes(c.obtiaznost)) throw chyba();
  c.obtiaznost = c.obtiaznost ?? null;
  c.jemnyRezim = Boolean(c.jemnyRezim);
  const urovne = {};
  if (c.obtiaznost && c.urovne && typeof c.urovne === 'object') {
    for (const typ of TYPY_ULOH) {
      if (Number.isFinite(c.urovne[typ])) urovne[typ] = vRozsahu(c.urovne[typ], c.obtiaznost);
    }
  }
  c.urovne = urovne;
  return c;
}

/**
 * Overí obsah zálohy. Vráti vyčistené údaje alebo vyhodí zrozumiteľnú chybu.
 * @param {string} text  obsah súboru
 */
export function overZalohu(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw chyba();
  }
  if (!data || data.znacka !== ZNACKA_ZALOHY || data.verzia !== VERZIA_ZALOHY || !Array.isArray(data.hraci)) throw chyba();
  const hraci = data.hraci.map(overHraca);
  if (new Set(hraci.map((h) => h.id)).size !== hraci.length) throw chyba();
  const personalPin = overPin(data.personalPin) ? { pinSol: data.personalPin.pinSol, pinHash: data.personalPin.pinHash } : null;
  const dni = Number(data.dniUpozornenia);
  return {
    den: typeof data.den === 'string' && DEN.test(data.den) ? data.den : null,
    personalPin,
    dniUpozornenia: Number.isInteger(dni) && dni >= 1 && dni <= 60 ? dni : null,
    hraci,
  };
}

// Nahradí všetky údaje v tablete údajmi zo zálohy
export async function obnovZalohu(overene) {
  await db.vymazVsetko();
  if (overene.personalPin) await db.ulozNastavenie('personalPin', overene.personalPin);
  if (overene.dniUpozornenia) await db.ulozNastavenie('dniUpozornenia', overene.dniUpozornenia);
  for (const hrac of overene.hraci) await db.ulozHraca(hrac);
}

export function vymazVsetkyUdaje() {
  return db.vymazVsetko();
}
