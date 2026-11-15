// Šum a „poradové pole“ záhrady.
// To isté počíta shader (malba.js) aj JavaScript (tráva), preto sú
// konštanty na jednom mieste a vzorce sa musia zhodovať.

// Kde v maľbe rastie kvet (súradnice obrázka 0–1, zľava a zhora)
export const STRED = { x: 0.5, y: 0.8 };

const fract = (x) => x - Math.floor(x);

export function hash(x, y) {
  let px = fract(x * 123.34);
  let py = fract(y * 456.21);
  const d = px * (px + 45.32) + py * (py + 45.32);
  px += d;
  py += d;
  return fract(px * py);
}

export function sum(x, y) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hash(ix, iy);
  const b = hash(ix + 1, iy);
  const c = hash(ix, iy + 1);
  const d = hash(ix + 1, iy + 1);
  return (a + (b - a) * ux) * (1 - uy) + (c + (d - c) * ux) * uy;
}

export function fbm(x, y) {
  let s = 0;
  let a = 0.5;
  for (let i = 0; i < 4; i++) {
    s += a * sum(x, y);
    x *= 2.03;
    y *= 2.03;
    a *= 0.5;
  }
  return s;
}

/**
 * Poradové pole: čím menšie číslo, tým skôr sa miesto odkryje.
 * Od kvetu do strán, s nepravidelným „maľovaným“ okrajom.
 */
export function pole(u, v) {
  const dx = (u - STRED.x) * 2.0;
  const dy = (v - STRED.y) * 1.25;
  const r = Math.sqrt(dx * dx + dy * dy);
  return r * 0.92 + (fbm(u * 5, v * 3) - 0.47) * 0.32 + (sum(u * 26, v * 7) - 0.5) * 0.05;
}

// Rovnaké funkcie v jazyku shadera (GLSL)
export const GLSL_SUM = `
float hash(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float sum(vec2 p){ vec2 i=floor(p); vec2 f=fract(p); vec2 u=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1.0,0.0)),u.x), mix(hash(i+vec2(0.0,1.0)),hash(i+vec2(1.0,1.0)),u.x), u.y); }
float fbm(vec2 p){ float s=0.0; float a=0.5; for(int i=0;i<4;i++){ s+=a*sum(p); p*=2.03; a*=0.5; } return s; }
float pole(vec2 uv){ vec2 d=(uv-vec2(${STRED.x.toFixed(3)},${STRED.y.toFixed(3)}))*vec2(2.0,1.25); float r=length(d);
  return r*0.92 + (fbm(uv*vec2(5.0,3.0))-0.47)*0.32 + (sum(uv*vec2(26.0,7.0))-0.5)*0.05; }
`;
