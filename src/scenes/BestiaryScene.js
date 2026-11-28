import { config } from '../config.js';
import { save } from '../state.js';
import { enemies } from '../data/enemies.js';
import { bossPowers } from '../data/bossPowers.js';
import { maps, enemyName } from '../data/maps.js';
import { font, panel, drawPanel, button, dim, pageRows, pager } from '../systems/ui.js';

// Bestiariusz over the paused gym: every enemy type and boss (data/enemies.js) with how many Bartek killed over all runs
// (save.bestiary). One never killed shows as a black shape with "???". A type another map dresses up (maps' looks and
// names: Fort Bema's Bartkowie) shows that look next to its own and both names ("Zombie / Binion"). More than fit on the
// screen: pages ("<  Strona 1/2  >", arrow keys). Wróć, Esc or Enter restart the menu under it.
export default class BestiaryScene extends Phaser.Scene {
  constructor() { super('BestiaryScene'); }

  init(data) {
    this.page = data.page ?? 0;
    this.closing = false;
  }

  create() {
    const u = config.ui, c = u.bestiary, { width, height } = this.scale, cx = width / 2, x0 = cx - c.width / 2;
    const rowW = (c.width - c.padding * 2 - (c.columns - 1) * c.columnGap) / c.columns;
    dim(this).setInteractive(); // swallows taps for the gym below
    const bg = this.add.graphics(); // the panel, drawn once the content's height is known

    // Top to bottom from y; the whole block is moved to the middle of the screen at the end.
    const objs = [];
    const add = (o) => { objs.push(o); return o; };
    let y = c.padding;
    const title = add(this.add.text(cx, y, 'Bestiariusz', font(c.titleFontSize, { fontStyle: 'bold', color: '#ffc400' })).setOrigin(0.5, 0));
    y += title.height + c.gap / 2;
    const known = enemies.filter((d) => save.bestiary[d.id]).length, dressed = maps.filter((m) => m.looks).map((m) => m.name).join(', ');
    const intro = add(this.add.text(cx, y, `Pokonane rodzaje: ${known}/${enemies.length}. Pomarańczowa ramka: boss. Drugi obrazek: ${dressed}.`,
      font(c.textFontSize, { color: c.dimColor, align: 'center', wordWrap: { width: c.width - c.padding * 2 } })).setOrigin(0.5, 0));
    y += intro.height + c.gap;

    const rows = pageRows(enemies, this.page, height - c.margin * 2 - y - (c.gap + c.backHeight + c.padding), c);
    this.page = rows.page;
    rows.shown.forEach((d, i) => {
      const kills = save.bestiary[d.id] ?? 0, rx = x0 + c.padding + (i % c.columns) * (rowW + c.columnGap);
      const ry = y + Math.floor(i / c.columns) * (c.rowHeight + c.rowGap), mid = ry + c.rowHeight / 2;
      add(panel(this, rx, ry, rowW, c.rowHeight, d.isBoss ? { borderColor: c.bossColor, borderAlpha: 1 } : {}));
      // The enemy's own picture and its other maps' looks, each fitted into an icon square; never killed: black shapes.
      const looks = [...new Set([d.texture, ...maps.map((m) => m.looks?.[d.texture]).filter(Boolean)])];
      looks.forEach((key, k) => {
        const img = add(this.add.image(rx + c.inner + c.iconSize / 2 + k * (c.iconSize + c.inner), mid, key));
        img.setScale(Math.min(c.iconSize / img.width, c.iconSize / img.height));
        if (!kills) img.setTintFill(0x000000);
      });
      const tx = rx + c.inner * 2 + c.iconSize * c.icons + c.inner * (c.icons - 1), textW = rx + rowW - c.inner - tx;
      const names = [...new Set(maps.map((m) => enemyName(d, m.id)))].join(' / ');
      const count = add(this.add.text(rx + rowW - c.inner, 0, kills ? `${kills}` : '', font(c.nameFontSize, { fontStyle: 'bold', color: '#ffc400' })).setOrigin(1, 0));
      const name = add(this.add.text(tx, 0, kills ? names : '???', font(c.nameFontSize, { fontStyle: 'bold', color: d.isBoss ? c.bossText : '#ffffff' })));
      name.setScale(Math.min(1, (textW - count.width - c.inner) / name.width)); // two long names shrink to fit beside the count
      const text = !kills ? 'Jeszcze nie pokonany.' : d.isBoss ? `Boss. ${bossPowers[d.id]?.hint ?? ''}` : d.description;
      const what = add(this.add.text(tx, 0, text, font(c.descFontSize, { color: c.dimColor, wordWrap: { width: textW } })));
      name.setY(mid - (name.displayHeight + what.height) / 2);
      what.setY(name.y + name.displayHeight);
      count.setY(name.y); // the kill count, level with the name
    });
    y += rows.height + c.gap;
    if (rows.pages > 1) {
      pager(this, cx, y + c.pagerHeight / 2, this.page, rows.pages, (d) => this.turnPage(d, rows.pages), c).forEach(add);
      y += c.pagerHeight + c.gap;
    }

    add(button(this, cx, y + c.backHeight / 2, 'Wróć', () => this.close(), { width: c.backWidth, height: c.backHeight, fontSize: c.backFontSize, variant: 'secondary' }));
    y += c.backHeight + c.padding;

    const top = Math.max(0, (height - y) / 2);
    for (const o of objs) o.y += top;
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
