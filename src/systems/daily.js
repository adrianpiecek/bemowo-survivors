import { config } from '../config.js';
import { maps } from '../data/maps.js';
import { plans } from '../data/plans.js';
import { bets } from '../data/bets.js';
import { passives } from '../data/passives.js';
import { enemies } from '../data/enemies.js';

// Wyzwanie dnia: the day's draw, the same on every device, from a generator seeded by the day (config.daily).

// Today in Polish time as 'YYYY-MM-DD' (the en-CA format), or config.debug.dailyDay.
export const todayKey = () => config.debug.dailyDay
  ?? new Intl.DateTimeFormat('en-CA', { timeZone: config.daily.timeZone }).format(new Date());

// "28 listopada" for a day key.
export const dayLabel = (day) => new Intl.DateTimeFormat('pl-PL', { day: 'numeric', month: 'long', timeZone: 'UTC' })
  .format(new Date(`${day}T12:00:00Z`));

// Minutes to the next challenge (midnight in Polish time).
export function minutesLeft() {
  const [h, m] = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: config.daily.timeZone })
    .format(new Date()).split(':').map(Number);
  return 24 * 60 - (h * 60 + m);
}

// mulberry32 seeded by an FNV-1a hash of the day: numbers in [0, 1).
function seeded(text) {
  let h = 2166136261;
  for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h = (h + 0x6d2b79f5) | 0;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// The day's run: map, difficulty, plan (and its passive when the plan gives a random one), bet, starting weapon;
// appearsAt: the later enemy types' arrival times swapped round (the types out from the start stay so);
// waves: the type of each wave in turn (walkers only, a ring of flying klapas would miss Bartek).
export function dailySetup(day) {
  const r = seeded(day), pick = (list) => list[Math.floor(r() * list.length)];
  const shuffle = (list) => {
    const a = [...list];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const spawned = enemies.filter((d) => !d.isBoss && d.spawnWeight > 0);
  const later = spawned.filter((d) => d.appearsAtSec > 0), times = shuffle(later.map((d) => d.appearsAtSec));
  return {
    day,
    map: pick(maps).id,
    difficulty: 1 + Math.floor(r() * config.daily.maxDifficulty),
    plan: pick(plans).id,
    passive: pick(passives).id,
    bet: pick(bets).id,
    weapon: pick(config.weapons.start),
    appearsAt: Object.fromEntries(later.map((d, i) => [d.id, times[i]])),
    waves: shuffle(spawned.filter((d) => d.behavior !== 'line').map((d) => d.id)),
  };
}

// The day's bet instead of the player's (GameScene.create).
export function applyDailyBet(run) {
  const bet = bets.find((b) => b.id === run.daily.bet), level = Math.min(config.daily.betLevel, bet.maxLevel);
  bet.apply(run, level);
  run.betPct = level * bet.proteinPct;
}

// Self-check: the same day draws the same run, another day (almost surely) another one.
console.assert(JSON.stringify(dailySetup('2026-11-28')) === JSON.stringify(dailySetup('2026-11-28')), 'dailySetup not stable');
