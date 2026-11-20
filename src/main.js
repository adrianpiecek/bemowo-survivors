import { config } from './config.js';
import { toggleMute } from './systems/audio.js';
import TitleScene from './scenes/TitleScene.js';
import BootScene from './scenes/BootScene.js';
import GameScene from './scenes/GameScene.js';
import UIScene from './scenes/UIScene.js';
import LevelUpScene from './scenes/LevelUpScene.js';
import GameOverScene from './scenes/GameOverScene.js';
import GymScene from './scenes/GymScene.js';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  width: config.game.width,
  height: config.game.height,
  backgroundColor: config.game.background,
  scale: { parent: 'game', mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: { default: 'arcade', arcade: { debug: false } },
  scene: [BootScene, TitleScene, GameScene, UIScene, LevelUpScene, GameOverScene, GymScene],
});

// M mutes and unmutes in every scene; the choice is kept in the save.
addEventListener('keydown', (e) => {
  if (e.code === 'KeyM' && !e.repeat) toggleMute(game);
});

// In portrait Scale.FIT letterboxes the game with black bars above and below, so no rotation is forced.
// Android: the first touch goes full screen. iPhone Safari has no full screen API, so this is skipped there.
addEventListener('pointerdown', function goFullscreen(e) {
  if (e.pointerType !== 'touch') return;
  removeEventListener('pointerdown', goFullscreen);
  document.documentElement.requestFullscreen?.().catch(() => {}); // refused: keep playing as is
});
