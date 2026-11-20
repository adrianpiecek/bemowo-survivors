import { config } from '../config.js';
import { save, writeSave } from '../state.js';
import { addEffect } from '../systems/effects.js';
import { passiveCards } from '../systems/cards.js'; // only used inside apply, so the import cycle through upgrades.js is fine

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
    // A free passive card: a new passive (while a slot is free) or the next level of one Bartek has.
    apply(scene) {
      const open = passiveCards(scene.run).filter((c) => !scene.run.banished.includes(c.id)); // a banished passive stays out
      if (!open.length) return 'Wszystko już wytrenowane';
      const card = Phaser.Utils.Array.GetRandom(open);
      card.apply(scene.run.player, scene, 1);
      return `${card.name} +1`;
    },
  },
];

// Runs one effect and shows on the banner what happened.
export function doBartkowanie(scene, effect) {
  const subtext = effect.apply(scene) ?? '';
  scene.scene.get('UIScene').showBanner(effect.name, subtext);
}
