import { config } from '../config.js';

// Animated CC0 effects from assets/effects. Each effect folder has a sprite sheet and a manifest.json that lists
// every frame's rectangle in the sheet, its duration and the pivot. Effect ids are the keys of config.vfx.
const ids = () => Object.keys(config.vfx).filter((k) => k !== 'tier');

export function preloadVfx(scene) {
  for (const id of ids()) {
    const base = `./assets/effects/${config.vfx[id].path}/${config.vfx.tier}/`;
    scene.load.image(id, `${base}sprite-sheet.png`);
    scene.load.json(`${id}Manifest`, `${base}manifest.json`);
  }
}

// Cuts each sheet by its manifest and makes a one-shot animation with the effect's id.
export function createVfxAnims(scene) {
  for (const id of ids()) {
    const m = scene.cache.json.get(`${id}Manifest`), tex = scene.textures.get(id);
    tex.setFilter(Phaser.Textures.FilterMode.NEAREST); // pixel art
    const [w, h] = m.source_size;
    let totalMs = 0;
    for (const f of m.frames) {
      const s = f.sheet, frame = tex.add(f.frame, 0, s.x, s.y, s.width, s.height);
      // The manifest pivot becomes the sprite's origin on every frame.
      frame.customPivot = true;
      frame.pivotX = m.pivot[0] / w;
      frame.pivotY = m.pivot[1] / h;
      totalMs += f.duration.numerator_ms / f.duration.denominator;
    }
    // shortcut: plays at the average frame time; fine while the sheets use equal frame times, per-frame timing if one does not.
    scene.anims.create({ key: id, frames: m.frames.map((f) => ({ key: id, frame: f.frame })), duration: totalMs });
  }
}

// GameScene's pool of effect sprites. When it is full the effect is skipped: it is only decoration.
export function createVfxPool(scene) {
  return scene.add.group({ classType: Phaser.GameObjects.Sprite, defaultKey: ids()[0], maxSize: config.pools.vfx });
}

export function playVfx(scene, id, x, y) {
  const s = scene.vfx.get(x, y);
  if (!s) return;
  s.setActive(true).setVisible(true).setDepth(1).setScale(config.vfx[id].scale).play(id);
  s.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => s.setActive(false).setVisible(false));
}
