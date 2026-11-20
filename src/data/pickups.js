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
//   heals  it heals Bartek: never drops with the bet Bez pierogów
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
    player.damageMult *= 1 + ps.damagePct;
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
    bannerSubtext: `Nie każdy w Gigantach jest gigantem.\nMniejszy i o ${Math.round(ps.speedPct * 100)}% szybszy, ale o ${Math.round(-ps.damagePct * 100)}% słabszy przez ${ps.durationSec} s`,
    dropChance: ps.dropChance,
    cooldownSec: ps.cooldownSec,
    effect: 'smallB',
    apply(scene) { addEffect(scene.run, smallB); },
  },
  {
    id: 'magnet',
    name: 'Magnes z lodówki',
    bannerText: 'MAGNES Z LODÓWKI',
    bannerSubtext: 'Pamiątka z Józefowa.\nWszystkie kryształy z mapy lecą do Bartka',
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
    bannerSubtext: `Zombie stoją i nie gryzą przez ${fr.durationSec} s`,
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
    bannerSubtext: `Bronie strzelają ${pw.fireRateMult}x szybciej przez ${pw.durationSec} s`,
    dropChance: pw.dropChance,
    cooldownSec: pw.cooldownSec,
    icon: 'pickup_preworkout',
    onMap: true,
    effect: 'preworkout',
    aura: 'rage',
    apply(scene) {
      addEffect(scene.run, { id: 'preworkout', durationMs: pw.durationSec * 1000, apply(pl) { pl.cooldownMult /= pw.fireRateMult; } });
    },
  },
  {
    id: 'bubble',
    name: 'Bańka',
    bannerText: 'BAŃKA',
    bannerSubtext: `Przestrzeń osobista, proszę.\nBez obrażeń przez ${bb.durationSec} s`,
    dropChance: bb.dropChance,
    cooldownSec: bb.cooldownSec,
    icon: 'pickup_bubble',
    onMap: true,
    effect: 'bubble',
    aura: 'bubble',
    apply(scene) { addEffect(scene.run, { id: 'bubble', durationMs: bb.durationSec * 1000, apply() {} }); },
  },
  {
    // Bosses drop it with count = their slot's chest; events with one card and evolution false (no evolution inside);
    // elites with items true (one item); the debug P key drops one with a single upgrade.
    // (The locked chests on the map are not pickups: systems/map.js and GameScene.updateWorldChests.)
    id: 'chest',
    name: 'Skrzynia',
    dropChance: 0,
    cooldownSec: 0,
    icon: 'chest',
    vfx: 'chestOpen',
    apply(scene, p) { scene.openChest(p.count, p.evolution, p.items); },
  },
  {
    id: 'pierogi',
    name: 'Pierogi w domu',
    bannerText: 'PIEROGI W DOMU',
    bannerSubtext: `Mamy KFC w domu.\n+${pi.heal} HP`,
    dropChance: pi.dropChance,
    cooldownSec: pi.cooldownSec,
    icon: 'pickup_pierogi',
    onMap: true,
    heals: true,
    vfx: 'holyHeal',
    apply(scene) {
      const pl = scene.run.player;
      pl.hp = Math.min(pl.maxHp, pl.hp + pi.heal);
      scene.run.pierogiEaten++; // toward the Rosół babci unlock (save.stats)
    },
  },
];
