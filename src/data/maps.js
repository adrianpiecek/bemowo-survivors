import { config } from '../config.js';
import { save, writeSave } from '../state.js';

// Maps, picked in MapScene before the plan. Each one is an endless grid of blocks (systems/map.js):
//   kinds    the block kinds with draw weights (their textures are drawn in createMapTextures)
//   streets  true: roads with traffic lights and parked cars between the blocks; false: park alleys
//   looks    optional: enemy texture -> this map's Bartek in its place (same type, stats and bestiary entry)
//   names    optional: enemy id -> its name on this map (the boss banners and bar, the bestiary next to the base name)
//   hints    optional: boss id -> its power's hint on this map (data/bossPowers.js bossHint)
//   unlock   null: open from the start; else { text, check(run, won) } at the end of a run, kept in save.unlocks
const m = config.map;

export const maps = [
  {
    id: 'jelonki', name: 'Jelonki', unlock: null, kinds: m.kinds, streets: true,
    description: 'Osiedle: bloki, ulice, parkingi i place zabaw.',
  },
  {
    id: 'fortBema', name: 'Fort Bema', kinds: m.fortBema.kinds, streets: false,
    looks: { zombie: 'binion', uncanny: 'purpleBuy', joker: 'klockowyB', homelander: 'kapitanBemowo', goblin: 'gnom', sportakus: 'bartcraft' },
    names: {
      zombie: 'Binion', runner: 'Purple Buy', joker: 'Klockowy Bartek', homelander: 'Kapitan Bemowo', goblin: 'Gnom', sportakus: 'Bartcraft',
      bigZombie: 'Wielki Binion', bigUncanny: 'Wielki Purple Buy', bigGoblin: 'Wielki Gnom',
      bigSportakus: 'Wielki Bartcraft', bigJoker: 'Wielki Klockowy Bartek', bigHomelander: 'Wielki Kapitan Bemowo',
    },
    hints: { bigZombie: 'Woła hordę: wokół niego wstają biniony', bigGoblin: 'Rzuca beczkami pełnymi gnomów', bigJoker: 'Rozrzuca wybuchające klocki' },
    description: 'Park przy forcie: alejki, drzewa i fosa, przez którą przejdziesz tylko mostem.',
    unlock: { text: 'Wygraj rundę na Jelonkach', check: (run, won) => won && run.map === 'jelonki' },
  },
];

export const mapUnlocked = (map) => !map.unlock || config.debug.unlockMaps || save.unlocks.includes(map.id);
export const mapById = (id) => maps.find((d) => d.id === id) ?? maps[0];
export const enemyName = (def, mapId) => mapById(mapId).names?.[def.id] ?? def.name;

// Difficulty levels (config.difficulty) per map in save.difficulty: { max, picked }, clamped here so a hand-edited save
// cannot break a run.
const dc = config.difficulty;
const whole = (n, lo, hi) => (Number.isFinite(n) ? Phaser.Math.Clamp(Math.floor(n), lo, hi) : lo);
export const mapLevelMax = (map) => (config.debug.unlockMaps ? dc.levels : whole(save.difficulty[map.id]?.max, 1, dc.levels));
export const mapLevel = (map) => whole(save.difficulty[map.id]?.picked, 1, mapLevelMax(map));
export function pickMapLevel(map, level) {
  save.difficulty[map.id] = { max: whole(save.difficulty[map.id]?.max, 1, dc.levels), picked: whole(level, 1, mapLevelMax(map)) };
  writeSave(save);
}

// A won run on the map's highest open level opens the next one; returns the new level or null.
export function openNextLevel(run, won) {
  const map = mapById(run.map), max = whole(save.difficulty[map.id]?.max, 1, dc.levels);
  if (!won || run.difficulty < max || max >= dc.levels) return null;
  save.difficulty[map.id] = { max: max + 1, picked: max + 1 };
  return max + 1;
}

// The run's switches for its level: walking enemies' HP, the spawn rate and the protein bonus.
export function applyDifficulty(run, level) {
  const k = level - 1;
  run.difficulty = level;
  run.enemyHpMult *= 1 + dc.hpPct * k;
  run.spawnRateMult *= 1 + dc.spawnPct * k;
  run.difficultyPct = dc.proteinPct * k;
}
