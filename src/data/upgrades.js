import { config } from '../config.js';
import { bartkowanie, doBartkowanie } from './bartkowanie.js';

// `player` is run.player: HP, movement and the stats shared by all weapons for the current run.
// Weapon cards (new weapons, weapon levels) are not here: systems/cards.js makes them from data/weapons.js.
// Percentage upgrades add a share of the run's starting value (player.base, after the gym),
// so every level gives the same boost and gym and run percentages multiply.
// Fire rate is the exception: it divides the cooldown, which raises shots per second by the given share each level.
// Rarity: apply(player, scene, mult) and description(mult) get the card's rarity multiplier (config.rarity);
// counts (bullets) round up; the bee count never grows with rarity, the bees' damage does. A card with `rarity: false` has no numbers to multiply and is always common.
// Optional: weight (how often the card is drawn, default 1).
const u = config.upgrade;
const pct = (x) => `${Math.round(x * 100)}%`;
const count = (n, mult) => Math.ceil(n * mult);

export const upgrades = [
  {
    id: 'damage',
    name: 'Obrażenia',
    description: (m) => `+${pct(u.damagePct * m)} obrażeń wszystkich broni`,
    maxStack: u.maxStack,
    apply(player, scene, m = 1) { player.damageMult += player.base.damageMult * u.damagePct * m; },
  },
  {
    id: 'fireRate',
    name: 'Szybkostrzelność',
    description: (m) => `+${pct(u.fireRatePct * m)} szybkostrzelności wszystkich broni`,
    maxStack: u.maxStack,
    apply(player, scene, m = 1) { player.cooldownMult /= 1 + u.fireRatePct * m; },
  },
  {
    id: 'moveSpeed',
    name: 'Szybkość ruchu',
    description: (m) => `+${pct(u.moveSpeedPct * m)} szybkości chodzenia`,
    maxStack: u.maxStack,
    apply(player, scene, m = 1) { player.speed += player.base.speed * u.moveSpeedPct * m; },
  },
  {
    id: 'maxHp',
    name: 'Max HP',
    description: (m) => `+${Math.round(u.maxHp * m)} max HP i leczenie o ${Math.round(u.maxHp * m)}`,
    maxStack: u.maxStack,
    apply(player, scene, m = 1) {
      const hp = Math.round(u.maxHp * m);
      player.maxHp += hp;
      player.hp = Math.min(player.maxHp, player.hp + hp);
    },
  },
  {
    id: 'ul',
    name: 'Ul',
    description: (m) => `Pszczoły są szczęśliwe.\n+${config.bees.perLevel} pszczoła${m > 1 ? `, +${pct(config.bees.damagePct * (m - 1))} obrażeń pszczół` : ''}`,
    maxStack: u.maxStack,
    apply(player, scene, m = 1) {
      player.bees += config.bees.perLevel;
      player.beeDamageMult += config.bees.damagePct * (m - 1);
    },
  },
  {
    id: 'bartkowanie',
    name: 'Bartkowanie',
    description: 'Nikt nie wie, co się stanie. Bartek też nie.',
    maxStack: Infinity,
    weight: config.bartkowanie.weight,
    rarity: false,
    apply(player, scene) { doBartkowanie(scene, Phaser.Utils.Array.GetRandom(bartkowanie)); },
  },
];

// Offered instead of the cards once every upgrade is at maxStack.
export const fallbackUpgrade = {
  id: 'heal',
  name: 'Leczenie',
  description: (m) => `+${Math.round(u.fallbackHeal * m)} HP`,
  maxStack: Infinity,
  apply(player, scene, m = 1) { player.hp = Math.min(player.maxHp, player.hp + Math.round(u.fallbackHeal * m)); },
};
