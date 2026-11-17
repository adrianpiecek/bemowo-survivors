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

    this.createJoystick();

    const bn = u.banner;
    this.banner = this.add.text(width / 2, bn.y, '', {
      fontSize: `${bn.fontSize}px`, fontStyle: 'bold', color: '#ffffff', stroke: '#000000', strokeThickness: bn.strokeThickness,
    }).setOrigin(0.5).setDepth(1).setVisible(false);

    const w = u.welcome;
    const welcome = this.add.text(width / 2, height / 2, 'Witamy na Bemowie', { fontSize: `${w.fontSize}px` }).setOrigin(0.5);
    this.tweens.add({ targets: welcome, alpha: 0, delay: w.holdMs, duration: w.fadeMs, onComplete: () => welcome.destroy() });
  }

  // Shared pickup banner: big outlined text in the middle of the screen. Runs on this scene's clock,
  // so it keeps counting while GameScene is paused.
  showBanner(text) {
    this.banner.setText(text).setVisible(true);
    this.bannerTimer?.remove();
    this.bannerTimer = this.time.delayedCall(config.ui.banner.durationMs, () => this.banner.setVisible(false));
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

  // Floating joystick for touch screens: it appears where the finger lands. Mouse clicks are ignored.
  createJoystick() {
    const j = config.ui.joystick, move = this.run.touchMove;
    const base = this.add.circle(0, 0, j.radius, j.color, j.baseAlpha).setVisible(false);
    const knob = this.add.circle(0, 0, j.knobRadius, j.color, j.knobAlpha).setVisible(false);
    let active = null;

    this.input.on('pointerdown', (p) => {
      if (!p.wasTouch || active) return;
      active = p;
      base.setPosition(p.x, p.y).setVisible(true);
      knob.setPosition(p.x, p.y).setVisible(true);
    });
    this.input.on('pointermove', (p) => {
      if (p !== active) return;
      const dx = p.x - base.x, dy = p.y - base.y;
      const k = Math.min(1, j.radius / (Math.hypot(dx, dy) || 1)); // keep the knob inside the base
      knob.setPosition(base.x + dx * k, base.y + dy * k);
      move.x = (dx * k) / j.radius;
      move.y = (dy * k) / j.radius;
      if (Math.hypot(move.x, move.y) < j.deadZone) move.x = move.y = 0;
    });
    const release = (p) => {
      if (p !== active) return;
      active = null;
      base.setVisible(false);
      knob.setVisible(false);
      move.x = move.y = 0;
    };
    this.input.on('pointerup', release);
    this.input.on('pointerupoutside', release);
  }

  drawBar(y, color, fill) {
    const h = config.ui.hud, x = config.ui.margin;
    this.bars.fillStyle(h.barBg).fillRect(x, y, h.barWidth, h.barHeight);
    this.bars.fillStyle(color).fillRect(x, y, h.barWidth * Phaser.Math.Clamp(fill, 0, 1), h.barHeight);
  }
}
