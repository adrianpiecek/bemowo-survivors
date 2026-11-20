import { config } from '../config.js';
import { preloadVfx, createVfxAnims } from '../systems/vfx.js';

export default class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  preload() {
    // Bartek and the Bartek variants that are the enemies.
    for (const key of ['bartek', 'zombie', 'uncanny', 'joker', 'homelander']) this.load.image(key, `./assets/${key}.png`);
    this.load.image('tank', './assets/czołg.png');
    // May be missing: the OLX card falls back to the first pigeon frame.
    this.load.image('golab', config.pickups.olx.photo);
    for (let i = 1; i <= config.textures.pigeon.frames; i++) this.load.image(`pigeon${i}`, `./assets/Pigeons/pigeon${i}.png`);
    const x = config.xp;
    for (const [kind, gem] of Object.entries(x.gems)) {
      this.load.spritesheet(`gem_${kind}`, gem.file, { frameWidth: x.gemFrameSize, frameHeight: x.gemFrameSize });
    }
    preloadVfx(this);
  }

  create() {
    const t = config.textures, x = config.xp;
    const pixel = (key) => this.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);

    for (const kind of Object.keys(x.gems)) {
      const key = `gem_${kind}`;
      pixel(key);
      this.anims.create({ key, frames: this.anims.generateFrameNumbers(key), frameRate: x.gemFps, repeat: -1 });
    }
    const pigeonFrames = [];
    for (let i = 1; i <= t.pigeon.frames; i++) {
      pixel(`pigeon${i}`);
      pigeonFrames.push({ key: `pigeon${i}` });
    }
    this.anims.create({ key: 'pigeonFly', frames: pigeonFrames, frameRate: t.pigeon.fps, repeat: -1, yoyo: true });
    createVfxAnims(this);

    const g = this.add.graphics();

    const b = t.bullet;
    g.fillStyle(b.color).fillCircle(b.radius, b.radius, b.radius);
    g.generateTexture('bullet', b.radius * 2, b.radius * 2).clear();

    const bee = t.bee, bd = bee.radius * 2;
    g.fillStyle(bee.color).fillCircle(bee.radius, bee.radius, bee.radius);
    g.fillStyle(bee.stripeColor).fillRect(bee.radius - bee.stripeWidth / 2, 0, bee.stripeWidth, bd);
    g.generateTexture('bee', bd, bd).clear();

    const gr = t.ground;
    g.fillStyle(gr.color).fillRect(0, 0, gr.size, gr.size);
    g.lineStyle(gr.lineWidth, gr.lineColor).strokeRect(0, 0, gr.size, gr.size);
    g.generateTexture('ground', gr.size, gr.size).clear();

    const kl = t.klapa;
    g.fillStyle(kl.color).fillRect(0, 0, kl.width, kl.height);
    g.lineStyle(kl.borderWidth, kl.borderColor).strokeRect(0, 0, kl.width, kl.height);
    g.generateTexture('klapa', kl.width, kl.height).clear();

    // Golf, closed and with the trunk open. Car body from x = lidLength, front on the right; fractions are only proportions.
    const gf = t.golf, gw = gf.carLength + gf.lidLength * 2, gh = gf.carWidth + gf.wheelWidth, x0 = gf.lidLength;
    for (const open of [false, true]) {
      g.fillStyle(gf.wheelColor);
      for (const wx of [x0 + gf.carLength * 0.12, x0 + gf.carLength * 0.7]) {
        g.fillRect(wx, 0, gf.wheelLength, gf.wheelWidth).fillRect(wx, gh - gf.wheelWidth, gf.wheelLength, gf.wheelWidth);
      }
      g.fillStyle(gf.color).fillRect(x0, gf.wheelWidth / 2, gf.carLength, gf.carWidth);
      g.fillStyle(gf.glassColor).fillRect(x0 + gf.carLength * 0.6, gf.wheelWidth, gf.carLength * 0.12, gf.carWidth - gf.wheelWidth);
      if (open) {
        g.fillStyle(gf.trunkColor).fillRect(x0, gf.wheelWidth, gf.lidLength, gf.carWidth - gf.wheelWidth);
        g.fillStyle(gf.lidColor).fillRect(0, gf.wheelWidth / 2, gf.lidLength, gf.carWidth); // lid swung out the back
      } else {
        g.fillStyle(gf.lidColor).fillRect(x0, gf.wheelWidth / 2, gf.lidLength, gf.carWidth);
      }
      g.generateTexture(open ? 'golfOpen' : 'golf', gw, gh).clear();
    }

    const pk = t.pickup;
    g.fillStyle(pk.color).fillRect(0, 0, pk.size, pk.size);
    g.lineStyle(pk.borderWidth, pk.borderColor).strokeRect(0, 0, pk.size, pk.size);
    g.generateTexture('pickup', pk.size, pk.size);

    g.destroy();

    this.scene.start('GameScene');
  }
}
