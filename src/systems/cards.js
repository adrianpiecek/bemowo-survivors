import { config } from '../config.js';
import { upgrades, overflowUpgrades } from '../data/upgrades.js';
import { weapons } from '../data/weapons.js';
import { passives } from '../data/passives.js';
import { save } from '../state.js';
import { font, drawPanel } from './ui.js';

// Upgrade cards, shared by the level-up screen and the boss chest.

// A rarity tier from config.rarity for this card, drawn by weight; the weights of rarer tiers grow with the level
// and with luck (Koniczyna z trawnika). Cards with `rarity: false` get none (null).
export function rollRarity(up, run) {
  if (up.rarity === false) return null;
  const tiers = config.rarity, forced = tiers.find((t) => t.id === config.debug.forceRarity);
  if (forced) return forced;
  if (run.commonOnly) return tiers[0]; // plan Trening z Unc
  const weight = (t, i) => (t.weight + t.perLevel * (run.level - 1)) * (i > 0 ? run.player.luck : 1);
  let roll = Math.random() * tiers.reduce((sum, t, i) => sum + weight(t, i), 0);
  return tiers.find((t, i) => (roll -= weight(t, i)) < 0) ?? tiers[0];
}

const isUnlocked = (def) => !def.unlock || save.unlocks.includes(def.id);

// "Ewolucja: Broń 3/5 + Pasywka (brak)" under a weapon card and under the card of a passive some weapon evolves with,
// so the player sees what is still missing; nothing once that weapon has evolved this run.
function evolutionHint(run, weapon) {
  const evo = weapon?.evolution;
  if (!evo || run.weapons.some((w) => w.def === weapon && w.evolved)) return undefined;
  const w = run.weapons.find((it) => it.def === weapon), passive = passives.find((d) => d.id === evo.passive);
  const has = run.passives.some((p) => p.def === passive);
  return `Ewolucja: ${weapon.name} ${w ? `${w.level}/${weapon.maxLevel}` : '(brak)'} + ${passive.name} ${has ? '(masz)' : '(brak)'}`;
}

// A carried weapon at its max level with its evolution passive in a slot, not evolved yet: the next chest evolves it.
export function evolutionReady(run, w) {
  const evo = w.def.evolution;
  return !!evo && !w.evolved && w.level >= w.def.maxLevel && run.passives.some((p) => p.def.id === evo.passive);
}
const passiveHint = (run, def) => evolutionHint(run, weapons.find((w) => w.evolution?.passive === def.id));

// A chest's evolution card: the first carried weapon ready to evolve (evolutionReady).
// Not in the level-up pool; ChestScene puts it first, one per chest of any kind.
export function evolutionCard(run) {
  const w = run.weapons.find((it) => evolutionReady(run, it));
  if (!w) return null;
  const evo = w.def.evolution;
  return {
    id: `evolution_${evo.id}`, name: evo.name, icon: evo.icon, description: evo.description, maxStack: Infinity, rarity: false, evolution: true,
    levelText: `${w.def.name} → EWOLUCJA`,
    apply(player, scene) { scene.evolveWeapon(w); },
  };
}

// Weapon cards for this draw: the next level of each weapon Bartek carries, and every unlocked weapon he does not
// have while a slot is free. levelText replaces the stack counter on the card. A new weapon has no numbers to multiply.
function weaponCards(run) {
  const cards = [];
  for (const w of run.weapons) {
    if (w.level >= w.def.maxLevel) continue;
    const level = w.level + 1;
    cards.push({
      id: `weapon_${w.def.id}`, name: w.def.name, icon: w.def.icon, weight: w.def.weight ?? config.weapons.cardWeight, maxStack: Infinity, levelText: `Poziom ${w.level} → ${level}`,
      hint: evolutionHint(run, w.def),
      description: (m) => w.def.description(level, m),
      apply(player, scene, m) { scene.levelUpWeapon(w, m); },
    });
  }
  if (run.weapons.length >= run.player.weaponSlots) return cards;
  for (const def of weapons) {
    if (run.weapons.some((w) => w.def === def) || !isUnlocked(def)) continue;
    cards.push({
      id: `weapon_${def.id}`, name: def.name, icon: def.icon, weight: def.weight ?? config.weapons.cardWeight, maxStack: Infinity, levelText: 'NOWA BROŃ', rarity: false,
      hint: evolutionHint(run, def),
      description: def.description(1, 1),
      apply(player, scene) { scene.addWeapon(def); },
    });
  }
  return cards;
}

// Passive cards for this draw, with a rarity: the next level of each passive Bartek carries, and every unlocked passive
// he does not have while a passive slot is free.
export function passiveCards(run) {
  const card = (def, level, levelText) => ({
    id: `passive_${def.id}`, name: def.name, icon: def.icon, weight: def.weight, maxStack: Infinity, levelText, hint: passiveHint(run, def),
    description: (m) => def.description(level, m),
    apply(player, scene, m) { scene.gainPassive(def, m); },
  });
  const cards = run.passives.filter((p) => p.level < p.def.maxLevel).map((p) => card(p.def, p.level + 1, `Poziom ${p.level} → ${p.level + 1}`));
  if (run.passives.length >= run.player.passiveSlots) return cards;
  for (const def of passives) {
    if (!run.passives.some((p) => p.def === def) && isUnlocked(def)) cards.push(card(def, 1, 'NOWA PASYWKA'));
  }
  return cards;
}

// Up to `count` different cards (upgrades still under their maxStack, weapon and passive cards), drawn by weight
// (default 1). Banished cards (Wywal) and the ids in `exclude` (cards already on screen) are left out. May return fewer.
export function drawUpgrades(run, count, exclude = []) {
  const pool = [...upgrades.filter((up) => (run.upgrades[up.id] ?? 0) < up.maxStack), ...weaponCards(run), ...passiveCards(run)]
    .filter((up) => !run.banished.includes(up.id) && !exclude.includes(up.id));
  const weight = (up) => up.weight ?? 1;
  const picked = [];
  while (picked.length < count && pool.length) {
    let roll = Math.random() * pool.reduce((sum, up) => sum + weight(up), 0);
    const i = pool.findIndex((up) => (roll -= weight(up)) < 0);
    picked.push(pool.splice(i < 0 ? pool.length - 1 : i, 1)[0]);
  }
  // Short of cards (everything at its max): the small no-limit cards fill in, the heal among them.
  const extra = Phaser.Utils.Array.Shuffle(overflowUpgrades.filter((up) => !run.banished.includes(up.id) && !exclude.includes(up.id)));
  while (picked.length < count && extra.length) picked.push(extra.pop());
  return picked;
}

export function describe(up, rarity) {
  return typeof up.description === 'function' ? up.description(rarity?.mult ?? 1) : up.description;
}

// `scene` is GameScene; most upgrades only need the player.
export function applyUpgrade(run, scene, up, rarity) {
  up.apply(run.player, scene, rarity?.mult ?? 1);
  run.upgrades[up.id] = (run.upgrades[up.id] ?? 0) + 1;
  run.ddaGraceMs = config.dda.graceSec * 1000; // the hidden pressure lets the new power be felt first
}

// Card i of n on the level up, chest and shop screens: a container in the card's place holding a panel, the rarity's name
// over it, the icon, the name, the description, the evolution hint (up.hint) and a foot line, plus "NOWA" on the corner
// of a new weapon or passive. It slides in from below. fill(up, rarity, foot) shows a card (the chest shows only a
// spinning name first); highlight(color) frames it in that colour (Wywal), highlight(null) back to its own frame.
// onClick: a click on the card. Positions are from the card's middle.
export function makeCard(scene, i, n, onClick) {
  const u = config.ui, c = u.card, m = u.margin, w = c.width, h = c.height, top = -h / 2, { x, y } = cardCenter(scene, i, n);
  const g = scene.add.graphics(), box = scene.add.container(x, y, [g]).setSize(w, h);
  // Portrait: the icon on the left, the text in the room right of it. Side by side: the icon under the name.
  const tx = c.row ? 0 : (c.iconSize + m) / 2, wrap = { align: 'center', wordWrap: { width: c.row ? w - 2 * m : w - c.iconSize - 3 * m } };
  const text = (size, extra = {}) => scene.add.text(tx, 0, '', font(size, { ...wrap, ...extra }));
  box.name = text(c.nameFontSize, { fontStyle: 'bold' }).setOrigin(0.5, 0).setY(top + m);
  box.desc = text(c.textFontSize).setOrigin(0.5);
  box.hint = text(c.hintFontSize, { color: c.hintColor }).setOrigin(0.5, 1);
  box.foot = text(u.hudFontSize, { fontStyle: 'bold' }).setOrigin(0.5, 1).setY(-top - m);
  box.icon = scene.add.image(0, 0, '__WHITE').setVisible(false);
  box.label = scene.add.text(0, top - m / 2, '', font(c.rarityFontSize, { fontStyle: 'bold' })).setOrigin(0.5, 1);
  box.badge = scene.add.text(w / 2 - m, top, 'NOWA', font(c.badgeFontSize, { fontStyle: 'bold', color: '#1b1b1b', backgroundColor: c.badgeColor, padding: { x: 8, y: 3 } }))
    .setOrigin(0.5).setAngle(c.badgeAngle).setVisible(false);
  box.add([box.icon, box.name, box.desc, box.hint, box.foot, box.label, box.badge]);
  let frame = null; // { color, width } of its rarity or evolution
  const draw = (f) => {
    g.clear();
    drawPanel(g, -w / 2, -h / 2, w, h, { color: c.color, alpha: c.alpha, ...(f && { borderColor: f.color, borderWidth: f.width, borderAlpha: 1 }) });
  };
  draw(null);
  box.highlight = (color) => draw(color == null ? frame : { color, width: c.rarityBorderWidth });
  box.fill = (up, rarity, foot = '') => {
    const f = up.evolution ? { color: c.evolutionColor, name: up.levelText } : rarity;
    frame = f && { color: f.color, width: c.rarityBorderWidth };
    draw(frame);
    box.label.setText(f ? f.name.toUpperCase() : '').setColor(f ? rarityHex(f) : '#ffffff');
    box.name.setText(up.name);
    box.foot.setText(foot);
    box.badge.setVisible(/^NOWA/.test(up.levelText ?? ''));
    let upper = box.name.y + box.name.height;
    box.icon.setVisible(!!up.icon);
    if (up.icon) {
      box.icon.setTexture(up.icon);
      box.icon.setScale(c.iconSize / Math.max(box.icon.width, box.icon.height)); // fits any picture 
      if (c.row) {
        box.icon.setPosition(0, upper + m / 2 + c.iconSize / 2);
        upper += m / 2 + c.iconSize;
      } else box.icon.setPosition(-w / 2 + m + c.iconSize / 2, 0);
    }
    box.hint.setText(up.hint ?? '').setY(foot ? box.foot.y - box.foot.height : -top - m);
    const lower = up.hint ? box.hint.y - box.hint.height : foot ? box.foot.y - box.foot.height : -top - m;
    box.desc.setText(describe(up, rarity)).setY((upper + lower) / 2);
    return box;
  };
  if (onClick) box.setInteractive({ useHandCursor: true }).on('pointerdown', onClick);
  box.setY(y + scene.scale.height / 2).setAlpha(0);
  scene.tweens.add({ targets: box, y, alpha: 1, duration: c.slideMs, delay: i * c.slideGapMs, ease: 'Back.easeOut' });
  return box;
}

// Middle of card i of n on the level up and chest screens: side by side in landscape (card.row), stacked in portrait.
export function cardCenter(scene, i, n) {
  const c = config.ui.card, { width, height } = scene.scale, off = i - (n - 1) / 2;
  return c.row ? { x: width / 2 + off * (c.width + c.gap), y: height / 2 } : { x: width / 2, y: height / 2 + off * (c.height + c.gap) };
}

export const rarityHex = (rarity) => `#${rarity.color.toString(16).padStart(6, '0')}`;
