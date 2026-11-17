import { config } from './config.js';

// Reset every run.
export function newRun() {
  return { elapsedMs: 0, kills: 0, level: 1, xp: 0, hp: config.player.maxHp, invulnUntilMs: 0 };
}

// Reserved for persistent progress (gym, unlocks). Do not write to it yet.
export const save = {};
