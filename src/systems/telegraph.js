import { config } from '../config.js';

// Warned attacks (boss powers, data/bossPowers.js): a red area on the ground fills up over warnMs, then strikes. Bartek
// inside it when it strikes takes `damage` (GameScene.hurtPlayer: invulnerability, bubble, tank and armor apply);
// onLand runs either way. Drawn in code; a handful at a time, so made and destroyed rather than pooled. The scene's
// clock and tweens stop while it is paused, so a strike waits under the level-up cards.

// Outline and a pulsing tint of the whole area, plus a fill growing over warnMs that shows when it lands.
function warnArea(scene, x, y, angle, draw, grow) {
  const c = config.boss.powers;
  const area = scene.add.graphics({ x, y }).setDepth(c.depth).setRotation(angle);
  draw(area.fillStyle(c.warnColor, c.warnAlpha).lineStyle(c.warnLine, c.warnColor, c.warnLineAlpha), true);
  const fill = scene.add.graphics({ x, y }).setDepth(c.depth).setRotation(angle);
  draw(fill.fillStyle(c.warnColor, c.warnAlpha), false);
  fill.setScale(grow.x, grow.y);
  scene.tweens.add({ targets: area, alpha: c.pulseAlpha, duration: c.pulseMs, yoyo: true, repeat: -1 });
  return { area, fill, done() { scene.tweens.killTweensOf([area, fill]); area.destroy(); fill.destroy(); } };
}

export function strikeCircle(scene, x, y, radius, warnMs, damage, onLand) {
  const w = warnArea(scene, x, y, 0, (g, outline) => { g.fillCircle(0, 0, radius); if (outline) g.strokeCircle(0, 0, radius); }, { x: 0, y: 0 });
  scene.tweens.add({ targets: w.fill, scale: 1, duration: warnMs });
  scene.time.delayedCall(warnMs, () => {
    w.done();
    if (Phaser.Math.Distance.Between(scene.player.x, scene.player.y, x, y) <= radius) scene.hurtPlayer(damage);
    onLand?.();
  });
}

// Only the warning: a lane `length` px long and `width` wide from (x, y) at `angle`, then onDone (Nightskating).
export function warnLine(scene, x, y, angle, length, width, warnMs, onDone) {
  const rect = (g, outline) => { g.fillRect(0, -width / 2, length, width); if (outline) g.strokeRect(0, -width / 2, length, width); };
  const w = warnArea(scene, x, y, angle, rect, { x: 1, y: 0 });
  scene.tweens.add({ targets: w.fill, scaleY: 1, duration: warnMs });
  scene.time.delayedCall(warnMs, () => {
    w.done();
    onDone();
  });
}

// A beam `length` px long and `width` wide from (x, y) at `angle`: it flashes in beamColor when it strikes.
export function strikeLine(scene, x, y, angle, length, width, warnMs, damage, onLand) {
  const c = config.boss.powers;
  warnLine(scene, x, y, angle, length, width, warnMs, () => {
    const beam = scene.add.graphics({ x, y }).setDepth(c.beamDepth).setRotation(angle);
    beam.fillStyle(c.beamColor, 1).fillRect(0, -width / 2, length, width).fillStyle(0xffffff, 1).fillRect(0, -width / 6, length, width / 3);
    scene.tweens.add({ targets: beam, alpha: 0, duration: c.beamMs, onComplete: () => beam.destroy() });
    // Bartek's distance from the beam's middle line, along it between 0 and length.
    const dx = scene.player.x - x, dy = scene.player.y - y, along = dx * Math.cos(angle) + dy * Math.sin(angle);
    const off = Math.abs(-dx * Math.sin(angle) + dy * Math.cos(angle));
    if (along >= 0 && along <= length && off <= width / 2 + c.playerRadius) scene.hurtPlayer(damage);
    onLand?.();
  });
}
