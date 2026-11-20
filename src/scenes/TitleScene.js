import { config } from '../config.js';
import { save } from '../state.js';
import { playSfx, playMusic } from '../systems/audio.js';

// Title with the intro. Browsers keep audio locked until the player does something, so the intro only starts
// after a first click (or key): "BEMOWO" drops in with a clang, then "SURVIVORS" rises with a second one,
// then the music starts and any key or click goes to the gym (straight into a run the very first time).
export default class TitleScene extends Phaser.Scene {
  constructor() { super('TitleScene'); }

  create() {
    const t = config.ui.title, { width, height } = this.scale;
    const prompt = this.add.text(width / 2, height / 2, 'Kliknij, aby zacząć', { fontSize: `${t.promptFontSize}px` }).setOrigin(0.5);
    this.onFirstInput(() => {
      prompt.destroy();
      this.intro();
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
    const logo = (text, color) => this.add.text(cx, 0, text, {
      fontFamily: t.fontFamily, fontSize: `${t.logoFontSize}px`, color, stroke: '#000000', strokeThickness: t.strokeThickness,
    }).setOrigin(0.5);

    const bemowo = logo('BEMOWO', t.bemowoColor).setY(-t.logoFontSize);
    this.tweens.add({
      targets: bemowo, y: t.bemowoY, duration: t.dropMs, ease: 'Quad.easeIn',
      onComplete: () => {
        this.hit();
        this.time.delayedCall(t.gapMs, () => {
          const survivors = logo('SURVIVORS', t.survivorsColor).setY(height + t.logoFontSize);
          this.tweens.add({
            targets: survivors, y: t.survivorsY, duration: t.dropMs, ease: 'Quad.easeIn',
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
    const t = config.ui.title, { width, height } = this.scale;
    playMusic(this, 'boss');
    const press = this.add.text(width / 2, height - t.pressBottom, 'Naciśnij dowolny klawisz', { fontSize: `${t.promptFontSize}px` })
      .setOrigin(0.5);
    this.tweens.add({ targets: press, alpha: 0, duration: t.blinkMs, yoyo: true, repeat: -1 });
    this.onFirstInput(() => this.scene.start(save.runsPlayed ? 'GymScene' : 'GameScene'));
  }
}
