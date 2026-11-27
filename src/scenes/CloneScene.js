import { config } from '../config.js';
import { items, giveItem, takeItem, itemRarity, cloneChoices } from '../data/items.js';
import { makeCard } from '../systems/cards.js';
import { font, button, keyHint, dim } from '../systems/ui.js';
import { playVfx } from '../systems/vfx.js';
import { playSfx } from '../systems/audio.js';

const KEY_NAMES = ['ONE', 'TWO', 'THREE'];

// The Klon Bartek tree (GameScene.updateCloneTrees) over the paused run: up to cards.length items that can be cloned
// (cloneChoices), one card each. A pick gives one more of it and takes away a random other item of the same rarity;
// the tree is then used up. "Nie teraz" (Esc) closes it and the tree stays.
export default class CloneScene extends Phaser.Scene {
  constructor() { super('CloneScene'); }

  init(data) {
    this.run = data.run;
    this.tree = data.tree;
    this.done = false;
  }

  create() {
    const u = config.ui, ct = config.cloneTrees, { width, height } = this.scale;
    dim(this);
    this.add.text(width / 2, ct.titleY, 'KLON BARTEK', font(ct.titleFontSize, { fontStyle: 'bold', color: ct.titleColor, stroke: '#000000', strokeThickness: 8 }))
      .setOrigin(0.5);
    this.add.text(width / 2, ct.titleY + ct.titleFontSize, 'Wybierz przedmiot do sklonowania.\nDrzewo zabierze losowy inny przedmiot tej samej rzadkości.',
      font(ct.textFontSize, { align: 'center', color: '#ffe082', stroke: '#000000', strokeThickness: 4, wordWrap: { width: width - 2 * u.margin } })).setOrigin(0.5, 0);

    const choices = Phaser.Utils.Array.Shuffle(cloneChoices(this.run)).slice(0, ct.cards);
    choices.forEach((it, i) => {
      makeCard(this, i, choices.length, () => this.clone(it)).fill(it, itemRarity(it), keyHint(`Masz x${this.run.items[it.id]} `, `[${i + 1}]`));
      this.input.keyboard.on(`keydown-${KEY_NAMES[i]}`, () => this.clone(it));
    });
    button(this, width / 2, height - ct.buttonBottom, keyHint('Nie teraz', '[Esc]'), () => this.close(), { variant: 'secondary' });
    this.input.keyboard.on('keydown-ESC', () => this.close());
  }

  clone(it) {
    if (this.done) return;
    const gs = this.scene.get('GameScene'), rarity = it.rarity ?? 'common';
    const others = Object.keys(this.run.items).map((id) => items.find((x) => x.id === id))
      .filter((x) => x.id !== it.id && (x.rarity ?? 'common') === rarity);
    const lost = Phaser.Utils.Array.GetRandom(others);
    takeItem(this.run, lost);
    giveItem(this.run, it);
    gs.map.useCloneTree(this.tree);
    playVfx(gs, 'smokePuff', this.tree.x, this.tree.y);
    playSfx(this, 'pickup');
    this.scene.get('UIScene').showBanner('KLON BARTEK', `+1 ${it.name}, drzewo zabrało: ${lost.name}`);
    this.close();
  }

  close() {
    if (this.done) return;
    this.done = true;
    this.scene.stop();
    this.scene.resume('GameScene');
  }
}
