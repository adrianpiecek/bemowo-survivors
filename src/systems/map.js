import { config } from '../config.js';
import { playVfx } from './vfx.js';
import { maps } from '../data/maps.js';

// Bemowo around Bartek: an endless grid of square street blocks, config.map.block px each. Block (bx, by) covers
// world [bx * block, (bx + 1) * block) and carries the road along its top and left edge (the crossing in its top left
// corner), so the right and bottom roads come from its neighbours. Each block kind is one texture drawn once
// (createMapTextures, from BootScene); the decorations on a block are pooled images, placed from a seed made of the
// block's position, so the same block always looks the same. Nothing here collides with anything.

// A small seeded random (mulberry32) from the block position: the same numbers for the same block every time.
function blockRandom(bx, by) {
  let s = (Math.imul(bx, 73856093) ^ Math.imul(by, 19349663) ^ 0x9e3779b9) >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), s | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const between = (r, a, b) => a + r() * (b - a);

// Fort Bema's moat in block coordinates, [x, y, w, h] each: four sides of a ring, each cut in two by its bridge.
function moatParts() {
  const m = config.map, f = m.fortBema.fort, x0 = m.road + f.inset, x1 = m.block - f.inset, mid = (x0 + x1) / 2, M = f.moat, W = f.bridge / 2;
  const along = (a, b) => [[a, mid - W - a], [mid + W, b - mid - W]]; // [start, length] of the two pieces
  return [
    ...along(x0, x1).flatMap(([p, len]) => [[p, x0, len, M], [p, x1 - M, len, M]]),
    ...along(x0 + M, x1 - M).flatMap(([p, len]) => [[x0, p, M, len], [x1 - M, p, M, len]]),
  ];
}
const weighted = (r, list) => {
  let roll = r() * list.reduce((s, it) => s + it.weight, 0);
  return list.find((it) => (roll -= it.weight) < 0) ?? list[list.length - 1];
};

// Textures: block_<kind> for every config.map.kinds entry, decor_* for the decorations, light_r/y/g for the traffic
// lights, shadow for the ellipse under characters.
export function createMapTextures(scene) {
  const m = config.map, c = m.colors, B = m.block, R = m.road, S = m.sidewalk, z = m.zebra;
  const lot = B - R, in0 = R + S, inW = B - R - 2 * S, g = scene.add.graphics();

  // Roads on the top and left edge with dashed middle lines and a zebra at each end, sidewalk plates, a curb.
  const streets = () => {
    g.fillStyle(c.asphalt).fillRect(0, 0, B, R).fillRect(0, 0, R, B);
    g.fillStyle(c.asphaltDark).fillRect(0, 0, R, R); // the crossing, worn darker
    g.fillStyle(c.sidewalk).fillRect(R, R, lot, lot);
    g.lineStyle(1, c.plateLine);
    for (let p = R; p <= B; p += m.plate) g.lineBetween(p, R, p, B).lineBetween(R, p, B, p);
    g.fillStyle(c.lane);
    const from = R + z.inset * 2 + z.length, to = B - z.inset * 2 - z.length;
    for (let d = from; d + m.dash[0] <= to; d += m.dash[0] + m.dash[1]) {
      g.fillRect(d, R / 2 - m.laneWidth / 2, m.dash[0], m.laneWidth).fillRect(R / 2 - m.laneWidth / 2, d, m.laneWidth, m.dash[0]);
    }
    const step = (R - 2 * z.margin) / z.stripes;
    for (const at of [R + z.inset, B - z.inset - z.length]) {
      for (let k = 0; k < z.stripes; k++) {
        const across = z.margin + k * step;
        g.fillRect(at, across, z.length, step - z.gap).fillRect(across, at, step - z.gap, z.length);
      }
    }
    g.lineStyle(m.curb, c.curb).strokeRect(R + m.curb / 2, R + m.curb / 2, lot - m.curb, lot - m.curb);
  };
  const grass = (rnd) => {
    g.fillStyle(c.grass).fillRect(in0, in0, inW, inW);
    for (let i = 0; i < m.grassBlotches; i++) {
      g.fillStyle(c.grassDark, 0.6).fillCircle(in0 + rnd.between(0, inW), in0 + rnd.between(0, inW), rnd.between(10, 34));
    }
  };
  const tree = (x, y, r) => {
    g.fillStyle(0x000000, 0.25).fillCircle(x + r * 0.25, y + r * 0.3, r);
    g.fillStyle(c.tree).fillCircle(x, y, r);
    g.fillStyle(c.treeLight).fillCircle(x - r * 0.3, y - r * 0.3, r * 0.45);
  };
  // Fort Bema: grass everywhere, a gravel alley in place of the roads (top and left edge).
  const fb = m.fortBema, fc = fb.colors;
  const alleys = (rnd) => {
    g.fillStyle(c.grass).fillRect(0, 0, B, B);
    for (let i = 0; i < m.grassBlotches * 2; i++) g.fillStyle(c.grassDark, 0.6).fillCircle(rnd.between(0, B), rnd.between(0, B), rnd.between(10, 34));
    g.fillStyle(fc.gravel).fillRect(0, 0, B, R).fillRect(0, 0, R, B);
    g.lineStyle(4, fc.gravelEdge).lineBetween(R, R, B, R).lineBetween(R, R, R, B).lineBetween(0, 0, B, 0).lineBetween(0, 0, 0, B);
  };
  const flowers = (rnd, n) => {
    for (let i = 0; i < n; i++) {
      g.fillStyle(fc.flowers[rnd.between(0, fc.flowers.length - 1)]).fillCircle(rnd.between(R + 10, B - 10), rnd.between(R + 10, B - 10), rnd.between(...fb.flowerSize));
    }
  };
  const draw = {
    // Park: trees, a path across.
    park(rnd) {
      g.lineStyle(m.pathWidth, fc.gravel).lineBetween(R, R + lot * 0.75, B, R + lot * 0.25);
      for (let i = 0; i < fb.parkTrees; i++) tree(R + rnd.between(40, lot - 40), R + rnd.between(40, lot - 40), rnd.between(22, 40));
    },
    // Łąka: flowers and a few trees.
    meadow(rnd) {
      flowers(rnd, fb.flowers);
      for (let i = 0; i < fb.meadowTrees; i++) tree(R + rnd.between(40, lot - 40), R + rnd.between(40, lot - 40), rnd.between(24, 36));
    },
    // Fort: a moat ring with a wooden bridge on each side around a brick-walled courtyard, a tower in each corner.
    fort() {
      const f = fb.fort, x0 = R + f.inset, x1 = B - f.inset, M = f.moat, mid = (x0 + x1) / 2, W = f.bridge / 2;
      g.fillStyle(fc.waterLight).fillRect(x0, x0, x1 - x0, x1 - x0);
      g.fillStyle(c.grass).fillRect(x0 + M, x0 + M, x1 - x0 - 2 * M, x1 - x0 - 2 * M);
      for (const [x, y, w, h] of moatParts()) g.fillStyle(fc.water).fillRect(x + 3, y + 3, w - 6, h - 6);
      const i0 = x0 + M, i1 = x1 - M, T = f.wall;
      g.fillStyle(fc.courtyard).fillRect(i0 + T, i0 + T, i1 - i0 - 2 * T, i1 - i0 - 2 * T);
      // The walls: brick rows with mortar lines, a gate at each bridge.
      const [bw, bh] = f.brick;
      const wall = (x, y, w, h) => {
        g.fillStyle(fc.brick).fillRect(x, y, w, h);
        g.lineStyle(1, fc.brickDark);
        for (let yy = y; yy < y + h; yy += bh) {
          g.lineBetween(x, yy, x + w, yy);
          for (let xx = x + ((yy - y) / bh % 2) * bw / 2; xx < x + w; xx += bw) g.lineBetween(xx, yy, xx, Math.min(yy + bh, y + h));
        }
        g.lineStyle(2, fc.brickDark).strokeRect(x, y, w, h);
      };
      wall(i0, i0, mid - W - i0, T); wall(mid + W, i0, i1 - mid - W, T);
      wall(i0, i1 - T, mid - W - i0, T); wall(mid + W, i1 - T, i1 - mid - W, T);
      wall(i0, i0, T, mid - W - i0); wall(i0, mid + W, T, i1 - mid - W);
      wall(i1 - T, i0, T, mid - W - i0); wall(i1 - T, mid + W, T, i1 - mid - W);
      for (const [tx, ty] of [[i0, i0], [i1, i0], [i0, i1], [i1, i1]]) {
        g.fillStyle(fc.brickDark).fillCircle(tx, ty, f.tower + 3);
        g.fillStyle(fc.brick).fillCircle(tx, ty, f.tower);
      }
      // Bridges: planks across the moat.
      const planks = (x, y, w, h, across) => {
        g.fillStyle(fc.plank).fillRect(x, y, w, h);
        g.lineStyle(2, fc.plankDark);
        for (let p = 0; p < (across ? w : h); p += 12) {
          if (across) g.lineBetween(x + p, y, x + p, y + h);
          else g.lineBetween(x, y + p, x + w, y + p);
        }
        g.strokeRect(x, y, w, h);
      };
      planks(mid - W, x0 - 4, 2 * W, M + 8, false); planks(mid - W, x1 - M - 4, 2 * W, M + 8, false);
      planks(x0 - 4, mid - W, M + 8, 2 * W, true); planks(x1 - M - 4, mid - W, M + 8, 2 * W, true);
    },
    // Trawnik: grass, a worn path across, trees.
    lawn(rnd) {
      grass(rnd);
      g.lineStyle(m.pathWidth, c.path).lineBetween(in0, in0 + inW * 0.2, in0 + inW, in0 + inW * 0.8);
      for (let i = 0; i < m.lawnTrees; i++) tree(in0 + rnd.between(40, inW - 40), in0 + rnd.between(40, inW - 40), rnd.between(22, 38));
    },
    // Blok: a long block of flats seen from above and a little from the front: roof with vents, a wall of windows.
    flats(rnd) {
      grass(rnd);
      const bx = in0 + m.flats.margin, bw = inW - m.flats.margin * 2, by = in0 + m.flats.margin, rh = m.flats.roof, wh = m.flats.wall;
      g.fillStyle(0x000000, 0.25).fillRect(bx + 10, by + 10, bw, rh + wh);
      g.fillStyle(c.roof).fillRect(bx, by, bw, rh);
      g.lineStyle(4, c.roofDark).strokeRect(bx + 2, by + 2, bw - 4, rh - 4);
      for (let i = 0; i < m.flats.vents; i++) g.fillStyle(c.roofDark).fillRect(bx + 30 + i * (bw - 60) / m.flats.vents, by + rh * 0.35, 22, 22);
      g.fillStyle(c.wall).fillRect(bx, by + rh, bw, wh);
      const cols = Math.floor(bw / m.flats.windowStep);
      for (let row = 0; row < 2; row++) {
        for (let col = 0; col < cols; col++) {
          const lit = rnd.frac() < m.flats.litChance;
          g.fillStyle(lit ? c.windowLit : c.window)
            .fillRect(bx + 10 + col * m.flats.windowStep, by + rh + 10 + row * (wh / 2), m.flats.windowStep - 12, wh / 2 - 18);
        }
      }
      g.fillStyle(c.door).fillRect(bx + bw / 2 - 16, by + rh + wh - 34, 32, 34);
      for (let i = 0; i < m.flats.trees; i++) tree(in0 + 50 + i * (inW - 100) / Math.max(1, m.flats.trees - 1), in0 + inW - 60, rnd.between(24, 34));
    },
    // Parking: asphalt with two rows of spaces; cars park there as decorations (blockDecor).
    parking() {
      g.fillStyle(c.parking).fillRect(in0, in0, inW, inW);
      g.lineStyle(3, c.parkLine);
      const p = m.parkingSpots;
      for (const top of [in0 + p.edge, in0 + inW - p.edge - p.depth]) {
        for (let x = in0 + p.edge; x <= in0 + inW - p.edge; x += p.width) g.lineBetween(x, top, x, top + p.depth);
        g.lineBetween(in0 + p.edge, top + (top === in0 + p.edge ? p.depth : 0), in0 + inW - p.edge, top + (top === in0 + p.edge ? p.depth : 0));
      }
    },
    // Plac zabaw: a sandpit, a slide, swings, trees in the corners.
    playground(rnd) {
      grass(rnd);
      const cx = in0 + inW / 2, cy = in0 + inW / 2;
      g.fillStyle(c.sand).fillRoundedRect(cx - 170, cy - 120, 340, 240, 20);
      g.lineStyle(6, c.wood).strokeRoundedRect(cx - 170, cy - 120, 340, 240, 20);
      g.fillStyle(c.slide).fillRect(cx - 120, cy - 70, 40, 120); // the slide
      g.lineStyle(4, c.metal).lineBetween(cx - 125, cy + 50, cx - 125, cy + 90).lineBetween(cx - 75, cy + 50, cx - 75, cy + 90);
      g.lineStyle(6, c.metal).lineBetween(cx + 20, cy - 60, cx + 140, cy - 60); // swings: a bar and two seats on ropes
      g.lineStyle(2, c.metal).lineBetween(cx + 50, cy - 60, cx + 50, cy).lineBetween(cx + 110, cy - 60, cx + 110, cy);
      g.fillStyle(c.wood).fillRect(cx + 38, cy, 24, 8).fillRect(cx + 98, cy, 24, 8);
      for (const [x, y] of [[0.12, 0.12], [0.88, 0.12], [0.12, 0.88], [0.88, 0.88]]) tree(in0 + inW * x, in0 + inW * y, rnd.between(24, 34));
    },
  };
  for (const map of maps) {
    for (const kind of map.kinds) {
      const rnd = new Phaser.Math.RandomDataGenerator([kind.id]);
      if (map.streets) streets();
      else alleys(rnd);
      draw[kind.id](rnd);
      g.generateTexture(`block_${kind.id}`, B, B).clear();
    }
  }

  // Standing decorations (side view, their bottom on the sidewalk).
  const d = m.decorSize;
  g.fillStyle(c.metalDark).fillRect(d.lamp.w / 2 - 2, 10, 4, d.lamp.h - 10).fillRect(d.lamp.w / 2 - 5, d.lamp.h - 4, 10, 4);
  g.fillStyle(c.metalDark).fillRoundedRect(0, 4, d.lamp.w, 8, 3);
  g.fillStyle(c.windowLit).fillRect(2, 10, d.lamp.w - 4, 3);
  g.generateTexture('decor_lamp', d.lamp.w, d.lamp.h).clear();
  g.fillStyle(c.bin).fillRoundedRect(1, 5, d.bin.w - 2, d.bin.h - 5, 3);
  g.fillStyle(c.binDark).fillRect(0, 2, d.bin.w, 5).fillRect(4, 12, 2, d.bin.h - 16).fillRect(d.bin.w - 6, 12, 2, d.bin.h - 16);
  g.generateTexture('decor_bin', d.bin.w, d.bin.h).clear();
  g.fillStyle(c.metalDark).fillRect(4, d.bench.h - 8, 3, 8).fillRect(d.bench.w - 7, d.bench.h - 8, 3, 8);
  g.fillStyle(c.wood).fillRect(0, d.bench.h - 12, d.bench.w, 5).fillRect(2, 0, d.bench.w - 4, 4).fillRect(2, 6, d.bench.w - 4, 4);
  g.generateTexture('decor_bench', d.bench.w, d.bench.h).clear();
  g.fillStyle(c.metal).fillRect(d.sign.w / 2 - 1.5, d.sign.w, 3, d.sign.h - d.sign.w);
  g.fillStyle(c.signBlue).fillRect(0, 0, d.sign.w, d.sign.w);
  g.fillStyle(0xffffff).fillTriangle(d.sign.w / 2, 3, 3, d.sign.w - 3, d.sign.w - 3, d.sign.w - 3);
  g.fillStyle(0x000000).fillCircle(d.sign.w / 2, d.sign.w * 0.62, 2);
  g.generateTexture('decor_sign', d.sign.w, d.sign.h).clear();
  // Traffic light: a pole and a box with three lamps, one lit.
  const L = d.light;
  for (const [key, lit] of [['light_r', 0], ['light_y', 1], ['light_g', 2]]) {
    g.fillStyle(c.metalDark).fillRect(L.w / 2 - 2, L.box, 4, L.h - L.box);
    g.fillStyle(c.lightBox).fillRoundedRect(0, 0, L.w, L.box, 3);
    m.light.colors.forEach((color, i) => g.fillStyle(color, i === lit ? 1 : 0.2).fillCircle(L.w / 2, L.box * (0.18 + i * 0.32), L.w * 0.3));
    g.generateTexture(key, L.w, L.h).clear();
  }
  // Vehicles from above, front to the right. A car is drawn light, so a tint gives its colour.
  const car = d.car;
  g.fillStyle(0x000000, 0.3).fillRoundedRect(3, 3, car.w - 3, car.h - 3, 6);
  g.fillStyle(0xffffff).fillRoundedRect(0, 0, car.w - 3, car.h - 3, 6);
  g.fillStyle(c.glass).fillRect(car.w * 0.55, 4, car.w * 0.16, car.h - 11).fillRect(car.w * 0.16, 5, car.w * 0.1, car.h - 13);
  g.fillStyle(c.windowLit).fillRect(car.w - 6, 3, 3, 5).fillRect(car.w - 6, car.h - 11, 3, 5);
  g.generateTexture('decor_car', car.w, car.h).clear();
  const bus = d.bus; // ZTM: yellow with a red band, roof vents
  g.fillStyle(0x000000, 0.3).fillRoundedRect(4, 4, bus.w - 4, bus.h - 4, 6);
  g.fillStyle(c.busYellow).fillRoundedRect(0, 0, bus.w - 4, bus.h - 4, 6);
  g.fillStyle(c.busRed).fillRect(0, 0, bus.w - 4, 6).fillRect(0, bus.h - 10, bus.w - 4, 6);
  g.fillStyle(c.glass).fillRect(bus.w - 18, 6, 10, bus.h - 16);
  for (let i = 0; i < 3; i++) g.fillStyle(c.metal).fillRect(20 + i * 40, bus.h / 2 - 8, 22, 12);
  g.generateTexture('decor_bus', bus.w, bus.h).clear();

  g.fillStyle(0x000000).fillEllipse(32, 10, 64, 20);
  g.generateTexture('shadow', 64, 20).clear();

  // Boss skull: a big bone-white skull, dark sockets with red eyes, a nose and teeth.
  const sk = config.skulls, s = sk.size, sh = s * 1.05;
  g.fillStyle(sk.boneShade).fillCircle(s / 2, s * 0.44, s * 0.44).fillRoundedRect(s * 0.24, s * 0.6, s * 0.52, s * 0.42, s * 0.08);
  g.fillStyle(sk.bone).fillCircle(s / 2, s * 0.42, s * 0.4).fillRoundedRect(s * 0.27, s * 0.6, s * 0.46, s * 0.38, s * 0.07);
  g.fillStyle(sk.socket).fillEllipse(s * 0.34, s * 0.5, s * 0.22, s * 0.24).fillEllipse(s * 0.66, s * 0.5, s * 0.22, s * 0.24);
  g.fillStyle(sk.eyeGlow).fillCircle(s * 0.34, s * 0.52, s * 0.05).fillCircle(s * 0.66, s * 0.52, s * 0.05);
  g.fillStyle(sk.socket).fillTriangle(s / 2, s * 0.62, s * 0.45, s * 0.74, s * 0.55, s * 0.74);
  for (let i = 0; i < 4; i++) g.fillRect(s * (0.34 + i * 0.1), s * 0.82, s * 0.03, s * 0.14);
  g.generateTexture('boss_skull', s, sh).clear();

  // Klon Bartek tree: a brown trunk, a glowing cyan crown with a pink halo and white sparkles, unlike any park tree.
  const ct = config.cloneTrees, tw = ct.width, th = ct.height;
  g.fillStyle(ct.glow, 0.35).fillCircle(tw / 2, th * 0.38, tw * 0.48);
  g.fillStyle(ct.trunk).fillRect(tw * 0.42, th * 0.55, tw * 0.16, th * 0.45);
  g.fillStyle(ct.crownDark).fillCircle(tw * 0.32, th * 0.42, tw * 0.22).fillCircle(tw * 0.68, th * 0.42, tw * 0.22).fillCircle(tw / 2, th * 0.26, tw * 0.26);
  g.fillStyle(ct.crown).fillCircle(tw * 0.34, th * 0.4, tw * 0.17).fillCircle(tw * 0.66, th * 0.4, tw * 0.17).fillCircle(tw / 2, th * 0.24, tw * 0.2);
  g.fillStyle(ct.sparkle);
  for (const [sx, sy] of [[0.3, 0.3], [0.62, 0.2], [0.72, 0.46], [0.44, 0.44], [0.5, 0.12]]) g.fillCircle(tw * sx, th * sy, tw * 0.03);
  g.generateTexture('clone_tree', tw, th).clear();
  g.destroy();
}

// The live map: call update(delta) every frame (also once at the start, before the first frame is drawn).
export function createMap(scene) {
  const m = config.map, B = m.block, R = m.road, S = m.sidewalk;
  const grounds = scene.add.group({ classType: Phaser.GameObjects.Image, maxSize: m.pool.blocks });
  const decor = scene.add.group({ classType: Phaser.GameObjects.Image, maxSize: m.pool.decor });
  const blocks = new Map(); // "bx,by" -> { ground, items, lights, walls, chest, skull, cloneTree }
  const map = maps.find((d) => d.id === scene.run.map) ?? maps[0];
  // Water on Fort Bema: invisible static zones, reused as blocks come and go; GameScene makes Bartek and walkers collide.
  const walls = scene.physics.add.staticGroup(), freeWalls = [];
  const addWall = (block, x, y, w, h) => {
    let z = freeWalls.pop();
    if (!z) {
      z = scene.add.zone(0, 0, w, h);
      walls.add(z);
    }
    z.setPosition(x + w / 2, y + h / 2).setSize(w, h);
    z.body.enable = true;
    z.body.updateFromGameObject();
    block.walls.push(z);
  };
  const wc = config.worldChests, freeLabels = []; // price labels over chests, reused
  const labelStyle = { fontFamily: config.ui.font, fontSize: `${wc.labelFontSize}px`, fontStyle: 'bold', stroke: '#000000', strokeThickness: 4 };
  const light = m.light, cycle = light.ms.reduce((a, b) => a + b, 0);
  let range = '', lightMs = 0, ambientMs = 0;

  const free = (img) => img.setActive(false).setVisible(false);

  function addBlock(bx, by) {
    const r = blockRandom(bx, by), kind = weighted(r, map.kinds), x0 = bx * B, y0 = by * B;
    const ground = grounds.get(x0, y0, `block_${kind.id}`);
    if (!ground) return;
    ground.setTexture(`block_${kind.id}`).setOrigin(0).setDepth(m.groundDepth).setActive(true).setVisible(true);
    const block = { ground, items: [], lights: [], walls: [] };
    const put = (key, x, y, { origin = [0.5, 1], angle = 0, tint = 0xffffff } = {}) => {
      const it = decor.get(x0 + x, y0 + y, key);
      if (!it) return null;
      it.setTexture(key).setPosition(x0 + x, y0 + y).setOrigin(...origin).setAngle(angle).setTint(tint).setScale(1)
        .setDepth(m.decorDepth).setActive(true).setVisible(true);
      block.items.push(it);
      return it;
    };
    // A traffic light on the corner by the crossing, its phase from the seed.
    const tl = map.streets && put('light_r', R + S * 0.5, R + S - 2);
    if (tl) {
      tl.phase = r() * cycle;
      block.lights.push(tl);
    }
    // Lamps along the top and left sidewalk.
    for (let p = R + m.lampEvery / 2; p < B - S; p += m.lampEvery) {
      put('decor_lamp', p, R + S - 4);
      put('decor_lamp', R + S * 0.5, p + m.decorSize.lamp.h);
    }
    // Bins, benches and signs here and there on the sidewalk ring.
    const n = Math.floor(between(r, m.smallDecor[0], m.smallDecor[1] + 1));
    for (let i = 0; i < n; i++) {
      const key = weighted(r, m.smallKinds).key, along = between(r, R + S + 30, B - S - 30), side = Math.floor(r() * 4);
      const [x, y] = [[along, R + S - 4], [along, B - 6], [R + S * 0.5, along], [B - S * 0.5, along]][side];
      put(key, x, y);
    }
    // Parked on the top road (along the curb) and on the left one (turned): cars, or now and then a ZTM bus.
    const curbGap = m.parkGap, carW = m.decorSize.car.w;
    for (const vertical of map.streets ? [false, true] : []) {
      if (r() < m.busChance) {
        const p = between(r, R + 150, B - 150), off = R - m.decorSize.bus.h / 2 - curbGap;
        put('decor_bus', vertical ? off : p, vertical ? p : off, { origin: [0.5, 0.5], angle: vertical ? 90 : 0 });
        continue;
      }
      for (let p = R + m.zebra.inset * 3 + m.zebra.length + carW; p < B - m.zebra.length - carW; p += carW + curbGap * 3) {
        if (r() >= m.carChance) continue;
        const off = R - m.decorSize.car.h / 2 - curbGap, tint = m.carColors[Math.floor(r() * m.carColors.length)];
        put('decor_car', vertical ? off : p, vertical ? p : off, { origin: [0.5, 0.5], angle: vertical ? 90 : 0, tint });
      }
    }
    // Maybe a locked chest on the sidewalk ring (GameScene.updateWorldChests opens it), from this run's seed.
    const key = `${bx},${by}`, cr = blockRandom(bx + scene.run.chestSeed, by - scene.run.chestSeed);
    const chestHere = cr() < wc.chance;
    if (chestHere && !scene.run.openedChests.has(key)) {
      const along = between(cr, R + S + 60, B - S - 60), side = Math.floor(cr() * 4);
      const [x, y] = [[along, R + S - 4], [along, B - 6], [R + S * 0.5, along], [B - S * 0.5, along]][side];
      const img = put('chest_locked', x, y);
      if (img) {
        const label = freeLabels.pop() ?? { icon: scene.add.image(0, 0, 'coin_b'), text: scene.add.text(0, 0, '', labelStyle).setOrigin(0, 0.5) };
        label.icon.setDisplaySize(wc.labelIconSize, wc.labelIconSize).setDepth(wc.labelDepth).setVisible(true);
        label.text.setDepth(wc.labelDepth).setVisible(true);
        const ly = y0 + y - wc.labelY, cx = x0 + x;
        block.chest = { key, img, label, x: cx, y: y0 + y - img.height / 2,
          setPrice(price, color) { // centred over the chest: the coin, then the number
            label.text.setText(price).setColor(color);
            const left = cx - (wc.labelIconSize + wc.labelGap + label.text.width) / 2;
            label.icon.setPosition(left + wc.labelIconSize / 2, ly);
            label.text.setPosition(left + wc.labelIconSize + wc.labelGap, ly);
          } };
      }
    }
    // Or, now and then, a boss skull on the sidewalk ring (GameScene.updateSkulls).
    const skullChance = config.debug.skullEverywhere ? 1 : config.skulls.chance;
    if (!chestHere && cr() < skullChance && !scene.run.usedSkulls.has(key)) {
      const along = between(cr, R + S + 60, B - S - 60), side = Math.floor(cr() * 4);
      const [x, y] = [[along, R + S - 4], [along, B - 6], [R + S * 0.5, along], [B - S * 0.5, along]][side];
      const img = put('boss_skull', x, y);
      if (img) block.skull = { key, img, x: x0 + x, y: y0 + y - img.height / 2 };
    }
    // Or a Klon Bartek tree (GameScene.updateCloneTrees).
    const treeChance = config.debug.cloneTreeEverywhere ? 1 : config.cloneTrees.chance;
    if (!chestHere && !block.skull && cr() < treeChance && !scene.run.usedCloneTrees.has(key)) {
      const along = between(cr, R + S + 60, B - S - 60), side = Math.floor(cr() * 4);
      const [x, y] = [[along, R + S - 4], [along, B - 6], [R + S * 0.5, along], [B - S * 0.5, along]][side];
      const img = put('clone_tree', x, y);
      if (img) block.cloneTree = { key, img, x: x0 + x, y: y0 + y - img.height / 2 };
    }
    if (kind.id === 'fort') for (const [x, y, w, h] of moatParts()) addWall(block, x0 + x, y0 + y, w, h);
    // A parking lot fills some of its spaces.
    if (kind.id === 'parking') {
      const ps = m.parkingSpots, in0 = R + S, inW = B - R - 2 * S;
      for (const top of [in0 + ps.edge, in0 + inW - ps.edge - ps.depth]) {
        for (let x = in0 + ps.edge; x + ps.width <= in0 + inW - ps.edge; x += ps.width) {
          if (r() >= ps.fill) continue;
          const tint = m.carColors[Math.floor(r() * m.carColors.length)];
          put('decor_car', x + ps.width / 2, top + ps.depth / 2, { origin: [0.5, 0.5], angle: r() < 0.5 ? 90 : -90, tint });
        }
      }
    }
    blocks.set(key, block);
  }

  function freeChest(block) {
    const { label } = block.chest;
    label.icon.setVisible(false);
    label.text.setVisible(false);
    freeLabels.push(label);
    block.chest = null;
  }

  function removeBlock(key) {
    const block = blocks.get(key);
    free(block.ground);
    block.items.forEach(free);
    for (const z of block.walls) {
      z.body.enable = false;
      freeWalls.push(z);
    }
    if (block.chest) freeChest(block);
    blocks.delete(key);
  }

  // The blocks within margin px of the screen around Bartek; only recounted when that range changes.
  function sync() {
    const p = scene.player, z = scene.cameras.main.zoom, hw = scene.scale.width / 2 / z + m.margin, hh = scene.scale.height / 2 / z + m.margin;
    const x0 = Math.floor((p.x - hw) / B), x1 = Math.floor((p.x + hw) / B), y0 = Math.floor((p.y - hh) / B), y1 = Math.floor((p.y + hh) / B);
    const now = `${x0},${x1},${y0},${y1}`;
    if (now === range) return;
    range = now;
    const need = new Set();
    for (let bx = x0; bx <= x1; bx++) for (let by = y0; by <= y1; by++) need.add(`${bx},${by}`);
    for (const key of [...blocks.keys()]) if (!need.has(key)) removeBlock(key);
    for (const key of need) if (!blocks.has(key)) addBlock(...key.split(',').map(Number));
  }

  return {
    update(delta) {
      sync();
      // Traffic lights: green, yellow, red for light.ms each, every one at its own point of the cycle.
      lightMs += delta;
      for (const block of blocks.values()) {
        for (const tl of block.lights) {
          const t = (lightMs + tl.phase) % cycle, key = t < light.ms[0] ? 'light_g' : t < light.ms[0] + light.ms[1] ? 'light_y' : 'light_r';
          if (tl.texture.key !== key) tl.setTexture(key);
        }
      }
      // A leaf now and then somewhere on screen.
      ambientMs += delta;
      for (; ambientMs >= m.ambient.everyMs; ambientMs -= m.ambient.everyMs) {
        const v = scene.cameras.main.worldView;
        playVfx(scene, 'ambientLeaf', v.x + Math.random() * v.width, v.y + Math.random() * v.height);
      }
    },
    blockCount: () => blocks.size,
    walls, // Fort Bema's water (static bodies)
    // The closed chests on the blocks around Bartek.
    *chests() { for (const block of blocks.values()) if (block.chest) yield block.chest; },
    // The unused boss skulls on the blocks around Bartek.
    *skulls() { for (const block of blocks.values()) if (block.skull) yield block.skull; },
    // The unused Klon Bartek trees on the blocks around Bartek.
    *cloneTrees() { for (const block of blocks.values()) if (block.cloneTree) yield block.cloneTree; },
    useCloneTree(tree) {
      scene.run.usedCloneTrees.add(tree.key);
      free(tree.img);
      blocks.get(tree.key).cloneTree = null;
    },
    useSkull(skull) {
      scene.run.usedSkulls.add(skull.key);
      free(skull.img);
      blocks.get(skull.key).skull = null;
    },
    openChest(chest) {
      scene.run.openedChests.add(chest.key);
      free(chest.img);
      freeChest(blocks.get(chest.key));
    },
  };
}
