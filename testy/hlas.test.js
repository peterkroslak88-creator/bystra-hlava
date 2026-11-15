// Testy výberu hlasu a prípravy textu na čítanie nahlas.
import { describe, it, expect } from 'vitest';
import { vyberHlas, slovenskeHlasy, pripravText, jeMiestny, RYCHLOST } from '../src/komponenty/hlas-logika.js';

const hlas = (name, lang = 'sk-SK', localService = true, voiceURI = name) => ({ name, lang, localService, voiceURI, default: false });

describe('výber hlasu', () => {
  it('nikdy nevyberie hlas, ktorý posiela text na internet', () => {
    const hlasy = [hlas('Microsoft Viktória Online (Natural) - Slovak', 'sk-SK', false), hlas('Microsoft Filip')];
    expect(vyberHlas(hlasy).name).toBe('Microsoft Filip');
    expect(jeMiestny(hlas('Niečo Online', 'sk-SK', true))).toBe(false);
    expect(vyberHlas([hlas('Viktória Online', 'sk-SK', false)])).toBeNull();
  });

  it('uprednostní vylepšený hlas pred obyčajným', () => {
    const hlasy = [hlas('Laura'), hlas('Laura (Enhanced)'), hlas('Filip')];
    expect(vyberHlas(hlasy).name).toBe('Laura (Enhanced)');
    expect(vyberHlas([hlas('Laura'), hlas('Laura (vylepšený)')]).name).toBe('Laura (vylepšený)');
    expect(vyberHlas([hlas('Laura (Premium)'), hlas('Laura (Enhanced)')]).name).toBe('Laura (Premium)');
  });

  it('vyberá len slovenské hlasy', () => {
    const hlasy = [hlas('Samantha (Enhanced)', 'en-US'), hlas('Zuzana', 'cs-CZ'), hlas('Laura', 'sk_SK')];
    expect(slovenskeHlasy(hlasy).map((x) => x.name)).toEqual(['Laura']);
    expect(vyberHlas([hlas('Samantha', 'en-US')])).toBeNull();
  });

  it('rešpektuje hlas zvolený personálom, ak v tablete je', () => {
    const hlasy = [hlas('Laura (Enhanced)'), hlas('Filip')];
    expect(vyberHlas(hlasy, 'Filip').name).toBe('Filip');
    expect(vyberHlas(hlasy, 'Hlas, ktorý tu nie je').name).toBe('Laura (Enhanced)');
  });

  it('číta pokojným tempom 0,9', () => {
    expect(RYCHLOST).toBe(0.9);
  });
});

describe('príprava textu', () => {
  it('rozdelí text na vety, ale nie dátumy', () => {
    expect(pripravText('Dobrý deň. Zadajte PIN! Ste pripravení? Áno.')).toEqual(['Dobrý deň.', 'Zadajte pin!', 'Ste pripravení?', 'Áno.']);
    expect(pripravText('Naposledy 12. 11. 2026 hral.')).toEqual(['Naposledy 12. 11. 2026 hral.']);
  });

  it('nečíta úvodzovky, tri bodky ani pomlčky ako znaky', () => {
    const [veta] = pripravText('Kto sa smeje … ten – „vyhrá“ · ďalej');
    expect(veta).not.toMatch(/[…–„“·]/);
    expect(veta).toBe('Kto sa smeje, ten, vyhrá, ďalej');
  });

  it('prázdny text sa nečíta', () => {
    expect(pripravText('')).toEqual([]);
    expect(pripravText('   ')).toEqual([]);
  });
});
