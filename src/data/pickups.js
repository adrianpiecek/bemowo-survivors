import { config } from '../config.js';
import { showOlxAd, pigeonStrike } from '../systems/olx.js';

// Rare drops from killed enemies. `scene` is GameScene. A new pickup is one more object here;
// the pool, drop chance, cooldown, blink, lifetime and banner are handled by GameScene and UIScene.
const o = config.pickups.olx;

export const pickups = [
  {
    id: 'olx',
    name: 'Ogłoszenie z OLX',
    bannerText: 'OGŁOSZENIE Z OLX',
    dropChance: o.dropChance,
    cooldownSec: o.cooldownSec,
    apply(scene) { showOlxAd(scene, () => pigeonStrike(scene)); },
  },
];
