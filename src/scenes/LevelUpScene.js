import { config } from '../config.js';
import { upgrades, fallbackUpgrade } from '../data/upgrades.js';

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

    const taken = this.run.upgrades;
    const available = upgrades.filter((up) => (taken[up.id] ?? 0) < up.maxStack);
    this.choices = available.length ? Phaser.Utils.Array.Shuffle([...available]).slice(0, c.count) : [fallbackUpgrade];

    const n = this.choices.length;
    this.choices.forEach((up, i) => {
      const x = width / 2 + (i - (n - 1) / 2) * (c.width + c.gap);
      const y = height / 2, top = y - c.height / 2, bottom = y + c.height / 2;
      const level = up === fallbackUpgrade ? '' : `${taken[up.id] ?? 0}/${up.maxStack}\n`;

      this.add.rectangle(x, y, c.width, c.height, c.color)
        .setStrokeStyle(c.borderWidth, c.borderColor)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.pick(i));
      this.add.text(x, top + u.margin, up.name, {
        fontSize: `${c.nameFontSize}px`, align: 'center', wordWrap: { width: c.width - 2 * u.margin },
      }).setOrigin(0.5, 0);
      this.add.text(x, y, up.description, {
        fontSize: `${c.textFontSize}px`, align: 'center', wordWrap: { width: c.width - 2 * u.margin },
      }).setOrigin(0.5);
      this.add.text(x, bottom - u.margin, `${level}[${i + 1}]`, { fontSize: `${u.hudFontSize}px`, align: 'center' })
        .setOrigin(0.5, 1);
      this.input.keyboard.on(`keydown-${KEY_NAMES[i]}`, () => this.pick(i));
    });
  }

  pick(index) {
    if (this.picked) return; // a click and a key press can land in the same frame
    this.picked = true;
    const up = this.choices[index];
    up.apply(this.run.player);
    this.run.upgrades[up.id] = (this.run.upgrades[up.id] ?? 0) + 1;
    this.run.pendingLevelUps--;
    if (this.run.pendingLevelUps > 0) {
      this.scene.restart({ run: this.run });
    } else {
      this.scene.stop();
      this.scene.resume('GameScene');
    }
  }
}
