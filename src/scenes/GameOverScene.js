import { config } from '../config.js';

export default class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }

  create() {
    const u = config.ui;
    const cx = this.scale.width / 2, cy = this.scale.height / 2;

    this.add.text(cx, cy - u.lineGap, 'Tu spoczywa Bartosz', { fontSize: `${u.titleFontSize}px` }).setOrigin(0.5);
    this.add.text(cx, cy, '(Bartłomiej)', { fontSize: `${u.subtitleFontSize}px`, color: '#aaaaaa' }).setOrigin(0.5);

    // GameScene.create() calls newRun(), so restarting it gives a clean run.
    this.add.text(cx, cy + u.lineGap * 2, 'Jeszcze raz', {
      fontSize: `${u.buttonFontSize}px`, color: '#000000', backgroundColor: '#ffffff', padding: { x: u.buttonPadding, y: u.buttonPadding },
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.scene.start('GameScene'));
  }
}
