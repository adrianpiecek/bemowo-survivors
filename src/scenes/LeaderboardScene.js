import { config } from '../config.js';
import { formatTime } from '../state.js';
import { maps } from '../data/maps.js';
import { font, drawPanel, button, dim } from '../systems/ui.js';
import { online, onOnlineChange, initOnline, retryOnline, fetchLeaderboard } from '../systems/online.js';

// Wyniki over the paused menu: the best `count` players (systems/online.js fetchLeaderboard), one row each: place, nick,
// the map with the stage reached (✓ when cleared, plus the overtime survived) and the score; the player's own row lit up,
// and their place under the table when it is lower. Without a connection or an account it says why. Wróć, Esc or Enter
// restart the menu under it.
const mapName = (id) => maps.find((m) => m.id === id)?.name ?? id;
const points = (n) => Math.round(n).toLocaleString('pl-PL');

export default class LeaderboardScene extends Phaser.Scene {
  constructor() { super('LeaderboardScene'); }

  init(data) {
    this.closing = false;
    this.result = data.result ?? null; // { rows, mine } once loaded
    this.failed = data.failed ?? false;
  }

  create() {
    const u = config.ui, c = u.leaderboard, { width, height } = this.scale, cx = width / 2, x0 = cx - c.width / 2;
    const inner = c.width - c.padding * 2, left = x0 + c.padding;
    if (online.state === 'off') initOnline();
    dim(this).setInteractive(); // swallows taps for the menu below
    const bg = this.add.graphics();
    const objs = [];
    const add = (o) => { objs.push(o); return o; };
    let y = c.padding;
    const text = (s, color = c.dimColor) => {
      const t = add(this.add.text(cx, y, s, font(c.textFontSize, { color, align: 'center', wordWrap: { width: inner } })).setOrigin(0.5, 0));
      y += t.height + c.gap;
    };
    const title = add(this.add.text(cx, y, 'Wyniki', font(c.titleFontSize, { fontStyle: 'bold', color: '#ffc400' })).setOrigin(0.5, 0));
    y += title.height + c.gap;

    if (online.state === 'error' || this.failed) {
      text(online.state === 'error' ? online.error : 'Nie udało się wczytać wyników. Sprawdź połączenie.', c.errorColor);
      const retry = button(this, cx, y + c.backHeight / 2, 'Spróbuj ponownie', () => {
        if (online.state === 'error') retryOnline();
        this.scene.restart({});
      }, { width: c.backWidth, height: c.backHeight, fontSize: c.backFontSize, variant: 'secondary' });
      add(retry);
      y += c.backHeight + c.gap;
    } else if (!this.result) {
      text('Wczytywanie…');
      this.fetchRows();
    } else {
      const { rows, mine } = this.result;
      if (!rows.length) text('Jeszcze nikt nie ma wyniku. Bądź pierwszy!');
      rows.forEach((r, i) => {
        const ry = y + i * c.rowHeight, my = r.uid === online.user?.uid, mid = ry + c.rowHeight / 2;
        if (my) add(this.add.rectangle(left, ry, inner, c.rowHeight, c.mineColor, c.mineAlpha).setOrigin(0));
        else if (i % 2 === 0) add(this.add.rectangle(left, ry, inner, c.rowHeight, 0xffffff, c.stripeAlpha).setOrigin(0));
        const style = (color, bold) => font(c.fontSize, { color, fontStyle: bold ? 'bold' : 'normal' });
        add(this.add.text(left + c.inner, mid, `${i + 1}.`, style(i < 3 ? '#ffc400' : c.dimColor, true)).setOrigin(0, 0.5));
        add(this.add.text(left + inner * c.nickX, mid, String(r.nick).slice(0, config.online.nickMax), style(my ? '#ffc400' : '#ffffff', my)).setOrigin(0, 0.5));
        const where = `${mapName(r.map)} ${r.cleared ? '✓' : `etap ${r.stage}`}${r.overtimeMs > 0 ? `  +${formatTime(r.overtimeMs)}` : ''}`;
        add(this.add.text(left + inner * c.mapX, mid, where, font(c.detailFontSize, { color: c.dimColor })).setOrigin(0, 0.5));
        add(this.add.text(left + inner - c.inner, mid, points(r.score), style('#ffffff', true)).setOrigin(1, 0.5));
      });
      y += rows.length * c.rowHeight + c.gap;
      const shown = rows.some((r) => r.uid === online.user?.uid);
      if (mine && !shown) text(`Twoje miejsce: ${mine}. (${points(online.best)} pkt)`, '#ffc400');
      else if (!online.user) text('Zaloguj się w Konto, żeby trafić do tabeli.');
      else if (!online.nick) text('Wybierz nick w Konto, żeby trafić do tabeli.');
      else if (!mine) text('Zagraj rundę, żeby trafić do tabeli.');
      text('Wynik: zabici wrogowie razy mnożnik etapu i trudności. Liczy się najlepsza runda.', c.dimColor);
    }

    add(button(this, cx, y + c.backHeight / 2, 'Wróć', () => this.close(), { width: c.backWidth, height: c.backHeight, fontSize: c.backFontSize, variant: 'secondary' }));
    y += c.backHeight + c.padding;

    const top = Math.max(0, (height - y) / 2);
    for (const o of objs) o.y += top;
    drawPanel(bg, x0, top, c.width, y);

    this.input.keyboard.once('keydown-ESC', () => this.close());
    this.input.keyboard.once('keydown-ENTER', () => this.close());
  }

  // Fetches once the connection is up (it may still be starting), then draws the table.
  fetchRows() {
    const go = () => {
      if (online.state === 'error') return this.redraw({});
      if (online.state !== 'ready' || this.loading) return;
      this.loading = true;
      fetchLeaderboard(config.ui.leaderboard.count)
        .then((result) => this.redraw({ result }), () => this.redraw({ failed: true }));
    };
    this.loading = false;
    const off = onOnlineChange(go);
    this.events.once('shutdown', off);
    go();
  }

  redraw(data) {
    if (this.closing || !this.scene.isActive()) return;
    this.scene.restart(data);
  }

  close() {
    if (this.closing) return; // a click and a key press can land in the same frame
    this.closing = true;
    this.scene.start('MenuScene'); // stops this one; the menu opened it
  }
}
