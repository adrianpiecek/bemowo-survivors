import { config } from '../config.js';
import { save, writeSave } from '../state.js';
import { addEffect } from '../systems/effects.js';
import { upgrades } from './upgrades.js'; // only used inside apply, so the import cycle with upgrades.js is fine

// Effects of the "Bartkowanie" card. `scene` is GameScene. apply may return a banner subtext.
// None of them may kill Bartek or break the save. Timed ones go through systems/effects.js;
// GameScene and UIScene check them by id (squats, moonwalk, yellowSweater).
const b = config.bartkowanie, timedMs = b.durationSec * 1000;

export const bartkowanie = [
  {
    name: 'Zombie robią przysiady',
    apply(scene) { addEffect(scene.run, { id: 'squats', durationMs: timedMs, apply() {} }); },
  },
  {
    name: 'Żółty sweter mocy',
    apply(scene) {
      addEffect(scene.run, { id: 'yellowSweater', durationMs: timedMs, apply(pl) { pl.damageMult *= 1 + b.damagePct; } });
    },
  },
  {
    name: 'Muchacho do pustej przestrzeni',
    apply(scene) {
      const pl = scene.run.player, k = b.allStatsPct;
      for (const stat of ['speed', 'magnetRadius', 'range', 'bulletSpeed', 'damageMult']) pl[stat] += pl.base[stat] * k;
      pl.cooldownMult /= 1 + k;
      const hp = Math.max(1, Math.round(pl.base.maxHp * k)); // whole HP, so the HUD stays readable
      pl.maxHp += hp;
      pl.hp += hp;
    },
  },
  {
    name: 'Sprzątanie Bemowa',
    apply(scene) { scene.magnetAllGems(); },
  },
  {
    name: 'Bartkowanie zakończone sukcesem',
    apply(scene) { scene.spinPlayer(); },
  },
  {
    name: 'Moonwalk',
    apply(scene) { addEffect(scene.run, { id: 'moonwalk', durationMs: timedMs, apply() {} }); },
  },
  {
    name: 'Odżywka',
    apply() {
      save.protein += b.protein;
      writeSave(save);
      return `+${b.protein} białka`;
    },
  },
  {
    name: 'Losowy trening',
    apply(scene) {
      const run = scene.run;
      const open = upgrades.filter((up) => up.id !== 'bartkowanie' && (run.upgrades[up.id] ?? 0) < up.maxStack);
      if (!open.length) return 'Wszystko już wytrenowane';
      const up = Phaser.Utils.Array.GetRandom(open);
      up.apply(run.player, scene);
      run.upgrades[up.id] = (run.upgrades[up.id] ?? 0) + 1;
      return `${up.name} +1`;
    },
  },
];

// Runs one effect and shows on the banner what happened.
export function doBartkowanie(scene, effect) {
  const subtext = effect.apply(scene) ?? '';
  scene.scene.get('UIScene').showBanner(effect.name, subtext);
}
