// Úložisko v tablete (IndexedDB). Nič sa neodosiela mimo zariadenie.

const NAZOV = 'bystra-hlava';
const VERZIA = 1;

let otvaranie = null;

function otvor() {
  if (!otvaranie) {
    otvaranie = new Promise((hotovo, chyba) => {
      const poziadavka = indexedDB.open(NAZOV, VERZIA);
      poziadavka.onupgradeneeded = () => {
        const db = poziadavka.result;
        if (!db.objectStoreNames.contains('nastavenia')) db.createObjectStore('nastavenia');
        if (!db.objectStoreNames.contains('hraci')) db.createObjectStore('hraci', { keyPath: 'id' });
      };
      poziadavka.onsuccess = () => hotovo(poziadavka.result);
      poziadavka.onerror = () => chyba(poziadavka.error);
    });
  }
  return otvaranie;
}

async function transakcia(sklad, rezim, praca) {
  const db = await otvor();
  return new Promise((hotovo, chyba) => {
    const t = db.transaction(sklad, rezim);
    const poziadavka = praca(t.objectStore(sklad));
    t.oncomplete = () => hotovo(poziadavka ? poziadavka.result : undefined);
    t.onerror = () => chyba(t.error);
    t.onabort = () => chyba(t.error);
  });
}

export const db = {
  citajNastavenie: (kluc) => transakcia('nastavenia', 'readonly', (s) => s.get(kluc)),
  ulozNastavenie: (kluc, hodnota) => transakcia('nastavenia', 'readwrite', (s) => s.put(hodnota, kluc)),
  vsetciHraci: () => transakcia('hraci', 'readonly', (s) => s.getAll()),
  hrac: (id) => transakcia('hraci', 'readonly', (s) => s.get(id)),
  ulozHraca: (hrac) => transakcia('hraci', 'readwrite', (s) => s.put(hrac)),
  vymazHraca: (id) => transakcia('hraci', 'readwrite', (s) => s.delete(id)),
  async vymazVsetko() {
    await transakcia('hraci', 'readwrite', (s) => s.clear());
    await transakcia('nastavenia', 'readwrite', (s) => s.clear());
  },
};
