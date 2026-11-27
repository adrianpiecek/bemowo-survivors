import { config } from '../config.js';
import { save, writeSave } from '../state.js';
import { setOrientation, extraHeight } from '../systems/layout.js';
import { playSfx, playMusic } from '../systems/audio.js';
import { font, button } from '../systems/ui.js';

// Title with the intro. Browsers keep audio locked until the player does something, so the intro only starts
// after a first click (or key): "BEMOWO" drops in with a clang, then "SURVIVORS" rises with a second one, the music
// starts and the menu comes by itself (straight into a run the very first time). A tap or key during it skips there.
// The very first launch asks how the screen is held instead of the start button; that click starts the intro.
export default class TitleScene extends Phaser.Scene {
  constructor() { super('TitleScene'); }

  create() {
    const t = config.ui.title, { width, height } = this.scale;
    this.left = false;
    if (!save.orientationSet) {
      this.askOrientation();
      return;
    }
    if (this.registry.get('titleIntro')) { // just answered: the click already unlocked the audio
      this.registry.remove('titleIntro');
      this.intro();
      return;
    }
    // A drawn button, pulsing; a click anywhere (or a key) counts, the button only shows where.
    const prompt = button(this, width / 2, height / 2, 'Kliknij, aby zacząć', () => {}, { fontSize: t.promptFontSize });
    this.tweens.add({ targets: prompt, scale: t.pulseScale, duration: t.blinkMs, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.onFirstInput(() => {
      prompt.destroy();
      this.intro();
    });
  }

  // "Jak trzymasz ekran?" with Pionowo and Poziomo. The answer is kept in the save; the scene comes back (in the
  // picked shape) straight into the intro.
  askOrientation() {
    const t = config.ui.title, { width, height } = this.scale, cx = width / 2, cy = height / 2;
    this.add.text(cx, cy - t.orientGapY, 'Jak trzymasz ekran?', font(t.orientFontSize, {
      fontStyle: 'bold', stroke: '#000000', strokeThickness: t.promptStroke, align: 'center', wordWrap: { width: width - 2 * config.ui.margin } })).setOrigin(0.5);
    [['Pionowo', 'portrait'], ['Poziomo', 'landscape']].forEach(([label, o], i) => {
      button(this, cx + (i - 0.5) * (t.orientWidth + t.orientGap), cy, label, () => {
        if (save.orientationSet) return; // a double click
        save.orientationSet = true;
        this.registry.set('titleIntro', true);
        if (o !== save.orientation) setOrientation(this, o); // saves, resizes the game and restarts this scene
        else {
          writeSave(save);
          this.scene.restart();
        }
      }, { width: t.orientWidth, fontSize: t.promptFontSize });
    });
  }

  // Calls fn once, on whichever comes first: a click/tap or a key.
  onFirstInput(fn) {
    let done = false;
    const once = () => {
      if (done) return;
      done = true;
      fn();
    };
    this.input.once('pointerdown', once);
    this.input.keyboard.once('keydown', once);
  }

  intro() {
    const t = config.ui.title, { width, height } = this.scale, cx = width / 2;
    const logoWidth = (text) => this.add.text(0, 0, text, { fontFamily: t.fontFamily, fontSize: `${t.logoFontSize}px`, strokeThickness: t.strokeThickness })
      .setVisible(false).width;
    const logo = (text, color) => this.add.text(cx, 0, text, {
      fontFamily: t.fontFamily, fontSize: `${t.logoFontSize}px`, color, stroke: '#000000', strokeThickness: t.strokeThickness,
    }).setOrigin(0.5).setScale(Math.min(1, (width - 2 * config.ui.margin) / logoWidth(text))); // SURVIVORS fits a phone

    this.time.delayedCall(t.skipDelayMs, () => this.onFirstInput(() => this.leave())); // not the tap that started it
    const bemowo = logo('BEMOWO', t.bemowoColor).setY(-t.logoFontSize);
    this.tweens.add({
      targets: bemowo, y: t.bemowoY + extraHeight(this), duration: t.dropMs, ease: 'Quad.easeIn',
      onComplete: () => {
        this.hit();
        this.time.delayedCall(t.gapMs, () => {
          const survivors = logo('SURVIVORS', t.survivorsColor).setY(height + t.logoFontSize);
          this.tweens.add({
            targets: survivors, y: t.survivorsY + extraHeight(this), duration: t.dropMs, ease: 'Quad.easeIn',
            onComplete: () => {
              this.hit();
              this.ready();
            },
          });
        });
      },
    });
  }

  hit() {
    const t = config.ui.title;
    playSfx(this, 'clang');
    this.cameras.main.shake(t.shakeMs, t.shakeIntensity);
  }

  ready() {
    playMusic(this, 'boss');
    this.time.delayedCall(config.ui.title.holdMs, () => this.leave());
  }

  leave() {
    if (this.left) return; // the timer and a tap can both come
    this.left = true;
    this.scene.start(save.runsPlayed ? 'MenuScene' : 'GameScene');
  }
}
