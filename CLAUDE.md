# Bystrá hlava

Hra na aktivizáciu a tréning mysle pre klientov zariadenia sociálnych služieb (prevažne seniori so zníženou pohyblivosťou). Hrá sa na iPade, často s pomocou personálu. PWA, plne offline.

## Komunikácia s majiteľom projektu
- Vždy po slovensky, jednoducho, bez technického žargónu (majiteľ nie je programátor).
- Pracuje sa po fázach. Pred každou fázou krátky plán a čakať na súhlas.
- **Nič nenasadzovať (deploy), kým to majiteľ výslovne nepovie.**
- Komentáre v kóde po slovensky.

## 1. Čo appka je a čo NIE JE
- Je to **hra** na aktivizáciu a tréning. **Nie je zdravotnícka pomôcka.**
- Nič nediagnostikuje, nehodnotí zdravotný ani kognitívny stav, nedáva zdravotné odporúčania.
- Zakázané v texte, kóde aj dizajne: klinické testy, skóre, prahy, hodnotenie stavu.
- Zakázané výrazy sú v `testy/zakazane-vyrazy.js`; automatický test kontroluje všetky texty appky. Zoznam rozširovať, nikdy neobchádzať.
- Pätička na každej obrazovke (presné znenie):
  > Aplikácia slúži na aktivizáciu a tréning v hre. Nie je zdravotníckou pomôckou a jej údaje nie sú podkladom na diagnostiku ani liečbu. Údaje zostávajú len v tomto zariadení a nikam sa neodosielajú.

## 2. Údaje: žiadne citlivé, nič na server
- Všetko len v zariadení (IndexedDB, prípadne localStorage). Žiadny server, žiadne odosielanie, žiadna analytika ani sledovanie, žiadne externé požiadavky počas behu (písma sú lokálne).
- Pri klientovi sa ukladá **iba**:
  - prezývka alebo krstné meno,
  - botanický obrázok profilu,
  - PIN len ako hash (SHA-256 so soľou),
  - zoznam dní, keď hral,
  - obťažnosť, jemný režim, aktuálna úroveň úloh v rámci obťažnosti (len nastavenie hry).
- **Nikdy** sa neukladajú výsledky, skóre, história úspešnosti, rodné čísla, diagnózy, lieky ani zdravotné poznámky. Appka na to nemá ani políčko.
- Úspešnosť v rámci jedného tréningu sa drží len v pamäti počas hry (na prispôsobenie úrovne) a potom sa zahodí.
- Personál: záloha do súboru / obnova, vymazanie hráča aj všetkých údajov, vždy s potvrdením priamo na stránke (nie `alert`/`confirm`).
- Po 15 minútach nečinnosti automatické odhlásenie.
- Test kontroluje, že uložený záznam hráča obsahuje iba povolené polia.

## Zabezpečenie
- PIN: `src/ulozisko/pin.js` – PBKDF2-HMAC-SHA-256, 200 000 opakovaní, soľ; tvar `p2$<opakovania>$<hex>` v poli `pinHash`. Staré záznamy (čisté SHA-256) sa overia a pri správnom PIN prevedú. Neznižovať počet opakovaní.
- Prestávka po nesprávnych pokusoch: `src/ulozisko/zamok.js` – uložená v nastavení `zamky` (nie pri hráčovi), 5 pokusov, potom 30 s a zdvojnásobovanie do 15 min. Nesmie sa dať obísť návratom späť.
- CSP v `index.html`: len `'self'`, žiadne cudzie adresy, žiadne `unsafe-inline`/`unsafe-eval` pre skripty. Test to stráži; `npm run kontrola` hlási, ak CSP niečo zablokuje.
- Všetok text od používateľa ide cez `h()` ako textový uzol; `html:` len pre vlastné konštantné SVG.
- Git: autor commitov je anonymná GitHub adresa (`…@users.noreply.github.com`), úložisko je verejné – nikdy tam nedávať súkromný e-mail ani iné osobné údaje.
- Známe obmedzenie: appky pod rovnakou adresou `*.github.io` zdieľajú úložisko prehliadača; pri ďalších appkách zvážiť vlastnú adresu.

## 3. Roly
- **Personál:** jeden PIN (nastaví sa pri prvom spustení, zadá sa 2×). Spravuje hráčov, vidí len počet dní a kedy naposledy hral, upozornenie „Hráč sa N dní nezapojil do hry“ (N predvolene 5), skupinový kvíz, ukážkový hráč (PIN 1234), skrytý náhľad záhrady.
- **Klient:** ťukne na svoj obrázok, zadá 4-miestny PIN, vidí svoju záhradu.
- Obťažnosť: Ľahká 1–3, Stredná 4–7, Náročná 8–10. Tiché prispôsobenie: ≥ 90 % správne → +1, < 60 % → −1. Jemný režim: úroveň sa nemení, viac času.

## 4. Hra
- Denný tréning: 4 úlohy z rôznych oblastí (~10 min). Každá oblasť aj samostatne.
- Oblasti: Bystré oko (stred a okraj), Pamäť (pexeso, nákupný zoznam), Slová (príslovie, poskladaj slovo), Logika (rady čísel, čo nepatrí), Orientácia (otočené tvary), Spomienky (ako to bolo kedysi).
- Spätná väzba: „Správne!“ / „Nevadí“ + zvýraznenie správnej odpovede. Žiadne body, rebríčky, porovnávanie.
- Čítanie nahlas: Web Speech API, sk-SK, rýchlosť 0,9. Logika v `src/komponenty/hlas-logika.js` (testovaná): vyberá najkrajší slovenský hlas (vylepšený/prémiový má prednosť), **nikdy online hlas** (`localService === false` alebo „Online“ v názve – posielal by text na server). Text sa číta po vetách s pauzou ~0,3 s. Personál môže zvoliť hlas (Personál → Hlas na čítanie), uloží sa ako nastavenie tabletu `hlasCitania`, nie k hráčovi. Na iPade odporúčame „Laura (vylepšený)“ – návod v NAVOD.md.
- Skupinový kvíz: 2–4 tímy, 10 otázok, moderátor pripisuje body, nič sa neukladá.
- Vysvetlivky „i“: skutočný `<button>`, `aria-expanded`, klávesnica, plocha ≥ 44 × 44 px, text 1–3 vety + tlačidlo „prečítať nahlas“.

## 6. Dizajn: umelecké dielo pre dospelých, nie detská hra
- Nálada ručne maľovaných pozadí japonských animovaných filmov: hĺbka, mäkké svetlo, sýte zelene, kopovité oblaky, pokoj. **Žiadne postavy ani prvky zo štúdia Ghibli či iných diel**, iba atmosféra.
- Akvarelová papierová textúra, nadpisy Cormorant Garamond, text Nunito.
- Paleta z malieb: zelene, levanduľová, náprstníková ružová, okrová, krémová. Karty ako papier s jemným tieňom.
- Botanické ilustrácie v štýle starého herbára namiesto ikon. Ak chýbajú, dočasné jemné kontúrové SVG (nie kreslené detské ikony).
- Animácie (GSAP): nadpisy z rozmazania, občasný lesk na hlavnom tlačidle, karty jemne vyplávajú, plynulé prechody, padajúce lupene po úlohe.
- **Ovládacie prvky stoja pevne** (žiadne magnetické, nakláňacie či posúvajúce sa tlačidlá). Hýbe sa krajina, nie tlačidlá. Žiadne blikanie, všetko pomalé.
- `prefers-reduced-motion` → animácie a paralaxa vypnuté.
- Prístupnosť: text ≥ 18 px, tlačidlá ≥ 56 px vysoké, kontrast ≥ 4,5 : 1, žiadne emoji ani reklamy, ikony vždy s popiskom.
- iPad na šírku aj na výšku, funguje aj na telefóne a počítači. Cieľ 60 fps, animácie pauza na pozadí.

## Logo Care Orbit (autor appky)
- Logo majiteľa projektu, má byť na **každej** jeho aplikácii. Originál: `obrazky/originaly/care-orbit-logo.png`.
- Vektorová kresba v `src/dizajn/logo.js` (znak + nápis Cormorant Garamond, „Orbit“ kurzívou). Verzie: `svetle` (krémová/biela na tmavom, ako originál) a `tmave` (atrament a okrová na papieri – používa Bystrá hlava).
- V appke: v pätičke každej obrazovky; na úvode a pri prvom spustení väčšie. Nie v herných úlohách. Kontrola (`npm run kontrola`) overuje, že je viditeľné.
- Balík pre iné aplikácie: priečinok `logo/` (SVG znaku, PNG celého loga s priehľadným pozadím, ukážka na tmavom podklade) – vytvorí `npm run logo`.

## 7. Záhrada
- `pust` → `zahrada` (rovnaká kompozícia), `kvet`, `kotul`, voliteľne `puk`. Originály v `obrazky/originaly/`, pripravené WebP v `public/obrazky/`.
- 0 dní: púšť, horúci vzduch, oblaky, náhodný kotúľ (20–40 s).
- 1 deň: rast kvetu (4–5 s, len raz). Ďalej odkrývanie záhrady šumovou maskou od kvetu, plná ~45 dní. Míľniky 7, 10, 14, 21, 30, 45.
- Vietor: generovaná tráva a kvety v odkrytej časti, poryvy ako vlna. Paralaxa, ročné obdobia.
- Kód: `src/zahrada/` – `malba.js` (WebGL shader: prelínanie, horúci vzduch, oblaky), `vietor.js` (canvas: tráva, kvety, kotúľ, častice), `scena.js` (spája všetko, kvet a rast), `milniky.js` (podiel odkrytia podľa dní, texty), `sum.js` (poradové pole – rovnaký vzorec v JS aj GLSL, musia sa zhodovať).
- Atmosféra (len nálada, žiadne prvky z filmov): v `malba.js` plávajúce kopovité oblaky (len na oblohe – maska podľa farby a polohy), tiene oblakov a slnečné škvrny na zemi, vlny vetra na lúke, slnečné lúče, hmla v diaľke, hviezdy. `svetlo.js`: nádych podľa dennej doby (ráno, deň, zlatá hodina, večer; nikdy nie tmavšie než 0,6). `vietor.js`: kŕdeľ vtákov v diaľke (od 7 dní), trblietanie na lúke, večer svetlušky. Ukážkové snímky: `npm run ukazka`.
- Prípravu obrázkov robí `npm run obrazky` (sharp; rembg nie je, Python chýba). Kvet: kľúčovanie bielej len od okraja, aby bledé lupene zostali celé.
- Animácia rastu (kvet pri prvom dni, inak rozšírenie záhrady) sa prehrá len cez parameter `rastOd` pri prechode z tréningu – nič sa o nej neukladá.
- Deň hrania sa zapíše po dokončení prvej úlohy v ten deň (denný tréning aj samostatná oblasť). Záhrada rastie max. raz za deň.

## Personál – kód
- `src/ulozisko/zaloha.js`: záloha (JSON so značkou `bystra-hlava-zaloha`, verzia 1), obnova s kontrolou a čistením každého hráča, vymazanie všetkého.
- Upozornenia: `hraciNaUpozornenie()` v `hraci.js`, počet dní v nastavení `dniUpozornenia` (predvolene 5).
- Skupinový kvíz: `src/obrazovky/kviz.js`, otázky v `src/hra/obsah/kviz.js` + známejšie Spomienky. Body len v pamäti.

## Hra – kód
- `src/hra/oblasti.js` (6 oblastí, rastlina a farba, denný tréning), `src/hra/logika.js` (čistá logika a parametre úrovní 1–10, testovaná), `src/hra/obsah/` (príslovia, slová, spomienky, skupiny – len overené slovenské texty), `src/hra/ulohy/` (zobrazenie úloh).
- Úspešnosť (`spravne/spolu`) žije len v pamäti počas úlohy, uloží sa iba nová úroveň.
- Pri pridávaní obsahu: príslovie má jedno `{slovo}`; spomienka má 4 možnosti a prvá je správna; slovo nesmie byť v dvoch skupinách.
- Adresa `?bezpohybu` vypne animácie (na kontrolné snímky).

## Technológia
- Vite + čistý JavaScript (ES moduly), GSAP. Testy: Vitest.
- PWA: `public/manifest.webmanifest`, ikony v `public/ikony/` (`npm run ikony`), service worker vzniká pri buildu zo `nastroje/sw-sablona.js` (zoznam súborov dopĺňa plugin vo `vite.config.js`; `ignoreVary` je nutné, inak offline nenájde súbory).
- Písma len latin + latin-ext (offline balík ~1 MB).

## Kontrola pred odovzdaním
- `npm test` – zakázané výrazy, emoji, PIN, obťažnosť, povolené polia, záloha, súkromie (žiadne volania servera), manifest.
- `npm run kontrola` – Playwright (Chromium) prejde 29 obrazoviek ako iPad na výšku aj na šírku, odfotí ich do `snimky/`, skontroluje text ≥ 18 px, kontrast ≥ 4,5 : 1, tlačidlá ≥ 56 px, plochy ≥ 44 px, popisky a pätičku, a overí offline režim. Správa: `snimky/kontrola.md`.
- Hosting (až na pokyn): GitHub Pages.
