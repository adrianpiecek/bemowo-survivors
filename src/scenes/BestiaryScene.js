import { config } from '../config.js';
import { save } from '../state.js';
import { enemies } from '../data/enemies.js';
import { bossHint } from '../data/bossPowers.js';
import { maps, enemyName, bestiaryKey } from '../data/maps.js';
import { font, panel, drawPanel, button, dim, pageRows, pager } from '../systems/ui.js';

// Bestiariusz over the paused gym: every enemy type and boss (data/enemies.js) with how many Bartek killed over all runs
// (save.bestiary). One never killed shows as a black shape with "???". A type another map dresses up (maps' looks and
// names: Fort Bema's Bartkowie) has its own entry there too, counted apart ("Zombie" and "Binion"). More than fit on the
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
    // One entry per type, then the types again as each map dresses them up (maps' looks: Fort Bema's Bartkowie), with
    // their own kill counts (data/maps.js bestiaryKey).
    const entries = [
      ...enemies.map((d) => ({ d, key: d.id, texture: d.texture, name: d.name, map: null })),
      ...maps.filter((m) => m.looks).flatMap((m) => enemies.filter((d) => m.looks[d.texture])
        .map((d) => ({ d, key: bestiaryKey(d, m.id), texture: m.looks[d.texture], name: enemyName(d, m.id), map: m }))),
    ];
    const known = entries.filter((e) => save.bestiary[e.key]).length;
    const intro = add(this.add.text(cx, y, `Pokonane rodzaje: ${known}/${entries.length}. Pomarańczowa ramka: boss.`,
      font(c.textFontSize, { color: c.dimColor, align: 'center', wordWrap: { width: c.width - c.padding * 2 } })).setOrigin(0.5, 0));
    y += intro.height + c.gap;

    const rows = pageRows(entries, this.page, height - c.margin * 2 - y - (c.gap + c.backHeight + c.padding), c);
    this.page = rows.page;
    rows.shown.forEach(({ d, key, texture, name: label, map }, i) => {
      const kills = save.bestiary[key] ?? 0, rx = x0 + c.padding + (i % c.columns) * (rowW + c.columnGap);
      const ry = y + Math.floor(i / c.columns) * (c.rowHeight + c.rowGap), mid = ry + c.rowHeight / 2;
      add(panel(this, rx, ry, rowW, c.rowHeight, d.isBoss ? { borderColor: c.bossColor, borderAlpha: 1 } : {}));
      // The enemy's picture fitted into the icon square; never killed: a black shape.
      const img = add(this.add.image(rx + c.inner + c.iconSize / 2, mid, texture));
      img.setScale(Math.min(c.iconSize / img.width, c.iconSize / img.height));
      if (!kills) img.setTintFill(0x000000);
      const tx = rx + c.inner * 2 + c.iconSize, textW = rx + rowW - c.inner - tx;
      const name = add(this.add.text(tx, 0, kills ? label : '???', font(c.nameFontSize, { fontStyle: 'bold', color: d.isBoss ? c.bossText : '#ffffff' })));
      const count = add(this.add.text(rx + rowW - c.inner, 0, kills ? `${kills}` : '', font(c.nameFontSize, { fontStyle: 'bold', color: '#ffc400' })).setOrigin(1, 0));
      const where = map ? `${map.name}. ` : ''; // a dressed-up entry says where it lives
      const text = !kills ? `${where}Jeszcze nie pokonany.` : `${where}${d.isBoss ? `Boss. ${bossHint(d.id, map?.id)}` : d.description}`;
      const what = add(this.add.text(tx, 0, text, font(c.descFontSize, { color: c.dimColor, wordWrap: { width: textW } })));
      name.setY(mid - (name.height + what.height) / 2);
      what.setY(name.y + name.height);
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
