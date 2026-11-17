import { config } from '../config.js';

// `player` is run.player: HP and weapon stats for the current run.
// Percentage upgrades add a share of the starting value, so every level gives the same boost.
// Fire rate is the exception: it divides the cooldown, which raises shots per second by the given share each level.
const u = config.upgrade;
const pct = (x) => `${Math.round(x * 100)}%`;

export const upgrades = [
  {
    id: 'damage',
    name: 'Obrażenia',
    description: `+${pct(u.damagePct)} obrażeń pocisku`,
    maxStack: u.maxStack,
    apply(player) { player.bulletDamage += config.pistol.bulletDamage * u.damagePct; },
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
    apply(player) { player.speed += config.player.speed * u.moveSpeedPct; },
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
];

// Offered instead of the cards once every upgrade is at maxStack.
export const fallbackUpgrade = {
  id: 'heal',
  name: 'Leczenie',
  description: `+${u.fallbackHeal} HP`,
  maxStack: Infinity,
  apply(player) { player.hp = Math.min(player.maxHp, player.hp + u.fallbackHeal); },
};
