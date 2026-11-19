import { config } from '../config.js';
import { newRun, xpToNextLevel } from '../state.js';
import { pickups } from '../data/pickups.js';
import { updateEffects } from '../systems/effects.js';

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
    this.baseScale = config.textures.bartek.height / this.player.height;
    this.player.setScale(this.baseScale).setDepth(1);
    cam.startFollow(this.player);

    this.keys = this.input.keyboard.addKeys('W,A,S,D,UP,LEFT,DOWN,RIGHT');
    this.moveDir = new Phaser.Math.Vector2();

    this.enemies = this.physics.add.group({
      defaultKey: 'zombie',
      maxSize: config.pools.enemies,
    });
    this.physics.add.collider(this.enemies, this.enemies);
    this.physics.add.overlap(this.player, this.enemies, this.onEnemyTouch, null, this);

    this.bullets = this.physics.add.group({
      defaultKey: 'bullet',
      maxSize: config.pools.bullets,
      createCallback: (b) => b.setDepth(1).body.setCircle(config.textures.bullet.radius),
    });
    this.physics.add.overlap(this.bullets, this.enemies, this.onBulletHit, null, this);

    this.gems = this.physics.add.group({ defaultKey: 'gem', maxSize: config.pools.gems });
    this.physics.add.overlap(this.player, this.gems, this.collectGem, null, this);

    this.pickups = this.physics.add.group({ defaultKey: 'pickup', maxSize: config.pools.pickups });
    this.physics.add.overlap(this.player, this.pickups, this.collectPickup, null, this);
    if (config.debug.pickupKey) {
      this.input.keyboard.on('keydown-P', () => {
        this.dropPickup(Phaser.Utils.Array.GetRandom(pickups), this.player.x + config.pickups.debugOffset, this.player.y);
      });
    }

    this.input.keyboard.addCapture('SPACE');
    this.input.keyboard.on('keydown-SPACE', () => this.activateTank());
    if (config.debug.tankKey) this.input.keyboard.on('keydown-T', () => { this.run.tankCharge = config.tank.killsToCharge; });

    this.scene.launch('UIScene', { run: this.run });
    // scene.start('GameOverScene') only stops this scene, so take the HUD down with it.
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scene.stop('UIScene'));

    const b = config.ui.bubble;
    this.bubble = this.add.text(0, 0, 'Muchacho!', {
      fontSize: `${b.fontSize}px`, color: '#000000', backgroundColor: '#ffffff', padding: { x: b.padding, y: b.padding },
    }).setOrigin(0.5, 1).setDepth(2).setVisible(false);

    // Keys released while paused never reach this scene, so clear them or Bartek keeps walking.
    this.events.on(Phaser.Scenes.Events.RESUME, () => this.input.keyboard.resetKeys());
  }

  onEnemyTouch(player, enemy) {
    if (this.run.tankMs > 0) {
      if (!enemy.active) return;
      // A boss only takes damage over time; overlaps fire once per fixed physics step.
      if (enemy.stats.isBoss) enemy.hp -= config.tank.bossDamagePerSec / this.physics.world.fps;
      if (!enemy.stats.isBoss || enemy.hp <= 0) this.killEnemy(enemy);
      return;
    }
    if (this.time.now < this.run.invulnUntilMs) return;
    const pl = this.run.player;
    pl.hp = Math.max(0, pl.hp - enemy.stats.contactDamage);
    this.run.invulnUntilMs = this.time.now + config.player.invulnMs;
    if (pl.hp === 0) this.scene.start('GameOverScene', { run: this.run, won: false });
  }

  onBulletHit(bullet, enemy) {
    if (!bullet.active || !enemy.active) return; // several overlaps can fire in one step
    bullet.disableBody(true, true);
    enemy.hp -= bullet.damage;
    if (enemy.hp <= 0) this.killEnemy(enemy);
  }

  killEnemy(enemy) {
    enemy.disableBody(true, true);
    this.run.kills++;
    if (this.run.tankMs <= 0) this.run.tankCharge = Math.min(this.run.tankCharge + 1, config.tank.killsToCharge);
    this.dropGem(enemy.x, enemy.y);
    this.maybeDropPickup(enemy.x, enemy.y);
  }

  // Space or a tap on the HUD bar. Ignored while paused, already a tank, or not fully charged.
  activateTank() {
    const run = this.run, t = config.tank;
    if (!this.scene.isActive() || run.tankMs > 0 || run.tankCharge < t.killsToCharge) return;
    run.tankCharge = 0;
    run.tankMs = t.durationSec * 1000;
    const r = config.textures.tank.bodyRadius;
    this.player.setTexture('tank').body.setCircle(r, this.player.width / 2 - r, this.player.height / 2 - r);
    run.bubbleMs = config.ui.bubble.durationMs;
    this.cameras.main.shake(t.shakeMs, t.shakeIntensity);
  }

  endTank() {
    this.player.setTexture('bartek').setRotation(0).body.setSize(); // no args: body back to the frame size
    // A short grace period, so the horde around the tank does not bite on the very first frame.
    this.run.invulnUntilMs = this.time.now + config.player.invulnMs;
  }

  // Every enemy inside the camera view dies; the ones off screen live.
  killVisibleEnemies() {
    const view = this.cameras.main.worldView;
    for (const z of this.enemies.getChildren()) {
      if (z.active && view.contains(z.x, z.y)) this.killEnemy(z);
    }
  }

  // At most one pickup per kill; a pickup on cooldown is skipped.
  maybeDropPickup(x, y) {
    const run = this.run;
    for (const def of pickups) {
      const last = run.pickupDropMs[def.id];
      if (last !== undefined && run.elapsedMs - last < def.cooldownSec * 1000) continue;
      if (Math.random() < def.dropChance) {
        this.dropPickup(def, x, y);
        return;
      }
    }
  }

  dropPickup(def, x, y) {
    const p = this.pickups.get(x, y);
    if (!p) return; // pool full: rare drops at a 10-slot cap, losing one is harmless
    p.enableBody(true, x, y, true, true);
    p.def = def;
    p.ageMs = 0;
    this.run.pickupDropMs[def.id] = this.run.elapsedMs;
  }

  collectPickup(player, p) {
    if (!p.active) return;
    p.disableBody(true, true);
    this.scene.get('UIScene').showBanner(p.def.bannerText, p.def.bannerSubtext);
    p.def.apply(this);
  }

  dropGem(x, y) {
    const gem = this.gems.get(x, y);
    if (!gem) return; // shortcut: pool full means the drop is lost, fine while gems stay well under the cap
    gem.enableBody(true, x, y, true, true);
    gem.value = config.xp.gemValue;
    gem.magnet = false;
  }

  collectGem(player, gem) {
    if (!gem.active) return;
    gem.disableBody(true, true);
    this.run.xp += gem.value;
    const wasPending = this.run.pendingLevelUps > 0;
    for (let need = xpToNextLevel(this.run.level); this.run.xp >= need; need = xpToNextLevel(this.run.level)) {
      this.run.xp -= need;
      this.run.level++;
      this.run.pendingLevelUps++;
    }
    if (!wasPending && this.run.pendingLevelUps > 0) {
      this.run.bubbleMs = config.ui.bubble.durationMs;
      this.updateBubble();
      this.scene.pause();
      this.scene.launch('LevelUpScene', { run: this.run });
    }
  }

  // Shoots bulletsPerShot bullets at the nearest zombies in range. Returns false when nothing is in range.
  fire() {
    const s = this.run.player, p = this.player;
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
      b.damage = s.bulletDamage * (this.run.elapsedMs >= s.warmupMs ? s.afterWarmupDamageMult : 1);
      this.physics.moveToObject(b, targets[i % targets.length].z, s.bulletSpeed);
    }
    return true;
  }

  updateBubble() {
    this.bubble.setVisible(this.run.bubbleMs > 0).setPosition(this.player.x, this.player.y - config.ui.bubble.offsetY);
  }

  spawnEnemy() {
    if (this.enemies.countActive(true) >= config.spawn.maxEnemies) return;
    const { runner } = config;
    const type = this.run.elapsedMs >= runner.appearsAtSec * 1000 && Math.random() < runner.spawnChance ? 'runner' : 'zombie';
    const { ringMinRadius, ringMaxRadius } = config.spawn;
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const r = Phaser.Math.FloatBetween(ringMinRadius, ringMaxRadius);
    const x = this.player.x + Math.cos(angle) * r;
    const y = this.player.y + Math.sin(angle) * r;
    const z = this.enemies.get(x, y);
    if (!z) return;
    // Pooled sprites can come back as either type, so set the look and body every spawn.
    const t = config.textures[type];
    z.setTexture(type).setScale(type === 'zombie' ? t.height / z.height : 1);
    const br = (type === 'zombie' ? t.bodyRadius : t.radius) / z.scale; // body sizes are in texture px, before scale
    z.body.setCircle(br, z.width / 2 - br, z.height / 2 - br);
    z.enableBody(true, x, y, true, true);
    z.stats = config[type];
    z.hp = z.stats.hp;
  }

  update(time, delta) {
    const run = this.run, total = config.run.durationSec * 1000;
    run.elapsedMs += delta;
    if (run.elapsedMs >= total) {
      this.scene.start('GameOverScene', { run, won: true });
      return;
    }

    // Spawn interval shrinks linearly from start to min over the whole run.
    const { startIntervalMs, minIntervalMs } = config.spawn;
    run.spawnCooldownMs -= delta;
    if (run.spawnCooldownMs <= 0) {
      this.spawnEnemy();
      run.spawnCooldownMs += Phaser.Math.Linear(startIntervalMs, minIntervalMs, run.elapsedMs / total);
    }

    // Every wave.everySec a ring of enemies spawns at once; each wave is bigger. The enemy cap still applies.
    const w = config.wave;
    if (Math.floor(run.elapsedMs / (w.everySec * 1000)) > run.wave) {
      const count = w.baseCount + w.perWave * run.wave;
      run.wave++;
      for (let i = 0; i < count; i++) this.spawnEnemy();
    }

    const k = this.keys;
    const x = (k.D.isDown || k.RIGHT.isDown) - (k.A.isDown || k.LEFT.isDown);
    const y = (k.S.isDown || k.DOWN.isDown) - (k.W.isDown || k.UP.isDown);
    this.moveDir.set(x, y).normalize();
    if (!x && !y) this.moveDir.set(this.run.touchMove.x, this.run.touchMove.y); // analog: a small push walks slower
    const pl = this.run.player;
    this.moveDir.scale(pl.speed * (run.elapsedMs < pl.warmupMs ? pl.warmupSpeedMult : 1));
    this.player.setVelocity(this.moveDir.x, this.moveDir.y);

    if (run.tankMs > 0) {
      run.tankMs = Math.max(0, run.tankMs - delta);
      if (this.moveDir.lengthSq() > 0) this.player.setRotation(this.moveDir.angle());
      if (run.tankMs === 0) this.endTank();
    }

    const { blinkMs, blinkAlpha } = config.player;
    if (updateEffects(run, delta).length) run.flashMs = config.effects.endFlashMs;
    run.flashMs = Math.max(0, run.flashMs - delta);
    // The tank texture is drawn at on-screen size; the Arcade body follows the sprite's scale.
    const scale = (run.tankMs > 0 ? 1 : this.baseScale) * pl.scale;
    if (this.player.scaleX !== scale) this.player.setScale(scale);

    const blinking = this.time.now < run.invulnUntilMs || run.flashMs > 0;
    this.player.setAlpha(blinking && Math.floor(this.time.now / blinkMs) % 2 ? blinkAlpha : 1);

    this.run.bubbleMs = Math.max(0, this.run.bubbleMs - delta);
    this.updateBubble();

    for (const z of this.enemies.getChildren()) {
      if (z.active) this.physics.moveToObject(z, this.player, z.stats.speed);
    }

    // Once a gem is in magnet range it keeps flying to Bartek until picked up.
    const { magnetRadius } = this.run.player, { gemSpeed } = config.xp;
    for (const gem of this.gems.getChildren()) {
      if (!gem.active) continue;
      gem.magnet ||= Phaser.Math.Distance.Between(gem.x, gem.y, this.player.x, this.player.y) <= magnetRadius;
      if (gem.magnet) this.physics.moveToObject(gem, this.player, gemSpeed);
    }

    // Pickups lie still (no magnet), blink, and vanish after their lifetime.
    const pk = config.pickups;
    for (const p of this.pickups.getChildren()) {
      if (!p.active) continue;
      p.ageMs += delta;
      if (p.ageMs >= pk.lifetimeSec * 1000) p.disableBody(true, true);
      else p.setAlpha(Math.floor(p.ageMs / pk.blinkMs) % 2 ? pk.blinkAlpha : 1);
    }

    // Cooldown is capped at 0 so a shot fires as soon as a target comes into range.
    this.run.fireCooldownMs = Math.max(0, this.run.fireCooldownMs - delta);
    if (this.run.fireCooldownMs === 0 && this.fire()) this.run.fireCooldownMs = this.run.player.fireRateMs;

    // Past the spawn ring there is nothing left to hit.
    const maxDist = config.spawn.ringMaxRadius;
    for (const b of this.bullets.getChildren()) {
      if (b.active && Phaser.Math.Distance.Between(b.x, b.y, this.player.x, this.player.y) > maxDist) b.disableBody(true, true);
    }
  }
}
