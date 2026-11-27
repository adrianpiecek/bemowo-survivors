import { config } from '../config.js';
import { save, writeSave } from '../state.js';

// Screen orientation: config.layouts.landscape overrides the portrait numbers in config. Scenes read config when they
// are created, so switching only needs the new numbers merged in, a new game size and the current scene restarted.

// Copies of `src`'s keys out of `dst`, as nested as `src` (the portrait values the landscape layout replaces).
const pick = (dst, src) => Object.fromEntries(Object.keys(src).map((k) => [k, typeof src[k] === 'object' ? pick(dst[k], src[k]) : dst[k]]));
const merge = (dst, src) => {
  for (const k of Object.keys(src)) typeof src[k] === 'object' ? merge(dst[k], src[k]) : (dst[k] = src[k]);
};
const layouts = { landscape: config.layouts.landscape, portrait: pick(config, config.layouts.landscape) };

// Puts the saved orientation's numbers into config; called once before the game is made.
export function applyLayout() {
  merge(config, layouts[save.orientation]);
}

// The game's height: config's, or in portrait on a screen taller than 9:16 as tall as the screen's shape (up to maxHeight),
// so a phone shows no black bars above and below. Screens lay out against scale.height; fixed layouts use extraHeight.
export function gameHeight() {
  const g = config.game;
  if (save.orientation !== 'portrait') return g.height;
  return Phaser.Math.Clamp(Math.round(g.width * innerHeight / innerWidth), g.height, g.maxHeight);
}

// Half of what the screen has over config's height: a layout made for config's height moves down by it to the middle.
export const extraHeight = (scene) => (scene.scale.height - config.game.height) / 2;

// Moves every object of `scene` but 'corner' ones down by extraHeight (a layout made for config's height, in the middle).
export function centerLayout(scene) {
  const dy = extraHeight(scene);
  if (dy) for (const o of scene.children.list) if (!o.getData?.('corner')) o.y += dy;
}

// Switches the orientation for good: config, game size, then `scene` (not a run: GameScene builds its world once) restarts.
export function setOrientation(scene, orientation) {
  save.orientation = orientation;
  writeSave(save);
  applyLayout();
  scene.scale.setGameSize(config.game.width, gameHeight());
  scene.scene.restart();
}

// The window changed shape (a phone going full screen, a turn, a resized window): the new height once it stays still.
// Not during a run or its end screen (GameScene builds its world once, GameOverScene counts the run in init): it waits
// until they are gone. The screens on show then restart, but not the title (it goes on to the menu by itself).
export function watchScreenHeight(game) {
  let timer, pending = false;
  const busy = () => ['GameScene', 'GameOverScene'].some((k) => game.scene.isActive(k) || game.scene.isPaused(k));
  const apply = () => {
    pending = false;
    const h = gameHeight();
    if (h === game.scale.height) return;
    if (busy()) { pending = true; return; }
    game.scale.setGameSize(config.game.width, h);
    for (const s of game.scene.getScenes(true)) if (!['BootScene', 'TitleScene'].includes(s.sys.settings.key)) s.scene.restart();
  };
  addEventListener('resize', () => {
    clearTimeout(timer);
    timer = setTimeout(apply, config.game.resizeMs);
  });
  game.events.on('step', () => { if (pending && !busy()) apply(); });
}

// Wielkość menu (save.menuScale): every screen but the run (GameScene, its HUD in UIScene, sized by uiScale), the loading,
// the title (its logo comes in after the zoom is set and is sized to the screen itself) and the settings themselves
// (always readable, so a too big menu can be set back) zooms its camera around the middle.
const UNSCALED = ['BootScene', 'TitleScene', 'GameScene', 'UIScene', 'SettingsScene'];
const scaled = (game) => game.scene.scenes.filter((s) => !UNSCALED.includes(s.sys.settings.key));

// The zoom of one screen: smaller as set; bigger only as far as its content (all but full-screen backgrounds and dims)
// stays margin px inside the screen, so a screen that fills it (the gym) stays at 100% and a roomy one (the menu) grows.
// An object with data 'corner' (the version in the menu) is left out and kept at its place on the screen.
function zoomScene(s) {
  const { width, height } = s.scale, cx = width / 2, cy = height / 2, m = config.ui.settings.menuScale.margin;
  let dx = 0, dy = 0;
  for (const o of s.children.list) {
    if (!o.visible || !o.getBounds || o.getData?.('corner')) continue;
    const r = o.getBounds();
    if (r.width >= width && r.height >= height) continue;
    dx = Math.max(dx, Math.abs(r.left - cx), Math.abs(r.right - cx));
    dy = Math.max(dy, Math.abs(r.top - cy), Math.abs(r.bottom - cy));
  }
  const fit = Math.min((cx - m) / Math.max(dx, 1), (cy - m) / Math.max(dy, 1));
  const zoom = save.menuScale <= 1 ? save.menuScale : Math.min(save.menuScale, Math.max(1, fit));
  s.cameras.main.setZoom(zoom);
  for (const o of s.children.list) {
    if (!o.getData?.('corner')) continue;
    const [x, y] = o.getData('corner');
    o.setPosition(cx + (x - cx) / zoom, cy + (y - cy) / zoom).setScale(1 / zoom);
  }
}

// Called once the game has booted: each scaled scene gets its zoom whenever it is created (or restarted).
export function watchMenuScale(game) {
  for (const s of scaled(game)) s.sys.events.on('create', () => zoomScene(s));
}

// The new zoom on the scaled scenes on screen now (the menu under the settings).
export function applyMenuScale(game) {
  for (const s of scaled(game)) if (s.sys.isActive() || s.sys.isPaused()) zoomScene(s);
}
