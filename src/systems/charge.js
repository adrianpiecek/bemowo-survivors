import { playVfx } from './vfx.js';

// Charge move (the Sportakus; step 26 bosses reuse it): stop, lock the aim on where Bartek stands now, flash for warnMs,
// then dash straight at that point at `speed` and stop there. State lives on the sprite as z.charge.
// opts: { warnMs, flashMs, flashColor, speed, onWarn(target), onDash() } (the two callbacks are optional).

export function startCharge(scene, z, opts) {
  z.body.stop();
  z.charge = { ...opts, phase: 'warn', ms: 0, target: new Phaser.Math.Vector2(scene.player.x, scene.player.y) };
  opts.onWarn?.(z.charge.target);
}

// Advances the charge; returns true on the frame the dash ends (z.charge is cleared then).
export function updateCharge(scene, z, delta) {
  const c = z.charge;
  c.ms += delta;
  if (c.phase === 'warn') {
    if (Math.floor(c.ms / c.flashMs) % 2) z.clearTint();
    else z.setTint(c.flashColor);
    if (c.ms >= c.warnMs) {
      z.clearTint();
      scene.physics.moveTo(z, c.target.x, c.target.y, c.speed);
      c.dashMs = (Phaser.Math.Distance.BetweenPoints(z, c.target) / c.speed) * 1000;
      c.phase = 'dash';
      c.ms = 0;
      c.onDash?.();
    }
    return false;
  }
  if (c.ms < c.dashMs) return false;
  z.body.stop();
  z.charge = null;
  return true;
}

// Leaper (the Sportakus): walks at Bartek; every leapEverySec, if Bartek is within leapRange, charges at him.
// A target mark shows where it will land, dust where it takes off. Numbers come from the enemy's stats, the walk from z.speed.
export function updateLeaper(scene, z, delta) {
  const s = z.stats;
  if (z.charge) {
    updateCharge(scene, z, delta);
    return;
  }
  scene.physics.moveToObject(z, scene.player, z.speed);
  z.leapMs += delta;
  if (z.leapMs < s.leapEverySec * 1000 || Phaser.Math.Distance.BetweenPoints(z, scene.player) > s.leapRange) return;
  z.leapMs = 0;
  startCharge(scene, z, {
    warnMs: s.warnMs, flashMs: s.flashMs, flashColor: s.flashColor, speed: s.leapSpeed,
    onWarn: (t) => playVfx(scene, 'targetMark', t.x, t.y),
    onDash: () => playVfx(scene, 'dashDust', z.x, z.y),
  });
}
