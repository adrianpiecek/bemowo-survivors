import { config } from '../config.js';
import { upgrades, fallbackUpgrade } from '../data/upgrades.js';
import { rollRarity, drawUpgrades, describe, applyUpgrade, rarityHex } from '../systems/cards.js';
import { playSfx } from '../systems/audio.js';

// Boss chest over the paused GameScene: `count` cards spin through upgrade names and stop one by one.
// Each card's upgrade (with a rolled rarity) is applied the moment it stops. Once all stop, Space, Enter or a click closes it.
export default class ChestScene extends Phaser.Scene {
  constructor() { super('ChestScene'); }

  init(data) {
    this.run = data.run;
    this.count = data.count;
    this.closing = false;
  }

  create() {
    const u = config.ui, c = u.card, ch = u.chest;
    const { width, height } = this.scale;
    this.add.rectangle(0, 0, width, height, 0x000000, u.dimAlpha).setOrigin(0);
    this.add.text(width / 2, ch.titleY, 'SKRZYNIA', {
      fontSize: `${ch.titleFontSize}px`, fontStyle: 'bold', color: ch.titleColor, stroke: '#000000', strokeThickness: ch.strokeThickness,
    }).setOrigin(0.5);

    const prizes = drawUpgrades(this.run, this.count);
    while (prizes.length < this.count) prizes.push(fallbackUpgrade); // everything maxed: the heal fills in
    const names = upgrades.map((up) => up.name), n = prizes.length, gs = this.scene.get('GameScene');
    let stopped = 0;

    prizes.forEach((up, i) => {
      const x = width / 2 + (i - (n - 1) / 2) * (c.width + c.gap), y = height / 2, top = y - c.height / 2;
      const wrap = { align: 'center', wordWrap: { width: c.width - 2 * u.margin } };
      const card = this.add.rectangle(x, y, c.width, c.height, c.color).setStrokeStyle(c.borderWidth, c.borderColor);
      const name = this.add.text(x, top + u.margin, '', { fontSize: `${c.nameFontSize}px`, ...wrap }).setOrigin(0.5, 0);
      const spin = this.time.addEvent({ delay: ch.spinStepMs, loop: true, callback: () => name.setText(Phaser.Utils.Array.GetRandom(names)) });

      this.time.delayedCall(ch.spinMs + i * ch.stopGapMs, () => {
        spin.remove();
        const rarity = rollRarity(up, this.run.level);
        applyUpgrade(this.run, gs, up, rarity);
        name.setText(up.name);
        this.add.text(x, y, describe(up, rarity), { fontSize: `${c.textFontSize}px`, ...wrap }).setOrigin(0.5);
        card.setStrokeStyle(rarity ? c.rarityBorderWidth : c.borderWidth, rarity?.color ?? c.borderColor);
        if (rarity) {
          this.add.text(x, top - u.margin / 2, rarity.name.toUpperCase(), { fontSize: `${c.rarityFontSize}px`, fontStyle: 'bold', color: rarityHex(rarity) })
            .setOrigin(0.5, 1);
        }
        if (rarity?.id === 'legendary') this.add.sprite(x, top, 'starBurst').setScale(config.vfx.starBurst.scale).play('starBurst');
        this.tweens.add({ targets: card, scale: ch.popScale, duration: ch.popMs, yoyo: true });
        playSfx(this, 'pickup');
        if (++stopped === n) this.allowClose();
      });
    });
  }

  allowClose() {
    const { width, height } = this.scale, ch = config.ui.chest;
    this.add.text(width / 2, height - ch.promptBottom, 'Dalej [Spacja]', { fontSize: `${config.ui.hudFontSize}px` }).setOrigin(0.5);
    const close = () => {
      if (this.closing) return; // a click and a key press can land in the same frame
      this.closing = true;
      this.scene.stop();
      this.scene.resume('GameScene');
    };
    this.input.keyboard.once('keydown-SPACE', close);
    this.input.keyboard.once('keydown-ENTER', close);
    this.input.once('pointerdown', close);
  }
}
