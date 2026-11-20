import { config } from '../config.js';
import { playSfx } from '../systems/audio.js';

// Weapons. run.weapons holds the ones Bartek carries as { def, level } plus whatever state the weapon keeps there.
// A new weapon and each next level come as level-up cards (systems/cards.js); Bartek carries up to config.weapons.maxSlots.
//   levels       config list: what each level after the first adds (maxLevel = levels.length + 1)
//   description  (level, mult): card text for reaching that level; level 1 is the "NOWA BROŃ" card
//   create(scene, w)          once, when Bartek gets the weapon
//   levelUp(scene, w, mult)   on each level card, with the card's rarity multiplier; w.level is already the new level
//   update(scene, w, delta)   every frame while GameScene runs
//   unlock       null: can always drop; else { text, check(run) }: checked at the end of a run, kept in save.unlocks
//   icon         texture key for the HUD (drawn in BootScene)
// Damage goes through scene.weaponDamage(base) and cooldowns through scene.weaponCooldown(ms),
// so the damage and fire rate cards, the gym and timed pickups work on every weapon.
const p = config.weapons.pistol;
const count = (n, mult) => Math.ceil(n * mult);
const bulletsWord = (n) => (n > 1 ? 'pociski' : 'pocisk');

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
      w.flash = scene.add.sprite(0, 0, 'muzzle').setScale(p.muzzle.scale).setDepth(1.5).setVisible(false);
      w.flash.on(Phaser.Animations.Events.ANIMATION_COMPLETE, () => w.flash.setVisible(false));
      w.shells = scene.add.group({ classType: Phaser.GameObjects.Sprite, defaultKey: 'muzzle', maxSize: config.pools.shells });
    },
    levelUp(scene, w, m) { w.bullets += count(p.levels[w.level - 2].bullets, m); },
    update(scene, w, delta) {
      const pl = scene.player;
      if (w.flash.visible) w.flash.setPosition(pl.x + Math.cos(w.aim) * p.muzzle.distance, pl.y + Math.sin(w.aim) * p.muzzle.distance);
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
      for (let i = 0; i < w.bullets; i++) {
        const b = scene.bullets.get(pl.x, pl.y);
        if (!b) break;
        b.enableBody(true, pl.x, pl.y, true, true);
        b.damage = scene.weaponDamage(p.bulletDamage);
        scene.physics.moveToObject(b, targets[i % targets.length].z, scene.run.player.bulletSpeed);
      }
      w.cooldownMs = scene.weaponCooldown(p.fireRateMs);
      // Flash at the muzzle, turned at the first target; a shell flies out on the gun's side.
      const t = targets[0].z;
      w.aim = Phaser.Math.Angle.Between(pl.x, pl.y, t.x, t.y);
      w.flash.setVisible(true).setRotation(w.aim)
        .setPosition(pl.x + Math.cos(w.aim) * p.muzzle.distance, pl.y + Math.sin(w.aim) * p.muzzle.distance).play('muzzle_shot');
      // Pool full: no shell this time, it is only decoration. Mirrored, never rotated, so it always falls down.
      const s = w.shells.get(pl.x + Math.cos(w.aim) * p.shell.distance, pl.y + p.shell.offsetY);
      if (s) {
        s.setActive(true).setVisible(true).setDepth(0.5).setScale(p.muzzle.scale).setFlipX(t.x < pl.x).play('muzzle_shell');
        s.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => s.setActive(false).setVisible(false));
      }
      playSfx(scene, 'muzzleShot');
    },
  },
];
