import { config } from './config.js';

// Reset every run.
export function newRun() {
  return {
    elapsedMs: 0,
    kills: 0,
    level: 1,
    xp: 0,
    hp: config.player.maxHp,
    invulnUntilMs: 0,
    fireCooldownMs: 0,
    // Weapon stats copied from config so upgrades can change them for this run only.
    stats: { ...config.pistol },
  };
}

// XP needed to go from `level` to the next one.
export function xpToNextLevel(level) {
  return config.xp.baseToLevel + config.xp.perLevel * (level - 1);
}

// Reserved for persistent progress (gym, unlocks). Do not write to it yet.
export const save = {};
