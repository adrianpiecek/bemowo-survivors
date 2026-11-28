import { config } from '../config.js';
import { news } from '../data/news.js';
import { font, drawPanel, button, dim } from '../systems/ui.js';

// The last version whose news this device has seen. Its own key, not the save: a device setting that never goes to the
// cloud, and closing the window must not mark the save as changed (that could turn a cloud sync into a conflict).
const SEEN_KEY = 'bemowo-survivors-news';
const readSeen = () => {
  try { return Number(localStorage.getItem(SEEN_KEY)) || 0; } catch { return 0; }
};
export function markNewsSeen() {
  try { localStorage.setItem(SEEN_KEY, String(config.version)); } catch { /* blocked storage: shown again next launch */ }
}

// The entries this device has not seen yet, newest first (config.debug.showNews: the latest ones anyway).
export function unseenNews() {
  const seen = config.debug.showNews ? 0 : readSeen();
  return news.filter((n) => n.version > seen).sort((a, b) => b.version - a.version).slice(0, config.ui.news.count);
}

// Co nowego over the paused menu, once after an update (MenuScene): what the latest updates brought and OK.
// OK, Esc or Enter mark them seen and restart the menu under it. Sizes: config.ui.leaderboard.
export default class NewsScene extends Phaser.Scene {
  constructor() { super('NewsScene'); }

  create() {
    const u = config.ui, c = u.leaderboard, { width, height } = this.scale, cx = width / 2, x0 = cx - c.width / 2;
    const inner = c.width - c.padding * 2;
    this.closing = false;
    dim(this).setInteractive(); // swallows taps for the menu below
    const bg = this.add.graphics();
    const objs = [];
    let y = c.padding;
    const text = (s, size, style) => {
      const t = this.add.text(cx, y, s, font(size, { align: 'center', wordWrap: { width: inner }, ...style })).setOrigin(0.5, 0);
      objs.push(t);
      y += t.height;
      return t;
    };
    text('Co nowego', c.titleFontSize, { fontStyle: 'bold', color: '#ffc400' });
    y += c.gap;
    text(`Wersja v0.${config.version}`, c.textFontSize, { color: c.dimColor });
    for (const n of unseenNews()) {
      y += u.news.itemGap;
      text(n.title, c.fontSize, { fontStyle: 'bold', color: '#ffc400' });
      text(n.text, c.textFontSize, { color: '#ffffff' });
    }
    y += u.news.itemGap + c.backHeight / 2;
    objs.push(button(this, cx, y, 'OK', () => this.close(), { width: c.backWidth, height: c.backHeight, fontSize: c.backFontSize }));
    y += c.backHeight / 2 + c.padding;

    const top = Math.max(0, (height - y) / 2);
    for (const o of objs) o.y += top;
    drawPanel(bg, x0, top, c.width, y);

    this.input.keyboard.once('keydown-ESC', () => this.close());
    this.input.keyboard.once('keydown-ENTER', () => this.close());
  }

  close() {
    if (this.closing) return; // a click and a key press can land in the same frame
    this.closing = true;
    markNewsSeen();
    this.scene.start('MenuScene'); // stops this one; the menu opened it
  }
}
