// PIN sa nikdy neukladá priamo. Ukladá sa len jeho „odtlačok“ spolu s náhodnou
// soľou, z ktorého sa PIN nedá prečítať.
//
// Odtlačok sa počíta pomalou funkciou PBKDF2 (SHA-256, veľa opakovaní), aby sa
// PIN nedal rýchlo uhádnuť ani zo súboru zálohy. Staršie záznamy (jednoduché
// SHA-256 so soľou) sa stále dajú overiť a pri prihlásení sa prevedú na nový tvar.

export const OPAKOVANIA = 200000;
const ZNACKA = 'p2'; // tvar nového odtlačku: p2$<počet opakovaní>$<64 hex znakov>

function naHex(bajty) {
  return Array.from(bajty, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function novaSol() {
  return naHex(crypto.getRandomValues(new Uint8Array(16)));
}

// Starý spôsob (SHA-256 zo „soľ:PIN“) – len na overenie starších záznamov
export async function odtlacokPinu(pin, sol) {
  const data = new TextEncoder().encode(`${sol}:${pin}`);
  const vysledok = await crypto.subtle.digest('SHA-256', data);
  return naHex(new Uint8Array(vysledok));
}

// Nový, pomalý spôsob (PBKDF2-HMAC-SHA-256)
export async function pomalyOdtlacok(pin, sol, opakovania = OPAKOVANIA) {
  const kodovac = new TextEncoder();
  const kluc = await crypto.subtle.importKey('raw', kodovac.encode(pin), 'PBKDF2', false, ['deriveBits']);
  const bity = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: kodovac.encode(sol), iterations: opakovania },
    kluc,
    256
  );
  return `${ZNACKA}$${opakovania}$${naHex(new Uint8Array(bity))}`;
}

export function jePlatnyPin(pin, dlzka = 4) {
  return typeof pin === 'string' && pin.length === dlzka && /^\d+$/.test(pin);
}

// Platný tvar uloženého odtlačku (starý aj nový) – používa sa pri kontrole zálohy
export function jePlatnyOdtlacok(text) {
  if (typeof text !== 'string') return false;
  if (/^[0-9a-f]{64}$/.test(text)) return true;
  const m = text.match(/^p2\$(\d{1,7})\$[0-9a-f]{64}$/);
  return Boolean(m) && Number(m[1]) >= 1000 && Number(m[1]) <= 5000000;
}

export function jeStaryOdtlacok(zaznam) {
  return typeof zaznam?.pinHash === 'string' && !zaznam.pinHash.startsWith(`${ZNACKA}$`);
}

// Vytvorí záznam { pinSol, pinHash } na uloženie
export async function zabezpecPin(pin) {
  const pinSol = novaSol();
  return { pinSol, pinHash: await pomalyOdtlacok(pin, pinSol) };
}

// Porovnanie, ktoré neprezradí, na ktorom znaku sa texty líšia
function rovnake(a, b) {
  if (a.length !== b.length) return false;
  let rozdiel = 0;
  for (let i = 0; i < a.length; i++) rozdiel |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return rozdiel === 0;
}

export async function overPin(pin, zaznam) {
  if (typeof pin !== 'string' || !zaznam?.pinSol || !jePlatnyOdtlacok(zaznam?.pinHash)) return false;
  if (jeStaryOdtlacok(zaznam)) return rovnake(await odtlacokPinu(pin, zaznam.pinSol), zaznam.pinHash);
  const opakovania = Number(zaznam.pinHash.split('$')[1]);
  return rovnake(await pomalyOdtlacok(pin, zaznam.pinSol, opakovania), zaznam.pinHash);
}
