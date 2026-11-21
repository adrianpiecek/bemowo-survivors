import { config } from '../config.js';
import { gymUpgrades } from '../data/gym.js';
import { save, writeSave, gymLevel } from '../state.js';
import { playMusic, playSfx } from '../systems/audio.js';
import { font, panel, drawPanel, button } from '../systems/ui.js';
import { openSettings } from './SettingsScene.js';
import { startRun } from './PlanScene.js';
import { betsOpen, betSum } from '../data/bets.js';

// Between runs: spend protein on permanent upgrades, then start the next run.
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
    // Settings (volume) next to the title; Esc opens them too.
    const gear = config.ui.settings.gearSize;
    this.add.image(title.x + title.width + gs.padding + gear / 2, title.y + title.height / 2, 'icon_gear').setDisplaySize(gear, gear)
      .setInteractive({ useHandCursor: true }).on('pointerdown', () => openSettings(this));
    // After the gear: Wyzwania (unlock conditions) behind the cup, Statystyki behind the chart, Bestiariusz behind the skull.
    const windows = [['icon_trophy', 'ChallengesScene'], ['icon_stats', 'StatsScene'], ['icon_bestiary', 'BestiaryScene']];
    windows.forEach(([icon, key], i) => {
      this.add.image(title.x + title.width + gs.padding * (i + 2) + gear * (i + 1.5), title.y + title.height / 2, icon).setDisplaySize(gear, gear)
        .setInteractive({ useHandCursor: true }).on('pointerdown', () => {
          this.scene.pause();
          this.scene.launch(key, { page: this.page });
        });
    });
    this.input.keyboard.on('keydown-ESC', () => openSettings(this));

    // Protein in a pill, top right.
    const pr = gs.protein, prX = x0 + totalW - pr.width, prY = gs.titleY + (gs.titleFontSize * 1.2 - pr.height) / 2;
    panel(this, prX, prY, pr.width, pr.height);
    this.add.image(prX + gs.padding + pr.iconSize / 2, prY + pr.height / 2, 'coin_gold').setDisplaySize(pr.iconSize, pr.iconSize);
    const proteinText = this.add.text(prX + pr.width - gs.padding, prY + pr.height / 2, `${save.protein}${free ? ' (debug)' : ''}`,
      font(pr.fontSize, { fontStyle: 'bold' })).setOrigin(1, 0.5);
    // "Białko:" before the pill only where the icons after the title leave room (portrait has none).
    const label = this.add.text(prX - gs.padding, prY + pr.height / 2, 'Białko:', font(gs.nameFontSize, { color: gs.descColor })).setOrigin(1, 0.5);
    const iconsRight = title.x + title.width + (windows.length + 1) * (gs.padding + gear);
    if (label.x - label.width < iconsRight + gs.padding) label.destroy();

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
      const py = gs.top + (perPage / gs.columns) * step + gs.pagerGap + gs.pagerHeight / 2, turn = (d) => this.turnPage(d);
      const pw = gs.pagerButton, opts = (on) => ({ width: pw, height: gs.pagerHeight, fontSize: gs.pagerFontSize, variant: on ? 'secondary' : 'disabled' });
      const label = this.add.text(cx, py, `Strona ${this.page + 1}/${this.pages}`, font(gs.pagerFontSize, { fontStyle: 'bold' })).setOrigin(0.5);
      button(this, label.x - label.width / 2 - gs.padding - pw / 2, py, '<', () => turn(-1), opts(this.page > 0));
      button(this, label.x + label.width / 2 + gs.padding + pw / 2, py, '>', () => turn(1), opts(this.page < this.pages - 1));
      this.input.keyboard.on('keydown-LEFT', () => turn(-1));
      this.input.keyboard.on('keydown-RIGHT', () => turn(1));
      rowsBottom = py + gs.pagerHeight / 2;
    }
    // Under the rows: Bartek with a speech bubble (a random quote) and a Bartkowanie definition; the start button at the bottom.
    // Landscape keeps the start button on the right, so Bartek only has to stay above the bottom edge there.
    const room = height - gs.bottom - (gs.goRight ? 0 : gs.goHeight + gs.sectionGap);
    if (rowsBottom + gs.sectionGap + gs.bartekHeight <= room) this.addQuote(x0, rowsBottom);
    this.addGoButtons(x0, totalW, cx);
  }

  // Bartek with a speech bubble (a random quote) and a Bartkowanie definition, under the rows.
  addQuote(x0, rowsBottom) {
    const gs = config.ui.gymScreen;
    const bartek = this.add.image(x0, rowsBottom + gs.sectionGap, 'bartek').setOrigin(0, 0);
    bartek.setScale(gs.bartekHeight / bartek.height);
    const bx = x0 + bartek.displayWidth + gs.quoteGap + gs.tail, by = bartek.y;
    const quote = this.add.text(bx + gs.padding, by + gs.padding, `„${Phaser.Utils.Array.GetRandom(config.gym.quotes)}”`,
      font(gs.quoteFontSize, { color: '#1b1b1b', fontStyle: 'bold', wordWrap: { width: gs.quoteWidth } }));
    const bw = quote.width + gs.padding * 2, bh = quote.height + gs.padding * 2;
    const bubble = this.add.graphics().setDepth(-1);
    drawPanel(bubble, bx, by, bw, bh, { color: 0xffffff, alpha: 1, borderColor: 0x000000, borderAlpha: 0.6 });
    bubble.fillStyle(0xffffff).fillTriangle(bx + 1, by + bh * 0.35, bx + 1, by + bh * 0.75, bx - gs.tail, by + bh * 0.7); // tail toward Bartek
    this.add.text(bx, by + bh + gs.padding, Phaser.Utils.Array.GetRandom(config.bartkowanie.definitions), font(gs.definitionFontSize, {
      fontStyle: 'italic', color: gs.definitionColor, wordWrap: { width: gs.quoteWidth + gs.padding * 2 },
    }));
  }

  addGoButtons(x0, totalW, cx) {
    const gs = config.ui.gymScreen, u = config.ui, { height } = this.scale;

    // "Na Bemowo!" at the bottom; after the first win "Zakłady z Unc" (with the bonus picked) left of it, the pair centred
    // (portrait) or on the right (landscape).
    const go = () => startRun(this); // the plan screen first
    const bt = u.bets, bets = betsOpen(), rowW = gs.goWidth + (bets ? bt.gymButtonGap + bt.gymButtonWidth : 0);
    const rowRight = gs.goRight ? x0 + totalW : cx + rowW / 2, goX = rowRight - gs.goWidth / 2, rowY = height - gs.bottom - gs.goHeight / 2;
    button(this, goX, rowY, 'Na Bemowo!', go, {
      width: gs.goWidth, height: gs.goHeight, fontSize: gs.goFontSize,
    });
    if (bets) {
      const sum = Math.round(betSum() * 100);
      button(this, rowRight - rowW + bt.gymButtonWidth / 2, rowY, `Zakłady z Unc\n${sum ? `+${sum}% białka` : 'bez zakładów'}`, () => {
        this.scene.pause();
        this.scene.launch('BetsScene');
      }, { width: bt.gymButtonWidth, height: gs.goHeight, fontSize: bt.gymButtonFontSize, variant: 'secondary' });
    }
    this.add.text(goX, height - gs.bottom - gs.goHeight - gs.pipGap, '[Enter]', font(gs.shortFontSize, { color: gs.descColor })).setOrigin(0.5, 1);
    this.input.keyboard.once('keydown-ENTER', go);
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
