import { config } from '../config.js';
import { maps, mapUnlocked, mapLevel, mapLevelMax, pickMapLevel } from '../data/maps.js';
import { cardCenter, pickCard } from '../systems/cards.js';
import { font, panel, button, keyHint } from '../systems/ui.js';
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
      if (open) pickCard(this, i, maps.length, () => this.pick(map));
      else panel(this, x - c.width / 2, top, c.width, c.height, { alpha: ms.lockedAlpha });
      this.add.text(x, top + u.margin, map.name, font(c.nameFontSize, { fontStyle: 'bold', color: open ? '#ffffff' : ms.lockedColor, ...wrap }))
        .setOrigin(0.5, 0);
      this.add.text(x, y, open ? map.description : `Zablokowana. ${map.unlock.text}`, font(ms.textFontSize, {
        color: open ? ms.textColor : ms.lockedColor, ...wrap,
      })).setOrigin(0.5);
      if (!open) return;
      this.input.keyboard.on(`keydown-${KEY_NAMES[i]}`, () => this.pick(map));
      this.levelRow(map, x, y + ms.levelY);
    });
    button(this, width / 2, height - ms.buttonBottom, keyHint('Wróć', '[Esc]'), () => this.scene.start('MenuScene'), { variant: 'secondary' });
    this.input.keyboard.on('keydown-ESC', () => this.scene.start('MenuScene'));
  }

  // "Trudność 2/3" with its bonus, and < > to change it once a higher level is open (over the card's zone, so a click
  // on them does not start the run).
  levelRow(map, x, y) {
    const ms = config.ui.mapScreen, dc = config.difficulty, max = mapLevelMax(map), level = mapLevel(map);
    const text = max > 1
      ? `Trudność ${level}/${max}${level > 1 ? `: +${Math.round(dc.proteinPct * (level - 1) * 100)}% białka` : ''}`
      : 'Trudność 1. Wygraj tu, by otworzyć 2';
    const wrap = { align: 'center', wordWrap: { width: config.ui.card.width - 2 * config.ui.margin } }; // narrow landscape cards
    this.add.text(x, y, text, font(ms.levelFontSize, { color: ms.levelColor, ...wrap })).setOrigin(0.5);
    if (max < 2) return;
    const step = (d) => () => {
      pickMapLevel(map, level + d);
      this.scene.restart();
    };
    const opts = { width: ms.arrow, height: ms.arrow, fontSize: ms.levelFontSize, variant: 'secondary' };
    if (level > 1) button(this, x - ms.arrowGap - ms.arrow / 2, y, '<', step(-1), opts);
    if (level < max) button(this, x + ms.arrowGap + ms.arrow / 2, y, '>', step(1), opts);
  }

  pick(map) {
    if (this.picked) return; // a click and a key press can land in the same frame
    this.picked = true;
    this.registry.set('map', map.id);
    this.registry.set('difficulty', mapLevel(map));
    startPlan(this);
  }
}
