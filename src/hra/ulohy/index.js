// Zoznam všetkých typov úloh.
import { ULOHA as stredOkraj } from './stred-okraj.js';
import { ULOHA as pexeso } from './pexeso.js';
import { ULOHA as nakup } from './nakup.js';
import { ULOHA as slovo } from './slovo.js';
import { ULOHA as tvary } from './tvary.js';
import { PRISLOVIE, RADY, NEPATRI, SPOMIENKY } from './slovne.js';

export const ULOHY = {
  stredOkraj,
  pexeso,
  nakup,
  prislovie: PRISLOVIE,
  slovo,
  rady: RADY,
  nepatri: NEPATRI,
  tvary,
  spomienky: SPOMIENKY,
};
