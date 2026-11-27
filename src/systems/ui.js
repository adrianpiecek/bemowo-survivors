import { config } from '../config.js';

// Drawn UI shared by every screen: text style, panels, bars, buttons. Numbers and colours in config.ui.

export const font = (size, extra = {}) => ({ fontFamily: config.ui.font, fontSize: `${size}px`, ...extra });

// Phones and tablets (a coarse main pointer) get no keyboard hints: no keys to press, they only clutter the screen.
export const touch = window.matchMedia('(pointer: coarse)').matches;
// "Wróć [Esc]" with a keyboard, "Wróć" on touch; keyHint('', '[1]') is '[1]' or ''.
export const keyHint = (label, key) => (touch ? label : [label, key].filter(Boolean).join(' '));

// Dark veil over the screen under a window or the cards, three screens wide around the middle so it still covers all
// when Wielkość menu zooms the scene out.
export function dim(scene) {
  const { width, height } = scene.scale;
  return scene.add.rectangle(width / 2, height / 2, width * 3, height * 3, 0x000000, config.ui.dimAlpha);
}

// Rounded panel with a drop shadow, drawn into g (the caller clears g when it redraws).
export function drawPanel(g, x, y, w, h, style = {}) {
  const p = { ...config.ui.panel, ...style };
  g.fillStyle(0x000000, p.shadowAlpha).fillRoundedRect(x + p.shadow, y + p.shadow, w, h, p.radius);
  g.fillStyle(p.color, p.alpha).fillRoundedRect(x, y, w, h, p.radius);
  if (p.borderWidth) g.lineStyle(p.borderWidth, p.borderColor, p.borderAlpha).strokeRoundedRect(x, y, w, h, p.radius);
}

export function panel(scene, x, y, w, h, style) {
  const g = scene.add.graphics();
  drawPanel(g, x, y, w, h, style);
  return g;
}

// Rounded bar: dark track, coloured fill (0..1) with a light stripe on top, dark border.
export function drawBar(g, x, y, w, h, fill, color) {
  const b = config.ui.bar, r = Math.min(b.radius, h / 2), fw = w * Phaser.Math.Clamp(fill, 0, 1);
  g.fillStyle(b.bg, b.bgAlpha).fillRoundedRect(x, y, w, h, r);
  if (fw > 0) {
    // A fill thinner than the corners is drawn as a plain rectangle, a rounded one would bulge out of the track.
    if (fw < r * 2) g.fillStyle(color).fillRect(x, y + 1, fw, h - 2);
    else g.fillStyle(color).fillRoundedRect(x, y, fw, h, r);
    if (fw > r * 2) g.fillStyle(0xffffff, b.shineAlpha).fillRect(x + r, y + 2, fw - r * 2, Math.max(1, h * 0.25));
  }
  g.lineStyle(b.borderWidth, b.borderColor).strokeRoundedRect(x, y, w, h, r);
}

// Rows of a window split into pages: as many as fit in `room` px (less the pager when one page is not enough).
// c: { rowHeight, rowGap, columns, gap, pagerHeight }. Returns the page (clamped), the page count, the rows shown and
// a full page's height (every page as tall, so what is under the rows stays put).
export function pageRows(list, page, room, c) {
  const step = c.rowHeight + c.rowGap, fit = (r) => Math.max(1, Math.floor((r + c.rowGap) / step)) * c.columns;
  let perPage = fit(room);
  if (perPage < list.length) perPage = fit(room - c.gap - c.pagerHeight);
  const pages = Math.ceil(list.length / perPage), p = Phaser.Math.Clamp(page, 0, pages - 1);
  return { page: p, pages, shown: list.slice(p * perPage, (p + 1) * perPage), height: Math.ceil((pages > 1 ? perPage : list.length) / c.columns) * step - c.rowGap };
}

// "<  Strona 1/3  >" centred on (cx, y), the arrow keys too; turn(-1 | 1) changes the page.
// c: { pagerHeight, pagerButton, pagerFontSize, padding }. Returns what it drew (windows move it with their panel).
export function pager(scene, cx, y, page, pages, turn, c) {
  const pw = c.pagerButton, opts = (on) => ({ width: pw, height: c.pagerHeight, fontSize: c.pagerFontSize, variant: on ? 'secondary' : 'disabled' });
  const label = scene.add.text(cx, y, `Strona ${page + 1}/${pages}`, font(c.pagerFontSize, { fontStyle: 'bold' })).setOrigin(0.5);
  const prev = button(scene, cx - label.width / 2 - c.padding - pw / 2, y, '<', () => turn(-1), opts(page > 0));
  const next = button(scene, cx + label.width / 2 + c.padding + pw / 2, y, '>', () => turn(1), opts(page < pages - 1));
  scene.input.keyboard.on('keydown-LEFT', () => turn(-1));
  scene.input.keyboard.on('keydown-RIGHT', () => turn(1));
  return [label, prev, next];
}

// Button: a container at (x, y) (its middle) with a rounded face, a shadow and a label.
// variant: 'primary' (green, the main action), 'secondary' (dark, the rest: Wróć, side screens) or 'disabled' (grey, not clickable). Hover lightens, a press squashes it.
// opts: { width, height, fontSize, variant }. The container gets setLabel(text) and setVariant(variant).
export function button(scene, x, y, label, onClick, opts = {}) {
  const b = config.ui.button, size = opts.fontSize ?? b.fontSize;
  const text = scene.add.text(0, 0, label, font(size, { fontStyle: 'bold', align: 'center' })).setOrigin(0.5); // a label may have two lines
  const w = opts.width ?? text.width + b.padX * 2, h = opts.height ?? text.height + b.padY * 2;
  const g = scene.add.graphics();
  const c = scene.add.container(x, y, [g, text]).setSize(w, h);
  let variant = opts.variant ?? 'primary', hover = false;
  const look = () => (variant === 'primary' ? b : b[variant]);
  const draw = () => {
    const l = look();
    g.clear();
    g.fillStyle(0x000000, 0.4).fillRoundedRect(-w / 2 + b.shadow, -h / 2 + b.shadow, w, h, b.radius);
    g.fillStyle(hover ? l.hover : l.color).fillRoundedRect(-w / 2, -h / 2, w, h, b.radius);
    g.fillStyle(0xffffff, 0.15).fillRoundedRect(-w / 2 + 3, -h / 2 + 3, w - 6, h / 2 - 3, { tl: b.radius - 3, tr: b.radius - 3, bl: 0, br: 0 });
    g.lineStyle(2, l.border).strokeRoundedRect(-w / 2, -h / 2, w, h, b.radius);
    text.setColor(l.text);
  };
  c.setInteractive({ useHandCursor: true })
    .on('pointerover', () => { hover = variant !== 'disabled'; draw(); })
    .on('pointerout', () => { hover = false; draw(); })
    .on('pointerdown', () => {
      if (variant === 'disabled') return;
      scene.tweens.add({ targets: c, scaleX: b.pressScale, scaleY: b.pressScale, duration: b.pressMs, yoyo: true });
      onClick();
    });
  c.setLabel = (s) => { text.setText(s); return c; };
  c.setVariant = (v) => {
    variant = v;
    c.input.cursor = v === 'disabled' ? 'default' : 'pointer';
    draw();
    return c;
  };
  c.setVariant(variant);
  return c;
}
