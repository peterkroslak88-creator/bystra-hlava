// Spoločné texty appky na jednom mieste.
// Pozor: automatický test kontroluje, že tu nie sú zakázané výrazy.

export const PATICKA =
  'Aplikácia slúži na aktivizáciu a tréning v hre. Nie je zdravotníckou pomôckou a jej údaje nie sú podkladom na diagnostiku ani liečbu. Údaje zostávajú len v tomto zariadení a nikam sa neodosielajú.';

export const VYSVETLIVKY = {
  pin: {
    nazov: 'PIN',
    text: 'PIN sú štyri číslice, ktoré pozná hráč a personál. Vďaka nemu sa do vašej záhrady nikto iný nedostane omylom.',
  },
  pinPersonalu: {
    nazov: 'PIN personálu',
    text: 'PIN personálu má šesť číslic. Otvára správu hráčov, preto ho poznajú len zamestnanci.',
  },
  jemnyRezim: {
    nazov: 'Jemný režim',
    text: 'V jemnom režime zostávajú úlohy stále rovnako ťažké a na každú odpoveď je viac času. Hodí sa na pokojné dni.',
  },
  obtiaznost: {
    nazov: 'Obťažnosť',
    text: 'Obťažnosť určuje, aké náročné budú úlohy. V rámci zvolenej obťažnosti sa hra potichu prispôsobí tomu, ako sa darí.',
  },
  ukazkovyHrac: {
    nazov: 'Ukážkový hráč',
    text: 'Pridá hráča s menom Ukážka a PIN 1234. Hodí sa na predstavenie hry novým hráčom alebo kolegom.',
  },
  coUklada: {
    nazov: 'Čo appka ukladá',
    text: 'Appka si pamätá len prezývku, obrázok, zabezpečený PIN, dni, keď sa hralo, a nastavenia hry. Odpovede sa nikde neukladajú a nič neodchádza mimo tento tablet.',
  },
  upozornenia: {
    nazov: 'Upozornenia',
    text: 'Ukážu hráčov, ktorí sa niekoľko dní nezapojili do hry, aby ste ich mohli pozvať. Počet dní si nastavíte sami.',
  },
  kviz: {
    nazov: 'Skupinový kvíz',
    text: 'Kvíz pre 2 až 4 tímy na projektor alebo veľkú obrazovku. Moderátor číta otázky, odkryje odpoveď a pripíše body. Nič sa neukladá.',
  },
  hlas: {
    nazov: 'Hlas na čítanie',
    text: 'Appka číta vlastným zabudovaným hlasom Lili. Ak chcete, zvoľte namiesto neho hlas uložený v tablete. Text sa nikam neposiela.',
  },
  zaloha: {
    nazov: 'Záloha a obnova',
    text: 'Záloha uloží hráčov a nastavenia do súboru. Ten môžete nahrať na inom tablete alebo po výmene tabletu. Obnova nahradí všetky súčasné údaje.',
  },
  vymazanie: {
    nazov: 'Vymazanie údajov',
    text: 'Vymaže všetkých hráčov, ich záhrady aj PIN personálu. Appka sa vráti do stavu po inštalácii. Predtým si urobte zálohu.',
  },
  nahladZahrady: {
    nazov: 'Náhľad záhrady',
    text: 'Tu si môžete vyskúšať, ako záhrada vyzerá po rôznom počte dní. Slúži na predvádzanie a nič nemení.',
  },
  zahrada: {
    nazov: 'Záhrada',
    text: 'Každý deň, keď si zahráte, v záhrade niečo pribudne. Z pustej krajiny sa postupne stane rozkvitnutá záhrada.',
  },
};

// Pozdrav podľa dennej doby
export function pozdrav(datum = new Date()) {
  const hodina = datum.getHours();
  if (hodina < 10) return 'Dobré ráno';
  if (hodina < 18) return 'Dobrý deň';
  return 'Dobrý večer';
}
