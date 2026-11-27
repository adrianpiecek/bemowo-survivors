import { config } from '../config.js';
import { save, writeSave } from '../state.js';
import { bets, betLevel, betSum } from '../data/bets.js';
import { playSfx } from '../systems/audio.js';
import { font, drawPanel, button, dim } from '../systems/ui.js';

// Zakłady z Unc over the paused gym: one row per bet with [−] level [+], the protein bonus of all of them, the rewards.
// A change goes to save.bets at once and holds for every run until changed. Wróć, Esc or Enter restart the gym under
// it, so its button shows the new bonus.
export default class BetsScene extends Phaser.Scene {
  constructor() { super('BetsScene'); }

  init() { this.closing = false; }

  create() {
    const u = config.ui, b = u.bets, rw = config.bets.rewards, { width, height } = this.scale, cx = width / 2;
    const x0 = cx - b.width / 2, inner = b.width - b.padding * 2;
    dim(this).setInteractive(); // swallows taps for the gym below
    const bg = this.add.graphics(); // the panel, drawn once the content's height is known

    // Top to bottom from y; the whole block is moved to the middle of the screen at the end.
    const items = [];
    const add = (o) => { items.push(o); return o; };
    let y = b.padding;
    const title = add(this.add.text(cx, y, 'Zakłady z Unc', font(b.titleFontSize, { fontStyle: 'bold', color: '#ffc400' })).setOrigin(0.5, 0));
    y += title.height + b.gap;
    const intro = add(this.add.text(cx, y, 'Każdy zakład utrudnia rundę i daje więcej białka. Wybór zostaje na kolejne rundy.',
      font(b.textFontSize, { color: b.hintColor, align: 'center', wordWrap: { width: inner } })).setOrigin(0.5, 0));
    y += intro.height + b.gap;

    const plusX = x0 + b.width - b.padding - b.stepButton / 2, levelX = plusX - b.stepButton / 2 - b.levelWidth / 2;
    const minusX = levelX - b.levelWidth / 2 - b.stepButton / 2, textW = minusX - b.stepButton / 2 - b.padding - (x0 + b.padding);
    for (const bet of bets) {
      const level = betLevel(bet), mid = y + b.rowHeight / 2;
      // Name over what it does now (red while on; at 0 what one level would do), the pair centred on the buttons.
      const perLevel = bet.maxLevel > 1 ? '/poz.' : '', desc = level > 0 ? bet.description(level) : `${bet.description(1)}${perLevel && ' (na poziom)'}`;
      const name = add(this.add.text(x0 + b.padding, 0, `${bet.name}  +${Math.round(bet.proteinPct * 100)}% białka${perLevel}`, font(b.nameFontSize, { fontStyle: 'bold' })));
      const what = add(this.add.text(x0 + b.padding, 0, desc, font(b.descFontSize, { color: level > 0 ? b.onColor : b.hintColor, wordWrap: { width: textW } })));
      name.setY(mid - (name.height + what.height) / 2);
      what.setY(name.y + name.height);
      const step = (dir) => this.change(bet, level + dir);
      add(button(this, minusX, mid, '−', () => step(-1), { width: b.stepButton, height: b.stepButton, variant: level > 0 ? 'secondary' : 'disabled' }));
      add(this.add.text(levelX, mid, `${level}/${bet.maxLevel}`, font(b.nameFontSize, { fontStyle: 'bold' })).setOrigin(0.5));
      add(button(this, plusX, mid, '+', () => step(1), { width: b.stepButton, height: b.stepButton, variant: level < bet.maxLevel ? 'secondary' : 'disabled' }));
      y += b.rowHeight;
    }

    y += b.gap;
    const sum = add(this.add.text(cx, y, `Premia białka: +${Math.round(betSum() * 100)}%`, font(b.sumFontSize, { fontStyle: 'bold', color: b.sumColor }))
      .setOrigin(0.5, 0));
    y += sum.height + b.gap / 2;
    const rewards = add(this.add.text(cx, y,
      `Wygrana z premią od ${Math.round(rw.uncPct * 100)}%: plan Trening z Unc. Od ${Math.round(rw.passivesPct * 100)}%: wszystkie pasywki.`,
      font(b.textFontSize, { color: b.hintColor, align: 'center', wordWrap: { width: inner } })).setOrigin(0.5, 0));
    y += rewards.height + b.gap;
    add(button(this, cx, y + b.backHeight / 2, 'Wróć', () => this.close(), { width: b.backWidth, height: b.backHeight, fontSize: b.backFontSize, variant: 'secondary' }));
    y += b.backHeight + b.padding;

    const top = Math.max(0, (height - y) / 2);
    for (const o of items) o.y += top;
    drawPanel(bg, x0, top, b.width, y);

    this.input.keyboard.once('keydown-ESC', () => this.close());
    this.input.keyboard.once('keydown-ENTER', () => this.close());
  }

  change(bet, level) {
    if (this.closing || level < 0 || level > bet.maxLevel) return;
    if (level > 0) save.bets[bet.id] = level;
    else delete save.bets[bet.id];
    writeSave(save);
    playSfx(this, 'pick');
    this.scene.restart();
  }

  close() {
    if (this.closing) return; // a click and a key press can land in the same frame
    this.closing = true;
    this.scene.start('MenuScene'); // stops this one; the menu redraws with the new bonus
  }
}
