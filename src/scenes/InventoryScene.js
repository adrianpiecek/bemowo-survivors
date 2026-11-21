import { config } from '../config.js';
import { items } from '../data/items.js';
import { font, drawPanel, button } from '../systems/ui.js';

// Ekwipunek, from the pause screen: Bartek's weapons and passives with their levels, the items with how many, and his
// stats from every source (config, gym, cards, items) as they are now. Wróć, Esc, Enter or I go back to the pause screen.
const num = (x, digits = 0) => (Math.round(x * 10 ** digits) / 10 ** digits).toString().replace('.', ',');
const pct = (x) => `${x >= 0 ? '+' : ''}${Math.round(x * 100)}%`;

export default class InventoryScene extends Phaser.Scene {
  constructor() { super('InventoryScene'); }

  init(data) {
    this.from = data.from;
    this.closing = false;
  }

  create() {
    const u = config.ui, c = u.inventory, { width, height } = this.scale, cx = width / 2, x0 = cx - c.width / 2;
    const run = this.scene.get(this.from).run, pl = run.player;
    this.add.rectangle(0, 0, width, height, 0x000000, u.dimAlpha).setOrigin(0).setInteractive(); // swallows taps for the run below
    const bg = this.add.graphics(); // the panel, drawn once the content's height is known

    // Top to bottom from y; the whole block is moved to the middle of the screen at the end.
    const objs = [];
    const add = (o) => { objs.push(o); return o; };
    let y = c.padding;
    const title = add(this.add.text(cx, y, 'Ekwipunek', font(c.titleFontSize, { fontStyle: 'bold', color: '#ffc400' })).setOrigin(0.5, 0));
    y += title.height + c.gap;

    // A heading, then its entries in c.columns columns: icon, name, and the level or count under it.
    const colW = (c.width - c.padding * 2) / c.columns;
    const section = (head, entries) => {
      const h = add(this.add.text(x0 + c.padding, y, head, font(c.headFontSize, { fontStyle: 'bold', color: c.headColor })));
      y += h.height + c.gap / 2;
      if (!entries.length) {
        y += add(this.add.text(x0 + c.padding, y, 'brak', font(c.textFontSize, { color: c.dimColor }))).height + c.gap;
        return;
      }
      entries.forEach(([icon, name, sub, subColor], i) => {
        const ex = x0 + c.padding + (i % c.columns) * colW, ey = y + Math.floor(i / c.columns) * c.rowHeight, mid = ey + c.rowHeight / 2;
        add(this.add.image(ex + c.iconSize / 2, mid, icon).setDisplaySize(c.iconSize, c.iconSize));
        const tx = ex + c.iconSize + c.gap / 2, tw = colW - c.iconSize - c.gap;
        const n = add(this.add.text(tx, 0, name, font(c.nameFontSize, { fontStyle: 'bold', fixedWidth: tw })));
        const s = add(this.add.text(tx, 0, sub, font(c.textFontSize, { color: subColor ?? c.dimColor, fixedWidth: tw })));
        n.setY(mid - (n.height + s.height) / 2);
        s.setY(n.y + n.height);
      });
      y += Math.ceil(entries.length / c.columns) * c.rowHeight + c.gap;
    };

    section(`Bronie ${run.weapons.length}/${pl.weaponSlots}`, run.weapons.map((w) => (w.evolved
      ? [w.def.evolution.icon, w.def.evolution.name, 'EWOLUCJA', c.evoColor]
      : [w.def.icon, w.def.name, `poz. ${w.level}/${w.def.maxLevel}`])));
    section(`Pasywki ${run.passives.length}/${pl.passiveSlots}`, run.passives.map((p) => [p.def.icon, p.def.name, `poz. ${p.level}/${p.def.maxLevel}`]));
    section('Przedmioty', items.filter((it) => run.items[it.id]).map((it) => [it.icon, it.name, `x${run.items[it.id]}  ${it.description}`]));

    // Stats in c.statColumns columns, label left and value right.
    const stats = [
      ['HP', `${Math.ceil(pl.hp)}/${Math.round(pl.maxHp)}`],
      ['Regeneracja', `${num(pl.regen * 60, 1)} HP/min`],
      ['Pancerz', `${pl.armor}`],
      ['Unik', `${Math.round(pl.dodge * 100)}%`],
      ['Szybkość', `${Math.round(pl.speed)}`],
      ['Obrażenia', pct(pl.damageMult - 1)],
      ['Czas odnowienia', pct(pl.cooldownMult - 1)],
      ['Obszar', pct(pl.area - 1)],
      ['Czas działania', pct(pl.duration - 1)],
      ['Dodatkowe pociski', `+${pl.amount}`],
      ['Szansa na kryt', `${Math.round(pl.critChance * 100)}%`],
      ['Obrażenia krytyka', `x${num(pl.critMult, 2)}`],
      ['Obrażenia z bliska', pct(pl.closeDamage)],
      ['Częstość elit', pct(pl.eliteRate - 1)],
      ['Szczęście', pct(pl.luck - 1)],
      ['XP', pct(pl.growth - 1)],
      ['Zbieranie', `${Math.round(pl.magnetRadius)} px`],
      ['Zasięg pistoletu', `${Math.round(pl.range)} px`],
    ];
    const head = add(this.add.text(x0 + c.padding, y, 'Statystyki', font(c.headFontSize, { fontStyle: 'bold', color: c.headColor })));
    y += head.height + c.gap / 2;
    const statW = (c.width - c.padding * 2 - (c.statColumns - 1) * c.gap * 2) / c.statColumns, perCol = Math.ceil(stats.length / c.statColumns);
    stats.forEach(([label, value], i) => {
      const sx = x0 + c.padding + Math.floor(i / perCol) * (statW + c.gap * 2), sy = y + (i % perCol) * c.statHeight;
      add(this.add.text(sx, sy, label, font(c.textFontSize, { color: c.dimColor })));
      add(this.add.text(sx + statW, sy, value, font(c.textFontSize, { fontStyle: 'bold' })).setOrigin(1, 0));
    });
    y += perCol * c.statHeight + c.gap;

    add(button(this, cx, y + c.backHeight / 2, 'Wróć', () => this.close(), { width: c.backWidth, height: c.backHeight, fontSize: c.backFontSize }));
    y += c.backHeight + c.padding;

    const top = Math.max(0, (height - y) / 2);
    for (const o of objs) o.y += top;
    drawPanel(bg, x0, top, c.width, y);

    for (const key of ['ESC', 'ENTER', 'I']) this.input.keyboard.once(`keydown-${key}`, () => this.close());
  }

  // Back to the pause screen; the run under it stays paused.
  close() {
    if (this.closing) return; // a click and a key press can land in the same frame
    this.closing = true;
    this.scene.stop();
    this.scene.launch('SettingsScene', { from: this.from });
  }
}
