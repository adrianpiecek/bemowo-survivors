import { config } from '../config.js';

// The "Ogłoszenie z OLX" pickup: an ad card with a pigeon photo, then a flock that clears the screen.
// Rule: the big red slogan is only ever drawn on this card, right under the pigeon photo.

// Pauses GameScene and shows the ad on the UIScene layer, whose clock keeps running. Calls onDone after cardMs.
export function showOlxAd(scene, onDone) {
  const ui = scene.scene.get('UIScene');
  const c = config.ui.olxCard, o = config.pickups.olx;
  const { width, height } = ui.scale;
  scene.scene.pause();

  const top = -c.height / 2, bottom = c.height / 2;
  const bg = ui.add.graphics().fillStyle(0xffffff).fillRoundedRect(-c.width / 2, top, c.width, c.height, c.padding / 2);

  const hasPhoto = ui.textures.exists('golab');
  const photo = ui.add.image(0, top + c.padding, hasPhoto ? 'golab' : 'pigeon1').setOrigin(0.5, 0);
  photo.setScale(c.photoSize / Math.max(photo.width, photo.height)); // fit the square, keep the aspect ratio

  let y = top + c.padding + c.photoSize + c.padding / 2;
  const line = (text, size, style = {}) => {
    const t = ui.add.text(0, y, text, { fontFamily: 'Arial', fontSize: `${size}px`, color: '#222222', ...style }).setOrigin(0.5, 0);
    y += t.height;
    return t;
  };
  const title = line('Gołębie', c.titleFontSize, { fontStyle: 'bold' });
  const place = line('Warszawa, Bemowo', c.textFontSize, { color: '#777777' });
  const price = line('Do negocjacji', c.textFontSize, { fontStyle: 'bold' });
  const slogan = ui.add.text(0, bottom - c.padding, 'LIKWIDACJA RASY', {
    fontFamily: 'Arial', fontSize: `${c.bigFontSize}px`, fontStyle: 'bold', color: '#d01818',
  }).setOrigin(0.5, 1);

  const card = ui.add.container(width / 2, height / 2, [bg, photo, title, place, price, slogan]).setDepth(2);

  ui.time.delayedCall(o.cardMs, () => {
    card.destroy();
    // shortcut: a level-up opened in the same frame owns the resume; the card can then sit over the level-up cards.
    if (!scene.scene.isActive('LevelUpScene')) scene.scene.resume();
    onDone();
  });
}

// 10-15 pigeons cross the screen with a slight wave; enemies on screen die as the flock passes the middle.
export function pigeonStrike(scene) {
  const ui = scene.scene.get('UIScene');
  const o = config.pickups.olx, tex = config.textures.pigeon;
  const { width, height } = ui.scale;
  const count = Phaser.Math.Between(o.flockMin, o.flockMax), lane = (height - tex.height * 2) / count;
  const cam = scene.cameras.main, flock = scene.time.now; // marks the boss hit by this flock, so it loses HP once

  for (let i = 0; i < count; i++) {
    const baseY = tex.height + lane * (i + 0.5 + Phaser.Math.FloatBetween(-o.laneJitter, o.laneJitter));
    const phase = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const bird = ui.add.sprite(-tex.width, baseY, 'pigeon1').setScale(tex.scale).setFlipX(tex.flipX).setDepth(2).play('pigeonFly');
    ui.tweens.addCounter({
      from: 0,
      to: 1,
      duration: o.flyMs,
      delay: Phaser.Math.Between(0, o.flockSpreadMs),
      onUpdate: (tw) => {
        const p = tw.getValue();
        bird.setPosition(
          Phaser.Math.Linear(-tex.width, width + tex.width, p),
          baseY + Math.sin(phase + p * o.waveCycles * Math.PI * 2) * o.waveAmp,
        );
        // Enemies under the bird: compared on screen, the world view scaled to the UI's size.
        const view = cam.worldView, sx = width / view.width, sy = height / view.height;
        for (const z of scene.enemies.getChildren()) {
          if (z.active && Phaser.Math.Distance.Between((z.x - view.x) * sx, (z.y - view.y) * sy, bird.x, bird.y) <= o.hitRadius) scene.pigeonHit(z, flock);
        }
      },
      onComplete: () => bird.destroy(),
    });
  }

  // The flock gone: whoever is still on screen falls too (bosses already hit keep their HP).
  scene.time.delayedCall(o.flockSpreadMs + o.flyMs, () => {
    const view = cam.worldView;
    for (const z of scene.enemies.getChildren()) if (z.active && view.contains(z.x, z.y)) scene.pigeonHit(z, flock);
  });
}
