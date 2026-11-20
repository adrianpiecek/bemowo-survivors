import { config } from '../config.js';
import { playSfx } from '../systems/audio.js';
import { playVfx } from '../systems/vfx.js';
import { save } from '../state.js';

// Weapons. run.weapons holds the ones Bartek carries as { def, level } plus whatever state the weapon keeps there.
// A new weapon and each next level come as level-up cards (systems/cards.js); Bartek carries up to config.weapons.maxSlots.
//   levels       config list: what each level after the first adds (maxLevel = levels.length + 1)
//   description  (level, mult): card text for reaching that level; level 1 is the "NOWA BROŃ" card
//   create(scene, w)          once, when Bartek gets the weapon
//   levelUp(scene, w, mult)   on each level card, with the card's rarity multiplier; w.level is already the new level
//   update(scene, w, delta)   every frame while GameScene runs
//   unlock       null: can always drop; else { text, check(run, won) }: checked at the end of a run, kept in save.unlocks
//   icon         texture key for the HUD (drawn in BootScene)
// Damage goes through scene.weaponDamage(base) and cooldowns through scene.weaponCooldown(ms),
// so the damage and fire rate cards, the gym and timed pickups work on every weapon.
const p = config.weapons.pistol, sh = config.weapons.shield;
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
      for (let i = 0; i < w.bullets; i++) {
        const b = scene.bullets.get(tx, ty);
        if (!b) break;
        b.enableBody(true, tx, ty, true, true);
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
      w.shields = [];
      addShields(scene, w, sh.shields);
    },
    levelUp(scene, w, m) {
      const b = sh.levels[w.level - 2];
      w.bounces += count(b.bounces ?? 0, m);
      w.damage += (b.damage ?? 0) * m;
      addShields(scene, w, count(b.shields ?? 0, m));
    },
    update(scene, w, delta) {
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
    s.setPosition(pl.x, pl.y).setVisible(true);
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
