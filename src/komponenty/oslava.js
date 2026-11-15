// Jemná oslava po dokončení úlohy: pár pomaly padajúcich lupeňov.
import { gsap } from 'gsap';
import { h } from '../dom.js';
import { pohybPovoleny } from '../dizajn/pohyb.js';

const FARBY = ['#e7b0c2', '#f1cfd9', '#cdbfe3', '#f4e2b8', '#e9a3b6'];

function lupen(farba) {
  return `<svg viewBox="0 0 20 28" aria-hidden="true"><path d="M10 1C16 6 18 14 14 22C12 26 8 26 6 22C2 14 4 6 10 1Z" fill="${farba}" fill-opacity=".9" stroke="#8e5a68" stroke-opacity=".35" stroke-width=".6"/><path d="M10 3C10 10 10 18 10 24" stroke="#ffffff" stroke-opacity=".5" stroke-width=".7" fill="none"/></svg>`;
}

export function padajuceLupene(pocet = 16) {
  if (!pohybPovoleny()) return;
  const vrstva = h('div', { class: 'lupene', 'aria-hidden': 'true' });
  document.body.append(vrstva);
  const vyska = window.innerHeight;
  let zostava = pocet;
  for (let i = 0; i < pocet; i++) {
    const el = h('span', { class: 'lupene__lupen', html: lupen(FARBY[i % FARBY.length]) });
    el.style.left = `${5 + Math.random() * 90}%`;
    vrstva.append(el);
    const velkost = 0.8 + Math.random() * 0.7;
    gsap.fromTo(
      el,
      { y: -60, x: 0, rotation: Math.random() * 360, scale: velkost, opacity: 0 },
      {
        y: vyska + 80,
        x: (Math.random() - 0.5) * 220,
        rotation: `+=${180 + Math.random() * 240}`,
        opacity: 1,
        duration: 4.5 + Math.random() * 2.5,
        delay: i * 0.14,
        ease: 'sine.inOut',
        onComplete: () => {
          el.remove();
          if (--zostava === 0) vrstva.remove();
        },
      }
    );
  }
}
