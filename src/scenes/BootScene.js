import { config } from '../config.js';

export default class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  preload() {
    this.load.image('bartek-head', './assets/bartek-head.png');
  }

  create() {
    const t = config.textures;
    const g = this.add.graphics();

    g.fillStyle(t.bartekBody.color).fillRect(0, 0, t.bartekBody.width, t.bartekBody.height);
    g.generateTexture('bartek-body', t.bartekBody.width, t.bartekBody.height).clear();

    for (const key of ['zombie', 'runner', 'bullet']) {
      const { radius, color } = t[key];
      g.fillStyle(color).fillCircle(radius, radius, radius);
      g.generateTexture(key, radius * 2, radius * 2).clear();
    }

    const s = t.gem.size, h = s / 2;
    g.fillStyle(t.gem.color).fillPoints([{ x: h, y: 0 }, { x: s, y: h }, { x: h, y: s }, { x: 0, y: h }], true);
    g.generateTexture('gem', s, s);

    g.destroy();
    this.scene.start('GameScene');
  }
}
