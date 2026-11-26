import { config } from '../config.js';
import { save } from '../state.js';
import { playMusic } from '../systems/audio.js';
import { font, panel, drawPanel, button } from '../systems/ui.js';
import { openSettings } from './SettingsScene.js';
import { startRun } from './PlanScene.js';
import { betsOpen, betSum } from '../data/bets.js';
import { online, onOnlineChange } from '../systems/online.js';

// The main menu between runs (after the title and after every run): the protein, one button per place, and Bartek with a
// quote. The gym itself (GymScene) only sells upgrades now. Wyzwania, Statystyki, Bestiariusz and Zakłady z Unc open over
// this scene and come back to it; Ustawienia too. Enter starts a run, Esc opens the settings.
export default class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    const mn = config.ui.menu, gs = config.ui.gymScreen, { width, height } = this.scale;
    const outline = { stroke: '#000000', strokeThickness: 5 };
    playMusic(this, 'gym');

    this.add.text(width / 2, mn.titleY, 'Bemowo Survivors', font(mn.titleFontSize, { fontStyle: 'bold', color: '#ffc400', ...outline }))
      .setOrigin(0.5, 0);
    // Protein in a pill under the title, as in the gym.
    const pr = gs.protein, prX = (width - pr.width) / 2, prY = mn.titleY + mn.titleFontSize * 1.2 + mn.proteinGap;
    panel(this, prX, prY, pr.width, pr.height);
    this.add.image(prX + gs.padding + pr.iconSize / 2, prY + pr.height / 2, 'coin_gold').setDisplaySize(pr.iconSize, pr.iconSize);
    this.add.text(prX + pr.width - gs.padding, prY + pr.height / 2, `${save.protein}${config.debug.freeProtein ? ' (debug)' : ''}`,
      font(pr.fontSize, { fontStyle: 'bold' })).setOrigin(1, 0.5);

    // The button column: the run, the gym, Zakłady z Unc (after the first win), then the small windows two per row.
    const cx = width * mn.columnX, overlay = (key) => () => {
      this.scene.pause();
      this.scene.launch(key);
    };
    let y = mn.top;
    const big = (label, onClick, h, size, variant) => {
      const b = button(this, cx, y + h / 2, label, onClick, { width: mn.width, height: h, fontSize: size, variant });
      y += h + mn.gap;
      return b;
    };
    big('Na Bemowo!', () => startRun(this), mn.goHeight, mn.goFontSize);
    const gym = big('Siłownia', () => this.scene.start('GymScene'), mn.height, mn.fontSize, 'secondary');
    // After the very first run the gym pulses, so the player finds where the protein goes.
    if (save.runsPlayed === 1) this.tweens.add({ targets: gym, scale: config.ui.gymPulse.scale, duration: config.ui.gymPulse.ms, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    if (betsOpen()) {
      const sum = Math.round(betSum() * 100);
      big(`Zakłady z Unc  ${sum ? `+${sum}% białka` : '(bez zakładów)'}`, overlay('BetsScene'), mn.height, mn.betsFontSize, 'secondary');
    }
    const small = [['Wyzwania', 'icon_trophy', overlay('ChallengesScene')], ['Statystyki', 'icon_stats', overlay('StatsScene')],
      ['Bestiariusz', 'icon_bestiary', overlay('BestiaryScene')], ['Ustawienia', 'icon_gear', () => openSettings(this)],
      [online.nick ?? 'Konto', 'icon_account', overlay('AccountScene')]];
    const sw = (mn.width - mn.gap) / 2;
    small.forEach(([label, icon, onClick], i) => {
      const x = cx + (i % 2 ? 1 : -1) * (sw + mn.gap) / 2, by = y + Math.floor(i / 2) * (mn.smallHeight + mn.gap) + mn.smallHeight / 2;
      const b = button(this, x, by, label, onClick, { width: sw, height: mn.smallHeight, fontSize: mn.smallFontSize, variant: 'secondary' });
      b.list[1].x += mn.iconSize / 2; // the label moves right of the icon
      b.add(this.add.image(-sw / 2 + mn.iconPad + mn.iconSize / 2, 0, icon).setDisplaySize(mn.iconSize, mn.iconSize));
    });
    y += Math.ceil(small.length / 2) * (mn.smallHeight + mn.gap);
    this.add.text(cx, y, '[Enter] na Bemowo   [Esc] ustawienia', font(mn.hintFontSize, { color: gs.descColor })).setOrigin(0.5, 0);
    y += mn.hintFontSize * 1.2;

    // Bartek and his quote: under the buttons (portrait) or left of them (landscape), only where it fits.
    const quoteW = gs.bartekHeight + gs.quoteGap + gs.tail + gs.quoteWidth + gs.padding * 2;
    if (mn.quoteSide) this.addQuote(mn.quoteLeft, mn.top);
    else if (y + mn.quoteGap + gs.bartekHeight <= height - mn.bottom) this.addQuote((width - quoteW) / 2, y + mn.quoteGap);

    // Which build is on this device (GitHub Pages and the phone cache it): bottom right corner.
    this.add.text(width - mn.versionMargin, height - mn.versionMargin, `v0.${config.version}`, font(mn.versionFontSize, { color: mn.versionColor }))
      .setOrigin(1, 1);
    this.input.keyboard.once('keydown-ENTER', () => startRun(this));
    this.input.keyboard.on('keydown-ESC', () => openSettings(this));
    // A login or a save taken from the cloud while the menu shows: draw it again (nick on the button, protein).
    const seen = `${online.nick}|${online.revision}`;
    const off = onOnlineChange(() => {
      if (`${online.nick}|${online.revision}` !== seen && this.scene.isActive()) this.scene.restart();
    });
    this.events.once('shutdown', off);
  }

  // Bartek with a speech bubble (a random quote) and a Bartkowanie definition under it, from (x0, top).
  addQuote(x0, top) {
    const gs = config.ui.gymScreen;
    const bartek = this.add.image(x0, top, 'bartek').setOrigin(0, 0);
    bartek.setScale(gs.bartekHeight / bartek.height);
    const bx = x0 + bartek.displayWidth + gs.quoteGap + gs.tail, by = bartek.y;
    const quote = this.add.text(bx + gs.padding, by + gs.padding, `„${Phaser.Utils.Array.GetRandom(config.gym.quotes)}”`,
      font(gs.quoteFontSize, { color: '#1b1b1b', fontStyle: 'bold', wordWrap: { width: gs.quoteWidth } }));
    const bw = quote.width + gs.padding * 2, bh = quote.height + gs.padding * 2;
    const bubble = this.add.graphics().setDepth(-1);
    drawPanel(bubble, bx, by, bw, bh, { color: 0xffffff, alpha: 1, borderColor: 0x000000, borderAlpha: 0.6 });
    bubble.fillStyle(0xffffff).fillTriangle(bx + 1, by + bh * 0.35, bx + 1, by + bh * 0.75, bx - gs.tail, by + bh * 0.7); // tail toward Bartek
    this.add.text(bx, by + bh + gs.padding, Phaser.Utils.Array.GetRandom(config.bartkowanie.definitions), font(gs.definitionFontSize, {
      fontStyle: 'italic', color: gs.definitionColor, wordWrap: { width: gs.quoteWidth + gs.padding * 2 },
    }));
  }
}
