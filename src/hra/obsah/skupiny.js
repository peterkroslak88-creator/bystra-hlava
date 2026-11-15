// Skupiny slov pre úlohy „Čo nepatrí do skupiny“ a „Nákupný zoznam“.

export const SKUPINY = {
  ovocie: { nazov: 'ovocie', medzi: 'ovocie', slova: ['jablko', 'hruška', 'slivka', 'čerešňa', 'marhuľa', 'broskyňa', 'hrozno', 'malina', 'jahoda', 'egreš'] },
  zelenina: { nazov: 'zelenina', medzi: 'zeleninu', slova: ['mrkva', 'petržlen', 'zeler', 'kapusta', 'cibuľa', 'cesnak', 'reďkovka', 'kaleráb', 'karfiol', 'špenát'] },
  kvety: { nazov: 'kvety', medzi: 'kvety', slova: ['ruža', 'tulipán', 'klinček', 'fialka', 'narcis', 'konvalinka', 'margaréta', 'slnečnica', 'pivonka', 'astra'] },
  stromy: { nazov: 'stromy', medzi: 'stromy', slova: ['dub', 'buk', 'lipa', 'breza', 'smrek', 'borovica', 'javor', 'jaseň', 'vŕba', 'topoľ'] },
  domace: { nazov: 'domáce zvieratá', medzi: 'domáce zvieratá', slova: ['krava', 'koza', 'ovca', 'kôň', 'prasa', 'sliepka', 'králik', 'morka', 'kohút', 'teľa'] },
  dive: { nazov: 'divé zvieratá', medzi: 'divé zvieratá', slova: ['líška', 'vlk', 'medveď', 'srnka', 'jeleň', 'zajac', 'jež', 'veverička', 'diviak', 'rys'] },
  vtaky: { nazov: 'vtáky', medzi: 'vtáky', slova: ['vrabec', 'lastovička', 'sýkorka', 'drozd', 'straka', 'vrana', 'bocian', 'sova', 'ďateľ', 'kukučka'] },
  nabytok: { nazov: 'nábytok', medzi: 'nábytok', slova: ['stôl', 'stolička', 'skriňa', 'posteľ', 'lavica', 'kreslo', 'komoda', 'polica', 'pohovka', 'kredenc'] },
  riad: { nazov: 'kuchynský riad', medzi: 'kuchynský riad', slova: ['hrniec', 'panvica', 'tanier', 'hrnček', 'misa', 'lyžica', 'vidlička', 'pokrievka', 'šálka', 'naberačka'] },
  oblecenie: { nazov: 'oblečenie', medzi: 'oblečenie', slova: ['košeľa', 'sukňa', 'nohavice', 'sveter', 'kabát', 'vesta', 'zástera', 'šatka', 'ponožky', 'čiapka'] },
  naradie: { nazov: 'náradie', medzi: 'náradie', slova: ['kladivo', 'píla', 'sekera', 'kosa', 'hrable', 'motyka', 'lopata', 'kliešte', 'skrutkovač', 'fúrik'] },
  nastroje: { nazov: 'hudobné nástroje', medzi: 'hudobné nástroje', slova: ['husle', 'harmonika', 'gitara', 'klavír', 'píšťalka', 'bubon', 'trúbka', 'fujara', 'cimbal', 'kontrabas'] },
  doprava: { nazov: 'dopravné prostriedky', medzi: 'dopravné prostriedky', slova: ['vlak', 'autobus', 'bicykel', 'auto', 'električka', 'loď', 'lietadlo', 'voz', 'motorka', 'traktor'] },
  mesiace: { nazov: 'mesiace', medzi: 'mesiace', slova: ['január', 'február', 'marec', 'apríl', 'máj', 'jún', 'júl', 'august', 'september', 'október'] },
  dni: { nazov: 'dni v týždni', medzi: 'dni v týždni', slova: ['pondelok', 'utorok', 'streda', 'štvrtok', 'piatok', 'sobota', 'nedeľa'] },
  farby: { nazov: 'farby', medzi: 'farby', slova: ['červená', 'modrá', 'zelená', 'žltá', 'biela', 'čierna', 'hnedá', 'fialová', 'oranžová', 'sivá'] },
};

// Príbuzné skupiny – na náročnejšie úrovne (rozdiel je jemnejší)
export const PRIBUZNE = [
  ['ovocie', 'zelenina'],
  ['kvety', 'stromy'],
  ['domace', 'dive'],
  ['nabytok', 'riad'],
  ['mesiace', 'dni'],
  ['naradie', 'riad'],
  ['oblecenie', 'nabytok'],
];

// Skupiny, ktoré sa nesmú miešať, lebo by odpoveď nebola jednoznačná
// (napr. sliepka je domáce zviera aj vták)
export const NEMIESAT = [
  ['vtaky', 'domace'],
  ['vtaky', 'dive'],
];

// Potraviny na nákupný zoznam
export const NAKUP = [
  'chlieb', 'mlieko', 'maslo', 'jablká', 'cukor', 'múka', 'vajíčka', 'syr', 'káva', 'čaj',
  'ryža', 'zemiaky', 'cibuľa', 'mrkva', 'rožky', 'tvaroh', 'med', 'soľ', 'olej', 'cestoviny',
  'kapusta', 'slanina', 'klobása', 'hrušky', 'slivky', 'orechy', 'mak', 'kakao', 'jogurt', 'smotana',
];
