import { config } from '../config.js';
import { newRun, xpToNextLevel } from '../state.js';
import { pickups } from '../data/pickups.js';
import { enemies } from '../data/enemies.js';
import { weapons } from '../data/weapons.js';
import { updateEffects, isEffectActive } from '../systems/effects.js';
import { createOrbit, updateOrbit } from '../systems/orbit.js';
import { updateLeaper } from '../systems/charge.js';
import { createVfxPool, playVfx } from '../systems/vfx.js';
import { playSfx, playMusic } from '../systems/audio.js';
import { bartkowanie, doBartkowanie } from '../data/bartkowanie.js';

export default class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    this.run = newRun();
    playMusic(this, 'gameplay');
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
    this.physics.add.collider(this.enemies, this.enemies, null, (a, b) => this.isWalker(a) && this.isWalker(b));
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
    this.addWeapon(weapons.find((d) => d.id === config.weapons.start));
    this.physics.add.overlap(this.player, this.gems, this.collectGem, null, this);

    this.pickups = this.physics.add.group({ defaultKey: 'pickup', maxSize: config.pools.pickups });
    // Looped effects around Bartek while a pickup's effect lasts (bubble, pre-workout).
    this.auras = pickups.filter((d) => d.aura).map((d) => {
      const cfg = config.textures.auras[d.aura];
      return { effect: d.effect, cfg, image: this.add.image(0, 0, `aura_${d.aura}`).setDepth(cfg.front ? 2 : 0.5).setVisible(false) };
    });
    this.physics.add.overlap(this.player, this.pickups, this.collectPickup, null, this);
    if (config.debug.pickupKey) {
      // Each press drops the next pickup in data order, so every one is easy to reach.
      let next = 0;
      this.input.keyboard.on('keydown-P', () => {
        this.dropPickup(pickups[next++ % pickups.length], this.player.x + config.pickups.debugOffset, this.player.y);
      });
    }

    this.input.keyboard.addCapture('SPACE');
    this.input.keyboard.on('keydown-SPACE', () => this.activateTank());
    if (config.debug.klapaKey) this.input.keyboard.on('keydown-K', () => this.spawnEnemy(enemies.find((d) => d.id === 'klapa')));
    this.boss = null; // the newest boss on the map; UIScene reads it for the HP bar
    this.bossQueue = enemies.filter((d) => d.isBoss).sort((a, b) => a.appearsAtSec - b.appearsAtSec);
    if (config.debug.bossKey) {
      // B arms it, then 1-5 calls that boss (in order of appearance): banner first, the boss bannerSec later.
      this.input.keyboard.on('keydown-B', () => { this.bossArmed = true; });
      ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE'].forEach((key, i) => this.input.keyboard.on(`keydown-${key}`, () => {
        const def = this.bossQueue[i];
        if (!this.bossArmed || !def) return;
        this.bossArmed = false;
        this.announceBoss(def);
        this.time.delayedCall(config.boss.bannerSec * 1000, () => this.spawnBoss(def));
      }));
    }
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
    if (config.debug.gemKey) {
      this.input.keyboard.on('keydown-G', () => {
        const { x, y } = this.player;
        for (let i = 0; i < 250; i++) {
          const a = Phaser.Math.FloatBetween(0, Math.PI * 2), r = Phaser.Math.FloatBetween(150, 600);
          this.dropGem(x + Math.cos(a) * r, y + Math.sin(a) * r, 'green');
        }
        Object.keys(config.coins.kinds).forEach((kind, i) => this.dropCoin(x + 60 + i * 30, y, kind));
      });
    }
    if (config.debug.enemyKey) {
      this.input.keyboard.on('keydown-Y', () => {
        const { x, y } = this.player, goblin = enemies.find((d) => d.id === 'goblin');
        this.spawnPack(goblin, x + 350, y);
        this.spawnEnemy(enemies.find((d) => d.id === 'sportakus'), x - 350, y);
      });
    }
    if (config.debug.tankKey) this.input.keyboard.on('keydown-T', () => { this.run.tankCharge = config.tank.killsToCharge; });
    if (config.debug.timeSkipKey) {
      this.input.keyboard.on('keydown-J', () => {
        this.run.elapsedMs += 60000;
        this.run.wave = Math.floor(this.run.elapsedMs / (config.wave.everySec * 1000)); // no burst of the skipped waves
      });
    }

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
    if (this.time.now < this.run.invulnUntilMs || isEffectActive(this.run, 'bubble')) return;
    if (this.isWalker(enemy) && isEffectActive(this.run, 'freeze')) return; // frozen walkers do not bite
    const pl = this.run.player;
    pl.hp = Math.max(0, pl.hp - enemy.stats.contactDamage);
    playSfx(this, 'playerDamage');
    if (enemy.stats.leavesScar) this.run.scarred = true;
    this.run.invulnUntilMs = this.time.now + config.player.invulnMs;
    if (pl.hp === 0) this.scene.start('GameOverScene', { run: this.run, won: false });
  }

  onBulletHit(bullet, enemy) {
    if (!bullet.active || !enemy.active) return; // several overlaps can fire in one step
    bullet.disableBody(true, true);
    playSfx(this, 'shotHit');
    this.hurtEnemy(enemy, bullet.damage, bullet.x, bullet.y);
  }

  // Shared by bullets and orbits: damage, a spark where it hit, death at 0 HP.
  hurtEnemy(enemy, damage, x, y) {
    playVfx(this, 'hitSpark', x, y);
    this.run.damageDealt += Math.min(damage, enemy.hp);
    enemy.hp -= damage;
    if (enemy.hp <= 0) this.killEnemy(enemy);
  }

  killEnemy(enemy) {
    enemy.disableBody(true, true);
    this.run.kills++;
    if (this.run.tankMs <= 0) this.run.tankCharge = Math.min(this.run.tankCharge + 1, config.tank.killsToCharge);
    this.dropGem(enemy.x, enemy.y, enemy.stats.gem);
    if (Math.random() < config.coins.dropChance) this.dropCoin(enemy.x, enemy.y, this.pickCoinKind());
    playVfx(this, 'deathPoof', enemy.x, enemy.y);
    this.maybeDropPickup(enemy.x, enemy.y);
    if (enemy.stats.isBoss) this.bossKilled(enemy);
  }

  announceBoss(def) {
    this.scene.get('UIScene').showBanner(`UWAGA: ${def.name.toUpperCase()}`, '', config.boss.bannerSec * 1000);
    playSfx(this, 'boss');
    playMusic(this, 'boss');
  }

  spawnBoss(def) {
    this.boss = this.spawnEnemy(def) ?? this.boss;
  }

  bossKilled(boss) {
    const b = config.boss, r = b.gemSpread, def = boss.stats;
    boss.clearTint();
    this.run.bossProtein += def.protein;
    for (let i = 0; i < b.gemCount; i++) {
      this.dropGem(boss.x + Phaser.Math.FloatBetween(-r, r), boss.y + Phaser.Math.FloatBetween(-r, r), b.gemKind);
    }
    const chest = this.dropPickup(pickups.find((d) => d.id === 'chest'), boss.x, boss.y, Infinity); // stays until taken
    if (chest) chest.count = def.chest;
    playVfx(this, 'bossBoom', boss.x, boss.y);
    this.scene.get('UIScene').showBanner(`${def.name} pokonany`);
    // A boss not killed before the next one's minute may still be on the map.
    this.boss = this.enemies.getChildren().find((z) => z.active && z.stats.isBoss) ?? null;
    if (!this.boss) playMusic(this, 'gameplay');
  }

  // A boss chest opens in update(), so never in the middle of a physics step that also opened the level-up cards.
  openChest(count) { this.run.chestQueue.push(count); }

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

  dropPickup(def, x, y, lifetimeSec = config.pickups.lifetimeSec) {
    const p = this.pickups.get(x, y);
    if (!p) return; // pool full: rare drops at a 10-slot cap, losing one is harmless
    p.setTexture(def.icon ?? 'pickup');
    p.body.setSize(); // pooled sprites change icon, so fit the body to this one
    p.enableBody(true, x, y, true, true);
    p.def = def;
    p.ageMs = 0;
    p.lifetimeMs = lifetimeSec * 1000;
    p.count = 1; // upgrades inside, only a chest uses it
    this.run.pickupDropMs[def.id] = this.run.elapsedMs;
    return p;
  }

  collectPickup(player, p) {
    if (!p.active) return;
    p.disableBody(true, true);
    playSfx(this, 'pickup');
    playVfx(this, 'starBurst', this.player.x, this.player.y);
    if (p.def.vfx) playVfx(this, p.def.vfx, this.player.x, this.player.y);
    if (p.def.bannerText) this.scene.get('UIScene').showBanner(p.def.bannerText, p.def.bannerSubtext);
    p.def.apply(this, p);
  }

  // Magnet pickup and Bartkowanie "Sprzątanie Bemowa": every gem on the map flies to Bartek.
  magnetAllGems() {
    for (const gem of this.gems.getChildren()) if (gem.active) gem.magnet = true;
  }

  dropGem(x, y, kind) { this.dropCollectible(x, y, `gem_${kind}`, config.xp.gems[kind].value, false); }

  dropCoin(x, y, kind) { this.dropCollectible(x, y, `coin_${kind}`, config.coins.kinds[kind].protein, true); }

  pickCoinKind() {
    const kinds = Object.entries(config.coins.kinds);
    let roll = Math.random() * kinds.reduce((sum, [, k]) => sum + k.weight, 0);
    return (kinds.find(([, k]) => (roll -= k.weight) < 0) ?? kinds[0])[0];
  }

  // Gems and coins share one pool, the magnet and the pickup; value is XP for a gem, protein for a coin.
  dropCollectible(x, y, anim, value, coin) {
    if (this.gems.countActive(true) >= config.xp.merge.above) this.mergeGems();
    const gem = this.gems.get(x, y);
    if (!gem) return; // full even after merging (only coins and flying gems left): this one drop is lost
    gem.enableBody(true, x, y, true, true);
    gem.value = value;
    gem.coin = coin;
    gem.dropMs = this.run.elapsedMs;
    gem.setScale(config.xp.gemScale).play(anim);
    gem.magnet = false;
  }

  // The oldest gems lying still merge into one worth their sum, where the oldest lay. Coins never merge.
  mergeGems() {
    const m = config.xp.merge;
    const old = this.gems.getChildren().filter((g) => g.active && !g.coin && !g.magnet)
      .sort((a, b) => a.dropMs - b.dropMs).slice(0, m.count);
    if (old.length < 2) return;
    const sum = old.reduce((s, g) => s + g.value, 0), { x, y } = old[0];
    for (const g of old) g.disableBody(true, true);
    const [kind] = Object.entries(config.xp.gems).filter(([, k]) => k.value <= sum).sort((a, b) => b[1].value - a[1].value)[0];
    this.dropCollectible(x, y, `gem_${kind}`, sum, false);
  }

  collectGem(player, gem) {
    if (!gem.active) return;
    gem.disableBody(true, true);
    playSfx(this, 'pick');
    if (gem.coin) {
      this.run.coinProtein += gem.value;
      playVfx(this, 'coinPickup', gem.x, gem.y);
      return;
    }
    playVfx(this, 'gemPickup', gem.x, gem.y);
    this.run.xp += gem.value;
    const wasPending = this.run.pendingLevelUps > 0;
    for (let need = xpToNextLevel(this.run.level); this.run.xp >= need; need = xpToNextLevel(this.run.level)) {
      this.run.xp -= need;
      this.run.level++;
      this.run.pendingLevelUps++;
    }
    if (!wasPending && this.run.pendingLevelUps > 0) {
      this.run.bubbleMs = config.ui.bubble.durationMs;
      playSfx(this, 'levelUp');
      playSfx(this, 'muchacho');
      this.updateBubble();
      this.scene.pause();
      this.scene.launch('LevelUpScene', { run: this.run });
    }
  }

  // Weapons (data/weapons.js): Bartek gets a new one, or one he carries goes up a level.
  addWeapon(def) {
    const w = { def, level: 1 };
    this.run.weapons.push(w);
    def.create(this, w);
  }

  levelUpWeapon(w, mult = 1) {
    w.level++;
    w.def.levelUp(this, w, mult);
  }

  // Every weapon's damage and cooldown go through these, so damage and fire rate cards, the gym and pickups reach all of them.
  weaponDamage(base) {
    const pl = this.run.player;
    return base * pl.damageMult * (this.run.elapsedMs >= pl.warmupMs ? pl.afterWarmupDamageMult : 1);
  }

  weaponCooldown(ms) { return ms * this.run.player.cooldownMult; }

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
  // With x, y (packs, debug): right there, using the pool's spare room. Returns the sprite or undefined.
  spawnEnemy(def = this.pickEnemyType(), x, y) {
    if (x === undefined) {
      if (!def.isBoss && this.enemies.countActive(true) >= config.spawn.maxEnemies) return;
      ({ x, y } = this.ringPoint());
    }
    const z = this.enemies.get(x, y);
    if (!z) return;
    // Pooled sprites can come back as any type, so set the look and body every spawn.
    const t = config.textures[def.texture];
    z.setTexture(def.texture).setAngle(0).clearTint();
    const fit = t.height ? t.height / z.height : 1; // drawn textures already have their config height, so 1
    z.setScale(fit * (def.scale ?? 1)); // a boss is its base type, bigger
    const br = (t.bodyRadius ?? t.radius) / fit; // body sizes are in texture px, before scale, so the body grows with it
    z.body.setCircle(br, z.width / 2 - br, z.height / 2 - br);
    z.enableBody(true, x, y, true, true);
    z.stats = def;
    z.charge = null; // a pooled sprite may have died mid-leap
    z.leapMs = 0;
    // Walkers get tougher as the run goes on, so late upgrades still meet resistance; the boss has its own HP.
    z.hp = def.isBoss ? def.hp : def.hp * (1 + config.spawn.hpPerMinutePct * this.run.elapsedMs / 60000);
    this.run.spawned++;
    if (def.behavior === 'line') {
      z.startX = x;
      z.startY = y;
      this.physics.moveToObject(z, this.player, def.speed); // aimed once, at where Bartek is now
    }
    return z;
  }

  // A random point on the spawn ring around Bartek.
  ringPoint() {
    const { ringMinRadius, ringMaxRadius } = config.spawn;
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2), r = Phaser.Math.FloatBetween(ringMinRadius, ringMaxRadius);
    return { x: this.player.x + Math.cos(angle) * r, y: this.player.y + Math.sin(angle) * r };
  }

  // Regular spawn: one enemy, or a whole pack for a pack type; the enemy cap holds for every member.
  spawnPick() {
    const def = this.pickEnemyType();
    if (!def.pack) return this.spawnEnemy(def);
    const { x, y } = this.ringPoint();
    this.spawnPack(def, x, y);
  }

  spawnPack(def, x, y) {
    const n = Phaser.Math.Between(def.packMin, def.packMax), s = def.packSpread;
    for (let i = 0; i < n && this.enemies.countActive(true) < config.spawn.maxEnemies; i++) {
      this.spawnEnemy(def, x + Phaser.Math.FloatBetween(-s, s), y + Phaser.Math.FloatBetween(-s, s));
    }
  }

  // Walking enemies: they push each other and freeze, squat and moonwalk. A leaper counts only between leaps.
  isWalker(z) {
    const b = z.stats.behavior;
    return b === 'chase' || (b === 'leap' && !z.charge);
  }

  update(time, delta) {
    const run = this.run, total = config.run.durationSec * 1000;
    run.elapsedMs += delta;
    if (run.elapsedMs >= total) {
      this.scene.start('GameOverScene', { run, won: true });
      return;
    }
    // update() runs after the physics step: a chest picked up in it waits until any level-up cards are picked.
    if (run.chestQueue.length && run.pendingLevelUps === 0) {
      this.scene.pause();
      this.scene.launch('ChestScene', { run, count: run.chestQueue.shift() });
      return;
    }

    const { startPerSec, endPerSec, curvePow } = config.spawn;
    run.spawnCooldownMs -= delta;
    if (run.spawnCooldownMs <= 0) {
      this.spawnPick();
      run.spawnCooldownMs += 1000 / Phaser.Math.Linear(startPerSec, endPerSec, (run.elapsedMs / total) ** curvePow);
    }

    // Bosses walk in at their minute; the banner and the boss music come bannerSec earlier.
    const nextBoss = this.bossQueue[run.nextBoss];
    if (nextBoss && !run.bossAnnounced && run.elapsedMs >= (nextBoss.appearsAtSec - config.boss.bannerSec) * 1000) {
      run.bossAnnounced = true;
      this.announceBoss(nextBoss);
    }
    if (nextBoss && run.elapsedMs >= nextBoss.appearsAtSec * 1000) {
      run.nextBoss++;
      run.bossAnnounced = false;
      this.spawnBoss(nextBoss);
    }

    // Now and then a timed pickup lies down by itself somewhere off screen, a few seconds' walk away.
    const ms = config.pickups.mapSpawn;
    run.mapPickupMs -= delta;
    if (run.mapPickupMs <= 0) {
      run.mapPickupMs += ms.everySec * 1000;
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2), r = Phaser.Math.FloatBetween(ms.minDist, ms.maxDist);
      this.dropPickup(Phaser.Utils.Array.GetRandom(pickups.filter((d) => d.onMap)),
        this.player.x + Math.cos(angle) * r, this.player.y + Math.sin(angle) * r, ms.lifetimeSec);
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
    const frozen = isEffectActive(run, 'freeze'), freezeTint = config.pickups.freeze.tint;
    const hopW = Math.PI * 2 * bk.squatHz, hopT = run.elapsedMs / 1000;
    for (const z of this.enemies.getChildren()) {
      if (!z.active) continue;
      const walker = this.isWalker(z);
      // Freeze: walkers stand still in blue; flying klapas and a Sportakus mid-leap are not affected.
      if (walker && (frozen || z.isTinted)) frozen ? z.setTint(freezeTint) : z.clearTint();
      if (walker && frozen) z.setVelocity(0, 0);
      else if (walker && squats) z.setVelocity(0, bk.squatAmp * hopW * Math.cos(hopW * hopT + z.x));
      else if (z.stats.behavior === 'leap' && !moonwalk) updateLeaper(this, z, delta);
      else if (walker) this.physics.moveToObject(z, this.player, z.stats.speed * (moonwalk ? -1 : 1));
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
      if (p.ageMs >= p.lifetimeMs) p.disableBody(true, true);
      else p.setAlpha(Math.floor(p.ageMs / pk.blinkMs) % 2 ? pk.blinkAlpha : 1);
    }

    for (const { effect, cfg, image } of this.auras) {
      image.setVisible(isEffectActive(run, effect));
      if (!image.visible) continue;
      const pulse = 1 + (cfg.pulseScale - 1) * (0.5 + 0.5 * Math.sin((run.elapsedMs / cfg.pulseMs) * Math.PI * 2));
      image.setPosition(this.player.x, this.player.y).setScale(pulse * pl.scale)
        .setAngle(image.angle + (cfg.spinDegPerSec * delta) / 1000);
    }

    // Bees: a small B gets a denser swarm on a tighter orbit, so it fits his size.
    const bz = config.bees, small = isEffectActive(run, 'smallB');
    updateOrbit(this.bees, this.player.x, this.player.y, {
      count: pl.bees * (small ? bz.smallMult : 1), radius: small ? bz.smallRadius : bz.radius,
      degPerSec: bz.degPerSec, waveAmp: bz.waveAmp, waveHz: bz.waveHz,
    }, delta);

    for (const w of run.weapons) w.def.update(this, w, delta);

    // Past the spawn ring there is nothing left to hit.
    const maxDist = config.spawn.ringMaxRadius;
    for (const b of this.bullets.getChildren()) {
      if (b.active && Phaser.Math.Distance.Between(b.x, b.y, this.player.x, this.player.y) > maxDist) b.disableBody(true, true);
    }
  }
}
