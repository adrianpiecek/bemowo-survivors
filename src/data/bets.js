import { config } from '../config.js';
import { save } from '../state.js';
import { passives } from './passives.js';

// Zakłady z Unc: harder runs for more protein. The levels picked in the gym (BetsScene) sit in save.bets and hold for
// every run until changed. Each bet: { id, name, description(level), maxLevel, proteinPct (per level), apply(run, level) };
// apply sets run-wide switches at the start of a run (GameScene.create, after the plan). Numbers in config.bets.
const c = config.bets;
const pct = (x) => `${Math.round(x * 100)}%`;

export const bets = [
  {
    id: 'fasterZombies', name: 'Szybsze zombie', maxLevel: c.fasterZombies.maxLevel, proteinPct: c.fasterZombies.proteinPct,
    description: (l) => `Wrogowie i bossowie +${pct(c.fasterZombies.speedPct * l)} prędkości`,
    apply(run, l) { run.enemySpeedMult *= 1 + c.fasterZombies.speedPct * l; },
  },
  {
    id: 'thickerZombies', name: 'Grubsze zombie', maxLevel: c.thickerZombies.maxLevel, proteinPct: c.thickerZombies.proteinPct,
    description: (l) => `Wrogowie +${pct(c.thickerZombies.hpPct * l)} HP`,
    apply(run, l) { run.enemyHpMult *= 1 + c.thickerZombies.hpPct * l; },
  },
  {
    id: 'denserHorde', name: 'Gęstsza horda', maxLevel: c.denserHorde.maxLevel, proteinPct: c.denserHorde.proteinPct,
    description: (l) => `+${pct(c.denserHorde.spawnPct * l)} wrogów na sekundę`,
    apply(run, l) { run.spawnRateMult *= 1 + c.denserHorde.spawnPct * l; },
  },
  {
    id: 'earlierBosses', name: 'Wcześniejsi bossowie', maxLevel: c.earlierBosses.maxLevel, proteinPct: c.earlierBosses.proteinPct,
    description: (l) => `Bossowie ${c.earlierBosses.sec * l} s wcześniej`,
    apply(run, l) { run.bossEarlySec += c.earlierBosses.sec * l; },
  },
  {
    id: 'noPierogi', name: 'Bez pierogów', maxLevel: c.noPierogi.maxLevel, proteinPct: c.noPierogi.proteinPct,
    description: () => 'Żadna znajdźka nie leczy: pierogi nie wypadają',
    apply(run) { run.noPickupHeal = true; },
  },
  {
    id: 'twoCards', name: 'Dwie karty', maxLevel: c.twoCards.maxLevel, proteinPct: c.twoCards.proteinPct,
    description: () => `${c.twoCards.cards} karty na level upie zamiast ${config.ui.card.count}`,
    apply(run) { run.cardCount = c.twoCards.cards; },
  },
];

// The picked level, clamped so a hand-edited save cannot break a run.
export function betLevel(bet) {
  const level = Math.floor(Number(save.bets[bet.id]));
  return Number.isFinite(level) ? Phaser.Math.Clamp(level, 0, bet.maxLevel) : 0;
}

// Protein bonus of the picked bets, a share (0.45 = +45%); rounded so 0.1 + 0.2 + 0.2 is exactly 0.5.
export const betSum = () => Math.round(bets.reduce((s, b) => s + betLevel(b) * b.proteinPct, 0) * 100) / 100;

export function applyBets(run) {
  for (const b of bets) {
    const level = betLevel(b);
    if (level > 0) b.apply(run, level);
  }
  run.betPct = betSum();
}

// The gym shows the bets after the first win (a save from before the win counter: the plan Rzeźba means a win).
export const betsOpen = () => config.debug.betsUnlocked || save.stats.wins > 0 || save.unlocks.includes('cut');

// Extra unlocks for a won run with enough bets on (besides each one's own condition): from rewards.uncPct the plan
// Trening z Unc, from rewards.passivesPct every passive still locked.
export function unlockedByBets(def, run, won) {
  if (!won) return false;
  if (def.id === 'unc') return run.betPct >= c.rewards.uncPct;
  return passives.includes(def) && run.betPct >= c.rewards.passivesPct;
}
