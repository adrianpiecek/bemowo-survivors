import { config } from '../config.js';
import { formatTime, proteinForRun, pressureBonus, save, writeSave } from '../state.js';
import { stopMusic } from '../systems/audio.js';
import { weapons } from '../data/weapons.js';
import { passives } from '../data/passives.js';
import { plans } from '../data/plans.js';
import { maps, mapById, openNextLevel, bestiaryKey } from '../data/maps.js';
import { enemies } from '../data/enemies.js';
import { startRun } from './PlanScene.js';
import { unlockedByBets } from '../data/bets.js';
import { button, font, drawPanel, drawBar } from '../systems/ui.js';
import { playVfx } from '../systems/vfx.js';
import { submitScore, submitDaily, sendRunStats } from '../systems/online.js';
import { dayLabel } from '../systems/daily.js';
import { centerLayout } from '../systems/layout.js';

export default class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }

  init(data) {
    this.run = data.run;
    this.won = data.won;
    this.quit = data.quit ?? false; // "Wyjdź do menu" in the pause
    this.earned = proteinForRun(this.run, this.won) + this.run.coinProtein;
    save.protein += this.earned;
    save.runsPlayed += 1;
    // A weapon whose unlock condition this run met can drop as a card from now on.
    // Totals over all runs, for the passives' unlocks.
    const st = save.stats, r = this.run;
    st.pierogi += r.pierogiEaten;
    st.damageTaken += r.damageTaken;
    st.goldCoins += r.goldCoins;
    st.maxLevel = Math.max(st.maxLevel, r.level);
    st.bartkowanie += r.bartkowanieCount;
    if (!this.won && r.elapsedMs < config.plans.lazy.earlyDeathSec * 1000) st.earlyDeaths++;
    if (this.won) st.wins++;
    st.kills += r.kills;
    st.bosses += r.bossesKilled.length;
    st.playMs += r.elapsedMs;
    st.protein += this.earned;
    st.bestMs = Math.max(st.bestMs, r.elapsedMs);
    st.bestKills = Math.max(st.bestKills, r.kills);
    for (const [id, n] of Object.entries(r.killsByType)) {
      const def = enemies.find((d) => d.id === id), key = def ? bestiaryKey(def, r.map) : id; // Fort Bema's Bartkowie apart
      save.bestiary[key] = (save.bestiary[key] ?? 0) + n;
    }
    // One at a time, in list order, so the shield (last weapon) already sees the others unlocked by this same run.
    this.newUnlocks = [];
    for (const def of [...weapons, ...passives, ...plans, ...maps]) {
      if (!def.unlock || save.unlocks.includes(def.id)) continue;
      if (!def.unlock.check(this.run, this.won) && !unlockedByBets(def, this.run, this.won)) continue;
      save.unlocks.push(def.id);
      this.newUnlocks.push(def);
    }
    // The map's next difficulty level; not from Wyzwanie dnia, whose level was the day's, not picked.
    this.newLevel = r.daily ? null : openNextLevel(this.run, this.won);
    if (r.daily && save.daily.day === r.daily.day) save.daily.score = Math.round(r.score); // the day's run is done
    // Evolutions seen for the first time this run: kept in the save, named on this screen.
    this.newEvolutions = weapons.map((d) => d.evolution).filter((e) => e && r.evolutions.includes(e.id) && !save.evolutions.includes(e.id));
    for (const e of this.newEvolutions) save.evolutions.push(e.id);
    writeSave(save);
    sendRunStats(r, this.won, this.quit, this.earned);
    stopMusic();
  }

  create() {
    const u = config.ui, go = u.gameOver, r = this.run, cx = this.scale.width / 2;
    let y = go.top;
    if (this.won) { // fireworks all over the screen, behind the text
      const { width, height } = this.scale;
      this.time.addEvent({ delay: u.fireworkEveryMs, loop: true,
        callback: () => playVfx(this, 'firework', Phaser.Math.Between(0, width), Phaser.Math.Between(0, height)) });
    }

    const endless = r.overtime && r.stage >= config.stages.count; // the map cleared, then the endless overtime
    const [title, subtitle] = this.won && endless ? ['Mapa zaliczona!', `Dogrywka bez końca: ${formatTime(r.overtimeMs)}`]
      : this.won ? ['Przetrwałeś!', 'Bemowo jest bezpieczne. Na razie.']
      : this.quit ? ['Koniec rundy', 'Bartek poszedł do domu.']
        : ['Tu spoczywa Bartosz', '(Bartłomiej)'];
    const t = this.add.text(cx, y, title, font(u.titleFontSize, { fontStyle: 'bold', stroke: '#000000', strokeThickness: 6 })).setOrigin(0.5, 0);
    y += t.height;
    const s = this.add.text(cx, y, subtitle, font(u.subtitleFontSize, { color: '#aaaaaa' })).setOrigin(0.5, 0);
    y += s.height + go.gap;
    const ps = u.planScreen;
    if (r.plan) {
      const p = this.add.text(cx, y, `Plan: ${r.plan.name}`, font(ps.gameOverFontSize, { color: ps.gameOverColor })).setOrigin(0.5, 0);
      y += p.height + go.gap;
    }
    if (r.daily) {
      const d = this.add.text(cx, y, `Wyzwanie dnia, ${dayLabel(r.daily.day)}`, font(ps.gameOverFontSize, { color: ps.gameOverColor })).setOrigin(0.5, 0);
      y += d.height + go.gap;
    }
    // Weapons and passives unlocked by this run (from now on they can drop as cards) and evolutions seen for the first
    // time: above the panel, so they are seen before the buttons.
    const lines = [], newPlans = this.newUnlocks.filter((d) => plans.includes(d)), newMaps = this.newUnlocks.filter((d) => maps.includes(d));
    const newCards = this.newUnlocks.filter((d) => !plans.includes(d) && !maps.includes(d));
    if (newCards.length) {
      lines.push(`Odblokowane: ${newCards.map((d) => d.name).join(', ')}! ${newCards.length > 1 ? 'Mogą teraz wypaść jako karty.' : 'Może teraz wypaść jako karta.'}`);
    }
    if (newPlans.length) lines.push(`Nowy plan treningowy: ${newPlans.map((d) => d.name).join(', ')}!`);
    if (newMaps.length) lines.push(`Nowa mapa: ${newMaps.map((d) => d.name).join(', ')}! Wybierzesz ją przed rundą.`);
    if (this.newLevel) {
      lines.push(`Nowy poziom trudności: ${mapById(r.map).name} ${this.newLevel} (+${Math.round(config.difficulty.proteinPct * (this.newLevel - 1) * 100)}% białka)!`);
    }
    if (this.newEvolutions.length) lines.push(`Nowa ewolucja: ${this.newEvolutions.map((e) => e.name).join(', ')}!`);
    if (lines.length) {
      const news = this.add.text(cx, y, lines.join('\n'), {
        fontFamily: config.ui.font, fontSize: `${u.hudFontSize}px`, fontStyle: 'bold', color: '#ffc400',
        align: 'center', wordWrap: { width: this.scale.width - 2 * u.margin },
      }).setOrigin(0.5, 0);
      y += news.height + go.gap;
    }

    // The panel: the run's numbers, then every weapon's damage, the best one first.
    const x0 = cx - go.panelWidth / 2, inner = go.panelWidth - go.padding * 2, bg = this.add.graphics(), top = y;
    y += go.padding;
    const row = (label, value, color = '#ffffff') => {
      this.add.text(x0 + go.padding, y, label, font(go.fontSize, { color: go.labelColor }));
      this.add.text(x0 + go.panelWidth - go.padding, y, value, font(go.fontSize, { fontStyle: 'bold', color })).setOrigin(1, 0);
      y += go.rowHeight;
    };
    // The hidden pressure only ever shows here, as a reward: "Bemowo się zbroiło".
    const pb = Math.round(pressureBonus(r) * 100), fromRun = this.earned - r.coinProtein;
    const bonus = [r.difficultyPct ? `trudność ${r.difficulty} +${Math.round(r.difficultyPct * 100)}%` : '', r.betPct ? `zakłady +${Math.round(r.betPct * 100)}%` : '', pb ? `Bemowo się zbroiło +${pb}%` : ''].filter(Boolean).join(', ');
    row('Czas', formatTime(r.elapsedMs));
    row('Poziom', `${r.level}`);
    row('Zabici', `${r.kills}`);
    row('Bossowie', `${r.bossesKilled.length} / ${config.boss.slots.length * config.stages.count}`);
    row('Etap', `${r.stage} / ${config.stages.count}${r.overtime ? `, dogrywka ${formatTime(r.overtimeMs)}` : ''}`);
    row('Wynik', Math.round(r.score).toLocaleString('pl-PL'), go.headerColor);
    // Wyniki: a new personal best goes to the leaderboard (signed in with a nick); its place shows on the Wynik row.
    const record = this.add.text(cx, y - go.rowHeight, '', font(go.fontSize, { fontStyle: 'bold', color: go.headerColor })).setOrigin(0.5, 0);
    // Wyzwanie dnia goes to the day's table only (its conditions are not the player's own).
    if (r.daily) submitDaily(r).then((rank) => { if (rank && record.active) record.setText(`Wyzwanie dnia: ${rank}. miejsce`); });
    else submitScore(r).then((res) => { if (res && record.active) record.setText(`Nowy rekord! ${res.rank}. miejsce`); });
    row('DPS', Math.round(r.damageDealt / Math.max(1, r.elapsedMs / 1000)).toLocaleString('pl-PL'));
    row('Białko z rundy', `${fromRun}${bonus ? ` (${bonus})` : ''}`, go.headerColor);
    row('Białko z monet', `${r.coinProtein}`, go.headerColor);
    row('Razem w siłowni', `${save.protein}`);
    // DPS: the weapon's damage over the time Bartek carried it.
    const dealt = r.weapons.map((w) => {
      const dmg = Math.round(r.weaponDamage[w.def.id] ?? 0), sec = Math.max(1, (r.elapsedMs - (w.sinceMs ?? 0)) / 1000);
      return { w, dmg, dps: Math.round(dmg / sec) };
    }).sort((a, b) => b.dmg - a.dmg);
    if (dealt.length) {
      y += go.gap / 2;
      this.add.text(x0 + go.padding, y, 'Obrażenia broni', font(go.fontSize, { fontStyle: 'bold', color: go.headerColor }));
      y += go.rowHeight;
      const bars = this.add.graphics().setDepth(1), best = Math.max(1, dealt[0].dmg);
      const barX = x0 + go.padding + go.iconSize + go.nameWidth, barW = inner - go.iconSize - go.nameWidth - go.valueWidth;
      for (const { w, dmg, dps } of dealt) {
        const mid = y + go.rowHeight / 2, icon = w.evolved ? w.def.evolution.icon : w.def.icon;
        const img = this.add.image(x0 + go.padding + go.iconSize / 2, mid, icon).setDepth(1);
        img.setScale(go.iconSize / Math.max(img.width, img.height));
        this.add.text(x0 + go.padding + go.iconSize + go.padding / 2, mid, w.evolved ? w.def.evolution.name : w.def.name, font(go.fontSize)).setOrigin(0, 0.5).setDepth(1);
        drawBar(bars, barX, mid - go.barHeight / 2, barW, go.barHeight, dmg / best, go.barColor);
        this.add.text(x0 + go.panelWidth - go.padding, mid, `${dmg.toLocaleString('pl-PL')} (${dps.toLocaleString('pl-PL')}/s)`, font(go.fontSize, { fontStyle: 'bold' })).setOrigin(1, 0.5).setDepth(1);
        y += go.rowHeight;
      }
    }
    y += go.padding;
    drawPanel(bg, x0, top, go.panelWidth, y - top);
    y += go.buttonsGap;

    // GameScene.create() calls newRun(), so restarting it gives a clean run.
    const buttons = [['Menu', 'MenuScene', -u.buttonOffsetX], [r.daily ? 'Zwykła runda' : 'Jeszcze raz', 'GameScene', u.buttonOffsetX]];
    for (const [label, scene, dx] of buttons) {
      const btn = button(this, cx + dx, y, label, () => (scene === 'GameScene' ? startRun(this) : this.scene.start(scene)), {
        fontSize: u.buttonFontSize, variant: scene === 'MenuScene' ? 'secondary' : 'primary',
      });
      // After the very first run (which skipped the menu) the menu button pulses, so the player finds where protein goes.
      if (scene === 'MenuScene' && save.runsPlayed === 1) {
        this.tweens.add({ targets: btn, scale: u.gymPulse.scale, duration: u.gymPulse.ms, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      }
    }
    centerLayout(this); // a taller phone: the whole screen in the middle
  }
}
