// Popredie záhrady kreslené kódom: tráva a poľné kvety vo vetre,
// suché trsy v púšti, kotúľ s prachom a padajúce prvky ročného obdobia.
import { pole } from './sum.js';

// Opakovateľné „náhodné“ čísla, aby záhrada vyzerala vždy rovnako
function generator(seme) {
  let s = seme >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/**
 * Sila vetra na mieste u (0–1 zľava doprava) v čase t.
 * Jemný vánok + poryvy, ktoré prechádzajú lúkou ako vlna.
 */
export function vietor(u, t) {
  const vanok = Math.sin(t * 0.9 + u * 3.1) * 0.08 + Math.sin(t * 1.7 + u * 7.3) * 0.04;
  const f1 = (t / 9) % 1;
  const f2 = ((t + 4) / 13) % 1;
  const poryv =
    Math.exp(-((u - (-0.3 + f1 * 1.6)) ** 2) / 0.02) * 0.42 +
    Math.exp(-((u - (-0.3 + f2 * 1.6)) ** 2) / 0.03) * 0.28;
  return 0.05 + vanok + poryv;
}

const ZELENE = ['#4a6831', '#5c7c38', '#6c8c3e', '#7b9947', '#91ab58', '#a7b768'];
const SUCHE = ['#8a6a3a', '#7a5c30', '#9b7a45'];
const TYPY_KVETOV = ['harmancek', 'levandula', 'mak', 'naprstnik', 'nevadza', 'harmancek', 'levandula'];

const FARBY_CASTIC = {
  jesen: ['#b5652a', '#c98a3a', '#9c5a2c', '#d0a24a'],
  jar: ['#ebb8c8', '#f2cfd9', '#e3a6ba'],
  zima: ['#ffffff'],
  leto: ['#fffdf4'],
};

const ohranic = (x, a, b) => Math.min(b, Math.max(a, x));

export function vytvorVietor(platno, { kotul }) {
  const ctx = platno.getContext('2d');
  const r = generator(7);
  let W = 1;
  let H = 1;

  // ---------- Tráva, kvety, suché trsy (v súradniciach obrázka) ----------
  const stebla = [];
  for (let i = 0; i < 560; i++) {
    const u = -0.02 + r() * 1.04;
    const v = 0.71 + 0.31 * Math.sqrt(r());
    const hlbka = (v - 0.6) / 0.4;
    stebla.push({
      u,
      v,
      h: (0.022 + r() * 0.05) * hlbka,
      w: (0.0022 + r() * 0.0022) * hlbka,
      farba: Math.floor(r() * ZELENE.length),
      ohyb: 0.7 + r() * 0.6,
      faza: r() * 6.28,
      p: pole(u, v),
    });
  }
  const kvety = [];
  for (let i = 0; i < 80; i++) {
    const u = r();
    const v = 0.73 + 0.28 * Math.sqrt(r());
    const hlbka = (v - 0.6) / 0.4;
    kvety.push({
      u,
      v,
      h: (0.035 + r() * 0.05) * hlbka,
      velkost: (0.006 + r() * 0.004) * hlbka,
      typ: TYPY_KVETOV[Math.floor(r() * TYPY_KVETOV.length)],
      ohyb: 0.6 + r() * 0.7,
      faza: r() * 6.28,
      p: pole(u, v) + 0.05, // kvety prídu o kúsok neskôr než tráva
    });
  }
  kvety.sort((a, b) => a.v - b.v);
  // Suché trsy v púšti sú vypnuté (pôsobili umelo; maľba má vlastné suché trávy)
  const trsy = [];
  for (let i = 0; i < 0; i++) {
    const u = r();
    const v = 0.74 + 0.26 * Math.sqrt(r());
    const hlbka = (v - 0.6) / 0.4;
    trsy.push({ u, v, h: (0.012 + r() * 0.02) * hlbka, farba: Math.floor(r() * SUCHE.length), faza: r() * 6.28, p: pole(u, v) });
  }

  // ---------- Padajúce prvky ročného obdobia ----------
  const castice = Array.from({ length: 12 }, () => ({
    x: r(),
    y: r(),
    vy: 0.018 + r() * 0.02,
    vx: (r() - 0.5) * 0.01,
    rot: r() * 6.28,
    vr: (r() - 0.5) * 1.2,
    velkost: 0.6 + r() * 0.6,
    farba: r(),
    faza: r() * 6.28,
  }));

  // ---------- Kotúľ a prach ----------
  const k = { aktivny: false, dalsi: 4 + r() * 4, start: 0, trvanie: 11, v: 0.86, posledny: -1 };
  const prach = [];
  const zrnka = [];

  function naObrazovku(rozl, posun, u, v) {
    return [rozl.ox + u * rozl.dW + posun[0], rozl.oy + v * rozl.dH + posun[1]];
  }

  function steblo(x, y, h, w, uhol) {
    const sx = Math.sin(uhol);
    const tx = x + sx * h;
    const ty = y - Math.cos(uhol) * h;
    const kx = x + Math.sin(uhol * 0.45) * h * 0.5;
    const ky = y - h * 0.6;
    ctx.moveTo(x - w / 2, y);
    ctx.quadraticCurveTo(kx - w * 0.3, ky, tx, ty);
    ctx.quadraticCurveTo(kx + w * 0.3, ky, x + w / 2, y);
    ctx.closePath();
    return [tx, ty];
  }

  function hlavicka(typ, x, y, s, uhol) {
    switch (typ) {
      case 'harmancek':
        ctx.fillStyle = 'rgba(255,253,244,0.95)';
        for (let i = 0; i < 7; i++) {
          const a = (i / 7) * Math.PI * 2;
          ctx.beginPath();
          ctx.ellipse(x + Math.cos(a) * s * 0.9, y + Math.sin(a) * s * 0.55, s * 0.75, s * 0.32, a, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#e1b13e';
        ctx.beginPath();
        ctx.arc(x, y, s * 0.45, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'levandula':
      case 'naprstnik': {
        ctx.fillStyle = typ === 'levandula' ? 'rgba(141,124,192,0.92)' : 'rgba(205,128,160,0.92)';
        const n = typ === 'levandula' ? 6 : 5;
        for (let i = 0; i < n; i++) {
          const d = i * s * 0.9;
          ctx.beginPath();
          ctx.ellipse(x - Math.sin(uhol) * d, y + Math.cos(uhol) * d, s * (0.55 - i * 0.04), s * 0.75, uhol, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }
      case 'mak':
        ctx.fillStyle = 'rgba(200,82,58,0.92)';
        ctx.beginPath();
        ctx.ellipse(x - s * 0.5, y, s * 0.85, s * 0.7, -0.4, 0, Math.PI * 2);
        ctx.ellipse(x + s * 0.5, y, s * 0.85, s * 0.7, 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#3a3428';
        ctx.beginPath();
        ctx.arc(x, y + s * 0.1, s * 0.28, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'nevadza':
        ctx.fillStyle = 'rgba(79,120,191,0.92)';
        for (let i = 0; i < 6; i++) {
          const a = -Math.PI / 2 + (i - 2.5) * 0.45;
          ctx.beginPath();
          ctx.ellipse(x + Math.cos(a) * s * 0.7, y + Math.sin(a) * s * 0.7, s * 0.55, s * 0.25, a, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
    }
  }

  function kresliCastice(obdobie, dt, cas) {
    const farby = FARBY_CASTIC[obdobie];
    const mierka = H / 800;
    for (const c of castice) {
      c.y += (obdobie === 'leto' ? -0.4 : 1) * c.vy * dt;
      c.x += (c.vx + Math.sin(cas * 0.6 + c.faza) * 0.012) * dt;
      c.rot += c.vr * dt;
      if (c.y > 1.05) {
        c.y = -0.05;
        c.x = Math.random();
      }
      if (c.y < -0.05) {
        c.y = 1.0;
        c.x = Math.random();
      }
      if (c.x > 1.05) c.x = -0.05;
      if (c.x < -0.05) c.x = 1.05;
      const x = c.x * W;
      const y = c.y * H;
      const s = 9 * c.velkost * mierka;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(c.rot);
      ctx.fillStyle = farby[Math.floor(c.farba * farby.length)];
      ctx.globalAlpha = obdobie === 'leto' ? 0.55 : 0.8;
      ctx.beginPath();
      if (obdobie === 'zima') ctx.arc(0, 0, s * 0.35, 0, Math.PI * 2);
      else if (obdobie === 'leto') ctx.arc(0, 0, s * 0.22, 0, Math.PI * 2);
      else ctx.ellipse(0, 0, s * 0.7, s * (obdobie === 'jar' ? 0.42 : 0.32), 0, 0, Math.PI * 2);
      ctx.fill();
      if (obdobie === 'leto') {
        ctx.strokeStyle = 'rgba(255,253,244,0.5)';
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(i) * s * 0.7, Math.sin(i) * s * 0.7);
        }
        ctx.stroke();
      }
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  function kresliKotul(rozl, posun, cas, dt, povoleny) {
    if (!k.aktivny) {
      if (povoleny && cas > k.dalsi && kotul.complete) {
        Object.assign(k, { aktivny: true, start: cas, trvanie: 10 + Math.random() * 3, v: 0.84 + Math.random() * 0.08, posledny: -1 });
      }
      return;
    }
    const f = (cas - k.start) / k.trvanie;
    if (f > 1) {
      k.aktivny = false;
      k.dalsi = cas + 20 + Math.random() * 20; // ďalší o 20–40 s
      return;
    }
    const skokov = 7;
    const skok = Math.abs(Math.sin(f * Math.PI * skokov)) * 0.045 * (0.65 + 0.35 * Math.cos(f * 5));
    const velkost = 0.085 * rozl.dH;
    const [x, zem] = naObrazovku(rozl, posun, -0.12 + f * 1.24, k.v);
    const y = zem - skok * rozl.dH - velkost * 0.45;

    // Dopad = obláčik prachu
    const index = Math.floor(f * skokov);
    if (index !== k.posledny) {
      k.posledny = index;
      for (let i = 0; i < 3; i++) {
        prach.push({ x: x + (Math.random() - 0.5) * velkost * 0.6, y: zem, vek: 0, trvanie: 1.6 + Math.random() * 0.6, r: velkost * (0.25 + Math.random() * 0.15) });
      }
    }
    // Tieň na zemi
    ctx.fillStyle = `rgba(110,80,40,${0.18 * (1 - skok * 12)})`;
    ctx.beginPath();
    ctx.ellipse(x, zem, velkost * 0.42, velkost * 0.09, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((cas - k.start) * 2.3);
    ctx.drawImage(kotul, -velkost / 2, -velkost / 2, velkost, velkost);
    ctx.restore();
  }

  function kresliPrach(dt) {
    for (let i = prach.length - 1; i >= 0; i--) {
      const p = prach[i];
      p.vek += dt;
      if (p.vek > p.trvanie) {
        prach.splice(i, 1);
        continue;
      }
      const f = p.vek / p.trvanie;
      const polomer = p.r * (1 + f * 2.5);
      const g = ctx.createRadialGradient(p.x, p.y - polomer * 0.4, 0, p.x, p.y - polomer * 0.4, polomer);
      g.addColorStop(0, `rgba(222,192,140,${0.34 * (1 - f)})`);
      g.addColorStop(1, 'rgba(222,192,140,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y - polomer * 0.4, polomer, 0, Math.PI * 2);
      ctx.fill();
      p.y -= dt * 6;
    }
  }

  function kresliZrnka(dt) {
    for (let i = zrnka.length - 1; i >= 0; i--) {
      const z = zrnka[i];
      z.vek += dt;
      if (z.vek > z.trvanie) {
        zrnka.splice(i, 1);
        continue;
      }
      z.x += z.vx * dt;
      z.y += z.vy * dt;
      z.vy *= 0.985;
      const f = z.vek / z.trvanie;
      ctx.fillStyle = `rgba(250,226,160,${0.85 * Math.sin(f * Math.PI)})`;
      ctx.beginPath();
      ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ---------- Trblietanie na lúke (cez deň iskričky svetla, večer svetlušky) ----------
  const iskry = Array.from({ length: 22 }, () => {
    const u = 0.06 + Math.random() * 0.88;
    const v = 0.52 + Math.random() * 0.44;
    return { u, v, faza: Math.random() * 6.28, rychlost: 0.5 + Math.random() * 0.6, p: pole(u, v) };
  });

  function kresliTrblietanie(rozl, posun, cas, R, noc) {
    for (const i of iskry) {
      if (i.p > R - 0.03) continue; // len v rozkvitnutej časti
      const sila = Math.max(0, Math.sin(cas * i.rychlost + i.faza)) ** (noc > 0.3 ? 3 : 10);
      if (sila < 0.03) continue;
      // Svetlušky sa večer pomaly vznášajú
      const du = noc > 0.3 ? Math.sin(cas * 0.23 + i.faza) * 0.012 : 0;
      const dv = noc > 0.3 ? Math.cos(cas * 0.19 + i.faza * 1.7) * 0.01 - 0.02 : 0;
      const [x, y] = naObrazovku(rozl, posun, i.u + du, i.v + dv);
      const polomer = (noc > 0.3 ? 0.012 : 0.007) * rozl.dH;
      const g = ctx.createRadialGradient(x, y, 0, x, y, polomer);
      const farba = noc > 0.3 ? '255,236,150' : '255,252,235';
      g.addColorStop(0, `rgba(${farba},${(noc > 0.3 ? 0.85 : 0.7) * sila})`);
      g.addColorStop(1, `rgba(${farba},0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, polomer, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ---------- Kŕdeľ vtákov v diaľke (občas pomaly preletí oblohou) ----------
  const krdel = { aktivny: false, dalsi: 12 + Math.random() * 10, start: 0, trvanie: 34, v: 0.16, smer: 1, vtaky: [] };

  function kresliVtaky(rozl, posun, cas, povolene) {
    if (!krdel.aktivny) {
      if (povolene && cas > krdel.dalsi) {
        const pocet = 4 + Math.floor(Math.random() * 4);
        Object.assign(krdel, {
          aktivny: true,
          start: cas,
          trvanie: 30 + Math.random() * 12,
          v: 0.2 + Math.random() * 0.07, // v pásme oblohy, ktoré je vždy v zábere
          smer: Math.random() < 0.5 ? 1 : -1,
          // Voľný klin: každý vták má svoje miesto a vlastný rytmus krídel
          vtaky: Array.from({ length: pocet }, (_, i) => {
            const rad = Math.ceil(i / 2);
            const strana = i % 2 ? 1 : -1;
            return { dx: -rad * 0.016 + (Math.random() - 0.5) * 0.006, dy: strana * rad * 0.009 + (Math.random() - 0.5) * 0.004, faza: Math.random() * 6.28 };
          }),
        });
      }
      return;
    }
    const f = (cas - krdel.start) / krdel.trvanie;
    if (f > 1) {
      krdel.aktivny = false;
      krdel.dalsi = cas + 45 + Math.random() * 40;
      return;
    }
    const zaciatok = krdel.smer > 0 ? -0.1 : 1.1;
    const u0 = zaciatok + krdel.smer * f * 1.2;
    const v0 = krdel.v + Math.sin(f * Math.PI) * -0.02;
    const rozpatie = 0.011 * rozl.dH;
    ctx.strokeStyle = 'rgba(52,62,84,0.6)';
    ctx.lineWidth = Math.max(1, rozl.dH * 0.0022);
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (const vt of krdel.vtaky) {
      const [x, y] = naObrazovku(rozl, posun, u0 + krdel.smer * vt.dx, v0 + vt.dy);
      const mach = Math.sin(cas * 5.2 + vt.faza); // pomalé mávanie krídel
      const zdvih = rozpatie * (0.15 + 0.4 * mach);
      ctx.moveTo(x - rozpatie, y - zdvih);
      ctx.quadraticCurveTo(x - rozpatie * 0.45, y - zdvih * 0.2 - rozpatie * 0.12, x, y);
      ctx.quadraticCurveTo(x + rozpatie * 0.45, y - zdvih * 0.2 - rozpatie * 0.12, x + rozpatie, y - zdvih);
    }
    ctx.stroke();
  }

  return {
    zmenVelkost(sirka, vyska, dpr) {
      W = sirka;
      H = vyska;
      platno.width = Math.round(sirka * dpr);
      platno.height = Math.round(vyska * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    },

    // Zlatisté zrnká prachu, ktoré sa zdvihnú pri rozkvitnutí
    zrnka(x, y) {
      for (let i = 0; i < 16; i++) {
        zrnka.push({
          x: x + (Math.random() - 0.5) * 40,
          y: y - Math.random() * 10,
          vx: (Math.random() - 0.5) * 18,
          vy: -(18 + Math.random() * 30),
          r: 1.2 + Math.random() * 1.8,
          vek: 0,
          trvanie: 1.8 + Math.random() * 1.2,
        });
      }
    },

    /**
     * @param {{rozl: object, posunPx: number[], cas: number, dt: number, R: number,
     *          pohyb: number, obdobie: string, kotul: boolean}} s
     */
    kresli(s) {
      const { rozl, posunPx: posun, cas, R } = s;
      const dt = Math.min(s.dt, 0.1);
      ctx.clearRect(0, 0, W, H);

      // Suché trsy v ešte neodkrytej púšti
      ctx.lineCap = 'round';
      for (const t of trsy) {
        const vid = ohranic((t.p - R) / 0.06, 0, 1);
        if (vid <= 0) continue;
        const [x, y] = naObrazovku(rozl, posun, t.u, t.v);
        const h = t.h * rozl.dH;
        const uhol = vietor(t.u, cas) * 0.5 * s.pohyb;
        ctx.strokeStyle = SUCHE[t.farba];
        ctx.globalAlpha = 0.5 * vid;
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        for (let i = -2; i <= 2; i++) {
          const a = i * 0.32 + uhol + Math.sin(cas * 1.3 + t.faza + i) * 0.04 * s.pohyb;
          ctx.moveTo(x + i * 1.5, y);
          ctx.quadraticCurveTo(x + i * 2 + Math.sin(a) * h * 0.5, y - h * 0.6, x + Math.sin(a) * h, y - Math.cos(a) * h);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // Tráva (po farbách, aby to bolo rýchle)
      for (let f = 0; f < ZELENE.length; f++) {
        ctx.fillStyle = ZELENE[f];
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        for (const b of stebla) {
          if (b.farba !== f) continue;
          const vid = ohranic((R - b.p) / 0.08, 0, 1);
          if (vid <= 0) continue;
          const [x, y] = naObrazovku(rozl, posun, b.u, b.v);
          const uhol = (vietor(b.u - b.v * 0.1, cas + b.faza * 0.05) * b.ohyb + Math.sin(cas * 2 + b.faza) * 0.03) * s.pohyb + 0.06 * (1 - s.pohyb);
          steblo(x, y, b.h * rozl.dH * vid, Math.max(1, b.w * rozl.dH), uhol);
        }
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Poľné kvety – každý sa hojdá trochu inak
      for (const kv of kvety) {
        const vid = ohranic((R - kv.p) / 0.08, 0, 1);
        if (vid <= 0) continue;
        const [x, y] = naObrazovku(rozl, posun, kv.u, kv.v);
        const h = kv.h * rozl.dH * vid;
        const uhol = (vietor(kv.u, cas + kv.faza * 0.08) * kv.ohyb + Math.sin(cas * 1.4 + kv.faza) * 0.05) * s.pohyb + 0.05 * (1 - s.pohyb);
        ctx.strokeStyle = '#5c7a37';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        const tx = x + Math.sin(uhol) * h;
        const ty = y - Math.cos(uhol) * h;
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + Math.sin(uhol * 0.4) * h * 0.5, y - h * 0.6, tx, ty);
        ctx.stroke();
        hlavicka(kv.typ, tx, ty, kv.velkost * rozl.dH * vid, uhol);
      }

      if (s.pohyb) {
        kresliKotul(rozl, posun, cas, dt, s.kotul);
        kresliPrach(dt);
        kresliZrnka(dt);
        kresliCastice(s.obdobie, dt, cas);
        kresliTrblietanie(rozl, posun, cas, R, s.noc || 0);
        kresliVtaky(rozl, posun, cas, s.vtaky && (s.noc || 0) < 0.5);
      }
    },
  };
}
