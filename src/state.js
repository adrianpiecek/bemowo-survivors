import { config } from './config.js';
import { gymUpgrades } from './data/gym.js';

// Run stats, always in this order: config, then gym, then in-run upgrades (applied later by LevelUpScene).
function startingStats() {
  const stats = {
    maxHp: config.player.maxHp,
    speed: config.player.speed,
    magnetRadius: config.xp.magnetRadius,
    scale: 1, // Bartek's size and hitbox, 1 = normal
    damageMult: 1, // every weapon's damage: Kreatyna, gym, pickups
    cooldownMult: 1, // every weapon's cooldown: Kawa z Żabki, pre-workout
    // Passive stats (data/passives.js), read by the weapons through GameScene's weapon* helpers.
    area: 1, // size of bullets, clouds, beams, shields, the bee orbit
    duration: 1, // how long weapon effects and timed pickups last
    amount: 0, // extra bullets, clouds, beams, shields, bees
    armor: 0, // taken off every enemy touch (a touch still hurts at least 1)
    regen: 0, // HP per second
    luck: 1, // rarer cards come up more often, coins drop more often
    growth: 1, // XP from gems
    range: config.weapons.pistol.range, // pistol range (the "Okulary" gym upgrade)
    bulletSpeed: config.weapons.pistol.bulletSpeed,
    // Warm-up from the gym; these defaults mean no effect.
    warmupMs: 0,
    warmupSpeedMult: 1,
    afterWarmupDamageMult: 1,
    // Level-up draw control charges left this run (Odśwież, Pomiń, Wywal).
    rerolls: config.draw.rerolls,
    skips: config.draw.skips,
    banishes: config.draw.banishes,
  };
  for (const up of gymUpgrades) {
    const level = gymLevel(up);
    if (level > 0) up.apply(stats, level);
  }
  const dc = config.debug.drawCharges;
  if (dc != null) stats.rerolls = stats.skips = stats.banishes = dc;
  stats.hp = stats.maxHp;
  // In-run upgrades add a share of these post-gym values, so gym and run percentages multiply.
  stats.base = { ...stats };
  return stats;
}

// Reset every run.
export function newRun() {
  return {
    elapsedMs: 0,
    kills: 0,
    level: 1,
    xp: 0,
    invulnUntilMs: 0,
    spawnCooldownMs: 0,
    wave: 0, // waves spawned so far
    mapPickupMs: config.pickups.mapSpawn.everySec * 1000, // time to the next pickup lying down by itself
    spawned: 0, // enemies spawned, for the debug overlay
    damageDealt: 0, // by bullets and bees, for the debug overlay
    coinProtein: 0, // protein from coins picked up this run, paid out at the end
    damageTaken: 0, // from enemy touches, for the Captain's shield unlock and save.stats
    pierogiEaten: 0, // for save.stats
    goldCoins: 0, // for save.stats
    regenHp: 0, // regeneration not yet added: HP goes up in whole points
    killsByType: {}, // enemy type id -> kills this run (weapon unlocks)
    bossesKilled: [], // boss ids killed this run (weapon unlocks)
    pendingLevelUps: 0, // level-ups still waiting for a card pick
    pickupDropMs: {}, // pickup id -> run time of its last drop, for the cooldown
    effects: {}, // timed effects, see systems/effects.js
    flashMs: 0, // time left on Bartek's blink after an effect ends
    tankCharge: 0, // kills toward the tank, 0..config.tank.killsToCharge
    tankMs: 0, // time left as a tank, 0 = Bartek on foot
    scarred: false, // hit by a klapa this run
    nextBoss: 0, // index of the next boss in order of appearance
    bossAnnounced: false, // the next boss's banner has been shown
    bossProtein: 0, // protein from bosses killed this run, paid out at the end
    screenQueue: [], // screens over the paused run waiting for update(): { scene: 'ChestScene' | 'ShopScene', data }
    eliteMs: config.elites.everySec * 1000, // time to the next elite
    events: [], // this run's events (data/events.js): { def, atMs, started }, drawn in GameScene.create
    activeEvents: [], // events going on now: { def, remainingMs, durationMs } plus the event's own counters
    xpMult: 1, // Złota godzina
    // Zakłady z Unc (data/bets.js), set in GameScene.create:
    betPct: 0, // protein bonus of the run's bets (0.45 = +45%)
    enemySpeedMult: 1, // every enemy's speed
    spawnRateMult: 1, // the regular spawn rate
    bossEarlySec: 0, // bosses walk in this much earlier
    noPickupHeal: false, // pickups that heal do not drop
    cardCount: config.ui.card.count, // cards on a level up
    // Hidden pressure (config.dda), GameScene.updatePressure:
    pressure: 0, // 0..config.dda.max
    pressureMsSum: 0, // pressure x ms, for the run's average (the protein bonus)
    ddaSampleMs: 0, // time since the last sample
    ddaCrowdSum: 0, // enemies near Bartek summed over this sample's frames
    ddaFrames: 0,
    ddaDamage: [], // run.damageTaken at each sample of the window
    ddaGraceMs: 0, // no rise while above 0: set when a card is taken
    ddaLast: null, // the last sample, for the balance overlay: { hurt, crowd }
    touchMove: { x: 0, y: 0 }, // joystick direction, length 0..1
    bubbleMs: 0, // time left on the "Muchacho!" bubble
    player: startingStats(), // HP, movement and weapon stats; upgrades change them for this run only
    upgrades: {}, // upgrade id -> how many times taken
    banished: [], // card ids thrown out with Wywal: never drawn again this run
    evolutions: [], // evolution ids this run (save.evolutions gets the new ones at the end)
    plan: null, // the training plan picked for this run (data/plans.js), null on the very first run
    commonOnly: false, // plan Trening z Unc: every card is common
    weightMult: {}, // card id -> draw weight multiplier (plan Bartkowanie)
    enemyHpMult: 1, // plan Lenistwo: walking enemies' HP
    weapons: [], // the weapons Bartek carries: { def, level, ... }, see data/weapons.js
    passives: [], // the passives Bartek carries: { def, level }, see data/passives.js
  };
}

// XP needed to go from `level` to the next one.
export function xpToNextLevel(level) {
  const x = config.xp, n = level - 1;
  return Math.round(x.baseToLevel + x.perLevel * n + x.perLevelSq * n * n);
}

// 'm:ss' for a time in ms, rounded down to whole seconds.
export function formatTime(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// Protein earned by a finished run.
export function proteinForRun(run, won) {
  const p = config.protein;
  const base = Math.floor(run.kills / p.perKills) + Math.floor(run.elapsedMs / 60000) * p.perMinute + (won ? p.winBonus : 0)
    + run.bossProtein;
  return Math.floor(base * (1 + run.betPct + pressureBonus(run))); // Zakłady z Unc, presja Bemowa
}

// The protein bonus for the run's hidden pressure: its average over the run x config.dda.proteinPct, in whole percent.
export function pressureBonus(run) {
  return Math.floor((run.pressureMsSum / Math.max(1, run.elapsedMs)) * config.dda.proteinPct * 100) / 100;
}

// Persistent progress in localStorage. Bump SAVE_VERSION and migrate in loadSave() when the schema changes.
const SAVE_KEY = 'bemowo-survivors-save-v1';
const SAVE_VERSION = 1;

function freshSave() {
  return { version: SAVE_VERSION, protein: 0, gym: {}, unlocks: [], muted: false, musicVolume: 1, sfxVolume: 1, orientation: 'portrait', evolutions: [], runsPlayed: 0, stats: freshStats(),
    bets: {} }; // bets: Zakłady z Unc, bet id -> level picked (data/bets.js)
}

// Totals over all runs, for the passives' and plans' unlocks. Added in GameOverScene.
// bartkowanie: Bartkowanie cards picked; earlyDeaths: runs lost before config.plans.lazy.earlyDeathSec; wins: runs won.
function freshStats() {
  return { pierogi: 0, damageTaken: 0, goldCoins: 0, maxLevel: 0, bartkowanie: 0, earlyDeaths: 0, wins: 0 };
}

// Unreadable save (corrupt JSON, private mode, blocked storage) gives a fresh one, never an error.
// A readable one keeps every valid field; missing or broken fields get their defaults.
export function loadSave() {
  const s = freshSave();
  let d;
  try {
    d = JSON.parse(localStorage.getItem(SAVE_KEY));
  } catch { return s; }
  const isObject = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
  // Another schema version is not guessed at: start fresh (bump SAVE_VERSION and migrate here when it changes).
  if (!isObject(d) || (d.version !== undefined && d.version !== SAVE_VERSION)) return s;
  if (Number.isFinite(d.protein) && d.protein >= 0) s.protein = d.protein;
  if (isObject(d.gym)) s.gym = d.gym;
  if (isObject(d.bets)) s.bets = d.bets; // levels are clamped where they are read (betLevel)
  if (Array.isArray(d.unlocks)) s.unlocks = d.unlocks;
  if (typeof d.muted === 'boolean') s.muted = d.muted;
  for (const k of ['musicVolume', 'sfxVolume']) if (Number.isFinite(d[k])) s[k] = Phaser.Math.Clamp(d[k], 0, 1);
  if (d.orientation === 'landscape') s.orientation = 'landscape';
  if (Array.isArray(d.evolutions)) s.evolutions = d.evolutions.filter((id) => typeof id === 'string');
  if (isObject(d.stats)) for (const k of Object.keys(s.stats)) if (Number.isFinite(d.stats[k]) && d.stats[k] >= 0) s.stats[k] = d.stats[k];
  if (Number.isInteger(d.runsPlayed) && d.runsPlayed >= 0) s.runsPlayed = d.runsPlayed;
  // A save from before the counter that already has progress has clearly played a run.
  else if (s.protein > 0 || Object.keys(s.gym).length) s.runsPlayed = 1;
  return s;
}

// Fails silently: the game keeps running, progress just is not kept.
export function writeSave(s) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ ...s, version: SAVE_VERSION }));
  } catch { /* storage full or blocked */ }
}

// Bought level of a gym upgrade, clamped so a hand-edited save cannot break the stats.
export function gymLevel(up) {
  const level = Math.floor(Number(save.gym[up.id]));
  return Number.isFinite(level) ? Phaser.Math.Clamp(level, 0, up.maxLevel) : 0;
}

export const save = config.debug.resetSave ? freshSave() : loadSave();
if (config.debug.resetSave) writeSave(save);
