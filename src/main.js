import { config } from './config.js';
import BootScene from './scenes/BootScene.js';
import GameScene from './scenes/GameScene.js';
import UIScene from './scenes/UIScene.js';
import LevelUpScene from './scenes/LevelUpScene.js';
import GameOverScene from './scenes/GameOverScene.js';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  width: config.game.width,
  height: config.game.height,
  backgroundColor: config.game.background,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: { default: 'arcade', arcade: { debug: false } },
  scene: [BootScene, GameScene, UIScene, LevelUpScene, GameOverScene],
});

// Phones in portrait see the "rotate" overlay (index.html), so the game waits underneath instead of playing blind.
const portrait = matchMedia('(orientation: portrait) and (pointer: coarse)');
const syncPause = () => (portrait.matches ? game.pause() : game.resume());
portrait.addEventListener('change', syncPause);
game.events.once(Phaser.Core.Events.READY, syncPause);

// Android: the first touch goes full screen and locks landscape. iPhone Safari has neither API, so this is skipped there.
addEventListener('pointerdown', function goFullscreen(e) {
  if (e.pointerType !== 'touch') return;
  removeEventListener('pointerdown', goFullscreen);
  document.documentElement.requestFullscreen?.()
    .then(() => screen.orientation?.lock?.('landscape'))
    .catch(() => {}); // refused or unsupported: keep playing as is
});
