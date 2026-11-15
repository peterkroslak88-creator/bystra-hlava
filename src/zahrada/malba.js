// Maľba záhrady vykreslená cez WebGL (jeden rýchly shader):
// púšť a záhrada sa prelínajú cez mäkkú maľovanú masku, nad obzorom
// sa chveje horúci vzduch, obloha a tiene oblakov sa pomaly hýbu.
import { GLSL_SUM, STRED } from './sum.js';

const VS = `
attribute vec2 a;
varying vec2 vS;
void main(){
  vS = vec2(a.x*0.5+0.5, 0.5-a.y*0.5);
  gl_Position = vec4(a, 0.0, 1.0);
}`;

const FS = `
precision highp float;
varying vec2 vS;
uniform sampler2D tPust;
uniform sampler2D tZahrada;
uniform vec2 uMierka;
uniform vec2 uPosun;
uniform float uCas;
uniform float uR;
uniform float uVlhkost;
uniform float uSvetlo;
uniform float uPohyb;
uniform vec2 uHlava;
uniform vec3 uNadych;
uniform float uHviezdy;
${GLSL_SUM}
void main(){
  vec2 uv = (vS - uPosun) / uMierka;
  float t = uCas;
  float maska = 1.0 - smoothstep(uR - 0.05, uR + 0.05, pole(uv));

  // Obloha: veľmi pomalé vlnenie, oblaky akoby plávali
  float obloha = 1.0 - smoothstep(0.16, 0.36, uv.y);
  vec2 posunOblakov = vec2(
    (sum(uv*vec2(2.5,5.0) + vec2(t*0.015, 0.0)) - 0.5) * 0.014,
    (sum(uv*vec2(3.0,4.0) - vec2(t*0.010, 0.0)) - 0.5) * 0.006) * obloha * uPohyb;

  // Horúci vzduch nad obzorom (len nad púšťou)
  float pas = smoothstep(0.22, 0.32, uv.y) * (1.0 - smoothstep(0.40, 0.56, uv.y));
  float chvenie = sin(uv.y*260.0 + t*2.6 + sum(uv*vec2(10.0,50.0) + vec2(0.0, t*0.4))*6.0);
  vec2 posunHorucavy = vec2(chvenie*0.0017, chvenie*0.0006) * pas * (1.0 - maska) * uPohyb;

  // Vlny vetra na lúke: tráva sa jemne prelieva (len v strede, chodník a chalúpka stoja)
  float vlna = sin(uv.x*9.0 - uv.y*4.0 - t*0.9 + sum(uv*vec2(6.0,14.0))*3.0);
  float lukaPas = smoothstep(0.45, 0.60, uv.y) * smoothstep(0.10, 0.25, uv.x) * (1.0 - smoothstep(0.60, 0.72, uv.x));
  vec2 posunLuky = vec2(vlna*0.0013, 0.0) * lukaPas * uPohyb;

  vec3 pust = texture2D(tPust, uv + posunOblakov + posunHorucavy).rgb;
  vec3 zahrada = texture2D(tZahrada, uv + posunOblakov + posunLuky).rgb;

  // Záhrada: sýtejšie farby a svetlé pásy vetra putujúce po tráve
  float zelen = smoothstep(0.02, 0.12, zahrada.g - max(zahrada.r, zahrada.b));
  zahrada = mix(vec3(dot(zahrada, vec3(0.299, 0.587, 0.114))), zahrada, 1.14);
  zahrada += vec3(0.045, 0.055, 0.015) * vlna * zelen * smoothstep(0.42, 0.58, uv.y) * uPohyb;
  pust += vec3(0.022, 0.018, 0.008) * pas * (chvenie*0.5 + 0.5) * uPohyb;

  // Piesok pri kvete akoby zvlhol
  float vlh = uVlhkost * (1.0 - smoothstep(0.0, 1.0, length((uv - vec2(${STRED.x.toFixed(3)}, ${STRED.y.toFixed(3)})) / vec2(0.075, 0.03))));
  pust *= 1.0 - 0.24*vlh;
  pust = mix(pust, pust*vec3(0.9, 0.86, 0.82), vlh*0.5);

  vec3 farba = mix(pust, zahrada, maska);

  // Kde je obloha: modré a biele miesta v hornej časti (nie stromy a chalúpka)
  float oblohaFarba = smoothstep(0.78, 0.90, farba.b / max(farba.g, 0.001));
  float stranyZahrady = smoothstep(0.10, 0.22, uv.x) * (1.0 - smoothstep(0.74, 0.86, uv.x));
  float nebo = oblohaFarba * (1.0 - smoothstep(0.24, 0.33, uv.y)) * mix(1.0, stranyZahrady, maska);

  // Hviezdy pri súmraku a v noci (jemne sa trblietajú)
  vec2 mriezka = uv * vec2(260.0, 130.0);
  vec2 bunka = floor(mriezka);
  float jeHviezda = step(0.986, hash(bunka));
  float blizko = 1.0 - smoothstep(0.0, 0.32, length(fract(mriezka) - 0.5));
  float trblet = 0.65 + 0.35 * sin(t*1.3 + hash(bunka + 7.0)*40.0);
  // (pripočítajú sa až po farebnom nádychu, aby svietili aj na tmavšej oblohe; nie cez biele oblaky)
  float hviezda = jeHviezda * blizko * trblet * uHviezdy * nebo * (1.0 - smoothstep(0.62, 0.85, dot(farba, vec3(0.333))));

  // Veľké kopovité oblaky, ktoré pomaly plávajú po oblohe
  vec2 po = uv * vec2(2.6, 5.5) + vec2(-t*0.010, 0.0);
  float hustota = fbm(po);
  float oblak = smoothstep(0.50, 0.70, hustota);
  float spodok = smoothstep(0.50, 0.72, fbm(po + vec2(0.03, -0.10)));
  vec3 farbaOblaku = mix(vec3(1.0, 0.985, 0.95), vec3(0.78, 0.83, 0.92), clamp(spodok - oblak*0.45 + 0.25, 0.0, 1.0) * 0.8);
  farba = mix(farba, farbaOblaku, oblak * nebo * 0.72);
  hviezda *= 1.0 - oblak;

  // Jemná hmla v diaľke nad obzorom záhrady
  float dialka = smoothstep(0.24, 0.31, uv.y) * (1.0 - smoothstep(0.34, 0.50, uv.y));
  farba = mix(farba, vec3(0.82, 0.88, 0.95), 0.10 * dialka * maska);

  // Tiene oblakov a slnečné škvrny putujúce po kopcoch a lúke
  float zem = smoothstep(0.33, 0.48, uv.y);
  float tien = smoothstep(0.42, 0.72, fbm(uv*vec2(1.8,3.4) + vec2(-t*0.012, t*0.004)));
  farba *= 1.0 - 0.16*tien*zem;
  farba *= 1.0 + 0.06*(1.0 - tien)*zem;

  // Slnečné lúče spoza oblakov (len nad rozkvitnutou záhradou)
  float luce = smoothstep(0.55, 0.90, sum(vec2((uv.x + uv.y*0.55)*7.0 - t*0.012, 1.7)));
  farba += vec3(1.0, 0.93, 0.74) * luce * 0.075 * (1.0 - smoothstep(0.25, 0.80, uv.y)) * maska * (1.0 - uHviezdy);

  // Teplé svetlo pri rozkvitnutí kvetu
  vec2 dd = (uv - uHlava) * vec2(2.0, 1.0);
  farba += vec3(1.0, 0.82, 0.5) * uSvetlo * 0.42 * exp(-dot(dd,dd)*38.0);

  // Ročné obdobie a jemná vineta
  farba *= uNadych;
  farba += vec3(1.0, 0.97, 0.88) * hviezda * 0.9;
  vec2 v = vS - 0.5;
  farba *= 1.0 - 0.2*dot(v, v);
  gl_FragColor = vec4(farba, 1.0);
}`;

function shader(gl, typ, kod) {
  const s = gl.createShader(typ);
  gl.shaderSource(s, kod);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
  return s;
}

function textura(gl, obrazok) {
  const t = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, obrazok);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return t;
}

/**
 * Vytvorí maľbu na plátne. Ak zariadenie nevie WebGL, vráti null.
 * @param {HTMLCanvasElement} platno
 * @param {{pust: HTMLImageElement, zahrada: HTMLImageElement}} obrazky
 */
export function vytvorMalbu(platno, obrazky) {
  const gl = platno.getContext('webgl', { antialias: false, alpha: false, premultipliedAlpha: false });
  if (!gl) return null;

  let program;
  try {
    program = gl.createProgram();
    gl.attachShader(program, shader(gl, gl.VERTEX_SHADER, VS));
    gl.attachShader(program, shader(gl, gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  } catch (chyba) {
    console.warn('Maľba bez WebGL:', chyba);
    return null;
  }
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const a = gl.getAttribLocation(program, 'a');
  gl.enableVertexAttribArray(a);
  gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);

  gl.activeTexture(gl.TEXTURE0);
  textura(gl, obrazky.pust);
  gl.activeTexture(gl.TEXTURE1);
  textura(gl, obrazky.zahrada);

  const u = (meno) => gl.getUniformLocation(program, meno);
  const U = {
    tPust: u('tPust'),
    tZahrada: u('tZahrada'),
    uMierka: u('uMierka'),
    uPosun: u('uPosun'),
    uCas: u('uCas'),
    uR: u('uR'),
    uVlhkost: u('uVlhkost'),
    uSvetlo: u('uSvetlo'),
    uPohyb: u('uPohyb'),
    uHlava: u('uHlava'),
    uNadych: u('uNadych'),
    uHviezdy: u('uHviezdy'),
  };
  gl.uniform1i(U.tPust, 0);
  gl.uniform1i(U.tZahrada, 1);

  return {
    zmenVelkost(sirka, vyska) {
      platno.width = sirka;
      platno.height = vyska;
      gl.viewport(0, 0, sirka, vyska);
    },
    /**
     * @param {{rozl: object, posunPx: number[], cas: number, R: number, vlhkost: number,
     *          svetlo: number, pohyb: number, hlava: number[], nadych: number[]}} s
     */
    kresli(s) {
      const { rozl } = s;
      gl.uniform2f(U.uMierka, rozl.dW / rozl.W, rozl.dH / rozl.H);
      gl.uniform2f(U.uPosun, (rozl.ox + s.posunPx[0]) / rozl.W, (rozl.oy + s.posunPx[1]) / rozl.H);
      gl.uniform1f(U.uCas, s.cas);
      gl.uniform1f(U.uR, s.R);
      gl.uniform1f(U.uVlhkost, s.vlhkost);
      gl.uniform1f(U.uSvetlo, s.svetlo);
      gl.uniform1f(U.uPohyb, s.pohyb);
      gl.uniform2f(U.uHlava, s.hlava[0], s.hlava[1]);
      gl.uniform3f(U.uNadych, ...s.nadych);
      gl.uniform1f(U.uHviezdy, s.hviezdy || 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
    zrus() {
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
