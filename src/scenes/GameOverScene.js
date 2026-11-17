import { config } from '../config.js';
import { formatTime } from '../state.js';

export default class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }

  init(data) {
    this.run = data.run;
    this.won = data.won;
  }

  create() {
    const u = config.ui, r = this.run;
    const cx = this.scale.width / 2, cy = this.scale.height / 2;

    const [title, subtitle] = this.won
      ? ['Przetrwałeś!', 'Bemowo jest bezpieczne. Na razie.']
      : ['Tu spoczywa Bartosz', '(Bartłomiej)'];
    this.add.text(cx, cy - u.lineGap * 2, title, { fontSize: `${u.titleFontSize}px` }).setOrigin(0.5);
    this.add.text(cx, cy - u.lineGap, subtitle, { fontSize: `${u.subtitleFontSize}px`, color: '#aaaaaa' }).setOrigin(0.5);
    this.add.text(cx, cy, `Czas: ${formatTime(r.elapsedMs)}   Zabici: ${r.kills}   Poziom: ${r.level}`, {
      fontSize: `${u.hudFontSize}px`,
    }).setOrigin(0.5);

    // GameScene.create() calls newRun(), so restarting it gives a clean run.
    this.add.text(cx, cy + u.lineGap * 2, 'Jeszcze raz', {
      fontSize: `${u.buttonFontSize}px`, color: '#000000', backgroundColor: '#ffffff', padding: { x: u.buttonPadding, y: u.buttonPadding },
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.scene.start('GameScene'));
  }
}
