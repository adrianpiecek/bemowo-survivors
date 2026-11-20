import { config } from '../config.js';
import { xpToNextLevel, formatTime } from '../state.js';
import { isEffectActive } from '../systems/effects.js';
import { pickups } from '../data/pickups.js';

// HUD on its own layer above GameScene. It reads `run` every frame, so GameScene never has to notify it.
export default class UIScene extends Phaser.Scene {
  constructor() { super('UIScene'); }

  init(data) { this.run = data.run; }

  create() {
    const u = config.ui, h = u.hud, m = u.margin;
    const { width, height } = this.scale;
    const font = { fontSize: `${u.hudFontSize}px` };
    const barFont = { fontSize: `${h.barFontSize}px` };

    // Bartkowanie "Żółty sweter mocy": the whole screen goes yellow, under the HUD.
    const bk = config.bartkowanie;
    this.yellow = this.add.rectangle(0, 0, width, height, bk.yellowColor, bk.yellowAlpha).setOrigin(0).setVisible(false);
    this.bars = this.add.graphics();
    this.hpText = this.add.text(m + h.barWidth / 2, m + h.barHeight / 2, '', barFont).setOrigin(0.5);
    const xpY = m + h.barHeight + h.barGap;
    this.xpText = this.add.text(m + h.barWidth / 2, xpY + h.barHeight / 2, '', barFont).setOrigin(0.5);
    this.levelText = this.add.text(m, xpY + h.barHeight + h.barGap, '', font);
    const tankY = this.levelText.y + u.hudFontSize + h.barGap;
    this.tankBar = new Phaser.Geom.Rectangle(m, tankY, h.barWidth, h.barHeight);
    this.tankText = this.add.text(m + h.barWidth / 2, tankY + h.barHeight / 2, '', barFont).setOrigin(0.5);
    this.timeText = this.add.text(width / 2, m, '', font).setOrigin(0.5, 0);
    this.killsText = this.add.text(width - m, m, '', font).setOrigin(1, 0);

    const bb = u.bossBar;
    this.bossText = this.add.text(width / 2, bb.y + bb.height / 2, 'GOLF', { fontSize: `${bb.fontSize}px`, fontStyle: 'bold' })
      .setOrigin(0.5).setVisible(false);

    this.createJoystick();

    // Icons of active timed pickup effects, one per pickup that has an effect; bars are drawn in update.
    const eh = u.effectHud;
    this.effectIcons = pickups.filter((d) => d.effect).map((d) => ({
      effect: d.effect,
      image: this.add.image(0, 0, d.icon ?? 'pickup').setDisplaySize(eh.iconSize, eh.iconSize).setOrigin(0).setVisible(false),
    }));
    this.effectTop = tankY + h.barHeight + h.barGap;

    const pa = u.pickupArrow;
    this.pickupArrow = this.add.triangle(0, 0, pa.size, pa.size / 2, 0, 0, 0, pa.size, pa.color).setVisible(false);

    const tb = u.tankButton;
    this.tankButton = this.add.container(width - tb.margin - tb.radius, height - tb.margin - tb.radius, [
      this.add.circle(0, 0, tb.radius, tb.color, tb.alpha).setStrokeStyle(3, 0xffffff),
      this.add.text(0, 0, 'CZOŁG!', { fontSize: `${tb.fontSize}px`, fontStyle: 'bold' }).setOrigin(0.5),
    ]).setSize(tb.radius * 2, tb.radius * 2).setVisible(false)
      .setInteractive(new Phaser.Geom.Circle(tb.radius, tb.radius, tb.radius), Phaser.Geom.Circle.Contains)
      .on('pointerdown', () => this.scene.get('GameScene').activateTank());

    this.balanceText = null; // the scene object outlives restarts, so never keep last run's text
    if (config.debug.balanceOverlay) {
      this.balanceText = this.add.text(width - m, m + u.hudFontSize + h.barGap, '', { fontSize: `${h.barFontSize}px`, align: 'right' })
        .setOrigin(1, 0).setDepth(2);
      this.balanceSamples = []; // one per second of run time: { t, spawned, kills, dmg }
    }

    const bn = u.banner;
    this.banner = this.add.text(width / 2, bn.y, '', {
      fontSize: `${bn.fontSize}px`, fontStyle: 'bold', color: '#ffffff', stroke: '#000000', strokeThickness: bn.strokeThickness,
    }).setOrigin(0.5).setDepth(1).setVisible(false);
    this.bannerSub = this.add.text(width / 2, bn.y + bn.fontSize / 2, '', {
      fontSize: `${bn.subFontSize}px`, color: '#ffffff', stroke: '#000000', strokeThickness: bn.subStrokeThickness,
    }).setOrigin(0.5, 0).setDepth(1).setVisible(false);

    const w = u.welcome;
    const welcome = this.add.text(width / 2, height / 2, 'Witamy na Bemowie', { fontSize: `${w.fontSize}px` }).setOrigin(0.5);
    this.tweens.add({ targets: welcome, alpha: 0, delay: w.holdMs, duration: w.fadeMs, onComplete: () => welcome.destroy() });
  }

  // Shared pickup banner: big outlined text in the middle of the screen. Runs on this scene's clock,
  // so it keeps counting while GameScene is paused.
  showBanner(text, subtext = '', durationMs = config.ui.banner.durationMs) {
    this.banner.setText(text).setVisible(true);
    this.bannerSub.setText(subtext).setVisible(true);
    this.bannerTimer?.remove();
    this.bannerTimer = this.time.delayedCall(durationMs, () => {
      this.banner.setVisible(false);
      this.bannerSub.setVisible(false);
    });
  }

  update() {
    const r = this.run, pl = r.player, h = config.ui.hud, m = config.ui.margin;
    const xpNeed = xpToNextLevel(r.level);
    const xpY = m + h.barHeight + h.barGap;

    this.yellow.setVisible(isEffectActive(r, 'yellowSweater'));
    this.bars.clear();
    this.drawBar(m, h.hpColor, pl.hp / pl.maxHp);
    this.drawBar(xpY, h.xpColor, r.xp / xpNeed);
    const t = config.tank, full = r.tankCharge >= t.killsToCharge;
    const blink = full && Math.floor(this.time.now / t.barBlinkMs) % 2;
    this.drawBar(this.tankBar.y, blink ? h.tankBlinkColor : h.tankColor,
      r.tankMs > 0 ? r.tankMs / (t.durationSec * 1000) : r.tankCharge / t.killsToCharge);

    // setText skips the redraw when the string is unchanged, so calling it every frame is cheap.
    this.hpText.setText(`HP ${pl.hp}/${pl.maxHp}`);
    this.xpText.setText(`XP ${r.xp}/${xpNeed}`);
    this.levelText.setText(`Poziom: ${r.level}`);
    // +999 so the clock shows 10:00 at the start instead of 9:59.
    this.timeText.setText(formatTime(config.run.durationSec * 1000 - r.elapsedMs + 999));
    this.killsText.setText(`Zabici: ${r.kills}`);
    // Boss HP bar, top center, only while the Golf is on the map.
    const boss = this.scene.get('GameScene').boss, bb = config.ui.bossBar;
    const bossOn = !!boss?.active && boss.stats.isBoss; // pooled: the same sprite may be a zombie later
    this.bossText.setVisible(bossOn);
    if (bossOn) {
      const x = (this.scale.width - bb.width) / 2;
      this.bars.fillStyle(h.barBg).fillRect(x, bb.y, bb.width, bb.height);
      this.bars.fillStyle(bb.color).fillRect(x, bb.y, bb.width * Phaser.Math.Clamp(boss.hp / boss.stats.hp, 0, 1), bb.height);
    }
    this.tankButton.setVisible(full && r.tankMs <= 0);
    this.updateEffectHud();
    this.updatePickupArrow();
    if (this.balanceText) this.updateBalance();
    this.tankText.setText(r.tankMs > 0 ? `CZOŁG ${Math.ceil(r.tankMs / 1000)} s`
      : full ? 'CZOŁG GOTOWY!' : `Czołg ${r.tankCharge}/${t.killsToCharge}`);
  }

  // Active timed effects, stacked under the tank bar: icon, then a bar of the time left.
  updateEffectHud() {
    const eh = config.ui.effectHud, m = config.ui.margin, h = config.ui.hud;
    let y = this.effectTop;
    for (const { effect, image } of this.effectIcons) {
      const e = this.run.effects[effect];
      image.setVisible(!!e);
      if (!e) continue;
      image.setPosition(m, y);
      const bx = m + eh.iconSize + eh.gap, by = y + (eh.iconSize - eh.barHeight) / 2;
      this.bars.fillStyle(h.barBg).fillRect(bx, by, eh.barWidth, eh.barHeight);
      this.bars.fillStyle(eh.color).fillRect(bx, by, eh.barWidth * Phaser.Math.Clamp(e.remainingMs / e.durationMs, 0, 1), eh.barHeight);
      y += eh.iconSize + eh.gap;
    }
  }

  // Arrow on the screen edge toward the nearest pickup lying off screen; hidden when none is.
  updatePickupArrow() {
    const gs = this.scene.get('GameScene'), cam = gs.cameras.main, view = cam.worldView, pa = config.ui.pickupArrow;
    const cx = view.centerX, cy = view.centerY;
    let best = null, bestD = Infinity;
    for (const p of gs.pickups.getChildren()) {
      if (!p.active || view.contains(p.x, p.y)) continue;
      const d = Phaser.Math.Distance.Squared(cx, cy, p.x, p.y);
      if (d < bestD) { bestD = d; best = p; }
    }
    this.pickupArrow.setVisible(!!best);
    if (!best) return;
    // Scale the direction until it touches the screen rectangle shrunk by the margin.
    const dx = best.x - cx, dy = best.y - cy, { width, height } = this.scale;
    const k = Math.min((width / 2 - pa.margin) / Math.abs(dx || 1e-6), (height / 2 - pa.margin) / Math.abs(dy || 1e-6));
    this.pickupArrow.setPosition(width / 2 + dx * k, height / 2 + dy * k).setRotation(Math.atan2(dy, dx));
  }

  // Debug: rates over the last balanceWindowSec of run time, from a sample taken every second.
  updateBalance() {
    const r = this.run, s = this.balanceSamples, win = config.ui.balanceWindowSec;
    if (!s.length || r.elapsedMs - s[s.length - 1].t >= 1000) {
      s.push({ t: r.elapsedMs, spawned: r.spawned, kills: r.kills, dmg: r.damageDealt });
      while (s.length > win + 1) s.shift();
    }
    const a = s[0], b = s[s.length - 1], sec = Math.max(1, (b.t - a.t) / 1000);
    const per = (k) => ((b[k] - a[k]) / sec).toFixed(1);
    const pl = r.player, gs = this.scene.get('GameScene');
    const dpsMax = pl.bulletDamage * pl.bulletsPerShot * 1000 / pl.fireRateMs;
    this.balanceText.setText([
      `wrogowie ${gs.enemies.countActive(true)}`,
      `spawn/s ${per('spawned')}   zabici/s ${per('kills')}`,
      `DPS ${per('dmg')} (pistolet max ${dpsMax.toFixed(0)})`,
      `HP zombie x${(1 + config.spawn.hpPerMinutePct * r.elapsedMs / 60000).toFixed(2)}`,
    ].join('\n'));
  }

  // Floating joystick for touch screens: it appears where the finger lands. Mouse clicks are ignored.
  createJoystick() {
    const j = config.ui.joystick, move = this.run.touchMove;
    const base = this.add.circle(0, 0, j.radius, j.color, j.baseAlpha).setVisible(false);
    const knob = this.add.circle(0, 0, j.knobRadius, j.color, j.knobAlpha).setVisible(false);
    let active = null;

    this.input.on('pointerdown', (p, over) => {
      if (!p.wasTouch || active || over.length) return; // a tap on a button is not a joystick
      // On a phone there is no Space: a tap on the tank bar starts the tank instead of the joystick.
      if (this.tankBar.contains(p.x, p.y)) {
        this.scene.get('GameScene').activateTank();
        return;
      }
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
