import { config } from '../config.js';
import { createVfxTextures } from '../systems/vfx.js';
import { createMapTextures } from '../systems/map.js';
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
    this.load.image('shotgun', config.textures.shotgun.file);
    // May be missing: the OLX card falls back to the first pigeon frame.
    this.load.image('golab', config.pickups.olx.photo);
    for (let i = 1; i <= config.textures.pigeon.frames; i++) this.load.image(`pigeon${i}`, `./assets/Pigeons/pigeon${i}.png`);
    this.load.font(config.ui.fontKey, config.ui.fontFile, 'truetype'); // ready before any scene makes text
    preloadAudio(this);
    // The page's loading screen (index.html): its bar follows the files, and it goes once they are all in.
    const fill = document.querySelector('#loading .fill');
    this.load.on('progress', (p) => { if (fill) fill.style.width = `${Math.round(p * 100)}%`; });
    this.load.once('complete', () => document.getElementById('loading')?.remove());
  }

  // Enemy pictures and drawn chests and pickups (config.look.outline) get a dark edge so they show on grass: the texture
  // is redrawn under the same key, bigger by p px all round, over its silhouette stamped in a disc of radius p. For a
  // picture p is in picture px, so it comes out about spriteWidth px on screen at the sprite's config height.
  outlineSprites() {
    const ol = config.look.outline;
    for (const key of [...ol.sprites, ...ol.shapes]) {
      const src = this.textures.get(key).getSourceImage();
      const p = Math.ceil(ol.sprites.includes(key) ? ol.spriteWidth * src.height / config.textures[key].height : ol.shapeWidth);
      const w = src.width + p * 2, h = src.height + p * 2;
      const sil = document.createElement('canvas');
      sil.width = w;
      sil.height = h;
      const sc = sil.getContext('2d');
      sc.drawImage(src, p, p);
      sc.globalCompositeOperation = 'source-in';
      sc.fillStyle = `#${ol.color.toString(16).padStart(6, '0')}`;
      sc.fillRect(0, 0, w, h);
      const ring = document.createElement('canvas');
      ring.width = w;
      ring.height = h;
      const rc = ring.getContext('2d');
      for (let dx = -p; dx <= p; dx++) for (let dy = -p; dy <= p; dy++) if (dx * dx + dy * dy <= p * p) rc.drawImage(sil, dx, dy);
      // The silhouette goes under at alpha, the texture on top, before the old texture is removed: a drawn texture's
      // canvas goes back to Phaser's pool with it and comes back blank.
      const out = document.createElement('canvas');
      out.width = w;
      out.height = h;
      const oc = out.getContext('2d');
      oc.globalAlpha = ol.alpha;
      oc.drawImage(ring, 0, 0);
      oc.globalAlpha = 1;
      oc.drawImage(src, p, p);
      this.textures.remove(key);
      this.textures.createCanvas(key, w, h).draw(0, 0, out);
    }
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
    pixel('shotgun');
    createVfxTextures(this);
    createMapTextures(this);

    const g = this.add.graphics();

    // XP gems: a faceted polygon (or a cut gem) with an inner face and a sparkle.
    // A dark outline (config.look.outline) around each, so green gems show on grass: the texture is ow px bigger all round.
    const gs = config.xp.gemSize, gc = gs / 2, ol = config.look.outline, ow = Math.ceil(ol.gemWidth);
    for (const [kind, k] of Object.entries(config.xp.gems)) {
      const outer = k.cut
        ? [[0.25, 0.12], [0.75, 0.12], [0.98, 0.4], [0.5, 0.98], [0.02, 0.4]].map(([px, py]) => ({ x: px * gs, y: py * gs }))
        : Array.from({ length: k.sides }, (_, i) => {
          const a = (i / k.sides) * Math.PI * 2 - Math.PI / 2;
          return { x: gc + Math.cos(a) * (gc - 1) / k.stretch, y: gc + Math.sin(a) * (gc - 1) };
        });
      const inner = outer.map((p) => ({ x: gc + (p.x - gc) * 0.5, y: gc + (p.y - gc) * 0.5 - (k.cut ? gs * 0.08 : 0) }));
      g.save().translateCanvas(ow, ow);
      g.lineStyle(ol.gemWidth * 2, ol.color, ol.alpha).strokePoints(outer, true); // the inner half is covered by the fill
      g.fillStyle(k.color).fillPoints(outer, true);
      g.lineStyle(1, k.dark, 0.8);
      outer.forEach((p, i) => g.lineBetween(p.x, p.y, inner[i].x, inner[i].y)); // facets from each corner to the inner face
      g.fillStyle(k.light, 0.85).fillPoints(inner, true);
      g.lineStyle(1.5, k.dark).strokePoints(outer, true);
      g.fillStyle(0xffffff).fillRect(gs * 0.3, gs * 0.22, 2, 2).fillRect(gs * 0.3 - 2, gs * 0.22 + 0.5, 6, 1).fillRect(gs * 0.3 + 0.5, gs * 0.22 - 2, 1, 6);
      g.restore();
      g.generateTexture(`gem_${kind}`, gs + ow * 2, gs + ow * 2).clear();
    }

    // Protein coins (gold, three sizes): a dark rim, the face with a shine, a dumbbell in the middle.
    const co = config.coins;
    for (const [kind, k] of Object.entries(co.kinds)) {
      const cs = Math.round(co.size * k.scale), cc = cs / 2;
      g.fillStyle(co.dark).fillCircle(cc, cc, cc);
      g.fillStyle(co.color).fillCircle(cc, cc, cc - 2);
      g.lineStyle(1, co.light, 0.9).beginPath().arc(cc, cc, cc - 3.5, Math.PI * 1.05, Math.PI * 1.55).strokePath();
      g.fillStyle(co.dark).fillRect(cc - cs * 0.25, cc - 1, cs * 0.5, 2) // bar
        .fillRect(cc - cs * 0.3, cc - cs * 0.18, cs * 0.1, cs * 0.36).fillRect(cc + cs * 0.2, cc - cs * 0.18, cs * 0.1, cs * 0.36); // plates
      g.generateTexture(`coin_${kind}`, cs, cs).clear();
    }
    // B coin: silver, a B in the middle (a stem and two bowls).
    const cb = co.b, cs = co.size, cc = cs / 2, bl = cs * 0.28; // bl: half the letter height
    g.fillStyle(cb.dark).fillCircle(cc, cc, cc);
    g.fillStyle(cb.color).fillCircle(cc, cc, cc - 2);
    g.lineStyle(1, cb.light, 0.9).beginPath().arc(cc, cc, cc - 3.5, Math.PI * 1.05, Math.PI * 1.55).strokePath();
    g.lineStyle(2, cb.letter).lineBetween(cc - bl * 0.6, cc - bl, cc - bl * 0.6, cc + bl);
    g.beginPath().arc(cc - bl * 0.1, cc - bl / 2, bl / 2, -Math.PI / 2, Math.PI / 2).strokePath();
    g.beginPath().arc(cc, cc + bl / 2, bl / 2, -Math.PI / 2, Math.PI / 2).strokePath();
    g.lineBetween(cc - bl * 0.6, cc - bl, cc - bl * 0.1, cc - bl).lineBetween(cc - bl * 0.6, cc, cc, cc).lineBetween(cc - bl * 0.6, cc + bl, cc, cc + bl);
    g.generateTexture('coin_b', cs, cs).clear();

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
    // Bow arrow pointing right: shaft, a triangle head at the right end, two feathers at the left.
    const arw = t.arrow, arH = arw.height;
    g.fillStyle(arw.shaft).fillRect(arH * 0.6, arH * 0.39, arw.length - arH * 1.4, arH * 0.22);
    g.fillStyle(arw.head).fillTriangle(arw.length - arH, arH * 0.15, arw.length, arH / 2, arw.length - arH, arH * 0.85);
    g.fillStyle(arw.feather).fillTriangle(0, 0, arH, arH * 0.42, arH * 0.5, arH * 0.42).fillTriangle(0, arH, arH, arH * 0.58, arH * 0.5, arH * 0.58);
    g.generateTexture('arrow', arw.length, arH).clear();

    // Bee facing right: wings on top, a striped body, a stinger at the back, an eye at the front.
    const bee = t.bee, bw = bee.width, bh = bee.height;
    g.fillStyle(bee.wingColor, bee.wingAlpha).fillEllipse(bw * 0.42, bh * 0.28, bw * 0.34, bh * 0.4).fillEllipse(bw * 0.6, bh * 0.24, bw * 0.3, bh * 0.36);
    g.fillStyle(bee.stripeColor).fillTriangle(0, bh * 0.62, bw * 0.16, bh * 0.5, bw * 0.16, bh * 0.74); // stinger
    g.fillStyle(bee.color).fillEllipse(bw * 0.52, bh * 0.62, bw * 0.76, bh * 0.6);
    g.fillStyle(bee.stripeColor).fillRect(bw * 0.34, bh * 0.36, bw * 0.09, bh * 0.52).fillRect(bw * 0.52, bh * 0.34, bw * 0.09, bh * 0.56);
    g.fillCircle(bw * 0.8, bh * 0.56, bh * 0.06);
    g.lineStyle(1, bee.stripeColor, 0.8).strokeEllipse(bw * 0.52, bh * 0.62, bw * 0.76, bh * 0.6);
    g.generateTexture('bee', bw, bh).clear();

    const kl = t.klapa;
    g.fillStyle(kl.color).fillRect(0, 0, kl.width, kl.height);
    g.lineStyle(kl.borderWidth, kl.borderColor).strokeRect(0, 0, kl.width, kl.height);
    g.generateTexture('klapa', kl.width, kl.height).clear();

    // Żabka shop: a wall, a green awning with white stripes, a door between two windows, a dark outline.
    const zs = t.zabkaShop, zw = zs.width, zh = zs.height, ah = zs.awningHeight;
    g.fillStyle(zs.wall).fillRect(0, ah, zw, zh - ah);
    for (let i = 0; i < zs.stripes; i++) g.fillStyle(i % 2 ? zs.stripe : zs.awning).fillRect((zw / zs.stripes) * i, 0, zw / zs.stripes, ah);
    g.fillStyle(zs.door).fillRect(zw * 0.4, zh * 0.5, zw * 0.2, zh * 0.5);
    g.fillStyle(zs.window).fillRect(zw * 0.08, zh * 0.45, zw * 0.24, zh * 0.3).fillRect(zw * 0.68, zh * 0.45, zw * 0.24, zh * 0.3);
    g.lineStyle(2, zs.border).strokeRect(1, 1, zw - 2, zh - 2).lineBetween(0, ah, zw, ah);
    g.generateTexture('zabka_shop', zw, zh).clear();

    // Awaria prądu: black with a soft see-through hole in the middle. GameScene stretches it over the screen's diagonal,
    // so the hole's radius is worked out against that (the same in portrait and landscape).
    const bo = config.events.blackout, ds = bo.textureSize, cover = Math.hypot(config.game.width, config.game.height) / 2;
    const dark = this.textures.createCanvas('darkness', ds, ds), ctx = dark.getContext();
    const grad = ctx.createRadialGradient(ds / 2, ds / 2, (ds / 2) * (bo.holeRadius / cover), ds / 2, ds / 2, (ds / 2) * ((bo.holeRadius + bo.edge) / cover));
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(1, `rgba(0, 0, 0, ${bo.alpha})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, ds, ds);
    dark.refresh();

    // Boss chest: a box, a darker lid, a gold band down the middle and a lock.
    const ch = t.chest;
    g.fillStyle(ch.color).fillRect(0, ch.lidHeight, ch.width, ch.height - ch.lidHeight);
    g.fillStyle(ch.lidColor).fillRect(0, 0, ch.width, ch.lidHeight);
    g.fillStyle(ch.bandColor).fillRect((ch.width - ch.bandWidth) / 2, 0, ch.bandWidth, ch.height);
    g.fillRect(0, ch.lidHeight - ch.bandWidth / 2, ch.width, ch.bandWidth);
    g.fillStyle(ch.lidColor).fillRect((ch.width - ch.lockSize) / 2, ch.lidHeight - ch.lockSize / 2, ch.lockSize, ch.lockSize);
    g.generateTexture('chest', ch.width, ch.height).clear();
    // The locked chest on the map: the same, darker, with a chain across and a big padlock.
    g.fillStyle(ch.color).fillRect(0, ch.lidHeight, ch.width, ch.height - ch.lidHeight);
    g.fillStyle(ch.lidColor).fillRect(0, 0, ch.width, ch.lidHeight);
    g.fillStyle(0x000000, 0.3).fillRect(0, 0, ch.width, ch.height);
    g.fillStyle(ch.chainColor).fillRect(0, ch.lidHeight - ch.bandWidth / 2, ch.width, ch.bandWidth);
    g.lineStyle(3, ch.chainColor).beginPath().arc(ch.width / 2, ch.lidHeight, ch.lockSize * 0.55, Math.PI, 0).strokePath();
    g.fillStyle(ch.padlockColor).fillRoundedRect(ch.width / 2 - ch.lockSize * 0.8, ch.lidHeight, ch.lockSize * 1.6, ch.lockSize * 1.3, 2);
    g.fillStyle(0x000000).fillCircle(ch.width / 2, ch.lidHeight + ch.lockSize * 0.55, 2);
    g.generateTexture('chest_locked', ch.width, ch.height).clear();

    // Weapon icon: pistol (a barrel and a grip on a framed square).
    const wi = t.weaponIcon, ws = wi.size;
    g.fillStyle(wi.color).fillRect(0, 0, ws, ws).lineStyle(2, wi.borderColor).strokeRect(1, 1, ws - 2, ws - 2);
    g.fillStyle(wi.gunColor).fillRect(ws * 0.18, ws * 0.3, ws * 0.64, ws * 0.16);
    g.fillStyle(wi.gripColor).fillRect(ws * 0.22, ws * 0.44, ws * 0.17, ws * 0.32);
    g.generateTexture('weapon_pistol', ws, ws).clear();
    // Laughing gas: three puffs on the frame.
    g.fillStyle(wi.color).fillRect(0, 0, ws, ws).lineStyle(2, wi.borderColor).strokeRect(1, 1, ws - 2, ws - 2);
    g.fillStyle(wi.gasColors[0]).fillCircle(ws * 0.38, ws * 0.58, ws * 0.2);
    g.fillStyle(wi.gasColors[1]).fillCircle(ws * 0.6, ws * 0.44, ws * 0.2);
    g.fillStyle(wi.gasColors[2]).fillCircle(ws * 0.66, ws * 0.66, ws * 0.15);
    g.generateTexture('weapon_gas', ws, ws).clear();
    // Eye laser: two glowing eyes and a beam.
    g.fillStyle(wi.color).fillRect(0, 0, ws, ws).lineStyle(2, wi.borderColor).strokeRect(1, 1, ws - 2, ws - 2);
    g.lineStyle(ws * 0.12, wi.laserColor).lineBetween(ws * 0.3, ws * 0.38, ws * 0.92, ws * 0.8);
    g.fillStyle(wi.laserColor).fillCircle(ws * 0.28, ws * 0.36, ws * 0.12).fillCircle(ws * 0.5, ws * 0.36, ws * 0.12);
    g.fillStyle(wi.eyeColor).fillCircle(ws * 0.28, ws * 0.36, ws * 0.05).fillCircle(ws * 0.5, ws * 0.36, ws * 0.05);
    g.generateTexture('weapon_laser', ws, ws).clear();
    // Ul: a honeycomb cell with a bee's stripes.
    g.fillStyle(wi.color).fillRect(0, 0, ws, ws).lineStyle(2, wi.borderColor).strokeRect(1, 1, ws - 2, ws - 2);
    const hex = Array.from({ length: 6 }, (_, i) => ({ x: ws / 2 + Math.cos(i * Math.PI / 3) * ws * 0.34, y: ws / 2 + Math.sin(i * Math.PI / 3) * ws * 0.34 }));
    g.fillStyle(t.bee.color).fillPoints(hex, true);
    g.fillStyle(t.bee.stripeColor).fillRect(ws * 0.36, ws * 0.24, ws * 0.08, ws * 0.52).fillRect(ws * 0.56, ws * 0.24, ws * 0.08, ws * 0.52);
    g.lineStyle(2, t.bee.stripeColor).strokePoints(hex, true);
    g.generateTexture('weapon_bees', ws, ws).clear();
    // Dwarf's axe: a handle up the middle and a double blade at the top, light cutting edges, a dark outline.
    const ax = t.axe;
    const drawAxe = (ox, oy, s) => {
      const P = (pts) => pts.map(([px, py]) => ({ x: ox + px * s, y: oy + py * s }));
      g.fillStyle(ax.outline).fillRect(ox + s * 0.43, oy + s * 0.1, s * 0.14, s * 0.88);
      g.fillStyle(ax.handle).fillRect(ox + s * 0.46, oy + s * 0.12, s * 0.08, s * 0.84);
      for (const side of [1, -1]) {
        const blade = P([[0.5, 0.14], [0.5 + side * 0.32, 0.02], [0.5 + side * 0.46, 0.24], [0.5 + side * 0.32, 0.46], [0.5, 0.34]]);
        g.fillStyle(ax.head).fillPoints(blade, true).lineStyle(Math.max(1, s * 0.04), ax.outline).strokePoints(blade, true);
        const [ex1, ex2, ex3] = P([[0.5 + side * 0.32, 0.05], [0.5 + side * 0.43, 0.24], [0.5 + side * 0.32, 0.43]]);
        g.lineStyle(Math.max(1, s * 0.05), ax.edge).lineBetween(ex1.x, ex1.y, ex2.x, ex2.y).lineBetween(ex2.x, ex2.y, ex3.x, ex3.y);
      }
    };
    drawAxe(0, 0, ax.size);
    g.generateTexture('axe', ax.size, ax.size).clear();
    g.fillStyle(wi.color).fillRect(0, 0, ws, ws).lineStyle(2, wi.borderColor).strokeRect(1, 1, ws - 2, ws - 2);
    drawAxe(ws * 0.12, ws * 0.12, ws * 0.76);
    g.generateTexture('weapon_axe', ws, ws).clear();
    // Kostur Czarogeja: a wooden staff, a blue orb on top, a yellow lightning bolt beside it.
    const bolt = (x, y, sz) => [[0.5, 0], [0.2, 0.55], [0.45, 0.55], [0.3, 1], [0.8, 0.4], [0.55, 0.4], [0.75, 0]]
      .map(([px, py]) => ({ x: x + px * sz, y: y + py * sz }));
    g.fillStyle(wi.color).fillRect(0, 0, ws, ws).lineStyle(2, wi.borderColor).strokeRect(1, 1, ws - 2, ws - 2);
    g.lineStyle(ws * 0.09, wi.staffColor).lineBetween(ws * 0.25, ws * 0.9, ws * 0.55, ws * 0.3);
    g.fillStyle(wi.orbColor).fillCircle(ws * 0.58, ws * 0.24, ws * 0.13).fillStyle(0xffffff).fillCircle(ws * 0.54, ws * 0.2, ws * 0.04);
    g.fillStyle(wi.boltColor).fillPoints(bolt(ws * 0.62, ws * 0.45, ws * 0.32), true);
    g.generateTexture('weapon_staff', ws, ws).clear();
    // Łuk: a curved bow with its string, an arrow across it.
    const drawBow = () => {
      g.lineStyle(ws * 0.08, wi.bowColor).beginPath().arc(ws * 0.3, ws * 0.5, ws * 0.36, -1.1, 1.1).strokePath();
      g.lineStyle(1.5, wi.stringColor).lineBetween(ws * 0.3 + Math.cos(-1.1) * ws * 0.36, ws * 0.5 + Math.sin(-1.1) * ws * 0.36,
        ws * 0.3 + Math.cos(1.1) * ws * 0.36, ws * 0.5 + Math.sin(1.1) * ws * 0.36);
      g.lineStyle(ws * 0.05, t.arrow.shaft).lineBetween(ws * 0.16, ws * 0.5, ws * 0.82, ws * 0.5);
      g.fillStyle(t.arrow.head).fillTriangle(ws * 0.78, ws * 0.42, ws * 0.92, ws * 0.5, ws * 0.78, ws * 0.58);
    };
    g.fillStyle(wi.color).fillRect(0, 0, ws, ws).lineStyle(2, wi.borderColor).strokeRect(1, 1, ws - 2, ws - 2);
    drawBow();
    g.generateTexture('weapon_bow', ws, ws).clear();

    // Evolved weapons: the same framed square with a gold frame.
    const evoFrame = () => g.fillStyle(wi.color).fillRect(0, 0, ws, ws).lineStyle(3, wi.evoBorder).strokeRect(1.5, 1.5, ws - 3, ws - 3);
    // Uzi z bazaru: a long dark body, a magazine and a stock.
    evoFrame();
    g.fillStyle(wi.uziColor).fillRect(ws * 0.12, ws * 0.3, ws * 0.7, ws * 0.17).fillRect(ws * 0.82, ws * 0.34, ws * 0.08, ws * 0.08);
    g.fillStyle(wi.gunColor).fillRect(ws * 0.44, ws * 0.47, ws * 0.12, ws * 0.36).fillRect(ws * 0.1, ws * 0.47, ws * 0.08, ws * 0.18);
    g.fillStyle(wi.gripColor).fillRect(ws * 0.26, ws * 0.47, ws * 0.12, ws * 0.26);
    g.generateTexture('weapon_uzi', ws, ws).clear();
    // Smog nad Bemowem: grey puffs stacked into a heavy cloud.
    evoFrame();
    [[0.3, 0.6, 0.18], [0.52, 0.42, 0.22], [0.7, 0.62, 0.17], [0.5, 0.68, 0.2]].forEach(([x, y, r], i) => {
      g.fillStyle(wi.smogColors[i % wi.smogColors.length]).fillCircle(ws * x, ws * y, ws * r);
    });
    g.generateTexture('weapon_smog', ws, ws).clear();
    // Wzrok Homelandera: two wide beams from bigger eyes.
    evoFrame();
    g.lineStyle(ws * 0.16, wi.laserColor).lineBetween(ws * 0.26, ws * 0.36, ws * 0.95, ws * 0.62).lineBetween(ws * 0.5, ws * 0.36, ws * 0.95, ws * 0.92);
    g.fillStyle(wi.laserColor).fillCircle(ws * 0.26, ws * 0.36, ws * 0.15).fillCircle(ws * 0.5, ws * 0.36, ws * 0.15);
    g.fillStyle(wi.eyeColor).fillCircle(ws * 0.26, ws * 0.36, ws * 0.07).fillCircle(ws * 0.5, ws * 0.36, ws * 0.07);
    g.generateTexture('weapon_gaze', ws, ws).clear();
    // Pasieka babci: three honeycomb cells.
    evoFrame();
    [[0.32, 0.36], [0.68, 0.36], [0.5, 0.68]].forEach(([x, y]) => {
      const cell = Array.from({ length: 6 }, (_, i) => ({ x: ws * x + Math.cos(i * Math.PI / 3) * ws * 0.19, y: ws * y + Math.sin(i * Math.PI / 3) * ws * 0.19 }));
      g.fillStyle(t.bee.color).fillPoints(cell, true).lineStyle(2, t.bee.stripeColor).strokePoints(cell, true);
    });
    g.generateTexture('weapon_apiary', ws, ws).clear();
    // Tarcza Bemowa: a round shield in rings, red and gold, with a white middle.
    evoFrame();
    wi.shieldColors.forEach((color, i) => g.fillStyle(color).fillCircle(ws / 2, ws / 2, ws * (0.38 - i * 0.11)));
    g.fillStyle(wi.shieldColors[0]).fillCircle(ws / 2, ws / 2, ws * 0.07);
    g.generateTexture('weapon_bemowo_shield', ws, ws).clear();
    // Dwururka dziadka: two barrels side by side on a wooden stock.
    evoFrame();
    g.fillStyle(wi.gunColor).fillRect(ws * 0.3, ws * 0.3, ws * 0.6, ws * 0.09).fillRect(ws * 0.3, ws * 0.42, ws * 0.6, ws * 0.09);
    g.fillStyle(wi.gripColor).fillRect(ws * 0.1, ws * 0.3, ws * 0.24, ws * 0.21).fillRect(ws * 0.1, ws * 0.5, ws * 0.12, ws * 0.22);
    g.generateTexture('weapon_double_barrel', ws, ws).clear();
    // Młyn krasnoluda: two axes.
    evoFrame();
    drawAxe(ws * 0.02, ws * 0.18, ws * 0.6);
    drawAxe(ws * 0.38, ws * 0.18, ws * 0.6);
    g.generateTexture('weapon_axe_mill', ws, ws).clear();
    // Burza nad Bemowem: a dark storm cloud with lightning under it.
    evoFrame();
    [[0.3, 0.36, 0.16], [0.5, 0.28, 0.2], [0.7, 0.36, 0.16], [0.5, 0.42, 0.16]].forEach(([x, y, r]) => g.fillStyle(wi.stormColor).fillCircle(ws * x, ws * y, ws * r));
    g.fillStyle(wi.boltColor).fillPoints(bolt(ws * 0.3, ws * 0.5, ws * 0.42), true);
    g.generateTexture('weapon_storm', ws, ws).clear();
    // Łuk bez wymówek: the bow in a gold frame with two more arrows.
    evoFrame();
    drawBow();
    g.lineStyle(ws * 0.04, t.arrow.shaft).lineBetween(ws * 0.2, ws * 0.3, ws * 0.8, ws * 0.3).lineBetween(ws * 0.2, ws * 0.7, ws * 0.8, ws * 0.7);
    g.generateTexture('weapon_bow_evo', ws, ws).clear();
    // Laughing gas cloud: puffs scattered around the middle, see-through so they stack into a soft cloud.
    const gz = t.gasCloud, gcs = gz.size, gcc = gcs / 2;
    // The same puffs in other colors make the evolved Smog nad Bemowem cloud.
    for (const [key, colors, alpha] of [['gas_cloud', gz.colors, gz.alpha], ['smog_cloud', gz.smogColors, gz.smogAlpha]]) {
      for (let i = 0; i < gz.puffs; i++) {
        const a = (i / gz.puffs) * Math.PI * 2, d = i % 2 ? gcs * 0.2 : gcs * 0.12;
        g.fillStyle(colors[i % colors.length], alpha).fillCircle(gcc + Math.cos(a) * d, gcc + Math.sin(a) * d, gcs * 0.26);
      }
      g.fillStyle(colors[0], alpha).fillCircle(gcc, gcc, gcs * 0.3);
      g.generateTexture(key, gcs, gcs).clear();
    }

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
    this.sound.volume = config.audio.masterVolume;
    this.outlineSprites(); // last: the chests and pickups are drawn above
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

    // Plan dnia: a calendar page with rings on top and one day circled.
    g.fillStyle(ic.page).fillRoundedRect(s * 0.12, s * 0.16, s * 0.76, s * 0.74, s * 0.06);
    g.fillStyle(ic.heart).fillRect(s * 0.12, s * 0.16, s * 0.76, s * 0.18);
    g.fillStyle(ic.metalDark).fillRect(s * 0.28, s * 0.08, s * 0.08, s * 0.16).fillRect(s * 0.64, s * 0.08, s * 0.08, s * 0.16);
    g.fillStyle(ic.grid);
    for (let r = 0; r < 3; r++) for (let k = 0; k < 4; k++) g.fillRect(s * (0.2 + k * 0.16), s * (0.42 + r * 0.15), s * 0.1, s * 0.09);
    g.lineStyle(s * 0.05, ic.planRing).strokeCircle(s * 0.41, s * 0.61, s * 0.1);
    g.generateTexture('gym_plan', s, s).clear();

    // Kabura: a brown holster with a pistol grip sticking out.
    g.fillStyle(ic.metalDark).fillRect(s * 0.46, s * 0.08, s * 0.16, s * 0.34).fillRect(s * 0.4, s * 0.08, s * 0.3, s * 0.12);
    g.fillStyle(ic.coffee).fillPoints([{ x: s * 0.28, y: s * 0.3 }, { x: s * 0.78, y: s * 0.3 }, { x: s * 0.7, y: s * 0.92 },
      { x: s * 0.42, y: s * 0.92 }], true);
    g.lineStyle(s * 0.04, ic.outline).strokePoints([{ x: s * 0.28, y: s * 0.3 }, { x: s * 0.78, y: s * 0.3 }, { x: s * 0.7, y: s * 0.92 },
      { x: s * 0.42, y: s * 0.92 }], true);
    g.fillStyle(ic.accent).fillCircle(s * 0.53, s * 0.42, s * 0.05);
    g.generateTexture('gym_weapon_slot', s, s).clear();

    // Plecak: a green backpack with a pocket and a strap on top.
    g.lineStyle(s * 0.07, ic.outline).strokeEllipse(c, s * 0.2, s * 0.3, s * 0.22);
    g.fillStyle(ic.backpack).fillRoundedRect(s * 0.18, s * 0.22, s * 0.64, s * 0.7, s * 0.14);
    g.fillStyle(0x000000, 0.25).fillRoundedRect(s * 0.28, s * 0.56, s * 0.44, s * 0.28, s * 0.06);
    g.lineStyle(s * 0.04, ic.outline).strokeRoundedRect(s * 0.18, s * 0.22, s * 0.64, s * 0.7, s * 0.14);
    g.fillStyle(ic.accent).fillRect(c - s * 0.04, s * 0.52, s * 0.08, s * 0.08);
    g.generateTexture('gym_passive_slot', s, s).clear();

    // Pause: two white bars. Settings: a gear (teeth around a ring with a hole).
    g.fillStyle(0xffffff).fillRoundedRect(s * 0.24, s * 0.18, s * 0.18, s * 0.64, s * 0.04).fillRoundedRect(s * 0.58, s * 0.18, s * 0.18, s * 0.64, s * 0.04);
    g.generateTexture('icon_pause', s, s).clear();
    g.fillStyle(ic.metal);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2, tooth = s * 0.09;
      g.fillCircle(c + Math.cos(a) * s * 0.36, c + Math.sin(a) * s * 0.36, tooth);
    }
    g.fillCircle(c, c, s * 0.34).fillStyle(ic.metalDark).fillCircle(c, c, s * 0.13);
    g.lineStyle(2, ic.metalDark).strokeCircle(c, c, s * 0.34);
    g.generateTexture('icon_gear', s, s).clear();
    // Wyzwania: a gold cup with two handles on a stand.
    g.lineStyle(s * 0.07, ic.accent).strokeCircle(s * 0.25, s * 0.36, s * 0.11).strokeCircle(s * 0.75, s * 0.36, s * 0.11);
    g.fillStyle(ic.accent).fillRoundedRect(s * 0.27, s * 0.16, s * 0.46, s * 0.4, { tl: 0, tr: 0, bl: s * 0.2, br: s * 0.2 });
    g.fillRect(s * 0.45, s * 0.54, s * 0.1, s * 0.18).fillRoundedRect(s * 0.3, s * 0.72, s * 0.4, s * 0.1, s * 0.03);
    g.lineStyle(2, ic.outline).strokeRoundedRect(s * 0.27, s * 0.16, s * 0.46, s * 0.4, { tl: 0, tr: 0, bl: s * 0.2, br: s * 0.2 });
    g.generateTexture('icon_trophy', s, s).clear();
    // Statystyki: three bars of a chart on a base line.
    g.fillStyle(ic.metal).fillRect(s * 0.16, s * 0.52, s * 0.18, s * 0.3).fillRect(s * 0.41, s * 0.3, s * 0.18, s * 0.52).fillRect(s * 0.66, s * 0.14, s * 0.18, s * 0.68);
    g.fillStyle(ic.accent).fillRect(s * 0.1, s * 0.82, s * 0.8, s * 0.07);
    g.generateTexture('icon_stats', s, s).clear();

    this.drawPassiveIcons(g);
  }

  // Passive icons (passive_<id>), same size and style as the UI icons. Dark outlines keep them readable on any panel.
  drawPassiveIcons(g) {
    const ic = config.ui.icons, s = ic.size, c = s / 2, o = ic.outline;
    const done = (id) => g.generateTexture(`passive_${id}`, s, s).clear();
    const tub = (body, label) => { // a jar of supplement: lid, body, label
      g.fillStyle(body).fillRoundedRect(s * 0.22, s * 0.26, s * 0.56, s * 0.66, s * 0.08).lineStyle(2, o).strokeRoundedRect(s * 0.22, s * 0.26, s * 0.56, s * 0.66, s * 0.08);
      g.fillStyle(ic.metalDark).fillRoundedRect(s * 0.18, s * 0.1, s * 0.64, s * 0.18, s * 0.05);
      g.fillStyle(label).fillRect(s * 0.22, s * 0.46, s * 0.56, s * 0.24);
    };

    // Kreatyna: a white tub with a red label and a lightning bolt.
    tub(ic.tub, ic.heart);
    g.fillStyle(0xffffff).fillTriangle(s * 0.52, s * 0.47, s * 0.4, s * 0.6, s * 0.5, s * 0.6).fillTriangle(s * 0.5, s * 0.57, s * 0.6, s * 0.57, s * 0.46, s * 0.7);
    done('creatine');
    // Kawa z Żabki: a paper cup with a lid, a sleeve and steam.
    g.fillStyle(ic.cup).fillPoints([{ x: s * 0.24, y: s * 0.3 }, { x: s * 0.76, y: s * 0.3 }, { x: s * 0.68, y: s * 0.94 }, { x: s * 0.32, y: s * 0.94 }], true);
    g.fillStyle(ic.coffee).fillRect(s * 0.27, s * 0.5, s * 0.46, s * 0.2);
    g.fillStyle(ic.metalDark).fillRoundedRect(s * 0.18, s * 0.22, s * 0.64, s * 0.1, s * 0.04);
    g.lineStyle(s * 0.05, ic.metal).lineBetween(s * 0.42, s * 0.16, s * 0.38, s * 0.04).lineBetween(s * 0.58, s * 0.16, s * 0.62, s * 0.04);
    done('coffee');
    // Buty z bazaru: a blue sneaker with a white sole and three stripes.
    g.fillStyle(ic.shoe).fillPoints([{ x: s * 0.1, y: s * 0.34 }, { x: s * 0.4, y: s * 0.34 }, { x: s * 0.52, y: s * 0.5 },
      { x: s * 0.88, y: s * 0.58 }, { x: s * 0.92, y: s * 0.74 }, { x: s * 0.1, y: s * 0.74 }], true);
    g.fillStyle(0xffffff).fillRoundedRect(s * 0.06, s * 0.72, s * 0.9, s * 0.13, s * 0.05);
    g.lineStyle(s * 0.045, 0xffffff).lineBetween(s * 0.3, s * 0.64, s * 0.4, s * 0.42).lineBetween(s * 0.4, s * 0.66, s * 0.5, s * 0.48)
      .lineBetween(s * 0.5, s * 0.68, s * 0.6, s * 0.54);
    done('shoes');
    // Gainer: a big brown tub with a heart (max HP).
    tub(ic.gainer, ic.tub);
    g.fillStyle(ic.heart).fillCircle(s * 0.44, s * 0.55, s * 0.06).fillCircle(s * 0.56, s * 0.55, s * 0.06).fillTriangle(s * 0.38, s * 0.57, s * 0.62, s * 0.57, c, s * 0.68);
    done('gainer');
    // Hantle w plecaku: a backpack with a dumbbell sticking out.
    g.fillStyle(ic.metalDark).fillRect(s * 0.1, s * 0.12, s * 0.8, s * 0.08).fillRect(s * 0.06, s * 0.04, s * 0.1, s * 0.24).fillRect(s * 0.84, s * 0.04, s * 0.1, s * 0.24);
    g.fillStyle(ic.backpack).fillRoundedRect(s * 0.2, s * 0.2, s * 0.6, s * 0.74, s * 0.14).lineStyle(2, o).strokeRoundedRect(s * 0.2, s * 0.2, s * 0.6, s * 0.74, s * 0.14);
    g.fillStyle(0x000000, 0.25).fillRoundedRect(s * 0.3, s * 0.56, s * 0.4, s * 0.26, s * 0.06);
    done('dumbbells');
    // Bilet miesięczny ZTM: a yellow card with a red stripe and a hole.
    g.fillStyle(ic.ticket).fillRoundedRect(s * 0.06, s * 0.22, s * 0.88, s * 0.56, s * 0.06).lineStyle(2, o).strokeRoundedRect(s * 0.06, s * 0.22, s * 0.88, s * 0.56, s * 0.06);
    g.fillStyle(ic.ticketStripe).fillRect(s * 0.06, s * 0.32, s * 0.88, s * 0.1);
    g.fillStyle(o).fillRect(s * 0.16, s * 0.52, s * 0.4, s * 0.05).fillRect(s * 0.16, s * 0.62, s * 0.28, s * 0.05).fillCircle(s * 0.78, s * 0.6, s * 0.06);
    done('ticket');
    // Karnet na siłownię: an orange pass with a dumbbell on it.
    g.fillStyle(ic.pass).fillRoundedRect(s * 0.08, s * 0.2, s * 0.84, s * 0.6, s * 0.08).lineStyle(2, o).strokeRoundedRect(s * 0.08, s * 0.2, s * 0.84, s * 0.6, s * 0.08);
    g.fillStyle(0xffffff).fillRect(s * 0.28, s * 0.48, s * 0.44, s * 0.06).fillRect(s * 0.22, s * 0.38, s * 0.08, s * 0.26).fillRect(s * 0.7, s * 0.38, s * 0.08, s * 0.26);
    done('gymPass');
    // Rosół babci: a white bowl of golden soup with noodles and steam.
    g.fillStyle(ic.bowl).slice(c, s * 0.5, s * 0.42, 0, Math.PI, false).fillPath();
    g.lineStyle(2, o).beginPath().arc(c, s * 0.5, s * 0.42, 0, Math.PI, false).strokePath();
    g.fillStyle(ic.soup).fillEllipse(c, s * 0.5, s * 0.8, s * 0.14);
    g.lineStyle(s * 0.03, ic.cup).lineBetween(s * 0.3, s * 0.5, s * 0.46, s * 0.48).lineBetween(s * 0.5, s * 0.52, s * 0.68, s * 0.49);
    g.lineStyle(s * 0.05, ic.metal).lineBetween(s * 0.38, s * 0.36, s * 0.34, s * 0.14).lineBetween(s * 0.6, s * 0.36, s * 0.64, s * 0.14);
    done('broth');
    // Kurtka puchowa: a puffer jacket, quilted.
    g.fillStyle(ic.jacket).fillRoundedRect(s * 0.06, s * 0.2, s * 0.2, s * 0.6, s * 0.08).fillRoundedRect(s * 0.74, s * 0.2, s * 0.2, s * 0.6, s * 0.08)
      .fillRoundedRect(s * 0.2, s * 0.12, s * 0.6, s * 0.82, s * 0.12);
    g.lineStyle(s * 0.04, ic.jacketLine);
    for (const y of [0.34, 0.54, 0.74]) g.lineBetween(s * 0.2, s * y, s * 0.8, s * y);
    g.lineBetween(c, s * 0.14, c, s * 0.92);
    g.lineStyle(2, o).strokeRoundedRect(s * 0.2, s * 0.12, s * 0.6, s * 0.82, s * 0.12);
    done('jacket');
    // Koniczyna z trawnika: four leaves and a stem.
    g.lineStyle(s * 0.06, ic.cloverDark).lineBetween(c, c, s * 0.66, s * 0.94);
    for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      g.fillStyle(ic.clover).fillCircle(c + dx * s * 0.16, c + dy * s * 0.16, s * 0.17);
      g.lineStyle(2, ic.cloverDark).strokeCircle(c + dx * s * 0.16, c + dy * s * 0.16, s * 0.17);
    }
    g.fillStyle(ic.cloverDark).fillCircle(c, c, s * 0.05);
    done('clover');
    // Zeszyt w kratkę: a page with a grid and a spiral binding.
    g.fillStyle(ic.page).fillRect(s * 0.16, s * 0.08, s * 0.7, s * 0.84).lineStyle(2, o).strokeRect(s * 0.16, s * 0.08, s * 0.7, s * 0.84);
    g.lineStyle(1, ic.grid);
    for (let i = 1; i < 7; i++) g.lineBetween(s * 0.16, s * (0.08 + i * 0.12), s * 0.86, s * (0.08 + i * 0.12)).lineBetween(s * (0.16 + i * 0.1), s * 0.08, s * (0.16 + i * 0.1), s * 0.92);
    g.fillStyle(ic.metalDark);
    for (let i = 0; i < 6; i++) g.fillCircle(s * 0.16, s * (0.16 + i * 0.14), s * 0.05);
    done('notebook');
    // Wór na kryształy: a tied sack with a green gem on it.
    g.fillStyle(ic.sack).fillEllipse(c, s * 0.62, s * 0.76, s * 0.66).fillTriangle(s * 0.36, s * 0.32, s * 0.64, s * 0.32, c, s * 0.12);
    g.lineStyle(2, ic.sackDark).strokeEllipse(c, s * 0.62, s * 0.76, s * 0.66);
    g.lineStyle(s * 0.06, ic.sackDark).lineBetween(s * 0.36, s * 0.3, s * 0.64, s * 0.3);
    g.fillStyle(ic.gem).fillPoints([{ x: c, y: s * 0.46 }, { x: s * 0.62, y: s * 0.62 }, { x: c, y: s * 0.8 }, { x: s * 0.38, y: s * 0.62 }], true);
    g.fillStyle(0xffffff).fillRect(s * 0.46, s * 0.56, s * 0.04, s * 0.04);
    done('bag');
    // Książka Davida Gogginsa: a black book with white pages and a gold title bar.
    g.fillStyle(ic.bookPage).fillRect(s * 0.24, s * 0.12, s * 0.6, s * 0.8);
    g.fillStyle(ic.book).fillRoundedRect(s * 0.16, s * 0.08, s * 0.6, s * 0.8, s * 0.04).lineStyle(2, o).strokeRoundedRect(s * 0.16, s * 0.08, s * 0.6, s * 0.8, s * 0.04);
    g.fillStyle(ic.bookTitle).fillRect(s * 0.24, s * 0.22, s * 0.44, s * 0.1).fillRect(s * 0.3, s * 0.38, s * 0.32, s * 0.05);
    g.fillStyle(0xffffff).fillRect(s * 0.3, s * 0.48, s * 0.32, s * 0.04);
    done('goggins');
    // Płyta Limp Bizkit: a CD with a shine and a red label.
    g.fillStyle(ic.disc).fillCircle(c, c, s * 0.44).lineStyle(2, o).strokeCircle(c, c, s * 0.44);
    g.lineStyle(s * 0.06, ic.discShine, 0.8).beginPath().arc(c, c, s * 0.32, -2.4, -1.4).strokePath();
    g.fillStyle(ic.discLabel).fillCircle(c, c, s * 0.18);
    g.fillStyle(o).fillCircle(c, c, s * 0.05);
    done('limp');
    this.drawItemIcons(g);
  }

  // Item icons (item_<id>), drawn like the passive ones.
  drawItemIcons(g) {
    const ic = config.ui.icons, s = ic.size, c = s / 2, o = ic.outline;
    const done = (id) => g.generateTexture(`item_${id}`, s, s).clear();
    // Sterydy: a syringe with red liquid, a plunger and a needle.
    g.fillStyle(ic.syringe).fillRect(s * 0.22, s * 0.38, s * 0.5, s * 0.24).lineStyle(2, o).strokeRect(s * 0.22, s * 0.38, s * 0.5, s * 0.24);
    g.fillStyle(ic.steroid).fillRect(s * 0.42, s * 0.41, s * 0.29, s * 0.18);
    g.fillStyle(ic.metalDark).fillRect(s * 0.06, s * 0.46, s * 0.16, s * 0.08).fillRect(s * 0.04, s * 0.36, s * 0.05, s * 0.28);
    g.lineStyle(2, ic.metal).lineBetween(s * 0.72, c, s * 0.96, c);
    done('steroids');
    // Baton proteinowy: a wrapped bar with crimped ends and a chocolate stripe.
    g.fillStyle(ic.barWrap).fillRect(s * 0.14, s * 0.34, s * 0.72, s * 0.32).lineStyle(2, o).strokeRect(s * 0.14, s * 0.34, s * 0.72, s * 0.32);
    g.fillTriangle(s * 0.14, s * 0.34, s * 0.04, s * 0.3, s * 0.14, c).fillTriangle(s * 0.14, s * 0.66, s * 0.04, s * 0.7, s * 0.14, c);
    g.fillTriangle(s * 0.86, s * 0.34, s * 0.96, s * 0.3, s * 0.86, c).fillTriangle(s * 0.86, s * 0.66, s * 0.96, s * 0.7, s * 0.86, c);
    g.fillStyle(ic.barChoc).fillRect(s * 0.3, s * 0.44, s * 0.4, s * 0.12);
    done('bar');
    // Energetyk: a green can with a silver top and a bolt.
    g.fillStyle(ic.can).fillRoundedRect(s * 0.28, s * 0.14, s * 0.44, s * 0.76, s * 0.06).lineStyle(2, o).strokeRoundedRect(s * 0.28, s * 0.14, s * 0.44, s * 0.76, s * 0.06);
    g.fillStyle(ic.metal).fillRect(s * 0.28, s * 0.14, s * 0.44, s * 0.1);
    g.fillStyle(ic.canDark).fillTriangle(s * 0.54, s * 0.32, s * 0.4, s * 0.56, s * 0.52, s * 0.56).fillTriangle(s * 0.48, s * 0.52, s * 0.62, s * 0.52, s * 0.46, s * 0.78);
    done('energy');
    // Skarpety frotte: a white sock with red stripes.
    g.fillStyle(ic.sock).fillRect(s * 0.3, s * 0.08, s * 0.3, s * 0.6).fillRoundedRect(s * 0.3, s * 0.56, s * 0.56, s * 0.3, s * 0.14);
    g.lineStyle(2, o).strokeRect(s * 0.3, s * 0.08, s * 0.3, s * 0.5);
    g.fillStyle(ic.sockStripe).fillRect(s * 0.3, s * 0.14, s * 0.3, s * 0.06).fillRect(s * 0.3, s * 0.26, s * 0.3, s * 0.06);
    done('socks');
    // Rękawiczki na siłkę: a black fingerless glove with an orange strap.
    g.fillStyle(ic.glove).fillRoundedRect(s * 0.22, s * 0.3, s * 0.52, s * 0.56, s * 0.1);
    for (let i = 0; i < 4; i++) g.fillRect(s * (0.24 + i * 0.13), s * 0.16, s * 0.1, s * 0.18);
    g.fillRect(s * 0.7, s * 0.42, s * 0.14, s * 0.22);
    g.fillStyle(ic.gloveStrap).fillRect(s * 0.18, s * 0.72, s * 0.6, s * 0.12);
    done('gloves');
    // Zdrapka: a yellow card with a grey scratch field, half scratched off.
    g.fillStyle(ic.scratch).fillRoundedRect(s * 0.1, s * 0.2, s * 0.8, s * 0.6, s * 0.06).lineStyle(2, o).strokeRoundedRect(s * 0.1, s * 0.2, s * 0.8, s * 0.6, s * 0.06);
    g.fillStyle(ic.scratchFoil).fillRect(s * 0.2, s * 0.34, s * 0.6, s * 0.32);
    g.fillStyle(ic.heart).fillCircle(s * 0.62, c, s * 0.08);
    g.fillStyle(ic.scratch).fillRect(s * 0.5, s * 0.36, s * 0.04, s * 0.28);
    done('scratch');
    // Plaster: a band-aid with a pad in the middle and dots.
    g.fillStyle(ic.plaster).fillRoundedRect(s * 0.06, s * 0.34, s * 0.88, s * 0.32, s * 0.14).lineStyle(2, o).strokeRoundedRect(s * 0.06, s * 0.34, s * 0.88, s * 0.32, s * 0.14);
    g.fillStyle(ic.plasterPad).fillRect(s * 0.36, s * 0.38, s * 0.28, s * 0.24);
    g.fillStyle(o, 0.3).fillCircle(s * 0.18, s * 0.44, 1.5).fillCircle(s * 0.24, s * 0.56, 1.5).fillCircle(s * 0.76, s * 0.44, 1.5).fillCircle(s * 0.82, s * 0.56, 1.5);
    done('plaster');
    // Magnes z lodówki: a red horseshoe magnet with silver tips.
    g.lineStyle(s * 0.16, ic.magnet).beginPath().arc(c, s * 0.48, s * 0.26, Math.PI, 0, true).strokePath();
    g.fillStyle(ic.magnet).fillRect(s * 0.16, s * 0.2, s * 0.16, s * 0.28).fillRect(s * 0.68, s * 0.2, s * 0.16, s * 0.28);
    g.fillStyle(ic.metal).fillRect(s * 0.16, s * 0.1, s * 0.16, s * 0.12).fillRect(s * 0.68, s * 0.1, s * 0.16, s * 0.12);
    done('fridgeMagnet');
  }
}
