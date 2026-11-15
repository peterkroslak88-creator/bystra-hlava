// Testy zabezpečenia: pomalý odtlačok PIN, prevod starých záznamov,
// prestávka po nesprávnych pokusoch a poistka CSP.
import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pbkdf2Sync } from 'node:crypto';
import { db } from '../src/ulozisko/db.js';
import { odtlacokPinu, pomalyOdtlacok, overPin, jePlatnyOdtlacok, jeStaryOdtlacok, OPAKOVANIA } from '../src/ulozisko/pin.js';
import { vytvorHraca, nacitajHraca, overPinHraca, overPersonalPin, vymazHraca } from '../src/ulozisko/hraci.js';
import { poNeuspechu, zostavaSekund, cakanie, nespravnyPokus, spravnyPokus, POKUSY_ZADARMO, NAJVIAC_S } from '../src/ulozisko/zamok.js';
import { overZalohu, vytvorZalohu } from '../src/ulozisko/zaloha.js';

beforeEach(async () => {
  await db.vymazVsetko();
});

describe('pomalý odtlačok PIN', () => {
  it('je PBKDF2-SHA-256 s aspoň 200 000 opakovaniami', async () => {
    expect(OPAKOVANIA).toBeGreaterThanOrEqual(200000);
    const ocakavany = pbkdf2Sync('1234', 'abc', OPAKOVANIA, 32, 'sha256').toString('hex');
    expect(await pomalyOdtlacok('1234', 'abc')).toBe(`p2$${OPAKOVANIA}$${ocakavany}`);
  });

  it('starý záznam (SHA-256) sa stále overí', async () => {
    const stary = { pinSol: 'abcd', pinHash: await odtlacokPinu('2580', 'abcd') };
    expect(jeStaryOdtlacok(stary)).toBe(true);
    expect(await overPin('2580', stary)).toBe(true);
    expect(await overPin('2581', stary)).toBe(false);
  });

  it('starý záznam hráča sa pri správnom PIN prevedie na nový', async () => {
    const hrac = await vytvorHraca({ meno: 'Anna', rastlina: 'mak', pin: '1111' });
    await db.ulozHraca({ ...hrac, pinSol: 'abcd', pinHash: await odtlacokPinu('1111', 'abcd') });
    expect(await overPinHraca(hrac.id, '9999')).toBe(false);
    expect(jeStaryOdtlacok(await nacitajHraca(hrac.id))).toBe(true);
    expect(await overPinHraca(hrac.id, '1111')).toBe(true);
    expect(jeStaryOdtlacok(await nacitajHraca(hrac.id))).toBe(false);
    expect(await overPinHraca(hrac.id, '1111')).toBe(true);
  });

  it('starý PIN personálu sa prevedie tiež', async () => {
    await db.ulozNastavenie('personalPin', { pinSol: 'ef01', pinHash: await odtlacokPinu('135790', 'ef01') });
    expect(await overPersonalPin('135790')).toBe(true);
    expect(jeStaryOdtlacok(await db.citajNastavenie('personalPin'))).toBe(false);
    expect(await overPersonalPin('135790')).toBe(true);
  });

  it('pozná len platné tvary odtlačku', () => {
    expect(jePlatnyOdtlacok('a'.repeat(64))).toBe(true);
    expect(jePlatnyOdtlacok(`p2$200000$${'a'.repeat(64)}`)).toBe(true);
    expect(jePlatnyOdtlacok(`p2$1$${'a'.repeat(64)}`)).toBe(false); // príliš málo opakovaní
    expect(jePlatnyOdtlacok(`p2$99999999$${'a'.repeat(64)}`)).toBe(false); // zasekol by tablet
    expect(jePlatnyOdtlacok('1234')).toBe(false);
    expect(jePlatnyOdtlacok(null)).toBe(false);
  });

  it('záloha s novým aj starým odtlačkom prejde kontrolou, s upraveným nie', async () => {
    await vytvorHraca({ meno: 'Eva', rastlina: 'ruza', pin: '1357' });
    const zaloha = await vytvorZalohu();
    expect(overZalohu(JSON.stringify(zaloha)).hraci).toHaveLength(1);
    zaloha.hraci[0].pinHash = 'a'.repeat(64);
    expect(overZalohu(JSON.stringify(zaloha)).hraci).toHaveLength(1);
    zaloha.hraci[0].pinHash = 'p2$5$abc';
    expect(() => overZalohu(JSON.stringify(zaloha))).toThrow();
  });
});

describe('prestávka po nesprávnych pokusoch', () => {
  it('prvé štyri pokusy sú bez čakania, piaty zamkne na 30 s', () => {
    let stav;
    for (let i = 1; i < POKUSY_ZADARMO; i++) {
      stav = poNeuspechu(stav, 0);
      expect(zostavaSekund(stav, 0)).toBe(0);
    }
    stav = poNeuspechu(stav, 0);
    expect(zostavaSekund(stav, 0)).toBe(30);
  });

  it('každý ďalší pokus čakanie zdvojnásobí, najviac na 15 minút', () => {
    let stav = { pocet: POKUSY_ZADARMO, zamknuteDo: 0 };
    stav = poNeuspechu(stav, 0);
    expect(zostavaSekund(stav, 0)).toBe(60);
    stav = poNeuspechu(stav, 0);
    expect(zostavaSekund(stav, 0)).toBe(120);
    for (let i = 0; i < 20; i++) stav = poNeuspechu(stav, 0);
    expect(zostavaSekund(stav, 0)).toBe(NAJVIAC_S);
  });

  it('posunutie hodín tabletu nepredĺži čakanie nad 15 minút', () => {
    expect(zostavaSekund({ pocet: 9, zamknuteDo: 10 ** 12 }, 0)).toBe(NAJVIAC_S);
  });

  it('počítadlo je uložené v tablete a správny PIN ho vynuluje', async () => {
    for (let i = 0; i < POKUSY_ZADARMO; i++) await nespravnyPokus('personal');
    expect(await cakanie('personal')).toBeGreaterThan(0);
    expect(await cakanie('hrac:iny')).toBe(0);
    expect((await db.citajNastavenie('zamky')).personal.pocet).toBe(POKUSY_ZADARMO);
    await spravnyPokus('personal');
    expect(await cakanie('personal')).toBe(0);
  });

  it('vymazanie hráča zmaže aj jeho počítadlo', async () => {
    const hrac = await vytvorHraca({ meno: 'Ján', rastlina: 'mak', pin: '5555' });
    await nespravnyPokus(`hrac:${hrac.id}`);
    await vymazHraca(hrac.id);
    expect((await db.citajNastavenie('zamky'))[`hrac:${hrac.id}`]).toBeUndefined();
  });
});

describe('poistka CSP', () => {
  const html = readFileSync(join(import.meta.dirname, '..', 'index.html'), 'utf8');
  const csp = html.match(/Content-Security-Policy"\s+content="([^"]+)"/)?.[1] ?? '';

  it('povoľuje spojenie a skripty len z vlastnej adresy appky', () => {
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain("connect-src 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("form-action 'none'");
  });

  it('nepovoľuje cudzie adresy ani nebezpečné výnimky pre skripty', () => {
    expect(csp).not.toMatch(/https?:|\*/);
    expect(csp.match(/script-src[^;]*/)[0]).not.toMatch(/unsafe-inline|unsafe-eval/);
  });
});
