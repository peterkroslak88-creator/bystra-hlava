// Kontrola prístupnosti jednej obrazovky. Spúšťa sa priamo v prehliadači.
// Vráti zoznam nájdených problémov (prázdny zoznam = všetko v poriadku).
export function auditObrazovky() {
  const problemy = [];
  const pridaj = (el, text) => {
    const popis = `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : ''} „${(el.innerText || el.value || el.getAttribute('aria-label') || '').trim().slice(0, 40)}“`;
    problemy.push(`${text}: ${popis}`);
  };

  const farba = (c) => {
    const m = c.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  const jas = ({ r, g, b }) => {
    const f = (v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const zmiesaj = (horna, dolna) => ({
    r: horna.r * horna.a + dolna.r * (1 - horna.a),
    g: horna.g * horna.a + dolna.g * (1 - horna.a),
    b: horna.b * horna.a + dolna.b * (1 - horna.a),
    a: 1,
  });
  const kontrast = (a, b) => {
    const [x, y] = [jas(a), jas(b)].sort((p, q) => q - p);
    return (x + 0.05) / (y + 0.05);
  };
  const opacita = (el) => {
    let o = 1;
    for (let e = el; e; e = e.parentElement) o *= parseFloat(getComputedStyle(e).opacity);
    return o;
  };
  // Výsledná farba pozadia (vrstvy od koreňa po prvok)
  const pozadie = (el) => {
    const vrstvy = [];
    for (let e = el; e; e = e.parentElement) {
      const c = farba(getComputedStyle(e).backgroundColor);
      if (c && c.a > 0) vrstvy.push(c);
    }
    let vysledok = { r: 243, g: 236, b: 219, a: 1 }; // papier
    for (const c of vrstvy.reverse()) vysledok = zmiesaj(c, vysledok);
    return vysledok;
  };
  const viditelny = (el) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && opacita(el) > 0.05 && !el.closest('.skryte, [aria-hidden="true"], [hidden]');
  };

  // 1. Veľkosť a kontrast textu
  for (const el of document.querySelectorAll('body *')) {
    if (el.closest('svg')) continue;
    const maText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (!maText || !viditelny(el)) continue;
    const s = getComputedStyle(el);
    if (parseFloat(s.fontSize) < 17.5) pridaj(el, `text menší ako 18 px (${s.fontSize})`);
    if (el.closest('button:disabled')) continue; // neaktívne prvky (napr. po odpovedi) sa nehodnotia
    const c = farba(s.color);
    if (!c) continue;
    const vysledna = zmiesaj({ ...c, a: c.a * opacita(el) }, pozadie(el));
    const k = kontrast(vysledna, pozadie(el));
    if (k < 4.5) pridaj(el, `kontrast ${k.toFixed(2)} : 1 je menší ako 4,5 : 1`);
  }

  // 2. Ovládacie prvky: veľkosť plochy a popisok
  for (const el of document.querySelectorAll('button, a[href], input, select, textarea, [role="radio"]')) {
    if (!viditelny(el)) continue;
    const r = el.getBoundingClientRect();
    const obal = el.closest('label');
    const plocha = obal ? obal.getBoundingClientRect() : r;
    if (plocha.height < 43.5 || plocha.width < 43.5) pridaj(el, `plocha na ťuknutie menšia ako 44 px (${Math.round(plocha.width)} × ${Math.round(plocha.height)})`);
    if (el.classList.contains('tlacidlo') && r.height < 55.5) pridaj(el, `tlačidlo nižšie ako 56 px (${Math.round(r.height)})`);
    const nazov = (el.getAttribute('aria-label') || el.innerText || el.value || (el.labels?.[0]?.innerText ?? '') || el.getAttribute('title') || '').trim();
    if (!nazov) pridaj(el, 'ovládací prvok bez popisku');
    const maIkonu = el.querySelector('svg');
    const viditelnyText = (el.innerText || '').trim();
    if (maIkonu && !viditelnyText && !el.classList.contains('info__tlacidlo')) pridaj(el, 'ikona bez viditeľného popisku');
  }

  // 3. Emoji
  if (/\p{Extended_Pictographic}/u.test(document.body.innerText)) problemy.push('na obrazovke je emoji');

  // 4. Povinná pätička
  if (!document.querySelector('.paticka')?.innerText.includes('Nie je zdravotníckou pomôckou')) problemy.push('chýba povinná pätička');

  return [...new Set(problemy)];
}
