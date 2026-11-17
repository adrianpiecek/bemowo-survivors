import { config } from './config.js';

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
    pendingLevelUps: 0, // level-ups still waiting for a card pick
    bubbleMs: 0, // time left on the "Muchacho!" bubble
    // Player and weapon stats copied from config; upgrades change them for this run only.
    player: { hp: config.player.maxHp, maxHp: config.player.maxHp, speed: config.player.speed, ...config.pistol },
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

// Reserved for persistent progress (gym, unlocks). Do not write to it yet.
export const save = {};
