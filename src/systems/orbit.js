// Things circling Bartek that hurt enemies they touch: bees now, Kratos blades later.
// One orbit = one pooled physics group. Each enemy is hurt by an orbit at most once per hitCooldownMs.

// opts: { texture, maxSize, damage, hitCooldownMs }. scene must have `enemies` and `hurtEnemy(enemy, damage, x, y)`.
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
    scene.hurtEnemy(enemy, opts.damage, s.x, s.y);
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
  }
  for (let i = layout.count; i < sprites.length; i++) if (sprites[i].active) sprites[i].disableBody(true, true);
}
