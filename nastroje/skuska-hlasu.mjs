// Skúška zabudovaného hlasu v prehliadači: po ťuknutí na „Čítať nahlas“ sa musia
// prehrať nahrávky (nie hlas zariadenia) a čítanie musí dobehnúť do konca.
// Spustenie: npm run skuska-hlasu
import { build, preview } from 'vite';
import { chromium } from 'playwright';

await build({ logLevel: 'warn' });
const server = await preview({ preview: { port: 4175, strictPort: true }, logLevel: 'warn' });
const prehliadac = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const s = await prehliadac.newPage();
const chyby = [];
s.on('pageerror', (e) => chyby.push(e.message));
s.on('console', (m) => m.type() === 'error' && chyby.push(m.text().slice(0, 200)));
await s.addInitScript(() => {
  window.__hlas = { nahravky: 0, zariadenie: 0 };
  const play = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () {
    window.__hlas.nahravky++;
    return play.call(this);
  };
  if (window.speechSynthesis) {
    const speak = window.speechSynthesis.speak.bind(window.speechSynthesis);
    window.speechSynthesis.speak = (u) => {
      window.__hlas.zariadenie++;
      return speak(u);
    };
  }
});
await s.goto('http://localhost:4175/?bezpohybu');
await s.waitForSelector('h1');
await s.waitForTimeout(4000); // balíky hlasu sa načítajú na pozadí
const tlacidlo = s.locator('button.citanie').first();
await tlacidlo.click();
await s.waitForTimeout(800);
const pocas = await tlacidlo.getAttribute('aria-pressed');
await s.waitForFunction(() => document.querySelector('button.citanie')?.getAttribute('aria-pressed') === 'false', null, { timeout: 40000 });
const vysledok = await s.evaluate(() => window.__hlas);
await prehliadac.close();
await new Promise((hotovo) => server.httpServer.close(hotovo));

console.log(`Počas čítania stlačené: ${pocas}; prehraté nahrávky: ${vysledok.nahravky}; vety hlasom zariadenia: ${vysledok.zariadenie}`);
if (chyby.length) console.log(`CHYBY:\n${chyby.join('\n')}`);
const ok = pocas === 'true' && vysledok.nahravky >= 3 && vysledok.zariadenie === 0 && !chyby.length;
console.log(ok ? 'Zabudovaný hlas funguje.' : 'NEFUNGUJE');
process.exit(ok ? 0 : 1);
