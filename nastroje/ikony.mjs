// Vytvorí ikony appky (na plochu iPadu a do prehliadača) z botanickej kresby levandule.
// Spustenie: npm run ikony
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { rastlinaSvg } from '../src/dizajn/rastliny.js';

const KOREN = join(dirname(fileURLToPath(import.meta.url)), '..');
const CIEL = join(KOREN, 'public', 'ikony');

// Vnútro kresby bez obalu <svg>, aby sa dala vložiť do ikony
function vnutroKresby() {
  const svg = rastlinaSvg('levandula');
  return svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
}

/**
 * @param {number} velkost
 * @param {boolean} maskovatelna  ikona pre Android/iPad s orezaním (viac voľného miesta okolo)
 */
function ikonaSvg(velkost, maskovatelna = false) {
  const mierka = maskovatelna ? 0.55 : 0.72;
  const sirkaKresby = 120 * mierka * (velkost / 160);
  const vyskaKresby = 160 * mierka * (velkost / 160);
  const x = (velkost - sirkaKresby) / 2;
  const y = (velkost - vyskaKresby) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${velkost}" height="${velkost}" viewBox="0 0 ${velkost} ${velkost}">
  <defs>
    <radialGradient id="papier" cx="35%" cy="25%" r="85%">
      <stop offset="0" stop-color="#fffaf0"/>
      <stop offset=".65" stop-color="#f3ecdb"/>
      <stop offset="1" stop-color="#e6dbbf"/>
    </radialGradient>
  </defs>
  <rect width="${velkost}" height="${velkost}" fill="url(#papier)"/>
  <svg x="${x}" y="${y}" width="${sirkaKresby}" height="${vyskaKresby}" viewBox="0 0 120 160">${vnutroKresby()}</svg>
</svg>`;
}

await mkdir(CIEL, { recursive: true });
const ikony = [
  ['ikona-192.png', 192, false],
  ['ikona-512.png', 512, false],
  ['ikona-maskovatelna-512.png', 512, true],
  ['apple-touch-icon.png', 180, false],
  ['favicon-32.png', 32, false],
];
for (const [nazov, velkost, maskovatelna] of ikony) {
  await sharp(Buffer.from(ikonaSvg(velkost, maskovatelna))).png().toFile(join(CIEL, nazov));
  console.log('hotovo:', nazov);
}
await writeFile(join(CIEL, 'ikona.svg'), ikonaSvg(512));
