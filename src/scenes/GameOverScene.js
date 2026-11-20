import { config } from '../config.js';
import { formatTime, proteinForRun, save, writeSave } from '../state.js';
import { stopMusic } from '../systems/audio.js';

export default class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }

  init(data) {
    this.run = data.run;
    this.won = data.won;
    this.earned = proteinForRun(this.run, this.won);
    save.protein += this.earned;
    save.runsPlayed += 1;
    writeSave(save);
    stopMusic();
  }

  create() {
    const u = config.ui, r = this.run;
    const cx = this.scale.width / 2, cy = this.scale.height / 2;

    const [title, subtitle] = this.won
      ? ['Przetrwałeś!', 'Bemowo jest bezpieczne. Na razie.']
      : ['Tu spoczywa Bartosz', '(Bartłomiej)'];
    this.add.text(cx, cy - u.lineGap * 2, title, { fontSize: `${u.titleFontSize}px` }).setOrigin(0.5);
    this.add.text(cx, cy - u.lineGap, subtitle, { fontSize: `${u.subtitleFontSize}px`, color: '#aaaaaa' }).setOrigin(0.5);
    this.add.text(cx, cy, `Czas: ${formatTime(r.elapsedMs)}   Zabici: ${r.kills}   Poziom: ${r.level}`, {
      fontSize: `${u.hudFontSize}px`,
    }).setOrigin(0.5);
    this.add.text(cx, cy + u.lineGap, `Zdobyte białko: ${this.earned}   Razem: ${save.protein}`, {
      fontSize: `${u.hudFontSize}px`,
    }).setOrigin(0.5);

    // GameScene.create() calls newRun(), so restarting it gives a clean run.
    const buttons = [['Siłownia', 'GymScene', -u.buttonOffsetX], ['Jeszcze raz', 'GameScene', u.buttonOffsetX]];
    for (const [label, scene, dx] of buttons) {
      const btn = this.add.text(cx + dx, cy + u.lineGap * 2, label, {
        fontSize: `${u.buttonFontSize}px`, color: '#000000', backgroundColor: '#ffffff', padding: { x: u.buttonPadding, y: u.buttonPadding },
      })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.scene.start(scene));
      // After the very first run (which skipped the gym) the gym button pulses, so the player finds where protein goes.
      if (scene === 'GymScene' && save.runsPlayed === 1) {
        this.tweens.add({ targets: btn, scale: u.gymPulse.scale, duration: u.gymPulse.ms, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      }
    }
  }
}
