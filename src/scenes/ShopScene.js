import { config } from '../config.js';
import { rollRarity, drawUpgrades, describe, applyUpgrade, rarityHex, cardCenter, addCardHint } from '../systems/cards.js';
import { font, button } from '../systems/ui.js';
import { playSfx } from '../systems/audio.js';

const KEY_NAMES = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE'];

// Promocja w Żabce (data/events.js) over the paused GameScene: config.events.zabka.cards cards with a rarity, each for
// a price in protein from this run's coins (run.coinProtein, so that much less protein at the end of the run).
// A click or 1-3 buys a card (each once, as many as the coins pay for); Wyjdź, Space or Enter goes back to the run.
export default class ShopScene extends Phaser.Scene {
  constructor() { super('ShopScene'); }

  init(data) {
    this.run = data.run;
    this.closing = false;
  }

  create() {
    const u = config.ui, c = u.card, sh = u.shop, db = u.drawButtons, z = config.events.zabka, { width, height } = this.scale;
    this.add.rectangle(0, 0, width, height, 0x000000, u.dimAlpha).setOrigin(0);
    this.add.text(width / 2, u.chest.titleY, 'PROMOCJA W ŻABCE', font(sh.titleFontSize, {
      fontStyle: 'bold', color: sh.titleColor, stroke: '#000000', strokeThickness: u.chest.strokeThickness,
    })).setOrigin(0.5);

    const wrap = { align: 'center', wordWrap: { width: c.width - 2 * u.margin } }, choices = drawUpgrades(this.run, z.cards);
    this.items = choices.map((up, i) => {
      const rarity = rollRarity(up, this.run), price = z.prices[rarity?.id ?? 'none'];
      const { x, y } = cardCenter(this, i, choices.length), top = y - c.height / 2;
      const card = this.add.rectangle(x, y, c.width, c.height, c.color)
        .setStrokeStyle(rarity ? c.rarityBorderWidth : c.borderWidth, rarity?.color ?? c.borderColor)
        .setInteractive({ useHandCursor: true }).on('pointerdown', () => this.buy(i));
      const parts = [card];
      if (rarity) {
        parts.push(this.add.text(x, top - u.margin / 2, rarity.name.toUpperCase(), font(c.rarityFontSize, { fontStyle: 'bold', color: rarityHex(rarity) }))
          .setOrigin(0.5, 1));
      }
      const name = this.add.text(x, top + u.margin, up.name, font(c.nameFontSize, wrap)).setOrigin(0.5, 0);
      const desc = this.add.text(x, y, describe(up, rarity), font(c.textFontSize, wrap)).setOrigin(0.5);
      const foot = this.add.text(x, top + c.height - u.margin, `${price} białka [${i + 1}]`, font(u.hudFontSize, { fontStyle: 'bold' })).setOrigin(0.5, 1);
      addCardHint(this, up, x, name, desc, foot.y - foot.height);
      parts.push(name, desc);
      this.input.keyboard.on(`keydown-${KEY_NAMES[i]}`, () => this.buy(i));
      return { up, rarity, price, foot, parts, bought: false };
    });

    // Wyjdź under the lowest card (where the level up has its buttons), the coins left under it.
    const last = cardCenter(this, choices.length - 1, choices.length), by = last.y + c.height / 2 + db.top + db.height / 2;
    button(this, width / 2, by, 'Wyjdź [Spacja]', () => this.close(), { height: db.height, fontSize: db.fontSize, variant: 'secondary' });
    this.coins = this.add.text(width / 2, by + db.height / 2 + db.hintGap, '', font(db.hintFontSize, { color: db.hintColor, align: 'center' }))
      .setOrigin(0.5, 0);
    this.input.keyboard.once('keydown-SPACE', () => this.close());
    this.input.keyboard.once('keydown-ENTER', () => this.close());
    this.refresh();
  }

  // Prices in white, red when the coins do not cover them; a bought card greyed out.
  refresh() {
    const sh = config.ui.shop;
    this.coins.setText(`Białko z monet: ${this.run.coinProtein} (wydane nie wraca na koniec rundy)`);
    this.items.forEach((it, i) => {
      if (it.bought) {
        it.foot.setText('KUPIONE').setColor(sh.boughtColor);
        it.parts.forEach((p) => p.setAlpha(sh.boughtAlpha));
      } else {
        it.foot.setText(`${it.price} białka [${i + 1}]`).setColor(this.run.coinProtein >= it.price ? '#ffffff' : sh.poorColor);
      }
    });
  }

  buy(i) {
    const it = this.items[i];
    if (this.closing || !it || it.bought) return;
    if (this.run.coinProtein < it.price) {
      const sh = config.ui.shop; // a shake: not enough coins
      this.tweens.add({ targets: it.foot, x: it.foot.x + sh.shakePx, duration: sh.shakeMs, yoyo: true, repeat: 2 });
      return;
    }
    this.run.coinProtein -= it.price;
    it.bought = true;
    applyUpgrade(this.run, this.scene.get('GameScene'), it.up, it.rarity);
    playSfx(this, 'pickup');
    this.refresh();
  }

  close() {
    if (this.closing) return; // a click and a key press can land in the same frame
    this.closing = true;
    this.scene.stop();
    this.scene.resume('GameScene');
  }
}
