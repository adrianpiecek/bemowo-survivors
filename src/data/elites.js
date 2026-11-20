import { config } from '../config.js';
import { enemies } from './enemies.js';
import { playVfx } from '../systems/vfx.js';

// Elite traits. GameScene.makeElite turns a fresh enemy into an elite (more HP, bigger, a glow, the name over its head)
// with one trait, or two later in the run (config.elites.doubleAfterSec), and calls each one's apply. `scene` is GameScene, `z` the enemy sprite (z.speed is its own walking speed, z.stats shared).
//   apply(z)                  optional: changes the elite once
//   update(scene, z, delta)   optional: every frame while it walks (not while frozen, squatting or mid-leap)
//   onDeath(scene, z)         optional: when it dies, before its chest drops
// Numbers in config.elites.
const c = config.elites;

export const elites = [
  {
    id: 'fast', name: 'Szybki', color: c.fast.color,
    apply(z) { z.speed *= 1 + c.fast.speedPct; },
  },
  {
    id: 'armored', name: 'Pancerny', color: c.armored.color,
    apply(z) { z.hp *= c.armored.hpMult; },
  },
  {
    id: 'splitter', name: 'Dzielący się', color: c.splitter.color,
    onDeath(scene, z) {
      const def = enemies.find((d) => d.id === z.stats.id), s = c.splitter.spread;
      for (let i = 0; i < c.splitter.copies; i++) {
        const copy = scene.spawnEnemy(def, z.x + Phaser.Math.FloatBetween(-s, s), z.y + Phaser.Math.FloatBetween(-s, s));
        if (!copy) return;
        copy.setScale(copy.scaleX * c.splitter.scale);
        copy.hp *= c.splitter.hpPct;
      }
    },
  },
  {
    id: 'vampire', name: 'Wampir', color: c.vampire.color,
    update(scene, z, delta) {
      const v = c.vampire;
      z.eliteMs += delta;
      if (z.eliteMs < v.everyMs) return;
      z.eliteMs -= v.everyMs;
      let healed = false;
      for (const o of scene.enemies.getChildren()) {
        if (!o.active || o === z || o.stats.isBoss || o.hp >= o.maxHp) continue;
        if (Phaser.Math.Distance.Between(z.x, z.y, o.x, o.y) > v.radius) continue;
        o.hp = Math.min(o.maxHp, o.hp + o.maxHp * v.healPct);
        healed = true;
      }
      if (healed) playVfx(scene, 'vampireHeal', z.x, z.y);
    },
  },
  {
    id: 'thief', name: 'Złodziej', color: c.thief.color,
    // Goes for the nearest gem lying around (not coins, not gems already flying to Bartek) and pockets it.
    update(scene, z) {
      const t = c.thief;
      let best = null, bestD = t.seekRadius;
      for (const g of scene.gems.getChildren()) {
        if (!g.active || g.coin || g.magnet) continue;
        const d = Phaser.Math.Distance.Between(z.x, z.y, g.x, g.y);
        if (d <= t.stealRadius) {
          g.disableBody(true, true);
          z.stolen += g.value;
        } else if (d < bestD) {
          bestD = d;
          best = g;
        }
      }
      if (best) scene.physics.moveToObject(z, best, z.speed);
    },
    onDeath(scene, z) {
      if (z.stolen > 0) scene.dropGemWorth(z.x, z.y, z.stolen * (1 + c.thief.bonusPct));
    },
  },
];
