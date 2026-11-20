import { config } from '../config.js';
import { save, writeSave } from '../state.js';
import { plans } from '../data/plans.js';
import { cardCenter } from '../systems/cards.js';
import { font, panel } from '../systems/ui.js';
import { betSum } from '../data/bets.js';

const KEY_NAMES = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE'];
const isUnlocked = (p) => !p.unlock || save.unlocks.includes(p.id);

// Every way into a run but the very first (the title goes straight in then) comes through here: the plan screen,
// or straight into the run with config.debug.forcePlan.
export function startRun(scene) {
  const forced = plans.find((p) => p.id === config.debug.forcePlan);
  if (forced && save.runsPlayed > 0) {
    if (!isUnlocked(forced)) {
      save.unlocks.push(forced.id);
      writeSave(save);
    }
    scene.scene.start('GameScene', { plan: forced.id });
    return;
  }
  scene.scene.start(save.runsPlayed > 0 ? 'PlanScene' : 'GameScene');
}

// Before a run: config.plans.cards random unlocked training plans as cards, each with its plus (green) and minus (red).
// A click or 1-3 picks one and starts the run with it.
export default class PlanScene extends Phaser.Scene {
  constructor() { super('PlanScene'); }

  create() {
    const u = config.ui, c = u.card, ps = u.planScreen, { width } = this.scale;
    this.picked = false;
    this.choices = Phaser.Utils.Array.Shuffle(plans.filter(isUnlocked)).slice(0, config.plans.cards);
    this.add.text(width / 2, ps.titleY, 'Plan treningowy', font(ps.titleFontSize, {
      fontStyle: 'bold', color: '#ffc400', stroke: '#000000', strokeThickness: 5,
    })).setOrigin(0.5, 0);

    const wrap = { align: 'center', wordWrap: { width: c.width - 2 * u.margin } };
    this.choices.forEach((plan, i) => {
      const { x, y } = cardCenter(this, i, this.choices.length), top = y - c.height / 2;
      panel(this, x - c.width / 2, top, c.width, c.height);
      this.add.zone(x, y, c.width, c.height).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.pick(i));
      this.add.text(x, top + u.margin, plan.name, font(c.nameFontSize, { fontStyle: 'bold', ...wrap })).setOrigin(0.5, 0);
      // Plus over minus, the pair in the middle of the card (the lines carry their own signs).
      const plus = this.add.text(x, 0, plan.plus, font(ps.lineFontSize, { color: ps.plusColor, ...wrap })).setOrigin(0.5, 0);
      const minus = this.add.text(x, 0, plan.minus ?? 'bez minusów', font(ps.lineFontSize, { color: plan.minus ? ps.minusColor : ps.plusColor, ...wrap }))
        .setOrigin(0.5, 0);
      plus.setY(y - (plus.height + ps.lineGap + minus.height) / 2);
      minus.setY(plus.y + plus.height + ps.lineGap);
      this.add.text(x, top + c.height - u.margin, `[${i + 1}]`, font(u.hudFontSize)).setOrigin(0.5, 1);
      this.input.keyboard.on(`keydown-${KEY_NAMES[i]}`, () => this.pick(i));
    });
    // The bets picked in the gym, so the bonus is in view before the run.
    const sum = Math.round(betSum() * 100), last = cardCenter(this, this.choices.length - 1, this.choices.length);
    if (sum) {
      this.add.text(width / 2, last.y + c.height / 2 + ps.betsGap, `Zakłady z Unc: +${sum}% białka`, font(ps.lineFontSize, { color: ps.minusColor }))
        .setOrigin(0.5, 0);
    }
  }

  pick(i) {
    if (this.picked) return; // a click and a key press can land in the same frame
    this.picked = true;
    this.scene.start('GameScene', { plan: this.choices[i].id });
  }
}
