import { config } from '../config.js';
import { enemies } from '../data/enemies.js';

// Boss "golf". Cycle: drive slowly at Bartek, stop and flash red (aim is locked at that moment),
// charge straight at the locked point, stop, open the trunk and fire a fan of klapas, close it, repeat.
// State lives on the pooled sprite: phase, phaseMs, target.

export function startGolf(z) {
  setPhase(z, 'drive');
}

function setPhase(z, phase) {
  z.phase = phase;
  z.phaseMs = 0;
}

export function updateGolf(scene, z, delta) {
  const b = config.boss, p = scene.player;
  z.phaseMs += delta;

  if (z.phase === 'drive') {
    scene.physics.moveToObject(z, p, b.speed);
    z.setRotation(z.body.velocity.angle());
    if (z.phaseMs >= b.driveSec * 1000) {
      z.body.stop();
      z.target = new Phaser.Math.Vector2(p.x, p.y);
      z.setRotation(Phaser.Math.Angle.Between(z.x, z.y, p.x, p.y));
      setPhase(z, 'warn');
    }
  } else if (z.phase === 'warn') {
    if (Math.floor(z.phaseMs / b.flashMs) % 2) z.clearTint();
    else z.setTint(b.flashColor);
    if (z.phaseMs >= b.warnSec * 1000) {
      z.clearTint();
      scene.physics.moveTo(z, z.target.x, z.target.y, b.chargeSpeed);
      z.chargeMs = (Phaser.Math.Distance.BetweenPoints(z, z.target) / b.chargeSpeed) * 1000;
      setPhase(z, 'charge');
    }
  } else if (z.phase === 'charge') {
    if (z.phaseMs >= z.chargeMs) {
      z.body.stop();
      z.setTexture('golfOpen');
      fireKlapas(scene, z);
      setPhase(z, 'open');
    }
  } else if (z.phase === 'open' && z.phaseMs >= b.openSec * 1000) {
    z.setTexture('golf');
    setPhase(z, 'drive');
  }
}

// fanCount klapas spread evenly over fanDeg, centered on Bartek.
function fireKlapas(scene, z) {
  const b = config.boss, klapa = enemies.find((d) => d.id === 'klapa'), p = scene.player;
  const mid = Phaser.Math.RadToDeg(Phaser.Math.Angle.Between(z.x, z.y, p.x, p.y));
  for (let i = 0; i < b.fanCount; i++) {
    const k = scene.spawnEnemy(klapa, z.x, z.y);
    if (!k) return;
    const deg = mid + (b.fanCount > 1 ? (i / (b.fanCount - 1) - 0.5) * b.fanDeg : 0);
    scene.physics.velocityFromAngle(deg, klapa.speed, k.body.velocity);
  }
}
