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

// Switches the orientation for good: config, game size, then `scene` (not a run: GameScene builds its world once) restarts.
export function setOrientation(scene, orientation) {
  save.orientation = orientation;
  writeSave(save);
  applyLayout();
  scene.scale.setGameSize(config.game.width, config.game.height);
  scene.scene.restart();
}

// Wielkość menu (save.menuScale): every screen but the run (GameScene, its HUD in UIScene, sized by uiScale), the loading
// and the settings themselves (always readable, so a too big menu can be set back) zooms its camera around the middle.
const UNSCALED = ['BootScene', 'GameScene', 'UIScene', 'SettingsScene'];
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
