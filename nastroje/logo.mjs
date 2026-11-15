// Balík loga Care Orbit pre všetky aplikácie: priečinok logo/
//  - znak (len kresba) ako SVG v oboch verziách,
//  - celé logo (znak + nápis) ako PNG v oboch verziách, s priehľadným pozadím,
//  - ukážka originálu na tmavom podklade.
// Nápis sa vykreslí presne písmom Cormorant Garamond (prehliadač Chromium cez Playwright).
// Spustenie: npm run logo
import { chromium } from 'playwright';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { znakSvg, FARBY_LOGA } from '../src/dizajn/logo.js';

const KOREN = join(dirname(fileURLToPath(import.meta.url)), '..');
const CIEL = join(KOREN, 'logo');
await mkdir(CIEL, { recursive: true });

// Písmo vložené priamo do stránky, aby nápis vyzeral všade rovnako
const pismo = async (subor) =>
  (await readFile(join(KOREN, 'node_modules', '@fontsource', 'cormorant-garamond', 'files', subor))).toString('base64');
const regular = await pismo('cormorant-garamond-latin-500-normal.woff2');
const kurziva = await pismo('cormorant-garamond-latin-500-italic.woff2').catch(() => pismo('cormorant-garamond-latin-600-italic.woff2'));

function stranka(variant, pozadie) {
  const f = FARBY_LOGA[variant];
  return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:C;font-style:normal;src:url(data:font/woff2;base64,${regular}) format('woff2')}
@font-face{font-family:C;font-style:italic;src:url(data:font/woff2;base64,${kurziva}) format('woff2')}
html,body{margin:0;background:${pozadie}}
.logo{display:inline-flex;align-items:center;gap:56px;padding:48px 64px;font-family:C;font-size:150px;line-height:1}
.logo svg{width:190px;height:190px}
.care{color:${f.care}} .orbit{color:${f.orbit};font-style:italic}
</style></head><body><div class="logo">${znakSvg(variant)}<span><span class="care">Care</span> <span class="orbit">Orbit</span></span></div></body></html>`;
}

const prehliadac = await chromium.launch();
const strana = await prehliadac.newPage({ deviceScaleFactor: 2 });
for (const variant of ['svetle', 'tmave']) {
  await writeFile(join(CIEL, `care-orbit-znak-${variant}.svg`), znakSvg(variant, { popis: true }));
  await strana.setContent(stranka(variant, 'transparent'));
  await strana.evaluate(() => document.fonts.ready);
  await strana.locator('.logo').screenshot({ path: join(CIEL, `care-orbit-${variant}.png`), omitBackground: true });
  console.log('hotovo:', variant);
}
// Ukážka ako originál (svetlé logo na tmavom podklade)
await strana.setContent(stranka('svetle', 'linear-gradient(120deg,#17384a,#141722 45%,#1d1f2a 70%,#28244f)'));
await strana.evaluate(() => document.fonts.ready);
await strana.locator('body').screenshot({ path: join(CIEL, 'care-orbit-ukazka-tmavy-podklad.png') });
await prehliadac.close();
