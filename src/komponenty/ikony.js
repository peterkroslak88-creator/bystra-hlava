// Jemné kontúrové ikony. Vždy sa zobrazujú spolu s textovým popiskom.
import { zSvg } from '../dom.js';

const CESTY = {
  reproduktor:
    '<path d="M4 9.5h3.5L12.5 5v14l-5-4.5H4z"/><path d="M16 8.6a4.8 4.8 0 0 1 0 6.8"/><path d="M18.6 6a8.5 8.5 0 0 1 0 12"/>',
  stop: '<rect x="6.5" y="6.5" width="11" height="11" rx="2"/>',
  spat: '<path d="M14.5 5.5 8 12l6.5 6.5"/>',
  odhlasit:
    '<path d="M14 4h3.5A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5H14"/><path d="M9.5 16 5.5 12l4-4"/><path d="M5.5 12H15"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  pero: '<path d="M4.5 19.5 5.5 15 15.8 4.7a2 2 0 0 1 2.8 0l.7.7a2 2 0 0 1 0 2.8L9 18.5z"/><path d="M14 6.5 17.5 10"/>',
  kos: '<path d="M4.5 7h15"/><path d="M9.5 7V4.5h5V7"/><path d="M6.5 7l1 12.5h9l1-12.5"/><path d="M10.2 10.5v6M13.8 10.5v6"/>',
  kriz: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
  nastavenia:
    '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2.2"/><circle cx="9" cy="17" r="2.2"/>',
  kluc: '<circle cx="8" cy="15.5" r="3.8"/><path d="M10.8 12.8 19 4.6M15.5 8l2.8 2.8M17.5 6l2 2"/>',
  vymazat: '<path d="M9 5.5h11v13H9l-6-6.5z"/><path d="M12.5 9.5l5 5M17.5 9.5l-5 5"/>',
  lista: '<path d="M5 19.5C4.5 10.5 10.5 4.8 20 4.5c.3 9.5-5.5 15.5-15 15z"/><path d="M5 19.5 13 11.5"/>',
  sipka: '<path d="M5 12h13M13 6.5l5.5 5.5-5.5 5.5"/>',
};

export function ikona(nazov) {
  return zSvg(
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${CESTY[nazov] || ''}</svg>`
  );
}
