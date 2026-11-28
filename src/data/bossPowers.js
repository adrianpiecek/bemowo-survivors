import { config } from '../config.js';
import { enemies } from './enemies.js';
import { strikeCircle, strikeLine, strikeRing } from '../systems/telegraph.js';
import { playVfx } from '../systems/vfx.js';
import { mapById } from './maps.js';

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

// Król Bemowa's moves (bossPowers.giant), numbers in config.boss.powers.giant. Each one asks Bartek to move somewhere:
// into a ring that already struck, out of the next stone, between the beams, away from where the king lands.
const giantMoves = {
  quake(scene, z, c) {
    const { x, y } = z;
    playVfx(scene, 'stompWave', x, y);
    for (let i = 0; i < c.rings; i++) {
      const inner = c.firstRadius + i * c.width;
      strikeRing(scene, x, y, inner, inner + c.width, c.warnMs + i * c.gapMs, c.damage);
    }
  },
  rain(scene, z, c) {
    for (let i = 0; i < c.stones; i++) {
      scene.time.delayedCall(i * c.gapMs, () => {
        if (!z.active) return;
        const pl = scene.player, t = i === 0 ? { x: pl.x, y: pl.y } : at(pl.x, pl.y, Phaser.Math.FloatBetween(0, c.spread), Phaser.Math.FloatBetween(0, Math.PI * 2));
        strikeCircle(scene, t.x, t.y, c.radius, c.warnMs, c.damage, () => playVfx(scene, 'smokePuff', t.x, t.y));
      });
    }
  },
  cross(scene, z, c) {
    const aim = Phaser.Math.Angle.Between(z.x, z.y, scene.player.x, scene.player.y);
    [0, Math.PI / 4].forEach((turn, wave) => scene.time.delayedCall(wave * c.gapMs, () => {
      if (!z.active) return;
      for (let k = 0; k < 4; k++) strikeLine(scene, z.x, z.y, aim + turn + (k * Math.PI) / 2, c.length, c.width, c.warnMs, c.damage);
    }));
  },
  slam(scene, z, c) {
    const { x, y } = scene.player;
    strikeCircle(scene, x, y, c.radius, c.warnMs, c.damage, () => {
      if (!z.active) return;
      z.setPosition(x, y);
      playVfx(scene, 'stompWave', x, y);
    });
  },
};
bossPowers.giant = {
  hint: 'Fale wstrząsów, deszcz kostki brukowej, krzyż laserów i skok na Bartka',
  use(scene, z) {
    const c = p.giant, move = c.order[z.powerStep++ % c.order.length];
    giantMoves[move](scene, z, c[move]);
  },
};

// The hint for this map: the map's own (Fort Bema's gnomes) or the power's.
export const bossHint = (id, mapId) => mapById(mapId).hints?.[id] ?? bossPowers[id]?.hint ?? '';

// Every frame for each boss on the map: counts up to its power and uses it.
export function updateBossPower(scene, z, delta) {
  const pw = bossPowers[z.stats.id];
  if (!pw) return;
  z.powerMs += delta;
  if (z.powerMs < p[z.stats.id].everySec * 1000 || (pw.ready && !pw.ready(scene, z))) return;
  z.powerMs = 0;
  pw.use(scene, z);
}
