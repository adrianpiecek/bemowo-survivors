import { config } from '../config.js';

// Permanent upgrades bought with protein. `stats` is run.player before the in-run upgrades,
// `level` is how many levels were bought (1..maxLevel). Numbers live in config.gym.
// icon: texture drawn in BootScene (drawIcons).
const g = config.gym;
const pct = (x) => `${Math.round(x * 100)}%`;

export const gymUpgrades = [
  {
    id: 'chest',
    icon: 'gym_chest',
    name: 'Klata',
    description: `+${pct(g.chest.damagePct)} obrażeń na poziom`,
    maxLevel: g.chest.maxLevel,
    costs: g.chest.costs,
    apply(stats, level) { stats.damageMult *= 1 + g.chest.damagePct * level; },
  },
  {
    id: 'legs',
    icon: 'gym_legs',
    name: 'Nogi',
    description: `+${pct(g.legs.speedPct)} szybkości ruchu na poziom`,
    maxLevel: g.legs.maxLevel,
    costs: g.legs.costs,
    apply(stats, level) { stats.speed *= 1 + g.legs.speedPct * level; },
  },
  {
    id: 'back',
    icon: 'gym_back',
    name: 'Plecy',
    description: `+${g.back.maxHp} max HP na poziom`,
    maxLevel: g.back.maxLevel,
    costs: g.back.costs,
    apply(stats, level) { stats.maxHp += g.back.maxHp * level; },
  },
  {
    id: 'glasses',
    icon: 'gym_glasses',
    name: 'Okulary do czytania',
    description: `+${pct(g.glasses.rangePct)} zasięgu pistoletu, shotguna i magnesu na poziom`,
    maxLevel: g.glasses.maxLevel,
    costs: g.glasses.costs,
    apply(stats, level) {
      stats.range *= 1 + g.glasses.rangePct * level;
      stats.magnetRadius *= 1 + g.glasses.rangePct * level;
    },
  },
  {
    id: 'warmup',
    icon: 'gym_warmup',
    name: 'Rozgrzewka 15 minut',
    description: `Przez pierwsze ${g.warmup.durationSec} s ${pct(g.warmup.speedPct)} szybkości, potem +${pct(g.warmup.damagePct)} obrażeń`,
    maxLevel: g.warmup.maxLevel,
    costs: g.warmup.costs,
    apply(stats) {
      stats.warmupMs = g.warmup.durationSec * 1000;
      stats.warmupSpeedMult = 1 + g.warmup.speedPct;
      stats.afterWarmupDamageMult = 1 + g.warmup.damagePct;
    },
  },
  {
    id: 'weaponSlot',
    icon: 'gym_weapon_slot',
    name: 'Kabura',
    description: `+1 slot broni na poziom (na start ${config.weapons.startSlots})`,
    maxLevel: g.weaponSlot.maxLevel,
    costs: g.weaponSlot.costs,
    apply(stats, level) { stats.weaponSlots += level; },
  },
  {
    id: 'passiveSlot',
    icon: 'gym_passive_slot',
    name: 'Plecak',
    description: `+1 slot pasywek na poziom (na start ${config.passives.startSlots})`,
    maxLevel: g.passiveSlot.maxLevel,
    costs: g.passiveSlot.costs,
    apply(stats, level) { stats.passiveSlots += level; },
  },
  {
    id: 'plan',
    icon: 'gym_plan',
    name: 'Plan dnia',
    description: `+${g.plan.rerolls} Odśwież i +${g.plan.banishes} Wywal na level upie, na poziom`,
    maxLevel: g.plan.maxLevel,
    costs: g.plan.costs,
    apply(stats, level) {
      stats.rerolls += g.plan.rerolls * level;
      stats.banishes += g.plan.banishes * level;
    },
  },
  {
    id: 'tutoring',
    icon: 'passive_notebook',
    name: 'Korepetycje',
    description: `+${pct(g.tutoring.xpPct)} XP z kryształów na poziom`,
    maxLevel: g.tutoring.maxLevel,
    costs: g.tutoring.costs,
    apply(stats, level) { stats.growth *= 1 + g.tutoring.xpPct * level; },
  },
  {
    id: 'sleep',
    icon: 'passive_broth',
    name: 'Sen 8 godzin',
    description: `+${String(g.sleep.regenPerSec).replace('.', ',')} HP na sekundę na poziom`,
    maxLevel: g.sleep.maxLevel,
    costs: g.sleep.costs,
    apply(stats, level) { stats.regen += g.sleep.regenPerSec * level; },
  },
  {
    id: 'pads',
    icon: 'passive_jacket',
    name: 'Ochraniacze',
    description: `-${g.pads.armor} obrażeń z każdego dotyku wroga na poziom (min. 1)`,
    maxLevel: g.pads.maxLevel,
    costs: g.pads.costs,
    apply(stats, level) { stats.armor += g.pads.armor * level; },
  },
  {
    id: 'talisman',
    icon: 'passive_clover',
    name: 'Talizman z bazaru',
    description: `+${pct(g.talisman.luckPct)} szczęścia na poziom (rzadsze karty, więcej monet)`,
    maxLevel: g.talisman.maxLevel,
    costs: g.talisman.costs,
    apply(stats, level) { stats.luck *= 1 + g.talisman.luckPct * level; },
  },
  {
    id: 'coach',
    icon: 'passive_goggins',
    name: 'Trener personalny',
    description: `+${pct(g.coach.critChance)} szansy na trafienie krytyczne na poziom`,
    maxLevel: g.coach.maxLevel,
    costs: g.coach.costs,
    apply(stats, level) { stats.critChance += g.coach.critChance * level; },
  },
];
