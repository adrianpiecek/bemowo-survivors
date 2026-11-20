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
    // Cards are drawn by weight (default 1), without repeats. Short of cards, the heal fills in.
    const pool = [...available], weight = (up) => up.weight ?? 1;
    this.choices = [];
    while (this.choices.length < c.count && pool.length) {
      let roll = Math.random() * pool.reduce((sum, up) => sum + weight(up), 0);
      const i = pool.findIndex((up) => (roll -= weight(up)) < 0);
      this.choices.push(pool.splice(i < 0 ? pool.length - 1 : i, 1)[0]);
    }
    if (this.choices.length < c.count) this.choices.push(fallbackUpgrade);

    const n = this.choices.length;
    this.choices.forEach((up, i) => {
      const x = width / 2 + (i - (n - 1) / 2) * (c.width + c.gap);
      const y = height / 2, top = y - c.height / 2, bottom = y + c.height / 2;
      const level = !Number.isFinite(up.maxStack) ? '' : // no counter without a limit (heal, Bartkowanie)
`${taken[up.id] ?? 0}/${up.maxStack}\n`;

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
    up.apply(this.run.player, this.scene.get('GameScene')); // most upgrades only need the player
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
