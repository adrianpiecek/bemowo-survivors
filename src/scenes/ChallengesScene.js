import { config } from '../config.js';
import { save } from '../state.js';
import { weapons } from '../data/weapons.js';
import { passives } from '../data/passives.js';
import { plans } from '../data/plans.js';
import { maps } from '../data/maps.js';
import { font, panel, drawPanel, button } from '../systems/ui.js';

// Wyzwania over the paused gym: every weapon, passive and plan with an unlock condition (data files' `unlock.text`),
// done ones (in save.unlocks) with a green frame. Wróć, Esc or Enter restart the gym under it on the page it was on.
const kinds = [['Broń', weapons], ['Pasywka', passives], ['Plan', plans], ['Mapa', maps]];

export default class ChallengesScene extends Phaser.Scene {
  constructor() { super('ChallengesScene'); }

  init(data) {
    this.page = data.page ?? 0;
    this.closing = false;
  }

  create() {
    const u = config.ui, c = u.challenges, { width, height } = this.scale, cx = width / 2;
    const list = kinds.flatMap(([kind, defs]) => defs.filter((d) => d.unlock).map((def) => ({ kind, def, done: save.unlocks.includes(def.id) })));
    const rowW = (c.width - c.padding * 2 - (c.columns - 1) * c.columnGap) / c.columns;
    const rows = Math.ceil(list.length / c.columns);
    const x0 = cx - c.width / 2;
    this.add.rectangle(0, 0, width, height, 0x000000, u.dimAlpha).setOrigin(0).setInteractive(); // swallows taps for the gym below
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

    list.forEach(({ kind, def, done }, i) => {
      const rx = x0 + c.padding + (i % c.columns) * (rowW + c.columnGap), ry = y + Math.floor(i / c.columns) * (c.rowHeight + c.rowGap);
      add(panel(this, rx, ry, rowW, c.rowHeight, done ? { borderColor: c.doneColor, borderAlpha: 1 } : {}));
      // Weapons and passives have an icon; plans none, their text starts in the same column anyway.
      if (def.icon) add(this.add.image(rx + c.inner + c.iconSize / 2, ry + c.rowHeight / 2, def.icon).setDisplaySize(c.iconSize, c.iconSize).setAlpha(done ? 1 : c.lockedAlpha));
      const tx = rx + c.inner * 2 + c.iconSize, textW = rx + rowW - c.inner - tx;
      const name = add(this.add.text(tx, 0, `${kind}: ${def.name}`, font(c.nameFontSize, { fontStyle: 'bold', color: done ? '#ffffff' : c.lockedColor })));
      const what = add(this.add.text(tx, 0, done ? `Zrobione: ${def.unlock.text}` : def.unlock.text,
        font(c.descFontSize, { color: done ? c.doneText : c.hintColor, wordWrap: { width: textW } })));
      name.setY(ry + (c.rowHeight - name.height - what.height) / 2);
      what.setY(name.y + name.height);
    });
    y += rows * (c.rowHeight + c.rowGap) - c.rowGap + c.gap;

    add(button(this, cx, y + c.backHeight / 2, 'Wróć', () => this.close(), { width: c.backWidth, height: c.backHeight, fontSize: c.backFontSize }));
    y += c.backHeight + c.padding;

    const top = Math.max(0, (height - y) / 2);
    for (const o of items) o.y += top;
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
