import { config } from './config.js';
import { toggleMute } from './systems/audio.js';
import { applyLayout } from './systems/layout.js';
import TitleScene from './scenes/TitleScene.js';
import BootScene from './scenes/BootScene.js';
import GameScene from './scenes/GameScene.js';
import UIScene from './scenes/UIScene.js';
import LevelUpScene from './scenes/LevelUpScene.js';
import ChestScene from './scenes/ChestScene.js';
import GameOverScene from './scenes/GameOverScene.js';
import GymScene from './scenes/GymScene.js';
import SettingsScene from './scenes/SettingsScene.js';
import PlanScene from './scenes/PlanScene.js';
import ShopScene from './scenes/ShopScene.js';
import BetsScene from './scenes/BetsScene.js';
import ChallengesScene from './scenes/ChallengesScene.js';
import InventoryScene from './scenes/InventoryScene.js';
import StatsScene from './scenes/StatsScene.js';
import BestiaryScene from './scenes/BestiaryScene.js';

applyLayout(); // portrait or landscape from the save, before the game size is read
const game = new Phaser.Game({
  type: Phaser.AUTO,
  width: config.game.width,
  height: config.game.height,
  backgroundColor: config.game.background,
  scale: { parent: 'game', mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: { default: 'arcade', arcade: { debug: false } },
  scene: [BootScene, TitleScene, GameScene, UIScene, LevelUpScene, ChestScene, ShopScene, GameOverScene, GymScene, BetsScene, ChallengesScene, StatsScene, BestiaryScene, PlanScene, InventoryScene, SettingsScene], // SettingsScene last: drawn over the rest
});

// iPhone: Safari mutes web audio while the ring/silent switch is on silent; 'playback' plays it like a video does
// (Safari 16.4+). Elsewhere navigator.audioSession does not exist.
try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch { /* older Safari: as before */ }
// iPhone suspends the audio when the tab goes to the background or a call comes in; the next touch wakes it up.
addEventListener('pointerdown', () => {
  const ctx = game.sound.context;
  if (ctx && ctx.state !== 'running') ctx.resume().catch(() => {});
});

// M mutes and unmutes in every scene; the choice is kept in the save.
addEventListener('keydown', (e) => {
  if (e.code === 'KeyM' && !e.repeat) toggleMute(game);
});

// Portrait or landscape as chosen in the settings; Scale.FIT puts black bars where the window has another shape, no rotation is forced.
// Android: the first touch goes full screen. iPhone Safari has no full screen API, so this is skipped there.
addEventListener('pointerdown', function goFullscreen(e) {
  if (e.pointerType !== 'touch') return;
  removeEventListener('pointerdown', goFullscreen);
  document.documentElement.requestFullscreen?.().catch(() => {}); // refused: keep playing as is
});
