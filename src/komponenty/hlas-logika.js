// Čistá logika čítania nahlas (bez prehliadača, aby sa dala otestovať):
// výber najkrajšieho slovenského hlasu a príprava textu na prirodzené čítanie.

export const RYCHLOST = 0.9; // pokojné tempo (zadanie projektu)
export const PAUZA_MEDZI_VETAMI_MS = 320;

export function jeSlovensky(hlas) {
  return (hlas?.lang || '').toLowerCase().replace('_', '-').startsWith('sk');
}

/**
 * Hlas smie byť použitý len vtedy, keď beží priamo v zariadení.
 * Online hlasy (localService = false) posielajú text na server – to appka nesmie.
 */
export function jeMiestny(hlas) {
  return hlas?.localService !== false && !/online/i.test(hlas?.name || '');
}

// Čím vyššie číslo, tým krajší hlas (vylepšené a prémiové verzie majú prednosť)
export function kvalitaHlasu(hlas) {
  const meno = hlas.name || '';
  let body = 0;
  if (/premium|prémiov/i.test(meno)) body += 40;
  if (/enhanced|vylepšen|natural|neural|prirodzen/i.test(meno)) body += 30;
  if (/siri/i.test(meno)) body += 20;
  if (/laura/i.test(meno)) body += 10; // ženský hlas Apple – na iPade najprirodzenejší
  if (/compact|kompakt|espeak/i.test(meno)) body -= 20;
  if (hlas.default) body += 1;
  return body;
}

// Všetky povolené slovenské hlasy, od najkrajšieho
export function slovenskeHlasy(hlasy) {
  return hlasy.filter((h) => jeSlovensky(h) && jeMiestny(h)).sort((a, b) => kvalitaHlasu(b) - kvalitaHlasu(a));
}

/**
 * Vyberie hlas na čítanie: najprv ten, ktorý zvolil personál (ak v tablete je),
 * inak najkrajší slovenský. Online hlas nikdy.
 */
export function vyberHlas(hlasy, preferovany = null) {
  const vhodne = slovenskeHlasy(hlasy);
  if (preferovany) {
    const zvoleny = vhodne.find((h) => h.voiceURI === preferovany || h.name === preferovany);
    if (zvoleny) return zvoleny;
  }
  return vhodne[0] || null;
}

// ---------- Nahrávky zabudovaného hlasu ----------

// Kľúč nahrávky: text malými písmenami, bez bodky na konci
export function klucNahravky(text) {
  return String(text || '')
    .toLocaleLowerCase('sk')
    .replace(/[.!?]+$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Rozdelenie vety na časti podľa čiarok a dvojbodiek (zoznamy možností, čísel…)
export function castiVety(veta) {
  return String(veta || '')
    .replace(/[.!?]+$/, '')
    .split(/[,:]\s+/)
    .map(klucNahravky)
    .filter(Boolean);
}

/**
 * Nájde nahrávky pre vetu: buď celú vetu, alebo všetky jej časti.
 * @param {(kluc: string) => any} maNahravku  vráti nahrávku alebo undefined
 * @returns {any[]|null} zoznam nahrávok na prehratie, alebo null (prečíta hlas zariadenia)
 */
export function nahravkyPreVetu(veta, maNahravku) {
  const cela = maNahravku(klucNahravky(veta));
  if (cela) return [cela];
  const casti = castiVety(veta);
  if (casti.length < 2) return null;
  const najdene = casti.map(maNahravku);
  return najdene.every(Boolean) ? najdene : null;
}

/**
 * Úprava textu pre plynulejšie čítanie a rozdelenie na vety.
 * Kratšie vety s pauzou medzi nimi znejú prirodzenejšie a na iPade sa nezasekávajú.
 */
export function pripravText(text) {
  const upraveny = String(text || '')
    .replace(/[„“"«»]/g, '')
    .replace(/…|\.\.\./g, ', ')
    .replace(/\s[–—-]\s/g, ', ')
    .replace(/·/g, ', ')
    .replace(/(\d)\s*×\s*(\d)/g, '$1 krát $2')
    .replace(/\bPIN\b/g, 'pin')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.!?:;])/g, '$1')
    .replace(/,\s*,/g, ',')
    .trim();
  if (!upraveny) return [];
  // Delenie na vety: za . ! ? nasleduje medzera a veľké písmeno (nie dátum „12. 11.“)
  return upraveny
    .split(/(?<=[.!?])\s+(?=[A-ZÁÄČĎÉÍĹĽŇÓÔŔŠŤÚÝŽ])/u)
    .map((v) => v.replace(/^[,\s]+/, '').trim())
    .filter(Boolean);
}
