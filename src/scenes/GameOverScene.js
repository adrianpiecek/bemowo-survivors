import { config } from '../config.js';
import { formatTime, proteinForRun, pressureBonus, save, writeSave } from '../state.js';
import { stopMusic } from '../systems/audio.js';
import { weapons } from '../data/weapons.js';
import { passives } from '../data/passives.js';
import { plans } from '../data/plans.js';
import { startRun } from './PlanScene.js';
import { unlockedByBets } from '../data/bets.js';
import { button, font, drawPanel, drawBar } from '../systems/ui.js';

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
    st.bartkowanie += r.upgrades.bartkowanie ?? 0;
    if (!this.won && r.elapsedMs < config.plans.lazy.earlyDeathSec * 1000) st.earlyDeaths++;
    if (this.won) st.wins++;
    // One at a time, in list order, so the shield (last weapon) already sees the others unlocked by this same run.
    this.newUnlocks = [];
    for (const def of [...weapons, ...passives, ...plans]) {
      if (!def.unlock || save.unlocks.includes(def.id)) continue;
      if (!def.unlock.check(this.run, this.won) && !unlockedByBets(def, this.run, this.won)) continue;
      save.unlocks.push(def.id);
      this.newUnlocks.push(def);
    }
    // Evolutions seen for the first time this run: kept in the save, named on this screen.
    this.newEvolutions = weapons.map((d) => d.evolution).filter((e) => e && r.evolutions.includes(e.id) && !save.evolutions.includes(e.id));
    for (const e of this.newEvolutions) save.evolutions.push(e.id);
    writeSave(save);
    stopMusic();
  }

  create() {
    const u = config.ui, go = u.gameOver, r = this.run, cx = this.scale.width / 2;
    let y = go.top;

    const [title, subtitle] = this.won ? ['Przetrwałeś!', 'Bemowo jest bezpieczne. Na razie.']
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
    const bonus = [r.betPct ? `zakłady +${Math.round(r.betPct * 100)}%` : '', pb ? `Bemowo się zbroiło +${pb}%` : ''].filter(Boolean).join(', ');
    row('Czas', formatTime(r.elapsedMs));
    row('Poziom', `${r.level}`);
    row('Zabici', `${r.kills}`);
    row('Bossowie', `${r.bossesKilled.length} / ${config.boss.slots.length}`);
    row('Białko z rundy', `${fromRun}${bonus ? ` (${bonus})` : ''}`, go.headerColor);
    row('Białko z monet', `${r.coinProtein}`, go.headerColor);
    row('Razem w siłowni', `${save.protein}`);
    const dealt = r.weapons.map((w) => ({ w, dmg: Math.round(r.weaponDamage[w.def.id] ?? 0) })).sort((a, b) => b.dmg - a.dmg);
    if (dealt.length) {
      y += go.gap / 2;
      this.add.text(x0 + go.padding, y, 'Obrażenia broni', font(go.fontSize, { fontStyle: 'bold', color: go.headerColor }));
      y += go.rowHeight;
      const bars = this.add.graphics().setDepth(1), best = Math.max(1, dealt[0].dmg);
      const barX = x0 + go.padding + go.iconSize + go.nameWidth, barW = inner - go.iconSize - go.nameWidth - go.padding * 4;
      for (const { w, dmg } of dealt) {
        const mid = y + go.rowHeight / 2, icon = w.evolved ? w.def.evolution.icon : w.def.icon;
        const img = this.add.image(x0 + go.padding + go.iconSize / 2, mid, icon).setDepth(1);
        img.setScale(go.iconSize / Math.max(img.width, img.height));
        this.add.text(x0 + go.padding + go.iconSize + go.padding / 2, mid, w.evolved ? w.def.evolution.name : w.def.name, font(go.fontSize)).setOrigin(0, 0.5).setDepth(1);
        drawBar(bars, barX, mid - go.barHeight / 2, barW, go.barHeight, dmg / best, go.barColor);
        this.add.text(x0 + go.panelWidth - go.padding, mid, dmg.toLocaleString('pl-PL'), font(go.fontSize, { fontStyle: 'bold' })).setOrigin(1, 0.5).setDepth(1);
        y += go.rowHeight;
      }
    }
    y += go.padding;
    drawPanel(bg, x0, top, go.panelWidth, y - top);
    y += go.buttonsGap;

    // GameScene.create() calls newRun(), so restarting it gives a clean run.
    const buttons = [['Siłownia', 'GymScene', -u.buttonOffsetX], ['Jeszcze raz', 'GameScene', u.buttonOffsetX]];
    for (const [label, scene, dx] of buttons) {
      const btn = button(this, cx + dx, y, label, () => (scene === 'GameScene' ? startRun(this) : this.scene.start(scene)), {
        fontSize: u.buttonFontSize, variant: scene === 'GymScene' ? 'secondary' : 'primary',
      });
      // After the very first run (which skipped the gym) the gym button pulses, so the player finds where protein goes.
      if (scene === 'GymScene' && save.runsPlayed === 1) {
        this.tweens.add({ targets: btn, scale: u.gymPulse.scale, duration: u.gymPulse.ms, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      }
    }
    // Weapons and passives unlocked by this run (from now on they can drop as cards) and evolutions seen for the first time.
    const lines = [], newPlans = this.newUnlocks.filter((d) => plans.includes(d)), newCards = this.newUnlocks.filter((d) => !plans.includes(d));
    if (newCards.length) {
      lines.push(`Odblokowane: ${newCards.map((d) => d.name).join(', ')}! ${newCards.length > 1 ? 'Mogą teraz wypaść jako karty.' : 'Może teraz wypaść jako karta.'}`);
    }
    if (newPlans.length) lines.push(`Nowy plan treningowy: ${newPlans.map((d) => d.name).join(', ')}!`);
    if (this.newEvolutions.length) lines.push(`Nowa ewolucja: ${this.newEvolutions.map((e) => e.name).join(', ')}!`);
    if (lines.length) {
      this.add.text(cx, y + go.buttonsGap, lines.join('\n'), {
        fontFamily: config.ui.font, fontSize: `${u.hudFontSize}px`, fontStyle: 'bold', color: '#ffc400',
        align: 'center', wordWrap: { width: this.scale.width - 2 * u.margin },
      }).setOrigin(0.5, 0);
    }
  }
}
