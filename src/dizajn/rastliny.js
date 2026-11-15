// Dočasné botanické kresby v štýle starého herbára:
// tenká atramentová kontúra a jemný akvarelový náter.
// Keď budú hotové maľby z Canvy, nahradia sa obrázkami.

const ATRAMENT = '#5a4932';
const STONKA = '#5f6b3e';

export const RASTLINY = [
  { id: 'levandula', nazov: 'Levanduľa' },
  { id: 'mak', nazov: 'Mak' },
  { id: 'harmancek', nazov: 'Harmanček' },
  { id: 'slnecnica', nazov: 'Slnečnica' },
  { id: 'ruza', nazov: 'Ruža' },
  { id: 'konvalinka', nazov: 'Konvalinka' },
  { id: 'lipa', nazov: 'Lipa' },
  { id: 'vres', nazov: 'Vres' },
  { id: 'nevadza', nazov: 'Nevädza' },
  { id: 'zvoncek', nazov: 'Zvonček' },
];

export const ID_RASTLIN = RASTLINY.map((r) => r.id);

export function nazovRastliny(id) {
  return RASTLINY.find((r) => r.id === id)?.nazov ?? '';
}

// ---------- Pomocné kresliace funkcie ----------

const z = (n) => Math.round(n * 10) / 10;

// Bod na krivke (kubická Bézierova krivka)
function bod([a, b, c, d], t) {
  const u = 1 - t;
  const k = (i) => u * u * u * a[i] + 3 * u * u * t * b[i] + 3 * u * t * t * c[i] + t * t * t * d[i];
  return [k(0), k(1)];
}

function krivka([a, b, c, d]) {
  return `M${a[0]} ${a[1]}C${b[0]} ${b[1]} ${c[0]} ${c[1]} ${d[0]} ${d[1]}`;
}

function stonka(d, sirka = 1.3, farba = STONKA) {
  return `<path d="${d}" fill="none" stroke="${farba}" stroke-width="${sirka}"/>`;
}

// List: od bodu (x, y), uhol 0 = smerom hore
function list(x, y, uhol, dlzka, sirka, farba = '#8ea36a') {
  const d = dlzka;
  const s = sirka;
  return (
    `<g transform="translate(${z(x)} ${z(y)}) rotate(${z(uhol)})">` +
    `<path d="M0 0C${s} ${z(-d * 0.25)} ${z(s * 0.9)} ${z(-d * 0.7)} 0 ${-d}C${z(-s * 0.9)} ${z(-d * 0.7)} ${-s} ${z(-d * 0.25)} 0 0Z" fill="${farba}" fill-opacity=".5" stroke="${ATRAMENT}" stroke-width=".8"/>` +
    `<path d="M0 0L0 ${z(-d * 0.9)}" stroke="${ATRAMENT}" stroke-width=".5" opacity=".55"/></g>`
  );
}

function lupen(d, s) {
  return `M0 0C${s} ${z(-d * 0.15)} ${z(s * 1.15)} ${z(-d * 0.75)} 0 ${-d}C${z(-s * 1.15)} ${z(-d * 0.75)} ${-s} ${z(-d * 0.15)} 0 0Z`;
}

function okvetie(cx, cy, pocet, d, s, farba, { otocenie = 0, sy = 1, priehladnost = 0.6, ciara = 0.7 } = {}) {
  let o = `<g transform="translate(${z(cx)} ${z(cy)}) scale(1 ${sy})">`;
  for (let i = 0; i < pocet; i++) {
    o += `<path transform="rotate(${z(otocenie + (i * 360) / pocet)})" d="${lupen(d, s)}" fill="${farba}" fill-opacity="${priehladnost}" stroke="${ATRAMENT}" stroke-width="${ciara}"/>`;
  }
  return o + '</g>';
}

function kruh(cx, cy, r, farba, priehladnost = 0.85, ciara = 0.7) {
  return `<circle cx="${z(cx)}" cy="${z(cy)}" r="${r}" fill="${farba}" fill-opacity="${priehladnost}" stroke="${ATRAMENT}" stroke-width="${ciara}"/>`;
}

function elipsa(cx, cy, rx, ry, uhol, farba, priehladnost = 0.75) {
  return `<ellipse cx="0" cy="0" rx="${rx}" ry="${ry}" transform="translate(${z(cx)} ${z(cy)}) rotate(${z(uhol)})" fill="${farba}" fill-opacity="${priehladnost}" stroke="${ATRAMENT}" stroke-width=".55"/>`;
}

// Jemný perovitý lístok (harmanček)
function perovity(x, y, uhol, dlzka) {
  let d = `M0 0L0 ${-dlzka}`;
  for (let i = 1; i <= 4; i++) {
    const yy = z((-dlzka * i) / 5);
    d += `M0 ${yy}l-4 -3.5M0 ${yy}l4 -3.5`;
  }
  return `<path transform="translate(${z(x)} ${z(y)}) rotate(${uhol})" d="${d}" fill="none" stroke="#7a8d50" stroke-width=".8"/>`;
}

// Lipový srdcovitý list
function srdce(x, y, uhol, L) {
  const p = (n) => z(n * L);
  return (
    `<g transform="translate(${z(x)} ${z(y)}) rotate(${uhol})">` +
    `<path d="M0 0L0 ${p(-0.14)}" stroke="${ATRAMENT}" stroke-width=".8"/>` +
    `<path d="M0 ${p(-0.14)}C${p(-0.3)} ${p(0.06)} ${p(-0.66)} ${p(-0.26)} ${p(-0.46)} ${p(-0.64)}C${p(-0.32)} ${p(-0.9)} ${p(-0.1)} ${p(-0.96)} 0 ${p(-1)}C${p(0.1)} ${p(-0.96)} ${p(0.32)} ${p(-0.9)} ${p(0.46)} ${p(-0.64)}C${p(0.66)} ${p(-0.26)} ${p(0.3)} ${p(0.06)} 0 ${p(-0.14)}Z" fill="#88a35e" fill-opacity=".5" stroke="${ATRAMENT}" stroke-width=".8"/>` +
    `<path d="M0 ${p(-0.14)}L0 ${p(-0.92)}M0 ${p(-0.4)}L${p(-0.3)} ${p(-0.6)}M0 ${p(-0.4)}L${p(0.3)} ${p(-0.6)}" stroke="${ATRAMENT}" stroke-width=".5" opacity=".55" fill="none"/></g>`
  );
}

// Zvonček visiaci zo stopky – (x, y) je bod, kde sa pripája
function zvon(x, y, mierka, farba, cesta) {
  return `<g transform="translate(${z(x)} ${z(y)}) scale(${z(mierka * 100) / 100})"><path d="${cesta}" fill="${farba}" fill-opacity=".8" stroke="${ATRAMENT}" stroke-width=".7"/></g>`;
}

const ZVON_KONVALINKA =
  'M-5 8C-5.5 2 -2.5 0 0 0C2.5 0 5.5 2 5 8L6.5 10.2L3.6 9.2L1.6 11.2L0 9.6L-1.6 11.2L-3.6 9.2L-6.5 10.2Z';
const ZVON_ZVONCEK =
  'M-7 13C-7.5 4 -4 0 0 0C4 0 7.5 4 7 13L9.5 17L5 15.6L2.4 18.2L0 16L-2.4 18.2L-5 15.6L-9.5 17Z';

// ---------- Jednotlivé rastliny ----------

const KRESBY = {
  levandula() {
    const stonky = [
      [[60, 152], [58, 110], [50, 70], [45, 32]],
      [[60, 152], [61, 105], [60, 60], [61, 22]],
      [[60, 152], [63, 110], [72, 72], [79, 36]],
    ];
    let o = '';
    o += list(60, 152, -30, 38, 3.2, '#9aa889');
    o += list(60, 152, -12, 44, 3, '#9aa889');
    o += list(60, 152, 13, 42, 3, '#9aa889');
    o += list(60, 152, 30, 36, 3.2, '#9aa889');
    for (const s of stonky) {
      o += stonka(krivka(s), 1.1);
      for (let t = 0.6; t <= 1.001; t += 0.05) {
        const [x, y] = bod(s, t);
        const v = 1.25 - (t - 0.6) * 1.2;
        o += elipsa(x - 2.4 * v, y, 2.3 * v, 3.4 * v, -28, '#8d7cc0');
        o += elipsa(x + 2.4 * v, y, 2.3 * v, 3.4 * v, 28, '#8d7cc0');
      }
      const [x, y] = bod(s, 1);
      o += elipsa(x, y - 3, 2, 3.2, 0, '#9e8fcc');
    }
    return o;
  },

  mak() {
    let o = '';
    o += stonka('M60 152C57 118 67 88 62 62', 1.4);
    o += stonka('M60 152C64 128 84 104 86 80', 1.1);
    o += `<g transform="translate(86 80) rotate(165)"><path d="${lupen(16, 6)}" fill="#8ea36a" fill-opacity=".55" stroke="${ATRAMENT}" stroke-width=".8"/></g>`;
    o += list(60, 150, -50, 34, 9, '#93a382');
    o += list(61, 146, 44, 30, 8, '#93a382');
    o += list(61, 122, -32, 22, 6, '#93a382');
    o += okvetie(62, 50, 4, 28, 19, '#c85a3f', { otocenie: 45, sy: 0.72, priehladnost: 0.7 });
    o += okvetie(62, 52, 4, 21, 15, '#d96b4b', { sy: 0.6, priehladnost: 0.55 });
    for (let i = 0; i < 10; i++) {
      const u = (i / 10) * Math.PI * 2;
      o += kruh(62 + Math.cos(u) * 8.5, 50 + Math.sin(u) * 6, 0.9, '#2e2a22', 0.9, 0.3);
    }
    o += kruh(62, 50, 5.6, '#3c3a30', 0.85);
    o += `<path d="M58 50h8M62 46v8M59.2 47.2l5.6 5.6M64.8 47.2l-5.6 5.6" stroke="#e9e0c8" stroke-width=".6"/>`;
    return o;
  },

  harmancek() {
    const stonky = [
      [[60, 152], [58, 120], [52, 90], [44, 62]],
      [[60, 152], [61, 118], [64, 80], [66, 44]],
      [[60, 150], [64, 125], [76, 104], [86, 84]],
    ];
    let o = '';
    for (const s of stonky) {
      o += stonka(krivka(s), 1);
      for (const t of [0.25, 0.45, 0.65]) {
        const [x, y] = bod(s, t);
        o += perovity(x, y, t * 100 % 2 ? -42 : 40, 14);
        o += perovity(x, y, 38, 11);
      }
    }
    for (const s of stonky) {
      const [x, y] = bod(s, 1);
      o += okvetie(x, y, 15, 10.5, 2.6, '#fffdf4', { priehladnost: 0.95, ciara: 0.55 });
      o += kruh(x, y, 4.4, '#e3b33e', 0.95);
      o += kruh(x - 1.2, y - 1.2, 1.1, '#f3d27a', 0.9, 0);
    }
    return o;
  },

  slnecnica() {
    let o = '';
    o += stonka('M60 152C61 125 58 98 60 72', 3);
    o += list(59, 126, -62, 36, 15, '#7f9a52');
    o += list(61, 108, 58, 32, 13, '#7f9a52');
    o += list(60, 142, 40, 24, 10, '#7f9a52');
    o += okvetie(60, 50, 20, 25, 5, '#e2a93b', { priehladnost: 0.75 });
    o += okvetie(60, 50, 20, 20, 4.4, '#d4922a', { otocenie: 9, priehladnost: 0.7 });
    o += kruh(60, 50, 13, '#6a4628', 0.9);
    for (const [r, n] of [[4, 6], [8, 12], [11, 18]]) {
      for (let i = 0; i < n; i++) {
        const u = (i / n) * Math.PI * 2 + r;
        o += kruh(60 + Math.cos(u) * r, 50 + Math.sin(u) * r, 0.9, '#3d2a18', 0.9, 0);
      }
    }
    return o;
  },

  ruza() {
    let o = '';
    o += stonka('M60 152C63 124 55 100 60 72', 1.6);
    for (const [x, y, s] of [[61.5, 136, 1], [57.6, 116, -1], [58, 98, 1]]) {
      o += `<path d="M${x} ${y}l${3 * s} -1.5l${-3 * s} -2z" fill="${ATRAMENT}" fill-opacity=".6"/>`;
    }
    o += stonka('M60 116C54 112 48 110 42 108', 1);
    o += list(42, 108, -70, 20, 8, '#7c9658');
    o += list(50, 111, -30, 16, 6.5, '#7c9658');
    o += list(50, 111, -120, 15, 6, '#7c9658');
    o += stonka('M59 96C66 92 72 90 78 88', 1);
    o += list(78, 88, 70, 19, 7.5, '#7c9658');
    o += list(70, 91, 25, 15, 6, '#7c9658');
    o += list(60, 73, -145, 11, 3, '#7c9658');
    o += list(60, 73, 145, 11, 3, '#7c9658');
    o += okvetie(60, 58, 5, 20, 15, '#e2a0b2', { sy: 0.78, priehladnost: 0.65 });
    o += okvetie(60, 57, 4, 14, 11, '#d4859c', { otocenie: 36, sy: 0.8, priehladnost: 0.65 });
    o += `<path d="M60 56c3 -1 4 2 2 4c-3 3 -8 0 -7 -4c1 -5 8 -7 12 -3c4 4 2 11 -4 13" fill="none" stroke="#8e4560" stroke-width="1"/>`;
    return o;
  },

  konvalinka() {
    let o = '';
    o += list(55, 152, -10, 112, 15, '#7d9a5c');
    o += list(66, 152, 16, 98, 13, '#86a364');
    const s = [[60, 150], [62, 92], [78, 52], [98, 54]];
    o += stonka(krivka(s), 1.1);
    for (const t of [0.55, 0.64, 0.73, 0.82, 0.9, 0.98]) {
      const [x, y] = bod(s, t);
      const v = 1.3 - (t - 0.55) * 0.9;
      o += stonka(`M${z(x)} ${z(y)}Q${z(x + 1)} ${z(y + 3)} ${z(x)} ${z(y + 6)}`, 0.7);
      o += zvon(x, y + 6, v, '#fffdf6', ZVON_KONVALINKA);
    }
    return o;
  },

  lipa() {
    let o = '';
    o += stonka('M18 150C40 128 62 104 74 70C82 48 92 34 102 22', 2.2, '#6e5a3c');
    o += srdce(38, 131, -62, 32);
    o += srdce(66, 92, 62, 34);
    o += srdce(81, 50, -48, 26);
    o += srdce(101, 24, 22, 16);
    // Listeň s visiacimi kvietkami
    o += list(71, 80, -28, 42, 5, '#d8d49c');
    o += stonka('M61 62C56 66 52 70 50 76M61 62C58 68 57 74 56 80M61 62C54 64 48 66 44 70', 0.7);
    for (const [x, y] of [[50, 77], [56, 81], [44, 71], [52, 70]]) {
      o += okvetie(x, y, 5, 3.6, 1.7, '#e6d06f', { priehladnost: 0.85, ciara: 0.45 });
      o += kruh(x, y, 0.9, '#b58f2c', 0.9, 0);
    }
    return o;
  },

  vres() {
    const stonky = [
      [[60, 152], [58, 128], [62, 96], [58, 42]],
      [[59, 124], [64, 106], [72, 88], [80, 62]],
      [[60, 106], [54, 92], [47, 78], [41, 58]],
    ];
    let o = '';
    for (const s of stonky) {
      o += stonka(krivka(s), 1.3, '#6b5a3e');
      let strana = 1;
      for (let t = 0.3; t <= 1.001; t += 0.07) {
        const [x, y] = bod(s, t);
        strana *= -1;
        o += `<path d="M${z(x)} ${z(y)}l${strana * 4} -1.5" stroke="#7f9257" stroke-width=".7"/>`;
        o += elipsa(x + strana * 3.4, y + 1.5, 2.1, 2.9, strana * 25, '#b67aa8');
      }
    }
    return o;
  },

  nevadza() {
    let o = '';
    o += stonka('M60 152C59 120 63 90 60 60', 1.1, '#6b7d55');
    o += stonka('M60 114C68 102 76 94 80 82', 1, '#6b7d55');
    o += list(60, 142, -22, 40, 3.4, '#97a88a');
    o += list(60, 126, 22, 34, 3, '#97a88a');
    o += list(60, 98, -30, 24, 2.5, '#97a88a');
    // Zákrov (šupinatý základ kvetu)
    o += elipsa(60, 55, 6, 7, 0, '#8b9a6a', 0.7);
    o += `<path d="M55 52l10 6M55 57l10 -6M56 60l8 -2" stroke="${ATRAMENT}" stroke-width=".45" opacity=".6"/>`;
    const kviet = 'M0 0L-2.6 -12L-5.5 -15L-3.5 -16.5L-1.8 -14.5L0 -17.5L1.8 -14.5L3.5 -16.5L5.5 -15L2.6 -12Z';
    for (let u = -84; u <= 84; u += 21) {
      o += `<path transform="translate(60 50) rotate(${u})" d="${kviet}" fill="#4f78bf" fill-opacity=".72" stroke="${ATRAMENT}" stroke-width=".6"/>`;
    }
    o += kruh(58, 47, 1.6, '#5b4a86', 0.9, 0.4);
    o += kruh(62, 46.5, 1.6, '#5b4a86', 0.9, 0.4);
    o += kruh(60, 44, 1.6, '#5b4a86', 0.9, 0.4);
    o += elipsa(80, 79, 3.4, 4.6, 20, '#8b9a6a', 0.7);
    o += elipsa(81, 75, 2, 1.6, 20, '#4f78bf', 0.7);
    return o;
  },

  zvoncek() {
    let o = '';
    o += list(60, 150, -62, 18, 9, '#8ea36a');
    o += list(60, 150, 56, 18, 9, '#8ea36a');
    o += stonka('M60 152C60 120 56 90 62 42C64 32 70 28 75 31', 1.2);
    o += stonka('M60 104C64 100 69 98 73 98', 0.9);
    o += stonka('M59 76C55 72 50 70 46 70', 0.9);
    o += list(60, 128, 26, 20, 3, '#8ea36a');
    o += list(59, 92, -26, 18, 2.8, '#8ea36a');
    o += zvon(75, 31, 1.15, '#8b78c4', ZVON_ZVONCEK);
    o += zvon(73, 98, 1, '#8b78c4', ZVON_ZVONCEK);
    o += zvon(46, 70, 0.95, '#8b78c4', ZVON_ZVONCEK);
    return o;
  },
};

let pocitadlo = 0;

/**
 * Vráti SVG kresbu rastliny ako text.
 * @param {string} id  identifikátor rastliny
 * @param {{popis?: boolean}} moznosti  popis = či má mať kresba vlastný názov pre čítačku obrazovky
 */
export function rastlinaSvg(id, { popis = false } = {}) {
  const kresba = KRESBY[id] || KRESBY.levandula;
  const filterId = `drsnost-${++pocitadlo}`;
  const pristupnost = popis
    ? `role="img" aria-label="${nazovRastliny(id)}"`
    : 'aria-hidden="true" focusable="false"';
  return (
    `<svg class="rastlina" viewBox="0 0 120 160" xmlns="http://www.w3.org/2000/svg" ${pristupnost}>` +
    `<defs><filter id="${filterId}" x="-10%" y="-10%" width="120%" height="120%">` +
    `<feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="${pocitadlo % 7}" result="n"/>` +
    `<feDisplacementMap in="SourceGraphic" in2="n" scale="1.6"/></filter></defs>` +
    `<g filter="url(#${filterId})" stroke-linecap="round" stroke-linejoin="round">${kresba()}</g></svg>`
  );
}
