import { config } from '../config.js';
import { playSfx } from '../systems/audio.js';
import { playVfx } from '../systems/vfx.js';
import { save } from '../state.js';
import { isEffectActive } from '../systems/effects.js';
import { createOrbit, updateOrbit } from '../systems/orbit.js';

// Weapons. run.weapons holds the ones Bartek carries as { def, level } plus whatever state the weapon keeps there.
// A new weapon and each next level come as level-up cards (systems/cards.js); Bartek carries up to config.weapons.maxSlots.
//   levels       config list: what each level after the first adds (maxLevel = levels.length + 1)
//   description  (level, mult): card text for reaching that level; level 1 is the "NOWA BROŃ" card
//   create(scene, w)          once, when Bartek gets the weapon
//   levelUp(scene, w, mult)   on each level card, with the card's rarity multiplier; w.level is already the new level
//   update(scene, w, delta)   every frame while GameScene runs
//   unlock       null: can always drop; else { text, check(run, won) }: checked at the end of a run, kept in save.unlocks
//   icon         texture key for the HUD (drawn in BootScene)
// Damage goes through scene.weaponDamage(base), cooldowns through scene.weaponCooldown(ms), sizes through
// scene.weaponArea(x), durations through scene.weaponDuration(ms) and counts through scene.weaponAmount(n),
// so the passives, the gym and timed pickups work on every weapon.
const p = config.weapons.pistol, sh = config.weapons.shield, gz = config.weapons.gas, lz = config.weapons.laser, bz = config.weapons.bees;
const count = (n, mult) => Math.ceil(n * mult);
// Polish plural: 1 odbicie, 2-4 odbicia (not 12-14), 5+ odbić.
const plural = (n, one, few, many) => (n === 1 ? one : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? few : many);
const bulletsWord = (n) => plural(n, 'pocisk', 'pociski', 'pocisków');

export const weapons = [
  {
    id: 'pistol',
    name: 'Pistolet',
    icon: 'weapon_pistol',
    levels: p.levels,
    maxLevel: p.levels.length + 1,
    unlock: null,
    description: (level, m) => (level === 1 ? 'Strzela sam w najbliższych wrogów.'
      : `+${count(p.levels[level - 2].bullets, m)} ${bulletsWord(count(p.levels[level - 2].bullets, m))} na strzał, w kolejne najbliższe zombie`),
    create(scene, w) {
      w.cooldownMs = 0;
      w.bullets = p.bulletsPerShot;
      w.aim = 0; // radians, toward the last target; the gun keeps pointing there
      w.gun = scene.add.image(0, 0, 'gun_pistol').setOrigin(...config.textures.gun.grip).setDepth(1.5);
    },
    levelUp(scene, w, m) { w.bullets += count(p.levels[w.level - 2].bullets, m); },
    update(scene, w, delta) {
      const pl = scene.player;
      placeGun(w, pl);
      w.cooldownMs = Math.max(0, w.cooldownMs - delta);
      if (w.cooldownMs > 0) return;
      // Nearest enemies in range; extra bullets go to the next nearest ones.
      const range = scene.run.player.range, targets = [];
      for (const z of scene.enemies.getChildren()) {
        if (!z.active) continue;
        const dSq = Phaser.Math.Distance.Squared(pl.x, pl.y, z.x, z.y);
        if (dSq <= range * range) targets.push({ z, dSq });
      }
      if (!targets.length) return; // nothing in range: ready again on the next frame
      targets.sort((a, b) => a.dSq - b.dSq);
      // Turn the gun at the first target; bullets and the flash leave its barrel tip, a shell flies up and back.
      const t = targets[0].z;
      w.aim = Phaser.Math.Angle.Between(pl.x, pl.y, t.x, t.y);
      const { x, y } = placeGun(w, pl), tip = config.textures.gun.width * (1 - config.textures.gun.grip[0]);
      const tx = x + Math.cos(w.aim) * tip, ty = y + Math.sin(w.aim) * tip;
      const bullets = scene.weaponAmount(w.bullets), area = scene.weaponArea(1);
      for (let i = 0; i < bullets; i++) {
        const b = scene.bullets.get(tx, ty);
        if (!b) break;
        b.enableBody(true, tx, ty, true, true);
        b.setScale(area); // the circle body scales with the sprite
        b.damage = scene.weaponDamage(p.bulletDamage);
        scene.physics.moveToObject(b, targets[i % targets.length].z, scene.run.player.bulletSpeed);
      }
      w.cooldownMs = scene.weaponCooldown(p.fireRateMs);
      playVfx(scene, 'muzzleFlash', tx, ty, Phaser.Math.RadToDeg(w.aim));
      playVfx(scene, 'shell', x, y, Math.cos(w.aim) < 0 ? 30 : -30);
      playSfx(scene, 'muzzleShot');
    },
  },
  {
    id: 'gas',
    name: 'Gaz rozweselający',
    icon: 'weapon_gas',
    levels: gz.levels,
    maxLevel: gz.levels.length + 1,
    unlock: {
      text: `„Dlaczego taki poważny?”: zabij ${gz.unlockJokers} Jokerów w jednej rundzie`,
      check: (run) => (run.killsByType.joker ?? 0) >= gz.unlockJokers,
    },
    description(level, m) {
      if (level === 1) return 'Chmura gazu spada na wrogów. Kto w środku, ten się śmieje i traci HP.';
      const b = gz.levels[level - 2], n = count(b.clouds ?? 0, m);
      return [b.damage && `+${Math.round(b.damage * m)} obrażeń`, n && `+${n} ${plural(n, 'chmura', 'chmury', 'chmur')}`,
        b.radius && `+${Math.round(b.radius * m)} px promienia chmury`, b.durationMs && `+${(b.durationMs * m / 1000).toFixed(1)} s działania`]
        .filter(Boolean).join(', ');
    },
    create(scene, w) {
      Object.assign(w, { damage: gz.damage, clouds: gz.clouds, radius: gz.radius, durationMs: gz.durationMs, cooldownMs: 0 });
      w.pool = scene.add.group({ classType: Phaser.GameObjects.Image, defaultKey: 'gas_cloud', maxSize: config.pools.gas });
    },
    levelUp(scene, w, m) {
      const b = gz.levels[w.level - 2];
      w.damage += (b.damage ?? 0) * m;
      w.clouds += count(b.clouds ?? 0, m);
      w.radius += (b.radius ?? 0) * m;
      w.durationMs += (b.durationMs ?? 0) * m;
    },
    update(scene, w, delta) {
      for (const c of w.pool.getChildren()) if (c.active) updateCloud(scene, w, c, delta);
      w.cooldownMs -= delta;
      if (w.cooldownMs > 0) return;
      const pl = scene.player, near = nearestEnemies(scene, pl.x, pl.y, gz.range).slice(0, gz.pick);
      if (!near.length) return; // nothing in range: ready again on the next frame
      Phaser.Utils.Array.Shuffle(near);
      const radius = scene.weaponArea(w.radius), durationMs = scene.weaponDuration(w.durationMs);
      for (let i = 0; i < scene.weaponAmount(w.clouds); i++) {
        const t = near[i % near.length], c = w.pool.get(t.x, t.y);
        if (!c) break; // pool full
        c.setActive(true).setVisible(true).setDepth(0.6).setPosition(t.x, t.y).setDisplaySize(radius * 2, radius * 2).setAlpha(1);
        Object.assign(c, { radius, totalMs: durationMs, remainingMs: durationMs, tickMs: 0, laughMs: gz.laughEveryMs * Math.random() });
      }
      w.cooldownMs = scene.weaponCooldown(gz.cooldownMs);
    },
  },
  {
    id: 'laser',
    name: 'Laser z oczu',
    icon: 'weapon_laser',
    levels: lz.levels,
    maxLevel: lz.levels.length + 1,
    unlock: {
      text: '„Wzrok, który zabija”: wygraj rundę, pokonując Wielkiego Homelandera',
      check: (run, won) => won && run.bossesKilled.includes(lz.unlockBoss),
    },
    description(level, m) {
      if (level === 1) return 'Promień z oczu Bartka przepala wszystkich wrogów na linii.';
      const b = lz.levels[level - 2], n = count(b.beams ?? 0, m);
      return [b.damage && `+${Math.round(b.damage * m)} obrażeń`, n && `+${n} ${plural(n, 'promień', 'promienie', 'promieni')}`,
        b.width && `+${Math.round(b.width * m)} px szerokości`, b.range && `+${Math.round(b.range * m)} px zasięgu`].filter(Boolean).join(', ');
    },
    create(scene, w) {
      Object.assign(w, { damage: lz.damage, beams: lz.beams, width: lz.width, range: lz.range, cooldownMs: 0, showMs: 0, angles: [] });
      w.g = scene.add.graphics().setDepth(1.55);
    },
    levelUp(scene, w, m) {
      const b = lz.levels[w.level - 2];
      w.damage += (b.damage ?? 0) * m;
      w.beams += count(b.beams ?? 0, m);
      w.width += (b.width ?? 0) * m;
      w.range += (b.range ?? 0) * m;
    },
    update(scene, w, delta) {
      const pl = scene.player, ex = pl.x, ey = pl.y + lz.eyeOffsetY * scene.run.player.scale, width = scene.weaponArea(w.width);
      drawBeams(w, ex, ey, scene.run.player.scale, width, delta);
      w.cooldownMs -= delta;
      if (w.cooldownMs > 0) return;
      const targets = nearestEnemies(scene, ex, ey, w.range).slice(0, scene.weaponAmount(w.beams));
      if (!targets.length) return;
      w.angles = targets.map((t) => Math.atan2(t.y - ey, t.x - ex));
      for (const a of w.angles) {
        const dx = Math.cos(a), dy = Math.sin(a);
        for (const z of scene.enemies.getChildren()) {
          if (!z.active) continue;
          // Distance along the beam and off it; the enemy's body counts, so a big one is hit at its edge.
          const px = z.x - ex, py = z.y - ey, along = px * dx + py * dy;
          if (along < 0 || along > w.range) continue;
          if (Math.abs(px * dy - py * dx) <= width / 2 + (z.body?.halfWidth ?? 0)) scene.hurtEnemy(z, scene.weaponDamage(w.damage), z.x, z.y, 'laserHit');
        }
      }
      w.showMs = lz.beamMs;
      w.cooldownMs = scene.weaponCooldown(lz.cooldownMs);
    },
  },
  {
    id: 'bees',
    name: 'Ul',
    icon: 'weapon_bees',
    levels: bz.levels,
    maxLevel: bz.levels.length + 1,
    unlock: null,
    description(level, m) {
      if (level === 1) return `Pszczoły są szczęśliwe.\n${bz.bees} pszczoły krążą wokół Bartka i żądlą wrogów.`;
      const b = bz.levels[level - 2];
      if (b.damage) return `+${Math.round(b.damage * m)} obrażeń pszczół`;
      return `+${b.bees} pszczoła${m > 1 ? `, +${Math.round(bz.damage * bz.damagePct * (m - 1))} obrażeń pszczół` : ''}`;
    },
    create(scene, w) {
      w.bees = bz.bees;
      w.damage = bz.damage;
      w.orbit = createOrbit(scene, {
        texture: 'bee', maxSize: config.pools.bees, damage: () => scene.weaponDamage(w.damage), hitCooldownMs: bz.hitCooldownMs,
        vfx: 'beeSting', hitScale: bz.hitScale, hitMs: bz.hitMs, faceTravel: true,
      });
    },
    // Bees never multiply with rarity (too many bees); a rarer bee card gives extra damage instead.
    levelUp(scene, w, m) {
      const b = bz.levels[w.level - 2];
      w.bees += b.bees ?? 0;
      w.damage += b.damage ? b.damage * m : (b.bees ? bz.damage * bz.damagePct * (m - 1) : 0);
    },
    // A small B gets a denser swarm on a tighter orbit, so it fits his size.
    update(scene, w, delta) {
      const small = isEffectActive(scene.run, 'smallB');
      updateOrbit(w.orbit, scene.player.x, scene.player.y, {
        count: scene.weaponAmount(w.bees) * (small ? bz.smallMult : 1), radius: scene.weaponArea(small ? bz.smallRadius : bz.radius),
        degPerSec: bz.degPerSec, waveAmp: bz.waveAmp, waveHz: bz.waveHz,
      }, delta);
    },
  },
  {
    id: 'shield',
    name: 'Tarcza Kapitana',
    icon: 'captain_shield',
    levels: sh.levels,
    maxLevel: sh.levels.length + 1,
    // Unlocked last of all weapons: "I can do this all day".
    unlock: {
      text: `„Mogę tak cały dzień”: wygraj rundę, przyjmując co najmniej ${sh.unlockDamageTaken} obrażeń, gdy wszystkie inne bronie są już odblokowane`,
      check: (run, won) => won && run.damageTaken >= sh.unlockDamageTaken
        && weapons.every((d) => !d.unlock || d.id === 'shield' || save.unlocks.includes(d.id)),
    },
    description(level, m) {
      if (level === 1) return 'Leci do wroga, odbija się do kolejnych i wraca do Bartka.';
      const b = sh.levels[level - 2];
      const n = (x) => count(x, m);
      return [b.bounces && `+${n(b.bounces)} ${plural(n(b.bounces), 'odbicie', 'odbicia', 'odbić')}`, b.damage && `+${Math.round(b.damage * m)} obrażeń`,
        b.shields && `+${n(b.shields)} ${plural(n(b.shields), 'tarcza', 'tarcze', 'tarcz')}`].filter(Boolean).join(', ');
    },
    create(scene, w) {
      w.damage = sh.damage;
      w.bounces = sh.bounces;
      w.count = sh.shields; // before the amount stat; the sprites are made in update
      w.shields = [];
    },
    levelUp(scene, w, m) {
      const b = sh.levels[w.level - 2];
      w.bounces += count(b.bounces ?? 0, m);
      w.damage += (b.damage ?? 0) * m;
      w.count += count(b.shields ?? 0, m);
    },
    update(scene, w, delta) {
      addShields(scene, w, scene.weaponAmount(w.count) - w.shields.length);
      for (const s of w.shields) updateShield(scene, w, s, delta);
    },
  },
];

// The pistol in front of Bartek, turned at w.aim; mirrored when aiming left so the grip stays down. Hidden in the tank.
function placeGun(w, pl) {
  const x = pl.x + Math.cos(w.aim) * p.gun.distance, y = pl.y + p.gun.offsetY + Math.sin(w.aim) * p.gun.distance;
  w.gun.setPosition(x, y).setRotation(w.aim).setFlipY(Math.cos(w.aim) < 0).setVisible(pl.texture.key !== 'tank');
  return { x, y };
}

// Active enemies within range of (x, y), nearest first.
function nearestEnemies(scene, x, y, range) {
  const found = [];
  for (const z of scene.enemies.getChildren()) {
    if (!z.active) continue;
    const dSq = Phaser.Math.Distance.Squared(x, y, z.x, z.y);
    if (dSq <= range * range) found.push({ z, dSq });
  }
  return found.sort((a, b) => a.dSq - b.dSq).map((f) => f.z);
}

// One gas cloud: turns slowly, hurts everyone inside every tickMs, laughs now and then, fades out at the end.
function updateCloud(scene, w, c, delta) {
  c.remainingMs -= delta;
  if (c.remainingMs <= 0) {
    c.setActive(false).setVisible(false);
    return;
  }
  c.angle += gz.spinDegPerSec * delta / 1000;
  c.setAlpha(Math.min(1, c.remainingMs / (c.totalMs * gz.fadeShare)));
  c.tickMs -= delta;
  if (c.tickMs <= 0) {
    c.tickMs += gz.tickMs;
    for (const z of scene.enemies.getChildren()) {
      if (z.active && Phaser.Math.Distance.Squared(c.x, c.y, z.x, z.y) <= c.radius * c.radius) {
        scene.hurtEnemy(z, scene.weaponDamage(w.damage), z.x, z.y, 'gasHit');
      }
    }
  }
  c.laughMs -= delta;
  if (c.laughMs <= 0) {
    c.laughMs += gz.laughEveryMs;
    playVfx(scene, 'gasLaugh', c.x + Phaser.Math.FloatBetween(-c.radius, c.radius) / 2, c.y - c.radius / 3);
  }
}

// Eye laser beams, redrawn every frame while they show: a wide soft glow, the red beam, a white-hot core, glowing eyes.
// They follow Bartek and fade over beamMs.
function drawBeams(w, ex, ey, scale, width, delta) {
  w.g.clear();
  if (w.showMs <= 0) return;
  w.showMs -= delta;
  const a = Phaser.Math.Clamp(w.showMs / lz.beamMs, 0, 1), gap = lz.eyeGap * scale;
  for (const ang of w.angles) {
    const x2 = ex + Math.cos(ang) * w.range, y2 = ey + Math.sin(ang) * w.range;
    w.g.lineStyle(width * 2, lz.glowColor, lz.glowAlpha * a).lineBetween(ex, ey, x2, y2);
    w.g.lineStyle(width, lz.color, a).lineBetween(ex, ey, x2, y2);
    w.g.lineStyle(width * 0.35, 0xffffff, a).lineBetween(ex, ey, x2, y2);
  }
  w.g.fillStyle(lz.color, a).fillCircle(ex - gap, ey, width * 0.5).fillCircle(ex + gap, ey, width * 0.5);
  w.g.fillStyle(0xffffff, a).fillCircle(ex - gap, ey, width * 0.2).fillCircle(ex + gap, ey, width * 0.2);
}

// Shield sprites are made only when Bartek gets one more and are reused for every throw.
function addShields(scene, w, n) {
  for (let i = 0; i < n; i++) {
    const s = scene.add.image(0, 0, 'captain_shield').setDisplaySize(sh.size, sh.size).setDepth(1.5).setVisible(false);
    s.phase = 'ready';
    s.cooldownMs = 0;
    s.target = null;
    s.hit = new Set(); // enemies already hit on this throw, so it never bounces back and forth between two
    w.shields.push(s);
  }
}

function nearestEnemy(scene, x, y, range, exclude) {
  let best = null, bestSq = range * range;
  for (const z of scene.enemies.getChildren()) {
    if (!z.active || exclude.has(z)) continue;
    const dSq = Phaser.Math.Distance.Squared(x, y, z.x, z.y);
    if (dSq < bestSq) { bestSq = dSq; best = z; }
  }
  return best;
}

// One shield: ready at Bartek -> 'out' (homes on its target, hits, bounces to the next nearest) -> 'back' to Bartek -> cooldown.
function updateShield(scene, w, s, delta) {
  const pl = scene.player;
  if (s.phase === 'ready') {
    s.cooldownMs -= delta;
    if (s.cooldownMs > 0) return;
    // Several shields go for different enemies when there are enough of them.
    const taken = new Set(w.shields.map((o) => o.target).filter(Boolean));
    const t = nearestEnemy(scene, pl.x, pl.y, sh.range, taken) ?? nearestEnemy(scene, pl.x, pl.y, sh.range, new Set());
    if (!t) return;
    s.hit.clear();
    s.target = t;
    s.hitsLeft = w.bounces + 1;
    s.phase = 'out';
    const size = scene.weaponArea(sh.size);
    s.setPosition(pl.x, pl.y).setDisplaySize(size, size).setVisible(true);
  }
  s.angle += sh.spinDegPerSec * delta / 1000;
  if (s.phase === 'out' && !s.target.active) { // killed by something else on the way
    s.target = nearestEnemy(scene, s.x, s.y, sh.bounceRange, s.hit);
    if (!s.target) s.phase = 'back';
  }
  const goal = s.phase === 'out' ? s.target : pl;
  const dx = goal.x - s.x, dy = goal.y - s.y, d = Math.hypot(dx, dy), step = sh.speed * delta / 1000;
  if (d > Math.max(step, sh.hitDist)) {
    s.x += (dx / d) * step;
    s.y += (dy / d) * step;
    return;
  }
  if (s.phase === 'back') {
    s.phase = 'ready';
    s.target = null;
    s.cooldownMs = scene.weaponCooldown(sh.cooldownMs);
    s.setVisible(false);
    return;
  }
  const t = s.target;
  s.hit.add(t);
  s.hitsLeft--;
  playVfx(scene, 'metalClang', s.x, s.y);
  scene.hurtEnemy(t, scene.weaponDamage(w.damage), s.x, s.y);
  s.target = s.hitsLeft > 0 ? nearestEnemy(scene, s.x, s.y, sh.bounceRange, s.hit) : null;
  if (!s.target) s.phase = 'back';
}
