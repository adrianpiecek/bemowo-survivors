import { config } from '../config.js';
import { rollRarity } from '../systems/cards.js';

// Items: small gains for the rest of the run, from the chests on the map (bought with B coins) and from elites' chests.
// Unlike passives they take no slot and stack without a limit; run.items holds id -> how many. apply(player) adds one.
// Percentages add a share of the run's starting value (player.base), as the passives do.
// rarity: an id from config.rarity (default common); a chest rolls the rarity first (drawItem).
// scale: a gain that grows with the run: { source(run), every, apply(player, steps) }; every `every` of source, each
// copy adds one step (updateItems, every frame).
const c = config.items;
const pct = (x) => `${Math.round(x * 100)}%`;
const addShare = (pl, stat, x) => { pl[stat] += pl.base[stat] * x; };

export const items = [
  {
    id: 'steroids', name: 'Sterydy', icon: 'item_steroids', description: `+${c.steroids.regenPerMin} HP na minutę`,
    apply(pl) { pl.regen += c.steroids.regenPerMin / 60; },
  },
  {
    id: 'bar', name: 'Baton proteinowy', icon: 'item_bar', description: `+${pct(c.bar.damagePct)} obrażeń`,
    apply(pl) { addShare(pl, 'damageMult', c.bar.damagePct); },
  },
  {
    id: 'energy', name: 'Energetyk', icon: 'item_energy', description: `-${pct(c.energy.cooldownPct)} czasu odnowienia`,
    apply(pl) { pl.cooldownMult *= 1 - c.energy.cooldownPct; },
  },
  {
    id: 'socks', name: 'Skarpety frotte', icon: 'item_socks', description: `+${pct(c.socks.speedPct)} szybkości chodzenia`,
    apply(pl) { addShare(pl, 'speed', c.socks.speedPct); },
  },
  {
    id: 'gloves', name: 'Rękawiczki na siłkę', icon: 'item_gloves', description: `+${pct(c.gloves.critChance)} szansy na krytyka`,
    apply(pl) { pl.critChance += c.gloves.critChance; },
  },
  {
    id: 'scratch', name: 'Zdrapka', icon: 'item_scratch', description: `+${pct(c.scratch.luckPct)} szczęścia`,
    apply(pl) { addShare(pl, 'luck', c.scratch.luckPct); },
  },
  {
    id: 'plaster', name: 'Plaster', icon: 'item_plaster', vfx: 'maxHpUp', description: `+${c.plaster.maxHp} max HP i leczenie o tyle samo`,
    apply(pl) {
      pl.maxHp += c.plaster.maxHp;
      pl.hp = Math.min(pl.maxHp, pl.hp + c.plaster.maxHp);
    },
  },
  {
    id: 'fridgeMagnet', name: 'Magnes z lodówki', icon: 'item_fridgeMagnet', description: `+${pct(c.fridgeMagnet.magnetPct)} zasięgu przyciągania`,
    apply(pl) { addShare(pl, 'magnetRadius', c.fridgeMagnet.magnetPct); },
  },
  {
    id: 'piggy', name: 'Skarbonka', icon: 'item_piggy', rarity: 'rare',
    description: `+${pct(c.piggy.damagePct)} obrażeń za każde ${c.piggy.everyBCoins} zebranych monet B`,
    apply() {},
    scale: { source: (run) => run.bCoinsTotal, every: c.piggy.everyBCoins, apply(pl, n) { addShare(pl, 'damageMult', c.piggy.damagePct * n); } },
  },
  {
    id: 'receipt', name: 'Paragon z Żabki', icon: 'item_receipt', rarity: 'rare',
    description: `+${pct(c.receipt.speedPct)} szybkości chodzenia za każdą otwartą skrzynię`,
    apply() {},
    scale: { source: (run) => run.chestsTotal, every: 1, apply(pl, n) { addShare(pl, 'speed', c.receipt.speedPct * n); } },
  },
  {
    id: 'tally', name: 'Zeszyt z kreskami', icon: 'item_tally', rarity: 'epic',
    description: `+${pct(c.tally.damagePct)} obrażeń za każde ${c.tally.everyKills} zabitych wrogów`,
    apply() {},
    scale: { source: (run) => run.kills, every: c.tally.everyKills, apply(pl, n) { addShare(pl, 'damageMult', c.tally.damagePct * n); } },
  },
  {
    id: 'medal', name: 'Medal z zawodów', icon: 'item_medal', rarity: 'legendary',
    description: `+${pct(c.medal.damagePct)} obrażeń i -${pct(c.medal.cooldownPct)} czasu odnowienia za każdego pokonanego bossa`,
    apply() {},
    scale: {
      source: (run) => run.bossesKilled.length, every: 1,
      apply(pl, n) { addShare(pl, 'damageMult', c.medal.damagePct * n); pl.cooldownMult *= (1 - c.medal.cooldownPct) ** n; },
    },
  },
];

const tiers = config.rarity;
export const itemRarity = (item) => tiers.find((t) => t.id === (item.rarity ?? 'common'));

// An item for a chest: a rarity rolled as for cards (luck counts), then a random item of it; none of it: one rarer
// tier down at a time.
export function drawItem(run) {
  const rolled = tiers.indexOf(rollRarity({}, run));
  for (let i = rolled; i >= 0; i--) {
    const pool = items.filter((it) => (it.rarity ?? 'common') === tiers[i].id);
    if (pool.length) return Phaser.Utils.Array.GetRandom(pool);
  }
  return Phaser.Utils.Array.GetRandom(items);
}

// The growing gains: each owned item with `scale` gets the steps its source has reached since the last frame.
export function updateItems(run) {
  for (const it of items) {
    const count = it.scale && run.items[it.id];
    if (!count) continue;
    const steps = Math.floor(it.scale.source(run) / it.scale.every) * count, done = run.itemSteps[it.id] ?? 0;
    if (steps > done) {
      it.scale.apply(run.player, steps - done);
      run.itemSteps[it.id] = steps;
    }
  }
}

export function giveItem(run, item) {
  item.apply(run.player);
  run.items[item.id] = (run.items[item.id] ?? 0) + 1;
}
