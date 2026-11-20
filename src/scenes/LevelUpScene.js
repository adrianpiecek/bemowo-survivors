import { config } from '../config.js';
import { fallbackUpgrade } from '../data/upgrades.js';
import { rollRarity, drawUpgrades, describe, applyUpgrade, rarityHex, cardCenter } from '../systems/cards.js';
import { playVfx } from '../systems/vfx.js';
import { font, button } from '../systems/ui.js';

const KEY_NAMES = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE'];

// Level-up cards over the paused GameScene. Under them: Odśwież [R] (new cards), Pomiń [S] (no card, a little HP) and
// Wywal [W, then the card's digit] (the card leaves the pool for the rest of the run and a new one takes its place).
// Their charges are in run.player. A restart with { choices, rarities } keeps the cards on screen (after a banish).
export default class LevelUpScene extends Phaser.Scene {
  constructor() { super('LevelUpScene'); }

  init(data) {
    this.run = data.run;
    this.choices = data.choices;
    this.rarities = data.rarities;
    this.picked = false;
    this.banishing = false;
  }

  create() {
    const u = config.ui, c = u.card, db = u.drawButtons, pl = this.run.player;
    const { width, height } = this.scale;
    this.add.rectangle(0, 0, width, height, 0x000000, u.dimAlpha).setOrigin(0);

    const taken = this.run.upgrades;
    // Cards are drawn by weight without repeats. Short of cards, the heal fills in.
    if (!this.choices) {
      this.choices = drawUpgrades(this.run, c.count);
      if (this.choices.length < c.count) this.choices.push(fallbackUpgrade);
      this.rarities = this.choices.map((up) => rollRarity(up, this.run));
    }

    const n = this.choices.length;
    this.cards = this.choices.map((up, i) => {
      const { x, y } = cardCenter(this, i, n); // the rarity name sits in the gap above each card
      const top = y - c.height / 2, bottom = y + c.height / 2;
      const level = up.levelText ? `${up.levelText}\n` // weapon cards: "NOWA BROŃ" or the level they reach
        : !Number.isFinite(up.maxStack) ? '' : `${taken[up.id] ?? 0}/${up.maxStack}\n`; // no counter without a limit (heal, Bartkowanie)

      const rarity = this.rarities[i];
      const card = this.add.rectangle(x, y, c.width, c.height, c.color)
        .setStrokeStyle(rarity ? c.rarityBorderWidth : c.borderWidth, rarity?.color ?? c.borderColor)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.choose(i));
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
      this.input.keyboard.on(`keydown-${KEY_NAMES[i]}`, () => this.choose(i));
      return card;
    });

    // The three draw buttons in a row under the lowest card, each with its charges left; greyed out at zero.
    const last = cardCenter(this, n - 1, n), by = last.y + c.height / 2 + db.top + db.height / 2;
    const actions = [
      ['Odśwież', pl.rerolls, 'R', () => this.reroll()],
      ['Pomiń', pl.skips, 'S', () => this.skip()],
      ['Wywal', pl.banishes, 'W', () => this.toggleBanish()],
    ];
    actions.forEach(([label, charges, key, fn], i) => {
      const bx = width / 2 + (i - 1) * (db.width + db.gap);
      button(this, bx, by, `${label} (${charges})`, fn, {
        width: db.width, height: db.height, fontSize: db.fontSize, variant: charges > 0 ? 'secondary' : 'disabled',
      });
      // A held movement key (W, S) repeats keydown: only a fresh press counts, so walking into a level up does nothing.
      this.input.keyboard.on(`keydown-${key}`, (e) => { if (!e.repeat) fn(); });
    });
    this.hint = this.add.text(width / 2, by + db.height / 2 + db.hintGap, '', font(db.hintFontSize, { color: db.hintColor, align: 'center' }))
      .setOrigin(0.5, 0);
    this.setHint();
  }

  setHint() {
    const db = config.ui.drawButtons;
    if (this.banishing) this.hint.setText(`Którą kartę wywalić? [1-${this.choices.length}]   [W] anuluj`).setColor(db.banishColor);
    else this.hint.setText('[R] odśwież   [S] pomiń (+HP)   [W] wywal').setColor(db.hintColor);
  }

  // A card click or digit: picks the card, or banishes it while Wywal is on.
  choose(i) {
    if (this.banishing) this.banish(i);
    else this.pick(i);
  }

  pick(index) {
    if (this.picked) return; // a click and a key press can land in the same frame
    this.picked = true;
    applyUpgrade(this.run, this.scene.get('GameScene'), this.choices[index], this.rarities[index]);
    this.done();
  }

  // This level up is used: the next waiting one, or back to the run.
  done() {
    this.run.pendingLevelUps--;
    if (this.run.pendingLevelUps > 0) {
      this.scene.restart({ run: this.run });
    } else {
      this.scene.stop();
      this.scene.resume('GameScene');
    }
  }

  reroll() {
    if (this.picked || this.run.player.rerolls <= 0) return;
    this.picked = true;
    this.run.player.rerolls--;
    this.scene.restart({ run: this.run });
  }

  skip() {
    if (this.picked || this.run.player.skips <= 0) return;
    this.picked = true;
    const pl = this.run.player;
    pl.skips--;
    pl.hp = Math.min(pl.maxHp, pl.hp + config.draw.skipHeal);
    this.done();
  }

  toggleBanish() {
    if (this.picked || this.run.player.banishes <= 0) return;
    this.banishing = !this.banishing;
    const c = config.ui.card, db = config.ui.drawButtons;
    this.cards.forEach((card, i) => {
      const r = this.rarities[i];
      card.setStrokeStyle(r || this.banishing ? c.rarityBorderWidth : c.borderWidth, this.banishing ? db.banishBorder : r?.color ?? c.borderColor);
    });
    this.setHint();
  }

  // The card leaves the pool for the rest of the run; a new card (not one already shown) takes its place.
  banish(i) {
    const up = this.choices[i];
    if (this.picked || up === fallbackUpgrade) return; // the heal is only a filler, never in the pool
    this.picked = true;
    this.run.player.banishes--;
    this.run.banished.push(up.id);
    const [next = fallbackUpgrade] = drawUpgrades(this.run, 1, this.choices.map((ch) => ch.id));
    const choices = this.choices.slice(), rarities = this.rarities.slice();
    choices[i] = next;
    rarities[i] = rollRarity(next, this.run);
    this.scene.restart({ run: this.run, choices, rarities });
  }
}
