import { config } from '../config.js';
import { gymUpgrades } from '../data/gym.js';
import { save, writeSave, gymLevel } from '../state.js';
import { playMusic, playSfx } from '../systems/audio.js';
import { font, panel, drawPanel, button } from '../systems/ui.js';

// Between runs: spend protein on permanent upgrades, then start the next run.
// A purchase restarts the scene with { bought, cost }, so the new pip pops and the cost floats up from the protein.
export default class GymScene extends Phaser.Scene {
  constructor() { super('GymScene'); }

  create(data = {}) {
    const u = config.ui, gs = u.gymScreen, m = u.margin;
    const { width, height } = this.scale;
    const cx = width / 2, x0 = (width - gs.rowWidth) / 2;
    const free = config.debug.freeProtein;
    const outline = { stroke: '#000000', strokeThickness: 5 };
    playMusic(this, 'gym');

    this.add.text(cx, gs.titleY, 'Siłownia', font(gs.titleFontSize, { fontStyle: 'bold', color: '#ffc400', ...outline })).setOrigin(0.5, 0);

    // Protein in a pill, top right.
    const pr = gs.protein, prX = x0 + gs.rowWidth - pr.width, prY = gs.titleY + (gs.titleFontSize * 1.2 - pr.height) / 2;
    panel(this, prX, prY, pr.width, pr.height);
    this.add.image(prX + gs.padding + pr.iconSize / 2, prY + pr.height / 2, 'coin_gold').setDisplaySize(pr.iconSize, pr.iconSize);
    const proteinText = this.add.text(prX + pr.width - gs.padding, prY + pr.height / 2, `${save.protein}${free ? ' (debug)' : ''}`,
      font(pr.fontSize, { fontStyle: 'bold' })).setOrigin(1, 0.5);
    this.add.text(prX - gs.padding, prY + pr.height / 2, 'Białko:', font(gs.nameFontSize, { color: gs.descColor })).setOrigin(1, 0.5);

    gymUpgrades.forEach((up, i) => {
      const y = gs.top + i * (gs.rowHeight + gs.rowGap), mid = y + gs.rowHeight / 2;
      const level = gymLevel(up);
      const maxed = level >= up.maxLevel;
      const cost = maxed ? 0 : up.costs[level];
      const canBuy = !maxed && (free || save.protein >= cost);

      panel(this, x0, y, gs.rowWidth, gs.rowHeight, maxed ? { borderColor: gs.pipColor, borderAlpha: 0.6 } : {});
      this.add.image(x0 + gs.padding + gs.iconSize / 2, mid, up.icon).setDisplaySize(gs.iconSize, gs.iconSize);
      const tx = x0 + gs.padding * 2 + gs.iconSize;
      this.add.text(tx, mid - gs.rowHeight * 0.06, up.name, font(gs.nameFontSize, { fontStyle: 'bold' })).setOrigin(0, 1);
      this.add.text(tx, mid + gs.rowHeight * 0.06, up.description, font(gs.descFontSize, { color: gs.descColor })).setOrigin(0, 0);

      // One pip per level, gold when bought; the one just bought pops.
      for (let p = 0; p < up.maxLevel; p++) {
        const pip = this.add.rectangle(x0 + gs.pipX + p * (gs.pipSize + gs.pipGap) + gs.pipSize / 2, mid, gs.pipSize, gs.pipSize,
          p < level ? gs.pipColor : gs.pipEmpty).setStrokeStyle(2, 0x000000);
        if (data.bought === up.id && p === level - 1) {
          pip.setScale(gs.popScale);
          this.tweens.add({ targets: pip, scale: 1, duration: gs.popMs, ease: 'Back.easeOut' });
        }
      }

      // Cost with the protein coin, and how much is missing when it is too much.
      if (maxed) {
        this.add.text(x0 + gs.costX, mid, 'MAX', font(gs.costFontSize, { fontStyle: 'bold', color: gs.maxColor })).setOrigin(0, 0.5);
      } else {
        // Too expensive: cost and coin move up, "brakuje X" goes under them.
        const short = !free && !canBuy, cy = short ? mid - gs.costFontSize / 2 : mid;
        this.add.image(x0 + gs.costX + gs.costIconSize / 2, cy, 'coin_gold').setDisplaySize(gs.costIconSize, gs.costIconSize);
        this.add.text(x0 + gs.costX + gs.costIconSize + gs.pipGap, cy, cost, font(gs.costFontSize, {
          fontStyle: 'bold', color: short ? gs.shortColor : '#ffffff',
        })).setOrigin(0, 0.5);
        if (short) this.add.text(x0 + gs.costX, mid + gs.pipGap, `brakuje ${cost - save.protein}`, font(gs.shortFontSize, { color: gs.shortColor }));
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

    // Bottom: Bartek with a speech bubble (a random quote), a Bartkowanie definition under it, the start button on the right.
    const bartek = this.add.image(x0, height - gs.bottom, 'bartek').setOrigin(0, 1);
    bartek.setScale(gs.bartekHeight / bartek.height);
    const bx = x0 + bartek.displayWidth + gs.quoteGap + gs.tail, by = height - gs.bottom - gs.bartekHeight;
    const quote = this.add.text(bx + gs.padding, by + gs.padding, `„${Phaser.Utils.Array.GetRandom(config.gym.quotes)}”`,
      font(gs.quoteFontSize, { color: '#1b1b1b', fontStyle: 'bold', wordWrap: { width: gs.quoteWidth } }));
    const bw = quote.width + gs.padding * 2, bh = quote.height + gs.padding * 2;
    const bubble = this.add.graphics().setDepth(-1);
    drawPanel(bubble, bx, by, bw, bh, { color: 0xffffff, alpha: 1, borderColor: 0x000000, borderAlpha: 0.6 });
    bubble.fillStyle(0xffffff).fillTriangle(bx + 1, by + bh * 0.35, bx + 1, by + bh * 0.75, bx - gs.tail, by + bh * 0.7); // tail toward Bartek
    this.add.text(bx, by + bh + gs.padding, Phaser.Utils.Array.GetRandom(config.bartkowanie.definitions), font(gs.definitionFontSize, {
      fontStyle: 'italic', color: gs.definitionColor, wordWrap: { width: gs.quoteWidth + gs.padding * 2 },
    }));

    const go = () => this.scene.start('GameScene');
    button(this, x0 + gs.rowWidth - gs.goWidth / 2, height - gs.bottom - gs.goHeight / 2, 'Na Bemowo!', go, {
      width: gs.goWidth, height: gs.goHeight, fontSize: gs.goFontSize,
    });
    this.add.text(x0 + gs.rowWidth - gs.goWidth / 2, height - gs.bottom - gs.goHeight - gs.pipGap, '[Enter]',
      font(gs.shortFontSize, { color: gs.descColor })).setOrigin(0.5, 1);
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
    this.scene.restart({ bought: up.id, cost }); // redraw levels, costs and protein
  }
}
