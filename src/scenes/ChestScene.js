import { config } from '../config.js';
import { touch, dim } from '../systems/ui.js';
import { upgrades, fallbackUpgrade } from '../data/upgrades.js';
import { weapons } from '../data/weapons.js';
import { passives } from '../data/passives.js';
import { rollRarity, drawUpgrades, applyUpgrade, evolutionCard, makeCard } from '../systems/cards.js';
import { playVfx } from '../systems/vfx.js';
import { playSfx } from '../systems/audio.js';
import { items, giveItem, drawItem, itemRarity } from '../data/items.js';

// Any chest (boss, elite, event, the map) over the paused GameScene: `count` cards spin through upgrade names and stop one by one.
// Each card's upgrade (with a rolled rarity) is applied the moment it stops. Once all stop, Space, Enter or a click closes it.
export default class ChestScene extends Phaser.Scene {
  constructor() { super('ChestScene'); }

  init(data) {
    this.run = data.run;
    this.count = data.count;
    this.items = data.items ?? false; // true: an item chest (elites, the map), random items in place of cards
    this.closing = false;
    this.run.chestsTotal++; // Paragon z Żabki
  }

  create() {
    const u = config.ui, c = u.card, ch = u.chest;
    const { width, height } = this.scale;
    dim(this);
    this.add.text(width / 2, ch.titleY, 'SKRZYNIA', {
      fontFamily: config.ui.font, fontSize: `${ch.titleFontSize}px`, fontStyle: 'bold', color: ch.titleColor, stroke: '#000000', strokeThickness: ch.strokeThickness,
    }).setOrigin(0.5);

    // An evolution ready (weapon at max level + its passive) takes the first card of any chest; one per chest, the rest as usual.
    const evo = evolutionCard(this.run), rest = this.count - (evo ? 1 : 0);
    const prizes = [...(evo ? [evo] : []),
      ...(this.items ? Array.from({ length: rest }, () => drawItem(this.run)) : drawUpgrades(this.run, rest))];
    while (prizes.length < this.count) prizes.push(fallbackUpgrade); // everything maxed: the heal fills in
    // The spin shows every name there is: upgrades, weapons, passives; or the items.
    const names = (this.items ? items : [...upgrades, ...weapons, ...passives]).map((d) => d.name), n = prizes.length, gs = this.scene.get('GameScene');
    let stopped = 0;

    prizes.forEach((up, i) => {
      const card = makeCard(this, i, n); // laid out as on level up
      const spin = this.time.addEvent({ delay: ch.spinStepMs, loop: true, callback: () => card.name.setText(Phaser.Utils.Array.GetRandom(names)) });

      this.time.delayedCall(ch.spinMs + i * ch.stopGapMs, () => {
        spin.remove();
        const asItem = this.items && !up.evolution;
        const rarity = asItem ? itemRarity(up) : rollRarity(up, this.run);
        if (asItem) {
          giveItem(this.run, up);
          if (up.vfx) playVfx(gs, up.vfx, gs.player.x, gs.player.y); // plays once the run resumes
        }
        else applyUpgrade(this.run, gs, up, rarity);
        card.fill(up, rarity); // an evolution gets a gold frame and its own label in place of a rarity
        if (up.evolution || rarity?.id === 'legendary') playVfx(this, 'starBurst', card.x, card.y - c.height / 2);
        this.tweens.add({ targets: card, scale: ch.popScale, duration: ch.popMs, yoyo: true });
        playSfx(this, 'pickup');
        if (++stopped === n) this.allowClose();
      });
    });
  }

  allowClose() {
    const { width, height } = this.scale, ch = config.ui.chest;
    this.add.text(width / 2, height - ch.promptBottom, touch ? 'Dotknij, by przejść dalej' : 'Dalej [Spacja]', { fontFamily: config.ui.font, fontSize: `${config.ui.hudFontSize}px` }).setOrigin(0.5);
    const close = () => {
      if (this.closing) return; // a click and a key press can land in the same frame
      this.closing = true;
      this.scene.stop();
      this.scene.resume('GameScene');
    };
    this.input.keyboard.once('keydown-SPACE', close);
    this.input.keyboard.once('keydown-ENTER', close);
    this.input.once('pointerdown', close);
  }
}
