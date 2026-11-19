import { config } from '../config.js';

// Enemy types. behavior: 'chase' walks at Bartek, 'line' flies straight through where he stood at spawn and leaves.
// texture is a key in config.textures; the sprite is scaled to that entry's height when it has one.
const e = config.enemies;

export const enemies = [
  { id: 'zombie', ...e.zombie, behavior: 'chase', isBoss: false, texture: 'zombie' },
  { id: 'runner', ...e.runner, behavior: 'chase', isBoss: false, texture: 'runner' },
  // The first hit by a klapa in a run leaves a scar on Bartek's head.
  { id: 'klapa', ...e.klapa, behavior: 'line', isBoss: false, texture: 'klapa', leavesScar: true },
];
