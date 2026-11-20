import { config } from '../config.js';
import { fallbackUpgrade } from '../data/upgrades.js';
import { rollRarity, drawUpgrades, describe, applyUpgrade, rarityHex } from '../systems/cards.js';
import { playVfx } from '../systems/vfx.js';

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
    // Cards are drawn by weight without repeats. Short of cards, the heal fills in.
    this.choices = drawUpgrades(this.run, c.count);
    if (this.choices.length < c.count) this.choices.push(fallbackUpgrade);
    this.rarities = this.choices.map((up) => rollRarity(up, this.run.level));

    const n = this.choices.length;
    this.choices.forEach((up, i) => {
      const x = width / 2 + (i - (n - 1) / 2) * (c.width + c.gap);
      const y = height / 2, top = y - c.height / 2, bottom = y + c.height / 2;
      const level = up.levelText ? `${up.levelText}\n` // weapon cards: "NOWA BROŃ" or the level they reach
        : !Number.isFinite(up.maxStack) ? '' : `${taken[up.id] ?? 0}/${up.maxStack}\n`; // no counter without a limit (heal, Bartkowanie)

      const rarity = this.rarities[i];
      this.add.rectangle(x, y, c.width, c.height, c.color)
        .setStrokeStyle(rarity ? c.rarityBorderWidth : c.borderWidth, rarity?.color ?? c.borderColor)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.pick(i));
      if (rarity) {
        this.add.text(x, top - u.margin / 2, rarity.name.toUpperCase(), { fontFamily: config.ui.font, fontSize: `${c.rarityFontSize}px`, fontStyle: 'bold', color: rarityHex(rarity) })
          .setOrigin(0.5, 1);
      }
      if (rarity?.id === 'legendary') playVfx(this, 'starBurst', x, top);
      this.add.text(x, top + u.margin, up.name, {
        fontFamily: config.ui.font, fontSize: `${c.nameFontSize}px`, align: 'center', wordWrap: { width: c.width - 2 * u.margin },
      }).setOrigin(0.5, 0);
      this.add.text(x, y, describe(up, rarity), {
        fontFamily: config.ui.font, fontSize: `${c.textFontSize}px`, align: 'center', wordWrap: { width: c.width - 2 * u.margin },
      }).setOrigin(0.5);
      this.add.text(x, bottom - u.margin, `${level}[${i + 1}]`, { fontFamily: config.ui.font, fontSize: `${u.hudFontSize}px`, align: 'center' })
        .setOrigin(0.5, 1);
      this.input.keyboard.on(`keydown-${KEY_NAMES[i]}`, () => this.pick(i));
    });
  }

  pick(index) {
    if (this.picked) return; // a click and a key press can land in the same frame
    this.picked = true;
    applyUpgrade(this.run, this.scene.get('GameScene'), this.choices[index], this.rarities[index]);
    this.run.pendingLevelUps--;
    if (this.run.pendingLevelUps > 0) {
      this.scene.restart({ run: this.run });
    } else {
      this.scene.stop();
      this.scene.resume('GameScene');
    }
  }
}
