export const config = {
  game: { width: 1280, height: 720, background: '#000000' },
  player: { speed: 200, maxHp: 100, invulnMs: 500, blinkMs: 80, blinkAlpha: 0.3 },
  pistol: { fireRateMs: 800, range: 400, bulletSpeed: 500, bulletDamage: 5, bulletsPerShot: 1 },
  zombie: { speed: 80, hp: 10, contactDamage: 15 },
  runner: { speed: 160, hp: 4, contactDamage: 15, appearsAtSec: 60, spawnChance: 0.4 },
  spawn: { startIntervalMs: 450, minIntervalMs: 70, ringMinRadius: 780, ringMaxRadius: 800, maxEnemies: 250 },
  wave: { everySec: 60, baseCount: 20, perWave: 8 }, // burst of extra enemies every minute, all around Bartek
  xp: { gemValue: 1, magnetRadius: 80, gemSpeed: 400, baseToLevel: 5, perLevel: 5 },
  run: { durationSec: 600 },
  protein: { perKills: 10, perMinute: 2, winBonus: 20 }, // awarded at the end of a run
  // Debug flags, all off by default.
  debug: {
    resetSave: false, // true wipes the save on page load
    freeProtein: false, // true makes gym purchases free
    pickupKey: true, // true: the P key drops a random pickup next to Bartek. shortcut: on for testing, set false before deploy
  },
  // Rare drops from killed enemies. Each pickup's own numbers sit under its id.
  pickups: {
    lifetimeSec: 20,
    blinkMs: 150, blinkAlpha: 0.35, // blink while lying on the ground
    debugOffset: 90, // how far from Bartek the P key drops one
    olx: {
      dropChance: 0.003, cooldownSec: 90,
      photo: './assets/golab.png', // a grey placeholder bird is drawn when the file is missing
      cardMs: 2000, flockMin: 10, flockMax: 15, flyMs: 1800, flockSpreadMs: 400, waveAmp: 18, waveCycles: 3,
    },
  },
  // Permanent upgrades bought with protein. Percentages multiply with the in-run upgrades.
  gym: {
    chest: { damagePct: 0.1, maxLevel: 5, costs: [10, 25, 50, 100, 200] },
    legs: { speedPct: 0.05, maxLevel: 5, costs: [10, 25, 50, 100, 200] },
    back: { maxHp: 10, maxLevel: 5, costs: [10, 25, 50, 100, 200] },
    glasses: { rangePct: 0.1, maxLevel: 3, costs: [20, 60, 150] },
    warmup: { durationSec: 60, speedPct: -0.2, damagePct: 0.3, maxLevel: 1, costs: [80] },
    quotes: [
      'Za moich czasów zombie były grzeczniejsze.',
      'Najpierw rozgrzewka. Piętnaście minut. Nie dyskutujemy.',
      'Muchacho, nogi to też mięśnie.',
      'Okulary? To do czytania etykiet odżywek.',
    ],
  },
  pools: { bullets: 100, enemies: 250, gems: 300, pickups: 10 },
  upgrade: { maxStack: 5, damagePct: 0.25, fireRatePct: 0.15, extraBullets: 1, moveSpeedPct: 0.1, maxHp: 20, fallbackHeal: 20 },
  ui: { margin: 16, hudFontSize: 24, titleFontSize: 64, subtitleFontSize: 20, buttonFontSize: 32, buttonPadding: 12, lineGap: 56,
    dimAlpha: 0.6, card: { count: 3, width: 260, height: 320, gap: 40, color: 0x2a2a2a, borderColor: 0xffffff, borderWidth: 2, nameFontSize: 22, textFontSize: 18 },
    bubble: { durationMs: 1500, offsetY: 56, fontSize: 20, padding: 6 },
    hud: { barWidth: 260, barHeight: 22, barGap: 8, barFontSize: 16, barBg: 0x333333, hpColor: 0xd03030, xpColor: 0x3a8dff },
    joystick: { radius: 70, knobRadius: 30, color: 0xffffff, baseAlpha: 0.25, knobAlpha: 0.5, deadZone: 0.15 },
    welcome: { fontSize: 72, holdMs: 1500, fadeMs: 1000 },
    banner: { y: 84, fontSize: 64, strokeThickness: 8, durationMs: 1500 },
    olxCard: { width: 420, height: 440, padding: 24, photoSize: 200, titleFontSize: 34, textFontSize: 20, bigFontSize: 38 },
    buttonOffsetX: 160, // two buttons side by side sit this far left and right of center
    gymScreen: { titleY: 50, proteinY: 110, top: 170, rowHeight: 80, nameX: 120, levelX: 820, costX: 930, buyX: 1090,
      descFontSize: 16, quoteBottom: 110, disabledColor: '#777777', disabledBg: '#333333' },
  },
  // Placeholder texture sizes in px.
  textures: {
    bartek: { height: 80 }, // on-screen height; width follows the image's aspect ratio
    ground: { size: 64, color: 0x6e6e6e, lineColor: 0x555555, lineWidth: 2 },
    zombie: { height: 56, bodyRadius: 22 }, // on-screen px; width follows the image
    runner: { radius: 11, color: 0x7cfc00 },
    bullet: { radius: 3, color: 0xffffff },
    gem: { size: 12, color: 0x3a8dff },
    pickup: { size: 22, color: 0xffffff, borderColor: 0xffcc00, borderWidth: 3 },
    pigeon: { width: 44, height: 30, color: 0x8a8a8a, darkColor: 0x5a5a5a, beakColor: 0xd9a400 },
  },
};
