import { config } from '../config.js';
import { save, formatTime } from '../state.js';
import { weapons } from '../data/weapons.js';
import { font, drawPanel, button, dim } from '../systems/ui.js';

// Statystyki over the paused gym: totals and records over every run (save.stats, added in GameOverScene), label left and
// value right, in `columns` columns. Wróć, Esc or Enter restart the gym under it on the page it was on.
const hours = (ms) => {
  const min = Math.floor(ms / 60000);
  return min < 60 ? `${min} min` : `${Math.floor(min / 60)} h ${min % 60} min`;
};

export default class StatsScene extends Phaser.Scene {
  constructor() { super('StatsScene'); }

  init(data) {
    this.page = data.page ?? 0;
    this.closing = false;
  }

  create() {
    const u = config.ui, c = u.stats, st = save.stats, { width, height } = this.scale, cx = width / 2, x0 = cx - c.width / 2;
    const evolutions = weapons.filter((d) => d.evolution).length;
    const rows = [
      ['Rozegrane rundy', save.runsPlayed],
      ['Wygrane rundy', st.wins],
      ['Łączny czas gry', hours(st.playMs)],
      ['Najdłużej przeżyta runda', formatTime(st.bestMs)],
      ['Zabici wrogowie', st.kills],
      ['Najwięcej zabitych w rundzie', st.bestKills],
      ['Pokonani bossowie', st.bosses],
      ['Najwyższy poziom', st.maxLevel],
      ['Zdobyte białko', st.protein],
      ['Zjedzone pierogi', st.pierogi],
      ['Przyjęte obrażenia', Math.round(st.damageTaken)],
      ['Duże złote monety', st.goldCoins],
      ['Bartkowania', st.bartkowanie],
      ['Odkryte ewolucje', `${save.evolutions.length}/${evolutions}`],
    ];
    dim(this).setInteractive(); // swallows taps for the gym below
    const bg = this.add.graphics(); // the panel, drawn once the content's height is known

    // Top to bottom from y; the whole block is moved to the middle of the screen at the end.
    const objs = [];
    const add = (o) => { objs.push(o); return o; };
    let y = c.padding;
    const title = add(this.add.text(cx, y, 'Statystyki', font(c.titleFontSize, { fontStyle: 'bold', color: '#ffc400' })).setOrigin(0.5, 0));
    y += title.height + c.gap;

    const colW = (c.width - c.padding * 2 - (c.columns - 1) * c.columnGap) / c.columns, perCol = Math.ceil(rows.length / c.columns);
    rows.forEach(([label, value], i) => {
      const rx = x0 + c.padding + Math.floor(i / perCol) * (colW + c.columnGap), ry = y + (i % perCol) * c.rowHeight;
      if (i % 2 === 0) add(this.add.rectangle(rx, ry, colW, c.rowHeight, 0xffffff, c.stripeAlpha).setOrigin(0)); // every other row lighter
      add(this.add.text(rx + c.inner, ry + c.rowHeight / 2, label, font(c.fontSize, { color: c.labelColor })).setOrigin(0, 0.5));
      add(this.add.text(rx + colW - c.inner, ry + c.rowHeight / 2, String(value), font(c.fontSize, { fontStyle: 'bold' })).setOrigin(1, 0.5));
    });
    y += perCol * c.rowHeight + c.gap;
    // The counters added in step 49 start at zero for an older save.
    const hint = add(this.add.text(cx, y, 'Czas gry, zabici, bossowie, białko i rekordy liczą się od wersji z tym oknem.',
      font(c.hintFontSize, { color: c.labelColor, align: 'center', wordWrap: { width: c.width - c.padding * 2 } })).setOrigin(0.5, 0));
    y += hint.height + c.gap;

    add(button(this, cx, y + c.backHeight / 2, 'Wróć', () => this.close(), { width: c.backWidth, height: c.backHeight, fontSize: c.backFontSize, variant: 'secondary' }));
    y += c.backHeight + c.padding;

    const top = Math.max(0, (height - y) / 2);
    for (const o of objs) o.y += top;
    drawPanel(bg, x0, top, c.width, y);

    this.input.keyboard.once('keydown-ESC', () => this.close());
    this.input.keyboard.once('keydown-ENTER', () => this.close());
  }

  close() {
    if (this.closing) return; // a click and a key press can land in the same frame
    this.closing = true;
    this.scene.start('MenuScene'); // stops this one; the menu opened it
  }
}
