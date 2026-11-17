import { config } from '../config.js';
import { xpToNextLevel, formatTime } from '../state.js';

// HUD on its own layer above GameScene. It reads `run` every frame, so GameScene never has to notify it.
export default class UIScene extends Phaser.Scene {
  constructor() { super('UIScene'); }

  init(data) { this.run = data.run; }

  create() {
    const u = config.ui, h = u.hud, m = u.margin;
    const { width, height } = this.scale;
    const font = { fontSize: `${u.hudFontSize}px` };
    const barFont = { fontSize: `${h.barFontSize}px` };

    this.bars = this.add.graphics();
    this.hpText = this.add.text(m + h.barWidth / 2, m + h.barHeight / 2, '', barFont).setOrigin(0.5);
    const xpY = m + h.barHeight + h.barGap;
    this.xpText = this.add.text(m + h.barWidth / 2, xpY + h.barHeight / 2, '', barFont).setOrigin(0.5);
    this.levelText = this.add.text(m, xpY + h.barHeight + h.barGap, '', font);
    this.timeText = this.add.text(width / 2, m, '', font).setOrigin(0.5, 0);
    this.killsText = this.add.text(width - m, m, '', font).setOrigin(1, 0);

    const w = u.welcome;
    const welcome = this.add.text(width / 2, height / 2, 'Witamy na Bemowie', { fontSize: `${w.fontSize}px` }).setOrigin(0.5);
    this.tweens.add({ targets: welcome, alpha: 0, delay: w.holdMs, duration: w.fadeMs, onComplete: () => welcome.destroy() });
  }

  update() {
    const r = this.run, pl = r.player, h = config.ui.hud, m = config.ui.margin;
    const xpNeed = xpToNextLevel(r.level);
    const xpY = m + h.barHeight + h.barGap;

    this.bars.clear();
    this.drawBar(m, h.hpColor, pl.hp / pl.maxHp);
    this.drawBar(xpY, h.xpColor, r.xp / xpNeed);

    // setText skips the redraw when the string is unchanged, so calling it every frame is cheap.
    this.hpText.setText(`HP ${pl.hp}/${pl.maxHp}`);
    this.xpText.setText(`XP ${r.xp}/${xpNeed}`);
    this.levelText.setText(`Poziom: ${r.level}`);
    // +999 so the clock shows 10:00 at the start instead of 9:59.
    this.timeText.setText(formatTime(config.run.durationSec * 1000 - r.elapsedMs + 999));
    this.killsText.setText(`Zabici: ${r.kills}`);
  }

  drawBar(y, color, fill) {
    const h = config.ui.hud, x = config.ui.margin;
    this.bars.fillStyle(h.barBg).fillRect(x, y, h.barWidth, h.barHeight);
    this.bars.fillStyle(color).fillRect(x, y, h.barWidth * Phaser.Math.Clamp(fill, 0, 1), h.barHeight);
  }
}
