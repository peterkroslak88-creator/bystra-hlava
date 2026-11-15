// Prestávka po nesprávnych pokusoch o PIN.
// Počet pokusov sa pamätá v tablete (nastavenie zariadenia, nie údaj o hráčovi),
// takže sa nedá vynulovať návratom späť ani obnovením stránky.
// Po 5 nesprávnych pokusoch sa čaká 30 s, po každom ďalšom dvakrát dlhšie (najviac 15 min).
import { db } from './db.js';

export const POKUSY_ZADARMO = 5;
export const ZAKLAD_S = 30;
export const NAJVIAC_S = 15 * 60;

/**
 * Čistý výpočet: stav po ďalšom nesprávnom pokuse.
 * @param {{pocet: number, zamknuteDo: number}|undefined} stav
 */
export function poNeuspechu(stav, teraz = Date.now()) {
  const pocet = (stav?.pocet || 0) + 1;
  let zamknuteDo = 0;
  if (pocet >= POKUSY_ZADARMO) {
    const sekundy = Math.min(NAJVIAC_S, ZAKLAD_S * 2 ** (pocet - POKUSY_ZADARMO));
    zamknuteDo = teraz + sekundy * 1000;
  }
  return { pocet, zamknuteDo };
}

// Koľko sekúnd ešte treba čakať (0 = dá sa skúšať)
export function zostavaSekund(stav, teraz = Date.now()) {
  // Ochrana pred posunutím hodín tabletu dozadu: nikdy nie dlhšie než najdlhšia prestávka
  const zostava = Math.ceil(((stav?.zamknuteDo || 0) - teraz) / 1000);
  return Math.max(0, Math.min(NAJVIAC_S, zostava));
}

async function vsetky() {
  return (await db.citajNastavenie('zamky')) || {};
}

export async function cakanie(kluc) {
  return zostavaSekund((await vsetky())[kluc]);
}

// Zaznamená nesprávny pokus; vráti počet sekúnd čakania (0 = ešte sa dá skúšať)
export async function nespravnyPokus(kluc) {
  const zamky = await vsetky();
  zamky[kluc] = poNeuspechu(zamky[kluc]);
  await db.ulozNastavenie('zamky', zamky);
  return zostavaSekund(zamky[kluc]);
}

export async function spravnyPokus(kluc) {
  const zamky = await vsetky();
  if (kluc in zamky) {
    delete zamky[kluc];
    await db.ulozNastavenie('zamky', zamky);
  }
}

// Zrozumiteľný text o čakaní
export function textCakania(sekundy) {
  if (sekundy <= 45) return 'Chvíľu si oddýchnime. Skúste to znova o pol minúty.';
  const minuty = Math.ceil(sekundy / 60);
  if (minuty === 1) return 'Chvíľu si oddýchnime. Skúste to znova o minútu.';
  if (minuty <= 4) return `Chvíľu si oddýchnime. Skúste to znova o ${minuty} minúty.`;
  return `Chvíľu si oddýchnime. Skúste to znova o ${minuty} minút.`;
}
