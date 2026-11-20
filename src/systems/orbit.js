// Things circling Bartek that hurt enemies they touch: bees, the dwarf's axes.
// One orbit = one pooled physics group. Each enemy is hurt by an orbit at most once per hitCooldownMs.

// opts: { texture, maxSize, damage (a number or a function returning it), hitCooldownMs,
//         vfx? (hit effect id), hitScale?/hitMs? (the sprite swells on a hit), faceTravel? (turned along the orbit),
//         onHit?(enemy) (after every hit), onKill?(enemy) (an orbit hit killed it) }.
// scene must have `enemies` and `hurtEnemy(enemy, damage, x, y, vfx)` returning true on a kill.
export function createOrbit(scene, opts) {
  const group = scene.physics.add.group({
    defaultKey: opts.texture,
    maxSize: opts.maxSize,
    createCallback: (s) => s.setDepth(1),
  });
  const orbit = { group, opts, angle: 0, clockMs: 0, lastHitMs: new Map() };
  scene.physics.add.overlap(group, scene.enemies, (s, enemy) => {
    if (!s.active || !enemy.active) return;
    const last = orbit.lastHitMs.get(enemy);
    if (last !== undefined && orbit.clockMs - last < opts.hitCooldownMs) return;
    orbit.lastHitMs.set(enemy, orbit.clockMs);
    const killed = scene.hurtEnemy(enemy, typeof opts.damage === 'function' ? opts.damage() : opts.damage, enemy.x, enemy.y, opts.vfx);
    opts.onHit?.(enemy);
    if (killed) opts.onKill?.(enemy);
    if (opts.hitScale && !s.stinging) {
      s.stinging = true;
      scene.tweens.add({ targets: s, scale: opts.hitScale, duration: opts.hitMs, yoyo: true, onComplete: () => { s.stinging = false; } });
    }
  });
  return orbit;
}

// layout: { count, radius, degPerSec, waveAmp, waveHz }. Spaces `count` sprites evenly around (cx, cy);
// waveAmp/waveHz make each one bob in and out a little. The clock only runs while this is called, so pauses stop it.
export function updateOrbit(orbit, cx, cy, layout, delta) {
  orbit.clockMs += delta;
  orbit.angle += Phaser.Math.DegToRad(layout.degPerSec) * (delta / 1000);
  const step = (Math.PI * 2) / Math.max(1, layout.count);
  const wave = orbit.clockMs / 1000 * layout.waveHz * Math.PI * 2;
  const sprites = orbit.group.getChildren();
  for (let i = 0; i < layout.count; i++) {
    const s = sprites[i] ?? orbit.group.get();
    if (!s) break; // pool full
    const a = orbit.angle + i * step, r = layout.radius + Math.sin(wave + i) * layout.waveAmp;
    const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
    if (!s.active) s.enableBody(true, x, y, true, true);
    else s.body.reset(x, y);
    if (orbit.opts.faceTravel) s.setRotation(a + Math.sign(layout.degPerSec || 1) * Math.PI / 2);
  }
  for (let i = layout.count; i < sprites.length; i++) if (sprites[i].active) sprites[i].disableBody(true, true);
}
