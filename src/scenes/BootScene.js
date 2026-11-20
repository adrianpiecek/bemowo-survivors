import { config } from '../config.js';
import { preloadVfx, createVfxAnims } from '../systems/vfx.js';
import { preloadAudio } from '../systems/audio.js';
import { save } from '../state.js';

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
    preloadAudio(this);
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
    g.generateTexture('pickup', pk.size, pk.size).clear();

    // Timed pickup icons. Shapes are proportions of the icon size.
    const ic = t.pickupIcons, s = ic.size, c = s / 2;
    g.lineStyle(s * 0.22, ic.magnet).beginPath().arc(c, c * 0.9, s * 0.3, 0, Math.PI).strokePath(); // magnet: red U
    g.fillStyle(ic.magnet).fillRect(c - s * 0.41, s * 0.12, s * 0.22, s * 0.33).fillRect(c + s * 0.19, s * 0.12, s * 0.22, s * 0.33);
    g.fillStyle(ic.magnetTip).fillRect(c - s * 0.41, s * 0.05, s * 0.22, s * 0.12).fillRect(c + s * 0.19, s * 0.05, s * 0.22, s * 0.12);
    g.generateTexture('pickup_magnet', s, s).clear();
    g.fillStyle(ic.freeze).fillCircle(c, c, c); // freeze: ice ball with a snowflake
    g.lineStyle(2, ic.freezeLine);
    for (let i = 0; i < 3; i++) {
      const a = (i * Math.PI) / 3, dx = Math.cos(a) * c * 0.75, dy = Math.sin(a) * c * 0.75;
      g.lineBetween(c - dx, c - dy, c + dx, c + dy);
    }
    g.generateTexture('pickup_freeze', s, s).clear();
    g.fillStyle(ic.preworkout).fillRect(s * 0.25, s * 0.25, s * 0.5, s * 0.72); // pre-workout: a shaker
    g.fillStyle(ic.preworkoutCap).fillRect(s * 0.2, s * 0.05, s * 0.6, s * 0.22);
    g.generateTexture('pickup_preworkout', s, s).clear();
    g.fillStyle(ic.bubble, 0.35).fillCircle(c, c, c - 1); // bubble
    g.lineStyle(3, ic.bubble).strokeCircle(c, c, c - 2);
    g.fillStyle(0xffffff, 0.8).fillCircle(c * 0.65, c * 0.65, s * 0.08);
    g.generateTexture('pickup_bubble', s, s).clear();
    g.fillStyle(ic.pierogi).slice(c, s * 0.7, c * 0.95, Math.PI, 0, false).fillPath(); // pierogi: half moon, crimped edge
    g.lineStyle(2, ic.pierogiLine).beginPath().arc(c, s * 0.7, c * 0.95, Math.PI, 0, false).strokePath();
    g.generateTexture('pickup_pierogi', s, s);

    g.destroy();

    this.sound.mute = save.muted;
    this.scene.start('TitleScene');
  }
}
