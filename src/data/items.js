import { config } from '../config.js';

// Items: small gains for the rest of the run, from the chests on the map (bought with B coins) and from elites' chests.
// Unlike passives they take no slot and stack without a limit; run.items holds id -> how many. apply(player) adds one.
// Percentages add a share of the run's starting value (player.base), as the passives do.
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
    id: 'plaster', name: 'Plaster', icon: 'item_plaster', description: `+${c.plaster.maxHp} max HP i leczenie o tyle samo`,
    apply(pl) {
      pl.maxHp += c.plaster.maxHp;
      pl.hp = Math.min(pl.maxHp, pl.hp + c.plaster.maxHp);
    },
  },
  {
    id: 'fridgeMagnet', name: 'Magnes z lodówki', icon: 'item_fridgeMagnet', description: `+${pct(c.fridgeMagnet.magnetPct)} zasięgu przyciągania`,
    apply(pl) { addShare(pl, 'magnetRadius', c.fridgeMagnet.magnetPct); },
  },
];

export function giveItem(run, item) {
  item.apply(run.player);
  run.items[item.id] = (run.items[item.id] ?? 0) + 1;
}
