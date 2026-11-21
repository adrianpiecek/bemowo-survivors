import { config } from '../config.js';
import { enemies } from './enemies.js';
import { strikeCircle, strikeLine } from '../systems/telegraph.js';
import { playVfx } from '../systems/vfx.js';

// Boss powers, keyed by the boss id (config.boss.list). Every everySec (config.boss.powers[id]) the boss uses its power,
// when ready?(scene, z) allows it; most are warned attacks from systems/telegraph.js. hint: under the boss's "UWAGA"
// banner, so the player knows what is coming. Numbers in config.boss.powers.
const p = config.boss.powers;
const enemy = (id) => enemies.find((d) => d.id === id);
const near = (scene, z, range) => Phaser.Math.Distance.BetweenPoints(z, scene.player) <= range;
const at = (x, y, r, a) => ({ x: x + Math.cos(a) * r, y: y + Math.sin(a) * r });

export const bossPowers = {
  bigZombie: {
    hint: 'Woła hordę: wokół niego wstają zombie',
    use(scene, z) {
      const c = p.bigZombie, def = enemy('zombie');
      playVfx(scene, 'smokePuff', z.x, z.y);
      for (let i = 0; i < c.count; i++) {
        const pt = at(z.x, z.y, c.radius, (i / c.count) * Math.PI * 2);
        if (scene.enemies.countActive(true) < config.spawn.maxEnemies) scene.spawnEnemy(def, pt.x, pt.y);
      }
    },
  },
  bigUncanny: {
    hint: 'Znika i pojawia się tuż obok Bartka',
    ready: (scene, z) => near(scene, z, p.bigUncanny.range),
    use(scene, z) {
      const c = p.bigUncanny, pl = scene.player;
      const t = at(pl.x, pl.y, c.offset, Phaser.Math.FloatBetween(0, Math.PI * 2));
      strikeCircle(scene, t.x, t.y, c.radius, c.warnMs, c.damage, () => {
        if (!z.active) return;
        playVfx(scene, 'smokePuff', z.x, z.y);
        z.setPosition(t.x, t.y);
        playVfx(scene, 'smokePuff', t.x, t.y);
      });
    },
  },
  bigGoblin: {
    hint: 'Rzuca beczkami pełnymi goblinów',
    use(scene, z) {
      const c = p.bigGoblin, { x, y } = scene.player, def = enemy('goblin');
      strikeCircle(scene, x, y, c.radius, c.warnMs, c.damage, () => {
        playVfx(scene, 'barrelBreak', x, y);
        for (let i = 0; i < c.goblins; i++) {
          const pt = at(x, y, c.radius / 2, (i / c.goblins) * Math.PI * 2);
          if (scene.enemies.countActive(true) < config.spawn.maxEnemies) scene.spawnEnemy(def, pt.x, pt.y);
        }
      });
    },
  },
  bigSportakus: {
    hint: 'Tupie: fala wokół niego',
    ready: (scene, z) => near(scene, z, p.bigSportakus.range),
    use(scene, z) {
      const c = p.bigSportakus, { x, y } = z;
      strikeCircle(scene, x, y, c.radius, c.warnMs, c.damage, () => playVfx(scene, 'stompWave', x, y));
    },
  },
  bigJoker: {
    hint: 'Rozrzuca wybuchające karty',
    use(scene) {
      const c = p.bigJoker, pl = scene.player;
      for (let i = 0; i < c.bombs; i++) {
        // The first one right on Bartek, the rest around him.
        const t = i === 0 ? { x: pl.x, y: pl.y } : at(pl.x, pl.y, Phaser.Math.FloatBetween(c.radius, c.spread), Phaser.Math.FloatBetween(0, Math.PI * 2));
        strikeCircle(scene, t.x, t.y, c.radius, c.warnMs, c.damage, () => playVfx(scene, 'splatPurple', t.x, t.y));
      }
    },
  },
  bigHomelander: {
    hint: 'Strzela laserami z oczu',
    use(scene, z) {
      const c = p.bigHomelander, pl = scene.player, aim = Phaser.Math.Angle.Between(z.x, z.y, pl.x, pl.y);
      for (let i = 0; i < c.beams; i++) {
        const a = aim + (i - (c.beams - 1) / 2) * Phaser.Math.DegToRad(c.spreadDeg);
        strikeLine(scene, z.x, z.y, a, c.length, c.width, c.warnMs, c.damage);
      }
    },
  },
};

// Every frame for each boss on the map: counts up to its power and uses it.
export function updateBossPower(scene, z, delta) {
  const pw = bossPowers[z.stats.id];
  if (!pw) return;
  z.powerMs += delta;
  if (z.powerMs < p[z.stats.id].everySec * 1000 || (pw.ready && !pw.ready(scene, z))) return;
  z.powerMs = 0;
  pw.use(scene, z);
}
