export const config = {
  // portrait (the default); landscape sizes are in `layouts`. Portrait on a phone taller than 9:16 grows up to maxHeight
  // instead of black bars (systems/layout.js gameHeight); resizeMs: how long the window stays still before it applies.
  game: { width: 720, height: 1280, maxHeight: 1600, resizeMs: 300, background: '#000000' },
  version: 106, // the step number, shown in the menu's corner as v0.<version>; every step raises it
  // critChance: share of hits that crit, critMult: a crit's damage multiplier (passives Goggins and Limp Bizkit add to them).
  // maxHp: 100 until step 72; lower so Gainer, Dokładka and the gym's HP matter more.
  player: { speed: 200, maxHp: 80, invulnMs: 500, blinkMs: 80, blinkAlpha: 0.3, critChance: 0.05, critMult: 1.5 },
  // Weapons (data/weapons.js). Bartek starts with one random weapon from `start` and carries up to startSlots (the gym's
  // Kabura adds more, at most 3 in all); new ones and levels come as cards.
  weapons: {
    startSlots: 1, // step 96: was 2 (step 78: 3); the rest from the gym's Kabura
    // Draw weight of a weapon card, new or a level (passives and the rest weigh 1), so evolutions come before 8:00.
    cardWeight: 2,
    start: ['pistol', 'shotgun', 'shield'],
    // Evolutions (data/weapons.js, `evolution`): a weapon at its max level plus its passive in a slot evolves from the
    // next chest. Each weapon's `evolution` numbers below.
    // Auto-aims at the nearest enemies in range. levels: what each level after the first adds.
    pistol: { fireRateMs: 500, range: 400, bulletSpeed: 500, bulletDamage: 10, bulletsPerShot: 1,
      levels: [{ bullets: 1 }, { bullets: 1 }, { bullets: 1 }],
      // Uzi z bazaru: fires every fireRateMs, each bullet damagePct of the pistol's and goes through `pierce` enemies.
      evolution: { fireRateMs: 260, damagePct: 0.4, pierce: 1 }, // step 68: 150 ms / 0.5 was 4.6x the max level; step 76: 220 ms
      // The gun's grip sits this far from Bartek's middle toward the target and offsetY px lower; the flash at its barrel tip.
      gun: { distance: 22, offsetY: 8 } },
    // Shotgun: every cooldownMs `pellets` pellets fan out over spreadDeg toward the nearest enemy within rangeMult x the
    // pistol range (Okulary from the gym count); a pellet flies `range` far at most, pelletScale the size of a bullet.
    shotgun: { damage: 12, pellets: 5, cooldownMs: 950, rangeMult: 0.85, spreadDeg: 40, jitterRad: 0.04, speed: 600, pelletScale: 0.8,
      levels: [{ pellets: 1 }, { damage: 4 }, { pellets: 1 }, { damage: 5 }, { pellets: 2 }, { damage: 6 }],
      // Dwururka dziadka: pelletsMult x pellets (rounded), each goes through `pierce` enemies.
      evolution: { pelletsMult: 1.2, pierce: 1 },
      // Held lower than the pistol, so both show when Bartek has the two.
      gun: { distance: 16, offsetY: 18 } },
    // Captain's shield: flies to the nearest enemy within range, bounces `bounces` times to the next nearest ones (not hit
    // yet on this throw) within bounceRange, then flies back; each shield waits cooldownMs once it is back.
    shield: { damage: 26, bounces: 2, shields: 1, cooldownMs: 1400, range: 380, bounceRange: 300, speed: 650, hitDist: 20,
      size: 34, spinDegPerSec: 900,
      levels: [{ bounces: 1 }, { damage: 8 }, { shields: 1 }, { bounces: 1 }, { damage: 8 }, { bounces: 1 }],
      evolution: { cooldownMult: 0.55, healPerHit: 1, tint: 0xffd54f } }, // Tarcza Bemowa: cooldownMult x the wait, every hit heals Bartek
    // Laughing gas (Joker): every cooldownMs `clouds` clouds land on random ones of the `pick` nearest enemies within range.
    // A cloud lasts durationMs and hurts every enemy inside its radius every tickMs; a "HA" rises from it every laughEveryMs.
    // unlockJokers: Jokers killed in one run to unlock it.
    gas: { damage: 6, clouds: 1, cooldownMs: 3000, range: 350, pick: 5, radius: 70, durationMs: 2000, tickMs: 500,
      laughEveryMs: 450, spinDegPerSec: 25, fadeShare: 0.2, unlockJokers: 30,
      levels: [{ damage: 2 }, { clouds: 1 }, { radius: 15 }, { durationMs: 1000 }, { damage: 3 }, { clouds: 1 }],
      // Smog nad Bemowem: `clouds` clouds that never end, each drifting at speed px/s toward the nearest enemy, damageMult x damage.
      evolution: { speed: 60, damageMult: 1.5 } },
    // Eye laser (Homelander): every cooldownMs one beam per `beams` toward the nearest enemies within range, from Bartek's
    // eyes (eyeOffsetY above his middle, eyeGap apart, at normal size). A beam is `range` long and hurts every enemy whose
    // body is within width/2 of its line. It shows for beamMs. Unlock: kill the boss `unlockBoss` in a won run.
    laser: { damage: 18, beams: 1, cooldownMs: 2500, range: 520, width: 12, beamMs: 260, eyeOffsetY: -14, eyeGap: 7,
      color: 0xff1744, glowColor: 0xff8a80, glowAlpha: 0.35, unlockBoss: 'bigHomelander',
      levels: [{ damage: 8 }, { beams: 1 }, { width: 8 }, { damage: 10 }, { beams: 1 }, { range: 120 }],
      // Wzrok Homelandera: the beams stay on and turn toward their targets at turnDegPerSec, burning damagePct of the
      // laser's damage every tickMs.
      evolution: { turnDegPerSec: 200, tickMs: 200, damagePct: 0.14 } },
    // Ul: bees circling Bartek (systems/orbit.js); a bee hurts an enemy it touches at most once per hitCooldownMs.
    // A bees level adds bees whatever the card's rarity (a rarer card adds damagePct * (mult - 1) of the base damage on top);
    // a damage level is multiplied by it. While Bartek is a small B there are smallMult times more, on the smaller smallRadius.
    // On a hit the bee swells to hitScale for hitMs and the enemy gets the 'beeSting' effect.
    bees: { bees: 2, damage: 7, damagePct: 0.5, hitCooldownMs: 500, radius: 110, degPerSec: 180, waveAmp: 6, waveHz: 1.5,
      smallMult: 2, smallRadius: 42, hitScale: 1.7, hitMs: 90,
      levels: [{ bees: 1 }, { damage: 4 }, { bees: 1 }, { damage: 5 }, { bees: 1 }],
      evolution: { beesMult: 2, damageMult: 1.2, pierogiChance: 0.04 } }, // Pasieka babci: beesMult x bees, damageMult x damage; a bee kill drops Pierogi w domu this often
    // Dwarf's axe: `axes` axes circle Bartek (systems/orbit.js) at degPerSec, `radius` away, spinning; an axe hurts an enemy
    // at most once per hitCooldownMs. Any hit turns them all back the other way (not again for flipGapMs, so a crowd
    // does not make them shake in place).
    // Playtests: too strong at 14 damage every 400 ms (levels 6/8/8, evolution 1.4x faster).
    axe: { damage: 8, axes: 1, radius: 110, degPerSec: 230, size: 36, spinDegPerSec: 720, hitCooldownMs: 550, flipGapMs: 150,
      levels: [{ damage: 2 }, { axes: 1 }, { radius: 20 }, { damage: 3 }, { axes: 1 }, { damage: 3 }],
      // Młyn krasnoluda: axesMult x axes (rounded), speedMult x as fast, radiusMult x as far out.
      evolution: { axesMult: 1.5, speedMult: 1.1, radiusMult: 1.3 } },
    // Kostur Czarogeja: every cooldownMs `bolts` lightning bolts strike the nearest enemies within range, one each; a bolt
    // hurts every enemy within `radius` of where it lands. It falls from skyHeight px above, in `segments` jagged pieces
    // up to `jitter` px off a straight line, and shows for boltMs. Unlock: unlockKills kills in one run.
    staff: { damage: 22, bolts: 1, cooldownMs: 1800, range: 420, radius: 40, boltMs: 200, segments: 7, jitter: 14, skyHeight: 260,
      width: 4, color: 0x80d8ff, glowAlpha: 0.35, unlockKills: 1000,
      levels: [{ damage: 6 }, { bolts: 1 }, { radius: 15 }, { damage: 8 }, { bolts: 1 }, { damage: 10 }],
      // Burza nad Bemowem: each bolt jumps on to `chain` more enemies, each the nearest one not hit yet within chainRange.
      evolution: { chain: 1, chainRange: 160 } },
    // Łuk: every cooldownMs `arrows` arrows (spreadDeg apart) fly at the nearest enemy within range, `speed` px/s, at most
    // range px. An arrow goes through `pierce` enemies; each one it goes through leaves it falloff x its damage.
    // Unlock: unlockRunners Uncanny (runner) kills in one run.
    bow: { damage: 20, arrows: 1, pierce: 3, falloff: 0.7, cooldownMs: 1200, range: 650, speed: 750, spreadDeg: 10, unlockRunners: 150,
      levels: [{ damage: 6 }, { pierce: 1 }, { arrows: 1 }, { damage: 8 }, { pierce: 2 }, { arrows: 1 }],
      // Łuk bez wymówek: arrows go through every enemy on their way and keep their full damage.
      evolution: {} },
    // Kostur NekroBartka: every cooldownMs, while fewer than `minions` are up, a small Bartek (bartek.png at `height` px,
    // tinted) rises next to Bartek for lifeMs. A minion runs at `speed` to the nearest enemy within leash px of Bartek and
    // hits it for `damage` every hitCooldownMs while within hitDist of its edge; with nothing to fight it trots back to
    // Bartek (followDist away). Unlock: die after unlockMinute minutes of a run.
    necro: { damage: 11, minions: 2, cooldownMs: 2000, lifeMs: 9000, speed: 250, hitCooldownMs: 400, hitDist: 14, leash: 400,
      followDist: 60, height: 30, tint: 0x9575ff, bobDeg: 10, bobHz: 4, fadeMs: 300, unlockMinute: 8,
      levels: [{ damage: 3 }, { minions: 1 }, { lifeMs: 3000 }, { damage: 4 }, { minions: 1 }, { damage: 5 }],
      // Armia NekroBartka: minionsMult x as many (rounded), and they never go away.
      evolution: { minionsMult: 1.5 } },
    // Miecz z anime: every cooldownMs, when an enemy is within range, `slashes` cuts one after another (gapMs apart), each
    // aimed at the nearest enemy: it hurts every enemy in a slice of the circle `reach` px around Bartek, arcDeg wide
    // (an enemy's body counts). A cut shows for slashMs. Unlock: kill the boss `unlockBoss`.
    sword: { damage: 11, slashes: 1, cooldownMs: 1400, gapMs: 150, range: 260, reach: 150, arcDeg: 110, slashMs: 170,
      color: 0xe1f5fe, edgeColor: 0x80d8ff, alpha: 0.3, edgeWidth: 5, unlockBoss: 'bigSportakus',
      levels: [{ damage: 4 }, { reach: 25 }, { slashes: 1 }, { arcDeg: 40 }, { damage: 6 }, { reach: 30 }],
      // Ostrze Senpaia: every cut goes all the way round, damageMult x damage.
      evolution: { damageMult: 0.65 } },
  },
  // Passives (data/passives.js): items that raise one stat each level, up to startSlots at once (the gym's Plecak adds more). The numbers are one level
  // at a common card; a rarer card multiplies them (whole numbers round up). unlock*: totals over all runs (save.stats).
  passives: {
    startSlots: 3,
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
    goggins: { critChance: 0.05, maxLevel: 5 }, // flat share of hits added per level
    limp: { critMult: 0.25, maxLevel: 5 }, // added to the crit multiplier per level
    // Rękawice bokserskie: +damagePct per level to hits on enemies at most rangeBartek x Bartek's height (textures.bartek)
    // from him (sword, axe, bees, gas). In Bartek heights so the card can say it without px.
    boxing: { damagePct: 0.15, rangeBartek: 2.5, maxLevel: 5 },
    // Śliski dres: +dodge per level, the share of hits (touches and boss powers) Bartek dodges; never above dodgeMax.
    tracksuit: { dodge: 0.05, maxLevel: 5, dodgeMax: 0.5 },
    // Gwizdek WF-isty: +ratePct per level to how often elites come (elites.everySec is divided by the rate).
    whistle: { ratePct: 0.2, maxLevel: 5 },
    // Sprężyna z długopisu: +speedPct per level to the speed of bullets, pellets, arrows and thrown shields.
    spring: { speedPct: 0.15, maxLevel: 5 },
    // Kapeć mamy: +knockback per level to run.player.knockback (see config.knockback).
    slipper: { knockback: 80, maxLevel: 5 },
    // Pas mistrzowski: +damagePct per level to hits on elites and bosses (run.player.bigDamage).
    belt: { damagePct: 0.15, maxLevel: 5 },
  },
  // Odrzut (run.player.knockback, px/s; 0 at the start): a weapon hit sends a walking enemy (not a boss) away from Bartek
  // at that speed for ms, at most once per everyMs per enemy, so fast weapons do not pin a crowd in place.
  knockback: { ms: 160, everyMs: 450 },
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
    // A zombie on rollerblades: only the Nightskating event sends them (spawnWeight 0); rolls straight, leaning, no spin.
    skater: { speed: 460, hp: 8, contactDamage: 12, appearsAtSec: 0, spawnWeight: 0, spinDegPerSec: 0 },
  },
  boss: {
    bannerSec: 2,
    olxDamagePct: 0.1, // the OLX flock takes this share of max HP instead of killing it
    gemCount: 40, gemKind: 'blue', gemSpread: 120, // the rain on top of the boss's own gem
    // Boss slots in order: atSec when it walks in (banner and boss music bannerSec earlier), hp, chest (upgrades in the
    // chest it drops), protein (paid at the end of the run for the kill). Every run draws one boss from each slot's pool,
    // never one drawn for an earlier slot, and not the same line-up as the run before. Boss HP does not grow with the run time.
    slots: [
      { atSec: 150, hp: 1300, chest: 1, protein: 10, pool: ['bigZombie', 'bigUncanny', 'bigGoblin'] },
      { atSec: 270, hp: 2200, chest: 2, protein: 15, pool: ['bigSportakus', 'bigJoker', 'bigGoblin'] },
      { atSec: 390, hp: 3200, chest: 2, protein: 20, pool: ['bigJoker', 'bigSportakus', 'bigZombie'] },
      { atSec: 540, hp: 4800, chest: 3, protein: 30, pool: ['bigHomelander'] }, // the last one is always the same
    ],
    // The bosses: a bigger copy of a regular enemy type (base), with its behavior. speedMult and damageMult multiply the
    // base numbers, scale its size.
    list: {
      bigZombie: { base: 'zombie', name: 'Wielki Zombie', scale: 2.5, speedMult: 0.8, damageMult: 2 },
      bigUncanny: { base: 'runner', name: 'Wielki Uncanny', scale: 2.6, speedMult: 0.6, damageMult: 2 },
      bigGoblin: { base: 'goblin', name: 'Wielki Goblin', scale: 2.5, speedMult: 0.7, damageMult: 2 },
      bigSportakus: { base: 'sportakus', name: 'Wielki Sportowiec', scale: 2.2, speedMult: 1, damageMult: 2 },
      bigJoker: { base: 'joker', name: 'Wielki Klaun', scale: 2.2, speedMult: 0.9, damageMult: 2 },
      bigHomelander: { base: 'homelander', name: 'Wielki Super Bartek', scale: 2, speedMult: 0.9, damageMult: 2 },
    },
    // Boss powers (data/bossPowers.js): every everySec, warned attacks (systems/telegraph.js) on a red area that fills up
    // over warnMs, then strikes for `damage` (grows with the run like a touch; armor takes off its share). range: only
    // used when Bartek is this close. depth: the warning on the ground, beamDepth: a laser over the enemies.
    // playerRadius: Bartek's half width for a beam hit.
    powers: {
      warnColor: 0xff1744, warnAlpha: 0.22, warnLine: 3, warnLineAlpha: 0.9, pulseMs: 180, pulseAlpha: 0.55, depth: 0.55,
      beamColor: 0xff5252, beamMs: 300, beamDepth: 5, playerRadius: 14,
      bigZombie: { everySec: 7, count: 6, radius: 110 }, // zombies rise in a ring around him
      bigUncanny: { everySec: 7, range: 700, offset: 60, radius: 100, warnMs: 1000, damage: 18 }, // lands offset px from Bartek
      bigGoblin: { everySec: 5, radius: 90, warnMs: 1100, damage: 14, goblins: 3 }, // a barrel on Bartek, goblins inside
      bigSportakus: { everySec: 5, range: 320, radius: 190, warnMs: 800, damage: 18 }, // a stomp around himself
      bigJoker: { everySec: 6, bombs: 3, radius: 75, spread: 170, warnMs: 1200, damage: 14 }, // cards on and around Bartek
      bigHomelander: { everySec: 5, beams: 3, spreadDeg: 25, length: 1100, width: 34, warnMs: 1000, damage: 22 }, // eye lasers
    },
  },
  // Elites (data/elites.js): every everySec the next walking enemy that spawns alone (no boss, pack or klapa) becomes an
  // elite with a random trait: hpMult x HP, scale x size, a glow in the trait's colour and its name over its head.
  // It drops a chest with one card; evolutions come only from boss chests.
  elites: {
    everySec: 40, hpMult: 5, scale: 1.25, glowStrength: 4, glowPadding: 8, labelFontSize: 16, labelGap: 2, debugOffset: 200,
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
    zabka: { durationSec: 45, minDist: 500, maxDist: 700, cards: 3, prices: { none: 15, common: 8, rare: 15, epic: 25, legendary: 40 },
      // Left without buying: the shop stays and opens again once Bartek walks leaveDist px away and comes back.
      leaveDist: 120,
      // The shop pulses up to `scale` every ms and gives off the `vfx` light every everyMs, so it reads as something to walk into.
      pulse: { scale: 1.12, ms: 900, vfx: 'shopGlow', everyMs: 900 } },
    storm: { durationSec: 15, everyMs: 400, damage: 30 }, // a bolt into a random enemy on screen; damage goes through weaponDamage
    festyn: { count: 3, minDist: 250, maxDist: 450 }, // map pickups around Bartek
    gemRain: { durationSec: 10, everyMs: 60, radius: 380, kind: 'purple' },
    // Chorda nadchodzi: for durationSec the spawn rate is spawnMult x and every spawn on the ring (waves too) comes from
    // one random side, within arcDeg; Bartek still standing at the end gets a chest (one card) chestDist px away.
    horde: { durationSec: 20, spawnMult: 3, arcDeg: 70, chestDist: 120 },
    // Nightskating: for durationSec, every everyMs a row of `count` skaters (gap px apart, side by side) rolls straight across
    // from startDist px behind Bartek, its lane up to laneJitter px off him. A red lane warns warnMs before they come.
    nightskating: { durationSec: 16, everyMs: 2600, count: 6, gap: 46, startDist: 820, laneJitter: 120, warnMs: 900, leanDeg: 14 },
  },
  // The estate around Bartek (systems/map.js): square blocks `block` px, a road `road` px wide along the top and left edge
  // of each, a sidewalk `sidewalk` px wide around the lot, the lot's kind drawn by weight. Decorations are pooled images:
  // lamps every lampEvery px, smallDecor[0]-[1] bins/benches/signs, parked cars with carChance per place, now and then a bus.
  map: {
    block: 768, road: 112, sidewalk: 44, curb: 4, plate: 22, laneWidth: 4, dash: [36, 28], pathWidth: 22, grassBlotches: 14, lawnTrees: 6,
    zebra: { stripes: 5, margin: 8, gap: 8, length: 48, inset: 8 },
    kinds: [{ id: 'flats', weight: 3 }, { id: 'lawn', weight: 2 }, { id: 'parking', weight: 1 }, { id: 'playground', weight: 1 }],
    flats: { margin: 30, roof: 150, wall: 90, vents: 4, windowStep: 34, litChance: 0.3, trees: 4 },
    parkingSpots: { edge: 30, width: 56, depth: 96, fill: 0.55 },
    lampEvery: 220, smallDecor: [3, 7], parkGap: 6, carChance: 0.35, busChance: 0.12,
    smallKinds: [{ key: 'decor_bin', weight: 3 }, { key: 'decor_bench', weight: 2 }, { key: 'decor_sign', weight: 1 }],
    decorSize: { lamp: { w: 18, h: 76 }, bin: { w: 20, h: 26 }, bench: { w: 46, h: 22 }, sign: { w: 22, h: 56 }, light: { w: 16, h: 64, box: 32 },
      car: { w: 66, h: 34 }, bus: { w: 170, h: 46 } },
    carColors: [0xe53935, 0x1e88e5, 0xfafafa, 0x424242, 0x43a047, 0xfdd835, 0x8e24aa],
    light: { ms: [4000, 1000, 4000], colors: [0xff1744, 0xffc400, 0x00e676] }, // green, yellow, red for ms[0], [1], [2]
    ambient: { everyMs: 350 }, // one drifting leaf (vfx ambientLeaf) somewhere on screen this often
    margin: 300, groundDepth: -2, decorDepth: -1, pool: { blocks: 24, decor: 700 },
    colors: { asphalt: 0x45484d, asphaltDark: 0x3c3f44, lane: 0xf0f0f0, curb: 0xc7c7c7, sidewalk: 0x9a9a9a, plateLine: 0x878787,
      grass: 0x5e8f3c, grassDark: 0x4b7a2f, path: 0xb9a37c, tree: 0x2e6b2a, treeLight: 0x4e9a3f, roof: 0x8c8c8c, roofDark: 0x6e6e6e,
      wall: 0xe0d6c8, window: 0x455a64, windowLit: 0xffe082, door: 0x5d4037, parking: 0x52555a, parkLine: 0xeeeeee, sand: 0xe8cf94,
      wood: 0x8d6e63, slide: 0xe53935, metal: 0xb0bec5, metalDark: 0x37474f, bin: 0x2e7d32, binDark: 0x1b5e20, signBlue: 0x1565c0,
      lightBox: 0x212121, glass: 0x263238, busYellow: 0xffc107, busRed: 0xd32f2f },
    // Fort Bema (data/maps.js): the same block grid, with gravel alleys in place of the roads and sidewalks. park: trees
    // and a path; meadow: flowers; fort: a moat ring `inset` px inside the lot, `moat` wide, with a `bridge` px wide bridge
    // in the middle of each side, around an island with a brick wall (`wall` thick, a gate at each bridge, towers in the
    // corners). The water stops Bartek and walking enemies (systems/map.js walls).
    fortBema: {
      kinds: [{ id: 'park', weight: 3 }, { id: 'meadow', weight: 2 }, { id: 'fort', weight: 1 }],
      parkTrees: 10, meadowTrees: 3, flowers: 70, flowerSize: [3, 6],
      fort: { inset: 90, moat: 60, bridge: 84, wall: 16, tower: 28, brick: [24, 10] },
      colors: { gravel: 0xc9b38a, gravelEdge: 0xa88f66, water: 0x2f7fb5, waterLight: 0x6fb3e0, brick: 0xa0442c, brickDark: 0x6d2a1a,
        plank: 0x8d6e63, plankDark: 0x5d4037, courtyard: 0xb9a37c, flowers: [0xffeb3b, 0xffffff, 0xe91e63, 0xab47bc, 0xff7043] },
    },
  },
  // Characters: a shadow under each (shadowW x its width, shadowFlat as tall, shadowY x its height below its middle),
  // a sway of bobDeg at bobHz while walking, a white flash for hitFlashMs when hit and still alive.
  // outline: a dark edge so things stand out on grass. Gems get gemWidth px in their texture; the `sprites` (enemy
  // pictures) get spriteWidth px on screen and the `shapes` (drawn chests and pickups) shapeWidth px, both drawn into a
  // copy of the texture in BootScene.
  look: { outline: { color: 0x101010, alpha: 0.9, gemWidth: 1.5, spriteWidth: 2.5, shapeWidth: 2.5,
    sprites: ['zombie', 'uncanny', 'joker', 'homelander', 'goblin', 'sportakus', 'bartcraft', 'binion', 'gnom', 'kapitanBemowo', 'klockowyB', 'purpleBuy'],
    shapes: ['chest', 'chest_locked', 'pickup', 'pickup_magnet', 'pickup_freeze', 'pickup_preworkout', 'pickup_bubble', 'pickup_pierogi'] },
    evolutionFlashMs: 400, heavyHitPct: 0.5, critFlashColor: 0xffc400, shadowAlpha: 0.35, shadowW: 0.75, shadowFlat: 0.3, shadowY: 0.5, shadowDepth: -0.5, bobDeg: 4, bobHz: 2.2, hitFlashMs: 60, hitFlashColor: 0xffffff },
  scar: { offsetX: 8, offsetY: -19, width: 12, height: 3, angle: -30, color: 0xd01818 }, // on Bartek's forehead, px at normal size
  // Spawn rate goes from startPerSec to endPerSec over the run along t^curvePow (above 1: calm start, pressure late).
  // Walking enemies' HP grows by hpPerMinutePct of their base HP for every minute of the run (not the boss).
  // Every enemy's touch (bosses too) hits harder by damagePerMinutePct of its base damage for every minute of the run.
  spawn: { startPerSec: 1.2, endPerSec: 14, curvePow: 1.3, hpPerMinutePct: 0.4, damagePerMinutePct: 0.12, ringMinRadius: 800, ringMaxRadius: 820, maxEnemies: 250 },
  // Hidden pressure (presja Bemowa), 0..max: every sampleSec it looks at the last windowSec. Easy (Bartek lost under calmPct
  // of his max HP and fewer than calmCrowd enemies stood within crowdRadius on average): up by upPerMin a minute, but not
  // for graceSec after any card is taken, so an upgrade is felt first. Struggling (lost over hurtPct, HP under lowHpPct,
  // or more than busyCrowd around): down by downPerMin. Never below 0 (the game as tuned), not before startSec.
  // Pressure p adds p * spawnBonus to the spawn rate and the waves, p * hpBonus to walking enemies' HP (not bosses),
  // and the run's average pressure * proteinPct to its protein.
  dda: { sampleSec: 5, windowSec: 30, startSec: 60, graceSec: 20, crowdRadius: 300, calmCrowd: 8, busyCrowd: 30,
    calmPct: 0.1, hurtPct: 0.3, lowHpPct: 0.35, upPerMin: 0.2, downPerMin: 0.1, max: 1, spawnBonus: 1, hpBonus: 0.4, proteinPct: 0.3 },
  wave: { everySec: 45, baseCount: 8, perWave: 8 }, // a ring of extra enemies all around Bartek, bigger each time
  // XP gems: each enemy type drops one kind (data/enemies.js), the kind sets the value.
  // XP to the next level: baseToLevel + perLevel * (level - 1) + perLevelSq * (level - 1)^2.
  // Drawn in BootScene, gemSize px: a polygon with `sides` corners (stretch: taller than wide), or `cut`: a cut gem
  // (flat top, pointed bottom); facets in `dark`, an inner face in `light`, and a white sparkle.
  xp: { magnetRadius: 80, gemSpeed: 400, baseToLevel: 5, perLevel: 5, perLevelSq: 0.6, gemSize: 26, // was 20: easier to see on a phone
    gems: {
      blue: { value: 1, sides: 4, stretch: 1.3, color: 0x1e88e5, dark: 0x0d47a1, light: 0x90caf9 },
      purple: { value: 3, sides: 6, stretch: 1.1, color: 0x8e24aa, dark: 0x4a148c, light: 0xe1bee7 },
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
  // Protein coins: all gold, in three sizes (scale x size px); `gold`, the big one, counts for the clover unlock.
  coins: {
    dropChance: 0.02, size: 24, color: 0xffca28, // size was 18: easier to see on a phone
    dark: 0xa16800, light: 0xfff8e1,
    kinds: {
      small: { protein: 1, weight: 0.75, scale: 0.8 },
      medium: { protein: 3, weight: 0.2, scale: 1 },
      gold: { protein: 10, weight: 0.05, scale: 1.3 },
    },
    // B coins: silver with a B, dropped by kills (dropChance x luck), spent this run only on the chests on the map.
    b: { dropChance: 0.05, color: 0xcfd8dc, dark: 0x546e7a, light: 0xffffff, letter: 0x263238 },
  },
  // Locked chests on the map (systems/map.js): at most one per block, with `chance`, on the sidewalk, placed anew every
  // run. Walking into one with enough B coins opens it for an item (data/items.js); each chest opened this run raises
  // the price of all: round(basePrice x growth^opened). Over each: the price and a B coin, white if affordable, else red.
  // Boss skulls (systems/map.js, GameScene.updateSkulls): a big skull `size` px wide lies on `chance` of the blocks that
  // have no locked chest, from this run's seed. Standing within touchRadius of it for holdMs fills a ring (ringRadius)
  // around it; then the banner of a boss comes and riseMs later the boss stands up where the skull lay. The boss: from the
  // last boss slot already reached (the first before that), with that slot's hp, chest and protein. A used skull is gone.
  skulls: { chance: 0.1, size: 84, touchRadius: 70, holdMs: 2000, riseMs: 1500, ringRadius: 62, ringWidth: 7, ringBackAlpha: 0.25,
    ringDepth: 3, bone: 0xeceff1, boneShade: 0xb0bec5, socket: 0x212121, eyeGlow: 0xff1744 },
  // Klon Bartek trees (systems/map.js, GameScene.updateCloneTrees, CloneScene): a glowing tree (`width` x `height`) on
  // `chance` of the blocks with neither a locked chest nor a boss skull. Walking within touchRadius of it opens CloneScene
  // (up to `cards` items to clone) if Bartek has two different items of one rarity; else a banner says what it needs.
  // A tree used for a clone is gone for the run.
  cloneTrees: { chance: 0.06, width: 96, height: 128, touchRadius: 60, cards: 3, titleY: 150, titleFontSize: 56, textFontSize: 22,
    titleColor: '#18ffff', costColor: '#ff8a80', buttonBottom: 70, trunk: 0x6d4c41, crown: 0x00e5ff, crownDark: 0x00838f, glow: 0xff4081, sparkle: 0xffffff },
  worldChests: { chance: 0.35, basePrice: 5, growth: 1.3, touchRadius: 40, labelY: 52, labelFontSize: 20, labelIconSize: 20,
    labelGap: 4, labelDepth: 5, affordColor: '#ffffff', poorColor: '#ff5252' },
  // Items (data/items.js): small run-long gains from chests, no slots, no stack limit. An item chest rolls a rarity
  // (rarityWeights by config.rarity id, luck multiplies the rarer ones; no growth with the level) and gives an item of it.
  // The rarer ones grow with the run, per copy, up to maxSteps steps each:
  // piggy +damagePct for every everyBCoins B coins picked up, receipt +speedPct for every chest opened (any kind),
  // tally +damagePct for every everyKills kills, medal +damagePct and -cooldownPct for every boss killed.
  items: {
    rarityWeights: { common: 100, rare: 10, epic: 3, legendary: 0.6 },
    steroids: { regenPerMin: 6 }, bar: { damagePct: 0.04 }, energy: { cooldownPct: 0.03 }, socks: { speedPct: 0.03 },
    gloves: { critChance: 0.02 }, scratch: { luckPct: 0.05 }, plaster: { maxHp: 6 }, fridgeMagnet: { magnetPct: 0.08 },
    piggy: { damagePct: 0.01, everyBCoins: 10, maxSteps: 12 }, receipt: { speedPct: 0.01, maxSteps: 10 },
    tally: { damagePct: 0.01, everyKills: 200, maxSteps: 15 }, medal: { damagePct: 0.05, cooldownPct: 0.03, maxSteps: 4 },
    rubber: { knockback: 40 }, // Gumka recepturka: + run.player.knockback per copy
    // Podręcznik do informatyki (rare): +xpPct XP and +damagePct damage for every everyLevels of Bartek's level.
    textbook: { xpPct: 0.02, damagePct: 0.01, everyLevels: 5, maxSteps: 8 },
    // Elites and bosses (run.player.bigDamage): Proca (common) +bigDamagePct per copy; Wypchany szczupak (rare)
    // +bigDamagePct for every elite killed in the run, at most maxSteps elites.
    slingshot: { bigDamagePct: 0.05 }, pike: { bigDamagePct: 0.02, maxSteps: 10 },
  },
  run: { durationSec: 600 }, // one stage (config.stages)
  // Konto (systems/online.js): the Firebase SDK from `sdk` (one pinned version), loaded startDelayMs after the game starts;
  // the progress goes to the cloud uploadDelayMs after the last save write. A nick: nickMin-nickMax letters, digits or _.
  // Wyzwanie dnia (systems/daily.js, DailyScene): one run a day, the same for everyone; the day goes by Polish time
  // (timeZone). The day draws the map (locked ones too), a difficulty level up to maxDifficulty, a plan, one Zakład z Unc
  // at betLevel, the starting weapon, the order the enemy types arrive in and each wave's type. No gym, no player's bets,
  // every weapon and passive can drop. Only the first run of the day counts. fetchMax: the most entries a day's table reads.
  daily: { timeZone: 'Europe/Warsaw', maxDifficulty: 3, betLevel: 1, fetchMax: 500, wavesShown: 4 },
  online: { sdk: 'https://www.gstatic.com/firebasejs/12.6.0', startDelayMs: 1500, uploadDelayMs: 3000, nickMin: 3, nickMax: 16 },
  // Etapy: a map is `count` stages of run.durationSec each, all the boss slots in every one. Once the last slot's boss (and
  // every other boss) is dead, a portal stands portal.dist px from Bartek for portal.sec. Walking in starts the next stage
  // at once: the walkers on the map go, walker HP +hpPct and spawns +spawnPct per stage, bosses bossHpMult x per stage.
  // The portal not walked into, or the stage's time up first: overtime (dogrywka) for overtime.durationSec, then the next
  // stage anyway. In overtime a horde of `enemy` walks in every everySec on top of the usual spawn: baseCount of them,
  // +countPct and +hpPct HP for every horde before it. Protein's winBonus is paid per stage done.
  // The last stage: its bosses dead is the win (the map cleared). Its portal is the exit; missed (or its time up) its
  // overtime never ends: every horde's HP x endless.hpGrowth and touch damage x endless.damageGrowth over the one before
  // (the enemy cap holds the count), so a better build only lasts longer and the score has no ceiling.
  // Wynik: every kill adds scoreMult[stage - 1] x (1 + difficultyPct per difficulty level above 1).
  stages: { count: 3, hpPct: 0.3, spawnPct: 0.3, bossHpMult: 2.5,
    portal: { sec: 10, dist: 260, tries: 24, clearance: 50, pulse: { scale: 1.15, ms: 700, vfx: 'portalGlow', everyMs: 700 } },
    overtime: { durationSec: 600, enemy: 'runner', everySec: 15, baseCount: 20, countPct: 0.25, hpPct: 0.35,
      endless: { hpGrowth: 1.12, damageGrowth: 1.08 } },
    scoreMult: [1, 1.5, 2], difficultyPct: 0.25 },
  // Bartek's death: the run stops, everything but Bartek goes black over fadeMs while the camera zooms in by `zoom` over
  // zoomMs; after fallDelayMs he falls over (fallDeg, fallDrop px lower) in fallMs; the end screen comes after totalMs.
  // coverDepth: the black over the world and the HUD-less screen; Bartek is drawn just above it.
  death: { fadeMs: 700, zoom: 1.8, zoomMs: 900, fallDelayMs: 400, fallMs: 600, fallDeg: 90, fallDrop: 12, totalMs: 2200, coverDepth: 50 },
  protein: { perKills: 10, perMinute: 2, winBonus: 20 }, // awarded at the end of a run
  // Difficulty levels per map (data/maps.js, picked on the map's card in MapScene): 1 to `levels`; a win on a map's highest
  // open level opens the next. Each level above 1 adds hpPct to walking enemies' HP, spawnPct to the spawn rate and
  // proteinPct to the run's protein (with the bets' bonus).
  difficulty: { levels: 5, hpPct: 0.25, spawnPct: 0.15, proteinPct: 0.25 },
  // Debug flags, all off by default.
  debug: {
    resetSave: false, // true wipes the save on page load
    freeProtein: false, // true makes gym purchases free
    pickupKey: false, // true: the P key drops a random pickup next to Bartek
    skullEverywhere: false, // true: every block without a locked chest has a boss skull
    cloneTreeEverywhere: false, // true: every block without a locked chest or a skull has a Klon Bartek tree
    tankKey: false, // true: the T key fills the tank bar at once
    klapaKey: false, // true: the K key launches a klapa at Bartek
    bartkowanieKey: false, // true: N, then a digit 1-8, runs that Bartkowanie effect
    balanceOverlay: false, // true: numbers for balancing in the top right (enemies, spawn/s, kills/s, DPS)
    timeSkipKey: false, // true: the J key moves the run clock 60 s forward
    offline: false, // true: Firebase is never loaded (Konto shows the no-connection state)
    forceSyncConflict: false, // true: a login with a save in the cloud always asks which save to keep
    portalKey: false, // true: the O key opens the stage's portal by Bartek (walk in: next stage; leave it: overtime)
    bossKey: false, // true: B, then a digit 1-4, calls that boss (in order of appearance) after its banner
    enemyKey: false, // true: the Y key brings a goblin pack and a Sportakus next to Bartek
    giveWeapon: null, // a weapon id or a list (e.g. ['gas', 'laser']): unlocked in the save and given at the start of every run
    givePassives: null, // a list of passive ids (e.g. ['ticket', 'dumbbells']): unlocked in the save and given at level 1 every run
    drawCharges: null, // a number: every run starts with this many Odśwież, Pomiń and Wywal (gym included)
    unlockMaps: false, // true: every map and every difficulty level is open in the map list (MapScene)
    forcePlan: null, // a plan id (e.g. 'lazy'): every run but the very first starts with it, no plan screen; unlocked in the save
    dailyDay: null, // a day 'YYYY-MM-DD': Wyzwanie dnia is that day's (its draw only: the server keeps such a run off the table)
    dailyReplay: false, // true: Wyzwanie dnia can be started again on this device the same day
    showNews: false, // true: Co nowego shows on every page load (the latest entries, even if seen)
    evolveKey: false, // true: E puts every carried weapon at its max level and gives its evolution passive; the next chest (P with pickupKey) evolves
    eliteKey: false, // true: the L key spawns an elite next to Bartek, each press with the next trait
    eventKey: false, // true: V, then a digit 1-9 (0 the tenth), starts that run event (data/events.js order)
    betsUnlocked: false, // true: the gym shows Zakłady z Unc without a won run
    startWeapon: null, // a weapon id: every run starts with it instead of a random one from weapons.start
    startBCoins: null, // a number: every run starts with that many B coins (to open the chests on the map)
    forcePressure: null, // a number 0..dda.max: the hidden pressure stays there all run (the balance overlay shows it)
    gemKey: false, // true: the G key scatters 250 gems around Bartek (they merge) and one coin of each kind
    forceRarity: null, // a config.rarity id (e.g. 'legendary'): every card gets that rarity
  },
  // Ultimate: charged by kills, Space (or a tap on its bar) turns Bartek into a tank.
  // Tank: a boss it touches loses bossDamagePct of its max HP a second (so it helps against late bosses too); on the way
  // in it crushes every walking enemy within crushRadius px.
  // dustEveryMs, dustBack: dust from the tracks while it drives, dustBack px behind it.
  // killsToCharge is the first tank; every use multiplies the next one's cost by chargeGrowth (100, 150, 225...).
  tank: { killsToCharge: 100, chargeGrowth: 1.5, durationSec: 10, bossDamagePct: 0.05, crushRadius: 260, shakeMs: 300, shakeIntensity: 0.01, barBlinkMs: 200,
    dustEveryMs: 90, dustBack: 40 },
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
      // Each pigeon flies its own lane (the screen height split into lanes, laneJitter of a lane off its middle) and takes out
      // every enemy within hitRadius screen px of it; enemies still on screen when the flock is gone fall too.
      hitRadius: 80, laneJitter: 0.3,
    },
    photoshop: { dropChance: 0.004, cooldownSec: 60, durationSec: 15, scale: 0.5, speedPct: 0.3, damagePct: -0.3 },
    magnet: { dropChance: 0.004, cooldownSec: 45 }, // every gem on the map flies to Bartek
    freeze: { dropChance: 0.003, cooldownSec: 60, durationSec: 5, tint: 0x9fd8ff }, // walkers stand still and do no damage
    preworkout: { dropChance: 0.003, cooldownSec: 60, durationSec: 8, fireRateMult: 2 },
    bubble: { dropChance: 0.003, cooldownSec: 60, durationSec: 6 }, // no damage taken
    pierogi: { dropChance: 0.004, cooldownSec: 30, heal: 30 },
    // Rolki Bartka: speedPct faster for durationSec; a walker or flyer (not a boss) touching him takes ramDamage (weapon
    // damage bonuses count) instead of biting, at most once per ramCooldownMs, and a walker is pushed away at knockSpeed
    // for knockMs. He leans leanDeg into the turn and leaves a streak every trailEveryMs, trailBack px behind.
    rollers: { dropChance: 0.003, cooldownSec: 60, durationSec: 8, speedPct: 0.6, ramDamage: 25, ramCooldownMs: 400,
      knockSpeed: 420, knockMs: 220, leanDeg: 12, trailEveryMs: 110, trailBack: 18 },
  },
  // Permanent upgrades bought with protein. Percentages multiply with the in-run upgrades.
  gym: {
    // Playtests: everything was bought in about an hour (1735 protein in all), then about 11 000; after step 41 too easy
    // again, so the costs climb harder (about 1.7x) and five upgrades were added: about 25 000 in all.
    chest: { damagePct: 0.1, maxLevel: 8, costs: [15, 40, 90, 180, 350, 650, 1100, 1800] },
    legs: { speedPct: 0.05, maxLevel: 8, costs: [15, 40, 90, 180, 350, 650, 1100, 1800] },
    back: { maxHp: 10, maxLevel: 8, costs: [15, 40, 90, 180, 350, 650, 1100, 1800] },
    glasses: { rangePct: 0.1, maxLevel: 5, costs: [30, 90, 220, 450, 800] },
    warmup: { durationSec: 60, speedPct: -0.2, damagePct: 0.3, maxLevel: 1, costs: [120] },
    plan: { rerolls: 1, banishes: 1, maxLevel: 5, costs: [50, 130, 260, 480, 800] }, // Plan dnia: more level-up rerolls and banishes
    // Kabura: +1 weapon slot a level, at most 2 (3 slots in all). The third cost is not for sale since step 96: a save with
    // that level gets it back as protein (state.js parseSave).
    weaponSlot: { maxLevel: 2, costs: [150, 400, 1000] },
    passiveSlot: { maxLevel: 2, costs: [300, 800] }, // Plecak: +1 passive slot a level
    // Half a level of the matching passive each (the passive's icon too): XP, regen, armor, luck, crit chance.
    tutoring: { xpPct: 0.05, maxLevel: 5, costs: [30, 80, 180, 350, 650] },
    sleep: { regenPerSec: 0.1, maxLevel: 5, costs: [40, 100, 220, 420, 750] },
    pads: { armor: 1, maxLevel: 3, costs: [150, 400, 900] },
    talisman: { luckPct: 0.05, maxLevel: 5, costs: [30, 80, 180, 350, 650] },
    coach: { critChance: 0.02, maxLevel: 5, costs: [40, 100, 220, 420, 750] },
    quotes: [
      'Za moich czasów zombie były grzeczniejsze.',
      'Najpierw rozgrzewka. Piętnaście minut. Nie dyskutujemy.',
      'Muchacho, nogi to też mięśnie.',
      'Okulary? To do czytania etykiet odżywek.',
    ],
  },
  // Bartkowanie: not a card. After every level up (a card taken or skipped) there is levelUpChance of a random effect
  // from data/bartkowanie.js on top, with a banner.
  bartkowanie: {
    levelUpChance: 0.25, durationSec: 5, damagePct: 0.2, allStatsPct: 0.01, protein: 5,
    spins: 3, spinMs: 1500, squatAmp: 8, squatHz: 3, // squats: enemies hop squatAmp px up and down squatHz times a second
    fxEveryMs: 200, fxPerTick: 3, // squats and moonwalk: every fxEveryMs that many walkers on screen get stars or a trail
    yellowColor: 0xffd400, yellowAlpha: 0.25,
    definitions: [ // shown in the gym under Bartek's bubble
      'Bartkowanie (czas.): czynność, której nikt nie widział, ale wszyscy o niej słyszeli.',
      'Bartkowanie: robienie przysiadów w kolejce w Ropusze.',
      'Bartkowanie: tłumaczenie zombie przepisów ruchu drogowego.',
      'Bartkowanie: noszenie żółtego swetra w lipcu.',
      'Bartkowanie: przegrywanie z klapą bagażnika, z godnością.',
    ],
  },
  // Sounds. A missing file is skipped, the game runs on without it. events: game event -> file key.
  // minGapMs: a sound that fires in bursts (hits, gems) plays at most once per this many ms.
  // masterVolume: every sound and the music (the settings sliders go on top); playtests found the game too loud at 1.
  audio: {
    masterVolume: 0.4,
    sfxVolume: 0.7, // every sound effect (not the music) on top of its own volume: 30% quieter since step 103
    files: {
      clang: { file: './assets/sounds/title_hit.wav', volume: 0.8 },
      musicGameplay: { file: './assets/music/gameplay.mp3', volume: 0.35 },
      musicGym: { file: './assets/music/gym.mp3', volume: 0.35 },
      // The boss track in two parts: the intro once, then only the main part in a loop.
      // shortcut: MP3 pads the start and end with a few ms of silence, so the loop seam may click; OGG loops cleanly if it bothers.
      musicBossIntro: { file: './assets/music/BossIntro.mp3', volume: 0.4 },
      musicBossMain: { file: './assets/music/BossMain.mp3', volume: 0.4 },
      muchacho: { file: './assets/audio/muchacho.mp3', volume: 1 }, // optional
      levelUp: { file: './assets/sounds/level_up.wav', volume: 0.7 },
      pick: { file: './assets/sounds/pick.wav', volume: 0.4, minGapMs: 50 },
      playerDamage: { file: './assets/sounds/player_damage.wav', volume: 0.6 },
      powerUp: { file: './assets/sounds/power_up.wav', volume: 0.35 }, // half of 0.7 since step 103
      shotHit: { file: './assets/sounds/shot_hit.wav', volume: 0.3, minGapMs: 50 },
      muzzleShot: { file: './assets/muzzle-flash-pixel-fx-v1/sounds/fx-muzzle-shot.wav', volume: 1, minGapMs: 50 }, // mastered quiet
    },
    events: { tank: 'powerUp', pickup: 'powerUp', boss: 'clang' },
    // Music tracks: an optional intro played once, then the loop, joined without a gap. One track at a time.
    music: {
      gameplay: { loop: 'musicGameplay' },
      gym: { loop: 'musicGym' },
      boss: { intro: 'musicBossIntro', loop: 'musicBossMain' }, // also under the title once the logo has landed
    },
  },
  effects: { endFlashMs: 600 }, // Bartek blinks this long when a timed effect runs out
  // enemies: spawn.maxEnemies + room for bosses, the school trip and split elites; pickups: room for boss and elite chests
  // vfxParticles: the most particles one effect layer keeps alive at once (a full horde cannot pile them up).
  pools: { bullets: 160, enemies: 320, gems: 300, pickups: 20, vfx: 60, vfxParticles: 200, bees: 20, gas: 12, axes: 12, arrows: 40, minions: 16 },
  // Card rarity, rolled per card at every level up. A tier's draw weight is weight + perLevel * (level - 1),
  // so rarer cards come up more often later. mult scales the card's numbers.
  rarity: [
    { id: 'common', name: 'Zwykła', mult: 1, color: 0xbdbdbd, weight: 100, perLevel: 0 },
    { id: 'rare', name: 'Rzadka', mult: 1.5, color: 0x3a8dff, weight: 20, perLevel: 2 },
    { id: 'epic', name: 'Epicka', mult: 2, color: 0xb04cff, weight: 4, perLevel: 1 },
    { id: 'legendary', name: 'Legendarna', mult: 3, color: 0xff9800, weight: 0.5, perLevel: 0.3 },
  ],
  // fallbackHeal: the heal card. overflow: the small no-limit cards (data/upgrades.js overflowUpgrades) that fill a draw
  // once the weapon and passive cards run short; each about 40% of a passive level.
  upgrade: { fallbackHeal: 20,
    overflow: { damagePct: 0.04, cooldownPct: 0.03, speedPct: 0.03, maxHp: 10, areaPct: 0.04, magnetPct: 0.08 } },
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
    bartkowanie: { chanceMult: 3, unlockCount: 10 },
    lazy: { xpPct: 0.3, enemyHpPct: 0.15, earlyDeathSec: 120, unlockEarlyDeaths: 3 },
    // Trening w parze: every boss walks in with a partner from its slot's pool (another one when the pool has it) at
    // partnerHpMult of the slot's HP, with its own chest and protein. Unlock: unlockBosses bosses killed in one run.
    pair: { partnerHpMult: 0.7, unlockBosses: 4 },
    // Obóz elit: elites rateMult x as often, each with two traits from the start. Unlock: unlockElites elites in one run.
    eliteCamp: { rateMult: 2.5, unlockElites: 10 },
  },
  ui: { margin: 16, hudFontSize: 24, balanceWindowSec: 10, titleFontSize: 64, subtitleFontSize: 20, buttonFontSize: 32, lineGap: 56,
    // Cards (systems/cards.js makeCard): a panel framed in the rarity's colour, the icon (iconSize, left in portrait, under
    // the name side by side), "NOWA" on the top right corner of a new weapon or passive; each slides in from below,
    // slideMs long, card i slideGapMs after the one before.
    dimAlpha: 0.78, card: { count: 3, row: false, width: 600, height: 230, gap: 44, hintFontSize: 20, hintColor: '#ffc400', evolutionColor: 0xffc400, color: 0x22252c, alpha: 0.96, nameFontSize: 30, textFontSize: 24,
      rarityBorderWidth: 5, rarityFontSize: 22, iconSize: 80, slideMs: 380, slideGapMs: 90, badgeFontSize: 18, badgeColor: '#ffc400', badgeAngle: 14,
      // Map and plan cards (cards.js pickCard): framed in the button green, a "Wybierz" chip on the bottom right corner.
      pick: { borderWidth: 3, hoverAlpha: 0.95, chipFontSize: 20, chipColor: '#43a047', chipPadX: 12, chipPadY: 5 } },
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
      secondary: { color: 0x37474f, hover: 0x455a64, border: 0x78909c, text: '#ffffff' }, // dark: below the green main action
      disabled: { color: 0x26282c, hover: 0x26282c, border: 0x1a1a1a, text: '#6f6f6f' } }, // darker than secondary: reads as off
    // Drawn icons (heart, skull, clock, gym upgrades), size x size px; shown at the size each place asks for.
    icons: { size: 48, account: 0x90caf9, textbook: 0x1565c0, textbookCode: 0xffd54f, slipper: 0xec407a, slipperSole: 0x6d4c41, rubber: 0xd7a86e, heart: 0xe53935, heartLight: 0xff8a80, skull: 0xeceff1, skullDark: 0x263238, clock: 0xfafafa, clockDark: 0x263238,
      metal: 0xb0bec5, metalDark: 0x37474f, accent: 0xffc400, outline: 0x1b1b1b,
      // Passive icons (passive_<id>).
      tub: 0xeceff1, coffee: 0x8d6e63, cup: 0xfff8e1, shoe: 0x1e88e5, gainer: 0x6d4c41, backpack: 0x388e3c, ticket: 0xffd54f,
      ticketStripe: 0xd32f2f, pass: 0xff7043, soup: 0xffca28, bowl: 0xfafafa, jacket: 0x546e7a, jacketLine: 0x37474f,
      clover: 0x43a047, cloverDark: 0x1b5e20, page: 0xfafafa, grid: 0x90caf9, sack: 0xa1887f, sackDark: 0x5d4037, gem: 0x1e88e5,
      // Item icons (item_<id>).
      syringe: 0xe3f2fd, steroid: 0xe53935, barWrap: 0x6a1b9a, barChoc: 0x6d4c41, can: 0x00c853, canDark: 0x1b5e20,
      sock: 0xfafafa, sockStripe: 0xd32f2f, glove: 0x263238, gloveStrap: 0xff7043, scratch: 0xfff176, scratchFoil: 0x9e9e9e,
      plaster: 0xffcc80, plasterPad: 0xfff3e0, magnet: 0xd32f2f, piggy: 0xf48fb1, piggyDark: 0xc2185b, receipt: 0xfafafa,
      receiptInk: 0x616161, medal: 0xffc400, medalDark: 0xff8f00, ribbon: 0x1e88e5, ribbonDark: 0xd32f2f,
      book: 0x212121, bookPage: 0xfafafa, bookTitle: 0xffc400, disc: 0x263238, discShine: 0x90a4ae, discLabel: 0xd32f2f, boxingGlove: 0xd32f2f, boxingCuff: 0xfafafa, tracksuit: 0x1565c0, tracksuitStripe: 0xfafafa,
      belt: 0x5d4037, beltDark: 0x3e2723, slingshot: 0x8d6e63, slingshotBand: 0xd32f2f, pike: 0x7cb342, pikeDark: 0x33691e, plaque: 0xa1887f,
      planRing: 0xd32f2f },
    // Top left HUD panel: HP (heart), XP (level badge), tank charge. Rows of rowHeight, bars barWidth x barHeight.
    hud: { width: 330, padding: 10, rowHeight: 30, iconSize: 26, barWidth: 270, barHeight: 22, barGap: 8, barFontSize: 18,
      levelFontSize: 18, hpColor: 0xe53935, xpColor: 0x3a8dff, tankColor: 0x2e7d32, tankBlinkColor: 0x9ccc65, levelColor: 0x1565c0,
      // Top center clock pill and the top right stats (kills, protein from coins).
      clock: { width: 150, height: 46, fontSize: 30, iconSize: 26 }, stat: { width: 140, height: 38, fontSize: 22, iconSize: 26, gap: 8 } },
    // Settings / pause screen (SettingsScene): a panel with a row per volume (label, -, bar, +, percent) and a back button.
    // step: how much one press of - or + changes a volume. pauseButton: the HUD's square pause button left of the clock.
    // Odśwież / Pomiń / Wywal under the level-up cards, `top` px under the lowest card; the key hint line under them.
    drawButtons: { width: 200, height: 64, gap: 20, top: 40, fontSize: 24, hintFontSize: 20, hintGap: 14, hintColor: '#b0bec5',
      banishColor: '#ff5252', banishBorder: 0xff5252 },
    // Plan screen: the title at titleY, the plan cards where the level-up cards go (card size), plus and minus lines.
    // Damage numbers over hit enemies: a pool of `pool` texts, each rising riseY px and fading for ms; a crit in gold and
    // bigger. When all are in the air a hit shows none. enabled: false turns them off.
    damageNumbers: { enabled: true, pool: 40, fontSize: 18, critFontSize: 26, color: '#ffffff', critColor: '#ffc400', stroke: 4,
      dodgeText: 'Unik!', dodgeColor: '#80d8ff', // over Bartek when he dodges a hit
      riseY: 36, ms: 650, jitterX: 12, depth: 4 },
    fireworkEveryMs: 350, // a won run's end screen: a firework this often
    // End screen (GameOverScene): the title from `top`, a panel with the run's numbers and every weapon's damage (icon,
    // name, a bar against the best one, the damage and DPS in valueWidth px), the buttons under it, then what the run unlocked.
    gameOver: { top: 110, gap: 18, panelWidth: 600, padding: 18, fontSize: 22, rowHeight: 32, headerColor: '#ffc400', labelColor: '#b0bec5',
      iconSize: 28, nameWidth: 230, valueWidth: 170, barHeight: 14, barColor: 0xffc400, buttonsGap: 50 },
    // Map list (MapScene): the plan screen's cards; a locked map's card at lockedAlpha with its unlock text in lockedColor.
    // The difficulty row levelY px under the card's middle: < and > buttons (arrow x arrow px) arrowGap px either side of the text.
    mapScreen: { titleY: 120, titleFontSize: 56, textFontSize: 22, textColor: '#e0e0e0', lockedColor: '#9e9e9e', lockedAlpha: 0.45, buttonBottom: 70,
      levelY: 46, levelFontSize: 22, levelColor: '#ffc400', arrow: 48, arrowGap: 150 },
    planScreen: { titleY: 120, buttonBottom: 70, titleFontSize: 56, plusColor: '#9ccc65', minusColor: '#ff8a80', lineFontSize: 22, lineGap: 12, betsGap: 24,
      gameOverFontSize: 22, gameOverColor: '#ffc400' },
    settings: { width: 660, padding: 28, titleFontSize: 56, labelFontSize: 28, rowHeight: 124, stepButton: 72, barHeight: 26,
      valueWidth: 90, step: 0.1, orientWidth: 200, orientGap: 20, inventoryWidth: 240, backWidth: 320, backHeight: 84, backFontSize: 34, hintFontSize: 22, hintColor: '#b0bec5',
      actionHeight: 80, actionFontSize: 28, wipeColor: '#ff8a80', // wipeColor: the "Nowa gra" warning
      // Wielkość interfejsu (the HUD's zoom, save.uiScale) and Przybliżenie kamery (the run's camera zoom, save.cameraZoom):
      // kept between min and max, changed by `step` (the same step as the volumes).
      // uiScale max: the top HUD row (HP panel, pause, clock) still fits the 720 px wide portrait screen.
      // Wielkość menu (save.menuScale): the zoom of every screen but the run and its HUD (systems/layout.js applyMenuScale);
      // A screen grows only while its content stays `margin` px inside the screen (layout.js zoomScene; panels drawn in
      // Graphics are not measured, so margin covers their padding).
      uiScale: { min: 0.8, max: 1.2 }, menuScale: { min: 0.8, max: 1.3, margin: 28 }, cameraZoom: { min: 0.8, max: 1.2 },
      barColor: 0xffc400, pauseButton: { size: 46, iconSize: 26, gap: 8 } },
    // Round "CZOŁG" button in the bottom right while the tank is ready: a click or tap starts it (phones have no Space).
    tankButton: { radius: 64, margin: 40, color: 0x2e7d32, alpha: 0.85, fontSize: 22 },
    // Arrow at the screen edge toward the nearest pickup lying off screen.
    pickupArrow: { size: 22, margin: 30, color: 0xffcc00 }, // points at the Żabka shop first, else at the nearest pickup off screen
    // Zakłady z Unc window over the gym; gymButton*: its button next to "Na Bemowo!" (two lines: name and bonus).
    bets: { width: 700, padding: 22, gap: 12, titleFontSize: 48, textFontSize: 22, nameFontSize: 26, descFontSize: 22, rowHeight: 110,
      stepButton: 72, levelWidth: 80, sumFontSize: 28, sumColor: '#9ccc65', onColor: '#ff8a80', hintColor: '#b0bec5',
      backWidth: 300, backHeight: 84, backFontSize: 32, gymButtonWidth: 260, gymButtonGap: 20, gymButtonFontSize: 22 },
    shop: { titleFontSize: 56, titleColor: '#76ff03', poorColor: '#ff8a80', boughtColor: '#9e9e9e', boughtAlpha: 0.45, shakePx: 6, shakeMs: 50 },
    // Active timed effects under the HUD panel: icon, name, a bar of the time left.
    effectHud: { width: 230, height: 38, iconSize: 28, barHeight: 6, gap: 6, fontSize: 18, color: 0xffcc00 },
    // Weapon slots, bottom left (run.player.weaponSlots, empty ones dimmed): icon with a level badge in its corner.
    // The passive slots are a second row of the same slots right above them.
    // readyColor: a pulsing frame on a weapon ready to evolve and on the passive it needs (readyPulseMs a beat).
    // Items (data/items.js) in a row above the passives: an icon each, with the count.
    itemHud: { size: 36, iconSize: 30, gap: 4, fontSize: 16 },
    weaponHud: { size: 52, iconSize: 40, gap: 8, fontSize: 15, badgeRadius: 11, emptyAlpha: 0.35, readyColor: 0xffc400, readyWidth: 3, readyPulseMs: 500 },
    joystick: { radius: 70, knobRadius: 30, color: 0xffffff, baseAlpha: 0.25, knobAlpha: 0.5, deadZone: 0.15 },
    privacyColor: '#9e9e9e', // the privacy link's text (title screen, menu corner)
    // Kept clear at the screen's bottom corners (px): a phone's rounded corners, its home bar and gesture area hide and
    // swallow anything closer. The menu's Prywatność and version and the title's privacy notice sit inside it.
    safeEdge: { x: 36, bottom: 64 },
    linkPad: 20, // px around a small text link (Prywatność) that still count as a tap on it
    title: { promptFontSize: 32, logoFontSize: 140, fontFamily: '"NotJam", Impact, "Arial Black", sans-serif', strokeThickness: 10,
      bemowoColor: '#ffcc00', survivorsColor: '#d01818', bemowoY: 520, survivorsY: 660, dropMs: 450, gapMs: 600,
      shakeMs: 250, shakeIntensity: 0.02, blinkMs: 600,
      // After the intro a pulsing prompt waits promptGapY under SURVIVORS for a tap or key; one from skipDelayMs into the
      // intro skips it all.
      promptGapY: 200, skipDelayMs: 250, pulseScale: 1.08, promptStroke: 6,
      // First launch: "Jak trzymasz ekran?" over two buttons orientWidth px wide, orientGap apart, orientGapY under it.
      orientFontSize: 40, orientWidth: 260, orientGap: 30, orientGapY: 90,
      // Under the start prompt and the orientation question: the stats notice and the privacy link, ui.safeEdge.bottom px up.
      privacyFontSize: 22 },
    // y: under the HUD panel and the three stat pills (portrait: the B coin pill ends at 200); the effect rows go under it
    bossBar: { y: 212, width: 600, height: 24, fontSize: 18, color: 0xd03030 },
    // "Etap 2/3" under the stats column, right-aligned; red in overtime, as the clock then.
    stageHud: { gap: 4, fontSize: 20, color: '#ffffff', overtimeColor: '#ff5252' },
    // Boss chest screen: cards spin through names every spinStepMs; the first stops after spinMs, each next stopGapMs later.
    chest: { titleY: 190, titleFontSize: 64, titleColor: '#ffc400', strokeThickness: 8, spinStepMs: 70, spinMs: 1200, stopGapMs: 700,
      popScale: 1.08, popMs: 120, promptBottom: 60 },
    welcome: { fontSize: 72, holdMs: 1500, fadeMs: 1000 },
    // Pickup, Bartkowanie and boss banners: big text with a line under it, on a panel, faded in and out.
    // Its panel starts right under the HUD (where the effect rows start; GameScene stays visible around Bartek).
    banner: { fontSize: 40, strokeThickness: 6, durationMs: 3200, fadeMs: 250, subFontSize: 22, subStrokeThickness: 4, padX: 30, padY: 14, gap: 6 },
    olxCard: { width: 420, height: 440, padding: 24, photoSize: 200, titleFontSize: 34, textFontSize: 20, bigFontSize: 38 },
    buttonOffsetX: 160, // two buttons side by side sit this far left and right of center
    gymPulse: { scale: 1.12, ms: 500 }, // after the first run: the end screen's menu button and the menu's gym button
    // Main menu (MenuScene): title, protein pill proteinGap under it, then a button column `width` wide at columnX of the
    // screen from `top`: Na Bemowo! (goHeight), Siłownia and Zakłady z Unc (height), the small windows two per row
    // (smallHeight, an icon iconPad from the left). Bartek's quote under it where it fits above `bottom`, or with
    // quoteSide in the middle of the room left of the buttons (at least quoteLeft from the edge), level with them;
    // bartekHeight: Bartek's height there (0: the gym's).
    menu: { titleY: 120, titleFontSize: 60, proteinGap: 18, top: 360, columnX: 0.5, width: 600, gap: 18, goHeight: 120, goFontSize: 46,
      height: 96, fontSize: 34, betsFontSize: 28, smallHeight: 88, smallFontSize: 28, iconSize: 44, iconPad: 18, hintFontSize: 16,
      quoteSide: false, quoteLeft: 0, quoteGap: 40, bartekHeight: 0, bottom: 100, versionFontSize: 20, versionColor: '#757575',
      dailyFontSize: 28, privacyFontSize: 22 }, // Siłownia and Wyzwanie dnia side by side at dailyFontSize; "Prywatność" bottom left and the version bottom right, ui.safeEdge in from the corners (`bottom` keeps the quote above them)
    // Gym: a row per upgrade (icon on the left; name, description, then level pips and the cost on a line under them; the buy
    // button on the right), Bartek with a speech bubble under the rows, the start button at the bottom.
    // x positions are from the row's left edge. popScale/popMs: the newly bought pip pops; floatPx/floatMs: the "-cost" rising.
    // Bartek with his quote under the rows only shows when it fits above the start button.
    // Ekwipunek (InventoryScene, from the pause screen): weapons, passives and items in `columns` columns, then the stats
    // in statColumns columns.
    inventory: { width: 680, padding: 20, gap: 12, columns: 2, statColumns: 2, rowHeight: 52, statHeight: 30, iconSize: 40,
      titleFontSize: 44, headFontSize: 22, nameFontSize: 20, textFontSize: 19, headColor: '#ffc400', dimColor: '#b0bec5',
      evoColor: '#ffc400', backWidth: 240, backHeight: 60, backFontSize: 26 },
    // Bestiariusz (BestiaryScene, the skull after the chart in the gym): one row per enemy type and boss in `columns`
    // columns; bosses framed in bossColor. A type never killed shows as a black shape.
    bestiary: { margin: 16, pagerHeight: 72, pagerButton: 96, pagerFontSize: 28, width: 700, columns: 1, columnGap: 0, padding: 18, inner: 10, gap: 12, titleFontSize: 48, textFontSize: 24,
      rowHeight: 88, rowGap: 6, iconSize: 64, nameFontSize: 26, descFontSize: 22, dimColor: '#b0bec5', bossColor: 0xff7043,
      bossText: '#ffab91', backWidth: 300, backHeight: 84, backFontSize: 32},
    // Statystyki (StatsScene, the chart next to the cup in the gym): label and value rows in `columns` columns, every other
    // row lighter (stripeAlpha).
    // Konto (AccountScene): a panel `width` wide, its rows `gap` apart; the nick field inputWidth x inputHeight.
    account: { width: 680, padding: 24, gap: 16, titleFontSize: 48, textFontSize: 24, smallFontSize: 22, textColor: '#e0e0e0',
      dimColor: '#b0bec5', errorColor: '#ff8a80', okColor: '#a5d6a7', buttonHeight: 80, buttonFontSize: 28, inputWidth: 460,
      inputHeight: 72, inputFontSize: 28},
    // Wyniki (LeaderboardScene, from the menu): the best `count` players, one row each; the columns at nickX and mapX of
    // the inner width (place at the left, score at the right); the player's own row in mineColor.
    leaderboard: { width: 700, count: 15, padding: 22, inner: 10, gap: 12, titleFontSize: 48, rowHeight: 50, fontSize: 26,
      detailFontSize: 22, textFontSize: 22, nickX: 0.1, mapX: 0.44, stripeAlpha: 0.06, mineColor: 0xffc400, mineAlpha: 0.18,
      dimColor: '#b0bec5', errorColor: '#ff8a80', backWidth: 300, backHeight: 84, backFontSize: 32},
    // Wyzwanie dnia (DailyScene): the leaderboard's sizes, the day's table `count` rows long; `soonColor`: the time left.
    daily: { count: 10, soonColor: '#9ccc65' },
    // Co nowego (NewsScene): the leaderboard's sizes, at most `count` news entries, `itemGap` px above each.
    news: { count: 3, itemGap: 18 },
    stats: { width: 700, columns: 1, columnGap: 0, padding: 24, inner: 12, gap: 14, titleFontSize: 48, rowHeight: 52, fontSize: 26,
      stripeAlpha: 0.06, labelColor: '#b0bec5', backWidth: 300, backHeight: 84, backFontSize: 32},
    // Wyzwania (ChallengesScene, the cup next to the gear in the gym): one row per unlock condition in `columns` columns,
    // done ones with a doneColor frame; a locked one's icon at lockedAlpha.
    // More rows than fit on the screen (margin px from its top and bottom): pages, "<  Strona 1/2  >" under the rows.
    challenges: { width: 700, columns: 1, columnGap: 0, padding: 20, inner: 10, gap: 14, titleFontSize: 48, textFontSize: 22,
      margin: 16, pagerHeight: 72, pagerButton: 96, pagerFontSize: 28,
      rowHeight: 96, rowGap: 8, iconSize: 56, nameFontSize: 26, descFontSize: 22, hintColor: '#b0bec5', lockedColor: '#cfd8dc',
      lockedAlpha: 0.35, doneColor: 0x66bb6a, doneText: '#a5d6a7', backWidth: 300, backHeight: 84, backFontSize: 32},
    gymScreen: { titleY: 28, titleFontSize: 56, top: 112, columns: 1, columnGap: 0, goRight: false, rowWidth: 700, rowHeight: 152, rowGap: 8, padding: 12, iconSize: 64,
      nameFontSize: 28, descFontSize: 24, descGap: 4, descColor: '#b0bec5', pipSize: 16, pipGap: 6, pipColor: 0xffc400, pipEmpty: 0x37474f,
      costGap: 24, costFontSize: 26, costIconSize: 28, shortFontSize: 22, shortColor: '#ff8a80', maxColor: '#ffc400',
      // Zwrot (refundHeight, under Kup with buttonGap between) only on a bought upgrade; gainColor: the "+cost" it floats up.
      buyWidth: 130, buyHeight: 72, buyFontSize: 28, refundHeight: 48, refundFontSize: 24, buttonGap: 8, gainColor: '#9ccc65', popScale: 1.8, popMs: 350, floatPx: 40, floatMs: 900,
      protein: { width: 200, height: 50, fontSize: 28, iconSize: 32 },
      bartekHeight: 120, quoteFontSize: 24, quoteWidth: 460, quoteGap: 16, tail: 14, definitionColor: '#b0bec5', definitionFontSize: 22,
      sectionGap: 20, bottom: 24, goWidth: 400, goHeight: 88, goFontSize: 36,
      // More rows than fit: pages of as many rows as fit, "<  Strona 1/2  >" pagerGap under them (pagerButton px buttons).
      pagerHeight: 64, pagerGap: 10, pagerButton: 96, pagerFontSize: 28},
  },
  // Screen layouts. The values above are portrait; `landscape` overrides the ones that depend on the screen's shape
  // (systems/layout.js merges it in at start and when the player switches in the settings, save.orientation).
  // card.row: cards side by side instead of stacked. gymScreen.columns: upgrade rows in that many columns; goRight: the
  // start button bottom right instead of centered.
  layouts: {
    landscape: {
      game: { width: 1280, height: 720 },
      // Klon Bartek: the title and the price lines above the row of cards (they stand in the middle of the low screen).
      cloneTrees: { titleY: 56, titleFontSize: 44, textFontSize: 18 },
      ui: {
        // Six rows of settings fit the low screen.
        settings: { padding: 16, titleFontSize: 40, labelFontSize: 20, rowHeight: 72, stepButton: 46, backHeight: 56, backFontSize: 26,
          actionHeight: 48, actionFontSize: 20, hintFontSize: 16,
          width: 620 },
        card: { row: true, width: 260, height: 320, gap: 40, nameFontSize: 22, textFontSize: 18, rarityFontSize: 18, hintFontSize: 16, iconSize: 56 },
        title: { bemowoY: 250, survivorsY: 410 },
        bossBar: { y: 76 },
        chest: { titleY: 110 },
        planScreen: { titleY: 60, buttonBottom: 50, lineFontSize: 17 },
        mapScreen: { titleY: 60, textFontSize: 17, buttonBottom: 50, levelY: 70, levelFontSize: 17, arrow: 40, arrowGap: 100 },
        gameOver: { top: 14, gap: 8, fontSize: 18, rowHeight: 25, iconSize: 22, buttonsGap: 34 },
        bets: { width: 820, padding: 16, gap: 8, titleFontSize: 34, textFontSize: 16, nameFontSize: 19, descFontSize: 16, rowHeight: 62,
          stepButton: 44, sumFontSize: 24, backHeight: 48, backFontSize: 22,
          levelWidth: 70, backWidth: 240 },
        inventory: { width: 1220, padding: 16, gap: 8, columns: 4, statColumns: 3, rowHeight: 46, statHeight: 24, iconSize: 36,
          titleFontSize: 34, headFontSize: 19, nameFontSize: 17, textFontSize: 16, backHeight: 52 },
        bestiary: { width: 1220, columns: 2, columnGap: 14, padding: 14, gap: 8, titleFontSize: 34, textFontSize: 16,
          rowHeight: 58, rowGap: 5, iconSize: 44, nameFontSize: 17, descFontSize: 16, backHeight: 50,
          pagerHeight: 50, pagerButton: 70, pagerFontSize: 22, backWidth: 240, backFontSize: 26 },
        daily: { count: 5 },
        news: { itemGap: 10 },
        leaderboard: { width: 900, count: 10, padding: 14, gap: 6, titleFontSize: 34, rowHeight: 34, fontSize: 18, detailFontSize: 16, textFontSize: 16,
          backHeight: 50, backFontSize: 22,
          backWidth: 280 },
        stats: { width: 1000, columns: 2, columnGap: 24, padding: 16, gap: 10, titleFontSize: 34, rowHeight: 36, fontSize: 17, backHeight: 52,
          backWidth: 240, backFontSize: 26 },
        challenges: { width: 1220, columns: 2, columnGap: 14, padding: 16, gap: 8, titleFontSize: 34, textFontSize: 16,
          rowHeight: 64, rowGap: 6, iconSize: 40, nameFontSize: 18, descFontSize: 16, backHeight: 52,
          backWidth: 240, backFontSize: 26, pagerHeight: 50, pagerButton: 70, pagerFontSize: 22 },
        account: { width: 620, gap: 14, titleFontSize: 42, textFontSize: 21, smallFontSize: 18, buttonHeight: 56, buttonFontSize: 22, inputWidth: 380, inputHeight: 52, inputFontSize: 24 },
        menu: { titleY: 24, titleFontSize: 52, top: 190, columnX: 0.72, width: 440, gap: 12, goHeight: 80, goFontSize: 36, height: 60,
          smallHeight: 54, quoteSide: true, quoteLeft: 60, bartekHeight: 150,
          fontSize: 28, betsFontSize: 22, dailyFontSize: 22, smallFontSize: 22, iconSize: 32, iconPad: 14 },
        gymScreen: { titleY: 22, columns: 2, columnGap: 16, goRight: true, rowWidth: 600, sectionGap: 20,
          bottom: 16, goWidth: 260, goHeight: 64, goFontSize: 30, top: 96, rowHeight: 126, rowGap: 8, bartekHeight: 90,
          descFontSize: 17, shortFontSize: 16, quoteFontSize: 20, definitionFontSize: 18,
          iconSize: 56, nameFontSize: 24, costFontSize: 22, costIconSize: 24, buyWidth: 140, buyHeight: 50, buyFontSize: 22, refundHeight: 40, refundFontSize: 18, buttonGap: 6, pagerHeight: 50, pagerButton: 70, pagerFontSize: 22, pagerGap: 12 },
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
    critHit: { layers: [ // a critical hit, played on top of the weapon's own hit effect
      { particles: { texture: 'fx_spark', count: 10, speed: [120, 300], lifeMs: 300, scale: [1.3, 0], tint: [0xffd54f, 0xff6f00], add: true } },
      { image: { texture: 'fx_ring', scale: [0.3, 1.6], alpha: [0.9, 0], ms: 200, tint: 0xffc400, add: true } }] },
    heavyHit: { minGapMs: 30, layers: [ // a hit worth half the enemy's max HP or more
      { particles: { texture: 'fx_spark', count: 9, speed: [150, 340], lifeMs: 260, scale: [1.4, 0], tint: [0xffffff, 0xffe082, 0xff8f00], add: true } },
      { image: { texture: 'fx_dot', scale: [3, 0.4], alpha: [1, 0], ms: 130, tint: 0xfff3b0, add: true } }] },
    // Splats left on the street by some enemies (enemies.js deathVfx), lying under everyone and fading.
    splatGreen: { layers: [
      { particles: { texture: 'fx_blob', count: 1, speed: [0, 0], lifeMs: 1800, scale: [1, 1.15], alpha: [0.85, 0], tint: [0x689f38, 0x7cb342], spin: 180, depth: -0.4 } }] },
    splatPurple: { layers: [
      { particles: { texture: 'fx_blob', count: 1, speed: [0, 0], lifeMs: 1800, scale: [1.2, 1.35], alpha: [0.85, 0], tint: [0x7b1fa2, 0x43a047], spin: 180, depth: -0.4 } }] },
    levelUp: { layers: [ // a level up, played in LevelUpScene over the cards, where Bartek is on screen
      { image: { texture: 'fx_rays', scale: [0.3, 2.4], alpha: [1, 0], ms: 700, tint: 0x40c4ff, add: true, spinDeg: 60 } },
      { image: { texture: 'fx_ring', scale: [0.3, 3], alpha: [1, 0], ms: 500, tint: 0xffffff, add: true } },
      { particles: { texture: 'fx_star', count: 12, speed: [120, 260], lifeMs: 700, scale: [0.8, 0], tint: [0x40c4ff, 0xffffff], spin: 180 } }] },
    maxHpUp: { layers: [ // Gainer, Plaster: max HP up and a heal
      { image: { texture: 'fx_ring', scale: [0.4, 2], alpha: [0.9, 0], ms: 450, tint: 0xff5252 } },
      { particles: { texture: 'fx_plus', count: 10, speed: [30, 90], angle: -90, spread: 140, gravityY: -120, lifeMs: 800, scale: [1, 0.3], tint: [0xff5252, 0x69f0ae] } }] },
    tankDust: { minGapMs: 40, layers: [ // dust from the tank's tracks, thrown backwards
      { particles: { texture: 'fx_puff', count: 2, speed: [20, 60], spread: 50, lifeMs: 500, scale: [0.5, 1.3], alpha: [0.6, 0], tint: [0xbcaaa4, 0x8d6e63], depth: 0.5 } }] },
    tankBubble: { layers: [ // the tank ends: a bubble for the short invulnerability
      { image: { texture: 'fx_ring', scale: [1.4, 2.2], alpha: [0.9, 0], ms: 500, tint: 0x81d4fa, add: true } },
      { particles: { texture: 'fx_dot', count: 10, speed: [60, 140], lifeMs: 400, scale: [0.8, 0], tint: [0xe1f5fe, 0x81d4fa], add: true } }] },
    klapaClang: { layers: [ // a klapa hits Bartek: metal sparks
      { particles: { texture: 'fx_spark', count: 14, speed: [160, 380], lifeMs: 300, scale: [1.2, 0], tint: [0xffffff, 0xb0bec5, 0xffb300], add: true } },
      { image: { texture: 'fx_star', scale: [2.2, 0.3], alpha: [1, 0], ms: 180, add: true, spinDeg: 60 } }] },
    smokePuff: { layers: [ // Mały B: Bartek shrinks and grows back in a puff
      { particles: { texture: 'fx_puff', count: 14, speed: [40, 130], lifeMs: 600, scale: [0.8, 2], alpha: [0.8, 0], tint: [0xeeeeee, 0xbdbdbd, 0xce93d8] } },
      { particles: { texture: 'fx_star', count: 6, speed: [80, 160], lifeMs: 450, scale: [0.6, 0], tint: 0xffffff, spin: 180 } }] },
    squatStars: { layers: [ // Zombie robią przysiady: stars circling over a head
      { image: { texture: 'fx_dizzy', scale: [1, 1], alpha: [1, 0], ms: 600, tint: 0xffeb3b, spinDeg: 360, ease: 'Linear' } }] },
    moonwalkTrail: { layers: [ // Moonwalk: streaks left behind a walker going backwards (angle: toward Bartek)
      { image: { texture: 'fx_streak', origin: [0, 0.5], scale: [1.6, 0.8], alpha: [0.9, 0], ms: 400, tint: 0xd1c4e9, add: true } }] },
    evolution: { layers: [ // a weapon evolves: a big gold flash on Bartek
      { image: { texture: 'fx_rays', scale: [0.5, 5], alpha: [1, 0], ms: 1100, tint: 0xffc400, add: true, spinDeg: 90 } },
      { image: { texture: 'fx_ring', scale: [0.3, 7], alpha: [1, 0], ms: 800, tint: 0xffffff, add: true } },
      { particles: { texture: 'fx_star', count: 24, speed: [150, 380], lifeMs: 900, scale: [1, 0], tint: [0xffc400, 0xffffff, 0xff6d00], spin: 180 } }] },
    eliteSpawn: { layers: [ // an elite appears: a purple ring pulling in, sparks out
      { image: { texture: 'fx_ring', scale: [4, 1], alpha: [0, 1], ms: 450, tint: 0xe040fb, add: true, ease: 'Cubic.easeIn' } },
      { particles: { texture: 'fx_spark', count: 10, speed: [80, 200], lifeMs: 500, scale: [1, 0], tint: [0xe040fb, 0xffffff], add: true } }] },
    eventStart: { layers: [ // a round event starts: a wave from Bartek over the screen
      { image: { texture: 'fx_ring', scale: [0.5, 14], alpha: [0.9, 0], ms: 900, tint: 0xffc400 } },
      { image: { texture: 'fx_rays', scale: [0.4, 3], alpha: [0.8, 0], ms: 700, tint: 0xffe082, add: true, spinDeg: 45 } }] },
    firework: { layers: [ // a won run's end screen
      { particles: { texture: 'fx_dot', count: 28, speed: [120, 260], gravityY: 140, lifeMs: 1100, scale: [1, 0], tint: [0xff5252, 0xffeb3b, 0x40c4ff, 0x69f0ae, 0xe040fb, 0xffffff], add: true, depth: -1 } },
      { image: { texture: 'fx_ring', scale: [0.2, 2.5], alpha: [1, 0], ms: 400, tint: 0xffffff, add: true, depth: -1 } }] },
    deathPoof: { layers: [ // enemy dies: grey puffs and green bits falling
      { particles: { texture: 'fx_puff', count: 7, speed: [25, 80], lifeMs: 450, scale: [0.5, 1.2], alpha: [0.7, 0], tint: [0xbdbdbd, 0x9e9e9e] } },
      { particles: { texture: 'fx_dot', count: 6, speed: [80, 180], lifeMs: 420, scale: [0.9, 0], tint: [0x9ccc65, 0x689f38], gravityY: 350 } }] },
    bossBoom: { layers: [ // a boss dies
      { image: { texture: 'fx_rays', scale: [0.5, 3.5], alpha: [1, 0], ms: 800, tint: 0xffc400, add: true, spinDeg: 45 } },
      { image: { texture: 'fx_ring', scale: [0.3, 5], alpha: [1, 0], ms: 650, tint: 0xff6d00 } },
      { particles: { texture: 'fx_puff', count: 24, speed: [80, 300], lifeMs: 900, scale: [1, 2.5], alpha: [0.9, 0], tint: [0xff6d00, 0xffc400, 0x424242] } },
      { particles: { texture: 'fx_spark', count: 20, speed: [200, 500], lifeMs: 600, scale: [1.2, 0], tint: 0xffe082, add: true } }] },
    barrelBreak: { layers: [ // the Big Goblin's barrel breaks: wood bits and dust
      { particles: { texture: 'fx_spark', count: 10, speed: [120, 280], lifeMs: 450, scale: [1.1, 0.4], tint: [0x8d6e63, 0x5d4037], gravityY: 400 } },
      { particles: { texture: 'fx_puff', count: 5, speed: [20, 70], lifeMs: 500, scale: [0.6, 1.4], alpha: [0.6, 0], tint: [0xbcaaa4, 0x8d6e63] } }] },
    stompWave: { layers: [ // the Big Sportakus stomps: a dusty ring going out
      { image: { texture: 'fx_ring', scale: [0.5, 8], alpha: [0.9, 0], ms: 450, tint: 0xffab40 } },
      { particles: { texture: 'fx_puff', count: 10, speed: [150, 260], lifeMs: 450, scale: [0.6, 1.2], alpha: [0.6, 0], tint: [0xd7ccc8, 0xa1887f] } }] },
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
    portalGlow: { layers: [ // the stage portal: a violet light ring going out
      { image: { texture: 'fx_ring', scale: [0.8, 3.4], alpha: [0.8, 0], ms: 700, tint: 0xd500f9 } }] },
    shopGlow: { layers: [ // the Żabka shop: a green light ring going out
      { image: { texture: 'fx_ring', scale: [0.8, 3.2], alpha: [0.8, 0], ms: 800, tint: 0x76ff03 } }] },
    pigeonHit: { layers: [ // a pigeon takes out an enemy: grey feathers
      { particles: { texture: 'fx_leaf', count: 6, speed: [60, 160], lifeMs: 600, scale: [1, 0.5], tint: [0xeceff1, 0x90a4ae], gravityY: 200, spin: 360 } }] },
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
    lightningHit: { minGapMs: 40, layers: [ // a Kostur Czarogeja bolt lands
      { particles: { texture: 'fx_spark', count: 7, speed: [100, 260], lifeMs: 220, scale: [1, 0], tint: [0x80d8ff, 0xffffff], add: true } },
      { image: { texture: 'fx_dot', scale: [3, 0], alpha: [1, 0], ms: 160, tint: 0xb3e5fc, add: true } }] },
    laserHit: { minGapMs: 40, layers: [ // the eye laser burns an enemy
      { particles: { texture: 'fx_spark', count: 5, speed: [80, 200], lifeMs: 200, scale: [1, 0], tint: [0xff1744, 0xffffff], add: true } },
      { image: { texture: 'fx_dot', scale: [2.2, 0], alpha: [1, 0], ms: 140, tint: 0xff8a80, add: true } }] },
    // Pistol shot, played at the barrel tip turned at the target; the shell is played with angle +-30 (away from the aim).
    muzzleFlash: { layers: [
      { image: { texture: 'fx_flash', origin: [0, 0.5], scale: [1, 0.6], alpha: [1, 0], ms: 80, ease: 'Linear' } },
      { particles: { texture: 'fx_dot', count: 3, speed: [80, 200], spread: 30, lifeMs: 120, scale: [0.6, 0], tint: 0xffe082, add: true } }] },
    // A leaf drifting over the estate (systems/map.js plays it now and then), lying low over the ground.
    ambientLeaf: { layers: [
      { particles: { texture: 'fx_leaf', count: 1, speed: [15, 35], angle: 20, spread: 60, lifeMs: 4000, scale: [1, 0.8], alpha: [0.9, 0],
        tint: [0x8bc34a, 0xcddc39, 0xff9800, 0xa1887f], spin: 90, depth: -0.4 } }] },
    shell: { layers: [
      { particles: { texture: 'fx_shell', count: 1, speed: [70, 120], angle: -90, spread: 30, gravityY: 600, lifeMs: 450, scale: [1, 1],
        alpha: [1, 0], tint: 0xffffff, spin: 180, depth: 0.5 } }] }, // depth: under Bartek (layers default to 1.6, over him)
  },
  // Texture sizes in px. Images: `height` is the on-screen height, width follows the image, bodyRadius is on-screen too.
  textures: {
    // Every Bartek picture is in assets/bartki (BootScene loads each entry with `bartki: true` under its key).
    bartek: { file: './assets/bartki/bartek.png', bartki: true, height: 80 },
    // Enemies are Bartek variants; a bigger one is a stronger one.
    zombie: { file: './assets/bartki/zombie.png', bartki: true, height: 56, bodyRadius: 22 },
    uncanny: { file: './assets/bartki/uncanny.png', bartki: true, height: 50, bodyRadius: 18 },
    joker: { file: './assets/bartki/joker.png', bartki: true, height: 64, bodyRadius: 24 },
    homelander: { file: './assets/bartki/homelander.png', bartki: true, height: 72, bodyRadius: 27 },
    // Cut out of the original photos (assets/bartki/zrodla, not loaded); a better cut can simply replace these files.
    goblin: { file: './assets/bartki/goblin.png', bartki: true, height: 52, bodyRadius: 19 },
    sportakus: { file: './assets/bartki/sportakus.png', bartki: true, height: 66, bodyRadius: 24 },
    // Fort Bema's Barteks (assets/bartki/fort-bema): the map's walkers in place of the Jelonki ones (maps.js looks), same sizes.
    bartcraft: { file: './assets/bartki/fort-bema/bartcraft.png', bartki: true, height: 66, bodyRadius: 24 },
    binion: { file: './assets/bartki/fort-bema/binion.png', bartki: true, height: 56, bodyRadius: 22 },
    gnom: { file: './assets/bartki/fort-bema/gnom.png', bartki: true, height: 52, bodyRadius: 19 },
    kapitanBemowo: { file: './assets/bartki/fort-bema/kapitan-bemowo.png', bartki: true, height: 72, bodyRadius: 27 },
    klockowyB: { file: './assets/bartki/fort-bema/klockowy-b.png', bartki: true, height: 64, bodyRadius: 24 },
    purpleBuy: { file: './assets/bartki/fort-bema/purple-buy.png', bartki: true, height: 50, bodyRadius: 18 },
    // Żabka shop (event): a white wall, a striped green awning, a door and two windows.
    portal: { size: 84, rings: [0x4a148c, 0x8e24aa, 0xce93d8, 0x12002a], border: 0x000000 }, // outer to inner
    zabkaShop: { width: 88, height: 74, awningHeight: 20, stripes: 6, wall: 0xf5f5f5, awning: 0x2e7d32, stripe: 0xffffff,
      door: 0x1b5e20, window: 0x81d4fa, border: 0x212121 },
    chest: { width: 54, height: 42, lidHeight: 15, color: 0x8d5524, lidColor: 0x6d3f17, bandColor: 0xffc400, bandWidth: 6, lockSize: 12,
      chainColor: 0x90a4ae, padlockColor: 0x9e9e9e },
    klapa: { width: 44, height: 26, color: 0x9a9a9a, borderColor: 0x555555, borderWidth: 4, bodyRadius: 13 },
    bullet: { radius: 3, color: 0xffffff },
    // Bow arrow (drawn), pointing right: a wooden shaft, a steel head, red feathers; the body a circle of bodyRadius in the middle.
    arrow: { length: 42, height: 14, shaft: 0xd7b98e, head: 0xcfd8dc, feather: 0xe53935, bodyRadius: 6 },
    // Bee facing right (it turns along its orbit): striped body, two wings, a stinger at the back.
    bee: { width: 24, height: 20, color: 0xffd400, stripeColor: 0x1b1b1b, wingColor: 0xffffff, wingAlpha: 0.75 },
    pickup: { size: 28, color: 0xffffff, borderColor: 0xffcc00, borderWidth: 3 },
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
    pickupIcons: { size: 36, magnet: 0xd32f2f, magnetTip: 0xcfd8dc, freeze: 0x81d4fa, freezeLine: 0xffffff,
      preworkout: 0x8e24aa, preworkoutCap: 0x212121, bubble: 0x4dd0e1, pierogi: 0xf3e0b5, pierogiLine: 0xc8a96a, rollerBoot: 0xe53935, rollerWheel: 0xffeb3b },
    // Effect shapes (systems/vfx.js), radius in px (flash: width and height, shell: height, twice as long).
    fx: { blob: 14, streak: 16, dizzy: 16, leaf: 6, dot: 4, spark: 8, puff: 12, ring: 32, ringWidth: 4, target: 28, star: 10, rays: 64, plus: 6, flake: 8, flash: 28, shell: 3, chevron: 9, ha: 9,
      bolt: 64 }, // bolt: a zigzag down the middle of a bolt*2 square
    // The pistol Bartek holds, drawn pointing right: width x height px, held at grip (fraction of the size).
    gun: { width: 28, height: 15, grip: [0.3, 0.5], slide: 0x455a64, slideLight: 0x90a4ae, frame: 0x263238, handle: 0x6d4c41, handleLight: 0x8d6e63 },
    captainShield: { file: './assets/captain_shield.png' }, // 50x50 pixel art, also the shield's HUD icon
    // 64x64 pixel art, barrel to the right, also the shotgun's HUD icon: drawn at `scale`, held at `grip`, fires from tipX.
    shotgun: { file: './assets/Shotgun.png', scale: 1, grip: [0.34, 0.47], tipX: 0.92 },
    // The dwarf's axe (drawn): a handle and a double blade with light edges; `size` square.
    axe: { size: 36, handle: 0x6d4c41, head: 0x90a4ae, edge: 0xeceff1, outline: 0x263238 },
    // Drawn weapon icons for the HUD, size x size px.
    weaponIcon: { size: 40, color: 0x222222, borderColor: 0xffffff, gunColor: 0xc0c0c0, gripColor: 0x6d4c41,
      gasColors: [0x9ccc65, 0xba68c8, 0x7cb342], laserColor: 0xff1744, eyeColor: 0xffffff,
      staffColor: 0x8d6e63, orbColor: 0x4fc3f7, boltColor: 0xfff176, stormColor: 0x546e7a, bowColor: 0xa1887f, stringColor: 0xeeeeee, necroColor: 0x7e57c2, skullColor: 0xeceff1, bladeColor: 0xe0e0e0, hiltColor: 0xc62828,
      // Evolved weapons: a gold frame.
      evoBorder: 0xffc400, uziColor: 0x37474f, smogColors: [0x9e9e9e, 0x757575, 0xbdbdbd], shieldColors: [0xd32f2f, 0xffd54f, 0xfafafa] },
    // Laughing gas cloud, size x size px, shown scaled to its radius: soft green and purple puffs.
    gasCloud: { size: 128, colors: [0x9ccc65, 0xba68c8, 0x7cb342, 0xce93d8], alpha: 0.28, puffs: 9,
      smogColors: [0x9e9e9e, 0x616161, 0xbdbdbd, 0x757575], smogAlpha: 0.38 }, // smog_cloud: the evolved gas, grey and thicker
    tank: { file: './assets/bartki/czolg.png', bartki: true, height: 110, bodyRadius: 45 }, // Bartek in a tank, barrel to the left
    pigeon: { frames: 3, fps: 10, scale: 2, width: 48, height: 40, flipX: true }, // assets/Pigeons/pigeon1..3.png, 24x20 px, facing left; size after scale; flipX turns it to face the flight
  },
};
