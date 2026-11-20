import { config } from '../config.js';
import { upgrades } from '../data/upgrades.js';
import { weapons } from '../data/weapons.js';
import { save } from '../state.js';

// Upgrade cards, shared by the level-up screen and the boss chest.

// A rarity tier from config.rarity for this card, drawn by weight; the weights of rarer tiers grow with the level.
// Cards with `rarity: false` get none (null).
export function rollRarity(up, level) {
  if (up.rarity === false) return null;
  const tiers = config.rarity, forced = tiers.find((t) => t.id === config.debug.forceRarity);
  if (forced) return forced;
  const weight = (t) => t.weight + t.perLevel * (level - 1);
  let roll = Math.random() * tiers.reduce((sum, t) => sum + weight(t), 0);
  return tiers.find((t) => (roll -= weight(t)) < 0) ?? tiers[0];
}

const isUnlocked = (def) => !def.unlock || save.unlocks.includes(def.id);

// Weapon cards for this draw: the next level of each weapon Bartek carries, and every unlocked weapon he does not
// have while a slot is free. levelText replaces the stack counter on the card. A new weapon has no numbers to multiply.
function weaponCards(run) {
  const cards = [];
  for (const w of run.weapons) {
    if (w.level >= w.def.maxLevel) continue;
    const level = w.level + 1;
    cards.push({
      id: `weapon_${w.def.id}`, name: w.def.name, weight: w.def.weight, maxStack: Infinity, levelText: `Poziom ${w.level} → ${level}`,
      description: (m) => w.def.description(level, m),
      apply(player, scene, m) { scene.levelUpWeapon(w, m); },
    });
  }
  if (run.weapons.length >= config.weapons.maxSlots) return cards;
  for (const def of weapons) {
    if (run.weapons.some((w) => w.def === def) || !isUnlocked(def)) continue;
    cards.push({
      id: `weapon_${def.id}`, name: def.name, weight: def.weight, maxStack: Infinity, levelText: 'NOWA BROŃ', rarity: false,
      description: def.description(1, 1),
      apply(player, scene) { scene.addWeapon(def); },
    });
  }
  return cards;
}

// Up to `count` different cards (upgrades still under their maxStack, weapon cards), drawn by weight (default 1).
// May return fewer.
export function drawUpgrades(run, count) {
  const pool = [...upgrades.filter((up) => (run.upgrades[up.id] ?? 0) < up.maxStack), ...weaponCards(run)];
  const weight = (up) => up.weight ?? 1;
  const picked = [];
  while (picked.length < count && pool.length) {
    let roll = Math.random() * pool.reduce((sum, up) => sum + weight(up), 0);
    const i = pool.findIndex((up) => (roll -= weight(up)) < 0);
    picked.push(pool.splice(i < 0 ? pool.length - 1 : i, 1)[0]);
  }
  return picked;
}

export function describe(up, rarity) {
  return typeof up.description === 'function' ? up.description(rarity?.mult ?? 1) : up.description;
}

// `scene` is GameScene; most upgrades only need the player.
export function applyUpgrade(run, scene, up, rarity) {
  up.apply(run.player, scene, rarity?.mult ?? 1);
  run.upgrades[up.id] = (run.upgrades[up.id] ?? 0) + 1;
}

export const rarityHex = (rarity) => `#${rarity.color.toString(16).padStart(6, '0')}`;
