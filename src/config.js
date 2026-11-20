export const config = {
  game: { width: 720, height: 1280, background: '#000000' }, // portrait (the default); landscape sizes are in `layouts`
  player: { speed: 200, maxHp: 100, invulnMs: 500, blinkMs: 80, blinkAlpha: 0.3 },
  // Weapons (data/weapons.js). Bartek starts with `start` and carries up to maxSlots; new ones and levels come as cards.
  weapons: {
    maxSlots: 4,
    start: 'pistol',
    // Evolutions (data/weapons.js, `evolution`): a weapon at its max level plus its passive in a slot evolves from the
    // next chest. Each weapon's `evolution` numbers below.
    // Auto-aims at the nearest enemies in range. levels: what each level after the first adds.
    pistol: { fireRateMs: 600, range: 400, bulletSpeed: 500, bulletDamage: 10, bulletsPerShot: 1,
      levels: [{ bullets: 1 }, { bullets: 1 }, { bullets: 1 }],
      // Uzi z bazaru: fires every fireRateMs, each bullet damagePct of the pistol's and goes through `pierce` enemies.
      evolution: { fireRateMs: 120, damagePct: 0.6, pierce: 1 },
      // The gun's grip sits this far from Bartek's middle toward the target and offsetY px lower; the flash at its barrel tip.
      gun: { distance: 22, offsetY: 8 } },
    // Captain's shield: flies to the nearest enemy within range, bounces `bounces` times to the next nearest ones (not hit
    // yet on this throw) within bounceRange, then flies back; each shield waits cooldownMs once it is back.
    // unlockDamageTaken: the unlock (data/weapons.js) needs a won run with at least this much damage taken.
    shield: { damage: 20, bounces: 2, shields: 1, cooldownMs: 1800, range: 380, bounceRange: 300, speed: 650, hitDist: 20,
      size: 34, spinDegPerSec: 900, unlockDamageTaken: 500,
      levels: [{ bounces: 1 }, { damage: 10 }, { shields: 1 }, { bounces: 2 }, { damage: 10 }, { shields: 1 }],
      evolution: { healPerHit: 1, tint: 0xffd54f } }, // Tarcza Bemowa: thrown again at once, every hit heals Bartek
    // Laughing gas (Joker): every cooldownMs `clouds` clouds land on random ones of the `pick` nearest enemies within range.
    // A cloud lasts durationMs and hurts every enemy inside its radius every tickMs; a "HA" rises from it every laughEveryMs.
    // unlockJokers: Jokers killed in one run to unlock it.
    gas: { damage: 6, clouds: 1, cooldownMs: 3000, range: 350, pick: 5, radius: 70, durationMs: 3000, tickMs: 500,
      laughEveryMs: 450, spinDegPerSec: 25, fadeShare: 0.2, unlockJokers: 30,
      levels: [{ damage: 3 }, { clouds: 1 }, { radius: 15 }, { durationMs: 1000 }, { damage: 4 }, { clouds: 1 }],
      // Smog nad Bemowem: `clouds` clouds that never end, each drifting at speed px/s toward the nearest enemy.
      evolution: { speed: 45 } },
    // Eye laser (Homelander): every cooldownMs one beam per `beams` toward the nearest enemies within range, from Bartek's
    // eyes (eyeOffsetY above his middle, eyeGap apart, at normal size). A beam is `range` long and hurts every enemy whose
    // body is within width/2 of its line. It shows for beamMs. Unlock: kill the boss `unlockBoss` in a won run.
    laser: { damage: 15, beams: 1, cooldownMs: 2500, range: 520, width: 12, beamMs: 260, eyeOffsetY: -14, eyeGap: 7,
      color: 0xff1744, glowColor: 0xff8a80, glowAlpha: 0.35, unlockBoss: 'bigHomelander',
      levels: [{ damage: 8 }, { beams: 1 }, { width: 8 }, { damage: 10 }, { beams: 1 }, { range: 120 }],
      // Wzrok Homelandera: the beams stay on and turn toward their targets at turnDegPerSec, burning damagePct of the
      // laser's damage every tickMs.
      evolution: { turnDegPerSec: 200, tickMs: 200, damagePct: 0.35 } },
    // Ul: bees circling Bartek (systems/orbit.js); a bee hurts an enemy it touches at most once per hitCooldownMs.
    // A bees level adds bees whatever the card's rarity (a rarer card adds damagePct * (mult - 1) of the base damage on top);
    // a damage level is multiplied by it. While Bartek is a small B there are smallMult times more, on the smaller smallRadius.
    // On a hit the bee swells to hitScale for hitMs and the enemy gets the 'beeSting' effect.
    bees: { bees: 2, damage: 4, damagePct: 0.5, hitCooldownMs: 500, radius: 70, degPerSec: 180, waveAmp: 6, waveHz: 1.5,
      smallMult: 2, smallRadius: 42, hitScale: 1.7, hitMs: 90,
      levels: [{ bees: 1 }, { damage: 2 }, { bees: 1 }, { damage: 3 }, { bees: 1 }],
      evolution: { beesMult: 2, pierogiChance: 0.04 } }, // Pasieka babci: beesMult x bees; a bee kill drops Pierogi w domu this often
  },
  // Passives (data/passives.js): items that raise one stat each level, up to maxSlots at once. The numbers are one level
  // at a common card; a rarer card multiplies them (whole numbers round up). unlock*: totals over all runs (save.stats).
  passives: {
    maxSlots: 4,
    creatine: { damagePct: 0.1, maxLevel: 5 },
    coffee: { cooldownPct: 0.08, maxLevel: 5 },
    shoes: { speedPct: 0.08, maxLevel: 5 },
    gainer: { maxHp: 20, maxLevel: 5 },
    dumbbells: { areaPct: 0.1, maxLevel: 5 },
    ticket: { amount: 1, maxLevel: 2 },
    gymPass: { durationPct: 0.1, maxLevel: 5 },
    broth: { regenPerSec: 0.3, maxLevel: 5, unlockPierogi: 20 },
    jacket: { armor: 1, maxLevel: 5, unlockDamageTaken: 2000 },
    clover: { luckPct: 0.1, maxLevel: 5, unlockGoldCoins: 10 },
    notebook: { xpPct: 0.08, maxLevel: 5, unlockLevel: 30 },
    bag: { magnetPct: 0.2, maxLevel: 5 },
  },
  // Enemy numbers; the types themselves are in data/enemies.js. Spawn picks among unlocked types by spawnWeight.
  enemies: {
    // Contact damage is low on purpose: the horde is meant to build up around Bartek, a single touch should not end the run.
    zombie: { speed: 92, hp: 10, contactDamage: 6, appearsAtSec: 0, spawnWeight: 0.6 },
    runner: { speed: 160, hp: 4, contactDamage: 6, appearsAtSec: 45, spawnWeight: 0.4 },
    joker: { speed: 90, hp: 30, contactDamage: 12, appearsAtSec: 180, spawnWeight: 0.15 },
    homelander: { speed: 100, hp: 80, contactDamage: 20, appearsAtSec: 300, spawnWeight: 0.08 },
    // Comes as a pack of packMin-packMax from one point of the spawn ring, packSpread px apart.
    goblin: { speed: 130, hp: 5, contactDamage: 6, appearsAtSec: 90, spawnWeight: 0.12, packMin: 3, packMax: 5, packSpread: 40 },
    // Walks; every leapEverySec, with Bartek within leapRange, stops, flashes for warnMs and leaps where he stood.
    sportakus: { speed: 70, hp: 40, contactDamage: 15, appearsAtSec: 240, spawnWeight: 0.06,
      leapEverySec: 3, leapRange: 450, warnMs: 700, flashMs: 100, flashColor: 0xff0000, leapSpeed: 650 },
    klapa: { speed: 200, hp: 3, contactDamage: 30, appearsAtSec: 240, spawnWeight: 0.05, spinDegPerSec: 540 }, // about 2x zombie speed
  },
  boss: {
    bannerSec: 2,
    olxDamagePct: 0.1, // the OLX flock takes this share of max HP instead of killing it
    gemCount: 40, gemKind: 'green', gemSpread: 120, // the rain on top of the boss's own gem
    // Boss slots in order: atSec when it walks in (banner and boss music bannerSec earlier), hp, chest (upgrades in the
    // chest it drops), protein (paid at the end of the run for the kill). Every run draws one boss from each slot's pool,
    // never one drawn for an earlier slot, and not the same line-up as the run before. Boss HP does not grow with the run time.
    slots: [
      { atSec: 150, hp: 1000, chest: 1, protein: 10, pool: ['bigZombie', 'bigUncanny', 'bigGoblin'] },
      { atSec: 270, hp: 2000, chest: 2, protein: 15, pool: ['bigSportakus', 'bigJoker', 'bigGoblin'] },
      { atSec: 390, hp: 3000, chest: 2, protein: 20, pool: ['bigJoker', 'bigSportakus', 'bigZombie'] },
      { atSec: 570, hp: 4800, chest: 3, protein: 30, pool: ['bigHomelander'] }, // the last one is always the same
    ],
    // The bosses: a bigger copy of a regular enemy type (base), with its behavior. speedMult and damageMult multiply the
    // base numbers, scale its size.
    list: {
      bigZombie: { base: 'zombie', name: 'Wielki Zombie', scale: 2.5, speedMult: 0.8, damageMult: 2 },
      bigUncanny: { base: 'runner', name: 'Wielki Uncanny', scale: 2.6, speedMult: 0.6, damageMult: 2 },
      bigGoblin: { base: 'goblin', name: 'Wielki Goblin', scale: 2.5, speedMult: 0.7, damageMult: 2 },
      bigSportakus: { base: 'sportakus', name: 'Wielki Sportakus', scale: 2.2, speedMult: 1, damageMult: 2 },
      bigJoker: { base: 'joker', name: 'Wielki Joker', scale: 2.2, speedMult: 0.9, damageMult: 2 },
      bigHomelander: { base: 'homelander', name: 'Wielki Homelander', scale: 2, speedMult: 0.9, damageMult: 2 },
    },
  },
  // Elites (data/elites.js): every everySec the next walking enemy that spawns alone (no boss, pack or klapa) becomes an
  // elite with a random trait: hpMult x HP, scale x size, a glow in the trait's colour and its name over its head.
  // It drops a chest with one card; evolutions come only from boss chests.
  elites: {
    everySec: 40, hpMult: 5, scale: 1.25, glowStrength: 4, glowPadding: 8, labelFontSize: 14, labelGap: 2, debugOffset: 200,
    doubleAfterSec: 300, doubleChance: 0.5, // from then on an elite has two traits this often (the name shows both)
    fast: { speedPct: 0.6, color: 0x40c4ff },
    armored: { hpMult: 4, color: 0xb0bec5 },
    splitter: { copies: 3, scale: 0.7, hpPct: 0.5, spread: 30, color: 0x9ccc65 }, // on death: copies of its type, smaller
    vampire: { radius: 160, everyMs: 1000, healPct: 0.15, color: 0xff1744 }, // heals walkers around it (not bosses, not itself)
    // Walks to the nearest gem within seekRadius and takes the ones within stealRadius; dies dropping their XP plus bonusPct.
    thief: { stealRadius: 40, seekRadius: 450, bonusPct: 0.5, color: 0xffd600 },
  },
  // Zakłady z Unc (data/bets.js): proteinPct per level adds to the run's protein (not the coins'). Numbers per level.
  // rewards: a won run with at least this bonus also unlocks the plan Trening z Unc (uncPct) and every locked passive.
  bets: {
    rewards: { uncPct: 0.5, passivesPct: 1 },
    fasterZombies: { speedPct: 0.1, proteinPct: 0.1, maxLevel: 3 }, // every enemy's speed, bosses too
    thickerZombies: { hpPct: 0.2, proteinPct: 0.1, maxLevel: 3 }, // walking enemies' HP (boss HP comes from its slot)
    denserHorde: { spawnPct: 0.25, proteinPct: 0.15, maxLevel: 2 }, // the regular spawn rate
    earlierBosses: { sec: 30, proteinPct: 0.15, maxLevel: 2 },
    noPierogi: { proteinPct: 0.15, maxLevel: 1 }, // pickups that heal (heals: true) do not drop
    twoCards: { cards: 2, proteinPct: 0.2, maxLevel: 1 },
  },
  // Run events (data/events.js): perRun of them in a run (none of the last run's while others are left), each starting
  // at a random second between firstSec and lastSec, at least gapSec after the one before and bossGapSec away from
  // every boss slot. A banner announces each; one that lasts shows a time bar under the HUD.
  events: {
    perRun: 3, firstSec: 50, lastSec: 540, gapSec: 60, bossGapSec: 30,
    schoolTrip: { count: 40, spread: 150 }, // goblins at one point of the spawn ring
    // Dark overlay with a soft hole around Bartek (drawn once, textureSize px, stretched over the screen).
    blackout: { durationSec: 20, holeRadius: 190, edge: 120, alpha: 0.95, textureSize: 256, fadeMs: 600, depth: 10 },
    goldenHour: { durationSec: 30, xpMult: 2 },
    ticketControl: { elites: 3 },
    // A shop minDist-maxDist from Bartek for durationSec; walking in opens `cards` cards for protein from this run's coins.
    // price by the card's rarity (none: a card without one, a new weapon).
    zabka: { durationSec: 45, minDist: 500, maxDist: 700, cards: 3, prices: { none: 15, common: 8, rare: 15, epic: 25, legendary: 40 } },
    storm: { durationSec: 15, everyMs: 400, damage: 30 }, // a bolt into a random enemy on screen; damage goes through weaponDamage
    festyn: { count: 3, minDist: 250, maxDist: 450 }, // map pickups around Bartek
    gemRain: { durationSec: 10, everyMs: 60, radius: 380, kind: 'blue' },
  },
  scar: { offsetX: 8, offsetY: -19, width: 12, height: 3, angle: -30, color: 0xd01818 }, // on Bartek's forehead, px at normal size
  // Spawn rate goes from startPerSec to endPerSec over the run along t^curvePow (above 1: calm start, pressure late).
  // Walking enemies' HP grows by hpPerMinutePct of their base HP for every minute of the run (not the boss).
  // Every enemy's touch (bosses too) hits harder by damagePerMinutePct of its base damage for every minute of the run.
  spawn: { startPerSec: 1.6, endPerSec: 14, curvePow: 0.9, hpPerMinutePct: 0.35, damagePerMinutePct: 0.08, ringMinRadius: 800, ringMaxRadius: 820, maxEnemies: 250 },
  // Hidden pressure (presja Bemowa), 0..max: every sampleSec it looks at the last windowSec. Easy (Bartek lost under calmPct
  // of his max HP and fewer than calmCrowd enemies stood within crowdRadius on average): up by upPerMin a minute, but not
  // for graceSec after any card is taken, so an upgrade is felt first. Struggling (lost over hurtPct, HP under lowHpPct,
  // or more than busyCrowd around): down by downPerMin. Never below 0 (the game as tuned), not before startSec.
  // Pressure p adds p * spawnBonus to the spawn rate and the waves, p * hpBonus to walking enemies' HP (not bosses),
  // and the run's average pressure * proteinPct to its protein.
  dda: { sampleSec: 5, windowSec: 30, startSec: 60, graceSec: 20, crowdRadius: 300, calmCrowd: 8, busyCrowd: 30,
    calmPct: 0.1, hurtPct: 0.3, lowHpPct: 0.35, upPerMin: 0.2, downPerMin: 0.1, max: 1, spawnBonus: 1, hpBonus: 0.4, proteinPct: 0.3 },
  wave: { everySec: 45, baseCount: 6, perWave: 10 }, // a ring of extra enemies all around Bartek, bigger each time
  // XP gems: each enemy type drops one kind (data/enemies.js), the kind sets the value.
  // XP to the next level: baseToLevel + perLevel * (level - 1) + perLevelSq * (level - 1)^2.
  // Drawn in BootScene, gemSize px: a polygon with `sides` corners (stretch: taller than wide), or `cut`: a cut gem
  // (flat top, pointed bottom); facets in `dark`, an inner face in `light`, and a white sparkle.
  xp: { magnetRadius: 80, gemSpeed: 400, baseToLevel: 5, perLevel: 5, perLevelSq: 0.6, gemSize: 20,
    gems: {
      green: { value: 1, sides: 4, stretch: 1.3, color: 0x43a047, dark: 0x1b5e20, light: 0xa5d6a7 },
      blue: { value: 3, sides: 6, stretch: 1.1, color: 0x1e88e5, dark: 0x0d47a1, light: 0x90caf9 },
      yellow: { value: 5, sides: 5, stretch: 1, color: 0xfdd835, dark: 0xf57f17, light: 0xfff9c4 },
      grey: { value: 10, sides: 8, stretch: 1, color: 0x90a4ae, dark: 0x37474f, light: 0xeceff1 },
      red: { value: 25, cut: true, color: 0xe53935, dark: 0x7f0000, light: 0xffcdd2 },
    },
    // Too many gems on the map: the oldest `count` (not coins, not already flying) merge into one worth their sum,
    // coloured as the most valuable kind not above it.
    merge: { above: 200, count: 40 },
  },
  // Protein coins: a rare drop from any killed enemy, collected like gems. Their protein is added at the end of the run.
  // weight: how often each kind comes up when a coin drops. Drawn in BootScene, size px: a rim, a face, a dumbbell.
  coins: {
    dropChance: 0.02, size: 18,
    kinds: {
      red: { protein: 1, weight: 0.75, color: 0xe57373, dark: 0x8e2424, light: 0xffcdd2 },
      silver: { protein: 3, weight: 0.2, color: 0xcfd8dc, dark: 0x546e7a, light: 0xffffff },
      gold: { protein: 10, weight: 0.05, color: 0xffca28, dark: 0xa16800, light: 0xfff8e1 },
    },
  },
  run: { durationSec: 600 },
  protein: { perKills: 10, perMinute: 2, winBonus: 20 }, // awarded at the end of a run
  // Debug flags, all off by default.
  debug: {
    resetSave: false, // true wipes the save on page load
    freeProtein: false, // true makes gym purchases free
    pickupKey: false, // true: the P key drops a random pickup next to Bartek
    tankKey: false, // true: the T key fills the tank bar at once
    klapaKey: false, // true: the K key launches a klapa at Bartek
    bartkowanieKey: false, // true: N, then a digit 1-8, runs that Bartkowanie effect
    balanceOverlay: false, // true: numbers for balancing in the top right (enemies, spawn/s, kills/s, DPS)
    timeSkipKey: false, // true: the J key moves the run clock 60 s forward
    bossKey: false, // true: B, then a digit 1-4, calls that boss (in order of appearance) after its banner
    enemyKey: false, // true: the Y key brings a goblin pack and a Sportakus next to Bartek
    giveWeapon: null, // a weapon id or a list (e.g. ['gas', 'laser']): unlocked in the save and given at the start of every run
    givePassives: null, // a list of passive ids (e.g. ['ticket', 'dumbbells']): unlocked in the save and given at level 1 every run
    drawCharges: null, // a number: every run starts with this many Odśwież, Pomiń and Wywal (gym included)
    forcePlan: null, // a plan id (e.g. 'lazy'): every run but the very first starts with it, no plan screen; unlocked in the save
    evolveKey: false, // true: E puts every carried weapon at its max level and gives its evolution passive; the next chest (P with pickupKey) evolves
    eliteKey: false, // true: the L key spawns an elite next to Bartek, each press with the next trait
    eventKey: false, // true: V, then a digit 1-8, starts that run event (data/events.js order)
    betsUnlocked: false, // true: the gym shows Zakłady z Unc without a won run
    forcePressure: null, // a number 0..dda.max: the hidden pressure stays there all run (the balance overlay shows it)
    gemKey: false, // true: the G key scatters 250 gems around Bartek (they merge) and one coin of each kind
    forceRarity: null, // a config.rarity id (e.g. 'legendary'): every card gets that rarity
  },
  // Ultimate: charged by kills, Space (or a tap on its bar) turns Bartek into a tank.
  tank: { killsToCharge: 100, durationSec: 10, bossDamagePerSec: 50, shakeMs: 300, shakeIntensity: 0.01, barBlinkMs: 200 },
  // Rare drops from killed enemies. Each pickup's own numbers sit under its id.
  pickups: {
    lifetimeSec: 20,
    // Every everySec one random onMap pickup lies down by itself, off screen but a few seconds' walk away.
    mapSpawn: { everySec: 35, minDist: 750, maxDist: 1000, lifetimeSec: 30 },
    blinkMs: 150, blinkAlpha: 0.35, // blink while lying on the ground
    debugOffset: 90, // how far from Bartek the P key drops one
    olx: {
      dropChance: 0.003, cooldownSec: 90,
      photo: './assets/golab.png', // when the file is missing the card shows the first pigeon frame
      cardMs: 2000, flockMin: 10, flockMax: 15, flyMs: 1800, flockSpreadMs: 400, waveAmp: 18, waveCycles: 3,
    },
    photoshop: { dropChance: 0.004, cooldownSec: 60, durationSec: 15, scale: 0.5, speedPct: 0.3, damagePct: -0.3 },
    magnet: { dropChance: 0.004, cooldownSec: 45 }, // every gem on the map flies to Bartek
    freeze: { dropChance: 0.003, cooldownSec: 60, durationSec: 5, tint: 0x9fd8ff }, // walkers stand still and do no damage
    preworkout: { dropChance: 0.003, cooldownSec: 60, durationSec: 8, fireRateMult: 2 },
    bubble: { dropChance: 0.003, cooldownSec: 60, durationSec: 6 }, // no damage taken
    pierogi: { dropChance: 0.004, cooldownSec: 30, heal: 30 },
  },
  // Permanent upgrades bought with protein. Percentages multiply with the in-run upgrades.
  gym: {
    chest: { damagePct: 0.1, maxLevel: 5, costs: [10, 25, 50, 100, 200] },
    legs: { speedPct: 0.05, maxLevel: 5, costs: [10, 25, 50, 100, 200] },
    back: { maxHp: 10, maxLevel: 5, costs: [10, 25, 50, 100, 200] },
    glasses: { rangePct: 0.1, maxLevel: 3, costs: [20, 60, 150] },
    warmup: { durationSec: 60, speedPct: -0.2, damagePct: 0.3, maxLevel: 1, costs: [80] },
    plan: { rerolls: 1, banishes: 1, maxLevel: 3, costs: [30, 80, 160] }, // Plan dnia: more level-up rerolls and banishes
    quotes: [
      'Za moich czasów zombie były grzeczniejsze.',
      'Najpierw rozgrzewka. Piętnaście minut. Nie dyskutujemy.',
      'Muchacho, nogi to też mięśnie.',
      'Okulary? To do czytania etykiet odżywek.',
    ],
  },
  // "Bartkowanie" card: a random effect from data/bartkowanie.js on every pick, no stack limit.
  bartkowanie: {
    weight: 0.5, durationSec: 5, damagePct: 0.2, allStatsPct: 0.01, protein: 5,
    spins: 3, spinMs: 1500, squatAmp: 8, squatHz: 3, // squats: enemies hop squatAmp px up and down squatHz times a second
    yellowColor: 0xffd400, yellowAlpha: 0.25,
    definitions: [ // shown in the gym under Bartek's bubble
      'Bartkowanie (czas.): czynność, której nikt nie widział, ale wszyscy o niej słyszeli.',
      'Bartkowanie: robienie przysiadów w kolejce w Żabce.',
      'Bartkowanie: tłumaczenie zombie przepisów ruchu drogowego.',
      'Bartkowanie: noszenie żółtego swetra w lipcu.',
      'Bartkowanie: przegrywanie z klapą bagażnika, z godnością.',
    ],
  },
  // Sounds. A missing file is skipped, the game runs on without it. events: game event -> file key.
  // minGapMs: a sound that fires in bursts (hits, gems) plays at most once per this many ms.
  audio: {
    files: {
      clang: { file: './assets/sounds/title_hit.wav', volume: 0.8 },
      // shortcut: music is WAV (~10 MB together), slow on a phone's first load; convert to OGG/MP3 before deploy.
      musicGameplay: { file: './assets/music/gameplay.wav', volume: 0.35 },
      musicGym: { file: './assets/music/gym.wav', volume: 0.35 },
      musicBoss: { file: './assets/music/Boss.wav', volume: 0.4 },
      muchacho: { file: './assets/audio/muchacho.mp3', volume: 1 }, // optional
      levelUp: { file: './assets/sounds/level_up.wav', volume: 0.7 },
      pick: { file: './assets/sounds/pick.wav', volume: 0.4, minGapMs: 50 },
      playerDamage: { file: './assets/sounds/player_damage.wav', volume: 0.6 },
      powerUp: { file: './assets/sounds/power_up.wav', volume: 0.7 },
      shotHit: { file: './assets/sounds/shot_hit.wav', volume: 0.3, minGapMs: 50 },
      muzzleShot: { file: './assets/muzzle-flash-pixel-fx-v1/sounds/fx-muzzle-shot.wav', volume: 1, minGapMs: 50 }, // mastered quiet
    },
    events: { tank: 'powerUp', pickup: 'powerUp', boss: 'clang' },
    // Music tracks: an optional intro played once, then the loop, joined without a gap. One track at a time.
    music: {
      gameplay: { loop: 'musicGameplay' },
      gym: { loop: 'musicGym' },
      boss: { loop: 'musicBoss' }, // also under the title once the logo has landed
    },
  },
  effects: { endFlashMs: 600 }, // Bartek blinks this long when a timed effect runs out
  // enemies: spawn.maxEnemies + room for bosses, the school trip and split elites; pickups: room for boss and elite chests
  pools: { bullets: 100, enemies: 320, gems: 300, pickups: 20, vfx: 60, bees: 20, gas: 12 },
  // Card rarity, rolled per card at every level up. A tier's draw weight is weight + perLevel * (level - 1),
  // so rarer cards come up more often later. mult scales the card's numbers.
  rarity: [
    { id: 'common', name: 'Zwykła', mult: 1, color: 0xbdbdbd, weight: 100, perLevel: 0 },
    { id: 'rare', name: 'Rzadka', mult: 1.5, color: 0x3a8dff, weight: 20, perLevel: 2 },
    { id: 'epic', name: 'Epicka', mult: 2, color: 0xb04cff, weight: 4, perLevel: 1 },
    { id: 'legendary', name: 'Legendarna', mult: 3, color: 0xff9800, weight: 0.5, perLevel: 0.3 },
  ],
  upgrade: { fallbackHeal: 20 }, // the heal card when nothing else is left to draw
  // Level-up draw control, charges per run at the start (the gym's Plan dnia adds more): Odśwież draws new cards,
  // Pomiń takes nothing and heals skipHeal HP, Wywal takes a card out of the pool for the rest of the run.
  draw: { rerolls: 2, skips: 2, banishes: 1, skipHeal: 15 },
  // Training plans (data/plans.js), `cards` of the unlocked ones offered before a run (PlanScene). Pct: a share of the
  // value after the gym (negative: a minus); fireRatePct changes shots per second (cooldown divided by 1 + it).
  plans: {
    cards: 3,
    chestDay: { damagePct: 0.2, speedPct: -0.15 },
    cardio: { speedPct: 0.2, maxHp: -20 },
    bulk: { maxHp: 40, fireRatePct: -0.1 },
    cut: { fireRatePct: 0.25, maxHp: -30 },
    legDay: { magnetMult: 2, xpPct: 0.1, damagePct: -0.1 },
    unc: { rerolls: 2, banishes: 2, unlockMaxedPassives: 3 },
    bartkowanie: { weightMult: 3, unlockPicks: 10 },
    lazy: { xpPct: 0.3, enemyHpPct: 0.15, earlyDeathSec: 120, unlockEarlyDeaths: 3 },
  },
  ui: { margin: 16, hudFontSize: 24, balanceWindowSec: 10, titleFontSize: 64, subtitleFontSize: 20, buttonFontSize: 32, lineGap: 56,
    dimAlpha: 0.6, card: { count: 3, row: false, width: 600, height: 230, gap: 44, hintFontSize: 20, hintColor: '#ffc400', evolutionColor: 0xffc400, color: 0x2a2a2a, borderColor: 0xffffff, borderWidth: 2, nameFontSize: 30, textFontSize: 24,
      rarityBorderWidth: 5, rarityFontSize: 22 },
    bubble: { durationMs: 1500, offsetY: 56, fontSize: 20, padding: 6 },
    // Every text uses this font: Not Jam Mono Clean 16 (CC0, assets/font), loaded in BootScene under fontKey. The system
    // fonts behind it only fill in glyphs it lacks („ ”). fontFile has its spaces encoded: Phaser puts it in an unquoted url().
    font: '"NotJam", "Trebuchet MS", "Segoe UI", Roboto, Arial, sans-serif',
    fontKey: 'NotJam',
    fontFile: './assets/font/Not%20Jam%20Mono%20Clean%2016.ttf',
    // Drawn UI (systems/ui.js): panels, bars and buttons with rounded corners and a drop shadow.
    panel: { color: 0x14161c, alpha: 0.75, radius: 10, borderColor: 0xffffff, borderAlpha: 0.18, borderWidth: 2, shadow: 3, shadowAlpha: 0.4 },
    bar: { radius: 6, bg: 0x000000, bgAlpha: 0.6, borderColor: 0x000000, borderWidth: 2, shineAlpha: 0.3 },
    button: { fontSize: 28, padX: 28, padY: 12, radius: 12, shadow: 4, pressScale: 0.94, pressMs: 70,
      color: 0x43a047, hover: 0x66bb6a, border: 0x1b5e20, text: '#ffffff', // primary: green
      secondary: { color: 0xeceff1, hover: 0xffffff, border: 0x607d8b, text: '#1b1b1b' },
      disabled: { color: 0x3a3a3a, hover: 0x3a3a3a, border: 0x222222, text: '#8a8a8a' } },
    // Drawn icons (heart, skull, clock, gym upgrades), size x size px; shown at the size each place asks for.
    icons: { size: 48, heart: 0xe53935, heartLight: 0xff8a80, skull: 0xeceff1, skullDark: 0x263238, clock: 0xfafafa, clockDark: 0x263238,
      metal: 0xb0bec5, metalDark: 0x37474f, accent: 0xffc400, outline: 0x1b1b1b,
      // Passive icons (passive_<id>).
      tub: 0xeceff1, coffee: 0x8d6e63, cup: 0xfff8e1, shoe: 0x1e88e5, gainer: 0x6d4c41, backpack: 0x388e3c, ticket: 0xffd54f,
      ticketStripe: 0xd32f2f, pass: 0xff7043, soup: 0xffca28, bowl: 0xfafafa, jacket: 0x546e7a, jacketLine: 0x37474f,
      clover: 0x43a047, cloverDark: 0x1b5e20, page: 0xfafafa, grid: 0x90caf9, sack: 0xa1887f, sackDark: 0x5d4037, gem: 0x43a047,
      planRing: 0xd32f2f },
    // Top left HUD panel: HP (heart), XP (level badge), tank charge. Rows of rowHeight, bars barWidth x barHeight.
    hud: { width: 330, padding: 10, rowHeight: 30, iconSize: 26, barWidth: 270, barHeight: 20, barGap: 8, barFontSize: 15,
      levelFontSize: 15, hpColor: 0xe53935, xpColor: 0x3a8dff, tankColor: 0x2e7d32, tankBlinkColor: 0x9ccc65, levelColor: 0x1565c0,
      // Top center clock pill and the top right stats (kills, protein from coins).
      clock: { width: 150, height: 46, fontSize: 30, iconSize: 26 }, stat: { width: 140, height: 38, fontSize: 22, iconSize: 26, gap: 8 } },
    // Settings / pause screen (SettingsScene): a panel with a row per volume (label, -, bar, +, percent) and a back button.
    // step: how much one press of - or + changes a volume. pauseButton: the HUD's square pause button left of the clock;
    // gearSize: the gym's settings button next to its title.
    // Odśwież / Pomiń / Wywal under the level-up cards, `top` px under the lowest card; the key hint line under them.
    drawButtons: { width: 200, height: 64, gap: 20, top: 40, fontSize: 24, hintFontSize: 18, hintGap: 14, hintColor: '#b0bec5',
      banishColor: '#ff5252', banishBorder: 0xff5252 },
    // Plan screen: the title at titleY, the plan cards where the level-up cards go (card size), plus and minus lines.
    planScreen: { titleY: 120, titleFontSize: 56, plusColor: '#9ccc65', minusColor: '#ff8a80', lineFontSize: 22, lineGap: 12, betsGap: 24,
      gameOverFontSize: 22, gameOverColor: '#ffc400' },
    settings: { width: 620, padding: 28, titleFontSize: 56, labelFontSize: 26, rowHeight: 116, stepButton: 64, barHeight: 26,
      valueWidth: 90, step: 0.1, orientWidth: 200, orientGap: 20, backWidth: 320, backHeight: 72, backFontSize: 30, hintFontSize: 18, hintColor: '#b0bec5',
      barColor: 0xffc400, pauseButton: { size: 46, iconSize: 26, gap: 8 }, gearSize: 56 },
    // Round "CZOŁG" button in the bottom right while the tank is ready: a click or tap starts it (phones have no Space).
    tankButton: { radius: 64, margin: 40, color: 0x2e7d32, alpha: 0.85, fontSize: 22 },
    // Arrow at the screen edge toward the nearest pickup lying off screen.
    pickupArrow: { size: 22, margin: 30, color: 0xffcc00 }, // points at the Żabka shop first, else at the nearest pickup off screen
    // Zakłady z Unc window over the gym; gymButton*: its button next to "Na Bemowo!" (two lines: name and bonus).
    bets: { width: 660, padding: 22, gap: 12, titleFontSize: 44, textFontSize: 17, nameFontSize: 22, descFontSize: 17, rowHeight: 92,
      stepButton: 52, levelWidth: 70, sumFontSize: 28, sumColor: '#9ccc65', onColor: '#ff8a80', hintColor: '#b0bec5',
      backWidth: 240, backHeight: 60, backFontSize: 26, gymButtonWidth: 260, gymButtonGap: 20, gymButtonFontSize: 22 },
    shop: { titleFontSize: 56, titleColor: '#76ff03', poorColor: '#ff8a80', boughtColor: '#9e9e9e', boughtAlpha: 0.45, shakePx: 6, shakeMs: 50 },
    // Active timed effects under the HUD panel: icon, name, a bar of the time left.
    effectHud: { width: 230, height: 38, iconSize: 28, barHeight: 6, gap: 6, fontSize: 15, color: 0xffcc00 },
    // Weapon slots, bottom left (maxSlots, empty ones dimmed): icon with a level badge in its corner.
    // The passive slots are a second row of the same slots right above them.
    // readyColor: a pulsing frame on a weapon ready to evolve and on the passive it needs (readyPulseMs a beat).
    weaponHud: { size: 52, iconSize: 40, gap: 8, fontSize: 15, badgeRadius: 11, emptyAlpha: 0.35, readyColor: 0xffc400, readyWidth: 3, readyPulseMs: 500 },
    joystick: { radius: 70, knobRadius: 30, color: 0xffffff, baseAlpha: 0.25, knobAlpha: 0.5, deadZone: 0.15 },
    title: { promptFontSize: 32, logoFontSize: 140, fontFamily: '"NotJam", Impact, "Arial Black", sans-serif', strokeThickness: 10,
      bemowoColor: '#ffcc00', survivorsColor: '#d01818', bemowoY: 520, survivorsY: 660, dropMs: 450, gapMs: 600,
      shakeMs: 250, shakeIntensity: 0.02, pressBottom: 160, blinkMs: 600 },
    bossBar: { y: 170, width: 600, height: 24, fontSize: 16, color: 0xd03030 }, // under the HUD panel and the stat pills; the effect rows go under it
    // Boss chest screen: cards spin through names every spinStepMs; the first stops after spinMs, each next stopGapMs later.
    chest: { titleY: 190, titleFontSize: 64, titleColor: '#ffc400', strokeThickness: 8, spinStepMs: 70, spinMs: 1200, stopGapMs: 700,
      popScale: 1.08, popMs: 120, promptBottom: 60 },
    welcome: { fontSize: 72, holdMs: 1500, fadeMs: 1000 },
    // Pickup, Bartkowanie and boss banners: big text with a line under it, on a panel, faded in and out.
    // y: under the effect rows (room for four), above Bartek in the middle of the screen.
    banner: { y: 400, fontSize: 52, strokeThickness: 6, durationMs: 3200, fadeMs: 250, subFontSize: 26, subStrokeThickness: 4, padX: 30, padY: 14, gap: 6 },
    olxCard: { width: 420, height: 440, padding: 24, photoSize: 200, titleFontSize: 34, textFontSize: 20, bigFontSize: 38 },
    buttonOffsetX: 160, // two buttons side by side sit this far left and right of center
    gymPulse: { scale: 1.12, ms: 500 }, // game over gym button after the first run
    // Gym: a row per upgrade (icon on the left; name, description, then level pips and the cost on a line under them; the buy
    // button on the right), Bartek with a speech bubble under the rows, the start button at the bottom.
    // x positions are from the row's left edge. popScale/popMs: the newly bought pip pops; floatPx/floatMs: the "-cost" rising.
    gymScreen: { titleY: 40, titleFontSize: 56, top: 140, columns: 1, columnGap: 0, goRight: false, rowWidth: 680, rowHeight: 128, rowGap: 12, padding: 14, iconSize: 56,
      nameFontSize: 24, descFontSize: 16, descGap: 6, descColor: '#b0bec5', pipSize: 16, pipGap: 6, pipColor: 0xffc400, pipEmpty: 0x37474f,
      costGap: 24, costFontSize: 22, costIconSize: 24, shortFontSize: 16, shortColor: '#ff8a80', maxColor: '#ffc400',
      buyWidth: 140, buyHeight: 50, buyFontSize: 22, popScale: 1.8, popMs: 350, floatPx: 40, floatMs: 900,
      protein: { width: 200, height: 50, fontSize: 28, iconSize: 32 },
      bartekHeight: 120, quoteFontSize: 20, quoteWidth: 460, quoteGap: 16, tail: 14, definitionColor: '#b0bec5', definitionFontSize: 16,
      sectionGap: 40, bottom: 40, goWidth: 400, goHeight: 80, goFontSize: 34 },
  },
  // Screen layouts. The values above are portrait; `landscape` overrides the ones that depend on the screen's shape
  // (systems/layout.js merges it in at start and when the player switches in the settings, save.orientation).
  // card.row: cards side by side instead of stacked. gymScreen.columns: upgrade rows in that many columns; goRight: the
  // start button bottom right instead of centered.
  layouts: {
    landscape: {
      game: { width: 1280, height: 720 },
      ui: {
        card: { row: true, width: 260, height: 320, gap: 40, nameFontSize: 22, textFontSize: 18, rarityFontSize: 18, hintFontSize: 16 },
        title: { bemowoY: 250, survivorsY: 410, pressBottom: 90 },
        bossBar: { y: 76 },
        chest: { titleY: 110 },
        planScreen: { titleY: 60, lineFontSize: 17 },
        bets: { width: 820, padding: 16, gap: 8, titleFontSize: 34, textFontSize: 15, nameFontSize: 19, descFontSize: 15, rowHeight: 62,
          stepButton: 44, sumFontSize: 24, backHeight: 48, backFontSize: 22 },
        banner: { y: 150 },
        gymScreen: { titleY: 22, top: 104, columns: 2, columnGap: 16, goRight: true, rowWidth: 600, rowHeight: 128, sectionGap: 20,
          bottom: 16, goWidth: 260, goHeight: 64, goFontSize: 30 },
      },
    },
  },
  // Effects drawn in code (systems/vfx.js), textures fx_* from textures.fx. minGapMs: an effect that fires in bursts
  // plays at most once per this many ms. Each layer is
  //   particles: { texture, count, speed: [min, max] px/s, lifeMs, scale: [start, end], alpha?: [start, end], tint (one or a
  //                list to pick from), gravityY?, spin? (random start angle up to +-deg), add? (glow), angle?, spread? (deg) }
  //   image:     { texture, scale: [from, to], alpha: [from, to], ms, tint?, add?, spinDeg?, ease?, origin? }
  // playVfx's angle turns image layers and aims particles (angle is added to it, spread is the cone, 360 = all around).
  vfx: {
    hitSpark: { layers: [ // bullet hits an enemy
      { particles: { texture: 'fx_spark', count: 5, speed: [60, 170], lifeMs: 220, scale: [0.8, 0], tint: [0xffffff, 0xffe082], add: true } },
      { image: { texture: 'fx_dot', scale: [1.5, 0.3], alpha: [0.9, 0], ms: 100, tint: 0xfff3b0, add: true } }] },
    deathPoof: { layers: [ // enemy dies: grey puffs and green bits falling
      { particles: { texture: 'fx_puff', count: 7, speed: [25, 80], lifeMs: 450, scale: [0.5, 1.2], alpha: [0.7, 0], tint: [0xbdbdbd, 0x9e9e9e] } },
      { particles: { texture: 'fx_dot', count: 6, speed: [80, 180], lifeMs: 420, scale: [0.9, 0], tint: [0x9ccc65, 0x689f38], gravityY: 350 } }] },
    bossBoom: { layers: [ // a boss dies
      { image: { texture: 'fx_rays', scale: [0.5, 3.5], alpha: [1, 0], ms: 800, tint: 0xffc400, add: true, spinDeg: 45 } },
      { image: { texture: 'fx_ring', scale: [0.3, 5], alpha: [1, 0], ms: 650, tint: 0xff6d00 } },
      { particles: { texture: 'fx_puff', count: 24, speed: [80, 300], lifeMs: 900, scale: [1, 2.5], alpha: [0.9, 0], tint: [0xff6d00, 0xffc400, 0x424242] } },
      { particles: { texture: 'fx_spark', count: 20, speed: [200, 500], lifeMs: 600, scale: [1.2, 0], tint: 0xffe082, add: true } }] },
    targetMark: { layers: [ // where the Sportakus will land, lasts about his warnMs
      { image: { texture: 'fx_target', scale: [2, 1], alpha: [0.3, 1], ms: 700, tint: 0xff1744, spinDeg: 90, ease: 'Sine.easeInOut' } }] },
    dashDust: { layers: [ // the Sportakus takes off
      { particles: { texture: 'fx_puff', count: 10, speed: [40, 120], lifeMs: 420, scale: [0.4, 1.1], alpha: [0.6, 0], tint: 0xd7ccc8 } }] },
    gemPickup: { minGapMs: 80, layers: [
      { particles: { texture: 'fx_spark', count: 4, speed: [40, 90], lifeMs: 260, scale: [0.6, 0], tint: [0xffffff, 0x80deea], add: true } }] },
    coinPickup: { minGapMs: 80, layers: [
      { particles: { texture: 'fx_star', count: 5, speed: [60, 130], lifeMs: 420, scale: [0.6, 0], tint: 0xffd54f, gravityY: -80 } },
      { image: { texture: 'fx_ring', scale: [0.2, 0.9], alpha: [1, 0], ms: 300, tint: 0xffd54f } }] },
    starBurst: { layers: [ // a legendary card appears, any pickup is taken
      { image: { texture: 'fx_rays', scale: [0.4, 2.2], alpha: [1, 0], ms: 650, tint: 0xfff176, add: true, spinDeg: 60 } },
      { particles: { texture: 'fx_star', count: 10, speed: [100, 260], lifeMs: 650, scale: [0.8, 0], tint: [0xffeb3b, 0xffffff], spin: 180 } }] },
    vacuumPull: { layers: [ // magnet pickup: two rings pulling in
      { image: { texture: 'fx_ring', scale: [6, 0.3], alpha: [0, 0.9], ms: 550, tint: 0xe57373, ease: 'Cubic.easeIn' } },
      { image: { texture: 'fx_ring', scale: [4, 0.2], alpha: [0, 0.9], ms: 450, tint: 0xcfd8dc, ease: 'Cubic.easeIn' } }] },
    frostNova: { layers: [ // freeze pickup
      { image: { texture: 'fx_ring', scale: [0.3, 9], alpha: [1, 0], ms: 650, tint: 0x81d4fa } },
      { particles: { texture: 'fx_flake', count: 16, speed: [150, 400], lifeMs: 750, scale: [1.2, 0.4], tint: [0xe1f5fe, 0x81d4fa], spin: 180 } }] },
    holyHeal: { layers: [ // pierogi: green pluses rising
      { image: { texture: 'fx_ring', scale: [0.5, 2.2], alpha: [0.8, 0], ms: 500, tint: 0xfff59d } },
      { particles: { texture: 'fx_plus', count: 8, speed: [20, 70], angle: -90, spread: 140, gravityY: -120, lifeMs: 850, scale: [0.9, 0.3], tint: 0x69f0ae } }] },
    metalClang: { minGapMs: 40, layers: [ // the Captain's shield bounces off an enemy
      { particles: { texture: 'fx_spark', count: 6, speed: [120, 260], lifeMs: 200, scale: [0.8, 0], tint: [0xffffff, 0xb0bec5, 0xffd54f], add: true } },
      { image: { texture: 'fx_star', scale: [1.4, 0.2], alpha: [1, 0], ms: 140, add: true, spinDeg: 40 } }] },
    chestOpen: { layers: [ // a boss chest opens
      { image: { texture: 'fx_rays', scale: [0.3, 2.6], alpha: [1, 0], ms: 850, tint: 0xffc400, add: true, spinDeg: 90 } },
      { particles: { texture: 'fx_star', count: 14, speed: [80, 240], angle: -90, spread: 160, gravityY: 300, lifeMs: 900, scale: [0.8, 0.2],
        tint: [0xffd54f, 0xffffff, 0x40c4ff], spin: 180 } }] },
    pumpRise: { layers: [ // pre-workout: chevrons rising off Bartek
      { particles: { texture: 'fx_chevron', count: 1, speed: [50, 90], angle: -90, spread: 10, lifeMs: 650, scale: [1, 0.6], alpha: [1, 0],
        tint: [0xff9100, 0xffc400, 0xffffff], add: true, depth: 1.1 } }] },
    beeSting: { minGapMs: 30, layers: [ // a bee stings an enemy: yellow sparks and a small ring
      { particles: { texture: 'fx_spark', count: 6, speed: [80, 190], lifeMs: 260, scale: [1, 0], tint: [0xffd400, 0xffffff], add: true } },
      { image: { texture: 'fx_ring', scale: [0.15, 0.7], alpha: [1, 0], ms: 200, tint: 0xffd400 } }] },
    gasHit: { minGapMs: 60, layers: [ // an enemy coughs in the laughing gas
      { particles: { texture: 'fx_dot', count: 3, speed: [20, 60], lifeMs: 320, scale: [0.8, 0], tint: [0x9ccc65, 0xce93d8], gravityY: -60 } }] },
    gasLaugh: { layers: [ // a "HA" rising from a gas cloud
      { particles: { texture: 'fx_ha', count: 1, speed: [25, 45], angle: -90, spread: 40, lifeMs: 900, scale: [0.9, 1.2], alpha: [1, 0],
        tint: [0x9ccc65, 0xba68c8], spin: 20, depth: 1.7 } }] },
    lightning: { layers: [ // Burza: a bolt from the sky into an enemy, a flash where it lands
      { image: { texture: 'fx_bolt', origin: [0.5, 1], scale: [1.4, 1.4], alpha: [1, 0], ms: 260, tint: 0xfff59d, add: true, ease: 'Expo.easeIn' } },
      { image: { texture: 'fx_ring', scale: [0.3, 1.6], alpha: [1, 0], ms: 300, tint: 0xffffff, add: true } },
      { particles: { texture: 'fx_spark', count: 8, speed: [100, 260], lifeMs: 280, scale: [1, 0], tint: [0xfff59d, 0xffffff], add: true } }] },
    vampireHeal: { layers: [ // a vampire elite heals the walkers around it
      { image: { texture: 'fx_ring', scale: [5, 0.5], alpha: [0, 0.7], ms: 450, tint: 0xff1744, ease: 'Cubic.easeIn' } },
      { particles: { texture: 'fx_plus', count: 5, speed: [20, 50], angle: -90, spread: 120, gravityY: -80, lifeMs: 600, scale: [0.8, 0.3], tint: 0xff5252 } }] },
    gemDrop: { minGapMs: 40, layers: [ // Deszcz kryształów: a gem lands
      { image: { texture: 'fx_star', scale: [1.2, 0.2], alpha: [1, 0], ms: 250, tint: 0x90caf9, add: true, spinDeg: 90 } }] },
    laserHit: { minGapMs: 40, layers: [ // the eye laser burns an enemy
      { particles: { texture: 'fx_spark', count: 5, speed: [80, 200], lifeMs: 200, scale: [1, 0], tint: [0xff1744, 0xffffff], add: true } },
      { image: { texture: 'fx_dot', scale: [2.2, 0], alpha: [1, 0], ms: 140, tint: 0xff8a80, add: true } }] },
    // Pistol shot, played at the barrel tip turned at the target; the shell is played with angle +-30 (away from the aim).
    muzzleFlash: { layers: [
      { image: { texture: 'fx_flash', origin: [0, 0.5], scale: [1, 0.6], alpha: [1, 0], ms: 80, ease: 'Linear' } },
      { particles: { texture: 'fx_dot', count: 3, speed: [80, 200], spread: 30, lifeMs: 120, scale: [0.6, 0], tint: 0xffe082, add: true } }] },
    shell: { layers: [
      { particles: { texture: 'fx_shell', count: 1, speed: [70, 120], angle: -90, spread: 30, gravityY: 600, lifeMs: 450, scale: [1, 1],
        alpha: [1, 0], tint: 0xffffff, spin: 180, depth: 0.5 } }] }, // depth: under Bartek (layers default to 1.6, over him)
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
    // Cut out of the original photos (goblin_bartek.png, sportakus.png); a better cut can simply replace these files.
    goblin: { file: './assets/goblin_bartek_cut.png', height: 52, bodyRadius: 19 },
    sportakus: { file: './assets/sportakus_cut.png', height: 66, bodyRadius: 24 },
    // Żabka shop (event): a white wall, a striped green awning, a door and two windows.
    zabkaShop: { width: 88, height: 74, awningHeight: 20, stripes: 6, wall: 0xf5f5f5, awning: 0x2e7d32, stripe: 0xffffff,
      door: 0x1b5e20, window: 0x81d4fa, border: 0x212121 },
    chest: { width: 44, height: 34, lidHeight: 12, color: 0x8d5524, lidColor: 0x6d3f17, bandColor: 0xffc400, bandWidth: 5, lockSize: 10 },
    klapa: { width: 44, height: 26, color: 0x9a9a9a, borderColor: 0x555555, borderWidth: 4, bodyRadius: 13 },
    bullet: { radius: 3, color: 0xffffff },
    // Bee facing right (it turns along its orbit): striped body, two wings, a stinger at the back.
    bee: { width: 24, height: 20, color: 0xffd400, stripeColor: 0x1b1b1b, wingColor: 0xffffff, wingAlpha: 0.75 },
    pickup: { size: 22, color: 0xffffff, borderColor: 0xffcc00, borderWidth: 3 },
    // Drawn auras around Bartek while a pickup's effect lasts. front: drawn over him, else under.
    // The aura pulses between 1 and pulseScale every pulseMs and turns spinDegPerSec.
    // vfx (optional): a config.vfx id played every everyMs at a random point up to spread px around Bartek.
    auras: {
      bubble: { radius: 62, color: 0x4dd0e1, fillAlpha: 0.18, lineWidth: 3, front: true, pulseScale: 1.05, pulseMs: 500, spinDegPerSec: 0 },
      // Pre-workout: a warm glow and a ring under Bartek, with orange chevrons rising off him (a boost, not a hazard).
      rage: { radius: 58, ringRadius: 44, color: 0xff9100, ringColor: 0xffc400, glowAlpha: 0.1, ringWidth: 3, front: false,
        pulseScale: 1.08, pulseMs: 300, spinDegPerSec: 0, vfx: { id: 'pumpRise', everyMs: 110, spread: 34 } },
    },
    // Drawn icons of the timed pickups, size x size px.
    pickupIcons: { size: 30, magnet: 0xd32f2f, magnetTip: 0xcfd8dc, freeze: 0x81d4fa, freezeLine: 0xffffff,
      preworkout: 0x8e24aa, preworkoutCap: 0x212121, bubble: 0x4dd0e1, pierogi: 0xf3e0b5, pierogiLine: 0xc8a96a },
    // Effect shapes (systems/vfx.js), radius in px (flash: width and height, shell: height, twice as long).
    fx: { dot: 4, spark: 8, puff: 12, ring: 32, ringWidth: 4, target: 28, star: 10, rays: 64, plus: 6, flake: 8, flash: 28, shell: 3, chevron: 9, ha: 9,
      bolt: 64 }, // bolt: a zigzag down the middle of a bolt*2 square
    // The pistol Bartek holds, drawn pointing right: width x height px, held at grip (fraction of the size).
    gun: { width: 28, height: 15, grip: [0.3, 0.5], slide: 0x455a64, slideLight: 0x90a4ae, frame: 0x263238, handle: 0x6d4c41, handleLight: 0x8d6e63 },
    captainShield: { file: './assets/captain_shield.png' }, // 50x50 pixel art, also the shield's HUD icon
    // Drawn weapon icons for the HUD, size x size px.
    weaponIcon: { size: 40, color: 0x222222, borderColor: 0xffffff, gunColor: 0xc0c0c0, gripColor: 0x6d4c41,
      gasColors: [0x9ccc65, 0xba68c8, 0x7cb342], laserColor: 0xff1744, eyeColor: 0xffffff,
      // Evolved weapons: a gold frame.
      evoBorder: 0xffc400, uziColor: 0x37474f, smogColors: [0x9e9e9e, 0x757575, 0xbdbdbd], shieldColors: [0xd32f2f, 0xffd54f, 0xfafafa] },
    // Laughing gas cloud, size x size px, shown scaled to its radius: soft green and purple puffs.
    gasCloud: { size: 128, colors: [0x9ccc65, 0xba68c8, 0x7cb342, 0xce93d8], alpha: 0.28, puffs: 9,
      smogColors: [0x9e9e9e, 0x616161, 0xbdbdbd, 0x757575], smogAlpha: 0.38 }, // smog_cloud: the evolved gas, grey and thicker
    tank: { height: 110, bodyRadius: 45 }, // czołg.png: Bartek in a tank, barrel to the left
    pigeon: { frames: 3, fps: 10, scale: 2, width: 48, height: 40, flipX: true }, // assets/Pigeons/pigeon1..3.png, 24x20 px, facing left; size after scale; flipX turns it to face the flight
  },
};
