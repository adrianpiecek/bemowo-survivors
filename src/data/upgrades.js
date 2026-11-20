import { config } from '../config.js';
import { bartkowanie, doBartkowanie } from './bartkowanie.js';

// `player` is run.player: HP and weapon stats for the current run.
// Percentage upgrades add a share of the run's starting value (player.base, after the gym),
// so every level gives the same boost and gym and run percentages multiply.
// Fire rate is the exception: it divides the cooldown, which raises shots per second by the given share each level.
// Optional: weight (how often the card is drawn, default 1); apply also gets GameScene as a second argument.
const u = config.upgrade;
const pct = (x) => `${Math.round(x * 100)}%`;

export const upgrades = [
  {
    id: 'damage',
    name: 'Obrażenia',
    description: `+${pct(u.damagePct)} obrażeń pocisku`,
    maxStack: u.maxStack,
    apply(player) { player.bulletDamage += player.base.bulletDamage * u.damagePct; },
  },
  {
    id: 'fireRate',
    name: 'Szybkostrzelność',
    description: `+${pct(u.fireRatePct)} strzałów na sekundę`,
    maxStack: u.maxStack,
    apply(player) { player.fireRateMs /= 1 + u.fireRatePct; },
  },
  {
    id: 'extraBullet',
    name: 'Dodatkowy pocisk',
    description: `+${u.extraBullets} pocisk na strzał, w kolejnego najbliższego zombie`,
    maxStack: u.maxStack,
    apply(player) { player.bulletsPerShot += u.extraBullets; },
  },
  {
    id: 'moveSpeed',
    name: 'Szybkość ruchu',
    description: `+${pct(u.moveSpeedPct)} szybkości chodzenia`,
    maxStack: u.maxStack,
    apply(player) { player.speed += player.base.speed * u.moveSpeedPct; },
  },
  {
    id: 'maxHp',
    name: 'Max HP',
    description: `+${u.maxHp} max HP i leczenie o ${u.maxHp}`,
    maxStack: u.maxStack,
    apply(player) {
      player.maxHp += u.maxHp;
      player.hp = Math.min(player.maxHp, player.hp + u.maxHp);
    },
  },
  {
    id: 'ul',
    name: 'Ul',
    description: 'Pszczoły są szczęśliwe.',
    maxStack: u.maxStack,
    apply(player) { player.bees += player.bees ? config.bees.perLevel : config.bees.firstLevel; },
  },
  {
    id: 'bartkowanie',
    name: 'Bartkowanie',
    description: 'Nikt nie wie, co się stanie. Bartek też nie.',
    maxStack: Infinity,
    weight: config.bartkowanie.weight,
    apply(player, scene) { doBartkowanie(scene, Phaser.Utils.Array.GetRandom(bartkowanie)); },
  },
];

// Offered instead of the cards once every upgrade is at maxStack.
export const fallbackUpgrade = {
  id: 'heal',
  name: 'Leczenie',
  description: `+${u.fallbackHeal} HP`,
  maxStack: Infinity,
  apply(player) { player.hp = Math.min(player.maxHp, player.hp + u.fallbackHeal); },
};
