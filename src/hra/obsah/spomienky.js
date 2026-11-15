// Spomienky: „ako to bolo kedysi“. Prvá možnosť je vždy správna
// (pri zobrazení sa zamiešajú). stupen 1 = známe, 3 = menej známe.
// rozhovor = námet na krátky rozhovor s personálom po odpovedi.

export const SPOMIENKY = [
  {
    otazka: 'Čím sa kedysi ručne pralo prádlo?',
    moznosti: ['valchou', 'žehličkou', 'sitom', 'motykou'],
    stupen: 1,
    rozhovor: 'Pamätáte si, kde sa u vás pralo prádlo?',
  },
  {
    otazka: 'Na čo slúžila petrolejová lampa?',
    moznosti: ['na svietenie', 'na varenie', 'na pranie', 'na šitie'],
    stupen: 1,
  },
  {
    otazka: 'Kde sa na dedine piekol chlieb?',
    moznosti: ['v peci', 'v pivnici', 'v studni', 'v stodole'],
    stupen: 1,
    rozhovor: 'Kto u vás doma piekol chlieb?',
  },
  {
    otazka: 'Čo sa robilo na páračkách?',
    moznosti: ['páralo sa perie', 'piekli sa koláče', 'strihali sa ovce', 'mlátilo sa obilie'],
    stupen: 2,
    rozhovor: 'Chodili ste na páračky? O čom sa tam rozprávalo?',
  },
  {
    otazka: 'Čím sa kosila tráva na lúke?',
    moznosti: ['kosou', 'hrabľami', 'lopatou', 'sekerou'],
    stupen: 1,
  },
  {
    otazka: 'Čím sa obracalo a zhŕňalo seno?',
    moznosti: ['hrabľami', 'kosou', 'pílou', 'kladivom'],
    stupen: 1,
  },
  {
    otazka: 'V čom sa na zimu kvasila kapusta?',
    moznosti: ['v sude', 'vo vreci', 'v košíku', 'v krabici'],
    stupen: 1,
  },
  {
    otazka: 'Ako sa na starom telefóne volilo číslo?',
    moznosti: ['otáčaním číselníka', 'ťukaním na obrazovku', 'hlasom', 'písaním listu'],
    stupen: 1,
  },
  {
    otazka: 'Čo nosil poštár?',
    moznosti: ['listy a noviny', 'chlieb', 'mlieko', 'uhlie'],
    stupen: 1,
  },
  {
    otazka: 'Čím písali deti v škole na bridlicovú tabuľku?',
    moznosti: ['grifľom', 'štetcom', 'uhlíkom', 'kriedou na stenu'],
    stupen: 2,
    rozhovor: 'Spomínate si na svoju prvú školu alebo učiteľa?',
  },
  {
    otazka: 'Do čoho sa namáčalo pero pri písaní atramentom?',
    moznosti: ['do kalamára', 'do pohára', 'do misky', 'do lavóra'],
    stupen: 2,
  },
  {
    otazka: 'Čím sa kúrilo v kachliach?',
    moznosti: ['drevom alebo uhlím', 'slamou', 'olejom', 'pieskom'],
    stupen: 1,
  },
  {
    otazka: 'Čo ťahali kone na poli a na ceste?',
    moznosti: ['voz', 'bicykel', 'autobus', 'loď'],
    stupen: 1,
  },
  {
    otazka: 'Na čom sa kedysi púšťali gramofónové platne?',
    moznosti: ['na gramofóne', 'na telefóne', 'na šijacom stroji', 'na kolovrátku'],
    stupen: 1,
    rozhovor: 'Akú pieseň ste radi počúvali?',
  },
  {
    otazka: 'Čo sa oslavovalo na dožinkách?',
    moznosti: ['koniec žatvy', 'začiatok školy', 'prvý sneh', 'narodeniny starostu'],
    stupen: 2,
  },
  {
    otazka: 'Kedy chodili koledníci po domoch?',
    moznosti: ['na Vianoce', 'v lete pri žatve', 'na jeseň pri oberačke', 'na Turíce'],
    stupen: 1,
    rozhovor: 'Pamätáte si nejakú koledu?',
  },
  {
    otazka: 'Čo robili chlapci dievčatám na Veľkonočný pondelok?',
    moznosti: ['oblievali ich vodou', 'zdobili im stromček', 'púšťali im šarkany', 'nosili im listy'],
    stupen: 1,
  },
  {
    otazka: 'Čo púšťali deti na jeseň na strnisku?',
    moznosti: ['šarkany', 'lodičky', 'balóny', 'holuby'],
    stupen: 1,
    rozhovor: 'Robili ste si šarkana aj sami?',
  },
  {
    otazka: 'Odkiaľ sa na dedine kedysi brala voda?',
    moznosti: ['zo studne', 'z pivnice', 'zo stodoly', 'z komína'],
    stupen: 1,
  },
  {
    otazka: 'Kde sa cez zimu skladovali zemiaky?',
    moznosti: ['v pivnici', 'na streche', 'v studni', 'v kuchyni na stole'],
    stupen: 1,
  },
  {
    otazka: 'Kam sa ukladalo obilie a seno?',
    moznosti: ['do stodoly', 'do pivnice', 'do kuchyne', 'do školy'],
    stupen: 1,
  },
  {
    otazka: 'Ako sa doma robilo maslo?',
    moznosti: ['mútením smotany', 'varením mlieka', 'pečením tvarohu', 'sušením syra'],
    stupen: 2,
  },
  {
    otazka: 'Čo sa často jedlo na Štedrý večer ako prvé?',
    moznosti: ['oblátky s medom', 'guláš', 'palacinky', 'pečené kura'],
    stupen: 1,
    rozhovor: 'Čo sa u vás varilo na Vianoce?',
  },
  {
    otazka: 'Ako sa žehlilo, keď ešte neboli elektrické žehličky?',
    moznosti: ['žehličkou nahriatou na sporáku', 'fénom', 'valchou', 'studeným kameňom'],
    stupen: 2,
  },
  {
    otazka: 'Na čo sa používal kolovrátok?',
    moznosti: ['na pradenie', 'na mletie obilia', 'na pranie', 'na kosenie'],
    stupen: 2,
  },
  {
    otazka: 'Na čo slúžili krosná?',
    moznosti: ['na tkanie látok', 'na pečenie chleba', 'na sušenie sena', 'na nosenie vody'],
    stupen: 3,
  },
  {
    otazka: 'Kde sa mlelo obilie na múku?',
    moznosti: ['v mlyne', 'v kováčskej dielni', 'v kostole', 'na pošte'],
    stupen: 1,
  },
  {
    otazka: 'Ako sa ľudovo hovorilo sporáku na drevo?',
    moznosti: ['šporák', 'kredenc', 'almárka', 'lavór'],
    stupen: 2,
  },
  {
    otazka: 'Čo bol lavór?',
    moznosti: ['misa na umývanie', 'skriňa na šaty', 'drevená stolička', 'zimný kabát'],
    stupen: 2,
  },
  {
    otazka: 'Čo bol kredenc?',
    moznosti: ['kuchynská skriňa na riad', 'druh koláča', 'dedinský tanec', 'pracovný nástroj'],
    stupen: 2,
  },
  {
    otazka: 'Čo sa robilo na zabíjačke?',
    moznosti: ['klobásy a jaternice', 'chlieb a rožky', 'maslo a tvaroh', 'džem a kompót'],
    stupen: 1,
    rozhovor: 'Aké jedlo zo zabíjačky ste mali najradšej?',
  },
  {
    otazka: 'Kde sa deti v lete kúpali, keď nebolo kúpalisko?',
    moznosti: ['v potoku alebo v rieke', 'v studni', 'v sude na kapustu', 'v pivnici'],
    stupen: 1,
  },
  {
    otazka: 'Čo nosili ženy na hlave ku kroju?',
    moznosti: ['šatku alebo čepiec', 'prilbu', 'cylinder', 'korunu'],
    stupen: 1,
  },
  {
    otazka: 'Akými peniazmi sa platilo v Československu?',
    moznosti: ['korunami', 'eurami', 'dolármi', 'markami'],
    stupen: 1,
  },
  {
    otazka: 'Kde sa v meste kupovala zelenina a vajíčka od gazdiniek?',
    moznosti: ['na trhu', 'na pošte', 'v kine', 'na stanici'],
    stupen: 1,
  },
  {
    otazka: 'Čo sa robilo s perinami za pekného počasia?',
    moznosti: ['vetrali sa na slnku', 'zakopali sa do zeme', 'namočili sa do potoka', 'odniesli sa do mlyna'],
    stupen: 2,
  },
  {
    otazka: 'Kto chodil s koňom podkúvať k vyhni?',
    moznosti: ['ku kováčovi', 'k mlynárovi', 'k pekárovi', 'k poštárovi'],
    stupen: 2,
  },
  {
    otazka: 'Čo sa robilo na priadkach?',
    moznosti: ['priadlo sa a spievalo', 'kosilo sa', 'pieklo sa', 'stavalo sa'],
    stupen: 3,
    rozhovor: 'Aké piesne sa spievali pri spoločnej práci?',
  },
  {
    otazka: 'Ako sa volal veľký spoločný hrniec na varenie lekváru vonku?',
    moznosti: ['kotol', 'krčah', 'hrnček', 'džbán'],
    stupen: 3,
  },
  {
    otazka: 'Z čoho sa varil lekvár?',
    moznosti: ['zo sliviek', 'zo zemiakov', 'z kapusty', 'z fazule'],
    stupen: 1,
    rozhovor: 'Varili ste lekvár aj u vás doma?',
  },
];
