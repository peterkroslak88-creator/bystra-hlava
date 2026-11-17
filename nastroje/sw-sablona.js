// Service worker appky Bystrá hlava – plný offline režim.
// Tento súbor je šablóna; skutočný sw.js vznikne pri `npm run build`.
// Nič neodosiela, len ukladá súbory appky do vyrovnávacej pamäte tabletu.

const VERZIA = 'bystra-hlava-__VERZIA__';
const SUBORY = __SUBORY__;

self.addEventListener('install', (udalost) => {
  udalost.waitUntil(
    caches
      .open(VERZIA)
      // cache: 'reload' = vždy čerstvé súbory zo servera, nie staré z krátkodobej pamäte
      // prehliadača (inak by sa mohla uložiť stará stránka a appka by ostala na starej verzii)
      .then((pamat) => pamat.addAll(SUBORY.map((s) => new Request(s, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

// Staré verzie appky sa z pamäte vymažú
self.addEventListener('activate', (udalost) => {
  udalost.waitUntil(
    caches
      .keys()
      .then((kluce) => Promise.all(kluce.filter((k) => k.startsWith('bystra-hlava-') && k !== VERZIA).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Najprv z pamäte tabletu; stránka sa vždy otvorí, aj bez internetu
self.addEventListener('fetch', (udalost) => {
  const poziadavka = udalost.request;
  if (poziadavka.method !== 'GET' || new URL(poziadavka.url).origin !== self.location.origin) return;
  udalost.respondWith(
    // ignoreVary: súbor sa nájde, aj keď ho prehliadač pýta s inými hlavičkami
    caches.match(poziadavka, { ignoreSearch: poziadavka.mode === 'navigate', ignoreVary: true }).then(
      (ulozene) =>
        ulozene ||
        fetch(poziadavka).catch(() =>
          poziadavka.mode === 'navigate' ? caches.match('index.html', { ignoreVary: true }) : Response.error()
        )
    )
  );
});
