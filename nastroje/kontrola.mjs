// Kontrola celej appky ako na iPade (na výšku aj na šírku):
// prejde všetky obrazovky, odfotí ich do priečinka snimky/ a skontroluje
// prístupnosť (veľkosť textu, kontrast, veľkosť tlačidiel, popisky).
// Na konci overí, že appka funguje aj bez internetu.
// Spustenie: npm run kontrola
import { build, preview } from 'vite';
import { chromium, devices } from 'playwright';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import sharp from 'sharp';
import { auditObrazovky } from './audit-v-prehliadaci.js';

const AUDIT = `(${auditObrazovky.toString()})()`;
const ORIENTACIE = [
  { nazov: 'na-vysku', zariadenie: devices['iPad (gen 7)'] },
  { nazov: 'na-sirku', zariadenie: devices['iPad (gen 7) landscape'] },
];

await build({ logLevel: 'warn' });
const server = await preview({ preview: { port: 4173, strictPort: true }, logLevel: 'warn' });
const ADRESA = 'http://localhost:4173/';
const prehliadac = await chromium.launch();
const vysledky = [];
let offlineOk = null;

async function kontroluj({ nazov: orientacia, zariadenie }) {
  const priecinok = `snimky/${orientacia}`;
  await rm(priecinok, { recursive: true, force: true });
  await mkdir(priecinok, { recursive: true });
  const kontext = await prehliadac.newContext({ ...zariadenie, deviceScaleFactor: 1 });
  const s = await kontext.newPage();
  const chyby = [];
  s.on('pageerror', (e) => chyby.push(e.message));

  let poradie = 0;
  const fotka = async (meno) => {
    await s.waitForTimeout(350);
    const problemy = await s.evaluate(AUDIT);
    poradie++;
    const subor = `${priecinok}/${String(poradie).padStart(2, '0')}-${meno}.jpg`;
    await s.screenshot({ path: subor, fullPage: true, type: 'jpeg', quality: 82 });
    vysledky.push({ orientacia, meno, subor, problemy });
  };
  const tlacidlo = (text) => s.locator('button', { hasText: text }).first();
  const klik = async (text) => {
    await tlacidlo(text).click();
    await s.waitForTimeout(250);
  };
  const pin = async (cisla) => {
    for (const c of cisla) await s.locator('.pin__klaves', { hasText: new RegExp(`^${c}$`) }).click();
    await s.waitForTimeout(700);
  };

  await s.goto(`${ADRESA}?bezpohybu`);
  await s.waitForSelector('h1');
  await fotka('prve-spustenie');
  await pin('135790');
  await pin('135790');
  await s.waitForSelector('text=Správa hráčov');
  await klik('Pridať ukážkového hráča');
  await fotka('personal');
  await klik('Pridať hráča');
  await fotka('novy-hrac');
  await klik('Zrušiť');

  await klik('Pripraviť kvíz');
  await fotka('kviz-nastavenie');
  await klik('Začať kvíz');
  await fotka('kviz-otazka');
  await klik('Odkryť odpoveď');
  await s.locator('.kviz__bod').first().click();
  await fotka('kviz-odpoved');
  await klik('Ukončiť kvíz');
  await klik('Áno, ukončiť');

  await klik('Otvoriť náhľad');
  await s.locator('.nahlad-dni .moznost', { hasText: '30 dní' }).click();
  await fotka('nahlad-zahrady-30-dni');
  await klik('Späť');
  await klik('Odhlásiť');
  await fotka('uvod');

  await s.locator('.hrac-karta').first().click();
  await s.waitForTimeout(300);
  await fotka('prihlasenie-pin');
  await pin('1234');
  await fotka('vyber-obtiaznosti');
  await klik('Stredná');
  await klik('Pokračovať do záhrady');
  await s.waitForTimeout(800);
  await fotka('zahrada-0-dni');

  const ulohy = [
    ['Stred a okraj', async () => {
      await klik('Ukázať obrázok');
      await s.waitForTimeout(800);
      await fotka('uloha-stred-okraj-ukazka');
      await s.waitForSelector('.volba', { timeout: 10000 });
      await fotka('uloha-stred-okraj-otazka');
    }],
    ['Pexeso', async () => fotka('uloha-pexeso')],
    ['Doplň príslovie', async () => {
      await fotka('uloha-prislovie');
      await s.locator('.volba').first().click();
      await fotka('uloha-prislovie-odozva');
    }],
    ['Poskladaj slovo', async () => fotka('uloha-slovo')],
    ['Rady čísel', async () => fotka('uloha-rady-cisel')],
    ['Čo nepatrí do skupiny', async () => fotka('uloha-co-nepatri')],
    ['Otočené tvary', async () => fotka('uloha-otocene-tvary')],
    ['Ako to bolo kedysi', async () => {
      await fotka('uloha-spomienky');
      await s.locator('.volba').first().click();
      await fotka('uloha-spomienky-odozva');
    }],
  ];
  let prva = true;
  for (const [nazov, akcia] of ulohy) {
    await klik('Zahrať si jednu oblasť');
    if (prva) await fotka('oblasti');
    await klik(nazov);
    if (prva) await fotka('uloha-uvod');
    prva = false;
    await klik('Začať úlohu');
    await akcia();
    await klik('Ukončiť úlohu');
    await klik('Áno, ukončiť');
    await s.waitForTimeout(500);
  }

  // Nákupný zoznam dohráme celý – po ňom vyrastie prvý kvet
  await klik('Zahrať si jednu oblasť');
  await klik('Nákupný zoznam');
  await klik('Začať úlohu');
  for (let kolo = 0; kolo < 2; kolo++) {
    if (kolo === 0) await fotka('uloha-nakup-zoznam');
    const zoznam = await s.locator('.zoznam-nakupu li').allInnerTexts();
    await klik('Mám to zapamätané');
    for (const polozka of zoznam) await s.locator('.volba--prepinac', { hasText: new RegExp(`^${polozka}$`) }).click();
    if (kolo === 0) await fotka('uloha-nakup-vyber');
    await klik('Hotovo');
    await klik('Ďalej');
  }
  await fotka('uloha-hotova');
  await klik('Pozrieť sa do záhrady');
  await s.waitForTimeout(1500);
  await fotka('zahrada-prvy-kvet');
  await klik('Nastavenia');
  await fotka('nastavenia');

  // Offline: appka sa musí otvoriť aj bez internetu
  if (orientacia === 'na-vysku') {
    await s.goto(ADRESA);
    await s.evaluate(() => navigator.serviceWorker?.ready);
    await s.waitForTimeout(1500);
    await kontext.setOffline(true);
    await s.reload();
    offlineOk = await s.locator('h1').first().isVisible().catch(() => false);
    await kontext.setOffline(false);
  }
  if (chyby.length) vysledky.push({ orientacia, meno: 'chyby v appke', subor: '', problemy: chyby });
  await kontext.close();
}

try {
  for (const o of ORIENTACIE) await kontroluj(o);
} finally {
  await prehliadac.close();
  await new Promise((hotovo) => server.httpServer.close(hotovo));
}

// Správa
const sProblemom = vysledky.filter((v) => v.problemy.length);
const riadky = [
  '# Kontrola appky Bystrá hlava',
  '',
  `Obrazovky skontrolované v rozlíšení iPadu (810 × 1080 na výšku a 1080 × 810 na šírku): ${vysledky.length}.`,
  `Offline režim: ${offlineOk ? 'appka sa otvorila aj bez internetu' : 'NEFUNGUJE'}.`,
  '',
  sProblemom.length ? `## Nájdené problémy (${sProblemom.length} obrazoviek)` : '## Bez problémov',
  '',
  ...sProblemom.flatMap((v) => [`### ${v.orientacia} – ${v.meno}`, ...v.problemy.map((p) => `- ${p}`), '']),
  '## Snímky',
  '',
  ...vysledky.filter((v) => v.subor).map((v) => `- ${v.orientacia}: ${v.meno} – \`${v.subor}\``),
  '',
];
await writeFile('snimky/kontrola.md', riadky.join('\n'));

// Prehľad: vybrané obrazovky vedľa seba v jednom obrázku pre každú orientáciu
const VYBER = ['uvod', 'prihlasenie-pin', 'zahrada-prvy-kvet', 'oblasti', 'uloha-uvod', 'uloha-pexeso', 'uloha-prislovie-odozva', 'uloha-otocene-tvary', 'uloha-nakup-zoznam', 'personal', 'kviz-odpoved', 'nahlad-zahrady-30-dni'];
for (const { nazov } of ORIENTACIE) {
  const snimky = VYBER.map((m) => vysledky.find((v) => v.orientacia === nazov && v.meno === m)).filter(Boolean);
  const sirka = nazov === 'na-vysku' ? 405 : 540;
  const vyska = nazov === 'na-vysku' ? 540 : 405;
  const stlpce = 4;
  const casti = await Promise.all(
    snimky.map(async (v, i) => ({
      input: await sharp(v.subor).resize(sirka, vyska, { fit: 'cover', position: 'top' }).toBuffer(),
      left: 20 + (i % stlpce) * (sirka + 20),
      top: 20 + Math.floor(i / stlpce) * (vyska + 20),
    }))
  );
  await sharp({ create: { width: 20 + stlpce * (sirka + 20), height: 20 + Math.ceil(snimky.length / stlpce) * (vyska + 20), channels: 3, background: '#e9dfc6' } })
    .composite(casti)
    .jpeg({ quality: 82 })
    .toFile(`snimky/prehlad-${nazov}.jpg`);
}
console.log(riadky.slice(0, 8 + sProblemom.reduce((n, v) => n + v.problemy.length + 2, 0)).join('\n'));
process.exit(sProblemom.length || !offlineOk ? 1 : 0);
