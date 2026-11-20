import { config } from '../config.js';
import { createVfxTextures } from '../systems/vfx.js';
import { preloadAudio } from '../systems/audio.js';
import { save } from '../state.js';

export default class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  preload() {
    // Bartek and the Bartek variants that are the enemies.
    for (const key of ['bartek', 'zombie', 'uncanny', 'joker', 'homelander']) this.load.image(key, `./assets/${key}.png`);
    for (const key of ['goblin', 'sportakus']) this.load.image(key, config.textures[key].file);
    this.load.image('tank', './assets/czołg.png');
    this.load.image('captain_shield', config.textures.captainShield.file);
    // May be missing: the OLX card falls back to the first pigeon frame.
    this.load.image('golab', config.pickups.olx.photo);
    for (let i = 1; i <= config.textures.pigeon.frames; i++) this.load.image(`pigeon${i}`, `./assets/Pigeons/pigeon${i}.png`);
    preloadAudio(this);
  }

  create() {
    const t = config.textures;
    const pixel = (key) => this.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);

    const pigeonFrames = [];
    for (let i = 1; i <= t.pigeon.frames; i++) {
      pixel(`pigeon${i}`);
      pigeonFrames.push({ key: `pigeon${i}` });
    }
    this.anims.create({ key: 'pigeonFly', frames: pigeonFrames, frameRate: t.pigeon.fps, repeat: -1, yoyo: true });
    pixel('captain_shield');
    createVfxTextures(this);

    const g = this.add.graphics();

    // XP gems: a faceted polygon (or a cut gem) with an inner face and a sparkle.
    const gs = config.xp.gemSize, gc = gs / 2;
    for (const [kind, k] of Object.entries(config.xp.gems)) {
      const outer = k.cut
        ? [[0.25, 0.12], [0.75, 0.12], [0.98, 0.4], [0.5, 0.98], [0.02, 0.4]].map(([px, py]) => ({ x: px * gs, y: py * gs }))
        : Array.from({ length: k.sides }, (_, i) => {
          const a = (i / k.sides) * Math.PI * 2 - Math.PI / 2;
          return { x: gc + Math.cos(a) * (gc - 1) / k.stretch, y: gc + Math.sin(a) * (gc - 1) };
        });
      const inner = outer.map((p) => ({ x: gc + (p.x - gc) * 0.5, y: gc + (p.y - gc) * 0.5 - (k.cut ? gs * 0.08 : 0) }));
      g.fillStyle(k.color).fillPoints(outer, true);
      g.lineStyle(1, k.dark, 0.8);
      outer.forEach((p, i) => g.lineBetween(p.x, p.y, inner[i].x, inner[i].y)); // facets from each corner to the inner face
      g.fillStyle(k.light, 0.85).fillPoints(inner, true);
      g.lineStyle(1.5, k.dark).strokePoints(outer, true);
      g.fillStyle(0xffffff).fillRect(gs * 0.3, gs * 0.22, 2, 2).fillRect(gs * 0.3 - 2, gs * 0.22 + 0.5, 6, 1).fillRect(gs * 0.3 + 0.5, gs * 0.22 - 2, 1, 6);
      g.generateTexture(`gem_${kind}`, gs, gs).clear();
    }

    // Protein coins: a dark rim, the face with a shine, a dumbbell in the middle.
    const cs = config.coins.size, cc = cs / 2;
    for (const [kind, k] of Object.entries(config.coins.kinds)) {
      g.fillStyle(k.dark).fillCircle(cc, cc, cc);
      g.fillStyle(k.color).fillCircle(cc, cc, cc - 2);
      g.lineStyle(1, k.light, 0.9).beginPath().arc(cc, cc, cc - 3.5, Math.PI * 1.05, Math.PI * 1.55).strokePath();
      g.fillStyle(k.dark).fillRect(cc - cs * 0.25, cc - 1, cs * 0.5, 2) // bar
        .fillRect(cc - cs * 0.3, cc - cs * 0.18, cs * 0.1, cs * 0.36).fillRect(cc + cs * 0.2, cc - cs * 0.18, cs * 0.1, cs * 0.36); // plates
      g.generateTexture(`coin_${kind}`, cs, cs).clear();
    }

    // The pistol Bartek holds, barrel to the right: slide, frame, grip with a trigger guard.
    const gn = t.gun, gw = gn.width, gh = gn.height;
    g.fillStyle(gn.slide).fillRect(gw * 0.2, 0, gw * 0.8, gh * 0.4);
    g.fillStyle(gn.slideLight).fillRect(gw * 0.2, 0, gw * 0.8, 2);
    g.fillStyle(gn.frame).fillRect(gw * 0.93, gh * 0.08, gw * 0.07, gh * 0.24) // muzzle
      .fillRect(gw * 0.2, gh * 0.4, gw * 0.55, gh * 0.12);
    for (let i = 0; i < 3; i++) g.fillRect(gw * (0.25 + i * 0.07), gh * 0.06, 1, gh * 0.28); // slide grooves
    g.fillStyle(gn.handle).fillPoints([{ x: gw * 0.2, y: gh * 0.5 }, { x: gw * 0.44, y: gh * 0.5 }, { x: gw * 0.36, y: gh }, { x: gw * 0.08, y: gh }], true);
    g.fillStyle(gn.handleLight).fillRect(gw * 0.2, gh * 0.62, gw * 0.12, 1).fillRect(gw * 0.17, gh * 0.78, gw * 0.12, 1);
    g.lineStyle(1.5, gn.frame).strokeCircle(gw * 0.52, gh * 0.6, gh * 0.16); // trigger guard
    g.generateTexture('gun_pistol', gw, gh).clear();

    const b = t.bullet;
    g.fillStyle(b.color).fillCircle(b.radius, b.radius, b.radius);
    g.generateTexture('bullet', b.radius * 2, b.radius * 2).clear();

    // Bee facing right: wings on top, a striped body, a stinger at the back, an eye at the front.
    const bee = t.bee, bw = bee.width, bh = bee.height;
    g.fillStyle(bee.wingColor, bee.wingAlpha).fillEllipse(bw * 0.42, bh * 0.28, bw * 0.34, bh * 0.4).fillEllipse(bw * 0.6, bh * 0.24, bw * 0.3, bh * 0.36);
    g.fillStyle(bee.stripeColor).fillTriangle(0, bh * 0.62, bw * 0.16, bh * 0.5, bw * 0.16, bh * 0.74); // stinger
    g.fillStyle(bee.color).fillEllipse(bw * 0.52, bh * 0.62, bw * 0.76, bh * 0.6);
    g.fillStyle(bee.stripeColor).fillRect(bw * 0.34, bh * 0.36, bw * 0.09, bh * 0.52).fillRect(bw * 0.52, bh * 0.34, bw * 0.09, bh * 0.56);
    g.fillCircle(bw * 0.8, bh * 0.56, bh * 0.06);
    g.lineStyle(1, bee.stripeColor, 0.8).strokeEllipse(bw * 0.52, bh * 0.62, bw * 0.76, bh * 0.6);
    g.generateTexture('bee', bw, bh).clear();

    const gr = t.ground;
    g.fillStyle(gr.color).fillRect(0, 0, gr.size, gr.size);
    g.lineStyle(gr.lineWidth, gr.lineColor).strokeRect(0, 0, gr.size, gr.size);
    g.generateTexture('ground', gr.size, gr.size).clear();

    const kl = t.klapa;
    g.fillStyle(kl.color).fillRect(0, 0, kl.width, kl.height);
    g.lineStyle(kl.borderWidth, kl.borderColor).strokeRect(0, 0, kl.width, kl.height);
    g.generateTexture('klapa', kl.width, kl.height).clear();

    // Boss chest: a box, a darker lid, a gold band down the middle and a lock.
    const ch = t.chest;
    g.fillStyle(ch.color).fillRect(0, ch.lidHeight, ch.width, ch.height - ch.lidHeight);
    g.fillStyle(ch.lidColor).fillRect(0, 0, ch.width, ch.lidHeight);
    g.fillStyle(ch.bandColor).fillRect((ch.width - ch.bandWidth) / 2, 0, ch.bandWidth, ch.height);
    g.fillRect(0, ch.lidHeight - ch.bandWidth / 2, ch.width, ch.bandWidth);
    g.fillStyle(ch.lidColor).fillRect((ch.width - ch.lockSize) / 2, ch.lidHeight - ch.lockSize / 2, ch.lockSize, ch.lockSize);
    g.generateTexture('chest', ch.width, ch.height).clear();

    // Weapon icon: pistol (a barrel and a grip on a framed square).
    const wi = t.weaponIcon, ws = wi.size;
    g.fillStyle(wi.color).fillRect(0, 0, ws, ws).lineStyle(2, wi.borderColor).strokeRect(1, 1, ws - 2, ws - 2);
    g.fillStyle(wi.gunColor).fillRect(ws * 0.18, ws * 0.3, ws * 0.64, ws * 0.16);
    g.fillStyle(wi.gripColor).fillRect(ws * 0.22, ws * 0.44, ws * 0.17, ws * 0.32);
    g.generateTexture('weapon_pistol', ws, ws).clear();

    const pk = t.pickup;
    g.fillStyle(pk.color).fillRect(0, 0, pk.size, pk.size);
    g.lineStyle(pk.borderWidth, pk.borderColor).strokeRect(0, 0, pk.size, pk.size);
    g.generateTexture('pickup', pk.size, pk.size).clear();

    // Auras: a bubble (translucent ball with a shine) and a rage ring (spikes, red at the base, yellow at the tip).
    const ab = t.auras.bubble, bubD = (ab.radius + ab.lineWidth) * 2, bubC = bubD / 2;
    g.fillStyle(ab.color, ab.fillAlpha).fillCircle(bubC, bubC, ab.radius);
    g.lineStyle(ab.lineWidth, ab.color).strokeCircle(bubC, bubC, ab.radius);
    g.lineStyle(ab.lineWidth, 0xffffff, 0.7).beginPath().arc(bubC, bubC, ab.radius * 0.8, Math.PI * 1.1, Math.PI * 1.4).strokePath();
    g.generateTexture('aura_bubble', bubD, bubD).clear();
    // Pre-workout: a soft glow (stacked circles, stronger in the middle) and a bright ring.
    const ar = t.auras.rage, rd = ar.radius * 2;
    for (let i = 5; i >= 1; i--) g.fillStyle(ar.color, ar.glowAlpha).fillCircle(ar.radius, ar.radius, (ar.radius * i) / 5);
    g.lineStyle(ar.ringWidth, ar.ringColor, 0.9).strokeCircle(ar.radius, ar.radius, ar.ringRadius);
    g.lineStyle(ar.ringWidth * 2, ar.color, 0.25).strokeCircle(ar.radius, ar.radius, ar.ringRadius + ar.ringWidth);
    g.generateTexture('aura_rage', rd, rd).clear();

    // Timed pickup icons. Shapes are proportions of the icon size.
    const ic = t.pickupIcons, s = ic.size, c = s / 2;
    g.lineStyle(s * 0.22, ic.magnet).beginPath().arc(c, c * 0.9, s * 0.3, 0, Math.PI).strokePath(); // magnet: red U
    g.fillStyle(ic.magnet).fillRect(c - s * 0.41, s * 0.12, s * 0.22, s * 0.33).fillRect(c + s * 0.19, s * 0.12, s * 0.22, s * 0.33);
    g.fillStyle(ic.magnetTip).fillRect(c - s * 0.41, s * 0.05, s * 0.22, s * 0.12).fillRect(c + s * 0.19, s * 0.05, s * 0.22, s * 0.12);
    g.generateTexture('pickup_magnet', s, s).clear();
    g.fillStyle(ic.freeze).fillCircle(c, c, c); // freeze: ice ball with a snowflake
    g.lineStyle(2, ic.freezeLine);
    for (let i = 0; i < 3; i++) {
      const a = (i * Math.PI) / 3, dx = Math.cos(a) * c * 0.75, dy = Math.sin(a) * c * 0.75;
      g.lineBetween(c - dx, c - dy, c + dx, c + dy);
    }
    g.generateTexture('pickup_freeze', s, s).clear();
    g.fillStyle(ic.preworkout).fillRect(s * 0.25, s * 0.25, s * 0.5, s * 0.72); // pre-workout: a shaker
    g.fillStyle(ic.preworkoutCap).fillRect(s * 0.2, s * 0.05, s * 0.6, s * 0.22);
    g.generateTexture('pickup_preworkout', s, s).clear();
    g.fillStyle(ic.bubble, 0.35).fillCircle(c, c, c - 1); // bubble
    g.lineStyle(3, ic.bubble).strokeCircle(c, c, c - 2);
    g.fillStyle(0xffffff, 0.8).fillCircle(c * 0.65, c * 0.65, s * 0.08);
    g.generateTexture('pickup_bubble', s, s).clear();
    g.fillStyle(ic.pierogi).slice(c, s * 0.7, c * 0.95, Math.PI, 0, false).fillPath(); // pierogi: half moon, crimped edge
    g.lineStyle(2, ic.pierogiLine).beginPath().arc(c, s * 0.7, c * 0.95, Math.PI, 0, false).strokePath();
    g.generateTexture('pickup_pierogi', s, s).clear();

    this.drawIcons(g);
    g.destroy();

    this.sound.mute = save.muted;
    this.scene.start('TitleScene');
  }

  // UI icons: HUD (heart, skull, clock) and the gym upgrades (gym_<id>). Shapes are proportions of the icon size.
  drawIcons(g) {
    const ic = config.ui.icons, s = ic.size, c = s / 2;
    const heart = (color, light) => {
      g.fillStyle(color).fillCircle(s * 0.31, s * 0.37, s * 0.21).fillCircle(s * 0.69, s * 0.37, s * 0.21);
      g.fillTriangle(s * 0.11, s * 0.45, s * 0.89, s * 0.45, c, s * 0.9);
      g.fillStyle(light).fillCircle(s * 0.28, s * 0.32, s * 0.07);
    };
    const clock = (ring) => {
      g.fillStyle(ic.clockDark).fillRect(c - s * 0.08, s * 0.04, s * 0.16, s * 0.12); // crown
      g.fillStyle(ring).fillCircle(c, s * 0.56, s * 0.4);
      g.fillStyle(ic.clock).fillCircle(c, s * 0.56, s * 0.32);
      g.lineStyle(s * 0.07, ic.clockDark).lineBetween(c, s * 0.56, c, s * 0.32).lineBetween(c, s * 0.56, c + s * 0.17, s * 0.56);
    };

    heart(ic.heart, ic.heartLight);
    g.generateTexture('icon_heart', s, s).clear();

    g.fillStyle(ic.skull).fillCircle(c, s * 0.42, s * 0.36).fillRoundedRect(s * 0.3, s * 0.55, s * 0.4, s * 0.3, s * 0.06);
    g.fillStyle(ic.skullDark).fillCircle(s * 0.36, s * 0.45, s * 0.1).fillCircle(s * 0.64, s * 0.45, s * 0.1)
      .fillTriangle(c, s * 0.56, c - s * 0.05, s * 0.65, c + s * 0.05, s * 0.65);
    g.lineStyle(s * 0.04, ic.skullDark).lineBetween(s * 0.42, s * 0.72, s * 0.42, s * 0.85).lineBetween(s * 0.58, s * 0.72, s * 0.58, s * 0.85);
    g.generateTexture('icon_skull', s, s).clear();

    clock(ic.clockDark);
    g.generateTexture('icon_clock', s, s).clear();

    // Klata: a dumbbell.
    g.fillStyle(ic.metal).fillRect(s * 0.15, c - s * 0.05, s * 0.7, s * 0.1);
    g.fillStyle(ic.metalDark).fillRoundedRect(s * 0.1, s * 0.25, s * 0.12, s * 0.5, s * 0.03).fillRoundedRect(s * 0.78, s * 0.25, s * 0.12, s * 0.5, s * 0.03);
    g.fillStyle(ic.metalDark).fillRoundedRect(s * 0.2, s * 0.32, s * 0.08, s * 0.36, s * 0.03).fillRoundedRect(s * 0.72, s * 0.32, s * 0.08, s * 0.36, s * 0.03);
    g.fillStyle(0xffffff, 0.35).fillRect(s * 0.12, s * 0.28, s * 0.03, s * 0.44).fillRect(s * 0.8, s * 0.28, s * 0.03, s * 0.44);
    g.generateTexture('gym_chest', s, s).clear();

    // Nogi: a running shoe with speed lines.
    g.fillStyle(ic.heart).fillPoints([{ x: s * 0.22, y: s * 0.3 }, { x: s * 0.48, y: s * 0.3 }, { x: s * 0.58, y: s * 0.48 },
      { x: s * 0.9, y: s * 0.56 }, { x: s * 0.92, y: s * 0.7 }, { x: s * 0.22, y: s * 0.7 }], true);
    g.fillStyle(0xffffff).fillRoundedRect(s * 0.18, s * 0.68, s * 0.78, s * 0.12, s * 0.04);
    g.lineStyle(s * 0.04, 0xffffff).lineBetween(s * 0.42, s * 0.42, s * 0.52, s * 0.4).lineBetween(s * 0.45, s * 0.5, s * 0.56, s * 0.48);
    g.lineStyle(s * 0.05, ic.metal).lineBetween(s * 0.02, s * 0.42, s * 0.14, s * 0.42).lineBetween(0, s * 0.55, s * 0.16, s * 0.55)
      .lineBetween(s * 0.04, s * 0.68, s * 0.14, s * 0.68);
    g.generateTexture('gym_legs', s, s).clear();

    // Plecy: a heart with a plus (more max HP).
    heart(ic.heart, ic.heartLight);
    g.fillStyle(0xffffff).fillRect(c - s * 0.05, s * 0.32, s * 0.1, s * 0.32).fillRect(c - s * 0.16, s * 0.43, s * 0.32, s * 0.1);
    g.generateTexture('gym_back', s, s).clear();

    // Okulary: two lenses on a bridge.
    g.fillStyle(0x81d4fa, 0.45).fillCircle(s * 0.28, c, s * 0.18).fillCircle(s * 0.72, c, s * 0.18);
    g.lineStyle(s * 0.07, ic.metalDark).strokeCircle(s * 0.28, c, s * 0.18).strokeCircle(s * 0.72, c, s * 0.18)
      .lineBetween(s * 0.44, c - s * 0.04, s * 0.56, c - s * 0.04).lineBetween(s * 0.1, c - s * 0.06, s * 0.02, c - s * 0.14)
      .lineBetween(s * 0.9, c - s * 0.06, s * 0.98, c - s * 0.14);
    g.fillStyle(0xffffff, 0.8).fillCircle(s * 0.22, c - s * 0.06, s * 0.04).fillCircle(s * 0.66, c - s * 0.06, s * 0.04);
    g.generateTexture('gym_glasses', s, s).clear();

    // Rozgrzewka: a stopwatch.
    clock(ic.accent);
    g.generateTexture('gym_warmup', s, s).clear();
  }
}
