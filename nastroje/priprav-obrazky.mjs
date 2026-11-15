// PrĂ­prava obrĂˇzkov pre appku: orezanie rĂˇmÄŤeka, odstrĂˇnenie bieleho pozadia
// (kÄľĂşÄŤovanie bielej s mĂ¤kkĂ˝m okrajom) a prevod do WebP.
// Spustenie: npm run obrazky
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const KOREN = join(dirname(fileURLToPath(import.meta.url)), '..');
const ZDROJ = join(KOREN, 'obrazky', 'originaly');
const CIEL = join(KOREN, 'public', 'obrazky');

// Rozmer pozadĂ­: obe maÄľby musia maĹĄ presne rovnakĂş veÄľkosĹĄ, aby sa dali prelĂ­naĹĄ
const SIRKA_POZADIA = 2000;
const VYSKA_POZADIA = 1000;

async function pozadie(nazov, vystup) {
  const vstup = sharp(join(ZDROJ, nazov));
  const { width, height } = await vstup.metadata();
  const okraj = 10; // tmavĂ˝ zaoblenĂ˝ rĂˇmÄŤek zo snĂ­mky obrazovky
  await sharp(join(ZDROJ, nazov))
    .extract({ left: okraj, top: okraj, width: width - 2 * okraj, height: height - 2 * okraj })
    .resize(SIRKA_POZADIA, VYSKA_POZADIA, { fit: 'cover', kernel: 'lanczos3' })
    .sharpen({ sigma: 0.6 })
    .webp({ quality: 84 })
    .toFile(join(CIEL, vystup));
  console.log('hotovo:', vystup);
}

// KÄľĂşÄŤovanie bielej: ÄŤĂ­m bliĹľĹˇie k bielej, tĂ˝m priehÄľadnejĹˇie.
// Farba okraja sa â€žodbieliâ€ś, aby nevznikol biely lem.
// KtorĂ© pixely patria k pozadiu spojenĂ©mu s okrajom obrĂˇzka (aj s Ăşzkym lemom).
// SvetlĂ© miesta vnĂştri kresby (napr. bledĂ© lupene) tak zostanĂş nepriehÄľadnĂ©.
function pozadieOdOkraja(data, sirka, vyska, prah, lem) {
  const n = sirka * vyska;
  const pozadie = new Uint8Array(n);
  const rad = new Int32Array(n);
  let zaciatok = 0;
  let koniec = 0;
  const svetle = (p) => {
    const i = p * 4;
    return Math.max(255 - data[i], 255 - data[i + 1], 255 - data[i + 2]) < prah;
  };
  const pridaj = (p) => {
    if (!pozadie[p] && svetle(p)) {
      pozadie[p] = 1;
      rad[koniec++] = p;
    }
  };
  for (let x = 0; x < sirka; x++) {
    pridaj(x);
    pridaj((vyska - 1) * sirka + x);
  }
  for (let y = 0; y < vyska; y++) {
    pridaj(y * sirka);
    pridaj(y * sirka + sirka - 1);
  }
  while (zaciatok < koniec) {
    const p = rad[zaciatok++];
    const x = p % sirka;
    if (x > 0) pridaj(p - 1);
    if (x < sirka - 1) pridaj(p + 1);
    if (p >= sirka) pridaj(p - sirka);
    if (p < n - sirka) pridaj(p + sirka);
  }
  // Lem: pixely do vzdialenosti â€žlemâ€ś od pozadia sa tieĹľ kÄľĂşÄŤujĂş (mĂ¤kkĂ˝ okraj)
  let maska = pozadie;
  for (let k = 0; k < lem; k++) {
    const dalsia = maska.slice();
    for (let p = 0; p < n; p++) {
      if (maska[p]) continue;
      const x = p % sirka;
      if ((x > 0 && maska[p - 1]) || (x < sirka - 1 && maska[p + 1]) || (p >= sirka && maska[p - sirka]) || (p < n - sirka && maska[p + sirka])) {
        dalsia[p] = 1;
      }
    }
    maska = dalsia;
  }
  return maska;
}

async function bezPozadia(nazov, vystup, { okraj = 14, vyska, len_od_okraja = false }) {
  const { width, height } = await sharp(join(ZDROJ, nazov)).metadata();
  const { data, info } = await sharp(join(ZDROJ, nazov))
    .extract({ left: okraj, top: okraj, width: width - 2 * okraj, height: height - 2 * okraj })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const DOLNA = 10; // pod touto vzdialenosĹĄou od bielej = Ăşplne priehÄľadnĂ©
  const HORNA = 46; // nad touto = Ăşplne nepriehÄľadnĂ©
  const kluc = len_od_okraja ? pozadieOdOkraja(data, info.width, info.height, 16, 3) : null;
  for (let i = 0; i < data.length; i += 4) {
    if (kluc && !kluc[i / 4]) continue; // vnĂştro kresby zostĂˇva celĂ©
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const vzdialenost = Math.max(255 - r, 255 - g, 255 - b);
    let a = (vzdialenost - DOLNA) / (HORNA - DOLNA);
    a = Math.min(1, Math.max(0, a));
    a = a * a * (3 - 2 * a); // mĂ¤kkĂ˝ prechod
    if (a > 0 && a < 1) {
      // odstrĂˇnenie bielej z polopriehÄľadnĂ˝ch okrajov
      for (let k = 0; k < 3; k++) {
        data[i + k] = Math.round(Math.min(255, Math.max(0, (data[i + k] - 255 * (1 - a)) / a)));
      }
    }
    data[i + 3] = Math.round(a * 255);
  }

  await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .trim({ threshold: 1 })
    .resize({ height: vyska, kernel: 'lanczos3', withoutEnlargement: false })
    .webp({ quality: 88, alphaQuality: 90 })
    .toFile(join(CIEL, vystup));
  const meta = await sharp(join(CIEL, vystup)).metadata();
  console.log('hotovo:', vystup, meta.width, 'x', meta.height);
}

await mkdir(CIEL, { recursive: true });
await pozadie('pust.webp', 'pust.webp');
await pozadie('zahrada.webp', 'zahrada.webp');
await bezPozadia('kvet.png', 'kvet.webp', { vyska: 900, len_od_okraja: true });
await bezPozadia('kotul.png', 'kotul.webp', { vyska: 420 });
