import { config } from '../config.js';

// Items: small gains for the rest of the run, from the chests on the map (bought with B coins) and from elites' chests.
// Unlike passives they take no slot and stack without a limit; run.items holds id -> how many. apply(player, k) adds k
// copies (k = -1 takes one away again: the Klon Bartek tree).
// Percentages add a share of the run's starting value (player.base), as the passives do.
// rarity: an id from config.rarity (default common); a chest rolls the rarity first (drawItem).
// scale: a gain that grows with the run: { source(run), every, max, apply(player, steps) }; every `every` of source, each
// copy adds one step, up to `max` steps per copy (updateItems, every frame).
const c = config.items;
const pct = (x) => `${Math.round(x * 100)}%`;
const cap = (x, n) => ` (maks. ${pct(x * n)})`;
const addShare = (pl, stat, x) => { pl[stat] += pl.base[stat] * x; };

export const items = [
  {
    id: 'steroids', name: 'Sterydy', icon: 'item_steroids', description: `+${c.steroids.regenPerMin} HP na minutę`,
    apply(pl, k = 1) { pl.regen += c.steroids.regenPerMin / 60 * k; },
  },
  {
    id: 'bar', name: 'Baton proteinowy', icon: 'item_bar', description: `+${pct(c.bar.damagePct)} obrażeń`,
    apply(pl, k = 1) { addShare(pl, 'damageMult', c.bar.damagePct * k); },
  },
  {
    id: 'energy', name: 'Energetyk', icon: 'item_energy', description: `-${pct(c.energy.cooldownPct)} czasu odnowienia`,
    apply(pl, k = 1) { pl.cooldownMult *= (1 - c.energy.cooldownPct) ** k; },
  },
  {
    id: 'socks', name: 'Skarpety frotte', icon: 'item_socks', description: `+${pct(c.socks.speedPct)} szybkości chodzenia`,
    apply(pl, k = 1) { addShare(pl, 'speed', c.socks.speedPct * k); },
  },
  {
    id: 'gloves', name: 'Rękawiczki na siłkę', icon: 'item_gloves', description: `+${pct(c.gloves.critChance)} szansy na krytyka`,
    apply(pl, k = 1) { pl.critChance += c.gloves.critChance * k; },
  },
  {
    id: 'scratch', name: 'Zdrapka', icon: 'item_scratch', description: `+${pct(c.scratch.luckPct)} szczęścia`,
    apply(pl, k = 1) { addShare(pl, 'luck', c.scratch.luckPct * k); },
  },
  {
    id: 'plaster', name: 'Plaster', icon: 'item_plaster', vfx: 'maxHpUp', description: `+${c.plaster.maxHp} max HP i leczenie o tyle samo`,
    apply(pl, k = 1) {
      pl.maxHp += c.plaster.maxHp * k;
      pl.hp = Math.min(pl.maxHp, pl.hp + Math.max(0, c.plaster.maxHp * k)); // taken away: HP only down to the new max
    },
  },
  {
    id: 'fridgeMagnet', name: 'Magnes z lodówki', icon: 'item_fridgeMagnet', description: `+${pct(c.fridgeMagnet.magnetPct)} zasięgu przyciągania`,
    apply(pl, k = 1) { addShare(pl, 'magnetRadius', c.fridgeMagnet.magnetPct * k); },
  },
  {
    id: 'piggy', name: 'Skarbonka', icon: 'item_piggy', rarity: 'rare',
    description: `+${pct(c.piggy.damagePct)} obrażeń za każde ${c.piggy.everyBCoins} zebranych monet B${cap(c.piggy.damagePct, c.piggy.maxSteps)}`,
    apply() {},
    scale: { source: (run) => run.bCoinsTotal, every: c.piggy.everyBCoins, max: c.piggy.maxSteps, apply(pl, n) { addShare(pl, 'damageMult', c.piggy.damagePct * n); } },
  },
  {
    id: 'receipt', name: 'Paragon z Żabki', icon: 'item_receipt', rarity: 'rare',
    description: `+${pct(c.receipt.speedPct)} szybkości chodzenia za każdą otwartą skrzynię${cap(c.receipt.speedPct, c.receipt.maxSteps)}`,
    apply() {},
    scale: { source: (run) => run.chestsTotal, every: 1, max: c.receipt.maxSteps, apply(pl, n) { addShare(pl, 'speed', c.receipt.speedPct * n); } },
  },
  {
    id: 'tally', name: 'Zeszyt z kreskami', icon: 'item_tally', rarity: 'epic',
    description: `+${pct(c.tally.damagePct)} obrażeń za każde ${c.tally.everyKills} zabitych wrogów${cap(c.tally.damagePct, c.tally.maxSteps)}`,
    apply() {},
    scale: { source: (run) => run.kills, every: c.tally.everyKills, max: c.tally.maxSteps, apply(pl, n) { addShare(pl, 'damageMult', c.tally.damagePct * n); } },
  },
  {
    id: 'medal', name: 'Medal z zawodów', icon: 'item_medal', rarity: 'legendary',
    description: `+${pct(c.medal.damagePct)} obrażeń i -${pct(c.medal.cooldownPct)} czasu odnowienia za każdego pokonanego bossa (maks. ${c.medal.maxSteps} bossów)`,
    apply() {},
    scale: {
      source: (run) => run.bossesKilled.length, every: 1, max: c.medal.maxSteps,
      apply(pl, n) { addShare(pl, 'damageMult', c.medal.damagePct * n); pl.cooldownMult *= (1 - c.medal.cooldownPct) ** n; },
    },
  },
];

const tiers = config.rarity;
export const itemRarity = (item) => tiers.find((t) => t.id === (item.rarity ?? 'common'));

// An item for a chest: a rarity rolled by config.items.rarityWeights (luck multiplies the rarer ones), then a random item
// of it; none of it: one rarer tier down at a time.
function rollItemRarity(run) {
  const forced = tiers.findIndex((t) => t.id === config.debug.forceRarity);
  if (forced >= 0) return forced;
  const weight = (t, i) => (c.rarityWeights[t.id] ?? 0) * (i > 0 ? run.player.luck : 1);
  let roll = Math.random() * tiers.reduce((sum, t, i) => sum + weight(t, i), 0);
  const i = tiers.findIndex((t, j) => (roll -= weight(t, j)) < 0);
  return i < 0 ? 0 : i;
}

export function drawItem(run) {
  const rolled = rollItemRarity(run);
  for (let i = rolled; i >= 0; i--) {
    const pool = items.filter((it) => (it.rarity ?? 'common') === tiers[i].id);
    if (pool.length) return Phaser.Utils.Array.GetRandom(pool);
  }
  return Phaser.Utils.Array.GetRandom(items);
}

// The growing gains: each item with `scale` gets the steps its source has reached since the last frame (or loses them
// with a copy taken away).
export function updateItems(run) {
  for (const it of items) {
    if (!it.scale) continue;
    const steps = Math.min(Math.floor(it.scale.source(run) / it.scale.every), it.scale.max) * (run.items[it.id] ?? 0), done = run.itemSteps[it.id] ?? 0;
    if (steps !== done) {
      it.scale.apply(run.player, steps - done);
      run.itemSteps[it.id] = steps;
    }
  }
}

export function giveItem(run, item) {
  item.apply(run.player);
  run.items[item.id] = (run.items[item.id] ?? 0) + 1;
}

// The items the Klon Bartek tree can clone: owned ones with a different owned item of the same rarity to take instead.
export function cloneChoices(run) {
  const owned = items.filter((it) => run.items[it.id]), r = (it) => it.rarity ?? 'common';
  return owned.filter((it) => owned.some((o) => o !== it && r(o) === r(it)));
}

// One copy taken away (the Klon Bartek tree): its gain undone; a growing one loses its steps in updateItems.
export function takeItem(run, item) {
  item.apply(run.player, -1);
  run.items[item.id] -= 1;
  if (!run.items[item.id]) delete run.items[item.id];
}
