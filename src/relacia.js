// Kto je práve prihlásený. Drží sa len v pamäti, po zatvorení appky zmizne.
// Po 15 minútach nečinnosti sa používateľ automaticky odhlási.

const LIMIT_NECINNOSTI = 15 * 60 * 1000;

export const relacia = {
  rola: null, // 'personal' | 'klient' | null
  hracId: null,
};

let poslednaAktivita = Date.now();
let priOdhlaseni = () => {};

export function prihlasPersonal() {
  relacia.rola = 'personal';
  relacia.hracId = null;
  poslednaAktivita = Date.now();
}

export function prihlasKlienta(hracId) {
  relacia.rola = 'klient';
  relacia.hracId = hracId;
  poslednaAktivita = Date.now();
}

export function odhlas() {
  relacia.rola = null;
  relacia.hracId = null;
}

function zaznamenajAktivitu() {
  poslednaAktivita = Date.now();
}

function skontroluj() {
  if (relacia.rola && Date.now() - poslednaAktivita > LIMIT_NECINNOSTI) {
    odhlas();
    priOdhlaseni();
  }
}

// Spustí sledovanie nečinnosti; funguje aj keď bol tablet uspatý
export function sledujNecinnost(akcia) {
  priOdhlaseni = akcia;
  for (const udalost of ['pointerdown', 'keydown', 'wheel', 'touchstart']) {
    window.addEventListener(udalost, zaznamenajAktivitu, { passive: true });
  }
  setInterval(skontroluj, 20 * 1000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) skontroluj();
  });
}
