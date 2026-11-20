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
