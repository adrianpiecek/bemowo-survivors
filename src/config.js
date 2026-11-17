export const config = {
  game: { width: 1280, height: 720, background: '#000000' },
  player: { speed: 200, maxHp: 100, invulnMs: 500, blinkMs: 80, blinkAlpha: 0.3 },
  pistol: { fireRateMs: 800, range: 400, bulletSpeed: 500, bulletDamage: 5, bulletsPerShot: 1 },
  zombie: { speed: 60, hp: 10, contactDamage: 10 },
  runner: { speed: 120, hp: 4, contactDamage: 10, appearsAtSec: 120 },
  spawn: { startIntervalMs: 1000, minIntervalMs: 200, ringMinRadius: 780, ringMaxRadius: 800, maxEnemies: 150 },
  xp: { gemValue: 1, magnetRadius: 80, gemSpeed: 400, baseToLevel: 5, perLevel: 5 },
  run: { durationSec: 600 },
  pools: { bullets: 100, enemies: 150, gems: 300 },
  ui: { margin: 16, hudFontSize: 24, titleFontSize: 64, subtitleFontSize: 20, buttonFontSize: 32, buttonPadding: 12, lineGap: 56,
    dimAlpha: 0.6, card: { count: 3, width: 240, height: 320, gap: 40, color: 0x2a2a2a, borderColor: 0xffffff, borderWidth: 2 } },
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
