// Pomocník na bezpečné vytváranie prvkov stránky.
// Texty (napr. mená hráčov) sa vkladajú vždy ako čistý text,
// nikdy ako HTML, aby nemohli nič pokaziť.

export function h(znacka, vlastnosti = {}, ...deti) {
  const el = document.createElement(znacka);
  for (const [kluc, hodnota] of Object.entries(vlastnosti || {})) {
    if (hodnota == null || hodnota === false) continue;
    if (kluc === 'class') el.className = hodnota;
    else if (kluc === 'style') el.style.cssText = hodnota;
    else if (kluc === 'html') el.innerHTML = hodnota; // len pre naše vlastné SVG
    else if (kluc.startsWith('on') && typeof hodnota === 'function') {
      el.addEventListener(kluc.slice(2).toLowerCase(), hodnota);
    } else if (hodnota === true) el.setAttribute(kluc, '');
    else el.setAttribute(kluc, hodnota);
  }
  for (const dieta of deti.flat(Infinity)) {
    if (dieta == null || dieta === false) continue;
    el.append(dieta instanceof Node ? dieta : document.createTextNode(String(dieta)));
  }
  return el;
}

// Vytvorí prvok zo statického SVG reťazca (naše ilustrácie a ikony)
export function zSvg(retazec) {
  const sablona = document.createElement('template');
  sablona.innerHTML = retazec.trim();
  return sablona.content.firstElementChild;
}
