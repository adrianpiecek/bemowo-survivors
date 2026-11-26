import { config } from '../config.js';
import { save } from '../state.js';

// Maps, picked in MapScene before the plan. Each one is an endless grid of blocks (systems/map.js):
//   kinds    the block kinds with draw weights (their textures are drawn in createMapTextures)
//   streets  true: roads with traffic lights and parked cars between the blocks; false: park alleys
//   unlock   null: open from the start; else { text, check(run, won) } at the end of a run, kept in save.unlocks
const m = config.map;

export const maps = [
  {
    id: 'jelonki', name: 'Jelonki', unlock: null, kinds: m.kinds, streets: true,
    description: 'Osiedle: bloki, ulice, parkingi i place zabaw.',
  },
  {
    id: 'fortBema', name: 'Fort Bema', kinds: m.fortBema.kinds, streets: false,
    description: 'Park przy forcie: alejki, drzewa i fosa, przez którą przejdziesz tylko mostem.',
    unlock: { text: 'Wygraj rundę na Jelonkach', check: (run, won) => won && run.map === 'jelonki' },
  },
];

export const mapUnlocked = (map) => !map.unlock || config.debug.unlockMaps || save.unlocks.includes(map.id);
export const mapById = (id) => maps.find((d) => d.id === id) ?? maps[0];
