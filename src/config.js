export const config = {
  game: { width: 1280, height: 720, background: '#000000' },
  player: { speed: 200, maxHp: 100, invulnMs: 500, blinkMs: 80, blinkAlpha: 0.3 },
  pistol: { fireRateMs: 800, range: 400, bulletSpeed: 500, bulletDamage: 5, bulletsPerShot: 1 },
  // Enemy numbers; the types themselves are in data/enemies.js. Spawn picks among unlocked types by spawnWeight.
  enemies: {
    zombie: { speed: 80, hp: 10, contactDamage: 15, appearsAtSec: 0, spawnWeight: 0.6 },
    runner: { speed: 160, hp: 4, contactDamage: 15, appearsAtSec: 60, spawnWeight: 0.4 },
    joker: { speed: 90, hp: 30, contactDamage: 20, appearsAtSec: 180, spawnWeight: 0.15 },
    homelander: { speed: 100, hp: 80, contactDamage: 30, appearsAtSec: 300, spawnWeight: 0.08 },
    klapa: { speed: 200, hp: 3, contactDamage: 30, appearsAtSec: 240, spawnWeight: 0.05, spinDegPerSec: 540 }, // 2.5x zombie speed
  },
  // Boss "golf": once a run. Cycle: drive at Bartek, stop and flash red, charge where he stood, open the trunk and fire klapas.
  boss: {
    appearsAtSec: 480, bannerSec: 2, hp: 1500, speed: 50, contactDamage: 30,
    driveSec: 4, warnSec: 1, flashMs: 100, flashColor: 0xff0000, chargeSpeed: 650, openSec: 0.8, fanCount: 5, fanDeg: 60,
    olxDamagePct: 0.1, // the OLX flock takes this share of max HP instead of killing it
    gemCount: 40, gemKind: 'green', gemSpread: 120, proteinBonus: 30, // the rain on top of the Golf's own gem
  },
  scar: { offsetX: 8, offsetY: -19, width: 12, height: 3, angle: -30, color: 0xd01818 }, // on Bartek's forehead, px at normal size
  spawn: { startIntervalMs: 450, minIntervalMs: 70, ringMinRadius: 780, ringMaxRadius: 800, maxEnemies: 250 },
  wave: { everySec: 60, baseCount: 20, perWave: 8 }, // burst of extra enemies every minute, all around Bartek
  // XP gems: each enemy type drops one kind (data/enemies.js), the kind sets the value. Sheets are 4 frames of 16x16.
  xp: { magnetRadius: 80, gemSpeed: 400, baseToLevel: 5, perLevel: 5, gemFrameSize: 16, gemScale: 1.25, gemFps: 8,
    gems: {
      green: { value: 1, file: './assets/Coin_Gems/spr_coin_strip4.png' },
      blue: { value: 3, file: './assets/Coin_Gems/spr_coin_azu.png' },
      yellow: { value: 5, file: './assets/Coin_Gems/spr_coin_ama.png' },
      red: { value: 10, file: './assets/Coin_Gems/spr_coin_roj.png' },
    },
  },
  run: { durationSec: 600 },
  protein: { perKills: 10, perMinute: 2, winBonus: 20 }, // awarded at the end of a run
  // Debug flags, all off by default.
  debug: {
    resetSave: false, // true wipes the save on page load
    freeProtein: false, // true makes gym purchases free
    pickupKey: true, // true: the P key drops a random pickup next to Bartek. shortcut: on for testing, set false before deploy
    tankKey: false, // true: the T key fills the tank bar at once
    klapaKey: false, // true: the K key launches a klapa at Bartek
    bossKey: false, // true: the B key calls the boss now (banner, then the Golf bannerSec later)
  },
  // Ultimate: charged by kills, Space (or a tap on its bar) turns Bartek into a tank.
  tank: { killsToCharge: 100, durationSec: 10, bossDamagePerSec: 50, shakeMs: 300, shakeIntensity: 0.01, barBlinkMs: 200 },
  // Rare drops from killed enemies. Each pickup's own numbers sit under its id.
  pickups: {
    lifetimeSec: 20,
    blinkMs: 150, blinkAlpha: 0.35, // blink while lying on the ground
    debugOffset: 90, // how far from Bartek the P key drops one
    olx: {
      dropChance: 0.003, cooldownSec: 90,
      photo: './assets/golab.png', // when the file is missing the card shows the first pigeon frame
      cardMs: 2000, flockMin: 10, flockMax: 15, flyMs: 1800, flockSpreadMs: 400, waveAmp: 18, waveCycles: 3,
    },
    photoshop: { dropChance: 0.004, cooldownSec: 60, durationSec: 15, scale: 0.5, speedPct: 0.3, damagePct: -0.3 },
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
  effects: { endFlashMs: 600 }, // Bartek blinks this long when a timed effect runs out
  pools: { bullets: 100, enemies: 270, gems: 300, pickups: 10, vfx: 60 }, // enemies: spawn.maxEnemies + room for the boss and its klapas
  upgrade: { maxStack: 5, damagePct: 0.25, fireRatePct: 0.15, extraBullets: 1, moveSpeedPct: 0.1, maxHp: 20, fallbackHeal: 20 },
  ui: { margin: 16, hudFontSize: 24, titleFontSize: 64, subtitleFontSize: 20, buttonFontSize: 32, buttonPadding: 12, lineGap: 56,
    dimAlpha: 0.6, card: { count: 3, width: 260, height: 320, gap: 40, color: 0x2a2a2a, borderColor: 0xffffff, borderWidth: 2, nameFontSize: 22, textFontSize: 18 },
    bubble: { durationMs: 1500, offsetY: 56, fontSize: 20, padding: 6 },
    hud: { barWidth: 260, barHeight: 22, barGap: 8, barFontSize: 16, barBg: 0x333333, hpColor: 0xd03030, xpColor: 0x3a8dff,
      tankColor: 0x2e7d32, tankBlinkColor: 0x9ccc65 },
    joystick: { radius: 70, knobRadius: 30, color: 0xffffff, baseAlpha: 0.25, knobAlpha: 0.5, deadZone: 0.15 },
    bossBar: { y: 52, width: 600, height: 18, fontSize: 14, color: 0xd03030 },
    welcome: { fontSize: 72, holdMs: 1500, fadeMs: 1000 },
    banner: { y: 84, fontSize: 64, strokeThickness: 8, durationMs: 1500, subFontSize: 24, subStrokeThickness: 5 },
    olxCard: { width: 420, height: 440, padding: 24, photoSize: 200, titleFontSize: 34, textFontSize: 20, bigFontSize: 38 },
    buttonOffsetX: 160, // two buttons side by side sit this far left and right of center
    gymScreen: { titleY: 50, proteinY: 110, top: 170, rowHeight: 80, nameX: 120, levelX: 820, costX: 930, buyX: 1090,
      descFontSize: 16, quoteBottom: 110, disabledColor: '#777777', disabledBg: '#333333' },
  },
  // Animated effects from assets/effects (CC0). Only these are loaded; frames and timing come from each manifest.json.
  vfx: {
    tier: 'lit/grid',
    hitSpark: { path: 'impacts/hit-spark', scale: 0.5 }, // bullet hits an enemy
    deathPoof: { path: 'impacts/death-poof', scale: 1 }, // enemy dies
    golfBoom: { path: 'explosions/big-explosion', scale: 2 }, // the Golf is scrapped
  },
  // Texture sizes in px. Images: `height` is the on-screen height, width follows the image, bodyRadius is on-screen too.
  textures: {
    bartek: { height: 80 },
    ground: { size: 64, color: 0x6e6e6e, lineColor: 0x555555, lineWidth: 2 },
    // Enemies are Bartek variants; a bigger one is a stronger one.
    zombie: { height: 56, bodyRadius: 22 },
    uncanny: { height: 50, bodyRadius: 18 },
    joker: { height: 64, bodyRadius: 24 },
    homelander: { height: 72, bodyRadius: 27 },
    klapa: { width: 44, height: 26, color: 0x9a9a9a, borderColor: 0x555555, borderWidth: 4, bodyRadius: 13 },
    bullet: { radius: 3, color: 0xffffff },
    pickup: { size: 22, color: 0xffffff, borderColor: 0xffcc00, borderWidth: 3 },
    tank: { height: 110, bodyRadius: 45 }, // czołg.png: Bartek in a tank, barrel to the left
    // Top-down car facing right; the texture has room for the open trunk lid behind it.
    golf: { carLength: 150, carWidth: 76, wheelLength: 28, wheelWidth: 10, lidLength: 30, bodyRadius: 45,
      color: 0x2b4f8c, glassColor: 0x9cc3e6, wheelColor: 0x1a1a1a, lidColor: 0x23406f, trunkColor: 0x111111 },
    pigeon: { frames: 3, fps: 10, scale: 2, width: 48, height: 40, flipX: true }, // assets/Pigeons/pigeon1..3.png, 24x20 px, facing left; size after scale; flipX turns it to face the flight
  },
};
