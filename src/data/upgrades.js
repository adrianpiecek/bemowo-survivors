import { config } from '../config.js';
import { bartkowanie, doBartkowanie } from './bartkowanie.js';

// Cards that are neither a weapon nor a passive (those come from data/weapons.js and data/passives.js through
// systems/cards.js). `player` is run.player. apply(player, scene, mult) and description(mult) get the card's rarity
// multiplier (config.rarity); a card with `rarity: false` has no numbers to multiply and is always common.
// Optional: weight (how often the card is drawn, default 1).
const u = config.upgrade;

export const upgrades = [
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
