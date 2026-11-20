import { config } from '../config.js';
import { formatTime, proteinForRun, save, writeSave } from '../state.js';
import { stopMusic } from '../systems/audio.js';
import { weapons } from '../data/weapons.js';
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
    // One at a time, in list order, so the shield (last) already sees the others unlocked by this same run.
    this.newUnlocks = [];
    for (const def of weapons) {
      if (!def.unlock || save.unlocks.includes(def.id) || !def.unlock.check(this.run, this.won)) continue;
      save.unlocks.push(def.id);
      this.newUnlocks.push(def);
    }
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
    this.add.text(cx, cy, `Czas: ${formatTime(r.elapsedMs)}   Zabici: ${r.kills}   Poziom: ${r.level}`, {
      fontFamily: config.ui.font, fontSize: `${u.hudFontSize}px`,
    }).setOrigin(0.5);
    const coins = r.coinProtein ? ` (z monet: ${r.coinProtein})` : '';
    this.add.text(cx, cy + u.lineGap, `Zdobyte białko: ${this.earned}${coins}   Razem: ${save.protein}`, {
      fontFamily: config.ui.font, fontSize: `${u.hudFontSize}px`,
    }).setOrigin(0.5);

    // GameScene.create() calls newRun(), so restarting it gives a clean run.
    const buttons = [['Siłownia', 'GymScene', -u.buttonOffsetX], ['Jeszcze raz', 'GameScene', u.buttonOffsetX]];
    for (const [label, scene, dx] of buttons) {
      const btn = button(this, cx + dx, cy + u.lineGap * 2, label, () => this.scene.start(scene), {
        fontSize: u.buttonFontSize, variant: scene === 'GymScene' ? 'secondary' : 'primary',
      });
      // After the very first run (which skipped the gym) the gym button pulses, so the player finds where protein goes.
      if (scene === 'GymScene' && save.runsPlayed === 1) {
        this.tweens.add({ targets: btn, scale: u.gymPulse.scale, duration: u.gymPulse.ms, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      }
    }
    // A weapon unlocked by this run: from now on it can drop as a card.
    if (this.newUnlocks.length) {
      this.add.text(cx, cy + u.lineGap * 3, `Nowa broń: ${this.newUnlocks.map((d) => d.name).join(', ')}! Może teraz wypaść jako karta.`, {
        fontFamily: config.ui.font, fontSize: `${u.hudFontSize}px`, fontStyle: 'bold', color: '#ffc400',
      }).setOrigin(0.5);
    }
  }
}
