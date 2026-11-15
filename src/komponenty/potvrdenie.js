// Potvrdzovacie okno priamo na stránke (namiesto systémového okna).
import { h } from '../dom.js';
import { gsap } from 'gsap';
import { pohybPovoleny } from '../dizajn/pohyb.js';

/**
 * @returns {Promise<boolean>} true = potvrdené
 */
export function potvrdenie({ nadpis, text, ano = 'Áno', nie = 'Nechať tak', nebezpecne = true }) {
  return new Promise((hotovo) => {
    const vrstva = document.getElementById('vrstva-dialogov');
    const predtym = document.activeElement;
    const nadpisId = `dialog-${Date.now()}`;

    const tlacidloNie = h('button', { type: 'button', class: 'tlacidlo' }, nie);
    const tlacidloAno = h(
      'button',
      { type: 'button', class: `tlacidlo ${nebezpecne ? 'tlacidlo--nebezpecne' : 'tlacidlo--zakladne'}` },
      ano
    );
    const okno = h(
      'div',
      { class: 'dialog karta', role: 'alertdialog', 'aria-modal': 'true', 'aria-labelledby': nadpisId },
      h('h2', { id: nadpisId }, nadpis),
      h('p', {}, text),
      h('div', { class: 'dialog__akcie' }, tlacidloNie, tlacidloAno)
    );
    const pozadie = h('div', { class: 'dialog-pozadie' }, okno);

    function koniec(vysledok) {
      document.removeEventListener('keydown', klaves, true);
      pozadie.remove();
      predtym?.focus?.();
      hotovo(vysledok);
    }

    // Escape = nie; Tab zostáva v okne
    function klaves(e) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        koniec(false);
      } else if (e.key === 'Tab') {
        const prvky = [tlacidloNie, tlacidloAno];
        const i = prvky.indexOf(document.activeElement);
        e.preventDefault();
        prvky[(i + (e.shiftKey ? -1 : 1) + prvky.length) % prvky.length].focus();
      }
    }

    tlacidloNie.addEventListener('click', () => koniec(false));
    tlacidloAno.addEventListener('click', () => koniec(true));
    pozadie.addEventListener('pointerdown', (e) => {
      if (e.target === pozadie) koniec(false);
    });
    document.addEventListener('keydown', klaves, true);

    vrstva.append(pozadie);
    tlacidloNie.focus();
    if (pohybPovoleny()) {
      gsap.from(pozadie, { opacity: 0, duration: 0.4 });
      gsap.from(okno, { opacity: 0, y: 12, duration: 0.6, ease: 'power2.out', clearProps: 'transform,opacity' });
    }
  });
}
