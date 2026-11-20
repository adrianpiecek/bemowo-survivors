import { config } from '../config.js';
import { newRun, xpToNextLevel } from '../state.js';
import { pickups } from '../data/pickups.js';
import { enemies } from '../data/enemies.js';
import { updateEffects, isEffectActive } from '../systems/effects.js';
import { createOrbit, updateOrbit } from '../systems/orbit.js';
import { startGolf, updateGolf } from '../systems/golf.js';
import { createVfxPool, playVfx } from '../systems/vfx.js';
import { playSfx } from '../systems/audio.js';
import { bartkowanie, doBartkowanie } from '../data/bartkowanie.js';

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
    this.tankScale = config.textures.tank.height / this.textures.getFrame('tank').height;
    this.player.setScale(this.baseScale).setDepth(1);
    cam.startFollow(this.player);

    this.keys = this.input.keyboard.addKeys('W,A,S,D,UP,LEFT,DOWN,RIGHT');
    this.moveDir = new Phaser.Math.Vector2();

    this.enemies = this.physics.add.group({
      defaultKey: 'zombie',
      maxSize: config.pools.enemies,
    });
    // Only walkers push each other; a flying klapa keeps its line.
    this.physics.add.collider(this.enemies, this.enemies, null, (a, b) => a.stats.behavior === 'chase' && b.stats.behavior === 'chase');
    this.physics.add.overlap(this.player, this.enemies, this.onEnemyTouch, null, this);

    this.bullets = this.physics.add.group({
      defaultKey: 'bullet',
      maxSize: config.pools.bullets,
      createCallback: (b) => b.setDepth(1).body.setCircle(config.textures.bullet.radius),
    });
    this.physics.add.overlap(this.bullets, this.enemies, this.onBulletHit, null, this);

    const bz = config.bees;
    this.bees = createOrbit(this, { texture: 'bee', maxSize: config.pools.bees, damage: bz.damage, hitCooldownMs: bz.hitCooldownMs });

    this.gems = this.physics.add.group({ defaultKey: 'gem_green', maxSize: config.pools.gems });
    this.vfx = createVfxPool(this);
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
    if (config.debug.klapaKey) this.input.keyboard.on('keydown-K', () => this.spawnEnemy(enemies.find((d) => d.id === 'klapa')));
    if (config.debug.bossKey) {
      this.input.keyboard.on('keydown-B', () => {
        this.run.bossAtMs = Math.min(this.run.bossAtMs, this.run.elapsedMs + config.boss.bannerSec * 1000);
      });
    }
    this.boss = null; // the Golf's sprite once it spawns; UIScene reads it for the HP bar
    if (config.debug.bartkowanieKey) {
      // N arms it, then 1-8 picks the effect.
      const digits = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT'];
      this.input.keyboard.on('keydown-N', () => { this.bartkowanieArmed = true; });
      digits.forEach((key, i) => this.input.keyboard.on(`keydown-${key}`, () => {
        if (!this.bartkowanieArmed) return;
        this.bartkowanieArmed = false;
        doBartkowanie(this, bartkowanie[i]);
      }));
    }
    if (config.debug.tankKey) this.input.keyboard.on('keydown-T', () => { this.run.tankCharge = config.tank.killsToCharge; });

    this.scene.launch('UIScene', { run: this.run });
    // scene.start('GameOverScene') only stops this scene, so take the HUD down with it.
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scene.stop('UIScene'));

    const b = config.ui.bubble;
    this.bubble = this.add.text(0, 0, 'Muchacho!', {
      fontSize: `${b.fontSize}px`, color: '#000000', backgroundColor: '#ffffff', padding: { x: b.padding, y: b.padding },
    }).setOrigin(0.5, 1).setDepth(2).setVisible(false);

    const sc = config.scar;
    this.scar = this.add.rectangle(0, 0, sc.width, sc.height, sc.color).setAngle(sc.angle).setDepth(1).setVisible(false);

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
    if (enemy.stats.leavesScar) this.run.scarred = true;
    this.run.invulnUntilMs = this.time.now + config.player.invulnMs;
    if (pl.hp === 0) this.scene.start('GameOverScene', { run: this.run, won: false });
  }

  onBulletHit(bullet, enemy) {
    if (!bullet.active || !enemy.active) return; // several overlaps can fire in one step
    bullet.disableBody(true, true);
    this.hurtEnemy(enemy, bullet.damage, bullet.x, bullet.y);
  }

  // Shared by bullets and orbits: damage, a spark where it hit, death at 0 HP.
  hurtEnemy(enemy, damage, x, y) {
    playVfx(this, 'hitSpark', x, y);
    enemy.hp -= damage;
    if (enemy.hp <= 0) this.killEnemy(enemy);
  }

  killEnemy(enemy) {
    enemy.disableBody(true, true);
    this.run.kills++;
    if (this.run.tankMs <= 0) this.run.tankCharge = Math.min(this.run.tankCharge + 1, config.tank.killsToCharge);
    this.dropGem(enemy.x, enemy.y, enemy.stats.gem);
    playVfx(this, 'deathPoof', enemy.x, enemy.y);
    this.maybeDropPickup(enemy.x, enemy.y);
    if (enemy.stats.isBoss) this.bossKilled(enemy);
  }

  bossKilled(boss) {
    const b = config.boss, r = b.gemSpread;
    boss.clearTint();
    this.run.bossKilled = true;
    for (let i = 0; i < b.gemCount; i++) {
      this.dropGem(boss.x + Phaser.Math.FloatBetween(-r, r), boss.y + Phaser.Math.FloatBetween(-r, r), b.gemKind);
    }
    playVfx(this, 'golfBoom', boss.x, boss.y);
    this.scene.get('UIScene').showBanner('Golf zezłomowany');
  }

  // Space or a tap on the HUD bar. Ignored while paused, already a tank, or not fully charged.
  activateTank() {
    const run = this.run, t = config.tank;
    if (!this.scene.isActive() || run.tankMs > 0 || run.tankCharge < t.killsToCharge) return;
    run.tankCharge = 0;
    run.tankMs = t.durationSec * 1000;
    const r = config.textures.tank.bodyRadius / this.tankScale; // body sizes are in texture px, before scale
    this.player.setTexture('tank').body.setCircle(r, this.player.width / 2 - r, this.player.height / 2 - r);
    run.bubbleMs = config.ui.bubble.durationMs;
    playSfx(this, 'tank');
    playSfx(this, 'muchacho');
    this.cameras.main.shake(t.shakeMs, t.shakeIntensity);
  }

  endTank() {
    this.player.setTexture('bartek').setFlipX(false).body.setSize(); // no args: body back to the frame size
    // A short grace period, so the horde around the tank does not bite on the very first frame.
    this.run.invulnUntilMs = this.time.now + config.player.invulnMs;
  }

  // Bartkowanie effect 5: three spins and nothing else.
  spinPlayer() {
    const b = config.bartkowanie;
    this.tweens.add({ targets: this.player, angle: 360 * b.spins, duration: b.spinMs, onComplete: () => this.player.setAngle(0) });
  }

  // Every enemy inside the camera view dies; the ones off screen live. A boss only loses a share of its max HP.
  killVisibleEnemies() {
    const view = this.cameras.main.worldView;
    for (const z of this.enemies.getChildren()) {
      if (!z.active || !view.contains(z.x, z.y)) continue;
      if (z.stats.isBoss) z.hp -= z.stats.hp * config.boss.olxDamagePct;
      if (!z.stats.isBoss || z.hp <= 0) this.killEnemy(z);
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

  dropGem(x, y, kind) {
    const gem = this.gems.get(x, y);
    if (!gem) return; // shortcut: pool full means the drop is lost, fine while gems stay well under the cap
    gem.enableBody(true, x, y, true, true);
    gem.value = config.xp.gems[kind].value;
    gem.setScale(config.xp.gemScale).play(`gem_${kind}`);
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
      playSfx(this, 'muchacho');
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

  // Random type by spawnWeight among the ones whose appearsAtSec has passed.
  pickEnemyType() {
    const open = enemies.filter((d) => !d.isBoss && this.run.elapsedMs >= d.appearsAtSec * 1000);
    let roll = Math.random() * open.reduce((sum, d) => sum + d.spawnWeight, 0);
    return open.find((d) => (roll -= d.spawnWeight) < 0) ?? open[open.length - 1];
  }

  // Without x, y: on the spawn ring, only under spawn.maxEnemies (the boss too, so it always fits).
  // With x, y (the boss's klapas): right there, using the pool's spare room. Returns the sprite or undefined.
  spawnEnemy(def = this.pickEnemyType(), x, y) {
    if (x === undefined) {
      if (!def.isBoss && this.enemies.countActive(true) >= config.spawn.maxEnemies) return;
      const { ringMinRadius, ringMaxRadius } = config.spawn;
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const r = Phaser.Math.FloatBetween(ringMinRadius, ringMaxRadius);
      x = this.player.x + Math.cos(angle) * r;
      y = this.player.y + Math.sin(angle) * r;
    }
    const z = this.enemies.get(x, y);
    if (!z) return;
    // Pooled sprites can come back as any type, so set the look and body every spawn.
    const t = config.textures[def.texture];
    z.setTexture(def.texture).setAngle(0).clearTint();
    z.setScale(t.height ? t.height / z.height : 1); // drawn textures already have their config height, so 1
    const br = (t.bodyRadius ?? t.radius) / z.scale; // body sizes are in texture px, before scale
    z.body.setCircle(br, z.width / 2 - br, z.height / 2 - br);
    z.enableBody(true, x, y, true, true);
    z.stats = def;
    z.hp = def.hp;
    if (def.behavior === 'line') {
      z.startX = x;
      z.startY = y;
      this.physics.moveToObject(z, this.player, def.speed); // aimed once, at where Bartek is now
    } else if (def.behavior === 'boss') {
      startGolf(z);
    }
    return z;
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

    // The Golf: banner first, then it drives in from the spawn ring, once per run.
    const b = config.boss;
    if (!run.bossAnnounced && run.elapsedMs >= run.bossAtMs - b.bannerSec * 1000) {
      run.bossAnnounced = true;
      this.scene.get('UIScene').showBanner('UWAGA: GOLF NA BEMOWIE', '', b.bannerSec * 1000);
      playSfx(this, 'boss');
    }
    if (!run.bossSpawned && run.elapsedMs >= run.bossAtMs) {
      run.bossSpawned = true;
      this.boss = this.spawnEnemy(enemies.find((d) => d.id === 'golf'));
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
      if (this.moveDir.x) this.player.setFlipX(this.moveDir.x > 0); // the image's barrel points left
      if (run.tankMs === 0) this.endTank();
    }

    const { blinkMs, blinkAlpha } = config.player;
    if (updateEffects(run, delta).length) run.flashMs = config.effects.endFlashMs;
    run.flashMs = Math.max(0, run.flashMs - delta);
    // The Arcade body follows the sprite's scale.
    const scale = (run.tankMs > 0 ? this.tankScale : this.baseScale) * pl.scale;
    if (this.player.scaleX !== scale) this.player.setScale(scale);

    const blinking = this.time.now < run.invulnUntilMs || run.flashMs > 0;
    this.player.setAlpha(blinking && Math.floor(this.time.now / blinkMs) % 2 ? blinkAlpha : 1);

    this.run.bubbleMs = Math.max(0, this.run.bubbleMs - delta);
    this.updateBubble();

    // A klapa leaves once it is as far past its start as the spawn ring is wide; it gives no kill.
    const lineRange = config.spawn.ringMaxRadius * 2;
    // Bartkowanie: during squats walkers stand and hop (vertical speed is the derivative of a sine, so no drift);
    // during the moonwalk they walk away from Bartek.
    const bk = config.bartkowanie, squats = isEffectActive(run, 'squats'), moonwalk = isEffectActive(run, 'moonwalk');
    const hopW = Math.PI * 2 * bk.squatHz, hopT = run.elapsedMs / 1000;
    for (const z of this.enemies.getChildren()) {
      if (!z.active) continue;
      if (z.stats.behavior === 'chase' && squats) z.setVelocity(0, bk.squatAmp * hopW * Math.cos(hopW * hopT + z.x));
      else if (z.stats.behavior === 'chase') this.physics.moveToObject(z, this.player, z.stats.speed * (moonwalk ? -1 : 1));
      else if (z.stats.behavior === 'boss') updateGolf(this, z, delta);
      else if (Phaser.Math.Distance.Between(z.x, z.y, z.startX, z.startY) > lineRange) z.disableBody(true, true);
      else z.angle += z.stats.spinDegPerSec * delta / 1000;
    }

    // The scar follows Bartek's head and his size; the tank hides it.
    const sc = config.scar;
    this.scar.setVisible(run.scarred && run.tankMs <= 0).setScale(pl.scale).setAlpha(this.player.alpha)
      .setPosition(this.player.x + sc.offsetX * pl.scale, this.player.y + sc.offsetY * pl.scale);

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

    // Bees: a small B gets a denser swarm on a tighter orbit, so it fits his size.
    const bz = config.bees, small = isEffectActive(run, 'smallB');
    updateOrbit(this.bees, this.player.x, this.player.y, {
      count: pl.bees * (small ? bz.smallMult : 1), radius: small ? bz.smallRadius : bz.radius,
      degPerSec: bz.degPerSec, waveAmp: bz.waveAmp, waveHz: bz.waveHz,
    }, delta);

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
