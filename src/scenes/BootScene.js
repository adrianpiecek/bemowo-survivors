import { config } from '../config.js';

export default class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  preload() {
    this.load.image('bartek', './assets/bartek.png');
    this.load.image('zombie', './assets/zombie.png');
    // May be missing: the OLX card falls back to the generated 'pigeon' texture.
    this.load.image('golab', config.pickups.olx.photo);
  }

  create() {
    const t = config.textures;
    const g = this.add.graphics();

    for (const key of ['runner', 'bullet']) {
      const { radius, color } = t[key];
      g.fillStyle(color).fillCircle(radius, radius, radius);
      g.generateTexture(key, radius * 2, radius * 2).clear();
    }

    const s = t.gem.size, h = s / 2;
    g.fillStyle(t.gem.color).fillPoints([{ x: h, y: 0 }, { x: s, y: h }, { x: h, y: s }, { x: 0, y: h }], true);
    g.generateTexture('gem', s, s).clear();

    const gr = t.ground;
    g.fillStyle(gr.color).fillRect(0, 0, gr.size, gr.size);
    g.lineStyle(gr.lineWidth, gr.lineColor).strokeRect(0, 0, gr.size, gr.size);
    g.generateTexture('ground', gr.size, gr.size).clear();

    const kl = t.klapa;
    g.fillStyle(kl.color).fillRect(0, 0, kl.width, kl.height);
    g.lineStyle(kl.borderWidth, kl.borderColor).strokeRect(0, 0, kl.width, kl.height);
    g.generateTexture('klapa', kl.width, kl.height).clear();

    const pk = t.pickup;
    g.fillStyle(pk.color).fillRect(0, 0, pk.size, pk.size);
    g.lineStyle(pk.borderWidth, pk.borderColor).strokeRect(0, 0, pk.size, pk.size);
    g.generateTexture('pickup', pk.size, pk.size).clear();

    // Simple side-view pigeon facing right: body, darker wing, head, beak. Shape fractions are only proportions.
    const pg = t.pigeon, w = pg.width, ph = pg.height;
    g.fillStyle(pg.color).fillEllipse(w * 0.45, ph * 0.6, w * 0.7, ph * 0.6);
    g.fillStyle(pg.darkColor).fillEllipse(w * 0.4, ph * 0.5, w * 0.45, ph * 0.35);
    g.fillStyle(pg.color).fillCircle(w * 0.8, ph * 0.35, ph * 0.22);
    g.fillStyle(pg.beakColor).fillTriangle(w * 0.92, ph * 0.3, w, ph * 0.38, w * 0.92, ph * 0.44);
    g.generateTexture('pigeon', w, ph).clear();

    // Top-down tank facing right: hull, barrel to the right edge, turret on top.
    const tk = t.tank, tw = tk.hullWidth + tk.barrelOut * 2, th = tk.hullHeight;
    g.fillStyle(tk.color).fillRect(tk.barrelOut, 0, tk.hullWidth, th);
    g.fillStyle(tk.darkColor).fillRect(tw / 2, (th - tk.barrelWidth) / 2, tw / 2, tk.barrelWidth);
    g.fillCircle(tw / 2, th / 2, tk.turretRadius);
    g.generateTexture('tank', tw, th);

    g.destroy();

    this.scene.start('GameScene');
  }
}
