import { config } from '../config.js';
import { save, resetProgress, writeSave } from '../state.js';
import { setVolume, playSfx, pauseSfx, resumeSfx, toggleMute } from '../systems/audio.js';
import { font, panel, drawBar, button } from '../systems/ui.js';
import { setOrientation, applyMenuScale } from '../systems/layout.js';

// Pauses `scene` (GameScene or MenuScene) and opens the settings over it. Ignored when that scene is already paused
// (level-up cards, a chest, or the settings themselves are open), so closing never resumes a run under the cards.
export function openSettings(scene) {
  if (!scene.scene.isActive() || scene.dying) return; // Bartek falling: the end screen is coming
  scene.scene.pause();
  pauseSfx(scene);
  scene.scene.launch('SettingsScene', { from: scene.scene.key });
}

// Settings over a paused scene: music and sound effect volume, the HUD's and the menus' size, the camera's zoom, screen orientation (kept in the save). In a run it is the
// pause screen, and the orientation only says where to change it: the run's world is built for one screen shape.
// "Wróć", Esc or Enter close it and resume the scene under it (in a run also P, the pause key). "Wycisz" mutes everything
// (as M does); in a run "Wyjdź do menu" asks "Na pewno?" first, then ends the run as a loss: the end screen counts the
// protein so far. Outside a run
// "Nowa gra" asks "Na pewno?" first, then wipes the progress (state.resetProgress) and goes back to the title.
export default class SettingsScene extends Phaser.Scene {
  constructor() { super('SettingsScene'); }

  init(data) {
    this.from = data.from;
    this.closing = false;
    this.wipeArmed = false; // "Nowa gra" clicked once: the next click wipes the progress
    this.quitArmed = false; // "Wyjdź do menu" clicked once: the next click ends the run
  }

  create() {
    const u = config.ui, st = u.settings, { width, height } = this.scale, cx = width / 2;
    // [label, save key, min, max, what a change does]. The view rows apply at once in a run too.
    const rows = [
      ['Muzyka', 'musicVolume', 0, 1, (v) => setVolume('musicVolume', v)],
      ['Efekty dźwiękowe', 'sfxVolume', 0, 1, (v) => { setVolume('sfxVolume', v); playSfx(this, 'pick'); }], // hear the new level
      ['Wielkość interfejsu w grze', 'uiScale', st.uiScale.min, st.uiScale.max, (v) => this.setView('uiScale', v)],
      ['Wielkość menu', 'menuScale', st.menuScale.min, st.menuScale.max, (v) => this.setView('menuScale', v)],
      ['Przybliżenie kamery', 'cameraZoom', st.cameraZoom.min, st.cameraZoom.max, (v) => this.setView('cameraZoom', v)],
    ];
    const panelH = st.padding * 4 + st.titleFontSize * 1.2 + (rows.length + 1) * st.rowHeight + st.actionHeight + st.backHeight + st.hintFontSize * 2;
    const x0 = cx - st.width / 2, y0 = (height - panelH) / 2;
    this.add.rectangle(0, 0, width, height, 0x000000, u.dimAlpha).setOrigin(0).setInteractive(); // swallows taps meant for the HUD below
    panel(this, x0, y0, st.width, panelH);
    const inRun = this.from === 'GameScene';
    this.add.text(cx, y0 + st.padding, inRun ? 'Pauza' : 'Ustawienia', font(st.titleFontSize, { fontStyle: 'bold', color: '#ffc400' })).setOrigin(0.5, 0);

    // One row per setting: the label above, then [-] bar [+] and the percent.
    const bars = this.add.graphics();
    const barX = x0 + st.padding + st.stepButton + st.padding / 2;
    const barW = st.width - st.padding * 3 - st.stepButton * 2 - st.valueWidth;
    const values = [];
    const redraw = () => {
      bars.clear();
      rows.forEach(([, kind, min, max], i) => {
        drawBar(bars, barX, values[i].y - st.barHeight / 2, barW, st.barHeight, (save[kind] - min) / (max - min), st.barColor);
        values[i].setText(`${Math.round(save[kind] * 100)}%`);
      });
    };
    rows.forEach(([label, kind, min, max, apply], i) => {
      const top = y0 + st.padding * 2 + st.titleFontSize * 1.2 + i * st.rowHeight;
      const y = top + st.labelFontSize * 1.2 + st.stepButton / 2;
      this.add.text(x0 + st.padding, top, label, font(st.labelFontSize, { fontStyle: 'bold' }));
      const change = (dir) => {
        apply(Phaser.Math.Clamp(Math.round((save[kind] + dir * st.step) * 100) / 100, min, max)); // no 0.30000000004
        redraw();
      };
      button(this, x0 + st.padding + st.stepButton / 2, y, '−', () => change(-1), { width: st.stepButton, height: st.stepButton, variant: 'secondary' });
      button(this, barX + barW + st.padding / 2 + st.stepButton / 2, y, '+', () => change(1), { width: st.stepButton, height: st.stepButton, variant: 'secondary' });
      values.push(this.add.text(x0 + st.width - st.padding, y, '', font(st.labelFontSize, { fontStyle: 'bold' })).setOrigin(1, 0.5));
    });
    redraw();

    // Orientation row: "Pion" / "Poziom", the current one lit. Outside a run a switch restarts the scene under the settings.
    const top = y0 + st.padding * 2 + st.titleFontSize * 1.2 + rows.length * st.rowHeight;
    const oy = top + st.labelFontSize * 1.2 + st.stepButton / 2;
    // In a run the row holds Ekwipunek instead (I opens it too): the orientation only says where to change it.
    this.add.text(x0 + st.padding, top, inRun ? 'Bartek' : 'Ekran', font(st.labelFontSize, { fontStyle: 'bold' }));
    if (inRun) {
      button(this, x0 + st.padding + st.inventoryWidth / 2, oy, 'Ekwipunek', () => this.openInventory(),
        { width: st.inventoryWidth, height: st.stepButton, variant: 'secondary' });
      this.add.text(x0 + st.width - st.padding, oy, 'Ekran zmienisz w siłowni.', font(st.hintFontSize, { color: st.hintColor })).setOrigin(1, 0.5);
      this.input.keyboard.once('keydown-I', () => this.openInventory());
    } else {
      [['Pion', 'portrait'], ['Poziom', 'landscape']].forEach(([label, o], i) => {
        const bx = x0 + st.padding + st.orientWidth / 2 + i * (st.orientWidth + st.orientGap);
        button(this, bx, oy, label, () => {
          if (o === save.orientation || this.closing) return;
          this.closing = true;
          this.scene.stop();
          setOrientation(this.scene.get(this.from), o);
        }, { width: st.orientWidth, height: st.stepButton, variant: o === save.orientation ? 'primary' : 'secondary' });
      });
    }

    // Wycisz (and Wyjdź do menu in a run) in a row above the back button.
    const backY = y0 + panelH - st.padding - st.hintFontSize * 2 - st.backHeight / 2;
    const actY = backY - st.backHeight / 2 - st.padding - st.actionHeight / 2, actW = (st.width - st.padding * 3) / 2;
    const muteLabel = () => (save.muted ? 'Włącz dźwięk' : 'Wycisz');
    const mute = button(this, x0 + st.padding + actW / 2, actY, muteLabel(), () => {
      toggleMute(this.game);
      mute.setLabel(muteLabel());
    }, { width: actW, height: st.actionHeight, fontSize: st.actionFontSize, variant: 'secondary' });
    const rightX = x0 + st.width - st.padding - actW / 2;
    if (inRun) {
      const leave = button(this, rightX, actY, 'Wyjdź do menu', () => {
        if (!this.quitArmed) {
          this.quitArmed = true;
          leave.setLabel('Na pewno?');
          this.hint.setText('Runda się skończy, białko z niej zostanie policzone.').setColor(st.wipeColor);
          return;
        }
        this.quit();
      }, { width: actW, height: st.actionHeight, fontSize: st.actionFontSize, variant: 'secondary' });
      this.input.keyboard.once('keydown-P', () => this.close());
    } else {
      const fresh = button(this, rightX, actY, 'Nowa gra', () => {
        if (!this.wipeArmed) {
          this.wipeArmed = true;
          fresh.setLabel('Na pewno?');
          this.hint.setText('Nowa gra kasuje białko, siłownię i odblokowania.').setColor(st.wipeColor);
          return;
        }
        this.newGame();
      }, { width: actW, height: st.actionHeight, fontSize: st.actionFontSize, variant: 'secondary' });
    }
    button(this, cx, backY, inRun ? 'Wznów' : 'Wróć', () => this.close(), { width: st.backWidth, height: st.backHeight, fontSize: st.backFontSize });
    this.hint = this.add.text(cx, backY + st.backHeight / 2 + st.padding / 2, inRun ? '[Esc / P]   I: ekwipunek   M: wycisz' : '[Esc]   M: wycisz wszystko', font(st.hintFontSize, { color: st.hintColor }))
      .setOrigin(0.5, 0);
    this.input.keyboard.once('keydown-ESC', () => this.close());
    this.input.keyboard.once('keydown-ENTER', () => this.close());
  }

  // Wielkość interfejsu / Przybliżenie kamery: saved, and in a run shown at once (the HUD is laid out again, quietly).
  setView(kind, value) {
    save[kind] = value;
    writeSave(save);
    if (kind === 'menuScale') return applyMenuScale(this.game); // the menu under the settings shows it at once
    if (this.from !== 'GameScene') return;
    const gs = this.scene.get('GameScene');
    if (kind === 'cameraZoom') gs.cameras.main.setZoom(value);
    else this.scene.get('UIScene').scene.restart({ run: gs.run, quiet: true });
  }

  close() {
    if (this.closing) return; // a click and a key press can land in the same frame
    this.closing = true;
    this.scene.stop();
    this.scene.resume(this.from);
    resumeSfx();
  }

  openInventory() {
    if (this.closing) return;
    this.closing = true;
    this.scene.stop();
    this.scene.launch('InventoryScene', { from: this.from }); // the run stays paused under it
  }

  newGame() {
    if (this.closing) return;
    this.closing = true;
    resetProgress();
    resumeSfx();
    this.scene.stop();
    const from = this.scene.get(this.from);
    from.registry.set('titleIntro', true); // the title with its intro, as on a first launch
    from.scene.start('TitleScene');
  }

  quit() {
    if (this.closing) return;
    this.closing = true;
    this.scene.stop();
    const gs = this.scene.get(this.from);
    gs.scene.start('GameOverScene', { run: gs.run, won: !!gs.run?.mapCleared, quit: true }); // the map cleared stays a win
  }
}
