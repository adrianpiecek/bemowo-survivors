import { config } from '../config.js';
import { save, writeSave } from '../state.js';
import { font, drawPanel, button, dim, openPrivacy } from '../systems/ui.js';
import {
  online, onOnlineChange, initOnline, retryOnline, googleWorks, signInGoogle, signInEmail, registerEmail, resetPassword,
  usesPassword, signOut, setNick, nickError, resolveConflict, deleteAccount,
} from '../systems/online.js';

// Konto over the paused menu (systems/online.js): sign in (e-mail and password, or Google where its window works), pick a
// nick, the cloud save's state (and the choice when this device and the cloud both changed), sign out, delete the account.
// Redrawn on every change of `online`. Wróć (never blocked, even while an action waits) or Esc restart the menu under it.

// "1 runda", "3 rundy", "12 rund".
const runs = (n) => `${n} ${n === 1 ? 'runda' : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? 'rundy' : 'rund'}`;

export default class AccountScene extends Phaser.Scene {
  constructor() { super('AccountScene'); }

  init(data) {
    this.closing = false;
    this.mode = data.mode ?? null; // 'email' (the sign-in form), 'nick' (changing it) or 'delete' (asking first)
    this.message = data.message ?? '';
    this.ok = data.ok ?? false; // the message is good news (green)
    this.draft = data.draft ?? {}; // what was typed (nick, e-mail; never the password), kept over a redraw
    this.busy = false;
    this.fields = {};
  }

  create() {
    const u = config.ui, a = u.account, { width, height } = this.scale, cx = width / 2, x0 = cx - a.width / 2;
    const inner = a.width - a.padding * 2;
    if (online.state === 'off') initOnline();
    dim(this).setInteractive(); // swallows taps for the menu below
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
    // free: works even while another action waits (Wróć, Wstecz), so a sign-in that never answers cannot lock the window.
    const btn = (label, onClick, variant = 'secondary', free = false) => add(button(this, cx, y + a.buttonHeight / 2, label,
      free ? onClick : () => this.run(onClick), { width: inner, height: a.buttonHeight, fontSize: a.buttonFontSize, variant }), a.buttonHeight);
    const field = (key, type, placeholder, onEnter) => {
      objs.push(this.field(key, type, placeholder, cx, y + a.inputHeight / 2, onEnter));
      y += a.inputHeight + a.gap;
    };
    const privacy = openPrivacy;
    // Anonymous run stats (online.js sendRunStats): this device's choice, with or without an account.
    const shareStats = () => btn(`Anonimowe statystyki rund: ${save.shareStats ? 'wł.' : 'wył.'}`, () => {
      save.shareStats = !save.shareStats;
      writeSave(save);
      this.redraw({ mode: null });
    }, 'secondary', true);
    const value = (key) => this.fields[key]?.value.trim() ?? '';

    add(this.add.text(cx, y, 'Konto', font(a.titleFontSize, { fontStyle: 'bold', color: '#ffc400' })).setOrigin(0.5, 0));
    if (online.state === 'error') {
      text(online.error, a.errorColor);
      btn('Spróbuj ponownie', () => retryOnline(), 'primary');
    } else if (online.state !== 'ready') {
      text('Łączenie z serwerem…', a.dimColor);
    } else if (!online.user && this.mode === 'email') {
      text('E-mail i hasło (co najmniej 6 znaków). Nowe konto: wpisz je i wybierz „Załóż konto”.');
      const signIn = () => this.run(() => signInEmail(value('email'), this.fields.password.value));
      field('email', 'email', 'e-mail', () => this.fields.password.focus());
      field('password', 'password', 'hasło', signIn);
      btn('Zaloguj', () => signInEmail(value('email'), this.fields.password.value), 'primary');
      btn('Załóż konto', () => registerEmail(value('email'), this.fields.password.value));
      btn('Nie pamiętam hasła', async () => {
        const err = await resetPassword(value('email'));
        if (!err) this.redraw({ mode: 'email', message: 'Wysłaliśmy link do zmiany hasła. Sprawdź pocztę (także spam).', ok: true });
        return err;
      });
      btn('Wstecz', () => this.redraw({ mode: null }), 'secondary', true);
    } else if (!online.user) {
      text('Zaloguj się, żeby trzymać postęp w chmurze i grać na kilku urządzeniach.');
      text('Logując się, akceptujesz politykę prywatności. Pokazujemy tylko twój nick, nigdy e-mail.', a.dimColor, a.smallFontSize);
      btn('Zaloguj e-mailem', () => this.redraw({ mode: 'email' }), 'primary', true);
      if (googleWorks) btn('Zaloguj przez Google', () => signInGoogle());
      else text('Logowanie przez Google nie działa w grze uruchomionej z ekranu początkowego iPhone’a. Użyj e-maila albo otwórz grę w Safari.', a.dimColor, a.smallFontSize);
      shareStats();
      btn('Polityka prywatności', privacy, 'secondary', true);
    } else if (this.mode === 'delete') {
      text('Usunąć konto, nick, wynik w tabeli i zapis w chmurze? Postęp na tym urządzeniu zostaje. Tego nie da się cofnąć.', a.errorColor);
      const del = async () => {
        const err = await deleteAccount(this.fields.password?.value ?? '');
        if (!err) this.redraw({ mode: null, message: 'Konto usunięte.', ok: true });
        return err;
      };
      if (usesPassword()) field('password', 'password', 'hasło, by potwierdzić', () => this.run(del));
      btn('Tak, usuń konto', del);
      btn('Anuluj', () => this.redraw({ mode: null }), 'primary', true);
    } else if (!online.nick || this.mode === 'nick') {
      text(`Wybierz nick: ${config.online.nickMin}-${config.online.nickMax} znaków, litery, cyfry i _. Widzą go inni gracze.`);
      field('nick', 'text', 'nick', () => this.saveNick());
      this.fields.nick.maxLength = config.online.nickMax;
      if (!this.fields.nick.value) this.fields.nick.value = online.nick ?? '';
      btn('Zapisz nick', () => this.saveNick(), 'primary', true);
      if (online.nick) btn('Anuluj', () => this.redraw({ mode: null }), 'secondary', true);
      else {
        btn('Wyloguj', () => signOut());
        btn('Usuń konto', () => this.redraw({ mode: 'delete' }), 'secondary', true); // its cloud save is already up
      }
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
      btn('Zmień nick', () => this.redraw({ mode: 'nick' }), 'secondary', true);
      btn('Wyloguj', () => signOut());
      btn('Usuń konto', () => this.redraw({ mode: 'delete' }), 'secondary', true);
      shareStats();
      btn('Polityka prywatności', privacy, 'secondary', true);
    }
    if (this.message) text(this.message, this.ok ? a.okColor : a.errorColor, a.smallFontSize);
    btn('Wróć', () => this.close(), 'secondary', true);
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

  // An HTML field over the canvas (Phaser DOM), so phones get their keyboard; game keys stop catching letters meanwhile.
  // The first field of a screen gets the focus; Enter calls onEnter.
  field(key, type, placeholder, x, y, onEnter) {
    const a = config.ui.account;
    this.input.keyboard.disableGlobalCapture();
    const dom = this.add.dom(x, y, 'input', {
      width: `${a.inputWidth}px`, height: `${a.inputHeight}px`, fontSize: `${a.inputFontSize}px`, textAlign: 'center',
      fontFamily: config.ui.font, borderRadius: '10px', border: '2px solid #ffc400', background: '#1b1b1b', color: '#ffffff',
      boxSizing: 'border-box', outline: 'none',
    });
    const el = dom.node;
    el.type = type;
    el.placeholder = placeholder;
    el.autocomplete = { email: 'email', password: this.mode === 'email' ? 'current-password' : 'off' }[type] ?? 'off';
    el.autocapitalize = 'off';
    el.spellcheck = false;
    el.value = type === 'password' ? '' : this.draft[key] ?? '';
    el.addEventListener('keydown', (e) => {
      e.stopPropagation(); // letters and Enter stay in the field
      if (e.key === 'Enter') onEnter();
      if (e.key === 'Escape') this.close();
    });
    if (!Object.keys(this.fields).length) this.time.delayedCall(0, () => el.focus());
    this.fields[key] = el;
    return dom;
  }

  async saveNick() {
    if (this.busy) return;
    const nick = this.fields.nick?.value.trim() ?? '';
    this.draft = { ...this.draft, nick };
    const local = nickError(nick);
    if (local) return this.redraw({ mode: 'nick', message: local });
    if (!(await this.run(() => setNick(nick)))) this.redraw({ mode: null, message: 'Nick zapisany.', ok: true });
  }

  // One action at a time (the window greys nothing out, a second tap is just ignored); its error (a string) is shown
  // under the buttons.
  async run(fn) {
    if (this.busy) return '';
    this.busy = true;
    let err = '';
    try { err = (await fn()) ?? ''; } catch { err = 'Coś poszło nie tak. Spróbuj ponownie.'; }
    this.busy = false;
    if (typeof err === 'string' && err && this.scene.isActive()) this.redraw({ mode: this.mode, message: err });
    return err;
  }

  keepDraft() {
    const v = (k) => this.fields[k]?.value.trim();
    return { ...this.draft, email: v('email') || this.draft.email, nick: v('nick') || this.draft.nick };
  }

  redraw(data) {
    if (this.closing || !this.scene.isActive()) return;
    this.scene.restart({ draft: this.keepDraft(), ...data });
  }

  close() {
    if (this.closing) return; // a click and a key press can land in the same frame
    this.closing = true;
    this.scene.start('MenuScene'); // stops this one; the menu opened it
  }
}
