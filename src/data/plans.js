import { config } from '../config.js';
import { save } from '../state.js';

// Training plans: picked before a run (PlanScene), one clear plus and one clear minus. Applied in GameScene after the
// gym and before any card of the run: the plan is the run's first upgrade.
//   plus, minus  card lines (minus: null for none)
//   apply(player, run)  changes run.player (after the gym) and run-wide switches in `run`
//   passive      optional: a passive id Bartek starts with at level 1, or 'random' for a random unlocked one
//   unlock       null: from the start; else { text, check(run, won) }: checked at the end of a run after save.stats got
//                this run's totals, kept in save.unlocks like weapons and passives (ids never repeat theirs)
// Numbers in config.plans.
const c = config.plans;
const pct = (x) => `${Math.round(Math.abs(x) * 100)}%`;

export const plans = [
  {
    id: 'chestDay', name: 'Dzień klaty', unlock: null,
    plus: `+${pct(c.chestDay.damagePct)} obrażeń`,
    minus: `-${pct(c.chestDay.speedPct)} szybkości ruchu`,
    apply(pl) {
      pl.damageMult *= 1 + c.chestDay.damagePct;
      pl.speed *= 1 + c.chestDay.speedPct;
    },
  },
  {
    id: 'cardio', name: 'Cardio', unlock: null, passive: 'shoes',
    plus: `+${pct(c.cardio.speedPct)} szybkości ruchu, start z Butami z bazaru`,
    minus: `${c.cardio.maxHp} max HP`,
    apply(pl) {
      pl.speed *= 1 + c.cardio.speedPct;
      pl.maxHp += c.cardio.maxHp;
    },
  },
  {
    id: 'bulk', name: 'Na masie', unlock: null, passive: 'gainer',
    plus: `+${c.bulk.maxHp} max HP, start z Gainerem`,
    minus: `-${pct(c.bulk.fireRatePct)} szybkostrzelności`,
    apply(pl) {
      pl.maxHp += c.bulk.maxHp;
      pl.cooldownMult /= 1 + c.bulk.fireRatePct; // fireRatePct below 0: fewer shots, a longer cooldown
    },
  },
  {
    id: 'cut', name: 'Rzeźba',
    unlock: { text: 'Wygraj rundę', check: (run, won) => won },
    plus: `+${pct(c.cut.fireRatePct)} szybkostrzelności`,
    minus: `${c.cut.maxHp} max HP`,
    apply(pl) {
      pl.cooldownMult /= 1 + c.cut.fireRatePct;
      pl.maxHp += c.cut.maxHp;
    },
  },
  {
    id: 'legDay', name: 'Dzień nóg', unlock: null,
    plus: `${c.legDay.magnetMult}x zasięg przyciągania, +${pct(c.legDay.xpPct)} XP`,
    minus: `-${pct(c.legDay.damagePct)} obrażeń`,
    apply(pl) {
      pl.magnetRadius *= c.legDay.magnetMult;
      pl.growth *= 1 + c.legDay.xpPct;
      pl.damageMult *= 1 + c.legDay.damagePct;
    },
  },
  {
    id: 'unc', name: 'Trening z Unc',
    unlock: {
      text: `Wygraj rundę z ${c.unc.unlockMaxedPassives} pasywkami na max`,
      check: (run, won) => won && run.passives.filter((p) => p.level >= p.def.maxLevel).length >= c.unc.unlockMaxedPassives,
    },
    plus: `+${c.unc.rerolls} Odśwież, +${c.unc.banishes} Wywal`,
    minus: 'karty tylko zwykłe',
    apply(pl, run) {
      pl.rerolls += c.unc.rerolls;
      pl.banishes += c.unc.banishes;
      run.commonOnly = true; // systems/cards.js rollRarity
    },
  },
  {
    id: 'bartkowanie', name: 'Bartkowanie', passive: 'random',
    unlock: {
      text: `Wybierz kartę Bartkowanie ${c.bartkowanie.unlockPicks} razy`,
      check: () => save.stats.bartkowanie >= c.bartkowanie.unlockPicks,
    },
    plus: `Bartkowanie ${c.bartkowanie.weightMult}x częściej, start z losową pasywką`,
    minus: null,
    apply(pl, run) { run.weightMult.bartkowanie = c.bartkowanie.weightMult; },
  },
  {
    id: 'lazy', name: 'Lenistwo',
    unlock: {
      text: `Zgiń przed ${Math.floor(c.lazy.earlyDeathSec / 60)}:${String(c.lazy.earlyDeathSec % 60).padStart(2, '0')} ${c.lazy.unlockEarlyDeaths} razy`,
      check: () => save.stats.earlyDeaths >= c.lazy.unlockEarlyDeaths,
    },
    plus: `+${pct(c.lazy.xpPct)} XP`,
    minus: `wrogowie +${pct(c.lazy.enemyHpPct)} HP`,
    apply(pl, run) {
      pl.growth *= 1 + c.lazy.xpPct;
      run.enemyHpMult *= 1 + c.lazy.enemyHpPct;
    },
  },
];

