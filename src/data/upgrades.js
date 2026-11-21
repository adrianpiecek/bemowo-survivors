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

// Small gains with no limit, to fill a draw when the weapon and passive cards run short (systems/cards.js drawUpgrades),
// so a run past its last max level still grows. Percentages add a share of the run's starting value, as passives do.
const o = u.overflow;
const pct = (x) => `${Math.round(x * 100)}%`;
const addShare = (pl, stat, x) => { pl[stat] += pl.base[stat] * x; };
export const overflowUpgrades = [
  {
    id: 'moreDamage', name: 'Dodatkowa seria', icon: 'passive_creatine', maxStack: Infinity,
    description: (m) => `+${pct(o.damagePct * m)} obrażeń wszystkich broni`,
    apply(pl, scene, m = 1) { addShare(pl, 'damageMult', o.damagePct * m); },
  },
  {
    id: 'moreHaste', name: 'Drugie espresso', icon: 'passive_coffee', maxStack: Infinity,
    description: (m) => `-${pct(o.cooldownPct * m)} czasu odnowienia wszystkich broni`,
    apply(pl, scene, m = 1) { pl.cooldownMult *= 1 - o.cooldownPct * m; },
  },
  {
    id: 'moreSpeed', name: 'Rozgrzewka', icon: 'passive_shoes', maxStack: Infinity,
    description: (m) => `+${pct(o.speedPct * m)} szybkości chodzenia`,
    apply(pl, scene, m = 1) { addShare(pl, 'speed', o.speedPct * m); },
  },
  {
    id: 'moreHp', name: 'Dokładka', icon: 'passive_gainer', maxStack: Infinity,
    description: (m) => `+${Math.round(o.maxHp * m)} max HP i leczenie o tyle samo`,
    apply(pl, scene, m = 1) {
      const hp = Math.round(o.maxHp * m);
      pl.maxHp += hp;
      pl.hp = Math.min(pl.maxHp, pl.hp + hp);
    },
  },
  {
    id: 'moreArea', name: 'Rozciąganie', icon: 'passive_dumbbells', maxStack: Infinity,
    description: (m) => `+${pct(o.areaPct * m)} obszaru broni`,
    apply(pl, scene, m = 1) { addShare(pl, 'area', o.areaPct * m); },
  },
  {
    id: 'moreMagnet', name: 'Dłuższe ręce', icon: 'passive_bag', maxStack: Infinity,
    description: (m) => `+${pct(o.magnetPct * m)} zasięgu przyciągania kryształów`,
    apply(pl, scene, m = 1) { addShare(pl, 'magnetRadius', o.magnetPct * m); },
  },
  fallbackUpgrade,
];
