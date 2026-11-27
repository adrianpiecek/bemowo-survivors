import { config } from '../config.js';
import { gymUpgrades } from '../data/gym.js';
import { save, writeSave, gymLevel } from '../state.js';
import { playMusic, playSfx } from '../systems/audio.js';
import { font, panel, button, touch, pager } from '../systems/ui.js';

// Between runs, from the main menu (MenuScene): spend protein on permanent upgrades. "Wróć", Esc or Enter go back to the menu.
// A purchase restarts the scene with { bought, cost, page }, so the new pip pops and the cost floats up from the protein.
// Rows that do not fit above the start button go on further pages ("<" ">" or the arrow keys).
export default class GymScene extends Phaser.Scene {
  constructor() { super('GymScene'); }

  create(data = {}) {
    const u = config.ui, gs = u.gymScreen, m = u.margin;
    const { width, height } = this.scale;
    // Rows in gs.columns columns (landscape: two), filled left to right.
    const totalW = gs.columns * gs.rowWidth + (gs.columns - 1) * gs.columnGap;
    const cx = width / 2, x0 = (width - totalW) / 2;
    const free = config.debug.freeProtein;
    const outline = { stroke: '#000000', strokeThickness: 5 };
    playMusic(this, 'gym');

    // Title on the left, protein on the right: the narrow screen has no room for both in the middle.
    const title = this.add.text(x0, gs.titleY, 'Siłownia', font(gs.titleFontSize, { fontStyle: 'bold', color: '#ffc400', ...outline }));

    // Protein in a pill, top right.
    const pr = gs.protein, prX = x0 + totalW - pr.width, prY = gs.titleY + (gs.titleFontSize * 1.2 - pr.height) / 2;
    panel(this, prX, prY, pr.width, pr.height);
    this.add.image(prX + gs.padding + pr.iconSize / 2, prY + pr.height / 2, 'coin_gold').setDisplaySize(pr.iconSize, pr.iconSize);
    const proteinText = this.add.text(prX + pr.width - gs.padding, prY + pr.height / 2, `${save.protein}${free ? ' (debug)' : ''}`,
      font(pr.fontSize, { fontStyle: 'bold' })).setOrigin(1, 0.5);
    // "Białko:" before the pill only where the title leaves room.
    const label = this.add.text(prX - gs.padding, prY + pr.height / 2, 'Białko:', font(gs.nameFontSize, { color: gs.descColor })).setOrigin(1, 0.5);
    if (label.x - label.width < title.x + title.width + gs.padding) label.destroy();

    const gymMaxLevel = Math.max(...gymUpgrades.map((up) => up.maxLevel));
    // Rows per page: as many as fit between the top and the start button (landscape: it sits on the right, so the bottom
    // edge); room for the pager only when one page is not enough.
    const step = gs.rowHeight + gs.rowGap, bottomY = height - gs.bottom - (gs.goRight ? 0 : gs.goHeight + gs.sectionGap);
    const fit = (room) => Math.max(1, Math.floor((room + gs.rowGap) / step)) * gs.columns;
    let perPage = fit(bottomY - gs.top);
    if (perPage < gymUpgrades.length) perPage = fit(bottomY - gs.top - gs.pagerGap - gs.pagerHeight);
    this.pages = Math.ceil(gymUpgrades.length / perPage);
    this.page = Phaser.Math.Clamp(data.page ?? 0, 0, this.pages - 1);
    const shown = gymUpgrades.slice(this.page * perPage, (this.page + 1) * perPage);
    shown.forEach((up, i) => {
      const x0 = (width - totalW) / 2 + (i % gs.columns) * (gs.rowWidth + gs.columnGap); // this row's left edge
      const y = gs.top + Math.floor(i / gs.columns) * (gs.rowHeight + gs.rowGap), mid = y + gs.rowHeight / 2;
      const level = gymLevel(up);
      const maxed = level >= up.maxLevel;
      const cost = maxed ? 0 : up.costs[level];
      const canBuy = !maxed && (free || save.protein >= cost);

      panel(this, x0, y, gs.rowWidth, gs.rowHeight, maxed ? { borderColor: gs.pipColor, borderAlpha: 0.6 } : {});
      this.add.image(x0 + gs.padding + gs.iconSize / 2, mid, up.icon).setDisplaySize(gs.iconSize, gs.iconSize);
      // Text column between the icon and the buy button: name, description, then pips and cost on the bottom line.
      const tx = x0 + gs.padding * 2 + gs.iconSize, textWidth = x0 + gs.rowWidth - gs.padding * 2 - gs.buyWidth - tx;
      const name = this.add.text(tx, y + gs.padding, up.name, font(gs.nameFontSize, { fontStyle: 'bold' }));
      this.add.text(tx, name.y + name.height + gs.descGap, up.description, font(gs.descFontSize, { color: gs.descColor, wordWrap: { width: textWidth } }));
      const lineY = y + gs.rowHeight - gs.padding - gs.costIconSize / 2;

      // One pip per level, gold when bought; the one just bought pops.
      for (let p = 0; p < up.maxLevel; p++) {
        const pip = this.add.rectangle(tx + p * (gs.pipSize + gs.pipGap) + gs.pipSize / 2, lineY, gs.pipSize, gs.pipSize,
          p < level ? gs.pipColor : gs.pipEmpty).setStrokeStyle(2, 0x000000);
        if (data.bought === up.id && p === level - 1) {
          pip.setScale(gs.popScale);
          this.tweens.add({ targets: pip, scale: 1, duration: gs.popMs, ease: 'Back.easeOut' });
        }
      }

      // Cost with the protein coin after the pips (the longest row of pips, so costs line up), and how much is missing.
      const costX = tx + gymMaxLevel * (gs.pipSize + gs.pipGap) + gs.costGap;
      if (maxed) {
        this.add.text(costX, lineY, 'MAX', font(gs.costFontSize, { fontStyle: 'bold', color: gs.maxColor })).setOrigin(0, 0.5);
      } else {
        const short = !free && !canBuy;
        this.add.image(costX + gs.costIconSize / 2, lineY, 'coin_gold').setDisplaySize(gs.costIconSize, gs.costIconSize);
        const costText = this.add.text(costX + gs.costIconSize + gs.pipGap, lineY, cost, font(gs.costFontSize, {
          fontStyle: 'bold', color: short ? gs.shortColor : '#ffffff',
        })).setOrigin(0, 0.5);
        if (short) {
          this.add.text(costText.x + costText.width + gs.pipGap * 2, lineY, `brakuje ${cost - save.protein}`, font(gs.shortFontSize, { color: gs.shortColor }))
            .setOrigin(0, 0.5);
        }
      }

      button(this, x0 + gs.rowWidth - gs.padding - gs.buyWidth / 2, mid, maxed ? 'Kupione' : 'Kup', () => this.buy(up), {
        width: gs.buyWidth, height: gs.buyHeight, fontSize: gs.buyFontSize, variant: canBuy ? 'primary' : 'disabled',
      });
    });

    // The last purchase's cost floats up from the protein and fades.
    if (data.cost) {
      const minus = this.add.text(proteinText.x, prY + pr.height, `-${data.cost}`, font(pr.fontSize, { fontStyle: 'bold', color: gs.shortColor, ...outline }))
        .setOrigin(1, 0);
      this.tweens.add({ targets: minus, y: minus.y + gs.floatPx, alpha: 0, duration: gs.floatMs, onComplete: () => minus.destroy() });
    }

    // Pager under the rows of a full page, so it stays put from page to page.
    let rowsBottom = gs.top + Math.ceil(shown.length / gs.columns) * step;
    if (this.pages > 1) {
      const py = gs.top + (perPage / gs.columns) * step + gs.pagerGap + gs.pagerHeight / 2;
      pager(this, cx, py, this.page, this.pages, (d) => this.turnPage(d), gs);
      rowsBottom = py + gs.pagerHeight / 2;
    }
    this.addBackButton(x0, totalW, cx);
  }

  // "Wróć" where the start button used to be: at the bottom (portrait) or bottom right (landscape).
  addBackButton(x0, totalW, cx) {
    const gs = config.ui.gymScreen, { height } = this.scale;
    const back = () => this.scene.start('MenuScene');
    const x = gs.goRight ? x0 + totalW - gs.goWidth / 2 : cx, y = height - gs.bottom - gs.goHeight / 2;
    button(this, x, y, 'Wróć', back, { width: gs.goWidth, height: gs.goHeight, fontSize: gs.goFontSize, variant: 'secondary' });
    if (!touch) this.add.text(x, height - gs.bottom - gs.goHeight - gs.pipGap, '[Esc]', font(gs.shortFontSize, { color: gs.descColor })).setOrigin(0.5, 1);
    this.input.keyboard.once('keydown-ESC', back);
    this.input.keyboard.once('keydown-ENTER', back);
  }

  buy(up) {
    const level = gymLevel(up);
    if (level >= up.maxLevel) return;
    const cost = config.debug.freeProtein ? 0 : up.costs[level];
    if (save.protein < cost) return;
    save.protein -= cost;
    save.gym[up.id] = level + 1;
    writeSave(save);
    playSfx(this, 'powerUp');
    this.scene.restart({ bought: up.id, cost, page: this.page }); // redraw levels, costs and protein
  }

  turnPage(dir) {
    const page = this.page + dir;
    if (page < 0 || page >= this.pages) return;
    this.scene.restart({ page });
  }
}
