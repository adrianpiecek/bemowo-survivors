import { config } from '../config.js';

export default class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  preload() {
    this.load.image('bartek', './assets/bartek.png');
  }

  create() {
    const t = config.textures;
    const g = this.add.graphics();

    for (const key of ['zombie', 'runner', 'bullet']) {
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
    g.generateTexture('ground', gr.size, gr.size);

    g.destroy();

    this.scene.start('GameScene');
  }
}
