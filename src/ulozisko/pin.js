// PIN sa nikdy neukladá priamo. Ukladá sa len jeho „odtlačok“
// (SHA-256) spolu s náhodnou soľou, z ktorého sa PIN nedá prečítať.

function naHex(bajty) {
  return Array.from(bajty, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function novaSol() {
  return naHex(crypto.getRandomValues(new Uint8Array(16)));
}

export async function odtlacokPinu(pin, sol) {
  const data = new TextEncoder().encode(`${sol}:${pin}`);
  const vysledok = await crypto.subtle.digest('SHA-256', data);
  return naHex(new Uint8Array(vysledok));
}

export function jePlatnyPin(pin, dlzka = 4) {
  return typeof pin === 'string' && pin.length === dlzka && /^\d+$/.test(pin);
}

// Vytvorí záznam { pinSol, pinHash } na uloženie
export async function zabezpecPin(pin) {
  const pinSol = novaSol();
  return { pinSol, pinHash: await odtlacokPinu(pin, pinSol) };
}

export async function overPin(pin, zaznam) {
  if (!zaznam?.pinSol || !zaznam?.pinHash) return false;
  return (await odtlacokPinu(pin, zaznam.pinSol)) === zaznam.pinHash;
}
