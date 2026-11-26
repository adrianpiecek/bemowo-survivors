import { config } from '../config.js';
import { maps, mapUnlocked } from '../data/maps.js';
import { cardCenter } from '../systems/cards.js';
import { font, panel, button } from '../systems/ui.js';
import { startPlan } from './PlanScene.js';

const KEY_NAMES = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE'];

// Before a run (after the first one): one card per map (data/maps.js). An open one starts the plan screen on a click or
// its digit; a locked one shows what opens it. The pick goes to the registry ('map'), GameScene reads it.
// Wróć or Esc goes back to the menu.
export default class MapScene extends Phaser.Scene {
  constructor() { super('MapScene'); }

  create() {
    const u = config.ui, c = u.card, ms = u.mapScreen, { width, height } = this.scale;
    this.picked = false;
    this.add.text(width / 2, ms.titleY, 'Wybierz mapę', font(ms.titleFontSize, {
      fontStyle: 'bold', color: '#ffc400', stroke: '#000000', strokeThickness: 5,
    })).setOrigin(0.5, 0);

    const wrap = { align: 'center', wordWrap: { width: c.width - 2 * u.margin } };
    maps.forEach((map, i) => {
      const open = mapUnlocked(map), { x, y } = cardCenter(this, i, maps.length), top = y - c.height / 2;
      panel(this, x - c.width / 2, top, c.width, c.height, open ? {} : { alpha: ms.lockedAlpha });
      this.add.text(x, top + u.margin, map.name, font(c.nameFontSize, { fontStyle: 'bold', color: open ? '#ffffff' : ms.lockedColor, ...wrap }))
        .setOrigin(0.5, 0);
      this.add.text(x, y, open ? map.description : `Zablokowana. ${map.unlock.text}`, font(ms.textFontSize, {
        color: open ? ms.textColor : ms.lockedColor, ...wrap,
      })).setOrigin(0.5);
      if (!open) return;
      this.add.text(x, top + c.height - u.margin, `[${i + 1}]`, font(u.hudFontSize)).setOrigin(0.5, 1);
      this.add.zone(x, y, c.width, c.height).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.pick(map));
      this.input.keyboard.on(`keydown-${KEY_NAMES[i]}`, () => this.pick(map));
    });
    button(this, width / 2, height - ms.buttonBottom, 'Wróć [Esc]', () => this.scene.start('MenuScene'), { variant: 'secondary' });
    this.input.keyboard.on('keydown-ESC', () => this.scene.start('MenuScene'));
  }

  pick(map) {
    if (this.picked) return; // a click and a key press can land in the same frame
    this.picked = true;
    this.registry.set('map', map.id);
    startPlan(this);
  }
}
