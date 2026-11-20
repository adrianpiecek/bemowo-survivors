import { config } from './config.js';
import { gymUpgrades } from './data/gym.js';

// Run stats, always in this order: config, then gym, then in-run upgrades (applied later by LevelUpScene).
function startingStats() {
  const stats = {
    maxHp: config.player.maxHp,
    speed: config.player.speed,
    magnetRadius: config.xp.magnetRadius,
    scale: 1, // Bartek's size and hitbox, 1 = normal
    bees: 0, // from the "Ul" upgrade
    beeDamageMult: 1, // rarer "Ul" cards raise it
    damageMult: 1, // every weapon's damage: damage cards, gym, pickups
    cooldownMult: 1, // every weapon's cooldown: fire rate cards divide it
    range: config.weapons.pistol.range, // pistol range (the "Okulary" gym upgrade)
    bulletSpeed: config.weapons.pistol.bulletSpeed,
    // Warm-up from the gym; these defaults mean no effect.
    warmupMs: 0,
    warmupSpeedMult: 1,
    afterWarmupDamageMult: 1,
  };
  for (const up of gymUpgrades) {
    const level = gymLevel(up);
    if (level > 0) up.apply(stats, level);
  }
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
    damageTaken: 0, // from enemy touches, for the Captain's shield unlock
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
    chestQueue: [], // boss chests picked up and not opened yet: upgrades in each
    touchMove: { x: 0, y: 0 }, // joystick direction, length 0..1
    bubbleMs: 0, // time left on the "Muchacho!" bubble
    player: startingStats(), // HP, movement and weapon stats; upgrades change them for this run only
    upgrades: {}, // upgrade id -> how many times taken
    weapons: [], // the weapons Bartek carries: { def, level, ... }, see data/weapons.js
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
  return Math.floor(run.kills / p.perKills) + Math.floor(run.elapsedMs / 60000) * p.perMinute + (won ? p.winBonus : 0)
    + run.bossProtein;
}

// Persistent progress in localStorage. Bump SAVE_VERSION and migrate in loadSave() when the schema changes.
const SAVE_KEY = 'bemowo-survivors-save-v1';
const SAVE_VERSION = 1;

function freshSave() {
  return { version: SAVE_VERSION, protein: 0, gym: {}, unlocks: [], muted: false, runsPlayed: 0 };
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
  if (Array.isArray(d.unlocks)) s.unlocks = d.unlocks;
  if (typeof d.muted === 'boolean') s.muted = d.muted;
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
