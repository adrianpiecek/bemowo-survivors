import { config } from '../config.js';
import { enemies } from './enemies.js';
import { pickups } from './pickups.js';
import { playVfx } from '../systems/vfx.js';
import { warnLine } from '../systems/telegraph.js';

// Run events: GameScene draws config.events.perRun of them for each run and starts each at its second, with a banner
// (name, description). `scene` is GameScene.
//   durationSec  0: everything happens in start; above 0: a time bar under the HUD while it lasts
//   start(scene)                 when it begins
//   update?(scene, delta, ev)    every frame while it lasts; ev is its entry in run.activeEvents (own counters go on it)
//   end?(scene)                  when its time is up
// Numbers in config.events.
const c = config.events;

// The Żabka shop: lies on the map like a pickup (the HUD arrow points at it first), pulses instead of blinking, opens
// ShopScene. It stays until something is bought there (ShopScene ends the promotion) or the promotion is over; walked out
// of without buying, it opens again only once Bartek has walked away (GameScene clears waitLeave).
export const zabkaShop = {
  id: 'zabka', name: 'Żabka', icon: 'zabka_shop', steady: true, arrowFirst: true, pulse: c.zabka.pulse,
  apply(scene, p) {
    p.enableBody(false, p.x, p.y, true, true);
    p.waitLeave = true;
    scene.openScreen('ShopScene');
  },
};

// A random point minDist..maxDist px from Bartek.
function around(scene, minDist, maxDist) {
  const a = Phaser.Math.FloatBetween(0, Math.PI * 2), r = Phaser.Math.FloatBetween(minDist, maxDist);
  return { x: scene.player.x + Math.cos(a) * r, y: scene.player.y + Math.sin(a) * r };
}

// Runs `fn` once per everyMs of the event's time; the counter lives on the event's entry.
function every(ev, delta, everyMs, fn) {
  ev.ms = (ev.ms ?? 0) + delta;
  for (; ev.ms >= everyMs; ev.ms -= everyMs) fn();
}

export const events = [
  {
    id: 'schoolTrip', name: 'Wycieczka szkolna', durationSec: 0,
    description: `${c.schoolTrip.count} goblinów nadciąga z jednej strony`,
    start(scene) {
      const goblin = enemies.find((d) => d.id === 'goblin'), { x, y } = scene.ringPoint(), s = c.schoolTrip.spread;
      for (let i = 0; i < c.schoolTrip.count; i++) {
        scene.spawnEnemy(goblin, x + Phaser.Math.FloatBetween(-s, s), y + Phaser.Math.FloatBetween(-s, s));
      }
    },
  },
  {
    id: 'blackout', name: 'Awaria prądu', durationSec: c.blackout.durationSec,
    description: `Ciemno jak w bloku po 22:00. Przez ${c.blackout.durationSec} s widać tylko krąg wokół Bartka`,
    start(scene) {
      scene.tweens.killTweensOf(scene.darkness);
      scene.tweens.add({ targets: scene.darkness.setVisible(true).setAlpha(0), alpha: 1, duration: c.blackout.fadeMs });
    },
    end(scene) {
      scene.tweens.add({ targets: scene.darkness, alpha: 0, duration: c.blackout.fadeMs, onComplete: () => scene.darkness.setVisible(false) });
    },
  },
  {
    id: 'goldenHour', name: 'Złota godzina', durationSec: c.goldenHour.durationSec,
    description: `${c.goldenHour.xpMult}x XP przez ${c.goldenHour.durationSec} s`,
    start(scene) { scene.run.xpMult = c.goldenHour.xpMult; },
    end(scene) { scene.run.xpMult = 1; },
  },
  {
    id: 'ticketControl', name: 'Kontrola biletów', durationSec: 0,
    description: `${c.ticketControl.elites} elity naraz. Bilety do kontroli!`,
    start(scene) {
      for (let i = 0; i < c.ticketControl.elites; i++) {
        const { x, y } = scene.ringPoint();
        scene.spawnElite(scene.rollEliteTraits(), x, y);
      }
    },
  },
  {
    id: 'zabka', name: 'Promocja w Żabce', durationSec: c.zabka.durationSec,
    description: `Na mapie stoi sklep: karty za monety białka z tej rundy, przez ${c.zabka.durationSec} s`,
    start(scene) {
      const { x, y } = around(scene, c.zabka.minDist, c.zabka.maxDist);
      scene.shop = scene.dropPickup(zabkaShop, x, y, c.zabka.durationSec);
    },
    end(scene) {
      if (scene.shop?.def === zabkaShop) scene.shop.disableBody(true, true); // not visited: the promotion is over
      scene.shop = null;
    },
  },
  {
    id: 'storm', name: 'Burza', durationSec: c.storm.durationSec,
    description: `Przez ${c.storm.durationSec} s pioruny walą we wrogów`,
    update(scene, delta, ev) {
      every(ev, delta, c.storm.everyMs, () => {
        const view = scene.cameras.main.worldView;
        const z = Phaser.Utils.Array.GetRandom(scene.enemies.getChildren().filter((e) => e.active && view.contains(e.x, e.y)));
        if (!z) return;
        playVfx(scene, 'lightning', z.x, z.y);
        scene.hurtEnemy(z, scene.weaponDamage(c.storm.damage), z.x, z.y);
      });
    },
  },
  {
    id: 'festyn', name: 'Festyn osiedlowy', durationSec: 0,
    description: `${c.festyn.count} znajdźki naraz w okolicy`,
    start(scene) {
      Phaser.Utils.Array.Shuffle(pickups.filter((d) => d.onMap)).slice(0, c.festyn.count).forEach((def) => {
        const { x, y } = around(scene, c.festyn.minDist, c.festyn.maxDist);
        scene.dropPickup(def, x, y, config.pickups.mapSpawn.lifetimeSec);
      });
    },
  },
  {
    id: 'gemRain', name: 'Deszcz kryształów', durationSec: c.gemRain.durationSec,
    description: `Przez ${c.gemRain.durationSec} s kryształy spadają wokół Bartka`,
    update(scene, delta, ev) {
      every(ev, delta, c.gemRain.everyMs, () => {
        const { x, y } = around(scene, 0, c.gemRain.radius);
        scene.dropGem(x, y, c.gemRain.kind);
        playVfx(scene, 'gemDrop', x, y);
      });
    },
  },
  {
    id: 'horde', name: 'Chorda nadchodzi', durationSec: c.horde.durationSec,
    description: `${c.horde.spawnMult}x więcej wrogów z jednej strony przez ${c.horde.durationSec} s. Przetrwaj, a dostaniesz skrzynię`,
    start(scene) {
      scene.run.hordeAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      scene.run.spawnRateMult *= c.horde.spawnMult; // on top of Zakłady z Unc
    },
    end(scene) {
      scene.run.hordeAngle = null;
      scene.run.spawnRateMult /= c.horde.spawnMult;
      const { x, y } = around(scene, c.horde.chestDist, c.horde.chestDist);
      scene.dropChest(x, y, 1); // a card, or an evolution that is ready
      scene.scene.get('UIScene').showBanner('CHORDA ODPARTA!', 'Skrzynia za przetrwanie');
    },
  },
  {
    id: 'nightskating', name: 'Nightskating', durationSec: c.nightskating.durationSec,
    description: `Przez ${c.nightskating.durationSec} s zombie na rolkach przejeżdżają przez osiedle. Zejdź im z drogi!`,
    update(scene, delta, ev) {
      every(ev, delta, c.nightskating.everyMs, () => skaterRow(scene));
    },
  },
];

// Nightskating: a row of skaters side by side, rolling straight across Bartek's area from a random side. The red lane
// shows first; then they come from startDist px behind and leave on the other side (GameScene removes 'line' enemies
// once they are far from where they started).
function skaterRow(scene) {
  const n = c.nightskating, pl = scene.player, def = enemies.find((d) => d.id === 'skater'), start = n.startDist * scene.offscreenMult();
  const a = Phaser.Math.FloatBetween(0, Math.PI * 2), dx = Math.cos(a), dy = Math.sin(a);
  const off = Phaser.Math.FloatBetween(-n.laneJitter, n.laneJitter); // the lane's middle, sideways from Bartek
  const sx = pl.x - dx * start - dy * off, sy = pl.y - dy * start + dx * off;
  warnLine(scene, sx, sy, a, start * 2, n.count * n.gap, n.warnMs, () => {
    for (let i = 0; i < n.count; i++) {
      const side = (i - (n.count - 1) / 2) * n.gap, z = scene.spawnEnemy(def, sx - dy * side, sy + dx * side);
      if (!z) break; // pool full
      z.body.setVelocity(dx * z.speed, dy * z.speed);
      z.setAngle(dx >= 0 ? n.leanDeg : -n.leanDeg).setFlipX(dx < 0);
    }
  });
}
