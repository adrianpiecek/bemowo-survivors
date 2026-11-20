import { config } from '../config.js';
import { gymUpgrades } from '../data/gym.js';
import { save, writeSave, gymLevel } from '../state.js';
import { playMusic } from '../systems/audio.js';

// Between runs: spend protein on permanent upgrades, then start the next run.
export default class GymScene extends Phaser.Scene {
  constructor() { super('GymScene'); }

  create() {
    const u = config.ui, gs = u.gymScreen;
    const { width, height } = this.scale;
    const cx = width / 2;
    const free = config.debug.freeProtein;
    playMusic(this, 'gym');

    this.add.text(cx, gs.titleY, 'Siłownia', { fontSize: `${u.titleFontSize}px` }).setOrigin(0.5, 0);
    this.add.text(cx, gs.proteinY, `Białko: ${save.protein}${free ? ' (debug: za darmo)' : ''}`, { fontSize: `${u.hudFontSize}px` })
      .setOrigin(0.5, 0);

    gymUpgrades.forEach((up, i) => {
      const y = gs.top + i * gs.rowHeight;
      const level = gymLevel(up);
      const maxed = level >= up.maxLevel;
      const cost = maxed ? 0 : up.costs[level];
      const canBuy = !maxed && (free || save.protein >= cost);

      this.add.text(gs.nameX, y, up.name, { fontSize: `${u.hudFontSize}px` });
      this.add.text(gs.nameX, y + u.hudFontSize + u.margin / 2, up.description, { fontSize: `${gs.descFontSize}px`, color: '#aaaaaa' });
      this.add.text(gs.levelX, y, `${level}/${up.maxLevel}`, { fontSize: `${u.hudFontSize}px` }).setOrigin(0.5, 0);
      this.add.text(gs.costX, y, maxed ? 'MAX' : `${cost} białka`, { fontSize: `${u.hudFontSize}px` }).setOrigin(0, 0);

      const buy = this.add.text(gs.buyX, y, 'Kup', {
        fontSize: `${u.hudFontSize}px`,
        color: canBuy ? '#000000' : gs.disabledColor,
        backgroundColor: canBuy ? '#ffffff' : gs.disabledBg,
        padding: { x: u.buttonPadding, y: u.buttonPadding / 2 },
      }).setOrigin(0, 0);
      if (canBuy) buy.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.buy(up));
    });

    const quote = Phaser.Utils.Array.GetRandom(config.gym.quotes);
    const b = u.bubble;
    this.add.text(cx, height - gs.quoteBottom, `Bartek: "${quote}"`, {
      fontSize: `${b.fontSize}px`, color: '#000000', backgroundColor: '#ffffff', padding: { x: b.padding, y: b.padding },
    }).setOrigin(0.5, 1);
    this.add.text(cx, height - gs.quoteBottom + gs.definitionGap, Phaser.Utils.Array.GetRandom(config.bartkowanie.definitions), {
      fontSize: `${gs.descFontSize}px`, fontStyle: 'italic', color: gs.definitionColor,
    }).setOrigin(0.5, 0);

    this.add.text(cx, height - u.margin, 'Na Bemowo!', {
      fontSize: `${u.buttonFontSize}px`, color: '#000000', backgroundColor: '#ffffff', padding: { x: u.buttonPadding, y: u.buttonPadding },
    })
      .setOrigin(0.5, 1)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.scene.start('GameScene'));
  }

  buy(up) {
    const level = gymLevel(up);
    if (level >= up.maxLevel) return;
    const cost = config.debug.freeProtein ? 0 : up.costs[level];
    if (save.protein < cost) return;
    save.protein -= cost;
    save.gym[up.id] = level + 1;
    writeSave(save);
    this.scene.restart(); // redraw levels, costs and protein
  }
}
