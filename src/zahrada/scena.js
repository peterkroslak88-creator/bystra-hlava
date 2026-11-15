// Živá záhrada: spája maľbu (WebGL), kvet, trávu vo vetre, kotúľ,
// paralaxu a ročné obdobia do jednej scény.
import { gsap } from 'gsap';
import { h } from '../dom.js';
import { pohybPovoleny } from '../dizajn/pohyb.js';
import { vytvorMalbu } from './malba.js';
import { vytvorVietor, vietor } from './vietor.js';
import { STRED } from './sum.js';
import { odkrytie, rocneObdobie } from './milniky.js';
import { svetloDna, hodinaTeraz } from './svetlo.js';

const POMER = 2; // šírka : výška malieb
const PRESAH = 1.06; // rezerva na paralaxu

// Body na obrázku kvetu (0–1): kde je zem, stonka a hlava
const KVET = { pomer: 257 / 900, zakladX: 0.55, zemY: 0.83, hlavaX: 0.6, hlavaY: 0.11, kalichX: 0.5, kalichY: 0.18 };
const VYSKA_KVETU = 0.4; // výška obrázka kvetu voči výške maľby

const NADYCH = {
  jar: [1.0, 0.985, 1.0],
  leto: [1.02, 1.0, 0.95],
  jesen: [1.03, 0.975, 0.9],
  zima: [0.96, 0.985, 1.03],
};

// Púčik (kým nebude maľba puk.png): jemná kresba v štýle herbára
const PUK_SVG = `<svg viewBox="0 0 40 60" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<path d="M20 58C20 48 20 40 20 34" stroke="#7d9a52" stroke-width="2.4" fill="none" stroke-linecap="round"/>
<path d="M20 8C28 14 30 26 26 34C24 38 16 38 14 34C10 26 12 14 20 8Z" fill="#e7a9bd" stroke="#8e5a68" stroke-width=".8"/>
<path d="M20 9C23 16 23 26 21 35" stroke="#c9879d" stroke-width=".7" fill="none"/>
<path d="M13 30C14 36 18 39 20 39C22 39 26 36 27 30C24 33 22 34 20 34C18 34 16 33 13 30Z" fill="#8fa75f" stroke="#5f6b3e" stroke-width=".7"/>
<path d="M14 31C12 26 13 22 15 20M26 31C28 26 27 22 25 20" stroke="#7d9a52" stroke-width="1.4" fill="none" stroke-linecap="round"/>
</svg>`;

function nacitajObrazok(src) {
  return new Promise((hotovo, chyba) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => hotovo(img);
    img.onerror = chyba;
    img.src = src;
  });
}

function rozlozenie(W, H) {
  let dW;
  let dH;
  if (W / H > POMER) {
    dW = W * PRESAH;
    dH = dW / POMER;
  } else {
    dH = H * PRESAH;
    dW = dH * POMER;
  }
  // Kvet a zem majú byť vždy v zábere
  let ox = W / 2 - STRED.x * dW;
  let oy = H * 0.62 - 0.66 * dH;
  ox = Math.min(0, Math.max(W - dW, ox));
  oy = Math.min(0, Math.max(H - dH, oy));
  return { W, H, dW, dH, ox, oy };
}

/**
 * @param {HTMLElement} obal  prvok, do ktorého sa scéna vloží
 * @param {{dni?: number, obdobie?: string}} nastavenie
 */
export async function vytvorScenu(obal, { dni = 0, obdobie = rocneObdobie(), hodina = null } = {}) {
  let pevnaHodina = hodina; // null = skutočný čas
  const pohyb = pohybPovoleny();
  const [pust, zahrada, kvetImg, kotul] = await Promise.all([
    nacitajObrazok('./obrazky/pust.webp'),
    nacitajObrazok('./obrazky/zahrada.webp'),
    nacitajObrazok('./obrazky/kvet.webp'),
    nacitajObrazok('./obrazky/kotul.webp'),
  ]);

  // ---------- Vrstvy ----------
  const platnoMalby = h('canvas', { class: 'scena__malba', 'aria-hidden': 'true' });
  const platnoVetra = h('canvas', { class: 'scena__vietor', 'aria-hidden': 'true' });
  const kvetStonka = h('img', { class: 'kvet__stonka', src: kvetImg.src, alt: '' });
  const kvetCely = h('img', { class: 'kvet__cely', src: kvetImg.src, alt: '' });
  const puk = h('span', { class: 'kvet__puk', html: PUK_SVG });
  const kvet = h('div', { class: 'kvet', 'aria-hidden': 'true' }, kvetStonka, kvetCely, puk);
  obal.classList.add('scena');
  obal.append(platnoMalby, kvet, platnoVetra);

  let malba = vytvorMalbu(platnoMalby, { pust, zahrada });
  let zalozne = null;
  if (!malba) {
    // Záložná podoba bez WebGL: dve maľby a jednoduchá maska
    platnoMalby.remove();
    zalozne = {
      pust: h('img', { class: 'scena__zalozna', src: pust.src, alt: '' }),
      zahrada: h('img', { class: 'scena__zalozna', src: zahrada.src, alt: '' }),
    };
    obal.prepend(zalozne.pust, zalozne.zahrada);
  }
  const vietorVrstva = vytvorVietor(platnoVetra, { kotul });

  // ---------- Stav scény ----------
  const stav = {
    dni,
    R: odkrytie(dni),
    vlhkost: dni >= 1 ? 1 : 0,
    svetlo: 0,
    rast: dni >= 1 ? 1 : 0, // 0 = žiadna stonka, 1 = stonka až po hlavu
    puk: 0,
    kvet: dni >= 1 ? 1 : 0,
  };
  let rozl = rozlozenie(1, 1);
  const paralaxa = { x: 0, y: 0, cielX: 0, cielY: 0 };
  let bezi = true;
  let prekreslit = true;
  let posledne = performance.now();
  let cas = 0;
  let snimka = 0;

  function zmenVelkost() {
    const box = obal.getBoundingClientRect();
    const W = Math.max(1, box.width);
    const H = Math.max(1, box.height);
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    rozl = rozlozenie(W, H);
    malba?.zmenVelkost(Math.round(W * dpr), Math.round(H * dpr));
    vietorVrstva.zmenVelkost(W, H, dpr);
    prekreslit = true;
  }
  const pozorovatel = new ResizeObserver(zmenVelkost);
  pozorovatel.observe(obal);
  zmenVelkost();

  function umiestniKvet(posun) {
    const vyska = VYSKA_KVETU * rozl.dH;
    const sirka = vyska * KVET.pomer;
    const zemX = rozl.ox + STRED.x * rozl.dW + posun[0];
    const zemY = rozl.oy + STRED.y * rozl.dH + posun[1];
    kvet.style.width = `${sirka}px`;
    kvet.style.height = `${vyska}px`;
    kvet.style.left = `${zemX - KVET.zakladX * sirka}px`;
    kvet.style.top = `${zemY - KVET.zemY * vyska}px`;
    const naklon = pohyb ? (vietor(STRED.x, cas) - 0.06) * 9 : 0;
    kvet.style.transform = `rotate(${naklon.toFixed(2)}deg)`;
    // Stonka sa odkrýva odspodu nahor (korene zostávajú pod zemou)
    const hore = KVET.zemY * 100 - stav.rast * (KVET.zemY - KVET.kalichY) * 100;
    kvetStonka.style.clipPath = `inset(${hore.toFixed(1)}% 0 ${(100 - KVET.zemY * 100).toFixed(1)}% 0)`;
    kvetCely.style.clipPath = `inset(0 0 ${(100 - KVET.zemY * 100).toFixed(1)}% 0)`;
    kvetCely.style.opacity = stav.kvet;
    puk.style.opacity = stav.puk;
    kvet.style.visibility = stav.rast > 0 ? 'visible' : 'hidden';
    return [zemX, zemY];
  }

  function kresli(teraz) {
    if (!bezi) return;
    snimka = requestAnimationFrame(kresli);
    const dt = (teraz - posledne) / 1000;
    posledne = teraz;
    if (!pohyb && !prekreslit) return;
    if (pohyb) cas += Math.min(dt, 0.1);
    prekreslit = false;

    // Paralaxa: vrstvy sa pomaly dobiehajú
    paralaxa.x += (paralaxa.cielX - paralaxa.x) * 0.05;
    paralaxa.y += (paralaxa.cielY - paralaxa.y) * 0.05;
    const posun = (sila) => [paralaxa.x * sila, paralaxa.y * sila];

    // Svetlo podľa dennej doby (skutočný čas, alebo pevne zvolená hodina v náhľade)
    const svetlo = svetloDna(pevnaHodina ?? hodinaTeraz());
    const hlava = [STRED.x + (KVET.hlavaX - KVET.zakladX) * VYSKA_KVETU * KVET.pomer, STRED.y - (KVET.zemY - KVET.hlavaY) * VYSKA_KVETU];
    if (malba) {
      malba.kresli({
        rozl,
        posunPx: posun(6),
        cas,
        R: stav.R,
        vlhkost: stav.vlhkost,
        svetlo: stav.svetlo,
        pohyb: pohyb ? 1 : 0,
        hlava,
        nadych: NADYCH[obdobie].map((v, i) => v * svetlo.nadych[i]),
        hviezdy: svetlo.hviezdy,
      });
    } else {
      const p = Math.max(0, stav.R) * 60;
      const maska = `radial-gradient(ellipse ${p * 1.3}% ${p}% at 50% 80%, #000 60%, transparent 100%)`;
      zalozne.zahrada.style.webkitMaskImage = maska;
      zalozne.zahrada.style.maskImage = maska;
    }
    umiestniKvet(posun(9));
    vietorVrstva.kresli({
      rozl,
      posunPx: posun(13),
      cas,
      dt,
      R: stav.R,
      pohyb: pohyb ? 1 : 0,
      obdobie,
      kotul: stav.dni === 0,
      vtaky: stav.dni >= 7,
      noc: svetlo.hviezdy,
    });
  }
  snimka = requestAnimationFrame(kresli);

  // ---------- Paralaxa: myš a naklonenie tabletu ----------
  function mys(e) {
    paralaxa.cielX = (e.clientX / window.innerWidth - 0.5) * -2;
    paralaxa.cielY = (e.clientY / window.innerHeight - 0.5) * -1.2;
  }
  function naklon(e) {
    if (e.gamma == null) return;
    paralaxa.cielX = Math.max(-1, Math.min(1, e.gamma / 25)) * -1;
    paralaxa.cielY = Math.max(-1, Math.min(1, (e.beta - 45) / 30)) * -0.6;
  }
  async function povolNaklon() {
    obal.removeEventListener('pointerdown', povolNaklon);
    try {
      if (typeof DeviceOrientationEvent?.requestPermission === 'function') {
        await DeviceOrientationEvent.requestPermission();
      }
    } catch {
      /* bez naklonenia, nevadí */
    }
  }
  if (pohyb) {
    window.addEventListener('pointermove', mys, { passive: true });
    window.addEventListener('deviceorientation', naklon, { passive: true });
    obal.addEventListener('pointerdown', povolNaklon);
  }

  // ---------- Ovládanie scény ----------
  let animacia = null;

  return {
    // Nastaví počet dní; s animáciou sa záhrada pomaly rozšíri
    // Pevná denná doba na predvádzanie (null = podľa hodín tabletu)
    nastavHodinu(h) {
      pevnaHodina = h;
      prekreslit = true;
    },

    nastavDni(n, { animuj = false } = {}) {
      animacia?.kill();
      stav.dni = n;
      const ciel = {
        R: odkrytie(n),
        vlhkost: n >= 1 ? 1 : 0,
        rast: n >= 1 ? 1 : 0,
        kvet: n >= 1 ? 1 : 0,
        puk: 0,
        svetlo: 0,
      };
      if (animuj && pohyb) {
        const odkial = Math.max(stav.R, odkrytie(1));
        stav.R = odkial;
        animacia = gsap.to(stav, { R: ciel.R, duration: 4, ease: 'power2.inOut' });
        Object.assign(stav, { vlhkost: ciel.vlhkost, rast: ciel.rast, kvet: ciel.kvet, puk: 0 });
      } else {
        Object.assign(stav, ciel);
      }
      prekreslit = true;
    },

    // Rast prvého kvetu (4–5 s). Prehrá sa len vtedy, keď ho niekto zavolá.
    prehrajRast() {
      animacia?.kill();
      stav.dni = Math.max(stav.dni, 1);
      if (!pohyb) {
        Object.assign(stav, { R: odkrytie(1), vlhkost: 1, rast: 1, kvet: 1, puk: 0, svetlo: 0 });
        prekreslit = true;
        return;
      }
      Object.assign(stav, { R: -1, vlhkost: 0, rast: 0, kvet: 0, puk: 0, svetlo: 0 });
      gsap.set(kvetCely, { scale: 1 });
      const tl = gsap.timeline();
      // Piesok v strede zvlhne
      tl.to(stav, { vlhkost: 1, duration: 1.2, ease: 'sine.inOut' }, 0);
      // Stonka rastie zo zeme
      tl.to(stav, { rast: 1, duration: 2.2, ease: 'power1.inOut' }, 0.6);
      // Púčik sa objaví na špičke…
      tl.to(stav, { puk: 1, duration: 0.5, ease: 'sine.out' }, 2.4);
      // …a prelinie sa do rozkvitnutého kvetu s jemnou pružnosťou
      tl.to(stav, { puk: 0, kvet: 1, duration: 1.1, ease: 'sine.inOut' }, 3.0);
      tl.fromTo(
        kvetCely,
        { scale: 0.86 },
        { scale: 1, duration: 1.6, ease: 'elastic.out(1, 0.55)', transformOrigin: `${KVET.kalichX * 100}% ${KVET.kalichY * 100}%` },
        3.0
      );
      // Teplé svetlo a pár zrniek prachu
      tl.to(stav, { svetlo: 1, duration: 0.7, ease: 'sine.out' }, 3.2);
      tl.to(stav, { svetlo: 0, duration: 1.4, ease: 'sine.in' }, 3.9);
      tl.call(
        () => {
          const box = kvet.getBoundingClientRect();
          const scena = obal.getBoundingClientRect();
          vietorVrstva.zrnka(box.left - scena.left + box.width * KVET.zakladX, box.top - scena.top + box.height * KVET.zemY);
        },
        null,
        3.3
      );
      tl.to(stav, { R: odkrytie(1), duration: 1.5, ease: 'sine.out' }, 3.4);
      animacia = tl;
    },

    zrus() {
      bezi = false;
      cancelAnimationFrame(snimka);
      animacia?.kill();
      pozorovatel.disconnect();
      window.removeEventListener('pointermove', mys);
      window.removeEventListener('deviceorientation', naklon);
      malba?.zrus();
      malba = null;
    },
  };
}
