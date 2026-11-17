import { config } from '../config.js';
import { newRun } from '../state.js';

export default class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    this.run = newRun();
    const { width, height } = this.scale;
    const cam = this.cameras.main;

    // Screen-sized ground fixed to the camera; its tile offset follows the scroll, so the world has no edges.
    const ground = this.add.tileSprite(0, 0, width, height, 'ground').setOrigin(0).setScrollFactor(0);
    // followupdate fires after the camera computes this frame's scroll, so the ground never lags a frame.
    cam.on(Phaser.Cameras.Scene2D.Events.FOLLOW_UPDATE, (c) => ground.setTilePosition(c.scrollX, c.scrollY));

    this.player = this.physics.add.sprite(0, 0, 'bartek');
    this.player.setScale(config.textures.bartek.height / this.player.height).setDepth(1);
    cam.startFollow(this.player);

    this.keys = this.input.keyboard.addKeys('W,A,S,D,UP,LEFT,DOWN,RIGHT');
    this.moveDir = new Phaser.Math.Vector2();

    this.enemies = this.physics.add.group({
      defaultKey: 'zombie',
      maxSize: config.pools.enemies,
      createCallback: (z) => {
        const { height, bodyRadius } = config.textures.zombie;
        z.setScale(height / z.height);
        const r = bodyRadius / z.scale; // body sizes are in texture px, before scale
        z.body.setCircle(r, z.width / 2 - r, z.height / 2 - r);
      },
    });
    this.physics.add.collider(this.enemies, this.enemies);
    this.time.addEvent({ delay: config.spawn.startIntervalMs, loop: true, callback: this.spawnZombie, callbackScope: this });
    this.physics.add.overlap(this.player, this.enemies, this.onEnemyTouch, null, this);

    this.bullets = this.physics.add.group({
      defaultKey: 'bullet',
      maxSize: config.pools.bullets,
      createCallback: (b) => b.setDepth(1).body.setCircle(config.textures.bullet.radius),
    });
    this.physics.add.overlap(this.bullets, this.enemies, this.onBulletHit, null, this);

    // shortcut: temporary HP readout, replace with the UIScene HUD in step 8.
    this.hpText = this.add.text(config.ui.margin, config.ui.margin, '', { fontSize: `${config.ui.hudFontSize}px` })
      .setScrollFactor(0).setDepth(2);
    this.updateHpText();
  }

  onEnemyTouch() {
    if (this.time.now < this.run.invulnUntilMs) return;
    this.run.hp = Math.max(0, this.run.hp - config.zombie.contactDamage);
    this.run.invulnUntilMs = this.time.now + config.player.invulnMs;
    this.updateHpText();
    if (this.run.hp === 0) this.scene.start('GameOverScene');
  }

  onBulletHit(bullet, enemy) {
    if (!bullet.active || !enemy.active) return; // several overlaps can fire in one step
    bullet.disableBody(true, true);
    enemy.hp -= bullet.damage;
    if (enemy.hp <= 0) {
      enemy.disableBody(true, true);
      this.run.kills++;
    }
  }

  // Shoots bulletsPerShot bullets at the nearest zombies in range. Returns false when nothing is in range.
  fire() {
    const s = this.run.stats, p = this.player;
    const rangeSq = s.range * s.range;
    const targets = [];
    for (const z of this.enemies.getChildren()) {
      if (!z.active) continue;
      const dSq = Phaser.Math.Distance.Squared(p.x, p.y, z.x, z.y);
      if (dSq <= rangeSq) targets.push({ z, dSq });
    }
    if (!targets.length) return false;
    targets.sort((a, b) => a.dSq - b.dSq);
    for (let i = 0; i < s.bulletsPerShot; i++) {
      const b = this.bullets.get(p.x, p.y);
      if (!b) break;
      b.enableBody(true, p.x, p.y, true, true);
      b.damage = s.bulletDamage;
      this.physics.moveToObject(b, targets[i % targets.length].z, s.bulletSpeed);
    }
    return true;
  }

  updateHpText() {
    this.hpText.setText(`HP: ${this.run.hp}`);
  }

  spawnZombie() {
    if (this.enemies.countActive(true) >= config.spawn.maxEnemies) return;
    const { ringMinRadius, ringMaxRadius } = config.spawn;
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const r = Phaser.Math.FloatBetween(ringMinRadius, ringMaxRadius);
    const x = this.player.x + Math.cos(angle) * r;
    const y = this.player.y + Math.sin(angle) * r;
    const z = this.enemies.get(x, y);
    if (!z) return;
    z.enableBody(true, x, y, true, true);
    z.hp = config.zombie.hp;
  }

  update(time, delta) {
    const k = this.keys;
    const x = (k.D.isDown || k.RIGHT.isDown) - (k.A.isDown || k.LEFT.isDown);
    const y = (k.S.isDown || k.DOWN.isDown) - (k.W.isDown || k.UP.isDown);
    this.moveDir.set(x, y).normalize().scale(config.player.speed);
    this.player.setVelocity(this.moveDir.x, this.moveDir.y);

    const { blinkMs, blinkAlpha } = config.player;
    const blinkOff = this.time.now < this.run.invulnUntilMs && Math.floor(this.time.now / blinkMs) % 2;
    this.player.setAlpha(blinkOff ? blinkAlpha : 1);

    for (const z of this.enemies.getChildren()) {
      if (z.active) this.physics.moveToObject(z, this.player, config.zombie.speed);
    }

    // Cooldown is capped at 0 so a shot fires as soon as a target comes into range.
    this.run.fireCooldownMs = Math.max(0, this.run.fireCooldownMs - delta);
    if (this.run.fireCooldownMs === 0 && this.fire()) this.run.fireCooldownMs = this.run.stats.fireRateMs;

    // Past the spawn ring there is nothing left to hit.
    const maxDist = config.spawn.ringMaxRadius;
    for (const b of this.bullets.getChildren()) {
      if (b.active && Phaser.Math.Distance.Between(b.x, b.y, this.player.x, this.player.y) > maxDist) b.disableBody(true, true);
    }
  }
}
