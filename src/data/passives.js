import { config } from '../config.js';
import { save } from '../state.js';

// Passives: items that each raise one of Bartek's stats (run.player) for the run. run.passives holds the ones he carries
// as { def, level }. A new one and each next level come as level-up cards with a rarity (systems/cards.js); Bartek carries
// up to run.player.passiveSlots, after that only levels of the ones he has can drop.
//   description(level, mult)    card text for reaching that level (every level gives the same)
//   apply(player, level, mult)  adds one level's gain; mult is the card's rarity multiplier
//   unlock   null: can always drop; else { text, check(run, won) }: checked at the end of a run, after save.stats got this
//            run's totals; kept in save.unlocks like the weapons' (ids never repeat a weapon's)
// Percentages add a share of the run's starting value (player.base, after the gym), so gym and run percentages multiply.
const c = config.passives;
const pct = (x) => `${Math.round(x * 100)}%`;
const count = (n, mult) => Math.ceil(n * mult);
const addShare = (pl, stat, x) => { pl[stat] += pl.base[stat] * x; };

export const passives = [
  {
    id: 'creatine', name: 'Kreatyna', icon: 'passive_creatine', maxLevel: c.creatine.maxLevel, unlock: null,
    description: (level, m) => `+${pct(c.creatine.damagePct * m)} obrażeń wszystkich broni`,
    apply(pl, level, m) { addShare(pl, 'damageMult', c.creatine.damagePct * m); },
  },
  {
    id: 'coffee', name: 'Kawa z Żabki', icon: 'passive_coffee', maxLevel: c.coffee.maxLevel, unlock: null,
    description: (level, m) => `-${pct(c.coffee.cooldownPct * m)} czasu odnowienia wszystkich broni`,
    apply(pl, level, m) { pl.cooldownMult *= 1 - c.coffee.cooldownPct * m; },
  },
  {
    id: 'shoes', name: 'Buty z bazaru', icon: 'passive_shoes', maxLevel: c.shoes.maxLevel, unlock: null,
    description: (level, m) => `+${pct(c.shoes.speedPct * m)} szybkości chodzenia`,
    apply(pl, level, m) { addShare(pl, 'speed', c.shoes.speedPct * m); },
  },
  {
    id: 'gainer', name: 'Gainer', icon: 'passive_gainer', maxLevel: c.gainer.maxLevel, unlock: null, vfx: 'maxHpUp',
    description: (level, m) => `+${Math.round(c.gainer.maxHp * m)} max HP i leczenie o tyle samo`,
    apply(pl, level, m) {
      const hp = Math.round(c.gainer.maxHp * m);
      pl.maxHp += hp;
      pl.hp = Math.min(pl.maxHp, pl.hp + hp);
    },
  },
  {
    id: 'dumbbells', name: 'Hantle w plecaku', icon: 'passive_dumbbells', maxLevel: c.dumbbells.maxLevel, unlock: null,
    description: (level, m) => `+${pct(c.dumbbells.areaPct * m)} obszaru: większe pociski, chmury, promienie i tarcze`,
    apply(pl, level, m) { addShare(pl, 'area', c.dumbbells.areaPct * m); },
  },
  {
    id: 'ticket', name: 'Bilet miesięczny ZTM', icon: 'passive_ticket', maxLevel: c.ticket.maxLevel, unlock: null,
    description: (level, m) => `+${count(c.ticket.amount, m)} do liczby pocisków, chmur, promieni, tarcz i pszczół`,
    apply(pl, level, m) { pl.amount += count(c.ticket.amount, m); },
  },
  {
    id: 'gymPass', name: 'Karnet na siłownię', icon: 'passive_gymPass', maxLevel: c.gymPass.maxLevel, unlock: null,
    description: (level, m) => `+${pct(c.gymPass.durationPct * m)} czasu działania broni i znajdziek`,
    apply(pl, level, m) { addShare(pl, 'duration', c.gymPass.durationPct * m); },
  },
  {
    id: 'broth', name: 'Rosół babci', icon: 'passive_broth', maxLevel: c.broth.maxLevel,
    unlock: { text: `Zjedz łącznie ${c.broth.unlockPierogi} pierogów`, check: () => save.stats.pierogi >= c.broth.unlockPierogi },
    description: (level, m) => `+${(c.broth.regenPerSec * m).toFixed(1).replace('.', ',')} HP na sekundę`,
    apply(pl, level, m) { pl.regen += c.broth.regenPerSec * m; },
  },
  {
    id: 'jacket', name: 'Kurtka puchowa', icon: 'passive_jacket', maxLevel: c.jacket.maxLevel,
    unlock: { text: `Przyjmij łącznie ${c.jacket.unlockDamageTaken} obrażeń`, check: () => save.stats.damageTaken >= c.jacket.unlockDamageTaken },
    description: (level, m) => `-${count(c.jacket.armor, m)} obrażeń z każdego dotyku wroga (zawsze co najmniej 1)`,
    apply(pl, level, m) { pl.armor += count(c.jacket.armor, m); },
  },
  {
    id: 'clover', name: 'Koniczyna z trawnika', icon: 'passive_clover', maxLevel: c.clover.maxLevel,
    unlock: { text: `Zbierz łącznie ${c.clover.unlockGoldCoins} dużych złotych monet`, check: () => save.stats.goldCoins >= c.clover.unlockGoldCoins },
    description: (level, m) => `+${pct(c.clover.luckPct * m)} szczęścia: częściej rzadkie karty i więcej monet`,
    apply(pl, level, m) { addShare(pl, 'luck', c.clover.luckPct * m); },
  },
  {
    id: 'notebook', name: 'Zeszyt w kratkę', icon: 'passive_notebook', maxLevel: c.notebook.maxLevel,
    unlock: { text: `Dojdź do ${c.notebook.unlockLevel} poziomu`, check: () => save.stats.maxLevel >= c.notebook.unlockLevel },
    description: (level, m) => `+${pct(c.notebook.xpPct * m)} XP z kryształów`,
    apply(pl, level, m) { addShare(pl, 'growth', c.notebook.xpPct * m); },
  },
  {
    id: 'goggins', name: 'Książka Davida Gogginsa', icon: 'passive_goggins', maxLevel: c.goggins.maxLevel, unlock: null,
    description: (level, m) => `+${pct(c.goggins.critChance * m)} szansy na trafienie krytyczne`,
    apply(pl, level, m) { pl.critChance += c.goggins.critChance * m; },
  },
  {
    id: 'limp', name: 'Płyta Limp Bizkit', icon: 'passive_limp', maxLevel: c.limp.maxLevel, unlock: null,
    description: (level, m) => `+${pct(c.limp.critMult * m)} obrażeń krytycznych`,
    apply(pl, level, m) { pl.critMult += c.limp.critMult * m; },
  },
  {
    id: 'boxing', name: 'Rękawice bokserskie', icon: 'passive_boxing', maxLevel: c.boxing.maxLevel, unlock: null,
    description: (level, m) => `+${pct(c.boxing.damagePct * m)} obrażeń wrogom do ${c.boxing.range} px od Bartka`,
    apply(pl, level, m) { pl.closeDamage += c.boxing.damagePct * m; },
  },
  {
    id: 'bag', name: 'Wór na kryształy', icon: 'passive_bag', maxLevel: c.bag.maxLevel, unlock: null,
    description: (level, m) => `+${pct(c.bag.magnetPct * m)} zasięgu przyciągania kryształów`,
    apply(pl, level, m) { addShare(pl, 'magnetRadius', c.bag.magnetPct * m); },
  },
];
