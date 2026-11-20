import { config } from '../config.js';

// Effects drawn in code. An effect is config.vfx[id]: { minGapMs?, layers: [...] }, each layer one of
//   particles: a burst from a particle emitter (one emitter per layer, made on first use in each scene)
//   image:     one drawn shape that tweens its scale and alpha (from a pool of images per scene)
// Every texture they use is drawn by createVfxTextures in BootScene, white unless the shape needs its own colours,
// so a layer's tint colours it. playVfx works in any scene: GameScene, LevelUpScene, ChestScene.

// Small white shapes, size from config.textures.fx.
export function createVfxTextures(scene) {
  const f = config.textures.fx, g = scene.add.graphics();
  const tex = (key, size) => g.generateTexture(key, size, size).clear();
  const star = (cx, cy, points, outer, inner) => {
    const pts = [];
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 ? inner : outer, a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
      pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
    }
    return pts;
  };

  g.fillStyle(0xffffff).fillCircle(f.dot, f.dot, f.dot);
  tex('fx_dot', f.dot * 2);
  g.fillStyle(0xffffff).fillPoints(star(f.spark, f.spark, 4, f.spark, f.spark * 0.3), true);
  tex('fx_spark', f.spark * 2);
  // Soft puff: stacked circles, faint at the edge.
  for (let i = 4; i >= 1; i--) g.fillStyle(0xffffff, 0.25).fillCircle(f.puff, f.puff, (f.puff * i) / 4);
  tex('fx_puff', f.puff * 2);
  g.lineStyle(f.ringWidth, 0xffffff).strokeCircle(f.ring, f.ring, f.ring - f.ringWidth);
  tex('fx_ring', f.ring * 2);
  // Target: a ring, four ticks pointing in, a dot in the middle.
  const t = f.target;
  g.lineStyle(3, 0xffffff).strokeCircle(t, t, t - 3);
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    g.lineBetween(t + Math.cos(a) * (t - 2), t + Math.sin(a) * (t - 2), t + Math.cos(a) * t * 0.45, t + Math.sin(a) * t * 0.45);
  }
  g.fillStyle(0xffffff).fillCircle(t, t, 3);
  tex('fx_target', t * 2);
  g.fillStyle(0xffffff).fillPoints(star(f.star, f.star, 5, f.star, f.star * 0.45), true);
  tex('fx_star', f.star * 2);
  // Rays: thin triangles from the middle.
  const r = f.rays;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2, w = 0.09;
    g.fillStyle(0xffffff, i % 2 ? 0.6 : 1)
      .fillTriangle(r, r, r + Math.cos(a - w) * r, r + Math.sin(a - w) * r, r + Math.cos(a + w) * r, r + Math.sin(a + w) * r);
  }
  tex('fx_rays', r * 2);
  const p = f.plus;
  g.fillStyle(0xffffff).fillRect(p * 0.7, 0, p * 0.6, p * 2).fillRect(0, p * 0.7, p * 2, p * 0.6);
  tex('fx_plus', p * 2);
  const k = f.flake;
  g.lineStyle(2, 0xffffff);
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI) / 3;
    g.lineBetween(k - Math.cos(a) * (k - 1), k - Math.sin(a) * (k - 1), k + Math.cos(a) * (k - 1), k + Math.sin(a) * (k - 1));
  }
  tex('fx_flake', k * 2);
  // Chevron pointing up: a thick "^".
  const v = f.chevron;
  g.lineStyle(v * 0.5, 0xffffff).beginPath().moveTo(v * 0.25, v * 1.45).lineTo(v, v * 0.6).lineTo(v * 1.75, v * 1.45).strokePath();
  tex('fx_chevron', v * 2);
  // Muzzle flash, pointing right from its left middle: a yellow spiky cone with a white-hot core.
  const m = f.flash, mh = m / 2;
  g.fillStyle(0xffb300).fillPoints([{ x: 0, y: mh * 0.6 }, { x: m * 0.45, y: 0 }, { x: m * 0.55, y: mh * 0.7 }, { x: m, y: mh },
    { x: m * 0.55, y: mh * 1.3 }, { x: m * 0.45, y: m }, { x: 0, y: mh * 1.4 }], true);
  g.fillStyle(0xfff59d).fillEllipse(m * 0.3, mh, m * 0.55, mh * 0.9);
  g.fillStyle(0xffffff).fillEllipse(m * 0.2, mh, m * 0.3, mh * 0.5);
  g.generateTexture('fx_flash', m, m).clear();
  g.fillStyle(0xd4a017).fillRect(0, 0, f.shell * 2, f.shell).fillStyle(0xfff3b0).fillRect(0, 0, f.shell * 2, 1);
  g.generateTexture('fx_shell', f.shell * 2, f.shell).clear();
  g.destroy();
}

const lastPlayedMs = new Map();

// The scene's emitters and image pool, made on first use and dropped when the scene shuts down (scenes are reused).
function cacheFor(scene) {
  if (!scene.fxCache) {
    scene.fxCache = { emitters: {}, images: scene.add.group({ classType: Phaser.GameObjects.Image, maxSize: config.pools.vfx }) };
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => { scene.fxCache = null; });
  }
  return scene.fxCache;
}

function emitterFor(scene, key, pt) {
  const c = cacheFor(scene);
  if (!c.emitters[key]) {
    c.emitters[key] = scene.add.particles(0, 0, pt.texture, {
      emitting: false,
      speed: { min: pt.speed[0], max: pt.speed[1] },
      lifespan: pt.lifeMs,
      scale: { start: pt.scale[0], end: pt.scale[1] },
      alpha: { start: pt.alpha?.[0] ?? 1, end: pt.alpha?.[1] ?? 0 },
      tint: pt.tint,
      gravityY: pt.gravityY ?? 0,
      rotate: pt.spin ? { min: -pt.spin, max: pt.spin } : 0,
      blendMode: pt.add ? Phaser.BlendModes.ADD : Phaser.BlendModes.NORMAL,
    }).setDepth(pt.depth ?? 1.6);
  }
  return c.emitters[key];
}

// angle (degrees): turns image layers and aims particle layers that have a spread (e.g. the muzzle flash, shells).
export function playVfx(scene, id, x, y, angle = 0) {
  const fx = config.vfx[id], now = performance.now();
  if (fx.minGapMs && now - (lastPlayedMs.get(id) ?? -Infinity) < fx.minGapMs) return;
  lastPlayedMs.set(id, now);
  fx.layers.forEach((layer, i) => {
    if (layer.particles) {
      const pt = layer.particles, e = emitterFor(scene, `${id}_${i}`, pt);
      const dir = angle + (pt.angle ?? 0), spread = pt.spread ?? 360;
      e.setEmitterAngle({ min: dir - spread / 2, max: dir + spread / 2 });
      e.explode(pt.count, x, y);
      return;
    }
    const im = layer.image, s = cacheFor(scene).images.get(x, y);
    if (!s) return; // pool full: the effect is only decoration
    scene.tweens.killTweensOf(s);
    s.setTexture(im.texture).setActive(true).setVisible(true).setDepth(im.depth ?? 1.6).setOrigin(...(im.origin ?? [0.5, 0.5]))
      .setPosition(x, y).setAngle(angle).setScale(im.scale[0]).setAlpha(im.alpha[0]).setBlendMode(im.add ? Phaser.BlendModes.ADD : Phaser.BlendModes.NORMAL);
    if (im.tint !== undefined) s.setTint(im.tint);
    else s.clearTint();
    scene.tweens.add({
      targets: s, scale: im.scale[1], alpha: im.alpha[1], angle: angle + (im.spinDeg ?? 0), duration: im.ms, ease: im.ease ?? 'Cubic.easeOut',
      onComplete: () => s.setActive(false).setVisible(false),
    });
  });
}
