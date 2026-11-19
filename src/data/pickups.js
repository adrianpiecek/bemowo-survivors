import { config } from '../config.js';
import { showOlxAd, pigeonStrike } from '../systems/olx.js';
import { addEffect } from '../systems/effects.js';

// Rare drops from killed enemies. `scene` is GameScene. A new pickup is one more object here;
// the pool, drop chance, cooldown, blink, lifetime and banner are handled by GameScene and UIScene.
const o = config.pickups.olx, ps = config.pickups.photoshop;

// Timed effect from the Photoshop pickup.
const smallB = {
  id: 'smallB',
  durationMs: ps.durationSec * 1000,
  apply(player) {
    player.scale *= ps.scale;
    player.speed *= 1 + ps.speedPct;
    player.bulletDamage *= 1 + ps.damagePct;
  },
};

export const pickups = [
  {
    id: 'olx',
    name: 'Ogłoszenie z OLX',
    bannerText: 'OGŁOSZENIE Z OLX',
    dropChance: o.dropChance,
    cooldownSec: o.cooldownSec,
    apply(scene) { showOlxAd(scene, () => pigeonStrike(scene)); },
  },
  {
    id: 'photoshop',
    name: 'Photoshop',
    bannerText: 'MAŁY B',
    bannerSubtext: 'Nie każdy w Gigantach jest gigantem.',
    dropChance: ps.dropChance,
    cooldownSec: ps.cooldownSec,
    apply(scene) { addEffect(scene.run, smallB); },
  },
];
