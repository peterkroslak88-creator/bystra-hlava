// Ukážkové snímky záhrady v rôznych denných dobách (do priečinka snimky/).
// Spustenie: npm run ukazka
import { createServer } from 'vite';
import { chromium } from 'playwright';
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const server = await createServer({ server: { port: 4180, strictPort: true }, logLevel: 'warn' });
await server.listen();
const prehliadac = await chromium.launch();
const s = await prehliadac.newPage({ viewport: { width: 1180, height: 820 } });
const chyby = [];
s.on('pageerror', (e) => chyby.push(e.message));
s.on('console', (m) => m.type() === 'error' && chyby.push(m.text()));

const pin = async (cisla) => {
  for (const c of cisla) await s.locator('.pin__klaves', { hasText: new RegExp(`^${c}$`) }).click();
  await s.waitForTimeout(900);
};
await s.goto('http://localhost:4180/');
await s.waitForSelector('h1');
await pin('135790');
await pin('135790');
await s.waitForSelector('text=Správa hráčov');
await s.locator('button', { hasText: 'Otvoriť náhľad' }).click();
await s.waitForSelector('.scena canvas');

await mkdir('snimky', { recursive: true });
const zabery = [
  ['45 dní', 'Deň'],
  ['45 dní', 'Ráno'],
  ['45 dní', 'Zlatá hodina'],
  ['45 dní', 'Večer'],
  ['15 dní', 'Deň'],
  ['0 dní', 'Deň'],
];
const casti = [];
for (const [dni, doba] of zabery) {
  await s.locator('.nahlad-dni .moznost', { hasText: new RegExp(`^${dni}$`) }).click();
  await s.locator('.nahlad-dni .moznost', { hasText: new RegExp(`^${doba}$`) }).click();
  await s.waitForTimeout(5500); // nech dobehne rozrastanie a vietor sa rozhýbe
  casti.push(await s.locator('.scena').screenshot());
}
await prehliadac.close();
await server.close();

const W = 1100;
const H = Math.round((W * 442) / 1100);
const zmensene = await Promise.all(casti.map((c) => sharp(c).resize(W, H, { fit: 'cover' }).toBuffer()));
await sharp({ create: { width: 2 * W + 60, height: 3 * (H + 20) + 20, channels: 3, background: '#e9dfc6' } })
  .composite(zmensene.map((input, i) => ({ input, left: 20 + (i % 2) * (W + 20), top: 20 + Math.floor(i / 2) * (H + 20) })))
  .jpeg({ quality: 86 })
  .toFile('snimky/zahrada-denna-doba.jpg');
console.log(chyby.length ? `CHYBY:\n${chyby.join('\n')}` : 'hotovo bez chýb');
