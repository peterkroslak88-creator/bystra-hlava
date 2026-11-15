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

  vec3 pust = texture2D(tPust, uv + posunOblakov + posunHorucavy).rgb;
  vec3 zahrada = texture2D(tZahrada, uv + posunOblakov).rgb;
  pust += vec3(0.022, 0.018, 0.008) * pas * (chvenie*0.5 + 0.5) * uPohyb;

  // Piesok pri kvete akoby zvlhol
  float vlh = uVlhkost * (1.0 - smoothstep(0.0, 1.0, length((uv - vec2(${STRED.x.toFixed(3)}, ${STRED.y.toFixed(3)})) / vec2(0.075, 0.03))));
  pust *= 1.0 - 0.24*vlh;
  pust = mix(pust, pust*vec3(0.9, 0.86, 0.82), vlh*0.5);

  vec3 farba = mix(pust, zahrada, maska);

  // Pomaly plávajúce tiene oblakov na zemi
  float tien = smoothstep(0.45, 0.75, fbm(uv*vec2(2.2,4.0) + vec2(t*0.012, t*0.004)));
  farba *= 1.0 - 0.07*tien*smoothstep(0.35, 0.5, uv.y)*uPohyb;

  // Teplé svetlo pri rozkvitnutí kvetu
  vec2 dd = (uv - uHlava) * vec2(2.0, 1.0);
  farba += vec3(1.0, 0.82, 0.5) * uSvetlo * 0.42 * exp(-dot(dd,dd)*38.0);

  // Ročné obdobie a jemná vineta
  farba *= uNadych;
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
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
    zrus() {
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
