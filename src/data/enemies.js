import { config } from '../config.js';

// Enemy types. behavior: 'chase' walks at Bartek, 'line' flies straight through where he stood at spawn and leaves,
// 'leap' walks and now and then leaps at him (systems/charge.js). pack: spawns as a group (config packMin/packMax).
// texture is a key in config.textures; the sprite is scaled to that entry's height when it has one.
// gem is a key in config.xp.gems: the kind (and so the XP value) it drops. name, description: the Bestiariusz in the gym.
// Walking enemies are Bartek variants; the later ones are stronger.
const e = config.enemies;

const regular = [
  { id: 'zombie', name: 'Zombie', description: 'Bartek po nocce. Wolny, ale jest ich dużo.', ...e.zombie, behavior: 'chase', isBoss: false, texture: 'zombie', gem: 'blue' },
  { id: 'runner', name: 'Uncanny', description: 'Uśmiecha się za szeroko i biega prawie dwa razy szybciej niż zombie.', ...e.runner, behavior: 'chase', isBoss: false, texture: 'uncanny', gem: 'blue' },
  { id: 'joker', name: 'Joker', description: 'Wytrzymały. Zostawia fioletowy kryształ.', ...e.joker, behavior: 'chase', isBoss: false, texture: 'joker', gem: 'purple', deathVfx: 'splatPurple' },
  { id: 'homelander', name: 'Homelander', description: 'Najmocniejszy z chodzących. Zostawia żółty kryształ.', ...e.homelander, behavior: 'chase', isBoss: false, texture: 'homelander', gem: 'yellow' },
  { id: 'goblin', name: 'Goblin', description: 'Słaby, ale przychodzi całą paczką.', ...e.goblin, behavior: 'chase', isBoss: false, texture: 'goblin', gem: 'blue', pack: true, deathVfx: 'splatGreen' },
  { id: 'sportakus', name: 'Sportakus', description: 'Co jakiś czas doskakuje do Bartka.', ...e.sportakus, behavior: 'leap', isBoss: false, texture: 'sportakus', gem: 'purple' },
  // The first hit by a klapa in a run leaves a scar on Bartek's head.
  { id: 'klapa', name: 'Klapa', description: 'Klapa bagażnika, leci prosto. Kto oberwie, ma bliznę.', ...e.klapa, behavior: 'line', isBoss: false, texture: 'klapa', gem: 'blue', leavesScar: true, touchVfx: 'klapaClang' },
  // Nightskating (data/events.js) sends them in rows; GameScene's 'line' movement, the event sets their direction.
  { id: 'skater', name: 'Rolkarz', description: 'Zombie na rolkach z Nightskatingu. Jedzie prosto, nie skręca.', ...e.skater, behavior: 'line', isBoss: false, texture: 'zombie', gem: 'blue' },
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
