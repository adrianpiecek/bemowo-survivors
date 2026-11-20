import { config } from '../config.js';
import { showOlxAd, pigeonStrike } from '../systems/olx.js';
import { addEffect } from '../systems/effects.js';

// Pickups. `scene` is GameScene. A new pickup is one more object here;
// the pool, drop chance, cooldown, blink, lifetime and banner are handled by GameScene and UIScene.
// Optional fields:
//   icon   texture key (drawn in BootScene), default 'pickup'
//   onMap  also spawns by itself on the map now and then (config.pickups.mapSpawn)
//   effect id of the timed effect it starts: UIScene shows the icon and the time left
//   aura   config.textures.auras id drawn around Bartek while that effect lasts
//   vfx    config.vfx id played on Bartek when picked up
// apply(scene, sprite) gets the pickup's sprite too (the chest reads its count from it). No bannerText: no banner.
const pk = config.pickups, o = pk.olx, ps = pk.photoshop;
const fr = pk.freeze, pw = pk.preworkout, bb = pk.bubble, pi = pk.pierogi, mg = pk.magnet;

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
    effect: 'smallB',
    apply(scene) { addEffect(scene.run, smallB); },
  },
  {
    id: 'magnet',
    name: 'Magnes z lodówki',
    bannerText: 'MAGNES Z LODÓWKI',
    bannerSubtext: 'Pamiątka z Władysławowa.',
    dropChance: mg.dropChance,
    cooldownSec: mg.cooldownSec,
    icon: 'pickup_magnet',
    onMap: true,
    vfx: 'vacuumPull',
    apply(scene) { scene.magnetAllGems(); },
  },
  {
    id: 'freeze',
    name: 'Zimny prysznic',
    bannerText: 'ZIMNY PRYSZNIC',
    bannerSubtext: 'Zombie stoją i nie gryzą.',
    dropChance: fr.dropChance,
    cooldownSec: fr.cooldownSec,
    icon: 'pickup_freeze',
    onMap: true,
    effect: 'freeze',
    vfx: 'frostNova',
    apply(scene) { addEffect(scene.run, { id: 'freeze', durationMs: fr.durationSec * 1000, apply() {} }); },
  },
  {
    id: 'preworkout',
    name: 'Przedtreningówka',
    bannerText: 'PRZEDTRENINGÓWKA',
    bannerSubtext: `x${pw.fireRateMult} szybkostrzelność`,
    dropChance: pw.dropChance,
    cooldownSec: pw.cooldownSec,
    icon: 'pickup_preworkout',
    onMap: true,
    effect: 'preworkout',
    aura: 'rage',
    apply(scene) {
      addEffect(scene.run, { id: 'preworkout', durationMs: pw.durationSec * 1000, apply(pl) { pl.fireRateMs /= pw.fireRateMult; } });
    },
  },
  {
    id: 'bubble',
    name: 'Bańka',
    bannerText: 'BAŃKA',
    bannerSubtext: 'Przestrzeń osobista, proszę.',
    dropChance: bb.dropChance,
    cooldownSec: bb.cooldownSec,
    icon: 'pickup_bubble',
    onMap: true,
    effect: 'bubble',
    aura: 'bubble',
    apply(scene) { addEffect(scene.run, { id: 'bubble', durationMs: bb.durationSec * 1000, apply() {} }); },
  },
  {
    // Only bosses drop it, with count = their config chest; the debug P key drops one with a single upgrade.
    id: 'chest',
    name: 'Skrzynia',
    dropChance: 0,
    cooldownSec: 0,
    icon: 'chest',
    vfx: 'chestOpen',
    apply(scene, p) { scene.openChest(p.count); },
  },
  {
    id: 'pierogi',
    name: 'Pierogi babci',
    bannerText: 'PIEROGI BABCI',
    bannerSubtext: `+${pi.heal} HP`,
    dropChance: pi.dropChance,
    cooldownSec: pi.cooldownSec,
    icon: 'pickup_pierogi',
    onMap: true,
    vfx: 'holyHeal',
    apply(scene) {
      const pl = scene.run.player;
      pl.hp = Math.min(pl.maxHp, pl.hp + pi.heal);
    },
  },
];
