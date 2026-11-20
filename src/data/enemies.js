import { config } from '../config.js';

// Enemy types. behavior: 'chase' walks at Bartek, 'line' flies straight through where he stood at spawn and leaves,
// 'leap' walks and now and then leaps at him (systems/charge.js). pack: spawns as a group (config packMin/packMax).
// texture is a key in config.textures; the sprite is scaled to that entry's height when it has one.
// gem is a key in config.xp.gems: the kind (and so the XP value) it drops.
// Walking enemies are Bartek variants; the later ones are stronger.
const e = config.enemies;

const regular = [
  { id: 'zombie', ...e.zombie, behavior: 'chase', isBoss: false, texture: 'zombie', gem: 'green' },
  { id: 'runner', ...e.runner, behavior: 'chase', isBoss: false, texture: 'uncanny', gem: 'green' },
  { id: 'joker', ...e.joker, behavior: 'chase', isBoss: false, texture: 'joker', gem: 'blue' },
  { id: 'homelander', ...e.homelander, behavior: 'chase', isBoss: false, texture: 'homelander', gem: 'yellow' },
  { id: 'goblin', ...e.goblin, behavior: 'chase', isBoss: false, texture: 'goblin', gem: 'green', pack: true },
  { id: 'sportakus', ...e.sportakus, behavior: 'leap', isBoss: false, texture: 'sportakus', gem: 'blue' },
  // The first hit by a klapa in a run leaves a scar on Bartek's head.
  { id: 'klapa', ...e.klapa, behavior: 'line', isBoss: false, texture: 'klapa', gem: 'green', leavesScar: true },
];

// Bosses (config.boss.list): their base type, bigger and stronger; behavior, texture and extra numbers come from the base.
// Never picked by the random spawn. HP, minute, chest and protein come from the boss slot it is drawn for (GameScene.drawBosses).
const bosses = Object.entries(config.boss.list).map(([id, b]) => {
  const base = regular.find((d) => d.id === b.base);
  return {
    ...base, id, name: b.name, isBoss: true, pack: false, spawnWeight: 0, scale: b.scale,
    speed: base.speed * b.speedMult, contactDamage: base.contactDamage * b.damageMult, gem: 'red',
  };
});

export const enemies = [...regular, ...bosses];
