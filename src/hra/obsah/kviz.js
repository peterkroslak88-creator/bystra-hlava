// Otázky pre skupinový kvíz. Prvá možnosť je vždy správna (pri zobrazení sa zamiešajú).
// Do kvízu sa pridávajú aj otázky zo Spomienok.
import { SPOMIENKY } from './spomienky.js';

export const KVIZ = [
  { otazka: 'Ako sa volá hlavné mesto Slovenska?', moznosti: ['Bratislava', 'Košice', 'Žilina', 'Nitra'] },
  { otazka: 'Ktorý vrch je najvyšší na Slovensku?', moznosti: ['Gerlachovský štít', 'Kriváň', 'Lomnický štít', 'Rysy'] },
  { otazka: 'Ktorá je najdlhšia rieka, ktorá tečie len územím Slovenska?', moznosti: ['Váh', 'Hron', 'Ipeľ', 'Poprad'] },
  { otazka: 'Na ktorej rieke leží Bratislava?', moznosti: ['Dunaj', 'Váh', 'Hron', 'Morava'] },
  { otazka: 'V ktorom pohorí leží Gerlachovský štít?', moznosti: ['Vysoké Tatry', 'Malá Fatra', 'Nízke Tatry', 'Slovenský raj'] },
  { otazka: 'V ktorom meste stojí Dóm svätej Alžbety?', moznosti: ['Košice', 'Bratislava', 'Prešov', 'Trnava'] },
  { otazka: 'Ktorý hrad patrí k najväčším hradným areálom v strednej Európe?', moznosti: ['Spišský hrad', 'Devín', 'Trenčiansky hrad', 'Oravský hrad'] },
  { otazka: 'Ktorý slovenský ľudový nástroj je zapísaný do zoznamu UNESCO?', moznosti: ['fujara', 'harmonika', 'gitara', 'klavír'] },
  { otazka: 'Kto stál pri zrode spisovnej slovenčiny v roku 1843?', moznosti: ['Ľudovít Štúr', 'Janko Kráľ', 'Pavol Országh Hviezdoslav', 'Ján Botto'] },
  { otazka: 'Ktorý slovenský astronóm a generál spoluzakladal Československo?', moznosti: ['Milan Rastislav Štefánik', 'Ľudovít Štúr', 'Anton Bernolák', 'Jozef Murgaš'] },
  { otazka: 'Ako sa volal slávny slovenský zbojník z Terchovej?', moznosti: ['Juraj Jánošík', 'Ján Botto', 'Jozef Murgaš', 'Andrej Sládkovič'] },
  { otazka: 'Aká farba je na slovenskej vlajke hore?', moznosti: ['biela', 'modrá', 'červená', 'zelená'] },
  { otazka: 'Ktorý strom je považovaný za symbol Slovanov?', moznosti: ['lipa', 'dub', 'smrek', 'breza'] },
  { otazka: 'Z akého syra sa robia bryndzové halušky?', moznosti: ['z ovčej bryndze', 'z eidamu', 'z tvarohu', 'z parmezánu'] },
  { otazka: 'Čím sa posypávajú bryndzové halušky?', moznosti: ['opečenou slaninou', 'práškovým cukrom', 'makom', 'orechmi'] },
  { otazka: 'Ktorý deň slávime Štedrý deň?', moznosti: ['24. decembra', '6. decembra', '31. decembra', '1. januára'] },
  { otazka: 'Ktorý kvet nazývame kráľovnou kvetov?', moznosti: ['ruža', 'tulipán', 'sedmokráska', 'púpava'] },
  { otazka: 'Ktorý vták podľa povery nosí deti?', moznosti: ['bocian', 'vrana', 'sova', 'holub'] },
  { otazka: 'Čo zbierajú včely z kvetov?', moznosti: ['nektár', 'piesok', 'kôru', 'listy'] },
  { otazka: 'Ktoré zviera nám dáva vlnu?', moznosti: ['ovca', 'krava', 'koza', 'kôň'] },
  { otazka: 'Koľko nôh má pavúk?', moznosti: ['osem', 'šesť', 'štyri', 'desať'] },
  { otazka: 'Koľko dní má priestupný rok?', moznosti: ['366', '365', '364', '360'] },
  { otazka: 'Ktorý mesiac má najmenej dní?', moznosti: ['február', 'apríl', 'jún', 'november'] },
  { otazka: 'Ktoré ročné obdobie nasleduje po zime?', moznosti: ['jar', 'leto', 'jeseň', 'zima'] },
  { otazka: 'Koľko hráčov jedného mužstva je naraz na futbalovom ihrisku?', moznosti: ['jedenásť', 'deväť', 'sedem', 'pätnásť'] },
  { otazka: 'Ktorá planéta je najbližšie k Slnku?', moznosti: ['Merkúr', 'Mars', 'Zem', 'Jupiter'] },
  { otazka: 'Koľko je sedem krát osem?', moznosti: ['56', '54', '48', '63'] },
  { otazka: 'Koľko minút má jedna hodina?', moznosti: ['60', '100', '30', '90'] },
  { otazka: 'Ako sa končí príslovie: Bez práce nie sú…?', moznosti: ['koláče', 'peniaze', 'kvety', 'sny'] },
  { otazka: 'Ako sa končí príslovie: Kto druhému jamu kope…?', moznosti: ['sám do nej padne', 'ten má lopatu', 'má čo robiť', 'nájde poklad'] },
];

// Celá zásoba otázok kvízu: vlastné otázky + známejšie spomienky
export function zasobaKvizu() {
  return [
    ...KVIZ,
    ...SPOMIENKY.filter((s) => s.stupen <= 2).map((s) => ({ otazka: s.otazka, moznosti: s.moznosti })),
  ];
}
