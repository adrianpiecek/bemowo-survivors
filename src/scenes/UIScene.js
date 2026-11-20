import { config } from '../config.js';
import { xpToNextLevel, formatTime } from '../state.js';
import { isEffectActive } from '../systems/effects.js';
import { pickups } from '../data/pickups.js';
import { events } from '../data/events.js';
import { font, drawPanel, drawBar } from '../systems/ui.js';
import { openSettings } from './SettingsScene.js';
import { evolutionReady } from '../systems/cards.js';
import { pressureBonus } from '../state.js';

// HUD on its own layer above GameScene. It reads `run` every frame, so GameScene never has to notify it.
// Static panels are drawn once into this.panels; bars and anything that changes are redrawn into this.bars every frame.
export default class UIScene extends Phaser.Scene {
  constructor() { super('UIScene'); }

  init(data) { this.run = data.run; }

  create() {
    const u = config.ui, h = u.hud, m = u.margin;
    const { width, height } = this.scale;
    const outline = { stroke: '#000000', strokeThickness: 3 };
    const barFont = font(h.barFontSize, { fontStyle: 'bold', ...outline });

    // Bartkowanie "Żółty sweter mocy": the whole screen goes yellow, under the HUD.
    const bk = config.bartkowanie;
    this.yellow = this.add.rectangle(0, 0, width, height, bk.yellowColor, bk.yellowAlpha).setOrigin(0).setVisible(false);
    this.panels = this.add.graphics();
    this.bars = this.add.graphics();

    // Top left panel: three rows, an icon on the left and a bar with its text on the right.
    const panelH = h.padding * 2 + h.rowHeight * 3;
    drawPanel(this.panels, m, m, h.width, panelH);
    const iconX = m + h.padding + h.iconSize / 2, barX = m + h.width - h.padding - h.barWidth;
    this.rowY = [0, 1, 2].map((i) => m + h.padding + h.rowHeight * i + h.rowHeight / 2); // middle of each row
    const barText = (row) => this.add.text(barX + h.barWidth / 2, this.rowY[row], '', barFont).setOrigin(0.5);
    this.add.image(iconX, this.rowY[0], 'icon_heart').setDisplaySize(h.iconSize, h.iconSize);
    this.hpText = barText(0);
    this.levelBadge = this.add.graphics();
    this.levelText = this.add.text(iconX, this.rowY[1], '', font(h.levelFontSize, { fontStyle: 'bold', ...outline })).setOrigin(0.5);
    this.xpText = barText(1);
    const tankIcon = this.add.image(iconX, this.rowY[2], 'tank');
    tankIcon.setScale(h.iconSize / Math.max(tankIcon.width, tankIcon.height));
    this.tankText = barText(2);
    this.barX = barX;
    this.tankBar = new Phaser.Geom.Rectangle(barX, this.rowY[2] - h.barHeight / 2, h.barWidth, h.barHeight); // also the phone's tank button
    // Effect rows go under the boss bar's place, so the bar never covers them.
    this.effectTop = Math.max(m + panelH, u.bossBar.y + u.bossBar.height) + u.effectHud.gap;

    // Top right column (portrait: no room for the clock in the middle): the clock, then kills and protein from coins.
    const ck = h.clock, ckX = width - m - ck.width;
    drawPanel(this.panels, ckX, m, ck.width, ck.height);
    this.add.image(ckX + h.padding + ck.iconSize / 2, m + ck.height / 2, 'icon_clock').setDisplaySize(ck.iconSize, ck.iconSize);
    this.timeText = this.add.text(ckX + ck.width - h.padding, m + ck.height / 2, '', font(ck.fontSize, { fontStyle: 'bold', ...outline }))
      .setOrigin(1, 0.5);
    // Pause button left of the clock: opens the settings over the paused run (phones have no Esc).
    const pb = u.settings.pauseButton, pbX = ckX - pb.gap - pb.size;
    drawPanel(this.panels, pbX, m, pb.size, pb.size);
    this.add.image(pbX + pb.size / 2, m + pb.size / 2, 'icon_pause').setDisplaySize(pb.iconSize, pb.iconSize);
    this.add.zone(pbX, m, pb.size, pb.size).setOrigin(0).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => openSettings(this.scene.get('GameScene')));
    const st = h.stat, stX = width - m - st.width, statTop = m + ck.height + st.gap;
    const stat = (row, icon) => {
      const y = statTop + row * (st.height + st.gap);
      drawPanel(this.panels, stX, y, st.width, st.height);
      this.add.image(stX + h.padding + st.iconSize / 2, y + st.height / 2, icon).setDisplaySize(st.iconSize, st.iconSize);
      return this.add.text(stX + st.width - h.padding, y + st.height / 2, '', font(st.fontSize, { fontStyle: 'bold', ...outline })).setOrigin(1, 0.5);
    };
    this.killsText = stat(0, 'icon_skull');
    this.coinText = stat(1, 'coin_gold');

    const bb = u.bossBar;
    this.bossText = this.add.text(width / 2, bb.y + bb.height / 2, '', font(bb.fontSize, { fontStyle: 'bold', ...outline }))
      .setOrigin(0.5).setVisible(false);

    this.createJoystick();
    this.weaponSlots = this.add.graphics();
    this.slotBadges = this.add.graphics().setDepth(1); // level badges over the icons
    // Frames on a weapon ready to evolve and on its passive, pulsing.
    this.readyFrames = this.add.graphics().setDepth(1);
    this.tweens.add({ targets: this.readyFrames, alpha: 0.25, duration: u.weaponHud.readyPulseMs, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.weaponHud = {}; // `${row}_${slot}` -> icon and level text, filled by updateWeaponHud as items come
    this.weaponSig = null;

    // Active timed pickup effects and run events that last, one row each: icon, name, time bar (drawn in update).
    // timer() returns what has remainingMs and durationMs, or nothing while it is off.
    const eh = u.effectHud;
    const row = (icon, name, timer) => ({
      timer,
      image: this.add.image(0, 0, icon).setDisplaySize(eh.iconSize, eh.iconSize).setVisible(false),
      name: this.add.text(0, 0, name, font(eh.fontSize, { fontStyle: 'bold', ...outline })).setOrigin(0, 0.5).setVisible(false),
    });
    this.effectRows = [
      ...pickups.filter((d) => d.effect).map((d) => row(d.icon ?? 'pickup', d.name, () => this.run.effects[d.effect])),
      ...events.filter((d) => d.durationSec > 0).map((d) => row('icon_clock', d.name, () => this.run.activeEvents.find((ev) => ev.def === d))),
    ];

    const pa = u.pickupArrow;
    this.pickupArrow = this.add.triangle(0, 0, pa.size, pa.size / 2, 0, 0, 0, pa.size, pa.color).setStrokeStyle(2, 0x000000).setVisible(false);

    const tb = u.tankButton;
    this.tankButton = this.add.container(width - tb.margin - tb.radius, height - tb.margin - tb.radius, [
      this.add.circle(0, 0, tb.radius, tb.color, tb.alpha).setStrokeStyle(3, 0xffffff),
      this.add.text(0, 0, 'CZOŁG!', font(tb.fontSize, { fontStyle: 'bold', ...outline })).setOrigin(0.5),
    ]).setSize(tb.radius * 2, tb.radius * 2).setVisible(false)
      .setInteractive(new Phaser.Geom.Circle(tb.radius, tb.radius, tb.radius), Phaser.Geom.Circle.Contains)
      .on('pointerdown', () => this.scene.get('GameScene').activateTank());

    this.balanceText = null; // the scene object outlives restarts, so never keep last run's text
    if (config.debug.balanceOverlay) {
      this.balanceText = this.add.text(width - m, statTop + 2 * (st.height + st.gap), '', font(h.barFontSize, { align: 'right', ...outline }))
        .setOrigin(1, 0).setDepth(2);
      this.balanceSamples = []; // one per second of run time: { t, spawned, kills, dmg }
    }

    // Banner: a panel sized to its text, title and a smaller line (or two) under it.
    const bn = u.banner;
    this.bannerBg = this.add.graphics();
    this.bannerTitle = this.add.text(0, 0, '', font(bn.fontSize, {
      fontStyle: 'bold', color: '#ffffff', stroke: '#000000', strokeThickness: bn.strokeThickness, align: 'center',
    })).setOrigin(0.5, 0);
    this.bannerSub = this.add.text(0, 0, '', font(bn.subFontSize, {
      color: '#ffe082', stroke: '#000000', strokeThickness: bn.subStrokeThickness, align: 'center',
      wordWrap: { width: width - 2 * (m + bn.padX) }, // a long line wraps instead of leaving the narrow screen
    })).setOrigin(0.5, 0);
    this.banner = this.add.container(width / 2, bn.y, [this.bannerBg, this.bannerTitle, this.bannerSub]).setDepth(1).setVisible(false);

    const w = u.welcome;
    const welcome = this.add.text(width / 2, height / 2, 'Witamy na Bemowie', font(w.fontSize, {
      fontStyle: 'bold', stroke: '#000000', strokeThickness: u.banner.strokeThickness,
    })).setOrigin(0.5);
    this.tweens.add({ targets: welcome, alpha: 0, delay: w.holdMs, duration: w.fadeMs, onComplete: () => welcome.destroy() });
  }

  // Shared banner: fades in, stays, fades out. Runs on this scene's clock, so it keeps counting while GameScene is paused.
  // A new banner replaces the one on screen.
  showBanner(text, subtext = '', durationMs = config.ui.banner.durationMs) {
    const bn = config.ui.banner;
    this.bannerTitle.setText(text).setPosition(0, 0);
    this.bannerSub.setText(subtext).setPosition(0, this.bannerTitle.height + bn.gap).setVisible(!!subtext);
    const w = Math.max(this.bannerTitle.width, subtext ? this.bannerSub.width : 0) + bn.padX * 2;
    const h = this.bannerTitle.height + (subtext ? bn.gap + this.bannerSub.height : 0) + bn.padY * 2;
    this.bannerBg.clear();
    drawPanel(this.bannerBg, -w / 2, -bn.padY, w, h);
    this.tweens.killTweensOf(this.banner);
    this.bannerTimer?.remove();
    this.banner.setVisible(true).setAlpha(0);
    this.tweens.add({ targets: this.banner, alpha: 1, duration: bn.fadeMs });
    this.bannerTimer = this.time.delayedCall(durationMs, () => {
      this.tweens.add({ targets: this.banner, alpha: 0, duration: bn.fadeMs, onComplete: () => this.banner.setVisible(false) });
    });
  }

  update() {
    const r = this.run, pl = r.player, h = config.ui.hud;
    const xpNeed = xpToNextLevel(r.level);

    this.yellow.setVisible(isEffectActive(r, 'yellowSweater'));
    this.bars.clear();
    const bar = (row, color, fill) => drawBar(this.bars, this.barX, this.rowY[row] - h.barHeight / 2, h.barWidth, h.barHeight, fill, color);
    bar(0, h.hpColor, pl.hp / pl.maxHp);
    bar(1, h.xpColor, r.xp / xpNeed);
    const t = config.tank, full = r.tankCharge >= t.killsToCharge;
    const blink = full && Math.floor(this.time.now / t.barBlinkMs) % 2;
    bar(2, blink ? h.tankBlinkColor : h.tankColor, r.tankMs > 0 ? r.tankMs / (t.durationSec * 1000) : r.tankCharge / t.killsToCharge);

    // Level badge: a blue disc with a white rim behind the level number.
    const iconX = config.ui.margin + h.padding + h.iconSize / 2;
    this.levelBadge.clear().fillStyle(h.levelColor).fillCircle(iconX, this.rowY[1], h.iconSize / 2)
      .lineStyle(2, 0xffffff).strokeCircle(iconX, this.rowY[1], h.iconSize / 2);

    // setText skips the redraw when the string is unchanged, so calling it every frame is cheap.
    this.hpText.setText(`${pl.hp} / ${pl.maxHp}`);
    this.xpText.setText(`${Math.floor(r.xp)} / ${xpNeed} XP`); // XP can be fractional (Zeszyt w kratkę)
    this.levelText.setText(r.level);
    // +999 so the clock shows 10:00 at the start instead of 9:59.
    this.timeText.setText(formatTime(config.run.durationSec * 1000 - r.elapsedMs + 999));
    this.killsText.setText(r.kills);
    this.coinText.setText(r.coinProtein);
    // Boss HP bar, top center under the clock, only while a boss is on the map.
    const boss = this.scene.get('GameScene').boss, bb = config.ui.bossBar;
    const bossOn = !!boss?.active && boss.stats.isBoss; // pooled: the same sprite may be a zombie later
    this.bossText.setVisible(bossOn);
    if (bossOn) {
      this.bossText.setText(boss.stats.name.toUpperCase());
      drawBar(this.bars, (this.scale.width - bb.width) / 2, bb.y, bb.width, bb.height, boss.hp / boss.stats.hp, bb.color);
    }
    this.tankButton.setVisible(full && r.tankMs <= 0);
    this.updateEffectHud();
    this.updateWeaponHud();
    this.updatePickupArrow();
    if (this.balanceText) this.updateBalance();
    this.tankText.setText(r.tankMs > 0 ? `CZOŁG ${Math.ceil(r.tankMs / 1000)} s`
      : full ? 'CZOŁG GOTOWY! [Spacja]' : `Czołg ${r.tankCharge} / ${t.killsToCharge}`);
  }

  // Active timed effects, stacked under the HUD panel: a small panel with the icon, the name and a bar of the time left.
  updateEffectHud() {
    const eh = config.ui.effectHud, m = config.ui.margin, pad = config.ui.hud.padding;
    let y = this.effectTop;
    for (const { timer, image, name } of this.effectRows) {
      const e = timer();
      image.setVisible(!!e);
      name.setVisible(!!e);
      if (!e) continue;
      drawPanel(this.bars, m, y, eh.width, eh.height);
      image.setPosition(m + pad + eh.iconSize / 2, y + eh.height / 2);
      const tx = m + pad * 2 + eh.iconSize, bw = eh.width - (tx - m) - pad;
      name.setPosition(tx, y + eh.height * 0.38);
      drawBar(this.bars, tx, y + eh.height - pad - eh.barHeight, bw, eh.barHeight, e.remainingMs / e.durationMs, eh.color);
      y += eh.height + eh.gap;
    }
  }

  // Weapon slots bottom left, passive slots in a row right above them: every slot has a frame (empty ones dimmed);
  // a carried item shows its icon and a level badge over its corner. Redrawn only when an item or a level changes.
  updateWeaponHud() {
    const wh = config.ui.weaponHud, m = config.ui.margin, bottom = this.scale.height - m - wh.size;
    const rows = [[this.run.weapons, config.weapons.maxSlots, bottom], [this.run.passives, config.passives.maxSlots, bottom - wh.size - wh.gap]];
    const ready = this.run.weapons.filter((w) => evolutionReady(this.run, w));
    const sig = rows.map(([items]) => items.map((it) => `${it.level}${it.evolved ? 'e' : ''}`).join()).join('|') + `|${ready.length}`;
    if (sig === this.weaponSig) return;
    this.weaponSig = sig;
    const g = this.weaponSlots.clear(), badges = this.slotBadges.clear();
    rows.forEach(([items, maxSlots, y], row) => {
      for (let i = 0; i < maxSlots; i++) {
        const x = m + i * (wh.size + wh.gap), it = items[i];
        drawPanel(g, x, y, wh.size, wh.size, it ? {} : { alpha: wh.emptyAlpha, borderAlpha: wh.emptyAlpha });
        if (!it) continue;
        const bx = x + wh.size - wh.badgeRadius / 2, by = y + wh.size - wh.badgeRadius / 2, key = `${row}_${i}`;
        this.weaponHud[key] ??= { // items are never dropped mid-run, so a slot keeps its icon
          icon: this.add.image(x + wh.size / 2, y + wh.size / 2, it.def.icon).setDisplaySize(wh.iconSize, wh.iconSize),
          level: this.add.text(bx, by, '', font(wh.fontSize, { fontStyle: 'bold' })).setOrigin(0.5).setDepth(2),
        };
        badges.fillStyle(config.ui.hud.levelColor).fillCircle(bx, by, wh.badgeRadius).lineStyle(2, 0xffffff).strokeCircle(bx, by, wh.badgeRadius);
        this.weaponHud[key].level.setText(it.level);
        if (it.evolved) this.weaponHud[key].icon.setTexture(it.def.evolution.icon).setDisplaySize(wh.iconSize, wh.iconSize);
      }
    });
    // Ready to evolve: the weapon's slot and its passive's slot in gold.
    const frames = this.readyFrames.clear().lineStyle(wh.readyWidth, wh.readyColor), r = config.ui.panel.radius;
    for (const w of ready) {
      const wi = this.run.weapons.indexOf(w), pi = this.run.passives.findIndex((p) => p.def.id === w.def.evolution.passive);
      frames.strokeRoundedRect(m + wi * (wh.size + wh.gap), rows[0][2], wh.size, wh.size, r);
      frames.strokeRoundedRect(m + pi * (wh.size + wh.gap), rows[1][2], wh.size, wh.size, r);
    }
  }

  // Arrow on the screen edge toward the Żabka shop, else the nearest pickup lying off screen; hidden when none is.
  updatePickupArrow() {
    const gs = this.scene.get('GameScene'), cam = gs.cameras.main, view = cam.worldView, pa = config.ui.pickupArrow;
    const cx = view.centerX, cy = view.centerY;
    let best = null, bestD = Infinity;
    for (const p of gs.pickups.getChildren()) {
      if (!p.active || view.contains(p.x, p.y)) continue;
      const d = p.def.arrowFirst ? -1 : Phaser.Math.Distance.Squared(cx, cy, p.x, p.y);
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
    const pw = r.weapons.find((w) => w.def.id === 'pistol'), pc = config.weapons.pistol;
    const dpsMax = pw ? (pc.bulletDamage * pl.damageMult * (pw.bullets + pl.amount) * 1000) / (pc.fireRateMs * pl.cooldownMult) : 0;
    const x = (v) => `x${v.toFixed(2)}`;
    this.balanceText.setText([
      `wrogowie ${gs.enemies.countActive(true)}`,
      `spawn/s ${per('spawned')}   zabici/s ${per('kills')}`,
      `DPS ${per('dmg')} (pistolet max ${dpsMax.toFixed(0)})`,
      `HP zombie x${(1 + config.spawn.hpPerMinutePct * r.elapsedMs / 60000).toFixed(2)}`,
      // Passive stats: what every weapon reads through GameScene's weapon* helpers.
      `obrażenia ${x(pl.damageMult)}   odnowienie ${x(pl.cooldownMult)}   obszar ${x(pl.area)}   czas ${x(pl.duration)}`,
      `ilość +${pl.amount}   pancerz ${pl.armor}   regen ${pl.regen.toFixed(1)}/s   szczęście ${x(pl.luck)}`,
      `XP ${x(pl.growth)}   magnes ${pl.magnetRadius.toFixed(0)} px   prędkość ${pl.speed.toFixed(0)}`,
      // Hidden pressure: its value, what it does now, the last sample (share of max HP lost in the window, crowd) and the bonus.
      `presja ${r.pressure.toFixed(2)} (spawn x${(1 + r.pressure * config.dda.spawnBonus).toFixed(2)}, HP x${(1 + r.pressure * config.dda.hpBonus).toFixed(2)})`
        + `${r.ddaGraceMs > 0 ? '  [po karcie]' : ''}`,
      `  utrata HP ${r.ddaLast ? Math.round(r.ddaLast.hurt * 100) : 0}%/${config.dda.windowSec}s   tłok ${r.ddaLast ? r.ddaLast.crowd.toFixed(1) : 0}   premia +${Math.round(pressureBonus(r) * 100)}%`,
      `dotyk wrogów x${(1 + config.spawn.damagePerMinutePct * r.elapsedMs / 60000).toFixed(2)}`,
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
}
