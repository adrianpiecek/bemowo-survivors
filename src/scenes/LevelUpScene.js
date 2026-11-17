import { config } from '../config.js';

const KEY_NAMES = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE'];

export default class LevelUpScene extends Phaser.Scene {
  constructor() { super('LevelUpScene'); }

  init(data) {
    this.run = data.run;
    this.picked = false;
  }

  create() {
    const u = config.ui, c = u.card;
    const { width, height } = this.scale;
    this.add.rectangle(0, 0, width, height, 0x000000, u.dimAlpha).setOrigin(0);

    for (let i = 0; i < c.count; i++) {
      const x = width / 2 + (i - (c.count - 1) / 2) * (c.width + c.gap);
      const y = height / 2;
      this.add.rectangle(x, y, c.width, c.height, c.color)
        .setStrokeStyle(c.borderWidth, c.borderColor)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.pick(i));
      this.add.text(x, y, 'Ulepszenie', { fontSize: `${u.hudFontSize}px` }).setOrigin(0.5);
      this.add.text(x, y + c.height / 2 - u.margin, `[${i + 1}]`, { fontSize: `${u.hudFontSize}px` }).setOrigin(0.5, 1);
      this.input.keyboard.on(`keydown-${KEY_NAMES[i]}`, () => this.pick(i));
    }
  }

  pick(index) {
    if (this.picked) return; // a click and a key press can land in the same frame
    this.picked = true;
    // Step 6 applies the upgrade on card `index` here.
    this.run.pendingLevelUps--;
    if (this.run.pendingLevelUps > 0) {
      this.scene.restart({ run: this.run });
    } else {
      this.scene.stop();
      this.scene.resume('GameScene');
    }
  }
}
