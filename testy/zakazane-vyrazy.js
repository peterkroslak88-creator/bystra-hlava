// Výrazy, ktoré sa v appke NESMÚ objaviť (texty, kód ani komentáre).
// Appka je hra, nie zdravotnícka pomôcka. Zoznam sa smie len rozširovať.
// Jediná výnimka je presné znenie povinnej pätičky (pozri texty.js).

export const ZAKAZANE_VYRAZY = [
  { vyraz: /demenc/i, preco: 'diagnóza' },
  { vyraz: /alzheim/i, preco: 'diagnóza' },
  { vyraz: /kognit/i, preco: 'hodnotenie stavu' },
  { vyraz: /pokles/i, preco: 'hodnotenie stavu' },
  { vyraz: /zhor[sš]/i, preco: 'hodnotenie stavu' },
  { vyraz: /diagn[oó]/i, preco: 'diagnóza' },
  { vyraz: /rizik/i, preco: 'hodnotenie stavu' },
  { vyraz: /sk[oó]re/i, preco: 'skóre' },
  { vyraz: /klinick/i, preco: 'klinické testy' },
  { vyraz: /pacient/i, preco: 'zdravotnícky jazyk' },
  { vyraz: /chorob/i, preco: 'zdravotnícky jazyk' },
  { vyraz: /lie[čc]b/i, preco: 'zdravotnícky jazyk' },
  { vyraz: /\blie(k|ky|kov|kmi)\b/i, preco: 'lieky' },
  { vyraz: /zdravotn/i, preco: 'zdravotnícky jazyk' },
  { vyraz: /\bprah(y|u|ov|ová|ové)?\b/i, preco: 'prahy' },
  { vyraz: /rodn[éeého]+ č[ií]sl/i, preco: 'citlivé údaje' },
  { vyraz: /\bmmse\b|\bmoca\b/i, preco: 'klinické testy' },
  // Anglické tvary (napr. v názvoch v kóde)
  { vyraz: /dementia|cognitive|diagnos|\bscore|\brisk\b|patient|clinical|decline/i, preco: 'anglický ekvivalent' },
];
