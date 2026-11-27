import { config } from '../config.js';
import { save } from '../state.js';
import { weapons } from '../data/weapons.js';
import { passives } from '../data/passives.js';
import { plans } from '../data/plans.js';
import { maps } from '../data/maps.js';
import { font, panel, drawPanel, button, dim } from '../systems/ui.js';

// Wyzwania over the paused gym: every weapon, passive and plan with an unlock condition (data files' `unlock.text`),
// done ones (in save.unlocks) with a green frame. More than fit on the screen: pages ("<  Strona 1/2  >", arrow keys), so
// Wróć always shows. Wróć, Esc or Enter restart the menu under it.
// [label, defs, icon for defs without their own]: plans get the gym's calendar, maps a folded map.
const kinds = [['Broń', weapons], ['Pasywka', passives], ['Plan', plans, 'gym_plan'], ['Mapa', maps, 'icon_map']];

export default class ChallengesScene extends Phaser.Scene {
  constructor() { super('ChallengesScene'); }

  init(data) {
    this.page = data.page ?? 0;
    this.closing = false;
  }

  create() {
    const u = config.ui, c = u.challenges, { width, height } = this.scale, cx = width / 2;
    const list = kinds.flatMap(([kind, defs, icon]) => defs.filter((d) => d.unlock).map((def) => ({ kind, def, icon: def.icon ?? icon, done: save.unlocks.includes(def.id) })));
    const rowW = (c.width - c.padding * 2 - (c.columns - 1) * c.columnGap) / c.columns;
    const x0 = cx - c.width / 2;
    dim(this).setInteractive(); // swallows taps for the gym below
    const bg = this.add.graphics(); // the panel, drawn once the content's height is known

    // Top to bottom from y; the whole block is moved to the middle of the screen at the end.
    const items = [];
    const add = (o) => { items.push(o); return o; };
    let y = c.padding;
    const title = add(this.add.text(cx, y, 'Wyzwania', font(c.titleFontSize, { fontStyle: 'bold', color: '#ffc400' })).setOrigin(0.5, 0));
    y += title.height + c.gap / 2;
    const doneCount = list.filter((it) => it.done).length;
    const intro = add(this.add.text(cx, y, `Spełnij warunek, a odblokujesz broń, pasywkę, plan albo mapę. Zrobione: ${doneCount}/${list.length}`,
      font(c.textFontSize, { color: c.hintColor, align: 'center', wordWrap: { width: c.width - c.padding * 2 } })).setOrigin(0.5, 0));
    y += intro.height + c.gap;

    // Rows that fit between the intro and Wróć (with the pager under them when one page is not enough).
    const step = c.rowHeight + c.rowGap, below = c.gap + c.backHeight + c.padding;
    const fit = (room) => Math.max(1, Math.floor((room + c.rowGap) / step)) * c.columns;
    let perPage = fit(height - c.margin * 2 - y - below);
    if (perPage < list.length) perPage = fit(height - c.margin * 2 - y - below - c.gap - c.pagerHeight);
    const pages = Math.ceil(list.length / perPage);
    this.page = Phaser.Math.Clamp(this.page, 0, pages - 1);
    const shown = list.slice(this.page * perPage, (this.page + 1) * perPage);

    shown.forEach(({ kind, def, icon, done }, i) => {
      const rx = x0 + c.padding + (i % c.columns) * (rowW + c.columnGap), ry = y + Math.floor(i / c.columns) * step;
      add(panel(this, rx, ry, rowW, c.rowHeight, done ? { borderColor: c.doneColor, borderAlpha: 1 } : {}));
      if (icon) add(this.add.image(rx + c.inner + c.iconSize / 2, ry + c.rowHeight / 2, icon).setDisplaySize(c.iconSize, c.iconSize).setAlpha(done ? 1 : c.lockedAlpha));
      const tx = rx + c.inner * 2 + c.iconSize, textW = rx + rowW - c.inner - tx;
      const name = add(this.add.text(tx, 0, `${kind}: ${def.name}`, font(c.nameFontSize, { fontStyle: 'bold', color: done ? '#ffffff' : c.lockedColor })));
      const what = add(this.add.text(tx, 0, done ? `Zrobione: ${def.unlock.text}` : def.unlock.text,
        font(c.descFontSize, { color: done ? c.doneText : c.hintColor, wordWrap: { width: textW } })));
      name.setY(ry + (c.rowHeight - name.height - what.height) / 2);
      what.setY(name.y + name.height);
    });
    // A full page's height on every page, so Wróć and the pager stay put.
    y += Math.ceil((pages > 1 ? perPage : list.length) / c.columns) * step - c.rowGap + c.gap;
    if (pages > 1) {
      const py = y + c.pagerHeight / 2, turn = (d) => this.turnPage(d, pages);
      const pw = c.pagerButton, opts = (on) => ({ width: pw, height: c.pagerHeight, fontSize: c.pagerFontSize, variant: on ? 'secondary' : 'disabled' });
      const label = add(this.add.text(cx, py, `Strona ${this.page + 1}/${pages}`, font(c.pagerFontSize, { fontStyle: 'bold' })).setOrigin(0.5));
      add(button(this, label.x - label.width / 2 - c.padding - pw / 2, py, '<', () => turn(-1), opts(this.page > 0)));
      add(button(this, label.x + label.width / 2 + c.padding + pw / 2, py, '>', () => turn(1), opts(this.page < pages - 1)));
      this.input.keyboard.on('keydown-LEFT', () => turn(-1));
      this.input.keyboard.on('keydown-RIGHT', () => turn(1));
      y += c.pagerHeight + c.gap;
    }

    add(button(this, cx, y + c.backHeight / 2, 'Wróć', () => this.close(), { width: c.backWidth, height: c.backHeight, fontSize: c.backFontSize, variant: 'secondary' }));
    y += c.backHeight + c.padding;

    const top = Math.max(0, (height - y) / 2);
    for (const o of items) o.y += top;
    drawPanel(bg, x0, top, c.width, y);

    this.input.keyboard.once('keydown-ESC', () => this.close());
    this.input.keyboard.once('keydown-ENTER', () => this.close());
  }

  turnPage(dir, pages) {
    const page = this.page + dir;
    if (page < 0 || page >= pages || this.closing) return;
    this.scene.restart({ page });
  }

  close() {
    if (this.closing) return; // a click and a key press can land in the same frame
    this.closing = true;
    this.scene.start('MenuScene'); // stops this one; the menu opened it
  }
}
