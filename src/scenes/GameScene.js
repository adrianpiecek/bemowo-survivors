import { config } from '../config.js';

export default class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    const { width, height } = this.scale;
    const cam = this.cameras.main;

    // Screen-sized ground fixed to the camera; its tile offset follows the scroll, so the world has no edges.
    const ground = this.add.tileSprite(0, 0, width, height, 'ground').setOrigin(0).setScrollFactor(0);
    // followupdate fires after the camera computes this frame's scroll, so the ground never lags a frame.
    cam.on(Phaser.Cameras.Scene2D.Events.FOLLOW_UPDATE, (c) => ground.setTilePosition(c.scrollX, c.scrollY));

    this.player = this.physics.add.sprite(0, 0, 'bartek');
    this.player.setScale(config.textures.bartek.height / this.player.height);
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
  }

  spawnZombie() {
    if (this.enemies.countActive(true) >= config.spawn.maxEnemies) return;
    const { ringMinRadius, ringMaxRadius } = config.spawn;
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const r = Phaser.Math.FloatBetween(ringMinRadius, ringMaxRadius);
    const x = this.player.x + Math.cos(angle) * r;
    const y = this.player.y + Math.sin(angle) * r;
    this.enemies.get(x, y)?.enableBody(true, x, y, true, true);
  }

  update() {
    const k = this.keys;
    const x = (k.D.isDown || k.RIGHT.isDown) - (k.A.isDown || k.LEFT.isDown);
    const y = (k.S.isDown || k.DOWN.isDown) - (k.W.isDown || k.UP.isDown);
    this.moveDir.set(x, y).normalize().scale(config.player.speed);
    this.player.setVelocity(this.moveDir.x, this.moveDir.y);

    for (const z of this.enemies.getChildren()) {
      if (z.active) this.physics.moveToObject(z, this.player, config.zombie.speed);
    }
  }
}
