// Jemné animácie (GSAP). Všetko je pomalé a pokojné.
// Ak má zariadenie zapnuté „obmedziť pohyb“, animácie sa vynechajú.
import { gsap } from 'gsap';

const obmedzitPohyb = window.matchMedia('(prefers-reduced-motion: reduce)');

// Animácie trvajú vždy presne určený čas, aj keď zariadenie na chvíľu spomalí
gsap.ticker.lagSmoothing(0);

// Adresa s „?bezpohybu“ vypne animácie (na kontrolné snímky obrazovky)
const bezPohybu = new URLSearchParams(window.location.search).has('bezpohybu');
if (bezPohybu) document.documentElement.classList.add('bez-pohybu');

export function pohybPovoleny() {
  return !bezPohybu && !obmedzitPohyb.matches;
}

// Vstup novej obrazovky: nadpisy sa vynoria z rozmazania, karty jemne vyplávajú
export function vstupObrazovky(el) {
  if (!pohybPovoleny()) return;
  const casovaOs = gsap.timeline();
  casovaOs.from(el, { opacity: 0, duration: 0.6, ease: 'power1.out' });
  const nadpisy = el.querySelectorAll('h1, .z-rozmazania');
  if (nadpisy.length) {
    casovaOs.from(
      nadpisy,
      { opacity: 0, filter: 'blur(14px)', y: 6, duration: 1.5, ease: 'power2.out', stagger: 0.15, clearProps: 'filter,transform,opacity' },
      0
    );
  }
  const karty = el.querySelectorAll('.karta, .vyplava');
  if (karty.length) {
    casovaOs.from(
      karty,
      { opacity: 0, y: 14, duration: 1.1, ease: 'power2.out', stagger: 0.06, clearProps: 'transform,opacity' },
      0.2
    );
  }
}

// Odchod starej obrazovky: pomalé zoslabnutie
export function odchodObrazovky(el) {
  if (!pohybPovoleny() || !el || document.hidden) return Promise.resolve();
  return new Promise((hotovo) => {
    gsap.to(el, { opacity: 0, duration: 0.35, ease: 'power1.in', onComplete: hotovo });
    // Poistka: prechod nikdy nesmie zostať visieť (napr. keď prehliadač šetrí snímky)
    setTimeout(hotovo, 450);
  });
}

// Keď appka nie je na obrazovke, animácie sa pozastavia (šetrí batériu)
document.addEventListener('visibilitychange', () => {
  const skryte = document.hidden;
  document.documentElement.classList.toggle('pozastavene', skryte);
  if (skryte) gsap.globalTimeline.pause();
  else gsap.globalTimeline.resume();
});
