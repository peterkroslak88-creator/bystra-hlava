// Svetlo v záhrade podľa dennej doby: ráno jemné, cez deň jasné,
// podvečer zlatá hodina, večer súmrak s prvými hviezdami.
// Noc nikdy nie je úplne tmavá, aby záhrada zostala dobre viditeľná.

// Kľúčové body dňa: hodina, farebný nádych (r, g, b) a sila hviezd (0–1)
const BODY = [
  { h: 0, nadych: [0.66, 0.72, 0.95], hviezdy: 1 },
  { h: 4.5, nadych: [0.66, 0.72, 0.95], hviezdy: 1 },
  { h: 6.5, nadych: [1.05, 0.94, 0.9], hviezdy: 0 }, // svitanie
  { h: 9, nadych: [1, 1, 1], hviezdy: 0 },
  { h: 16.5, nadych: [1, 1, 1], hviezdy: 0 },
  { h: 18.5, nadych: [1.08, 0.97, 0.84], hviezdy: 0 }, // zlatá hodina
  { h: 20.5, nadych: [0.84, 0.82, 0.97], hviezdy: 0.45 }, // súmrak
  { h: 22, nadych: [0.66, 0.72, 0.95], hviezdy: 1 },
  { h: 24, nadych: [0.66, 0.72, 0.95], hviezdy: 1 },
];

export const DOBY = [
  { nazov: 'Ráno', hodina: 6.75 },
  { nazov: 'Deň', hodina: 12 },
  { nazov: 'Zlatá hodina', hodina: 18.5 },
  { nazov: 'Večer', hodina: 21.5 },
];

export function hodinaTeraz(datum = new Date()) {
  return datum.getHours() + datum.getMinutes() / 60;
}

/**
 * @param {number} hodina 0–24
 * @returns {{nadych: number[], hviezdy: number}}
 */
export function svetloDna(hodina) {
  const h = ((hodina % 24) + 24) % 24;
  for (let i = 0; i < BODY.length - 1; i++) {
    const a = BODY[i];
    const b = BODY[i + 1];
    if (h >= a.h && h <= b.h) {
      const t = b.h === a.h ? 0 : (h - a.h) / (b.h - a.h);
      const k = t * t * (3 - 2 * t); // mäkký prechod
      return {
        nadych: a.nadych.map((v, j) => v + (b.nadych[j] - v) * k),
        hviezdy: a.hviezdy + (b.hviezdy - a.hviezdy) * k,
      };
    }
  }
  return { nadych: [1, 1, 1], hviezdy: 0 };
}
