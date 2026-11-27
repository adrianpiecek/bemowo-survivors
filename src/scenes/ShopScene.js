import { config } from '../config.js';
import { rollRarity, drawUpgrades, applyUpgrade, cardCenter, makeCard } from '../systems/cards.js';
import { font, button, keyHint, dim } from '../systems/ui.js';
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
    dim(this);
    this.add.text(width / 2, u.chest.titleY, 'PROMOCJA W ŻABCE', font(sh.titleFontSize, {
      fontStyle: 'bold', color: sh.titleColor, stroke: '#000000', strokeThickness: u.chest.strokeThickness,
    })).setOrigin(0.5);

    const choices = drawUpgrades(this.run, z.cards);
    this.items = choices.map((up, i) => {
      const rarity = rollRarity(up, this.run), price = z.prices[rarity?.id ?? 'none'];
      const card = makeCard(this, i, choices.length, () => this.buy(i)).fill(up, rarity, keyHint(`${price} białka`, `[${i + 1}]`));
      this.input.keyboard.on(`keydown-${KEY_NAMES[i]}`, () => this.buy(i));
      return { up, rarity, price, card, foot: card.foot, bought: false };
    });

    // Wyjdź under the lowest card (where the level up has its buttons), the coins left under it.
    const last = cardCenter(this, choices.length - 1, choices.length), by = last.y + c.height / 2 + db.top + db.height / 2;
    button(this, width / 2, by, keyHint('Wyjdź', '[Spacja]'), () => this.close(), { height: db.height, fontSize: db.fontSize, variant: 'secondary' });
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
        it.card.setAlpha(sh.boughtAlpha);
      } else {
        it.foot.setText(keyHint(`${it.price} białka`, `[${i + 1}]`)).setColor(this.run.coinProtein >= it.price ? '#ffffff' : sh.poorColor);
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
    this.scene.get('GameScene').endEvent('zabka'); // something bought: the shop goes when the screen closes
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
