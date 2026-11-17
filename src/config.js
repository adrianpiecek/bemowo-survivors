export const config = {
  game: { width: 1280, height: 720, background: '#000000' },
  player: { speed: 200, maxHp: 100, invulnMs: 500, blinkMs: 80, blinkAlpha: 0.3 },
  pistol: { fireRateMs: 800, range: 400, bulletSpeed: 500, bulletDamage: 5, bulletsPerShot: 1 },
  zombie: { speed: 80, hp: 10, contactDamage: 15 },
  runner: { speed: 160, hp: 4, contactDamage: 15, appearsAtSec: 60, spawnChance: 0.4 },
  spawn: { startIntervalMs: 450, minIntervalMs: 70, ringMinRadius: 780, ringMaxRadius: 800, maxEnemies: 150 },
  xp: { gemValue: 1, magnetRadius: 80, gemSpeed: 400, baseToLevel: 5, perLevel: 5 },
  run: { durationSec: 600 },
  protein: { perKills: 10, perMinute: 2, winBonus: 20 }, // awarded at the end of a run
  debugResetSave: false, // true wipes the save on page load, for testing
  pools: { bullets: 100, enemies: 150, gems: 300 },
  upgrade: { maxStack: 5, damagePct: 0.25, fireRatePct: 0.15, extraBullets: 1, moveSpeedPct: 0.1, maxHp: 20, fallbackHeal: 20 },
  ui: { margin: 16, hudFontSize: 24, titleFontSize: 64, subtitleFontSize: 20, buttonFontSize: 32, buttonPadding: 12, lineGap: 56,
    dimAlpha: 0.6, card: { count: 3, width: 260, height: 320, gap: 40, color: 0x2a2a2a, borderColor: 0xffffff, borderWidth: 2, nameFontSize: 22, textFontSize: 18 },
    bubble: { durationMs: 1500, offsetY: 56, fontSize: 20, padding: 6 },
    hud: { barWidth: 260, barHeight: 22, barGap: 8, barFontSize: 16, barBg: 0x333333, hpColor: 0xd03030, xpColor: 0x3a8dff },
    joystick: { radius: 70, knobRadius: 30, color: 0xffffff, baseAlpha: 0.25, knobAlpha: 0.5, deadZone: 0.15 },
    welcome: { fontSize: 72, holdMs: 1500, fadeMs: 1000 },
  },
  // Placeholder texture sizes in px.
  textures: {
    bartek: { height: 80 }, // on-screen height; width follows the image's aspect ratio
    ground: { size: 64, color: 0x6e6e6e, lineColor: 0x555555, lineWidth: 2 },
    zombie: { height: 56, bodyRadius: 22 }, // on-screen px; width follows the image
    runner: { radius: 11, color: 0x7cfc00 },
    bullet: { radius: 3, color: 0xffffff },
    gem: { size: 12, color: 0x3a8dff },
  },
};
