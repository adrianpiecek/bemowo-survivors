import { config } from '../config.js';
import { preloadVfx, createVfxAnims } from '../systems/vfx.js';
import { preloadAudio } from '../systems/audio.js';
import { save } from '../state.js';

export default class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  preload() {
    // Bartek and the Bartek variants that are the enemies.
    for (const key of ['bartek', 'zombie', 'uncanny', 'joker', 'homelander']) this.load.image(key, `./assets/${key}.png`);
    for (const key of ['goblin', 'sportakus']) this.load.image(key, config.textures[key].file);
    this.load.image('tank', './assets/czołg.png');
    // May be missing: the OLX card falls back to the first pigeon frame.
    this.load.image('golab', config.pickups.olx.photo);
    for (let i = 1; i <= config.textures.pigeon.frames; i++) this.load.image(`pigeon${i}`, `./assets/Pigeons/pigeon${i}.png`);
    const x = config.xp;
    const sheet = { frameWidth: x.gemFrameSize, frameHeight: x.gemFrameSize };
    for (const [kind, gem] of Object.entries(x.gems)) this.load.spritesheet(`gem_${kind}`, gem.file, sheet);
    for (const [kind, coin] of Object.entries(config.coins.kinds)) this.load.spritesheet(`coin_${kind}`, coin.file, sheet);
    this.load.atlas('muzzle', config.textures.muzzle.image, config.textures.muzzle.atlas);
    preloadVfx(this);
    preloadAudio(this);
  }

  create() {
    const t = config.textures, x = config.xp;
    const pixel = (key) => this.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);

    const spin = (key, fps) => {
      pixel(key);
      this.anims.create({ key, frames: this.anims.generateFrameNumbers(key), frameRate: fps, repeat: -1 });
    };
    for (const kind of Object.keys(x.gems)) spin(`gem_${kind}`, x.gemFps);
    for (const kind of Object.keys(config.coins.kinds)) spin(`coin_${kind}`, config.coins.fps);
    const pigeonFrames = [];
    for (let i = 1; i <= t.pigeon.frames; i++) {
      pixel(`pigeon${i}`);
      pigeonFrames.push({ key: `pigeon${i}` });
    }
    this.anims.create({ key: 'pigeonFly', frames: pigeonFrames, frameRate: t.pigeon.fps, repeat: -1, yoyo: true });
    createVfxAnims(this);
    // Muzzle flash and shell: the atlas lists frames as "<anim>-<n>"; Phaser takes each frame's anchor as its pivot.
    pixel('muzzle');
    const muzzleFrames = this.textures.get('muzzle').getFrameNames();
    for (const anim of ['shot', 'shell']) {
      const names = muzzleFrames.filter((n) => new RegExp(`^${anim}-\\d+$`).test(n)).sort((a, b) => a.split('-').pop() - b.split('-').pop());
      const frames = names.map((frame) => this.textures.getFrame('muzzle', frame));
      // shortcut: plays at the average frame time (frames are 40-80 ms); per-frame timing if it ever looks off.
      this.anims.create({ key: `muzzle_${anim}`, frames: names.map((frame) => ({ key: 'muzzle', frame })),
        duration: frames.reduce((sum, f) => sum + f.customData.duration, 0) });
    }

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

    // Boss chest: a box, a darker lid, a gold band down the middle and a lock.
    const ch = t.chest;
    g.fillStyle(ch.color).fillRect(0, ch.lidHeight, ch.width, ch.height - ch.lidHeight);
    g.fillStyle(ch.lidColor).fillRect(0, 0, ch.width, ch.lidHeight);
    g.fillStyle(ch.bandColor).fillRect((ch.width - ch.bandWidth) / 2, 0, ch.bandWidth, ch.height);
    g.fillRect(0, ch.lidHeight - ch.bandWidth / 2, ch.width, ch.bandWidth);
    g.fillStyle(ch.lidColor).fillRect((ch.width - ch.lockSize) / 2, ch.lidHeight - ch.lockSize / 2, ch.lockSize, ch.lockSize);
    g.generateTexture('chest', ch.width, ch.height).clear();

    // Weapon icon: pistol (a barrel and a grip on a framed square).
    const wi = t.weaponIcon, ws = wi.size;
    g.fillStyle(wi.color).fillRect(0, 0, ws, ws).lineStyle(2, wi.borderColor).strokeRect(1, 1, ws - 2, ws - 2);
    g.fillStyle(wi.gunColor).fillRect(ws * 0.18, ws * 0.3, ws * 0.64, ws * 0.16);
    g.fillStyle(wi.gripColor).fillRect(ws * 0.22, ws * 0.44, ws * 0.17, ws * 0.32);
    g.generateTexture('weapon_pistol', ws, ws).clear();

    const pk = t.pickup;
    g.fillStyle(pk.color).fillRect(0, 0, pk.size, pk.size);
    g.lineStyle(pk.borderWidth, pk.borderColor).strokeRect(0, 0, pk.size, pk.size);
    g.generateTexture('pickup', pk.size, pk.size).clear();

    // Auras: a bubble (translucent ball with a shine) and a rage ring (spikes, red at the base, yellow at the tip).
    const ab = t.auras.bubble, bubD = (ab.radius + ab.lineWidth) * 2, bubC = bubD / 2;
    g.fillStyle(ab.color, ab.fillAlpha).fillCircle(bubC, bubC, ab.radius);
    g.lineStyle(ab.lineWidth, ab.color).strokeCircle(bubC, bubC, ab.radius);
    g.lineStyle(ab.lineWidth, 0xffffff, 0.7).beginPath().arc(bubC, bubC, ab.radius * 0.8, Math.PI * 1.1, Math.PI * 1.4).strokePath();
    g.generateTexture('aura_bubble', bubD, bubD).clear();
    const ar = t.auras.rage, outer = ar.radius + ar.spikeLength, rd = outer * 2;
    g.fillStyle(ar.color, ar.fillAlpha).fillCircle(outer, outer, ar.radius);
    const half = Math.PI / ar.spikes * 0.6; // half the base of a spike, as an angle
    for (let i = 0; i < ar.spikes; i++) {
      const a = (i / ar.spikes) * Math.PI * 2, p = (ang, r) => [outer + Math.cos(ang) * r, outer + Math.sin(ang) * r];
      const [x1, y1] = p(a - half, ar.radius), [x2, y2] = p(a + half, ar.radius), [tx, ty] = p(a, outer);
      g.fillStyle(ar.color).fillTriangle(x1, y1, x2, y2, tx, ty);
      const [mx, my] = p(a, ar.radius + ar.spikeLength * 0.55);
      g.fillStyle(ar.tipColor).fillTriangle(mx + (x1 - x2) * 0.2, my + (y1 - y2) * 0.2, mx - (x1 - x2) * 0.2, my - (y1 - y2) * 0.2, tx, ty);
    }
    g.generateTexture('aura_rage', rd, rd).clear();

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
