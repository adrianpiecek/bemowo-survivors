import { config } from '../config.js';

// Cards that are neither a weapon nor a passive (those come from data/weapons.js and data/passives.js through
// systems/cards.js). `player` is run.player. apply(player, scene, mult) and description(mult) get the card's rarity
// multiplier (config.rarity); a card with `rarity: false` has no numbers to multiply and is always common.
// Optional: weight (how often the card is drawn, default 1).
const u = config.upgrade;

export const upgrades = []; // Bartkowanie was here; it now happens by itself after a level up (LevelUpScene.done)

// Offered instead of the cards once every upgrade is at maxStack.
export const fallbackUpgrade = {
  id: 'heal',
  name: 'Leczenie',
  icon: 'icon_heart',
  description: (m) => `+${Math.round(u.fallbackHeal * m)} HP`,
  maxStack: Infinity,
  apply(player, scene, m = 1) { player.hp = Math.min(player.maxHp, player.hp + Math.round(u.fallbackHeal * m)); },
};
