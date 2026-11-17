import { config } from './config.js';
import { gymUpgrades } from './data/gym.js';

// Run stats, always in this order: config, then gym, then in-run upgrades (applied later by LevelUpScene).
function startingStats() {
  const stats = {
    maxHp: config.player.maxHp,
    speed: config.player.speed,
    magnetRadius: config.xp.magnetRadius,
    ...config.pistol,
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
    fireCooldownMs: 0,
    spawnCooldownMs: 0,
    wave: 0, // waves spawned so far
    pendingLevelUps: 0, // level-ups still waiting for a card pick
    touchMove: { x: 0, y: 0 }, // joystick direction, length 0..1
    bubbleMs: 0, // time left on the "Muchacho!" bubble
    player: startingStats(), // HP, movement and weapon stats; upgrades change them for this run only
    upgrades: {}, // upgrade id -> how many times taken
  };
}

// XP needed to go from `level` to the next one.
export function xpToNextLevel(level) {
  return config.xp.baseToLevel + config.xp.perLevel * (level - 1);
}

// 'm:ss' for a time in ms, rounded down to whole seconds.
export function formatTime(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// Protein earned by a finished run.
export function proteinForRun(run, won) {
  const p = config.protein;
  return Math.floor(run.kills / p.perKills) + Math.floor(run.elapsedMs / 60000) * p.perMinute + (won ? p.winBonus : 0);
}

// Persistent progress in localStorage. Bump SAVE_VERSION and migrate in loadSave() when the schema changes.
const SAVE_KEY = 'bemowo-survivors-save-v1';
const SAVE_VERSION = 1;

function freshSave() {
  return { version: SAVE_VERSION, protein: 0, gym: {}, unlocks: [] };
}

// Missing, corrupt or unreadable save (private mode, blocked storage) gives a fresh one, never an error.
export function loadSave() {
  try {
    const d = JSON.parse(localStorage.getItem(SAVE_KEY));
    const ok = d && d.version === SAVE_VERSION && Number.isFinite(d.protein) && d.protein >= 0
      && d.gym && typeof d.gym === 'object' && !Array.isArray(d.gym) && Array.isArray(d.unlocks);
    if (ok) return d;
  } catch { /* fall through to a fresh save */ }
  return freshSave();
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
