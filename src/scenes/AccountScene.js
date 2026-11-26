import { config } from '../config.js';
import { font, drawPanel, button } from '../systems/ui.js';
import {
  online, onOnlineChange, initOnline, retryOnline, signIn, signOut, setNick, nickError, resolveConflict, deleteAccount,
} from '../systems/online.js';

// Konto over the paused menu (systems/online.js): sign in with Google, pick a nick, the cloud save's state (and the choice
// when this device and the cloud both changed), sign out, delete the account. Redrawn on every change of `online`.
// Wróć or Esc restart the menu under it.

// "1 runda", "3 rundy", "12 rund".
const runs = (n) => `${n} ${n === 1 ? 'runda' : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? 'rundy' : 'rund'}`;
export default class AccountScene extends Phaser.Scene {
  constructor() { super('AccountScene'); }

  init(data) {
    this.closing = false;
    this.mode = data.mode ?? null; // 'nick' (changing it) or 'delete' (asking first)
    this.message = data.message ?? '';
    this.ok = data.ok ?? false; // the message is good news (green)
    this.draft = data.draft; // the nick typed so far, kept over a redraw
    this.busy = false;
  }

  create() {
    const u = config.ui, a = u.account, { width, height } = this.scale, cx = width / 2, x0 = cx - a.width / 2;
    const inner = a.width - a.padding * 2;
    if (online.state === 'off') initOnline();
    this.add.rectangle(0, 0, width, height, 0x000000, u.dimAlpha).setOrigin(0).setInteractive(); // swallows taps for the menu below
    const bg = this.add.graphics();
    const objs = [];
    let y = a.padding;
    const add = (obj, h = obj.height) => {
      objs.push(obj);
      y += h + a.gap;
      return obj;
    };
    const text = (s, color = a.textColor, size = a.textFontSize) => add(this.add.text(cx, y, s, font(size, {
      color, align: 'center', wordWrap: { width: inner },
    })).setOrigin(0.5, 0));
    const btn = (label, onClick, variant = 'secondary') => {
      const b = button(this, cx, y + a.buttonHeight / 2, label, () => this.run(onClick), {
        width: inner, height: a.buttonHeight, fontSize: a.buttonFontSize, variant: this.busy ? 'disabled' : variant,
      });
      return add(b, a.buttonHeight);
    };
    const privacy = () => window.open('./privacy.html', '_blank', 'noopener');

    add(this.add.text(cx, y, 'Konto', font(a.titleFontSize, { fontStyle: 'bold', color: '#ffc400' })).setOrigin(0.5, 0));
    const user = online.user;
    if (online.state === 'error') {
      text(online.error, a.errorColor);
      btn('Spróbuj ponownie', () => retryOnline(), 'primary');
    } else if (online.state !== 'ready') {
      text('Łączenie z serwerem…', a.dimColor);
    } else if (!user) {
      text('Zaloguj się, żeby trzymać postęp w chmurze i grać na kilku urządzeniach.');
      text('Logując się, akceptujesz politykę prywatności. Pokazujemy tylko twój nick, nigdy e-mail.', a.dimColor, a.smallFontSize);
      btn('Zaloguj przez Google', () => signIn(), 'primary');
      btn('Polityka prywatności', privacy);
    } else if (!online.nick || this.mode === 'nick') {
      text(`Wybierz nick: ${config.online.nickMin}-${config.online.nickMax} znaków, litery, cyfry i _. Widzą go inni gracze.`);
      this.nickInput(cx, y + a.inputHeight / 2, objs);
      y += a.inputHeight + a.gap;
      btn('Zapisz nick', () => this.saveNick(), 'primary');
      if (online.nick) btn('Anuluj', () => this.redraw({ mode: null }));
      else btn('Wyloguj', () => signOut());
    } else if (this.mode === 'delete') {
      text('Usunąć konto, nick i zapis w chmurze? Postęp na tym urządzeniu zostaje. Tego nie da się cofnąć.', a.errorColor);
      btn('Tak, usuń konto', async () => {
        const err = await deleteAccount();
        this.redraw(err ? { mode: 'delete', message: err } : { mode: null, message: 'Konto usunięte.', ok: true });
      });
      btn('Anuluj', () => this.redraw({ mode: null }), 'primary');
    } else {
      text(`Zalogowano jako ${online.nick}`, '#ffffff', a.buttonFontSize);
      const c = online.conflict;
      if (c) {
        text('Postęp jest i w chmurze, i na tym urządzeniu. Który zachować? Drugi zniknie.', a.errorColor);
        btn(`Z chmury: ${runs(c.cloud.runs)}, ${c.cloud.protein} białka`, () => resolveConflict(true), 'primary');
        btn(`Z tego urządzenia: ${runs(c.local.runs)}, ${c.local.protein} białka`, () => resolveConflict(false), 'primary');
      } else {
        const sync = { syncing: ['Zapis w chmurze: wysyłanie…', a.dimColor], synced: ['Zapis w chmurze: aktualny', a.okColor],
          error: ['Zapis w chmurze: błąd połączenia, spróbuję przy następnym zapisie', a.errorColor] }[online.sync];
        if (sync) text(...sync);
      }
      btn('Zmień nick', () => this.redraw({ mode: 'nick' }));
      btn('Wyloguj', () => signOut());
      btn('Usuń konto', () => this.redraw({ mode: 'delete' }));
      btn('Polityka prywatności', privacy);
    }
    if (this.message) text(this.message, this.ok ? a.okColor : a.errorColor, a.smallFontSize);
    btn('Wróć', () => this.close(), 'primary');
    y += a.padding - a.gap;

    const top = Math.max(0, (height - y) / 2);
    for (const obj of objs) obj.y += top;
    drawPanel(bg, x0, top, a.width, y);

    this.input.keyboard.once('keydown-ESC', () => this.close());
    const off = onOnlineChange(() => { if (!this.busy) this.redraw({ mode: this.mode }); });
    this.events.once('shutdown', () => {
      off();
      this.input.keyboard.enableGlobalCapture();
    });
  }

  // An HTML text field over the canvas (Phaser DOM), so phones get their keyboard; game keys stop catching letters meanwhile.
  nickInput(x, y, objs) {
    const a = config.ui.account;
    this.input.keyboard.disableGlobalCapture();
    const field = this.add.dom(x, y, 'input', {
      width: `${a.inputWidth}px`, height: `${a.inputHeight}px`, fontSize: `${a.inputFontSize}px`, textAlign: 'center',
      fontFamily: config.ui.font, borderRadius: '10px', border: '2px solid #ffc400', background: '#1b1b1b', color: '#ffffff',
      boxSizing: 'border-box', outline: 'none',
    });
    const el = field.node;
    el.maxLength = config.online.nickMax;
    el.value = this.draft ?? online.nick ?? '';
    el.autocomplete = 'off';
    el.spellcheck = false;
    el.addEventListener('keydown', (e) => {
      e.stopPropagation(); // letters and Enter stay in the field
      if (e.key === 'Enter') this.saveNick();
      if (e.key === 'Escape') this.close();
    });
    this.nickField = el;
    objs.push(field);
    this.time.delayedCall(0, () => el.focus());
  }

  async saveNick() {
    if (this.busy) return;
    const nick = this.nickField?.value.trim() ?? '';
    this.draft = nick;
    const local = nickError(nick);
    if (local) return this.redraw({ mode: 'nick', message: local });
    if (!(await this.run(() => setNick(nick)))) this.redraw({ mode: null, message: 'Nick zapisany.', ok: true });
  }

  // One action at a time; its error (a string) is shown under the buttons.
  async run(fn) {
    if (this.busy) return '';
    this.busy = true;
    let err = '';
    try { err = (await fn()) ?? ''; } catch { err = 'Coś poszło nie tak. Spróbuj ponownie.'; }
    this.busy = false;
    if (typeof err === 'string' && err && this.scene.isActive()) this.redraw({ mode: this.mode, message: err });
    return err;
  }

  redraw(data) {
    if (this.closing || !this.scene.isActive()) return;
    this.scene.restart({ draft: this.draft, ...data });
  }

  close() {
    if (this.closing) return; // a click and a key press can land in the same frame
    this.closing = true;
    this.scene.start('MenuScene'); // stops this one; the menu opened it
  }
}
