import { config } from '../config.js';
import { formatTime, proteinForRun, save, writeSave } from '../state.js';
import { stopMusic } from '../systems/audio.js';
import { weapons } from '../data/weapons.js';
import { passives } from '../data/passives.js';
import { plans } from '../data/plans.js';
import { startRun } from './PlanScene.js';
import { unlockedByBets } from '../data/bets.js';
import { button } from '../systems/ui.js';

export default class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }

  init(data) {
    this.run = data.run;
    this.won = data.won;
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
    const u = config.ui, r = this.run;
    const cx = this.scale.width / 2, cy = this.scale.height / 2;

    const [title, subtitle] = this.won
      ? ['Przetrwałeś!', 'Bemowo jest bezpieczne. Na razie.']
      : ['Tu spoczywa Bartosz', '(Bartłomiej)'];
    this.add.text(cx, cy - u.lineGap * 2, title, { fontFamily: config.ui.font, fontSize: `${u.titleFontSize}px` }).setOrigin(0.5);
    this.add.text(cx, cy - u.lineGap, subtitle, { fontFamily: config.ui.font, fontSize: `${u.subtitleFontSize}px`, color: '#aaaaaa' }).setOrigin(0.5);
    const ps = u.planScreen;
    if (r.plan) this.add.text(cx, cy - u.lineGap * 3, `Plan: ${r.plan.name}`, { fontFamily: config.ui.font, fontSize: `${ps.gameOverFontSize}px`, color: ps.gameOverColor }).setOrigin(0.5);
    this.add.text(cx, cy, `Czas: ${formatTime(r.elapsedMs)}   Zabici: ${r.kills}   Poziom: ${r.level}`, {
      fontFamily: config.ui.font, fontSize: `${u.hudFontSize}px`,
    }).setOrigin(0.5);
    const extra = [r.coinProtein ? `z monet: ${r.coinProtein}` : '', r.betPct ? `zakłady +${Math.round(r.betPct * 100)}%` : ''].filter(Boolean);
    const coins = extra.length ? ` (${extra.join(', ')})` : '';
    this.add.text(cx, cy + u.lineGap, `Zdobyte białko: ${this.earned}${coins}   Razem: ${save.protein}`, {
      fontFamily: config.ui.font, fontSize: `${u.hudFontSize}px`,
    }).setOrigin(0.5);

    // GameScene.create() calls newRun(), so restarting it gives a clean run.
    const buttons = [['Siłownia', 'GymScene', -u.buttonOffsetX], ['Jeszcze raz', 'GameScene', u.buttonOffsetX]];
    for (const [label, scene, dx] of buttons) {
      const btn = button(this, cx + dx, cy + u.lineGap * 2, label, () => (scene === 'GameScene' ? startRun(this) : this.scene.start(scene)), {
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
      this.add.text(cx, cy + u.lineGap * 3, lines.join('\n'), {
        fontFamily: config.ui.font, fontSize: `${u.hudFontSize}px`, fontStyle: 'bold', color: '#ffc400',
        align: 'center', wordWrap: { width: this.scale.width - 2 * u.margin },
      }).setOrigin(0.5, 0);
    }
  }
}
