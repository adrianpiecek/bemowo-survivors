import { config } from '../config.js';
import { save, writeSave, formatTime } from '../state.js';
import { mapById } from '../data/maps.js';
import { plans } from '../data/plans.js';
import { bets } from '../data/bets.js';
import { weapons } from '../data/weapons.js';
import { enemies } from '../data/enemies.js';
import { font, drawPanel, button, dim } from '../systems/ui.js';
import { online, onOnlineChange, initOnline, startDaily, fetchDaily } from '../systems/online.js';
import { todayKey, dailySetup, dayLabel, minutesLeft } from '../systems/daily.js';

const points = (n) => Math.round(n).toLocaleString('pl-PL');
const nameOf = (id) => enemies.find((d) => d.id === id)?.name ?? id;

// Wyzwanie dnia over the paused menu: the day's draw (systems/daily.js), the rules, the day's table (the best
// config.ui.daily.count, the player's row lit up) and Graj, once a day (save.daily; the server's entry for an account).
// Graj starts GameScene with the day; Wróć, Esc or Enter restart the menu under it. Sizes: config.ui.leaderboard.
export default class DailyScene extends Phaser.Scene {
  constructor() { super('DailyScene'); }

  init(data) {
    this.closing = false;
    this.busy = false;
    this.result = data.result ?? null; // { rows, mine } once loaded
    this.failed = data.failed ?? false;
    this.message = data.message ?? '';
  }

  create() {
    const u = config.ui, c = u.leaderboard, { width, height } = this.scale, cx = width / 2, x0 = cx - c.width / 2;
    const inner = c.width - c.padding * 2, left = x0 + c.padding;
    if (online.state === 'off') initOnline();
    this.day = todayKey();
    const d = dailySetup(this.day);
    dim(this).setInteractive(); // swallows taps for the menu below
    const bg = this.add.graphics();
    const objs = [];
    const add = (o) => { objs.push(o); return o; };
    let y = c.padding;
    const text = (s, color = c.dimColor, size = c.textFontSize) => {
      const t = add(this.add.text(cx, y, s, font(size, { color, align: 'center', wordWrap: { width: inner } })).setOrigin(0.5, 0));
      y += t.height + c.gap;
    };
    const title = add(this.add.text(cx, y, 'Wyzwanie dnia', font(c.titleFontSize, { fontStyle: 'bold', color: '#ffc400' })).setOrigin(0.5, 0));
    y += title.height + c.gap;
    const mins = minutesLeft();
    text(`${dayLabel(this.day)}. Następne za ${Math.floor(mins / 60)} h ${mins % 60} min`, u.daily.soonColor);

    // The draw: the same for everyone today.
    const bet = bets.find((b) => b.id === d.bet), betLevel = Math.min(config.daily.betLevel, bet.maxLevel);
    const first = enemies.filter((e) => !e.isBoss && e.spawnWeight > 0 && e.appearsAtSec === 0).map((e) => e.name);
    const order = [...first, ...Object.entries(d.appearsAt).sort((a, b) => a[1] - b[1]).map(([id]) => nameOf(id))];
    const waves = d.waves.slice(0, config.daily.wavesShown).map(nameOf).join(' → ');
    // The plan and the bet as their effects, a plus in green and a minus in red (as on the plan cards).
    const ps = u.planScreen, plan = plans.find((p) => p.id === d.plan), white = '#ffffff';
    const lines = (list) => {
      for (const [s, color] of list) {
        const t = add(this.add.text(cx, y, s, font(c.textFontSize, { color, align: 'center', wordWrap: { width: inner } })).setOrigin(0.5, 0));
        y += t.height;
      }
      y += c.gap;
    };
    lines([
      [`Mapa: ${mapById(d.map).name}, trudność ${d.difficulty}`, white],
      ['Plan treningowy:', white], [plan.plus, ps.plusColor], [plan.minus ?? 'bez minusów', plan.minus ? ps.minusColor : ps.plusColor],
      ['Zakład z Unc:', white], [bet.description(betLevel), ps.minusColor], [`+${Math.round(betLevel * bet.proteinPct * 100)}% białka`, ps.plusColor],
      [`Broń na start: ${weapons.find((w) => w.id === d.weapon).name}`, white],
      [`Wrogowie po kolei: ${order.join(', ')}`, white],
      [`Fale: ${waves} …`, white],
    ]);
    text('Bez siłowni i twoich zakładów, każda broń i pasywka może wypaść. Liczy się tylko pierwsza runda dnia.');

    // The player's run today: on this device (save.daily) or in the table (another device).
    const local = !config.debug.dailyReplay && save.daily.day === this.day, mine = this.result?.mine;
    const played = local || !!mine;
    if (mine) text(`Twoja runda dziś: ${mine}. miejsce`, '#ffc400');
    else if (local) text(save.daily.score == null ? 'Dzisiejsza runda jest już rozpoczęta albo przerwana.' : `Twoja runda dziś: ${points(save.daily.score)} pkt`, '#ffc400');

    // The day's table.
    if (online.state === 'error' || this.failed) {
      text(online.state === 'error' ? 'Bez połączenia: tabela dnia niedostępna, runda nie trafi do tabeli.' : 'Nie udało się wczytać tabeli dnia.', c.errorColor);
    } else if (!this.result) {
      text('Wczytywanie tabeli dnia…');
      this.fetchRows();
    } else {
      const rows = this.result.rows.slice(0, u.daily.count);
      if (!rows.length) text('Dziś jeszcze nikt nie skończył rundy. Bądź pierwszy!');
      rows.forEach((r, i) => {
        const ry = y + i * c.rowHeight, my = r.uid === online.user?.uid, mid = ry + c.rowHeight / 2;
        if (my) add(this.add.rectangle(left, ry, inner, c.rowHeight, c.mineColor, c.mineAlpha).setOrigin(0));
        else if (i % 2 === 0) add(this.add.rectangle(left, ry, inner, c.rowHeight, 0xffffff, c.stripeAlpha).setOrigin(0));
        const style = (color, bold) => font(c.fontSize, { color, fontStyle: bold ? 'bold' : 'normal' });
        add(this.add.text(left + c.inner, mid, `${i + 1}.`, style(i < 3 ? '#ffc400' : c.dimColor, true)).setOrigin(0, 0.5));
        add(this.add.text(left + inner * c.nickX, mid, String(r.nick).slice(0, config.online.nickMax), style(my ? '#ffc400' : '#ffffff', my)).setOrigin(0, 0.5));
        add(this.add.text(left + inner * c.mapX, mid, `${r.cleared ? '✓' : `etap ${r.stage}`}  ${formatTime(r.timeMs)}`, font(c.detailFontSize, { color: c.dimColor })).setOrigin(0, 0.5));
        add(this.add.text(left + inner - c.inner, mid, points(r.score), style('#ffffff', true)).setOrigin(1, 0.5));
      });
      y += rows.length * c.rowHeight + c.gap;
      if (!online.user || !online.nick) text('Zaloguj się w Konto i wybierz nick, żeby trafić do tabeli dnia.');
    }
    if (this.message) text(this.message, c.errorColor);

    // Graj (once a day) and Wróć side by side.
    const by = y + c.backHeight / 2, opts = { width: c.backWidth, height: c.backHeight, fontSize: c.backFontSize };
    const connecting = online.state === 'off' || online.state === 'loading';
    if (!played) {
      add(button(this, cx - (c.backWidth + c.gap) / 2, by, connecting ? 'Łączenie…' : 'Graj', () => this.play(),
        { ...opts, variant: connecting ? 'disabled' : 'primary' }));
    }
    add(button(this, played ? cx : cx + (c.backWidth + c.gap) / 2, by, 'Wróć', () => this.close(), { ...opts, variant: 'secondary' }));
    y += c.backHeight + c.padding;

    const top = Math.max(0, (height - y) / 2);
    for (const o of objs) o.y += top;
    drawPanel(bg, x0, top, c.width, y);

    this.input.keyboard.once('keydown-ESC', () => this.close());
    this.input.keyboard.once('keydown-ENTER', () => this.close());
  }

  // The day's entry first (an account that already played elsewhere stops here), then the run.
  async play() {
    if (this.busy || this.closing) return; // a double click
    this.busy = true;
    const res = await startDaily(this.day);
    if (!this.scene.isActive()) return;
    save.daily = { day: this.day, score: null }; // used up from here on, a closed tab included
    writeSave(save);
    if (res === 'played' && !config.debug.dailyReplay) {
      this.busy = false;
      this.redraw({ result: this.result, message: 'Dzisiejsza runda tego konta jest już rozegrana (inne urządzenie).' });
      return;
    }
    this.closing = true;
    this.scene.stop('MenuScene');
    this.scene.start('GameScene', { daily: this.day, ranked: res === 'ranked' });
  }

  // Fetches once the connection is up (it may still be starting), then draws the table; the window also redraws when
  // the connection comes up, so Graj stops waiting.
  fetchRows() {
    const go = () => {
      if (online.state === 'error') return this.redraw({ message: this.message });
      if (online.state !== 'ready' || this.loading) return;
      this.loading = true;
      fetchDaily(this.day).then((result) => this.redraw({ result }), () => this.redraw({ failed: true }));
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
    if (this.closing || this.busy) return; // a click and a key press can land in the same frame
    this.closing = true;
    this.scene.start('MenuScene'); // stops this one; the menu opened it
  }
}
