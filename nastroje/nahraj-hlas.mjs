// Nahrá všetky stále texty appky zabudovaným hlasom (Piper, hlas Lili, variant C:
// o kúsok vyšší a jasnejší) a zabalí ich do priečinka public/hlas/.
//
// Potrebuje priečinok hlas-nastroje/ (program Piper a hlas – nie je v gite).
// Už nahrané vety sa berú z vyrovnávacej pamäte, nahrá sa len to, čo pribudlo.
// Spustenie: npm run hlas
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, rm, readdir, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Mp3Encoder } from '@breezystack/lamejs';
import { zoznamNaNahratie } from '../src/hlas/zoznam.js';
import { pripravText, klucNahravky } from '../src/komponenty/hlas-logika.js';

const KOREN = join(dirname(fileURLToPath(import.meta.url)), '..');
const NASTROJE = join(KOREN, 'hlas-nastroje');
const PAMAT = join(NASTROJE, 'cache');
const DOCASNE = join(NASTROJE, 'tmp');
const CIEL = join(KOREN, 'public', 'hlas');

// Variant C: pokojné tempo, živšia melódia, hlas o 7 % vyššie
const VERZIA = 'C1';
const PIPER = ['--length_scale', '1.07', '--noise_scale', '0.8', '--noise_w', '0.65', '--sentence_silence', '0.05'];
const VYSSIE = 1.07;
const HZ = 22050;
const KBPS = 48;
const VELKOST_BALIKA = 1_500_000;

// ---------- Čo treba nahrať ----------
const { vety, casti } = zoznamNaNahratie();
const jednotky = new Map(); // kľúč → text pre hlas
for (const text of vety) for (const veta of pripravText(text)) jednotky.set(klucNahravky(veta), veta);
for (const cast of casti) {
  const kluc = klucNahravky(cast);
  if (/[,:]/.test(kluc)) throw new Error(`Časť nesmie obsahovať čiarku ani dvojbodku: „${cast}“`);
  // Číslo bez bodky (s bodkou by sa čítalo ako radová číslovka), ostatné ako krátka veta
  if (!jednotky.has(kluc)) jednotky.set(kluc, /^\d+$/.test(kluc) ? kluc : `${cast}.`);
}
const subor = (kluc) => `${createHash('sha1').update(`${VERZIA}|${jednotky.get(kluc)}`).digest('hex')}.mp3`;
const existuje = (cesta) => access(cesta).then(() => true, () => false);

// ---------- Nahrávanie cez Piper ----------
await mkdir(PAMAT, { recursive: true });
await rm(DOCASNE, { recursive: true, force: true });
await mkdir(DOCASNE, { recursive: true });

const chybajuce = [];
for (const kluc of jednotky.keys()) if (!(await existuje(join(PAMAT, subor(kluc))))) chybajuce.push(kluc);
console.log(`Texty na čítanie: ${jednotky.size}, treba nahrať: ${chybajuce.length}`);

if (chybajuce.length) {
  if (!(await existuje(join(NASTROJE, 'piper', 'piper.exe')))) {
    throw new Error('Chýba priečinok hlas-nastroje s programom Piper. Bez neho sa nové texty nedajú nahrať.');
  }
  // Relatívne cesty: Piper nezvláda dĺžne a mäkčene v ceste k priečinku
  const vstup = chybajuce.map((kluc, i) => JSON.stringify({ text: jednotky.get(kluc), output_file: `tmp/${i}.wav` })).join('\n');
  await new Promise((hotovo, chyba) => {
    const p = spawn(
      join(NASTROJE, 'piper', 'piper.exe'),
      ['--model', 'lili-upravene/sk_SK-lili-medium.onnx', '--espeak_data', 'piper/espeak-ng-data', '--json-input', ...PIPER],
      { cwd: NASTROJE, stdio: ['pipe', 'ignore', 'pipe'] }
    );
    let hlasky = '';
    p.stderr.on('data', (d) => (hlasky = (hlasky + d).slice(-2000)));
    p.on('error', chyba);
    p.on('close', (kod) => (kod === 0 ? hotovo() : chyba(new Error(`Piper skončil s chybou ${kod}:\n${hlasky}`))));
    p.stdin.end(`${vstup}\n`, 'utf8');
  });

  for (let i = 0; i < chybajuce.length; i++) {
    const wav = await readFile(join(DOCASNE, `${i}.wav`));
    await writeFile(join(PAMAT, subor(chybajuce[i])), naMp3(upravZvuk(citajWav(wav))));
  }
  await rm(DOCASNE, { recursive: true, force: true });
}

// ---------- Úprava zvuku ----------
function citajWav(b) {
  let pozicia = 12;
  while (pozicia < b.length - 8) {
    const nazov = b.toString('ascii', pozicia, pozicia + 4);
    const dlzka = b.readUInt32LE(pozicia + 4);
    if (nazov === 'data') {
      const koniec = Math.min(b.length, pozicia + 8 + dlzka);
      return new Int16Array(b.buffer.slice(b.byteOffset + pozicia + 8, b.byteOffset + koniec));
    }
    pozicia += 8 + dlzka + (dlzka % 2);
  }
  throw new Error('Neplatný súbor WAV');
}

function upravZvuk(vzorky) {
  // Orezanie ticha na začiatku a na konci
  const PRAH = 260;
  let a = 0;
  let b = vzorky.length - 1;
  while (a < b && Math.abs(vzorky[a]) < PRAH) a++;
  while (b > a && Math.abs(vzorky[b]) < PRAH) b--;
  a = Math.max(0, a - 400);
  b = Math.min(vzorky.length - 1, b + 1800);
  // Vyšší a jasnejší hlas: plynulé prevzorkovanie (kratšie o 7 %)
  const dlzka = Math.floor((b - a) / VYSSIE);
  const von = new Int16Array(dlzka);
  for (let i = 0; i < dlzka; i++) {
    const x = a + i * VYSSIE;
    const j = Math.floor(x);
    const t = x - j;
    von[i] = Math.round(vzorky[j] * (1 - t) + (vzorky[Math.min(j + 1, b)] ?? 0) * t);
  }
  // Krátky nábeh a dobeh, aby nahrávka nezačínala ani nekončila lupnutím
  const N = Math.min(220, dlzka >> 1);
  for (let i = 0; i < N; i++) {
    von[i] = Math.round((von[i] * i) / N);
    von[dlzka - 1 - i] = Math.round((von[dlzka - 1 - i] * i) / N);
  }
  return von;
}

function naMp3(vzorky) {
  const koder = new Mp3Encoder(1, HZ, KBPS);
  const kusy = [];
  for (let i = 0; i < vzorky.length; i += 1152) {
    const kus = koder.encodeBuffer(vzorky.subarray(i, i + 1152));
    if (kus.length) kusy.push(Buffer.from(kus));
  }
  const zvysok = koder.flush();
  if (zvysok.length) kusy.push(Buffer.from(zvysok));
  return Buffer.concat(kusy);
}

// ---------- Zabalenie do appky ----------
await rm(CIEL, { recursive: true, force: true });
await mkdir(CIEL, { recursive: true });
const index = {};
let balik = [];
let velkost = 0;
let cisloBalika = 0;
let spolu = 0;
const uloz = async () => {
  if (!balik.length) return;
  await writeFile(join(CIEL, `balik-${cisloBalika}.bin`), Buffer.concat(balik));
  cisloBalika++;
  balik = [];
  velkost = 0;
};
for (const kluc of [...jednotky.keys()].sort()) {
  const data = await readFile(join(PAMAT, subor(kluc)));
  if (velkost + data.length > VELKOST_BALIKA) await uloz();
  index[kluc] = [cisloBalika, velkost, data.length];
  balik.push(data);
  velkost += data.length;
  spolu += data.length;
}
await uloz();
await writeFile(join(CIEL, 'index.json'), JSON.stringify({ verzia: VERZIA, baliky: cisloBalika, nahravky: index }));

// Upratanie starých nahrávok z vyrovnávacej pamäte
const platne = new Set([...jednotky.keys()].map(subor));
for (const s of await readdir(PAMAT)) if (!platne.has(s)) await rm(join(PAMAT, s));

console.log(`Hotovo: ${jednotky.size} nahrávok, ${cisloBalika} balíkov, spolu ${(spolu / 1e6).toFixed(1)} MB`);
